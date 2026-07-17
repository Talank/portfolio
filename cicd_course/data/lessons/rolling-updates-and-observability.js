window.LESSONS = window.LESSONS || {};
window.LESSONS['rolling-updates-and-observability'] = {
  id: 'rolling-updates-and-observability',
  title: 'Rolling Updates, Rollbacks & Health Checks: Deploying Without Downtime',
  category: 'Part 7 — Shipping It & Capstone',
  timeMin: 40,
  summary: 'The previous lesson\'s pipeline updates a Deployment\'s image and verifies the rollout completes — but it never explained HOW that rollout actually replaces old Pods with new ones without a window of total downtime, or what determines whether a new Pod is even considered "healthy" in the first place. This lesson opens both: the RollingUpdate strategy\'s actual replacement mechanics, and the two health-check probes (liveness, readiness) that determine whether any of it is happening safely — the last piece needed before the capstone puts everything together end to end.',
  goals: [
    'Explain how a RollingUpdate replaces old Pods with new ones without a window of zero available replicas',
    'Configure maxSurge and maxUnavailable and explain what each one controls',
    'Write a liveness probe and a readiness probe, and explain the distinct consequence of each one failing',
    'Explain why a missing or wrong readiness probe can cause real user-facing errors during an otherwise "successful" deploy',
    'Perform and explain a manual rollback using kubectl rollout undo'
  ],
  concept: [
    {
      h: 'RollingUpdate: replacing Pods gradually, never all at once',
      p: [
        'A Deployment\'s default update strategy, `RollingUpdate`, replaces old Pods with new ones INCREMENTALLY rather than deleting every old Pod and creating every new one simultaneously — the previous lesson\'s deepDive already introduced the underlying mechanism (a new ReplicaSet scaled up while the old one scales down); this lesson covers the two settings that control exactly HOW gradual that transition is. `maxUnavailable` caps how many of the DECLARED replica count are allowed to be unavailable (old-and-terminating, or new-and-not-yet-ready) at any point during the rollout — with a sensible setting, the number of Pods actually able to serve traffic never drops below a safe threshold, even mid-rollout.',
        '`maxSurge` caps how many EXTRA Pods (beyond the declared replica count) are allowed to exist temporarily during the rollout — a positive maxSurge lets Kubernetes create some new Pods BEFORE removing the corresponding old ones, keeping capacity high (or even temporarily higher than normal) throughout the transition, at the cost of briefly running slightly more Pods than the steady-state replica count. Together, these two settings are the actual dial controlling the tradeoff between rollout speed and guaranteed available capacity during the transition — the deployments-and-services lesson\'s "the Service keeps routing to whichever Pods are currently healthy" claim is what makes this whole gradual-replacement approach invisible to callers, PROVIDED the health checks covered next are configured correctly.'
      ]
    },
    {
      h: 'Liveness probes: "is this container broken and needs a restart?"',
      p: [
        'A <b>liveness probe</b> is a periodic health check (an HTTP request expecting a 200 response, a TCP connection attempt, or a specific command run inside the container) that Kubernetes runs against a Pod\'s container on an ongoing basis — if the probe FAILS repeatedly (past a configured failure threshold), Kubernetes considers that container broken and RESTARTS it, exactly the mechanism the kubectl-and-troubleshooting deepDive flagged as one real trigger behind CrashLoopBackOff, distinct from the container\'s own process actually crashing on its own.',
        'This matters for a genuinely real failure mode a simple "is the process still running" check would miss entirely: a process can be technically still running (not crashed, not exited) while being completely HUNG or deadlocked — unable to make any real progress, unable to serve any actual request, indefinitely, while still showing up as "Running" to anything that only checks process existence. A liveness probe that actually exercises real application behavior (an HTTP endpoint the application must genuinely respond to) catches this hung-but-technically-alive case and forces a restart, where a naive process-existence check never would.'
      ]
    },
    {
      h: 'Readiness probes: "should this Pod currently receive traffic?"',
      p: [
        'A <b>readiness probe</b> uses the identical mechanical check types as a liveness probe (HTTP, TCP, or exec) but has a COMPLETELY different consequence on failure: a failing readiness probe does NOT restart the container — it simply removes that Pod from the set of Pods a Service currently routes traffic to (exactly the deployments-and-services lesson\'s "a Service only routes to ready Pods" claim, now explained mechanically), while leaving the container running, untouched, free to become ready again later and automatically rejoin the routable set the moment it does.',
        'This distinction is precisely why BOTH probes are typically configured together, doing genuinely different jobs: readiness handles the routine, expected case of "this Pod is still starting up, or briefly recovering from a downstream dependency hiccup, and should not receive traffic yet, but is not actually broken" — restarting it in that case would be needless and could even make a temporary situation worse by discarding useful, still-warm application state. Liveness handles the genuinely different case of "this container is broken and no amount of waiting will fix it without a restart."'
      ]
    },
    {
      h: 'Why a missing or wrong readiness probe silently breaks an otherwise "successful" rollout',
      p: [
        'Without an explicitly configured readiness probe, Kubernetes uses a much weaker default signal for "is this Pod ready" — essentially, "has the container process started" — which says nothing about whether the APPLICATION inside has actually finished its own startup work (loading configuration, warming a cache, establishing its own database connection) and is genuinely able to correctly handle a real request yet. A new Pod could be added to a Service\'s routing set the instant its container process starts, well before the application inside is actually ready, causing a real window of user-facing errors (failed or slow requests hitting a not-actually-ready Pod) during every single rollout — even though `kubectl rollout status` reports the rollout as fully successful, since it is only checking Kubernetes\'s OWN notion of readiness, which is exactly the (too-weak) default this section is describing.',
        'The fix is a deliberately, specifically configured readiness probe checking something that genuinely correlates with "actually ready to serve a real request" — commonly a dedicated `/healthz` or `/ready` HTTP endpoint the application itself implements, which internally verifies its own critical startup work (config loaded, database reachable) is genuinely complete before returning success. This is precisely the gap between "the previous lesson\'s pipeline reports the deploy as verified successful" and "users genuinely experienced zero errors during that deploy" — `kubectl rollout status` succeeding confirms Kubernetes\'s OWN bookkeeping is satisfied, not that real traffic was handled correctly throughout, and a correctly configured readiness probe is what closes that specific gap.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Rotating the Watch Without Ever Leaving the Deck Unwatched',
      text: 'Replacing the Sunny\'s lookout crew for a shift change never means pulling everyone off the deck at once and THEN bringing the new shift up — that would leave a genuine gap with nobody watching at all, however brief. The actual practice: a new lookout climbs up and is asked specific, real questions confirming they have actually gotten their bearings and can genuinely see and correctly identify what matters — not simply "have you arrived," but "are you ACTUALLY oriented and ready." Only once that specific confirmation passes does the outgoing lookout climb down, one at a time, gradually, never dropping the number of genuinely alert watchers below the safe minimum at any single moment. And separately — a distinct failure mode from someone simply not being ready YET — if a lookout already on duty is discovered to be genuinely unresponsive, perhaps having fallen asleep, they are not gently asked to wait and try again; they are immediately relieved and sent below entirely, a fundamentally different response than the "not ready yet, give it a moment" case.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Rotating Conference Booth Coverage Without Ever Leaving It Unstaffed',
      text: 'Handing off coverage of the group\'s conference exhibition booth between shifts never means everyone leaving at once and THEN the next shift arriving — that would leave the booth genuinely unstaffed, however briefly, missing exactly the visitors who happened to walk by during the gap. The actual practice Amy insists on: an incoming team member is asked specific questions confirming they have genuinely absorbed the latest talking points and can competently field a real visitor\'s question — not simply "have you shown up," but "are you ACTUALLY ready to correctly represent the booth." Only once that specific confirmation passes does an outgoing team member step away, one at a time, never dropping booth coverage below a safe minimum at any single moment. And separately — a genuinely different failure mode from someone simply not being briefed YET — if someone already staffing the booth is discovered to have wandered off entirely unresponsive to their phone, they are not gently given more time to "get ready"; Amy immediately arranges a full replacement, a fundamentally different response than the "still getting briefed, give it a moment" case.'
    },
    why: 'The lookout handoff and the conference booth handoff both replace personnel GRADUALLY, confirming genuine readiness (a specific check, not just "has this person arrived") before removing the previous coverage — exactly RollingUpdate\'s maxSurge/maxUnavailable-controlled, readiness-probe-gated Pod replacement, never dropping available capacity below a safe level. And both stories\' distinct "unresponsive, send below immediately" case versus "not ready yet, give it a moment" case is exactly the liveness-versus-readiness distinction: one triggers an immediate restart/replacement, the other simply, temporarily, withholds new responsibility (traffic) without any restart at all.'
  },
  tech: [
    {
      q: 'Concretely, with replicas: 4, maxUnavailable: 1, and maxSurge: 1, what is the actual sequence of Pod counts during a rolling update?',
      a: 'Kubernetes can create up to 1 EXTRA new Pod (maxSurge: 1) before removing any old one, and can tolerate up to 1 Pod being unavailable (maxUnavailable: 1) at any point — so a typical sequence: start at 4 old Pods running; create 1 new Pod (now 5 total, 4 old + 1 new, satisfying maxSurge: 1 as the temporary ceiling); once that new Pod is READY, remove 1 old Pod (back to 4 total: 3 old + 1 new, having stayed within maxUnavailable: 1 throughout since removal only happened after the replacement was already ready); repeat this create-then-remove cycle until all 4 are new. At every single point in this sequence, at least 3 of the 4 declared replicas remain available — the rollout never drops below that guaranteed minimum, which is the entire point of configuring these two values deliberately rather than accepting whatever the default happens to be.'
    },
    {
      q: 'Why does a liveness probe failure trigger a container RESTART while a readiness probe failure does not, given that both probes can use the exact same underlying check mechanism?',
      a: 'The two probes are answering fundamentally different questions, even when implemented with identical mechanics: a liveness probe answers "is this container in a state that requires forcibly restarting it to recover" — and Kubernetes\'s only real lever for actually fixing a genuinely broken, non-recovering container IS a restart, so failure triggers exactly that. A readiness probe answers "should this Pod currently receive new traffic" — a genuinely different, much less drastic question, where the correct response to "not ready right now" is usually just "wait and don\'t send it traffic yet," NOT "forcibly restart it," since the Pod may simply be temporarily busy, warming up, or waiting on a downstream dependency that will resolve on its own shortly — restarting in that case would be needless, and could actively make a temporary situation worse by discarding in-progress work or a warm cache.'
    },
    {
      q: 'Why can `kubectl rollout status` report a rollout as fully successful while real users are still experiencing errors during that same rollout window?',
      a: '`kubectl rollout status` succeeds based on Kubernetes\'s OWN bookkeeping — specifically, that the declared number of new Pods have reached whatever Kubernetes currently considers "ready," which, absent a properly configured readiness probe, defaults to a much weaker signal (essentially, the container process has started) than "the application inside is genuinely able to correctly handle a real request." If a Pod is marked ready by that weak default the instant its process starts — before the application has actually finished its own internal startup work — a Service could route real traffic to it during that gap, causing genuine user-facing errors, while `kubectl rollout status` is simultaneously, correctly (by ITS OWN definition of ready) reporting complete success. This is exactly why a deliberately configured, application-aware readiness probe matters: it is what makes Kubernetes\'s notion of "ready" actually correspond to "genuinely able to serve a real request," closing the gap between "the pipeline reports success" and "users experienced no errors."'
    }
  ],
  code: {
    title: 'A Deployment with rollout strategy AND both health probes configured',
    intro: 'Every field here maps directly to one of this lesson\'s four concept sections.',
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1     # never more than 1 of 4 unavailable at once
      maxSurge: 1            # allow 1 extra Pod temporarily during rollout
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: myregistry.example.com/myteam/my-app:1.4.2
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 15
            failureThreshold: 3
            # ^ 3 consecutive failures -> Kubernetes RESTARTS this container
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 2
            # ^ 2 consecutive failures -> REMOVED from Service routing,
            #   NOT restarted — automatically rejoins once /ready passes again

# Manual rollback if a bad version already deployed:
$ kubectl rollout undo deployment/my-app --namespace production
# ^ reverts to the PREVIOUS ReplicaSet, scaled back up — fast, since
#   it was kept around (scaled to zero) rather than deleted`,
    notes: [
      '/healthz and /ready are conventional path names, not a Kubernetes requirement — what matters is that each endpoint genuinely checks what its probe is meant to verify, distinctly from each other.',
      'initialDelaySeconds gives a container a grace period before probing even begins — appropriate for an application with real startup time, avoiding probe failures during normal, expected startup.'
    ]
  },
  lab: {
    title: 'Diagnose a rollout that "succeeded" but broke traffic',
    prompt: 'A Deployment has NO readiness probe configured at all (only a livenessProbe). After a deploy, kubectl rollout status reports success, but users experience a burst of errors for about 8 seconds after each new Pod appears. Explain why this happens given what this lesson covered, and write the readiness probe block that would fix it (assume the app exposes GET /ready on port 3000, taking about 8 seconds to start returning 200).',
    starter: `# Why does this happen with no readiness probe configured?


# Your added readinessProbe block:
readinessProbe:
  ???
`,
    checks: [
      { re: 'default|weak|process\\s+start|not\\s+(actually\\s+)?ready|too\\s+early', flags: 'i', must: true, hint: 'Explain that without a readiness probe, Kubernetes uses a weak default (essentially "the process started"), routing traffic before the app is genuinely ready.', pass: 'explanation present ✓' },
      { re: 'httpGet:\\s*\\n\\s*path:\\s*/ready\\s*\\n\\s*port:\\s*3000', flags: 'i', must: true, hint: 'readinessProbe.httpGet.path: /ready, port: 3000', pass: 'httpGet /ready:3000 ✓' },
      { re: 'initialDelaySeconds:\\s*[5-9]|initialDelaySeconds:\\s*1[0-5]', flags: 'i', must: true, hint: 'initialDelaySeconds should be at least ~8 (matching the app\'s real startup time) to avoid needless early failures.', pass: 'reasonable initialDelaySeconds ✓' }
    ],
    run: 'No real cluster needed for this diagnosis — the fix is purely about correctly configuring the probe, not about running anything.',
    solution: `# Why does this happen with no readiness probe configured?
# Without an explicit readiness probe, Kubernetes falls back to a much
# weaker default notion of "ready" (essentially, the container process
# has started) rather than "the application has genuinely finished its
# own startup work and can handle a real request." A new Pod gets added
# to the Service's routing set the instant its process starts, roughly
# 8 seconds before the app is actually ready to correctly respond -
# exactly the observed error window.

# Your added readinessProbe block:
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 8
  periodSeconds: 3
  failureThreshold: 1`,
    notes: [
      'kubectl rollout status would have reported this deploy as fully successful the whole time — it was only checking Kubernetes\'s own (too-weak, default) readiness signal, not real user-facing correctness.',
      'This exact gap — a "successful" pipeline verification (previous lesson) alongside real user-facing errors — is precisely why readiness probes matter even in a pipeline that already checks rollout status.'
    ]
  },
  quiz: [
    {
      q: 'What does maxUnavailable control during a rolling update?',
      options: ['The maximum number of extra Pods allowed temporarily beyond the declared replica count', 'The maximum number of the declared replicas allowed to be unavailable at any point during the rollout', 'The total time a rollout is allowed to take', 'The number of nodes a rollout can use'],
      correct: 1,
      explain: 'maxUnavailable caps how many of the DECLARED replicas can be down/not-ready simultaneously, guaranteeing a minimum available capacity throughout the rollout.'
    },
    {
      q: 'What is the key difference in CONSEQUENCE between a failing liveness probe and a failing readiness probe?',
      options: ['They have identical consequences', 'A failing liveness probe triggers a container RESTART; a failing readiness probe removes the Pod from Service traffic routing WITHOUT restarting it', 'A failing readiness probe deletes the entire Deployment', 'Liveness probes only run once at startup; readiness probes run continuously'],
      correct: 1,
      explain: 'Liveness answers "does this need a restart"; readiness answers "should this receive traffic right now" — genuinely different questions with genuinely different responses to failure.'
    },
    {
      q: 'Why can a rollout report "successful" via kubectl rollout status while users still experience errors during that same rollout?',
      options: ['This is impossible — rollout status always reflects real user experience', 'rollout status only reflects Kubernetes\'s own notion of readiness, which — without a properly configured readiness probe — defaults to a much weaker signal than "genuinely able to serve a real request"', 'kubectl rollout status is unrelated to Deployments entirely', 'This only happens if maxSurge is set to 0'],
      correct: 1,
      explain: 'Without an application-aware readiness probe, Kubernetes\'s default readiness signal is too weak, creating a real gap between "Kubernetes considers it ready" and "it can actually serve correctly."'
    },
    {
      q: 'Why is a liveness probe that checks a real HTTP endpoint better than one that only checks "is the process still running"?',
      options: ['There is no real difference between the two approaches', 'A process can be technically running while genuinely hung/deadlocked and unable to serve any request — an HTTP-based probe exercising real behavior catches this, while a process-existence check would not', 'HTTP probes are always faster to execute', 'Process-existence checks are not supported by Kubernetes at all'],
      correct: 1,
      explain: 'A hung-but-not-crashed process would pass a naive existence check indefinitely — only a probe that exercises genuine application behavior catches that specific failure mode.'
    },
    {
      q: 'What does `kubectl rollout undo` do, and why is it typically fast?',
      options: ['It deletes the Deployment entirely, requiring a full rebuild', 'It reverts to the previous ReplicaSet, which Kubernetes kept scaled to zero (not deleted) specifically to make rollback fast', 'It rebuilds the previous image from source', 'It only works within 60 seconds of the original deploy'],
      correct: 1,
      explain: 'A Deployment keeps its previous ReplicaSet around at zero replicas after an update — rollback is simply scaling it back up, avoiding a full rebuild-and-redeploy cycle.'
    }
  ],
  pitfalls: [
    'Deploying without a readiness probe configured at all and trusting the default "process started" signal to mean "genuinely ready" — it does not, and this gap causes real, silent, user-facing errors during routine rollouts.',
    'Using the exact same check for both liveness and readiness without considering whether their genuinely different failure consequences (restart vs. traffic removal) are actually appropriate for what that specific check verifies.',
    'Treating a successful `kubectl rollout status` as proof that real users experienced zero errors during the rollout — it only confirms Kubernetes\'s own (potentially too-weak) readiness bookkeeping was satisfied.'
  ],
  interview: [
    {
      q: 'Explain the distinct purposes of liveness and readiness probes, and describe a real scenario where configuring them identically (using the same check for both) would cause a genuine problem.',
      a: 'Liveness answers "is this container broken in a way only a restart can fix" — failure triggers a forced restart. Readiness answers "should this Pod currently receive traffic" — failure only withholds traffic, with no restart. A real problem scenario: an application that briefly loses its database connection (a transient network blip, or the database itself restarting) would correctly want its READINESS probe to fail temporarily, cleanly removing it from traffic until the connection recovers on its own moments later. If that SAME check were also used as the LIVENESS probe, the container would be forcibly RESTARTED during that same transient blip — needless, since the application was never actually broken and would have recovered on its own, and actively harmful if the restart itself takes longer than the transient outage would have, or if restarting loses useful in-progress state. Using the same check for both conflates "temporarily not ready" with "permanently broken," which are genuinely different situations warranting genuinely different responses.'
    },
    {
      q: 'A team\'s rolling updates are technically zero-downtime according to their monitoring dashboards, but customer support keeps receiving complaints about brief errors during every deploy. What would you investigate first, and why?',
      a: 'I would first check whether the Deployment has a properly configured, application-aware readiness probe — this is the single most common cause of exactly this symptom: dashboards and `kubectl rollout status` measuring Kubernetes\'s OWN bookkeeping (are the declared number of replicas marked ready) can show a perfectly clean, "zero-downtime" rollout while a real gap exists between "Kubernetes marked this Pod ready" (potentially just "the process started," if no readiness probe is configured, or a poorly-chosen one is) and "the application inside is actually able to correctly handle a request." Customer-reported errors correlating specifically with deploy events, despite clean-looking dashboards, is a strong signal that whatever "ready" currently means to Kubernetes for this Deployment does not actually correspond to genuine request-readiness — the fix is auditing and likely rewriting the readiness probe to check something that truly reflects the application\'s actual startup completion, not just process existence."'
    },
    {
      q: 'How would you choose maxSurge and maxUnavailable values for a Deployment running a critical, high-traffic service versus a low-traffic internal tool, and why would those choices reasonably differ?',
      a: 'For a critical, high-traffic service, I would favor a HIGHER maxSurge (e.g., matching or exceeding the normal replica count) and a LOWER maxUnavailable (e.g., 0 or 1) — prioritizing keeping full, or very close to full, capacity available throughout the rollout, accepting the cost of briefly running more total Pods (more resource usage during the transition) in exchange for minimizing any risk of capacity-related degradation under real load. For a low-traffic internal tool, a more conservative maxSurge (e.g., 0, replacing Pods strictly in place) combined with a slightly higher tolerance for maxUnavailable is often perfectly reasonable, since the actual risk of briefly reduced capacity mattering to real users is much lower, and minimizing extra resource usage during routine, frequent rollouts of a low-stakes internal tool is a genuinely reasonable priority to weigh higher in that specific context.'
    },
    {
      q: 'Why does keeping the previous ReplicaSet scaled to zero (rather than deleting it) after a rollout matter specifically for incident response?',
      a: 'A production incident caused by a bad deploy is exactly the scenario where SPEED of recovery matters most — every additional minute a broken version stays live is additional user impact. Because the Deployment controller keeps the previous ReplicaSet\'s definition around, merely scaled to zero rather than deleted, `kubectl rollout undo` can restore the last-known-good version by simply scaling that existing ReplicaSet back up and the broken one back down — a fast, well-understood operation, typically completing in roughly the same time as a normal rollout step. If the previous ReplicaSet had instead been fully deleted, "rolling back" would require rebuilding a new ReplicaSet from scratch (effectively a fresh forward deploy of the old version, from whatever the old image reference happens to still be, rather than an instant revert to something Kubernetes already has readily available) — meaningfully slower during exactly the moment when speed matters most.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover RollingUpdate mechanics and both probe types. This is what is underneath: startup probes for slow-starting applications, PodDisruptionBudgets protecting availability during voluntary cluster maintenance (not just rollouts), and blue-green/canary as alternative deployment strategies to RollingUpdate.',
    sections: [
      {
        h: 'Startup probes: giving a genuinely slow-starting application room, without weakening liveness',
        p: [
          'A container with a genuinely long startup time (loading a large dataset, warming an extensive cache) creates a real tension: the liveness probe\'s `initialDelaySeconds` needs to be long enough to not fail during normal, expected slow startup, but a LONG initialDelaySeconds also means liveness checking is effectively disabled for that entire window even AFTER startup genuinely completes and a real hang could occur. A `startupProbe` resolves this tension: it runs FIRST, exclusively, with its own generous timeout/threshold suited to slow startup, and the regular liveness AND readiness probes do not begin running at all until the startup probe has succeeded even once — meaning liveness can be configured with a normal, TIGHT failure threshold for genuinely detecting a post-startup hang, without needing to also accommodate slow startup in that same configuration.'
        ]
      },
      {
        h: 'PodDisruptionBudgets: protecting availability during VOLUNTARY disruptions, not just rollouts',
        p: [
          'maxUnavailable/maxSurge on a Deployment govern availability specifically during a ROLLOUT triggered by an image/spec change — but a cluster administrator might ALSO need to voluntarily drain a node for maintenance (a Kubernetes version upgrade, hardware replacement) at a completely different time, unrelated to any application deploy. A `PodDisruptionBudget` (PDB) declares a minimum number (or percentage) of a Deployment\'s Pods that must remain available even during such VOLUNTARY cluster-administrator-initiated disruptions — if honoring a node drain would violate the PDB, Kubernetes\'s eviction process for that drain is blocked until it can proceed without breaching the PDB (commonly, by waiting for a replacement Pod to become ready elsewhere first). This is a genuinely distinct mechanism from RollingUpdate\'s settings, protecting the same underlying goal (minimum available capacity) against a different, non-deploy-related category of disruption.'
        ]
      },
      {
        h: 'Blue-green and canary: alternatives to RollingUpdate\'s gradual, single-track replacement',
        p: [
          'RollingUpdate gradually replaces old Pods with new ones IN PLACE, with both versions briefly coexisting and sharing traffic proportionally to however many of each currently exist. A <b>blue-green</b> deployment instead runs the ENTIRE new version (equal to the full replica count) alongside the entire old version simultaneously, then switches ALL traffic over in one deliberate cut-over (commonly by updating a Service\'s selector to point at the new version\'s labels instead of the old one\'s) — genuinely simpler to reason about (no window of mixed old/new versions handling traffic simultaneously) at the cost of temporarily needing double the resource capacity. A <b>canary</b> deployment sends a small, deliberately limited PERCENTAGE of real traffic to the new version first (often via a service mesh or ingress-level traffic-splitting feature beyond a Deployment\'s own settings) while the vast majority continues to the proven old version, allowing genuine real-traffic validation on a small, contained blast radius before committing to a full rollout — a meaningfully more cautious, more gradual approach than RollingUpdate\'s "replace everyone within one rollout" default, at the cost of needing additional tooling beyond a plain Deployment to actually implement the traffic split.'
        ]
      }
    ]
  }
};
