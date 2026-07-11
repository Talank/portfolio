window.LESSONS = window.LESSONS || {};
window.LESSONS['embeddings-rag'] = {
  id: 'embeddings-rag',
  title: 'Embeddings, Vector Databases & Building RAG',
  category: 'Part 7 — RAG & Agents',
  timeMin: 65,
  summary: 'The fine-tuning lesson ended on a rule: fine-tune for behavior, retrieve for knowledge. This lesson is the "retrieve" half, built end to end — chunk documents, embed them with the same cosine-similarity math from Part 1, store and search them at scale, and hand an LLM exactly the right passage instead of hoping it memorized the fact. RAG (Retrieval-Augmented Generation) is how a model answers questions about documents it never trained on, updated the moment the documents change.',
  goals: [
    'Describe the full RAG pipeline: chunk, embed, index, retrieve, and generate — and what happens at index-time versus query-time',
    'Explain the chunking trade-off: why chunk size and overlap both matter, and what breaks at each extreme',
    'Explain why exact nearest-neighbor search doesn\'t scale, and describe IVF and HNSW at the mechanism level',
    'Distinguish retrieval failure from generation failure in a RAG system, and know how to diagnose each',
    'Judge when RAG is the right tool versus fine-tuning or plain prompting, building on the fine-tuning lesson\'s rule'
  ],
  concept: [
    {
      h: 'Why retrieval, and what it actually replaces',
      p: [
        'The fine-tuning-lora lesson closed on a rule worth restating precisely: fine-tuning reshapes BEHAVIOR reliably but is a poor, unreliable way to inject specific, isolated, or frequently-changing FACTS — a fact seen a few dozen times in a fine-tuning set competes against everything the base model already "believes" from pretraining, with no guarantee the new fact wins cleanly. RAG sidesteps that competition entirely: instead of trying to bake a fact into the model\'s weights, hand the model the actual, current, relevant TEXT at the moment it needs to answer — the model reads it fresh, in context, the same way it would read anything else in its prompt. Update the underlying documents and the very next query sees the update immediately, no retraining, no fine-tuning run, no weight changes at all.',
        'This is exactly the word-embeddings and vectors-cosine lessons\' machinery, industrialized: represent text as vectors such that semantically similar text ends up with similar vectors (cosine similarity, Part 1), and use that geometric closeness to find "the passages most relevant to this question" out of a potentially enormous document collection — fast enough to do on every single query, in production, at scale.'
      ]
    },
    {
      h: 'The full pipeline: index-time and query-time',
      p: [
        'RAG splits cleanly into two phases that happen at very different times. <b>Index-time</b> (done once, or whenever documents change): split source documents into digestible passages ("chunking," next section), run each chunk through an embedding model to get a fixed-size vector, and store (chunk text, chunk vector) pairs in a vector database — a system purpose-built for fast similarity search over large vector collections (Pinecone, Weaviate, Milvus, or a lighter-weight library like FAISS, or even pgvector bolted onto ordinary Postgres).',
        '<b>Query-time</b> (done on every user request): embed the user\'s QUESTION with the SAME embedding model used at index-time (mismatched embedding models produce vectors that don\'t live in a comparable space — a common, subtle bug), search the vector database for the top-k chunks whose vectors are closest to the query vector (cosine similarity or dot product, exactly the vectors-cosine lesson\'s math), and construct a prompt that places those retrieved chunks directly into the LLM\'s context alongside the original question — typically with an explicit instruction like "answer using only the information in the context below." The LLM then generates a response GROUNDED in the retrieved text, rather than relying purely on what it happened to memorize during pretraining.',
        '<div class="math">index-time: documents → chunks → embed → store (vector, text)<br>query-time: question → embed → search (top-k nearest) → prompt = context + question → LLM answer<span class="mnote">the SAME embedding function must be used on both sides, or "closeness" in vector space means nothing</span></div>'
      ]
    },
    {
      h: 'Chunking: the unglamorous decision that determines everything downstream',
      p: [
        'You cannot simply embed an entire 50-page document as one vector and expect useful retrieval — a single embedding is a fixed-size summary, and averaging a huge amount of varied content into one vector dilutes exactly the specific signal a narrow query needs to match against (imagine averaging every paragraph\'s "topic" together — the result resembles no paragraph in particular). Documents must be split into smaller CHUNKS before embedding, and the size of those chunks is a genuine, consequential trade-off, not an arbitrary implementation detail.',
        'Chunks too SMALL lose context: a chunk containing only "the deductible is $500" without the surrounding sentence clarifying WHICH plan that refers to is retrievable but nearly useless once retrieved. Chunks too LARGE hurt retrieval PRECISION (the same dilution problem as embedding a whole document, just at a smaller scale) and waste the LLM\'s context budget on irrelevant surrounding text once retrieved — recall the self-attention lesson\'s O(n²) cost and the inference-sampling lesson\'s KV-cache memory growth: bigger context isn\'t free, computationally or in the LLM\'s tendency to dilute its attention across more (partially irrelevant) text.',
        'A second parameter, <b>overlap</b>, addresses a sharper failure: if chunks are cut at hard, non-overlapping boundaries, an answer-critical sentence can land EXACTLY at a chunk boundary, splitting it across two chunks such that neither chunk alone contains the complete answer. A modest overlap (e.g., the last 10-20% of one chunk repeated as the start of the next) means a boundary-straddling sentence is very likely to appear WHOLE in at least one chunk. More sophisticated pipelines use semantic chunking — splitting at natural document boundaries (paragraphs, section headers) rather than a fixed token count — trading implementation simplicity for chunks that better respect the document\'s actual structure.'
      ]
    },
    {
      h: 'Searching millions of vectors: why exact search doesn\'t scale, and what approximate search trades away',
      p: [
        'Exact nearest-neighbor search — compute the similarity between the query vector and EVERY stored vector, sort, take the top-k — is O(n) per query in the number of stored vectors. Fine for thousands of chunks; prohibitive for the millions or billions of chunks a large-scale production system might index, where a single query would need to touch every vector in the database, every time.',
        '<b>Approximate Nearest Neighbor (ANN)</b> search trades a small, usually acceptable amount of recall (occasionally missing the technically-closest vector) for a massive speedup, via two dominant families of technique. <b>IVF (Inverted File Index)</b>: cluster all stored vectors into partitions ahead of time (via k-means-style clustering — literally the clustering-pca lesson\'s algorithm, applied to embedding vectors), and at query time, only search the handful of partitions whose CENTROID is closest to the query — narrowing the search space dramatically before doing any fine-grained comparison, at the cost of occasionally missing a genuinely close vector that happened to land in a different partition than expected. <b>HNSW (Hierarchical Navigable Small World graphs)</b>: build a multi-layer graph where each vector is a node connected to its approximate nearest neighbors, with sparser, longer-range connections at higher layers and denser, short-range connections at the bottom layer — search starts at the sparse top layer, greedily hops toward whichever neighbor is closest to the query, and descends layer by layer, narrowing in — conceptually a skip-list (a familiar data-structure idea) generalized to vector space. Most production vector databases default to HNSW or a close variant, because it offers a strong recall-versus-speed trade-off across a wide range of dataset sizes.'
      ]
    },
    {
      h: 'Retrieval failure versus generation failure: two different bugs, two different fixes',
      p: [
        'A RAG system that gives a wrong or unsatisfying answer can be failing in one of two genuinely different places, and conflating them wastes debugging effort. <b>Retrieval failure</b>: the relevant chunk was never retrieved at all — no amount of prompt engineering can fix an answer that\'s missing its source material, because the LLM never saw it. Diagnosed by building a small labeled evaluation set of (query, known-relevant-chunk) pairs and measuring <b>recall@k</b> — for what fraction of queries does the truly relevant chunk appear in the top-k retrieved results — exactly the model-evaluation lesson\'s discipline, applied to the retrieval component specifically, independent of whatever the LLM does afterward.',
        '<b>Generation failure</b>: the relevant chunk WAS retrieved and IS sitting in the LLM\'s context, but the model ignored it, misread it, or answered from its own (possibly outdated or wrong) pretrained knowledge instead — a "faithfulness" or "groundedness" failure. This is fixed differently: stronger prompt instructions ("answer ONLY using the provided context; if the answer isn\'t in the context, say so"), asking the model to CITE which chunk supports each claim (making unfaithful answers easier to catch), or a more careful evaluation specifically checking whether the generated answer is actually SUPPORTED by the retrieved text, not just plausible-sounding.',
        'A common refinement worth knowing by name: <b>re-ranking</b> — retrieve a larger, cheap initial candidate set (say, top-50) using fast ANN search, then run a smaller, slower, more accurate model over just those 50 candidates to re-score and re-order them, keeping only the true top-k for the final prompt. This two-stage "cheap wide net, then expensive precise sieve" pattern gets most of a much-more-expensive exhaustive search\'s accuracy at a fraction of the cost, since the expensive step only ever runs over a small shortlist rather than the entire corpus.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin builds a library instead of memorizing the world',
      text: 'After years of translating Poneglyphs one at a time, Robin faces a new kind of question — the crew wants to know things faster than she can recall from memory, and about specifics she never deliberately memorized in the first place. She could try to cram every scroll, every newspaper, every archive she\'s ever read into her own head (the fine-tuning approach — and she knows, from painful experience, how unreliable that is for a fact she only skimmed once, competing against everything else she already "believes"). Instead she builds something smarter: a proper LIBRARY. She takes every long scroll and cuts it into digestible SECTIONS — not too short (a fragment reading only "...beneath the sea" with no context is useless once pulled) and not too long (a section covering six unrelated topics is impossible to search precisely and wastes a reader\'s time on irrelevant parts). Early on, she cuts a section exactly between an important claim and the sentence proving it, splitting the answer across two shelves — after that mistake, she starts overlapping the end of each section with the start of the next, so an important passage almost never gets orphaned at a cut. On the corner of every section, she writes a short "topic fingerprint" — a few words distilling what that section is really ABOUT, positioned so that similarly-themed sections end up shelved near each other. When someone asks her a question, she doesn\'t reread her whole library from page one — she works out the FINGERPRINT of the question itself, walks straight to the shelves whose fingerprints are closest, and pulls just those few sections. For her personal, modest collection, checking every shelf by hand is still fast enough. But for the true Ohara-scale archive — thousands upon thousands of scrolls — even fingerprint-matching shelf by shelf is too slow, so she pre-sorts the whole archive into labeled WINGS first (history, biology, ancient script, weaponry) and only searches the one or two most promising wings in detail, rather than the entire building; other days she navigates by "you might also want this shelf" cross-reference threads strung between related sections, hopping from thread to thread toward the answer instead of scanning room by room. And she learns to tell two VERY different problems apart when an answer disappoints someone: sometimes the right section was never pulled off the shelf at all (a real gap in her search); other times the right section was sitting right in her hands and she answered from vague memory anyway instead of actually reading what she was holding — two different mistakes, needing two completely different fixes.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s recipe box',
      text: 'Monica owns an enormous recipe box, built over years, and long ago gave up trying to remember every recipe from memory when someone asks for a suggestion — too much to hold reliably in her head, and she\'s been embarrassingly wrong before (fine-tuning\'s unreliability, kitchen edition). Instead, every recipe lives on its own CARD — not the entire cookbook crammed onto one card (useless — she\'d never find the ONE relevant recipe in a wall of text), and not torn into fragments so small a card just says "add salt" with no context. Early in the system\'s life, she once cut a recipe exactly between the ingredient list and the instructions, and only half made it onto the card that got pulled during a dinner emergency — after that, she starts writing the last line of each recipe\'s ingredients at the TOP of the next card too, so nothing critical ever gets orphaned at a cut. In the corner of every card, she jots a quick "flavor tag" — a few words capturing what the dish is really about — positioned so that similar dishes\' cards naturally cluster together in the box. When Chandler asks "what\'s something mild for date night that isn\'t pasta again," Monica doesn\'t recite the whole box from memory — she works out the TAG for what he\'s asking, flips straight to the cluster of cards with the closest tags, pulls just those few, and answers using what\'s ACTUALLY written on the cards in her hand. For her personal box, flipping through the relevant cluster by hand is still fast enough. But the restaurant\'s FULL card catalog, built over a decade, is far too large to flip through card by card — so the kitchen pre-sorts everything into labeled dividers (appetizers, mains, mild, spicy) and only searches the one or two most promising dividers, or follows little "see also" sticky notes strung between related cards, hopping from note to note instead of searching the whole box drawer by drawer. And when Chandler complains an answer used an ingredient the actual recipe never called for, Monica is careful to diagnose it correctly: was the right card never pulled at all (a real search failure), or was the card sitting right there and whoever answered just didn\'t stick to what was written on it (a completely different problem, with a completely different fix)?'
    },
    why: 'Cut the source into digestible, slightly-overlapping pieces (chunking, with overlap protecting boundary-straddling answers), tag each piece so similar pieces cluster together (embeddings), find the tags closest to a new question instead of rereading everything (nearest-neighbor search — pre-sorted into wings/dividers, or graph-hopped, once the collection gets too big to search by hand), and always tell apart "the right piece was never found" from "the right piece was found but ignored" — two different failures needing two different fixes.'
  },
  storyAnim: {
    title: 'Robin\'s library, query to answer',
    h: 280,
    props: [
      { id: 'scroll', emoji: '📜', label: 'long scroll', x: 10, y: 12 },
      { id: 'sections', emoji: '📑', label: 'overlapping sections (chunks)', x: 32, y: 12 },
      { id: 'tags', emoji: '🏷️', label: 'topic fingerprints (embeddings)', x: 54, y: 12 },
      { id: 'wings', emoji: '🏛️', label: 'sorted into wings (IVF clusters)', x: 78, y: 12 },
      { id: 'question', emoji: '❓', label: 'question arrives', x: 15, y: 50 },
      { id: 'qtag', emoji: '🏷️', label: 'question\'s own fingerprint', x: 40, y: 50 },
      { id: 'pulled', emoji: '📄', label: 'top-k closest sections pulled', x: 65, y: 50 },
      { id: 'answer', emoji: '💬', label: 'answer grounded in pulled sections', x: 88, y: 50 },
      { id: 'gap', emoji: '❌', label: 'retrieval failure: never pulled', x: 30, y: 84 },
      { id: 'ignored', emoji: '⚠️', label: 'generation failure: pulled but ignored', x: 68, y: 84 }
    ],
    actors: [
      { id: 'robin', emoji: '🌸', label: 'Robin', x: 50, y: 32 }
    ],
    steps: [
      { c: 'A long scroll is cut into overlapping sections — not too short, not too long, and never cleanly split at a critical sentence.', p: { scroll: 'lit', sections: 'good' } },
      { c: 'Every section gets a topic fingerprint, positioned so similar sections cluster together.', p: { tags: 'good' } },
      { c: 'For a truly vast archive, sections are pre-sorted into labeled wings, so a search never has to scan the whole building.', p: { wings: 'good' } },
      { c: 'A question arrives. Robin computes the QUESTION\'S OWN fingerprint — same method, same space.', p: { question: 'lit', qtag: 'good' }, a: { robin: [40, 40] } },
      { c: 'She walks straight to the closest-fingerprint sections and pulls just the top few — not the whole library.', p: { pulled: 'good' } },
      { c: 'She answers using ONLY what\'s actually written on the sections in her hands.', p: { answer: 'good' } },
      { c: 'Two different failures to tell apart: the right section never pulled at all (retrieval failure)...', p: { gap: 'bad' } },
      { c: '...versus the right section WAS pulled, but the answer ignored it anyway (generation failure). Different bugs, different fixes.', p: { ignored: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: Robin\'s library, query to answer',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Chunk',
        nodes: [
          { id: 'sections', text: 'Overlapping sections\nchunk_size=200, overlap=40 — never split at a critical sentence' },
        ],
      },
      {
        label: 'Embed + index',
        nodes: [
          { id: 'tags', text: 'Topic fingerprints (embeddings)\nsimilar sections cluster together' },
          { id: 'wings', text: 'Sorted into wings (IVF/HNSW)\nsearch only the closest wings, not the whole archive' },
        ],
      },
      {
        label: 'Retrieve',
        nodes: [
          { id: 'qtag', text: 'Question gets its own fingerprint\nsame embedding model, same space' },
          { id: 'pulled', text: 'Top-k closest sections pulled\nnot the whole library, just the relevant few' },
        ],
      },
      {
        label: 'Two failure modes',
        nodes: [
          { id: 'gap', text: 'Retrieval failure\nright section never pulled at all' },
          { id: 'ignored', text: 'Generation failure\nright section pulled, but answer ignored it' },
        ],
      },
    ],
    steps: [
      { active: ['sections'], note: 'A long document is cut into overlapping chunks — not too short (loses context), not too long (dilutes the embedding), and overlap protects any sentence that would otherwise land exactly on a cut.' },
      { active: ['tags'], note: 'Every chunk gets embedded into a fixed-size vector — the vectors-cosine lesson\'s geometry, industrialized, so similar-topic chunks land near each other in vector space.' },
      { active: ['wings'], note: 'For a truly vast archive, chunks are pre-sorted (IVF clusters or an HNSW graph) so a search only ever touches a handful of the most promising regions, not every stored vector.' },
      { active: ['qtag'], note: 'At query time, the question is embedded with the exact SAME model used at index-time — mismatched embedding models produce vectors that live in incomparable spaces.' },
      { active: ['pulled'], note: 'Search returns the top-k closest chunks by cosine similarity — a small, focused set, not the entire corpus, handed directly into the LLM\'s context.' },
      { active: ['gap'], note: 'Failure mode one: the relevant chunk was never retrieved in the first place. No prompt engineering fixes this — the LLM never saw it. Diagnosed with recall@k, measured in isolation from generation.' },
      { active: ['ignored'], note: 'Failure mode two: the relevant chunk WAS retrieved and sat right in the context, but the model answered from its own memory instead of reading it. A completely different bug, fixed with grounding instructions and faithfulness checks, not retrieval changes.' },
    ],
  },
  tech: [
    {
      q: 'Why not just paste an entire large document (or corpus) directly into the LLM\'s context instead of building a retrieval pipeline?',
      a: 'Three compounding reasons. Context limits: even generous context windows are finite, and a large corpus (a whole knowledge base, a full set of product docs) routinely exceeds any practical context length by orders of magnitude — retrieval is not optional past a certain corpus size, it is the only way to fit the relevant fraction into context at all. Cost and latency: self-attention is O(n²) in sequence length (the self-attention lesson), and processing a much longer context costs proportionally more compute and time on every single query, even the ones that only needed one specific sentence from deep inside a huge document — retrieval keeps the context small and focused, paying that cost only for the relevant fragment. Precision and dilution: even when a large document DOES fit in context, burying the one relevant paragraph inside dozens of irrelevant ones measurably increases the chance the model\'s attention gets diluted or distracted by irrelevant surrounding text ("needle in a haystack" degradation, a documented real-world failure pattern in long-context models) — a short, precisely retrieved context is easier for the model to use correctly than a long, mostly-irrelevant one, even when both technically fit.'
    },
    {
      q: 'Explain IVF and HNSW at the mechanism level, and what "approximate" actually gives up.',
      a: 'IVF (Inverted File Index) runs an offline clustering step (k-means-style, exactly the clustering-pca lesson\'s algorithm) over the full vector collection, producing a fixed set of cluster centroids and assigning every stored vector to its nearest centroid\'s partition. At query time, the query vector is compared only against the CENTROIDS first (a small, fast comparison), and only the vectors inside the nearest few centroids\' partitions are then searched in full — narrowing an O(n) search down to O(vectors in a handful of partitions), a large speedup when the number of partitions is well-chosen. What it gives up: a genuinely close vector that happens to sit near a PARTITION BOUNDARY (close to the query, but assigned to a different partition than the one searched) can be missed entirely — recall is not guaranteed, only approximated, and tuning how many partitions to search (nprobe) trades speed against recall directly. HNSW builds a multi-layer graph where each vector connects to a small set of approximately-nearest other vectors, with layers becoming progressively denser (more, shorter-range connections) from top to bottom — search starts at a random entry point in the sparse top layer, greedily moves to whichever neighbor is closest to the query at each step, and drops down a layer once no closer neighbor exists at the current layer, repeating until the bottom, densest layer yields the final approximate result. What it gives up: because the search is a GREEDY local walk rather than an exhaustive comparison, it can settle into a locally-good-but-not-globally-best neighborhood (a local optimum), missing a genuinely closer vector reachable only via a path the greedy walk didn\'t take — again, approximate, with graph construction parameters (like how many neighbors each node connects to) trading index build time and memory against search recall and speed.'
    },
    {
      q: 'How do you specifically diagnose whether a RAG system\'s bad answer is a retrieval failure or a generation failure?',
      a: 'Build a small, labeled evaluation set of (query, ground-truth-relevant chunk ID) pairs — ideally drawn from real or realistic user queries against the actual indexed corpus. For each query, run ONLY the retrieval step (no LLM generation involved yet) and check whether the known-relevant chunk appears in the top-k retrieved results — this is recall@k, and it isolates retrieval quality completely independent of what the LLM does afterward. If recall@k is low, that IS the primary bug, and the fix is retrieval-side: reconsider chunk size/overlap, try a different or fine-tuned embedding model, tune the ANN search\'s recall/speed trade-off (e.g., search more IVF partitions or widen HNSW\'s search parameter), or add a re-ranking stage. If recall@k is high (the relevant chunk IS reliably retrieved) but end-to-end answer quality is still poor, the bug is on the generation side: inspect the actual prompts being sent to the LLM (is the retrieved chunk genuinely present and legible in the final context, not truncated or malformed?), check whether the model is citing/using the provided context versus answering from its own pretrained knowledge (a faithfulness check — does the generated answer\'s claims actually trace back to something present in the retrieved text), and consider stronger prompt instructions or explicit citation requirements. Running these as two SEPARATE evaluations (retrieval recall@k in isolation, then end-to-end faithfulness given known-good retrieval) is the only reliable way to avoid mis-attributing a retrieval bug to "the LLM is bad at this" or vice versa — exactly the model-evaluation lesson\'s discipline, applied per-component rather than only end-to-end.'
    },
    {
      q: 'Precisely explain the mechanism behind chunk-size trade-offs: why does embedding a too-large chunk hurt retrieval, specifically?',
      a: 'An embedding model produces ONE fixed-size vector summarizing whatever text it\'s given — for a well-chosen chunk (a coherent paragraph or two about roughly one topic), that vector meaningfully represents the chunk\'s content, and a query about that specific topic will produce a nearby vector (the vectors-cosine lesson\'s geometry). As chunk size grows to cover MULTIPLE distinct topics or sub-points, the single embedding vector becomes an average-ish blend of all of them — it no longer sits close to any ONE topic\'s natural region in vector space, but somewhere in a diffuse middle ground influenced by everything the chunk contains. A query about just ONE of those sub-topics will be less close to this "diluted" vector than it would have been to a chunk embedding just that sub-topic alone, directly reducing retrieval precision — the correct chunk can rank lower than it should, or even fall out of the top-k entirely, purely because its embedding was diluted by unrelated content sharing the same chunk. This is a direct, mechanistic consequence of embeddings being FIXED-SIZE summaries (the word-embeddings lesson\'s single-vector-per-unit idea, here applied per-chunk rather than per-word) — there is no free way to "embed more content just as precisely" by making a vector represent more text; more content per vector necessarily means less precision per topic represented.'
    }
  ],
  code: {
    title: 'A minimal RAG pipeline in Python',
    intro: 'The whole pipeline — chunk, embed, index, retrieve, prompt — in about thirty lines, using a real embedding model and a lightweight FAISS index.',
    code: `from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

embedder = SentenceTransformer("all-MiniLM-L6-v2")     # a small, fast embedding model

def chunk_text(text, chunk_size=200, overlap=40):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        chunks.append(" ".join(words[start:start + chunk_size]))
        start += chunk_size - overlap                   # step forward, leaving overlap words repeated
    return chunks

# --- Index-time ---
documents = [open(f).read() for f in ["policy.txt", "faq.txt", "manual.txt"]]
all_chunks = [c for doc in documents for c in chunk_text(doc)]
chunk_vectors = embedder.encode(all_chunks, normalize_embeddings=True)   # normalized -> dot product = cosine sim

index = faiss.IndexFlatIP(chunk_vectors.shape[1])        # exact search; swap for IndexIVFFlat/HNSW at scale
index.add(np.array(chunk_vectors))

# --- Query-time ---
def retrieve(query, k=4):
    query_vec = embedder.encode([query], normalize_embeddings=True)
    scores, idxs = index.search(np.array(query_vec), k)
    return [all_chunks[i] for i in idxs[0]]

def build_prompt(query, retrieved_chunks):
    context = "\\n\\n---\\n\\n".join(retrieved_chunks)
    return f"""Answer the question using ONLY the context below. If the answer isn't in the context, say so.

Context:
{context}

Question: {query}
Answer:"""

query = "What's the cancellation policy for a plan upgraded mid-cycle?"
retrieved = retrieve(query)
prompt = build_prompt(query, retrieved)
# prompt -> any LLMProvider.generate(prompt) from the using-models-apis lesson's interface`,
    notes: [
      'normalize_embeddings=True makes cosine similarity computable as a plain dot product (IndexFlatIP = "inner product") — the vectors-cosine lesson\'s identity that cosine similarity IS dot product on unit-length vectors, used here for real speed.',
      'IndexFlatIP is EXACT search — fine for a small demo corpus. Swapping to faiss.IndexIVFFlat or an HNSW-based index is a one-line change for datasets too large for exact search, with the same retrieve() code otherwise unchanged.',
      'build_prompt\'s explicit "using ONLY the context below... if the answer isn\'t in the context, say so" instruction is doing real work — it directly targets the generation-failure mode of the LLM answering from its own memory instead of the retrieved text.',
      'chunk_text\'s overlap=40 means the last 40 words of one chunk repeat as part of the next chunk\'s content — cheap insurance against an answer-critical sentence landing exactly on a chunk boundary.'
    ]
  },
  lab: {
    title: 'Chunking, cosine retrieval, and grounded prompt construction',
    prompt: 'Pure Python, fully runnable. Implement (1) <code>chunk_text(words, chunk_size, overlap)</code> — split a list of words into overlapping chunks (return a list of word-lists); (2) <code>cosine_similarity(a, b)</code> — standard cosine similarity between two equal-length vectors; (3) <code>retrieve_top_k(query_vec, chunk_vecs, k)</code> — return the indices of the k chunks with highest cosine similarity to the query, sorted best-first; (4) <code>build_grounded_prompt(query, retrieved_texts)</code> — return a prompt string containing an explicit "only use this context" instruction, the joined context, and the question.',
    starter: `import math

def chunk_text(words, chunk_size, overlap):
    # words: list of strings. Return a list of chunks (each a list of words),
    # stepping forward by (chunk_size - overlap) each time.
    ...

def cosine_similarity(a, b):
    # standard cosine similarity between two equal-length lists of floats
    ...

def retrieve_top_k(query_vec, chunk_vecs, k):
    # return the indices (into chunk_vecs) of the k highest-similarity chunks, best first
    ...

def build_grounded_prompt(query, retrieved_texts):
    # must include an instruction to use ONLY the provided context,
    # the joined retrieved_texts, and the query
    ...`,
    checks: [
      { re: 'def\\s+chunk_text\\s*\\(', must: true, hint: 'Define chunk_text(words, chunk_size, overlap) returning overlapping chunks.', pass: 'chunk_text() defined' },
      { re: 'def\\s+cosine_similarity\\s*\\(', must: true, hint: 'Define cosine_similarity(a, b).', pass: 'cosine_similarity() defined' },
      { re: 'def\\s+retrieve_top_k\\s*\\(', must: true, hint: 'Define retrieve_top_k(query_vec, chunk_vecs, k) returning indices sorted best-first.', pass: 'retrieve_top_k() defined' },
      { re: 'def\\s+build_grounded_prompt\\s*\\(', must: true, hint: 'Define build_grounded_prompt(query, retrieved_texts).', pass: 'build_grounded_prompt() defined' },
      { re: 'only|ONLY|context', must: true, hint: 'build_grounded_prompt must include an explicit instruction to use only the provided context.', pass: 'grounding instruction present' }
    ],
    tests: `# chunk_text: correct chunk size and overlap
words = ["w" + str(i) for i in range(10)]   # w0..w9
chunks = chunk_text(words, chunk_size=4, overlap=1)
assert chunks[0] == ["w0", "w1", "w2", "w3"], chunks[0]
assert chunks[1] == ["w3", "w4", "w5", "w6"], chunks[1]   # w3 repeated -- the overlap
assert chunks[2] == ["w6", "w7", "w8", "w9"], chunks[2]

# cosine_similarity: identical vectors -> 1.0, orthogonal -> 0.0, opposite -> -1.0
assert abs(cosine_similarity([1.0, 0.0], [1.0, 0.0]) - 1.0) < 1e-9
assert abs(cosine_similarity([1.0, 0.0], [0.0, 1.0]) - 0.0) < 1e-9
assert abs(cosine_similarity([1.0, 0.0], [-1.0, 0.0]) - (-1.0)) < 1e-9

# retrieve_top_k: correct ranking by cosine similarity, best first
query_vec = [1.0, 0.0]
chunk_vecs = [
    [0.0, 1.0],    # orthogonal -- worst
    [0.9, 0.1],    # very close -- best
    [0.5, 0.5],    # middling
]
top2 = retrieve_top_k(query_vec, chunk_vecs, k=2)
assert top2 == [1, 2], f"expected [1, 2] (best-first), got {top2}"

# build_grounded_prompt: contains the grounding instruction, the context, and the query
prompt = build_grounded_prompt("What is the deductible?", ["The deductible is $500.", "Coverage begins in January."])
assert "deductible" in prompt.lower() or "What is the deductible?" in prompt
assert "$500" in prompt and "January" in prompt
assert "context" in prompt.lower() or "only" in prompt.lower()
print("Chunking + cosine retrieval + grounded prompting. The full RAG pipeline, from scratch.")`,
    runnable: true,
    solution: `import math

def chunk_text(words, chunk_size, overlap):
    chunks = []
    start = 0
    step = chunk_size - overlap
    while start < len(words):
        chunks.append(words[start:start + chunk_size])
        start += step
    return chunks

def cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    return dot / (norm_a * norm_b)

def retrieve_top_k(query_vec, chunk_vecs, k):
    sims = [(i, cosine_similarity(query_vec, v)) for i, v in enumerate(chunk_vecs)]
    sims.sort(key=lambda pair: pair[1], reverse=True)
    return [i for i, _ in sims[:k]]

def build_grounded_prompt(query, retrieved_texts):
    context = "\\n\\n---\\n\\n".join(retrieved_texts)
    return (
        "Answer the question using ONLY the context below. "
        "If the answer isn't in the context, say so.\\n\\n"
        f"Context:\\n{context}\\n\\n"
        f"Question: {query}\\nAnswer:"
    )`,
    notes: [
      'The chunk_text test is worth tracing by hand: chunk_size=4, overlap=1 means step=3, so chunk 1 starts at word index 3 — the SAME word that ended chunk 0 — exactly the boundary-protection mechanism from the lesson.',
      'retrieve_top_k reuses cosine_similarity directly — this is the entire "search" step of a real vector database, minus the approximate-search speedups (IVF/HNSW) that make it fast at millions of vectors instead of dozens.',
      'build_grounded_prompt\'s structure (instruction, then context, then question) mirrors real production RAG prompts almost exactly — the main thing a production system adds is token-budget-aware truncation if the retrieved context risks exceeding the model\'s context window.'
    ]
  },
  quiz: [
    {
      q: 'What problem does RAG solve that fine-tuning is poorly suited for, per the fine-tuning-lora lesson\'s rule?',
      options: ['Giving the model access to specific, current, or frequently-changing facts, without needing to retrain whenever those facts change', 'Teaching the model a new response format or tone', 'Making the model generate faster', 'Reducing the model\'s parameter count'],
      correct: 0,
      explain: '"Fine-tune for behavior, retrieve for knowledge" — RAG hands the model the current, actual text at query time rather than trying to bake facts into weights, so updating the source documents updates every subsequent answer immediately.'
    },
    {
      q: 'Why must chunks be neither too small nor too large?',
      options: ['Too-small chunks lose surrounding context needed to answer well; too-large chunks dilute the embedding\'s topic signal and hurt retrieval precision', 'Chunk size only affects storage cost, never answer quality', 'Larger chunks always improve both retrieval and generation quality', 'Smaller chunks always retrieve more accurately regardless of content'],
      correct: 0,
      explain: 'A chunk embedding is a single fixed-size vector — too much varied content dilutes it away from any one topic\'s region in vector space, while too little content strips away context the retrieved passage needs to actually answer the question.'
    },
    {
      q: 'What does approximate nearest neighbor (ANN) search trade away compared to exact search, and why is that trade generally acceptable?',
      options: ['A small amount of recall (occasionally missing the technically closest vector) in exchange for search speed that scales to millions or billions of vectors, where exact O(n) search becomes impractical', 'ANN search trades away all accuracy for infinite speed', 'ANN search is always slower than exact search but more accurate', 'ANN eliminates the need for embeddings entirely'],
      correct: 0,
      explain: 'IVF and HNSW both narrow the search space before comparing in detail, occasionally missing a boundary-case vector — a worthwhile trade since exact search over huge collections is computationally prohibitive at query time.'
    },
    {
      q: 'A RAG system gives a wrong answer. Recall@k testing shows the correct chunk WAS retrieved in the top-k. What kind of failure is this, and what fixes it?',
      options: ['A generation failure — the LLM had the right context but didn\'t use it faithfully; fixed with stronger grounding instructions, citation requirements, or faithfulness-focused evaluation, not retrieval changes', 'A retrieval failure — the embedding model needs to be replaced', 'A chunking failure — chunk size needs to be increased', 'This indicates the vector database is corrupted'],
      correct: 0,
      explain: 'If recall@k confirms the relevant chunk WAS retrieved, the bug is downstream — in how the LLM used (or ignored) the context it was given — a different problem from retrieval, needing a different fix.'
    },
    {
      q: 'What does re-ranking add to a RAG retrieval pipeline, and why is it structured as a two-stage process?',
      options: ['A fast, cheap initial search retrieves a larger candidate set, then a slower, more accurate model re-scores just that shortlist — getting most of an expensive exhaustive search\'s accuracy at a fraction of the cost', 'Re-ranking replaces the need for chunking entirely', 'Re-ranking is only used to speed up the embedding model itself', 'Re-ranking eliminates the need for a vector database'],
      correct: 0,
      explain: 'The expensive, more accurate re-ranking model only ever runs over a small shortlist (e.g. top-50) rather than the entire corpus, making high-accuracy scoring computationally affordable.'
    }
  ],
  testFlow: {
    title: 'Test yourself: embeddings, vector search & RAG',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'What problem does RAG solve that fine-tuning is poorly suited for?',
        choices: [
          { text: 'Giving the model access to specific, current, or frequently-changing facts, without needing to retrain whenever those facts change', to: 'q1_right' },
          { text: 'Teaching the model a new response format or consistent tone', to: 'q1_wrong_format' },
          { text: 'Making the model\'s forward pass run faster per token', to: 'q1_wrong_speed' },
        ],
      },
      q1_right: { end: true, correct: true, text: '"Fine-tune for behavior, retrieve for knowledge" — RAG hands the model the current, actual text at query time rather than trying to bake facts into weights, so updating the source documents updates every subsequent answer immediately.', next: 'q2' },
      q1_wrong_format: { end: true, correct: false, text: 'That\'s exactly what fine-tuning (SFT) IS well-suited for — teaching format and tone is a behavior-shaping task, the opposite of the knowledge-injection problem RAG solves.', retry: 'q1' },
      q1_wrong_speed: { end: true, correct: false, text: 'RAG actually adds a retrieval step and typically a longer context — it doesn\'t make token generation itself faster. Its value is answer correctness and freshness, not raw speed.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'Why must chunks be neither too small nor too large?',
        choices: [
          { text: 'Too-small chunks lose surrounding context needed to answer well; too-large chunks dilute the embedding\'s topic signal and hurt retrieval precision', to: 'q2_right' },
          { text: 'Chunk size only ever affects storage cost, never answer quality', to: 'q2_wrong_storage' },
          { text: 'Larger chunks always improve both retrieval and generation quality', to: 'q2_wrong_larger' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Right — a chunk embedding is one fixed-size vector. Too much varied content dilutes it away from any one topic\'s region in vector space; too little content strips away the context needed to actually answer once retrieved.', next: 'q3' },
      q2_wrong_storage: { end: true, correct: false, text: 'Chunk size has a direct, measurable effect on retrieval PRECISION (via embedding dilution) and on answer usability, not just storage footprint.', retry: 'q2' },
      q2_wrong_larger: { end: true, correct: false, text: 'Larger chunks actually HURT retrieval precision by diluting the embedding across multiple topics, and waste context budget once retrieved — bigger is not automatically better.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A RAG system gives a wrong answer. Recall@k testing shows the correct chunk WAS retrieved in the top-k. What kind of failure is this?',
        choices: [
          { text: 'A generation failure — the LLM had the right context but didn\'t use it faithfully; fixed with stronger grounding instructions or citation requirements', to: 'q3_right' },
          { text: 'A retrieval failure — the embedding model must be replaced immediately', to: 'q3_wrong_retrieval' },
          { text: 'This means the vector database itself is corrupted', to: 'q3_wrong_corrupt' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — if recall@k confirms the relevant chunk WAS retrieved, the bug is downstream, in how the LLM used (or ignored) the context it was given. A different problem from retrieval, needing a different fix entirely.', next: null },
      q3_wrong_retrieval: { end: true, correct: false, text: 'Recall@k already confirmed retrieval worked correctly for this query — the relevant chunk made it into the top-k. Blaming the embedding model here would be fixing a component that isn\'t actually broken.', retry: 'q3' },
      q3_wrong_corrupt: { end: true, correct: false, text: 'A successful retrieval (confirmed by recall@k) is strong evidence the vector database is working fine — the failure is happening after retrieval, in generation, not in storage or search.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Using a different embedding model at query-time than the one used at index-time — vectors from different embedding models don\'t live in a comparable space, and "similarity" between them is meaningless.',
    'Choosing chunk size and overlap arbitrarily without testing on real queries — this is one of the single highest-leverage tuning decisions in a RAG system, worth measuring (via recall@k) rather than guessing.',
    'Conflating retrieval failure and generation failure, and "fixing" the wrong one — always test retrieval quality (recall@k) in isolation before assuming a bad answer means the LLM itself needs a stronger prompt.',
    'Assuming exact search will scale as a corpus grows — a system tested and tuned on a small demo corpus can hit real latency problems at production scale if it never migrates from exact to approximate (IVF/HNSW) search.',
    'Retrieving too few chunks (missing relevant information spread across multiple passages) or too many (diluting the LLM\'s context with irrelevant material, and inflating cost/latency per the self-attention lesson\'s O(n²) cost) — k is a real, tunable, measurable parameter, not a default to leave unexamined.',
    'Treating RAG as a complete substitute for fine-tuning or vice versa — many production systems legitimately need both: RAG for current/specific facts, fine-tuning for consistent output format, tone, or task-specific behavior layered on top.'
  ],
  interview: [
    {
      q: 'Walk through the complete RAG pipeline, from raw documents to a generated answer, naming every stage and what could go wrong at each.',
      a: 'Index-time: (1) documents are split into CHUNKS — sized and overlapped carefully, since too-large chunks dilute embeddings and too-small chunks lose context, and hard boundaries risk splitting an answer-critical sentence across two chunks; (2) each chunk is embedded into a fixed-size vector via an embedding model — must be the SAME model used later at query time; (3) (vector, text) pairs are stored in a vector database, indexed for fast search (exact for small corpora, approximate via IVF or HNSW for large ones, trading a little recall for large speed gains). Query-time: (4) the user\'s question is embedded with the identical embedding model; (5) the vector database returns the top-k most similar chunks (cosine similarity or dot product) — this step can fail via retrieval failure, where the truly relevant chunk never makes it into the top-k, diagnosed with a labeled recall@k evaluation; (6) the retrieved chunks are assembled into a prompt alongside the question, typically with an explicit "answer only using this context" instruction; (7) the LLM generates a response — this step can fail via generation/faithfulness failure, where the model ignores or misreads the provided context and answers from its own (possibly wrong or outdated) internal knowledge instead, diagnosed separately from retrieval failure via faithfulness checks on cases where retrieval is already confirmed working. A production system also often adds re-ranking between steps 5 and 6 — a cheap wide retrieval followed by a more accurate re-scoring of just the shortlist.'
    },
    {
      q: 'Compare IVF and HNSW as approximate nearest-neighbor search strategies — mechanism, trade-offs, and when you might choose one over the other.',
      a: 'IVF clusters the full vector collection offline (k-means-style) into a fixed number of partitions; at query time, the query is compared only to the cluster CENTROIDS, and only the closest few partitions\' vectors are searched in full — a coarse-to-fine narrowing. It gives up recall specifically at partition boundaries (a genuinely close vector assigned to a neighboring, unsearched partition can be missed), and its speed/recall trade-off is tunable via how many partitions to search (nprobe) at query time. HNSW builds a multi-layer graph of approximate neighbor connections and performs a greedy nearest-neighbor walk from a sparse top layer down to a dense bottom layer; it tends to offer strong recall-per-unit-of-search-time across a wide range of scales without needing a separate offline clustering step tuned to dataset size, but its INDEX itself is larger in memory (storing graph connections per vector) and more expensive to BUILD and to incrementally UPDATE (inserting a new vector requires finding its place in the existing graph structure) than IVF\'s comparatively simpler partition-and-reassign approach. Practical choice: HNSW is the more common default in modern vector databases (Pinecone, Weaviate, and FAISS\'s HNSW index) for its generally strong out-of-the-box recall/speed balance; IVF (often combined WITH product quantization for extra memory savings, as IVF-PQ) remains attractive specifically when memory footprint is the binding constraint or when the corpus\'s clustering structure is well understood and stable, making its offline clustering step cheap to maintain.'
    },
    {
      q: 'A team\'s RAG-based customer support bot frequently gives answers that sound right but reference outdated pricing that no longer matches their current documentation. How would you diagnose and fix this?',
      a: 'First isolate WHERE the staleness is coming from — this symptom is consistent with at least three distinct causes, each needing a different fix, and the wrong diagnosis wastes real engineering effort. (1) Stale index: check whether the vector database was actually re-indexed after the pricing documentation changed — if documents were updated but the corresponding chunks/embeddings in the vector store were never regenerated, retrieval is faithfully returning genuinely outdated chunks, and the fix is a re-indexing pipeline (ideally automated, triggered on document changes, not a manual one-off step). (2) Retrieval failure with fallback to pretrained knowledge: run a recall@k check specifically on pricing-related queries against the CURRENT index — if the correct, up-to-date pricing chunk isn\'t reliably in the top-k (perhaps because pricing changed enough that old queries/chunk phrasing no longer matches well), the model may be falling back on outdated information it memorized during pretraining when retrieval comes up empty or irrelevant; fix is retrieval-side (chunking, embedding model, or re-ranking improvements) plus an explicit prompt instruction to refuse rather than guess when context is insufficient. (3) Generation/faithfulness failure: if recall@k confirms the CURRENT, correct pricing chunk IS being retrieved, but the generated answer still cites old numbers, the model is disregarding its provided context in favor of pretrained knowledge — fix is a stronger grounding instruction, an explicit "cite the specific source for any number you state" requirement (making unfaithful answers detectable), or in persistent cases, evaluating whether a different underlying model handles instruction-following/faithfulness more reliably. The concrete first step, regardless of eventual cause: build even a small labeled eval set of current pricing questions with known-correct source chunks, and check recall@k before touching anything else — that single measurement narrows the diagnosis from three plausible causes to one or two immediately.'
    },
    {
      q: 'Design a RAG system for a legal document search tool where wrong answers carry real liability risk. What would you do differently than a typical customer-support RAG bot?',
      a: 'The stakes change several defaults, worth naming explicitly rather than reusing a standard RAG recipe unmodified. (1) Mandatory citation, not optional: every generated claim should be traceable to a specific retrieved passage, with the passage (or a direct quote/reference) shown alongside the answer — this converts an opaque "trust the model" interaction into a verifiable one, letting a human confirm the source before relying on it, which matters enormously more here than in a low-stakes support-bot context. (2) Prefer precision over recall in retrieval tuning, and prefer explicit "I don\'t have enough information to answer confidently" over a plausible-sounding guess — in a customer-support context, an occasional vague or slightly-off answer is a minor annoyance; in a legal context, a confident WRONG answer is the actively dangerous failure mode, which should shift both prompt design (explicitly instructing refusal over speculation) and evaluation priorities (penalizing confident-wrong answers far more heavily than penalizing appropriate refusals, in whatever eval rubric is used). (3) Tighter chunking around legally meaningful units — legal documents have structurally significant boundaries (clauses, sections, defined terms) where naive fixed-size chunking risks splitting a clause from its own qualifying conditions in a way that\'s not just imprecise but actively MISLEADING if retrieved in isolation; semantic chunking respecting document structure is worth the added engineering effort here specifically. (4) Human-in-the-loop review as a designed part of the workflow, not an afterthought — given the liability stakes, positioning the system as a research/drafting AID that surfaces relevant passages for a qualified reviewer to confirm, rather than an autonomous question-answering oracle, is very likely the appropriate scope regardless of how good the underlying retrieval and generation measure — a system-design and product decision as much as a technical one, and worth raising explicitly rather than assuming the technical system alone determines appropriate use.'
    }
  ]
};
