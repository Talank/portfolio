window.LESSONS = window.LESSONS || {};
window.LESSONS['matrices'] = {
  id: 'matrices',
  title: 'Matrices & Linear Transformations',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 40,
  summary: 'A matrix is not a grid of numbers to memorize rules about — it\'s a machine that transforms vectors. Every layer of every neural network is one of these machines. Understand "matrix = transformation" and deep learning stops being mysterious.',
  goals: [
    'Multiply a matrix by a vector and by another matrix, by hand and in NumPy, and never get shapes wrong again.',
    'Explain why matrix multiplication is defined the way it is (composition of transformations) and why AB ≠ BA.',
    'Read a neural-net layer <code>y = Wx + b</code> as "transform, then shift" and count its parameters.',
    'Use identity, inverse and transpose with intent, not by rote.',
  ],
  concept: [
    {
      h: 'A matrix is a vector-transforming machine',
      p: [
        'An <b>m×n matrix</b> is a grid of numbers with m rows and n columns. Its job: eat an n-dimensional vector, spit out an m-dimensional vector. The rule (<b>matrix-vector multiplication</b>):',
        '<div class="math">y = Ax, &nbsp; yᵢ = Σⱼ Aᵢⱼ xⱼ<span class="mnote">each output slot i = dot product of row i of A with x</span></div>',
        'So a matrix is just <b>a stack of dot products</b> — each row is a "detector" (last lesson\'s matching score!) and the output vector is the list of all detector scores. When a neural layer computes <code>Wx</code>, each row of W is one neuron\'s weights, asking "how much does the input match my pattern?" — 512 rows = 512 pattern detectors run at once.',
        'Worked example:',
        '<div class="math">A = [[2, 0], [1, 3]], &nbsp; x = [4, 1]<br>Ax = [2·4 + 0·1, &nbsp;1·4 + 3·1] = [8, 7]</div>',
        'The geometric view: A moves every point in space at once — rotating, stretching, squashing, reflecting — but always keeping grid lines straight, parallel, and the origin fixed. That\'s what <b>linear</b> transformation means. (The <code>+ b</code> in <code>Wx + b</code> then shifts the whole space — "affine". Neural nets stack these with nonlinear squashes in between; Part 3.)',
      ],
    },
    {
      h: 'Matrix × matrix = doing one transformation after another',
      p: [
        'Why is matrix multiplication defined by that strange rows-times-columns dance? Because it\'s exactly what makes <b>(AB)x = A(Bx)</b>: applying B first, then A. Matrix multiplication IS composition of transformations. The formula',
        '<div class="math">(AB)ᵢⱼ = Σₖ Aᵢₖ Bₖⱼ<span class="mnote">entry (i,j) = dot product of (row i of A) with (column j of B)</span></div>',
        'is not an arbitrary convention — it\'s derived by asking "what matrix does the combined machine correspond to?". Immediate consequences you must own:',
        '<ul><li><b>Order matters:</b> AB ≠ BA in general. "Rotate then stretch" ≠ "stretch then rotate". This trips people forever if learned as symbol-shuffling, and never trips people who think in transformations.</li><li><b>Shapes must chain:</b> (m×n)·(n×p) → m×p. The inner dimensions must match — machine B\'s output size must equal machine A\'s input size. Every shape error you\'ll ever see in PyTorch (<code>mat1 and mat2 shapes cannot be multiplied</code>) is this sentence.</li><li><b>Cost:</b> multiplying (m×n)(n×p) takes m·n·p multiply-adds. This one formula is where "GPU goes brrr" and LLM FLOP budgets come from.</li></ul>',
      ],
    },
    {
      h: 'The special matrices you\'ll actually use',
      p: [
        '<b>Identity I</b>: ones on the diagonal, zeros elsewhere. Ix = x — the do-nothing machine. Shows up in residual connections ("start from identity, learn the correction") and regularization.',
        '<b>Inverse A⁻¹</b>: the undo machine — A⁻¹(Ax) = x. Exists only if A destroys no information (square and "full rank": no dimension gets flattened away). If A squashes 2-D onto a line, two different inputs map to one output and no machine can un-mix them — that\'s <i>singular</i>. In ML you rarely compute inverses explicitly (numerically fragile, O(n³)); you solve linear systems instead (<code>np.linalg.solve</code>).',
        '<b>Transpose Aᵀ</b>: flip rows↔columns. Two reasons you\'ll meet it constantly: it re-orients data (turning "stack of row-vectors" into columns for multiplication — the <code>QKᵀ</code> in attention is exactly "dot every query row with every key row"), and in calculus the gradient flows backward through a layer via Wᵀ (Part 3 backprop).',
        '<b>Rank</b>: the number of dimensions the output really spans. A 768×768 matrix of rank 8 only ever produces outputs inside an 8-dimensional slice — it\'s secretly a small machine in a big costume. Hold that thought: it is literally the idea behind LoRA fine-tuning (Part 6), where weight <i>updates</i> are constrained to low rank to save 99% of the trainable parameters.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Law\'s ROOM: space itself gets transformed',
      text: [
        'Trafalgar Law raises a hand — "ROOM" — and a sphere spreads over the battlefield. Inside it, he doesn\'t fight objects one at a time. He transforms <i>the space itself</i>: Shambles swaps positions, Takt rotates everything skyward. Every coin, cannonball and marine inside the room is relocated by the <b>same rule at once</b>. That is a matrix: not an operation on one vector, but a rule applied uniformly to all of space. (And Law\'s rules keep straight lines straight — no point gets torn away from its neighbors — which is exactly the "linear" in linear transformation.)',
        'Now the crucial scene: Law and Doflamingo both cast overlapping rooms. Doflamingo\'s strings drag everything 10 meters east; Law\'s Shambles rotates everything 90°. If Law acts first and Doflamingo second, a marine standing north ends up in a totally different spot than if Doflamingo acts first — <b>the order of transformations changes the outcome</b>. Composition of rooms = matrix multiplication, and AB ≠ BA is not algebra trivia, it\'s two Warlords arguing about who goes first.',
        'And when Law wants to undo his chaos, Shambles again — swapping everything back: the inverse matrix. But if his room had <i>flattened</i> everyone onto one line (losing who-was-where information), no counter-spell could unswap them. An information-destroying transformation has no inverse: singular, rank-deficient, unrecoverable.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s laundry pipeline: order matters',
      text: [
        'Sheldon\'s Saturday laundry protocol is a fixed pipeline: sort → wash → fold. Penny, "helping", folds first and then washes. Same two operations, opposite order, catastrophically different output — a basket of wrinkled chaos and one very rigid physicist explaining that operations do not, in general, commute. Wash∘Fold ≠ Fold∘Wash. Every time you\'re tempted to swap AB into BA, hear Sheldon\'s knock: "Penny. Penny. Penny. Order. Matters."',
      ],
    },
    why: 'Matrix = Law\'s room (one rule moving all of space) and multiplication = casting rooms in sequence. When PyTorch throws a shape error or you forget whether to transpose, re-ask the story questions: what space does this machine eat, what does it emit, and which room is cast first?',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'p1', emoji: '🪙', label: '(2,1)', x: 30, y: 60 },
      { id: 'p2', emoji: '💣', label: '(1,2)', x: 22, y: 40 },
      { id: 'p3', emoji: '⚓', label: '(3,2)', x: 40, y: 42 },
      { id: 'room', emoji: '🔵', label: 'ROOM', x: 8, y: 14 },
      { id: 'rule', emoji: '📜', label: '', x: 80, y: 14 },
    ],
    actors: [
      { id: 'law', emoji: '🗡️', label: 'Law (matrix A)', x: 8, y: 80 },
    ],
    steps: [
      { c: 'Three objects sit at their coordinate vectors. Law casts ROOM — a single transformation rule that will move ALL of them at once.', p: { room: 'lit' }, l: { rule: 'A = rotate 90°' } },
      { c: '"Shambles." Every vector is hit by the SAME matrix A (rotate 90°). One rule, all of space.', a: { law: [30, 80] }, p: { p1: 'lit', p2: 'lit', p3: 'lit' }, l: { p1: 'A→(-1,2)', p2: 'A→(-2,1)', p3: 'A→(-2,3)' } },
      { c: 'Second caster: matrix B stretches east ×2. Cast AFTER A, positions land one way…', l: { rule: 'B·A (A first)' }, p: { p1: 'good', p2: 'good', p3: 'good' } },
      { c: '…but cast B BEFORE A and the same objects land somewhere ELSE. BA ≠ AB — composition order changes the battlefield.', l: { rule: 'A·B ≠ B·A !' }, p: { p1: 'bad', p2: 'bad', p3: 'bad' } },
      { c: 'Law undoes it: Shambles back — the inverse A⁻¹. Possible only because his rule never flattened two objects onto one spot.', l: { p1: '(2,1) ✓', p2: '(1,2) ✓', p3: '(3,2) ✓', rule: 'A⁻¹A = I' }, p: { p1: 'good', p2: 'good', p3: 'good' } },
      { c: 'A neural layer y = Wx + b is one ROOM: 512 rows of W = 512 detectors transforming the input space. Deep nets are rooms cast in sequence. 🏴‍☠️', p: { room: 'good' } },
    ],
  },
  conceptFlow: {
    title: 'Casting ROOM: one matrix, then two, then order flips',
    intro: 'Same numbers as the story — click any box, or press Play.',
    stages: [
      { label: 'Input', nodes: [
        { id: 'x', text: 'x\n[4, 1]' },
      ]},
      { label: 'One transform', nodes: [
        { id: 'A', text: 'Matrix A\n[[2,0],[1,3]] — rows = detectors' },
        { id: 'y', text: 'y = Ax\n[8, 7]' },
      ]},
      { label: 'Compose', nodes: [
        { id: 'B', text: 'Matrix B\nstretch ×2' },
        { id: 'AB', text: 'AB\n"B then A", one machine' },
      ]},
      { label: 'Order', nodes: [
        { id: 'BA', text: 'BA\n"A then B" — a DIFFERENT machine' },
      ]},
    ],
    steps: [
      { active: ['x'], note: 'Start with an input vector: x = [4, 1].' },
      { active: ['A', 'y'], note: 'Multiply by matrix A — each ROW of A is a dot product with x. y = Ax = [8, 7].' },
      { active: ['B', 'AB'], note: 'Cast a second matrix B. The combined machine "apply B, then A" collapses into one new matrix: AB.' },
      { active: ['BA'], note: 'Cast them in the OPPOSITE order — "apply A, then B" — and you get a genuinely different matrix: BA. Order matters, because composition order matters.' },
    ],
  },
  tech: [
    {
      q: 'Why do neural network layers use matrices at all?',
      a: 'A layer must turn n input features into m output features where every output can depend on every input, with learnable strengths. The simplest such function is m dot products — i.e. one m×n matrix. It\'s differentiable (trainable by gradient descent), hardware-friendly (GPUs are matrix-multiply machines), and composable (stack layers = multiply matrices — with nonlinearities inserted so the stack doesn\'t collapse into one matrix; Part 3 shows why that collapse would happen). When you print a model and see <code>Linear(in_features=768, out_features=3072)</code>, that is a 3072×768 matrix plus a 3072-bias: 3072 pattern detectors, 2.36M parameters, one <code>@</code>.',
    },
    {
      q: 'How do I keep shapes straight in NumPy/PyTorch without trial-and-error transposing?',
      a: [
        'Adopt the convention almost all ML code uses: <b>data is stored as rows</b>. A batch X of 32 samples with 10 features is (32, 10). A layer turning 10 features into 5 uses weights W of shape (10, 5) as <code>X @ W → (32, 5)</code> (or PyTorch\'s Linear stores (5, 10) and computes <code>X @ Wᵀ</code> — same thing). Then the discipline: <i>before writing the line, write the shape comment</i>: <code># (32,10) @ (10,5) -> (32,5)</code>. Inner numbers must match; outer numbers are the answer. Every senior ML engineer\'s code is full of these comments — it\'s not beginner scaffolding, it\'s the professional habit.',
        'When you hit <code>RuntimeError: mat1 and mat2 shapes cannot be multiplied (32x10 and 5x10)</code>, read it as "machine expects 5-dim input but got 10-dim" — transpose the weights or fix the layer, don\'t sprinkle <code>.T</code> until it runs.',
      ],
    },
    {
      q: 'What is broadcasting and why does Wx + b even work when b is a vector?',
      a: 'Broadcasting is NumPy/PyTorch\'s rule for combining arrays of different shapes: dimensions are compared right-to-left, and any dimension of size 1 (or missing) is virtually copied to match. So (32, 5) + (5,) stretches b across all 32 rows — no memory copied, one fused C loop. It\'s why bias vectors, per-feature scaling, and attention masks are one-liners. Danger: broadcasting also happily combines shapes you did NOT intend — (32, 1) + (1, 5) silently produces (32, 5). If a result\'s shape surprises you, broadcasting is suspect #1.',
    },
    {
      q: 'Why does everyone obsess over matmul cost (m·n·p) — where do LLM FLOP counts come from?',
      a: 'Because transformer inference/training cost ≈ sum of its matmul costs. A forward pass through one Linear(768→3072) for one token is 768·3072 ≈ 2.4M multiply-adds; a 7B-parameter model does ≈ 2×7B = 14 GFLOPs <i>per token</i> (the famous "2·N params" rule: each parameter participates in one multiply and one add). Multiply by tokens/sec and you get your GPU requirement; multiply training tokens by 6·N (forward + backward ≈ 3× forward, ×2 for multiply-add) and you get the training budget in the scaling-laws lesson. One little formula, billions of dollars of consequences.',
    },
  ],
  code: {
    title: 'Worked example — layers as matrices, in NumPy',
    intro: 'A two-detector "layer" applied to a batch of three input vectors — the exact computation inside <code>nn.Linear</code>, with shapes annotated.',
    code: `import numpy as np

# Batch of 3 samples, 2 features each              # X: (3, 2)
X = np.array([[4.0, 1.0],
              [0.0, 2.0],
              [1.0, 1.0]])

# A "layer": 2 detectors (rows), each looking at 2 inputs
W = np.array([[2.0, 0.0],      # detector 1: cares only about feature 0
              [1.0, 3.0]])     # detector 2: mixes both features
b = np.array([0.5, -1.0])      # per-detector shift

Y = X @ W.T + b                # (3,2) @ (2,2) -> (3,2), + b broadcasts
print(Y)
# Row 0: [2*4+0*1+0.5, 1*4+3*1-1] = [8.5, 6.0]  <- check by hand!

# Composition = multiplication: two layers WITHOUT nonlinearity...
W2 = np.array([[1.0, -1.0]])   # (1,2): a second machine
combined = W2 @ W              # (1,2) @ (2,2) -> (1,2): ONE machine
print(np.allclose((X @ W.T) @ W2.T, X @ combined.T))   # True
# ...collapse into a single matrix — this is WHY nets need nonlinearities.

# Order matters:
A = np.array([[0.0, -1.0], [1.0, 0.0]])   # rotate 90°
B = np.array([[2.0, 0.0], [0.0, 1.0]])    # stretch x by 2
print(A @ B)   # rotate after stretching
print(B @ A)   # stretch after rotating — different machine!`,
    notes: [
      'PyTorch\'s <code>nn.Linear(2, 2)</code> stores W with shape (out, in) = (2, 2) and computes exactly <code>X @ W.T + b</code> — you just wrote a Linear layer.',
      'The <code>allclose</code> line is the collapse theorem: linear∘linear = linear. Without nonlinear functions between layers, a 100-layer net equals a 1-layer net.',
      'Verify one row of Y by hand every time you learn a new layer type — 30 seconds that buys permanent confidence.',
    ],
  },
  lab: {
    title: 'Lab: matrix multiplication from scratch',
    prompt: 'Implement <code>matvec(A, x)</code> (matrix × vector) and <code>matmul(A, B)</code> (matrix × matrix) in pure Python, where matrices are lists of rows. Also add a shape guard: <code>matmul</code> must raise <code>ValueError</code> when the inner dimensions don\'t match. The tests check correctness, shape errors, and that your code exposes AB ≠ BA.',
    starter: `def matvec(A, x):
    # A: list of rows, x: list. Return list of dot products (row · x).
    pass

def matmul(A, B):
    # (m×n)·(n×p) -> m×p. Raise ValueError if len(A[0]) != len(B).
    pass
`,
    checks: [
      { re: 'def\\s+matvec\\s*\\(', must: true, hint: 'Define matvec(A, x).' },
      { re: 'def\\s+matmul\\s*\\(', must: true, hint: 'Define matmul(A, B).' },
      { re: 'raise\\s+ValueError', must: true, hint: 'matmul must raise ValueError on incompatible shapes.' },
      { re: 'import\\s+numpy', must: false, hint: 'Pure Python here — the point is to demystify np.matmul, not call it.' },
    ],
    tests: `assert matvec([[2, 0], [1, 3]], [4, 1]) == [8, 7], "matvec broken (expected [8,7])"
AB = matmul([[0, -1], [1, 0]], [[2, 0], [0, 1]])
BA = matmul([[2, 0], [0, 1]], [[0, -1], [1, 0]])
assert AB == [[0, -1], [2, 0]], f"A@B wrong: {AB}"
assert BA == [[0, -2], [1, 0]], f"B@A wrong: {BA}"
assert AB != BA, "You just proved AB != BA — order matters!"
I = [[1, 0], [0, 1]]
M = [[3, 5], [7, 2]]
assert matmul(I, M) == M and matmul(M, I) == M, "Identity must do nothing"
try:
    matmul([[1, 2, 3]], [[1, 2]])
    assert False, "should have raised ValueError on shape mismatch"
except ValueError:
    pass
print("Law nods: your rooms compose correctly, and in the right order.")`,
    solution: `def matvec(A, x):
    return [sum(a * b for a, b in zip(row, x)) for row in A]

def matmul(A, B):
    if len(A[0]) != len(B):
        raise ValueError(f"inner dims differ: {len(A[0])} vs {len(B)}")
    # column j of B, dotted with each row of A
    return [[sum(A[i][k] * B[k][j] for k in range(len(B)))
             for j in range(len(B[0]))]
            for i in range(len(A))]`,
    notes: [
      'Count the loops: i, j, k — three nested loops = the m·n·p cost you read about. NumPy does the same arithmetic, just in tiled, SIMD-parallel C (and cuBLAS on GPU).',
      'The identity test is the "do-nothing machine" check; the ValueError test is the habit that saves you from silent shape bugs later.',
    ],
  },
  quiz: [
    {
      q: 'y = Wx where W is 512×768. What are the shapes of x and y?',
      options: ['x: 512, y: 768', 'x: 768, y: 512', 'both 768', 'both 512'],
      correct: 1,
      explain: '(512×768)·(768) → (512). The matrix eats the inner dimension (768 in) and emits the outer one (512 out): 512 detectors scanning a 768-dim input.',
    },
    {
      q: 'Why is matrix multiplication defined as "row · column" rather than elementwise?',
      options: [
        'Historical convention with no deeper reason',
        'It\'s the unique definition that makes (AB)x = A(Bx) — composition of transformations',
        'It\'s faster to compute',
        'Elementwise multiplication is undefined for matrices',
      ],
      correct: 1,
      explain: 'Matrix multiplication is composition. (Elementwise multiplication exists too — the Hadamard product, <code>A * B</code> in NumPy — but it doesn\'t compose transformations.)',
    },
    {
      q: 'A square matrix has no inverse exactly when…',
      options: [
        'it contains zeros',
        'it is not symmetric',
        'it flattens some dimension away (rank < n), destroying information',
        'its entries are negative',
      ],
      correct: 2,
      explain: 'Invertibility = no information lost = full rank. Zeros or asymmetry are fine (rotations are asymmetric and perfectly invertible). Once two inputs map to one output, no machine can un-mix them.',
    },
    {
      q: 'Two Linear layers with no nonlinearity between them are equivalent to…',
      options: [
        'a deeper, more expressive model',
        'a single Linear layer (their matrices multiply into one)',
        'an invalid network',
        'a nonlinear model',
      ],
      correct: 1,
      explain: 'linear∘linear = linear: W₂(W₁x) = (W₂W₁)x. Depth only buys expressiveness when nonlinearities separate the layers — the entire reason activation functions exist (Part 3).',
    },
  ],
  testFlow: {
    title: 'Test yourself: matrices',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'y = Wx where W has shape 512×768. What shape must x be, and what shape is y?', choices: [
        { text: 'x: 512, y: 768', to: 'q1_wrong_swap' },
        { text: 'x: 768, y: 512', to: 'q1_right' },
        { text: 'Both must be 512', to: 'q1_wrong_both' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — the matrix EATS the inner dimension (768) and EMITS the outer one (512): 512 detector rows, each scanning a 768-dim input.', next: 'q2' },
      q1_wrong_swap: { end: true, correct: false, text: 'That\'s backwards. An (m×n) matrix consumes an n-dim vector and produces an m-dim one — here m=512, n=768, so x is 768-dim and y is 512-dim.', retry: 'q1' },
      q1_wrong_both: { end: true, correct: false, text: 'A matrix can (and usually does) change dimensionality — that\'s the whole point of a 512×768 (non-square) matrix. x and y have DIFFERENT sizes here.', retry: 'q1' },
      q2: { qid: 'q2', q: 'In NumPy, for two same-shaped square matrices A and B, what is the relationship between A * B and A @ B?', choices: [
        { text: 'They always give the same result', to: 'q2_wrong_same' },
        { text: 'Completely different results — elementwise (Hadamard) product vs. true matrix multiplication', to: 'q2_right' },
        { text: 'A * B always throws an error on matrices', to: 'q2_wrong_error' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right. * is the Hadamard (elementwise) product; @ is matrix multiplication (composition of transformations). Both run without error on same-shaped square matrices, which is exactly why this bug hides so well.', next: 'q3' },
      q2_wrong_same: { end: true, correct: false, text: 'They are NOT the same — this is one of this lesson\'s named pitfalls precisely because both run without error yet compute completely different things.', retry: 'q2' },
      q2_wrong_error: { end: true, correct: false, text: 'A * B runs perfectly fine in NumPy on same-shaped matrices — it just computes the elementwise product, not a matrix multiplication. No error, wrong answer: the dangerous kind of bug.', retry: 'q2' },
      q3: { qid: 'q3', q: 'A square matrix has no inverse exactly when...', choices: [
        { text: 'It contains some zero entries', to: 'q3_wrong_zeros' },
        { text: 'It flattens some dimension away (rank < n), destroying information', to: 'q3_right' },
        { text: 'It is not symmetric', to: 'q3_wrong_sym' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — invertibility means no information lost. Once two different inputs get mapped to the same output, no machine can un-mix them back to their originals.' },
      q3_wrong_zeros: { end: true, correct: false, text: 'Zeros are fine — plenty of perfectly invertible matrices contain zeros (rotation matrices, for instance). The real condition is about rank, not about individual entries.', retry: 'q3' },
      q3_wrong_sym: { end: true, correct: false, text: 'Symmetry is irrelevant to invertibility — rotation matrices are asymmetric and perfectly invertible. The real condition is full rank: no dimension gets flattened away.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Fixing shape errors by adding <code>.T</code> until it runs. It often "runs" while computing the wrong thing (e.g. dotting samples with samples instead of features with weights). Write the shape chain first: (batch, in) @ (in, out) → (batch, out).',
    'Confusing <code>A * B</code> (elementwise/Hadamard) with <code>A @ B</code> (matrix multiplication) in NumPy. Both run without error on same-shaped square matrices and give completely different results.',
    'Computing explicit inverses (<code>np.linalg.inv</code>) to solve Ax = b. Numerically worse and slower than <code>np.linalg.solve(A, b)</code> — interviewers notice this one.',
    'Forgetting that matmul cost is m·n·p, then wondering why doubling the hidden size quadrupled compute (both n and p grew).',
  ],
  interview: [
    {
      q: 'What does it mean geometrically to multiply a vector by a matrix, and how does that relate to a neural network layer?',
      a: 'A matrix applies a linear transformation: every point in space is moved by one uniform rule — rotations, stretches, shears, projections — keeping grid lines straight and the origin fixed. Row-wise, each output component is a dot product of one matrix row with the input, i.e. a pattern-matching score. A neural layer y = σ(Wx + b) is exactly this: W transforms the input space (each of its rows is one neuron\'s learned pattern detector), b shifts it, and the nonlinearity σ bends it so that stacking layers builds genuinely curved decision surfaces — without σ, any stack of layers collapses to one matrix.',
    },
    {
      q: 'Why isn\'t matrix multiplication commutative, and can you give a concrete case where it matters in ML?',
      a: 'Because it represents composition of transformations, and doing operations in different orders yields different results — rotate-then-stretch ≠ stretch-then-rotate. Concrete ML case: in attention, softmax(QKᵀ)V applies value mixing AFTER computing similarity weights; reordering these matmuls is meaningless. More practically, in any pipeline like normalization → projection, swapping the matrices changes the model; and in backprop the gradient must be multiplied by transposed weight matrices in exactly reversed layer order — get the order wrong and gradients are garbage.',
    },
    {
      q: 'What is the rank of a matrix and why should an ML engineer care?',
      a: 'Rank = the dimension of the output space the matrix can actually reach = number of linearly independent rows/columns. ML reasons to care: (1) LoRA — fine-tuning updates are parameterized as a product of two thin matrices BA with rank r ≪ d, cutting trainable parameters ~1000× on the bet that task adaptations are intrinsically low-rank; (2) a rank-deficient feature/covariance matrix means redundant features, which breaks matrix inversions in classical methods and signals you should reduce dimensions (PCA); (3) embedding matrices and attention heads are often effectively low-rank, which is the basis of many compression techniques.',
    },
    {
      q: 'Roughly how many FLOPs does a forward pass of a 7B-parameter transformer take per token, and why?',
      a: 'About 2 × 7B = 14 GFLOPs per token. Nearly all compute is matrix multiplication, and in a matmul every weight participates in exactly one multiply and one add per token, giving the "≈ 2 × parameter count" rule of thumb (attention adds a smaller sequence-length-dependent term). This extends to the training rule: ≈ 6 × params per token (forward ≈ 2N, backward ≈ 4N), which is the basis of Chinchilla-style compute budgeting — being able to derive these on a whiteboard is a common LLM-role interview checkpoint.',
    },
  ],
};
