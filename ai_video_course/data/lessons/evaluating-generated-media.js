window.LESSONS = window.LESSONS || {};
window.LESSONS['evaluating-generated-media'] = {
  id: 'evaluating-generated-media',
  title: 'Is It Any Good? Evaluating Lip Sync, Voices & Video Quality',
  category: 'Part 7 — Evaluation & Capstone',
  timeMin: 35,
  summary: 'Every earlier lesson evaluated its OWN slice — the director\'s golden set, the sync discriminator, the consent registry\'s pass/fail. This lesson builds the evaluation layer that watches the ASSEMBLED output: does the finished video actually look and sound right. Automated proxy metrics catch what can be measured cheaply (sync offset, audio quality scores, frame artifacts) and catch it on every single render; human spot-checks catch what proxies structurally cannot (does it look natural, is the emotion right) and catch it on a sample. Neither replaces the other — the whole discipline is knowing which failures each layer can see, and building the harness so a model or pipeline upgrade is judged by the same yardstick every time, not a fresh vibe check.',
  goals: [
    'Distinguish proxy metrics (cheap, automated, run on every render) from human judgment (expensive, sampled, catches what proxies cannot)',
    'Explain sync-offset measurement as a concrete proxy metric: what it catches (timing drift) and what it structurally cannot (whether the performance looks alive)',
    'Design a golden-set regression harness for the full pipeline, extending the director\'s golden-set pattern to audio and video output quality',
    'Build a sampling strategy for human review that catches quality regressions without requiring every render to be manually watched',
    'Recognize the automation ceiling: which quality judgments (naturalness, emotional appropriateness, "does this feel right") remain genuinely human-only, and design the product around that limit rather than against it'
  ],
  concept: [
    {
      h: 'Proxy metrics: cheap, automated, and honest about their limits',
      p: [
        'A proxy metric is a number a machine can compute in milliseconds that correlates with quality without directly measuring it. Sync offset — the same measurement the talking-head lesson\'s SyncNet-class discriminator uses during training — is the clearest example for this pipeline: cross-correlate the audio envelope against the generated mouth-shape signal, and the offset in milliseconds where they align best tells you whether the render drifted out of sync, running on every single render for near-zero marginal cost. Audio has its own proxies (signal-to-noise, clipping detection, a speech-quality model score) and so does frame output (a no-reference sharpness or artifact score catching a stage that silently degraded resolution).',
        'The discipline is knowing exactly what each proxy CANNOT see. Sync offset can detect that the mouth moves at the wrong TIME; it cannot detect that the mouth moves the wrong SHAPE while staying perfectly on-beat — a render that is numerically in-sync and visually wrong (dead-eyed, robotic articulation) passes every proxy check clean. This is not a flaw to fix by finding a better proxy — it is a structural ceiling: proxies measure what they were built to measure, and "does this look natural" was never one of the things sync-offset measures. Treating a clean proxy score as "the video is good" rather than "the video is not obviously BROKEN in this one specific way" is the single most common evaluation mistake this lesson exists to prevent.'
      ]
    },
    {
      h: 'The regression harness: judge every model swap by the same yardstick',
      p: [
        'The director lesson built a golden set of request paragraphs with assertions about the resulting PLAN; this lesson extends the same pattern one stage further, to the resulting MEDIA. A golden set here is a fixed collection of representative inputs — a range of reference images (frontal, profile, glasses, varied lighting, from the intake lesson\'s categories), scripts of varying length and emotional tone, several cloned and stock voices — run through the FULL pipeline on every candidate model or config change, with proxy metrics computed automatically on every output: sync offset, audio quality score, frame-artifact rate, render time, VRAM peak. A model upgrade (a new talking-head checkpoint, a different vocoder) is not judged by "the demo clip looked good" — it is judged by whether the golden set\'s proxy scores moved, and in which direction, across the WHOLE representative range, not just the one input someone happened to eyeball.',
        'This is what makes evaluation tractable at the pace models actually improve: a proxy-metric regression on the golden set is a five-minute automated check that catches "the new lip-sync model is 2x faster but drifts on profile shots" before it ships, the same way the hardware lesson\'s golden-set gating caught quantization quality loss before it reached creators. The harness does not replace human judgment (next section) — it is the FILTER that keeps human review focused on genuine candidates instead of burning review time on regressions an automated check would have caught in seconds.'
      ]
    },
    {
      h: 'Sampling human review: catching what no proxy can see, without watching everything',
      p: [
        'Naturalness, emotional appropriateness, and "does this look like a real person" are judgments no current automated metric reliably makes — they need a human, but watching every render a system produces does not scale past a demo. The fix is stratified sampling: review 100% of a specific, narrow slice where mistakes are costliest (every render that failed a proxy metric\'s soft threshold — a borderline sync score, an unusual frame-artifact rate — gets a mandatory look, since "close to the line" is exactly where proxies are least trustworthy), plus a random few-percent slice of otherwise-clean renders (to catch the failure MODE proxies cannot see at all: technically perfect sync, visually dead performance), plus a fixed slice whenever a model or pipeline version changes (the golden set\'s proxy pass is necessary but not sufficient — a human still watches a sample before a version goes from staging to default).',
        'Reviewers need a rubric, not a vibe, or two reviewers score the same clip differently and the signal is noise. A short structured scorecard — mouth-shape naturalness (1-5), emotional match to the script\'s tone (1-5), any obvious artifact (yes/no, with a category), overall "would this embarrass the creator" (yes/no) — turns subjective review into a trend line comparable across reviewers and across time, the same way the director\'s golden-set assertions turned "does the plan look right" into something a diff could show. And every human-caught failure that a rubric SPOTS gets fed back into looking for a cheap proxy that would have caught it automatically next time — human review\'s real job is not just gatekeeping, it is discovering the next proxy metric worth building.'
      ]
    },
    {
      h: 'Where the automation ceiling actually sits — and designing around it',
      p: [
        'It is tempting to keep chasing better proxies until human review is unnecessary; it will not fully happen, and knowing why shapes the product. "Does this look natural" is not a measurement gap waiting on a smarter model — it is asking whether a synthetic performance matches an enormous, culturally-specific, context-dependent human intuition for how real people move and sound, the same reason the multimodal lesson drew a hard jurisdiction line between semantic judgment (VLM territory) and geometric measurement (deterministic detector territory). Sync offset, artifact detectors, and quality scores all live firmly on the geometric side of that line; "does this feel right" lives on the semantic side, and no amount of proxy-metric sophistication moves a geometric measurement into semantic territory.',
        'Designing around that ceiling rather than against it means the product NEVER promises fully-automated quality assurance — the automated layer\'s honest job is triage (catch the cheap, obvious, high-volume failures before any human looks), and the human layer\'s honest job is judgment on the sample that survives triage. This is the same two-tier structure as the misuse-review lesson\'s hard-block-list-plus-human-queue, applied to quality instead of safety: automate what is automatable with high confidence, route genuine ambiguity to a human, and resist the temptation to expand the automated tier past where it can actually see — a proxy metric stretched to claim more than it measures produces confident, wrong answers, which is worse for trust than an honest "this needs a human look."'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Sunny\'s Sea Trials: What the Instruments Catch, and What Only Franky\'s Ear Catches',
      text: 'Before every long voyage, Franky runs the Thousand Sunny through sea trials, and he built real instruments for it — a pressure gauge on the hull, a listing meter that flags if she rides crooked in the water, a strain reading on the mast lines. Every instrument runs on every trial, automatically, and catches exactly what it was built to catch: a listing meter WILL flag a hull riding two degrees off true, instantly, on the very first pass, no argument. What it will not flag — what Franky learned the hard way after a "perfect" reading trial where the ship still felt subtly wrong on open water — is whether the Sunny SAILS well: whether she answers the helm smoothly, whether her creak under strain sounds healthy or tired. No gauge measures that; only Franky, standing on deck with his hand on the rail, has the ear for it. So sea trials run in two tiers now: every gauge, on every trial, catching hull angle and strain instantly and for free — and Franky personally standing watch for a full lap around the bay on any trial where a gauge reads borderline, plus one random lap a month even when every gauge reads clean, specifically hunting for the wrongness no gauge has ever caught. When a new mast design gets tested, the gauges alone are not the verdict — Franky\'s own ear, on a full lap, decides whether it actually ships, and when he catches something the instruments missed, his first move afterward is always the same: figure out what a gauge COULD have measured, and build it, so next time that particular wrongness is caught automatically instead of by luck and a good ear.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Rubric: What the Sensor Catches, and What Only Penny Catches',
      text: 'Sheldon insists the group\'s new home-brewed telescope-tracking motor be validated with real instruments before Howard trusts it on an actual observation night — a position-error sensor logging how far the tracking drifts in arcseconds, run automatically on every test, catching drift instantly and precisely, no argument possible. What the sensor cannot tell anyone is whether the resulting images actually LOOK good — whether stars appear crisp and round instead of subtly smeared in a way no single number captures — and Sheldon, characteristically, initially insists a low-enough drift number IS the answer, until Leonard shows him two nights with nearly identical drift scores producing visibly different image quality. Amy proposes the fix over lunch: run the drift sensor automatically on literally every test session, since it is free and instant, but ALSO have an actual person look at a sample of the resulting images with a real rubric — sharpness, roundness of star points, any visible smear — scoring one to five, on every session that reads borderline AND a random handful even when the sensor looks perfectly clean. Penny, roped in as a deliberately non-expert second opinion specifically because Sheldon trusts his own eye too much to catch his own blind spots, turns out to have a genuinely good, consistent eye for "that one looks off" even when she cannot articulate the physics — and when she flags something the drift sensor missed entirely, Sheldon\'s response is not to dismiss her, it is to go figure out what NEW number could have caught it, because a repeatable human judgment that the instruments miss is, to him, just a proxy metric that has not been invented yet.'
    },
    why: 'Both stories draw the exact line this lesson draws. The instant, automatic gauges — hull angle, mast strain, tracking drift — are proxy metrics: cheap, run on everything, catching precisely and only what they were built to catch (sync offset\'s honest limit, stated twice). Franky\'s ear on deck and Penny\'s look at the images are the human layer, deployed on a SAMPLE (borderline readings plus a random slice), because watching or listening to everything does not scale and most of it is redundant with what the gauges already confirmed. Both stories are explicit that a clean instrument reading is not the final verdict — "sails well" and "looks crisp" are judgments the instruments structurally cannot make, the same ceiling separating sync-offset math from "does the performance look alive." And both endings matter most: catching something only a human caught is not treated as a one-off — it becomes the search for a new instrument, the harness improving itself, exactly the human-review-discovers-the-next-proxy loop the concept section closes on.'
  },
  tech: [
    {
      q: 'A render scores a clean sync-offset (well within tolerance) but a human reviewer flags it as "looks robotic." Is this a bug in the sync-offset metric?',
      a: 'No — it is the metric working correctly and measuring exactly what it was built to measure. Sync offset answers "is the mouth moving at the right TIME relative to the audio," a purely temporal question, and this render passes that question honestly. "Looks robotic" is a judgment about motion QUALITY and naturalness — smoothness of transitions, appropriateness of micro-expression, the aliveness-layer concepts from the talking-head lesson — which is an entirely different axis the metric was never designed to touch. Calling this a bug and trying to "fix" sync-offset to also catch robotic motion would either fail (the signal genuinely is not present in audio-visual timing alignment) or produce a metric so entangled it becomes uninterpretable when it fails. The correct response is not patching the metric, it is recognizing the gap as exactly where the human-review sampling layer earns its cost, and treating the specific failure pattern (clean sync, bad naturalness) as a candidate to investigate for a NEW, purpose-built proxy — motion-smoothness scoring, say — rather than stretching an existing one past its honest scope.'
    },
    {
      q: 'Why must the golden set for media evaluation include deliberately varied inputs (profile shots, different emotional tones, multiple voice types) rather than a single "known good" reference case?',
      a: 'A golden set built from one easy, well-lit, neutral-tone reference case will show clean proxy scores on every model version forever, regardless of real quality changes elsewhere, because it never exercises the paths where models actually differ or degrade — the exact failure mode the intake lesson\'s jurisdiction rule warned about (a model confidently wrong outside its comfort zone) applies identically to evaluation coverage. A profile shot exercises different code paths than a frontal shot in most talking-head architectures; a high-emotion script exercises articulation range a flat neutral script never touches; a cloned voice exercises the TTS pipeline\'s zero-shot path differently than a stock voice. Variation in the golden set is what turns "the proxy scores look fine" into a claim that actually covers the product\'s real usage distribution — a regression that only shows up on profile shots is invisible to a golden set with no profile shots in it, and ships silently.'
    },
    {
      q: 'Design the trigger conditions for mandatory human review precisely — what routes a render to a person, and what does not?',
      a: 'Three independent triggers, any one sufficient. Proxy-borderline: any metric within a defined margin of its pass/fail threshold — not just failures, because a metric that BARELY passes is exactly where its measurement noise is least trustworthy, and treating "barely passed" identically to "clearly passed" throws away the one signal that says "look closer here." Version-boundary: any render from a model or pipeline configuration that has not yet accumulated a fixed sample size of human-reviewed output at that version — a golden-set proxy pass is necessary before a version reaches this stage but is not treated as sufficient on its own. Random baseline: a small fixed percentage of otherwise-clean, non-boundary renders, sampled continuously, specifically to catch the failure mode no proxy sees at all (clean metrics, bad naturalness) — without this slice, the review process only ever looks where the proxies already pointed, and a model that is bad in a way no proxy measures would never get sampled. What does NOT trigger review: a clean render on a stable, already-vetted version outside the random baseline\'s draw — reviewing that adds cost without adding signal, since the golden set and the accumulated version history already vouch for it.'
    }
  ],
  deepDive: {
    title: 'What sync-offset actually measures, and where automated audio/video quality scores come from',
    sections: [
      {
        h: 'Cross-correlation: turning "is it in sync" into one number',
        p: 'Sync offset is computed by taking a feature stream from the audio (typically the amplitude envelope, or a learned embedding from a model like the talking-head lesson\'s sync discriminator) and a feature stream from the video (mouth-region motion energy, or the discriminator\'s visual embedding), then sliding one against the other in time and measuring how well they correlate at each possible offset — the offset that produces the HIGHEST correlation is the render\'s measured sync lag, in milliseconds, positive or negative depending on which stream leads. A well-synced render peaks near zero offset with a sharp, high correlation; a drifted render peaks away from zero; a render with genuinely broken lip-sync (audio and mouth motion barely related at all) shows a flat, low correlation everywhere, no clear peak — which is itself a distinct and useful failure signature, different from "in sync but delayed."'
      },
      {
        h: 'No-reference quality scores: judging output with nothing to compare against',
        p: 'Most proxy metrics for the FINAL render have no ground truth to compare against — there is no "correct" video of a real person saying this exact AI-generated script to diff against. So they are no-reference metrics: small models trained specifically to predict a human-perceived quality score directly from the output, learned from large datasets of media that WERE human-rated during the model\'s own training. A no-reference sharpness/artifact score for frames catches blurring, warping, and compression-like artifacts without needing an original to compare to, the way a spam classifier catches spam without needing the "non-spam version" of the same email; an audio no-reference quality model similarly catches robotic buzz, clipping, or unnatural prosody patterns learned from rated examples. These models carry the same honest limitation as everything else in this lesson — they predict what THEIR training distribution taught them "human-rated quality" looks like, which is why they are proxies for human judgment, tuned to correlate with it, never a replacement that makes human sampling optional.'
      }
    ]
  },
  code: {
    title: 'The two-tier harness: proxies on everything, humans on the sample',
    intro: 'Automated triage first, at zero marginal human cost; human judgment second, on exactly the slice that earns it.',
    code: `PROXY_THRESHOLDS = {
    'sync_offset_ms':    {'max_abs': 80,  'borderline_margin': 20},
    'audio_quality':     {'min': 3.5,     'borderline_margin': 0.3},
    'frame_artifact_pct':{'max': 2.0,     'borderline_margin': 0.5},
}

def score_render(audio, video):                       # runs on EVERY render
    return {
        'sync_offset_ms': measure_sync_offset(audio, video),
        'audio_quality':  no_reference_audio_score(audio),
        'frame_artifact_pct': no_reference_artifact_rate(video),
    }

def review_route(scores, version_sample_count, min_version_samples,
                 random_draw):
    for metric, cfg in PROXY_THRESHOLDS.items():
        val = scores[metric]
        limit = cfg.get('max', cfg.get('max_abs'))
        margin = cfg['borderline_margin']
        if 'min' in cfg and val < cfg['min'] + margin:
            return 'human_review'                       # borderline, not
        if limit is not None and abs(val) > limit - margin:  #   just failing
            return 'human_review'
    if version_sample_count < min_version_samples:
        return 'human_review'                            # new version: earn
    if random_draw:                                       #   trust first
        return 'human_review'                             # random baseline
    return 'auto_pass'                                     # clean, vetted,
                                                            #   not sampled

def golden_set_regression(candidate_model, golden_inputs, baseline_scores):
    deltas = {}
    for inp in golden_inputs:
        out = run_pipeline(candidate_model, inp)
        deltas[inp.id] = diff(score_render(out.audio, out.video),
                              baseline_scores[inp.id])      # every input,
    return deltas                                            #   same yardstick`,
    notes: [
      'review_route checking margins (borderline), not just hard limits, is the metric-noise-aware part — "barely passed" gets exactly as much scrutiny as "barely failed," because both are equally untrustworthy near a threshold.',
      'golden_set_regression diffing against baseline_scores per input, rather than an aggregate average, is what catches a regression confined to one input category (profile shots, say) that an averaged score would dilute into invisibility.'
    ]
  },
  lab: {
    title: 'Borderline routing and the golden-set regression diff',
    prompt: 'Two functions. (1) <code>route(value, min_ok, margin)</code>: given a metric where higher is better (<code>min_ok</code> is the pass threshold), return <code>"fail"</code> if <code>value < min_ok</code>, <code>"borderline"</code> if <code>value</code> is within <code>margin</code> ABOVE <code>min_ok</code> (i.e. <code>min_ok <= value < min_ok + margin</code>), else <code>"pass"</code>. (2) <code>regressions(candidate, baseline, tolerance)</code>: both are dicts mapping input id → score (higher better). Return a sorted list of input ids where <code>candidate[id] < baseline[id] - tolerance</code> — a real drop, not noise.',
    starter: `def route(value, min_ok, margin):
    # < min_ok -> "fail"; within margin above -> "borderline"; else "pass"
    pass

def regressions(candidate, baseline, tolerance):
    # ids where candidate dropped more than tolerance below baseline
    pass`,
    checks: [
      { re: 'def\\s+route\\s*\\(', flags: '', must: true, hint: 'Define route(value, min_ok, margin).', pass: 'route defined ✓' },
      { re: 'def\\s+regressions\\s*\\(', flags: '', must: true, hint: 'Define regressions(candidate, baseline, tolerance).', pass: 'regressions defined ✓' },
      { re: 'borderline', flags: '', must: true, hint: 'A value just above the threshold must still route to "borderline", not straight to "pass".', pass: 'borderline band checked ✓' },
      { re: 'sorted\\(', flags: '', must: true, hint: 'Return regressions sorted by input id for a stable, diffable report.', pass: 'sorted output ✓' }
    ],
    tests: `assert route(2.0, 3.5, 0.3) == 'fail'
assert route(3.5, 3.5, 0.3) == 'borderline', 'right at the threshold: still borderline'
assert route(3.7, 3.5, 0.3) == 'borderline', 'just above: not trusted yet'
assert route(4.0, 3.5, 0.3) == 'pass'

baseline = {'a': 4.0, 'b': 3.8, 'c': 4.5}
candidate = {'a': 3.9, 'b': 3.0, 'c': 4.6}
r = regressions(candidate, baseline, tolerance=0.2)
assert r == ['b'], 'only b dropped past tolerance; a is within noise, c improved'
assert regressions(baseline, baseline, 0.2) == [], 'identical scores: no regressions'
print('borderline routing and regression diff correct')`,
    solution: `def route(value, min_ok, margin):
    if value < min_ok:
        return 'fail'
    if value < min_ok + margin:
        return 'borderline'
    return 'pass'

def regressions(candidate, baseline, tolerance):
    bad = [k for k in baseline
           if candidate.get(k, float('-inf')) < baseline[k] - tolerance]
    return sorted(bad)`,
    notes: [
      'route treating the threshold itself as borderline (not a clean pass) matches the harness rule: a value THAT close to the line has not earned unreviewed trust yet.',
      'regressions ignoring improvements and small noise, flagging only real drops past tolerance, is what keeps the golden-set diff from crying wolf on ordinary run-to-run variance.'
    ]
  },
  quiz: [
    {
      q: 'A render passes every proxy metric cleanly but a human reviewer flags it as looking robotic. This means:',
      options: ['The sync-offset metric has a bug that needs fixing', 'The metrics worked correctly — they measure timing and artifacts, not naturalness, which is a different axis entirely and exactly where human sampling earns its cost', 'The human reviewer made an error', 'The render should have failed the proxy check'],
      correct: 1,
      explain: 'Proxies measure what they were built to measure. "Looks robotic" is on the semantic side of a line no timing metric was ever designed to cross.'
    },
    {
      q: 'The golden set for media evaluation deliberately includes profile shots, varied emotional tones, and multiple voice types because:',
      options: ['More test cases always look more thorough', 'A golden set built from one easy reference case never exercises the paths where models actually differ, so it shows clean scores forever regardless of real regressions elsewhere', 'Profile shots are the most common real-world input', 'Variety reduces the total test runtime'],
      correct: 1,
      explain: 'Coverage of the real usage distribution is what makes a proxy-score pass mean something — a regression outside the golden set\'s range ships silently.'
    },
    {
      q: 'A metric that barely PASSES its threshold is routed to human review (not just metrics that fail) because:',
      options: ['It doubles the review workload intentionally', 'A value that close to the threshold is exactly where measurement noise makes the automated verdict least trustworthy', 'Passing scores are rarer than failing ones', 'Borderline passes indicate a different bug class'],
      correct: 1,
      explain: 'The borderline band treats "barely passed" and "barely failed" with equal suspicion — both are too close to the line to trust unreviewed.'
    },
    {
      q: 'The random-baseline slice of human review (sampling otherwise-clean, non-borderline renders) exists specifically to:',
      options: ['Give reviewers something easy to look at', 'Catch the failure mode no proxy metric can see at all — a render can be numerically perfect and still look wrong in a way nothing automated measures', 'Balance the review queue\'s workload', 'Validate that the proxy thresholds are calibrated correctly'],
      correct: 1,
      explain: 'Without a random draw, review only ever looks where proxies already pointed — a uniformly-bad-in-an-unmeasured-way model would never get sampled otherwise.'
    },
    {
      q: 'When human review consistently catches a specific failure pattern that every proxy metric misses, the correct response is:',
      options: ['Increase the sampling rate permanently to compensate', 'Investigate whether a new, purpose-built proxy metric could catch that specific pattern automatically going forward', 'Stop trusting the proxy metrics entirely', 'Lower the pass thresholds on existing metrics'],
      correct: 1,
      explain: 'Human review\'s deeper job is discovering the next automatable check — the loop that keeps the automated tier\'s coverage growing over time.'
    }
  ],
  pitfalls: [
    'Treating a clean proxy-metric pass as "the video is good" instead of "the video is not obviously broken in this specific measured way." A model that games or coincidentally satisfies the measured proxies while degrading on everything the proxies do not cover will look like a strict improvement on every dashboard while actually shipping worse creator experiences.',
    'Building the golden set once at launch and never revisiting it as real usage patterns emerge. A golden set that does not reflect the actual distribution of creator inputs — reference photo types, script styles, voice choices — silently loses coverage over time as the product\'s real usage drifts away from what the golden set was built to represent.',
    'Letting human review become rubber-stamping under volume pressure — a reviewer who has approved 200 clean clips in a row stops truly evaluating the 201st. This is why the borderline and random-baseline triggers matter more than raw review VOLUME: a smaller, well-targeted review queue that reviewers can genuinely attend to catches more real problems than a large one that trains reviewers to click through.'
  ],
  interview: [
    {
      q: 'Design the full evaluation harness for this media pipeline: what runs automatically, what requires a human, and how do the two layers interact?',
      a: 'Two tiers with a deliberate division of labor. Tier one, automated, runs on every single render at near-zero marginal cost: sync-offset via cross-correlation of audio and mouth-motion features, no-reference audio and frame quality scores, and structural checks (duration match, expected file properties) — each with a pass threshold AND a borderline margin, because a value just barely past a threshold is exactly where the metric is least trustworthy and deserves the same scrutiny as an outright failure. Tier two, human, runs on a deliberately constructed sample: mandatory for anything tier one flags as borderline or failing, mandatory for a fixed sample of any new model or pipeline version before it reaches default status, and a small continuous random draw of otherwise-clean renders specifically to catch naturalness and emotional-appropriateness failures no automated metric can see. Reviewers score against a fixed rubric, not a vibe, so results are comparable across reviewers and over time. The two tiers interact in both directions: tier one filters what reaches tier two so human time is spent on genuine candidates, not everything; and tier two\'s findings feed BACK into tier one — a failure pattern human review catches repeatedly becomes a candidate for a new proxy metric, so the automated tier\'s coverage grows over time instead of staying fixed at launch.'
    },
    {
      q: 'A stakeholder asks why the team does not just build a single "overall quality" score using an LLM or a large multimodal judge model, instead of maintaining several narrow proxy metrics and a human review process. What is your answer?',
      a: 'A single judge-model score trades interpretability and debuggability for apparent simplicity, and both losses are expensive here. When sync-offset flags a regression, the fix is obvious and localized — something in the timing pipeline drifted; when a single opaque "quality: 6.2/10" score drops, there is no path from the number to the cause, because the score conflates timing, artifacts, naturalness, and emotional match into one undifferentiated signal — exactly the problem the multi-proxy design avoids by keeping each metric narrow and legible. A judge model is also itself a model with its own failure modes, training-distribution blind spots, and drift over time — using it as the SOLE arbiter of quality just moves the "what does this model actually measure, and where is its ceiling" question one level up without answering it, and now there is no independent check on the judge itself. I would use a judge-model score as ONE additional proxy in the tier-one battery — worth having, correlates usefully with holistic quality — but never as a replacement for the narrow, interpretable metrics or for human sampling, because the entire value of the two-tier design is that every layer\'s honest scope is known; an opaque judge score\'s scope is whatever its training data happened to teach it, which nobody on the team can fully characterize.'
    },
    {
      q: 'How do you prevent the evaluation harness itself from silently becoming useless as the pipeline evolves over months?',
      a: 'Three specific decay modes to guard against, each with a concrete countermeasure. Golden-set staleness: real creator usage drifts (new reference-photo styles become common, script lengths trend differently) while the golden set stays frozen from launch — countermeasure is a scheduled quarterly review pulling a fresh sample of REAL anonymized usage patterns and checking the golden set still represents the current distribution, adding cases where it does not. Threshold drift: proxy thresholds calibrated against an early model generation may be too strict or too loose for a substantially improved pipeline, silently flooding or starving the human-review queue — countermeasure is tracking the review-queue\'s trigger rate over time as its own monitored metric, re-calibrating thresholds when it drifts far from the target rate rather than leaving thresholds as launch-day constants. Reviewer calibration drift: individual reviewers\' internal sense of "acceptable" shifts gradually with exposure — countermeasure is periodic inter-rater checks (multiple reviewers score the same held-out clip set, compare distributions) and occasionally re-inserting a KNOWN-bad clip into the queue to confirm reviewers still catch it. The unifying principle: the harness is a system with its own failure modes, not a fixed instrument installed once — it needs the same ongoing monitoring discipline the lesson applies to the pipeline it evaluates.'
    },
    {
      q: 'The product ships a talking-head model upgrade that improves the golden-set proxy scores across the board, but creator complaints increase afterward. Walk through how you would investigate.',
      a: 'Start from the gap directly: proxies improved, real-world perception got worse, so the discrepancy is either a golden-set coverage gap (the upgrade helps on what the golden set measures but hurts on something outside its range) or a proxy-blind-spot regression (the upgrade improved timing/artifacts but degraded naturalness, invisible to tier one by construction). First move is pulling a sample of actual creator complaints and checking whether they cluster on an input type underrepresented in the golden set — a new model that specializes in frontal, well-lit shots at the cost of profile or low-light performance would show exactly this signature, and it is the more common root cause in practice, which is why golden-set coverage gets checked before assuming a deeper metric-blind-spot problem. If the complaints do NOT cluster by input type but instead sound like naturalness complaints ("looks stiff," "feels off") spread evenly, that points to the proxy-blind-spot case — the upgrade optimized for what tier one measures (likely because the model\'s OWN training or selection process used similar proxies) at the expense of what only humans were checking, which argues for increasing the random-baseline human-review rate temporarily on this version while investigating, and treating this incident itself as the trigger for building a new proxy metric targeting whatever specific quality dimension regressed. Either way, the fix is never "trust the proxies more" — it is expanding either the golden set\'s coverage or the proxy battery\'s scope, using the real complaints as the specification for what was missing.'
    }
  ]
};
