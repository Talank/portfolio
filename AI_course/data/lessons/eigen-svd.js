window.LESSONS = window.LESSONS || {};
window.LESSONS['eigen-svd'] = {
  id: 'eigen-svd',
  title: 'Eigenvectors, Eigenvalues & SVD',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 45,
  summary: 'Every transformation has special directions it can\'t rotate — only stretch. Those directions (eigenvectors) and their stretch factors (eigenvalues) reveal what a matrix "really does", power PCA, explain why gradients explode or vanish, and via SVD give the low-rank idea behind LoRA.',
  goals: [
    'Define eigenvector/eigenvalue (Av = λv) and verify a pair by hand.',
    'Find the dominant eigenvector numerically with power iteration — and explain why the same effect makes deep-net gradients explode/vanish.',
    'Explain PCA as "eigenvectors of the covariance matrix = directions of most variance".',
    'Read the SVD A = UΣVᵀ as rotate·scale·rotate, and explain low-rank approximation (the idea inside LoRA and compression).',
  ],
  concept: [
    {
      h: 'The directions a matrix cannot turn',
      p: [
        'Apply a matrix to lots of vectors and most come out pointing somewhere new. But almost every matrix has a few special directions where the output is just the input <b>scaled</b> — same line, no rotation:',
        '<div class="math">Av = λv<span class="mnote">v ≠ 0 is an <b>eigenvector</b>; the stretch factor λ is its <b>eigenvalue</b></span></div>',
        'Verify one by hand (always do this once): A = [[2, 1], [1, 2]], v = [1, 1]. Av = [2+1, 1+2] = [3, 3] = 3·v. So [1,1] is an eigenvector with λ = 3. Try v = [1, −1]: Av = [2−1, 1−2] = [1, −1] = 1·v — second eigenvector, λ = 1. This matrix stretches the [1,1] diagonal 3× and leaves the [1,−1] diagonal alone; now you know <i>everything</i> it does, because any input is a mix of those two directions.',
        'That last clause is the point: eigenvectors are the transformation\'s <b>natural axes</b>. Written in those axes, a scary matrix is just a list of per-axis stretch factors (a diagonal matrix). "Diagonalization" = changing to the coordinate system where the machine is simple.',
      ],
    },
    {
      h: 'Repeated multiplication amplifies the biggest eigenvalue — for better and worse',
      p: [
        'Multiply by A over and over and each eigen-direction gets scaled by λ each time: after k steps, λᵏ. The direction with the largest |λ| grows fastest and eventually dominates everything: any starting vector, repeatedly transformed, swings toward the <b>dominant eigenvector</b>.',
        'This single fact explains three things you\'ll meet again:',
        '<ul><li><b>Power iteration</b> (your lab): to find the dominant eigenvector, just multiply a random vector by A repeatedly, re-normalizing. This algorithm — plus sparsity tricks — is how Google\'s original <b>PageRank</b> ranked the web: the ranking IS the dominant eigenvector of the link matrix.</li><li><b>Exploding/vanishing gradients</b> (Part 3): backprop multiplies by (roughly) the same weight matrices layer after layer. Largest eigenvalue-ish factor > 1 ⇒ gradients blow up exponentially; < 1 ⇒ they die exponentially. Deep RNNs failed at long sequences for exactly this reason — the fix (attention/transformers) is Part 5\'s origin story.</li><li><b>Stability of iterative systems</b> anywhere: |λ|max < 1 means the loop settles; > 1 means it diverges.</li></ul>',
      ],
    },
    {
      h: 'PCA: eigenvectors of the covariance matrix',
      p: [
        'Take a cloud of data points (rows = samples). Its <b>covariance matrix</b> C summarizes how features co-vary: Cᵢⱼ = average of (featureᵢ − meanᵢ)(featureⱼ − meanⱼ). C\'s eigenvectors point along the cloud\'s natural axes — the directions of most spread — and each eigenvalue is the variance along its direction.',
        '<b>PCA (Principal Component Analysis)</b> = pick the top-k eigenvectors, project your data onto them, throw the rest away. You keep the k directions carrying the most variance (usually: the most signal) and compress, say, 784 pixel-dimensions to 50 while keeping 95% of the variance. Uses you\'ll actually meet: visualizing 768-d embeddings in 2-D, decorrelating features for classical models, whitening, and building intuition for "the data really lives on a low-dimensional manifold".',
      ],
    },
    {
      h: 'SVD: every matrix is rotate → scale → rotate',
      p: [
        'Eigendecomposition needs square (and nicely-behaved) matrices. The <b>Singular Value Decomposition</b> works for ANY matrix, even rectangular:',
        '<div class="math">A = U Σ Vᵀ<span class="mnote">U, V: rotations (orthonormal columns) · Σ: diagonal of non-negative <b>singular values</b> σ₁ ≥ σ₂ ≥ …</span></div>',
        'Read it as: every linear machine, however messy, is secretly (rotate input axes) → (stretch along each axis by σᵢ) → (rotate to output axes). The σᵢ tell you how much each independent "channel" of the machine matters.',
        '<b>Low-rank approximation</b> — the payoff: keep only the top-k singular values/vectors and you get the best possible rank-k approximation of A (Eckart–Young theorem). If σ values decay fast (they usually do for real data), a 1000×1000 matrix is ≈ a rank-20 product of two thin matrices: 40,000 numbers instead of 1,000,000. This is: image compression, latent semantic analysis (SVD on the TF-IDF matrix — early "embeddings"!), recommender systems (Netflix Prize), and the philosophical core of <b>LoRA</b> (Part 6): assume the fine-tuning <i>update</i> ΔW is low-rank, learn just the two thin matrices.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'The whirlpool\'s axis — the one course that doesn\'t turn',
      text: [
        'Entering the Grand Line, the Going Merry is caught in a monstrous whirlpool. Every heading the crew tries gets bent: sail north, the current drags you northeast; sail west, you\'re swept south-west. The whirlpool is a transformation — it takes your intended course (a vector) and outputs a twisted one. Panic on deck.',
        'Nami studies the spiral and finds it: one line through the maelstrom — the surge axis — where the current doesn\'t bend your course at all. Sail exactly along it and the whirlpool only <i>accelerates</i> you: you come out pointing the same way, three times faster. Course unchanged, magnitude ×3. Nami found the eigenvector; the "×3" is its eigenvalue. And there\'s a second, sneakier invariant line where the current neither helps nor hurts — eigenvalue 1.',
        'Later, at the Knock Up Stream, the same physics turns lethal-in-reverse: ride the dominant axis and every second multiplies your speed again — λ, λ², λ³ — until the ship is launched into the sky. That\'s repeated multiplication amplifying the dominant eigenvalue: glorious when you want to reach Skypiea, catastrophic when it\'s your gradients doing the multiplying through 50 layers.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s spot: the invariant of every rearrangement',
      text: [
        'Guests come, furniture drifts, game night reshuffles literally everything in apartment 4A — but one object is fixed by every such transformation: Sheldon\'s spot ("In an ever-changing world, it is a single point of consistency"). Whatever chaos-mapping the evening applies to the living room, the spot maps to itself. It\'s the eigenvector of apartment dynamics, eigenvalue 1: transformed, yet unmoved. When you need to recall what "invariant direction" means, hear Sheldon: "That is MY spot."',
      ],
    },
    why: 'The whirlpool gives you all three core facts in one scene: special directions exist (the axis), the eigenvalue is the stretch (×3), and repetition amplifies the dominant one (Knock Up Stream = exploding gradients). Sheldon\'s spot pins the definition itself: transformed, yet unmoved.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'whirl', emoji: '🌀', label: 'whirlpool = A', x: 50, y: 45 },
      { id: 'n', emoji: '🧭', label: 'try North', x: 50, y: 12 },
      { id: 'w', emoji: '🧭', label: 'try West', x: 12, y: 45 },
      { id: 'axis', emoji: '✨', label: 'surge axis', x: 84, y: 14 },
      { id: 'tag', emoji: '📏', label: '', x: 12, y: 84 },
    ],
    actors: [
      { id: 'merry', emoji: '⛵', label: 'Merry', x: 26, y: 72 },
    ],
    steps: [
      { c: 'Every course the crew tries gets BENT by the whirlpool: input heading ≠ output heading. The whirlpool is a matrix acting on course vectors.', p: { n: 'bad', w: 'bad' } },
      { c: 'Sail north → dragged north-east. Sail west → swept south-west. Rotated every time.', a: { merry: [38, 58] }, l: { tag: 'Av ≠ (scalar)·v' } },
      { c: 'Nami finds the surge axis: THE line the current cannot bend. Sail along it…', p: { axis: 'lit', n: 'dim', w: 'dim' }, a: { merry: [55, 50] } },
      { c: '…and you exit on the SAME heading, 3× faster. Direction preserved, magnitude ×3: eigenvector found, eigenvalue λ = 3.', p: { axis: 'good', whirl: 'lit' }, a: { merry: [76, 26] }, l: { tag: 'Av = 3v ✓' } },
      { c: 'Ride it repeatedly (Knock Up Stream): ×3, ×9, ×27 — the dominant eigenvalue compounds. Ships reach Skypiea; gradients reach infinity.', l: { tag: 'λᵏ grows/dies exp.' }, a: { merry: [90, 8] } },
      { c: 'PCA is Nami mapping a data-cloud\'s surge axes: the top eigenvectors of the covariance = the directions where the data really moves. 🏴‍☠️', p: { whirl: 'good' } },
    ],
  },
  tech: [
    {
      q: 'How does np.linalg.eig actually find eigenvalues (and why shouldn\'t I solve det(A−λI)=0 like the textbook)?',
      a: 'The textbook route — expand the characteristic polynomial det(A−λI)=0 and find roots — is numerically disastrous beyond tiny matrices (polynomial root-finding is hypersensitive to coefficient noise). Real libraries (LAPACK, which NumPy wraps) use iterative orthogonal transformations — the QR algorithm — which is essentially a stabilized, simultaneous version of the power iteration you\'re building in the lab: repeatedly factor-and-remultiply until the matrix converges to (block-)triangular form whose diagonal holds the eigenvalues. Takeaway: the by-hand method is for understanding 2×2s; production numerics are iterative.',
    },
    {
      q: 'Why exactly are the covariance matrix\'s eigenvectors the "directions of most variance"?',
      a: 'The variance of centered data X projected onto a unit direction v is (1/n)‖Xv‖² = vᵀCv where C is the covariance matrix. So "find the direction of max variance" = maximize vᵀCv subject to ‖v‖=1 — and the maximizer of that constrained problem is exactly C\'s top eigenvector, with the achieved variance being its eigenvalue (this is the Rayleigh-quotient/Lagrange-multiplier argument: at the optimum, ∇(vᵀCv) = 2Cv must be parallel to ∇(vᵀv) = 2v, i.e. Cv = λv). Each next component repeats the argument in the subspace orthogonal to the ones already chosen. PCA isn\'t a heuristic — it\'s this optimization, solved exactly.',
    },
    {
      q: 'What\'s the relationship between SVD and eigendecomposition?',
      a: 'The singular values/vectors of A are eigen-objects of the symmetrized squares: AᵀA has eigenvectors V with eigenvalues σᵢ², and AAᵀ has eigenvectors U with the same σᵢ². So SVD is "eigendecomposition made safe for any matrix": AᵀA is always square, symmetric and non-negative-definite, so its eigenvalues are real and ≥ 0 and its eigenvectors orthogonal — no complex numbers or missing bases like raw eigendecomposition can produce. Practically: <code>np.linalg.svd</code> is often the most numerically trustworthy tool in the drawer, and PCA is usually implemented as SVD of the centered data matrix (sklearn does exactly this) rather than eigendecomposition of C.',
    },
    {
      q: 'How literally does LoRA use this low-rank idea?',
      a: 'Very. Fine-tuning wants a weight update ΔW (same shape as W, e.g. 4096×4096 = 16.7M numbers per matrix). LoRA hypothesizes ΔW has low "intrinsic rank" and parameterizes it as ΔW = B·A with A (r×4096) and B (4096×r), r ≈ 8–64: two thin matrices, ~0.4% of the numbers, trained while W stays frozen. It\'s not computed FROM an SVD — B,A are learned directly — but Eckart–Young is the reason the bet is sensible: if the best rank-r approximation of the "true" update captures most of it, you lose little by never leaving the low-rank family. Empirically the σ-spectrum of real fine-tuning updates does decay fast, which is why LoRA matches full fine-tuning on most tasks (full details in Part 6).',
    },
  ],
  code: {
    title: 'Worked example — eigen, PCA and low-rank in 25 lines of NumPy',
    intro: 'Verify the hand example, run PCA on a synthetic tilted cloud, and compress a matrix with truncated SVD.',
    code: `import numpy as np

# 1) Verify our hand computation
A = np.array([[2.0, 1.0], [1.0, 2.0]])
vals, vecs = np.linalg.eig(A)
print(vals)            # [3. 1.]
print(vecs[:, 0])      # ~[0.707, 0.707]  — the [1,1] direction, normalized

# 2) PCA on a tilted data cloud
rng = np.random.default_rng(0)
t = rng.normal(size=500)
data = np.stack([t, 0.5 * t + 0.1 * rng.normal(size=500)], axis=1)  # (500,2), tilted line
Xc = data - data.mean(axis=0)          # ALWAYS center first
C = (Xc.T @ Xc) / len(Xc)              # covariance matrix (2,2)
evals, evecs = np.linalg.eig(C)
top = evecs[:, np.argmax(evals)]
print(top)                              # ≈ ±[0.89, 0.45] — along the cloud's tilt
projected = Xc @ top                    # (500,) — 2-D data compressed to 1-D

# 3) Low-rank approximation via SVD
M = rng.normal(size=(50, 50)) @ rng.normal(size=(50, 50)) * 0.01 \
    + np.outer(rng.normal(size=50), rng.normal(size=50))   # mostly rank-1 + noise
U, S, Vt = np.linalg.svd(M)
print(S[:4].round(2))                   # first σ dwarfs the rest
k = 1
M1 = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]   # best rank-1 approximation
print(np.linalg.norm(M - M1) / np.linalg.norm(M))  # small relative error`,
    notes: [
      '<code>np.linalg.eig</code> returns eigenvectors as COLUMNS of <code>vecs</code> — a classic gotcha; <code>vecs[:, i]</code> pairs with <code>vals[i]</code>.',
      'Forgetting to center before PCA is the #1 PCA bug: without centering, the top "component" mostly points at the data\'s mean, not its spread.',
      'The rank-1 reconstruction uses 50+50 numbers to approximate 2500 — the compression deal that LoRA, LSA and recommender systems all take.',
    ],
  },
  lab: {
    title: 'Lab: power iteration — find the whirlpool\'s axis yourself',
    prompt: 'Implement <code>power_iteration(A, steps=100)</code>: start from a fixed vector like [1.0, 0.3], repeatedly (1) multiply by A (reuse the idea of your <code>matvec</code>), (2) normalize to unit length, and return the final vector. Then <code>eigenvalue_of(A, v)</code>: estimate λ via the Rayleigh quotient vᵀAv / vᵀv. Pure Python + <code>math</code>.',
    starter: `import math

def matvec(A, x):
    return [sum(a * b for a, b in zip(row, x)) for row in A]

def normalize(v):
    n = math.sqrt(sum(x * x for x in v))
    return [x / n for x in v]

def power_iteration(A, steps=100):
    v = [1.0, 0.3]   # any non-degenerate start works
    # loop: v = normalize(A v)
    pass

def eigenvalue_of(A, v):
    # Rayleigh quotient: (v · Av) / (v · v)
    pass
`,
    checks: [
      { re: 'def\\s+power_iteration', must: true, hint: 'Define power_iteration(A, steps=100).' },
      { re: 'for\\s+.+\\s+in\\s+range', must: true, hint: 'You need an iteration loop — that\'s the "power" in power iteration.' },
      { re: 'normalize\\s*\\(', must: true, hint: 'Re-normalize each step, or the vector\'s length explodes as λᵏ (the Knock Up Stream problem!).' },
      { re: 'import\\s+numpy', must: false, hint: 'Pure Python — you\'re building what np.linalg.eig iterates underneath.' },
    ],
    tests: `A = [[2.0, 1.0], [1.0, 2.0]]
v = power_iteration(A)
# dominant eigenvector is ±[0.707, 0.707]
assert abs(abs(v[0]) - 0.7071) < 1e-3 and abs(abs(v[1]) - 0.7071) < 1e-3, f"got {v}"
lam = eigenvalue_of(A, v)
assert abs(lam - 3.0) < 1e-6, f"dominant eigenvalue should be 3, got {lam}"
B = [[0.9, 0.0], [0.0, 0.2]]
vb = power_iteration(B)
assert abs(abs(vb[0]) - 1.0) < 1e-3, f"dominant axis of B is x, got {vb}"
assert abs(eigenvalue_of(B, vb) - 0.9) < 1e-6, "lambda of B should be 0.9 (<1: this system DECAYS)"
print("Axis found. Nami charts it; PageRank ranks with it; your gradients fear it.")`,
    solution: `import math

def matvec(A, x):
    return [sum(a * b for a, b in zip(row, x)) for row in A]

def normalize(v):
    n = math.sqrt(sum(x * x for x in v))
    return [x / n for x in v]

def power_iteration(A, steps=100):
    v = [1.0, 0.3]
    for _ in range(steps):
        v = normalize(matvec(A, v))
    return v

def eigenvalue_of(A, v):
    Av = matvec(A, v)
    return sum(a * b for a, b in zip(v, Av)) / sum(x * x for x in v)`,
    notes: [
      'Why it works: write the start vector as a mix of eigenvectors; each multiplication scales the mix by λᵢ, so the biggest |λ| term wins exponentially. The normalize step just keeps numbers finite.',
      'B\'s dominant λ = 0.9 < 1: repeated application shrinks everything — the vanishing-gradient regime. One lab, both failure modes.',
    ],
  },
  quiz: [
    {
      q: 'v is an eigenvector of A with eigenvalue 3. What is A(Av)?',
      options: ['3v', '6v', '9v', 'cannot tell'],
      correct: 2,
      explain: 'Each application multiplies by λ: A(Av) = A(3v) = 3·Av = 9v. λᵏ growth under repetition is the whole exploding/vanishing gradients story.',
    },
    {
      q: 'PCA\'s principal components are…',
      options: [
        'the rows of the data matrix with the largest norm',
        'eigenvectors of the data\'s covariance matrix, ordered by eigenvalue',
        'random projections that preserve distance',
        'cluster centers found by k-means',
      ],
      correct: 1,
      explain: 'Top eigenvectors of the covariance = directions of maximal variance; eigenvalues = the variance captured along each. (Computed in practice via SVD of the centered data.)',
    },
    {
      q: 'In A = UΣVᵀ, the matrix Σ contains…',
      options: [
        'the eigenvalues of A',
        'non-negative singular values: the stretch factors of the machine\'s independent channels',
        'the covariance of A',
        'rotation angles',
      ],
      correct: 1,
      explain: 'SVD reads rotate(V ᵀ) → stretch(Σ) → rotate(U). Singular values are √(eigenvalues of AᵀA) — always real and ≥ 0, even when A isn\'t square.',
    },
    {
      q: 'Backprop through many layers multiplies gradients by roughly the same matrix repeatedly. If its dominant stretch factor is 0.8, gradients across 50 layers…',
      options: ['stay stable', 'shrink by ~0.8⁵⁰ ≈ 10⁻⁵ (vanish)', 'grow 50×', 'oscillate randomly'],
      correct: 1,
      explain: '0.8⁵⁰ ≈ 1.4×10⁻⁵ — early layers learn nothing. This is why RNNs failed on long sequences and why initialization schemes, residual connections and eventually transformers exist.',
    },
  ],
  pitfalls: [
    'Reading eigenvectors from NumPy as rows. <code>np.linalg.eig</code> returns them as COLUMNS: <code>vecs[:, i]</code> goes with <code>vals[i]</code>.',
    'Running PCA without centering the data first — your "top component" then points at the mean, not along the variance.',
    'Expecting eigen-anything of a non-square matrix. Rectangular machines have singular values (SVD), not eigenvalues.',
    'Assuming eigenvalues are always real: only guaranteed for symmetric matrices (like covariance). A rotation matrix has complex eigenvalues — it turns EVERY direction (no real invariant axis in the plane), which is geometrically obvious once you think in transformations.',
  ],
  interview: [
    {
      q: 'Explain eigenvectors and eigenvalues intuitively, then give two places they matter in ML.',
      a: 'An eigenvector of a transformation is a direction the transformation cannot rotate — output stays on the input\'s line, just scaled by the eigenvalue: Av = λv. They\'re the machine\'s natural axes; expressed in them, the matrix is diagonal (a per-axis stretch list). ML appearances: (1) PCA — eigenvectors of the covariance matrix are the maximal-variance directions used for dimensionality reduction/visualization/decorrelation; (2) training stability — repeated multiplication through deep/recurrent nets scales signals by λᵏ, producing exploding (|λ|>1) or vanishing (|λ|<1) gradients, motivating careful init, gradient clipping, residual connections; also PageRank (dominant eigenvector of the web\'s link matrix) and spectral clustering.',
    },
    {
      q: 'Walk me through what PCA does end-to-end, including what can go wrong.',
      a: 'Center the data (subtract feature means; standardize too if scales differ wildly). Compute the covariance matrix — or, better numerically, take the SVD of the centered data directly. The top-k eigenvectors/right-singular-vectors are the principal components; project data onto them to get k coordinates per sample; eigenvalue/Σ² ratios tell you the variance retained (pick k at e.g. 95%). Gotchas: forgetting to center (breaks everything), forgetting to scale (a feature measured in grams dominates one in kilograms for no reason), interpreting components causally (they\'re variance directions, not mechanisms), and applying PCA fit on the full dataset before a train/test split (data leakage — fit on train only).',
    },
    {
      q: 'What is a low-rank approximation and why is it so useful in ML?',
      a: 'Truncate the SVD to the top-k singular values: A ≈ UₖΣₖVₖᵀ. By Eckart–Young this is the best possible rank-k approximation in Frobenius/spectral norm. Real-data matrices have fast-decaying singular values, so k ≪ n captures most structure while storing (m+n)k numbers instead of mn. Uses: compression, denoising (small σ directions are often noise), latent semantic analysis, matrix-factorization recommenders, and LoRA — which bets that fine-tuning\'s weight update is intrinsically low-rank and therefore learns only two thin factors, cutting trainable parameters by ~99% with minimal quality loss.',
    },
    {
      q: 'Why do deep networks suffer from vanishing/exploding gradients, in linear-algebra terms?',
      a: 'The backward pass multiplies the gradient by each layer\'s Jacobian in sequence — a product of ~L matrices. A product of matrices scales vectors roughly by the product of their dominant singular values, so if typical σmax > 1 the gradient norm grows like σᵏ (explodes), and if < 1 it decays exponentially (vanishes) — the power-iteration effect applied to gradients. Mitigations map directly onto the math: initialization schemes that set σ ≈ 1 (Xavier/He), orthogonal init, gradient clipping (caps the explosion), residual connections (make the Jacobian ≈ I + small, pinning σ near 1), normalization layers, and for sequences, replacing depth-through-time recurrence with attention.',
    },
  ],
};
