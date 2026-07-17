window.LESSONS = window.LESSONS || {};
window.LESSONS['media-pipeline-orchestration'] = {
  id: 'media-pipeline-orchestration',
  title: 'ffmpeg & Job Queues: Wiring Models Into One Reliable Media Pipeline',
  category: 'Part 5 — Pipeline Engineering',
  timeMin: 40,
  summary: 'Every stage exists; now they become one machine that survives contact with reality. Three disciplines do it: ffmpeg as the deterministic media glue (probe, extract, transcode, and the mux where audio-video sync lives or dies), the job-queue architecture that turns minutes-long generation into supervised background work with per-stage progress, and — the deepest one — stage contracts: every stage a function from content-keyed inputs to artifact files, which makes failures resumable (a lip-sync crash never re-renders the voice), retries safe, and caching a lookup instead of a heuristic. The LLM director next lesson plans over exactly these contracts.',
  goals: [
    'Use ffmpeg as the pipeline\'s deterministic glue: probing uploads, extracting and normalizing audio, muxing frames + audio, and verifying A/V offset at assembly',
    'Architect the async job system: queue, workers, job states, per-stage progress events — because creators wait minutes and must see WHERE the work is',
    'Write stage contracts: pure-ish functions from declared inputs to artifact files, with a manifest of content hashes as the pipeline\'s ledger',
    'Make failure boring: per-stage isolation, resume-from-last-artifact, and idempotent retries that can never double-apply',
    'Generalize the TTS chunk cache to stage-level content-addressed caching — the mechanism plan-diffing (next lesson) executes through'
  ],
  concept: [
    {
      h: 'ffmpeg: the boring, load-bearing glue',
      p: [
        'Between the models sits a mundane majority of the pipeline\'s actual work: read whatever container the creator uploaded, extract its audio as 16 kHz mono WAV for Whisper and the speaker encoder, loudness-normalize a voice sample, turn 400 rendered PNG frames plus a WAV into an MP4 people can play, burn in captions. All of it is <b>ffmpeg</b> — the open-source workhorse every video product you have ever used runs somewhere inside it. You drive it as a subprocess with composed arguments: <code>ffprobe</code> for metadata (the intake gate\'s duration/sample-rate numbers come from here), <code>-i frames/%04d.png -i voice.wav</code> plus codec flags for the final mux. It is deterministic, stateless, and fast — the pipeline\'s one component that never surprises you, which is exactly why everything routes through it rather than through per-model ad-hoc I/O.',
        'The mux deserves its own paragraph, because the talking-head lesson left a bomb armed: lip-sync quality is destroyed by a mux that offsets audio against frames — every millisecond the sync model fought for, discarded by a wrong <code>-itsoffset</code> or a frame-rate mismatch (25 fps coefficients muxed as 24 silently stretches the video 4% — lips drift a full second by the two-minute mark). So assembly ends with a <b>verification step</b>, not a hope: probe the output\'s stream durations against each other and against the source audio (drift = duration mismatch), and in CI, run the sync-expert scorer from the evaluation lesson on a sample. The chain of ceilings has a final link, and it is a command-line flag.'
      ]
    },
    {
      h: 'Jobs, not requests: the queue and the progress contract',
      p: [
        'A full DenDen Studio render is minutes of GPU work. Nothing about that fits a request-response shape: the creator clicks Generate, and the system must accept immediately, work in the background, report progress honestly, survive the creator closing the tab, and allow cancellation. The architecture is the standard one — a <b>job queue</b> feeding <b>worker processes</b> — with media-specific decisions layered on. Jobs carry the validated plan (the stage list from Part 1, now real); workers claim one job at a time (GPU stages do not share a card gracefully — one worker per GPU, with the model-warmth policy living in the worker); job state is a small machine: <code>queued → running → done | failed | cancelled</code>, persisted, so a crashed worker\'s job is re-queueable rather than lost.',
        'The <b>progress contract</b> is product surface, not logging: workers emit stage-granular events — "tts: 12/40 chunks", "lipsync: rendering 300/1500 frames" — because a progress bar that says "generating…" for four minutes reads as frozen, while "stage 3 of 5, 60%" reads as a machine working (Part 6\'s backend streams these events to the browser; here we just emit them). Cancellation is checked BETWEEN stages and at safe checkpoints within long ones — killing a worker mid-ffmpeg leaves temp files, mid-model-load leaves VRAM in doubt; a cancel flag polled at chunk boundaries costs nothing and exits clean. And the queue is where backpressure lives: one render at a time per GPU, a visible queue position for the rest — the honest version of the latency ladder, applied to batch.'
      ]
    },
    {
      h: 'Stage contracts: artifacts in, artifacts out, hashes as truth',
      p: [
        'The discipline that makes everything else in this lesson cheap: every stage is a <b>contract</b> — declared inputs (artifact names), declared outputs (artifact files), no hidden state. TTS consumes <code>script.json</code> + a voice id and produces <code>speech.wav</code>; lip-sync consumes <code>speech.wav</code> + <code>source.png</code> + <code>coeffs.json</code> and produces <code>frames/</code>; mux consumes <code>frames/</code> + <code>speech.wav</code> and produces <code>final.mp4</code>. Each produced artifact is content-hashed into a <b>manifest</b> — the job\'s ledger: what exists, what it was made from, which model version made it. The manifest is not bureaucracy; it is the single structure that failure recovery, retries, caching, AND debugging all read.',
        'Failure recovery: lip-sync crashes at frame 900 → the manifest shows <code>speech.wav</code> and <code>coeffs.json</code> intact and valid → retry re-runs ONE stage, not the pipeline; the alternative — re-rendering forty chunks of TTS because a later stage hit a CUDA error — is the difference between a hiccup and a support ticket. Idempotent retries: a stage writes to a temp path and renames into place on success (atomic on the same filesystem), so a stage that died mid-write leaves no half-artifact the manifest could mistake for done — re-running is always safe because completion is defined by the manifest entry, not by file existence. Debugging: "why does this render sound wrong" starts with the manifest — which voice, which model version, which inputs — the provenance discipline from the edit list, applied to heavyweight artifacts.'
      ]
    },
    {
      h: 'Caching at pipeline scale: the chunk cache, grown up',
      p: [
        'The TTS lesson cached chunks by content key; the same move now covers every stage. A stage\'s <b>cache key</b> is the hash of: its input artifacts\' content hashes (not their names — content), the model name AND version, and the parameters that change output. Before running a stage, look up the key; on hit, link the cached artifact into the job and skip the work entirely. The properties this buys compound across the product: a creator re-renders after fixing one gesture → audio inputs unchanged → TTS and voice stages hit cache → only lip-sync onward re-runs; two projects using the same preset voice for the same sentence share the artifact; a model upgrade changes the version component → honest misses, no stale audio (the TTS lesson\'s subtle bug, structurally prevented at every stage).',
        'Watch what the key composition does automatically: change ONE input and invalidation <b>cascades</b> exactly as far as it should — new script → new script hash → TTS key changes → new speech.wav hash → lip-sync key changes → everything downstream re-runs; but change the OUTPUT resolution parameter of the mux and only the mux re-runs, because upstream keys never saw that parameter. Nobody writes invalidation logic; the dependency graph IS the invalidation logic, encoded in hashes. This is the machinery the LLM director drives next lesson: it emits a full plan every time, and execution costs only what actually changed — plan boldly, pay marginally. (Two disciplines keep it sound: parameters must be canonicalized before hashing — the rounding lesson from TTS keys — and every parameter that affects output must be IN the key; the one you forget is the one that serves someone else\'s render.)'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Galley-La\'s Dock One: Stamped Parts, the Foreman\'s Board, and the Keel That Was Never Reforged',
      text: 'Water 7\'s Galley-La Company builds ships the way no island rival can, and a visiting Franky — professional respect overcoming pride — studies Dock One for a week to learn why. It is not the craftsmen, he concludes; it is the SYSTEM. Every station is a contract: the forge takes ore and a specification and produces a keel; the ribbing station takes THE KEEL and lumber and produces a frame; rigging takes the frame and rope-stock; final assembly takes everything and produces a ship. No station reaches into another\'s work; each declares what it needs and what it yields. Every part that leaves a station is STAMPED — a mark encoding what it is, what materials went in, which master\'s tools and which tool-generation made it — and the dock\'s ledger records every stamp. The foreman\'s board runs the whole yard: every commission a row, every station a column, chalk marks flowing left to right — queued, working, done, FAILED in red — and customers in the gallery can see exactly where their ship is ("rigging, two-thirds strung"), which Franky notes keeps them calm in a way "we are working on it" never could. The system\'s genius shows the day a rigging fire ruins a frame\'s ropework: the foreman consults the ledger, sees the keel\'s stamp and the frame\'s stamp intact and matching their specifications, and orders rigging redone — ONLY rigging. "The old yards," an aged craftsman tells Franky, "would reforge the keel after any failure, to be safe. We do not guess about what is good. The stamp says what it was made from; if the inputs\' stamps match, the part stands." Half-finished work never enters the ledger — a station completes a part on its bench and only then carries it to the stamped racks, so a station that fails mid-work leaves nothing that could be mistaken for done. And the stamps pay one more dividend Franky adopts on the spot: when two commissions specify identical dinghies, the second one\'s hull simply... already exists — same specification, same materials, same tool-generation, same stamp — and the yard shelves one hull for both. The final-assembly inspector closes every build with a ritual the customers never see: mast against hull-line, measured, logged — because Dock One once shipped a beautiful vessel whose mast sat two degrees off true, and "the last station\'s error," the inspector says, "is the only one the sea gets to find."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Bernadette\'s Batch Line: The One Rule Is You Never Re-Synthesize',
      text: 'Bernadette gives the gang a tour of her pharmaceutical plant, and Sheldon — expecting to condescend — takes notes. The line is stations under contract: synthesis produces the compound; purification takes the compound and produces API; formulation takes API and excipients and produces tablets; packaging takes tablets and produces lots. Every output carries a batch record — what went in (by batch number, not by name), which process revision ran, which equipment line — and the plant\'s master ledger tracks every record. The production board in the corridor is the plant\'s heartbeat: every order a row, stations as columns, magnetic markers for queued/running/done, red for holds — and Bernadette\'s team can tell any manager exactly where any lot is in thirty seconds, "which is why nobody storms into MY lab demanding updates." The philosophy lands when Howard asks what happens when packaging fails a QC check. "We re-package," Bernadette says, as if the question were strange. "The tablets\' batch record shows they passed formulation QC from API that passed purification QC. Why would we re-synthesize a compound the records prove is good? Synthesis takes three weeks and costs more than my car." Sheldon, delighted: "You resume from the last validated artifact." Bernadette: "We call it \'not being insane,\' but sure." The half-done rule is absolute: material in process stays on the station\'s bench — it enters the ledger only on completion, so a centrifuge failure mid-run can never leave something that LOOKS finished; re-running a failed step is always safe because "done" means "recorded," not "present." Retries are boring by design — same inputs, same revision, same result, the record notes the re-run and nobody panics. When two hospital orders specify the same formulation from the same API batch, the second order draws from the same validated lot — identical inputs, identical process revision, identical record; "making it twice would just be making it once, twice." And the line\'s last station is verification, not packaging: seal integrity and label-against-contents checks on samples from every lot, because — Bernadette\'s catchphrase, apparently posted above the door — "the last station\'s mistake is the only one the customer meets."'
    },
    why: 'Dock One and the batch line are stage contracts made physical: stations that declare inputs and outputs, touch nothing beyond them, and stamp every artifact with what it is and what made it — the manifest as ledger. The rigging fire and the failed packaging QC are per-stage failure isolation with resume-from-last-artifact: nobody reforges a keel or re-synthesizes a three-week compound when the stamps/batch records prove upstream artifacts good — the exact TTS-survives-a-lipsync-crash property, priced in weeks and money so it sticks. Completed-means-recorded (the bench rule in both stories) is atomic completion: temp-path-then-rename, so half-artifacts cannot masquerade as done and retries are always safe. The shared dinghy hull and the shared formulation lot are content-addressed caching — identical inputs + identical process revision = the same artifact, made once. The foreman\'s board and the production board are the job system\'s progress contract: stage-granular, customer-visible, the difference between "working on it" and calm. And both stories close on the mux lesson: final assembly ends with VERIFICATION — the mast-line measurement, the seal check — because the last station\'s error is the only one the sea, the customer, or the viewer\'s eyes get to find.'
  },
  tech: [
    {
      q: 'Why do stage cache keys hash input artifacts\' CONTENT rather than their names or timestamps, and what does that choice buy the whole system?',
      a: 'Names and timestamps describe bookkeeping; content describes what the stage will actually read — and only content determines output. Hashing content buys four properties at once. Correct cascade: when a creator edits the script, the script artifact\'s hash changes, which changes the TTS stage\'s key, whose new output hash changes the lip-sync key — invalidation propagates exactly along the real dependency graph, automatically, with no hand-written "if script changed, also invalidate…" rules to forget. Correct NON-cascade: a re-run that happens to produce byte-identical output (deterministic TTS with pinned seed) yields the same output hash, so downstream keys do not change and downstream caches still hit — timestamps would spuriously invalidate everything below. Cross-job sharing: two projects that use the same preset voice for the same sentence produce the same key regardless of file paths or which project ran first — the shared-dinghy property, which at product scale is a major GPU saving on common assets. Trustworthy retries: a retried stage re-reads the same content, produces the same key, and can never fork the cache. The classic failure this prevents deserves naming: mtime-based build systems (old make) rebuild too much on touched-but-unchanged files and too little on changed-but-backdated ones — media pipelines, where a stage costs GPU-minutes, cannot afford either direction of that error.'
    },
    {
      q: 'A worker died mid-render (power loss). Walk through recovery, and identify each design element that makes it boring instead of terrifying.',
      a: 'Recovery: the job\'s heartbeat stops; the queue\'s reaper marks the job as orphaned and re-queues it; a healthy worker claims it, reads the manifest, verifies each recorded artifact (hash spot-check), finds — say — speech.wav and coeffs.json recorded and intact, frames/ absent (the stage died mid-write), and resumes at lip-sync. Total loss: one stage\'s partial work. The load-bearing elements, one by one: persisted job state + heartbeats (a job is never only in a worker\'s memory, so death is detectable and the job is not lost); the manifest as completion truth (recovery reads a ledger, not a directory listing — it never has to GUESS what finished); atomic artifact completion (temp-path-then-rename means the dead stage\'s half-written frames never entered the manifest, so nothing corrupt can be mistaken for done — the bench rule); content-keyed inputs (the resumed stage re-derives its cache key from recorded input hashes — if by luck a previous identical render cached the frames, the "resume" is instant); and stage idempotency (nothing in lip-sync double-applies: re-running from its inputs is semantically identical to running the first time, because stages own no external state beyond their declared outputs). The anti-pattern this architecture retires: pipelines whose stages communicate through shared mutable state (a growing project directory that stages append to), where a mid-write death leaves a state no one can classify, and the only safe recovery is rm -rf and full re-render — hours of GPU paid for one power flicker.'
    },
    {
      q: 'The 25-vs-24 fps mux bug stretches video 4% and desyncs lips by seconds. Why do bugs of this class survive testing so often, and what checks actually catch them?',
      a: 'They survive because every component is individually correct and the artifact LOOKS fine: frames render perfectly, audio is perfect, the file plays, and short test clips hide linear drift — 4% on a 10-second demo is 400 ms, noticeable only if you are looking; the two-minute real render drifts nearly five seconds, unwatchable. Worse, the bug lives in configuration space (a container default, an implicit fps flag, a coefficients-at-25 renders-at-24 mismatch between two configs that each look reasonable), so code review reads past it. Catching it requires checking the ASSEMBLED artifact against ground truth, mechanically: (1) duration check — probe the muxed video\'s stream duration against the source audio\'s duration; linear stretch shows up as a mismatch growing with length, so assert equality within a tolerance on every render, in production, not just tests (it is one ffprobe call); (2) frame-count arithmetic — rendered frame count / declared fps must equal audio duration; a 4% error is glaring in this arithmetic while invisible to eyes on short clips; (3) sync-expert sampling — the evaluation lesson\'s audio-visual sync scorer run on a few sampled windows of final output in CI, which catches not just stretch but constant offsets (a wrong -itsoffset) that duration checks miss; (4) the long-clip test fixture — one CI render of 2+ minutes, because an entire class of drift bugs is invisible below some duration and teams that only test 10-second clips ship them forever. The meta-lesson: assembly errors are the only errors the viewer is guaranteed to meet, so assembly gets verification proportional to that finality — the inspector measures the mast on every ship, not on the prototype.'
    }
  ],
  code: {
    title: 'The worker: contracts, manifest, cache, progress — one loop',
    intro: 'The whole lesson as one worker function: stages declared as contracts, the manifest as truth, content keys deciding what runs, progress events flowing out. The cache/key semantics are the lab.',
    code: `import hashlib, json, subprocess, shutil
from pathlib import Path

STAGES = [   # contracts: name, inputs (artifact names), version
  {'name': 'tts',     'inputs': ['script', 'voice'],          'v': 'xtts-2.0.3'},
  {'name': 'coeffs',  'inputs': ['speech', 'source_image'],   'v': 'st-2.1'},
  {'name': 'frames',  'inputs': ['coeffs', 'source_image'],   'v': 'render-1.4'},
  {'name': 'mux',     'inputs': ['frames', 'speech'],         'v': 'ffmpeg-7'},
]
PRODUCES = {'tts': 'speech', 'coeffs': 'coeffs',
            'frames': 'frames', 'mux': 'final'}

def run_job(job, cache, emit):
    manifest = job['manifest']            # artifact -> {'hash', 'path', ...}
    for i, st in enumerate(STAGES):
        if job.cancelled():               # checked BETWEEN stages
            return emit('cancelled', stage=st['name'])
        key = stage_key(st['name'], st['v'],
                        [manifest[a]['hash'] for a in st['inputs']],
                        job['params'].get(st['name'], {}))
        out_name = PRODUCES[st['name']]
        if key in cache:                                  # content hit:
            manifest[out_name] = cache[key]               #   link, skip
            emit('stage_cached', stage=st['name'], n=i)
            continue
        emit('stage_start', stage=st['name'], n=i, total=len(STAGES))
        tmp = Path(job.dir, out_name + '.tmp')
        run_stage(st['name'], manifest, tmp,              # progress cb ->
                  progress=lambda f: emit('stage_progress',
                                          stage=st['name'], frac=f))
        final = Path(job.dir, out_name)
        tmp.rename(final)                 # ATOMIC: done = renamed
        entry = {'hash': file_hash(final), 'path': str(final),
                 'made_by': st['name'] + '@' + st['v'], 'key': key}
        manifest[out_name] = entry        # done = RECORDED
        cache[key] = entry
        emit('stage_done', stage=st['name'], n=i)

    verify_mux(manifest)                  # the inspector: probe stream
    emit('done')                          #   durations, assert A/V match

def verify_mux(manifest):
    probe = json.loads(subprocess.run(
        ['ffprobe', '-v', 'quiet', '-print_format', 'json',
         '-show_streams', manifest['final']['path']],
        capture_output=True, check=True).stdout)
    durs = [float(s['duration']) for s in probe['streams']]
    assert abs(durs[0] - durs[1]) < 0.05, \
        'A/V duration mismatch - the last station\\'s error ' \
        'is the only one the viewer meets'`,
    notes: [
      'run_stage dispatches to the real work (XTTS, the renderer, ffmpeg mux) — each writing ONLY to the tmp path it was given. The worker owns all filesystem ceremony; stages stay pure-ish and therefore retry-safe.',
      'verify_mux running on EVERY render (one ffprobe, milliseconds) is the 25-vs-24 bug\'s permanent grave: linear drift and gross offsets both surface as duration mismatch before any viewer meets them.'
    ]
  },
  lab: {
    title: 'Content keys and the cascade: the invalidation logic nobody writes',
    prompt: 'Two functions proving the caching semantics. (1) <code>stage_key(name, version, input_hashes, params)</code>: canonicalize params via <code>json.dumps(params, sort_keys=True)</code>, join <code>name</code>, <code>version</code>, all input hashes (in given order), and the params string with <code>"|"</code>, and return the SHA-256 hex digest. (2) <code>plan_run(stages, artifacts, cache)</code>: <code>stages</code> is an ordered list of <code>{"name", "v", "inputs": [artifact names], "produces", "params"}</code>; <code>artifacts</code> maps names to content hashes (the sources); <code>cache</code> maps stage keys to output hashes. For each stage in order: compute its key from its inputs\' CURRENT hashes; on cache hit, record the cached output hash into <code>artifacts[produces]</code> and list the stage under <code>"cached"</code>; on miss, "run" it — the output hash is <code>("out-" + key)[:16]</code> — store it in artifacts AND cache, list under <code>"ran"</code>. Return <code>{"ran": [...], "cached": [...]}</code>. The tests then prove the cascade: change one source and exactly the right stages re-run.',
    starter: `import hashlib, json

def stage_key(name, version, input_hashes, params):
    # name | version | h1 | h2 ... | canonical-params -> sha256 hex
    pass

def plan_run(stages, artifacts, cache):
    # walk stages in order; hit -> link + 'cached'; miss -> run + 'ran'
    pass`,
    checks: [
      { re: 'def\\s+stage_key\\s*\\(', flags: '', must: true, hint: 'Define stage_key(name, version, input_hashes, params).', pass: 'stage_key defined ✓' },
      { re: 'sort_keys\\s*=\\s*True', flags: '', must: true, hint: 'Params must be canonicalized — dict order cannot change the key.', pass: 'params canonicalized ✓' },
      { re: 'def\\s+plan_run\\s*\\(', flags: '', must: true, hint: 'Define plan_run(stages, artifacts, cache).', pass: 'plan_run defined ✓' },
      { re: 'sha256', flags: '', must: true, hint: 'Keys are SHA-256 digests.', pass: 'sha256 used ✓' }
    ],
    tests: `S = [{'name': 'tts', 'v': '1', 'inputs': ['script', 'voice'],
      'produces': 'speech', 'params': {}},
     {'name': 'frames', 'v': '1', 'inputs': ['speech', 'image'],
      'produces': 'frames', 'params': {}},
     {'name': 'mux', 'v': '1', 'inputs': ['frames', 'speech'],
      'produces': 'final', 'params': {'res': 720}}]

a1 = {'script': 'h_s1', 'voice': 'h_v1', 'image': 'h_i1'}
cache = {}
r1 = plan_run(S, dict(a1), cache)
assert r1['ran'] == ['tts', 'frames', 'mux'] and r1['cached'] == []

r2 = plan_run(S, dict(a1), cache)
assert r2['cached'] == ['tts', 'frames', 'mux'] and r2['ran'] == [], \
    'identical job: everything hits'

a2 = dict(a1, script='h_s2')          # script edited
r3 = plan_run(S, a2, cache)
assert r3['ran'] == ['tts', 'frames', 'mux'], \
    'script change cascades through everything downstream'

a3 = dict(a1, image='h_i2')           # image swapped, script same
r4 = plan_run(S, a3, cache)
assert r4['cached'] == ['tts'] and r4['ran'] == ['frames', 'mux'], \
    'image change: tts untouched, downstream re-runs - the cascade is exact'

k1 = stage_key('mux', '1', ['a', 'b'], {'res': 720, 'fps': 25})
k2 = stage_key('mux', '1', ['a', 'b'], {'fps': 25, 'res': 720})
assert k1 == k2, 'param dict order must not change the key'
assert k1 != stage_key('mux', '2', ['a', 'b'], {'res': 720, 'fps': 25}), \
    'version bump = honest miss'
print('content keys and cascade correct')`,
    solution: `import hashlib, json

def stage_key(name, version, input_hashes, params):
    canon = json.dumps(params, sort_keys=True)
    joined = '|'.join([name, version] + list(input_hashes) + [canon])
    return hashlib.sha256(joined.encode()).hexdigest()

def plan_run(stages, artifacts, cache):
    ran, cached = [], []
    for st in stages:
        key = stage_key(st['name'], st['v'],
                        [artifacts[i] for i in st['inputs']],
                        st['params'])
        if key in cache:
            artifacts[st['produces']] = cache[key]
            cached.append(st['name'])
        else:
            out = ('out-' + key)[:16]
            artifacts[st['produces']] = out
            cache[key] = out
            ran.append(st['name'])
    return {'ran': ran, 'cached': cached}`,
    notes: [
      'Test four is the whole lesson in one assert: swap the image and TTS hits cache while everything downstream honestly re-runs — the dependency graph, encoded in hashes, IS the invalidation logic. Nobody wrote an if-statement about images.',
      'Note plan_run computes keys from artifacts\' CURRENT values as it walks — a stage that re-ran feeds its new output hash into the next stage\'s key. That single line is what makes cascades propagate; compute keys upfront from stale values and the cascade silently breaks.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Two levels down: the ffmpeg vocabulary worth actually owning (the five invocations this product runs, annotated), and how this stage-contract architecture relates to the build systems and workflow engines it secretly is.',
    sections: [
      {
        h: 'The five ffmpeg invocations DenDen Studio actually runs',
        p: 'Worth memorizing as vocabulary, because these five cover the product. (1) Probe: ffprobe -print_format json -show_streams -show_format IN — duration, sample rate, channels, fps, codecs; the intake gate\'s numbers and the mux verifier\'s truth both come from here. (2) Audio extraction/normalization: ffmpeg -i IN -ar 16000 -ac 1 -af loudnorm out.wav — one flag set standardizes any upload into what Whisper and the speaker encoder expect (16 kHz mono, normalized loudness); skipping loudnorm is why quiet uploads clone into quiet voices. (3) The mux: ffmpeg -framerate 25 -i frames/%04d.png -i speech.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest final.mp4 — the flags that bite: -framerate must match the coefficient fps EXACTLY (the 4% bug), -pix_fmt yuv420p is required for broad player compatibility (omit it and Safari shows black), -shortest prevents a trailing frozen frame when streams differ by a hair. (4) Captions: -vf subtitles=caps.srt burns them in; shipping the .srt sidecar instead is the accessibility-friendlier default, and the captions lab\'s output serializes to SRT in twenty lines. (5) The concat demuxer for chunked renders: a text file listing segment files, ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4 — -c copy makes it a container operation (no re-encode, no generation loss), which is how per-chunk renders assemble into one file losslessly. Everything else — scaling, trimming, thumbnail extraction — is variations on these shapes.'
      },
      {
        h: 'You have reinvented a build system on purpose — know the family',
        p: 'Step back and the architecture is recognizable: stages with declared inputs/outputs, content-addressed artifacts, cascading invalidation, resumable partial builds — this is a BUILD SYSTEM (Bazel\'s action graph, Nix\'s derivations, make with content hashes instead of mtimes), and separately a WORKFLOW ENGINE (Airflow/Temporal DAGs with persisted state and retries). Knowing the family pays twice. First, you inherit their lessons wholesale: hermeticity (a stage reading anything outside its declared inputs — an env var, the system clock, a global config — breaks cache correctness in ways that surface as "stale" outputs weeks later; Bazel calls this sandboxing and enforces it, you enforce it by discipline and code review), reproducibility as a spectrum (bit-identical outputs are achievable for ffmpeg and pinned-seed models, approximately-identical is acceptable for GPU float nondeterminism — but then the OUTPUT hash feeding downstream keys means benign re-runs can cascade; the fix is treating semantically-equivalent outputs as cache-equal via the stage key, not the output hash, which is exactly why plan_run keys on inputs rather than comparing outputs), and the small-artifacts-big-artifacts split (manifests and coefficients in the database, frames and WAVs on disk/object storage with hashes in the manifest). Second, you know when to STOP hand-rolling: a single-machine product with five stages is well-served by 200 lines of the worker loop you just wrote; the day requirements include multi-machine scheduling, per-stage resource classes, complex fan-out DAGs, and audit requirements, adopting Temporal-class machinery beats growing a bespoke distributed system — the skill is recognizing that line, and the contracts you wrote are exactly what makes migration cheap: stages that are pure functions over declared artifacts port anywhere.'
      }
    ]
  },
  quiz: [
    {
      q: 'Lip-sync crashes at frame 900 of 1500. In this architecture, the retry:',
      options: ['Re-runs the whole pipeline to be safe', 'Reads the manifest, verifies speech.wav and coeffs.json intact, and re-runs ONLY lip-sync — upstream artifacts are proven good by their recorded hashes', 'Resumes at frame 901 of the half-written output', 'Requires manual cleanup first'],
      correct: 1,
      explain: 'Resume-from-last-artifact: the manifest is completion truth, and atomic temp-then-rename means the dead stage left nothing that could be mistaken for done. Nobody reforges the keel.'
    },
    {
      q: 'Stage cache keys hash input CONTENT (not names/timestamps) because:',
      options: ['Hashes are shorter than paths', 'Only content determines output — so invalidation cascades exactly along the real dependency graph, byte-identical re-runs do not spuriously invalidate downstream, and identical work is shared across jobs', 'Timestamps are unreliable on Linux', 'Names may contain unicode'],
      correct: 1,
      explain: 'The dependency graph, encoded in hashes, IS the invalidation logic — no hand-written rules, no mtime-style rebuild-too-much/too-little errors at GPU-minute prices.'
    },
    {
      q: 'Stages write to a temp path and rename into place on success because:',
      options: ['Renames are faster than writes', '"Done" must mean "recorded in the manifest," never "file exists" — a stage dying mid-write must leave nothing a recovery could mistake for a finished artifact', 'Temp directories are cleaned automatically', 'It avoids file locking'],
      correct: 1,
      explain: 'The bench rule: half-finished work never enters the ledger. Atomic completion is what makes retries always-safe and recovery a read of the manifest instead of a guess.'
    },
    {
      q: 'A 24-vs-25 fps mux mismatch passed all component tests and short-clip review. What catches it?',
      options: ['Longer code review', 'Assembly verification: probe the output\'s A/V stream durations against each other on EVERY render, frame-count arithmetic in CI, and one long-clip test fixture — linear drift is invisible on short clips and glaring in the arithmetic', 'Higher test coverage of the renderer', 'Watching renders at 2x speed'],
      correct: 1,
      explain: 'Every component was correct; the error lives in assembly configuration. The last station\'s error is the only one the viewer meets — so the last station verifies, mechanically, every time.'
    },
    {
      q: 'The job system emits stage-granular progress ("lipsync: frame 300/1500") rather than a single percentage because:',
      options: ['Percentages are hard to compute', 'A multi-minute opaque bar reads as frozen; visible stage progress reads as a machine working — the progress contract is product surface, and Part 6 streams it to the browser', 'Logs require structured events', 'It enables faster rendering'],
      correct: 1,
      explain: 'The foreman\'s board: customers who can see "rigging, two-thirds strung" stay calm in a way "we are working on it" never achieves.'
    }
  ],
  pitfalls: [
    'Letting a stage read ANYTHING outside its declared inputs — an environment variable, the current date, a global settings file. Hermeticity violations poison the cache invisibly: the output changes, the key does not, and weeks later someone gets a stale artifact and files the least-reproducible bug of the quarter. Declared inputs are the whole input surface, enforced in review.',
    'Forgetting one output-affecting parameter in the stage key. The symptom is cache hits serving subtly-wrong artifacts (yesterday\'s resolution, the old speaking rate) — worse than any miss. When adding a stage parameter, adding it to the key is part of the same commit, and a canonicalization test (dict order, float rounding) guards the key function itself.',
    'Testing the pipeline only with 10-second clips. An entire class of assembly bugs — linear A/V drift, cumulative timestamp rounding, memory growth across chunks — is invisible below a duration threshold. One long-render fixture in CI (2+ minutes) costs GPU pennies and catches the bugs that otherwise ship for months.'
  ],
  interview: [
    {
      q: 'Design the execution layer for a multi-model media generation pipeline. What are the core abstractions and why?',
      a: 'Four abstractions, each earning its place. (1) Stage contracts: every stage is a pure-ish function from declared input artifacts to declared output artifacts — no hidden state, no undeclared reads (hermeticity), writing via temp-path-then-atomic-rename. This makes stages individually testable, retry-safe, and portable. (2) The manifest: a per-job ledger mapping artifact names to content hashes, paths, and provenance (which stage version produced them). It is the single source of completion truth — recovery, retries, caching, and debugging all read it rather than guessing from the filesystem. (3) Content-addressed stage caching: a stage\'s key hashes its inputs\' content hashes + model/stage version + canonicalized parameters; hits link cached artifacts, misses run and populate. Invalidation cascades exactly along the real dependency graph automatically — edit the script and TTS-onward re-runs; swap the image and TTS still hits — and identical work is shared across jobs and users. (4) The job system: persisted job state with heartbeats (worker death is detectable, jobs are re-queueable), one worker per GPU with warmth policy inside the worker, stage-granular progress events as product surface, cancellation checked at stage boundaries and chunk checkpoints. Assembly (ffmpeg mux) ends with mechanical verification — stream-duration comparison every render, sync sampling in CI — because assembly errors are the only ones users are guaranteed to meet. The honest framing: this is a build system fused with a workflow engine, and knowing that family means inheriting its lessons (hermeticity, reproducibility, artifact storage split) and recognizing when to migrate to Temporal-class infrastructure instead of growing a bespoke distributed system.'
    },
    {
      q: 'Your pipeline caching serves a stale artifact — a render with yesterday\'s voice settings. Walk through root-causing and the classes of bug it could be.',
      a: 'Stale-hit bugs are always a key that failed to change when reality did, so I enumerate the key\'s components against what actually varied. (1) Missing parameter: the voice setting that changed is not IN the stage key — the classic; check the key function against the stage\'s full parameter surface, and check recent commits for parameters added to the stage but not the key (the fix includes a lint or convention: params flow to stages only through the keyed dict). (2) Canonicalization failure: the parameter IS keyed but hashes differently for equal values or equally for different ones — dict ordering without sort_keys, float speed 1.0 vs 1.00000001 keyed without rounding, or (subtler) the value keyed as an object reference/id rather than content. (3) Hermeticity violation: the stage read the setting from somewhere undeclared — a global config file, an env var — so the key never saw it at all; audit the stage\'s actual reads against its declared inputs (strace in anger, discipline in review). (4) Version pin failure: the "setting" was actually a model or engine upgrade whose version string did not change (a mutable tag like \'latest\' baked into the key — the Ollama alias lesson recurring at pipeline scale); keys need immutable version identifiers or content hashes of the model itself. (5) Manifest/linking bug: the key machinery is right but the hit linked the wrong artifact — rare, but check that cache values store the artifact hash and that linking verifies it. Then two permanent fixes regardless of cause: add the reproducer as a cache-correctness test (same stage, one changed setting, assert miss), and add a periodic sampled audit — re-run a small fraction of cache hits and compare output hashes, which converts silent staleness into a measurable rate. Stale caches at GPU prices are worth an audit lane.'
    },
    {
      q: 'Compare request-response, fire-and-forget, and supervised-job models for long-running generation work. Why does supervised win here, and what does it cost?',
      a: 'Request-response holds a connection for minutes: timeouts at every proxy hop, no survival across a closed tab, no visibility, and worker crashes lose everything — disqualified for anything over ~30 seconds. Fire-and-forget (enqueue and hope) accepts fast but abandons the user: no progress, no cancellation, failures discovered by polling for a file that never appears — it is the "we are working on it" that reads as frozen. The supervised-job model — persisted job records with state machines (queued/running/done/failed/cancelled), heartbeating workers, stage-granular progress events, explicit cancellation, and re-queue on worker death — wins because generation work has all four aggravating properties at once: long (minutes), expensive (GPU-time worth protecting via resume), failure-prone (models, VRAM, media edge cases), and user-facing (someone is watching a progress bar deciding whether to trust the product). What it costs, honestly: infrastructure (a persistent queue and state store — even SQLite suffices single-machine, but it must exist), protocol design (progress event schema, cancellation semantics at safe checkpoints, orphan-reaping policy), and worker discipline (heartbeats, idempotent stages, atomic artifact completion — the supervised model is only as good as the stage contracts underneath it). The decision rule I would offer: the moment work exceeds a request timeout OR its failure would waste more than seconds of compute, supervised jobs stop being optional — and media generation exceeds both thresholds by an order of magnitude on day one.'
    },
    {
      q: 'Where does verification belong in a media pipeline, and how do you decide what is worth checking on every render versus in CI only?',
      a: 'Placement principle: verify at the seams where errors become invisible to components but visible to users — above all at final assembly, because the mux is the last transformation before human eyes and its error class (A/V offset, fps mismatch, stream truncation) is precisely the class no upstream component test can see. Every-render checks must be cheap and catch catastrophic-if-shipped errors: stream-duration comparison via one ffprobe call (catches linear drift and truncation, milliseconds of cost), frame-count-versus-audio-duration arithmetic (catches fps mismatches, free), container/codec sanity (pix_fmt compatibility — catches the black-video-in-Safari class), and manifest completeness (every declared artifact recorded and hash-verified). CI-only checks are the expensive or statistical ones: the sync-expert scorer sampling windows of final output (a model inference — too heavy per render, decisive for regressions), the long-clip fixture (2+ minutes, catching drift classes invisible on short clips), golden-render comparisons against pinned versions (catch quality regressions from dependency bumps), and cache-correctness property tests (changed input ⇒ miss; canonicalization invariants). The middle tier worth naming: sampled production audits — re-verify a percentage of cache hits, run the sync scorer on a fraction of real renders — converting "silent failure" into "measured rate" for failure classes too expensive to check universally. The decision rule: cost-per-check versus blast-radius-if-missed, with the thumb on the scale that assembly-stage errors ship directly to the viewer — the last station\'s mistake is the only one the customer meets, so the last station gets the always-on checks.'
    }
  ]
};
