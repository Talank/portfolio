window.LESSONS = window.LESSONS || {};
window.LESSONS['batch-rendering-async'] = {
  id: 'batch-rendering-async',
  title: 'Batch Rendering: Async, Concurrency & Retries at Scale',
  category: 'Part 3 — Pipeline Engineering',
  timeMin: 35,
  summary: 'You have chunks and a cache; now you have to render hundreds of them without waiting an hour or crashing on line 300. This lesson is the batch renderer: run many synthesis jobs concurrently instead of one-at-a-time, bound that concurrency so you don\'t melt the machine, retry the transient failures, and let a crash resume from the cache instead of starting over. The key insight is that rendering many lines is an embarrassingly parallel problem sitting on top of a cache that already makes it idempotent and resumable — so the renderer stays simple: a bounded pool of workers pulling from a queue of cache-misses, each one deterministic and safely re-runnable. This is how a 600-line episode renders in minutes, and how re-rendering only the changed 168 clips stays fast.',
  goals: [
    'See rendering a script as an embarrassingly parallel batch of independent, cacheable jobs',
    'Run synthesis concurrently with a BOUNDED worker pool, and explain why the bound matters (CPU/GPU/RAM limits)',
    'Add retries with backoff for transient failures, while letting deterministic failures fail loudly',
    'Rely on the cache to make the batch idempotent and resumable — a crash re-runs only the unfinished work',
    'Report progress and surface failures so a long build is observable, not a black box'
  ],
  concept: [
    {
      h: 'Rendering is embarrassingly parallel — on top of a cache',
      p: [
        'Each line renders <b>independently</b>: line 200 doesn\'t depend on line 199, they share no state, and the order you produce them in doesn\'t matter (the manifest records order separately). That makes rendering a script an <b>embarrassingly parallel</b> problem — the best kind — where the naive serial approach (render line 1, wait, render line 2, wait…) leaves almost all your hardware idle. If one line takes half a second and you have 600 of them, serial is five minutes of one core working while the rest sleep; running many at once cuts that to a fraction. The batch renderer is the stage that exploits this: instead of a loop that blocks on each synthesis, it launches many syntheses concurrently and collects the results.',
        'Crucially, this parallelism sits <b>on top of the cache</b> from the last lesson, and that changes everything about how simple the renderer can be. Because each job is content-addressed and skip-if-exists, every job is <b>idempotent</b> (running it twice produces the same file and the second run is a no-op) and the whole batch is <b>resumable</b> (already-rendered lines are skipped, so you only ever work on the cache-misses). So the renderer\'s job is narrow: take the list of chunks, filter to the ones not yet on disk, and render those concurrently. You don\'t need transactions, coordination, or careful ordering — the cache already guarantees that doing a job twice is harmless and that a crash loses at most the in-flight jobs. Parallelism is easy precisely because the cache made each unit independent, safe to repeat, and safe to skip.'
      ]
    },
    {
      h: 'Bounded concurrency and retries',
      p: [
        'The temptation with an embarrassingly parallel problem is to launch <i>all</i> jobs at once — 600 syntheses simultaneously. That will crash or thrash: each synthesis uses CPU, memory, and (for GPU engines) VRAM, and launching 600 exhausts all of them, so you get out-of-memory errors, swap thrashing, or a GPU that OOMs. The fix is <b>bounded concurrency</b>: run at most N jobs at a time (a worker pool of size N, or a semaphore limiting N), where N is tuned to the hardware — roughly the number of CPU cores for a CPU engine, or however many model instances fit in VRAM for a GPU engine. Workers pull the next chunk from a queue, render it, and pull the next; N of them run in parallel and the rest wait their turn. This gives you the speedup of parallelism <i>without</i> the resource blowup of unbounded launch — the single most important tuning knob in the batch renderer.',
        'The second reality at scale is <b>failures</b>, and you must distinguish two kinds. <b>Transient</b> failures — a momentary resource hiccup, a flaky model load, an occasional timeout — are worth <b>retrying</b>, ideally with a short backoff (wait a bit, try again, maybe a couple of times), because they often succeed on the next attempt and a whole 600-line build shouldn\'t die because one line briefly failed. <b>Deterministic</b> failures — malformed input, a genuinely broken line, a missing voice — will fail identically every retry, so retrying just wastes time; these should fail LOUDLY and be reported, not silently swallowed. The discipline is: retry transient failures a bounded number of times with backoff, and after the retries are exhausted (or for an obviously-deterministic error), record the failure and move on rather than aborting the whole batch — one bad line shouldn\'t cost you the other 599, but you must know which line failed.'
      ]
    },
    {
      h: 'Idempotent, resumable, observable',
      p: [
        'Put it together and the batch renderer has three properties that make it robust for real, long-running builds. It\'s <b>idempotent</b>: because every job is content-addressed skip-if-exists, running the batch again is safe — finished lines are no-ops, so there\'s no double-rendering and no corruption from re-running. It\'s <b>resumable</b>: a crash on line 400 loses only whatever handful of jobs were mid-flight; re-running the batch skips the 399 already on disk and continues, so you never restart from zero. These two aren\'t things the renderer implements — they\'re inherited from the cache, which is exactly why building the cache first (last lesson) made this lesson easy. The renderer just has to not fight them: don\'t hold un-flushed state, write each clip to its final cache path as it completes, and a crash is merely a pause.',
        'The third property you DO have to build in: <b>observability</b>. A build that renders 600 lines over several minutes must not be a silent black box — you report progress (rendered X of N, Y cache hits, Z remaining), and you surface failures clearly (line 342 failed after 3 retries: <i>reason</i>). This matters because long builds fail in boring ways (one bad line, a resource limit), and without visibility you can\'t tell "still working" from "hung," or know which line to fix. So the renderer emits progress as it goes and produces a final summary — total lines, cache hits vs. renders, failures with reasons — which pairs naturally with the manifest\'s verification pass (every entry should map to an existing file; 0 missing). The whole stage is thus: filter to cache-misses, render them through a bounded worker pool with retries, report progress, and hand a verifiable, complete set of clips to playback. Simple, because the cache did the hard part; robust, because concurrency is bounded, failures are handled, and the whole thing is observable and safe to re-run.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky Runs the Shipyard Crew',
      text: [
        'Franky has to build 600 identical barrels for a voyage, and Luffy suggests he "just build them all at the same time!" Franky laughs. "Two problems, captain. If I try to build all six hundred at once, I run out of hands, wood, and space — the whole yard jams and NOTHING gets done. But if I build them one at a time while everyone else stands around? We\'ll be here till next winter." So he runs it right: a fixed number of workstations — as many as he has tools and space for — and a pile of orders. Each worker grabs the next order, builds one barrel, and grabs another. Enough going at once to be fast, not so many that the yard chokes.',
        'Then Usopp asks what happens when a barrel cracks mid-build. "Depends WHY," Franky says. "If a worker just slipped — bad luck, transient — they shake it off and try that one again, no big deal. But if the WOOD is rotten, it\'ll crack every single time, so retrying is pointless — set it aside, mark it, and TELL me which one, don\'t just quietly skip it." And the best part, he adds, is that finished barrels get stacked as they\'re done: "If a storm stops work halfway, we don\'t start over — the three hundred done barrels are DONE, we just pick up the orders we hadn\'t gotten to. And I keep a tally on the board so anyone can see: made so far, left to go, any that failed and why." Usopp: "So the trick isn\'t doing everything at once — it\'s doing a controlled amount at once, retrying the flukes, flagging the real breaks, and never redoing finished work." Franky: "SUPER."'
      ]
    },
    sitcom: {
      show: 'The Office',
      title: 'Dwight Optimizes the Mailing',
      text: 'The office has to stuff and send 5,000 mailers by end of day. Michael\'s plan is "everybody grab everything and go go go," which instantly turns into a paper tornado where nothing ships. Dwight seizes control. "STOP. We do not all grab everything — we jam the room. We set up FOUR stations. Each person takes the next batch, finishes it, takes another. Four at a time. Fast, but the room doesn\'t collapse." Jim, impressed despite himself: "He\'s... actually right." Dwight continues: "If an envelope jams — a fluke — you re-feed it, try again. But if a mailer is misprinted, it will jam EVERY time, so you don\'t keep retrying it forever like an idiot — you pull it, flag it, and tell me. And finished trays go on the shelf immediately, so if the copier dies at 3pm, we\'ve already SHIPPED half — we don\'t start over." He points at a whiteboard tally. "Stuffed: updated every hundred. So I always know if we\'re on pace or stuck." Michael: "...This is why I keep him."'
    },
    why: 'Franky and Dwight are running the batch renderer exactly. All-at-once jams the yard/room (unbounded concurrency exhausts CPU/GPU/RAM); one-at-a-time is too slow (serial rendering). The answer is BOUNDED concurrency — a fixed number of stations pulling the next job from the pile (a worker pool of size N over a queue of cache-misses). Failures split two ways: a fluke gets a retry (transient → retry with backoff), but a rotten-wood/misprint fails every time so you flag it loudly instead of retrying forever (deterministic → report, don\'t swallow). Finished work is banked immediately so a storm/copier-death doesn\'t restart you (idempotent + resumable via the cache), and a running tally keeps it observable. Controlled parallelism, smart retries, resume-don\'t-restart, and a visible tally.'
  },
  tech: [
    {
      q: 'Why is rendering a script "embarrassingly parallel," and why does the cache make exploiting that easy?',
      a: 'It\'s embarrassingly parallel because the units of work are fully independent: each line renders on its own, line N doesn\'t depend on line N-1, the jobs share no state, and production order doesn\'t matter (the manifest records the intended order separately). When work is independent like that, there\'s nothing to coordinate — you can run as many jobs simultaneously as your hardware allows and just collect the results, which is the easiest kind of parallelism to exploit and the highest-leverage, because the serial baseline (render one, block, render the next) wastes almost all your cores while a single line synthesizes. The cache makes exploiting it easy for two specific reasons rooted in the last lesson. First, idempotency: because each job is content-addressed and skip-if-exists, running a job twice is harmless — the second run just sees the file exists and no-ops — so you never have to worry about races producing duplicate or corrupt output, or about carefully ensuring each job runs exactly once. Second, resumability: since "done" means "file on disk," the batch can be filtered to just the cache-misses and a crash loses at most the in-flight jobs, so you don\'t need transactions, checkpoints, or coordination to make a long build robust. Together these mean the renderer doesn\'t need any of the hard machinery parallel systems usually require — no locking of shared state, no exactly-once delivery, no rollback — because the cache already guarantees that doing a unit twice is safe and that skipping done units is correct. So the renderer collapses to a simple shape: filter chunks to the un-rendered ones, and run those concurrently. The lesson-order matters here: building the content-addressed cache first is precisely what turned batch rendering from a distributed-systems problem into a bounded worker pool over a queue. The cache made each unit independent, repeatable, and skippable, and those are exactly the properties that make parallelism trivial.'
    },
    {
      q: 'Why bound the concurrency instead of launching all jobs at once, and how do you pick the bound?',
      a: 'Because "launch everything" exhausts finite resources and crashes or thrashes, even though the jobs are logically independent. Each synthesis consumes CPU, memory, and for GPU engines VRAM, and those are hard limits — launch 600 syntheses at once and you get out-of-memory kills, swap thrashing that makes everything slower than serial, or a GPU OOM. Independence means you CAN run them in any order and in parallel; it doesn\'t mean the machine can run all of them at the same instant. Bounded concurrency resolves this: cap the number of simultaneous jobs at N (a worker pool of N workers, or a semaphore admitting N), where workers pull the next chunk from a queue, render it, and pull again — so exactly N run at once and the rest wait, giving you the full speedup of parallelism without the resource blowup. Picking N is hardware-driven: for a CPU-bound engine like Piper, N near the number of physical cores is the sweet spot (more than that just context-switches without extra throughput, since the cores are the bottleneck); for a GPU engine, N is how many model instances fit in VRAM alongside their working memory (often small — maybe 1–4 — because each instance is heavy), and exceeding it OOMs the GPU. Memory can bind before cores if the model is large, so the real N is the minimum of "cores/GPU-slots" and "how many instances fit in RAM/VRAM." In practice you start with a reasonable guess (cores for CPU, a couple for GPU), watch utilization and memory headroom, and tune: raise N while throughput climbs and memory is safe, back off when you hit OOM or thrash. N is the single most important knob in the batch renderer — too low wastes hardware and time, too high crashes the build — and the right value is whatever keeps all your compute busy while staying comfortably under the memory ceiling.'
    },
    {
      q: 'How do you handle failures in a long batch — retries, and what NOT to retry?',
      a: 'By distinguishing transient from deterministic failures and treating them oppositely, so one bad line never kills a 600-line build but real problems still surface. Transient failures are momentary and likely to succeed on a retry: a brief resource hiccup, a flaky model load, an occasional timeout, a transient I/O error. These deserve retries with backoff — try again after a short wait, maybe a couple of times with increasing delay — because they\'re genuinely intermittent and it would be absurd to fail an entire build because one line hit a momentary snag. Deterministic failures are reproducible: malformed input, a genuinely broken line the engine can\'t handle, a missing/unknown voice, a bug. These will fail identically every single retry, so retrying wastes time and (worse) can mask the problem by burying it in retry noise; they should fail loudly and be reported clearly. The practical policy: attempt each job, and on failure retry a BOUNDED number of times with backoff (bounded so a persistent failure doesn\'t loop forever); if the retries are exhausted — or the error is obviously deterministic — record the failure with its reason and MOVE ON to the rest of the batch rather than aborting the whole run. The two anti-patterns to avoid are, on one side, aborting the entire batch on the first failure (one bad line costs you the other 599 and their compute), and on the other, silently swallowing failures (you "finish" with missing clips and never know, which the manifest verification would catch but only after the fact). The right middle is: retry the flukes, cap the retries, flag the persistent failures with actionable reasons, and keep the batch going — then the final summary and the manifest\'s "0 missing" check tell you exactly what, if anything, needs a human. This mirrors resilient job-processing everywhere: bounded retries with backoff for transient errors, dead-letter/report for the rest, and never let one poisoned item stop the queue.'
    }
  ],
  code: {
    title: 'A bounded, retrying, resumable batch renderer',
    intro: 'The batch stage: filter to cache-misses, render them through a bounded pool with bounded retries, keep going past failures, and report progress — all made safe by the content-addressed cache underneath.',
    code: `import os, time

def render_batch(chunks, out_dir, synth, concurrency=4, max_retries=2):
    # 1) RESUMABLE: only work on cache-misses (files not yet on disk).
    todo = [c for c in chunks
            if not os.path.exists(os.path.join(out_dir, c["key"] + ".wav"))]
    done, failed = 0, []
    hits = len(chunks) - len(todo)

    # 2) BOUNDED concurrency: a pool of size N pulls from the queue.
    #    (shown as a simple semaphore-style loop; real code uses a
    #     thread/async pool of 'concurrency' workers over 'todo'.)
    def render_one(c):
        path = os.path.join(out_dir, c["key"] + ".wav")
        for attempt in range(max_retries + 1):
            try:
                synth(c["spoken"], c["voice"], c["prosody"], path)  # write to cache path
                return True
            except TransientError:                 # 3) RETRY transient, with backoff
                if attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                return False                        # retries exhausted
            except Exception as e:                  # deterministic -> fail loud, don't retry
                failed.append((c["key"], repr(e)))
                return False

    for c in run_pool(todo, concurrency, render_one):   # N at a time
        if c: done += 1
        # 4) OBSERVABLE: progress as we go
        if (done + len(failed)) % 50 == 0:
            print(f"[render] {done} done, {hits} cached, {len(failed)} failed")

    return {"total": len(chunks), "cached": hits,
            "rendered": done, "failed": failed}   # final summary + reasons

# Crash mid-build? Re-run: the 'todo' filter skips everything already on
# disk, so you resume from where you stopped — never from zero.`,
    notes: [
      'The `todo` filter is the whole resumability story — it\'s just "which cache files are missing," inherited free from content-addressing. A crash loses only in-flight jobs.',
      'Transient errors retry with backoff; anything else is recorded with its reason and the batch keeps going. One poisoned line never aborts the run, but the summary tells you exactly which failed and why.'
    ]
  },
  lab: {
    title: 'Render with bounded retries, keep going past failures',
    prompt: 'Implement <code>render_with_retries(job, do_render, max_retries)</code>. <code>do_render(job)</code> attempts one render and either returns <code>True</code> on success or raises an exception on failure. Retry on failure up to <code>max_retries</code> ADDITIONAL times (so total attempts = <code>max_retries + 1</code>). Return <code>True</code> as soon as an attempt succeeds. If all attempts fail, return <code>False</code> (do NOT let the exception propagate — one failed job must not crash the batch). Count attempts correctly: with <code>max_retries=2</code> you make at most 3 attempts.',
    starter: `def render_with_retries(job, do_render, max_retries):
    # try up to max_retries+1 times; True on first success, False if all fail
    pass`,
    checks: [
      { re: 'def\\s+render_with_retries\\s*\\(', flags: '', must: true, hint: 'Define render_with_retries(job, do_render, max_retries).', pass: 'render_with_retries defined ✓' },
      { re: 'try\\s*:|except', flags: '', must: true, hint: 'Catch the exception so one failure does not crash the batch.', pass: 'exception handling present ✓' },
      { re: 'range\\s*\\(', flags: '', must: true, hint: 'Loop over attempts (max_retries + 1).', pass: 'attempt loop present ✓' }
    ],
    tests: `# succeeds first try -> True, 1 attempt
calls = {"n": 0}
def ok(j):
    calls["n"] += 1; return True
assert render_with_retries("a", ok, 2) is True
assert calls["n"] == 1
# fails twice then succeeds -> True, 3 attempts, within max_retries=2
seq = {"n": 0}
def flaky(j):
    seq["n"] += 1
    if seq["n"] < 3: raise RuntimeError("transient")
    return True
assert render_with_retries("b", flaky, 2) is True
assert seq["n"] == 3
# always fails -> False (not an exception), exactly max_retries+1 attempts
bad = {"n": 0}
def always(j):
    bad["n"] += 1; raise RuntimeError("broken")
assert render_with_retries("c", always, 2) is False
assert bad["n"] == 3
print("retry logic correct")`,
    solution: `def render_with_retries(job, do_render, max_retries):
    for attempt in range(max_retries + 1):
        try:
            if do_render(job):
                return True
        except Exception:
            pass
    return False`,
    notes: [
      'range(max_retries + 1) makes total attempts = retries + 1: max_retries=2 → 3 tries, exactly as the "fails twice then succeeds" and "always fails" tests verify.',
      'Catching the exception and returning False (instead of re-raising) is what keeps one poisoned job from crashing the whole batch — the batch records the failure and moves on.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two scale realities: async I/O vs. thread pools vs. process pools, and backpressure between rendering and playback.',
    sections: [
      {
        h: 'Async vs. threads vs. processes: match the pool to the bottleneck',
        p: 'Bounded concurrency has three common implementations, and the right one depends on what the synthesis actually does under the hood. If synthesis is I/O-bound — it sends work to a subprocess, a local server, or (as in the cloud edge-tts case) a network endpoint, and mostly WAITS — then async I/O or a thread pool is ideal: many jobs can be "in flight" while each waits, and you get high concurrency cheaply because the waiting overlaps. This is why the cloud pipeline used async: it was waiting on network calls, and async let hundreds of requests be outstanding at once. If synthesis is CPU-bound in Python — the model runs in-process and burns CPU — then a THREAD pool won\'t help for the compute itself (the GIL serializes Python-level CPU work), and you want a PROCESS pool (or a library that releases the GIL in native code, as many ML runtimes do) so multiple cores actually run in parallel. If synthesis is GPU-bound, the bound isn\'t cores at all but VRAM and the GPU\'s own scheduling, so concurrency is limited to how many model instances fit and you often serialize onto one or a few GPU contexts. The practical guidance: identify the bottleneck (network wait → async/threads; CPU compute → processes or native-parallel; GPU → few instances bounded by VRAM), size the pool to that bottleneck, and don\'t assume more threads means more speed — for CPU-bound Python work it can mean the same speed with more overhead. The good news is that because the cache made jobs independent and idempotent, you can switch the execution strategy (async ↔ threads ↔ processes) without changing the rest of the pipeline — the pool is a swappable detail behind "run these independent jobs, N at a time," much like engines are swappable behind synth().'
      },
      {
        h: 'Backpressure: don\'t render faster than you can consume',
        p: 'When rendering feeds directly into streaming playback (from the chunking lesson\'s streaming payoff), producer and consumer run at different speeds, and you need backpressure so the fast side doesn\'t overwhelm the slow side. Usually rendering is slower than playback for the FIRST clip (you wait to render sentence one) but can be faster overall once warmed up, so an unbounded renderer could race ahead and buffer hundreds of finished clips in memory while the player is still on clip three — wasting memory and doing work that may never be needed if the user stops listening. A bounded queue between renderer and player provides backpressure automatically: the renderer fills the queue up to a cap and then BLOCKS until the player drains a slot, so rendering runs just far enough ahead to keep playback fed without stockpiling. This producer/consumer-with-a-bounded-buffer is the classic pattern, and it has two nice properties here: it bounds memory (at most queue-size clips buffered) and it makes the system responsive to the consumer (stop listening → player stops draining → queue fills → renderer pauses, so you don\'t waste compute rendering clips no one will hear). For an offline full-build (render everything to disk, play later) you don\'t need this — you just render the whole batch — but for an interactive, streaming experience it matters, and it composes cleanly with the cache: clips the renderer produces are written to the cache as usual, so even backpressure-paused work isn\'t lost — if the user resumes, the already-rendered clips are cache hits. The general lesson is that at scale you think not just about doing work fast but about matching production rate to consumption rate, and a bounded buffer is the simple, robust mechanism that does it.'
      }
    ]
  },
  quiz: [
    {
      q: 'Rendering a script is "embarrassingly parallel" because:',
      options: ['It embarrasses the CPU', 'Each line renders independently — no shared state, no ordering dependency — so jobs can run concurrently with no coordination', 'It can only run on one core', 'Lines must render in sequence'],
      correct: 1,
      explain: 'Independent, stateless, order-free units are the easiest parallelism. The cache makes them idempotent and resumable too, so the renderer needs no locking or transactions.'
    },
    {
      q: 'Why bound concurrency instead of launching all 600 jobs at once?',
      options: ['To be polite', 'Each job uses CPU/RAM/VRAM; launching all at once exhausts them (OOM, thrash, GPU OOM). A pool of N gives speedup without the blowup', 'Bounded is slower but simpler', 'The cache requires it'],
      correct: 1,
      explain: 'Independence means you CAN parallelize, not that the machine can run all at once. Cap at N (≈cores for CPU, VRAM-fit for GPU) — the single most important tuning knob.'
    },
    {
      q: 'Which failures should you retry, and which should you not?',
      options: ['Retry everything forever', 'Retry TRANSIENT failures (hiccups, timeouts) with backoff; do NOT keep retrying DETERMINISTIC ones (malformed input) — they fail identically every time', 'Never retry anything', 'Retry only the last line'],
      correct: 1,
      explain: 'Transient errors often succeed on retry; deterministic ones waste time and mask the problem. Retry transient with bounded backoff, flag persistent failures loudly with reasons.'
    },
    {
      q: 'A crash on line 400 of a 600-line build means, on re-run:',
      options: ['Start over from line 1', 'Skip the ~399 already on disk and continue — the batch is resumable because the cache makes "done" mean "file exists"', 'The whole cache is lost', 'Only line 400 is recoverable'],
      correct: 1,
      explain: 'Resumability is inherited from the content-addressed cache: re-running filters to cache-misses, losing at most the in-flight jobs. You never restart from zero.'
    },
    {
      q: 'One line fails after all retries. The batch should:',
      options: ['Abort the whole build', 'Silently skip it and report success', 'Record the failure with its reason, keep rendering the rest, and surface it in the final summary', 'Retry it forever'],
      correct: 2,
      explain: 'One poisoned line shouldn\'t cost the other 599, but you must KNOW it failed. Flag it with an actionable reason, continue, and the summary + manifest "0 missing" check catches it.'
    }
  ],
  pitfalls: [
    'Launching all jobs at once because they\'re "independent." Exhausts CPU/RAM/VRAM → OOM or thrash. Bound concurrency to a pool of N sized to the hardware.',
    'Rendering serially (one line, wait, next). Leaves nearly all your hardware idle — five minutes of work that could be under a minute. Exploit the embarrassing parallelism.',
    'Retrying deterministic failures (malformed input, missing voice) — they fail identically every time, wasting time and masking the real problem. Retry transient only; flag the rest loudly.',
    'Aborting the whole batch on the first failure, or silently swallowing failures. One bad line shouldn\'t cost 599 others, but a "finished" build with missing clips you never noticed is worse. Record, continue, summarize.',
    'A silent, un-observed long build — you can\'t tell "working" from "hung," or which line to fix. Report progress and a final summary (rendered/cached/failed with reasons), paired with manifest verification.'
  ],
  interview: [
    {
      q: 'Design a batch renderer for a 600-line script that\'s fast, doesn\'t crash the machine, and survives failures. Walk me through it.',
      a: 'I\'d treat it as an embarrassingly parallel batch on top of the content-addressed cache, which keeps the renderer simple. First, exploit independence: each line renders on its own with no shared state and no ordering dependency (the manifest records order separately), so I can run many concurrently instead of serially — serial would leave nearly all my cores idle while one line synthesizes. Second, lean on the cache: because every job is skip-if-exists and content-addressed, jobs are idempotent (running twice is a no-op) and the batch is resumable (done = file on disk), so I don\'t need transactions or coordination. The renderer\'s core is: filter chunks to the cache-misses, then render those through a BOUNDED worker pool. Bounding is critical — launching all 600 at once would exhaust CPU/RAM/VRAM and OOM or thrash, so I cap simultaneous jobs at N (≈physical cores for a CPU engine like Piper, or how many model instances fit in VRAM for a GPU engine), with workers pulling the next chunk from a queue. N is the main tuning knob: I\'d start with a hardware-based guess and tune by watching throughput and memory headroom. For failures, I distinguish transient from deterministic: transient errors (resource hiccups, flaky loads, timeouts) get bounded retries with backoff because they often succeed next time; deterministic errors (malformed input, missing voice) fail identically every retry, so I don\'t loop on them — I record the failure with its reason and move on rather than aborting the whole batch, so one poisoned line never costs the other 599. Throughout, I make it observable: progress as it goes (rendered/cached/remaining) and a final summary listing any failures with reasons, paired with the manifest\'s "every entry maps to an existing file, 0 missing" verification. And I\'d match the pool type to the bottleneck — async/threads if synthesis is I/O- or network-bound, processes or native-parallel if it\'s CPU-bound Python, few instances if GPU-bound. The result: fast (bounded parallelism keeps the hardware busy), safe (bounded concurrency respects resource limits), robust (retries + continue-past-failures), and resumable (a crash re-runs only the unfinished work) — with the cache having done the hard part of making each unit independent and repeatable.'
    },
    {
      q: 'Your batch renderer occasionally hangs or OOMs on large scripts. How do you diagnose and fix it?',
      a: 'I\'d approach it as "which resource are we exhausting, and is concurrency bounded correctly," because those are the two usual causes. For OOM, the prime suspect is unbounded or over-bounded concurrency: if the renderer launches all jobs at once, or N is set too high for the model\'s memory footprint, you exhaust RAM or VRAM. I\'d check whether concurrency is actually capped and measure per-job memory (a large model instance can be hundreds of MB to GBs), then set N to the minimum of the compute bound (cores or GPU slots) and the memory bound (how many instances fit under the ceiling with headroom) — for a heavy GPU model that might be just 1–2. I\'d also look for a leak: if memory climbs across the batch rather than plateauing, jobs aren\'t releasing resources (model instances not reused/freed, buffers accumulating, finished clips held in memory instead of written straight to the cache path), and the fix is to reuse a fixed pool of model instances and flush each clip to disk immediately rather than buffering. For hangs, I\'d suspect a job that never completes and no timeout: a synthesis that blocks forever on a bad input or a stuck subprocess will stall a worker permanently, and with a small pool, a few stuck workers hang the whole batch. The fix is a per-job timeout that converts a hang into a (transient-then-deterministic) failure the retry/record logic handles, so a stuck line is flagged and skipped rather than freezing the run. I\'d also check for a deadlock in the concurrency mechanism (e.g. a bounded queue with backpressure where the consumer died, so the producer blocks forever) — that\'s matching production to consumption incorrectly, fixed by ensuring the consumer failure also unblocks the producer. Crucially, observability is what makes any of this diagnosable: progress reporting tells me whether it\'s "slowly working" or "truly hung" and at which line it stopped, and a memory graph tells me whether it\'s a leak or a too-high N. And because the cache makes the batch resumable, none of this debugging is destructive — I can add a timeout or lower N and re-run, resuming from the clips already rendered, iterating on the fix without ever redoing completed work.'
    }
  ]
};
