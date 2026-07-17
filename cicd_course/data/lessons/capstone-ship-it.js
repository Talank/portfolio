window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-ship-it'] = {
  id: 'capstone-ship-it',
  title: 'Capstone: Dockerize, Compose, Deploy & Automate a Real App End to End',
  category: 'Part 7 — Shipping It & Capstone',
  timeMin: 60,
  summary: 'This lesson does not teach a new concept — it traces ONE complete request, from a developer\'s local edit to a real user seeing the result, citing every single lesson this course has covered, in the order those lessons actually fire. The point is not new material; it is confirming that all 21 previous lessons are genuinely one coherent system, not 21 separate topics — and closing with the concrete build order and minimum-viable-slice guidance for actually building this yourself, for real, outside this course.',
  goals: [
    'Trace one code change from a local git commit to a live, verified production deployment, naming every mechanism involved',
    'Identify the four-layer map (Docker, Compose, Kubernetes, CI/CD) each lesson\'s content belongs to',
    'Name the recurring architectural patterns that appear at multiple layers of this course, not just once',
    'State a genuinely minimal but real build order for dockerizing and deploying an application from scratch',
    'Explain what "done" honestly looks like for a small real project built using this course\'s material'
  ],
  concept: [
    {
      h: 'The full trace: one commit, start to finish',
      p: [
        'A developer fixes a bug locally, tests it against services started with `docker compose up` (docker-compose-essentials) — reaching a database container by SERVICE NAME over the shared network Compose created automatically (docker-networking), with the database\'s actual data persisted in a named volume surviving container restarts (volumes-and-persistence) — and, satisfied, runs `git push` to a feature branch. That push triggers a GitHub Actions workflow (github-actions-fundamentals) whose `on: pull_request` trigger runs build-and-test only (ci-cd-concepts\' trigger-design guidance), giving fast feedback before anything merges.',
        'Once reviewed and merged to main, the SAME workflow\'s `on: push` path runs the full sequence: `docker build`, using a correctly-layer-ordered Dockerfile (dockerfile-best-practices) built from a multi-stage recipe (also dockerfile-best-practices) starting FROM an appropriately minimal base (images-vs-containers, the-dockerfile), with any build-time credential handled via BuildKit secret mounts rather than baked into a layer (environment-config-and-secrets) — producing an image tagged with the exact commit SHA (image-registries\' "never rely on :latest" principle), never a floating tag.'
      ]
    },
    {
      h: 'The full trace, continued: from a pushed image to a verified, healthy rollout',
      p: [
        'Tests pass, hard-gating the pipeline forward (ci-cd-concepts). The image is pushed to a registry (image-registries), making it genuinely pullable by anything with access, including a real cluster. The pipeline authenticates to that cluster using narrowly-scoped, secret-stored credentials (building-a-deploy-pipeline), then updates a Kubernetes Deployment to reference the new, specific tag (building-a-deploy-pipeline) — a Deployment whose Pod template references configuration via a ConfigMap and sensitive values via a Secret (configmaps-and-secrets-k8s), never hardcoded inline, and whose data-writing container (if any) mounts a PersistentVolumeClaim rather than relying on node-local storage that would not survive a reschedule (storage-in-kubernetes).',
        'The Deployment\'s controller (why-kubernetes\' reconciliation loop, deployments-and-services\' mechanics) begins a RollingUpdate, governed by maxSurge/maxUnavailable (rolling-updates-and-observability), creating new Pods and only removing old ones once each new Pod\'s READINESS PROBE genuinely passes (rolling-updates-and-observability) — with a Service continuing to route traffic only to currently-ready Pods throughout the entire transition (deployments-and-services), invisible to any caller. The pipeline\'s final step, `kubectl rollout status`, BLOCKS until this entire process genuinely completes successfully (building-a-deploy-pipeline\'s "verify, don\'t just trust the command returned" principle) — and only then does the pipeline, correctly, report success.'
      ]
    },
    {
      h: 'The four-layer map, and the pattern that repeats across all of them',
      p: [
        'Every lesson in this course belongs to exactly one of four layers, and the layers stack directly on each other: DOCKER (Parts 0-2 — package one application reproducibly into an image); COMPOSE (Part 3 — run several containers together, networked and persisted, on one machine); KUBERNETES (Parts 4-5 — run many replicas of those images reliably, across many machines, self-healing, with stable addressing and proper storage); CI/CD (Parts 6-7 — automate the entire build-test-push-deploy sequence, triggered by a git push, with no manual step in between). Each layer\'s lessons assumed the previous layer\'s vocabulary as already-comfortable — Kubernetes\'s Pods run Docker images; CI/CD pipelines run `docker build` and `kubectl` commands this course already taught by hand first.',
        'A single architectural pattern recurs at nearly every layer, worth naming explicitly now that all the instances are visible at once: a REQUEST or REFERENCE, decoupled from the specific thing satisfying it, with the SYSTEM responsible for matching them — Docker\'s named volumes (referenced by name, not a specific disk location); Docker Compose\'s service names (DNS-resolved, not hardcoded IPs); Kubernetes Deployments finding Pods via label selector (not tracked names); Services finding Pods the same way; PersistentVolumeClaims finding PersistentVolumes via binding (not a specific storage device); and CI/CD pipelines referencing secrets by NAME (`${{ secrets.X }}`), never inline. This is not six unrelated conveniences — it is one repeated design decision, applied consistently, because the alternative (hardcoding specific identities everywhere) breaks the instant anything on the other end of that reference is replaced, rescheduled, or rotated — which, across this entire course, is treated as the NORMAL case, not an exception.'
      ]
    },
    {
      h: 'Building this for real: a genuinely minimal, honest slice, and where to add depth',
      p: [
        'A concrete, minimal build order for a real small application, in this course\'s own vocabulary: (1) write a correctly-ordered, multi-stage Dockerfile and confirm `docker run` works locally; (2) add a `docker-compose.yml` for local development against any dependencies (a database, say); (3) write a Deployment + Service manifest and confirm it runs on a local cluster (kind/minikube) with `kubectl apply -f`; (4) add a ConfigMap/Secret and a PersistentVolumeClaim if the application genuinely needs persisted state; (5) add readiness/liveness probes and confirm a manual rolling update (changing the image tag by hand) behaves correctly; (6) write the GitHub Actions workflow automating steps 1-5\'s manual commands; (7) add the rollout-verification step, and, if desired, automatic rollback on failure.',
        'The honest caveat, matching this course\'s consistently lean-by-default philosophy: a real production system built past this course\'s scope would likely also want observability beyond `kubectl logs`/`describe` (a proper metrics/logging stack), a genuine staging environment before production, and — for anything with real compliance or reliability requirements — considerably more rigor around secrets management (the etcd-encryption-at-rest and external-secrets-manager points raised in configmaps-and-secrets-k8s) than this course went deep on. None of that invalidates what THIS course built — it is precisely the next layer of depth to add ONCE the foundation this course covers is genuinely solid, not a sign the foundation itself was insufficient.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Thousand Sunny\'s Maiden Voyage, Every Earlier Lesson Paying Off At Once',
      text: 'The Sunny\'s actual maiden voyage is not a single new skill on display — it is every single thing the crew separately learned and drilled across many earlier, disconnected-feeling lessons, all firing together, in the right order, for the first time as one genuinely coherent whole. Franky\'s partitioned workshops (namespaces/cgroups) and his portable blueprints (the Dockerfile) meant the ship itself was buildable and reproducible in the first place. Nami\'s properly-set Log Pose (declarative desired state) and the standing watch rotation (Deployments) meant the crew reliably knew where they were going and stayed properly staffed without her personally supervising every single moment. The posted departure checklist (a CI/CD workflow) meant leaving port correctly no longer depended on anyone perfectly remembering every step under pressure. And the rotating lookout handoff, never leaving the deck unwatched (rolling updates with health checks), meant even changing crew mid-voyage never left a dangerous gap. None of these were building toward some final, separate "maiden voyage" lesson — the maiden voyage genuinely IS just all of them, already fully learned, working together for the first time as one real system, with nothing new needing to be introduced at all.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica and Chandler\'s Wedding, Every Earlier Lesson Paying Off At Once',
      text: 'Monica and Chandler\'s actual wedding day is not a single new skill either — it is every separately-learned lesson from the group\'s history together, all firing at once, in the right order, as one genuinely coherent whole for the first time. Monica\'s exactingly numbered recipe cards (a correctly-ordered Dockerfile) meant the catering itself was actually buildable and reproducible under real pressure. The posted group-coordination system (declarative state, reliably reconciled) meant everyone reliably ended up where they needed to be without Monica personally supervising every single guest. The expo-rail discipline — never skip a check, never let a bad plate reach the table (a CI/CD pipeline\'s hard-gating) — meant nothing under-tested reached a guest that day. And the practiced two-baristas-always-on-shift-style handoffs, applied to every role that day (rolling, verified transitions between responsibilities, never leaving a gap) meant even mid-event handoffs — passing a task from one friend to another — never left something genuinely uncovered. None of these were separately building toward some final "wedding day" lesson — the wedding day genuinely IS all of them, already learned, working together for the first time as one real, complete system.'
    },
    why: 'Both stories make the literal point of this lesson: nothing NEW is being taught here. The Sunny\'s maiden voyage and Monica and Chandler\'s wedding are both simply every earlier, separately-learned piece — Docker\'s reproducibility, Kubernetes\'s reliable reconciliation, CI/CD\'s hard-gated automation, rolling updates\' gap-free handoffs — genuinely firing together, in the right order, as one coherent whole for the first time. That is exactly this capstone: not a 22nd new concept, but confirmation that the previous 21 lessons were one system all along.'
  },
  tech: [
    {
      q: 'Trace exactly which lesson\'s concept explains why a code-only change (no dependency change) rebuilds quickly in CI, end to end.',
      a: 'The dockerfile-best-practices lesson\'s layer-ordering guidance (dependency manifest copied and installed BEFORE application source) means Docker\'s build cache (the-dockerfile lesson\'s underlying mechanism) reuses the cached dependency-install layer on a source-only change, rebuilding only the fast, late COPY/CMD layers. The github-actions-fundamentals deepDive\'s dependency-caching mechanism additionally persists the CI RUNNER\'s own package-manager cache across separate workflow runs (a distinct cache from the Docker layer cache, at a different layer entirely), so even the runner-level dependency-download step, if it runs at all, is fast. Both caches independently contribute to the same overall outcome — fast CI on routine, common code-only changes — for genuinely different, specific reasons at genuinely different layers.'
    },
    {
      q: 'If a Pod created by this course\'s capstone-style Deployment is rescheduled to a different node mid-incident, trace every mechanism that keeps it working correctly on the new node.',
      a: 'The Deployment\'s label-selector-based Pod tracking (deployments-and-services) recognizes the brand-new replacement Pod as "one of mine" immediately, regardless of its new name/IP (pods-and-the-api-server\'s ephemerality). If it uses persisted storage, the PersistentVolumeClaim (storage-in-kubernetes) binds correctly to the underlying PersistentVolume regardless of which node the Pod landed on, since PVs are deliberately not tied to one node\'s local disk — unlike a Docker-style local volume would be. Its ConfigMap/Secret references (configmaps-and-secrets-k8s) resolve identically regardless of node, since they are cluster-level objects, not node-local. And the Service routing to it (deployments-and-services) picks it up automatically via the same label selector, once its readiness probe (rolling-updates-and-observability) passes on the new node — the calling side never needs to know a reschedule even happened.'
    },
    {
      q: 'Name the specific mechanism, from a Kubernetes-level lesson, that mirrors Docker Compose\'s service-name-based reachability almost exactly, and explain the genuinely NEW capability the Kubernetes version adds on top.',
      a: 'A Kubernetes Service (deployments-and-services) mirrors Docker Compose\'s automatic user-defined-network DNS resolution (docker-networking, docker-compose-essentials) almost exactly in SPIRIT: both let you reach something by a stable NAME rather than a volatile IP. The genuinely new capability: a Kubernetes Service load-balances across MULTIPLE, potentially many, currently-healthy replicas spread across MULTIPLE machines, automatically updating which specific replicas receive traffic as Pods are individually created, destroyed, or rescheduled — Docker\'s container-name DNS resolution, by contrast, only ever resolves to ONE specific container\'s current IP, with no concept of load-balancing across several replicas or spanning multiple machines at all. Same underlying pattern (name-based indirection), meaningfully larger scope at the Kubernetes layer.'
    }
  ],
  code: {
    title: 'The full trace, as one sequence, citing every lesson',
    intro: 'Not new syntax — a chronological map of exactly which earlier lesson explains each step of one real deploy, start to finish.',
    code: `1. Local dev, docker compose up               <- docker-compose-essentials
   reaching "db" by name over Compose's network <- docker-networking
   db data persisted in a named volume           <- volumes-and-persistence

2. git push (feature branch) -> PR opened
   on: pull_request triggers build+test only     <- github-actions-fundamentals
                                                     ci-cd-concepts (trigger design)

3. Merged to main -> on: push triggers full pipeline
   docker build (multi-stage, correctly ordered) <- dockerfile-best-practices
     FROM a minimal, appropriate base              <- images-vs-containers, the-dockerfile
     any build secret via --mount=type=secret       <- environment-config-and-secrets
   tag: \${{ github.sha }}, never :latest          <- image-registries

4. Tests run, HARD-GATE the pipeline forward     <- ci-cd-concepts

5. docker push to registry                        <- image-registries

6. Pipeline authenticates (scoped credentials)    <- building-a-deploy-pipeline
   kubectl set image / apply -f, new tag           <- building-a-deploy-pipeline
     Deployment's Pods reference a ConfigMap/Secret <- configmaps-and-secrets-k8s
     stateful data on a PersistentVolumeClaim        <- storage-in-kubernetes

7. Deployment's controller reconciles              <- why-kubernetes, deployments-and-services
   RollingUpdate: maxSurge/maxUnavailable            <- rolling-updates-and-observability
   new Pods gated on readiness probe                  <- rolling-updates-and-observability
   Service routes only to ready Pods throughout        <- deployments-and-services

8. kubectl rollout status BLOCKS, verifies          <- building-a-deploy-pipeline
   pipeline reports success only now                   <- (this is the actual finish line)

9. If anything looks wrong: kubectl describe/logs   <- kubectl-and-troubleshooting
   if genuinely broken: kubectl rollout undo           <- rolling-updates-and-observability`,
    notes: [
      'Every single arrow here points to a lesson that was written and validated in isolation, weeks (in course-time) before this capstone — the point of this trace is confirming they were one system all along.',
      'Step 9 is not a failure of the pipeline — it is the honest acknowledgment that automation reduces, but never eliminates, the need for the debugging skills kubectl-and-troubleshooting taught.'
    ]
  },
  lab: {
    title: 'Order the full pipeline\'s dependency graph',
    prompt: 'Given a topological build_order() function signature `build_order(deps)` where deps is {step: [prerequisite steps]}, and steps: checkout, docker_build, unit_tests, docker_push, k8s_deploy, rollout_verify — write the deps object encoding this lesson\'s trace (each step depends on the step(s) that must complete before it can run), and state the one correct linear order it produces.',
    starter: `# deps object: step -> list of steps that must complete FIRST
const deps = {
  checkout: [],
  docker_build: [???],
  unit_tests: [???],
  docker_push: [???],
  k8s_deploy: [???],
  rollout_verify: [???],
};

# The one correct linear order this produces:

`,
    checks: [
      { re: "docker_build:\\s*\\['?checkout'?\\]", flags: 'i', must: true, hint: "docker_build depends on checkout: docker_build: ['checkout']", pass: 'docker_build deps ✓' },
      { re: "unit_tests:\\s*\\['?docker_build'?\\]", flags: 'i', must: true, hint: "unit_tests depends on docker_build: unit_tests: ['docker_build']", pass: 'unit_tests deps ✓' },
      { re: "docker_push:\\s*\\['?unit_tests'?\\]", flags: 'i', must: true, hint: "docker_push depends on unit_tests: docker_push: ['unit_tests']", pass: 'docker_push deps ✓' },
      { re: "k8s_deploy:\\s*\\['?docker_push'?\\]", flags: 'i', must: true, hint: "k8s_deploy depends on docker_push: k8s_deploy: ['docker_push']", pass: 'k8s_deploy deps ✓' },
      { re: "rollout_verify:\\s*\\['?k8s_deploy'?\\]", flags: 'i', must: true, hint: "rollout_verify depends on k8s_deploy: rollout_verify: ['k8s_deploy']", pass: 'rollout_verify deps ✓' },
      { re: 'checkout.*docker_build.*unit_tests.*docker_push.*k8s_deploy.*rollout_verify', flags: 'is', must: true, hint: 'The correct linear order is exactly: checkout, docker_build, unit_tests, docker_push, k8s_deploy, rollout_verify.', pass: 'correct linear order stated ✓' }
    ],
    run: 'No real command needed — this models the exact gating logic this lesson\'s trace (and the ci-cd-concepts lesson\'s stage-ordering) already established in prose.',
    solution: `const deps = {
  checkout: [],
  docker_build: ['checkout'],
  unit_tests: ['docker_build'],
  docker_push: ['unit_tests'],
  k8s_deploy: ['docker_push'],
  rollout_verify: ['k8s_deploy'],
};

# The one correct linear order this produces:
checkout, docker_build, unit_tests, docker_push, k8s_deploy, rollout_verify`,
    notes: [
      'This is a strictly LINEAR dependency chain (each step has exactly one prerequisite) — a genuine topological sort only becomes interesting with branching dependencies, but the underlying principle (no step runs before its prerequisites complete) is identical.',
      'Every single edge in this graph corresponds to a real "why this order matters" explanation from the ci-cd-concepts and building-a-deploy-pipeline lessons — none of it is arbitrary.'
    ]
  },
  quiz: [
    {
      q: 'What is the actual purpose of this capstone lesson, as stated in its own summary?',
      options: ['To introduce several brand-new Kubernetes features not covered elsewhere', 'To trace one complete request through every previous lesson\'s mechanism, confirming the whole course is one coherent system rather than 21 separate topics', 'To replace the need for the earlier Docker lessons', 'To teach a completely different deployment tool'],
      correct: 1,
      explain: 'The capstone deliberately introduces no new concept — its value is demonstrating that every earlier lesson connects into one working, coherent whole.'
    },
    {
      q: 'What is the recurring architectural pattern this lesson names as appearing at nearly every layer of the course?',
      options: ['Always use the smallest possible base image', 'A request or reference decoupled from the specific thing satisfying it, with the system responsible for matching them (named volumes, service names, label selectors, PVC-to-PV binding, secret references)', 'Every object must have exactly one owner', 'All configuration must be stored in environment variables'],
      correct: 1,
      explain: 'This pattern — indirection through a name/request rather than a hardcoded specific identity — recurs from Docker volumes through Compose service names through Kubernetes selectors through CI/CD secret references.'
    },
    {
      q: 'In the full trace, why must docker_push happen AFTER unit_tests rather than before?',
      options: ['Order does not actually matter between these two steps', 'Pushing an untested, potentially broken image to a registry defeats the purpose of testing — the test stage is a hard gate for everything after it, matching the ci-cd-concepts lesson', 'docker_push technically requires unit_tests to generate a valid tag', 'This ordering is purely a GitHub Actions syntax requirement'],
      correct: 1,
      explain: 'Each stage in the pipeline is a genuine prerequisite for the next — test must gate push, exactly as the ci-cd-concepts lesson established.'
    },
    {
      q: 'According to this lesson\'s "building this for real" guidance, what should come FIRST in a genuinely minimal build order for a new application?',
      options: ['Writing the full CI/CD pipeline before anything else', 'A correctly-ordered, multi-stage Dockerfile, confirmed working with a local docker run, before any Kubernetes or CI/CD work begins', 'Deploying directly to production Kubernetes first', 'Setting up a service mesh and canary deployments'],
      correct: 1,
      explain: 'The suggested build order starts with the foundational Docker layer and only adds Compose, then Kubernetes, then CI/CD automation on top, once each earlier layer is confirmed working.'
    },
    {
      q: 'Why does kubectl rollout status specifically need to BLOCK and wait, rather than the pipeline simply trusting kubectl apply/set image\'s own success, for the full trace to be honestly "verified" end to end?',
      options: ['It does not need to block — trusting the update command is sufficient', 'Accepting a new desired state and actually achieving it are different, asynchronous things — blocking verification is what closes the gap between "we told Kubernetes what we wanted" and "it actually happened"', 'Blocking is only needed for staging environments, never production', 'kubectl apply always fails if the rollout will eventually fail'],
      correct: 1,
      explain: 'This is exactly the building-a-deploy-pipeline lesson\'s core point, reaffirmed here as the actual finish line of the full trace — verification, not just command success, is what makes "done" honest.'
    }
  ],
  pitfalls: [
    'Treating each of this course\'s 22 lessons as an isolated fact to memorize rather than recognizing how directly later lessons depend on and reuse earlier ones — this capstone\'s trace is the antidote, showing the actual dependency chain explicitly.',
    'Building a real project by jumping straight to Kubernetes and CI/CD before a single Dockerfile is genuinely solid — this lesson\'s suggested build order is deliberately sequential for exactly this reason.',
    'Considering a real deployment "done" the moment a pipeline goes green, without the same rollout-verification and readiness-probe discipline this course spent two entire lessons establishing.'
  ],
  interview: [
    {
      q: 'You are asked in an interview to design a deployment pipeline for a containerized web application from scratch. Walk through your design, citing the specific concerns at each layer.',
      a: 'I would build up in layers, in the order this course taught them: first, a multi-stage Dockerfile with dependency-install ordered before source copy for cache efficiency, built FROM an appropriately minimal base, with any build secrets handled via BuildKit mounts rather than baked into layers. Second, for local development, a docker-compose.yml letting the app reach its dependencies (a database, say) by service name over Compose\'s automatic network, with persisted data in a named volume. Third, for production, Kubernetes manifests: a Deployment referencing a ConfigMap and Secret for configuration (never hardcoded), a PersistentVolumeClaim for any genuinely persistent data, and both liveness and readiness probes configured against real application-level health checks, with a RollingUpdate strategy tuned to the service\'s actual availability requirements. Fourth, a GitHub Actions pipeline: build+test on every PR for fast feedback, and on merge to main, the full sequence — build, tag with the commit SHA, test, push, authenticate to the cluster with narrowly-scoped credentials, update the Deployment, and explicitly verify the rollout with kubectl rollout status before reporting success, with an automatic rollback on failure. Each layer\'s design decisions are specifically informed by what the layer below it already guarantees, and what the layer above it will need.'
    },
    {
      q: 'A colleague says this course\'s recurring "decouple the reference from the specific resource" pattern (named volumes, service names, label selectors, PVC binding) is "just Kubernetes being needlessly abstract." How would you respond?',
      a: 'I would push back on "needlessly" specifically: every instance of this pattern exists to solve a genuinely real problem that surfaces the moment something on the other end of a hardcoded reference gets replaced — which, across this entire system, happens ROUTINELY, not exceptionally. A container is replaced on every deploy; a Pod is replaced on every crash recovery or reschedule; a node can fail; a secret gets rotated. A system built entirely on hardcoded specific identities (a fixed IP, a fixed disk path, a fixed container name) would need MANUAL reconfiguration every single time any of those routine events happened — the indirection is not abstraction for its own sake, it is precisely what makes "replace this specific thing without anything else needing to change" possible at all, which is the actual operational requirement underlying nearly everything Kubernetes is designed to do reliably and automatically.'
    },
    {
      q: 'Looking back across this entire course, what is the single biggest mental-model shift from "how you operate Docker containers by hand" to "how you operate a real Kubernetes-based CI/CD pipeline," and why does it matter practically?',
      a: 'The shift from IMPERATIVE ("run this exact command, right now") to DECLARATIVE-and-CONTINUOUSLY-RECONCILED ("this is the state I want to exist, permanently, and I trust an autonomous system to keep maintaining it") — first introduced conceptually in why-kubernetes, and then reinforced at every subsequent layer: a Deployment continuously maintains a replica count; a Service continuously maintains correct routing; a CI/CD pipeline, triggered automatically by a git push, continuously maintains "what is deployed matches what was most recently merged," with no human manually running the equivalent commands by hand each time. Practically, this matters because it changes what "operating" the system actually means day to day: instead of reactively noticing problems and manually issuing the next corrective command, the operator\'s job becomes accurately declaring intent (correct manifests, correct pipeline configuration) and trusting — while still verifying, per the rollout-status discipline — that the reconciliation loops underneath will faithfully maintain that intent, indefinitely, without needing to be told again.'
    },
    {
      q: 'What would you say is genuinely NOT covered by this course, and how would you describe the honest gap between "completed this course" and "ready to run a real production system unsupervised"?',
      a: 'This course deliberately stayed lean, per its own stated philosophy — genuinely absent or only lightly touched: real observability beyond kubectl (proper metrics/logging/tracing infrastructure), multi-environment promotion workflows beyond a single staging/production split, GitOps as an alternative pipeline architecture (mentioned only in a deepDive), advanced deployment strategies like blue-green and canary (also only in a deepDive), genuine secrets-management rigor (etcd encryption-at-rest, external secrets managers) beyond the base Kubernetes Secret mechanism, and essentially all of network policy, RBAC design, and cluster-level security hardening. The honest framing: this course builds real, working competence with the CORE mechanics — you could genuinely dockerize, deploy, and automate a small real application after this — but a team running a large-scale, high-stakes production system would layer considerably more operational rigor on top of this exact foundation, not replace it; everything this course taught remains the correct starting mental model even at that larger scale.'
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: 'The essentials trace the full pipeline and name the recurring pattern. This is what is underneath: a rough resource/capacity sanity check for actually sizing a small real deployment, and the honest maintenance loop a shipped system enters after this course ends.',
    sections: [
      {
        h: 'A rough capacity sanity check, back-of-envelope',
        p: [
          'Before deploying for real, a rough sanity check is worth doing by hand: if a service needs to handle, say, 50 requests/second, and each request takes roughly 100ms to handle, one replica can handle roughly 10 requests/second sequentially (1000ms / 100ms) — meaning at LEAST 5 replicas are needed just to keep up with average load, before accounting for any safety margin, traffic spikes, or the temporary capacity dip during a rolling update itself (which is exactly why maxUnavailable/maxSurge, from the rolling-updates lesson, matter concretely here — a maxUnavailable of 1 out of 5 replicas during a rollout means genuinely only 80% capacity for that brief window, worth confirming is actually acceptable for the specific service in question). This kind of rough, honest arithmetic — not a precise science, but a genuinely useful gut check — is worth doing explicitly rather than picking a replica count arbitrarily, since "3, because that felt like a reasonable number" is a surprisingly common, surprisingly risky real-world default.'
        ]
      },
      {
        h: 'The maintenance loop a shipped system actually enters',
        p: [
          'This course ends at "the pipeline works and the app is live" — but a real system does not stop there; it enters an ongoing loop this course only implicitly prepared for: dependency updates (base images, application dependencies) need periodic attention, since a Dockerfile\'s FROM line pinned to a specific base image version will not automatically pick up security patches without someone deliberately updating and re-testing it; Kubernetes itself receives regular version updates, and manifests occasionally need adjustment for deprecated API versions; and the kubectl-and-troubleshooting lesson\'s debugging skills are precisely what get exercised, repeatedly, for as long as the system runs, since "it worked at deploy time" is never a permanent guarantee against later issues (a downstream dependency\'s outage, a resource leak surfacing only after days of uptime, load patterns shifting over time). The genuinely honest picture: shipping is not the finish line this course\'s structure might make it feel like — it is the point where the operational skills this course built (reading Events, checking logs, understanding what a Service/Deployment/probe actually guarantees) start mattering on an ONGOING basis, not just once.'
        ]
      }
    ]
  }
};
