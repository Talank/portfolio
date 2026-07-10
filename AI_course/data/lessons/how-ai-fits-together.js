window.LESSONS = window.LESSONS || {};
window.LESSONS['how-ai-fits-together'] = {
  id: 'how-ai-fits-together',
  title: 'The Map: How AI, ML, DL, NLP, LLMs & Agents Fit Together',
  category: 'Part 0 — Orientation',
  timeMin: 30,
  summary: 'Before diving in, you need the map: what each buzzword actually means, how the fields nest inside each other, what an "AI engineer" actually does all day, and what a library even is. Everything in this course hangs off this skeleton.',
  goals: [
    'Draw the nesting diagram AI ⊃ ML ⊃ Deep Learning, and place NLP, LLMs and agents on it.',
    'Explain what a Python library is, what <code>import</code> does, and why we call other people\'s functions instead of writing everything ourselves.',
    'Describe the three jobs — ML engineer, LLM/AI engineer, researcher — and what each actually builds.',
    'Name the toolchain you\'ll use in this course: Python, NumPy, PyTorch, Hugging Face, Ollama, LangChain/ADK/OpenClaw.',
  ],
  concept: [
    {
      h: 'The nesting diagram',
      p: [
        '<b>Artificial Intelligence (AI)</b> is the umbrella: any technique that makes a computer do something that looks intelligent. Chess engines from 1997 count. So do hard-coded <code>if/else</code> "expert systems" from the 1980s.',
        '<b>Machine Learning (ML)</b> is the subset of AI where the behavior is <i>learned from data</i> instead of hand-coded. You don\'t write rules for recognizing spam — you show the machine 10,000 spam emails and 10,000 real ones, and it finds the rules itself. The "rules it finds" are just numbers, called <b>parameters</b> or <b>weights</b>. Training = adjusting those numbers until the model\'s outputs match the data. That\'s it. All of ML is "adjust numbers to fit data", and Parts 1–2 teach you exactly how the adjusting works.',
        '<b>Deep Learning (DL)</b> is the subset of ML where the model is a <b>neural network</b> with many layers ("deep"). Same idea — adjust numbers to fit data — but with millions/billions of numbers arranged in layers, which turns out to let the model learn its own features instead of you engineering them (Part 3).',
        '<b>NLP (Natural Language Processing)</b> is not a subset of the above — it\'s a <i>problem domain</i>: making computers deal with human language. It used to be done with classical ML (TF-IDF + logistic regression, Part 2/4); today it\'s dominated by deep learning.',
        '<b>LLMs (Large Language Models)</b> sit at the intersection: very large deep-learning models (transformers, Part 5) trained on the NLP task of "predict the next token" at internet scale (Part 6). GPT, Claude, Gemini, Llama, Mistral — all the same species.',
        '<b>Agents</b> are not models at all. An agent is a <i>program you write</i> that calls an LLM in a loop, lets it use tools (search, code, APIs), and feeds the results back until a task is done (Part 7). The LLM is the engine; the agent is the car.',
      ],
    },
    {
      h: 'What a "model" literally is',
      p: [
        'Strip away the mystique: a model is <b>a function with tunable numbers inside</b>. Linear regression is <code>f(x) = w·x + b</code> — two tunable numbers. GPT-4-class models are the same idea with ~10¹² tunable numbers and a much fancier function shape. "Training" means: measure how wrong the function\'s outputs are (the <b>loss</b>), compute which direction to nudge each number to be less wrong (the <b>gradient</b>, Part 1 calculus), nudge, repeat millions of times.',
        'When someone says "download the model", they mean download the <i>saved values of those numbers</i> (a weights file — that\'s what the multi-GB <code>.safetensors</code>/<code>.gguf</code> files on Hugging Face are) plus the code describing the function shape (the <b>architecture</b>).',
      ],
    },
    {
      h: 'What a library is, and why we call functions we didn\'t write',
      p: [
        'A <b>library</b> is a folder of Python files someone else wrote, tested, and published so you don\'t have to rewrite it. <code>pip install numpy</code> downloads that folder from PyPI (the public package index) into your Python environment. <code>import numpy as np</code> loads it into your program and gives it the nickname <code>np</code>. From then on <code>np.dot(a, b)</code> runs <i>their</i> dot-product code — which is written in C and ~100× faster than the Python loop you\'d write by hand.',
        'This is the pattern behind every tool in this course: <b>NumPy</b> = fast math on arrays. <b>PyTorch</b> = NumPy + automatic derivatives + GPU support (exactly what training needs). <b>scikit-learn</b> = classical ML algorithms pre-implemented with a uniform interface (<code>.fit()</code> to train, <code>.predict()</code> to use). <b>Hugging Face transformers</b> = thousands of pretrained models one function call away. <b>Ollama</b> = run open LLMs locally with one command. <b>LangChain / Google ADK / OpenClaw</b> = scaffolding for agent loops.',
        'A rule for this whole course: <b>every time we call a library function, we first learn what it computes</b> — usually by implementing a small version ourselves in the code lab. Library calls should be a convenience, never a mystery. When you see <code>model.fit(X, y)</code> in Part 2, you\'ll already have written the gradient-descent loop it hides.',
      ],
    },
    {
      h: 'The three jobs (and which parts of this course feed each)',
      p: [
        '<b>ML Engineer</b>: builds and ships classical + deep models — data pipelines, training, evaluation, deployment. Interviews test Parts 1–3 hard (math, bias-variance, backprop) plus Part 8 system design.',
        '<b>AI / LLM Engineer</b>: builds products on top of LLMs — prompting, RAG, fine-tuning, agents, evals, serving. Interviews test Parts 5–7 (attention math, LoRA, RAG architecture, agent design) and increasingly still Parts 1–2 fundamentals to filter out "API-only" candidates.',
        '<b>Researcher</b>: reads papers, forms hypotheses, runs experiments, writes papers. Needs everything above <i>plus</i> the ability to derive things (Part 1 math is non-negotiable) and to implement papers from scratch (the mini-GPT in Part 5 is the training wheel for that).',
        'This course deliberately teaches to the hardest of the three (researcher-level "why"), because that depth is exactly what distinguishes candidates in the other two interviews.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'The Grand Line needs a Log Pose, not a normal compass',
      text: [
        'When the Straw Hats enter the Grand Line, Nami discovers her trusted compass spins uselessly — the islands\' magnetic fields make ordinary navigation impossible. She needs a <b>Log Pose</b>: an instrument that locks onto one island, adapts to its field, and only after arriving and adjusting can lock onto the next. The route is a <i>dependency chain</i> — you cannot sail to Alabasta before your Log Pose has adapted at Whiskey Peak. Skipping an island doesn\'t make you faster; it makes you lost.',
        'This course is your Log Pose route through AI. Cosine similarity (Part 1) is the island your instrument must adapt to before "attention" (Part 5) is even reachable — because attention literally <i>is</i> scaled dot products. Gradient descent (Part 1) must be visited before "fine-tuning" (Part 6) means anything — because fine-tuning <i>is</i> gradient descent on a subset of weights. Every flashy destination (LLMs! Agents!) sits at the end of a chain of unflashy islands, and the crews that try to skip ahead — like every rookie crew that ignored Log Pose rules — end up circling in fog, copy-pasting LangChain code they can\'t debug.',
        'Luffy\'s crew takes the islands in order and each nakama they gain on an early island (Nami\'s navigation, Chopper\'s medicine) is exactly the skill that saves them on a later one. Treat each lesson\'s skill the same way: it joins your crew, and it <i>will</i> be called on again.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon teaches Penny physics — "it all started with the Greeks"',
      text: [
        'When Penny asks Sheldon to teach her "just enough physics" to chat with Leonard about his work, Sheldon refuses to start at the interesting part. He begins: "It\'s a warm summer evening in ancient Greece…" Penny wants the punchline; Sheldon insists the punchline is meaningless without the foundations — and, infuriatingly, he\'s right (even if his pedagogy needs work). When Penny finally produces her one real sentence about Leonard\'s work, it lands only because she now knows <i>why</i> it\'s true.',
        'You asked to understand LLMs. The Sheldon-honest answer is that "the model predicts the next token" is the warm summer evening in ancient Greece — this course does start there, but unlike Sheldon, it gets you to the punchline in 34 hours, and every anecdote and animation exists to keep it fun on the way.',
      ],
    },
    why: 'The Log Pose gives you a mental model for the course itself: a dependency chain of islands where early skills get reused, not left behind. When you feel the urge to jump straight to agents, picture a spinning compass in the Grand Line.',
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'i1', emoji: '🏝️', label: 'Math', x: 10, y: 62 },
      { id: 'i2', emoji: '🏝️', label: 'Classical ML', x: 25, y: 38 },
      { id: 'i3', emoji: '🏝️', label: 'Deep Learning', x: 40, y: 62 },
      { id: 'i4', emoji: '🏝️', label: 'NLP', x: 55, y: 38 },
      { id: 'i5', emoji: '🏝️', label: 'Transformers', x: 70, y: 62 },
      { id: 'i6', emoji: '🏝️', label: 'LLMs', x: 84, y: 38 },
      { id: 'i7', emoji: '🏰', label: 'Agents / Job', x: 93, y: 66 },
    ],
    actors: [
      { id: 'ship', emoji: '⛵', label: 'You', x: 4, y: 80 },
    ],
    steps: [
      { c: 'The Grand Line of AI: seven islands, one Log Pose route. The compass only locks onto the next island after you\'ve adapted at the current one.', p: { i1: 'lit' } },
      { c: 'Island 1 — Math. Vectors, gradients, probability. Boring-sounding, but it\'s the magnetic field every later island uses.', a: { ship: [10, 76] }, p: { i1: 'good' } },
      { c: 'Classical ML: your first "adjust numbers to fit data" — regression, TF-IDF, evaluation. Small models, full understanding.', a: { ship: [25, 52] }, p: { i2: 'good' } },
      { c: 'Deep Learning: same idea, millions of numbers, backprop does the adjusting. PyTorch joins the crew.', a: { ship: [40, 76] }, p: { i3: 'good' } },
      { c: 'NLP: language becomes numbers — tokens, embeddings. The dot product from Island 1 quietly returns.', a: { ship: [55, 52] }, p: { i4: 'good' } },
      { c: 'Transformers: attention = the SAME dot product, at scale. Skippers who missed Island 1 are lost in fog right about here.', a: { ship: [70, 76] }, p: { i5: 'good' } },
      { c: 'LLMs: pretrain, fine-tune (gradient descent again!), sample, serve.', a: { ship: [84, 52] }, p: { i6: 'good' } },
      { c: 'Agents & the job: you write the loop, the LLM is the engine. Every island\'s nakama fights beside you in the interview. ⚓', a: { ship: [93, 80] }, p: { i7: 'good' } },
    ],
  },
  conceptFlow: {
    title: 'What "training a model" literally means',
    intro: 'Every model in this entire course — from linear regression to GPT-4-class LLMs — is this exact five-step loop, just with more numbers.',
    stages: [
      { label: 'Start', nodes: [
        { id: 'data', text: 'Data\nlabeled examples' },
        { id: 'model', text: 'Model\na function w/ tunable numbers' },
      ]},
      { label: 'Measure', nodes: [
        { id: 'loss', text: 'Loss\nhow wrong the output is' },
      ]},
      { label: 'Adjust', nodes: [
        { id: 'grad', text: 'Gradient\nwhich way to nudge (Part 1 calculus)' },
      ]},
      { label: 'Repeat', nodes: [
        { id: 'update', text: 'Update\nnudge every number, a little' },
      ]},
      { label: 'Result', nodes: [
        { id: 'weights', text: 'Weights file\nthe entire "model"' },
      ]},
    ],
    steps: [
      { active: ['data', 'model'], note: 'Start with data and a model — a model is just a function with tunable numbers inside, nothing more mystical than that.' },
      { active: ['loss'], note: 'Run the model on the data, compare its output to the truth. That gap has a name: the loss.' },
      { active: ['grad'], note: 'Calculus (Part 1) tells you exactly which direction to nudge each number to make the loss smaller — the gradient.' },
      { active: ['update'], note: 'Nudge every number a little in that direction. That single nudge is one training step.' },
      { active: ['weights'], note: 'Repeat millions of times. What is left when you stop is a weights file — the saved numbers ARE the model. That is the entire "training" story, at every scale in this course.' },
    ],
  },
  tech: [
    {
      q: 'What actually happens when I type "pip install numpy"?',
      a: [
        '<code>pip</code> is a program that ships with Python. It contacts <b>PyPI</b> (pypi.org, the Python Package Index — a public file server), downloads a <b>wheel</b> (a zip file containing numpy\'s Python files plus pre-compiled C code for your OS/CPU), and unpacks it into your environment\'s <code>site-packages/</code> folder. That folder is on Python\'s <i>import path</i>, which is why <code>import numpy</code> finds it afterwards. Nothing magical — files copied to a folder Python searches.',
        'A <b>virtual environment</b> (<code>python3 -m venv .venv && source .venv/bin/activate</code>) just gives each project its own <code>site-packages</code> so projects can\'t break each other\'s dependency versions. Professional habit: one venv per project, always.',
      ],
    },
    {
      q: 'Why is everything in Python when Python is slow?',
      a: 'Because Python is the <i>steering wheel</i>, not the engine. NumPy and PyTorch functions are thin Python wrappers around C/C++/CUDA code; when you call <code>torch.matmul</code>, the heavy lifting runs as compiled machine code on the CPU/GPU, and Python only orchestrates. You get C-speed math with 5-line scripts. The slowness only bites if you write raw Python loops over millions of numbers — which is exactly why the ecosystem pushes you to express math as whole-array ("vectorized") operations. You\'ll feel this concretely in the NumPy labs.',
    },
    {
      q: 'GPU, CUDA, "tensor" — what are these words?',
      a: 'A <b>GPU</b> is a chip with thousands of small cores designed to do the same arithmetic on many numbers simultaneously — originally for pixels, but matrix multiplication is the same shape of work, and neural nets are ~90% matrix multiplication. <b>CUDA</b> is NVIDIA\'s programming interface for running code on their GPUs; PyTorch calls it for you when you write <code>tensor.to("cuda")</code>. A <b>tensor</b> is just the general word for an n-dimensional array of numbers: 0-d = scalar, 1-d = vector, 2-d = matrix, 3-d+ = "tensor". PyTorch\'s core type is called <code>Tensor</code> because everything — inputs, weights, gradients — is one.',
    },
    {
      q: 'What\'s the difference between "open source" models (Llama, Mistral) and API models (GPT, Claude)?',
      a: 'API models: the weights live on the vendor\'s servers; you send text over HTTPS and pay per token; you can never inspect or modify the weights. Open-weight models: the parameter files are downloadable (mostly from Hugging Face); you can run them on your own hardware (Ollama makes this trivial), fine-tune them, and ship them in air-gapped environments. Trade-off: top API models are usually more capable; open models give you control, privacy, and zero marginal cost. A serious AI engineer can work with both — which is why Parts 6–7 use both, and why our agents are designed to be <b>LLM-agnostic</b> (swap the engine without rewriting the car).',
    },
  ],
  code: {
    title: 'Worked example — your entire toolchain in 20 lines',
    intro: 'Don\'t run this yet; just read it as a preview. By the end of the course every line will be an old friend — and you\'ll know what each library is doing under the hood.',
    code: `import numpy as np                      # Part 1-2: fast array math (C under the hood)

v1 = np.array([0.2, 0.7, 0.1])          # a vector — Part 1
v2 = np.array([0.1, 0.8, 0.1])
cos = v1 @ v2 / (np.linalg.norm(v1) * np.linalg.norm(v2))   # cosine similarity — Part 1
                                        # (@ is the dot product operator)

import torch                            # Part 3: NumPy + autograd + GPU
w = torch.tensor([1.0], requires_grad=True)
loss = (w * 3 - 6) ** 2                 # a "how wrong am I" function
loss.backward()                         # Part 3: backprop computes dloss/dw for you
print(w.grad)                           # the gradient — Part 1 calculus, automated

from transformers import pipeline       # Part 4-5: Hugging Face pretrained models
clf = pipeline("sentiment-analysis")    # downloads a small BERT-family model
print(clf("This course is great"))      # [{'label': 'POSITIVE', ...}]

import ollama                           # Part 6-7: local open-weight LLMs
reply = ollama.chat(model="llama3.2",   # runs on YOUR machine, no API key
                    messages=[{"role": "user", "content": "Hi!"}])`,
    notes: [
      '<code>@</code> between arrays is Python\'s matrix-multiply / dot-product operator (added to the language in 3.5 specifically because ML code needed it so often).',
      '<code>requires_grad=True</code> tells PyTorch to record every operation on <code>w</code> so it can replay them backwards for derivatives — that recording is the "autograd tape" you\'ll build intuition for in Part 3.',
      '<code>pipeline(...)</code> hides four steps: download weights, load tokenizer, tokenize your string, run the forward pass. Part 4 unpacks all four.',
    ],
  },
  lab: {
    title: 'Warm-up lab: prove Python + the editor work',
    prompt: 'Write a function <code>describe(numbers)</code> that returns a dict with keys <code>"mean"</code>, <code>"min"</code>, <code>"max"</code> for a list of numbers — <b>without importing anything</b>. This is a warm-up for the editor + test runner workflow you\'ll use in every lesson: write code, hit <b>Static check</b>, then <b>Run tests</b> (real Python runs in your browser).',
    starter: `def describe(numbers):
    # your code here: return {"mean": ..., "min": ..., "max": ...}
    pass
`,
    checks: [
      { re: 'def\\s+describe\\s*\\(', must: true, hint: 'Define a function called describe(numbers).' },
      { re: '\\breturn\\b', must: true, hint: 'The function must return the dict (not print it).' },
      { re: 'import\\s+(numpy|statistics|math)', must: false, hint: 'No imports for this warm-up — use sum()/len()/min()/max() built-ins.' },
    ],
    tests: `r = describe([2, 4, 6])
assert isinstance(r, dict), "describe should return a dict"
assert abs(r["mean"] - 4.0) < 1e-9, f'mean of [2,4,6] should be 4.0, got {r["mean"]}'
assert r["min"] == 2 and r["max"] == 6, "min/max wrong"
r2 = describe([5])
assert r2["mean"] == 5 and r2["min"] == 5 and r2["max"] == 5, "single-element case wrong"
print("describe() works — your lab pipeline is alive.")`,
    solution: `def describe(numbers):
    return {
        "mean": sum(numbers) / len(numbers),
        "min": min(numbers),
        "max": max(numbers),
    }`,
    notes: [
      '<code>sum</code>, <code>len</code>, <code>min</code>, <code>max</code> are Python <b>built-ins</b> — always available, no import. Libraries begin where built-ins end.',
      'From the next lesson on, labs implement real ML math (cosine similarity, gradient descent, TF-IDF…) with tests that catch the classic mistakes.',
    ],
  },
  quiz: [
    {
      q: 'Which statement is correct?',
      options: [
        'Deep learning is a subset of machine learning, which is a subset of AI',
        'Machine learning and AI are different names for the same thing',
        'LLMs are a type of agent',
        'NLP is a subset of deep learning',
      ],
      correct: 0,
      explain: 'AI ⊃ ML ⊃ DL. NLP is a problem domain (currently solved mostly with DL). Agents are programs that USE LLMs — the LLM is the engine, the agent is the car.',
    },
    {
      q: 'What does "training a model" literally mean?',
      options: [
        'Writing if/else rules that cover the data',
        'Repeatedly adjusting the model\'s internal numbers to reduce a measure of wrongness (loss) on data',
        'Downloading weights from Hugging Face',
        'Prompting it with examples',
      ],
      correct: 1,
      explain: 'A model is a function with tunable numbers. Training = measure loss → compute gradient → nudge numbers → repeat. Downloading weights is fetching the RESULT of someone else\'s training; prompting doesn\'t change weights at all.',
    },
    {
      q: 'Why are NumPy/PyTorch fast even though Python is slow?',
      options: [
        'They use a faster version of the Python interpreter',
        'Their functions are wrappers around compiled C/C++/CUDA code; Python only orchestrates',
        'They cache all results',
        'They are not actually faster',
      ],
      correct: 1,
      explain: 'The heavy math runs as compiled machine code (on CPU or GPU). Python is the steering wheel, not the engine — which is why vectorized array operations beat hand-written Python loops by ~100×.',
    },
    {
      q: 'A weights file on Hugging Face (e.g. model.safetensors, 14 GB) contains:',
      options: [
        'The training data the model saw',
        'The saved values of the model\'s tunable parameters',
        'The Python source code of the transformer',
        'A database of facts the model can look up',
      ],
      correct: 1,
      explain: 'Weights = the learned numbers. The architecture code is separate (and small); the training data is long gone; and there is no fact database inside — knowledge is smeared across the numbers, which is why models can hallucinate.',
    },
  ],
  testFlow: {
    title: 'Test yourself: the map',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'Is NLP a subset of deep learning?', choices: [
        { text: 'No — NLP is a problem domain, currently mostly solved WITH deep learning', to: 'q1_right' },
        { text: 'Yes — NLP only exists inside deep learning', to: 'q1_wrong_subset' },
        { text: 'No — NLP has nothing to do with deep learning', to: 'q1_wrong_unrelated' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right. NLP is defined by the PROBLEM (making computers deal with language), not by the technique used to solve it — it was classical ML for decades before deep learning took over.', next: 'q2' },
      q1_wrong_subset: { end: true, correct: false, text: 'NLP existed and was actively worked on for decades before deep learning existed (rule-based systems, then TF-IDF + logistic regression). It is a problem domain, not a technique.', retry: 'q1' },
      q1_wrong_unrelated: { end: true, correct: false, text: 'They are very related today — almost every modern NLP system IS a deep learning model — just not by definition. NLP is the "what" (the problem); deep learning is one "how" (the current dominant technique).', retry: 'q1' },
      q2: { qid: 'q2', q: 'A teammate says "the LLM looked up that fact in its internal database." What\'s the precise problem with this claim?', choices: [
        { text: 'Nothing — that\'s basically how it works', to: 'q2_wrong_ok' },
        { text: 'LLMs have no internal database — everything is compressed into learned weights, which is exactly why they can hallucinate', to: 'q2_right' },
        { text: 'LLMs only ever answer using RAG, never their own weights', to: 'q2_wrong_ragonly' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right. There is no lookup table inside a model — knowledge is smeared, lossily, across billions of weight values learned during training. That\'s precisely the mechanism behind hallucination: the model reconstructs a plausible-sounding answer from compressed statistical patterns, not a stored fact.', next: 'q3' },
      q2_wrong_ok: { end: true, correct: false, text: 'This is the single misunderstanding behind most bad product decisions around hallucination and RAG, per this lesson\'s pitfalls. A weights file contains numbers, not a database — try again.', retry: 'q2' },
      q2_wrong_ragonly: { end: true, correct: false, text: 'Close in spirit (RAG DOES hand the model real retrieved text) but overstated — a model can and does answer from its own trained-in patterns with no RAG involved at all, which is exactly when hallucination risk is highest.', retry: 'q2' },
      q3: { qid: 'q3', q: 'You need a small, narrow-task model with strict data-privacy rules and zero internet access allowed at inference time. API model or self-hosted open-weight model?', choices: [
        { text: 'API model — it will always be more capable', to: 'q3_wrong_api' },
        { text: 'Self-hosted open-weight model — it matches the offline/privacy constraint directly', to: 'q3_right' },
        { text: 'Doesn\'t matter, they\'re interchangeable', to: 'q3_wrong_same' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right. An API model\'s weights never leave the vendor\'s servers, and every call needs network access — a hard blocker for an air-gapped, privacy-strict requirement. A self-hosted open-weight model runs entirely on your own hardware, no network call required.' },
      q3_wrong_api: { end: true, correct: false, text: 'Raw capability isn\'t the constraint here — network access and data leaving your infrastructure are hard requirements an API model structurally cannot satisfy, regardless of how capable it is.', retry: 'q3' },
      q3_wrong_same: { end: true, correct: false, text: 'They differ in exactly the dimension this scenario cares about: where the weights run and whether a network call is required. Not interchangeable once privacy/offline constraints are non-negotiable.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Jumping straight to LangChain/agents because it demos well. You\'ll be the engineer who can\'t answer "why does your RAG retrieve garbage?" — the answer lives in Part 1 (cosine similarity) and Part 7 (chunking). The course order is the fastest path, not the scenic one.',
    'Confusing "the model learned" with "the model looked it up". LLMs have no database inside; everything is compressed into weights. This single misunderstanding causes most bad product decisions (and interview fails) around hallucination and RAG.',
    'Treating library calls as incantations. If you can\'t say what <code>model.fit()</code> or <code>loss.backward()</code> computes, stop and find out — this course always tells you.',
  ],
  interview: [
    {
      q: 'Explain the difference between AI, ML, and deep learning to a non-technical stakeholder.',
      a: 'AI is the broad goal: software that does things that seem to need intelligence. Machine learning is the dominant modern approach: instead of hand-coding rules, we show the computer many examples and it tunes internal numbers until its outputs match — like adjusting thousands of small dials automatically. Deep learning is machine learning with a specific, very flexible model shape (many-layered neural networks) that can learn its own features from raw data — pixels, audio, text — which is why it powers image recognition and ChatGPT. Rule of thumb: AI is the goal, ML is the method, deep learning is the currently-winning flavor of the method.',
    },
    {
      q: 'What is the difference between a model\'s architecture and its weights?',
      a: 'The architecture is the shape of the function — the code: how many layers, how they connect, where the nonlinearities are. The weights are the learned numbers that fill that shape. Same architecture + different weights = completely different behavior (Llama-3 base vs Llama-3 chat differ only in weights, hence "fine-tune"). When you download a model you download weights plus a small config describing the architecture; when a paper says "we trained X", they mean they found good weight values for architecture X.',
    },
    {
      q: 'When would you use an LLM API versus a self-hosted open-weight model?',
      a: 'API when you need maximum capability with minimum ops: frontier models, no GPU fleet to run, pay per token, fastest time-to-market. Self-hosted open weights when you need data privacy (regulated data can\'t leave), cost control at scale (high, steady volume amortizes GPUs), latency control, offline/air-gapped deployment, or weight-level customization (LoRA fine-tuning). In practice: prototype on an API, then evaluate whether a fine-tuned 8B open model matches your specific task at 1/10 the cost — it very often does for narrow tasks. Design the app LLM-agnostic so this swap is a config change, not a rewrite.',
    },
    {
      q: 'What does an "AI engineer" do that a traditional software engineer doesn\'t?',
      a: 'Everything a software engineer does, plus: works with probabilistic components (same input can give different outputs, so testing becomes statistical evaluation — evals, not just unit tests), manages data and model lifecycles (versioning datasets and weights, not just code), makes cost/latency/quality trade-offs per token, and needs enough ML theory to debug model behavior (is this failure retrieval, prompting, context length, or the base model?). The defining skill is turning a fuzzy capability into a reliable system: guardrails, fallbacks, evals, monitoring.',
    },
  ],
};
