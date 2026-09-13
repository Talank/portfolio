/* Speech Lab — turning measurements into instructions.
 *
 * Two rules this file exists to enforce.
 *
 * One: every number shown to the user is one that was actually measured, and
 * the check it feeds is named. There is a score, because a drill loop needs a
 * pass line, but it is a weighted sum of four visible checks rather than an
 * opaque percentage — if it says 72 you can see which check cost the 28.
 *
 * Two: no finding is allowed to say "pronounce it correctly". Every one ends
 * in something to do with the lips, tongue, or timing, because the failures
 * this app targets are articulatory habits carried over from Nepali and a
 * habit only moves when you are told what to move.
 */

import { TRAPS, syllablesOf } from '../data/deck.js';

const ENGLISH_NPVI_LO = 50;   // below this the rhythm is reading as syllable-timed
const ENGLISH_NPVI_HI = 80;

/* Orthographic substitution detectors. Given what was said and what the
 * recogniser heard, guess which trap fired. Crude by construction — these are
 * spellings, not phones — so they are only ever used to *rank* an explanation
 * the item already listed as one of its traps, never to invent a new one. */
const SUBS = [
  {
    trap: 's_cluster',
    test: (t, h) => /^s[ptkmn]/.test(t) && /^(i|e|is |es |a )/.test(h),
    say: (t, h) => `It came back as “${h}”. A vowel opened the word — that is the inserted /ɪ/.`,
  },
  {
    trap: 'th_voiceless',
    test: (t, h) => t.startsWith('th') && /^[tdsf]/.test(h),
    say: (t, h) => `It heard “${h}”. Your /θ/ closed into a stop or slid to /s/.`,
  },
  {
    trap: 'th_voiced',
    test: (t, h) => /th/.test(t) && /(d|z|v)/.test(h) && !/th/.test(h),
    say: (t, h) => `It heard “${h}”. The /ð/ hardened into a D.`,
  },
  {
    trap: 'v_f',
    test: (t, h) => /v/.test(t) && /^[bw]/.test(h),
    say: (t, h) => `It heard “${h}”. Your /v/ was made with two lips instead of lip-and-teeth.`,
  },
  {
    trap: 'w_v',
    test: (t, h) => /^w/.test(t) && /^v/.test(h),
    say: (t, h) => `It heard “${h}”. Your /w/ picked up teeth and became a /v/.`,
  },
  {
    trap: 'sh_s',
    test: (t, h) => /sh/.test(t) && /s/.test(h) && !/sh/.test(h),
    say: (t, h) => `It heard “${h}”. The /ʃ/ flattened to /s/ — exactly the shoes/sues collapse.`,
  },
  {
    trap: 'z_s',
    test: (t, h) => /z|s$/.test(t) && /s$/.test(h) && /z$/.test(t),
    say: (t, h) => `It heard “${h}”. The final /z/ lost its voice and became /s/.`,
  },
];

function pushFinding(list, trapId, headline, severity) {
  const t = TRAPS[trapId];
  if (!t) return;
  if (list.some((f) => f.trap === trapId)) return;   // one finding per trap
  list.push({ trap: trapId, label: t.label, headline, why: t.why, fix: t.fix, severity });
}

/**
 * @param {object} item     deck entry
 * @param {object} ac       result from analyze()
 * @param {object} jd       result from judge()
 * @returns {{score:number, verdict:string, checks:Array, findings:Array, trapsFired:string[]}}
 */
export function evaluate(item, ac, jd) {
  const isSentence = item.stress < 0;
  const expectedSyl = syllablesOf(item);
  const checks = [];
  const findings = [];

  /* ---- 1. did an American recogniser hear it ---------------------------- */
  const recWeight = isSentence ? 40 : 45;
  let recScore = 0;
  let recDetail;
  switch (jd.verdict) {
    case 'match':
      recScore = 1; recDetail = `Heard as “${item.w}” on the first guess.`; break;
    case 'near':
      recScore = 0.75;
      recDetail = jd.rank !== undefined
        ? `Heard it, but ranked “${jd.heard}” above it.`
        : `Close: it heard “${jd.heard}”.`;
      break;
    case 'confused':
      recScore = 0.15; recDetail = `It heard “${jd.heard}” instead.`; break;
    case 'silent':
      recScore = 0; recDetail = 'Nothing intelligible came through.'; break;
    case 'unavailable':
      recScore = -1; recDetail = 'No recogniser in this browser — acoustics only.'; break;
    default:
      recScore = -1; recDetail = `Recogniser error (${jd.error || 'unknown'}).`;
  }
  const recUsable = recScore >= 0;
  if (recUsable) {
    checks.push({ id: 'heard', label: 'Recognised as the target word',
      ok: recScore >= 0.75, score: recScore, weight: recWeight, detail: recDetail });
  }

  /* Attribute the confusion to a trap the item already warned about. */
  if (jd.verdict === 'confused' || jd.verdict === 'near') {
    const t = (item.w || '').toLowerCase();
    const h = (jd.heard || '').toLowerCase();
    for (const s of SUBS) {
      if (item.traps.includes(s.trap) && s.test(t, h)) {
        pushFinding(findings, s.trap, s.say(t, h), 3);
      }
    }
    // Nothing matched a detector but it still came back wrong: name the item's
    // primary trap as the likeliest cause rather than inventing a reason.
    if (!findings.length && jd.verdict === 'confused' && item.traps.length) {
      pushFinding(findings, item.traps[0],
        `It heard “${jd.heard}”. The most likely cause on this word is below.`, 3);
    }
  }
  if (jd.verdict === 'silent') {
    findings.push({
      trap: null, label: 'Nothing was heard', severity: 3,
      headline: 'The recogniser got silence.',
      why: 'Usually the mic was still starting, or the word was said before the button finished arming.',
      fix: 'Wait for the red dot, then say the word once, at normal volume, about a hand-width from the mic.',
    });
  }

  /* ---- 2. syllable count ------------------------------------------------- */
  if (!isSentence && expectedSyl) {
    const got = ac.syllables;
    const ok = got === expectedSyl;
    checks.push({
      id: 'syllables', label: `Syllable count (${expectedSyl} expected)`,
      ok, score: ok ? 1 : (Math.abs(got - expectedSyl) === 1 ? 0.4 : 0),
      weight: isSentence ? 0 : 25,
      detail: ok ? `${got} counted.` : `${got} counted, ${expectedSyl} expected.`,
    });

    if (got > expectedSyl) {
      const startsCluster = /^s[ptkmn]/.test(item.w.toLowerCase());
      if (startsCluster) {
        pushFinding(findings, 's_cluster',
          `${got} syllables where ${expectedSyl} was expected, on a word starting s + stop. That extra beat at the front is the inserted vowel.`, 3);
      } else {
        pushFinding(findings, 'schwa',
          `${got} syllables where ${expectedSyl} was expected. A syllable that should have collapsed stayed full.`, 2);
      }
    } else if (got < expectedSyl && got > 0) {
      pushFinding(findings, 'schwa',
        `Only ${got} syllable${got === 1 ? '' : 's'} came through where ${expectedSyl} were expected — syllables are running together.`, 2);
    }
  }

  /* ---- 3. stress placement ---------------------------------------------- */
  if (!isSentence && item.stress >= 0 && ac.syllables > 1) {
    const want = item.stress;
    const got = ac.stressIndex;
    // Only trustworthy when the syllable count agreed; otherwise the indices
    // are counting different things and comparing them would be nonsense.
    const comparable = ac.syllables === expectedSyl;
    if (comparable) {
      const ok = got === want;
      const flat = ac.stressMargin < 0.15;
      checks.push({
        id: 'stress', label: `Stress on syllable ${want + 1}`,
        ok: ok && !flat, score: ok ? (flat ? 0.5 : 1) : 0, weight: 30,
        detail: ok
          ? (flat ? 'Right syllable, but barely — the profile is nearly level.' : 'Landed on the right syllable.')
          : `It landed on syllable ${got + 1}.`,
      });
      if (!ok) {
        pushFinding(findings, 'stress',
          `The loudest, longest, highest syllable was number ${got + 1}. It needs to be number ${want + 1}.`, 3);
      } else if (flat) {
        pushFinding(findings, 'stress',
          'Every syllable came out about the same weight. English needs one clear winner, not a level word.', 2);
      }
    }
  }

  /* ---- 4. rhythm, for sentences ------------------------------------------ */
  if (isSentence && ac.npvi != null) {
    const v = ac.npvi;
    const ok = v >= ENGLISH_NPVI_LO;
    checks.push({
      id: 'rhythm', label: 'Stress-timed rhythm (nPVI)',
      ok, score: ok ? 1 : Math.max(0, (v - 30) / (ENGLISH_NPVI_LO - 30)), weight: 35,
      detail: `nPVI ${v.toFixed(0)}. English conversation usually sits ${ENGLISH_NPVI_LO}–${ENGLISH_NPVI_HI}.`,
    });
    if (!ok) {
      pushFinding(findings, 'rhythm',
        `nPVI came out at ${v.toFixed(0)}. Your syllables are close to equal in length, which is the signature of a syllable-timed language.`, 3);
    }
  }

  /* ---- 5. informational, never scored ------------------------------------ */
  const info = [];
  if (!isSentence && item.traps.includes('final_stop') && ac.finalReleased === false) {
    pushFinding(findings, 'final_stop',
      'The word ended without an audible release — the last consonant was swallowed.', 2);
  }
  if (ac.rate && !isSentence && ac.rate > 7) {
    info.push(`Spoken fast: ${ac.rate.toFixed(1)} syllables/second.`);
  }
  if (ac.snr < 20) info.push(`Room is noisy (${ac.snr.toFixed(0)} dB range) — counts get less reliable below about 20.`);

  /* ---- score ------------------------------------------------------------- */
  const scored = checks.filter((c) => c.weight > 0);
  const totalW = scored.reduce((n, c) => n + c.weight, 0);
  const score = totalW
    ? Math.round(scored.reduce((n, c) => n + c.score * c.weight, 0) / totalW * 100)
    : 0;

  const verdict = score >= 80 ? 'pass' : score >= 60 ? 'close' : 'retry';

  findings.sort((a, b) => b.severity - a.severity);

  return {
    score, verdict, checks, findings, info,
    trapsFired: findings.map((f) => f.trap).filter(Boolean),
  };
}

/* What to say at the top of the result card. Deliberately short: the detail is
 * in the checks, and a wall of text after every attempt kills a drill loop. */
export function verdictLine(res, attempt) {
  if (res.verdict === 'pass') {
    return attempt <= 1 ? 'Clean, first try.' : `Got it — attempt ${attempt}.`;
  }
  if (res.verdict === 'close') return 'Close. One thing to fix.';
  return attempt >= 3 ? 'Still off. Try the slow model first.' : 'Not there yet.';
}
