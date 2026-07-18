window.LESSONS = window.LESSONS || {};
window.LESSONS['laughs-and-nonverbals'] = {
  id: 'laughs-and-nonverbals',
  title: '"Shishishi": Making Laughs, Sighs & Gasps Sound Real',
  category: 'Part 2 — Killing the Robot',
  timeMin: 35,
  summary: 'This is the lesson born directly from a bug: Luffy\'s signature laugh, written "SHISHISHI," came out of the TTS as flat, spelled-out letters — "ess-aitch-eye…" — which is the opposite of a laugh. Non-verbal sounds (laughs, sighs, gasps, hums) are where text-to-speech is weakest, because a phonetic engine tries to PRONOUNCE them instead of PERFORMING them. This lesson is the two honest strategies for real non-verbals on a local pipeline: rewrite the sound into pronounceable syllables the engine can actually voice ("Shi hi hi hi ha ha ha!") — cheap, deterministic, and what fixed Luffy — or route the line to a generative engine like Bark that produces true non-verbals. You\'ll learn which to use when, and how to build the rewrite so it fires only on the laugh and leaves the rest of the line intact.',
  goals: [
    'Explain why phonetic TTS mangles non-verbals: it pronounces the letters instead of performing the sound',
    'Apply strategy 1 — rewrite the token into pronounceable laugh/sigh syllables on a normal engine (cheap, deterministic)',
    'Apply strategy 2 — route the line to a generative engine (Bark) for a truly organic non-verbal, and its trade-offs',
    'Build the rewrite safely: match only the non-verbal token, transform it, leave the surrounding words untouched',
    'Choose per case: everyday recurring laughs → rewrite; rare hero non-verbal beats → generate & freeze'
  ],
  concept: [
    {
      h: 'Why "SHISHISHI" comes out as letters',
      p: [
        'A standard neural TTS engine is a <b>pronunciation</b> machine: it converts text to phonemes (via a G2P front-end) and then to sound. Hand it a real word and it speaks it; hand it "SHISHISHI" — which isn\'t a word — and it does the only thing it knows: sounds out the letters as best it can, flat and even, "sh-ih-sh-ih-sh-ih." That is a <i>reading</i> of the string, not a <i>laugh</i>. This was the exact Luffy bug: his most recognizable sound rendered as a robotic spelling drill, killing the one line that should have had the most personality. And it generalizes — "hahaha," "hmmmm," "ugh," "*sigh*," "pfft" all hit the same wall, because none of them are words the engine was trained to perform; they\'re transcriptions of sounds.',
        'The core problem is a mismatch: a laugh is <b>performance</b> — rhythm, breath, pitch bouncing — but a phonetic engine only does <b>pronunciation</b>. There is no knob that makes "pronounce these letters" turn into "perform this laugh." So you can\'t fix it by tuning rate/pitch/volume on the raw token — those help a real utterance, but there\'s no real utterance here, just letters. You have to change the <i>input</i>: either give the pronunciation engine something it CAN pronounce that happens to sound like a laugh, or send the line to a different kind of engine that actually performs non-verbals. Those are the only two honest options, and both are worth having.'
      ]
    },
    {
      h: 'Strategy 1: rewrite it into syllables the engine can voice',
      p: [
        'The cheap, deterministic fix — and the one that actually shipped for Luffy — is to <b>rewrite the non-verbal token in the spoken text</b> (not the displayed text) into pronounceable syllables that, when voiced normally, sound like the intended non-verbal. "SHISHISHI" becomes something like <code>"Shi hi hi hi ha ha ha!"</code>: it keeps his signature "shi" onset so it\'s recognizably HIS laugh, but the rest is open "hi/ha" syllables the engine voices cleanly, with spaces and an exclamation mark so it comes out bouncy and breathy instead of spelled-out. A sigh becomes <code>"haaah"</code>, a thinking hum <code>"hmm"</code>, a gasp <code>"hah!"</code> — in every case you\'re translating a transcription-of-a-sound into speakable-syllables-that-make-that-sound.',
        'The engineering rule that makes this safe is <b>surgical replacement</b>: match ONLY the non-verbal token with a precise pattern, replace just that, and leave the rest of the line completely untouched. Luffy\'s line "Shishishi, let\'s go find the treasure!" must become "Shi hi hi hi ha ha ha! let\'s go find the treasure!" — the laugh transformed, the real sentence intact. You do this with a targeted regex (a case-insensitive pattern for the "shi/sha" laugh shape, guarded so it doesn\'t eat neighboring words) applied in the text-normalization stage, before synthesis. It\'s deterministic (same input, same laugh, cache-friendly), needs no special engine, runs on the fast CPU workhorse, and — critically — it operates on the SPOKEN string only, so the on-screen caption can still read the stylized "Shishishi!" while the audio performs the real thing. For recurring, everyday non-verbals, this is almost always the right tool.'
      ]
    },
    {
      h: 'Strategy 2: generate a real one, then freeze it',
      p: [
        'Rewriting fakes a laugh out of speakable syllables — clever, but it\'s still the pronunciation engine doing an impression. When you want a <i>genuinely</i> organic non-verbal — a real belly laugh, a heavy weary sigh, a sharp gasp with actual breath — you route that line to a <b>generative engine like Bark</b>, which was trained to produce non-speech vocalizations and does them for real, not by spelling. You cue it with a tag (Bark uses markers like <code>[laughs]</code>, <code>[sighs]</code>) and it improvises the sound. The catch is everything you learned about Bark in Part 1: it\'s slow, GPU-hungry, and <b>nondeterministic</b> — the same input gives a different laugh each run — so you never put it on the live path or in the deterministic bulk render.',
        'The discipline that makes Bark usable is <b>generate-and-freeze</b>: run it offline, listen to a few takes, pick the best one, and save that clip as a fixed asset — after which it plays back like any other file, deterministic and instant, with the nondeterminism spent once at authoring time. So the two strategies split cleanly by frequency and stakes. A character\'s <b>recurring</b> laugh (Luffy laughs constantly) → rewrite: it must be cheap, deterministic, and consistent across hundreds of lines, and it needs to sit inside normal sentences. A <b>rare hero beat</b> — one big, show-stopping laugh or a devastating sigh that carries a moment → generate with Bark and freeze it: worth the GPU and the curation because it happens once and needs to be genuinely great. Most projects use both: rewrite for the everyday non-verbals woven through dialogue, Bark-and-freeze for the handful of signature moments. Neither is "the answer" — matching the strategy to the case is.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Teaching the Parrot to Laugh Like Luffy',
      text: [
        'The crew finds a talking parrot that can only say things by spelling them, letter by letter, in a flat robotic squawk. They try to teach it Luffy\'s laugh and it\'s a catastrophe: "ESS. AITCH. EYE. ESS. AITCH. EYE." Luffy is horrified. "That\'s not my laugh! My laugh goes shishishi, it\'s HAPPY!" Usopp, the resident tinkerer, figures out the problem. "The bird can only PRONOUNCE things — it doesn\'t know your laugh is a laugh, it just sees letters and reads them out. So we can\'t give it \'shishishi.\' We give it sounds it CAN say that come out laughing." He coaches the parrot: "Shi — hi — hi — hi — ha — ha — ha!" Slow, bouncy, breathy. And the parrot does it — and it actually sounds like Luffy, because it kept the "shi" at the front but the rest is stuff a mouth can genuinely say.',
        'Then Robin raises the harder case. "That\'s good for his everyday giggle. But what about the BIG laugh — the one at the end of a real victory, that has to come from the gut?" Usopp admits the parrot can\'t fake that one; it\'s just rearranging syllables. "For that," Robin says, "we don\'t use the parrot at all. We wait for Luffy to do it for real, we record it ONCE, and we keep that recording for the big moments." So they end up with two tools: the parrot doing the rewritten "shi-hi-hi-ha-ha" for all the constant little laughs woven through Luffy\'s chatter, and one real, recorded belly-laugh saved for the finale. Luffy, satisfied: "So the bird does my little laughs, and my BIG laugh is the real me, saved up." Usopp: "Exactly. Fake the everyday ones cheap, save the real one for when it counts."'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey Can\'t Do the Scripted Laugh',
      text: 'Joey has an audition where the script literally reads "HAHAHA" and he keeps performing it by saying the letters — "aitch-ay-aitch-ay" — dead flat, and the casting director winces. Chandler, coaching him, diagnoses it instantly. "Joey, you\'re READING the laugh. Nobody laughs by reading. Don\'t say \'H-A\' — go \'ha... ha... HA!\' Breathe it. Bounce it." Joey tries the breathy, spaced-out version and it finally sounds like a human laughing instead of a robot spelling. But then there\'s the emotional scene that needs a real, breaking, from-the-gut laugh-turning-into-tears, and Chandler shakes his head: "That one you can\'t fake with syllables, man. That\'s a real one. You gotta actually FEEL it and do it for real — and if you nail it once in rehearsal, we remember exactly how you did it and you reproduce THAT." Joey: "So the little laughs I fake, the big one\'s gotta be real?" Chandler: "Now you\'re acting."'
    },
    why: 'Both stories are the two non-verbal strategies exactly. The parrot and Joey both fail the same way the TTS did: a pronunciation machine READS "shishishi"/"HAHAHA" as letters instead of performing a laugh. Strategy 1 is the fix Usopp and Chandler teach — rewrite it into breathy, bouncy, speakable syllables ("shi-hi-hi-ha-ha", "ha... ha... HA!") that keep the signature but are things a mouth can actually voice; cheap and repeatable for the everyday laughs. Strategy 2 is the big gut-laugh: you can\'t fake it with syllables, so you produce a REAL one (generate/record), capture it once, and reuse that frozen take for the rare hero moments. Fake the everyday ones cheap; generate-and-freeze the signature one.'
  },
  tech: [
    {
      q: 'Why does a normal TTS engine turn "SHISHISHI" into spelled-out letters instead of a laugh?',
      a: 'Because a standard neural TTS engine is fundamentally a pronunciation machine: its front-end converts text to phonemes (grapheme-to-phoneme, G2P) and its back-end turns phonemes into audio, and it was trained to PRONOUNCE words, not to PERFORM sounds. "SHISHISHI" isn\'t a word in its vocabulary and doesn\'t map to a known pronunciation, so the engine falls back to sounding out the string as best it can — flat, even, letter-ish "sh-ih-sh-ih-sh-ih" — which is a reading of the characters, not a laugh. A laugh is not pronunciation at all: it\'s a performance with its own rhythm, breath, and bouncing pitch, none of which the pronunciation pathway produces. This is why you can\'t rescue it by tuning rate/pitch/volume on the raw token — those knobs shape a real utterance, but there is no real utterance here, only letters being read, so faster or higher letters are still just letters. The same failure hits every transcription-of-a-sound: "hahaha," "hmmmm," "ugh," "pfft," "*sigh*" — all are written approximations of non-verbal vocalizations, and a pronunciation engine has no idea they represent sounds rather than words to spell. The insight that unlocks both fixes is recognizing the mismatch precisely: the engine does pronunciation, the content demands performance, and there\'s no knob bridging the two. So you either change the input into something pronounceable that happens to sound like the non-verbal (strategy 1), or you send the line to a different KIND of engine that actually performs non-verbals (strategy 2). Trying to make the pronunciation engine "just do a laugh" from the raw token is fighting the tool\'s nature.'
    },
    {
      q: 'How do you build the rewrite so it fixes the laugh without corrupting the rest of the line?',
      a: 'With surgical, pattern-scoped replacement in the text-normalization stage, operating on the SPOKEN string only. The steps: (1) Match ONLY the non-verbal token with a precise pattern — for Luffy\'s laugh, a case-insensitive regex for the "shi/sha" laugh shape (repeated "shi" units) with guards so it can\'t swallow adjacent real words; the guarding matters because you don\'t want "shine" or "shirt" or a legitimate "sh" inside a word to get eaten. (2) Replace just the matched span with pronounceable syllables that voice as the intended sound — "Shi hi hi hi ha ha ha!" — keeping the signature onset ("shi") so it\'s recognizably that character\'s laugh, using open "hi/ha" syllables the engine voices cleanly, and spaces plus an exclamation mark so the delivery is bouncy and breathy rather than run-together. (3) Leave everything else in the line completely untouched, so "Shishishi, let\'s go find the treasure!" becomes "Shi hi hi hi ha ha ha! let\'s go find the treasure!" — laugh transformed, sentence intact. (4) Do it on the spoken text only, so the on-screen caption can still show the stylized "Shishishi!" while the audio performs the real thing — display and speech diverge on purpose. Two robustness details from the real implementation: after inserting the exclamation-laden laugh you clean up any doubled punctuation where the laugh meets the original sentence (e.g. collapse "! ," into "! "), and because it\'s deterministic pure text-processing it runs before synthesis, so it\'s cache-friendly and adds no engine cost. The whole thing is a few lines of regex, but the discipline — match narrowly, replace precisely, preserve the rest, operate on spoken-not-displayed — is what keeps it from turning into a source of subtle corruption across hundreds of lines.'
    },
    {
      q: 'When should you rewrite a non-verbal vs. generate it with Bark, and why not always use Bark since it\'s "real"?',
      a: 'Match the strategy to frequency and stakes. Rewrite when the non-verbal is RECURRING and woven into normal speech: a character who laughs constantly (Luffy) needs their laugh to be cheap, deterministic, consistent across hundreds of lines, and embeddable mid-sentence — all of which the rewrite delivers on the fast CPU workhorse with zero per-line cost, and all of which Bark fails at. Generate with Bark when the non-verbal is a RARE hero beat — one big show-stopping belly laugh, a devastating sigh that carries a whole moment — where genuine organic quality matters more than cost and it happens seldom enough to curate. You don\'t always use Bark despite it being "real" for concrete reasons rooted in Part 1: Bark is slow and GPU-hungry, so putting it on every laugh would wreck render time and hardware requirements; it\'s nondeterministic, so the same laugh differs every run, which breaks reproducible builds and content-addressed caching and makes a recurring laugh inconsistent line-to-line; and it produces a standalone vocalization, not a laugh neatly embedded inside "Shishishi, let\'s go find the treasure!" — you\'d have to stitch generated audio into the middle of a spoken sentence, which is fiddly and often worse than the clean rewrite. The way to make Bark usable at all is generate-and-freeze: run it offline, audition a few takes, pick the best, and save that clip as a fixed asset so the nondeterminism is spent once at authoring time and playback is deterministic and instant thereafter. So the honest answer is that neither strategy dominates: rewrite is right for the everyday non-verbals (the common case), Bark-and-freeze is right for the handful of signature moments, and most real projects use both. "Always use the realer tool" ignores that the rewrite wins decisively on exactly the axis — recurring, embedded, deterministic laughs — where most non-verbals actually live.'
    }
  ],
  code: {
    title: 'The laugh rewrite: surgical, spoken-text-only',
    intro: 'The exact Luffy fix — a scoped regex that turns the "shishishi" laugh token into pronounceable, bouncy syllables while leaving the rest of the line intact, applied to the spoken string during normalization.',
    code: `import re

# Match the "shi/sha" laugh shape only: an s-h-vowel onset repeated,
# guarded by (?<![a-z]) / (?![a-z]) so it can't eat real words like "shine".
_LAUGH_RE = re.compile(r"(?<![a-z])sh+[ia](?:sh+[ia])+(?![a-z])", re.IGNORECASE)
_LAUGH_TEXT = "Shi hi hi hi ha ha ha!"    # signature "shi" + open, breathy syllables

def voice_the_laugh(text):
    # rewrite ONLY the laugh token; leave the rest of the sentence untouched
    text = _LAUGH_RE.sub(_LAUGH_TEXT, text)
    # tidy where the exclamation meets the original clause: "! ," -> "! "
    text = re.sub(r"!\\s*[!,.]+", "! ", text)
    return text

# spoken vs displayed: the caption can still read "Shishishi!"; only audio changes.
displayed = "Shishishi, let's go find the treasure!"
spoken    = voice_the_laugh(displayed)
# spoken -> "Shi hi hi hi ha ha ha! let's go find the treasure!"

# Everyday laughs -> this rewrite (cheap, deterministic, CPU).
# A rare HERO laugh -> generate with Bark ([laughs]) offline, audition,
# pick the best take, and FREEZE it as a fixed asset (deterministic playback).`,
    notes: [
      'The lookbehind/lookahead guards (?<![a-z]) / (?![a-z]) are the safety: they stop the pattern from eating letters inside real words, so only a standalone laugh token is rewritten.',
      'It runs on the SPOKEN string during normalization — the display caption keeps the stylized "Shishishi!" while the audio performs the real laugh. Display and speech diverge on purpose.'
    ]
  },
  lab: {
    title: 'Rewrite the laugh, keep the sentence',
    prompt: 'Implement <code>voice_the_laugh(text, laugh_re, laugh_text)</code>. <code>laugh_re</code> is a compiled regex matching the laugh token; <code>laugh_text</code> is the pronounceable replacement (e.g. <code>"Shi hi hi hi ha ha ha!"</code>). Replace every match of <code>laugh_re</code> in <code>text</code> with <code>laugh_text</code>, then collapse any run of punctuation immediately after a "!" — i.e. replace the pattern <code>!\\s*[!,.]+</code> with <code>"! "</code> — so a laugh landing before a comma doesn\'t leave "! ,". Return the cleaned string. The surrounding words must be preserved exactly.',
    starter: `import re

def voice_the_laugh(text, laugh_re, laugh_text):
    # 1) replace the laugh token with laugh_text
    # 2) tidy "! ," / "!!" etc. after the laugh into "! "
    pass`,
    checks: [
      { re: 'def\\s+voice_the_laugh\\s*\\(', flags: '', must: true, hint: 'Define voice_the_laugh(text, laugh_re, laugh_text).', pass: 'voice_the_laugh defined ✓' },
      { re: '\\.sub\\s*\\(', flags: '', must: true, hint: 'Use laugh_re.sub(...) and re.sub(...) to replace.', pass: 'substitution present ✓' },
      { re: 'laugh_text', flags: '', must: true, hint: 'Replace matches with laugh_text.', pass: 'uses laugh_text ✓' }
    ],
    tests: `import re
LR = re.compile(r"(?<![a-z])sh+[ia](?:sh+[ia])+(?![a-z])", re.IGNORECASE)
LT = "Shi hi hi hi ha ha ha!"
# laugh before a comma: rewritten, sentence intact, no "! ,"
out = voice_the_laugh("Shishishi, let's go!", LR, LT)
assert out == "Shi hi hi hi ha ha ha! let's go!", out
# laugh alone
assert voice_the_laugh("shishishi", LR, LT) == "Shi hi hi hi ha ha ha! "
# must NOT eat real words containing 'sh'
assert voice_the_laugh("the shirt is shiny", LR, LT) == "the shirt is shiny"
# case-insensitive, different length
assert voice_the_laugh("SHISHISHISHI!", LR, LT) == "Shi hi hi hi ha ha ha! "
# no laugh -> unchanged
assert voice_the_laugh("let's find the treasure", LR, LT) == "let's find the treasure"
print("laugh rewrite correct")`,
    solution: `import re

def voice_the_laugh(text, laugh_re, laugh_text):
    text = laugh_re.sub(laugh_text, text)
    text = re.sub(r"!\\s*[!,.]+", "! ", text)
    return text`,
    notes: [
      'Two substitutions: the scoped laugh_re replaces only the laugh token (the guards protect "shirt"/"shiny"), then the punctuation tidy turns "! ," into "! " so the seam between laugh and sentence is clean.',
      'The test that it leaves "the shirt is shiny" untouched is the whole point of surgical replacement — a greedy or unguarded pattern would corrupt real words across a long script.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two subtleties: how far to push the syllable rewrite, and stitching a frozen Bark non-verbal into a spoken line.',
    sections: [
      {
        h: 'The art of the syllable rewrite: signature vs. speakability',
        p: 'A good rewrite balances two competing goals: it must be RECOGNIZABLE as the specific non-verbal (Luffy\'s laugh has to sound like Luffy, a sigh like a sigh) and it must be SPEAKABLE by a pronunciation engine (composed of syllables the G2P front-end voices cleanly). Recognizability argues for keeping the signature — Luffy\'s "shi" onset is why "Shi hi hi hi..." reads as HIS laugh and not a generic one — while speakability argues for open, vowel-forward syllables ("hi/ha/hee") with spaces so they bounce rather than blur. The craft is in the middle: too literal to the transcription (keeping "shshsh") and the engine stumbles again; too generic ("ha ha ha") and you lose the character. Punctuation and spacing are load-bearing here, not cosmetic — spaces make the engine articulate each syllable separately (the bounce of a laugh), and an exclamation mark lends the breathy, energetic contour, so the same syllables written "shihihihahaha" vs. "Shi hi hi hi ha ha ha!" perform very differently. The same approach generalizes: a weary sigh is a long open vowel ("haaah"), a thinking hum is "hmm" (which many engines actually do voice as a hum), a gasp is a short sharp "hah!". You\'re essentially doing hand G2P for sounds the engine never learned — translating a sound-transcription into the engine\'s native currency of speakable syllables. It\'s worth auditioning a couple of spellings per non-verbal, because small changes (an extra "hi," a different vowel, more spacing) noticeably change the result, and once you find one that lands you freeze that spelling into the normalization rule and it\'s deterministic forever.'
      },
      {
        h: 'Stitching a frozen non-verbal into a line',
        p: 'When you do go the Bark-and-freeze route for a hero laugh, you often want it INSIDE a spoken line — "We did it! [big real laugh] Let\'s go home." — which means combining a generated non-verbal clip with normally-synthesized speech around it. Because the pipeline already renders one clip per line and controls playback ordering, the clean way is to treat the non-verbal as its own "line": split the utterance into three pieces — spoken "We did it!", the frozen laugh asset, spoken "Let\'s go home." — and sequence them as three consecutive clips with the frozen laugh in the middle. No audio-editing or waveform splicing required; it\'s just three items in the playback queue, and the frozen laugh plays back deterministically like any other asset. This is another payoff of the one-clip-per-line architecture (Part 3): the seams between clips are exactly where you insert special assets, so mixing a generated non-verbal into otherwise-normal narration is a sequencing problem, not a signal-processing one. The trade-off to manage is the transition — a generated laab recorded at a different level or with a different room tone than your TTS voice can sound pasted-in — so you match levels (normalize loudness across the pieces) and keep the frozen non-verbal short and clean. For most projects this is reserved for a handful of signature moments precisely because it takes this extra curation; the everyday laughs stay as cheap in-sentence rewrites, and only the beats that must be genuinely great get the split-and-stitch treatment.'
      }
    ]
  },
  quiz: [
    {
      q: 'Why does a normal TTS engine render "SHISHISHI" as flat spelled-out letters?',
      options: ['The GPU is too small', 'It\'s a pronunciation machine — it sounds out the letters because a laugh isn\'t a word it can perform', 'The sample rate is wrong', 'It needs more training data for that line'],
      correct: 1,
      explain: 'Phonetic TTS converts text→phonemes→sound. A non-word transcription-of-a-sound gets read as letters, because pronunciation ≠ performance, and no rate/pitch knob bridges that.'
    },
    {
      q: 'Strategy 1 (the fix that shipped for Luffy) is to:',
      options: ['Buy a bigger model', 'Rewrite the laugh token into pronounceable, bouncy syllables ("Shi hi hi hi ha ha ha!") on the spoken text', 'Delete the laugh', 'Slow the whole line down'],
      correct: 1,
      explain: 'Give the pronunciation engine something it CAN voice that sounds like the laugh — keeping the "shi" signature but using open syllables, spaces, and "!" for a breathy bounce.'
    },
    {
      q: 'The rewrite must be surgical because:',
      options: ['It runs faster', 'An unguarded pattern would corrupt real words (eat the "shi" in "shirt"/"shiny") across the script', 'Regex is required by law', 'It changes the file format'],
      correct: 1,
      explain: 'Match ONLY the laugh token (with lookbehind/lookahead guards), replace just that, preserve the rest. "the shirt is shiny" must come through untouched.'
    },
    {
      q: 'You should route a non-verbal to Bark (generate-and-freeze) when it\'s:',
      options: ['A recurring laugh woven through every other line', 'A rare hero beat — one big organic laugh/sigh that carries a moment and is worth curating offline', 'Any laugh at all', 'On the live low-latency path'],
      correct: 1,
      explain: 'Bark is slow, GPU-hungry, and nondeterministic — wrong for recurring embedded laughs (use rewrite), right for a handful of signature moments generated offline and frozen as fixed assets.'
    },
    {
      q: 'Applying the laugh rewrite to the SPOKEN string only means:',
      options: ['The audio and caption are always identical', 'The on-screen caption can still show the stylized "Shishishi!" while the audio performs the real laugh', 'The text is deleted', 'It only works offline'],
      correct: 1,
      explain: 'Display and speech diverge on purpose: normalization rewrites what the engine voices, not what the reader sees, so you keep the stylized caption and get a real-sounding laugh.'
    }
  ],
  pitfalls: [
    'Trying to fix a non-verbal by tuning rate/pitch/volume on the raw "SHISHISHI" token. There\'s no real utterance to shape — you must change the input (rewrite) or the engine (generate), not the knobs.',
    'An unguarded laugh regex that eats real words — the "shi" in "shirt," "shine," "sushi." Use lookbehind/lookahead guards and match only a standalone laugh token.',
    'Rewriting the DISPLAYED text instead of the spoken text, losing the stylized caption. Transform the spoken string during normalization; leave the caption as the reader sees it.',
    'Using Bark for every laugh because it\'s "real." Slow, GPU-hungry, nondeterministic, and hard to embed mid-sentence — wrong for recurring laughs. Rewrite the everyday ones; reserve Bark-and-freeze for hero beats.',
    'Losing the character in the rewrite by going too generic ("ha ha ha"). Keep the signature onset ("shi") so it\'s still recognizably that character\'s laugh, and audition a couple of spellings.'
  ],
  interview: [
    {
      q: 'A character\'s catchphrase laugh, written "SHISHISHI," comes out of your TTS as robotic spelled-out letters. Walk me through fixing it.',
      a: 'First I\'d name the root cause, because it dictates the fix: a standard neural TTS engine is a pronunciation machine — text to phonemes to sound — and "SHISHISHI" isn\'t a word it can perform, so it sounds out the letters flat. A laugh is a performance (rhythm, breath, bouncing pitch), and there\'s no rate/pitch/volume knob that turns "pronounce these letters" into "perform this laugh," so tuning the raw token is a dead end. I have two honest strategies. For this case — a recurring catchphrase laugh woven through the character\'s normal dialogue — I\'d use strategy 1, a syllable rewrite: transform the laugh token in the SPOKEN text into pronounceable, bouncy syllables that voice as a laugh, like "Shi hi hi hi ha ha ha!" — keeping the "shi" onset so it\'s still recognizably HIS laugh, using open hi/ha syllables the engine articulates cleanly, with spaces and an exclamation mark so it comes out breathy and bouncing instead of spelled-out. I\'d implement it in the normalization stage as a surgical, scoped regex: match ONLY the laugh token, guarded with lookbehind/lookahead so it can\'t eat the "shi" in "shirt" or "shine," replace just that span, and leave the rest of the sentence intact so "Shishishi, let\'s go!" becomes "Shi hi hi hi ha ha ha! let\'s go!" — then tidy any doubled punctuation at the seam. Crucially it operates on the spoken string only, so the on-screen caption still reads the stylized "Shishishi!" while the audio performs the real thing. This is cheap, deterministic (cache-friendly), and runs on the CPU workhorse — ideal for a laugh that recurs hundreds of times. I\'d reserve strategy 2 — generating a genuinely organic laugh with Bark and freezing the best take as a fixed asset — for a rare hero beat where a real gut-laugh carries a moment, because Bark is slow, GPU-hungry, nondeterministic, and awkward to embed mid-sentence. So: rewrite for the everyday catchphrase, Bark-and-freeze for the one big signature laugh, and audition a couple of spellings for the rewrite until it lands.'
    },
    {
      q: 'What\'s the general principle behind handling non-verbals, and how do you decide between the two strategies across a whole project?',
      a: 'The general principle is that non-verbals expose a mismatch between what the content demands (performance of a sound) and what a standard TTS engine does (pronunciation of words), and every solution is really "resolve the mismatch" — either change the INPUT into something the pronunciation engine can voice that sounds like the non-verbal (rewrite), or change the ENGINE to one that actually performs non-verbals (generate). Neither is universally right; you decide per non-verbal by frequency and stakes. Rewrite when it\'s recurring and embedded in normal speech — it must be cheap, deterministic, consistent across many lines, and sit inside sentences, all of which the rewrite nails on the fast CPU path with zero per-line cost; a character who laughs constantly is the archetype. Generate-and-freeze when it\'s a rare, high-stakes beat where genuine organic quality carries a moment and it happens seldom enough to curate offline — run Bark, audition takes, freeze the best as a fixed asset so its nondeterminism is spent once and playback is deterministic. Across a project this means most non-verbals go through cheap normalization rewrites, and a small curated set of signature moments get the Bark-and-freeze treatment, sometimes split-and-stitched into a line as their own clip (which the one-clip-per-line architecture makes a sequencing problem, not a splicing one). The decision framework is the same match-the-tool-to-the-request discipline as engine routing: don\'t reach for the "realest" tool by default, because the rewrite decisively wins the common case (recurring, embedded, deterministic) on exactly the axes that matter there, while Bark wins only the rare case where organic quality outweighs cost and consistency. Getting this right is mostly about correctly classifying each non-verbal as everyday-vs-signature and applying the cheaper tool wherever it suffices — which is most of the time.'
    }
  ]
};
