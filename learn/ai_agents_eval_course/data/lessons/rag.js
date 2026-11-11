window.LESSONS = window.LESSONS || {};
window.LESSONS['rag'] = {
  id: 'rag',
  title: 'Retrieval-Augmented Generation: Embeddings, Chunking, Hybrid Search & Reranking',
  category: 'Part 1 — Building Agents & Workflows',
  timeMin: 45,
  summary: `RAG answers questions from your own documents: split the corpus into chunks, index them, retrieve the most relevant chunks for a query, and put them into the prompt with instructions to answer only from them and cite. Most RAG quality problems are retrieval problems, so this lesson is mostly about retrieval: how dense embeddings and BM25 each fail, why hybrid search with Reciprocal Rank Fusion is the usual default, why a cross-encoder reranker over the top candidates helps, how chunking decides what can be found at all, and how to evaluate retrieval separately from generation with recall@k and MRR. The worked example implements BM25, a dense retriever, RRF and the metrics in pure Python.`,
  goals: [
    'Explain the RAG pipeline end to end and say which stage is responsible for which failure',
    'Explain dense embeddings (bi-encoders, cosine similarity, ANN indexes) and BM25, and where each one fails',
    'Implement hybrid retrieval with Reciprocal Rank Fusion and explain why a cross-encoder reranker improves the top of the list',
    'Choose a chunking strategy (fixed-size with overlap, structure-aware, contextual) for prose and for code',
    'Evaluate retrieval with recall@k and MRR, and generation with faithfulness and answer correctness, as separate measurements'
  ],
  concept: [
    {
      h: 'The pipeline and where it fails',
      p: [
        `Offline: <b>load</b> documents, <b>chunk</b> them, <b>embed</b> and/or <b>index</b> each chunk, store text plus metadata (source, section, date, permissions). Online: optionally <b>rewrite</b> the query, <b>retrieve</b> candidates (often 50 to 100), <b>rerank</b> to a handful, <b>assemble</b> a prompt with the chunks in tags with IDs, <b>generate</b> an answer that cites them, and optionally verify citations.`,
        `Failures split cleanly. If the right chunk was never retrieved, no prompt fixes it: that is a retrieval failure, measured by recall@k. If it was retrieved but the model ignored it, contradicted it, or added unsupported claims, that is a generation failure, measured by faithfulness. Debugging RAG starts by deciding which of the two you have, which is why you evaluate the stages separately.`,
        `Why RAG instead of fine-tuning for knowledge: documents change daily, answers need sources, access control is per document, and retrieval is inspectable. Fine-tuning changes behaviour and style far more reliably than it injects facts.`
      ]
    },
    {
      h: 'Dense retrieval: embeddings',
      p: [
        `An embedding model (a <b>bi-encoder</b>) maps text to a fixed-length vector so that semantically similar texts are close, typically by cosine similarity. Queries and chunks are encoded independently, so chunk vectors are computed once and stored. It catches paraphrase: "tests that sometimes fail" retrieves a chunk about "nondeterministic failures" with no shared keywords.`,
        `Its failure modes: exact identifiers, error codes, version numbers and rare names (<code>TimeoutException</code>, <code>JDK-8231234</code>) are often poorly represented; domain jargon outside the training data blurs; and a single vector per chunk compresses away detail in long chunks. Anthropic does not ship an embedding model; common choices are Voyage AI, OpenAI's embedding models, Cohere, or open models through <code>sentence-transformers</code>.`,
        `At scale you do not compare against every vector. Approximate nearest neighbour indexes (HNSW graphs, IVF with product quantization, as in FAISS, pgvector, or vector databases) trade a little recall for orders-of-magnitude faster search; their parameters (HNSW <code>ef_search</code>, IVF <code>nprobe</code>) are recall/latency knobs you should measure, not guess.`
      ],
      code: "# pip install sentence-transformers   (downloads models on first use)\nfrom sentence_transformers import CrossEncoder, SentenceTransformer\n\nencoder = SentenceTransformer(\"sentence-transformers/all-MiniLM-L6-v2\")      # bi-encoder\nchunk_vecs = encoder.encode([c[\"text\"] for c in CHUNKS], normalize_embeddings=True)\nq_vec = encoder.encode(\"tests that sometimes fail\", normalize_embeddings=True)\nscores = chunk_vecs @ q_vec                                # cosine, since vectors are unit length\ntop50 = scores.argsort()[::-1][:50]\n\nreranker = CrossEncoder(\"cross-encoder/ms-marco-MiniLM-L-6-v2\")              # reads query+doc together\npairs = [(\"tests that sometimes fail\", CHUNKS[i][\"text\"]) for i in top50]\nrerank_scores = reranker.predict(pairs)\ntop5 = [top50[j] for j in rerank_scores.argsort()[::-1][:5]]\n"
    },
    {
      h: 'Sparse retrieval: BM25, and why hybrid wins',
      p: [
        `<b>BM25</b> scores a document by its query terms, weighting each term by inverse document frequency (rare terms matter more), with term frequency saturating through <code>k1</code> (typically about 1.2 to 2.0) and a length normalization controlled by <code>b</code> (typically 0.75). It is exact-match: excellent on identifiers, error messages and rare names, blind to synonyms. It needs no model, is fast, and is a strong baseline that dense retrievers do not always beat out of domain (the BEIR benchmark showed this clearly).`,
        `Because their failure modes are complementary, <b>hybrid retrieval</b> runs both and fuses the ranked lists. Score fusion is awkward because BM25 scores and cosine similarities live on different scales. <b>Reciprocal Rank Fusion</b> (Cormack et al. 2009) avoids the problem by using ranks only: <code>score(d) = sum over lists of 1 / (k + rank(d))</code>, with k = 60 the conventional constant. Documents that appear high in either list, or moderately high in both, rise to the top. It is simple, has one parameter, and is hard to beat as a default.`
      ]
    },
    {
      h: 'Reranking the top candidates',
      p: [
        `A <b>cross-encoder</b> reranker reads the query and a candidate together in one forward pass and outputs a relevance score. It is far more accurate than comparing two independently computed vectors because attention runs across query and document, but it cannot be precomputed, so you only apply it to the top 50 to 100 candidates from the first stage. Typical options: open MS MARCO cross-encoders, Cohere or Voyage rerank APIs, or an LLM asked to score or order the candidates (accurate and expensive).`,
        `The standard production shape is therefore: hybrid first stage for recall (get the answer somewhere in the top 100), reranker for precision (get it into the top 5 the model will read). Anthropic's "Contextual Retrieval" write-up (2024) reported that combining contextualized chunks, BM25 and reranking reduced retrieval failures substantially more than any one of them alone.`
      ]
    },
    {
      h: 'Chunking decides what can be found',
      p: [
        `Chunks that are too large dilute the embedding and waste context; too small and they lose the information needed to be understood ("It increases the timeout" — what does?). Common strategies: <b>fixed-size with overlap</b> (for example a few hundred tokens with 10 to 20% overlap) as a baseline; <b>structure-aware</b> splitting on headings, paragraphs, or for code on functions and classes using a parser such as tree-sitter; and <b>contextual chunks</b>, where each chunk is prefixed with its document title and section, or with an LLM-written sentence situating it in the document (Anthropic's Contextual Retrieval, which is cheap with prompt caching because the whole document is the shared prefix).`,
        `Keep metadata with every chunk (source, section, timestamp, ACL) for filtering, citations and freshness. Parent-document retrieval, retrieving small chunks but passing the larger enclosing section to the model, balances precise matching with enough context.`,
        `Chunking parameters are hyperparameters: change them only with a retrieval eval in place.`
      ]
    },
    {
      h: 'Evaluating retrieval and generation',
      p: [
        `Build a labeled set of queries, each with the IDs of chunks (or documents) that answer it. Real user queries are best; LLM-generated questions from chunks bootstrap a set but are biased toward the chunk's wording, which flatters lexical retrieval.`,
        `<b>recall@k</b>: the fraction of a query's relevant items that appear in the top k, averaged over queries; it answers "did the evidence reach the model?" when k equals the number of chunks you pass. <b>MRR</b> (mean reciprocal rank): the average of 1/rank of the first relevant result, sensitive to whether the best evidence is at the top. <b>nDCG@k</b> handles graded relevance. <b>Precision@k</b> matters when the model is distracted by irrelevant chunks.`,
        `For generation: <b>faithfulness</b> (every claim supported by the retrieved context), <b>answer correctness</b> against a reference, <b>citation accuracy</b>, and correct abstention when the corpus lacks the answer. These are usually graded by an LLM judge with a rubric (frameworks such as RAGAS package these), which the LLM-as-judge lesson covers, including how to validate the judge.`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'Query-side techniques, RAG for code, agentic retrieval, and the operational problems that show up after the demo.',
    sections: [
      {
        h: 'Query transformation',
        p: [
          `User queries are short and underspecified. Techniques: rewrite the query with conversation context ("what about the second one?" becomes a standalone question); decompose multi-part questions into sub-queries and retrieve for each; generate several paraphrases and fuse their results (RAG-Fusion, which is RRF across query variants); and HyDE (Gao et al. 2022), which embeds an LLM-written hypothetical answer instead of the question, because answers look more like documents than questions do. Each adds an LLM call and latency, so measure the recall gain.`
        ]
      },
      {
        h: 'Retrieval for code',
        p: [
          `Code search mixes exact symbols (BM25 or grep shine) with intent ("where do we retry HTTP calls?", where embeddings help). Chunk by syntax (functions, classes, methods) rather than by character count, prepend the file path and enclosing class, and exploit structure: call graphs, imports and test-to-code links point to relevant code that shares no words with the query. Many coding agents skip vector indexes entirely and let the model search with grep and file listing tools, which is agentic retrieval with perfect freshness. Agentless localization, in the coding-agents lesson, is a hierarchical retrieval problem.`
        ]
      },
      {
        h: 'Agentic RAG',
        p: [
          `Instead of one retrieve-then-generate pass, give an agent search tools and let it decide what to look up, read results, and search again. It handles multi-hop questions ("which team owns the service whose test is flakiest?") that single-shot retrieval misses, at the cost of more calls and less predictability. Evaluate both the final answer and the retrieval trajectory (did it find the evidence, how many searches did it take).`
        ]
      },
      {
        h: 'Production concerns',
        p: [
          `Freshness: incremental re-indexing keyed by content hash, and deleting chunks of removed documents. Access control: filter by the user's permissions at retrieval time, never after generation, or the model can leak a restricted chunk. Prompt injection: retrieved text is untrusted, so delimit it, tell the model it is data, and keep tool permissions narrow. Embedding model changes require re-embedding the whole corpus, because vectors from different models are not comparable; version your indexes. And monitor: log retrieved IDs per answer so a bad answer can be traced to a retrieval or a generation failure.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Robin in the Library of Ohara',
      text: [
        `Robin is asked a question about an ancient weapon. She cannot read every book on the island, so she does what Ohara's scholars taught her. One assistant searches the index cards for exact words, and finds the book that mentions "Pluton" by name instantly, but misses the scroll that only says "the warship of the ancient kingdom". Another assistant, who understands meaning, finds that scroll, but cannot find anything by a catalogue number.`,
        `Robin takes both assistants' lists, gives credit to anything near the top of either, and pulls the top fifty volumes. Then she personally reads the first page of each next to the question, keeps the five that truly answer it, and answers only from those, quoting the shelf mark for every claim. When the library has nothing on the question, she says so instead of inventing a legend.`,
        `The scholars once cut every book into single sentences to file them faster. Robin could no longer tell which kingdom "it was destroyed" referred to, so now each slip is headed with the book and chapter it came from.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Finding the Comic Before Stuart Closes',
      text: [
        `The guys need a specific comic issue before the store closes. Howard searches Stuart's inventory spreadsheet for the exact issue number, which works only if you know the number. Raj describes it ("the one where the Flash meets his evil twin") to Stuart, who remembers comics by story, not number.`,
        `Leonard merges both lists, favouring anything near the top of either, and they pull twenty comics off the shelf. Sheldon then flips through each one alongside the description and picks the right one in a minute. Later, Sheldon checks Leonard's claim about who drew it against the credits page, and refuses to accept any claim not printed in the comic itself.`
      ]
    },
    why: 'Exact index-card and spreadsheet search is BM25: perfect on names and numbers, blind to paraphrase. The assistant who understands meaning and Stuart\'s story memory are dense embeddings. Crediting anything high on either list is Reciprocal Rank Fusion. Reading the first pages next to the question is the cross-encoder reranker over the top candidates. Answering only from the kept volumes with shelf marks, and admitting when nothing answers the question, is grounded, cited generation with abstention. The sentence-slips disaster is chunks too small to carry context, fixed by contextual headers.'
  },
  storyAnim: {
    title: 'Two searches, one shortlist, careful reading',
    h: 260,
    props: [
      { id: 'cards', emoji: '🗂️', label: 'index cards: exact words (BM25)', x: 15, y: 18 },
      { id: 'meaning', emoji: '🧠', label: 'meaning search (embeddings)', x: 15, y: 55 },
      { id: 'merge', emoji: '🔀', label: 'merge by rank (RRF)', x: 42, y: 36 },
      { id: 'stack', emoji: '📚', label: 'top 50 volumes', x: 62, y: 18 },
      { id: 'read', emoji: '🔍', label: 'read beside the question (rerank)', x: 62, y: 55 },
      { id: 'answer', emoji: '📝', label: 'answer with shelf marks', x: 88, y: 36 }
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 42, y: 80 }
    ],
    steps: [
      { c: 'The card catalogue finds the book that names "Pluton" exactly, and misses the scroll that only describes it.', p: { cards: 'lit' } },
      { c: 'The meaning search finds the descriptive scroll, but nothing by catalogue number.', p: { meaning: 'lit' } },
      { c: 'Robin merges the two lists, crediting anything near the top of either. Rank, not raw score.', p: { merge: 'good' }, a: { robin: [42, 62] } },
      { c: 'She pulls the top fifty volumes: high recall, still noisy.', p: { stack: 'lit' } },
      { c: 'She reads the first page of each next to the question and keeps the five that truly answer it.', p: { read: 'good' }, a: { robin: [62, 75] } },
      { c: 'She answers only from those five and cites a shelf mark for every claim, or says the library has nothing.', p: { answer: 'good' }, a: { robin: [86, 62] } }
    ]
  },
  conceptFlow: {
    title: 'A production RAG pipeline',
    intro: 'Click a box or press Play.',
    stages: [
      { label: 'Index (offline)', nodes: [
        { id: 'chunk', text: 'Chunk: structure-aware\n+ contextual header' },
        { id: 'index', text: 'Embed (ANN index)\n+ BM25 inverted index' }
      ] },
      { label: 'Retrieve', nodes: [
        { id: 'rewrite', text: 'Query rewrite\n(standalone, sub-queries)' },
        { id: 'both', text: 'Dense top-100 +\nBM25 top-100, ACL filter' },
        { id: 'rrf', text: 'Reciprocal Rank Fusion' }
      ] },
      { label: 'Rerank', nodes: [
        { id: 'rerank', text: 'Cross-encoder over top 50\nkeep top 5' }
      ] },
      { label: 'Generate', nodes: [
        { id: 'prompt', text: '<doc id=...> blocks +\nanswer-only-from-docs, cite' },
        { id: 'abstain', text: 'Abstain if unsupported' }
      ] },
      { label: 'Evaluate', nodes: [
        { id: 'reteval', text: 'Retrieval: recall@k, MRR' },
        { id: 'geneval', text: 'Generation: faithfulness,\ncorrectness, citations' }
      ] }
    ],
    steps: [
      { active: ['chunk'], note: 'Split along document structure and prefix each chunk with where it came from, so it can be understood on its own.' },
      { active: ['index'], note: 'Build both a vector index for meaning and an inverted index for exact terms, keeping metadata such as source, date and permissions.' },
      { active: ['rewrite'], note: 'Turn conversational or multi-part queries into standalone retrievable ones.' },
      { active: ['both'], note: 'Run both retrievers for high recall, filtering by the user\'s permissions inside retrieval.' },
      { active: ['rrf'], note: 'Fuse by rank: sum of 1/(60 + rank) across lists. No score calibration needed.' },
      { active: ['rerank'], note: 'A cross-encoder reads query and chunk together, sharply improving precision at the top.' },
      { active: ['prompt', 'abstain'], note: 'Chunks go in tagged blocks with IDs. The model answers from them, cites IDs, and says so when they do not contain the answer.' },
      { active: ['reteval', 'geneval'], note: 'Measure retrieval and generation separately, so you know which stage to fix.' }
    ]
  },
  tech: [
    {
      q: 'Why normalize embeddings?',
      a: `For unit-length vectors, cosine similarity equals the dot product, so you can use fast inner-product search and avoid recomputing norms. It also means vector length no longer affects ranking, which is usually what you want for semantic similarity. Use the same normalization at index time and query time.`
    },
    {
      q: 'Why k = 60 in RRF?',
      a: `It is the value Cormack et al. found worked well, and it damps the advantage of rank 1 over rank 5: 1/61 versus 1/65 is a small difference, so agreement across lists matters more than one list's top pick. Smaller k makes fusion more top-heavy. It is rarely worth tuning before everything else.`
    },
    {
      q: 'Why not just use a long-context model and skip retrieval?',
      a: `For a small, stable corpus you sometimes can, with caching. But corpora are often larger than any window, per-query cost scales with context size, access control is per document, freshness requires re-sending, and long contexts suffer position effects. Retrieval also gives you an inspectable record of what evidence was used.`
    },
    {
      q: 'Does the Claude API have built-in citations?',
      a: `Yes. Pass documents as <code>document</code> content blocks with <code>citations: {"enabled": true}</code>, and the response's text blocks carry a <code>citations</code> list with the cited text and its location (character range, page, or content block index). It cannot be combined with structured-output formats in the same request.`
    }
  ],
  code: {
    title: 'Hybrid retrieval and its evaluation, in pure Python',
    intro: 'Heading-aware chunking with contextual prefixes, an Okapi BM25 implementation, a toy dense retriever, RRF, and recall@3 and MRR over a small labeled query set, ending with the grounded prompt that would be sent to the model. The dense encoder is a hand-built concept embedding so the demo runs offline; it plays the role a learned embedding model plays, matching "sometimes fail randomly" to "nondeterministic" and "intermittent".',
    code: "\"\"\"hybrid_rag.py - chunk, index with BM25 + a dense retriever, fuse with RRF, evaluate\nrecall@k and MRR, then build a grounded prompt. Pure Python, runs offline.\nThe 'dense' encoder is a toy concept-embedding so the demo needs no model download;\nswap in sentence-transformers (see notes) for a real one.\"\"\"\nimport math\nimport re\nfrom collections import Counter\n\nDOCS = {\n    \"ci-guide.md\": \"\"\"# Rerun policy\nCI reruns a failed job once. A test that fails and then passes on the same commit is\nmarked as flaky and quarantined.\n# Timeouts\nJobs are killed after 30 minutes. A TimeoutException in a test usually means a slow\nexternal call.\"\"\",\n    \"testing.md\": \"\"\"# Waiting in tests\nNever use Thread.sleep to wait for async work. Poll the condition with Awaitility\ninstead, so the test does not depend on machine speed.\n# Order dependence\nTests that share static state can pass alone and fail when run after another test.\"\"\",\n    \"oncall.md\": \"\"\"# Paging\nPage the owner when the main branch is red for more than one hour.\n# Intermittent failures\nNondeterministic tests that sometimes fail should be reported in the flaky-test tracker.\"\"\",\n}\n\n# ---------------- chunking: split on headings, then cap length with overlap ----------------\ndef chunk(doc_id, text, max_words=40, overlap=10):\n    chunks = []\n    for section in re.split(r\"\\n(?=# )\", text):\n        title = section.splitlines()[0].lstrip(\"# \").strip()\n        words = section.split()\n        step = max_words - overlap\n        for start in range(0, max(len(words) - overlap, 1), step):\n            body = \" \".join(words[start:start + max_words])\n            # prefix the doc and section title: cheap \"contextual\" chunking\n            chunks.append({\"id\": f\"{doc_id}#{title}#{start}\", \"text\": f\"{doc_id} > {title}: {body}\"})\n    return chunks\n\n\nCHUNKS = [c for d, t in DOCS.items() for c in chunk(d, t)]\nTOKEN = re.compile(r\"[a-z0-9]+\")\n\n\ndef tokens(s):\n    return TOKEN.findall(s.lower())\n\n\n# ---------------- sparse: Okapi BM25 ----------------\nclass BM25:\n    def __init__(self, docs, k1=1.5, b=0.75):\n        self.k1, self.b = k1, b\n        self.tfs = [Counter(tokens(d[\"text\"])) for d in docs]\n        self.lens = [sum(tf.values()) for tf in self.tfs]\n        self.avgdl = sum(self.lens) / len(self.lens)\n        df = Counter(t for tf in self.tfs for t in tf)\n        n = len(docs)\n        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}\n\n    def scores(self, query):\n        out = []\n        for tf, dl in zip(self.tfs, self.lens):\n            s = 0.0\n            for t in tokens(query):\n                if t in tf:\n                    f = tf[t]\n                    s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / self.avgdl))\n            out.append(s)\n        return out\n\n\n# ---------------- dense: toy concept embedding + cosine ----------------\nCONCEPTS = {\n    \"flaky\": {\"flaky\", \"intermittent\", \"nondeterministic\", \"sometimes\", \"random\", \"unreliable\"},\n    \"wait\": {\"sleep\", \"wait\", \"waiting\", \"poll\", \"awaitility\", \"async\", \"slow\"},\n    \"time\": {\"timeout\", \"timeoutexception\", \"killed\", \"minutes\", \"hour\", \"slow\"},\n    \"order\": {\"order\", \"shared\", \"static\", \"state\", \"after\", \"alone\"},\n    \"alert\": {\"page\", \"paging\", \"owner\", \"red\", \"report\", \"tracker\"},\n}\nDIMS = sorted(CONCEPTS)\n\n\ndef embed(text):\n    toks = set(tokens(text))\n    v = [len(toks & CONCEPTS[d]) for d in DIMS]\n    norm = math.sqrt(sum(x * x for x in v)) or 1.0\n    return [x / norm for x in v]\n\n\nCHUNK_VECS = [embed(c[\"text\"]) for c in CHUNKS]\n\n\ndef dense_scores(query):\n    q = embed(query)\n    return [sum(a * b for a, b in zip(q, v)) for v in CHUNK_VECS]\n\n\n# ---------------- fusion, retrieval, metrics ----------------\ndef ranked(scores):\n    return [CHUNKS[i][\"id\"] for i in sorted(range(len(scores)), key=lambda i: -scores[i]) if scores[i] > 0]\n\n\ndef rrf(rankings, k=60):\n    \"\"\"Reciprocal Rank Fusion (Cormack et al. 2009): score = sum 1/(k + rank).\"\"\"\n    fused = Counter()\n    for r in rankings:\n        for rank, doc in enumerate(r, start=1):\n            fused[doc] += 1.0 / (k + rank)\n    return [d for d, _ in fused.most_common()]\n\n\ndef recall_at_k(results, relevant, k):\n    return len(set(results[:k]) & relevant) / len(relevant)\n\n\ndef reciprocal_rank(results, relevant):\n    for i, d in enumerate(results, start=1):\n        if d in relevant:\n            return 1.0 / i\n    return 0.0\n\n\nbm25 = BM25(CHUNKS)\nQUERIES = {   # query -> ids of chunks that answer it (doc#section prefix match)\n    \"what does TimeoutException mean\": {\"ci-guide.md#Timeouts\"},\n    \"tests that sometimes fail randomly\": {\"oncall.md#Intermittent failures\", \"ci-guide.md#Rerun policy\"},\n    \"how should a test wait for async work\": {\"testing.md#Waiting in tests\"},\n    \"test passes alone but fails after another\": {\"testing.md#Order dependence\"},\n}\n\n\ndef section(cid):\n    return cid.rsplit(\"#\", 1)[0]\n\n\nif __name__ == \"__main__\":\n    print(f\"{len(CHUNKS)} chunks\\n\")\n    systems = {\n        \"bm25\": lambda q: ranked(bm25.scores(q)),\n        \"dense\": lambda q: ranked(dense_scores(q)),\n        \"hybrid\": lambda q: rrf([ranked(bm25.scores(q)), ranked(dense_scores(q))]),\n    }\n    for name, search in systems.items():\n        r3, rr = [], []\n        for q, rel in QUERIES.items():\n            res = [section(c) for c in search(q)]\n            r3.append(recall_at_k(res, rel, 3))\n            rr.append(reciprocal_rank(res, rel))\n        print(f\"{name:7s} recall@3={sum(r3) / len(r3):.2f}  MRR={sum(rr) / len(rr):.2f}\")\n\n    q = \"tests that sometimes fail randomly\"\n    top = [c for c in CHUNKS if c[\"id\"] in rrf([ranked(bm25.scores(q)), ranked(dense_scores(q))])[:2]]\n    context = \"\\n\".join(f'<doc id=\"{c[\"id\"]}\">{c[\"text\"]}</doc>' for c in top)\n    prompt = (f\"{context}\\n\\nAnswer using only the documents above and cite doc ids. \"\n              f\"If they do not contain the answer, say so.\\nQuestion: {q}\")\n    print(\"\\nprompt sent to the model:\\n\" + prompt)\n",
    notes: [
      'Run: <code>python3 hybrid_rag.py</code>. BM25 misses the paraphrased query ("sometimes fail randomly" shares few words with the flaky-test rerun policy); the dense retriever catches it; the hybrid keeps both strengths.',
      'For a real dense retriever, replace <code>embed</code> with the sentence-transformers snippet from the concept section and re-run the same metrics. Expect the numbers to change; that is why the eval exists.',
      'Metrics are computed at the section level (chunk IDs are mapped to doc#section), because overlapping chunks of the same section should not count as different hits.',
      'Send the final prompt with <code>client.messages.create</code>; the instruction to cite IDs and abstain is what makes faithfulness checkable.'
    ]
  },
  lab: {
    title: 'Fusion and retrieval metrics',
    prompt: `Implement <code>rrf(rankings, k=60)</code> (1-based ranks, ties broken by doc ID), <code>recall_at_k(results, relevant, k)</code> and <code>mrr(all_results, all_relevant)</code> (0 for a query with no relevant result). The asserts check fused order on two small lists and the metric values.`,
    starter: "from collections import defaultdict\n\n\ndef rrf(rankings, k=60):\n    \"\"\"Fuse several ranked lists of doc ids with Reciprocal Rank Fusion.\n    Ranks are 1-based. Ties are broken by doc id for determinism.\"\"\"\n    ...\n\n\ndef recall_at_k(results, relevant, k):\n    \"\"\"Fraction of the relevant docs that appear in the top k results.\"\"\"\n    ...\n\n\ndef mrr(all_results, all_relevant):\n    \"\"\"Mean over queries of 1/rank of the first relevant result (0 if none).\"\"\"\n    ...\n\n\nif __name__ == \"__main__\":\n    bm25 = [\"d1\", \"d2\", \"d3\"]\n    dense = [\"d3\", \"d1\", \"d4\"]\n    fused = rrf([bm25, dense])\n    assert fused[:2] == [\"d1\", \"d3\"], fused\n    assert set(fused) == {\"d1\", \"d2\", \"d3\", \"d4\"}\n    assert recall_at_k([\"a\", \"b\", \"c\"], {\"c\", \"z\"}, 2) == 0.0\n    assert recall_at_k([\"a\", \"b\", \"c\"], {\"c\", \"z\"}, 3) == 0.5\n    assert abs(mrr([[\"x\", \"a\"], [\"a\"], [\"q\"]], [{\"a\"}, {\"a\"}, {\"a\"}]) - (0.5 + 1 + 0) / 3) < 1e-12\n    print(\"all checks passed\")\n",
    checks: [
      { re: 'enumerate\\([^)]*start\\s*=\\s*1', flags: '', must: true, hint: 'Ranks are 1-based: enumerate(ranking, start=1).', pass: '1-based ranks' },
      { re: '1(?:\\.0)?\\s*/\\s*\\(\\s*k\\s*\\+\\s*rank\\s*\\)', flags: '', must: true, hint: 'RRF contribution is 1.0 / (k + rank).', pass: 'RRF formula' },
      { re: 'sorted\\([^)]*-\\s*scores\\[', flags: '', must: true, hint: 'Sort by descending fused score with a deterministic tie-break: key=lambda d: (-scores[d], d).', pass: 'deterministic fused ordering' },
      { re: 'results\\[\\s*:\\s*k\\s*\\]', flags: '', must: true, hint: 'recall@k looks only at results[:k].', pass: 'top-k cut' },
      { re: '/\\s*len\\(\\s*relevant\\s*\\)', flags: '', must: true, hint: 'Recall divides hits by the number of relevant items.', pass: 'recall normalised by |relevant|' },
      { re: 'break', flags: '', must: true, hint: 'MRR counts only the FIRST relevant hit per query: break after it.', pass: 'first relevant hit only' },
      { re: '/\\s*len\\(\\s*all_results\\s*\\)', flags: '', must: true, hint: 'Average reciprocal ranks over all queries, including those with no hit.', pass: 'mean over queries' }
    ],
    run: `Save as <code>lab.py</code> and run <code>python3 lab.py</code>. Then plug your functions into the worked example in place of its own and confirm the same table, and try <code>k=1</code> in RRF to see the fusion become top-heavy.`,
    solution: "from collections import defaultdict\n\n\ndef rrf(rankings, k=60):\n    \"\"\"Fuse several ranked lists of doc ids with Reciprocal Rank Fusion.\n    Ranks are 1-based. Ties are broken by doc id for determinism.\"\"\"\n    scores = defaultdict(float)\n    for ranking in rankings:\n        for rank, doc in enumerate(ranking, start=1):\n            scores[doc] += 1.0 / (k + rank)\n    return sorted(scores, key=lambda d: (-scores[d], d))\n\n\ndef recall_at_k(results, relevant, k):\n    \"\"\"Fraction of the relevant docs that appear in the top k results.\"\"\"\n    if not relevant:\n        return 0.0\n    return len(set(results[:k]) & set(relevant)) / len(relevant)\n\n\ndef mrr(all_results, all_relevant):\n    \"\"\"Mean over queries of 1/rank of the first relevant result (0 if none).\"\"\"\n    total = 0.0\n    for results, relevant in zip(all_results, all_relevant):\n        for rank, doc in enumerate(results, start=1):\n            if doc in relevant:\n                total += 1.0 / rank\n                break\n    return total / len(all_results)\n\n\nif __name__ == \"__main__\":\n    bm25 = [\"d1\", \"d2\", \"d3\"]\n    dense = [\"d3\", \"d1\", \"d4\"]\n    fused = rrf([bm25, dense])\n    assert fused[:2] == [\"d1\", \"d3\"], fused\n    assert set(fused) == {\"d1\", \"d2\", \"d3\", \"d4\"}\n    assert recall_at_k([\"a\", \"b\", \"c\"], {\"c\", \"z\"}, 2) == 0.0\n    assert recall_at_k([\"a\", \"b\", \"c\"], {\"c\", \"z\"}, 3) == 0.5\n    assert abs(mrr([[\"x\", \"a\"], [\"a\"], [\"q\"]], [{\"a\"}, {\"a\"}, {\"a\"}]) - (0.5 + 1 + 0) / 3) < 1e-12\n    print(\"all checks passed\")\n",
    notes: [
      'Queries with zero hits must stay in the MRR denominator; dropping them is a common way to inflate the metric.',
      'recall@k with k equal to the number of chunks you actually put in the prompt is the most decision-relevant retrieval number.',
      'The tie-break makes rankings reproducible across runs, which matters when you compare systems item by item.'
    ]
  },
  quiz: [
    {
      q: 'Users search for an exact error code and dense retrieval keeps missing it. Most effective fix?',
      options: ['A bigger embedding model', 'Add BM25 and fuse the results (hybrid retrieval)', 'Raise the temperature', 'Use smaller chunks only'],
      correct: 1,
      explain: 'Exact identifiers are BM25\'s strength and a known weakness of dense embeddings; hybrid retrieval covers both.'
    },
    {
      q: 'Why is a cross-encoder applied only to the top candidates rather than the whole corpus?',
      options: ['It is less accurate than a bi-encoder', 'It scores query and document together, so nothing can be precomputed and each candidate costs a forward pass', 'It only accepts 5 documents', 'It cannot handle long queries'],
      correct: 1,
      explain: 'Cross-encoders trade throughput for accuracy; they rerank a shortlist produced by cheap first-stage retrieval.'
    },
    {
      q: 'A query\'s first relevant result is at rank 4. Its reciprocal rank is:',
      options: ['4', '0.4', '0.25', '1'],
      correct: 2,
      explain: 'Reciprocal rank is 1/4. MRR averages this over queries.'
    },
    {
      q: 'The model gave a wrong answer, but the correct chunk was in the prompt. Which metric captures this failure?',
      options: ['recall@k', 'Faithfulness / answer correctness of the generation step', 'Index build time', 'Chunk count'],
      correct: 1,
      explain: 'Retrieval succeeded; the failure is in generation. Separate metrics tell you which stage to fix.'
    },
    {
      q: 'Why does RRF fuse ranks rather than raw scores?',
      options: ['Ranks are cheaper to store', 'BM25 scores and cosine similarities are on incomparable scales; ranks need no calibration', 'Scores are always zero', 'It is required by vector databases'],
      correct: 1,
      explain: 'Rank-based fusion sidesteps score normalization, which is fragile across retrievers and queries.'
    }
  ],
  testFlow: {
    title: 'Test yourself: diagnosing a RAG system',
    start: 'q1',
    nodes: {
      q1: { q: 'Answers are often wrong. First diagnostic step?', choices: [
        { text: 'Measure recall@k on labeled queries to see whether the evidence reaches the model', to: 'q1_right' },
        { text: 'Rewrite the generation prompt', to: 'q1_wrong' }
      ] },
      q1_right: { end: true, correct: true, text: 'Right. If retrieval misses, no prompt change helps. Split the problem first.', next: 'q2' },
      q1_wrong: { end: true, correct: false, text: 'You do not yet know whether generation is the problem. Check retrieval first.', retry: 'q1' },
      q2: { q: 'recall@50 is 0.95 but recall@5 is 0.55. What do you add?', choices: [
        { text: 'A reranker over the top 50', to: 'q2_right' },
        { text: 'A second embedding model for the first stage', to: 'q2_wrong' }
      ] },
      q2_right: { end: true, correct: true, text: 'Yes. The evidence is in the candidate pool; the ordering at the top is the problem, which is what reranking fixes.', next: 'q3' },
      q2_wrong: { end: true, correct: false, text: 'First-stage recall is already high. The gap is precision at the top: rerank.', retry: 'q2' },
      q3: { q: 'Retrieved chunks are relevant but the answer cites things not in them. What do you measure and fix?', choices: [
        { text: 'Faithfulness; tighten the answer-only-from-documents instruction, require citations, verify them', to: 'q3_right' },
        { text: 'Increase chunk size', to: 'q3_wrong' }
      ] },
      q3_right: { end: true, correct: true, text: 'Correct. That is a generation faithfulness problem; citation checks make it measurable.' },
      q3_wrong: { end: true, correct: false, text: 'Retrieval is fine here. The model is going beyond its evidence; work on generation.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Evaluating only end-to-end answers, so you cannot tell retrieval failures from generation failures.',
    'Dense-only retrieval on corpora full of identifiers, error codes and names.',
    'Chunks with no context ("this method", "it") that neither retriever nor model can interpret; add titles and section headers.',
    'Applying access control after generation instead of filtering inside retrieval, which can leak restricted content.',
    'Building the eval set by generating questions from the chunks themselves and then celebrating high lexical recall.'
  ],
  interview: [
    {
      q: 'Design a RAG system over a company\'s engineering docs, runbooks and code.',
      a: `Ingestion with connectors per source, incremental updates by content hash, and per-document ACLs. Structure-aware chunking: headings for docs, functions and classes for code via a parser, each chunk prefixed with path, title and section. Two indexes: dense vectors in an ANN index and BM25. At query time: rewrite to a standalone query, retrieve top 100 from each with ACL filters, fuse with RRF, rerank the top 50 with a cross-encoder, pass the top 5 to 8 as tagged documents with IDs, instruct the model to answer only from them, cite, and abstain otherwise. Log retrieved IDs and citations. Evaluate with a labeled query set (recall@k, MRR) and an LLM judge for faithfulness and correctness, validated against human labels, run on every change to chunking, models or prompts.`
    },
    {
      q: 'Tradeoff: dense versus sparse retrieval.',
      a: `Dense handles paraphrase and semantic similarity and is multilingual with the right model, but is weaker on exact identifiers and rare terms, needs a model and re-embedding when the model changes, and can be poor out of domain. Sparse BM25 is exact, cheap, interpretable and strong out of domain, but misses synonyms. Since failures are complementary, hybrid with rank fusion is the default, with the balance tuned on a retrieval eval.`
    },
    {
      q: 'How do you evaluate retrieval, and what is the difference between recall@k and MRR?',
      a: `With labeled queries and relevant-chunk sets. recall@k is the fraction of relevant items in the top k, which tells you whether the evidence reaches the model when you pass k chunks. MRR is the mean of 1/rank of the first relevant hit, which rewards putting the best evidence first; it ignores additional relevant items. nDCG handles graded relevance and multiple items. I report recall at the k actually used in the prompt plus MRR, per query category, with confidence intervals.`
    },
    {
      q: 'How would you choose a chunk size?',
      a: `Empirically. Start from structure (sections, functions) with a cap of a few hundred tokens and modest overlap, add contextual headers, then sweep size and overlap against recall@k and end-to-end correctness on the eval set, watching token cost. Small chunks match precisely but lose context; large chunks carry context but blur embeddings and crowd the prompt. Parent-document retrieval often gives the best of both.`
    },
    {
      q: 'The system answers confidently when the docs do not cover the question. How do you fix it?',
      a: `Make abstention an explicit, tested behaviour: instruct the model to say when the documents do not contain the answer, include unanswerable questions in the eval set, and measure abstention precision and recall. Add a relevance threshold on reranker scores so weak retrievals trigger a "not found" path, and require citations so unsupported claims are detectable by a verifier.`
    },
    {
      q: 'How does RAG for code differ from RAG for prose?',
      a: `Queries mix exact symbols with intent, so lexical search matters more. Chunks should follow syntax, with the file path and enclosing class attached. Structural signals such as call graphs, imports and test-to-code links find relevant code that shares no words with the query. Freshness matters because code changes constantly, which is why many coding agents use live grep and file tools instead of a static vector index.`
    },
    {
      q: 'When would you prefer agentic retrieval over a fixed pipeline?',
      a: `For multi-hop questions where what to look up next depends on what was found, and for live sources such as a repository. A fixed pipeline is cheaper, faster and easier to evaluate, and is better for single-hop factual lookup at high volume. I would measure both on the same questions and compare accuracy against cost and latency.`
    }
  ]
};
