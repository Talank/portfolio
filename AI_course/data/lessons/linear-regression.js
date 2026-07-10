window.LESSONS = window.LESSONS || {};
window.LESSONS['linear-regression'] = {
  id: 'linear-regression',
  title: 'Linear Regression from Scratch',
  category: 'Part 2 — Classical ML',
  timeMin: 45,
  summary: 'Your first complete machine learning model, built with your own hands: a line, a loss, gradients, and a training loop. It\'s the smallest possible instance of the exact process that trains GPT — and after this lesson, "training a model" is something you\'ve personally done, not read about.',
  goals: [
    'Write the model (ŷ = wx + b), the MSE loss, and derive both gradients by hand with the chain rule.',
    'Implement the full training loop and watch loss fall — your first real model training.',
    'Explain the normal equation alternative and when gradient descent wins.',
    'Explain why feature scaling matters and read w, b as interpretable quantities.',
  ],
  concept: [
    {
      h: 'The model: a line with two learnable numbers',
      p: [
        'Predict a number y from a number x with the simplest hypothesis space: all straight lines.',
        '<div class="math">ŷ = w·x + b<span class="mnote">w = slope ("how much y changes per unit of x") · b = intercept ("y when x = 0")</span></div>',
        'With d features it becomes ŷ = w·x + b with a weight per feature — a dot product (Part 1, as promised). Everything below transfers unchanged; we stay 1-D so every number is inspectable.',
        'The loss is mean squared error — which you now know is not arbitrary but the Gaussian-noise MLE (statistics lesson):',
        '<div class="math">L(w, b) = (1/n) Σᵢ (ŷᵢ − yᵢ)²</div>',
      ],
    },
    {
      h: 'Deriving the gradients (do this once by hand, own it forever)',
      p: [
        'Apply the chain rule per parameter. Let errᵢ = ŷᵢ − yᵢ = (wxᵢ + b) − yᵢ. The outer function is err², slope 2·err. The inner derivative of err w.r.t. w is xᵢ; w.r.t. b it\'s 1. So:',
        '<div class="math">∂L/∂w = (2/n) Σᵢ errᵢ · xᵢ &nbsp;&nbsp;&nbsp; ∂L/∂b = (2/n) Σᵢ errᵢ<span class="mnote">read them: b\'s gradient is the average error ("are we systematically high or low?"); w\'s gradient is error <i>correlated with x</i> ("are we wrong more on large x?")</span></div>',
        'Those readings are worth a pause, because they explain <i>how</i> the model learns: if predictions are uniformly too high, ∂L/∂b is positive and b gets pushed down. If predictions are too high specifically when x is large, ∂L/∂w is positive and the slope flattens. Gradient descent is not magic — it\'s these two corrective instincts, formalized.',
        'Then the loop you already implemented in the calculus lab: w ← w − η·∂L/∂w, b ← b − η·∂L/∂b, repeat. That\'s training. For GPT, replace (w, b) with 10¹² parameters and the line with a transformer — the loop is <i>identical</i>.',
      ],
    },
    {
      h: 'The closed-form alternative — and why it doesn\'t scale',
      p: [
        'Least squares is special: calculus can solve it in one shot. Setting both gradients to zero gives the <b>normal equation</b> (in matrix form for d features):',
        '<div class="math">w* = (XᵀX)⁻¹ Xᵀy<span class="mnote">what np.polyfit / sklearn\'s LinearRegression compute (via QR/SVD, not an explicit inverse)</span></div>',
        'Why doesn\'t all of ML work like this? Three reasons: solving costs O(d³) in the feature count (fine at d = 100, dead at d = 10⁹); it requires the loss to be quadratic (a parabola bowl with one bottom — logistic regression and neural nets aren\'t); and it needs all data in memory at once. Gradient descent needs none of that — any differentiable loss, any scale, data streamed in mini-batches. That trade — exact-but-rigid vs iterative-but-universal — is why gradient descent runs the world.',
      ],
    },
    {
      h: 'Practicalities that show up in every real project (and interviews)',
      p: [
        '<b>Feature scaling.</b> With multiple features on wildly different scales (age 0–100, income 0–10⁷), the loss surface becomes a stretched ravine: the gradient points across the ravine, not along it, so one learning rate is simultaneously too big for one axis and too small for the other, and training zigzags. Standardizing features ((x − mean)/std, fit on train only!) rounds the bowl and can speed convergence by orders of magnitude. Trees don\'t care about scaling; gradient-trained and distance-based models do.',
        '<b>Interpretability.</b> After fitting standardized features, weights are comparable: "one standard deviation of pressure-drop adds w knots of wind". This is why linear regression remains beloved in science and business — the model IS the explanation. (Caveat that impresses interviewers: with correlated features, individual weights become unstable and uninterpretable — the model can shift credit between correlated twins freely.)',
        '<b>Beyond straight lines for free.</b> Feed the model transformed features — x², log x, x₁·x₂ — and it\'s still "linear" (in the weights), still one-shot solvable, but fits curves. That\'s polynomial regression (last lesson\'s demo), and it\'s the cheapest capacity knob in classical ML.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Nami\'s storm line: two dials and a corrective instinct',
      text: [
        'Nami\'s barometer logbook has dozens of entries: pressure drop before a storm (x) vs the storm\'s wind speed (y). Plotted, they form a fuzzy upward trend — no perfect line passes through all of them (weather has noise), but a line clearly lives inside that fuzz. She pins a string to the chart and adjusts two things: its tilt (w) and its height (b).',
        'Her adjustment procedure is the gradient, embodied. She looks at the misses: are recent predictions <i>uniformly</i> too low? Lift the whole string (that\'s ∂L/∂b — the average error). Are they fine for drizzles but too low <i>specifically for big pressure drops</i>? Tilt the string steeper (that\'s ∂L/∂w — error correlated with x). She repeats: look at misses, nudge tilt and height, until the string settles where nudging no longer helps — gradient zero, minimum found.',
        'And why does she count a miss of 20 knots as four times worse than a miss of 10, not twice (squared error)? Because underestimating a monster storm by a lot is what kills crews — big errors are <i>disproportionately</i> catastrophic at sea. Her squared penalty encodes exactly that; the statistics lesson adds that it also means she\'s assuming bell-curve weather noise. Two dials, a corrective instinct, and a principled loss: that is the entire discipline of machine learning, at crayon scale.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Leonard\'s "how late is Sheldon" model',
      text: [
        'Leonard, driving Sheldon everywhere, develops a mental model: minutes-Sheldon-will-lecture-me (y) as a function of minutes-we-are-late (x). Every trip adds a data point. His first guess ("each minute late costs one minute of lecture") underestimates badly on big delays — Sheldon\'s outrage grows steeper than linear, and being 20 minutes late once cost him a 90-minute treatise with slides. So Leonard revises the slope upward, then the baseline too (there\'s a lecture even when they\'re on time: b > 0, the intercept — some of Sheldon\'s lecturing is unconditional).',
        'Leonard fitting slope and baseline from accumulated misses is the training loop; the always-there baseline lecture is the cleanest intercept you\'ll ever meet.',
      ],
    },
    why: 'Nami\'s two corrections ARE the two gradient formulas — uniformly-off → move b, off-proportionally-to-x → move w. If you blank on the gradient derivation in an interview, reconstruct it from her instincts; the calculus just formalizes them.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'd1', emoji: '📍', label: '(2, 9)', x: 26, y: 62 },
      { id: 'd2', emoji: '📍', label: '(4, 15)', x: 44, y: 46 },
      { id: 'd3', emoji: '📍', label: '(6, 22)', x: 62, y: 28 },
      { id: 'd4', emoji: '📍', label: '(8, 26)', x: 80, y: 16 },
      { id: 'loss', emoji: '🌡️', label: 'MSE: ?', x: 12, y: 16 },
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 10, y: 82 },
      { id: 'string', emoji: '🪢', label: 'the line (w, b)', x: 50, y: 84 },
    ],
    steps: [
      { c: 'Barometer log: pressure drop vs wind speed. Noisy, but a trend hides inside. Nami\'s string starts flat: w = 0, b = 5.', l: { loss: 'MSE: 180' } },
      { c: 'Every point sits ABOVE the string — uniformly too low. Average error is large → the b-gradient screams "raise the height!"', p: { d1: 'bad', d2: 'bad', d3: 'bad', d4: 'bad' }, a: { string: [50, 66] }, l: { loss: 'MSE: 95' } },
      { c: 'Better — but still too low specifically on BIG pressure drops (right side). Error correlates with x → the w-gradient says "tilt steeper!"', p: { d1: 'lit', d2: 'lit', d3: 'bad', d4: 'bad' }, a: { string: [50, 50] }, l: { loss: 'MSE: 30' } },
      { c: 'Tilt, nudge, re-read the misses. Each pass: w ← w − η·∂L/∂w, b ← b − η·∂L/∂b.', p: { d3: 'lit', d4: 'lit' }, a: { string: [50, 40] }, l: { loss: 'MSE: 6' } },
      { c: 'The string settles inside the fuzz — nudges stop helping. Gradient ≈ 0: fitted. Residual scatter that remains is the weather\'s own noise.', p: { d1: 'good', d2: 'good', d3: 'good', d4: 'good' }, a: { string: [50, 36] }, l: { loss: 'MSE: 1.2 ✓' } },
      { c: 'Storm predicted within ±1 knot. Same loop, 10¹² dials instead of two: that\'s GPT training. 🏴‍☠️', p: { loss: 'good' } },
    ],
  },
  tech: [
    {
      q: 'What exactly does sklearn\'s LinearRegression().fit(X, y) do differently from my gradient descent?',
      a: 'It solves the normal equations directly — via an SVD/QR factorization of X (LAPACK\'s <code>gelsd</code>), not gradient steps, and not an explicit matrix inverse (numerically safer). Result: exact optimum, no learning rate, no iterations — but O(n·d² + d³)-ish cost and the requirement that the loss be exactly least-squares. <code>SGDRegressor</code> is the gradient-descent version for huge/streaming data, and <code>Ridge</code>/<code>Lasso</code> are the same solve with L2/L1 penalties added. Rule of thumb: closed form when it exists and fits in memory; gradient descent for everything else — which, once you leave linear-land, is everything.',
    },
    {
      q: 'Why square the errors instead of absolute values — and when is that the wrong choice?',
      a: 'Three reasons for squaring: it\'s the Gaussian MLE (statistics lesson); it\'s smoothly differentiable everywhere (|x| has a kink at 0 that annoys optimizers); and it yields closed-form solutions. The cost: squaring makes outliers tyrants — one wild point contributes its error², so a single corrupted label can drag the whole line. Absolute error (MAE — Laplace MLE) fits the conditional MEDIAN instead of the mean and shrugs at outliers; Huber loss is the industry compromise (quadratic near zero, linear in the tails). Answer template for interviews: "MSE by default, MAE/Huber when the data has heavy tails or label corruption, and the choice is secretly a noise-model assumption."',
    },
    {
      q: 'My gradient descent for linear regression diverges even at tiny learning rates. What\'s actually wrong?',
      a: 'Almost always feature scaling. Unscaled features (say x ∈ [0, 10000]) produce gradient components multiplied by x — thousands of times bigger than the b-gradient — so the loss surface is a canyon and any η big enough to move b overshoots w. Standardize each feature to mean 0/std 1 (statistics from the TRAINING split only), train, then if you need original-scale coefficients, unwind the transform algebraically. Second suspect: forgetting the 1/n in the loss, so gradients scale with dataset size and your η is effectively n times bigger than you think. Both bugs are rites of passage; you now get to skip them.',
    },
    {
      q: 'What is R², and why do people report it alongside MSE?',
      a: 'R² = 1 − (model\'s squared error)/(squared error of always-predicting-the-mean): the fraction of the target\'s variance the model explains. It\'s unitless and scale-free, so "R² = 0.85" means the same across problems, while "MSE = 34.2" is meaningless without knowing the units and spread of y. R² = 0 means "no better than the mean-guesser" (a baseline you should ALWAYS compute — an embarrassing number of shipped models fail it); negative R² on a test set means actively worse than the mean, a red flag for leakage-corrupted training or drift. Caveats: R² always rises when you add features on TRAIN (use held-out/adjusted versions), and a high R² says fit, not causality.',
    },
  ],
  code: {
    title: 'Worked example — the full training run, annotated',
    intro: 'Every piece from the lesson assembled: synthetic data with known truth (w=3, b=−2), the two-gradient loop, and convergence you can watch. Run it, then perturb it: change η, remove scaling, add an outlier.',
    code: `import numpy as np
rng = np.random.default_rng(1)

# Reality: y = 3x - 2 + noise      (we KNOW the answer; the model doesn't)
x = rng.uniform(0, 10, 200)
y = 3 * x - 2 + rng.normal(0, 1.0, 200)

w, b, lr = 0.0, 0.0, 0.01
for epoch in range(400):
    y_hat = w * x + b                      # forward pass: predictions
    err = y_hat - y                        # residuals
    grad_w = 2 * np.mean(err * x)          # error correlated with x
    grad_b = 2 * np.mean(err)              # average error
    w -= lr * grad_w                       # descend
    b -= lr * grad_b
    if epoch % 100 == 0:
        print(f"epoch {epoch:3d}  loss {np.mean(err**2):7.3f}  w {w:5.2f}  b {b:5.2f}")

print(f"final: w={w:.3f} (true 3), b={b:.3f} (true -2)")

# The one-shot answer for comparison (normal equation via lstsq):
X = np.stack([x, np.ones_like(x)], axis=1)      # column of 1s absorbs b
(w_ne, b_ne), *_ = np.linalg.lstsq(X, y, rcond=None)
print(f"normal equation: w={w_ne:.3f}, b={b_ne:.3f}   (same answer, zero iterations)")`,
    notes: [
      'The column-of-ones trick folds b into the weight vector — universal in ML notation, and why formulas often show just "Xw" with no separate bias.',
      'w converges much faster than b here: x averages ~5, so w\'s gradient is ~5× stronger — a miniature of the scaling problem. Standardize x and watch both converge together.',
      'Neither method recovers exactly (3, −2) — the noise guarantees that. The gap between fitted and true parameters shrinks as √n grows: estimation, as covered in statistics.',
    ],
  },
  lab: {
    title: 'Lab: train linear regression yourself (pure Python)',
    prompt: 'Implement <code>fit_linear(xs, ys, lr=0.01, epochs=500)</code> returning <code>(w, b)</code>: start both at 0.0 and run the two-gradient update from the lesson (means over the dataset, factor of 2 included). Also implement <code>predict(w, b, xs)</code>. Tests: recover a known line from clean data, get close on noisy data, and — the part most tutorials skip — verify the loss actually DECREASES during training.',
    starter: `def predict(w, b, xs):
    # list of w*x + b
    pass

def fit_linear(xs, ys, lr=0.01, epochs=500):
    w, b = 0.0, 0.0
    n = len(xs)
    for _ in range(epochs):
        # errors: predictions minus truths
        # grad_w = 2/n * sum(err_i * x_i)
        # grad_b = 2/n * sum(err_i)
        # descend on both
        pass
    return w, b
`,
    checks: [
      { re: 'def\\s+fit_linear', must: true, hint: 'Define fit_linear(xs, ys, lr, epochs).' },
      { re: 'def\\s+predict', must: true, hint: 'Define predict(w, b, xs).' },
      { re: 'w\\s*-=|w\\s*=\\s*w\\s*-', must: true, hint: 'Update w by SUBTRACTING lr * grad_w (descent, not ascent).' },
      { re: 'b\\s*-=|b\\s*=\\s*b\\s*-', must: true, hint: 'Don\'t forget to update b too — a classic omission that fits slope but not level.' },
      { re: 'import\\s+(numpy|sklearn)', must: false, hint: 'Pure Python: the point is to own what .fit() hides.' },
    ],
    tests: `xs = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
ys = [3*x - 2 for x in xs]                      # perfect line, no noise
w, b = fit_linear(xs, ys, lr=0.02, epochs=3000)
assert abs(w - 3.0) < 0.05, f"w should approach 3, got {w:.3f}"
assert abs(b + 2.0) < 0.15, f"b should approach -2, got {b:.3f}"
preds = predict(w, b, [10.0])
assert abs(preds[0] - 28.0) < 0.5, f"prediction at x=10 should be ~28, got {preds[0]:.2f}"

# loss must fall between epoch 10 and epoch 200
def loss_after(ep):
    ww, bb = fit_linear(xs, ys, lr=0.02, epochs=ep)
    return sum((ww*x + bb - y)**2 for x, y in zip(xs, ys)) / len(xs)
assert loss_after(200) < loss_after(10) * 0.5, "training should reduce the loss substantially"

# noisy data: still lands near the truth
import random
r = random.Random(0)
xs2 = [r.uniform(0, 10) for _ in range(300)]
ys2 = [2.0*x + 5 + r.gauss(0, 1) for x in xs2]
w2, b2 = fit_linear(xs2, ys2, lr=0.01, epochs=2000)
assert abs(w2 - 2.0) < 0.15 and abs(b2 - 5.0) < 0.8, f"noisy fit off: w={w2:.2f}, b={b2:.2f}"
print("Nami's string is set. You have now trained a model with your own gradients.")`,
    solution: `def predict(w, b, xs):
    return [w * x + b for x in xs]

def fit_linear(xs, ys, lr=0.01, epochs=500):
    w, b = 0.0, 0.0
    n = len(xs)
    for _ in range(epochs):
        errs = [w * x + b - y for x, y in zip(xs, ys)]
        grad_w = 2 * sum(e * x for e, x in zip(errs, xs)) / n
        grad_b = 2 * sum(errs) / n
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b`,
    notes: [
      'You just wrote, in 12 lines, the honest core of every training framework: forward pass, residuals, gradients, update. PyTorch\'s contribution is doing the gradient lines automatically for arbitrary models.',
      'b converges slower than w (weaker gradient) — that\'s why the test tolerance on b is looser. Watch for the same asymmetry in real trainings.',
    ],
  },
  quiz: [
    {
      q: 'In ŷ = wx + b fitted to (pressure drop → wind speed), b represents…',
      options: [
        'the strongest possible storm',
        'the predicted wind speed when the pressure drop is zero',
        'the average wind speed',
        'the model\'s error',
      ],
      correct: 1,
      explain: 'The intercept is the prediction at x = 0 — Sheldon\'s baseline lecture. (Whether x=0 is physically meaningful is a separate, worthwhile question.)',
    },
    {
      q: '∂L/∂b = (2/n)Σ(ŷᵢ − yᵢ) is best read as…',
      options: [
        'the correlation between error and features',
        'the average error — "are we systematically predicting high or low?"',
        'the variance of predictions',
        'the learning rate',
      ],
      correct: 1,
      explain: 'Uniformly-too-high predictions ⇒ positive average error ⇒ b gets pushed down. The w-gradient is the error-x correlation ("wrong more on large x?"). Being able to READ gradients is the skill.',
    },
    {
      q: 'When is gradient descent clearly preferable to the normal equation for linear regression?',
      options: [
        'Never — closed form is always better when it exists',
        'Very many features and/or data too big for memory (O(d³) solve infeasible, streaming needed)',
        'When the data is noisy',
        'When features are scaled',
      ],
      correct: 1,
      explain: 'The solve costs ~O(d³) and wants everything in RAM; SGD streams mini-batches at any scale. Noise and scaling affect both methods.',
    },
    {
      q: 'One label is corrupted: y = 9000 instead of 9. Under MSE, the fitted line will…',
      options: [
        'ignore it — one point among hundreds',
        'shift noticeably toward it, since its error is SQUARED into dominance',
        'become vertical',
        'fail to converge',
      ],
      correct: 1,
      explain: 'A residual of ~9000 contributes ~8×10⁷ to the loss — millions of times more than typical points. MSE fits means, and means chase outliers. MAE/Huber are the robust alternatives.',
    },
  ],
  pitfalls: [
    'Forgetting to update b (or initializing and never training it). The line gets the right slope at the wrong height, and the residuals all share a sign — that signature IS the untrained intercept.',
    'Training on unscaled multi-feature data and concluding "gradient descent doesn\'t work". It\'s a ravine problem; standardize (fit scaler on train only).',
    'Reading causality from coefficients: "w = 3 for ice-cream sales ⇒ ice cream causes drowning". Regression fits correlations, with all of the statistics lesson\'s caveats.',
    'Interpreting individual weights when features are strongly correlated — credit slides freely between correlated twins; the weights become unstable even when predictions stay good.',
    'Skipping the mean-predictor baseline. If your model barely beats "always predict average", you want to know before the demo, not during.',
  ],
  interview: [
    {
      q: 'Derive the gradient-descent updates for simple linear regression with MSE.',
      a: 'Model ŷ = wx + b, loss L = (1/n)Σ(ŷᵢ − yᵢ)². Chain rule with errᵢ = ŷᵢ − yᵢ: ∂L/∂w = (2/n)Σ errᵢ·xᵢ (outer derivative 2·err times ∂err/∂w = xᵢ) and ∂L/∂b = (2/n)Σ errᵢ (∂err/∂b = 1). Updates: w ← w − η(2/n)Σerrᵢxᵢ, b ← b − η(2/n)Σerrᵢ. I\'d add the interpretations — b\'s gradient is the mean error (systematic offset), w\'s is the error-feature correlation — and note that with matrix notation this becomes ∇w = (2/n)Xᵀ(Xw − y), the form that generalizes to any number of features.',
    },
    {
      q: 'Compare solving linear regression by normal equation vs gradient descent.',
      a: 'Normal equation w = (XᵀX)⁻¹Xᵀy (computed via QR/SVD in practice): exact, hyperparameter-free, one shot — but O(nd² + d³) compute, O(nd) memory, needs XᵀX well-conditioned (correlated features hurt; ridge regularization fixes by adding λI), and only exists because the loss is quadratic. Gradient descent: iterative and approximate, needs a learning rate and scaling, but streams data in mini-batches, scales to arbitrary d, and — decisively — works for ANY differentiable loss, which is why it\'s the universal tool once you move to logistic regression and neural nets. Practical answer: sklearn\'s closed-form for tabular d ≲ 10⁴; SGD beyond that or online.',
    },
    {
      q: 'Your linear model\'s residuals show a clear curve pattern when plotted against x. What does that tell you and what do you do?',
      a: 'Structured residuals mean the model class is missing systematic signal — the relationship isn\'t linear in the current features (underfitting/bias, diagnosed visually). Residuals-vs-x showing a U shape suggests adding an x² feature; funnel shapes (variance growing with x) suggest heteroscedasticity — consider log-transforming y or weighted least squares; residual autocorrelation in time-series suggests missing temporal features. The elegant fix is feature engineering within the linear framework — polynomial/log/interaction terms keep the closed-form solution and interpretability while fitting curves. Residual plots are the single highest-value diagnostic in classical regression; mentioning them unprompted reads as experience.',
    },
    {
      q: 'Why does feature scaling matter for gradient descent but not for decision trees?',
      a: 'Gradient descent\'s update couples all parameters through one learning rate. Features with big ranges produce proportionally big gradient components (∂L/∂wⱼ ∝ Σerr·xⱼ), stretching the loss surface into an ill-conditioned ravine — η is then too large for steep axes (oscillation) and too small for flat ones (crawling); standardizing rounds the bowl so one η fits all directions. It matters equally for anything distance-based (KNN, k-means, SVM-RBF), where an unscaled feature dominates the metric. Trees are invariant because they only use order — "is x > 3.2?" — and any monotone rescaling preserves order, splits, and therefore the tree. (Regularization strength also interacts with scale: penalizing w equally only makes sense if features are comparable.)',
    },
  ],
};
