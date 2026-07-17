window.LESSONS = window.LESSONS || {};
window.LESSONS['hardware-quantization-caching'] = {
  id: 'hardware-quantization-caching',
  title: 'Fitting It All: VRAM Budgets, Quantization Tradeoffs & Caching Renders',
  category: 'Part 5 — Pipeline Engineering',
  timeMin: 35,
  summary: 'The whole product must fit on one machine — that was the open-source promise, and this lesson is where it gets kept. The VRAM ledger becomes policy: per-mode residency plans deciding which models stay warm and which load on demand. Quantization gets its full treatment: what the bits actually buy, why the text brain tolerates 4-bit while media models complain earlier, and why every quantization decision is measured against a golden set instead of vibed. Then the profiling discipline (find where the render minutes actually go — it is almost always frames) and the cache\'s own economics: disks fill, so eviction is a designed policy with pins, budgets, and a bias toward keeping what is expensive to remake.',
  goals: [
    'Maintain the VRAM ledger as living policy: footprints + working memory per model, and a residency plan per product mode (editing, batch render, live)',
    'Explain quantization mechanically (fewer bits per weight, per-block scales) and its uneven quality cost across model types — LLM hardest, TTS/VC carefully, diffusion most sensitive',
    'Replace vibes with golden sets: every quantization or model-swap decision validated per-stage against pinned reference outputs',
    'Profile renders with the pipeline\'s own stage events, find the dominant cost (frames), and apply the right lever per stage — resolution, chunking, precision, CPU offload',
    'Design cache eviction: size budgets, LRU with pins for active projects, and keep-vs-recompute decisions priced by regeneration cost'
  ],
  concept: [
    {
      h: 'The ledger becomes policy: residency plans per mode',
      p: [
        'Part 0 taught the arithmetic (co-residency costs the sum, sequencing costs the max plus load latency); the shipping product needs the arithmetic turned into <b>named policies</b>. DenDen Studio has three modes with different working sets. <b>Edit mode</b>: the director LLM and the VLM should answer in under a second — keep the LLM warm always (it is the interaction loop), the VLM warm during active sessions; media models cold. <b>Batch render</b>: the worker runs stages sequentially — load, run, release — keeping at most the two models the plan\'s stage sequence uses back-to-back (the load-latency amortization question: a 6-second model load amortizes fine over a 90-second frames stage, and terribly over a 2-second mux). <b>Live mode</b>: the co-residency sum, small variants, everything warm, nothing else allowed on the card — the realtime lesson\'s regime.',
        'The mechanism under all three is the same: a <b>model manager</b> owning load/unload with an LRU-by-usage policy and per-mode pin lists — the worker asks for a model, the manager loads it (evicting the least-recently-used unpinned model if the ledger would overflow) and records the timing. Two disciplines keep it honest: the ledger\'s numbers are MEASURED (load the model, read the allocator, write it down — spec sheets lie by the working-memory margin), and mode transitions are explicit events (entering live mode evicts to the live pin list BEFORE the session starts, not when the first over-budget allocation crashes mid-performance).'
      ]
    },
    {
      h: 'Quantization: what the bits buy, and who pays',
      p: [
        'Mechanics in one breath (the anatomy lesson\'s deep dive, now operational): weights trained at 16-bit float are stored in 4-8 bits with per-block scale factors; memory drops proportionally, and inference SPEEDS UP on memory-bandwidth-bound hardware because moving weights, not multiplying them, is the bottleneck. The uneven part — the part that makes this an engineering decision rather than a checkbox — is who pays quality. The <b>LLM director</b> pays least: schema-constrained planning at temperature 0 is robust at Q4 — the constrained decoder masks most of the degradation surface, and golden-set plan fidelity typically holds; this is why "quantize the text brain hardest" is the default. <b>Whisper</b> at int8 is a solved trade (faster-whisper\'s default, accuracy loss within noise for clean audio). <b>TTS and voice conversion</b> pay audibly earlier: quantization artifacts land in exactly the high-frequency texture the talking-head lesson\'s chain-of-ceilings runs through — a slightly grainy voice becomes slightly mushier lips downstream. <b>Diffusion/rendering models</b> pay most visibly: aggressive quantization shows up as texture smearing and detail loss in the one artifact the creator stares at.',
        'So the rule is not a rule but a procedure: <b>golden sets per stage</b>. A pinned set of reference inputs per model (scripts for the director, utterances for TTS, faces+audio for the head model), reference outputs from the full-precision build, and per-stage comparison metrics (plan-property assertions for the director; the evaluation lesson\'s sync and quality scores for media). A quantization candidate ships when its golden run is within threshold — and the same harness gates model UPGRADES, making "new quant, new model, new version" one decision pipeline instead of three vibes. The pattern is the course\'s testing philosophy compressed: never ask "does it seem fine"; ask "what is the measured delta on the pinned set".'
      ]
    },
    {
      h: 'Profiling: find the minutes before spending them',
      p: [
        'The orchestration lesson\'s stage events are also the profiler: every render logs per-stage wall time, and the aggregate answers the only question that matters before optimizing — <b>where do the minutes go?</b> For talking-head pipelines the answer is nearly always the frames stage (per-frame neural rendering dominates; TTS and coefficients are seconds, mux is nothing), which immediately ranks the levers. <b>Resolution</b> is the big one: rendering at 540p versus 1080p is roughly a 4x pixel difference in the dominant stage — and the preview/final split falls out naturally (edit-loop previews render at 540p; the approved final at full resolution — the creator iterates fast and ships pretty, the drag lesson\'s proxy-fidelity idea at pipeline scale). <b>Chunked rendering</b> (the frames stage processing in segments) bounds memory and enables the resume behavior the worker already supports. <b>Precision</b> (fp16 vs fp32 inference) is usually free speed on modern GPUs. And the <b>director belongs on the CPU</b>: llama.cpp runs an 8B Q4 plan-emission in seconds on a desktop CPU, freeing the entire GPU for media — the rare case where "slower" hardware is the right architecture, because planning latency is off the render\'s critical path.',
        'The discipline attached: profile BEFORE and AFTER every lever pull, on the same golden inputs, and keep the history — because optimizations interact (chunking changed the frames stage\'s memory profile, which changed what could stay resident, which changed load-latency totals), and because the numbers rot as models upgrade. A pipeline that logs stage timings has this discipline nearly free; the only added ceremony is the before/after comparison being a habit instead of an accident.'
      ]
    },
    {
      h: 'Cache economics: disks fill, so eviction is a policy',
      p: [
        'Content-addressed caching made re-renders cheap; nothing made the cache small. Frames directories are hundreds of MB, WAVs add up, and a month of iterating creators fills any disk. Eviction is therefore designed, not discovered: a <b>size budget</b> (a config value with a dashboard number behind it), <b>LRU by last-use</b> as the base policy (the manifest already records access — cache hits ARE uses), and <b>pins</b> for what must not vanish: artifacts of currently-open projects, and anything the consent/audit trail requires (enrollment artifacts are records, not cache — they live outside the eviction domain entirely).',
        'The refinement worth its complexity: evict by <b>regeneration cost per megabyte</b>, not just recency. A speaker embedding is kilobytes and cost a model load to make; coefficients are small and cost a minute; frames are huge and cost the most wall time but are also PURELY derivable from coefficients + image (cheap-ish to remake at need); the final mux is derivable in seconds from things you kept. So the policy keeps small expensive intermediates aggressively (embeddings, coefficients, TTS chunks), lets bulky rederivable artifacts (frames, muxes) go first, and never evicts below the active-project pin set. This is ALSO the answer to "what do we sync to the cloud" in Part 6: the small expensive layer travels; the bulky derivable layer regenerates locally. One more echo of the course\'s oldest split: the sparse valuable representation versus the dense derivable one — the edit list versus the render, now as storage policy.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Provisioning the Sunny: Nami\'s Manifest, Sanji\'s Compressed Rations, and the Warehouse Rule',
      text: 'Before the crew\'s longest crossing, the Sunny becomes a lesson in fitting. Nami runs the manifest with a shipwright\'s coldness: everything that boards gets WEIGHED — not catalog weights, actual scale weights, "because the catalog does not know how much water your rope drinks" — and the hold\'s capacity is a number on the wall, with a margin line drawn above it in red that no one is allowed to plan into. Her stowage plan is not one plan but three, by mode: harbor mode (workshop gear accessible, sails stowed), crossing mode (navigation charts and storm gear on deck — "what I will need in ten seconds lives within ten seconds\' reach"), and battle mode (everything lashed below except weapons — a pre-drawn list, executed BEFORE the enemy closes, "because re-stowing during a broadside is how ships die"). What stays on deck versus below is pure access-time arithmetic: the deck is small and instant; the hold is vast and costs a ladder trip — so the deck holds what is used constantly, and Usopp\'s beloved but rarely-fired special ammunition loses its deck spot to the water barrels, with an appeals process ("convince me you will use it hourly"). Sanji\'s contribution is compression, applied with a chef\'s discrimination: rice, beans, stock bases — dried and pressed to a quarter volume, "and in a stew you will never know"; but the crossing\'s single celebration dinner travels FULL — the fresh cut, the real butter — because "compression is invisible in the stew and criminal in the centerpiece. You compress by DISH, not by policy." His proof is not opinion: before departure he cooks both versions of every compressed candidate side by side, the crew tastes blind, and anything the tasting flags travels whole. And at the voyage\'s staging island, the crew inherits the harbor warehouse\'s eviction rule from its ancient keeper: the warehouse fills every season, so what leaves is decided by a posted policy — untouched-longest goes first, EXCEPT items on the pinned board (active commissions, legal records — "those are not storage; those are promises"), and except anything expensive to remake: "A barrel of fish I can throw out; the sea makes more fish. A surveyed chart of the reef passage took three men a month — that stays if I must sleep outside myself. You evict by what it costs to REMAKE, not by what it costs to keep."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Howard Packs for the ISS: Mass Budgets, Dehydrated Dinners, and What NASA Never Vibes',
      text: 'Howard\'s space-station stories eventually converge on logistics, which he insists were harder than the launch. Payload mass is a LEDGER: every object weighed on calibrated scales — "not the manufacturer\'s number, OUR number; the manufacturer has never met humidity" — against a hard budget with a printed margin nobody may plan into. Stowage is three plans, not one: launch config, orbit config, EVA config — each a pre-approved list of what lives within reach versus behind panels, with transitions executed as checklists BEFORE the mode begins ("you reconfigure before the spacewalk, Raj, not during — during is how you become a very expensive satellite"). The within-reach decisions are access-time math: the capsule\'s reachable volume is tiny, so it holds what is used hourly; everything else costs a panel-opening ritual, and there is a standing joke about the experiment Howard lobbied to keep reachable and touched twice in five months — it lost its spot at the next resupply review, "the ISS runs LRU eviction on astronaut convenience." Food is the quantization seminar: NASA dehydrates ruthlessly — soups, stews, scrambled eggs, "and rehydrated, you honestly cannot tell" — but some items fly whole or not at all: the crew\'s morale dinner, the fresh fruit in the resupply, "because compression is undetectable in the stew and unforgivable in the one dinner you spend three months waiting for; they compress per ITEM, and they TEST it — there are people at Johnson whose whole job is blind-tasting rehydrated versus fresh and writing down a number. Nobody vibes. There is a threshold, on paper." Even the station\'s storage tells the eviction story: the logistics module fills between resupplies, so disposal follows posted policy — least-recently-used goes to the trash vehicle first, EXCEPT pinned items (active experiments, legal/medical records) and except anything irreplaceable-at-altitude: "Packaging we burn up happily; the sea— sorry, the SUPPLY CHAIN makes more packaging. The sample that took six months of microgravity to grow rides home on the return capsule with its own seatbelt. Cost-to-remake decides, not size."'
    },
    why: 'Nami\'s weighed manifest and Howard\'s calibrated-scale ledger are the measured VRAM budget with its untouchable margin — spec sheets and catalogs lie, so the numbers are yours or they are fiction. The three stowage plans (harbor/crossing/battle, launch/orbit/EVA) are per-mode residency policies with explicit, checklist-executed transitions — reconfigure BEFORE live mode, because re-stowing during a broadside is how sessions die; and deck-versus-hold access arithmetic, complete with the LRU appeals process for rarely-used favorites, is the model manager\'s warm/cold policy. Sanji\'s per-dish compression and NASA\'s per-item dehydration are quantization\'s uneven tax — invisible in the stew (the Q4 director), criminal in the centerpiece (the diffusion renderer) — and both stories install the lesson\'s procedure over its rule: blind side-by-side tastings against a threshold on paper are golden-set gating, because nobody vibes. The warehouse keeper and the logistics module close with eviction as designed policy: LRU as the base, pins for promises (active projects, consent records — "not storage; promises"), and the keeper\'s law that survives both stories verbatim — you evict by what it costs to REMAKE, not by what it costs to keep: the sea makes more fish; the month-long reef chart sleeps indoors.'
  },
  tech: [
    {
      q: 'Why does quantization hurt the LLM director least and the diffusion renderer most, mechanically?',
      a: 'Three compounding reasons, from output structure to error visibility. Output bandwidth: the director emits a few hundred tokens through a constrained decoder — at each step the schema masks most of the vocabulary, so quantization noise in the logits must be large enough to flip the ranking among the few LEGAL tokens to change anything at all, and at temperature 0 small perturbations below that threshold are literally invisible; the diffusion model emits millions of continuous pixel values with no mask — every weight perturbation propagates into the output, and there is no "close enough" quantizer at the end absorbing it. Error accumulation geometry: the director\'s errors are discrete and checkable (a wrong enum fails validation; the repair loop catches it), while diffusion runs dozens of denoising iterations where quantization bias compounds — small consistent errors in early steps steer the whole trajectory, surfacing as texture smearing and detail loss. Perceptual exposure: the plan is read by a validator; the render is stared at by a human at full attention — the most sensitive error detector in the system is pointed at exactly the most quantization-sensitive stage\'s output. TTS/VC sit between: continuous output (pays like diffusion, less deep), but the vocoder\'s texture band is where cheap bits bite first, and the chain of ceilings forwards that graininess to the lips. Hence the procedure: quantize hardest where outputs are discrete, constrained, and machine-checked; most carefully where outputs are continuous, iterative, and human-watched — and let the per-stage golden set arbitrate every case.'
    },
    {
      q: 'Your ledger says the batch worker\'s peak is one model at a time, yet renders intermittently crash with out-of-memory late in long jobs. Enumerate the suspects.',
      a: 'The ledger models steady state; OOM-late-in-long-jobs means something grows or lingers. Suspects in order of hit rate: (1) Incomplete release — the previous stage\'s model unloaded but its framework cached allocations (PyTorch\'s caching allocator holds freed blocks; "unloaded" per your code, resident per the driver): fix with explicit cache-clearing between stages and verify with allocator stats, not model-object deletion. (2) Fragmentation — long jobs with varying tensor shapes fragment the VRAM heap until a large contiguous allocation fails despite sufficient total free memory: chunked rendering with FIXED chunk shapes stabilizes the allocation pattern; some allocators expose defrag/expandable-segment options worth enabling. (3) Working-memory scaling — the ledger recorded working memory at test-clip size, but activation memory scales with resolution and chunk length: a creator\'s 4K source image or a 10-minute script blows the margin — clamp inputs at intake (the gate exists), and re-measure the ledger at the clamps, not at the demo sizes. (4) Accumulating state — progress buffers, frame lists held in Python, a debug flag collecting intermediates: memory profiling over job duration (not at stage boundaries) shows the slope. (5) A co-tenant — the edit session\'s pinned LLM or VLM sharing the card with the batch worker because a mode transition did not evict: mode-transition logging answers this in one glance. The disciplined fix regardless: add per-stage allocator high-water-mark logging to the worker\'s events — the same instrumentation philosophy as stage timings — so the NEXT OOM report arrives with the culprit\'s name on it.'
    },
    {
      q: 'Defend "evict by regeneration cost per megabyte" over plain LRU with a concrete scenario, and name the failure mode the refinement itself introduces.',
      a: 'Scenario: a creator returns after two weeks to a project whose cache was LRU-evicted under disk pressure. Plain LRU treated all artifacts equally by recency, so it kept last week\'s bulky frame directories from OTHER projects (recently touched by a batch of renders) and evicted this project\'s speaker embedding (2 KB, untouched for two weeks) and coefficient files (2 MB) — artifacts whose regeneration needs a model load, a minute of inference, and (for the embedding) re-reading consent-gated source audio. Cost-per-MB inverts the outcome: the embedding\'s regeneration-cost-to-size ratio is astronomically high, so it is effectively never evicted; frames — hundreds of MB, purely derivable from kept coefficients + image in a bounded render — go first, and the returning creator\'s "re-open project" costs one frames re-render instead of a full pipeline walk. The general principle: recency predicts REUSE likelihood, but the eviction objective is minimizing expected regeneration cost, which is likelihood × cost — dropping the cost term is only harmless when costs are uniform, and in media pipelines they span five orders of magnitude. The refinement\'s own failure mode: cost estimates rot — a model upgrade makes coefficients cheap to regenerate (new fast model) or expensive (new heavy model), and a stale cost table quietly mis-ranks the cache; keep the costs derived from the SAME measured stage timings the profiler already logs (one source of truth), and fall back to LRU within cost bands so ties break sanely. And one absolute the objective never overrides: pins (active projects, audit artifacts) sit outside the optimization entirely — a promise is not a cache entry.'
    }
  ],
  code: {
    title: 'The model manager and the eviction policy — the two allocators',
    intro: 'VRAM and disk, each with a budget, a policy, and pins. The planning math is the lab; this is the shape the policies live in.',
    code: `MEASURED = {   # OUR numbers, from the allocator, not spec sheets
  'director-8b-q4':   {'gb': 5.6, 'load_s': 4.1},   # cpu-offloadable
  'vlm-7b-q4':        {'gb': 6.2, 'load_s': 5.0},
  'whisper-small-i8': {'gb': 1.1, 'load_s': 1.2},
  'xtts-v2':          {'gb': 2.4, 'load_s': 3.5},
  'head-renderer':    {'gb': 4.8, 'load_s': 6.0},
  'vc-live':          {'gb': 1.6, 'load_s': 2.0},
  'lipsync-lite':     {'gb': 1.9, 'load_s': 2.2},
}

MODE_PINS = {   # residency policy per product mode
  'edit':   ['director-8b-q4'],                    # the interaction loop
  'batch':  [],                                    # worker decides per plan
  'live':   ['vc-live', 'lipsync-lite',            # the co-residency SUM -
             'whisper-small-i8'],                  #   everything else OFF
}

class ModelManager:
    def __init__(self, vram_gb, headroom_gb=1.5):
        self.budget = vram_gb - headroom_gb        # the red line
        self.resident = {}                         # name -> last_used

    def enter_mode(self, mode):
        # transitions are EVENTS: evict to the pin list BEFORE the mode
        for name in list(self.resident):
            if name not in MODE_PINS[mode]:
                self.unload(name)
        for name in MODE_PINS[mode]:
            self.ensure(name)

    def ensure(self, name):
        if name in self.resident:
            self.resident[name] = now()
            return handle(name)
        while used(self.resident) + MEASURED[name]['gb'] > self.budget:
            self.unload(lru_unpinned(self.resident))    # LRU, pins exempt
        load(name)                                  # timed + logged: the
        self.resident[name] = now()                 #   ledger stays measured
        return handle(name)

# ---- disk cache eviction: cost-aware LRU with pins -------------------
# entry: {'id', 'mb', 'last_used', 'pinned', 'regen_ms'}
# policy: never touch pinned; among unpinned, evict lowest
#   (regen_ms / mb) first, oldest first within a band  -> lab builds it
#
# regen_ms comes from the SAME stage-timing telemetry the profiler logs:
# one source of truth, so the cost table cannot rot separately.`,
    notes: [
      'enter_mode evicting BEFORE the mode begins is the battle-stations rule: live mode\'s first frame must find the card already configured — discovering an over-budget allocation mid-performance is the crash the transition event exists to prevent.',
      'The director\'s CPU-offload option is worth its asterisk: planning happens off the render\'s critical path, llama.cpp on a desktop CPU emits a plan in seconds, and the entire GPU stays free for media — "slower hardware" as the correct architecture.'
    ]
  },
  lab: {
    title: 'The two allocators: residency planning and cost-aware eviction',
    prompt: 'Two policy functions. (1) <code>residency_plan(models, vram_gb, headroom_gb)</code>: <code>models</code> maps name → <code>{"gb", "uses_per_hour"}</code>. Greedily pin models in descending <code>uses_per_hour</code> (ties: smaller <code>gb</code> first) while total pinned gb + headroom ≤ vram_gb; everything else is on-demand. Return <code>{"warm": [names in pin order], "on_demand": [remaining names, same sort order]}</code>. (2) <code>evict(entries, budget_mb)</code>: entries are <code>{"id", "mb", "last_used", "pinned", "regen_ms"}</code>. If total ≤ budget, return <code>[]</code>. Never evict pinned. Among unpinned, evict lowest <code>regen_ms/mb</code> first (ties: oldest <code>last_used</code> first) until total ≤ budget. Return evicted ids in eviction order. If evicting ALL unpinned still leaves total > budget, return all unpinned ids (the caller alerts — pins alone exceed budget is an operator problem, not an eviction problem).',
    starter: `def residency_plan(models, vram_gb, headroom_gb):
    # pin by uses_per_hour desc (ties: smaller gb first) while it fits
    pass

def evict(entries, budget_mb):
    # pinned untouchable; lowest regen_ms/mb first, oldest first on ties
    pass`,
    checks: [
      { re: 'def\\s+residency_plan\\s*\\(', flags: '', must: true, hint: 'Define residency_plan(models, vram_gb, headroom_gb).', pass: 'residency_plan defined ✓' },
      { re: 'def\\s+evict\\s*\\(', flags: '', must: true, hint: 'Define evict(entries, budget_mb).', pass: 'evict defined ✓' },
      { re: 'uses_per_hour', flags: '', must: true, hint: 'Warm pins are chosen by usage frequency.', pass: 'usage-driven pinning ✓' },
      { re: 'regen_ms', flags: '', must: true, hint: 'Eviction ranks by regeneration cost per megabyte — the reef chart sleeps indoors.', pass: 'cost-aware ranking ✓' },
      { re: 'pinned', flags: '', must: true, hint: 'Pinned entries are promises, not storage — never evicted.', pass: 'pins respected ✓' }
    ],
    tests: `models = {'director': {'gb': 5.6, 'uses_per_hour': 40},
          'vlm': {'gb': 6.2, 'uses_per_hour': 12},
          'xtts': {'gb': 2.4, 'uses_per_hour': 12},
          'head': {'gb': 4.8, 'uses_per_hour': 3}}
r = residency_plan(models, 12.0, 1.5)
assert r['warm'] == ['director', 'xtts'], \
    'director (40) first; tie at 12 broken by size: xtts before vlm; ' \
    'vlm no longer fits (5.6+2.4+6.2+1.5 > 12): got ' + str(r['warm'])
assert r['on_demand'] == ['vlm', 'head']
r2 = residency_plan(models, 24.0, 1.5)
assert r2['warm'] == ['director', 'xtts', 'vlm', 'head'], 'big card: all warm'

E = [{'id': 'emb', 'mb': 1, 'last_used': 10, 'pinned': False, 'regen_ms': 60000},
     {'id': 'frames_a', 'mb': 800, 'last_used': 90, 'pinned': False, 'regen_ms': 90000},
     {'id': 'frames_b', 'mb': 700, 'last_used': 50, 'pinned': False, 'regen_ms': 90000},
     {'id': 'active', 'mb': 900, 'last_used': 99, 'pinned': True, 'regen_ms': 90000}]
assert evict(E, 3000) == [], 'under budget (2401): nothing goes'
ev = evict(E, 1200)
assert ev == ['frames_b', 'frames_a'], \
    'frames first (lowest regen/mb), older frames_b before frames_a; ' \
    'embedding (60000/1 ratio) survives despite being oldest: got ' + str(ev)
assert evict(E, 100) == ['frames_b', 'frames_a', 'emb'], \
    'pins alone exceed budget: all unpinned evicted, caller alerts'
print('residency and eviction policies correct')`,
    solution: `def residency_plan(models, vram_gb, headroom_gb):
    order = sorted(models,
                   key=lambda n: (-models[n]['uses_per_hour'],
                                  models[n]['gb']))
    warm, used = [], 0.0
    for name in order:
        if used + models[name]['gb'] + headroom_gb <= vram_gb:
            warm.append(name)
            used += models[name]['gb']
    on_demand = [n for n in order if n not in warm]
    return {'warm': warm, 'on_demand': on_demand}

def evict(entries, budget_mb):
    total = sum(e['mb'] for e in entries)
    if total <= budget_mb:
        return []
    victims = sorted([e for e in entries if not e['pinned']],
                     key=lambda e: (e['regen_ms'] / e['mb'],
                                    e['last_used']))
    evicted = []
    for e in victims:
        if total <= budget_mb:
            break
        evicted.append(e['id'])
        total -= e['mb']
    return evicted`,
    notes: [
      'The embedding surviving eviction despite being the OLDEST entry is the whole refinement in one test: recency predicts reuse, but the objective is expected regeneration cost — a 60-second remake packed into 1 MB outranks any recency argument.',
      'residency_plan\'s greedy is deliberately simple (frequency, then size). Production adds load-latency amortization (a model used once per hour but taking 10s to load may still earn a pin near an interactive path) — the same "count the waiting" instinct as the realtime lesson, one policy layer up.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Two levels down: what the K-quants and calibration actually do inside a GGUF file (and when the fancier variants matter), and the working-memory anatomy of inference — where the non-weight gigabytes come from.',
    sections: [
      {
        h: 'Inside the quant: blocks, scales, K-quants, and calibration',
        p: 'Naive 4-bit quantization (map each weight to the nearest of 16 levels spanning the whole tensor\'s range) fails because weight distributions have outliers — a few large weights stretch the range and crush precision for the well-behaved majority. Block-wise quantization fixes this: weights are grouped (32-256 per block), each block stores its own scale (and often a minimum), so levels adapt to local range — outliers only damage their own block. The llama.cpp K-quants (q4_K_M and family) refine further: super-blocks with two-level scaling, and MIXED precision across tensor types — attention and output layers (measured as more sensitive) get more bits, feed-forward bulk gets fewer; the _S/_M/_L suffixes trade that mix. Importance-aware variants (i-quants, AWQ/GPTQ in the wider ecosystem) go one step further: run calibration data through the full-precision model, measure which weights actually influence outputs, and spend the bit budget there — meaningfully better at very low bits (2-3 bit territory), marginal at 4-bit-and-up. Operational takeaways: at Q4_K_M most 7-9B models are within a few percent of full-precision on benchmarks and within golden-set thresholds for structured work — the course default stands; below Q4, quality falls off a cliff fast and importance-aware quants become worth their complexity; and quantization choices are PER-MODEL empirical facts (a model heavily trained on code may degrade differently than a chat model at the same bits) — which is one more argument for the golden-set gate over any rule of thumb, including these.'
      },
      {
        h: 'Where the non-weight gigabytes live: KV cache, activations, and the allocator',
        p: 'The ledger\'s "working memory" line unpacks into four different residents. KV cache (LLM/VLM only): per-token, per-layer key/value tensors — for an 8B model at fp16, roughly 0.5 MB per token of context, so a 4K-token planning session holds ~2 GB of cache on top of weights; it scales LINEARLY with context and is why long grounding blocks are a memory decision, not just a latency one (quantized KV cache — q8 keys/values — halves this at negligible quality cost and is increasingly the local-inference default). Activations (all models): intermediate tensors during a forward pass — for diffusion/rendering models these scale with RESOLUTION squared and chunk length, which is exactly why the OOM-suspects answer clamps inputs at intake: activation memory is input-shaped, and the ledger must be measured at the clamps. Allocator overhead: frameworks cache freed blocks for reuse (fast) and fragment over varied shapes (the long-job OOM class) — "free" memory per your code and per nvidia-smi can differ by gigabytes, so the ledger reads the framework\'s allocator stats, and fixed chunk shapes keep fragmentation bounded. And workspace buffers: cuDNN/cuBLAS scratch space per operation configuration — usually small, occasionally surprising (some convolution algorithms trade memory for speed; the fast one may not fit your margin). The headroom line in every budget this course has drawn is these four, given a number — and the reason the number is 1.5 GB and not 150 MB is that three of the four are input-shaped and only reveal their maximum on the worst input a creator will eventually upload.'
      }
    ]
  },
  quiz: [
    {
      q: 'Per-mode residency plans (edit/batch/live) with explicit transitions exist because:',
      options: ['Models corrupt if left loaded', 'Each mode has a different working set and budget shape — and reconfiguring BEFORE the mode begins prevents the mid-session over-budget crash; re-stowing during a broadside is how ships die', 'GPU drivers require mode switches', 'It reduces disk usage'],
      correct: 1,
      explain: 'Edit pins the interaction loop, batch sequences load/run/release, live needs the co-residency sum. Transitions are checklist events, not lazy discoveries.'
    },
    {
      q: 'Quantizing the director to Q4 is the default while the diffusion renderer stays conservative because:',
      options: ['LLMs are smaller anyway', 'Constrained, discrete, machine-validated output absorbs quantization noise; continuous, iterative, human-stared-at output exposes it — compression is invisible in the stew and criminal in the centerpiece', 'Diffusion models cannot be quantized', 'The director runs on CPU'],
      correct: 1,
      explain: 'The schema mask must be overcome for director errors to even exist; diffusion errors compound across denoising steps straight into the artifact a human inspects at full attention.'
    },
    {
      q: 'Every quantization or model-swap decision goes through per-stage golden sets because:',
      options: ['Vendors require benchmarks', 'Quality impact is per-model, per-stage empirical fact — pinned inputs, reference outputs, and a threshold on paper replace "seems fine"; nobody vibes', 'Golden sets are legally mandated', 'It speeds up inference'],
      correct: 1,
      explain: 'Blind side-by-side against a written threshold — the same harness then gates model upgrades, making quant/model/version one decision pipeline instead of three vibes.'
    },
    {
      q: 'Profiling shows the frames stage dominating render time. The highest-leverage lever is:',
      options: ['Quantizing the director further', 'Resolution — previews render at 540p for the edit loop, the approved final at full quality; a 4x pixel reduction in the dominant stage', 'A faster mux codec', 'More aggressive TTS caching'],
      correct: 1,
      explain: 'Optimize where the minutes are: the preview/final split gives creators fast iteration and pretty ships — proxy fidelity at pipeline scale.'
    },
    {
      q: 'A 1 KB speaker embedding untouched for two weeks survives eviction while yesterday\'s 800 MB frames directory goes, because:',
      options: ['Small files are skipped by the scanner', 'Eviction ranks by regeneration cost per megabyte: the embedding costs a model load and consent-gated source audio to remake; frames are bulky and purely derivable from kept coefficients — the sea makes more fish; the reef chart sleeps indoors', 'Embeddings are always pinned', 'LRU ignores file age under 1 MB'],
      correct: 1,
      explain: 'Recency predicts reuse, but the objective is expected regeneration cost — likelihood times cost. Keep small expensive intermediates; let bulky derivables regenerate.'
    }
  ],
  pitfalls: [
    'Budgeting from spec sheets and model cards instead of the allocator. Working memory is input-shaped (KV cache scales with context, activations with resolution), frameworks cache and fragment, and the gap between "should fit" and "fits" is exactly the crash that only happens on a creator\'s worst upload. Measure at the intake clamps; write down YOUR numbers.',
    'Applying one quantization policy across model types because it worked for the LLM. The director\'s Q4 success says nothing about XTTS\'s vocoder texture or the renderer\'s detail floor — compression is per-dish, and each stage\'s golden set is the only opinion that counts.',
    'Shipping the cache without an eviction policy because disks are big. They are big exactly until a month of iterating creators fills them, at which point ad-hoc deletion under pressure evicts something pinned-in-spirit (an active project\'s coefficients, an audit artifact) and the incident review writes the policy you should have designed calmly — budgets, pins, and cost-aware ranking, on paper, before the disk-full alert.'
  ],
  interview: [
    {
      q: 'How do you fit a five-model media pipeline onto a single consumer GPU? Walk through the complete resource strategy.',
      a: 'Layer by layer. Measurement first: every model\'s footprint AND working memory measured from the allocator at the product\'s input clamps (not spec sheets — working memory is input-shaped: KV cache scales with context, activations with resolution), maintained as a ledger with an untouchable headroom margin. Residency policy per mode: the product\'s modes have different working sets — interactive editing pins the LLM director (the interaction loop\'s latency) with media models on demand; batch rendering sequences stages load/run/release, needing only the largest stage plus amortized load latency; live mode co-resides the whole hot path, which forces small variants of everything (and evicts all else BEFORE the session — mode transitions are explicit events). A model manager implements it: LRU-by-usage with per-mode pin lists, timed loads feeding the ledger. Quantization spent unevenly: the text brain hardest (Q4 — constrained discrete output absorbs noise; CPU offload via llama.cpp is often free GPU liberation since planning is off the render\'s critical path), Whisper at int8, TTS/VC carefully (vocoder texture), the renderer most conservatively (continuous iterative output under direct human attention) — every decision gated by per-stage golden sets with written thresholds, never vibes. Then spend where the profiler says the minutes are: frames dominate, so preview/final resolution split (540p edit loop, full-res approved renders), chunked rendering with fixed shapes (memory bounds + fragmentation control + resumability), fp16 where free. And the disk layer mirrors it: content-addressed cache under a size budget with pins for active projects and cost-per-MB-aware eviction — keep small expensive intermediates (embeddings, coefficients), let bulky derivables (frames) regenerate. The through-line I would emphasize: every layer is a measured budget plus a written policy plus an instrumented mechanism — the same discipline three times, at VRAM, GPU-time, and disk.'
    },
    {
      q: 'Your team wants to ship a quantized model to cut memory in half. Design the decision process that says yes or no.',
      a: 'The process exists so the answer comes from evidence, not enthusiasm. (1) Frame the candidate precisely: which model, which quant (Q4_K_M vs int8 vs an importance-aware variant), serving which stage — because quality sensitivity is per-stage: a director tolerates what a renderer cannot. (2) Golden-set gate: the stage\'s pinned reference inputs run through both builds; comparison per the stage\'s native metric — plan-property assertions and validator pass-rates for the LLM, WER deltas for STT, the evaluation suite\'s sync/quality scores for media stages, plus blind human A/B for anything perceptual (the NASA tasting panel: a written threshold, sampled listeners, no vibes). (3) Working-set verification: memory savings are claimed at the ledger — measure the quantized build\'s actual footprint and working memory at input clamps; some quant formats shift memory from weights to activations or need dequant buffers, and half-the-weights is not always half-the-total. (4) Performance check both directions: quantization usually speeds inference (bandwidth-bound), but verify on target hardware — and check load time too, since residency policies amortize it. (5) Downstream ceilings: run the CHAIN, not just the stage — a slightly grainier TTS may pass its own threshold and still degrade lip-sync downstream (the chain of ceilings); the golden set for dependent stages runs against the new upstream output. (6) Ship decision with the rollback: version the quant into every cache key (honest invalidation), canary if the product has the population for it, and keep the full-precision build one config flag away. Decline criteria stated upfront: any golden threshold breach, any downstream regression, or memory savings that the ledger shows we do not actually need this quarter — halving memory you are not short of, at any quality cost, is a trade with no buyer.'
    },
    {
      q: 'Explain why cache eviction policy deserves design attention in a generative-media product, and compare the candidate policies.',
      a: 'Because the cache IS the product\'s iteration speed — re-renders costing seconds instead of minutes is why creators iterate — and eviction decides which of those promises survive disk pressure; get it wrong and the failure is a returning creator\'s project costing a full pipeline walk, or worse, an audit artifact deleted. Candidates: FIFO/size-only — trivial, and wrong: it correlates with nothing that matters. Plain LRU — the right base signal (recency predicts reuse; cache hits are uses) and adequate when artifact costs are uniform, but media artifacts span five orders of magnitude in regeneration cost: LRU happily evicts a two-week-old speaker embedding (kilobytes, expensive: model load + consent-gated source) to keep yesterday\'s frames (hundreds of MB, purely derivable from kept coefficients). Cost-aware LRU — rank unpinned entries by regeneration-cost-per-megabyte, oldest-first within bands: the objective is expected regeneration cost (reuse likelihood × remake cost), and the cost term dominates when costs vary this widely; derive the costs from the pipeline\'s own stage-timing telemetry so the table cannot rot independently. Above ALL policies, pins: active projects\' artifacts and anything the audit/consent trail requires sit outside the eviction domain — those are promises, not storage; and if pins alone exceed budget, that is an operator alert, never a policy improvisation. Two implementation notes that outlast the policy choice: the size budget is a dashboard number with an alert margin (eviction under calm beats deletion under pressure), and the keep-vs-evict split doubles as the sync policy when cloud storage arrives — small expensive intermediates travel, bulky derivables regenerate locally, the sparse-valuable versus dense-derivable split one more time.'
    },
    {
      q: 'A product review asks: "Why does our app need 12 GB of VRAM when [competitor] runs in the browser?" Give the honest engineering answer.',
      a: 'The honest answer has three parts: what the competitor is actually doing, what our number actually buys, and which parts of it are negotiable. What browser-based competitors do: the models run on THEIR servers — the browser is a thin client streaming results; the VRAM did not disappear, it moved to a datacenter and onto a subscription bill, along with the user\'s face and voice biometrics (our local-first architecture is a privacy feature precisely because the 12 GB is the user\'s own). What the 12 GB buys, itemized from the ledger: the talking-head renderer (the quality ceiling — the artifact users judge), TTS/voice conversion, Whisper, the VLM, and the director — with the residency policy meaning they are NOT all resident: 12 GB is the live-mode co-residency sum plus margin, and it is measured, not padded. What is negotiable, with prices: the director already runs on CPU (free); deeper quantization of media stages trades visible quality (golden-set-gated, and the renderer is where users look); a smaller renderer variant drops the floor to ~8 GB at a measurable quality delta; live mode is the binding constraint — a batch-only tier sequences stages and runs in ~6 GB (the max, not the sum); and a hybrid tier (local editing, cloud rendering for weak hardware) is architecture we could build — the stage contracts make stages portable — but it re-imports the privacy and cost questions the product exists to answer. Then the reframe the review deserves: the right question is not "why 12" but "which tier of hardware do we serve at which quality," and the ledger + golden sets + residency policies are exactly the machinery that lets us answer that as a product decision with measured tradeoffs instead of a defensive number.'
    }
  ]
};
