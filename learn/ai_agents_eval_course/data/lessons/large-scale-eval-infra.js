window.LESSONS = window.LESSONS || {};
window.LESSONS['large-scale-eval-infra'] = {
  id: 'large-scale-eval-infra',
  title: 'Running Evals at Scale: Parallelism, Rate Limits, Caching, Batch APIs & Sandboxes',
  category: 'Part 3 — Evaluation at Scale',
  timeMin: 50,
  summary: `Ten thousand items times five repetitions times three variants is 150,000 model calls, plus judge calls, plus sandboxed test runs. At that scale the eval is a distributed system, and the bugs are distributed-systems bugs: rate limits, hung connections, partial failures, duplicate work, results lost in a crash, and infrastructure errors scored as model errors. This lesson builds the runner piece by piece (asyncio with a semaphore, exponential backoff with full jitter, a request-hash cache, idempotent and resumable JSONL output, per-case timeouts), shows when to switch to a batch API, how to sandbox model-written code, and where the standard harnesses fit.`,
  goals: [
    `Size concurrency from rate limits and latency, and implement bounded concurrency with asyncio and a semaphore`,
    `Implement retries with exponential backoff and full jitter that honor retry-after and never retry client errors`,
    `Build a request-hash cache and an append-only, resumable results store keyed by (case, repetition), with errors kept apart from scores`,
    `Decide between online calls and the Message Batches API, and run code-execution grading in a locked-down container`,
    `Place lm-evaluation-harness, Inspect AI, OpenAI Evals, HELM and the SWE-bench harness, and know their basic commands`
  ],
  concept: [
    {
      h: `Throughput: concurrency, Little's law and the semaphore`,
      p: [
        `Little's law gives the sizing: requests in flight = throughput x latency. If calls take about 8 s and your rate limit allows about 300 requests per minute (5 per second), you need about 40 concurrent requests to saturate it; fewer leaves capacity unused, more just produces 429s. Providers usually limit requests per minute and input and output tokens per minute separately, so long prompts can hit the token limit long before the request limit. Size from whichever binds first.`,
        `The standard Python shape is <code>asyncio</code> with an async client and an <code>asyncio.Semaphore(N)</code> around the network call. Create all tasks with <code>asyncio.gather</code>, and let the semaphore admit N at a time. Hold the semaphore only while the request is in flight, not while sleeping in backoff, or a burst of 429s idles every slot. For multi-process or multi-machine runs, put cases on a queue (even a database table with a claimed-by column) and run workers that each hold a local semaphore; the global limit is then workers x N.`
      ],
      code: `sem = asyncio.Semaphore(16)

async def one(case):
    async with sem:                                   # at most 16 requests in flight
        return await asyncio.wait_for(call_model(case), timeout=600)

results = await asyncio.gather(*(one(c) for c in cases), return_exceptions=True)`
    },
    {
      h: `Rate limits, retries and exponential backoff with jitter`,
      p: [
        `Expect three transient failure classes: <b>429</b> rate-limited (often with a <code>retry-after</code> header), <b>overloaded / 5xx</b> (Anthropic uses 529 for overloaded), and <b>connection errors and timeouts</b>. Retry those; never retry 400-class client errors other than 429 (and 408/409), because a malformed request will fail identically every time. The Anthropic SDKs retry connection errors, 408, 409, 429 and 5xx with exponential backoff by default (2 retries, configurable with <code>max_retries</code>). Large runs usually set <code>max_retries=0</code> and own the loop so every attempt is counted and logged.`,
        `Backoff: wait base x 2<sup>attempt</sup>, capped, and add <b>jitter</b>. Without jitter, every worker that hit the limit at the same moment retries at the same moment, and the herd keeps colliding. "Full jitter" draws uniform(0, min(cap, base x 2<sup>attempt</sup>)), which spreads retries well and is the variant popularized by AWS's "Exponential Backoff and Jitter" analysis. Honor <code>retry-after</code> as a floor. Cap attempts (5-8), and record the attempt count on each row so retried calls can be excluded from latency statistics.`
      ],
      code: `def backoff_delay(attempt, base=0.5, cap=30.0):
    return random.uniform(0, min(cap, base * 2 ** attempt))   # full jitter

except anthropic.RateLimitError as e:
    await asyncio.sleep(max(float(e.response.headers.get("retry-after", "1")),
                            backoff_delay(attempt)))
except anthropic.APIStatusError as e:
    if e.status_code < 500:
        raise                       # a bug in the request: retrying will not help`
    },
    {
      h: `Caching by request hash, idempotency and resumable runs`,
      p: [
        `Hash the canonical request: <code>json.dumps(params, sort_keys=True, separators=(",", ":"))</code> fed to SHA-256, where params includes everything that can change the output (model id, system prompt, tools, messages, max_tokens, effort, and a harness version string). Identical requests then hit a local cache (SQLite is enough up to millions of rows), so rerunning the analysis, adding a new metric, or recovering from a crash costs nothing and reads exactly the same outputs. To force fresh samples for repetitions, put the repetition index into the key. This response cache is different from <b>provider prompt caching</b>, which reuses a shared prompt prefix server-side to cut cost and latency (<code>cache_control</code> on Claude requests; verify it works with <code>usage.cache_read_input_tokens</code>).`,
        `Make the run <b>idempotent and resumable</b>: results go to an append-only JSONL file keyed by (case_id, rep); on start, read the done keys and skip them; flush and <code>fsync</code> each row so a crash never leaves half a line. Write attempts that produced no scorable output (timeout, retries exhausted, served-model mismatch) to a separate <code>errors.jsonl</code> with a failure class, and retry those on the next run. Never write a 0 into the results for an infrastructure failure. Convert to Parquet (<code>pandas.DataFrame.to_parquet</code>, which needs <code>pyarrow</code>) for analysis; columnar storage makes slicing millions of rows by model, tag and repetition fast.`
      ]
    },
    {
      h: `Batch APIs: half the price, no latency guarantee`,
      p: [
        `Offline evals rarely need answers in seconds. The Anthropic <b>Message Batches API</b> takes up to 100,000 requests (or 256 MB) per batch, charges 50% of the standard price, and processes asynchronously: most batches finish within an hour, the maximum is 24 hours, and results stay available for 29 days. Each request carries a <code>custom_id</code>; results come back in <b>any order</b> with a type of <code>succeeded</code>, <code>errored</code>, <code>canceled</code> or <code>expired</code>, so join by <code>custom_id</code>, never by position, and resubmit errored and expired ones. Batch requests cannot stream or use fast mode.`,
        `Tradeoffs: batch is ideal for large static evals and judge passes; it is wrong for multi-turn agent evals (each turn depends on the previous response and on tool execution), and latency measured in a batch means nothing. Persist the batch id immediately so a crashed poller can resume. Prompt caching works inside batches, so put the shared rubric or few-shot block first.`
      ],
      code: `batch = client.messages.batches.create(requests=[
    Request(custom_id=c["id"], params=MessageCreateParamsNonStreaming(
        model="claude-opus-5-5", max_tokens=64,
        messages=[{"role": "user", "content": c["q"]}]))
    for c in cases])
# poll client.messages.batches.retrieve(batch.id).processing_status until "ended"
for r in client.messages.batches.results(batch.id):
    print(r.custom_id, r.result.type)`
    },
    {
      h: `Sandboxes and timeouts for executing model output`,
      p: [
        `Model-written code is untrusted input. Run each sample in a disposable container with no network, capped memory, CPU and process count, a read-only root filesystem, a non-root user and no capabilities, and enforce a timeout both inside (the <code>timeout</code> command) and outside (kill the container if the inner timeout does not fire). For stronger isolation, use gVisor (<code>--runtime=runsc</code>) or microVMs such as Firecracker; containers share the host kernel. Reuse prebuilt images (SWE-bench builds one environment image per instance) and a warm pool of containers to amortize start-up time.`,
        `Put a timeout at every layer: per HTTP request (SDK <code>timeout</code>), per case wall-clock including retries (<code>asyncio.wait_for</code>), and per test execution. A hung streaming connection can keep sending keepalives, so only a total wall-clock ceiling reliably frees the slot. A fired timeout is an error row with class "timeout", not a wrong answer.`
      ],
      code: `docker run --rm --network none --memory 512m --cpus 1 --pids-limit 128 \\
  --read-only --tmpfs /tmp:rw,size=64m --user 65534:65534 \\
  --cap-drop ALL --security-opt no-new-privileges \\
  -v "$PWD/sample_017:/work:ro" python:3.12-slim \\
  timeout 10 python -I /work/run_tests.py`
    },
    {
      h: `The standard harnesses and when to use which`,
      p: [
        `<table><tr><th>Harness</th><th>Best for</th><th>Entry point</th></tr>
<tr><td>EleutherAI <b>lm-evaluation-harness</b></td><td>Hundreds of academic tasks; log-likelihood multiple-choice and generation; local HF/vLLM models and APIs</td><td><code>lm_eval --model hf --model_args pretrained=EleutherAI/pythia-160m --tasks hellaswag --batch_size 8</code></td></tr>
<tr><td><b>Inspect AI</b> (UK AI Security Institute)</td><td>Python-defined tasks with solvers, tools, agents and sandboxes; epochs; log viewer</td><td><code>inspect eval task.py --model anthropic/claude-opus-5-5 --epochs 3 --limit 50</code></td></tr>
<tr><td><b>OpenAI Evals</b></td><td>Registry of YAML/JSONL evals with match and model-graded templates</td><td><code>oaieval &lt;completion_fn&gt; &lt;eval_name&gt;</code></td></tr>
<tr><td>Stanford <b>HELM</b></td><td>Holistic, many-metric comparisons across scenarios with standardized reporting</td><td><code>helm-run --run-entries ... --suite my-suite --max-eval-instances 10</code>, then <code>helm-summarize --suite my-suite</code></td></tr>
<tr><td><b>SWE-bench harness</b></td><td>Repository-level patches scored in per-instance Docker images</td><td><code>python -m swebench.harness.run_evaluation --dataset_name ... --predictions_path ...</code></td></tr></table>`,
        `Use a standard harness when you need comparability with published numbers, and write your own thin runner (or an Inspect task) for product evals, where the system under test is your real application entry point. Whatever you use, the properties in this lesson are what to audit: bounded concurrency, logged retries, a separate error channel, caching, resumability, and pinned versions.`
      ]
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: `The full real-API runner, an Inspect task, and the failure modes that only show up past ten thousand calls.`,
    sections: [
      {
        h: `The same runner on the Claude API`,
        p: [
          `This is the production version of the worked example: <code>AsyncAnthropic(max_retries=0)</code> so every attempt is visible, a semaphore held only around the request, typed exceptions handled most-specific first, refusals and <code>max_tokens</code> truncation recorded as their own statuses, usage taken from the response (never estimated from string length), and the request id kept for support tickets. It compiles cleanly; it needs <code>ANTHROPIC_API_KEY</code> to run.`
        ],
        code: `# claude_runner.py - the same runner shape on the real API (needs ANTHROPIC_API_KEY).
import asyncio
import random

import anthropic

MODEL = "claude-opus-5-5"
client = anthropic.AsyncAnthropic(max_retries=0)    # we own retries, so we can log them
sem = asyncio.Semaphore(16)                         # size this from your rate-limit tier


async def call(messages, max_attempts=6):
    for attempt in range(max_attempts):
        try:
            async with sem:
                resp = await client.messages.create(
                    model=MODEL, max_tokens=1024, messages=messages,
                    cache_control={"type": "ephemeral"},   # reuse a long shared prefix
                )
            if resp.stop_reason == "refusal":
                return {"status": "refusal", "attempts": attempt + 1}
            if resp.stop_reason == "max_tokens":
                status = "truncated"                       # counted, never averaged as wrong
            else:
                status = "ok"
            text = "".join(b.text for b in resp.content if b.type == "text")
            return {"status": status, "text": text, "model": resp.model,
                    "attempts": attempt + 1, "usage": resp.usage.model_dump(),
                    "request_id": resp._request_id}
        except anthropic.RateLimitError as e:
            retry_after = float(e.response.headers.get("retry-after", "1"))
            await asyncio.sleep(max(retry_after, random.uniform(0, min(60, 2 ** attempt))))
        except anthropic.APIStatusError as e:
            if e.status_code < 500:
                raise                                      # 400/404: a bug, do not retry
            await asyncio.sleep(random.uniform(0, min(60, 2 ** attempt)))
        except anthropic.APIConnectionError:
            await asyncio.sleep(random.uniform(0, min(60, 2 ** attempt)))
    return {"status": "error", "attempts": max_attempts}


async def main(questions):
    tasks = [asyncio.wait_for(call([{"role": "user", "content": q}]), timeout=600)
             for q in questions]
    return await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    print(asyncio.run(main(["What is 2 + 2? Answer with a number only."])))`
      },
      {
        h: `An Inspect AI task`,
        p: [
          `Inspect structures an eval as a dataset of <code>Sample</code>s, a list of solvers (prompt transformations, generation, tool loops) and a scorer. <code>epochs</code> repeats every sample, which is how you get repetitions for the variance analysis from the statistics lesson. Run it with <code>inspect eval addition.py --model anthropic/claude-opus-5-5</code> and browse the logs with <code>inspect view</code>. The task definition below imports cleanly against the current <code>inspect-ai</code> package.`
        ],
        code: `from inspect_ai import Task, task
from inspect_ai.dataset import Sample
from inspect_ai.scorer import match
from inspect_ai.solver import generate, system_message


@task
def addition():
    return Task(
        dataset=[Sample(input="What is 17 + 25? Reply with the number only.", target="42"),
                 Sample(input="What is 9 + 10? Reply with the number only.", target="19")],
        solver=[system_message("You are a careful calculator."), generate()],
        scorer=match(),
        epochs=3,
    )`
      },
      {
        h: `Failure modes at scale`,
        p: [
          `<ul><li><b>Retry storms</b>: zero-delay retries multiply load exactly when the provider is overloaded. Always back off with jitter and cap attempts.</li><li><b>Silent model substitution</b>: an alias resolving to a new snapshot, or a fallback, mid-run. Read <code>model</code> from every response and fail the attempt on mismatch.</li><li><b>Order effects</b>: running variant A in the morning and B in the afternoon confounds the variant with load and cache warmth. Interleave variants and randomize case order.</li><li><b>Cache-key omissions</b>: forgetting the system prompt or tool list in the key returns stale outputs after a change. Include a harness version string and bump it.</li><li><b>Latency contamination</b>: measuring time including queueing behind the semaphore and backoff sleeps. Time only the successful request, record wall-clock separately.</li><li><b>Unbounded memory</b>: holding 100k responses in a list before writing. Stream rows to disk as they finish.</li></ul>`
        ]
      },
      {
        h: `Cost accounting`,
        p: [
          `Record input, output, cache-read and cache-write tokens per row from the response's <code>usage</code>, and compute cost from those and the row's actual model at its real rates (cache reads are much cheaper than base input, batch is half price). Track judge cost separately from system cost. Estimate the bill on a 1% sample before the full run, and make the runner refuse to start if the projected cost exceeds a configured budget.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Franky's Cola Supply Line`,
      text: [
        `Franky needs cola delivered from a dock that serves only a few barrels per minute. When the whole crew runs to the dock at once, the dockmaster turns most of them away, they all come back at exactly the same moment, and get turned away again. Franky fixes it in steps.`,
        `He hands out eight dock passes, and only crew holding a pass can stand in line, which keeps the dock busy without a crowd. Anyone turned away waits longer each time, and a random extra bit so nobody returns in a pack. Each barrel gets a label with exactly what was ordered, so if the same order comes up again, Franky takes it from the ship's store instead of the dock. Every delivered barrel is written in the logbook the moment it arrives, so if a storm interrupts the run, the crew picks up where the log ends. Orders that never arrived go on a separate page, not counted as "bad cola". And for the big monthly order that nobody needs today, Franky uses the dock's slow bulk service at half price.`,
        `Finally, when Usopp brings back an unknown bottle labeled "definitely cola", Franky opens it inside a sealed barrel on the deck, away from the engine room.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: `Joey Orders 200 Pizzas for the Fundraiser`,
      text: [
        `Joey calls every pizza place in Manhattan at once and gets put on hold everywhere. Chandler takes over: five calls at a time, and when a shop says "call back later", wait a bit longer each time, with a random pause so they do not all call back on the hour.`,
        `Monica keeps a spreadsheet with every order the moment it is confirmed, so when the phone battery dies they do not reorder the same pizzas. Orders the shops never confirmed go on a separate list, because "the shop never answered" is not the same as "the pizza was bad". For the next day's 300 pizzas, Ross finds a bulk order form at half price that just takes a day.`
      ]
    },
    why: `The dock passes are a semaphore bounding concurrency. Waiting longer each time with a random extra is exponential backoff with jitter. Labeled barrels in the ship's store are a request-hash cache; the logbook written on arrival is an append-only, resumable results file; the separate page for undelivered orders is the error sidecar that keeps infrastructure failures out of the score. The slow bulk service is the batch API, and opening the unknown bottle in a sealed barrel is sandboxed execution.`
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'dock', emoji: '⚓', label: 'dock (rate limit)', x: 85, y: 30 },
      { id: 'passes', emoji: '🎟️', label: '8 dock passes', x: 50, y: 15 },
      { id: 'store', emoji: '🗄️', label: 'ship store (cache)', x: 15, y: 25 },
      { id: 'log', emoji: '📓', label: 'logbook (results.jsonl)', x: 15, y: 78 },
      { id: 'errs', emoji: '📄', label: 'undelivered page', x: 50, y: 85 },
      { id: 'bulk', emoji: '🚚', label: 'bulk service (batch)', x: 85, y: 80 }
    ],
    actors: [
      { id: 'franky', emoji: '🦾', label: 'Franky', x: 45, y: 50 },
      { id: 'crew', emoji: '👥', label: 'crew', x: 65, y: 50 }
    ],
    steps: [
      { c: `The whole crew rushes the dock at once. Most are turned away and all return together: a thundering herd of 429s.`, a: { crew: [80, 45] }, p: { dock: 'bad' } },
      { c: `Franky hands out eight passes. Only pass holders queue: a semaphore sized to the dock's rate.`, a: { crew: [65, 40] }, p: { passes: 'lit', dock: '' } },
      { c: `Turned away? Wait longer each time, plus a random extra: exponential backoff with full jitter.`, a: { crew: [72, 55] }, p: { dock: 'lit' } },
      { c: `Every order is labeled by its exact contents. A repeat order comes from the ship's store: a request-hash cache.`, a: { franky: [25, 40] }, p: { store: 'good' } },
      { c: `Each barrel is logged on arrival. After a storm, the run resumes from the log instead of reordering.`, a: { franky: [25, 65] }, p: { log: 'good' } },
      { c: `Orders that never arrived go on a separate page, not scored as bad cola: the error sidecar.`, a: { franky: [45, 72] }, p: { errs: 'lit' } },
      { c: `The big monthly order goes by the slow bulk service at half price: the Message Batches API.`, a: { crew: [80, 70] }, p: { bulk: 'good', passes: 'dim' } }
    ]
  },
  conceptFlow: {
    title: `One case through a production eval runner`,
    intro: `Every box is a place real runs break. Click through in order.`,
    stages: [
      { label: 'Plan', nodes: [
        { id: 'resume', text: 'skip (case, rep)\nalready in results' },
        { id: 'key', text: 'sha256(canonical\nrequest) = key' } ] },
      { label: 'Fetch', nodes: [
        { id: 'cache', text: 'cache hit?\nreturn stored' },
        { id: 'sem', text: 'acquire semaphore\n(N in flight)' },
        { id: 'retry', text: '429/5xx -> backoff\n+ jitter, log attempt' } ] },
      { label: 'Check', nodes: [
        { id: 'timeout', text: 'wall-clock ceiling\nper case' },
        { id: 'model', text: 'served model ==\nrequested model' } ] },
      { label: 'Grade', nodes: [
        { id: 'sandbox', text: 'execute in container\nno network, limits' } ] },
      { label: 'Persist', nodes: [
        { id: 'results', text: 'results.jsonl\nappend + fsync' },
        { id: 'errors', text: 'errors.jsonl\nnever scored' } ] }
    ],
    steps: [
      { active: ['resume'], note: 'On start, read the keys already in results.jsonl and skip them. A crashed run resumes for free.' },
      { active: ['key'], note: 'Hash the canonical request (sorted keys) including model, system prompt, tools, params, repetition index and harness version.' },
      { active: ['cache'], note: 'A cache hit returns the stored response with zero API calls, so re-analysis and recovery are free and reproducible.' },
      { active: ['sem'], note: 'A miss waits for a semaphore slot. N comes from Little’s law and the binding rate limit.' },
      { active: ['retry'], note: 'Transient errors back off with full jitter, honoring retry-after. Client errors raise immediately. The attempt count is recorded.' },
      { active: ['timeout'], note: 'A total wall-clock ceiling around the whole case, retries included, frees the slot even if a stream hangs.' },
      { active: ['model'], note: 'Assert the response’s model field. A silent substitution would make the score measure the wrong system.' },
      { active: ['sandbox'], note: 'Model-written code runs in a disposable, locked-down container with its own timeout.' },
      { active: ['results'], note: 'Scorable outputs are appended with usage, latency, attempts and stop_reason, then flushed to disk.' },
      { active: ['errors'], note: 'Timeouts, exhausted retries and mismatches go to the error sidecar with a failure class and are retried next run, never averaged in as zeros.' }
    ]
  },
  tech: [
    {
      q: `Why "full jitter" rather than adding a small random amount to the exponential delay?`,
      a: [`With "exponential plus small jitter", clients that failed together still retry in a tight cluster around the same deadline, so they collide again. Full jitter draws the whole delay uniformly from [0, min(cap, base x 2<sup>attempt</sup>)], which spreads the retries across the entire window. Its expected delay is half the exponential value, and it minimizes total contention in simulations of many competing clients, which is the conclusion of AWS's analysis of backoff variants. Honor a server's retry-after as a lower bound on top of it.`]
    },
    {
      q: `Why must the cache key be computed from canonical JSON?`,
      a: [`Two dicts with the same content can serialize differently (key order, whitespace, Unicode escaping), and a hash of the raw serialization would then miss the cache for identical requests. <code>sort_keys=True</code> plus fixed separators produces one canonical byte string per logical request. Floats and nested lists also need stable formatting, which <code>json.dumps</code> provides. The same idea underlies content-addressed build caches like Bazel's.`]
    },
    {
      q: `What actually happens when <code>asyncio.wait_for</code> times out?`,
      a: [`It cancels the wrapped task by raising <code>CancelledError</code> inside it at its current await point, waits for the cancellation to complete, and raises <code>TimeoutError</code> (<code>asyncio.TimeoutError</code>, an alias of the builtin <code>TimeoutError</code> since Python 3.11) in the caller. Any <code>async with sem</code> block inside the cancelled task exits normally, so the semaphore slot is released. Code that swallows <code>CancelledError</code> breaks this, which is a classic source of runners that hang at 99%.`]
    },
    {
      q: `Why does Anthropic return 529 and how is it different from 429?`,
      a: [`429 means your organization exceeded its own rate limit; slowing down fixes it, and the response tells you when to retry. 529 means the API as a whole is temporarily overloaded, independent of your usage. Both are transient and both are retried by the SDK with backoff, but they call for different responses at scale: 429s mean your concurrency is set too high for your tier, while sustained 529s are a reason to pause the run or shift non-urgent work to the Batches API.`]
    }
  ],
  code: {
    title: `A resumable, cached, rate-limit-aware runner (offline)`,
    intro: `The mock client rate-limits 15% of calls, returns overloaded errors on 5%, hangs on 2% and answers wrong 10% of the time. Run it twice in an empty directory: the first run scores what it can and records the hung cases as errors; the second run resumes, retries only the errored cases, and finishes.`,
    code: `# eval_runner.py - a resumable, cached, rate-limit-aware async eval runner.
# Runs offline against a mock client that rate-limits, errors and hangs.
# Run: python3 eval_runner.py   (run it twice: the second run resumes and hits the cache)
import asyncio
import hashlib
import json
import os
import random
import sqlite3
import time

RESULTS, ERRORS, CACHE_DB = "results.jsonl", "errors.jsonl", "cache.sqlite"
CONCURRENCY, MAX_ATTEMPTS, CASE_TIMEOUT_S = 8, 6, 2.0


# ---------------------------------------------------------------- mock API
class RateLimited(Exception):
    def __init__(self, retry_after):
        self.retry_after = retry_after


class ServerError(Exception):
    pass


class MockClient:
    """Stands in for an async LLM client: 15% 429s, 5% 5xx, 2% hangs."""
    def __init__(self, seed=0):
        self.rng = random.Random(seed)
        self.calls = 0

    async def create(self, model, messages, max_tokens):
        self.calls += 1
        r = self.rng.random()
        await asyncio.sleep(self.rng.uniform(0.01, 0.05))
        if r < 0.15:
            raise RateLimited(retry_after=0.05)
        if r < 0.20:
            raise ServerError("529 overloaded")
        if r < 0.22:
            await asyncio.sleep(3600)                      # a hung connection
        q = messages[-1]["content"]
        a, b = map(int, q.split("+"))
        answer = a + b if self.rng.random() > 0.1 else a + b + 1   # 10% wrong
        return {"model": model, "text": str(answer), "stop_reason": "end_turn",
                "usage": {"input_tokens": 12, "output_tokens": 3}}


# ---------------------------------------------------------------- cache
def request_key(params: dict) -> str:
    """Hash of the canonical request: same model + params + messages -> same key."""
    blob = json.dumps(params, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(blob.encode()).hexdigest()


class Cache:
    def __init__(self, path):
        self.db = sqlite3.connect(path)
        self.db.execute("CREATE TABLE IF NOT EXISTS c (k TEXT PRIMARY KEY, v TEXT)")

    def get(self, k):
        row = self.db.execute("SELECT v FROM c WHERE k = ?", (k,)).fetchone()
        return json.loads(row[0]) if row else None

    def put(self, k, v):
        self.db.execute("INSERT OR REPLACE INTO c VALUES (?, ?)", (k, json.dumps(v)))
        self.db.commit()


# ---------------------------------------------------------------- retries
def backoff_delay(attempt: int, base=0.05, cap=2.0, rng=random) -> float:
    """Exponential backoff with full jitter: uniform(0, min(cap, base * 2**attempt))."""
    return rng.uniform(0, min(cap, base * 2 ** attempt))


async def call_with_retry(client, params):
    for attempt in range(MAX_ATTEMPTS):
        try:
            return await client.create(**params), attempt + 1
        except RateLimited as e:
            await asyncio.sleep(max(e.retry_after, backoff_delay(attempt)))
        except ServerError:
            await asyncio.sleep(backoff_delay(attempt))
    raise RuntimeError(f"gave up after {MAX_ATTEMPTS} attempts")


# ---------------------------------------------------------------- runner
def append_jsonl(path, row):
    with open(path, "a") as f:
        f.write(json.dumps(row) + "\\n")
        f.flush()
        os.fsync(f.fileno())            # a crash never leaves a half-written row


def done_ids(path):
    if not os.path.exists(path):
        return set()
    with open(path) as f:
        return {json.loads(line)["case_id"] for line in f if line.strip()}


async def run_case(case, client, cache, sem, stats):
    params = {"model": "mock-model-1", "max_tokens": 16,
              "messages": [{"role": "user", "content": case["q"]}]}
    key = request_key(params)
    async with sem:                                   # at most CONCURRENCY in flight
        t0 = time.monotonic()
        try:
            cached = cache.get(key)
            if cached is not None:
                resp, attempts = cached, 0
                stats["cache_hits"] += 1
            else:
                # hard wall-clock ceiling on the whole case, retries included
                resp, attempts = await asyncio.wait_for(call_with_retry(client, params),
                                                        CASE_TIMEOUT_S)
                assert resp["model"] == params["model"], "served model mismatch"
                cache.put(key, resp)
        except (asyncio.TimeoutError, RuntimeError) as e:
            append_jsonl(ERRORS, {"case_id": case["id"], "error": type(e).__name__,
                                  "detail": str(e)})
            return
    append_jsonl(RESULTS, {"case_id": case["id"], "request_key": key[:16],
                           "output": resp["text"], "correct": resp["text"] == case["gold"],
                           "attempts": attempts, "latency_s": round(time.monotonic() - t0, 3),
                           "usage": resp["usage"], "stop_reason": resp["stop_reason"]})


async def main():
    rng = random.Random(1)
    cases = []
    for i in range(200):
        a, b = rng.randint(1, 99), rng.randint(1, 99)
        cases.append({"id": f"add-{i:03d}", "q": f"{a}+{b}", "gold": str(a + b)})
    finished = done_ids(RESULTS)
    todo = [c for c in cases if c["id"] not in finished]       # resume: skip done rows
    print(f"{len(finished)} already done, {len(todo)} to run")
    if os.path.exists(ERRORS):
        os.remove(ERRORS)                                      # errored cases get retried
    client, cache, sem = MockClient(seed=0), Cache(CACHE_DB), asyncio.Semaphore(CONCURRENCY)
    stats = {"cache_hits": 0}
    t0 = time.monotonic()
    await asyncio.gather(*(run_case(c, client, cache, sem, stats) for c in todo))
    rows = [json.loads(line) for line in open(RESULTS)]
    n_err = sum(1 for _ in open(ERRORS)) if os.path.exists(ERRORS) else 0
    acc = sum(r["correct"] for r in rows) / len(rows)
    print(f"wall {time.monotonic() - t0:.1f}s, API calls {client.calls}, cache hits {stats['cache_hits']}")
    print(f"scored rows {len(rows)}, error rows {n_err} (not scored as wrong), accuracy {acc:.3f}")
    print("max attempts on a scored row:", max(r["attempts"] for r in rows))


if __name__ == "__main__":
    asyncio.run(main())`,
    notes: [
      `Typical first run: about 250 API calls, roughly 193-195 scored rows and 5-7 error rows (the hangs, killed by the 2 s case ceiling), accuracy near 0.89. The exact split varies between runs because concurrent tasks draw from the mock's random stream in timing-dependent order, which is itself a small lesson in nondeterminism. Second run: only the errored cases are re-run, ending with 200 scored rows and accuracy 0.900.`,
      `Delete results.jsonl and run again: 200 cache hits and zero API calls, with identical accuracy. That is what makes re-analysis free.`,
      `The hung cases were never scored as wrong. Had 7 of them been scored as 0, accuracy would have read about 0.865 for reasons that have nothing to do with the model.`,
      `To point it at the real API, replace <code>MockClient.create</code> with the <code>AsyncAnthropic</code> call shown in the deep dive and map its exception classes onto the two retry branches.`
    ]
  },
  lab: {
    title: `Cache key, jittered backoff and bounded concurrency`,
    prompt: `Implement <code>request_key</code> (SHA-256 of canonical JSON, key order must not matter), <code>backoff_delay</code> (full jitter, capped), and <code>run_bounded</code>, which runs <code>fn(item)</code> for every item with at most <code>limit</code> in flight, wraps each call in <code>asyncio.wait_for</code>, returns results in input order, and returns the string <code>"timeout"</code> for items that exceed the timeout. The test makes item 3 hang and checks that peak concurrency never exceeds the limit.`,
    starter: `# runner_lab.py
import asyncio
import hashlib
import json
import random


def request_key(params: dict) -> str:
    """Same request -> same key, regardless of dict key order."""
    raise NotImplementedError


def backoff_delay(attempt: int, base: float = 0.5, cap: float = 30.0, rng=random) -> float:
    """Exponential backoff with full jitter."""
    raise NotImplementedError


async def run_bounded(fn, items, limit: int, timeout_s: float):
    """At most limit in flight, each with a timeout; results in input order;
    a timed-out item yields the string "timeout"."""
    raise NotImplementedError


if __name__ == "__main__":
    a = {"model": "m", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}
    b = {"max_tokens": 5, "messages": [{"content": "hi", "role": "user"}], "model": "m"}
    assert request_key(a) == request_key(b) and len(request_key(a)) == 64
    assert request_key(a) != request_key({**a, "max_tokens": 6})
    rng = random.Random(0)
    delays = [backoff_delay(k, rng=rng) for k in range(12)]
    assert all(0 <= d <= 30.0 for d in delays)

    in_flight, peak = 0, 0

    async def fake_call(x):
        global in_flight, peak
        in_flight += 1
        peak = max(peak, in_flight)
        await asyncio.sleep(10 if x == 3 else 0.01)    # item 3 hangs
        in_flight -= 1
        return x * x

    out = asyncio.run(run_bounded(fake_call, list(range(10)), limit=4, timeout_s=0.2))
    assert out[3] == "timeout" and out[4] == 16 and peak <= 4, (out, peak)
    print("all checks passed")
`,
    checks: [
      { re: 'sort_keys\\s*=\\s*True', flags: '', must: true, hint: 'Serialize with json.dumps(..., sort_keys=True) so key order does not matter', pass: 'canonical JSON' },
      { re: 'hashlib\\.sha256\\(', flags: '', must: true, hint: 'Hash the canonical bytes with hashlib.sha256(...).hexdigest()', pass: 'SHA-256 key' },
      { re: 'uniform\\(\\s*0\\s*,\\s*min\\(\\s*cap', flags: '', must: true, hint: 'Full jitter: rng.uniform(0, min(cap, base * 2 ** attempt))', pass: 'full jitter, capped' },
      { re: '2\\s*\\*\\*\\s*attempt', flags: '', must: true, hint: 'The window grows as base * 2 ** attempt', pass: 'exponential growth' },
      { re: 'asyncio\\.Semaphore\\(\\s*limit\\s*\\)', flags: '', must: true, hint: 'Create sem = asyncio.Semaphore(limit)', pass: 'semaphore sized by limit' },
      { re: 'async\\s+with\\s+sem', flags: '', must: true, hint: 'Hold the semaphore with async with sem: around the call', pass: 'bounded concurrency' },
      { re: 'asyncio\\.wait_for\\(', flags: '', must: true, hint: 'Wrap each call in asyncio.wait_for(fn(item), timeout_s)', pass: 'per-item timeout' },
      { re: 'asyncio\\.gather\\(', flags: '', must: true, hint: 'Use asyncio.gather to run all items and keep input order', pass: 'gather preserves order' }
    ],
    run: `Save as <code>runner_lab.py</code> and run <code>python3 runner_lab.py</code> (Python 3.10+). Then run the worked example twice in an empty directory and inspect <code>results.jsonl</code> and <code>errors.jsonl</code> with <code>head</code> and <code>wc -l</code>. With an API key, run the deep-dive <code>claude_runner.py</code> on 20 questions and look at the attempt counts.`,
    solution: `# runner_lab.py - the three building blocks of a scalable eval runner.
import asyncio
import hashlib
import json
import random


def request_key(params: dict) -> str:
    """Same request -> same key, regardless of dict key order."""
    blob = json.dumps(params, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode()).hexdigest()


def backoff_delay(attempt: int, base: float = 0.5, cap: float = 30.0, rng=random) -> float:
    """Exponential backoff with full jitter."""
    return rng.uniform(0, min(cap, base * 2 ** attempt))


async def run_bounded(fn, items, limit: int, timeout_s: float):
    """Run fn(item) for all items, at most \`limit\` at once, each with a wall-clock timeout.
    Return a list of results in input order; a timed-out item yields the string "timeout"."""
    sem = asyncio.Semaphore(limit)

    async def one(item):
        async with sem:
            try:
                return await asyncio.wait_for(fn(item), timeout_s)
            except asyncio.TimeoutError:
                return "timeout"

    return await asyncio.gather(*(one(x) for x in items))


if __name__ == "__main__":
    a = {"model": "m", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}
    b = {"max_tokens": 5, "messages": [{"content": "hi", "role": "user"}], "model": "m"}
    assert request_key(a) == request_key(b) and len(request_key(a)) == 64
    assert request_key(a) != request_key({**a, "max_tokens": 6})
    rng = random.Random(0)
    delays = [backoff_delay(k, rng=rng) for k in range(12)]
    assert all(0 <= d <= 30.0 for d in delays)

    in_flight, peak = 0, 0

    async def fake_call(x):
        global in_flight, peak
        in_flight += 1
        peak = max(peak, in_flight)
        await asyncio.sleep(10 if x == 3 else 0.01)    # item 3 hangs
        in_flight -= 1
        return x * x

    out = asyncio.run(run_bounded(fake_call, list(range(10)), limit=4, timeout_s=0.2))
    assert out[3] == "timeout" and out[4] == 16 and peak <= 4, (out, peak)
    print("all checks passed")`,
    notes: [
      `Putting <code>wait_for</code> inside <code>async with sem</code> means the timeout clock starts when the slot is acquired, so queueing does not count against the item. Put it outside if you want a deadline that includes queueing.`,
      `<code>gather</code> returns results in the order of its arguments, not completion order. For streaming results to disk as they finish, use <code>asyncio.as_completed</code> and carry the case id with each result.`
    ]
  },
  quiz: [
    {
      q: `Calls take about 6 s and your limit is about 600 requests per minute. Roughly what concurrency saturates the limit?`,
      options: [`6`, `60`, `600`, `3,600`],
      correct: 1,
      explain: `Little's law: 10 requests/s x 6 s = 60 in flight. More just produces 429s; fewer wastes capacity.`
    },
    {
      q: `Which error should your eval runner NOT retry?`,
      options: [`429 rate limited`, `529 overloaded`, `400 invalid request`, `A connection reset`],
      correct: 2,
      explain: `A malformed request fails the same way every time. Fix the request; retrying only burns budget.`
    },
    {
      q: `A run crashed at 70%. What design lets you finish without re-paying for the first 70%?`,
      options: [`Higher max_retries`, `Append-only results keyed by (case, rep), skipped on restart, plus a request-hash cache`, `A bigger semaphore`, `Batching all requests into one`],
      correct: 1,
      explain: `Idempotent, resumable output plus a response cache make restarts free and reproducible.`
    },
    {
      q: `When is the Message Batches API a poor fit?`,
      options: [`Scoring 50,000 single-turn QA items overnight`, `A judge pass over stored outputs`, `A multi-turn agent eval where each step depends on executing tools`, `Re-running a static benchmark for a new model`],
      correct: 2,
      explain: `Each agent turn depends on the previous response and on tool results, so it cannot be submitted up front. Batch fits independent, single-shot requests.`
    },
    {
      q: `During a run, 3% of cases time out after retries. How should they appear in the results?`,
      options: [`As score 0`, `As score 1, to be fair`, `In a separate errors file with a failure class, excluded from the mean and retried later`, `Silently dropped`],
      correct: 2,
      explain: `Infrastructure failures are not model failures. Separate them, count them, and retry them.`
    }
  ],
  pitfalls: [
    `Retrying without jitter, or with zero delay. Synchronized retries keep colliding and can turn an overload into an outage of your run.`,
    `Writing an infrastructure failure (timeout, 429 after retries, truncation) into the results as a wrong answer.`,
    `A cache key that omits the system prompt, tools, effort or harness version, so a changed setup silently reuses stale outputs.`,
    `Holding the semaphore during backoff sleeps, which idles every slot during a burst of 429s.`,
    `Running model-written code with <code>exec</code> or a bare subprocess on the host instead of a no-network, resource-limited container.`
  ],
  interview: [
    {
      q: `Design (whiteboard): run a 20,000-item eval with 5 repetitions across 4 model variants, with an LLM judge, by tomorrow morning.`,
      a: [`That is 400,000 generation calls plus up to 400,000 judge calls. Generation for single-turn items goes through the Batches API at half price, one batch per variant per 100k requests, with custom_id = variant:item:rep; the judge pass goes through batches too once outputs are in. If anything needs online calls (multi-turn items), an async runner with a semaphore sized by Little's law from each variant's rate limit, full-jitter backoff, and max_retries=0 so attempts are logged. All responses land in a request-hash cache and an append-only results table keyed by (variant, item, rep); errors go to a sidecar and are resubmitted. I verify the served model on every response, project cost from a 1% pilot and gate the full run on a budget, interleave variants to avoid time-of-day confounds, and convert to Parquet for the paired, clustered analysis.`]
    },
    {
      q: `How do you implement retries correctly for LLM API calls?`,
      a: [`Classify errors first: retry 429, 408/409, 5xx including 529 overloaded, and connection errors; raise immediately on other 4xx. Back off exponentially with full jitter, uniform(0, min(cap, base x 2^attempt)), using retry-after as a floor. Cap attempts, log each attempt with its error class, release concurrency slots while sleeping, and put a total wall-clock ceiling on the case. In evals, record the attempt count on the row so retried calls can be excluded from latency, and never let a case that exhausted retries become a 0 in the score.`]
    },
    {
      q: `Tradeoff: one big asyncio process vs many worker processes pulling from a queue.`,
      a: [`A single asyncio process handles thousands of concurrent network requests cheaply, because calls are I/O-bound; it is simple and easy to reason about rate limits in. It falls short when grading is CPU-heavy (executing tests, parsing large outputs) or when one machine's network or memory is the bottleneck, and a crash takes down everything in flight. A queue plus workers scales horizontally and isolates failures, but needs a shared rate limiter (or per-worker budgets), idempotent claiming of tasks, and a shared results store. My default is asyncio for generation and judging, with a process or container pool for sandboxed execution behind it.`]
    },
    {
      q: `Explain the difference between response caching and prompt caching.`,
      a: [`Response caching is yours: you hash the full request and store the response locally, so an identical request is never sent again. It makes reruns free and analysis reproducible, and you must include anything that changes the output in the key. Prompt caching is the provider's: the server stores the processed prefix of a prompt (tools, system, earlier messages up to a cache breakpoint), so later requests sharing that prefix are cheaper and faster, but the model still generates a new response. It is a prefix match, so any byte change before the breakpoint invalidates it; you verify it through the cache-read token counts in usage. In evals with a long shared rubric or few-shot block, both apply.`]
    },
    {
      q: `How would you sandbox execution of model-generated code at scale?`,
      a: [`One disposable container per sample (or a pool reset between samples), from a prebuilt image with dependencies pinned. Flags: no network, memory and CPU caps, a pids limit against fork bombs, read-only root with a small tmpfs, a non-root user, all capabilities dropped and no-new-privileges. Timeouts inside the container and an outer kill. For hostile code, gVisor or Firecracker microVMs, because containers share the host kernel. The grader reads only the exit code and a results file from a mounted output directory, and the tests and answer key are not reachable from inside the sandbox.`]
    },
    {
      q: `When would you use lm-evaluation-harness vs Inspect vs your own runner?`,
      a: [`lm-evaluation-harness when I need standard academic tasks with numbers comparable to papers, especially log-likelihood multiple-choice on local models. Inspect when I am writing new evals that involve tools, agents, sandboxes and repetitions, and want good logging and a viewer. SWE-bench's own harness for SWE-bench. My own thin runner (or an Inspect task wrapping it) for product evals, because the system under test must be the real application entry point with its real prompts and tools, and a re-implementation inside a framework silently measures something else.`]
    },
    {
      q: `Your eval run takes 9 hours and you suspect most of it is waiting. How do you find out?`,
      a: [`Instrument the runner: per call, record time queued for the semaphore, time in backoff sleeps, request latency, grading time, and the attempt count. If queueing dominates, concurrency is too low for the rate limit; if backoff dominates, it is too high or you are hitting token limits; if grading dominates, the sandbox pool is the bottleneck. Compare achieved requests and tokens per minute against your limits. Then decide: raise concurrency, cut tokens (shorter prompts, prompt caching), parallelize grading, or move the whole thing to the Batches API if nobody needs it before tomorrow.`]
    }
  ]
};
