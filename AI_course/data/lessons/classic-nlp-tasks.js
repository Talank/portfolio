window.LESSONS = window.LESSONS || {};
window.LESSONS['classic-nlp-tasks'] = {
  id: 'classic-nlp-tasks',
  title: 'Classic NLP Tasks with Hugging Face Pipelines',
  category: 'Part 4 — NLP',
  timeMin: 40,
  summary: 'You now understand tokenization, embeddings, and attention from the inside. This lesson is the payoff: stop building from scratch and use the Hugging Face `pipeline()` API to get production-quality sentiment analysis, named entity recognition, summarization, question answering, and zero-shot classification in a few lines — while knowing EXACTLY what those lines are doing under the hood, because you built the pieces yourself.',
  goals: [
    'Explain what pipeline() bundles together: tokenizer → model forward pass → task-specific post-processing',
    'Distinguish the major NLP task shapes: sequence classification, token classification, span extraction, and generation',
    'Explain how zero-shot classification works without any labeled training data for the target labels (the NLI trick)',
    'Name the practical pitfalls: reloading pipelines per call, truncation limits, subword-fragmented entities',
    'Judge when an off-the-shelf pipeline is enough versus when the job calls for fine-tuning (bridges to Part 6)'
  ],
  concept: [
    {
      h: 'pipeline(): one function, five different task shapes',
      p: [
        'Every model you\'ve studied so far (word2vec, seq2seq+attention) needed you to wire up the forward pass by hand. Hugging Face\'s <code>transformers.pipeline(task, model=...)</code> hides that wiring: give it a task name and (optionally) a model name, and it downloads a matching tokenizer + pretrained model + post-processing logic, and hands you a callable. <code>pipeline("sentiment-analysis")("this movie was great")</code> returns a label and a confidence score — no manual tokenizing, no manual softmax, no manual argmax. That is not magic; it is exactly the pieces from the last three lessons (tokenizer → embedding lookup → transformer forward pass → task head) bolted together and packaged.',
        'The reason this lesson exists AFTER tokenization, word-embeddings, and seq2seq-attention rather than before: a pipeline() call that "just works" is far less mysterious once you know a tokenizer is doing BPE under the hood, that the model\'s hidden states are contextual embeddings, and that a "task head" is a small extra layer bolted onto a pretrained backbone. You\'re now qualified to open the hood, not just drive the car.'
      ]
    },
    {
      h: 'The task zoo: same backbone, different heads',
      p: [
        'Nearly every classic NLP task reuses the SAME pretrained transformer encoder (BERT-family, Part 5) and differs only in the small head bolted on top and how its output is decoded:',
        '<div class="math">sequence classification: pool → 1 label for the WHOLE input&nbsp;&nbsp;(sentiment, topic)<br>token classification: 1 label PER token&nbsp;&nbsp;(named entity recognition, part-of-speech)<br>span extraction: predict a START index and an END index&nbsp;&nbsp;(extractive question answering)<br>sequence generation: decode a NEW token sequence&nbsp;&nbsp;(summarization, translation — this lesson\'s seq2seq/attention machinery, at scale)<br>zero-shot: reuse a classification head TRAINED FOR SOMETHING ELSE&nbsp;&nbsp;(natural language inference, repurposed)<span class="mnote">five task shapes, one shared representation underneath — the whole story of transfer learning in one table</span></div>',
        '<b>Sentiment / topic classification</b> (<code>"sentiment-analysis"</code>, <code>"text-classification"</code>): the model pools the sequence into one vector (e.g. the [CLS] token\'s final hidden state — BERT territory, Part 5) and a linear+softmax head turns it into class probabilities. This is the multi-class output layer from the neural-networks lesson, wearing a transformer as its feature extractor.',
        '<b>Named entity recognition</b> (<code>"ner"</code>): a label is predicted for EVERY token — PERSON, ORG, LOCATION, or O ("outside any entity") — using a BIO tagging scheme (B-PER = begin a person entity, I-PER = inside/continue it, O = not an entity). "Monkey D. Luffy sailed from Foosha" tags as B-PER I-PER I-PER O O B-LOC. Because tokenizers split words into subwords (the BPE lesson), a raw model actually predicts one tag per SUBWORD token — <code>aggregation_strategy="simple"</code> merges "Mon", "##key", "D", "." back into one "Luffy"-adjacent entity span for you.',
        '<b>Extractive question answering</b> (<code>"question-answering"</code>): given a context passage and a question, the model doesn\'t generate free text — it predicts two numbers, a start index and an end index into the CONTEXT, and the answer is literally that substring. Two small heads (start-logits, end-logits) sit on top of the same per-token hidden states as NER, just interpreted differently.',
        '<b>Summarization / translation</b> (<code>"summarization"</code>, <code>"translation"</code>): these are full sequence-to-sequence generation, exactly the encoder-decoder-with-attention architecture from the seq2seq-attention lesson, just with a transformer encoder and decoder instead of RNNs, and trained on millions of document→summary or sentence→sentence pairs.'
      ]
    },
    {
      h: 'Zero-shot classification: the cleverest reuse in the zoo',
      p: [
        'What if you need to classify text into categories the model was never trained on — say, "is this Marine report about SMUGGLING, MUTINY, or SABOTAGE" — with zero labeled examples? <code>pipeline("zero-shot-classification")</code> does this with a trick, not new training: it reuses a model trained for <b>natural language inference (NLI)</b> — given a premise and a hypothesis, predict whether the hypothesis is ENTAILED, CONTRADICTED, or NEUTRAL relative to the premise. To classify text T against label L, it feeds the model premise=T, hypothesis="This example is about {L}." and reads off the entailment probability as "how much does label L fit". Repeat once per candidate label, rank by entailment score.',
        'This is a beautiful illustration of a theme running through this entire course: a model trained for task A (entailment) becomes a general-purpose tool for task B (arbitrary classification) because both tasks reduce to "does this pretrained representation of meaning support this claim" — the same transfer-learning instinct behind reusing word2vec vectors, reusing a CNN\'s learned filters, or fine-tuning a pretrained encoder instead of training from scratch (Part 6).'
      ]
    },
    {
      h: 'Engineering discipline: pipelines are not free lunches',
      p: [
        'Three practical failure modes separate "worked in a notebook" from "worked in production":',
        '<b>Reloading the model every call.</b> <code>pipeline(...)</code> loads weights (hundreds of MB to GBs) and warms up a tokenizer — do it ONCE at startup/module load, store the callable, and reuse it. Calling <code>pipeline("sentiment-analysis")(text)</code> inside a loop reloads the entire model every iteration; a 10ms inference turns into a 2-second one.',
        '<b>Truncation and long documents.</b> Transformer encoders have a maximum sequence length (classically 512 tokens for BERT-family models). Feed a 20-page report into a summarization pipeline and it silently truncates — the model literally never sees the ending. Production summarizers chunk long documents and either summarize-then-summarize-the-summaries, or use long-context architectures (Part 6 touches efficient attention).',
        '<b>Treating scores as calibrated probabilities.</b> A 0.97 confidence from a sentiment pipeline is not "97% chance this is correct" in any rigorous sense — recall the model-evaluation lesson\'s lesson that raw softmax outputs need calibration checks before you trust them for a threshold-based decision (fraud flags, content moderation) rather than a ranking.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Marine intake desk: one clerk, five stamps',
      text: 'Marine HQ receives hundreds of Transponder Snail reports a day from bases across the Grand Line, and Sengoku does not personally read each one — that job belongs to the intake desk, run by a single overworked clerk who has memorized the whole procedure so thoroughly that outsiders think it\'s one seamless skill. Hand her ANY report and she instantly: (1) transcribes the snail\'s garbled speech into clean text (the tokenizer), (2) reads it with the same trained instinct she uses on every report — an instinct built from years reading thousands of prior reports, never specific to any one base (the shared pretrained encoder) — and then (3) reaches for the RIGHT STAMP depending on what\'s needed. A "Threat Level" stamp reads the whole report and stamps ROUTINE or ALARMING in one motion (sequence classification — one label for the whole document). A "Circle the Names" stamp underlines every pirate name, ship name, and location as she reads word by word — B-PER, I-PER, B-LOC, one tag per word (NER, token classification), and she\'s smart enough to know "Mon-key D. Luf-fy" fragments are one person, not four (aggregation_strategy merging subwords). A "Quick Answer" stamp lets Sengoku ask "where did the incident happen?" and she points to the EXACT sentence fragment in the report rather than re-explaining it in her own words (extractive QA — a span, not a summary). A "Headline" stamp turns three pages into one sentence for the morning briefing (summarization — full generation, the seq2seq-attention machinery from last lesson, industrial-strength). And the day a brand-new crime shows up that was never in her training manual — say, a report about tampering with a Sea Train\'s rails, a category nobody anticipated — she doesn\'t freeze. She compares the report against a list of plausible new labels using the same "does this fact support this claim" instinct she uses for everything else (zero-shot via NLI: "this report is about SABOTAGE" — does the report ENTAIL that sentence?), and gets a usable answer with no retraining. One clerk, one underlying instinct, five different stamps depending on what Sengoku asked for. That IS pipeline(task=...).'
    },
    sitcom: {
      show: 'Friends',
      title: 'Chandler\'s inbox triage becomes five different jobs',
      text: 'Chandler\'s job (still famously undefined to everyone including, at times, Chandler) turns out to mostly be processing a flood of client emails, and he has quietly built five different mental "modes" for the same inbox. Mode one: skim an email and instantly know if the client is HAPPY or ABOUT TO ESCALATE (sentiment classification — one label per email). Mode two: read a rambling email and mentally underline every person\'s name and company mentioned so he can update the contact sheet (NER — one tag per word, and he\'s learned that "Mr. and Mrs. Geller-Green" is ONE household entry, not a fragmented mess — aggregation in action). Mode three: when his boss barges in demanding "what date did the client want delivery?" he doesn\'t summarize the whole email — he scrolls straight to the sentence with the date and reads THAT (extractive QA — the exact span, not a paraphrase). Mode four: he condenses an 800-word client thread into one line for the weekly status report (summarization). And then one week a client emails about something the company has literally never handled before — a request that doesn\'t fit any of Chandler\'s usual categories — and instead of shutting down, he compares it against the closest existing categories by asking "does this sound more like a BILLING issue or a CONTRACT issue" and ships a best guess (zero-shot classification, no training required, mild WENUS-adjacent confidence). Joey is baffled Chandler can do all five without "five different Chandlers." Chandler: one brain, five stamps — could this job BE any more like a transformer pipeline?'
    },
    why: 'The one picture that makes all five tasks click into the same frame: ONE shared "understanding" (the pretrained encoder\'s contextual representations) feeding FIVE different small output stamps — whole-sequence label, per-token label, span indices, generated text, or a repurposed entailment score. Learn the shared trunk once, and every new "pipeline(task=...)" you meet in the wild is just a different stamp on the same desk.'
  },
  storyAnim: {
    title: 'One clerk, five stamps',
    h: 260,
    props: [
      { id: 'snail', emoji: '🐌', label: 'incoming report', x: 8, y: 20 },
      { id: 'clean', emoji: '📝', label: 'clean text (tokenizer)', x: 30, y: 20 },
      { id: 'brain', emoji: '🧠', label: 'shared understanding (encoder)', x: 52, y: 20 },
      { id: 'threat', emoji: '🚨', label: 'ALARMING / ROUTINE', x: 78, y: 8 },
      { id: 'names', emoji: '🖊️', label: 'B-PER, I-PER, B-LOC…', x: 78, y: 30 },
      { id: 'qa', emoji: '🎯', label: 'exact span answer', x: 78, y: 52 },
      { id: 'summary', emoji: '📰', label: 'one-line headline', x: 78, y: 74 },
      { id: 'zeroshot', emoji: '❓', label: 'new category? entailment guess', x: 78, y: 96 }
    ],
    actors: [
      { id: 'clerk', emoji: '👩', label: 'Intake Clerk', x: 30, y: 60 }
    ],
    steps: [
      { c: 'A Transponder Snail report arrives. First step, always the same: transcribe into clean text.', p: { snail: 'lit' } },
      { c: 'The tokenizer produces clean text; the shared, once-trained "understanding" reads it — the same instinct for every report, every task.', p: { clean: 'good', brain: 'lit' }, a: { clerk: [45, 40] } },
      { c: 'Stamp 1 — Threat Level: one label for the WHOLE report (sequence classification).', p: { threat: 'good' } },
      { c: 'Stamp 2 — Circle the Names: a tag for EVERY word, subwords merged back into whole entities (NER, token classification).', p: { names: 'good' } },
      { c: 'Stamp 3 — Quick Answer: point to the EXACT sentence fragment, no rewriting (extractive QA — start/end span).', p: { qa: 'good' } },
      { c: 'Stamp 4 — Headline: condense three pages into one sentence (summarization — full generation).', p: { summary: 'good' } },
      { c: 'Stamp 5 — brand-new category never in the manual: compare the report against candidate labels via "does this entail that claim?" (zero-shot, no retraining).', p: { zeroshot: 'good' }, l: { zeroshot: 'zero-shot: SABOTAGE ✓' } }
    ]
  },
  tech: [
    {
      q: 'Trace exactly what pipeline("sentiment-analysis")(text) does, step by step.',
      a: '(1) Tokenize: the input string is split into subword tokens via the model\'s matching tokenizer (BPE/WordPiece, from the tokenization lesson) and converted to integer IDs, plus an attention_mask if batching with padding. (2) Embed + encode: token IDs are looked up in an embedding table and pushed through the pretrained transformer encoder, producing one contextual vector per token (the word-embeddings lesson\'s static vectors, upgraded to context-aware — Part 5\'s subject). (3) Pool: the representation for a special [CLS] token (or a mean/max pool over all tokens, model-dependent) is taken as "the whole sequence\'s meaning". (4) Head: a small linear layer maps that pooled vector to logits over the label set (POSITIVE, NEGATIVE). (5) Post-process: softmax turns logits into probabilities, argmax picks the label, and the pipeline returns {label, score} as a plain Python dict. Every step is something you\'ve already built by hand in this course — pipeline() just hides the plumbing.'
    },
    {
      q: 'Why does raw NER output look fragmented, and what does aggregation_strategy="simple" actually do?',
      a: 'The model predicts one tag per TOKENIZER token, not per word — and BPE/WordPiece routinely splits rare words ("Luffy" might become "Lu", "##ffy"). Without aggregation you get entities like {"entity": "B-PER", "word": "Lu"} and {"entity": "I-PER", "word": "##ffy"} as two separate hits. aggregation_strategy="simple" merges consecutive same-entity subword predictions back into one span by concatenating the pieces (stripping the "##" continuation marker) and averaging (or taking the max of) their confidence scores. It is purely a post-processing convenience over raw per-token logits — the model itself never "knows" about whole words, only subword tokens, which is precisely why the tokenization lesson\'s BPE mechanics matter for reading NER output correctly.'
    },
    {
      q: 'Explain the zero-shot NLI trick precisely — what is the model actually predicting?',
      a: 'The underlying model was trained for natural language inference: given a premise and a hypothesis, output P(entailment), P(neutral), P(contradiction). Zero-shot classification repurposes this WITHOUT any new training: for input text T and candidate label L, it constructs premise=T, hypothesis=f"This example is about {L}." and reads P(entailment) as a "fit score" for label L. Doing this once per candidate label and normalizing (softmax if multi-class, independent sigmoids if multi-label) gives a ranked classification with ZERO labeled examples for the target task — you\'re not classifying, you\'re asking "does the text logically support the claim that it\'s about L" and treating high entailment as a proxy for "yes, that\'s the right label". The catch: label wording matters a lot (the hypothesis template is doing real work), and there\'s no guarantee the label set is mutually exclusive or exhaustive from the model\'s point of view — pick candidate labels carefully and sanity-check on known examples before trusting it in production.'
    },
    {
      q: 'When should you reach for a pretrained pipeline versus fine-tuning your own model (Part 6 preview)?',
      a: 'Reach for an off-the-shelf pipeline when: the task is a common, well-covered one (general sentiment, standard entity types, generic summarization); your domain language resembles the model\'s pretraining/fine-tuning data (news, reviews, Wikipedia-style text — NOT, say, dense legal contracts or a niche internal jargon); you need something working TODAY with no labeled data; and accuracy requirements tolerate off-the-shelf performance. Reach for fine-tuning (Part 6: full fine-tune, LoRA, etc.) when: your domain vocabulary or label taxonomy is specialized (medical codes, internal ticket categories, a specific legal doctrine); you have labeled examples and off-the-shelf accuracy measurably underperforms on a held-out set from YOUR distribution (the model-evaluation lesson\'s discipline: measure, don\'t guess); latency/cost requirements favor a smaller specialized model over a large general one; or you need behavior (a very specific output format, a domain-specific entity type) the general model was never exposed to. Rule of thumb worth saying in an interview: always benchmark the off-the-shelf pipeline on YOUR data first — fine-tuning is expensive, and "the zero-shot baseline was actually good enough" is a legitimate, common outcome.'
    }
  ],
  code: {
    title: 'Five tasks, five pipeline() calls',
    intro: 'Illustrative usage of the Hugging Face pipeline API (requires the `transformers` package and a model download, so this is reference code to read rather than run in-browser — your lab checks the same patterns statically).',
    code: `from transformers import pipeline

# Load each pipeline ONCE (expensive: downloads + loads weights) and reuse it.
sentiment = pipeline("sentiment-analysis")
ner = pipeline("ner", aggregation_strategy="simple")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
qa = pipeline("question-answering")
zero_shot = pipeline("zero-shot-classification")

report = "Monkey D. Luffy and his crew were sighted near Loguetown, causing alarm at the local Marine base."

print(sentiment(report))
# [{'label': 'NEGATIVE', 'score': 0.94}]  -- "alarm" tips it negative

print(ner(report))
# [{'entity_group': 'PER', 'word': 'Monkey D. Luffy', 'score': 0.99, ...},
#  {'entity_group': 'LOC', 'word': 'Loguetown', 'score': 0.97, ...}]

print(summarizer(report, max_length=20, min_length=5, do_sample=False))
# [{'summary_text': 'Luffy crew sighted near Loguetown, alarming Marines.'}]

print(qa(question="Where was the crew sighted?", context=report))
# {'answer': 'Loguetown', 'start': 34, 'end': 43, 'score': 0.91}

print(zero_shot(report, candidate_labels=["smuggling", "sighting", "mutiny"]))
# {'labels': ['sighting', 'smuggling', 'mutiny'], 'scores': [0.81, 0.14, 0.05], ...}`,
    notes: [
      'Every pipeline is instantiated ONCE at the top, before any calls — the single most common production mistake is constructing pipeline(...) inside a request handler or loop.',
      'summarizer takes max_length/min_length in output TOKENS, not characters — tune per use case, and always check truncation on the INPUT side for long documents.',
      'qa returns character offsets (start, end) into the context you passed in, not a rephrased answer — that\'s the "span extraction" task shape made concrete.',
      'zero_shot\'s scores are entailment-derived, not trained classification probabilities — treat them as a ranking signal, calibrate before using as a hard threshold.'
    ]
  },
  lab: {
    title: 'Wire up the Marine intake desk',
    prompt: 'Write a Python module that correctly configures five Hugging Face pipelines for the five task shapes from this lesson: sentiment analysis, NER with subword aggregation, summarization with explicit length bounds, extractive question answering, and zero-shot classification with candidate labels. This lab is statically checked (no internet access in this browser to download real models) — focus on getting the API calls and their required arguments exactly right, since that is what a code reviewer would check in a real PR.',
    starter: `from transformers import pipeline

# 1. Sentiment analysis: build it once, module-level.
sentiment_pipeline = ...

# 2. NER: must merge subword pieces back into whole entities.
ner_pipeline = ...

# 3. Summarization: must bound output length explicitly (don't trust defaults).
summary_pipeline = ...

def summarize_report(text):
    # call summary_pipeline with max_length and min_length set
    ...

# 4. Extractive QA
qa_pipeline = ...

def answer_from_report(question, context):
    # call qa_pipeline with question= and context= keyword args
    ...

# 5. Zero-shot classification against a caller-supplied label set
zero_shot_pipeline = ...

def classify_new_report(text, candidate_labels):
    # call zero_shot_pipeline with candidate_labels=
    ...`,
    checks: [
      { re: 'pipeline\\(\\s*["\']sentiment-analysis["\']', must: true, hint: 'sentiment_pipeline = pipeline("sentiment-analysis") at module level.', pass: 'sentiment pipeline configured' },
      { re: 'pipeline\\(\\s*["\']ner["\'][^)]*aggregation_strategy\\s*=\\s*["\']simple["\']', must: true, hint: 'ner_pipeline = pipeline("ner", aggregation_strategy="simple") — without this, entities come back as fragmented subwords.', pass: 'NER pipeline aggregates subwords' },
      { re: 'pipeline\\(\\s*["\']summarization["\']', must: true, hint: 'summary_pipeline = pipeline("summarization", ...).', pass: 'summarization pipeline configured' },
      { re: 'max_length\\s*=', must: true, hint: 'Pass max_length= when calling the summarizer — never trust an unbounded default in production.', pass: 'max_length bounded' },
      { re: 'min_length\\s*=', must: true, hint: 'Pass min_length= too, so the summary can\'t collapse to one word.', pass: 'min_length bounded' },
      { re: 'pipeline\\(\\s*["\']question-answering["\']', must: true, hint: 'qa_pipeline = pipeline("question-answering").', pass: 'QA pipeline configured' },
      { re: 'question\\s*=.*context\\s*=|context\\s*=.*question\\s*=', must: true, hint: 'Call qa_pipeline with BOTH question= and context= as keyword arguments.', pass: 'QA called with question= and context=' },
      { re: 'pipeline\\(\\s*["\']zero-shot-classification["\']', must: true, hint: 'zero_shot_pipeline = pipeline("zero-shot-classification").', pass: 'zero-shot pipeline configured' },
      { re: 'candidate_labels\\s*=', must: true, hint: 'Call zero_shot_pipeline with candidate_labels= — that\'s how you supply labels with zero training.', pass: 'candidate_labels passed' }
    ],
    tests: null,
    runnable: false,
    solution: `from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")

ner_pipeline = pipeline("ner", aggregation_strategy="simple")

summary_pipeline = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_report(text):
    result = summary_pipeline(text, max_length=45, min_length=10, do_sample=False)
    return result[0]["summary_text"]

qa_pipeline = pipeline("question-answering")

def answer_from_report(question, context):
    return qa_pipeline(question=question, context=context)

zero_shot_pipeline = pipeline("zero-shot-classification")

def classify_new_report(text, candidate_labels):
    return zero_shot_pipeline(text, candidate_labels=candidate_labels)`,
    notes: [
      'Notice every pipeline is a MODULE-LEVEL variable, built exactly once — the functions only ever CALL an already-loaded pipeline, never construct one.',
      'max_length/min_length on summarization and explicit question=/context= keywords on QA aren\'t style preferences — omitting them is the single most common "worked in the demo, broke in review" pattern with these APIs.',
      'candidate_labels is what makes zero-shot classification zero-shot: you supply the label set AT CALL TIME, no retraining, no fixed label list baked into the model.'
    ]
  },
  quiz: [
    {
      q: 'What does pipeline("sentiment-analysis") bundle together?',
      options: ['A tokenizer, a pretrained model\'s forward pass, and post-processing (softmax + argmax) into one callable', 'A rule-based keyword matcher for positive/negative words', 'A database lookup of pre-labeled reviews', 'A translation model repurposed for scoring'],
      correct: 0,
      explain: 'pipeline() hides exactly the steps you\'ve built by hand elsewhere in this course: tokenize → encode → pool → classify → post-process.'
    },
    {
      q: 'Why does raw NER output fragment "Luffy" into pieces like "Lu" and "##ffy"?',
      options: ['Because the tokenizer splits rare words into subword units (BPE/WordPiece), and the model predicts one tag per subword token, not per whole word', 'Because the model is broken', 'Because NER only works on single-syllable words', 'Because the sentence is too long'],
      correct: 0,
      explain: 'One tag per tokenizer token. aggregation_strategy="simple" merges consecutive same-entity subwords back into whole spans as a post-processing step.'
    },
    {
      q: 'How does zero-shot classification label text into categories the model was never trained on?',
      options: ['It reuses a model trained for natural language inference, treating "does the text entail \'this is about {label}\'" as a fit score for each candidate label', 'It fine-tunes a fresh model on the fly for each new label set', 'It searches the internet for matching examples', 'It always returns the most frequent label by default'],
      correct: 0,
      explain: 'Premise = the text, hypothesis = "This example is about {label}." — rank candidate labels by predicted entailment probability. No new training, no labeled examples for the target task.'
    },
    {
      q: 'What is the key structural difference between extractive QA and summarization?',
      options: ['QA predicts start/end indices into the given context (a span extraction task); summarization generates new text token by token (a sequence generation task)', 'QA is always faster than summarization', 'Summarization only works on questions, not documents', 'QA requires zero-shot labels; summarization does not'],
      correct: 0,
      explain: 'Two very different task shapes on the same pretrained backbone: span extraction (two small heads: start-logits, end-logits) versus full autoregressive generation (the seq2seq-attention machinery from last lesson).'
    },
    {
      q: 'What is the single most common production mistake when using pipeline()?',
      options: ['Constructing a new pipeline(...) instance inside a loop or request handler, reloading the entire model on every call instead of building it once', 'Using too few candidate labels for zero-shot classification', 'Setting max_length too high on summarization', 'Using aggregation_strategy on sentiment analysis'],
      correct: 0,
      explain: 'Model + tokenizer loading is expensive (hundreds of MB, real load time). Build the pipeline ONCE at startup/module level and reuse the callable for every subsequent request.'
    }
  ],
  pitfalls: [
    'Re-instantiating pipeline(...) inside a function that runs per-request — this reloads model weights every single call and can turn a 10ms inference into seconds of dead time.',
    'Feeding a long document straight into summarization or classification without checking the model\'s max sequence length — text silently gets truncated, and the model never sees what got cut off.',
    'Reading raw (non-aggregated) NER output and being confused by fragmented entities — always pass aggregation_strategy="simple" (or "max"/"average") unless you specifically need raw subword-level tags.',
    'Treating zero-shot classification scores as calibrated probabilities comparable across completely different label sets — they\'re entailment scores, a ranking signal, not a rigorously calibrated probability; validate on known examples before trusting a hard threshold.',
    'Assuming the default model behind pipeline(task) is good enough for your domain without checking its model card — a general sentiment model trained on movie reviews may misfire badly on, say, sarcastic tweets or dense legal text.',
    'Skipping the benchmark-before-fine-tune step: spinning up a full fine-tuning run (Part 6) before even measuring whether the off-the-shelf pipeline already clears your accuracy bar on real held-out data from your own distribution.'
  ],
  interview: [
    {
      q: 'Walk me through what happens end to end when you call a Hugging Face sentiment-analysis pipeline on a string.',
      a: 'Five stages, each one you\'ve implemented a piece of earlier in this course. (1) Tokenization: the string is split into subword tokens by the model\'s matched tokenizer (BPE/WordPiece) and mapped to integer IDs, with special tokens like [CLS]/[SEP] added. (2) Embedding + encoding: token IDs are looked up in an embedding table, combined with positional information, and pushed through the pretrained transformer\'s self-attention + feedforward stack, producing one contextual hidden vector per token. (3) Pooling: a single vector representing the whole sequence is extracted, typically the final hidden state of the [CLS] token. (4) Classification head: a small linear layer maps that pooled vector to raw logits over the label set. (5) Post-processing: softmax converts logits to probabilities, argmax (or thresholding) picks the predicted label, and the result is packaged as {label, score}. The entire "magic" of pipeline() is stages 1 and 5 being automated for you — stages 2-4 are the pretrained model itself.'
    },
    {
      q: 'Explain named entity recognition as a machine learning task, including why aggregation is needed.',
      a: 'NER is TOKEN classification, not sequence classification: the model outputs a label for every individual token, using a BIO (or BIOES) tagging scheme — B-X begins an entity of type X, I-X continues it, O means "not part of any entity". This is trained with per-token cross-entropy loss, same objective as sequence classification just applied token-by-token instead of once per input. The complication: the tokenizer\'s subword vocabulary means one WORD often becomes multiple TOKENS ("Loguetown" → "Log", "##ue", "##town"), so the raw model output is per-SUBWORD, not per-word — you get repeated near-duplicate entity fragments unless you post-process. aggregation_strategy merges consecutive same-type subword predictions into a single whole-word (or whole-phrase) span, concatenating the text and combining (max or average) the confidence scores. Worth mentioning in an interview: this is a direct, practical consequence of the BPE/WordPiece tokenization choice discussed earlier in the NLP unit — it is not a bug, it\'s an artifact of subword tokenization that every downstream consumer of token-level outputs has to handle.'
    },
    {
      q: 'How does zero-shot text classification work, and what are its limitations?',
      a: 'Mechanism: reuse a model trained for natural language inference (predict entailment / neutral / contradiction between a premise and a hypothesis) without any additional training. For input text T and each candidate label L, construct premise=T and hypothesis="This example is about {L}." and read off P(entailment) as a fit score for label L; rank candidates by this score (softmax across labels for single-label classification, independent sigmoids for multi-label). Strengths: zero labeled examples needed for the target task, works with an arbitrary, caller-supplied label set decided at inference time — genuinely useful for exploratory categorization or long-tail label sets nobody pre-labeled. Limitations to name in an interview: (1) sensitive to hypothesis template wording — "This example is about {L}" versus "This text expresses {L}" can shift scores; (2) no guarantee the candidate labels are mutually exclusive or exhaustive from the model\'s perspective, since it\'s answering an entailment question per label independently, not doing a true joint classification; (3) accuracy is generally lower than a properly fine-tuned classifier on the same task — it is a strong BASELINE and a good bootstrap, not usually the final production answer for a task with enough volume to justify fine-tuning.'
    },
    {
      q: 'A team wants to use pipeline("summarization") in production. What questions do you ask before shipping it?',
      a: 'Five practical questions, roughly in priority order. (1) Length behavior: what are max_length/min_length set to, and are they bounded explicitly rather than relying on model defaults — unbounded generation is both a cost and a quality risk. (2) Input truncation: what is the model\'s max input sequence length, and what fraction of real documents exceed it — if a meaningful fraction do, you need a chunking strategy (summarize sections, then summarize the summaries) rather than silent truncation. (3) Lifecycle: is the pipeline instantiated once at service startup and reused, or accidentally reconstructed per request (a common and expensive mistake)? (4) Domain fit: was the underlying model (e.g. facebook/bart-large-cnn, trained on news articles) fine-tuned on data resembling YOUR documents — a news-summarization model may perform notably worse on, say, legal contracts or casual chat transcripts, and this should be measured on a held-out sample from your actual distribution, not assumed. (5) Failure mode and fallback: what happens on pathological input (empty string, non-English text, a document that\'s mostly a table) — does the pipeline error cleanly or produce silently garbage output that a naive downstream consumer would trust? This last point is the model-evaluation lesson\'s discipline applied to a generation task instead of a classifier: measure on YOUR data before trusting a general-purpose default.'
    }
  ]
};
