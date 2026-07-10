/*
Master ordered list of study modules for the AI Engineer Course. Drives the
dashboard, nav order, prev/next links on lesson pages, and the interview drill
question pool.
type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)
Times sum to ~34 hours. Order matters: later lessons assume earlier ones.
*/
window.SCHEDULE = [
  // ── Part 0: Orientation ──────────────────────────────────────────────
  { id: 'how-ai-fits-together', title: 'The Map: How AI, ML, DL, NLP, LLMs & Agents Fit Together', category: 'Part 0 — Orientation', timeMin: 30, type: 'lesson' },

  // ── Part 1: Math Prerequisites ───────────────────────────────────────
  { id: 'vectors-cosine', title: 'Vectors, Dot Products & Cosine Similarity', category: 'Part 1 — Math Prerequisites', timeMin: 45, type: 'lesson' },
  { id: 'matrices', title: 'Matrices & Linear Transformations', category: 'Part 1 — Math Prerequisites', timeMin: 40, type: 'lesson' },
  { id: 'eigen-svd', title: 'Eigenvectors, Eigenvalues & SVD', category: 'Part 1 — Math Prerequisites', timeMin: 45, type: 'lesson' },
  { id: 'calculus-gradients', title: 'Calculus for ML: Derivatives, Chain Rule & Gradient Descent', category: 'Part 1 — Math Prerequisites', timeMin: 55, type: 'lesson' },
  { id: 'probability', title: 'Probability: Bayes, Distributions, Expectation', category: 'Part 1 — Math Prerequisites', timeMin: 50, type: 'lesson' },
  { id: 'statistics-mle', title: 'Statistics for ML: Sampling, MLE & Why Loss Functions Exist', category: 'Part 1 — Math Prerequisites', timeMin: 45, type: 'lesson' },
  { id: 'information-theory', title: 'Information Theory: Entropy, Cross-Entropy, KL & Perplexity', category: 'Part 1 — Math Prerequisites', timeMin: 40, type: 'lesson' },

  // ── Part 2: Classical Machine Learning ───────────────────────────────
  { id: 'ml-fundamentals', title: 'ML Fundamentals: Learning, Overfitting & the Bias-Variance Trade-off', category: 'Part 2 — Classical ML', timeMin: 40, type: 'lesson' },
  { id: 'linear-regression', title: 'Linear Regression from Scratch', category: 'Part 2 — Classical ML', timeMin: 45, type: 'lesson' },
  { id: 'logistic-regression', title: 'Logistic Regression & Classification', category: 'Part 2 — Classical ML', timeMin: 40, type: 'lesson' },
  { id: 'text-as-numbers', title: 'Text as Numbers: Bag-of-Words, TF-IDF & Cosine Search', category: 'Part 2 — Classical ML', timeMin: 50, type: 'lesson' },
  { id: 'knn-trees-forests', title: 'KNN, Decision Trees & Random Forests', category: 'Part 2 — Classical ML', timeMin: 45, type: 'lesson' },
  { id: 'clustering-pca', title: 'Unsupervised Learning: K-Means & PCA', category: 'Part 2 — Classical ML', timeMin: 40, type: 'lesson' },
  { id: 'model-evaluation', title: 'Model Evaluation: Precision, Recall, F1, ROC & Cross-Validation', category: 'Part 2 — Classical ML', timeMin: 45, type: 'lesson' },

  // ── Part 3: Deep Learning ────────────────────────────────────────────
  { id: 'neural-networks', title: 'Neural Networks: From Perceptron to MLP', category: 'Part 3 — Deep Learning', timeMin: 55, type: 'lesson' },
  { id: 'backpropagation', title: 'Backpropagation, Step by Step', category: 'Part 3 — Deep Learning', timeMin: 60, type: 'lesson' },
  { id: 'training-neural-nets', title: 'Training Dynamics: Optimizers, Batches, Dropout & BatchNorm', category: 'Part 3 — Deep Learning', timeMin: 50, type: 'lesson' },
  { id: 'pytorch-fundamentals', title: 'PyTorch: Tensors, Autograd & the Training Loop', category: 'Part 3 — Deep Learning', timeMin: 55, type: 'lesson' },
  { id: 'cnn-rnn-tour', title: 'CNNs & RNNs: Why Sequences Broke Everything', category: 'Part 3 — Deep Learning', timeMin: 45, type: 'lesson' },

  // ── Part 4: NLP ──────────────────────────────────────────────────────
  { id: 'tokenization', title: 'Tokenization: From Words to BPE Subwords', category: 'Part 4 — NLP', timeMin: 55, type: 'lesson' },
  { id: 'word-embeddings', title: 'Word Embeddings: word2vec & the Geometry of Meaning', category: 'Part 4 — NLP', timeMin: 55, type: 'lesson' },
  { id: 'seq2seq-attention', title: 'Seq2Seq & the Birth of Attention', category: 'Part 4 — NLP', timeMin: 50, type: 'lesson' },
  { id: 'classic-nlp-tasks', title: 'Classic NLP Tasks with Hugging Face Pipelines', category: 'Part 4 — NLP', timeMin: 40, type: 'lesson' },

  // ── Part 5: Transformers ─────────────────────────────────────────────
  { id: 'self-attention', title: 'Self-Attention: Q, K, V — the Full Math', category: 'Part 5 — Transformers', timeMin: 65, type: 'lesson' },
  { id: 'transformer-architecture', title: 'The Transformer Architecture, Layer by Layer', category: 'Part 5 — Transformers', timeMin: 60, type: 'lesson' },
  { id: 'bert-vs-gpt', title: 'BERT vs GPT: Encoders, Decoders & When to Use Which', category: 'Part 5 — Transformers', timeMin: 45, type: 'lesson' },
  { id: 'minigpt-code', title: 'Build a Mini-GPT in PyTorch', category: 'Part 5 — Transformers', timeMin: 65, type: 'lesson' },

  // ── Part 6: LLM Engineering ──────────────────────────────────────────
  { id: 'llm-pretraining', title: 'Pretraining LLMs: Data, Scaling Laws & Distributed Training', category: 'Part 6 — LLM Engineering', timeMin: 55, type: 'lesson' },
  { id: 'finetuning-lora', title: 'Fine-Tuning: SFT, LoRA & QLoRA', category: 'Part 6 — LLM Engineering', timeMin: 65, type: 'lesson' },
  { id: 'rlhf-alignment', title: 'Alignment: RLHF, Reward Models & DPO', category: 'Part 6 — LLM Engineering', timeMin: 45, type: 'lesson' },
  { id: 'inference-sampling', title: 'Inference: Sampling, KV Cache, Quantization & Serving', category: 'Part 6 — LLM Engineering', timeMin: 55, type: 'lesson' },
  { id: 'using-models-apis', title: 'Using Models: APIs, Hugging Face, Ollama & Choosing the Right Tier', category: 'Part 6 — LLM Engineering', timeMin: 55, type: 'lesson' },

  // ── Part 7: RAG & Agents ─────────────────────────────────────────────
  { id: 'embeddings-rag', title: 'Embeddings, Vector Databases & Building RAG', category: 'Part 7 — RAG & Agents', timeMin: 65, type: 'lesson' },
  { id: 'agents-from-scratch', title: 'Agents from Scratch: Tool Use, ReAct & LLM-Agnostic Design', category: 'Part 7 — RAG & Agents', timeMin: 60, type: 'lesson' },
  { id: 'langchain-langgraph', title: 'LangChain & LangGraph', category: 'Part 7 — RAG & Agents', timeMin: 55, type: 'lesson' },
  { id: 'multi-framework-agents', title: 'Agent Frameworks: Google ADK, OpenClaw, CrewAI & MCP', category: 'Part 7 — RAG & Agents', timeMin: 60, type: 'lesson' },
  { id: 'agent-memory-eval-safety', title: 'Agent Memory, Evaluation & Guardrails', category: 'Part 7 — RAG & Agents', timeMin: 45, type: 'lesson' },

  // ── Part 8: Interviews & Career ──────────────────────────────────────
  { id: 'ml-system-design', title: 'ML & LLM System Design Interviews', category: 'Part 8 — Interviews & Career', timeMin: 60, type: 'lesson' },
  { id: 'interview-drill', title: 'Timed Interview Drill (All Topics)', category: 'Part 8 — Interviews & Career', timeMin: 60, type: 'drill', href: 'interview.html' },
];

window.SCHEDULE_TOTAL_MIN = window.SCHEDULE.reduce((s, m) => s + m.timeMin, 0);
