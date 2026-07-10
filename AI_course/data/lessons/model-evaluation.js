window.LESSONS = window.LESSONS || {};
window.LESSONS['model-evaluation'] = {
  id: 'model-evaluation',
  title: 'Model Evaluation: Precision, Recall, F1, ROC & Cross-Validation',
  category: 'Part 2 — Classical ML',
  timeMin: 45,
  summary: 'Accuracy lies when classes are imbalanced. Learn the confusion matrix, precision vs recall, F1, ROC-AUC vs PR-AUC, and cross-validation — the evaluation toolkit every ML interview and every real project demands.',
  goals: [
    'Fill in a confusion matrix (TP/FP/FN/TN) from raw predictions without hesitating',
    'Compute precision, recall, and F1 by hand, and explain which one matters in a given scenario',
    'Explain what a ROC curve plots, what AUC means, and when PR-AUC is the better choice',
    'Run k-fold cross-validation mentally: why it exists, what it estimates, and its cost',
    'Spot the classic evaluation traps: imbalanced accuracy, data leakage, tuning on the test set'
  ],
  concept: [
    {
      h: 'Accuracy is the wrong default',
      p: [
        'Accuracy = (correct predictions) / (all predictions). It feels natural, but it collapses the moment your classes are imbalanced. If 99% of ships passing a checkpoint are innocent, a "model" that stamps everyone INNOCENT scores 99% accuracy while catching zero pirates. It is precisely the useless model.',
        'The fix is not a better single number — it is to first split the errors apart. A binary classifier can be wrong in two different ways, and those two mistakes usually have very different costs. The confusion matrix is the table that keeps them separate.'
      ]
    },
    {
      h: 'The confusion matrix: four boxes, everything follows',
      p: [
        'Pick a convention and never let go: "positive" = the class you care about detecting (pirate, disease, spam, fraud). Then every prediction lands in exactly one of four boxes:',
        '<table class="cmp"><tr><th></th><th>Predicted +</th><th>Predicted −</th></tr><tr><th>Actually +</th><td>TP (true positive) — caught it</td><td>FN (false negative) — missed it</td></tr><tr><th>Actually −</th><td>FP (false positive) — false alarm</td><td>TN (true negative) — correctly ignored</td></tr></table>',
        'Every metric in this lesson is just arithmetic over these four counts. If you can fill this table from a list of (prediction, truth) pairs, you can derive everything else on a whiteboard.'
      ]
    },
    {
      h: 'Precision and recall: two questions, two denominators',
      p: [
        'Precision answers: "of everything I flagged as positive, how much really was?" Recall answers: "of everything that really was positive, how much did I flag?" Same numerator (TP), different denominator — that is the whole difference.',
        '<div class="math">precision = TP / (TP + FP)&nbsp;&nbsp;&nbsp;&nbsp;recall = TP / (TP + FN)</div>',
        'They trade off through the decision threshold you met in logistic regression. Lower the threshold (arrest anyone slightly suspicious) → you catch more pirates (recall up) but arrest more merchants (precision down). Raise it → fewer false alarms (precision up) but pirates slip through (recall down). You cannot pick "the best threshold" without knowing which mistake costs more.',
        'Which matters when? Cancer screening: a miss can kill, a false alarm costs a follow-up test → maximize recall. Spam filter: a missed spam is mildly annoying, a real email in the spam folder is a disaster → maximize precision. Interviewers love asking this; answer with the cost of each error type, not with a memorized rule.'
      ]
    },
    {
      h: 'F1: one number when you must have one',
      p: [
        'F1 is the harmonic mean of precision and recall:',
        '<div class="math">F1 = 2 · (precision · recall) / (precision + recall)</div>',
        'Why harmonic and not arithmetic? The harmonic mean punishes imbalance. Precision 1.0 with recall 0.01 has an arithmetic mean of ~0.5 (sounds fine!) but an F1 of ~0.02 (correctly terrible). A model only gets a high F1 by being decent at both.',
        'F1 ignores TN entirely — which is exactly why it works for imbalanced problems where TN is a huge, uninformative pile. If you need to weight recall more than precision, the generalization Fβ (e.g. F2) exists, but F1 is the interview staple.'
      ]
    },
    {
      h: 'ROC curves and AUC: threshold-free evaluation',
      p: [
        'A classifier that outputs probabilities is really a whole family of classifiers — one per threshold. The ROC curve evaluates the family at once: sweep the threshold from 1 down to 0 and plot TPR (= recall) on the y-axis against FPR = FP/(FP+TN) on the x-axis at every step.',
        'A perfect model hugs the top-left corner (catch everything, no false alarms). Random guessing gives the diagonal line. AUC — the area under the curve — compresses this to one number with a beautiful interpretation:',
        '<div class="math">AUC = P(score(random positive) &gt; score(random negative))</div>',
        'AUC = 0.5 means the model ranks positives no better than a coin flip; AUC = 1.0 means every positive scores above every negative. Because it only depends on the ranking of scores, AUC is unchanged by any monotonic rescaling of probabilities — good for comparing models, useless for telling you which threshold to deploy.',
        'The trap: with heavy imbalance, FPR\'s denominator (all negatives) is enormous, so even thousands of false positives barely move FPR, and the ROC curve looks flattering. Precision–recall curves (and PR-AUC) replace FPR with precision, which does feel every false positive. Rule of thumb: rare positive class and you care about finding it → report PR-AUC.'
      ]
    },
    {
      h: 'Cross-validation: honest estimates from limited data',
      p: [
        'A single train/test split gives you one noisy estimate of generalization — and if the split was lucky, you fool yourself. k-fold cross-validation: cut the data into k equal folds; for each fold, train on the other k−1 and test on it; average the k scores. Every point gets used for testing exactly once and for training k−1 times.',
        '<div class="math">CV score = (1/k) · Σᵢ score(model trained without foldᵢ, evaluated on foldᵢ)</div>',
        'k = 5 or 10 is standard. The cost is training k models instead of one. Use <em>stratified</em> k-fold for classification (each fold keeps the class ratio) and <em>time-series splits</em> (train on past, test on future — never shuffle!) for temporal data.',
        'The workflow that keeps you honest: hold out a final test set and lock it away. Do all model selection and hyperparameter tuning with cross-validation on the remaining data. Touch the test set exactly once, at the very end. Every peek before that silently turns your test set into a validation set, and its score into a lie.'
      ]
    },
    {
      h: 'Data leakage: the silent score-inflater',
      p: [
        'Leakage = information from the test data (or from the future) sneaking into training. Classic forms: normalizing with the mean/std of the <em>whole</em> dataset before splitting; deduplicating after splitting so near-copies sit on both sides; using features that are recorded after the label ("was hospitalized" as a feature for predicting illness).',
        'The symptom is a validation score that looks amazing and a production model that faceplants. The cure is procedural, not statistical: fit every preprocessing step (scalers, TF-IDF vocabularies, encoders) on training folds only, inside the CV loop. This is exactly what sklearn\'s Pipeline exists for — it re-fits the preprocessing per fold so you physically cannot leak.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Marine audit: Smoker vs the do-nothing captain',
      text: 'After Loguetown, Smoker gets audited. Marine HQ reviews his checkpoint: of 1000 ships he inspected, 50 were actually pirates. Smoker, obsessed with catching Luffy, flagged 200 ships as pirates — among them 45 of the 50 real ones. His accuracy? He got 45 pirates right and 795 merchants right: 840/1000 = 84%. Sounds decent — until Hina points out that lazy Captain Nezumi, who flags NO ONE, scores 950/1000 = 95% accuracy at the same checkpoint. Accuracy is rewarding the officer who does nothing! So HQ switches metrics. Smoker\'s recall: 45/50 = 90% — he catches almost every pirate. His precision: 45/200 = 22.5% — three of every four ships he detains are innocent merchants, and the trade guilds are furious. Nezumi\'s recall: 0%. Now the numbers tell the real story: Smoker errs toward false alarms, Nezumi toward misses, and which officer you want depends on whether a escaped pirate or a detained merchant costs the World Government more. HQ settles on F1 to force balance — Smoker\'s 2·(0.225·0.9)/(0.225+0.9) ≈ 0.36 beats Nezumi\'s 0, but neither is bragging. And when Smoker protests "my split of ships was unlucky — Luffy came through that week!", HQ answers with cross-validation: they re-audit him across 5 different weeks and average, so no single lucky or cursed week decides his promotion.'
    },
    sitcom: {
      show: 'TBBT',
      title: 'Sheldon\'s 97%-accurate, 100%-useless classifier',
      text: 'Sheldon builds a "friendship classifier" to predict who will annoy him at parties. He proudly reports 97% accuracy. Leonard checks the data: 97% of Sheldon\'s contacts already annoy him, and the model just predicts "annoying" for everyone — including Penny\'s harmless friends, MeeMaw, and Stephen Hawking. Precision on the "not annoying" class: undefined, because the model never predicts it. Penny, without any math: "Sweetie, a smoke detector that\'s always beeping isn\'t 97% right, it\'s 100% useless." Sheldon grudgingly recomputes with F1, which comes out near zero, and mutters that the harmonic mean is "needlessly judgmental."'
    },
    why: 'This story pins each metric to a character: Smoker is high-recall/low-precision (flags everything suspicious), Nezumi is the accuracy paradox (does nothing, scores high), the audit-across-weeks is cross-validation, and Hina choosing the metric based on error costs is exactly what you must do in interviews and in production. When you see "precision," think "of Smoker\'s 200 detained ships, how many were real pirates?" — the denominator is what the model claimed.'
  },
  storyAnim: {
    title: 'The Marine Audit: 4 boxes decide Smoker\'s promotion',
    h: 250,
    props: [
      { id: 'boxTP', emoji: '🟩', label: 'TP —', x: 12, y: 12 },
      { id: 'boxFP', emoji: '🟥', label: 'FP —', x: 37, y: 12 },
      { id: 'boxFN', emoji: '🟧', label: 'FN —', x: 62, y: 12 },
      { id: 'boxTN', emoji: '⬛', label: 'TN —', x: 87, y: 12 },
      { id: 'checkpoint', emoji: '⚓', label: 'Checkpoint', x: 50, y: 48 },
      { id: 'metric', emoji: '📊', label: 'metric: ?', x: 15, y: 82 }
    ],
    actors: [
      { id: 'smoker', emoji: '💨', label: 'Smoker', x: 50, y: 62 },
      { id: 'pirate', emoji: '🏴‍☠️', label: 'pirate ship', x: 8, y: 55 },
      { id: 'merchant', emoji: '⛵', label: 'merchant', x: 90, y: 55 },
      { id: 'hina', emoji: '👮', label: 'Hina (audit)', x: 78, y: 82 }
    ],
    steps: [
      { c: 'Audit week: 1000 ships pass the checkpoint, 50 are real pirates. Every ship lands in one of four boxes: was it really a pirate × did Smoker flag it?', a: { pirate: [30, 55], merchant: [70, 55] } },
      { c: 'Pirate flagged as pirate → TP. Smoker catches 45 of the 50. The 5 that slip through disguised → FN, the miss box.', a: { pirate: [12, 22] }, p: { boxTP: 'good', boxFN: 'bad' }, l: { boxTP: 'TP 45', boxFN: 'FN 5' } },
      { c: 'But he also detains 155 innocent merchants → FP, the false-alarm box. The 795 he waves through → TN.', a: { merchant: [37, 22] }, p: { boxFP: 'bad', boxTN: 'dim' }, l: { boxFP: 'FP 155', boxTN: 'TN 795' } },
      { c: 'Accuracy = (45+795)/1000 = 84%. Yet do-nothing Nezumi, who flags NO ONE, scores 95%. Accuracy rewards ignoring rare pirates!', p: { metric: 'bad' }, l: { metric: 'accuracy: 84% < Nezumi 95% ?!' } },
      { c: 'Hina splits the errors. Precision = 45/200 = 22.5% — of the ships Smoker flagged, how many were pirates. Recall = 45/50 = 90% — of the real pirates, how many he caught.', a: { hina: [50, 82] }, p: { metric: 'lit' }, l: { metric: 'precision 22.5% · recall 90%' } },
      { c: 'F1 = harmonic mean ≈ 0.36 — the low precision drags it down hard. And HQ re-audits across 5 different weeks and averages: cross-validation, so one lucky week can\'t decide his fate.', p: { metric: 'good' }, l: { metric: 'F1 ≈ 0.36, CV over 5 weeks' } }
    ]
  },
  conceptFlow: {
    title: 'Smoker\'s audit, box by box',
    intro: 'Same 1000-ship audit as the animation.',
    stages: [
      { label: 'Confusion boxes', nodes: [
        { id: 'tp', text: 'TP: 45\ncaught' },
        { id: 'fn', text: 'FN: 5\nmissed' },
        { id: 'fp', text: 'FP: 155\nfalse alarms' },
        { id: 'tn', text: 'TN: 795\ncorrectly ignored' },
      ]},
      { label: 'Misleading', nodes: [
        { id: 'acc', text: 'Accuracy = 84%\nNezumi (flags nobody) = 95%!' },
      ]},
      { label: 'Split the errors', nodes: [
        { id: 'pr', text: 'Precision = 22.5%\nRecall = 90%' },
      ]},
      { label: 'One honest number', nodes: [
        { id: 'f1', text: 'F1 ≈ 0.36' },
      ]},
    ],
    steps: [
      { active: ['tp', 'fn', 'fp', 'tn'], note: '1000 ships, 50 real pirates. Smoker catches 45 (TP), misses 5 (FN), wrongly detains 155 merchants (FP), correctly waves through 795 (TN).' },
      { active: ['acc'], note: 'Accuracy = (45+795)/1000 = 84%. But do-nothing Nezumi, who flags NO ONE, scores 95% — accuracy rewards ignoring rare pirates.' },
      { active: ['pr'], note: 'Split the errors apart: precision = 45/200 = 22.5% (of ships flagged, how many were really pirates); recall = 45/50 = 90% (of real pirates, how many were caught).' },
      { active: ['f1'], note: 'F1, the harmonic mean, punishes the imbalance: ≈0.36 — the weak precision drags it down hard, an honest single number neither raw accuracy nor recall alone would give.' },
    ],
  },
  tech: [
    {
      q: 'Why is F1 the harmonic mean and not the arithmetic mean?',
      a: 'The harmonic mean 2pr/(p+r) is dominated by the smaller of the two numbers. Precision 1.0 + recall 0.02 → arithmetic mean 0.51 (misleading), harmonic mean ≈ 0.039 (honest). Since you can trivially max out either metric alone (flag everything → recall 1; flag only the single surest case → precision ~1), a useful combined score must collapse unless both are decent. Harmonic mean does exactly that. Same reason average speed over a round trip is harmonic, not arithmetic: the slow leg dominates.'
    },
    {
      q: 'What does sklearn\'s cross_val_score actually do when I call it?',
      a: 'cross_val_score(model, X, y, cv=5) clones your (unfitted) estimator 5 times, splits X into 5 folds (StratifiedKFold automatically, if the estimator is a classifier), and for each fold calls clone.fit(train_folds) then scorer(clone, test_fold). It returns the 5 scores as an array — you typically report mean ± std. Key detail: it clones, so your original model object stays unfitted, and nothing trained during CV is kept. CV estimates the procedure\'s quality; to get a deployable model you re-fit on all the data afterward.'
    },
    {
      q: 'Why must preprocessing go inside a Pipeline for cross-validation to be valid?',
      a: 'If you call scaler.fit(X) on the full dataset before CV, the scaler\'s mean/std were computed using rows that later serve as test folds — test information has leaked into the transform applied to training data. With Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())]), cross_val_score re-fits the scaler on each fold\'s training portion only, exactly mirroring deployment, where future data cannot influence your preprocessing. The score drop you often see after fixing this is the honest number.'
    },
    {
      q: 'How is AUC computed from finite data, and why is it a "ranking" metric?',
      a: 'Sort all examples by predicted score. AUC equals the fraction of (positive, negative) pairs where the positive is ranked higher (ties count half) — equivalently the Mann–Whitney U statistic normalized to [0,1]. The trapezoidal area under the empirical ROC curve gives the same number. Because only the ordering enters, doubling all scores or passing them through any increasing function leaves AUC untouched. That\'s why a model can have great AUC and terribly calibrated probabilities at the same time — ranking and calibration are separate properties.'
    }
  ],
  code: {
    title: 'The evaluation toolkit in sklearn',
    intro: 'The leak-proof pattern to memorize: Pipeline + stratified CV on the training data, one final evaluation on the untouched test set. Read the comments — each line answers a "why".',
    code: `from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (confusion_matrix, precision_score, recall_score,
                             f1_score, roc_auc_score, classification_report)

# 1) Leak-proof pipeline: scaler is re-fit inside every CV fold
pipe = Pipeline([
    ("scale", StandardScaler()),
    ("clf", LogisticRegression(class_weight="balanced")),  # helps imbalance
])

# 2) Stratified 5-fold CV — each fold keeps the pirate/merchant ratio
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1")
print(f"F1: {scores.mean():.3f} +/- {scores.std():.3f}")

# 3) Fit on all training data, evaluate ONCE on the locked-away test set
pipe.fit(X_train, y_train)
y_pred  = pipe.predict(X_test)                  # thresholded at 0.5
y_score = pipe.predict_proba(X_test)[:, 1]      # raw probabilities

print(confusion_matrix(y_test, y_pred))         # [[TN FP] [FN TP]] — sklearn's order!
print(classification_report(y_test, y_pred))    # per-class precision/recall/F1
print("ROC-AUC:", roc_auc_score(y_test, y_score))  # needs scores, not labels`,
    notes: [
      'scoring="f1" tells CV to optimize what you care about — the default (accuracy) is usually wrong for imbalanced data. Other options: "roc_auc", "average_precision" (= PR-AUC), "recall".',
      'sklearn\'s confusion_matrix puts TN top-left (rows = truth 0,1; cols = predicted 0,1) — the opposite corner from most textbooks. Read the docs order once and label your printout.',
      'roc_auc_score needs predict_proba scores, not predict labels. Passing hard 0/1 labels silently computes a near-meaningless two-point "curve".',
      'class_weight="balanced" re-weights the loss by inverse class frequency — the cheapest first move against imbalance, before reaching for resampling tricks like SMOTE.'
    ]
  },
  lab: {
    title: 'Build the metrics from scratch',
    prompt: 'Implement the whole evaluation stack with pure Python — no sklearn. Write confusion(y_true, y_pred) returning (tp, fp, fn, tn); precision, recall, and f1 built on it (return 0.0 when a denominator is 0); and auc(y_true, y_score) using the pair-counting definition: the fraction of (positive, negative) pairs where the positive has the higher score, counting ties as 0.5.',
    starter: `def confusion(y_true, y_pred):
    # Return (tp, fp, fn, tn). Positive class is 1.
    ...

def precision(y_true, y_pred):
    # tp / (tp + fp), but 0.0 if the model predicted no positives
    ...

def recall(y_true, y_pred):
    # tp / (tp + fn), but 0.0 if there are no actual positives
    ...

def f1(y_true, y_pred):
    # harmonic mean of precision and recall; 0.0 if both are 0
    ...

def auc(y_true, y_score):
    # For every (positive, negative) pair:
    #   +1.0 if the positive's score is higher, +0.5 on a tie.
    # Return total / number_of_pairs.
    ...`,
    checks: [
      { re: 'def\\s+confusion\\s*\\(', must: true, hint: 'Define confusion(y_true, y_pred) returning the four counts.', pass: 'confusion() defined' },
      { re: 'def\\s+auc\\s*\\(', must: true, hint: 'Define auc(y_true, y_score) with pair counting.', pass: 'auc() defined' },
      { re: '0\\.5', must: true, hint: 'Ties in auc() should contribute 0.5, not 0 or 1.', pass: 'Tie handling present' },
      { re: 'import\\s+sklearn', must: false, hint: 'No sklearn — the point is to build the metrics yourself.', pass: 'No sklearn used' }
    ],
    tests: `yt = [1,1,1,1,1, 0,0,0,0,0]
yp = [1,1,1,1,0, 1,1,0,0,0]
assert confusion(yt, yp) == (4, 2, 1, 3), f"confusion wrong: {confusion(yt, yp)}"
assert abs(precision(yt, yp) - 4/6) < 1e-9
assert abs(recall(yt, yp) - 4/5) < 1e-9
p, r = 4/6, 4/5
assert abs(f1(yt, yp) - 2*p*r/(p+r)) < 1e-9
# degenerate: model predicts nothing positive -> precision 0, no crash
assert precision([1,0], [0,0]) == 0.0
assert f1([1,0], [0,0]) == 0.0
# AUC: perfect ranking = 1.0, reversed = 0.0, one tie = 0.5 credit
assert auc([1,0], [0.9, 0.1]) == 1.0
assert auc([1,0], [0.1, 0.9]) == 0.0
assert auc([1,0], [0.5, 0.5]) == 0.5
assert abs(auc([1,1,0,0], [0.8, 0.4, 0.6, 0.2]) - 0.75) < 1e-9`,
    runnable: true,
    solution: `def confusion(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1: tp += 1
        elif t == 0 and p == 1: fp += 1
        elif t == 1 and p == 0: fn += 1
        else: tn += 1
    return (tp, fp, fn, tn)

def precision(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    return tp / (tp + fp) if (tp + fp) > 0 else 0.0

def recall(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    return tp / (tp + fn) if (tp + fn) > 0 else 0.0

def f1(y_true, y_pred):
    p, r = precision(y_true, y_pred), recall(y_true, y_pred)
    return 2 * p * r / (p + r) if (p + r) > 0 else 0.0

def auc(y_true, y_score):
    pos = [s for t, s in zip(y_true, y_score) if t == 1]
    neg = [s for t, s in zip(y_true, y_score) if t == 0]
    total = 0.0
    for ps in pos:
        for ns in neg:
            if ps > ns: total += 1.0
            elif ps == ns: total += 0.5
    return total / (len(pos) * len(neg))`,
    notes: [
      'The auc() you wrote IS the Mann–Whitney U statistic (normalized). sklearn computes the same value via the trapezoidal ROC area — the pair definition just makes the "probability a positive outranks a negative" meaning obvious.',
      'Notice f1 never touches tn — that is the feature, not a bug: with 10,000 innocent merchants, tn would drown every other signal.',
      'The O(P·N) pair loop is fine here; real implementations sort scores once and count in O(n log n).'
    ]
  },
  quiz: [
    {
      q: 'A disease affects 1 in 100 people. A test predicts "healthy" for everyone. Its accuracy and recall (for the disease class) are:',
      options: ['99% accuracy, 0% recall', '99% accuracy, 99% recall', '50% accuracy, 0% recall', '0% accuracy, 0% recall'],
      correct: 0,
      explain: 'It is right on the 99 healthy people (accuracy 99%) but catches 0 of the 1 sick person (recall 0%). This is the accuracy paradox — Nezumi\'s checkpoint. Accuracy alone can crown a completely useless model.'
    },
    {
      q: 'You are building a filter where a false positive (real email marked spam) is far worse than a false negative (spam reaching the inbox). You should tune for high:',
      options: ['Precision on the spam class', 'Recall on the spam class', 'Accuracy', 'ROC-AUC'],
      correct: 0,
      explain: 'Precision = of everything flagged spam, how much really was. High precision = few innocent emails flagged. Recall would be the priority when a miss is the expensive error (e.g. cancer screening).'
    },
    {
      q: 'AUC = 0.5 means the model:',
      options: ['Ranks a random positive above a random negative only half the time — no better than chance', 'Is correct on 50% of examples', 'Has precision = recall', 'Needs a threshold of 0.5'],
      correct: 0,
      explain: 'AUC is P(score of random positive > score of random negative). At 0.5 the ranking carries zero information. It says nothing directly about accuracy, thresholds, or precision/recall at any operating point.'
    },
    {
      q: 'With a 0.1% fraud rate, a model produces thousands of false positives yet its ROC curve looks excellent. The likely explanation:',
      options: ['FPR divides by the huge negative count, so many FPs barely move it — check the precision-recall curve instead', 'The model is genuinely excellent', 'ROC curves cannot be computed for imbalanced data', 'The threshold was set incorrectly'],
      correct: 0,
      explain: 'FPR = FP/(FP+TN). With millions of negatives, even 10,000 false positives give a tiny FPR, flattering the ROC. Precision feels every false positive, so PR-AUC is the honest metric for rare-positive problems.'
    },
    {
      q: 'You standardize the whole dataset with StandardScaler, then run 5-fold CV, and get a great score. What is wrong?',
      options: ['Data leakage: the scaler saw the test folds\' statistics; it must be fit inside each fold (use a Pipeline)', 'Nothing — scaling is deterministic so order does not matter', 'You should have used 10 folds', 'StandardScaler cannot be used with cross-validation'],
      correct: 0,
      explain: 'The mean/std were computed using rows that later act as test data — information leaked into preprocessing. Pipeline + cross_val_score re-fits the scaler on training folds only, mirroring what deployment actually looks like.'
    }
  ],
  testFlow: {
    title: 'Test yourself: evaluation metrics',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'A disease affects 1 in 100 people. A test predicts "healthy" for everyone. Its accuracy and recall (for the disease class) are:', choices: [
        { text: '99% accuracy, 0% recall', to: 'q1_right' },
        { text: '99% accuracy, 99% recall', to: 'q1_wrong_bothhigh' },
        { text: '50% accuracy, 0% recall', to: 'q1_wrong_50' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — correct on all 99 healthy people (99% accuracy) but catches 0 of the 1 sick person (0% recall). The accuracy paradox: a completely useless model can score deceptively high accuracy.', next: 'q2' },
      q1_wrong_bothhigh: { end: true, correct: false, text: 'The model predicts "healthy" for EVERYONE, including the actually-sick person — so it catches zero real positive cases. Recall on the disease class must be 0%, not 99%.', retry: 'q1' },
      q1_wrong_50: { end: true, correct: false, text: 'Accuracy counts ALL correct predictions, not just positive ones — 99 of 100 people are correctly called healthy, giving 99% accuracy, not 50%.', retry: 'q1' },
      q2: { qid: 'q2', q: 'AUC = 0.5 means the model...', choices: [
        { text: 'Ranks a random positive above a random negative only half the time — no better than chance', to: 'q2_right' },
        { text: 'Is correct on exactly 50% of examples', to: 'q2_wrong_correct' },
        { text: 'Has precision exactly equal to recall', to: 'q2_wrong_pr' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — AUC = P(score of random positive > score of random negative). At 0.5, the model\'s ranking carries zero information beyond a coin flip.', next: 'q3' },
      q2_wrong_correct: { end: true, correct: false, text: 'AUC doesn\'t measure raw accuracy at all — it\'s a pure ranking metric (probability a random positive outranks a random negative), completely independent of any particular accuracy figure.', retry: 'q2' },
      q2_wrong_pr: { end: true, correct: false, text: 'AUC says nothing directly about precision or recall at any specific threshold — it summarizes ranking quality across ALL thresholds at once, not any one operating point\'s precision/recall balance.', retry: 'q2' },
      q3: { qid: 'q3', q: 'You standardize the WHOLE dataset with StandardScaler, then run 5-fold CV, and get a suspiciously great score. What\'s wrong?', choices: [
        { text: 'Data leakage — the scaler saw the test folds\' statistics; it must be fit inside each fold', to: 'q3_right' },
        { text: 'Nothing — scaling is deterministic, so the order of operations doesn\'t matter', to: 'q3_wrong_nothing' },
        { text: 'You should have used 10 folds instead of 5', to: 'q3_wrong_folds' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — the mean/std used for scaling were computed using rows that later serve as test data in each fold, leaking test information into training. A Pipeline re-fits the scaler on training folds only, avoiding this.', },
      q3_wrong_nothing: { end: true, correct: false, text: 'Order matters a great deal here — fitting the scaler on the FULL dataset means its statistics were computed partly from data that later acts as held-out test data within each CV fold, which is leakage regardless of scaling being deterministic.', retry: 'q3' },
      q3_wrong_folds: { end: true, correct: false, text: 'The number of folds isn\'t the problem — the issue is WHEN the scaler was fit (on the whole dataset, before splitting), which leaks test-fold information into training regardless of how many folds you use.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Reporting accuracy on imbalanced data. First question in any evaluation: what is the class balance? If it is not near 50/50, reach for precision/recall/F1 or PR-AUC.',
    'Tuning hyperparameters against the test set. Every peek makes it a validation set; the final number becomes optimistically biased. Lock the test set away until the very end — one evaluation, ever.',
    'Fitting preprocessing (scalers, TF-IDF, encoders) before splitting. Leakage inflates CV scores and you find out in production. Pipeline inside CV is the fix.',
    'Shuffling time-series data in CV. Training on Friday to predict Tuesday is fortune-telling with the answer key. Use TimeSeriesSplit: always train on past, test on future.',
    'Passing hard predict() labels to roc_auc_score. AUC needs the continuous scores from predict_proba; labels collapse the curve to almost nothing, and sklearn won\'t always warn you.',
    'Comparing models with CV but forgetting the variance. F1 0.81 ± 0.06 vs 0.79 ± 0.06 is a coin flip, not a win. Report mean ± std across folds.'
  ],
  interview: [
    {
      q: 'Explain precision vs recall, and give a scenario for prioritizing each.',
      a: 'Both count true positives but divide by different things. Precision = TP/(TP+FP): of what the model flagged positive, how much really was — it penalizes false alarms. Recall = TP/(TP+FN): of what really was positive, how much the model caught — it penalizes misses. Prioritize recall when a miss is catastrophic and a false alarm is cheap: cancer screening, fraud detection, airport security — a follow-up check costs little, a miss costs enormously. Prioritize precision when a false alarm is the expensive error: spam filtering (losing a real email), auto-banning users, recommending content — wrong positives directly hurt users. The two trade off via the decision threshold, so the real answer is always "which error costs more in this application?"'
    },
    {
      q: 'What is AUC-ROC and when would you prefer the precision-recall curve?',
      a: 'The ROC curve plots true-positive rate against false-positive rate as the decision threshold sweeps from 1 to 0; AUC is the area under it, and it equals the probability that a randomly chosen positive example receives a higher score than a randomly chosen negative — a pure ranking metric, threshold-free and invariant to monotonic score transforms. Random = 0.5, perfect = 1.0. Prefer the PR curve under heavy class imbalance with focus on the positive class: FPR divides by the total negative count, so with millions of negatives even huge numbers of false positives barely move FPR and ROC looks flattering. Precision divides by predicted positives, so it feels every false alarm. For fraud at 0.1% prevalence, a model can show ROC-AUC 0.95 while precision at any useful recall is under 10% — PR-AUC exposes that, ROC hides it.'
    },
    {
      q: 'Walk me through k-fold cross-validation. Why use it over a single train/test split, and what are its limitations?',
      a: 'Split the data into k folds; for i = 1..k, train on the other k−1 folds and evaluate on fold i; report the mean and standard deviation of the k scores. Versus a single split: every example is tested exactly once so you use data efficiently, and the std tells you how much the score depends on the split — a single split gives one sample with no error bar. Limitations: k× training cost, so it gets expensive for large models (deep learning usually uses one validation set instead); folds must respect data structure — stratify for class balance, group by patient/user so the same entity never spans train and test, and use forward-chaining splits for time series; and CV evaluates the training procedure, not one final model — after CV you re-fit on all data, and you still need a separately held-out test set if you used CV for hyperparameter tuning, otherwise the CV score is optimistically biased.'
    },
    {
      q: 'Your model has 95% accuracy but the business says it is useless. Diagnose.',
      a: 'First hypothesis: class imbalance — if 95% of examples are the majority class, the model may be predicting only that class; check the confusion matrix, and per-class precision/recall will show near-zero performance on the minority class the business actually cares about. Second: metric mismatch — accuracy weights both error types equally, but the business almost never does; identify the costly error and switch to precision, recall, or a cost-weighted metric. Third: leakage or drift — 95% measured offline may involve a leaked feature or a test set that no longer resembles production traffic. Fixes for the imbalance case: choose the right metric first, then class_weight="balanced" or resampling, then threshold tuning on a validation set using the precision-recall curve to pick the operating point that matches the business cost ratio.'
    }
  ]
};
