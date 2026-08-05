#!/usr/bin/env python3
"""Devanagari spellings for the AI vocabulary of this voyage.

shared/ne_pronounce.py covers the words the DSA voyage says — array, heap,
graph, index. This course says a few hundred more, and most of them are spoken
aloud on this site for the first time here.

They live in this file rather than in the shared table on purpose. A clip is
cached by the hash of exactly what was sent to the engine, so adding "value" or
"key" or "layer" to shared/ne_pronounce.py would change the spoken text of clips
in the DSA and Java voyages too, and silently invalidate a large finished render
that is already correct. Course-local words stay course-local; when a term turns
out to be genuinely shared, it can be promoted then.

Applied *before* ne_pronounce.to_devanagari(), so a term this table spells wins
over the shared one. That is what "value" needs: in the DSA voyage a value is
what sits beside a key in a hash map, and here it is also the V of attention and
the expected value of a distribution.

As in the shared table this is transliteration, not translation: the listener is
learning words they will later read in a paper and type into an editor, so
`ग्रेडिएन्ट` (the English word said the Nepali way) is right and a Nepali word
for "slope" is wrong. The story around it supplies the metaphor.

    python3 ai_words.py script/*.txt      # list Latin terms nothing covers yet
"""

import re

# Multi-word names first, so their parts are not respelled separately and glued
# back together with a stumble in the middle.
PHRASES = {
    "dot product": "डट प्रडक्ट",
    "Dot Product": "डट प्रडक्ट",
    "cosine similarity": "कोसाइन सिमिलारिटी",
    "Cosine Similarity": "कोसाइन सिमिलारिटी",
    "linear transformation": "लिनियर ट्रान्सफर्मेसन",
    "linear regression": "लिनियर रिग्रेसन",
    "Linear Regression": "लिनियर रिग्रेसन",
    "logistic regression": "लजिस्टिक रिग्रेसन",
    "Logistic Regression": "लजिस्टिक रिग्रेसन",
    "gradient descent": "ग्रेडिएन्ट डिसेन्ट",
    "Gradient Descent": "ग्रेडिएन्ट डिसेन्ट",
    "chain rule": "चेन रुल",
    "Chain Rule": "चेन रुल",
    "RAM": "र्याम",
    "learning rate": "लर्निङ रेट",
    "Learning Rate": "लर्निङ रेट",
    "loss function": "लस फङ्सन",
    "Loss Function": "लस फङ्सन",
    "cross-entropy": "क्रस एन्ट्रोपी",
    "Cross-Entropy": "क्रस एन्ट्रोपी",
    "cross entropy": "क्रस एन्ट्रोपी",
    "information theory": "इन्फर्मेसन थियोरी",
    "expected value": "एक्स्पेक्टेड भ्यालु",
    "maximum likelihood": "म्याक्सिमम लाइकलिहुड",
    "bias-variance": "बायस भेरियन्स",
    "bias and variance": "बायस र भेरियन्स",
    "decision tree": "डिसिजन ट्री",
    "Decision Tree": "डिसिजन ट्री",
    "decision trees": "डिसिजन ट्री",
    "random forest": "र्यान्डम फरेस्ट",
    "Random Forest": "र्यान्डम फरेस्ट",
    "random forests": "र्यान्डम फरेस्ट",
    "neural network": "न्युरल नेटवर्क",
    "Neural Network": "न्युरल नेटवर्क",
    "neural networks": "न्युरल नेटवर्क",
    "deep learning": "डिप लर्निङ",
    "Deep Learning": "डिप लर्निङ",
    "machine learning": "मेसिन लर्निङ",
    "Machine Learning": "मेसिन लर्निङ",
    "training loop": "ट्रेनिङ लुप",
    "learning curve": "लर्निङ कर्भ",
    # Part 3 — deep learning. Multi-word terms live here rather than in WORDS so
    # the pair is spoken as one name; splitting "forward pass" into two lookups
    # would put a pause where the term has none.
    "multi layer perceptron": "मल्टी लेयर पर्सेप्ट्रोन",
    "multi-layer perceptron": "मल्टी लेयर पर्सेप्ट्रोन",
    "hidden layer": "हिडेन लेयर",
    "hidden layers": "हिडेन लेयर",
    "universal approximation": "युनिभर्सल एप्रोक्सिमेसन",
    "forward pass": "फर्वार्ड पास",
    "backward pass": "ब्याकवार्ड पास",
    "vanishing gradient": "भ्यानिसिङ ग्रेडिएन्ट",
    "exploding gradient": "एक्स्प्लोडिङ ग्रेडिएन्ट",
    "residual connection": "रेजिड्युअल कनेक्सन",
    "residual connections": "रेजिड्युअल कनेक्सन",
    "convolutional neural network": "कन्भोलुसनल न्युरल नेटवर्क",
    "recurrent neural network": "रिकरेन्ट न्युरल नेटवर्क",
    "transfer learning": "ट्रान्सफर लर्निङ",
    "feature engineering": "फिचर इन्जिनियरिङ",
    # Part 4 — NLP. word2vec and seq2seq carry a digit in the middle, so the
    # word-boundary rule never sees them as one word; they have to match here.
    "byte pair encoding": "बाइट पेयर इन्कोडिङ",
    "word2vec": "वर्ड टु भेक",
    "seq2seq": "सिक टु सिक",
    "one hot": "वान हट",
    "one-hot": "वान हट",
    "skip gram": "स्किप ग्राम",
    "skip-gram": "स्किप ग्राम",
    "negative sampling": "नेगेटिभ स्याम्पलिङ",
    "contextual embedding": "कन्टेक्स्चुअल एम्बेडिङ",
    "contextual embeddings": "कन्टेक्स्चुअल एम्बेडिङ",
    "beam search": "बिम सर्च",
    "teacher forcing": "टिचर फोर्सिङ",
    # Part 5 — transformers
    "feed forward": "फिड फर्वार्ड",
    "feed-forward": "फिड फर्वार्ड",
    "multi head attention": "मल्टी हेड अटेन्सन",
    "multi-head attention": "मल्टी हेड अटेन्सन",
    # Part 6 — LLM engineering
    "mixture of experts": "मिक्स्चर अफ एक्स्पर्ट्स",
    "data parallel": "डाटा प्यारलल",
    "alignment tax": "अलाइनमेन्ट ट्याक्स",
    "reward hacking": "रिवार्ड ह्याकिङ",
    "catastrophic forgetting": "क्याटास्ट्रोफिक फर्गेटिङ",
    # Part 7 — RAG and agents
    "approximate nearest neighbour": "एप्रोक्सिमेट निअरेस्ट नेबर",
    "hybrid search": "हाइब्रिड सर्च",
    "prompt injection": "प्रम्प्ट इन्जेक्सन",
    "bag of words": "ब्याग अफ वर्ड्स",
    "Bag of Words": "ब्याग अफ वर्ड्स",
    "self-attention": "सेल्फ अटेन्सन",
    "Self-Attention": "सेल्फ अटेन्सन",
    "self attention": "सेल्फ अटेन्सन",
    "multi-head": "मल्टी हेड",
    "positional encoding": "पोजिसनल इन्कोडिङ",
    "layer norm": "लेयर नर्म",
    "LayerNorm": "लेयर नर्म",
    "batch norm": "ब्याच नर्म",
    "BatchNorm": "ब्याच नर्म",
    "language model": "ल्याङ्ग्वेज मोडेल",
    "Language Model": "ल्याङ्ग्वेज मोडेल",
    "language models": "ल्याङ्ग्वेज मोडेल",
    "next token": "नेक्स्ट टोकन",
    "scaling law": "स्केलिङ ल",
    "scaling laws": "स्केलिङ ल",
    "fine-tuning": "फाइन ट्युनिङ",
    "Fine-Tuning": "फाइन ट्युनिङ",
    "fine tuning": "फाइन ट्युनिङ",
    "fine-tune": "फाइन ट्युन",
    "reward model": "रिवार्ड मोडेल",
    "vector database": "भेक्टर डाटाबेस",
    "Vector Database": "भेक्टर डाटाबेस",
    "vector databases": "भेक्टर डाटाबेस",
    "KV cache": "के भी क्यास",
    "context window": "कन्टेक्स्ट विन्डो",
    "system prompt": "सिस्टम प्रम्प्ट",
    "tool call": "टुल कल",
    "tool calling": "टुल कलिङ",
    "k-means": "के मिन्स",
    "false positive": "फल्स पोजिटिभ",
    "false negative": "फल्स नेगेटिभ",
    "lazy learner": "लेजी लर्नर",
    "gradient boosting": "ग्रेडिएन्ट बुस्टिङ",
    "mean squared error": "मिन स्क्वेयर्ड एरर",
    "early stopping": "अर्ली स्टपिङ",
    "trade-off": "ट्रेड अफ",
    "KL divergence": "के एल डाइभर्जेन्स",
    "KL": "के एल",
    "information gain": "इन्फर्मेसन गेन",
    "confidence interval": "कन्फिडेन्स इन्टरभल",
    "law of large numbers": "ल अफ लार्ज नम्बर्स",
    "negative log likelihood": "नेगेटिभ लग लाइकलिहुड",
    "curse of dimensionality": "कर्स अफ डाइमेन्सनालिटी",
    "singular value": "सिङ्गुलर भ्यालु",
    "confusion matrix": "कन्फ्युजन म्याट्रिक्स",
    "cross-validation": "क्रस भ्यालिडेसन",
    "cross validation": "क्रस भ्यालिडेसन",

    # Acronyms said as letters. The engine has an acronym pass of its own, but
    # it was built from the DSA syllabus and has never heard of these.
    "NLP": "एन एल पी",
    "LLM": "एल एल एम",
    "LLMs": "एल एल एम",
    "GPT": "जी पी टी",
    "BERT": "बर्ट",
    "RAG": "र्याग",
    "SVD": "एस भी डी",
    "PCA": "पी सी ए",
    "MLE": "एम एल ई",
    "KNN": "के एन एन",
    "k-NN": "के एन एन",
    "MLP": "एम एल पी",
    "CNN": "सी एन एन",
    "RNN": "आर एन एन",
    "LSTM": "एल एस टी एम",
    "BPE": "बी पी ई",
    "SGD": "एस जी डी",
    "LoRA": "लोरा",
    "QLoRA": "क्यु लोरा",
    "SFT": "एस एफ टी",
    "RLHF": "आर एल एच एफ",
    "DPO": "डी पी ओ",
    "ReAct": "री एक्ट",
    "MCP": "एम सी पी",
    "ROC": "आर ओ सी",
    "AUC": "ए यु सी",
    "TF-IDF": "टी एफ आई डी एफ",

    # Model and product names, spelled the way a Nepali speaker says them.
    "Hugging Face": "हगिङ फेस",
    "Claude": "क्लोड",
    "Gemini": "जेमिनाई",
    "Llama": "लामा",
    "Ollama": "ओलामा",
    "LangChain": "ल्याङ्चेन",
    "LangGraph": "ल्याङ्ग्राफ",
    "CrewAI": "क्रु ए आई",
    "scikit-learn": "साइकिट लर्न",
}

# Single words. Matched case-insensitively, since the scripts capitalise the
# same term inconsistently and both spellings must sound alike.
WORDS = {
    # the arithmetic
    "vector": "भेक्टर",
    "vectors": "भेक्टर",
    "matrix": "म्याट्रिक्स",
    "matrices": "म्याट्रिक्स",
    "tensor": "टेन्सर",
    "tensors": "टेन्सर",
    "scalar": "स्केलर",
    "dimension": "डाइमेन्सन",
    "dimensions": "डाइमेन्सन",
    "eigenvector": "आइगन भेक्टर",
    "eigenvectors": "आइगन भेक्टर",
    "eigenvalue": "आइगन भ्यालु",
    "eigenvalues": "आइगन भ्यालु",
    "cosine": "कोसाइन",
    "norm": "नर्म",
    "projection": "प्रोजेक्सन",
    "derivative": "डेरिभेटिभ",
    "derivatives": "डेरिभेटिभ",
    "gradient": "ग्रेडिएन्ट",
    "gradients": "ग्रेडिएन्ट",
    "slope": "स्लोप",
    "probability": "प्रोब्याबिलिटी",
    "distribution": "डिस्ट्रिब्युसन",
    "distributions": "डिस्ट्रिब्युसन",
    "variance": "भेरियन्स",
    "bias": "बायस",
    "entropy": "एन्ट्रोपी",
    "perplexity": "पर्प्लेक्सिटी",
    "likelihood": "लाइकलिहुड",
    "sample": "स्याम्पल",
    "samples": "स्याम्पल",

    # learning from data
    "model": "मोडेल",
    "models": "मोडेल",
    "data": "डाटा",
    "dataset": "डाटासेट",
    "feature": "फिचर",
    "features": "फिचर",
    "label": "लेबल",
    "labels": "लेबल",
    "training": "ट्रेनिङ",
    "train": "ट्रेन",
    "test": "टेस्ट",
    "validation": "भ्यालिडेसन",
    "overfitting": "ओभरफिटिङ",
    "underfitting": "अन्डरफिटिङ",
    "regularization": "रेगुलराइजेसन",
    "regression": "रिग्रेसन",
    "classification": "क्लासिफिकेसन",
    "classifier": "क्लासिफायर",
    "clustering": "क्लस्टरिङ",
    "cluster": "क्लस्टर",
    "clusters": "क्लस्टर",
    "centroid": "सेन्ट्रोइड",
    "precision": "प्रिसिजन",
    "recall": "रिकल",
    "accuracy": "एक्युरेसी",
    "threshold": "थ्रेसहोल्ड",
    "loss": "लस",
    "epoch": "इपक",
    "epochs": "इपक",
    "batch": "ब्याच",
    "batches": "ब्याच",
    "optimizer": "अप्टिमाइजर",
    "dropout": "ड्रपआउट",
    "momentum": "मोमेन्टम",

    # the network
    "neuron": "न्युरन",
    "neurons": "न्युरन",
    "perceptron": "पर्सेप्ट्रोन",
    "layer": "लेयर",
    "layers": "लेयर",
    "weight": "वेट",
    "weights": "वेट",
    "activation": "एक्टिभेसन",
    "sigmoid": "सिग्मोइड",
    "softmax": "सफ्टम्याक्स",
    "backpropagation": "ब्याकप्रोपागेसन",
    "autograd": "अटोग्राड",
    "forward": "फर्वार्ड",
    "backward": "ब्याकवार्ड",
    "convolution": "कन्भोलुसन",
    "filter": "फिल्टर",
    "filters": "फिल्टर",
    "relu": "रेलु",
    "pooling": "पुलिङ",
    "bottleneck": "बटलनेक",
    "analogy": "एनालोजी",
    "block": "ब्लक",
    "blocks": "ब्लक",
    "masking": "मास्किङ",
    "contamination": "कन्टामिनेसन",
    "distillation": "डिस्टिलेसन",
    "reranking": "रिर्याङ्किङ",
    "baseline": "बेसलाइन",
    "drift": "ड्रिफ्ट",
    "groundedness": "ग्राउन्डेडनेस",
    "framework": "फ्रेमवर्क",
    "frameworks": "फ्रेमवर्क",
    "context": "कन्टेक्स्ट",
    "head": "हेड",
    "heads": "हेड",
    "normalization": "नर्मलाइजेसन",
    "input": "इनपुट",
    "inputs": "इनपुट",
    "output": "आउटपुट",
    "outputs": "आउटपुट",

    # language
    "token": "टोकन",
    "tokens": "टोकन",
    "tokenizer": "टोकनाइजर",
    "tokenization": "टोकनाइजेसन",
    "vocabulary": "भोकाब्युलरी",
    "embedding": "एम्बेडिङ",
    "embeddings": "एम्बेडिङ",
    "attention": "अटेन्सन",
    "transformer": "ट्रान्सफर्मर",
    "transformers": "ट्रान्सफर्मर",
    "encoder": "इन्कोडर",
    "decoder": "डिकोडर",
    "query": "क्वेरी",
    "queries": "क्वेरी",
    "head": "हेड",
    "heads": "हेड",
    "corpus": "कर्पस",
    "sentence": "सेन्टेन्स",

    # the models and what is done to them
    "pretraining": "प्रिट्रेनिङ",
    "pretrained": "प्रिट्रेन्ड",
    "checkpoint": "चेकपोइन्ट",
    "inference": "इन्फरेन्स",
    "sampling": "स्याम्पलिङ",
    "temperature": "टेम्परेचर",
    "quantization": "क्वान्टाइजेसन",
    "alignment": "अलाइनमेन्ट",
    "reward": "रिवार्ड",
    "prompt": "प्रम्प्ट",
    "prompts": "प्रम्प्ट",
    "hallucination": "ह्यालुसिनेसन",
    "hallucinate": "ह्यालुसिनेट",
    "retrieval": "रिट्रिभल",
    "chunk": "चङ्क",
    "chunks": "चङ्क",
    "agent": "एजेन्ट",
    "agents": "एजेन्ट",
    "tool": "टुल",
    "tools": "टुल",
    "guardrail": "गार्डरेल",
    "guardrails": "गार्डरेल",
    "latency": "लेटेन्सी",
    "throughput": "थ्रुपुट",

    # Ordinary English the story leans on. Not jargon, but said often enough
    # that letting the Nepali voice guess at the Latin would be a distraction.
    # Formulas are read aloud as words — "f of x", "log of p" — and the engine's
    # single-letter pass already turns the letters into letter-names, so this is
    # the one connecting word it leaves behind.
    "of": "अफ",
    "error": "एरर",
    "supervised": "सुपरभाइज्ड",
    "unsupervised": "अनसुपरभाइज्ड",
    "stemming": "स्टेमिङ",
    "elbow": "एल्बो",
    "boosting": "बुस्टिङ",
    "errors": "एरर",
    "intercept": "इन्टरसेप्ट",
    "multicollinearity": "मल्टीकोलिनियारिटी",
    "bayes": "बेज",
    "prior": "प्रायर",
    "posterior": "पोस्टेरियर",
    "conditional": "कन्डिसनल",
    "normal": "नर्मल",
    "bernoulli": "बर्नुली",
    "categorical": "क्याटेगोरिकल",
    "statistics": "स्ट्याटिस्टिक्स",
    "negative": "नेगेटिभ",
    "positive": "पोजिटिभ",
    "saddle": "स्याडल",
    "adam": "एडम",
    "email": "इमेल",
    "nat": "न्याट",
    "bit": "बिट",
    "high": "हाई",
    "schedule": "सेड्युल",
    "identity": "आइडेन्टिटी",
    "inverse": "इन्भर्स",
    "shear": "सियर",
    "scaling": "स्केलिङ",
    "compression": "कम्प्रेसन",
    "search": "सर्च",
    "course": "कोर्स",
    "program": "प्रोग्राम",
    "programs": "प्रोग्राम",
    "function": "फङ्सन",
    "functions": "फङ्सन",
    "file": "फाइल",
    "files": "फाइल",
    "code": "कोड",
    "library": "लाइब्रेरी",
    "setting": "सेटिङ",
    "settings": "सेटिङ",
    "broadcasting": "ब्रोडकास्टिङ",
    "database": "डाटाबेस",
    "engine": "इन्जिन",
    "network": "नेटवर्क",
    "artificial": "आर्टिफिसियल",
    "intelligence": "इन्टेलिजेन्स",
    "classical": "क्लासिकल",
    "large": "लार्ज",
    "deep": "डिप",
    "learning": "लर्निङ",
    "machine": "मेसिन",
    "spam": "स्प्याम",
    "download": "डाउनलोड",
    "chess": "चेस",
    "paper": "पेपर",
    "papers": "पेपर",
    "server": "सर्भर",
    "memory": "मेमोरी",
    "cache": "क्यास",

    # the tools
    "python": "पाइथन",
    "numpy": "नम्पाइ",
    "pytorch": "पाइटर्च",
    "gpu": "जी पी यु",
    "api": "ए पी आई",
}


# WORDS is matched case-insensitively and then looked up lowercased, so a key
# with a capital in it would match text and raise KeyError on the way back —
# at synthesis time, hours into a render, on whichever chapter happens to say
# the word. Capitalised terms belong in PHRASES, which matches exactly.
assert all(k == k.lower() for k in WORDS), \
    "WORDS keys must be lowercase: " + ", ".join(k for k in WORDS if k != k.lower())


def _compile(mapping, flags=0):
    keys = sorted(mapping, key=len, reverse=True)
    return re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(k) for k in keys)
                      + r")(?![A-Za-z])", flags)


_PHRASE_RE = _compile(PHRASES)
_WORD_RE = _compile(WORDS, re.IGNORECASE)


def to_devanagari(text):
    text = _PHRASE_RE.sub(lambda m: PHRASES[m.group(1)], text)
    return _WORD_RE.sub(lambda m: WORDS[m.group(1).lower()], text)


if __name__ == "__main__":
    import os
    import sys
    from collections import Counter

    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                    *[".."] * 3, "shared"))
    import ne_pronounce

    missing = Counter()
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            text = ne_pronounce.to_devanagari(to_devanagari(f.read()))
        missing.update(t for t in re.findall(r"[A-Za-z][A-Za-z'’-]*", text)
                       if len(t) > 1)
    if not missing:
        print("no uncovered Latin terms")
    for term, n in missing.most_common():
        print(f"{n:5d}  {term}")
