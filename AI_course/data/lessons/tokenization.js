window.LESSONS = window.LESSONS || {};
window.LESSONS['tokenization'] = {
  id: 'tokenization',
  title: 'Tokenization: From Words to BPE Subwords',
  category: 'Part 4 — NLP',
  timeMin: 55,
  summary: 'Models eat numbers, not text — so the very first decision in any NLP system is how to chop text into units. Words? Vocabulary explodes and new words break everything. Characters? Sequences get huge and units carry no meaning. The answer powering every modern LLM is subwords, learned by Byte-Pair Encoding: merge the most frequent pair, repeat. You will implement the real algorithm in this lesson\'s lab.',
  goals: [
    'Explain the word-level vs character-level dilemma and why subwords are the sweet spot',
    'Run the BPE training algorithm by hand: count pairs, merge the most frequent, repeat',
    'Tokenize an unseen word with learned merges and explain why OOV (out-of-vocabulary) disappears',
    'Connect token IDs to the embedding table — what the model actually receives',
    'Explain LLM quirks caused by tokenization: letter counting, arithmetic, multilingual cost differences'
  ],
  concept: [
    {
      h: 'The first, unavoidable decision: what is a unit of text?',
      p: [
        'Every model in Parts 3–7 consumes vectors. Text must become a sequence of integers ("token IDs"), each pointing to a row of an embedding table (next lesson). The tokenizer is the component that makes this cut, and it is decided BEFORE training — the model is then stuck with it forever. Bad news travels far: an awkward tokenization of numbers or code haunts a model for its entire life.',
        '<b>Option A — words</b>: split on spaces/punctuation. Problems: the vocabulary is unbounded (every typo, name, plural, and new coinage — "rizz", "COVID-19" — is a new word); English morphology alone (run/runs/running/runner) multiplies entries that share obvious structure; and any word not in the vocabulary at training time becomes a useless <b>&lt;UNK&gt;</b> token at test time — the out-of-vocabulary (OOV) problem. A 170k-word dictionary still can\'t spell "Vegapunk".',
        '<b>Option B — characters</b>: ~100 symbols, nothing is ever OOV. But sequences become 5× longer (attention\'s O(n²) cost, remember, quadruples×6), and a single character carries almost no meaning — the model must burn layers just reassembling "s-h-i-p" before it can think about ships.',
        '<b>Option C — subwords</b>: keep whole common words as single tokens ("the", "ship"), split rare words into meaningful fragments ("Vegapunk" → "Vega" + "punk", "unhappiness" → "un" + "happi" + "ness"). Frequent things get short encodings, rare things stay representable — the compression principle from the information-theory lesson, applied to vocabulary design. Every modern LLM — GPT, Claude, Llama — uses subwords.'
      ]
    },
    {
      h: 'BPE: the merge loop that learns a vocabulary',
      p: [
        'Byte-Pair Encoding learns WHICH subwords, purely from corpus statistics. Training: start with words split into characters; then repeat — count every adjacent symbol pair across the corpus, MERGE the most frequent pair into a new single symbol everywhere, record the merge — until you\'ve done k merges (k ≈ 30,000–100,000 in real vocabularies).',
        '<div class="math">repeat k times:&nbsp;&nbsp;(a, b) ← most frequent adjacent pair&nbsp;&nbsp;→&nbsp;&nbsp;merge every "a b" into "ab"<span class="mnote">the entire training algorithm. The learned artifact is just the ordered LIST of merges.</span></div>',
        'Worked example (the classic from the Hugging Face course — and your lab). Corpus word counts: hug×10, pug×5, pun×12, bun×4, hugs×5. Start from characters. Pair counts: (u,g) appears 10+5+5 = 20 times — merge #1: "ug". Recount: (u,n) now 12+4 = 16 — merge #2: "un". Recount: (h,ug) = 15 — merge #3: "hug". After three merges the vocabulary is {b,g,h,n,p,s,u, ug, un, hug}: common chunks became single tokens, in frequency order.',
        '<b>Tokenizing new text</b> replays the same merges in the same order: "bug" → b,u,g → apply merge #1 → ["b","ug"]. "hugs" → ["hug","s"]. Even the never-seen "mug" → ["m","ug"] — no OOV, because in the worst case a word falls back to characters (real systems use bytes, so literally ANY string — emoji, Klingon, binary — tokenizes; that\'s the "byte-level BPE" GPT models use).'
      ]
    },
    {
      h: 'From tokens to what the model actually sees',
      p: [
        'The full pipeline: text → (pre-tokenize on whitespace-ish boundaries) → BPE merges → tokens → <b>token IDs</b> (each token\'s index in the vocabulary) → <b>embedding lookup</b> (ID i selects row i of a learned matrix — the model\'s first layer, next lesson). "The ship sails" might become [464, 4074, 33681], and those three integers are ALL the model receives — it never sees letters, spacing, or your formatting.',
        'Special tokens ride along: &lt;BOS&gt;/&lt;EOS&gt; mark sequence boundaries, &lt;PAD&gt; fills batches to equal length, and chat models add role markers (&lt;|user|&gt;, &lt;|assistant|&gt;) — the "chat template" you\'ll meet in Part 6. And note the trade-off knob: a BIGGER vocabulary means shorter sequences (cheaper attention, longer effective context) but a bigger embedding table and rarer training signal per token; 32k–128k is the modern range, and the fact that a Llama and a GPT tokenizer disagree means token counts — and API prices — differ across providers for the same text.',
        'Siblings you\'ll see named: <b>WordPiece</b> (BERT — merges chosen by likelihood gain rather than raw frequency, "##" marks word-internal pieces) and <b>SentencePiece/Unigram</b> (Llama, T5 — starts from a huge candidate set and PRUNES to maximize corpus likelihood; treats spaces as "▁" so no pre-tokenization needed). Same destination — a learned subword vocabulary — different search strategy. Knowing the names and one-line differences is interview-sufficient.'
      ]
    },
    {
      h: 'Tokenization explains half of the weird LLM behaviors',
      p: [
        'Once you know models see token IDs, whole families of LLM quirks stop being mysterious. <b>Letter counting</b> ("how many r\'s in strawberry?"): the model sees maybe ["str","aw","berry"] — the letters are not individually present in its input; it must have MEMORIZED spelling facts rather than read them. <b>Arithmetic</b>: "12345" might split as ["123","45"] while "12346" splits as ["12","346"] — inconsistent chunking sabotages digit-wise algorithms (modern tokenizers special-case digits into fixed groups for exactly this reason). <b>Multilingual inequity</b>: a tokenizer trained mostly on English needs ~1 token per English word but 3–5 per word for Burmese or Khmer — same sentence, several× the cost, latency, and context consumption. <b>Trailing-space traps</b>: "hello" and " hello" are DIFFERENT tokens; prompt formatting genuinely changes model behavior. <b>Glitch tokens</b> (the famous "SolidGoldMagikarp"): junk strings that got vocabulary slots from web data but almost never appeared in training — their embeddings are untrained noise, and feeding them produces bizarre outputs.',
        'This is why "it\'s probably the tokenizer" is a serious debugging hypothesis in LLM work, and why interviews for LLM-engineer roles reliably include one tokenization question. When you meet context-window limits ("8k tokens"), API pricing ("$/1M tokens"), or max_new_tokens knobs later in this course — those are all counted in the units this lesson defined.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'How Robin reads a language nobody speaks',
      text: 'The Poneglyphs are written in a script no living person was taught. How does Robin read them? Consider her options. A dictionary of every ancient WORD is impossible — each new stone contains words she has never seen (the OOV problem: a word-level dictionary breaks the first time "Joy Boy" appears on a new stone). Reading glyph-by-glyph — pure characters — always works but is agonizing: individual glyphs mean nothing alone, and a wall of stone takes weeks. What Ohara\'s scholars actually built, over decades, is a lexicon of FRAGMENTS — and they built it exactly the way BPE does: by frequency. Combing every rubbing in the Tree of Knowledge, they noticed which glyph pairs appear together constantly. The pair meaning "sea" appears thousands of times — fuse it, treat it as one unit. Then the fused "sea"-chunk keeps appearing before the fragment meaning "king" — fuse again: "sea-king", one unit. Rare sequences never get fused; they stay decomposed into pieces. After years of this, common concepts read at a glance (one token) while any NEW word on a fresh stone — "Zunesha", "Laugh Tale" — decomposes into fragments she already knows: never stuck, never &lt;UNK&gt;, just slower on rare words — which is precisely the graceful degradation subword tokenizers buy. And here\'s the detail that makes Robin the perfect mascot for this lesson: the lexicon was FROZEN when Ohara burned. Whatever fragment choices the scholars made, Robin lives with forever — she reads modern names awkwardly, chopped into pieces chosen for an ancient corpus. A model is stuck with its tokenizer the same way: chosen before training, baked in for life, quietly shaping what is easy and what is hard to read.'
    },
    sitcom: {
      show: 'TBBT',
      title: 'Howard\'s Mandarin: wrong merges, wrong meaning',
      text: 'Howard decides to learn Mandarin to confront the Szechuan Palace over the "tangerine chicken". He memorizes syllable chunks — but he chunks them WRONG. Mandarin is unforgiving about unit boundaries: shift where one unit ends and the next begins (or its tone), and "I want to complain about the chicken" becomes, in Howard\'s proud delivery, "show me your mucus" and "your monkey sleeps inside me". Same audio stream, different segmentation, catastrophically different token sequence. That is a tokenizer bug in a human: meaning does not live in the raw stream — it lives in the UNITS you cut it into, and a bad cutter poisons everything downstream no matter how good the model behind it is (Howard\'s brain is fine; his tokenizer is broken). Sheldon, naturally, learns the writing system instead and lectures that Chinese characters are "morphemic units — nearly ideal tokens". For once, Sheldon is making the lesson\'s exact point: pick units that carry meaning, sized by frequency of use.'
    },
    why: 'Robin\'s fragment lexicon IS BPE: fuse the most frequent pairs, keep fusing, and new words decompose into known pieces instead of breaking (no OOV) — while the frozen-at-Ohara lexicon captures "the tokenizer is chosen before training and baked in for life". Howard\'s mucus order is the one-liner for why tokenization matters at all: same stream, wrong cuts, ruined meaning. Recite the merge loop over the hug/pug corpus once out loud and you own this topic in interviews.'
  },
  storyAnim: {
    title: 'BPE in action: the hug/pug corpus, three merges',
    h: 250,
    props: [
      { id: 'corpus', emoji: '📚', label: 'hug×10 pug×5 pun×12 bun×4 hugs×5', x: 50, y: 10 },
      { id: 'p1', emoji: '🧩', label: '(u,g): 20', x: 20, y: 38 },
      { id: 'p2', emoji: '🧩', label: '(u,n): 16', x: 50, y: 38 },
      { id: 'p3', emoji: '🧩', label: '(h,ug): 15', x: 80, y: 38 },
      { id: 'vocab', emoji: '📖', label: 'vocab: b g h n p s u', x: 30, y: 66 },
      { id: 'newword', emoji: '✨', label: 'new word: "bug"', x: 78, y: 66 }
    ],
    actors: [
      { id: 'robin', emoji: '🌸', label: 'Robin', x: 8, y: 85 }
    ],
    steps: [
      { c: 'Start: every word split into characters. h-u-g, p-u-g, p-u-n, b-u-n, h-u-g-s. The vocabulary is just the 7 letters.', p: { corpus: 'lit' } },
      { c: 'Count every adjacent pair across the corpus, weighted by word frequency. (u,g) appears in hug, pug, hugs: 10+5+5 = 20 — the champion.', p: { p1: 'lit' } },
      { c: 'MERGE #1: every "u g" becomes one symbol "ug". The corpus is now h-ug, p-ug, p-u-n, b-u-n, h-ug-s. Recount pairs from scratch.', p: { p1: 'good', vocab: 'lit' }, l: { vocab: 'vocab: … + ug' } },
      { c: 'Now (u,n) leads with 12+4 = 16 → MERGE #2: "un". Then (h,ug) leads with 15 → MERGE #3: "hug". Common chunks become single tokens, in frequency order.', p: { p2: 'good', p3: 'good' }, l: { vocab: 'vocab: … + ug, un, hug' } },
      { c: 'Tokenizing NEW text replays the merges in order: "bug" → b-u-g → (merge 1) → ["b","ug"]. Never seen, never broken — no OOV.', p: { newword: 'good' }, l: { newword: '"bug" → [b, ug] ✓' } },
      { c: 'Robin\'s Poneglyph lexicon, same algorithm: fuse the most frequent glyph pairs for years, then read any new stone by decomposing into known fragments. Frequent = one glance; rare = a few pieces; stuck = never.', a: { robin: [50, 85] }, p: { corpus: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: the hug/pug corpus',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Start',
        nodes: [
          { id: 'corpus', text: 'Corpus, split into characters\nhug×10 pug×5 pun×12 bun×4 hugs×5' },
        ],
      },
      {
        label: 'Count pairs',
        nodes: [
          { id: 'counts', text: 'Adjacent pair counts\n(u,g)=20  (u,n)=16  (h,ug)=15' },
        ],
      },
      {
        label: 'Merge loop',
        nodes: [
          { id: 'merge1', text: 'Merge #1\n"ug" — (u,g) wins with 20' },
          { id: 'merge2', text: 'Merge #2\n"un" — (u,n) now leads with 16' },
          { id: 'merge3', text: 'Merge #3\n"hug" — (h,ug) now leads with 15' },
        ],
      },
      {
        label: 'Tokenize new text',
        nodes: [
          { id: 'newword', text: 'Replay merges on "bug"\nb-u-g → [b, ug] — never seen, never OOV' },
        ],
      },
    ],
    steps: [
      { active: ['corpus'], note: 'Training starts with every word split into characters — h-u-g, p-u-g, p-u-n, b-u-n, h-u-g-s. The vocabulary is just the 7 letters.' },
      { active: ['counts'], note: 'Count every adjacent symbol pair across the corpus, weighted by word frequency. (u,g) appears in hug, pug, hugs: 10+5+5 = 20 — the champion.' },
      { active: ['merge1'], note: 'MERGE #1: every "u g" fuses into one symbol "ug", everywhere in the corpus. The corpus is now h-ug, p-ug, p-u-n, b-u-n, h-ug-s.' },
      { active: ['merge2', 'merge3'], note: 'Recount from scratch: (u,n) now leads with 12+4=16 → merge "un". Recount again: (h,ug) leads with 15 → merge "hug". Common chunks become single tokens, in frequency order.' },
      { active: ['newword'], note: 'Tokenizing NEW text just replays the merges in order: "bug" → b-u-g → apply merge #1 → ["b","ug"]. Never seen in training, never broken — that\'s how OOV disappears.' },
    ],
  },
  tech: [
    {
      q: 'What exactly does tokenizer(text) return in Hugging Face, and what do the pieces mean?',
      a: 'tokenizer("the ship sails") returns a dict: input_ids — the token IDs, the only thing the model semantically consumes; attention_mask — 1 for real tokens, 0 for padding, so batched sequences of unequal length don\'t attend to filler (the mask feeds into attention in Part 5); and for some models token_type_ids (BERT\'s sentence-A/B flag). Round-tripping is instructive: tokenizer.tokenize() shows the subword strings ("sails" might be ["sa","ils"]), .convert_tokens_to_ids() shows the integers, .decode() reassembles text. Two flags that bite: add_special_tokens=True silently prepends/appends things like [CLS]/&lt;s&gt;, and padding/truncation control how sequences fit the model\'s max length. Golden rule: ALWAYS use the tokenizer shipped with the checkpoint — IDs are meaningless under any other vocabulary; mixing tokenizer A with model B produces confident garbage.'
    },
    {
      q: 'Why do GPT-style models use BYTE-level BPE instead of character-level?',
      a: 'Unicode has ~150k characters; a character baseline would already be a huge vocabulary, and brand-new characters (emoji added in 2027) would still be OOV. Bytes fix both: every string in existence is a sequence of UTF-8 bytes, and there are exactly 256 of them — so with bytes as the BPE floor, the tokenizer can represent ANY input (any language, emoji, binary junk, malformed text) with a base vocabulary of 256, and merges build up from there. Cost: non-Latin scripts start as multi-byte sequences (a single CJK character is 3 bytes), so they lean harder on merges learned from training data — which is exactly why under-represented languages tokenize into more tokens. GPT-2 introduced this recipe (with a byte↔printable-character remapping quirk you\'ll notice as "Ġ" prefixes in vocab dumps, standing for a leading space); tiktoken is OpenAI\'s fast implementation of the same idea.'
    },
    {
      q: 'How should I choose vocabulary size, and what does the choice actually trade?',
      a: 'Vocab size k sets where you sit between characters (k=256) and words (k=∞). Bigger k: text compresses into FEWER tokens — sequences shorten, attention\'s O(n²) shrinks, effective context lengthens, API costs (per token) drop, and generation takes fewer steps. But: the embedding table and output softmax grow linearly in k (at 128k vocab and d=4096, that\'s half a billion parameters in the embedding alone), rare tokens get little training signal (their embeddings stay half-trained — glitch-token territory), and multilingual coverage competes for slots. Practice: 32k (Llama 2) → 100k (GPT-4) → 128k+ (Llama 3, Gemma) as models became more multilingual and compute-rich; ~4 characters/token or ~0.75 words/token is the English rule of thumb for estimating costs. For a domain model (code, chemistry), training a domain tokenizer buys real compression — generic tokenizers waste tokens spelling out SMILES strings character by character.'
    },
    {
      q: 'Why can\'t GPT reliably count the r\'s in "strawberry", and why does this matter beyond trivia?',
      a: 'Because "strawberry" reaches the model as something like ["str","aw","berry"] — three opaque IDs. The letters r-r-r are not present in the input as separate entities; asking the model to count them is like asking you how many times the letter e appears in a word you\'ve only ever HEARD — you must recall spelling knowledge, not read it off. Models do memorize a lot of spelling from training data (they see words spelled out in tutorials, acrostics, etc.), so they often get it right — but it\'s recall, not inspection, hence unreliable. The general principle matters for real engineering: any task requiring sub-token structure — character-level string manipulation, precise digit arithmetic, rhyming/syllables, IPA phonetics — fights the tokenization. Mitigations: spell the input out ("s t r a w b e r r y" — now each letter IS a token), use tools/code execution for exact string/math ops (the agent pattern of Part 7), or for arithmetic rely on modern digit-grouped tokenizers. Interviewers love this question because the correct answer demonstrates you know what the model actually receives.'
    }
  ],
  code: {
    title: 'Poking real tokenizers',
    intro: 'Ten minutes of this — feeding strings to real tokenizers and staring at the pieces — teaches more intuition than any diagram. Run locally: pip install transformers tiktoken.',
    code: `from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")        # byte-level BPE, 50257 tokens

print(tok.tokenize("The ship sails tomorrow"))
# ['The', 'Ġship', 'Ġsails', 'Ġtomorrow']          Ġ = leading space (byte-BPE quirk)
print(tok("The ship sails tomorrow")["input_ids"])  # [464, 4074, 33681, 11475]

print(tok.tokenize("Vegapunk unhappiness"))
# ['Ve', 'gap', 'unk', 'Ġunh', 'appiness']          rare words -> fragments, no <UNK>

print(tok.tokenize("strawberry"))                   # ['st', 'raw', 'berry']
print(tok.tokenize(" strawberry"))                  # ['Ġstrawberry']  <- space changes everything!

print(tok.tokenize("12345 + 12346"))                # digit chunking is inconsistent in gpt2
print(len(tok.tokenize("I ate lunch")))             # 3 tokens of English...
print(len(tok.tokenize("ฉันกินข้าวเที่ยง")))          # ~15+ tokens of Thai: token inequity

# modern comparison: tiktoken (GPT-4 family)
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
print(enc.encode("The ship sails tomorrow"))        # different IDs — vocabularies don't mix!
print(enc.decode([791, 8448]))                       # decode round-trip`,
    notes: [
      'The " strawberry" vs "strawberry" line is the trap that bites real systems: prompts that end with/without a space produce different first tokens and measurably different completions.',
      'Different tokenizer = different ID space. 464 means "The" to GPT-2 and something unrelated to Llama. Checkpoints and tokenizers travel together, always.',
      'The Thai line quantifies token inequity: the same lunch sentence costs ~5× the tokens — hence ~5× the API price and context budget.',
      'Try tok.decode([id]) on single IDs from your own text — watching words reassemble from fragments makes the whole pipeline concrete.'
    ]
  },
  lab: {
    title: 'Implement real BPE: learn merges, tokenize new words',
    prompt: 'Pure Python — you are writing the actual algorithm behind GPT\'s tokenizer. Implement (1) <code>pair_counts(words)</code> — words is a dict mapping a tuple of symbols to its count (e.g. {("h","u","g"): 10, ...}); return a dict of adjacent-pair → total count across the corpus; (2) <code>merge_pair(words, pair)</code> — return a new words dict where every adjacent occurrence of the pair is fused into one symbol (a+b → "ab"); (3) <code>learn_bpe(words, k)</code> — run k rounds of count→pick-best→merge, returning the ordered list of merged pairs (break count ties by choosing the lexicographically smallest pair, so results are deterministic); (4) <code>tokenize(word, merges)</code> — split a new word string into characters, then replay each merge in order, returning the final token list.',
    starter: `def pair_counts(words):
    # words: {("h","u","g"): 10, ...}
    # return {("u","g"): 20, ...} summed over all words, adjacent symbols only
    ...

def merge_pair(words, pair):
    # fuse every adjacent (a, b) into "ab" in every word; return the new dict
    ...

def learn_bpe(words, k):
    merges = []
    # k times: counts = pair_counts(...); best = max by (count, then lexicographically smallest)
    #          words = merge_pair(words, best); merges.append(best)
    ...
    return merges

def tokenize(word, merges):
    # start from list(word); for each merge (a, b) in order, fuse adjacent a,b -> "ab"
    ...`,
    checks: [
      { re: 'def\\s+learn_bpe\\s*\\(', must: true, hint: 'Define learn_bpe(words, k) — the training loop.', pass: 'learn_bpe defined' },
      { re: 'def\\s+tokenize\\s*\\(', must: true, hint: 'Define tokenize(word, merges) — replay merges on new text.', pass: 'tokenize defined' },
      { re: 'pair_counts\\s*\\(', flags: 'g', must: true, hint: 'learn_bpe should reuse your pair_counts() each round.', pass: 'count→merge loop wired' },
      { re: 'import\\s+(transformers|tiktoken)', must: false, hint: 'No libraries — the point is to BE the tokenizer.', pass: 'From scratch ✓' }
    ],
    tests: `# the Hugging Face course corpus: hug×10 pug×5 pun×12 bun×4 hugs×5
words = {("h","u","g"): 10, ("p","u","g"): 5, ("p","u","n"): 12,
         ("b","u","n"): 4, ("h","u","g","s"): 5}

pc = pair_counts(words)
assert pc[("u","g")] == 20, f'(u,g) should total 20, got {pc.get(("u","g"))}'
assert pc[("u","n")] == 16 and pc[("h","u")] == 15

m = merge_pair({("h","u","g"): 2}, ("u","g"))
assert m == {("h","ug"): 2}, f"merge failed: {m}"

merges = learn_bpe(dict(words), 3)
assert merges == [("u","g"), ("u","n"), ("h","ug")], f"wrong merge order: {merges}"

assert tokenize("hug", merges) == ["hug"]
assert tokenize("bug", merges) == ["b","ug"], "unseen word decomposes into known pieces"
assert tokenize("hugs", merges) == ["hug","s"]
assert tokenize("mug", merges) == ["m","ug"], "never-seen letter m falls back gracefully"
assert tokenize("pun", merges) == ["p","un"]
print("You just trained GPT's tokenizer (scale: 3 merges down, 99,997 to go).")`,
    runnable: true,
    solution: `def pair_counts(words):
    counts = {}
    for word, n in words.items():
        for a, b in zip(word, word[1:]):
            counts[(a, b)] = counts.get((a, b), 0) + n
    return counts

def merge_pair(words, pair):
    a, b = pair
    out = {}
    for word, n in words.items():
        merged, i = [], 0
        while i < len(word):
            if i + 1 < len(word) and word[i] == a and word[i + 1] == b:
                merged.append(a + b)
                i += 2
            else:
                merged.append(word[i])
                i += 1
        out[tuple(merged)] = out.get(tuple(merged), 0) + n
    return out

def learn_bpe(words, k):
    merges = []
    for _ in range(k):
        counts = pair_counts(words)
        if not counts:
            break
        top = max(counts.values())
        best = sorted(p for p in counts if counts[p] == top)[0]
        words = merge_pair(words, best)
        merges.append(best)
    return merges

def tokenize(word, merges):
    toks = list(word)
    for pair in merges:
        a, b = pair
        i, out = 0, []
        while i < len(toks):
            if i + 1 < len(toks) and toks[i] == a and toks[i + 1] == b:
                out.append(a + b)
                i += 2
            else:
                out.append(toks[i])
                i += 1
        toks = out
    return toks`,
    notes: [
      'Note that tokenize() reuses the merge logic on a single word — training and inference share the same primitive, just as in real implementations.',
      'Real BPE differs only in scale and bookkeeping: bytes instead of characters as the floor, pre-tokenization to stop merges crossing word boundaries, and incremental pair-count updates instead of full recounts (recounting everything per merge is O(corpus × k) — fine for 5 words, ruinous for 5 TB).',
      'Try tokenize("pugs", merges): ["p","ug","s"] — three learned fragments handle a word the corpus never contained. That graceful decomposition is the whole reason subwords won.'
    ]
  },
  quiz: [
    {
      q: 'What is the core problem with word-level tokenization that subwords solve?',
      options: ['Unbounded vocabulary and OOV: unseen words (names, typos, new coinages) become useless <UNK> tokens, while subwords decompose them into known pieces', 'Words are too short for the model to process', 'Word tokenizers cannot handle English', 'Subwords are required by GPU hardware'],
      correct: 0,
      explain: 'The vocabulary can never contain every future word. Subwords guarantee coverage: worst case, a word falls back to characters/bytes. Robin never hits a glyph she can\'t decompose.'
    },
    {
      q: 'In BPE training, what happens at each step?',
      options: ['The most frequent adjacent symbol pair in the corpus is merged into one new symbol, and the merge is recorded', 'The longest word is split in half', 'The rarest pair is removed from the vocabulary', 'A neural network predicts the best split'],
      correct: 0,
      explain: 'Count pairs → merge the winner → repeat. The artifact is the ordered merge list; tokenizing new text replays it in order. Purely statistical — no neural network involved in BPE itself.'
    },
    {
      q: 'The corpus contains hug×10, pug×5, pun×12, bun×4, hugs×5 (split into characters). The FIRST BPE merge is:',
      options: ['(u,g) — it appears 10+5+5 = 20 times', '(u,n) — it appears 16 times', '(h,u) — hug is the most iconic word', '(p,u) — p starts the most words'],
      correct: 0,
      explain: '(u,g) occurs in hug (10), pug (5), and hugs (5) = 20 — the highest total. (u,n) at 16 wins round two. Frequency decides everything; run your lab code to watch it.'
    },
    {
      q: 'Why does an LLM struggle to count the letters in a word it can define perfectly?',
      options: ['The word arrives as a few opaque subword IDs — individual letters are not present in the input, so counting requires memorized spelling, not reading', 'The model\'s vocabulary is too small', 'Letters are removed by the attention mask', 'Counting requires a decoder-only architecture'],
      correct: 0,
      explain: '"strawberry" ≈ ["str","aw","berry"] — three integers. Meaning was learned per-token; the internal letters were never separately visible. Spell it out with spaces and the model suddenly counts fine.'
    },
    {
      q: 'Doubling the vocabulary size from 32k to 64k most directly buys… at the cost of…',
      options: ['Shorter token sequences (cheaper attention, more effective context) — at the cost of a bigger embedding table and less training signal per rare token', 'Higher model accuracy — at the cost of slower tokenization', 'Better multilingual grammar — at the cost of English performance', 'Nothing: vocabulary size only affects disk usage'],
      correct: 0,
      explain: 'More merges = more text per token = shorter sequences (O(n²) attention notices). But embeddings/softmax grow with k, and tail tokens train poorly (glitch-token risk). 32k–128k is the modern balance.'
    }
  ],
  testFlow: {
    title: 'Test yourself: BPE tokenization',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Corpus: hug×10, pug×5, pun×12, bun×4, hugs×5 (split into characters). What is the FIRST BPE merge, and why?',
        choices: [
          { text: '(u,g) — it totals 10+5+5 = 20 occurrences, the highest of any pair', to: 'q1_right' },
          { text: '(u,n) — it totals 16 occurrences', to: 'q1_wrong_un' },
          { text: '(h,u) — "hug" is the most iconic word in the corpus', to: 'q1_wrong_hu' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — (u,g) appears in hug (10), pug (5), and hugs (5) = 20, beating every other pair. BPE always merges whichever pair has the highest total count, full stop — no notion of "importance".', next: 'q2' },
      q1_wrong_un: { end: true, correct: false, text: '(u,n) totals 12+4=16 — real, but smaller than (u,g)\'s 20. It wins round TWO, after (u,g) is already merged and removed from the count.', retry: 'q1' },
      q1_wrong_hu: { end: true, correct: false, text: 'BPE has no concept of a word being "iconic" — it is pure frequency counting over ADJACENT pairs. (h,u) isn\'t even the top pair once you count correctly: (u,g) at 20 wins.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'After training on that corpus, the tokenizer sees the brand-new word "mug" (never in training). What happens?',
        choices: [
          { text: 'It falls back to known fragments — "mug" → [m, ug], since "ug" was learned as a merge', to: 'q2_right' },
          { text: 'It becomes a single <UNK> token, same as word-level tokenizers', to: 'q2_wrong_unk' },
          { text: 'Tokenization fails with an error — the tokenizer has never seen "mug"', to: 'q2_wrong_error' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — replay the learned merges in order: "mug" → m-u-g → merge #1 applies to "u g" → ["m","ug"]. The novel letter "m" just stays a single character. Worst case, subwords fall all the way back to characters/bytes — that\'s why OOV is eliminated by construction.', next: 'q3' },
      q2_wrong_unk: { end: true, correct: false, text: 'That\'s exactly the word-level failure mode subwords were built to avoid. BPE never needs <UNK> for a word made of known characters — it just decomposes into smaller known pieces.', retry: 'q2' },
      q2_wrong_error: { end: true, correct: false, text: 'No error — every merge is just a character-pair replacement, and any string can be split into its base characters (or bytes) even with zero learned merges applying. Graceful degradation, not failure.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why does an LLM often fail to count the letters in "strawberry" even though it can define the word perfectly?',
        choices: [
          { text: 'The word arrives as a few opaque subword IDs (e.g. ["str","aw","berry"]) — individual letters were never separately present in the input', to: 'q3_right' },
          { text: 'The model\'s vocabulary is too small to include long words', to: 'q3_wrong_vocab' },
          { text: 'Counting letters requires a much larger model', to: 'q3_wrong_size' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — the model receives token IDs, not letters. Counting r\'s requires recalling memorized spelling rather than reading it off the input, which is why it\'s unreliable. Spell the word out with spaces and each letter becomes its own token — the model suddenly counts fine.', next: null },
      q3_wrong_vocab: { end: true, correct: false, text: 'Vocabulary size is irrelevant here — "strawberry" tokenizes into a handful of subword IDs regardless of vocab size. The issue is that those IDs are opaque wholes, not that the word doesn\'t fit.', retry: 'q3' },
      q3_wrong_size: { end: true, correct: false, text: 'Model size doesn\'t fix this — it\'s a structural input-representation issue, not a capacity issue. Even a much larger model still receives the same opaque subword IDs and must recall spelling rather than inspect it.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Using a different tokenizer than the model checkpoint\'s. Token IDs are meaningless across vocabularies — the model receives well-formed nonsense and outputs the same. AutoTokenizer.from_pretrained(same-name) is not optional.',
    'Forgetting that whitespace is part of the token. " hello" ≠ "hello" in byte-BPE; a prompt ending in a space steers the model differently than one that doesn\'t. When completions look subtly wrong, check the boundary.',
    'Counting length in characters or words when the limit is in tokens. Context windows, truncation, and pricing are token-denominated: ~4 chars/token in English, worse elsewhere. Measure with the real tokenizer, not len(text)//4, when it matters.',
    'Expecting character-level skills (reversing strings, counting letters, precise digit ops) from token-level models — and shipping features that depend on them. Route those to code execution.',
    'Ignoring token inequity in multilingual products: the same feature costs 3–5× more tokens in some languages — latency, price, and context budgets all skew. Measure per-language before promising parity.',
    'Assuming tokenizers are interchangeable "preprocessing". The tokenizer is a frozen, load-bearing model component chosen before pretraining; changing it post-hoc means retraining embeddings at minimum. Treat it with checkpoint-level respect.'
  ],
  interview: [
    {
      q: 'Compare word, character, and subword tokenization. Why did subwords win?',
      a: 'Word-level: intuitive units and short sequences, but an unbounded vocabulary (every name, typo, inflection, and neologism), wasted parameters on near-duplicates (run/running/ran), and a hard OOV failure — unseen words collapse to <UNK>, destroying information at inference. Character-level: tiny vocabulary and zero OOV, but sequences grow ~5×, which quadratically inflates attention cost, and units carry no semantics, forcing the model to spend capacity reassembling morphemes. Subwords take both goods: frequent words stay whole (short sequences where it matters), rare words decompose into meaningful, reusable fragments (un+happi+ness), and with a byte-level base ANY string is representable — OOV is eliminated by construction. It\'s an information-theoretic compression argument: assign short codes (single tokens) to frequent strings, longer compositions to rare ones. Every production LLM — GPT (byte-level BPE), BERT (WordPiece), Llama (SentencePiece/BPE) — sits on this design.'
    },
    {
      q: 'Walk me through how BPE training and BPE tokenization work.',
      a: 'Training: split the corpus into words (pre-tokenization), each word into base symbols (characters, or bytes in GPT-style byte-level BPE). Loop k times: count all adjacent symbol pairs across the corpus weighted by word frequency; merge the single most frequent pair into a new symbol everywhere; append that pair to an ordered merge list. The vocabulary is the base symbols plus the k merge products; k sets the vocab size (30k–100k typically). Tokenization of new text: split into base symbols, then replay the learned merges IN TRAINING ORDER, fusing wherever each pair occurs; whatever remains is the token sequence. Concrete run: corpus hug×10, pug×5, pun×12, bun×4, hugs×5 gives merges (u,g)→20, then (u,n)→16, then (h,ug)→15; afterward "bug" tokenizes to [b, ug] and unseen "mug" to [m, ug] — graceful decomposition, no OOV. Two production details worth adding: merges never cross pre-token (word) boundaries, and real implementations update pair counts incrementally rather than recounting the corpus per merge.'
    },
    {
      q: 'What LLM failure modes are caused by tokenization, and how do you mitigate them in a product?',
      a: 'Character-blindness: sub-token structure is invisible — letter counting, string reversal, rhyme/syllable tasks fail unpredictably because "strawberry" is three opaque IDs; mitigate by spelling inputs out (making each character a token) or routing string ops to code execution. Arithmetic brittleness: inconsistent digit chunking breaks columnar algorithms; modern tokenizers group digits in fixed sizes, and tool-use is the robust answer for exact math. Whitespace/formatting sensitivity: " hello" and "hello" are different tokens, so trailing spaces and template glitches measurably change outputs — canonicalize prompts and test templates byte-exactly. Token inequity: under-represented languages cost 3–5× the tokens — budget context, latency, and price per language, or choose a model with a more multilingual vocabulary. Glitch tokens: vocabulary entries with near-zero training occurrences have untrained embeddings and trigger bizarre behavior — relevant to input sanitization and adversarial robustness. The meta-answer interviewers want: the model never sees text, only token IDs, so any capability claim must be evaluated in token space.'
    },
    {
      q: 'You\'re training a code-generation model. Would you reuse a general-purpose tokenizer or train your own? What changes?',
      a: 'Train (or at least extend) a code-aware tokenizer — the compression gains are too large to ignore. A general web-text tokenizer fragments code pathologically: four-space indents, camelCase identifiers, and common idioms (\"for (int i = 0;\") splinter into many tokens, wasting context window and compute on syntax the vocabulary could absorb. A tokenizer trained on code learns merges for indentation runs, common keywords/operators, and identifier fragments — real systems (Codex\'s updated vocab, StarCoder, Code Llama) do exactly this, with special tokens for structure (e.g., fill-in-the-middle markers like <PRE>/<SUF>/<MID>, file separators, repo metadata). The trade-offs to state: a new vocabulary means embeddings can\'t be reused from a text checkpoint (or need re-initialization/vocab-surgery for the added tokens), vocab slots spent on code compete with natural-language coverage (docstrings, comments), and evaluation must confirm the compression gain (tokens per line of code) translates to quality. Also mention whitespace fidelity: code tokenizers must preserve exact whitespace round-tripping, since Python semantics live in indentation — a lossy normalizer that\'s harmless for prose corrupts code.'
    }
  ]
};
