window.LESSONS = window.LESSONS || {};
window.LESSONS['caching-and-manifests'] = {
  id: 'caching-and-manifests',
  title: 'Caching & the Manifest: Never Render the Same Line Twice',
  category: 'Part 3 — Pipeline Engineering',
  timeMin: 40,
  summary: 'Rendering is the slow, expensive part — so the single biggest lever in a real pipeline is not rendering the same line twice. This lesson is content-addressed caching: hash everything that affects a clip\'s sound (text, voice, prosody, engine) into a key, name the audio file by that key, and skip synthesis whenever the file already exists. Change one sentence and only that sentence re-renders; everything else is an instant cache hit. Paired with it is the manifest — the JSON index that maps each script line to its clip and metadata, so playback knows what to load and a build knows what\'s missing. Together they turn a 10-minute full render into a 5-second incremental one, and make renders deterministic and resumable. This is exactly the mechanism the episode build uses to re-render only Luffy and Nami while keeping 439 other clips.',
  goals: [
    'Explain content-addressed caching: a key hashed from everything that affects the output, used as the filename',
    'Identify what MUST go into the key (text, voice, prosody, engine) and why leaving one out causes stale audio',
    'Build the render loop: hash → if file exists skip, else synthesize and write — deterministic and resumable',
    'Design the manifest: a JSON index mapping lines → clips + metadata that playback and builds both read',
    'Understand invalidation: changing a line changes its hash changes its file, so only affected clips re-render'
  ],
  concept: [
    {
      h: 'Content-addressed caching: the key IS the content',
      p: [
        'Synthesis is the costly step — seconds of compute (or GPU time) per line, hundreds of lines per script. The highest-leverage optimization is simply <b>not doing it twice</b>: if you\'ve already rendered a given line in a given voice with given prosody, reuse that clip instead of regenerating an identical one. The clean way to do this is <b>content-addressed caching</b>: compute a hash of everything that determines the clip\'s sound, and use that hash as the clip\'s filename. Before synthesizing a line, compute its key and check whether <code>key.wav</code> already exists — if it does, that exact audio is already on disk, so skip. If it doesn\'t, synthesize and save it as <code>key.wav</code>. The filename literally IS a fingerprint of the content, which is why it\'s called content-addressed.',
        'This gives you three properties for free. <b>Automatic reuse:</b> identical inputs always produce the same key, so a repeated line (or an unchanged line on the next build) is an instant hit — no synthesis. <b>Automatic invalidation:</b> change anything that affects the sound and the key changes, so the old clip is ignored and the new one renders — no manual cache-busting. <b>Resumability:</b> if a build crashes halfway, re-running skips everything already on disk and continues from where it stopped, because "already rendered" is just "file exists." No separate cache database, no expiry logic, no bookkeeping — the filesystem plus a hash function IS the cache. This is precisely how the episode build re-rendered only the 168 changed Luffy/Nami clips while treating the other 439 as hits: their keys were unchanged, so their files were reused.'
      ]
    },
    {
      h: 'What goes in the key — and the cost of forgetting one',
      p: [
        'The key must hash <b>everything that affects the output audio</b>, and getting this set right is the whole correctness of the cache. At minimum: the <b>spoken text</b> (the normalized string, not the display text), the <b>voice</b> (which model/speaker), the <b>prosody</b> (rate, pitch, volume — the composed baseline+delta), and the <b>engine</b> (and ideally its version). If two renders would sound different, their keys must differ; if they\'d sound identical, their keys must match. That is the one invariant, and every field is in the key precisely because it changes the sound.',
        'The failure mode of getting this wrong is <b>stale audio</b>, and it\'s insidious because it fails silently. Forget to include prosody in the key, then change Luffy\'s pitch: the text and voice are unchanged so the key is unchanged, the old clip "already exists," and the pipeline happily serves the OLD pitch forever — your change simply doesn\'t take effect, with no error. Forget the voice, recast a character, and their old voice keeps playing. Forget the engine version, upgrade the model, and you get a confusing mix of old and new renders. Every one of these is a key that\'s missing a field that affects the sound. The discipline is therefore: enumerate everything the synthesizer reads to produce audio, and put all of it in the key. Conversely, do NOT put things that DON\'T affect the audio in the key (a timestamp, a comment, the line\'s position in the script) — that would break reuse by making identical-sounding lines get different keys. The key is exactly the sound-determining inputs: no more (or you lose reuse), no less (or you get staleness).'
      ]
    },
    {
      h: 'The manifest: the index that ties it together',
      p: [
        'The cache gives you a pile of hash-named clips on disk; the <b>manifest</b> is the JSON index that makes them usable — it maps each script line to its clip and metadata. For every line it records what playback and builds need: the speaker, the (display) text, the clip filename (the key), the voice and prosody used, maybe the duration and the emotion label. Playback reads the manifest to know, in order, which files to load and what captions to show; a build reads it to know what\'s expected and to detect what\'s <b>missing</b> (a manifest entry whose clip file doesn\'t exist is an un-rendered line). The manifest is the contract between the render stage and the playback stage — render writes it, playback consumes it — and it\'s the natural place to store per-clip metadata that isn\'t recoverable from the audio alone.',
        'Together, cache and manifest turn rendering into a clean, incremental, verifiable process. A build walks the script: normalize, chunk, and for each chunk compute the key, render if the file is missing, and record the entry in the manifest. Re-running after a small edit re-renders only the lines whose keys changed (their files are absent) and reuses everything else — the 10-minute full render becomes a 5-second incremental one. And the manifest gives you a verification pass for free: after a build, every manifest entry should point to a file that exists, the counts should match (N lines → N clips), and any mismatch flags a real problem. This is exactly the episode build\'s output: a manifest of decks/steps with per-clip voices, used to confirm "59 decks, 607 steps, 0 missing" after re-rendering only what changed. Cache for speed and correctness; manifest for structure and verification.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin\'s Library Only Copies What Changed',
      text: [
        'Robin is maintaining the ship\'s library of hand-copied research notes, and Usopp is horrified to learn she re-copies the ENTIRE archive every time one fact changes. "That takes you all night!" Robin smiles — she doesn\'t, actually. "Each note gets a name that\'s a fingerprint of what\'s written on it. If I need a note and one with that exact fingerprint already sits on the shelf, I don\'t copy it — it\'s already there. I only copy the ones I don\'t already have." So when a single fact changes, only THAT note gets a new fingerprint and gets recopied; every other note\'s fingerprint is unchanged, so it stays exactly where it is. A change that used to mean re-copying a thousand notes now means re-copying one.',
        'Usopp notices the second half of her system: a ledger at the front of the library. "That book lists every note — which shelf, what it\'s about, its fingerprint. I read the ledger to find things and to shelve them in order. And it\'s how I CHECK the library: every note in the ledger should be on a shelf — if the ledger lists a note and the shelf is empty, I know exactly which one I still have to copy." Robin taps the ledger. "The fingerprints save me from copying twice. The ledger tells me what I have, in what order, and what\'s still missing. Together I can rebuild the whole library after any change by copying only what actually changed, and prove nothing\'s lost." Usopp: "So you\'re lazy in the smartest possible way." Robin: "I never do the same work twice, and I always know exactly what\'s done."'
      ]
    },
    sitcom: {
      show: 'The Office',
      title: 'Oscar Fixes the Reprint-Everything Habit',
      text: 'The office has to reprint a 500-page client binder every time one number changes, and Kevin has been reprinting all 500 pages for a single typo. Oscar intervenes. "Kevin. You don\'t reprint the whole binder. Each page has a little code at the bottom based on what\'s ON the page. If a page\'s code matches one already in the binder, it\'s already correct — you leave it. You only reprint the pages whose content actually changed." Kevin, mind blown: "So the typo page gets a new code and I reprint... just that one?" "Just that one." And Oscar keeps a table of contents: "Every page is listed here with its code. I use it to assemble the binder in order, and to check it — if the contents list a page and it\'s not in the binder, someone forgot to print it." Angela, approving for once: "That is... actually efficient." Oscar: "It\'s the only efficient thing that happens in this office."'
    },
    why: 'Robin\'s fingerprints and Oscar\'s page-codes ARE content-addressed caching: name each artifact by a fingerprint of its content, and if an artifact with that fingerprint already exists, don\'t regenerate it — only the changed items get new fingerprints and get redone (re-copy one note / reprint one page, not the whole library). Change one thing, redo one thing. And the ledger / table of contents is the MANIFEST: it lists every item with its fingerprint, drives assembly in order, and verifies completeness (a listed item with no artifact = something missing). Fingerprints kill duplicate work; the index gives structure and proves nothing\'s lost — exactly cache + manifest.'
  },
  tech: [
    {
      q: 'What is content-addressed caching, and why is it better than an ordinary cache with keys and expiry?',
      a: 'Content-addressed caching means the artifact\'s NAME is a hash of the content that produced it — for TTS, you hash everything that determines a clip\'s sound (spoken text, voice, prosody, engine) and use that hash as the filename, so clip identity and clip content are the same thing. To render a line you compute its key and check whether key.wav exists: if yes, that exact audio is already on disk (skip synthesis); if no, synthesize and save as key.wav. It\'s better than an ordinary keyed cache with TTLs and eviction for several reasons. Reuse and invalidation are automatic and require no separate logic: identical inputs always hash to the same name so repeats are instant hits, and ANY change to a sound-affecting input changes the hash so the old clip is simply ignored and the new one renders — there\'s no manual cache-busting, no "did I remember to invalidate?" bug, because invalidation is a mathematical consequence of the content changing. There\'s no staleness by expiry either: a content-addressed clip is NEVER stale, because if the content is the same the audio is correct, and if the content differs the name differs — time doesn\'t enter into it, so you never need TTLs. It needs no cache database or bookkeeping: the filesystem plus a hash function IS the cache; "already rendered" is just "file exists," which also makes builds trivially resumable after a crash (re-run, skip existing files, continue). And it\'s deterministic and inspectable: the same script always produces the same set of filenames, so you can diff two builds, see exactly which clips changed, and reason about the cache by looking at the directory. An ordinary cache makes you manage keys, expiry, and invalidation as separate concerns you can get wrong; content-addressing folds all of them into "the name is the fingerprint," which is why it\'s the right model for a render pipeline.'
    },
    {
      q: 'What exactly must go into the cache key, and what happens if you leave a field out?',
      a: 'The key must hash EVERYTHING that affects the output audio and nothing that doesn\'t — that\'s the exact invariant. What affects the sound, at minimum: the spoken text (the NORMALIZED string that\'s actually synthesized, not the display text), the voice (which model/speaker), the prosody (rate, pitch, volume — the composed baseline+delta), and the engine plus ideally its version (different engines/versions of the model produce different audio for the same input). The rule is: if two renders would sound different, their keys must differ; if identical, their keys must match. Leaving out a sound-affecting field causes STALE AUDIO, and it fails silently, which is what makes it dangerous. Concretely: omit prosody from the key, then change Luffy\'s pitch — text and voice are unchanged so the key is unchanged, key.wav "already exists," and the pipeline serves the OLD pitch forever with no error; your change just doesn\'t happen. Omit the voice, recast a character, and the old voice keeps playing. Omit the engine version, upgrade the model, and you get an incoherent mix of old and new renders. Each is a key missing a field that changes the sound, so the cache falsely reports a hit on content that actually differs. The converse error matters too: DON\'T put things that don\'t affect audio in the key — a timestamp, a code comment, the line\'s index in the script — because that makes identical-sounding lines hash differently and destroys reuse (you\'d re-render the same audio because its position moved). So the discipline is to enumerate precisely the inputs the synthesizer reads to produce sound and hash exactly those: no less (or you get staleness) and no more (or you lose reuse). When in doubt about whether a field belongs, ask "does changing this change the audio?" — if yes it\'s in the key, if no it\'s out.'
    },
    {
      q: 'What is the manifest, what goes in it, and how do the cache and manifest divide responsibilities?',
      a: 'The manifest is the JSON index that maps each script line to its clip and metadata — it\'s what makes a pile of hash-named files usable, and it\'s the contract between the render stage (which writes it) and the playback stage (which reads it). For each line it records what downstream stages need but can\'t recover from the audio alone: the speaker, the display text (for captions), the clip filename (the content key), the voice and prosody used, and often the duration and emotion label. The division of responsibilities is clean. The CACHE answers "does this exact audio already exist, and where?" — it\'s about avoiding duplicate synthesis and is addressed purely by content hash. The MANIFEST answers "what is the whole script, in order, and what does each line map to?" — it\'s about structure, sequencing, captions, and verification. Playback needs the manifest because the raw cache is just hash-named files with no order or meaning; the manifest gives the sequence, the captions, and the file to load per line. Builds need both: they use the cache to skip already-rendered lines and the manifest to know what the full expected set is and to detect MISSING clips (a manifest entry whose file is absent is an un-rendered line) — which gives you a free verification pass (every entry should point to an existing file; counts should match; 0 missing). So a build walks the script: normalize → chunk → per chunk compute the key, render if the file is missing (cache), and record the entry (manifest); then verify that every manifest entry has a file. The cache makes rebuilds incremental and correct; the manifest makes the output structured, playable, and verifiable. They\'re complementary: content-addressing handles reuse/invalidation at the file level, and the manifest handles ordering, presentation metadata, and completeness at the script level. Together they turn rendering into an incremental, resumable, verifiable process rather than an all-or-nothing regeneration.'
    }
  ],
  code: {
    title: 'Content key, render loop, and manifest',
    intro: 'The whole caching mechanism: a key hashed from every sound-affecting input, a render loop that skips existing files, and a manifest mapping lines to clips. This is the shape of the episode build.',
    code: `import hashlib, json, os

def content_key(spoken, voice, prosody, engine, engine_ver):
    # hash EVERYTHING that affects the sound; nothing that doesn't.
    payload = json.dumps({
        "spoken": spoken,          # normalized text, not display text
        "voice": voice,
        "prosody": prosody,        # (rate, pitch, volume) baseline+delta
        "engine": engine,
        "engine_ver": engine_ver,  # model version -> different audio
    }, sort_keys=True)             # stable ordering -> stable hash
    return hashlib.sha1(payload.encode()).hexdigest()[:16]

def render_line(line, out_dir, synth):
    key = content_key(line["spoken"], line["voice"], line["prosody"],
                      line["engine"], line["engine_ver"])
    path = os.path.join(out_dir, key + ".wav")
    if not os.path.exists(path):        # CACHE: skip if already rendered
        synth(line["spoken"], line["voice"], line["prosody"], path)
    return {                             # MANIFEST entry for this line
        "speaker": line["speaker"], "text": line["display"],
        "clip": key + ".wav", "voice": line["voice"],
        "prosody": line["prosody"], "emotion": line.get("emotion"),
    }

def build(script, out_dir, synth):
    os.makedirs(out_dir, exist_ok=True)
    manifest = [render_line(ln, out_dir, synth) for ln in script]
    json.dump({"lines": manifest}, open(os.path.join(out_dir,
              "manifest.json"), "w"), indent=2)
    # verify: every entry's clip must exist on disk
    missing = [m["clip"] for m in manifest
               if not os.path.exists(os.path.join(out_dir, m["clip"]))]
    return {"lines": len(manifest), "missing": len(missing)}

# Change ONE line's text/voice/prosody -> its key changes -> its file is
# absent -> only that line re-renders. Every other file already exists. Hit.`,
    notes: [
      'sort_keys=True makes the JSON payload order-stable, so the same inputs always hash identically — essential, or the "cache" would miss on logically-identical content.',
      'The build returns {lines, missing}: after re-rendering only what changed, missing should be 0 — the exact "59 decks / 607 steps / 0 missing" verification the episode build prints.'
    ]
  },
  lab: {
    title: 'Build a content key and a skip-if-exists render loop',
    prompt: 'Implement two functions. (1) <code>content_key(fields)</code>: given a dict <code>fields</code> of sound-affecting inputs, return a stable hex hash of it — use <code>json.dumps(fields, sort_keys=True)</code> then <code>hashlib.sha1(...).hexdigest()</code> (return the full hex string). The <code>sort_keys=True</code> is required so key order doesn\'t change the hash. (2) <code>should_render(fields, existing_keys)</code>: return <code>True</code> if <code>content_key(fields)</code> is NOT in the set <code>existing_keys</code> (meaning it must be synthesized), and <code>False</code> if it IS present (a cache hit — skip). This is the core of the skip-if-exists loop.',
    starter: `import hashlib, json

def content_key(fields):
    # stable hash of the sound-affecting inputs
    pass

def should_render(fields, existing_keys):
    # True if not yet rendered (must synth), False if already cached
    pass`,
    checks: [
      { re: 'def\\s+content_key\\s*\\(', flags: '', must: true, hint: 'Define content_key(fields).', pass: 'content_key defined ✓' },
      { re: 'sort_keys\\s*=\\s*True', flags: '', must: true, hint: 'Use json.dumps(fields, sort_keys=True) for a stable hash.', pass: 'stable ordering present ✓' },
      { re: 'hashlib', flags: '', must: true, hint: 'Hash with hashlib (e.g. sha1).', pass: 'hashing present ✓' },
      { re: 'def\\s+should_render\\s*\\(', flags: '', must: true, hint: 'Define should_render(fields, existing_keys).', pass: 'should_render defined ✓' }
    ],
    tests: `# stable: key order in the dict does not change the hash
a = content_key({"text":"hi","voice":"luffy","prosody":[13,12,0]})
b = content_key({"prosody":[13,12,0],"voice":"luffy","text":"hi"})
assert a == b, "sort_keys must make ordering irrelevant"
# different sound-affecting input -> different key
c = content_key({"text":"hi","voice":"luffy","prosody":[13,20,0]})
assert a != c, "changing prosody must change the key"
# should_render: absent -> True (render), present -> False (skip)
assert should_render({"text":"hi","voice":"luffy","prosody":[13,12,0]}, set()) is True
assert should_render({"text":"hi","voice":"luffy","prosody":[13,12,0]}, {a}) is False
# a changed line is not in the cache -> must render
assert should_render({"text":"hi","voice":"luffy","prosody":[13,20,0]}, {a}) is True
print("caching core correct")`,
    solution: `import hashlib, json

def content_key(fields):
    payload = json.dumps(fields, sort_keys=True)
    return hashlib.sha1(payload.encode()).hexdigest()

def should_render(fields, existing_keys):
    return content_key(fields) not in existing_keys`,
    notes: [
      'sort_keys=True is load-bearing: without it, the same inputs in a different dict order would hash differently and the cache would miss on identical content — the test with reordered keys proves it.',
      'should_render is the whole skip-if-exists loop in one line: changing any sound-affecting field yields a key not in the cache, so exactly the changed lines re-render and everything else is a hit.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Two operational realities: the engine-version field as a deliberate global invalidator, and managing cache growth over a project\'s life.',
    sections: [
      {
        h: 'The engine/version field is your global invalidation switch',
        p: 'Including the engine and its model version in the key isn\'t just correctness bookkeeping — it\'s a deliberate, powerful control lever. Because the version is part of every key, bumping it changes EVERY key at once, which cleanly invalidates the entire cache and forces a full re-render on the next build. That\'s exactly what you want when you upgrade the model, change a global synthesis setting, or fix something in the shared front-end that affects all audio: flip the version and the whole corpus rebuilds, deterministically, with no manual file deletion. Conversely, leaving the version OUT means a model upgrade silently produces a mix of old and new renders — the worst outcome, because it\'s inconsistent and invisible. So the version field gives you two granularities of invalidation from one mechanism: change one line\'s text/voice/prosody and only that line re-renders (fine-grained), or bump the engine version and everything re-renders (coarse global). You can even scope it — a per-voice version or a per-stage version — so that fixing the normalizer bumps a "normalizer version" that only invalidates lines whose text the fix actually changed (since their spoken text changes anyway) while a model swap bumps the engine version and invalidates all. The design principle is that anything which can change the audio globally should be a versioned field in the key, so that "I changed how everything sounds" is expressed as a one-line version bump rather than a fragile manual "delete the cache" step you might forget. Treat the version fields as the intentional knobs for global invalidation, and the cache becomes controllable at exactly the granularity of whatever changed.'
      },
      {
        h: 'Cache growth and pruning over a project\'s life',
        p: 'Content-addressed caches only grow: every time a line\'s text or prosody changes, a NEW file appears under the new key, and the OLD file — now unreferenced by the manifest — stays on disk. Over a long project with many edits, you accumulate orphaned clips: audio that no current manifest entry points to. This is usually fine (disk is cheap, and keeping old clips makes rolling back a change instant — the old key\'s file is still there), but eventually you may want to prune. The safe way to prune is manifest-driven garbage collection: the set of "live" clips is exactly the set of filenames referenced by the current manifest(s); any file in the output directory NOT referenced by any manifest is an orphan and can be deleted. This is the same mark-and-sweep idea as memory GC — the manifest is the root set, reachable files are live, unreachable files are collectable. Two cautions. First, only prune against ALL current manifests (if you build multiple scripts into a shared cache dir, a clip orphaned by one may be live in another), or you\'ll delete something still in use. Second, pruning trades away instant rollback — once you delete the old-key files, reverting a change means re-rendering rather than reusing the still-present old clip — so prune deliberately (e.g. before shipping, or on a schedule), not on every build. The broader point is that the manifest isn\'t only for playback and verification; it\'s also the authority on liveness, so cache hygiene is just "keep what the manifest references, and know that everything else is safely regenerable from the script." Because every clip is reproducible from its inputs, the cache is a pure accelerator — losing it costs time, never data — which is what makes aggressive pruning safe when you choose to do it.'
      }
    ]
  },
  quiz: [
    {
      q: 'Content-addressed caching means:',
      options: ['Clips expire after a set time', 'The clip\'s filename is a hash of everything that affects its sound, so identical inputs reuse the file and any change renders a new one', 'Caching only the first line', 'Storing clips in a database with TTLs'],
      correct: 1,
      explain: 'The name IS the content fingerprint. Reuse and invalidation are automatic (same inputs → same name → hit; changed inputs → new name → render), with no expiry or cache DB needed.'
    },
    {
      q: 'What must go into the cache key?',
      options: ['Only the text', 'Everything that affects the output audio: spoken (normalized) text, voice, prosody, and engine/version', 'The timestamp and line number', 'Just the voice name'],
      correct: 1,
      explain: 'If two renders would sound different, their keys must differ. Hash exactly the sound-determining inputs — no less (staleness) and no more (breaks reuse).'
    },
    {
      q: 'You change Luffy\'s pitch but forgot to include prosody in the key. What happens?',
      options: ['An error is raised', 'Stale audio, silently: text/voice unchanged → key unchanged → old clip "already exists" → the old pitch plays forever', 'Everything re-renders', 'The cache is cleared'],
      correct: 1,
      explain: 'A key missing a sound-affecting field reports a false hit. The change silently doesn\'t take effect — the insidious staleness failure. Every sound-affecting input must be in the key.'
    },
    {
      q: 'The manifest is:',
      options: ['A backup of the audio', 'A JSON index mapping each line → clip + metadata (speaker, text, voice, prosody), read by playback and used to detect missing clips', 'The cache itself', 'A log file'],
      correct: 1,
      explain: 'The manifest gives structure: order, captions, per-clip metadata, and verification (an entry with no file = un-rendered). Cache = reuse/invalidation; manifest = structure/completeness.'
    },
    {
      q: 'After a small edit, re-running the build:',
      options: ['Re-renders the whole script', 'Re-renders only the lines whose keys changed (their files are absent) and reuses every unchanged line — incremental and resumable', 'Deletes all clips', 'Requires a fresh cache'],
      correct: 1,
      explain: 'Changed lines get new keys → absent files → they render; unchanged lines hit. A 10-minute full render becomes a 5-second incremental one — exactly the episode build re-rendering only Luffy/Nami.'
    }
  ],
  pitfalls: [
    'Leaving a sound-affecting field out of the key (prosody, voice, or engine version). Causes silent stale audio: the change "already exists" as an old clip and never takes effect. Hash everything that affects the sound.',
    'Putting non-sound fields in the key (timestamp, line index, comments). Makes identical-sounding lines hash differently and destroys reuse. The key is exactly the sound-determining inputs — no more, no less.',
    'Hashing without stable ordering (sort_keys). The same inputs in a different order hash differently and the cache misses on identical content. Serialize deterministically.',
    'No manifest — just hash-named files. Playback has no order, no captions, no way to detect missing clips. The manifest is the structure and verification layer the cache doesn\'t provide.',
    'Forgetting the engine/version field. A model upgrade then produces a silent mix of old and new renders. Version fields are your deliberate global-invalidation switch — bump to force a full re-render.'
  ],
  interview: [
    {
      q: 'Design a caching layer so that editing one line of a 600-line script re-renders only that line. Walk through the mechanism and the failure modes.',
      a: 'I\'d use content-addressed caching: name each clip by a hash of everything that determines its sound, and use file-existence as the cache. The mechanism: for each chunked, normalized line, compute a key by hashing its sound-affecting inputs — the spoken (normalized) text, the voice, the composed prosody (rate/pitch/volume), and the engine plus its version — with stable serialization (sorted keys) so identical inputs always hash identically. The clip is saved as key.wav. The render loop is skip-if-exists: compute the key, and if key.wav is already on disk, skip synthesis (cache hit); otherwise synthesize and write it. Now editing one line changes its spoken text, which changes its key, which means its file is absent, so ONLY that line re-renders; every other line\'s inputs are unchanged, so its key and file are unchanged and it\'s an instant hit. That turns a full render into an incremental one, and it\'s resumable for free — a crashed build re-runs and skips everything already written. Alongside the cache I\'d write a manifest: a JSON index mapping each line to its clip filename and metadata (speaker, display text, voice, prosody, emotion, duration), which playback reads for order and captions and which lets me verify completeness — every manifest entry should point to an existing file, and any that don\'t are un-rendered lines (the "0 missing" check). The failure modes are all about the key. Leaving out a sound-affecting field (prosody, voice, engine version) causes silent stale audio: the change "already exists" as the old clip and never takes effect, with no error — the most dangerous bug, so the invariant is "if it changes the sound, it\'s in the key." Including non-sound fields (timestamps, line index) breaks reuse by making identical audio hash differently. And unstable serialization makes the cache miss on logically-identical content. Get the key set exactly right — every sound-determining input and nothing else, serialized deterministically — and one-line edits cost one line of render, verified by the manifest.'
    },
    {
      q: 'How do you handle invalidation when you upgrade the TTS model or fix the normalizer — changes that affect many or all clips at once?',
      a: 'Through versioned fields in the key, which turn global changes into one-line version bumps rather than fragile manual cache deletion. The engine and its model version are part of every cache key precisely so that a model upgrade changes every key at once: bump the engine version, and on the next build every key differs from what\'s on disk, so the entire corpus re-renders deterministically — no "delete the cache directory" step to forget, and critically no silent mixing of old and new renders (which is exactly what happens if you leave the version out of the key and upgrade the model). So the version field is a deliberate global-invalidation switch. For a change that affects SOME clips, the mechanism is more surgical and often automatic. Fixing the normalizer, for instance, changes the SPOKEN text of exactly the lines the fix touches (e.g. a mispronounced acronym now expands differently); since spoken text is in the key, those lines\' keys change and they re-render, while lines the fix didn\'t affect keep the same spoken text, same key, and stay cached — the invalidation is automatically scoped to what actually changed, no manual tracking. If I want a coarser lever for a front-end change, I can add a scoped version field — a "normalizer version" or "prosody-rule version" — and bump it to invalidate the relevant subset. The general principle: anything that can change the audio globally should be a versioned field in the key, so "I changed how everything (or this class of things) sounds" is expressed declaratively as a version bump, and the cache recomputes exactly the affected set. On cleanup: because content-addressing only adds files (old-key clips become orphans), I prune with manifest-driven GC — anything not referenced by any current manifest is safely deletable, since every clip is regenerable from its inputs, making the cache a pure accelerator that\'s never a source of truth. So invalidation is never a manual, error-prone chore: fine-grained changes invalidate themselves through the content hash, and global changes invalidate through intentional version bumps.'
    }
  ]
};
