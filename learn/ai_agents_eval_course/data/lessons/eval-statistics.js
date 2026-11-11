window.LESSONS = window.LESSONS || {};
window.LESSONS['eval-statistics'] = {
  id: 'eval-statistics',
  title: 'Statistics for Evals: Confidence Intervals, Bootstrap, Paired Tests & Flakiness',
  category: 'Part 2 — Evaluation Fundamentals',
  timeMin: 50,
  summary: `An eval score is an estimate from a sample of items and a sample of model outputs, so it has an error bar whether you report one or not. This lesson gives you the working toolkit: standard errors and the Wilson interval, the bootstrap, paired comparisons (paired bootstrap, sign-flip permutation, McNemar), clustered standard errors when items are correlated, how many items you need, and how run-to-run nondeterminism turns eval items into flaky tests. Every function here was run and checked against scipy, statsmodels or scikit-learn.`,
  goals: [
    `Compute and explain the standard error of an accuracy, and use the Wilson interval when n is small or p is near 0 or 1`,
    `Bootstrap a confidence interval for any metric, resampling the correct unit`,
    `Compare two systems on the same items with a paired bootstrap, a paired permutation test, or McNemar's test, and explain why pairing matters`,
    `Use clustered standard errors when items share a source, and estimate the number of items needed to detect a given improvement`,
    `Measure run-to-run variance with repeated runs and analyze flaky eval items with the same lens as flaky tests`
  ],
  concept: [
    {
      h: `Your score is a sample mean: standard error and the Wilson interval`,
      p: [
        `With n items scored 0/1 and observed accuracy p&#770;, the standard error is SE = &radic;(p&#770;(1-p&#770;)/n), and the familiar 95% interval is p&#770; &plusmn; 1.96&middot;SE. At p near 0.5 the half-width is roughly 1/&radic;n: about &plusmn;10 points with 100 items, &plusmn;4.4 with 500, &plusmn;3 with about 1,070. That single fact settles many arguments: a 2-point gain on a 200-item eval is not evidence of anything by itself.`,
        `The normal ("Wald") interval misbehaves for small n or p near 0 or 1: at 0 out of 20 it gives [0, 0], claiming certainty. The <b>Wilson score interval</b> inverts the score test instead, and stays sensible: 0/20 gives [0, 0.161], 17/20 gives [0.640, 0.948]. For a general metric (F1, a mean judge score, mean pass@k over problems) use SE = sample standard deviation / &radic;n over items, or the bootstrap.`
      ],
      code: `import math

def wilson_interval(successes, n, z=1.959964):
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return centre - half, centre + half

print(wilson_interval(17, 20))   # (0.6396, 0.9476) - matches statsmodels method="wilson"
print(wilson_interval(0, 20))    # (0.0, 0.1611)`
    },
    {
      h: `The bootstrap: an interval for any statistic`,
      p: [
        `The nonparametric bootstrap treats your n items as a stand-in for the population: draw n items <b>with replacement</b>, recompute the statistic, repeat B times (1,000 to 10,000), and take the 2.5th and 97.5th percentiles of the replicates as a 95% interval. It works for statistics without a convenient formula: macro-F1, median latency, a win rate with ties, the mean of per-problem pass@k.`,
        `The key decision is the <b>resampling unit</b>, which must be the independent unit. Resample items, not individual runs; if items come in clusters (questions from the same document, tasks from the same repository), resample clusters. Resampling at too fine a level makes intervals too narrow. The bootstrap is weak for very small n (under 20 or so) and for statistics driven by a few extreme values; there, prefer exact methods like Wilson or report the raw counts.`
      ]
    },
    {
      h: `Paired comparisons: the single biggest variance reduction`,
      p: [
        `When two systems run on the <b>same items</b>, analyze the per-item difference. Var(mean(a) - mean(b)) = [Var(a) + Var(b) - 2Cov(a, b)]/n, and item difficulty makes a and b strongly positively correlated (hard items are hard for both), so the paired variance is much smaller than treating the samples as independent. Throwing the pairing away with an unpaired two-proportion test is the most common way to call a real improvement "not significant".`,
        `Three paired tools. <b>Paired bootstrap</b>: resample item indices and recompute the mean difference, which gives a CI on the improvement itself. <b>Paired permutation (sign-flip) test</b>: under the null hypothesis that the systems are exchangeable, each item's difference is equally likely to have either sign, so flip signs at random many times and see how often the absolute summed difference is at least as large as observed. <b>McNemar's test</b> for binary outcomes: only <b>discordant</b> items carry information. With n<sub>10</sub> items only A solves and n<sub>01</sub> only B solves, under the null each discordant item is a fair coin, so the exact test is a two-sided binomial test of n<sub>10</sub> out of n<sub>10</sub> + n<sub>01</sub>. With 28 vs 9 discordant items, p = 0.0026.`,
        `Report the effect size with its interval ("B is +6.5 points, 95% CI +3.4 to +9.7"), not just a p-value. When you compare many variants against a baseline, correct for multiple comparisons (Holm or Bonferroni), or hold out a final confirmation set: try twenty prompts and one will look significant at 0.05 by chance.`
      ],
      code: `def mcnemar_exact(a, b):
    n10 = sum(1 for x, y in zip(a, b) if x == 1 and y == 0)   # only A right
    n01 = sum(1 for x, y in zip(a, b) if x == 0 and y == 1)   # only B right
    n, k = n10 + n01, min(n10, n01)
    if n == 0:
        return 1.0
    return min(1.0, 2 * sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n)`
    },
    {
      h: `Clustered standard errors and how many items you need`,
      p: [
        `The SE formulas assume independent items. Many evals violate that: reading-comprehension sets ask several questions per passage, SWE-bench draws many tasks from a few repositories, and repeated runs of the same item are obviously correlated. Treating correlated items as independent understates the SE. The <b>cluster-robust SE</b> of a mean sums residuals within each cluster first: Var = G/(G-1) &middot; &sum;<sub>g</sub>(&sum;<sub>i&isin;g</sub>(x<sub>i</sub> - x&#772;))&sup2; / n&sup2; for G clusters. Evan Miller's "Adding Error Bars to Evals" (2024) makes this the default recommendation for LLM evals, together with paired differences and power analysis. In the worked example, pooling 5 runs of 300 items as 1,500 independent observations gives SE 0.0126; clustering by item gives 0.0185.`,
        `<b>Sample size.</b> For a &plusmn;m margin on one accuracy near p: n = z&sup2;p(1-p)/m&sup2;, so 1,068 items for &plusmn;3 points at p = 0.5. For a paired comparison, what matters is how often the systems disagree: with disagreement rate p<sub>d</sub> and target difference &delta;, n &asymp; (z<sub>&alpha;/2</sub>&radic;p<sub>d</sub> + z<sub>&beta;</sub>&radic;(p<sub>d</sub> - &delta;&sup2;))&sup2;/&delta;&sup2;. To detect +5 points with 80% power when the systems disagree on 20% of items you need about 626 items; a simulation with the exact McNemar test gives power of about 0.77 at that n, so round up. Do this arithmetic before building the eval, not after.`
      ]
    },
    {
      h: `Nondeterminism, seeds and flaky evals`,
      p: [
        `Run the same eval twice and the score moves. Sources: sampling in the model; server-side nondeterminism even at temperature 0 (batching and floating-point non-associativity on accelerators mean bit-identical outputs are not guaranteed by most APIs); tools and environments (web pages, clocks, network); LLM-judge variance; and the harness itself (shared state between cases, order effects, timeouts under load). You cannot always pin this away: current Claude models no longer accept <code>temperature</code>, <code>top_p</code> or <code>top_k</code> at all. So measure it: run each item R times and treat the per-item mean as the observation.`,
        `This is exactly the flaky-test problem. An eval item whose outcome changes across identical runs is a <b>flaky item</b>, and the tools carry over from flaky-test research. Rerun-based detection (as in iDFlakies) classifies items as always-pass, always-fail or flaky. Order-dependent flakiness has an eval analog: state leaking between cases through a shared sandbox, cache or conversation. Infrastructure flakiness (timeouts under load, rate limits) is the analog of environment-dependent tests. One difference matters: in test suites you quarantine flaky tests, but in evals a flaky item is information. An item the model solves 3 times in 5 has p &asymp; 0.6, and deleting flaky items biases the score toward the extremes. Keep them and add repetitions.`,
        `Be explicit about retry policy. "Re-run failed cases and keep the pass" turns pass@1 into something closer to pass@2; the strict default is that passing only on retry is a fail, and every attempt is logged. Distinguish infrastructure retries (a 429, which should be retried transparently and recorded) from model retries (a wrong answer, which should not).`
      ]
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: `The variance decomposition behind "more runs or more items?", the permutation test's logic, and the ways statistical practice in evals goes wrong.`,
    sections: [
      {
        h: `More items or more repetitions? The variance decomposition`,
        p: [
          `Let item i have true success probability p<sub>i</sub>, and run each of n items R times. The variance of the overall mean is approximately &sigma;<sub>b</sub>&sup2;/n + &sigma;<sub>w</sub>&sup2;/(nR), where &sigma;<sub>b</sub>&sup2; is the between-item variance of p<sub>i</sub> (some items are hard, some easy) and &sigma;<sub>w</sub>&sup2; = mean of p<sub>i</sub>(1-p<sub>i</sub>) is the within-item sampling variance. Repetitions shrink only the second term. If items vary a lot in difficulty, more items help more than more runs; if the model is very stochastic on each item, repetitions help. For <b>paired</b> comparisons the between-item term largely cancels, which is why repetitions shrink the paired interval so effectively: in the example, going from 1 to 5 runs narrowed the B-A interval from (+0.007, +0.133) to (+0.034, +0.097).`
        ]
      },
      {
        h: `Why the sign-flip permutation test is valid`,
        p: [
          `Under the null hypothesis that A and B have the same distribution on each item, the labels "A" and "B" are exchangeable within an item, so each per-item difference d<sub>i</sub> is as likely to be +d<sub>i</sub> as -d<sub>i</sub>. Enumerating or sampling all 2<sup>n</sup> sign patterns gives the null distribution of the summed difference without any normality assumption. The p-value is the fraction of sign patterns at least as extreme as observed; adding one to numerator and denominator keeps it from being exactly 0 with a finite number of samples. For binary outcomes, items with d<sub>i</sub> = 0 contribute nothing, and the test reduces to essentially McNemar's.`
        ]
      },
      {
        h: `How eval statistics go wrong in practice`,
        p: [
          `<ul><li><b>Forking paths</b>: trying many prompts, seeds, subsets or metrics and reporting the best. Pre-register the comparison or confirm on a fresh held-out set.</li><li><b>Selecting on the outcome</b>: choosing the "hard subset" as the items the baseline failed, then celebrating improvement, which is regression to the mean.</li><li><b>Wrong unit</b>: bootstrapping runs instead of items, or items instead of clusters.</li><li><b>Unpaired tests on paired data</b>, which waste most of the power.</li><li><b>Ignoring the judge's own variance</b>: if an LLM judge gives different grades to the same output, that variance adds to everything; measure it by re-judging.</li><li><b>Reporting a p-value without an effect size and interval</b>, or calling p = 0.06 "no difference".</li></ul>`
        ]
      },
      {
        h: `The full verified library`,
        p: [
          `The worked example's module contains: unbiased pass@k, mean and SE, Wilson interval, percentile bootstrap, paired bootstrap, sign-flip permutation test, McNemar (exact and continuity-corrected chi-square), Cohen's kappa, Fleiss' kappa, Krippendorff's alpha (nominal), cluster-robust SE, and two sample-size helpers. Each was checked numerically: Wilson against <code>statsmodels.stats.proportion.proportion_confint</code>, McNemar against <code>statsmodels.stats.contingency_tables.mcnemar</code>, kappa against <code>sklearn.metrics.cohen_kappa_score</code> and statsmodels' <code>fleiss_kappa</code>, alpha against the <code>krippendorff</code> package, the permutation test against <code>scipy.stats.permutation_test</code>, and the clustered SE against a statsmodels OLS fit with <code>cov_type="cluster"</code> (identical after the G/(G-1) factor).`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Usopp's Sharpshooting Record`,
      text: [
        `Usopp claims his new slingshot is better than his old one. He fires the new one ten times at the target, hits eight, and declares victory over the old one's seven out of ten the day before. Nami is unimpressed: with ten shots, eight and seven are the same number with different luck.`,
        `So they run it properly. Robin sets up a hundred targets at different distances and in different winds, and Usopp shoots each target with both slingshots. Now the comparison is per target. Most targets are hit by both or missed by both, and those tell nothing about which slingshot is better. Only the targets where one slingshot hits and the other misses count, and Nami tallies those: the new slingshot wins 28 of them, the old one 9. That split would be very unlikely if the two were equally good.`,
        `Then Chopper notices that some targets are hit on one try and missed on the next, with the same slingshot and the same wind. Usopp wants to remove those "unfair" targets. Robin refuses: a target hit three times out of five is telling them the true hit rate is about sixty percent. Removing it would make Usopp look either perfect or hopeless. They shoot every target five times instead.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: `Howard's Robot Arm Is "Significantly" Better`,
      text: [
        `Howard announces his new robotic arm firmware picks up objects 4% more often. Sheldon asks how many trials. Fifty. Sheldon calculates the interval on a whiteboard, which spans about twenty-five points, and declares Howard's result "statistically indistinguishable from wishful thinking".`,
        `Leonard suggests running both firmware versions on the same objects, so the comparison is about the arm, not about which objects happened to be on the table. Raj points out that some objects are picked up only some of the time and wants them excluded. Sheldon, uncharacteristically agreeing with Robin's logic, says the flaky objects are the data.`
      ]
    },
    why: `Ten shots each is an eval with a huge standard error. Shooting the same hundred targets with both slingshots is a paired design, and counting only the targets where they disagree is McNemar's test (28 vs 9, p of about 0.003). Targets hit only some of the time are flaky eval items: the right response is more repetitions, not deletion, because deleting them biases the score.`
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'targets', emoji: '🎯', label: '100 targets', x: 50, y: 18 },
      { id: 'tally', emoji: '📝', label: 'tally', x: 82, y: 70 },
      { id: 'old', emoji: '🪃', label: 'old slingshot', x: 15, y: 75 },
      { id: 'flaky', emoji: '🌬️', label: 'sometimes-hit targets', x: 50, y: 82 }
    ],
    actors: [
      { id: 'usopp', emoji: '🏹', label: 'Usopp', x: 30, y: 50 },
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 70, y: 50 },
      { id: 'robin', emoji: '📚', label: 'Robin', x: 88, y: 35 }
    ],
    steps: [
      { c: `Usopp: new slingshot 8/10, old one 7/10 yesterday. Nami: with ten shots, the interval is about thirty points wide.`, l: { tally: '8/10 vs 7/10: noise' } },
      { c: `Robin sets a hundred varied targets. Both slingshots shoot every target: a paired design.`, a: { robin: [60, 30] }, p: { targets: 'lit', old: 'lit' } },
      { c: `Most targets are hit by both or missed by both. Those cancel out and say nothing about which is better.`, a: { usopp: [40, 40] }, p: { targets: 'dim' } },
      { c: `Only disagreements count: new wins 28, old wins 9. Under "equally good" that split has p about 0.003. That is McNemar's test.`, a: { nami: [76, 60] }, p: { tally: 'good' }, l: { tally: 'discordant 28 vs 9, p=0.003' } },
      { c: `Some targets are hit on one try and missed on the next, same slingshot. Usopp wants them removed.`, a: { usopp: [45, 70] }, p: { flaky: 'bad' } },
      { c: `Robin refuses: hit 3 of 5 means p of about 0.6. Deleting flaky targets would bias the score. Shoot every target five times instead.`, a: { robin: [62, 70] }, p: { flaky: 'good' } },
      { c: `With five shots per target, averaged per target first, the interval on the improvement narrows. The claim now holds up.`, p: { tally: 'good', targets: 'lit' }, l: { tally: '+6.5 pts, CI +3.4 to +9.7' } }
    ]
  },
  conceptFlow: {
    title: `From raw rows to a defensible "B beats A"`,
    intro: `The analysis order that avoids every common mistake.`,
    stages: [
      { label: 'Rows', nodes: [
        { id: 'rows', text: '(item, system, rep)\n-> score' } ] },
      { label: 'Collapse', nodes: [
        { id: 'peritem', text: 'mean over reps\nper item' },
        { id: 'flaky', text: 'flag flaky items\n(keep them)' } ] },
      { label: 'Pair', nodes: [
        { id: 'diff', text: 'd_i = B_i - A_i\nsame items' } ] },
      { label: 'Uncertainty', nodes: [
        { id: 'boot', text: 'paired bootstrap\nCI on mean d' },
        { id: 'test', text: 'permutation or\nMcNemar p' },
        { id: 'cluster', text: 'cluster by repo /\ndocument if needed' } ] },
      { label: 'Report', nodes: [
        { id: 'report', text: 'effect + CI + n x R\n+ flaky rate' } ] }
    ],
    steps: [
      { active: ['rows'], note: 'Start from raw per-attempt rows. Recompute everything from them; never trust a precomputed aggregate.' },
      { active: ['peritem'], note: 'Average the R repetitions within each item. The item, not the run, is the unit of independence.' },
      { active: ['flaky'], note: 'Items with mixed outcomes across reps are flaky. Report their share, check for harness causes (shared state, timeouts), and keep them in the score.' },
      { active: ['diff'], note: 'Pair the systems on the same items. Item difficulty cancels in the difference, which is where most of the variance lives.' },
      { active: ['boot'], note: 'Bootstrap item indices to get a CI on the mean difference: the effect size with its uncertainty.' },
      { active: ['test'], note: 'If you need a p-value, use a sign-flip permutation test, or McNemar on discordant items for binary outcomes.' },
      { active: ['cluster'], note: 'If items share a source, resample or compute SEs by cluster, otherwise intervals are too narrow.' },
      { active: ['report'], note: 'Report the difference with its CI, the design (n items x R reps), the flaky rate and the dataset version. Correct for multiple comparisons if you tried many variants.' }
    ]
  },
  tech: [
    {
      q: `Why does pairing shrink the variance so much on LLM evals specifically?`,
      a: [`Because item difficulty dominates. On a typical benchmark some items are solved by nearly every system and some by almost none, so per-item outcomes of two systems are strongly correlated. The variance of the difference subtracts 2Cov(a, b), and that covariance is large. In McNemar terms: most items are concordant and contribute nothing, and the comparison is decided by the discordant minority, whose count is far smaller than n.`]
    },
    {
      q: `What does the G/(G-1) factor in the clustered SE do?`,
      a: [`It is a small-sample correction. The cluster-robust variance estimator uses cluster-level residual sums, which behave like G observations rather than n; with few clusters it underestimates variance, and multiplying by G/(G-1) is the standard first-order fix (the same idea as dividing by n-1 instead of n). statsmodels applies it by default with <code>cov_type="cluster"</code>; with <code>use_correction=False</code> its SE matches the uncorrected formula exactly, which is how the course implementation was checked. With few clusters (under about 30), intervals are still too narrow, and a cluster bootstrap or t-distribution with G-1 degrees of freedom is safer.`]
    },
    {
      q: `If I cannot set temperature to 0, can I still make an eval reproducible?`,
      a: [`You can make the <i>analysis</i> reproducible and the <i>estimate</i> stable, not the individual outputs. Pin everything you control: model id, prompt and tool versions, dataset hash, harness version, judge model and rubric, seeds for any sampling you do (shuffles, bootstrap). Cache raw outputs so re-analysis does not re-query the model. Then report variance across R repetitions. Two runs of a well-designed eval should agree within their intervals; if they do not, look for harness flakiness before blaming the model.`]
    },
    {
      q: `Is the McNemar chi-square version ever preferable to the exact test?`,
      a: [`The continuity-corrected chi-square, (|n<sub>10</sub> - n<sub>01</sub>| - 1)&sup2;/(n<sub>10</sub> + n<sub>01</sub>) with one degree of freedom, approximates the exact binomial test well when there are many discordant pairs (a common rule is 25 or more). The exact test is always valid and cheap to compute with <code>math.comb</code>, so there is little reason not to use it. For the 28-vs-9 example the exact p is 0.0026 and the corrected chi-square p is 0.0031.`]
    }
  ],
  code: {
    title: `A verified stats library for evals, with a two-system comparison`,
    intro: `Stdlib only. The module implements every statistic in this lesson (and the agreement statistics from the judge lesson). The demo simulates 300 items of varying difficulty, a system B about 5 points better than A, and 5 runs per item, then walks the analysis: intervals for one system, paired comparisons, the effect of repetitions, clustered vs naive SEs, flaky items, and sample sizes.`,
    code: `"""evalstats.py - stdlib-only statistics for LLM evals (Python 3.10+)."""
import math
import random
from collections import Counter


def pass_at_k(n: int, c: int, k: int) -> float:
    """Unbiased pass@k (Chen et al. 2021): 1 - C(n-c, k) / C(n, k).
    n samples drawn, c of them correct, k <= n."""
    if k > n:
        raise ValueError("need k <= n")
    if n - c < k:
        return 1.0
    # numerically stable product form: prod_{i=n-c+1}^{n} (1 - k/i)
    prod = 1.0
    for i in range(n - c + 1, n + 1):
        prod *= 1.0 - k / i
    return 1.0 - prod


def mean_se(xs):
    n = len(xs)
    m = sum(xs) / n
    var = sum((x - m) ** 2 for x in xs) / (n - 1)
    return m, math.sqrt(var / n)


def wilson_interval(successes: int, n: int, z: float = 1.959964):
    """Wilson score interval for a binomial proportion."""
    if n == 0:
        return (0.0, 1.0)
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (centre - half, centre + half)


def bootstrap_ci(xs, stat=lambda v: sum(v) / len(v), B=10_000, alpha=0.05, seed=0):
    """Percentile bootstrap CI for stat(xs)."""
    rng = random.Random(seed)
    n = len(xs)
    reps = sorted(stat([xs[rng.randrange(n)] for _ in range(n)]) for _ in range(B))
    lo = reps[int((alpha / 2) * B)]
    hi = reps[int((1 - alpha / 2) * B) - 1]
    return stat(xs), (lo, hi)


def paired_bootstrap_diff(a, b, B=10_000, alpha=0.05, seed=0):
    """CI on mean(a) - mean(b) resampling QUESTIONS (pairs stay together)."""
    assert len(a) == len(b)
    d = [x - y for x, y in zip(a, b)]
    return bootstrap_ci(d, B=B, alpha=alpha, seed=seed)


def paired_permutation_test(a, b, B=10_000, seed=0):
    """Two-sided sign-flip permutation test on paired per-item scores.
    Under H0 the label (A vs B) on each item is exchangeable, so each
    difference's sign is a fair coin flip."""
    rng = random.Random(seed)
    d = [x - y for x, y in zip(a, b)]
    obs = abs(sum(d))
    hits = 0
    for _ in range(B):
        s = sum(di if rng.random() < 0.5 else -di for di in d)
        if abs(s) >= obs - 1e-12:
            hits += 1
    return (hits + 1) / (B + 1)  # add-one so p is never exactly 0


def mcnemar(a, b, exact=True):
    """McNemar test on paired binary outcomes (1=correct).
    Only discordant pairs matter: n01 = A wrong & B right, n10 = A right & B wrong."""
    n10 = sum(1 for x, y in zip(a, b) if x == 1 and y == 0)
    n01 = sum(1 for x, y in zip(a, b) if x == 0 and y == 1)
    n = n10 + n01
    if n == 0:
        return n10, n01, 1.0
    if exact:
        k = min(n10, n01)
        tail = sum(math.comb(n, i) for i in range(0, k + 1)) / 2 ** n
        return n10, n01, min(1.0, 2 * tail)
    chi2 = (abs(n10 - n01) - 1) ** 2 / n  # continuity-corrected
    p = math.erfc(math.sqrt(chi2 / 2))  # survival fn of chi2 with 1 dof
    return n10, n01, p


def cohens_kappa(r1, r2):
    assert len(r1) == len(r2)
    n = len(r1)
    po = sum(1 for x, y in zip(r1, r2) if x == y) / n
    c1, c2 = Counter(r1), Counter(r2)
    pe = sum(c1[k] * c2[k] for k in set(c1) | set(c2)) / (n * n)
    return (po - pe) / (1 - pe)


def fleiss_kappa(table):
    """table[i][j] = number of raters who put item i in category j
    (every item rated by the same number of raters m)."""
    N = len(table)
    m = sum(table[0])
    p_j = [sum(row[j] for row in table) / (N * m) for j in range(len(table[0]))]
    P_i = [(sum(x * x for x in row) - m) / (m * (m - 1)) for row in table]
    P_bar = sum(P_i) / N
    P_e = sum(p * p for p in p_j)
    return (P_bar - P_e) / (1 - P_e)


def krippendorff_alpha_nominal(units):
    """units: list of lists, the labels each item received (missing ratings
    are simply absent). Nominal metric, coincidence-matrix formulation."""
    from itertools import permutations
    o = Counter()
    for vals in units:
        m = len(vals)
        if m < 2:
            continue
        for a, b in permutations(range(m), 2):
            o[(vals[a], vals[b])] += 1 / (m - 1)
    n_c = Counter()
    for (c, _k), v in o.items():
        n_c[c] += v
    n = sum(n_c.values())
    D_o = sum(v for (c, k), v in o.items() if c != k) / n
    D_e = sum(n_c[c] * n_c[k] for c in n_c for k in n_c if c != k) / (n * (n - 1))
    return 1 - D_o / D_e


def clustered_se(scores, clusters):
    """SE of the mean when items come in clusters (e.g. many questions from the
    same repo / passage). Cluster-robust (CR0-style) estimator of the mean."""
    n = len(scores)
    m = sum(scores) / n
    sums = Counter()
    for s, g in zip(scores, clusters):
        sums[g] += s - m
    G = len(sums)
    var = (G / (G - 1)) * sum(v * v for v in sums.values()) / (n * n)
    return m, math.sqrt(var)


def n_for_margin(p=0.5, margin=0.03, z=1.959964):
    """Items needed so a 95% CI on an accuracy near p has half-width <= margin."""
    return math.ceil(z * z * p * (1 - p) / margin ** 2)


def mcnemar_n_pairs(p_disc: float, delta: float, z_a: float = 1.959964, z_b: float = 0.841621):
    """Approx. items needed for a paired comparison (alpha=0.05 two-sided, power 0.8).
    p_disc = P(systems disagree on an item), delta = accuracy difference to detect."""
    return math.ceil((z_a * math.sqrt(p_disc) + z_b * math.sqrt(p_disc - delta ** 2)) ** 2 / delta ** 2)


def flaky_items(runs: dict):
    """runs[item_id] = list of 0/1 outcomes over R repeated runs.
    Returns (always_pass, always_fail, flaky) id lists - the flaky-test view of an eval."""
    ap = [i for i, r in runs.items() if all(r)]
    af = [i for i, r in runs.items() if not any(r)]
    fl = [i for i, r in runs.items() if any(r) and not all(r)]
    return ap, af, fl


if __name__ == "__main__":
    rng = random.Random(42)
    n_items, R = 300, 5
    # Each item has its own difficulty; system B is a little better than A.
    p_item = [rng.betavariate(2, 1.2) for _ in range(n_items)]
    A = [[int(rng.random() < p) for _ in range(R)] for p in p_item]
    B = [[int(rng.random() < min(1, p + 0.05)) for _ in range(R)] for p in p_item]
    a1 = [r[0] for r in A]   # single run per item
    b1 = [r[0] for r in B]

    m, se = mean_se(a1)
    print(f"A single run: acc={m:.3f}  normal 95% CI=({m - 1.96 * se:.3f}, {m + 1.96 * se:.3f})")
    print("A Wilson CI:", tuple(round(x, 3) for x in wilson_interval(sum(a1), n_items)))
    print("A bootstrap CI:", tuple(round(x, 3) for x in bootstrap_ci(a1)[1]))

    d, (lo, hi) = paired_bootstrap_diff(b1, a1)
    print(f"B - A = {d:+.3f}, paired bootstrap 95% CI ({lo:+.3f}, {hi:+.3f})")
    print(f"paired permutation p = {paired_permutation_test(b1, a1):.4f}")
    n10, n01, p = mcnemar(b1, a1)
    print(f"McNemar exact: B-only-right={n10}, A-only-right={n01}, p={p:.4f}")

    # Using all R runs: average per item first, then treat items as the unit.
    a_mean = [sum(r) / R for r in A]
    b_mean = [sum(r) / R for r in B]
    d5, (lo5, hi5) = paired_bootstrap_diff(b_mean, a_mean)
    print(f"with R={R} reps: B - A = {d5:+.3f}, CI ({lo5:+.3f}, {hi5:+.3f})  <- narrower")

    # Wrong way: pool all n*R runs as if independent (understates the SE).
    flat = [x for r in A for x in r]
    groups = [i for i in range(n_items) for _ in range(R)]
    print(f"SE pooled-as-iid={mean_se(flat)[1]:.4f}  clustered-by-item={clustered_se(flat, groups)[1]:.4f}")

    ap, af, fl = flaky_items({i: r for i, r in enumerate(A)})
    print(f"items: always-pass={len(ap)} always-fail={len(af)} flaky={len(fl)} "
          f"({len(fl) / n_items:.0%} of the eval flips between runs)")
    print("items for +/-3 points at p=0.5:", n_for_margin(0.5, 0.03))
    print("paired items to detect +5 points when systems disagree on 20%:", mcnemar_n_pairs(0.20, 0.05))`,
    notes: [
      `Output: A acc 0.607 with normal CI (0.551, 0.662), Wilson (0.55, 0.66), bootstrap (0.55, 0.66). B-A = +0.070, paired bootstrap CI (+0.007, +0.133), permutation p = 0.042, McNemar 59 vs 38, p = 0.042. With 5 reps: +0.065, CI (+0.034, +0.097). SE pooled as iid 0.0126 vs clustered 0.0185. 203 of 300 items (68%) are flaky. 1,068 items for &plusmn;3 points; 626 paired items for +5 at 20% disagreement.`,
      `The single-run comparison is barely significant; five repetitions turn it into a clear result. That is the cheapest lever when you cannot add items.`,
      `68% flaky is realistic for a stochastic system on items of middling difficulty. It is a property of the model's per-item success probabilities, not a harness bug, which you would confirm by checking that reference solutions are 100% stable through the grader.`,
      `Seeds make the demo reproducible. In a real eval the seeds you control are for shuffling and bootstrapping; the model's outputs are not seedable.`
    ]
  },
  lab: {
    title: `Wilson interval, exact McNemar and a paired bootstrap`,
    prompt: `Implement the three functions. <code>wilson_interval</code> uses the score-interval formula with z = 1.959964. <code>mcnemar_exact</code> counts discordant pairs and returns the two-sided exact binomial p-value (capped at 1.0; return 1.0 when there are no discordant pairs). <code>paired_bootstrap_diff</code> resamples <b>item indices</b> so pairs stay together and returns the 2.5th and 97.5th percentiles of mean(a) - mean(b). The expected values in the asserts were checked against statsmodels.`,
    starter: `# stats_lab.py
import math
import random


def wilson_interval(successes: int, n: int, z: float = 1.959964):
    raise NotImplementedError


def mcnemar_exact(a, b):
    """a, b: per-item 0/1 outcomes of two systems on the SAME items. Two-sided p-value."""
    raise NotImplementedError


def paired_bootstrap_diff(a, b, B=5000, seed=0):
    """95% percentile CI for mean(a) - mean(b); resample item indices, keep pairs together."""
    raise NotImplementedError


if __name__ == "__main__":
    lo, hi = wilson_interval(17, 20)
    assert abs(lo - 0.63958) < 1e-4 and abs(hi - 0.94763) < 1e-4, (lo, hi)
    lo0, hi0 = wilson_interval(0, 20)
    assert lo0 < 1e-12 and 0.16 < hi0 < 0.17          # sensible even at 0 successes
    a = [1] * 28 + [0] * 9 + [1] * 50 + [0] * 13      # 28 items only A solves, 9 only B
    b = [0] * 28 + [1] * 9 + [1] * 50 + [0] * 13
    assert abs(mcnemar_exact(a, b) - 0.0025632) < 1e-6, mcnemar_exact(a, b)
    lo_d, hi_d = paired_bootstrap_diff(a, b)
    assert lo_d > 0 and lo_d < 0.19 < hi_d            # observed diff is 0.19
    print("all checks passed")
`,
    checks: [
      { re: 'z\\s*\\*\\s*z\\s*/\\s*\\(\\s*2\\s*\\*\\s*n\\s*\\)', flags: '', must: true, hint: 'Wilson centre: (p + z*z/(2*n)) / (1 + z*z/n)', pass: 'Wilson centre term' },
      { re: 'z\\s*\\*\\s*z\\s*/\\s*\\(\\s*4\\s*\\*\\s*n\\s*\\*\\s*n\\s*\\)', flags: '', must: true, hint: 'Wilson half-width includes z*z/(4*n*n) under the square root', pass: 'Wilson half-width term' },
      { re: 'x\\s*==\\s*1\\s+and\\s+y\\s*==\\s*0', flags: '', must: true, hint: 'Count n10: items where a is right and b is wrong', pass: 'discordant n10 counted' },
      { re: 'math\\.comb\\(', flags: '', must: true, hint: 'Exact binomial tail with math.comb(n, i) / 2 ** n', pass: 'exact binomial tail' },
      { re: 'min\\(\\s*1\\.0\\s*,\\s*2\\s*\\*', flags: '', must: true, hint: 'Two-sided: min(1.0, 2 * tail)', pass: 'two-sided and capped' },
      { re: 'rng\\.randrange\\(\\s*n\\s*\\)', flags: '', must: true, hint: 'Resample indices with rng.randrange(n) so a[i] and b[i] stay paired', pass: 'resamples item indices' },
      { re: 'a\\[i\\]\\s*-\\s*b\\[i\\]', flags: '', must: true, hint: 'Average a[i] - b[i] over the resampled indices', pass: 'paired difference' },
      { re: 'raise NotImplementedError', flags: '', must: false, hint: 'Implement all three functions', pass: 'implemented' }
    ],
    run: `Save as <code>stats_lab.py</code> and run <code>python3 stats_lab.py</code>. To cross-check: <code>pip install statsmodels</code>, then <code>mcnemar([[50, 28], [9, 13]], exact=True).pvalue</code> from <code>statsmodels.stats.contingency_tables</code> returns 0.002563, and <code>proportion_confint(17, 20, method="wilson")</code> returns (0.6396, 0.9476).`,
    solution: `# stats_lab.py - Wilson interval, exact McNemar, paired bootstrap. Stdlib only.
import math
import random


def wilson_interval(successes: int, n: int, z: float = 1.959964):
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return centre - half, centre + half


def mcnemar_exact(a, b):
    """a, b: per-item 0/1 outcomes of two systems on the SAME items. Two-sided p-value."""
    n10 = sum(1 for x, y in zip(a, b) if x == 1 and y == 0)
    n01 = sum(1 for x, y in zip(a, b) if x == 0 and y == 1)
    n = n10 + n01
    if n == 0:
        return 1.0
    k = min(n10, n01)
    tail = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * tail)


def paired_bootstrap_diff(a, b, B=5000, seed=0):
    """95% percentile CI for mean(a) - mean(b); resample item indices, keep pairs together."""
    rng = random.Random(seed)
    n = len(a)
    diffs = []
    for _ in range(B):
        idx = [rng.randrange(n) for _ in range(n)]
        diffs.append(sum(a[i] - b[i] for i in idx) / n)
    diffs.sort()
    return diffs[int(0.025 * B)], diffs[int(0.975 * B) - 1]


if __name__ == "__main__":
    lo, hi = wilson_interval(17, 20)
    assert abs(lo - 0.63958) < 1e-4 and abs(hi - 0.94763) < 1e-4, (lo, hi)
    lo0, hi0 = wilson_interval(0, 20)
    assert lo0 < 1e-12 and 0.16 < hi0 < 0.17          # sensible even at 0 successes
    a = [1] * 28 + [0] * 9 + [1] * 50 + [0] * 13      # 28 items only A solves, 9 only B
    b = [0] * 28 + [1] * 9 + [1] * 50 + [0] * 13
    assert abs(mcnemar_exact(a, b) - 0.0025632) < 1e-6, mcnemar_exact(a, b)
    lo_d, hi_d = paired_bootstrap_diff(a, b)
    assert lo_d > 0 and lo_d < 0.19 < hi_d            # observed diff is 0.19
    print("all checks passed")`,
    notes: [
      `The 50 items both systems solve and the 13 neither solves do not change McNemar's p at all. Change them and re-run to convince yourself.`,
      `A percentile bootstrap with B = 5000 is plenty for a 95% interval; use more for 99% intervals or for p-values near your threshold.`
    ]
  },
  quiz: [
    {
      q: `A 200-item eval goes from 71% to 73% after a prompt change. Roughly how wide is a 95% interval on one of those accuracies?`,
      options: [`About +/-0.5 points`, `About +/-2 points`, `About +/-6 points`, `About +/-15 points`],
      correct: 2,
      explain: `SE = sqrt(0.72 * 0.28 / 200), about 0.032, so 1.96 * SE is about 6 points. A 2-point change is well inside the noise of an unpaired comparison.`
    },
    {
      q: `Two systems are evaluated on the same 500 items. Which analysis uses the design correctly?`,
      options: [`Two-proportion z-test on the two accuracies`, `Paired bootstrap on per-item differences, or McNemar on discordant items`, `Compare the two Wilson intervals for overlap`, `t-test on the two accuracies`],
      correct: 1,
      explain: `Same items means paired data. Unpaired tests and interval-overlap checks ignore the large positive correlation and lose most of the power.`
    },
    {
      q: `Your eval has 40 tasks from each of 12 repositories. What happens if you compute the SE as if all 480 tasks were independent?`,
      options: [`The SE is correct`, `The SE is too large`, `The SE is too small, because tasks within a repo are correlated`, `The mean is biased`],
      correct: 2,
      explain: `Correlated items carry less information than independent ones. Use cluster-robust SEs or a cluster bootstrap by repository.`
    },
    {
      q: `Across 5 repeated runs, 30% of items have mixed pass/fail outcomes. What should you do with those items?`,
      options: [`Delete them as flaky`, `Keep them, average over runs per item, and check the harness for causes like shared state or timeouts`, `Count them as passes`, `Count them as fails`],
      correct: 1,
      explain: `A flaky item's pass rate is real information about the model. Deleting it biases the score; the harness check rules out infrastructure flakiness.`
    },
    {
      q: `Systems A and B disagree on 20% of items. You want to detect a 5-point difference with 80% power at alpha 0.05. About how many paired items do you need?`,
      options: [`About 60`, `About 150`, `About 630`, `About 5,000`],
      correct: 2,
      explain: `With p_d = 0.20 and delta = 0.05 the McNemar power formula gives about 626 items. Simulation with the exact test shows power near 0.77 there, so round up.`
    }
  ],
  testFlow: {
    title: `Which test do I reach for?`,
    start: 'q1',
    nodes: {
      q1: { q: `You have one system's binary results on 25 items, 24 correct. You want a 95% interval.`, choices: [
        { text: `Wilson interval`, to: 'q1ok' },
        { text: `p +/- 1.96 * sqrt(p(1-p)/n)`, to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: `Right. Near p = 1 with small n, Wilson stays inside [0, 1] and has better coverage.`, next: 'q2' },
      q1bad: { end: true, correct: false, text: `The Wald interval exceeds 1 here and undercovers near the boundary. Use Wilson.`, retry: 'q1' },
      q2: { q: `Two prompts, same 400 items, binary outcomes. You need a p-value for "B differs from A".`, choices: [
        { text: `McNemar's test on the discordant items`, to: 'q2ok' },
        { text: `Chi-square test on the 2x2 table of system x correct`, to: 'q2bad' } ] },
      q2ok: { end: true, correct: true, text: `Correct. Only items where the systems disagree inform the comparison.`, next: 'q3' },
      q2bad: { end: true, correct: false, text: `That table treats the 800 outcomes as independent samples and ignores the pairing. Use McNemar.`, retry: 'q2' },
      q3: { q: `Your metric is mean token F1 (continuous), two systems, same items. You want an interval on the improvement.`, choices: [
        { text: `Paired bootstrap of per-item F1 differences`, to: 'q3ok' },
        { text: `Bootstrap each system separately and subtract the intervals`, to: 'q3bad' } ] },
      q3ok: { end: true, correct: true, text: `Right. Resample item indices and recompute the mean difference each time.` },
      q3bad: { end: true, correct: false, text: `Separate bootstraps break the pairing and give a much wider, wrong interval. Resample items jointly.`, retry: 'q3' }
    }
  },
  pitfalls: [
    `Reporting a score without an interval, or claiming an improvement smaller than the interval half-width.`,
    `Using unpaired tests (or checking whether two intervals overlap) when both systems ran on the same items.`,
    `Bootstrapping or computing SEs over runs instead of items, or over items when they are clustered by source.`,
    `Deleting flaky items. That biases the estimate; average over repetitions instead, after ruling out harness causes.`,
    `Trying many variants and reporting the best one's p-value without a multiple-comparison correction or a fresh confirmation set.`
  ],
  interview: [
    {
      q: `Your colleague says the new agent is better: 64% vs 61% on a 300-task benchmark. How do you evaluate that claim?`,
      a: [`First ask whether both ran on the same tasks; if so, analyze it paired. Unpaired, each accuracy has a 95% half-width around 5.5 points, so a 3-point gap means little. Paired, I need the discordant counts: tasks only the new agent solves vs only the old. If it is, say, 40 vs 31, the exact McNemar p is about 0.34; if it is 30 vs 21, the same 3-point gap, p is about 0.26. Neither is evidence of improvement. I would also ask how many runs per task (one run of a stochastic agent is noisy), whether tasks cluster by repository (cluster the SE), and whether infrastructure failures were excluded consistently. Then recommend rerunning both with 3-5 repetitions per task and reporting the paired difference with a bootstrap CI.`]
    },
    {
      q: `Explain the bootstrap to a non-statistician, and say when it fails.`,
      a: [`We have one sample of items and want to know how much the score would move with a different sample. We simulate "different samples" by drawing items at random from our own set, with replacement, many times, recomputing the score each time; the spread of those scores approximates the sampling spread. The middle 95% is the interval. It fails or misleads when the sample is very small, when the statistic depends on rare extreme values (max, high quantiles), and when items are not independent and you resample at the wrong level, for example individual runs instead of items or items instead of repositories.`]
    },
    {
      q: `Design: you have budget for 3,000 model calls to compare two prompts. How do you spend it?`,
      a: [`A paired design: both prompts on the same items. Then choose items vs repetitions with the variance decomposition. If I have a pilot run, I estimate between-item and within-item variance; for paired comparisons the between-item part largely cancels, so repetitions are valuable, but I still need enough items to cover the input distribution. A reasonable default: 500 items x 3 repetitions per prompt = 3,000 calls, randomized order, same harness. Analyze per-item means, paired bootstrap CI on the difference, McNemar or permutation p as a secondary. Before spending anything, use the pilot disagreement rate to check that 500 paired items can detect the smallest improvement worth shipping.`]
    },
    {
      q: `How does flaky-test research inform how you run LLM evals?`,
      a: [`The taxonomy transfers. Nondeterminism in the system under test (model sampling) corresponds to flaky tests due to randomness or concurrency; order-dependent flakiness corresponds to state leaking between eval cases through a shared sandbox, cache, or conversation; environment flakiness corresponds to rate limits, timeouts under load, and changing web content. Rerun-based detection carries over directly: run each item R times and classify always-pass, always-fail, flaky. Root-causing carries over too: rerun flaky items in isolation and in a fresh environment to separate harness flakiness from model stochasticity. The difference is the remedy: tests get fixed or quarantined, but a model-flaky eval item is a genuine measurement of a probability, so it stays and gets more repetitions.`]
    },
    {
      q: `Tradeoff: p-values vs confidence intervals for eval reporting.`,
      a: [`I lead with the effect size and its interval, because decisions depend on how big the improvement plausibly is, not only whether it is nonzero. An interval of +0.5 to +9 points says "probably positive, could be small"; a p-value of 0.03 hides that. p-values are useful as a pre-registered gate (for example in a CI regression check) and when comparing against a fixed threshold, but they invite dichotomous thinking and multiple-comparison abuse. With many variants, either correct (Holm) or confirm the winner on held-out items.`]
    },
    {
      q: `Why can't you just set temperature to 0 and run once?`,
      a: [`Several reasons. Outputs are often not deterministic even at temperature 0, because of batched inference and floating-point non-associativity on accelerators. Some current APIs no longer accept sampling parameters at all, for example the newest Claude models. Production usually runs with default sampling, so a greedy run measures a different system than you ship. And a single run gives no estimate of within-item variance, so you cannot tell whether a change is real. Use the production configuration and repetitions.`]
    },
    {
      q: `What are clustered standard errors and when do they matter in evals?`,
      a: [`When observations come in groups that share something (several questions per passage, many tasks per repository, many repetitions per item), observations within a group are correlated, and the iid SE formula overstates how much information you have. The cluster-robust SE computes variance from group-level sums of residuals, so effectively the number of independent units is the number of clusters. In practice: SWE-bench-style evals should cluster by repository, reading-comprehension evals by passage, and repeated runs by item. The intervals can be noticeably wider, and with few clusters you should use a cluster bootstrap or t critical values with G-1 degrees of freedom.`]
    }
  ]
};
