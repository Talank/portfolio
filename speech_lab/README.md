# Speech Lab — American English

A static, local pronunciation and grammar trainer. No build step, no backend,
no accounts. `bash start.sh` and open `http://localhost:8000/speech_lab/`.

**Prototype.** The loop works end to end and the measurements are real, but the
deck is 92 items and the grammar rule set is 26 rules — both are seeds, not
coverage.

---

## What it measures, and what it refuses to

The commercial tool in this space is ELSA Speak, which scores you **per phoneme**
across 44+ English sounds. It does that by streaming your audio to its servers,
extracting MFCCs, and running a purpose-trained DNN against reference models
built from real native-speaker recordings. That is a genuinely hard thing and it
is not reproducible in a page like this one.

So this app does not print phoneme scores. What it prints instead is four
things that *are* honestly measurable from a waveform in a browser:

| Measurement | How | Why it is the right thing to measure here |
|---|---|---|
| **Syllable count** | Peaks in a smoothed energy envelope, each required to clear a 4 dB dip from its neighbour and to be **voiced** | An extra syllable on *smart* **is** the inserted /ɪ/ — the single most recognisable Nepali-L1 error |
| **Stress placement** | Per-nucleus prominence from loudness, duration and f0 together, each scaled against a fixed perceptual reference | Nepali does not use stress contrastively; English fixes one stressed syllable per word and moving it costs intelligibility |
| **Rhythm (nPVI)** | Normalised Pairwise Variability Index over successive syllable durations | The standard phonetics number for telling a stress-timed language from a syllable-timed one. Nepali is syllable-timed; English is not |
| **Rate, final release, SNR** | Frame energy in the tail; syllables per second | Swallowed final stops erase tense and plurals |

Plus one thing measured by somebody else's model:

- **Was it recognised?** — the Web Speech API, `lang="en-US"`. The useful part is
  not the yes/no but *what it heard instead*: "sink" and "tink" are different
  failures of /θ/ and want different corrections, so `coach.js` maps the
  confusion back to a trap and gives the matching physical instruction.

### The honesty rules the code follows

1. **Every number shown was measured.** The score is a weighted sum of *named,
   visible* checks — if it says 72 you can see which check cost the 28.
2. **No finding says "pronounce it correctly."** Every one ends in something to
   do with the lips, the tongue, or the timing.
3. **A measurement that cannot be trusted is not used.** Stress placement is
   only compared to the dictionary when the syllable count agreed; otherwise the
   two indices are counting different things. Below ~12 dB of dynamic range,
   `analyze()` returns `{ok: false}` instead of scoring noise.
4. **Prominence is scaled absolutely, not min-max normalised.** Stretching the
   cues to fill 0–1 makes three identical syllables look as though one won by a
   mile — which would confidently mis-tell a level-stressing speaker where his
   stress landed. This was a real bug, caught by the test suite.

### Where the audio goes

The acoustic analysis runs entirely in the tab; nothing is uploaded or stored.
**The exception is the recogniser**: Chrome implements the Web Speech API by
sending the utterance to Google. The UI says so. With the recogniser absent
(Firefox, Safari) every acoustic check still works.

The reference voice is `speechSynthesis`, not a recorded human. It models
segments well and rhythm only roughly — ELSA uses human recordings and is right
to. Shipping audio was rejected because the repo is already near its Pages
budget.

---

## Why it is aimed at Nepali

The traps are not a generic "hard sounds of English" list. Each one is a
substitution documented in Joshi, Eslami & Rivera, *English Language Features
Challenging for Nepali English Learners* (ORTESOL Journal 40, 2023) —
[ERIC EJ1402235](https://files.eric.ed.gov/fulltext/EJ1402235.pdf). The paper's
specifics are what make a physical instruction possible instead of "practise
more":

- No labiodental fricatives in Nepali → /f/ /v/ become **bilabial** (*fan*, *van*)
- No dental fricatives → /θ/ /ð/ become dental **plosives** (*think* → *tink*)
- /ʃ/ → /s/ (*shoes* → *sues*); /ʒ/ → /z/ (*measure* → *mezer*)
- /dʒ/ → [dz] or /z/ — the paper records *language* as [læŋɡwɪz]
- Prothetic /ɪ/ before initial **sp- st- sk- sm- sn-** (*smart* → [ɪsmaːt]);
  **sl-** and **sw-** are unaffected
- Insufficient force on initial /p/ /t/ /k/
- 6 Nepali monophthongs against 12 English ones → long/short mergers
- Stress is not contrastive in Nepali; rhythm is syllable-timed

The grammar rules come from the same premise: Nepali has no articles, marks
aspect differently, and takes different prepositions, so the errors are
*systematic* and a small rule list beats a generic checker. Precision over
recall — the ambiguous classes (general article omission, "the" overuse) are
deliberately left out rather than guessed at.

---

## Layout

```
index.html        three tabs: Pronounce, Grammar, Progress
css/app.css       site palette, copied from DSA_tool/css/style.css
data/deck.js      92 drills + 16 traps, each with why + physical fix
js/analyze.js     the DSP. Pure, no browser APIs, unit-testable
js/asr.js         Web Speech API wrapper, judging, and the model voice
js/coach.js       measurement -> ranked findings + transparent score
js/grammar.js     26 rules in 8 classes, aimed at Nepali L1
js/app.js         drill loop, levels, personalisation, localStorage
```

**Personalisation** is a per-trap failure count in `localStorage`
(`speechlab-v1`). `nextItem()` weights candidates whose traps you keep missing
and de-weights what you have cleared, so the deck bends toward your own errors.
The Progress tab shows the counts rather than a "pronunciation percentage",
because there is no denominator for that.

## Tests

```
node /tmp/.../scratchpad/speechlab/test.mjs     # 373 checks
```

The DSP is tested against **synthetic utterances whose syllable count, stress
position and rhythm are known by construction** — a 1-syllable burst vs the same
burst with a 90 ms vowel glued to the front must read as 1 vs 2, alternating
durations must produce a high nPVI and equal ones a low one. The grammar rules
are tested in both directions, and the 32 must-stay-silent sentences matter more
than the 26 must-fire ones: a checker that flags *"He put the file on my desk
yesterday"* teaches you to ignore it.

## Known gaps

- Deck is a seed: L1 is general-only, L3 has no general track. The picker falls
  back to the whole level and the UI says when it does.
- Syllable detection under-counts whispered speech (no f0) and can merge
  syllables in a noisy room. `snr` is reported for this reason.
- The recogniser's language model sometimes repairs a near miss inside a
  sentence, which is why single words are the default drill.
- No import/export of progress, no spaced repetition scheduling, no minimal-pair
  A/B mode.

## If this grows

- **Grammar:** swap in [Harper](https://github.com/Automattic/harper) —
  Rust → WASM, fully offline, on jsDelivr as `harper.js`. `grammar.js#check()`
  already has the same shape, so it is a one-file change; keep the aimed rules
  on top of it for the L1-specific classes Harper will not know about.
- **Recogniser:** Whisper via `transformers.js` (~75 MB, WebGPU/WASM) would make
  it genuinely offline *and* better for this purpose — its transcript is rawer,
  so it repairs you less than Chrome's does.
- **Reference audio:** real human recordings per word, if the payload budget
  ever allows it.
