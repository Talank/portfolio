window.LESSONS = window.LESSONS || {};
window.LESSONS['choosing-your-engine'] = {
  id: 'choosing-your-engine',
  title: 'The Menu, Decided: Latency, License, VRAM & Quality',
  category: 'Part 1 — The Local Engine Menu',
  timeMin: 35,
  summary: 'You now know the four engines individually; this lesson turns them into a decision. Real products rarely pick one engine — they run two or three behind a single interface and route each request to the right one, exactly like the two-LLM (small/large) pattern. Here you learn the axes that actually decide the route — latency budget, license, VRAM/hardware, quality need, and capability (cloning? non-verbal?) — build the routing table for StrawHat Narrator, and internalize the one architectural rule that makes all of it maintainable: engines are plugins behind a common synth() seam, never hard dependencies. Get this right and "swap the engine" is a config change forever.',
  goals: [
    'List the axes that decide an engine route: latency, license (commercial?), VRAM/hardware, quality bar, and capability (clone/non-verbal)',
    'Build a routing function that maps a request\'s constraints to the right engine deterministically',
    'Design the common synth() interface so engines are swappable plugins, not woven-in dependencies',
    'Explain why multi-engine-behind-one-interface is the same discipline as small/large LLM routing',
    'Avoid the two classic failures: one-engine-for-everything, and a different code path per engine'
  ],
  concept: [
    {
      h: 'The menu, side by side',
      p: [
        'Four engines, four jobs. <b>Piper</b> — fast (faster-than-realtime on CPU), tiny, MIT, offline, fixed voice, modest expressiveness: the reliable workhorse and the live/low-latency path. <b>Kokoro</b> — small, fast, high quality, Apache (shippable), fixed voice, no cloning: the "sounds expensive and I can ship it" upgrade over Piper. <b>XTTS</b> — large, GPU-preferred, expressive, multilingual, zero-shot cloning, but CPML (non-commercial): the cloning and maximum-expressiveness engine for hero lines and personal projects. <b>Bark</b> — generative, GPU, slow, nondeterministic, MIT, does real non-verbal (laughs/sighs/music): the delight specialist, curated and frozen, never on the critical path.',
        'The thing to notice is that <b>no single engine dominates</b> — each wins a different corner, and the corners are defined by concrete, checkable properties, not vibes. That is what makes engine selection an engineering decision rather than a taste debate: given a request\'s constraints, exactly one (or a small set) of these is correct, and you can compute which. The rest of the lesson is turning "I know the four" into "I can route any request."'
      ]
    },
    {
      h: 'The axes that actually decide the route',
      p: [
        'Five axes carry almost every decision. <b>Latency budget:</b> does this need to be near-instant (live avatar, UI response) or can it render offline over seconds/minutes? Live → Piper/Kokoro (CPU-fast); offline-ok opens the door to XTTS/Bark. <b>License / commercial:</b> will this ship in a paid product? Yes → MIT/Apache only (Piper, Kokoro, Bark), never CPML XTTS as-is. No (personal/research) → anything. <b>Hardware / VRAM:</b> is there a GPU, and how much? No GPU → Piper/Kokoro; a decent GPU → XTTS/Bark become practical. <b>Quality bar:</b> "just say it clearly" → Piper; "must sound premium" → Kokoro/XTTS. <b>Capability:</b> the hard gates — must it clone a specific voice? Only XTTS. Must it produce a real laugh/sigh? Only Bark. Capability is checked first because it can eliminate everything else regardless of the other axes.',
        'These axes are not equally weighted; some are <b>hard gates</b> (a request that must clone a voice simply cannot use Piper, full stop; a commercial product simply cannot ship CPML) and some are <b>preferences</b> (quality, latency headroom) that break ties among the survivors. So the routing logic is: apply the hard capability and license gates to eliminate impossible engines, then rank the survivors by the soft axes (latency, quality, cost) and pick the best. This is identical in shape to how you\'d route between a small and large LLM — cheap/fast by default, escalate to the expensive model only when the request\'s requirements force it — which is why this pattern feels familiar and transfers across the whole field of applied-ML systems.'
      ]
    },
    {
      h: 'One interface, engines as plugins',
      p: [
        'The architectural rule that makes multi-engine sane is a single <b>synth() interface</b> every engine implements, with the router choosing which implementation runs. Callers say "synthesize this text, for this voice/character, with these constraints" and never name an engine; the router applies the axes and dispatches. Around <i>all</i> engines uniformly you wrap the shared pipeline — text normalization (Part 2), chunking and caching (Part 3) — so those behaviors are engine-independent and written once. The engine becomes a thin plugin: "given normalized text and settings, return audio bytes," nothing more.',
        'The payoff is enormous and compounding. Adding next quarter\'s better model is writing one new plugin and adding a row to the routing table — zero caller changes. Reacting to a license change (XTTS commercializes, or you need to drop it) is swapping the plugin behind "clone this voice" — zero caller changes. Caching, normalization, logging, and privacy routing all live in the shared wrapper, so they\'re consistent across engines by construction. The two failure modes this prevents are the ones that kill real codebases: <b>one engine for everything</b> (you contort a workhorse into doing cloning badly, or pay XTTS\'s cost for a UI beep) and <b>a bespoke code path per engine</b> (normalization and caching get reimplemented three times, inconsistently, and a bug fixed in one path silently persists in the others). One seam, many plugins, a router in between — that is the whole architecture, and it\'s the same seam the privacy router (Part 0) and the small/large LLM router plug into.'
      ]
    },
    {
      h: 'StrawHat Narrator\'s routing, concretely',
      p: [
        'Make it real with the capstone. StrawHat Narrator renders a script of speaker-labeled lines, mostly to pre-rendered files (offline, so latency is generous), non-commercial (a learning project), on whatever hardware the learner has. So its routing: the <b>bulk of lines</b> → a fixed high-quality voice per character (Piper or Kokoro — CPU-friendly, deterministic, cacheable), cast per speaker (Part 2). A line that needs <b>a specific cloned voice</b> or maximum emotional range → XTTS (allowed here because it\'s non-commercial), on GPU if available, else the fixed-voice fallback. A genuine <b>non-verbal hero beat</b> (a real belly laugh worth curating) → Bark, generated offline and frozen. And Luffy\'s everyday "shishishi" → not an engine choice at all, but a Part-2 text trick on his cast voice.',
        'Notice how the axes resolved it: no commercial constraint means XTTS is on the table; generous latency means the slow engines are usable; per-character consistency and cacheability push the bulk to fixed-voice engines; and capability gates (clone / real-laugh) pull in XTTS/Bark only for the specific lines that need them. If the project ever went commercial, exactly one thing changes — XTTS drops out and a permissive cloning engine (or no cloning) takes its slot behind the same interface — and nothing else in the pipeline moves. That is the routing table doing its job: encoding the decision once, so the app is constraints-in, engine-out, and the engines stay swappable forever.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami Assigns the Crew by the Job',
      text: [
        'A storm is coming, the ship needs five things done at once, and Nami — clipboard out — does not send Luffy to do everything just because he\'s the captain. She routes by the job. "Zoro: haul the anchor line, it needs raw power and nothing else — you\'re slow to convince but you never drop it." "Chopper: anyone hurt, that\'s you and only you, nobody else can do it." "Usopp: the signal flares, but ONLY the flares — I need someone who can improvise and I can afford a surprise there, not on the anchor." "Sanji: galley, keep everyone fed and steady, reliable, every time." "Luffy: you\'re the emergency muscle, held in reserve for the one moment that needs a miracle, because you\'re expensive to aim and I can\'t predict what you\'ll do." Five crew, five jobs, matched by what each is actually best at — and the specialists (Chopper for wounds, the improviser for flares) reserved for exactly the tasks only they can do.',
        'Robin watches and names the method. "You didn\'t rank the crew from best to worst and assign top-down. You listed what each task REQUIRES — power, healing, reliability, improvisation, a miracle — and matched. The anchor doesn\'t care that Luffy\'s stronger; it needs \'never drops it,\' which is Zoro. And you kept the interface simple: you say what needs doing, and the right person steps up — nobody argues about who." Nami nods without looking up. "And when someone new joins, I don\'t rewrite the whole plan. I just learn what they\'re best at and add them to the list. The plan is \'match the job to the crew,\' not \'these five specific people\' — so the crew can change and the plan still works." The storm hits; everyone is exactly where they should be.'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Assembling the Move by Who\'s Good at What',
      text: 'The gang has to move Ross\'s furniture, and Ross, panicking, wants everyone to just grab everything. Monica takes over and routes by capability. "Ross, no. Joey has the strength — he takes the couch, that\'s all he\'s good for and it\'s exactly what the couch needs. Chandler\'s useless at lifting but great at logistics — he directs traffic and labels boxes. Phoebe\'s the only one with a van — she is the ONLY option for transport, so that\'s non-negotiable. Rachel\'s careful — she packs the fragile stuff nobody else can be trusted with." Ross: "Why can\'t everyone just... help with everything?" "Because," Monica says, "then Joey packs the china and it\'s dust, and Chandler lifts the couch and throws out his back, and we own one van whether you like it or not. You match the person to the task by what the task needs. And—" she hands out roles on index cards "—it\'s written down, so when my cousin shows up to help, I add a card, I don\'t redo the plan." PIVOT, famously, goes better when the right person is on the stairs.'
    },
    why: 'Nami and Monica are both running the exact engine-routing algorithm: don\'t rank the options best-to-worst and pick a favorite for everything — list what each TASK requires (power, healing, a van, reliability, improvisation) and MATCH, reserving specialists (Chopper/the only van/the improviser) for the hard capability gates only they satisfy. That\'s "capability gates first, then rank survivors," and it maps one-to-one onto the menu: Piper/Kokoro for the reliable bulk, XTTS reserved for cloning (the only one who can), Bark reserved for real laughs (the improviser you can afford a surprise from). And "say what needs doing and the right one steps up / add a card when someone new joins, don\'t rewrite the plan" is precisely the swappable synth() interface with a routing table — the crew (engines) can change and the plan (callers) never has to.'
  },
  tech: [
    {
      q: 'Why route among several engines instead of just picking the single "best" one and using it everywhere?',
      a: 'Because "best" is per-request, not global — each engine wins a different corner, and no engine wins all of them. Use only Piper and you literally cannot clone a voice or produce a real laugh; use only XTTS and you pay a GPU and a non-commercial license for a UI beep, blow your latency budget on the live path, and make your build nondeterministic and slow; use only Bark and nothing is reliable or repeatable. The corners are defined by hard, checkable properties — capability (cloning, non-verbal), license (commercial-safe or not), hardware (GPU present?), latency budget, quality bar — and a given request\'s constraints often make exactly one engine correct and others impossible. Routing lets each request get the engine that fits it: the fast free workhorse for the bulk, the expensive specialist only where its unique capability is required. It\'s the same reason production LLM systems route between a small cheap model and a large expensive one instead of sending everything to the big one — you match the costly resource to the jobs that actually need it, and serve everything else cheaply. Single-engine is either under-capable (can\'t do the hard jobs) or over-costly (pays specialist prices for trivial ones); routing is how you get both capability and efficiency.'
    },
    {
      q: 'Which axes are hard gates and which are soft preferences, and why does the order matter?',
      a: 'Hard gates eliminate engines outright: capability (must clone a specific voice → only XTTS survives; must produce a real non-verbal → only Bark) and license (commercial product → CPML XTTS is out, full stop) — a request failing a hard gate cannot use that engine no matter how good it is on other axes. Soft preferences rank the survivors: latency budget, quality bar, cost/VRAM, determinism — these break ties among engines that are all legal and capable for the request. Order matters because applying gates first is both correct and efficient: it shrinks the candidate set to the feasible ones before you spend effort ranking, and it prevents the classic bug of picking an engine that scores great on quality/latency but is actually illegal (CPML in a paid product) or incapable (Piper asked to clone). So the algorithm is: capability gate → license gate → then rank the remaining by the soft axes and choose the top. If the gates eliminate everything (e.g. commercial + must-clone with only CPML cloning available), that\'s not a routing failure to paper over — it\'s a real constraint conflict the router should surface, so a human decides (license XTTS commercially, find a permissive cloner, or drop cloning) rather than the code silently doing something wrong.'
    },
    {
      q: 'What exactly belongs inside the synth() interface versus inside each engine plugin?',
      a: 'The interface owns everything that should behave identically no matter which engine runs; the plugin owns only the engine-specific act of turning normalized text into audio. Concretely, the shared synth() wrapper handles: input validation, TEXT NORMALIZATION (Part 2 — numbers/acronyms/Big-O expanded once, consistently), CHUNKING (Part 3 — sentence splitting), CACHING (Part 3 — content-addressed lookup before any engine runs), the ROUTING decision (apply the axes, pick the engine), privacy routing (Part 0 — sensitive text stays local), logging, and error/retry policy. The plugin implements a tiny contract — something like `render(normalized_text, voice, settings) -> audio_bytes` — plus metadata the router needs (license, can_clone, needs_gpu, deterministic). That division is what makes the system maintainable: normalization and caching are written and fixed once and apply to every engine automatically, so you can\'t fix a normalization bug in the Piper path and forget it in the XTTS path — there is only one path. It also makes engines trivially swappable and testable: a new engine is a small plugin conforming to the contract, and you can unit-test the shared pipeline with a fake plugin that returns silence. The anti-pattern to avoid is leaking shared concerns into plugins (each engine doing its own normalization or caching), which reintroduces inconsistency and duplicate bugs — the exact thing the single interface exists to prevent.'
    }
  ],
  code: {
    title: 'The router and the plugin seam',
    intro: 'The whole Part-1 argument as code: engines described as data, a router that applies gates then ranks, and one synth() seam callers use. Pure-Python, runs anywhere.',
    code: `# Engines are DATA (a plugin registry), not hard-coded branches.
ENGINES = {
  "piper":  {"license": "MIT",     "clone": False, "nonverbal": False,
             "gpu": False, "fast": True,  "quality": 3, "deterministic": True},
  "kokoro": {"license": "Apache",  "clone": False, "nonverbal": False,
             "gpu": False, "fast": True,  "quality": 4, "deterministic": True},
  "xtts":   {"license": "CPML",    "clone": True,  "nonverbal": False,
             "gpu": True,  "fast": False, "quality": 5, "deterministic": False},
  "bark":   {"license": "MIT",     "clone": False, "nonverbal": True,
             "gpu": True,  "fast": False, "quality": 4, "deterministic": False},
}
COMMERCIAL_SAFE = {"MIT", "Apache"}

def route(req):
    # req: {commercial, need_clone, need_nonverbal, live, has_gpu}
    candidates = []
    for name, e in ENGINES.items():
        if req["commercial"] and e["license"] not in COMMERCIAL_SAFE:  # HARD gate
            continue
        if req["need_clone"] and not e["clone"]:                       # HARD gate
            continue
        if req["need_nonverbal"] and not e["nonverbal"]:               # HARD gate
            continue
        if req["live"] and not e["fast"]:                             # HARD gate
            continue
        if e["gpu"] and not req["has_gpu"]:                           # HARD gate
            continue
        candidates.append((name, e))
    if not candidates:
        return None                     # constraint conflict -> surface it
    # SOFT rank: prefer higher quality, then faster, then deterministic
    candidates.sort(key=lambda ne: (ne[1]["quality"], ne[1]["fast"],
                                    ne[1]["deterministic"]), reverse=True)
    return candidates[0][0]

# Callers NEVER name an engine:
#   synth("Two pointers walk in.", req={...})  -> router picks -> plugin runs
# Add a better model = one new dict entry. Zero caller changes.`,
    notes: [
      'Engines-as-data + gates-then-rank is the entire routing discipline. A new model is a registry row; a license change flips one field; callers are untouched either way.',
      'route() returning None on a constraint conflict (e.g. commercial + need_clone with only CPML cloning) is a feature — it surfaces an impossible request for a human to resolve instead of silently shipping something illegal or incapable.'
    ]
  },
  lab: {
    title: 'Build the engine router: gates first, then rank',
    prompt: 'Implement <code>choose_engine(engines, req)</code>. <code>engines</code> is a dict of <code>name → {license, clone, nonverbal, gpu, fast, quality}</code>. <code>req</code> is <code>{commercial, need_clone, need_nonverbal, live, has_gpu}</code>. Apply these HARD gates (eliminate an engine if any fails): if <code>req["commercial"]</code>, the engine\'s license must be in <code>{"MIT", "Apache"}</code>; if <code>req["need_clone"]</code>, engine <code>clone</code> must be True; if <code>req["need_nonverbal"]</code>, engine <code>nonverbal</code> must be True; if <code>req["live"]</code>, engine <code>fast</code> must be True; if the engine needs <code>gpu</code> but <code>req["has_gpu"]</code> is False, eliminate it. Among survivors, return the name with the highest <code>quality</code>; break ties by name alphabetically. If none survive, return <code>None</code>.',
    starter: `COMMERCIAL_SAFE = {"MIT", "Apache"}

def choose_engine(engines, req):
    # hard gates -> survivors; then max quality, tie-break by name; else None
    pass`,
    checks: [
      { re: 'def\\s+choose_engine\\s*\\(', flags: '', must: true, hint: 'Define choose_engine(engines, req).', pass: 'choose_engine defined ✓' },
      { re: 'COMMERCIAL_SAFE|MIT', flags: '', must: true, hint: 'Gate commercial requests to MIT/Apache licenses.', pass: 'license gate present ✓' },
      { re: 'quality', flags: '', must: true, hint: 'Rank survivors by quality.', pass: 'quality ranking present ✓' },
      { re: 'None', flags: '', must: true, hint: 'Return None when no engine survives the gates.', pass: 'None fallback present ✓' }
    ],
    tests: `E = {
  "piper":  {"license":"MIT","clone":False,"nonverbal":False,"gpu":False,"fast":True,"quality":3},
  "kokoro": {"license":"Apache","clone":False,"nonverbal":False,"gpu":False,"fast":True,"quality":4},
  "xtts":   {"license":"CPML","clone":True,"nonverbal":False,"gpu":True,"fast":False,"quality":5},
  "bark":   {"license":"MIT","clone":False,"nonverbal":True,"gpu":True,"fast":False,"quality":4},
}
base = {"commercial":False,"need_clone":False,"need_nonverbal":False,"live":False,"has_gpu":True}
# bulk offline non-commercial, gpu present: highest quality survivor = xtts
assert choose_engine(E, base) == "xtts"
# commercial: xtts (CPML) eliminated -> best of MIT/Apache = kokoro(4) over bark(4)? tie-break name -> bark<kokoro
assert choose_engine(E, {**base, "commercial":True}) == "bark", "MIT/Apache only; quality 4 tie -> alpha 'bark'"
# live (fast required): only piper/kokoro -> kokoro (q4)
assert choose_engine(E, {**base, "live":True}) == "kokoro"
# need clone: only xtts
assert choose_engine(E, {**base, "need_clone":True}) == "xtts"
# need clone + commercial: xtts is CPML -> None
assert choose_engine(E, {**base, "need_clone":True, "commercial":True}) is None
# no gpu: gpu engines gone -> kokoro
assert choose_engine(E, {**base, "has_gpu":False}) == "kokoro"
print("engine router correct")`,
    solution: `COMMERCIAL_SAFE = {"MIT", "Apache"}

def choose_engine(engines, req):
    survivors = []
    for name, e in engines.items():
        if req["commercial"] and e["license"] not in COMMERCIAL_SAFE:
            continue
        if req["need_clone"] and not e["clone"]:
            continue
        if req["need_nonverbal"] and not e["nonverbal"]:
            continue
        if req["live"] and not e["fast"]:
            continue
        if e["gpu"] and not req["has_gpu"]:
            continue
        survivors.append((name, e))
    if not survivors:
        return None
    survivors.sort(key=lambda ne: (-ne[1]["quality"], ne[0]))
    return survivors[0][0]`,
    notes: [
      'Gates-then-rank, and the None case is deliberate: commercial + need_clone with only a CPML cloning engine has no valid answer, and the router says so instead of guessing. Surfacing impossible requests is a feature.',
      'Tie-break by name keeps routing deterministic — the same request always yields the same engine, which matters for reproducibility and for not surprising callers. Sorting by (-quality, name) does both at once.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'One level down: cost-based routing (not just feasibility) and why the router itself must stay dumb.',
    sections: [
      {
        h: 'From feasibility routing to cost routing',
        p: 'The router in the lesson answers "which engines CAN serve this?" and picks the highest quality survivor — feasibility plus a quality preference. Production systems often go further and route on COST, because among feasible engines the cheap one should win unless quality genuinely demands otherwise. Concretely you attach a cost model to each engine — CPU/GPU seconds per character, VRAM footprint, energy — and a quality-need level to each request, then pick the cheapest engine that clears the request\'s quality bar rather than the highest-quality engine overall. A UI notification doesn\'t need Kokoro\'s polish; Piper clears its bar for a fraction of the compute, so route it to Piper even though Kokoro "scores higher." This is precisely the small/large LLM economics: send the easy 90% to the cheap model and escalate only the hard 10%, and your bill and latency collapse without hurting outcomes. The design lesson is that "best quality available" is usually the wrong objective; "cheapest that meets the requirement" is right, because it frees the expensive resources for the requests that actually need them. Building this means the request must carry an honest quality requirement (not everyone gets "maximum"), which is a product decision as much as an engineering one — and getting teams to admit most requests are low-stakes is half the battle.'
      },
      {
        h: 'Keep the router dumb: policy as data, not code',
        p: 'A tempting mistake is to let the router grow clever — special cases, heuristics, "if the text mentions a person\'s name and it\'s Tuesday, use XTTS." Resist it. The router should be a small, pure, deterministic function over DATA: an engine registry (capabilities, license, cost) and a request (constraints, quality need) in, an engine name out, with the actual decision logic expressed as declarative rules you can read, test, and change without touching code paths. Why: a dumb router is testable exhaustively (enumerate request types, assert the chosen engine), auditable (you can explain every route from the data), and safe to change (edit a registry field, not a tangle of branches). The moment routing logic sprawls into imperative special-casing, it becomes the least-tested, most-surprising part of the system — the place where a paid product accidentally routes to a non-commercial engine because some branch didn\'t re-check the license. The discipline mirrors the whole Part: engines are data behind one seam, and the router that chooses among them is itself data-driven policy, not bespoke logic. Complexity belongs in the plugins (each engine\'s real work) and in the shared pipeline (normalization, caching); the router in the middle stays boring on purpose, because boring is what you can trust with a decision that has legal and cost consequences.'
      }
    ]
  },
  quiz: [
    {
      q: 'Real TTS products typically:',
      options: ['Pick the single best engine and use it for everything', 'Run two or three engines behind one interface and route each request to the right one', 'Use only cloud engines', 'Rewrite the app when they change engines'],
      correct: 1,
      explain: 'No engine wins every corner. Multi-engine-behind-one-interface (like small/large LLM routing) matches each request to the engine that fits its constraints.'
    },
    {
      q: 'Which pair are HARD gates that eliminate engines outright (vs soft tie-breakers)?',
      options: ['Quality and latency headroom', 'Capability (must clone / must do real non-verbal) and license (commercial → no CPML)', 'Sample rate and file format', 'Voice name and language only'],
      correct: 1,
      explain: 'Capability and license are hard gates — a request that must clone can\'t use Piper; a paid product can\'t use CPML XTTS. Quality/latency rank the survivors.'
    },
    {
      q: 'The synth() interface should own ______, and each engine plugin should own ______.',
      options: ['nothing / everything', 'normalization, chunking, caching, routing, logging / turning normalized text into audio bytes', 'only the voice name / the whole pipeline', 'the GPU driver / the license'],
      correct: 1,
      explain: 'Shared behaviors (normalization, caching, routing…) live once in the interface so they\'re consistent; the plugin is a thin "normalized text → audio" contract.'
    },
    {
      q: 'For StrawHat Narrator (offline, non-commercial, per-character), the bulk of lines route to:',
      options: ['XTTS for everything', 'Bark for everything', 'A fixed high-quality voice per character (Piper/Kokoro) — CPU-friendly, deterministic, cacheable — with XTTS/Bark reserved for the few lines that need cloning or real non-verbal', 'A cloud API'],
      correct: 2,
      explain: 'Generous latency + per-character consistency + cacheability push the bulk to fixed-voice engines; capability gates pull in XTTS/Bark only for specific lines.'
    },
    {
      q: 'The router returns None for a "commercial + must-clone" request when only CPML cloning exists. That is:',
      options: ['A bug to hide with a default', 'A feature — it surfaces a real constraint conflict for a human to resolve (license XTTS, find a permissive cloner, or drop cloning)', 'Impossible', 'A reason to abandon routing'],
      correct: 1,
      explain: 'An impossible request should be surfaced, not papered over. None forces a real decision instead of silently shipping something illegal or incapable.'
    }
  ],
  pitfalls: [
    'One engine for everything: contorting a workhorse into bad cloning, or paying XTTS\'s GPU + non-commercial cost for a UI beep. Route by the request\'s constraints instead — capability and license gates first.',
    'A bespoke code path per engine, each re-implementing normalization/caching. Bugs get fixed in one path and persist in the others. Put shared behavior in one synth() seam; make engines thin plugins.',
    'Letting the router grow clever with special-cases. Keep it a dumb, testable, data-driven function (registry + request → engine). Sprawling routing logic is where a paid product accidentally routes to a non-commercial engine.'
  ],
  interview: [
    {
      q: 'Design the engine-selection layer for a local TTS product with narration, cloning, and character laughs. Walk through it.',
      a: 'I\'d build a router over an engine registry behind one synth() interface. The registry describes each engine as data: license, capabilities (clone, non-verbal), hardware need (GPU), speed, quality, determinism — Piper (MIT, fast, CPU, fixed voice), Kokoro (Apache, fast, CPU, premium fixed voice), XTTS (CPML, GPU, cloning, expressive), Bark (MIT, GPU, real non-verbal, nondeterministic). A request carries its constraints: commercial or not, needs cloning, needs real non-verbal, latency budget, GPU availability, quality bar. Routing is gates-then-rank: apply hard gates first — capability (only XTTS clones; only Bark does real laughs), license (commercial ⇒ MIT/Apache only), hardware (no GPU ⇒ CPU engines), latency (live ⇒ fast engines) — to get the feasible set, then rank survivors by the soft axes, ideally cheapest-that-meets-the-quality-bar rather than highest-quality-overall. Concretely: narration bulk routes to Piper/Kokoro (fast, deterministic, cacheable, cast per character); cloning lines route to XTTS if non-commercial and GPU present; hero laughs route to Bark, generated offline and frozen into assets so the pipeline stays deterministic. Crucially, callers never name an engine — they pass text plus constraints — and the shared wrapper does normalization, chunking, and caching around every engine uniformly. Adding a better model is a registry row; a license change flips a field; an impossible request (commercial + must-clone with only CPML cloning) returns None and surfaces for a human. The router itself stays a dumb, testable, data-driven function so the decision — which has legal and cost consequences — is auditable.'
    },
    {
      q: 'Why is multi-engine TTS routing "the same problem" as routing between a small and large LLM?',
      a: 'Because both are the general pattern of matching an expensive, capable resource to only the requests that need it, while serving the rest cheaply — and both hinge on the same architecture. In LLM routing you default to a small, fast, cheap model and escalate to the large expensive one only when the request\'s difficulty or quality requirement forces it; the payoff is that the easy majority costs little and the hard minority still gets what it needs. In TTS routing you default to a fast, free, deterministic engine (Piper/Kokoro) and escalate to a heavy specialist (XTTS for cloning, Bark for non-verbal) only when a hard capability gate demands it; same payoff. The shared discipline is threefold: describe options as data (a registry with capabilities and costs), decide per-request by feasibility gates then cost/quality ranking (not a global "best"), and put every option behind one interface so callers request a capability, not an implementation, and the shared pipeline (prompt assembly / normalization, caching) wraps all of them uniformly. Recognizing the isomorphism is practically useful: the caching, the fallback-on-failure, the "surface impossible requests," the "keep the router dumb" lessons all transfer directly between the two, and a team that has built one can build the other quickly.'
    },
    {
      q: 'How do you keep an engine swap — say, replacing XTTS after a license change — from rippling through the codebase?',
      a: 'By ensuring XTTS was never a dependency callers could see in the first place. Everything is built on one synth() interface: callers pass text plus constraints and get audio, never naming an engine; the router picks the engine from the data registry; and each engine is a thin plugin implementing a tiny contract (normalized text + settings → audio bytes) plus metadata (license, capabilities, cost). All the shared behavior — normalization, chunking, caching, privacy routing, logging — lives in the wrapper around every engine, not in any plugin. Given that, replacing XTTS is: write or install a new cloning plugin conforming to the contract, update its registry row (or flip XTTS\'s commercial-safe flag to false so the router stops selecting it for commercial requests), and re-run the routing tests. Zero caller changes, because callers never referenced XTTS; zero pipeline changes, because normalization/caching aren\'t in the plugin. The insurance that makes this true is discipline enforced from day one: no engine-specific code leaks into callers or gets special-cased in the router, and shared concerns never get reimplemented inside a plugin. If you skipped that discipline and wove XTTS calls through the app, the swap becomes a grep-and-pray refactor — which is exactly the outcome the single seam exists to prevent, and why I\'d put the seam in before writing the second engine, not after.'
    }
  ]
};
