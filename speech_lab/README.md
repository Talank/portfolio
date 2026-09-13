# Speech Lab — American English

A static, local pronunciation and grammar trainer. No build step, no backend,
no accounts. `bash start.sh` and open `http://localhost:8000/speech_lab/`.

**Prototype.** The loop works end to end and the measurements are real, but the
deck is 92 items and the grammar rule set is 26 rules — both are seeds, not
coverage.

Built for a phone first: level and track are buttons rather than dropdowns, the
record control is a 92px circle in the middle of the thumb's reach, and once a
result card has pushed the controls off screen a fixed bar keeps Listen, Record
and Next at the bottom of the viewport. Nothing that matters lives in a hover
state, and every control clears 44px on its shortest side.

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

## Showing *where* it went wrong

A score tells you that something was wrong. It does not tell you what to move.
So every result also places the error, using a single colour band — red through
orange and amber to green — so that "bad" and "very bad" are visibly different
rather than both landing on the same red.

There are two rows, because there are two kinds of evidence and they localise
to different things.

**Sound by sound.** The recogniser's transcript is aligned to the spelling with
a Levenshtein backtrace, and every substituted or deleted letter is coloured by
how far off the attempt was — a near miss is amber, a different word is red.
Two refinements make it point at sounds rather than at letters:

- A flagged letter widens to the whole trap it sits inside, so *think* heard as
  *tink* colours **th** together. Colouring only the `h` would point at a letter
  that has no sound of its own.
- An *inserted* letter gets its own dashed cell in front of the word. A vowel
  appearing before `sm-` is not a bad `s` — it is the prothetic /ɪ/, and it is
  shown as the extra thing it is rather than as damage to the word.

The caption then separates two claims that are easy to run together: which
letters went red (where the transcript stopped matching) and which of *those*
the trap actually accounts for. For *language* → *languez* the red run is
"age", but only the **g** is /dʒ/; saying the whole run was the affricate would
put a cause on letters that only came along for the ride.

**Beat by beat.** The word is split into its syllables — on the spelling, not
just the IPA — and each one is coloured by how close its measured prominence
came to the profile English wants. A dot shows the weight you gave the
syllable; a notch shows the weight it should have had. The error is counted in
one direction only, because a stressed syllable cannot be too strong and an
unstressed one cannot be too small.

The useful case is the one this app exists for: when every syllable comes out
the same weight, **both** beats are marked down rather than one being declared
the winner. A level word is not a word with stress in the wrong place; it is a
word with no stress, and the display says so.

Sentences get a word row instead, coloured by a word-level alignment, with the
caveat printed beside it that a sentence recogniser repairs some near misses
from context — so a green word there is weaker evidence than a green word in a
single-word drill.

### What the colours are not

No cell is coloured by a per-phoneme score, because there is no per-phoneme
score. Each colour is placed by **position** and justified by a named source:
the transcript alignment, or the measured prominence. Where neither source can
be lined up, the row prints the reason instead of a grey guess:

- one syllable, so there is no stress pattern to place
- the beat count disagreed with the word, so the beats cannot be matched to the
  syllables — which is itself the thing to fix first
- no recogniser in this browser, so there is no transcript to align against
- nothing intelligible came back

A colour in the wrong place is worse than no colour: the user moves their
tongue to fix a sound that was already fine. That is why `trapSpans()` has no
pattern for the /z/ hiding inside *repository* or the /s/ of *sepsis* — where
the spelling does not give the sound away, the answer is no span at all.

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
data/deck.js      92 drills + 16 traps + the orthographic syllable splits
js/analyze.js     the DSP. Pure, no browser APIs, unit-testable
js/asr.js         Web Speech API wrapper, judging, and the model voice
js/localize.js    the colour band, the alignments, where each trap lives. Pure
js/coach.js       measurement -> ranked findings + transparent score
js/render.js      result HTML. Pure, so the colour placement can be asserted
js/grammar.js     26 rules in 8 classes, aimed at Nepali L1
js/app.js         drill loop, levels, personalisation, localStorage
check_page.mjs    boots the page in a DOM stub and checks what it draws
```

**Personalisation** is a per-trap failure count in `localStorage`
(`speechlab-v1`). `nextItem()` weights candidates whose traps you keep missing
and de-weights what you have cleared, so the deck bends toward your own errors.
The Progress tab shows the counts rather than a "pronunciation percentage",
because there is no denominator for that.

## Tests

```
node /tmp/.../scratchpad/speechlab/test.mjs     # 438 checks
node speech_lab/check_page.mjs                  # boots index.html, 77 checks
```

The DSP is tested against **synthetic utterances whose syllable count, stress
position and rhythm are known by construction** — a 1-syllable burst vs the same
burst with a 90 ms vowel glued to the front must read as 1 vs 2, alternating
durations must produce a high nPVI and equal ones a low one. The grammar rules
are tested in both directions, and the 32 must-stay-silent sentences matter more
than the 26 must-fire ones: a checker that flags *"He put the file on my desk
yesterday"* teaches you to ignore it.

`check_page.mjs` follows `shared/check_bedtime_page.js`: it **runs** the page in
a DOM stub rather than inspecting the files, because `app.js` does its whole
setup at module scope and a renamed id throws before a single control is wired
while every static check still passes. It then renders the result card for cases
whose right answer is known by hand — *think* heard as *tink* must put red on
the T and the H and leave the K alone — since the point of a colour band is
where it lands, and a test on the numbers alone would not notice the template
pointing one letter to the left. It also asserts that every class the renderer
emits has a rule in `app.css`, so a rename cannot silently drop the styling off
a whole row.

## Known gaps

- Deck is a seed: L1 is general-only, L3 has no general track. The picker falls
  back to the whole level and the UI says when it does.
- Syllable detection under-counts whispered speech (no f0) and can merge
  syllables in a noisy room. `snr` is reported for this reason.
- The recogniser's language model sometimes repairs a near miss inside a
  sentence, which is why single words are the default drill.
- The letter row needs the recogniser, so Firefox and Safari get the beat row
  and the reasons, but no sound-by-sound colouring.
- Letter alignment diverges from the first bad letter to the end of the
  mismatch, so the red run is often wider than the sound that caused it. The
  caption separates the two rather than the colouring pretending to be exact.
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
