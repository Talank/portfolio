window.LESSONS = window.LESSONS || {};
window.LESSONS['benchmark-landscape'] = {
  id: 'benchmark-landscape',
  title: 'The Benchmark Landscape: HumanEval, MBPP, SWE-bench, GAIA, MMLU & Contamination',
  category: 'Part 2 — Evaluation Fundamentals',
  timeMin: 40,
  summary: `Interviewers expect you to know the major public benchmarks well enough to say what each one measures, how it is scored, and why its headline number can mislead. This lesson maps the landscape (function-level code, repository-level code, agentic and web tasks, knowledge and reasoning multiple-choice), then covers the two forces that wear every benchmark out: contamination and saturation, with concrete detection and mitigation techniques you can implement.`,
  goals: [
    `Describe HumanEval, MBPP, EvalPlus, SWE-bench (full, Lite, Verified), LiveCodeBench and BigCodeBench: unit of work, scoring, and known weaknesses`,
    `Describe GAIA, WebArena and tau-bench, and explain why agent benchmarks score end states rather than transcripts`,
    `Explain what MMLU and GPQA measure and why multiple-choice benchmarks saturate`,
    `Detect contamination with n-gram overlap, canaries, completion probes, perturbation and release-date splits, and know the limits of each`,
    `Argue which benchmark (or custom eval) to use for a given product decision`
  ],
  concept: [
    {
      h: `Function-level code: HumanEval, MBPP and EvalPlus`,
      p: [
        `<b>HumanEval</b> (OpenAI, with the Codex paper, 2021) is 164 hand-written Python problems. Each record has <code>task_id</code>, <code>prompt</code> (a signature plus docstring, sometimes with examples), <code>canonical_solution</code>, <code>test</code> (a <code>check(candidate)</code> function with asserts) and <code>entry_point</code>. The harness concatenates prompt + completion + test, calls <code>check(entry_point)</code> in a subprocess with a timeout, and reports pass@k. It is small, so a single problem is worth about 0.6 points, and it is old and widely mirrored online.`,
        `<b>MBPP</b> (Google, Austin et al., 2021) is 974 crowd-sourced entry-level Python tasks, each with a natural-language description and three assert tests; a hand-verified "sanitized" subset of 427 is commonly used. <b>EvalPlus</b> (Liu et al., 2023) showed the original tests are too weak: it generated many more tests per problem (with LLM-seeded inputs plus type-aware mutation) to build <b>HumanEval+</b> and <b>MBPP+</b>, and solutions previously counted as correct failed the stronger tests, enough to reorder leaderboards. This is the test-adequacy problem from SE research applied to benchmarks: pass rate is bounded by the strength of the oracle.`
      ],
      code: `{"task_id": "HumanEval/0",
 "prompt": "from typing import List\\n\\ndef has_close_elements(numbers: List[float], threshold: float) -> bool:\\n    \\"\\"\\" ...docstring... \\"\\"\\"\\n",
 "canonical_solution": "    for idx, elem in enumerate(numbers): ...",
 "test": "def check(candidate):\\n    assert candidate([1.0, 2.0, 3.0], 0.5) == False\\n    ...",
 "entry_point": "has_close_elements"}
# program = prompt + completion + "\\n" + test + "\\n" + f"check({entry_point})"`
    },
    {
      h: `Repository-level code: SWE-bench and its variants`,
      p: [
        `<b>SWE-bench</b> (Jimenez et al., ICLR 2024) turns real GitHub issues into tasks: 2,294 instances from 12 popular Python repositories (Django, sympy, scikit-learn, and others). The input is the issue text plus the repository at the base commit; the output is a patch. Scoring applies the patch in a per-instance Docker environment and runs two test sets: <code>FAIL_TO_PASS</code> (tests from the real fix that failed before and must now pass) and <code>PASS_TO_PASS</code> (tests that passed before and must still pass). The metric is the percentage of instances <b>resolved</b>.`,
        `<b>SWE-bench Lite</b> is a 300-instance subset filtered toward self-contained, functional bug fixes, to make runs cheaper. <b>SWE-bench Verified</b> (500 instances, released with OpenAI in 2024) was screened by professional developers who removed instances with underspecified issues or tests that check details the issue never mentions. Verified is the usual headline number. Two caveats to say in an interview: scores measure a <b>system</b> (model plus scaffold: tools, retrieval, retries, test-time compute), not a bare model; and the repositories and their fixes are public, so contamination is a live concern. Continuously refreshed variants such as SWE-bench-Live and SWE-rebench collect newer issues to address that.`
      ]
    },
    {
      h: `Fresher and broader code benchmarks: LiveCodeBench and BigCodeBench`,
      p: [
        `<b>LiveCodeBench</b> keeps collecting competitive-programming problems from LeetCode, AtCoder and Codeforces and records each problem's <b>release date</b>. You evaluate a model only on problems released after its training cutoff, which turns contamination from a guess into a design property. It covers several scenarios beyond generation: self-repair, code execution (predict the output) and test-output prediction. When scores on problems released before a model's cutoff are clearly higher than after, that gap is itself evidence of contamination.`,
        `<b>BigCodeBench</b> (2024) targets practical programming: 1,140 function-level tasks that require composing calls across many real libraries (data processing, networking, visualization, crypto, and so on), with comprehensive tests. It has a <i>Complete</i> variant (docstring-driven) and an <i>Instruct</i> variant (natural-language instruction), plus a harder subset. It measures library and API usage, which HumanEval's self-contained puzzles do not.`
      ]
    },
    {
      h: `Agentic benchmarks: GAIA, WebArena, tau-bench`,
      p: [
        `<b>GAIA</b> (Mialon et al., 2023) is 466 real-world questions that are easy for humans but require multi-step tool use: web browsing, file reading (spreadsheets, PDFs, images), code execution. Questions come in three difficulty levels by number of steps and tools, and each has a short unambiguous answer scored by quasi-exact match, so grading is cheap and objective even though solving is open-ended. Test-set answers are held privately behind a leaderboard.`,
        `<b>WebArena</b> (Zhou et al., 2023) is 812 tasks on self-hosted, realistic websites: an e-commerce store, a store admin panel, a Reddit-style forum, a GitLab instance and a map, plus utility tools. Success is checked <b>functionally</b>: query the site's database or page state after the episode (was the order placed, was the issue created with the right labels), not by reading the agent's narration.`,
        `<b>tau-bench</b> (Sierra, 2024) evaluates tool-agent-user interaction in customer-service domains (retail and airline). An LLM simulates the user; the agent must follow a written domain policy while calling APIs. Success compares the final database state against the annotated goal state. It introduced <b>pass^k</b>: the probability that all k independent trials of the same task succeed, which exposes inconsistency that pass@1 hides. The follow-up tau2-bench adds a setting where the user also acts on the environment.`
      ]
    },
    {
      h: `Knowledge and reasoning multiple-choice: MMLU and GPQA`,
      p: [
        `<b>MMLU</b> (Hendrycks et al., 2021) is four-option multiple-choice across 57 subjects (STEM, humanities, law, medicine), about 14k test questions, usually run 5-shot. It was the default "general knowledge" number for years and is now <b>saturated</b>: frontier models cluster near the top, and later audits (for example MMLU-Redux) found a non-trivial share of questions with wrong or ambiguous labels, which sets a ceiling below 100% and makes small differences meaningless. MMLU-Pro raised the number of options to ten and added harder reasoning items.`,
        `<b>GPQA</b> (Rein et al., 2023) is 448 graduate-level multiple-choice questions in biology, physics and chemistry written and validated by domain experts, built to be "Google-proof": skilled non-experts with web access and plenty of time do poorly. The 198-question <b>Diamond</b> subset (questions where experts agree and non-experts fail) is the usual headline. Small size means wide confidence intervals: one question in Diamond is about half a point.`,
        `Multiple-choice benchmarks are cheap and objective, but they test recognition, not generation; scoring details matter (letter extraction from free text vs log-probabilities over options), and answer-order permutation can move scores, which is a cheap robustness check.`
      ]
    },
    {
      h: `Contamination and saturation: how benchmarks wear out`,
      p: [
        `<b>Contamination</b>: benchmark items (or their solutions) appear in pretraining or fine-tuning data, so the score measures recall. Detection techniques, from cheapest to most informative: (1) <b>n-gram overlap</b> between benchmark text and the training corpus (GPT-3's report used 13-gram overlap) when you have the corpus; (2) <b>canary strings</b>, a unique GUID that benchmark authors embed (BIG-bench does) so data pipelines can filter it and so a model that can reproduce the canary has seen the data; (3) <b>completion probes</b>: give the model the first half of a test item and check for verbatim continuation, or compare per-token likelihoods of the original vs a paraphrase (membership-inference methods such as Min-K% Prob); (4) <b>perturbation</b>: rebuild the benchmark with fresh items of the same difficulty (GSM1k did this for GSM8K) or rename variables and reorder options, and look for a drop; (5) <b>release-date splits</b> as in LiveCodeBench.`,
        `Each has a blind spot: n-gram screens miss paraphrased or translated leaks (Yang et al., 2023 showed rephrased test samples pass standard decontamination and still inflate scores), canaries only work if the pipeline honors them, and likelihood probes need logits and are noisy. Mitigations: private held-out test sets behind a leaderboard, dynamic or refreshed benchmarks, decontaminating your own training data, and always running your own internal eval on data that never left the building.`,
        `<b>Saturation</b>: once top systems cluster near the ceiling, or near the label-noise ceiling, differences are mostly noise and label errors, and the benchmark stops informing decisions. The usual lifecycle is: a new benchmark is hard, it becomes the headline, scaffolds and training target it, scores compress near the top, a harder or cleaner successor appears. Describe trends qualitatively in an interview; quoting a leaderboard number from memory is a good way to be wrong.`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `What separates "I have heard of SWE-bench" from "I have run it": how the harness works, what scaffold dependence means for comparisons, and how to reason about a benchmark you have never seen.`,
    sections: [
      {
        h: `Running SWE-bench for real`,
        p: [
          `The official harness (<code>pip install swebench</code>) builds per-instance Docker images, applies each predicted patch and runs the instance's test commands. Predictions are a JSON or JSONL list of objects with <code>instance_id</code>, <code>model_name_or_path</code> and <code>model_patch</code> (a unified diff). Resource needs are real: building environment images takes substantial disk and time, so start with a handful of instance ids. Gold patches make a perfect oracle run for checking your setup.`
        ],
        code: `python -m swebench.harness.run_evaluation \\
    --dataset_name princeton-nlp/SWE-bench_Lite \\
    --predictions_path preds.jsonl \\
    --max_workers 4 \\
    --run_id my-first-run \\
    --instance_ids sympy__sympy-20590

# oracle check: evaluate the gold patches; every instance should resolve
python -m swebench.harness.run_evaluation \\
    --dataset_name princeton-nlp/SWE-bench_Lite \\
    --predictions_path gold --max_workers 4 --run_id validate-gold`
      },
      {
        h: `Model vs system: scaffold dependence`,
        p: [
          `On agentic benchmarks the same model can score very differently under different scaffolds: tool design (a dedicated edit tool vs raw shell), localization strategy, whether the agent can run tests, how many attempts are sampled and how a winner is chosen, step and token budgets. Agentless (Xia et al., 2024) showed a fixed localize-repair-validate pipeline could be competitive with free-form agents. So a leaderboard row is a (model, scaffold, budget) triple. For a fair model comparison, hold the scaffold and budget fixed; for a product decision, compare complete systems at equal cost.`
        ]
      },
      {
        h: `Reading any benchmark in five questions`,
        p: [
          `When an interviewer names a benchmark you do not know, reason out loud with: (1) What is the unit of work and who wrote the items (experts, crowd, scraped)? (2) How is it scored: exact match, execution, end-state, judge? (3) How big is it, so what is one item worth and how wide is the interval? (4) Where could it be contaminated: are items, or their solutions, on the public web, and when? (5) What does it not measure that my product needs? This frames you as someone who evaluates evaluations, which is the job.`
        ]
      },
      {
        h: `When to stop using public benchmarks`,
        p: [
          `Public benchmarks are good for coarse model selection and sanity checks, and bad for product decisions: their input distribution is not your traffic, they are contaminated to unknown degrees, and the scaffold is not yours. The standard practice is a small set of public benchmarks for regression detection on capability, plus an internal golden set built from production traffic for every decision that ships.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `The Treasure Map Everyone Has Already Seen`,
      text: [
        `The Navy's navigator academy rates recruits with a famous set of 164 practice charts. For years it worked. Then copies of the charts, with answers penciled in, started circulating in every port tavern. Recruits began scoring perfectly while running ships aground on their first real voyage.`,
        `Nami, asked to fix the test, does three things. She hides a marker in every official chart, a strange island name that exists nowhere else, so if a recruit ever mentions it, she knows they saw a copy. She starts drawing new charts every month from seas charted after the recruits enrolled, so nobody could have studied them. And for the hardest exam she stops checking the recruit's explanation and sails the ship on the heading: either it reaches the island or it does not.`,
        `Robin adds a warning: the tavern copies are not always exact. Some are redrawn by hand with the islands renamed, and a check that only looks for identical drawings misses those.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: `Ross's Paleontology Midterm Is on the Internet`,
      text: [
        `Ross reuses his midterm every semester. The class average climbs every year, and Ross concludes he is an extraordinary teacher. Chandler finds the full exam, with answers, posted on a student forum, word for word.`,
        `Ross writes a new exam. A few students still ace it, and Rachel points out the forum now has a "reworded" version of the old one with the dinosaurs renamed, which Ross's word-for-word search never caught. Ross finally writes questions about a fossil discovered after the semester started.`
      ]
    },
    why: `The circulating charts are a contaminated benchmark: the score measures recall. Nami's hidden island name is a canary string; the monthly charts from newly mapped seas are a release-date split (LiveCodeBench); sailing the heading instead of reading the explanation is execution or end-state scoring. Robin's and Rachel's warning is the known blind spot: n-gram or exact-copy screens miss paraphrased leaks.`
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'charts', emoji: '🗺️', label: '164 practice charts', x: 20, y: 20 },
      { id: 'tavern', emoji: '🍺', label: 'tavern copies', x: 50, y: 20 },
      { id: 'canary', emoji: '🐦', label: 'hidden island name', x: 80, y: 20 },
      { id: 'fresh', emoji: '🆕', label: 'new seas (after enrolment)', x: 80, y: 78 },
      { id: 'score', emoji: '📊', label: 'recruit scores', x: 20, y: 78 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 50, y: 55 },
      { id: 'recruit', emoji: '🧑', label: 'Recruit', x: 30, y: 55 },
      { id: 'robin', emoji: '📚', label: 'Robin', x: 68, y: 55 }
    ],
    steps: [
      { c: `The academy's 164 charts are the benchmark. Scores mean something while the charts are private.`, p: { charts: 'lit' } },
      { c: `Copies with answers leak into the taverns. Recruits study them: contamination.`, a: { recruit: [45, 35] }, p: { tavern: 'bad' } },
      { c: `Scores climb to near perfect while real voyages fail. The benchmark is saturated by leakage, not skill.`, a: { recruit: [22, 60] }, p: { score: 'bad' }, l: { score: 'scores: ~100% (suspicious)' } },
      { c: `Nami plants a fictional island name in every official chart. A recruit who mentions it has seen a copy: a canary.`, a: { nami: [76, 40] }, p: { canary: 'lit' } },
      { c: `Robin warns that redrawn copies with renamed islands evade exact-copy checks: paraphrase beats n-gram screens.`, a: { robin: [55, 35] }, p: { tavern: 'dim' } },
      { c: `Nami draws new charts from seas mapped after enrolment. Nobody could have studied them: a release-date split.`, a: { nami: [74, 62] }, p: { fresh: 'good' } },
      { c: `On fresh charts the scores drop to their real level. The gap between old and new charts is the contamination signal.`, a: { recruit: [30, 62] }, p: { score: 'good' }, l: { score: 'old 98% vs fresh 61%: leak' } }
    ]
  },
  conceptFlow: {
    title: `How SWE-bench scores one instance`,
    intro: `From GitHub issue to "resolved": the pipeline the official harness runs per instance.`,
    stages: [
      { label: 'Task', nodes: [
        { id: 'issue', text: 'Issue text +\nrepo at base commit' } ] },
      { label: 'System', nodes: [
        { id: 'agent', text: 'Model + scaffold\nlocalize, edit, test' },
        { id: 'patch', text: 'model_patch\n(unified diff)' } ] },
      { label: 'Harness', nodes: [
        { id: 'docker', text: 'Per-instance\nDocker image' },
        { id: 'apply', text: 'git apply patch\n+ test patch' } ] },
      { label: 'Tests', nodes: [
        { id: 'f2p', text: 'FAIL_TO_PASS\nmust now pass' },
        { id: 'p2p', text: 'PASS_TO_PASS\nmust still pass' } ] },
      { label: 'Metric', nodes: [
        { id: 'resolved', text: 'resolved iff both\n% resolved over set' } ] }
    ],
    steps: [
      { active: ['issue'], note: 'Each instance is a real issue from one of 12 Python repositories, paired with the commit just before the human fix was merged.' },
      { active: ['agent'], note: 'The system under test is model plus scaffold. It may browse files, run commands and retry; none of that is scored directly.' },
      { active: ['patch'], note: 'All that is submitted is a diff, keyed by instance_id. This is outcome evaluation: the trajectory does not count.' },
      { active: ['docker'], note: 'The harness builds a pinned environment per instance so dependencies and Python version match the original project at that commit.' },
      { active: ['apply'], note: 'It applies the model patch, then the hidden test changes from the real fix. A patch that does not apply cleanly is unresolved.' },
      { active: ['f2p'], note: 'FAIL_TO_PASS tests encode the issue: they failed before the real fix and must pass now.' },
      { active: ['p2p'], note: 'PASS_TO_PASS tests guard against regressions: everything that worked before must still work.' },
      { active: ['resolved'], note: 'An instance is resolved only if both sets pass. The headline is the fraction resolved, so on Verified one instance is 0.2 points.' }
    ]
  },
  tech: [
    {
      q: `Why did EvalPlus change HumanEval rankings if the problems stayed the same?`,
      a: [`Because pass rate is bounded by test strength. HumanEval's original tests per problem are few and miss edge cases (empty inputs, negatives, large values, type corner cases), so some wrong programs pass. EvalPlus generated many more inputs, seeded by an LLM and expanded by type-aware mutation, with the canonical solution as the oracle for expected outputs. Programs that only handled the common path started failing. Models differ in how often they produce "almost right" code, so the correction was not uniform and rankings moved. It is mutation-testing logic applied to a benchmark.`]
    },
    {
      q: `What exactly is a canary string and why does it work?`,
      a: [`A canary is a unique, random identifier (BIG-bench uses a GUID in a fixed sentence) placed in every benchmark file. Data pipelines can drop any document containing it, which prevents accidental training on the benchmark. And it doubles as a probe: if a model can complete the canary sentence with the right GUID, it has seen the benchmark files. It only works if crawlers and dataset builders honor it, and it cannot detect leaks that stripped the canary (copied questions without the header), so it is one signal, not proof.`]
    },
    {
      q: `Why is tau-bench's pass^k not just pass@k with a different name?`,
      a: [`pass@k asks whether at least one of k attempts succeeds; it rises with k. pass^k asks whether all k succeed; it falls with k. Estimated from n trials with c successes, pass^k = C(c,k)/C(n,k). For a customer-service agent, users experience each attempt, so a model with 80% per-trial success fails often over repeated use, and pass^k makes that visible: the curve of pass^k against k shows reliability decaying, which is the thing a deployment owner cares about.`]
    },
    {
      q: `How do multiple-choice benchmarks actually extract the answer?`,
      a: [`Two families. Log-likelihood scoring (classic lm-evaluation-harness style) computes the model's probability of each option's text or letter and picks the maximum, which needs logits and never fails to parse. Generative scoring asks the model to answer and extracts a letter with a regex, which works with chat APIs but adds extraction errors and is sensitive to format instructions. Scores from the two methods differ, which is one reason reported MMLU numbers are not always comparable across papers.`]
    }
  ],
  code: {
    title: `Run a HumanEval-format problem and screen for contamination`,
    intro: `The script grades three completions with the HumanEval protocol (a correct one, one that passes the docstring example but fails an edge case, and one that never terminates), then runs an 8-gram overlap screen against three "crawled" documents: a verbatim mirror, a paraphrase, and unrelated text.`,
    code: `# bench_tools.py - run a HumanEval-format problem and screen it for contamination.
# Stdlib only. Run: python3 bench_tools.py
import re
import subprocess
import sys
import tempfile

# A record in the exact HumanEval schema: task_id, prompt, canonical_solution,
# test (defines check(candidate)), entry_point. This one is written for the demo.
PROBLEM = {
    "task_id": "Demo/0",
    "prompt": 'def running_max(xs: list[int]) -> list[int]:\\n'
              '    """Return the running maximum of xs.\\n'
              '    >>> running_max([1, 3, 2, 5])\\n'
              '    [1, 3, 3, 5]\\n'
              '    """\\n',
    "canonical_solution": "    out, m = [], None\\n"
                          "    for x in xs:\\n"
                          "        m = x if m is None else max(m, x)\\n"
                          "        out.append(m)\\n"
                          "    return out\\n",
    "test": "def check(candidate):\\n"
            "    assert candidate([1, 3, 2, 5]) == [1, 3, 3, 5]\\n"
            "    assert candidate([]) == []\\n"
            "    assert candidate([-5, -7]) == [-5, -5]\\n",
    "entry_point": "running_max",
}


def check_completion(problem: dict, completion: str, timeout_s: float = 5.0) -> str:
    """HumanEval protocol: program = prompt + completion + test + check(entry_point)."""
    program = (problem["prompt"] + completion + "\\n\\n" + problem["test"] + "\\n"
               + f"check({problem['entry_point']})\\n")
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(program)
    try:
        r = subprocess.run([sys.executable, "-I", f.name], capture_output=True,
                           text=True, timeout=timeout_s)
    except subprocess.TimeoutExpired:
        return "timeout"
    return "passed" if r.returncode == 0 else "failed: " + r.stderr.strip().splitlines()[-1]


# ---- Contamination screen: word n-gram overlap between benchmark text and a corpus.
def ngrams(text: str, n: int) -> set[tuple[str, ...]]:
    toks = re.findall(r"\\w+", text.lower())
    return {tuple(toks[i:i + n]) for i in range(len(toks) - n + 1)}


def overlap_ratio(item: str, corpus_docs: list[str], n: int = 8) -> float:
    """Fraction of the item's n-grams that appear anywhere in the corpus."""
    item_grams = ngrams(item, n)
    if not item_grams:
        return 0.0
    corpus = set().union(*(ngrams(d, n) for d in corpus_docs))
    return len(item_grams & corpus) / len(item_grams)


if __name__ == "__main__":
    good = PROBLEM["canonical_solution"]
    # right on the docstring example, wrong on the empty list
    buggy = "    return [max(xs[:i + 1]) for i in range(len(xs))] if xs else [0]\\n"
    loops = "    while True:\\n        pass\\n"
    for name, comp in [("canonical", good), ("buggy", buggy), ("loops", loops)]:
        print(f"{name:10s}", check_completion(PROBLEM, comp, timeout_s=2))

    crawl = {  # pretend these documents came from a pretraining crawl
        "verbatim-mirror": "Solutions repo. " + PROBLEM["prompt"] + PROBLEM["canonical_solution"],
        "paraphrase": "Write running max: for each position output the largest value "
                      "seen so far, e.g. 1 3 2 5 becomes 1 3 3 5.",
        "unrelated": "notes about sailing ships, log poses and navigation charts",
    }
    for doc_name, doc in crawl.items():
        r = overlap_ratio(PROBLEM["prompt"], [doc], n=8)
        flag = "LIKELY CONTAMINATED" if r >= 0.5 else "not flagged"
        print(f"{doc_name:16s} 8-gram overlap = {r:.2f} -> {flag}")
    # The paraphrase is not flagged: n-gram screens miss rewritten leaks.`,
    notes: [
      `Output: canonical passed; buggy failed: AssertionError; loops timeout; verbatim-mirror overlap 1.00 (flagged); paraphrase 0.00 (not flagged); unrelated 0.00.`,
      `The buggy completion is the EvalPlus point in miniature: with only the docstring example as a test it would have passed.`,
      `The paraphrase sails straight through the n-gram screen. That is why fresh-item and release-date methods exist.`,
      `To run real HumanEval, load the dataset (for example <code>datasets.load_dataset("openai_humaneval")</code>) and call <code>check_completion</code> on each record; run untrusted completions inside a container.`
    ]
  },
  lab: {
    title: `Build a contamination screen with two mitigations`,
    prompt: `Implement <code>ngrams</code> (lowercased word n-grams as tuples), <code>overlap_ratio</code> (fraction of the item's n-grams found in the corpus set), <code>flag_contaminated</code> (ids whose overlap is at least the threshold; build the corpus n-gram set once, not per item), and <code>after_cutoff</code> (keep problems whose <code>release_date</code> is strictly after the cutoff). The asserts at the bottom must pass.`,
    starter: `# contamination_lab.py
import re
from datetime import date


def ngrams(text: str, n: int) -> set:
    raise NotImplementedError


def overlap_ratio(item: str, corpus_grams: set, n: int) -> float:
    raise NotImplementedError


def flag_contaminated(items: dict, corpus_docs: list, n: int = 8, threshold: float = 0.5) -> set:
    """Return ids of items whose n-gram overlap with the corpus is >= threshold."""
    raise NotImplementedError


def after_cutoff(problems: list, cutoff: date) -> list:
    raise NotImplementedError


if __name__ == "__main__":
    items = {
        "p1": "Given an array of integers return indices of the two numbers that add up to target",
        "p2": "Count the islands in a grid of land and water cells connected horizontally or vertically",
    }
    corpus = ["forum dump: given an array of integers return indices of the two numbers "
              "that add up to target, here is my answer ..."]
    assert flag_contaminated(items, corpus, n=8) == {"p1"}
    probs = [{"id": "a", "release_date": date(2026, 3, 1)},
             {"id": "b", "release_date": date(2026, 9, 1)}]
    assert [p["id"] for p in after_cutoff(probs, date(2026, 6, 30))] == ["b"]
    print("all checks passed")
`,
    checks: [
      { re: 'tuple\\(\\s*toks\\[i\\s*:\\s*i\\s*\\+\\s*n\\]\\s*\\)', flags: '', must: true, hint: 'Build n-grams as tuple(toks[i:i + n]) over a sliding window', pass: 'sliding-window n-grams' },
      { re: '\\.lower\\(\\)', flags: '', must: true, hint: 'Lowercase the text before tokenizing', pass: 'case-insensitive' },
      { re: 'grams\\s*&\\s*corpus_grams', flags: '', must: true, hint: 'Intersect the item n-grams with the corpus n-gram set', pass: 'set intersection' },
      { re: 'corpus_grams\\s*\\|=', flags: '', must: true, hint: 'Build the corpus n-gram set once with corpus_grams |= ngrams(d, n)', pass: 'corpus set built once' },
      { re: '>=\\s*threshold', flags: '', must: true, hint: 'Flag items whose overlap is >= threshold', pass: 'threshold applied' },
      { re: 'release_date"\\]\\s*>\\s*cutoff', flags: '', must: true, hint: 'Keep problems with p["release_date"] > cutoff (strictly after)', pass: 'release-date split' },
      { re: 'raise NotImplementedError', flags: '', must: false, hint: 'Implement every function', pass: 'all functions implemented' }
    ],
    run: `Save as <code>contamination_lab.py</code>, run <code>python3 contamination_lab.py</code>, expect <code>all checks passed</code>. Then try it on real data: <code>pip install datasets</code>, load <code>openai_humaneval</code>, and screen its prompts against a folder of text files you suspect (for example a scraped solutions repo).`,
    solution: `# contamination_lab.py - two mitigations: an n-gram screen and a release-date cutoff.
import re
from datetime import date


def ngrams(text: str, n: int) -> set:
    toks = re.findall(r"\\w+", text.lower())
    return {tuple(toks[i:i + n]) for i in range(len(toks) - n + 1)}


def overlap_ratio(item: str, corpus_grams: set, n: int) -> float:
    grams = ngrams(item, n)
    if not grams:
        return 0.0
    return len(grams & corpus_grams) / len(grams)


def flag_contaminated(items: dict, corpus_docs: list, n: int = 8, threshold: float = 0.5) -> set:
    """Return ids of items whose n-gram overlap with the corpus is >= threshold."""
    corpus_grams = set()
    for d in corpus_docs:
        corpus_grams |= ngrams(d, n)
    return {i for i, text in items.items() if overlap_ratio(text, corpus_grams, n) >= threshold}


def after_cutoff(problems: list, cutoff: date) -> list:
    """LiveCodeBench-style: keep only problems released strictly after the model's cutoff."""
    return [p for p in problems if p["release_date"] > cutoff]


if __name__ == "__main__":
    items = {
        "p1": "Given an array of integers return indices of the two numbers that add up to target",
        "p2": "Count the islands in a grid of land and water cells connected horizontally or vertically",
    }
    corpus = ["forum dump: given an array of integers return indices of the two numbers "
              "that add up to target, here is my answer ..."]
    assert flag_contaminated(items, corpus, n=8) == {"p1"}
    probs = [{"id": "a", "release_date": date(2026, 3, 1)},
             {"id": "b", "release_date": date(2026, 9, 1)}]
    assert [p["id"] for p in after_cutoff(probs, date(2026, 6, 30))] == ["b"]
    print("all checks passed")`,
    notes: [
      `Real decontamination runs at corpus scale, so production tools hash n-grams into a Bloom filter or a suffix array instead of a Python set.`,
      `Choose n with care: small n (3-5) flags common phrases everywhere, large n (13+) misses lightly edited copies. Report the n and the threshold with any contamination claim.`
    ]
  },
  quiz: [
    {
      q: `A model scores much higher on SWE-bench Verified than a competitor, but they used different agent scaffolds. What can you conclude about the models?`,
      options: [`The first model is better at coding`, `Little about the models alone: the score measures model plus scaffold plus budget`, `The second model is contaminated`, `Verified is saturated`],
      correct: 1,
      explain: `Agentic scores depend heavily on tools, localization strategy, retries and budget. Hold the scaffold fixed to compare models.`
    },
    {
      q: `What does SWE-bench require for an instance to count as resolved?`,
      options: [`The patch compiles`, `An LLM judge approves the diff`, `FAIL_TO_PASS tests now pass and PASS_TO_PASS tests still pass`, `The patch matches the human fix line by line`],
      correct: 2,
      explain: `Both the issue-specific tests and the regression tests must pass after applying the model patch.`
    },
    {
      q: `Which contamination technique is a design property rather than a detection heuristic?`,
      options: [`13-gram overlap`, `Min-K% Prob membership inference`, `Evaluating only on problems released after the model's training cutoff`, `Asking the model whether it has seen the question`],
      correct: 2,
      explain: `A release-date split (LiveCodeBench) makes it impossible for the items to be in training data, if the cutoff is accurate.`
    },
    {
      q: `Why did HumanEval+ lower many models' scores?`,
      options: [`It used harder problems`, `It added many more tests per problem, catching wrong solutions the original tests passed`, `It switched to an LLM judge`, `It removed the docstrings`],
      correct: 1,
      explain: `Same problems, stronger oracle. Weak tests had been passing incorrect programs.`
    },
    {
      q: `Top models on a benchmark all score within one point of each other near its ceiling, and audits found label errors. What is the right reading?`,
      options: [`The highest model is best`, `The benchmark is saturated: differences are within noise and label error, so it no longer separates these models`, `All models are contaminated`, `Run it with more shots`],
      correct: 1,
      explain: `Near the ceiling, sampling noise and wrong labels dominate. Use a harder, cleaner benchmark or your own eval.`
    }
  ],
  pitfalls: [
    `Quoting leaderboard numbers from memory in an interview. Describe trends qualitatively and say how you would check.`,
    `Comparing agentic benchmark scores across different scaffolds or budgets and attributing the gap to the model.`,
    `Trusting an n-gram decontamination report as proof of cleanliness: paraphrased and translated leaks pass it.`,
    `Treating a small benchmark's one-point difference as real. On GPQA Diamond one question is about half a point; compute the interval.`,
    `Using public benchmarks for a product decision instead of an internal golden set drawn from your own traffic.`
  ],
  interview: [
    {
      q: `Walk me through SWE-bench: what is a task, how is it scored, and what are its weaknesses?`,
      a: [`A task is a real GitHub issue from one of 12 Python repositories plus the repository at the pre-fix commit. The system outputs a patch. The harness builds a per-instance Docker environment, applies the patch and the hidden test changes from the human fix, and runs FAIL_TO_PASS tests (must now pass) and PASS_TO_PASS tests (must still pass); resolved means both. Weaknesses: some original instances had underspecified issues or tests checking unstated details, which motivated the 500-instance human-validated Verified subset; repositories and fixes are public, so contamination is possible, which motivated refreshed variants; and scores reflect the whole system (scaffold, retries, budget), so model comparisons need a fixed scaffold. It is also Python-only and skewed toward a few large repositories, so per-repo clustering widens the real confidence interval.`]
    },
    {
      q: `How would you detect whether a model was trained on your benchmark?`,
      a: [`Layered evidence. If I have the training data, n-gram overlap (around 8 to 13 tokens) between items and corpus, with a reported threshold. Without it: canary completion if the benchmark has one; completion probes, giving the first half of an item and checking for verbatim continuation of the rest or the reference answer; likelihood comparisons between the original item and a meaning-preserving paraphrase, since a memorized original gets unusually high likelihood; and a performance comparison on a freshly written, difficulty-matched set or on items released after the model's cutoff. A clear gap between original and fresh items is the most convincing signal. I would report all of this as evidence of contamination, not proof of absence.`]
    },
    {
      q: `Design: your team wants one number to track coding ability of candidate models each month. What do you build?`,
      a: [`Not one public benchmark. I would combine a contamination-resistant public signal (LiveCodeBench problems after each model's cutoff, plus a fixed SWE-bench Verified subset run with our own frozen scaffold and budget) with an internal set built from our own repositories: closed bugs with their regression tests, converted into SWE-bench-style instances, kept private. Report per-suite pass rates with bootstrap CIs, cost and latency per task, and pass^k on a reliability subset. Freeze the scaffold version and rerun the previous champion each month as a control, so drift in infrastructure shows up as a control change rather than a fake model gain.`]
    },
    {
      q: `Tradeoff: multiple-choice benchmarks like MMLU vs open-ended generation benchmarks.`,
      a: [`Multiple-choice is cheap, objective and stable: no judge, no execution sandbox, small variance in grading. But it measures recognition among given options, it saturates quickly, its labels contain errors that set a ceiling, and answer extraction details change scores. Open-ended generation (code with tests, agent tasks with end-state checks) measures what products need, but it costs more per item, needs sandboxes or judges, and has more sources of noise. I use multiple-choice as a coarse capability screen and open-ended, execution- or state-graded evals for decisions.`]
    },
    {
      q: `What is benchmark saturation and what do you do about it?`,
      a: [`A benchmark is saturated when top systems cluster near its ceiling, or near the ceiling set by its label noise, so differences are within sampling error and label errors. At that point it stops ranking frontier systems, although it can still catch regressions. Responses: move to a harder or cleaned successor (MMLU-Pro, GPQA, Verified-style cleaned subsets), use metrics that keep discriminating (pass^k, cost at fixed accuracy), focus on the hard subset, or build an internal eval targeting the remaining failure modes.`]
    },
    {
      q: `Why do agent benchmarks like WebArena and tau-bench check the end state instead of the transcript?`,
      a: [`Because the transcript is narration: an agent can claim to have placed the order without placing it, or take a different valid route than the reference. Checking the environment (database rows, page state, the final order or reservation) grades the outcome, accepts any valid path, and is hard to game by wording. Trajectory checks are still useful as secondary metrics, for policy compliance, efficiency and safety, but outcome checks are the primary success signal.`]
    },
    {
      q: `GAIA questions are open-ended tasks, yet it is scored by exact match. Why does that work?`,
      a: [`The authors designed questions whose answers are short and unambiguous (a number, a name, a short string) even though finding them needs multi-step browsing, file reading and computation. That separates the difficulty of solving from the difficulty of grading: grading is a cheap normalized comparison with no judge, and the leaderboard keeps test answers private to limit contamination. The design lesson for your own agent evals is to choose tasks with checkable final answers wherever you can.`]
    }
  ]
};
