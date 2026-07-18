window.LESSONS = window.LESSONS || {};
window.LESSONS['chunking-long-scripts'] = {
  id: 'chunking-long-scripts',
  title: 'Chunking: Splitting Scripts on Sentences for Speed & Reuse',
  category: 'Part 3 — Pipeline Engineering',
  timeMin: 35,
  summary: 'Part 3 turns the expressive tricks into a production pipeline, and it starts with the humblest, highest-leverage decision: how you SLICE the script. Hand an engine a whole paragraph and you get one long clip that\'s slow to render, impossible to cache granularly, and prone to the model losing prosodic control by the end. Slice on sentence boundaries and everything downstream gets better — each sentence renders fast, caches on its own, re-renders alone when its text changes, and gets its own prosody/emotion. This lesson is the chunking stage: why the sentence is the right unit, how to split on sentence boundaries without butchering "Dr." or "e.g.", and why the unit you choose here is the atom that caching, batching, and playback all build on.',
  goals: [
    'Explain why the sentence is the right granularity — the sweet spot between one-giant-clip and one-word-fragments',
    'Split text on sentence boundaries robustly, handling abbreviations, decimals, and quotes that fake a boundary',
    'See how the chunk becomes the atomic unit for caching, batching, per-line prosody, and playback',
    'Understand why chunking runs AFTER normalization and why that ordering prevents bad splits',
    'Know the edge cases: very long sentences, very short fragments, and dialogue punctuation'
  ],
  concept: [
    {
      h: 'The sentence is the right unit',
      p: [
        'Before you render anything, you decide the <b>unit of work</b> — the size of the chunk you hand to the engine — and it\'s the most consequential architectural choice in the pipeline, because everything downstream inherits it. Two extremes are both wrong. Hand the engine a <b>whole paragraph</b> and you get one big clip: slow to render (you wait for the entire thing before hearing anything), coarse to cache (change one word and the whole paragraph re-renders), impossible to re-time individually, and quality-risky because many models lose prosodic consistency over long spans — the delivery drifts by the end. Hand it <b>one word at a time</b> and you get the opposite disaster: choppy, unnatural audio (prosody needs a phrase to breathe), enormous overhead per tiny render, and a cache full of fragments.',
        'The <b>sentence</b> is the sweet spot, and not by accident — it\'s the natural unit of spoken prosody. A sentence is long enough for the model to produce a coherent intonation contour (rising question, falling statement, natural stress) and short enough to render fast, cache tightly, and control individually. It also aligns with meaning: emotion and emphasis operate at sentence scale (the whole Part-2 story — a line is fearful or excited), so "one clip per sentence" is exactly the granularity at which you set prosody and emotion. This is why the episode pipeline renders one clip per line/sentence: it\'s simultaneously the right unit for quality, for caching, for parallelism, and for playback — a rare case where one choice optimizes everything at once.'
      ]
    },
    {
      h: 'Splitting without butchering the text',
      p: [
        'Splitting on sentences sounds trivial — "break on . ! ?" — and that naive rule is wrong in ways that matter, because periods aren\'t only sentence ends. "Dr. Smith solved it." would split after "Dr". "The value is 3.14 exactly." would split inside the number. "She said \'stop.\' Then left." has a period inside quotes. "e.g. this case" splits on the abbreviation. A period is ambiguous — it ends sentences AND marks abbreviations, decimals, and initials — so a real splitter has to distinguish them. The robust approach handles the known false-boundary cases: don\'t split when the period follows a known abbreviation ("Dr.", "e.g.", "vs."), when it sits between digits (a decimal), or inside quotation marks; DO split on "!" and "?" (less ambiguous) and on a period followed by whitespace and a capital letter that isn\'t a known exception.',
        'Here\'s the elegant part, and why ordering saves you: <b>chunking runs AFTER normalization</b> (Part 2), and normalization already removed most of the traps. By the time text reaches the splitter, "e.g." has become "for example" (no stray period), "3.14" has become "three point one four" (no interior dot), abbreviations are expanded. So the splitter\'s job is dramatically easier than it looks in raw text — most false boundaries were dissolved upstream, and it mostly needs to handle the residue (proper-name initials, edge abbreviations you didn\'t expand). This is the payoff of getting stage order right: normalization and chunking are designed together, with normalization clearing the path so chunking can be a relatively simple, robust rule rather than an arms race against every period in English.'
      ]
    },
    {
      h: 'The chunk is the atom everything builds on',
      p: [
        'Once you\'ve chosen the sentence as the unit, that chunk becomes the <b>atomic unit</b> for the entire rest of the pipeline, and every later stage is defined in terms of it. <b>Caching</b> (next lesson) keys on the chunk — one cache entry per sentence, so changing one sentence re-renders only that sentence and every unchanged sentence is a cache hit. <b>Batching</b> parallelizes across chunks — render 200 sentences concurrently instead of waiting for one giant clip. <b>Prosody and emotion</b> are applied per chunk — each sentence gets its speaker\'s baseline plus its own emotion delta. <b>Playback</b> (Part 3 closer) sequences chunks — one <code>&lt;audio&gt;</code> element advancing through the sentence clips, ducking music, letting you re-time the gaps. The chunk is the join key across all of it.',
        'This is why chunking, despite being the simplest-looking stage, is the foundation of Part 3: choose the unit well and caching is granular, batching is parallel, prosody is per-line, and playback is controllable — all for free, because they all operate on the same clean atom. Choose it badly (paragraphs) and every one of those is coarse and compromised. The mental model to carry forward: the pipeline is <i>normalize → chunk → (per chunk: hash, cache-or-render, apply prosody) → sequence for playback</i>, and the chunk boundary you set here is the grain of the whole system. Get the grain right and the rest of the pipeline is a set of clean operations over a stream of well-sized sentences.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Sanji Preps the Ingredients Right',
      text: [
        'Sanji is cooking for the whole crew and Luffy, "helping," tries to throw an entire uncut cabbage into the pot. "It\'s all going in anyway!" Sanji stops him. "You cook in the WRONG size and everything after it goes wrong. A whole cabbage? The outside burns before the middle\'s warm, and if one leaf is rotten I throw out the whole thing. But mince it to nothing—" Luffy has already started shredding it to mush "—and it turns to paste, no texture, and it takes forever to prep a mountain of dust. You cut it into PIECES. Right-sized pieces. Big enough to cook evenly, small enough that one bad piece is just one piece I toss." He demonstrates: clean, sentence-sized cuts, each one cooking perfectly and independently.',
        'Nami sees why it matters beyond the cooking. "And because they\'re all the same sensible size, you can do everything else easily — fry a batch of them at once, and if I change my mind about the seasoning, you only re-do the pieces I touched, not the whole meal." Sanji nods, plating. "Exactly. The CUT is the whole game. Get the piece size right and the rest of the kitchen runs itself — you cook fast, you fix one piece at a time, you can work on many at once. Get it wrong and every step fights you." He pauses over Luffy\'s cabbage-mush. "This... this we are not serving." Luffy: "So the secret to cooking is... cutting?" Sanji: "The secret to cooking is cutting it RIGHT."'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica Portions the Thanksgiving Prep',
      text: 'Monica is running Thanksgiving and Joey wants to "just cook the whole turkey and everything together in one giant thing." Monica physically blocks the oven. "Absolutely not. One giant everything means it\'s raw in the middle and burnt outside, it takes all day, and if the stuffing\'s off the whole dinner is ruined. But Phoebe over here wants to dice everything into confetti, which is somehow worse — it\'s mush and it takes till Christmas." She portions it her way: sensible, consistent pieces. "You prep in the RIGHT size. Then I can roast a whole tray at once, and when Rachel inevitably changes the recipe" — Rachel: "I might!" — "I only redo the parts she changed, not the entire meal." Chandler, watching: "So the entire holiday hinges on... how she chops things?" Monica, not looking up: "The entire holiday ALWAYS hinges on how I chop things."'
    },
    why: 'Sanji and Monica are both teaching chunking: the UNIT you cut things into is the decision that makes everything downstream easy or hard. Too big (whole cabbage/turkey) = slow, uneven, and one bad spot ruins the whole thing (a paragraph clip: slow to render, prosody drifts, one word-change re-renders everything). Too small (mush/confetti) = no texture and endless overhead (word-by-word: choppy audio, per-fragment cost). The right-sized piece — the sentence — cooks evenly and fast (coherent prosody, quick render), lets you fix just the pieces you changed (granular caching), and lets you work on many at once (batching). Cut it right and the rest of the kitchen runs itself.'
  },
  tech: [
    {
      q: 'Why is the sentence the right chunk size — why not a paragraph or a word?',
      a: 'Because the sentence is the natural unit of spoken prosody AND the sweet spot for every downstream engineering concern, while both extremes fail on multiple axes. A whole paragraph as one clip is bad four ways: slow latency (you wait for the entire paragraph before any audio), coarse caching (change one word and the whole paragraph must re-render), no individual control (you can\'t re-time or re-prosody a single sentence inside a monolithic clip), and quality risk (many TTS models lose prosodic consistency over long spans, so intonation drifts and the delivery degrades by the end). A word at a time is the opposite failure: choppy, unnatural audio because prosody needs a phrase to form a coherent contour (a rising question or falling statement is a sentence-scale phenomenon, invisible at word scale), huge per-render overhead on tiny units, and a cache full of meaningless fragments. The sentence threads between them: it\'s long enough for the model to produce a natural intonation contour and proper stress, and short enough to render fast, cache tightly, parallelize, and control individually. Crucially it also aligns with MEANING — emotion and emphasis operate at sentence scale (the whole Part-2 model is "this LINE is fearful/excited"), so the sentence is exactly the grain at which you set prosody and emotion; any smaller and you\'d be applying emotion to fragments, any larger and one clip would have to carry multiple emotions. That alignment is why "one clip per sentence" simultaneously optimizes quality, caching, parallelism, playback control, AND expressiveness — it\'s the rare unit that\'s right for all of them at once, which is why the episode pipeline renders one clip per line.'
    },
    {
      q: 'Naive splitting on ". ! ?" breaks on real text. How do you split robustly, and why is it easier than it looks?',
      a: 'It breaks because the period is ambiguous — it ends sentences but also marks abbreviations ("Dr.", "e.g.", "vs."), decimals ("3.14"), and initials ("J. R. R.") — plus punctuation can sit inside quotes ("She said \'stop.\' Then left"). A naive split-on-period butchers all of these: after "Dr", inside "3.14", on the abbreviation. So a robust splitter distinguishes the cases: it does NOT split when a period follows a known abbreviation, sits between digits, or is inside quotation marks; it DOES split on "!" and "?" (far less ambiguous than "."), and on a period followed by whitespace and a capital letter that isn\'t a known exception. You can maintain a small abbreviation set for the residual "." cases and treat everything else as a boundary. Now the part that makes it tractable: chunking runs AFTER normalization, and normalization has already dissolved most of the traps. By the time text reaches the splitter, "e.g." is "for example" (period gone), "3.14" is "three point one four" (interior dot gone), unit and abbreviation periods are expanded away — so the splitter faces far cleaner text than raw English, and mostly needs to handle leftover proper-name initials and any abbreviations you chose not to expand. This is the designed-together payoff of stage ordering: rather than fighting an arms race against every period, you clear the field upstream (normalization) so the splitter can be a relatively simple, robust rule downstream. The lesson is that chunking robustness is achieved as much by what normalization removed as by the splitter\'s own cleverness — the two stages are co-designed, and ordering normalization first is what turns sentence-splitting from a hard NLP problem into a manageable one.'
    },
    {
      q: 'Why is the chunk called "the atomic unit," and what depends on getting it right?',
      a: 'Because the chunk boundary you set in this stage becomes the grain of the entire rest of the pipeline — every later stage is defined as an operation over chunks, so the chunk is the join key that ties the system together. Caching keys on the chunk: one cache entry per sentence, so a text edit re-renders only the changed sentences and every unchanged sentence is a hit — granular reuse is only possible because the unit is small and stable. Batching parallelizes across chunks: you render hundreds of sentences concurrently instead of serially waiting on one giant clip — parallelism exists because there are many independent units. Prosody and emotion apply per chunk: each sentence gets its speaker\'s baseline plus its own emotion delta — per-line expressiveness requires per-line units. Playback sequences chunks: one audio element advances through the sentence clips, ducks music, and lets you control the gaps between them — controllable playback requires discrete units to sequence. So four different capabilities — granular caching, parallel batching, per-line prosody, and controllable playback — all fall out for free IF the unit is a well-sized sentence, and all become coarse and compromised if the unit is a paragraph (cache re-renders everything, less to parallelize, one clip must carry multiple emotions, playback can\'t re-time within a clip). That\'s the leverage: chunking looks like the simplest stage but it\'s the foundation, because it sets the grain everything else operates on. Get the grain right and the downstream pipeline is a set of clean, independent operations over a stream of well-sized sentences; get it wrong and every downstream stage inherits the coarseness. The mental model to carry: normalize → chunk → per-chunk (hash, cache-or-render, prosody) → sequence, with the chunk as the atom flowing through all of it.'
    }
  ],
  code: {
    title: 'Sentence chunking after normalization',
    intro: 'A robust-enough sentence splitter that runs on already-normalized text: it splits on ! ? and on sentence-final periods, while guarding the residual abbreviation and initial cases normalization didn\'t remove.',
    code: `import re

# Residual abbreviations normalization didn't expand (names/titles).
_ABBR = {"Dr.", "Mr.", "Mrs.", "Ms.", "St.", "Jr.", "Sr.", "vs."}

def split_sentences(text):
    # text is ALREADY normalized: "e.g."->"for example", "3.14"->"three point..."
    # so most false boundaries are gone; handle the residue.
    out, buf = [], []
    tokens = text.split(" ")
    for i, tok in enumerate(tokens):
        buf.append(tok)
        # a boundary if the token ends in . ! ? ...
        if re.search(r"[.!?]$", tok):
            # ...unless it's a known abbreviation ending in "."
            if tok in _ABBR:
                continue
            # ...or a single-letter initial like "J." (letter + dot)
            if re.fullmatch(r"[A-Z]\\.", tok):
                continue
            out.append(" ".join(buf).strip())
            buf = []
    if buf:
        out.append(" ".join(buf).strip())
    return [s for s in out if s]

# one sentence per chunk -> the atom for caching, batching, prosody, playback
para = ("Two pointers walk in. Dr. Smith says it is fast! Is it optimal? "
        "The scan is slow.")
for s in split_sentences(para):
    print(repr(s))
# 'Two pointers walk in.'
# 'Dr. Smith says it is fast!'   <- did NOT split after "Dr."
# 'Is it optimal?'
# 'The scan is slow.'`,
    notes: [
      'The splitter is simple BECAUSE normalization ran first — the nasty cases ("e.g.", decimals, units) were already dissolved, so this only guards residual title-abbreviations and initials.',
      'Each returned sentence is the atomic chunk: caching hashes it, batching renders many in parallel, prosody/emotion apply to it, and playback sequences it. One clean unit, reused everywhere.'
    ]
  },
  lab: {
    title: 'Split normalized text into sentence chunks',
    prompt: 'Implement <code>split_sentences(text, abbr)</code> where <code>text</code> is already normalized and <code>abbr</code> is a set of abbreviations that end in a period (e.g. <code>{"Dr.", "Mr.", "vs."}</code>). Split the text into sentences: walk the whitespace-separated tokens accumulating a buffer; when a token ends in <code>.</code>, <code>!</code>, or <code>?</code>, treat it as a sentence boundary and emit the buffered sentence — UNLESS that token is in <code>abbr</code> (then keep going). Emit any trailing buffer at the end. Return a list of non-empty sentence strings (stripped). Do not split on abbreviations from the set.',
    starter: `import re

def split_sentences(text, abbr):
    # accumulate tokens; end a sentence on .!? unless the token is in abbr
    pass`,
    checks: [
      { re: 'def\\s+split_sentences\\s*\\(', flags: '', must: true, hint: 'Define split_sentences(text, abbr).', pass: 'split_sentences defined ✓' },
      { re: '[.!?]', flags: '', must: true, hint: 'Detect sentence-ending punctuation . ! ?', pass: 'boundary detection present ✓' },
      { re: 'abbr', flags: '', must: true, hint: 'Skip the boundary when the token is in abbr.', pass: 'abbreviation guard present ✓' }
    ],
    tests: `AB = {"Dr.", "Mr.", "vs."}
# basic three-way split
assert split_sentences("Walk in. Is it fast? The scan is slow.", AB) == \
    ["Walk in.", "Is it fast?", "The scan is slow."]
# abbreviation does NOT split
assert split_sentences("Dr. Smith is fast. Then he left.", AB) == \
    ["Dr. Smith is fast.", "Then he left."]
# exclamation and question
assert split_sentences("Go! Now? Yes.", AB) == ["Go!", "Now?", "Yes."]
# 'vs.' guarded mid-sentence
assert split_sentences("fast vs. slow matters. Ok.", AB) == \
    ["fast vs. slow matters.", "Ok."]
# trailing text with no final punctuation still emitted
assert split_sentences("One. Two", AB) == ["One.", "Two"]
print("chunking correct")`,
    solution: `import re

def split_sentences(text, abbr):
    out, buf = [], []
    for tok in text.split():
        buf.append(tok)
        if re.search(r"[.!?]$", tok) and tok not in abbr:
            out.append(" ".join(buf).strip())
            buf = []
    if buf:
        out.append(" ".join(buf).strip())
    return [s for s in out if s]`,
    notes: [
      'The guard `tok not in abbr` is the whole robustness story once normalization has run — it keeps "Dr." and "vs." from faking a boundary, and there are few such residual cases because normalization dissolved the rest.',
      'Emitting the trailing buffer handles text that doesn\'t end in punctuation, so no content is silently dropped — every token ends up in exactly one chunk.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two refinements: what to do with sentences that are too long or too short, and the streaming payoff of small chunks.',
    sections: [
      {
        h: 'Too-long and too-short chunks',
        p: 'The sentence is the right default unit, but two tails need handling. A too-LONG sentence — a run-on that\'s 80 words with three clauses — reintroduces the paragraph problems (slow render, prosody drift, coarse cache) in miniature, so you can sub-split it at safe secondary boundaries: semicolons, colons, em-dashes, or commas near clause boundaries, preferring splits that keep each piece a coherent phrase. The goal isn\'t a hard word limit but avoiding pathologically long single renders; a soft cap (say, split if a sentence exceeds N words, at the nearest secondary boundary) covers it. A too-SHORT chunk — "Yes." "No." "Right." — is usually fine to render on its own (short clips are cheap and cache well), but a stream of tiny one-word chunks can sound clipped and staccato in playback, and some engines produce artifacts on ultra-short inputs. Two mitigations: optionally merge a very short fragment with an adjacent short one when they belong together prosodically ("Yes. Exactly." → one clip) so the delivery flows, and rely on the playback stage to control inter-clip gaps so short clips don\'t feel machine-gunned. The principle is that the sentence is the default, not a dogma: you split down when a sentence is too big to render or prosody well, and occasionally merge up when fragments are so small that separate clips hurt flow, always keeping the unit in the "coherent phrase" sweet spot. These are refinements at the tails, though — the vast middle of normal prose splits cleanly on sentences and needs neither.'
      },
      {
        h: 'Small chunks enable streaming playback',
        p: 'A payoff of sentence-sized chunks that only becomes visible in Part 3\'s playback lesson is STREAMING: because you render one clip per sentence, you can start playing the first sentence while later sentences are still rendering (or still being fetched), instead of waiting for the whole script. This transforms perceived latency — for a long narration, time-to-first-audio drops from "render the entire thing" to "render one sentence," which can be the difference between a 2-second wait and a 2-minute one. It also enables a producer/consumer design: a batch renderer fills a queue of finished clips while the player drains it, so rendering and playback overlap. None of this is possible with a single paragraph-sized clip — you\'d have exactly one unit, nothing to stream, and you\'d block until it\'s done. So the small-chunk decision isn\'t only about caching granularity and parallelism; it\'s what makes the audio feel instant even when total render time is long, because the listener hears sentence one while the machine works on sentence fifty. This is the same insight as chunked/streaming responses in LLM apps — you show tokens as they arrive rather than waiting for the full completion — and it comes from the same root cause: choosing a small unit of work lets you overlap production with consumption. The chunk you pick here is therefore not just a caching/quality decision but a latency-architecture decision, and the sentence-sized unit is what unlocks a responsive, streaming listening experience later.'
      }
    ]
  },
  quiz: [
    {
      q: 'The right chunk size for TTS rendering is:',
      options: ['A whole paragraph — fewer renders', 'A sentence — long enough for coherent prosody, short enough to render fast, cache tightly, and control per line', 'A single word — maximum granularity', 'A whole page'],
      correct: 1,
      explain: 'The sentence is the natural unit of prosody and the sweet spot for caching, batching, per-line emotion, and playback. Paragraphs are slow/coarse/drifty; words are choppy and high-overhead.'
    },
    {
      q: 'Naive splitting on ". ! ?" fails mainly because:',
      options: ['Punctuation is rare', 'The period is ambiguous — it also marks abbreviations ("Dr."), decimals ("3.14"), and initials', 'Engines can\'t read punctuation', 'Sentences are always short'],
      correct: 1,
      explain: 'A period ends sentences AND marks abbreviations/decimals/initials, and quotes can hold interior punctuation. A robust splitter distinguishes these; ! and ? are far less ambiguous.'
    },
    {
      q: 'Sentence splitting is easier than it looks because:',
      options: ['English has no abbreviations', 'Chunking runs AFTER normalization, which already dissolved "e.g.", decimals, and units into split-safe words', 'Engines split for you', 'It uses machine learning'],
      correct: 1,
      explain: 'Normalization expanded "e.g."→"for example" and "3.14"→"three point one four" upstream, so the splitter faces clean text and only handles residual initials/title-abbreviations. Stage order co-designed.'
    },
    {
      q: 'The chunk is called "the atomic unit" because:',
      options: ['It\'s made of atoms', 'Caching, batching, per-line prosody, and playback are all defined as operations over chunks — it\'s the grain of the whole pipeline', 'It can\'t be split further ever', 'It\'s the smallest possible unit'],
      correct: 1,
      explain: 'Every downstream stage operates on chunks — cache keys on them, batching parallelizes them, prosody applies per chunk, playback sequences them. Get the grain right and all four fall out for free.'
    },
    {
      q: 'A too-LONG sentence should be:',
      options: ['Rendered as-is always', 'Sub-split at safe secondary boundaries (semicolons, em-dashes, clause commas) to avoid render slowness and prosody drift', 'Deleted', 'Merged with the next sentence'],
      correct: 1,
      explain: 'A run-on reintroduces the paragraph problems in miniature. Split it at secondary boundaries into coherent phrases. The sentence is the default, not a dogma — split down at the long tail.'
    }
  ],
  pitfalls: [
    'Rendering whole paragraphs as single clips: slow time-to-first-audio, coarse caching (one word-change re-renders everything), no per-line control, and prosody drift over long spans.',
    'Splitting word-by-word: choppy audio (prosody needs a phrase), huge per-render overhead, and a cache full of meaningless fragments. Both extremes are wrong; the sentence is the unit.',
    'Naive split on every period: butchers "Dr. Smith", "3.14", and initials. Guard abbreviations/decimals/quotes — and lean on normalization having run first to dissolve most traps.',
    'Chunking BEFORE normalization: you split on punctuation ("e.g.", decimals) that normalization was about to remove, fragmenting sentences wrongly. Normalize first, then chunk.',
    'Treating the sentence as dogma at the tails: a 80-word run-on should sub-split; a stream of one-word fragments may merge or need playback-gap control. Keep the unit a coherent phrase.'
  ],
  interview: [
    {
      q: 'Why is choosing the chunk size the most consequential decision in a TTS pipeline, and what size do you pick?',
      a: 'Because the chunk is the grain of the entire pipeline — every downstream stage is defined as an operation over chunks — so the unit you pick here is inherited by caching, batching, prosody, and playback, and getting it wrong compromises all of them at once. I pick the sentence, for two converging reasons. First, quality: the sentence is the natural unit of spoken prosody — long enough for the model to form a coherent intonation contour (rising question, falling statement, proper stress) but short enough that the model doesn\'t lose prosodic consistency the way it does over paragraph-length spans. Second, engineering: the sentence is the sweet spot for everything downstream. Caching keys on it, so a text edit re-renders only the changed sentences and everything else is a cache hit — granular reuse. Batching parallelizes across sentences, so hundreds render concurrently instead of blocking on one giant clip. Prosody and emotion apply per sentence, which matches the Part-2 model where a LINE is fearful or excited — the sentence is exactly the grain at which expressiveness is set. And playback sequences sentence clips, enabling gap control, music ducking, and streaming (play sentence one while sentence fifty renders, collapsing time-to-first-audio). Both extremes fail: a paragraph clip is slow, coarse-caching, drift-prone, and uncontrollable; word-by-word is choppy, high-overhead, and fragmentary. The sentence is the rare unit that simultaneously optimizes quality, caching, parallelism, expressiveness, and latency — which is why the whole pipeline is built around one clip per sentence. I\'d treat it as the default rather than dogma, sub-splitting pathologically long run-ons at secondary boundaries and occasionally merging tiny fragments, but the sentence is the atom the architecture rests on.'
    },
    {
      q: 'Sentence splitting is a classic messy NLP problem. How do you make it robust in this pipeline without an arms race against every period?',
      a: 'The key move is recognizing that chunking doesn\'t stand alone — it runs after normalization, and the two stages are co-designed so that normalization clears most of the traps before the splitter ever sees the text. The period is ambiguous in raw English (sentence end, abbreviation, decimal, initial), which is what makes naive splitting a nightmare, but by the time text reaches my splitter, normalization has already expanded "e.g." to "for example", "3.14" to "three point one four", "5km" to "five kilometers", and most abbreviations — so the interior dots and abbreviation periods that cause false boundaries are simply gone. That turns sentence-splitting from an open-ended NLP problem into a manageable one: the splitter faces clean text and only needs to handle the residue — proper-name titles ("Dr.", "Mr.") and single-letter initials — which I cover with a small abbreviation set and a "capital-letter initial" guard, plus splitting confidently on "!" and "?" since those are far less ambiguous than ".". So robustness comes as much from what normalization removed upstream as from the splitter\'s own logic — I don\'t fight an arms race, I arrange for the fight to be mostly over before this stage starts. The broader principle is stage ordering as a design tool: normalize → chunk → hash/cache → render → sequence, where each stage assumes the prior one ran and is made simpler by it. If I ever hit a specific residual failure (some abbreviation I didn\'t expand, an unusual initial pattern), the fix is usually to expand it in normalization (dissolving the boundary at the source) rather than adding another special case to the splitter — keeping the splitter simple and pushing the messiness to the stage designed to absorb it. That co-design is what makes a notoriously messy problem tractable here.'
    }
  ]
};
