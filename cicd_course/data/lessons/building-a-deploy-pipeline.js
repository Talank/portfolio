window.LESSONS = window.LESSONS || {};
window.LESSONS['building-a-deploy-pipeline'] = {
  id: 'building-a-deploy-pipeline',
  title: 'Build, Push, Deploy: Wiring a Pipeline From Commit to Cluster',
  category: 'Part 6 — CI/CD Pipelines',
  timeMin: 45,
  summary: 'The previous lesson\'s workflow ended with a bare `kubectl set image` command and an honest gap: how does a CI runner even get credentials to talk to a real cluster, and how does a commit-SHA-tagged image (image-registries lesson) actually connect to a Kubernetes manifest (deployments-and-services lesson) that has to reference SOME specific tag? This lesson closes both gaps for real, wiring every piece from Parts 1-6 into one complete, working pipeline — the direct rehearsal for the course\'s actual capstone.',
  goals: [
    'Explain how a CI runner authenticates to a real Kubernetes cluster to run kubectl commands',
    'Explain precisely how a pipeline connects a freshly-built image tag to a Kubernetes Deployment manifest',
    'Distinguish `kubectl apply -f` (declarative, full-manifest) from `kubectl set image` (imperative, single-field update) and know when each is appropriate in a pipeline',
    'Trace one complete commit through every pipeline stage, naming which earlier lesson\'s concept each stage relies on',
    'Explain why a pipeline should verify a deploy actually succeeded, not just that the kubectl command itself returned successfully'
  ],
  concept: [
    {
      h: 'Cluster authentication: how a CI runner gets kubectl access at all',
      p: [
        'A GitHub Actions runner starts as a generic, credential-less virtual machine — it has no built-in access to any specific Kubernetes cluster, and giving it that access is a genuinely deliberate configuration step, not something that happens automatically just because `kubectl` commands appear in a workflow. The standard approach: a cluster\'s connection details and credentials (a "kubeconfig" file, or, on a cloud provider\'s managed Kubernetes, provider-specific short-lived credentials) are stored as a GitHub secret (exactly the previous lesson\'s `${{ secrets.* }}` mechanism), and an early pipeline step writes that secret\'s content to a config file kubectl reads, or uses a cloud-provider-specific GitHub Action (e.g., one that authenticates to AWS/GCP/Azure\'s managed Kubernetes offering using short-lived, scoped credentials) to establish access just for that one run.',
        'This is a genuinely security-sensitive step worth being deliberate about: whatever credential grants the pipeline `kubectl` access to a PRODUCTION cluster should be scoped as narrowly as the actual deployment task requires (permission to update Deployments in one specific namespace, for instance, not full cluster-admin) — exactly the environment-config-and-secrets lesson\'s "supply what is needed, nothing more" principle, now applied to cluster credentials specifically rather than application secrets.'
      ]
    },
    {
      h: 'Connecting a freshly-built tag to a Deployment: two real approaches',
      p: [
        'The previous lesson\'s `kubectl set image deployment/my-app my-app=<image>:<tag>` is the simplest, most direct approach: it IMPERATIVELY patches just the image field of an ALREADY-EXISTING Deployment object, leaving everything else about that Deployment (replica count, resource limits, labels) completely untouched — genuinely fine for the common case where only the image itself is actually changing on a routine deploy, and it requires no YAML file manipulation in the pipeline at all.',
        'The alternative, more thorough approach: keep the full Deployment manifest as a YAML file in the repository itself, have the pipeline substitute the freshly-built tag into that file (commonly via a template placeholder and a text-substitution step, or a small templating tool), and run `kubectl apply -f deployment.yaml` — DECLARATIVELY submitting the ENTIRE desired state, not just one field. This second approach is more work to wire up, but it means the manifest FILE itself, in the repository, always reflects exactly what should currently be running (genuinely useful for infrastructure-as-code discipline, and for anyone reading the repository to understand current deployed state without needing to separately check the cluster) — `kubectl set image` alone leaves the repository\'s own YAML file silently out of sync with whatever tag is actually running after the first automated deploy.'
      ]
    },
    {
      h: 'Tracing one commit through the entire pipeline, naming every prior lesson it touches',
      p: [
        'A developer pushes a commit to main. GitHub Actions\' `on: push: branches: [main]` trigger (github-actions-fundamentals lesson) starts the workflow. `actions/checkout@v4` retrieves that exact commit\'s code. `docker build`, using a correctly-ORDERED Dockerfile (dockerfile-best-practices lesson) for fast, cached builds, produces an image — tagged with `${{ github.sha }}` (image-registries lesson\'s "never rely on :latest" principle, automated). The test stage runs against that build, hard-gating everything after it on success (ci-cd-concepts lesson). On success, the image is pushed to a registry (image-registries lesson, again — this is the step that actually makes the image PULLABLE by anything else, including a cluster).',
        'The pipeline then authenticates to the cluster (this lesson\'s first section) and updates the Deployment — via `set image` or `apply`, per this lesson\'s second section — referencing the EXACT SAME `${{ github.sha }}` tag that was just pushed, never a different one. The Deployment\'s own reconciliation loop (why-kubernetes, deployments-and-services lessons) then handles the actual rollout: creating new Pods with the new image, and — this course\'s very next lesson\'s subject — gradually replacing old Pods with new ones while a Service (deployments-and-services lesson) keeps routing traffic correctly to whichever Pods are currently healthy throughout the transition, with zero manual intervention from this point forward.'
      ]
    },
    {
      h: 'Verifying the deploy actually worked, not just that the command returned',
      p: [
        '`kubectl set image` or `kubectl apply` returning successfully only confirms the API server ACCEPTED the new desired state — it says nothing about whether the actual rollout subsequently SUCCEEDED, since the real work (scheduling new Pods, waiting for them to become healthy) happens asynchronously, after that command already returned. A pipeline that treats "the kubectl command exited 0" as "the deploy succeeded" can report a successful deploy even when the new Pods are actually stuck in CrashLoopBackOff or ImagePullBackOff moments later — exactly the kubectl-and-troubleshooting lesson\'s failure states, now potentially happening silently, unnoticed, in an automated pipeline with nobody watching.',
        'The correct fix: `kubectl rollout status deployment/my-app --timeout=120s` (or equivalent) as an explicit, additional pipeline step AFTER the update — this command actively WAITS and blocks until the rollout genuinely completes (all new Pods healthy and ready) or the specified timeout is reached, and returns a non-zero exit code on failure or timeout, correctly failing the PIPELINE ITSELF, not just silently leaving a broken deployment running unnoticed in production. This one addition is what turns "we told Kubernetes what we wanted" into "we confirmed Kubernetes actually achieved it" — a genuinely important distinction for a pipeline that is meant to be trusted to run unattended.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Full Relay, From Galley-La\'s Yard to the Sunny Actually Sailing',
      text: 'Getting a newly repaired part from Galley-La\'s dock onto the Sunny and genuinely working is not one single action — it is a full relay, and the crew learned the hard way that skipping the LAST link makes every earlier one pointless. Franky finishes the repair (the build). It gets loaded onto a transport skiff and physically delivered to the Sunny\'s dock (the push, to somewhere the ship can actually receive it). It gets installed into the ship\'s systems (the deploy). And — the step a rushed early attempt once skipped — someone actually confirms the repaired part WORKS correctly under real load, not just that the installation itself went smoothly. On that earlier rushed occasion, the installation step reported "done" and everyone moved on, only to discover mid-voyage that the part had been installed correctly but was subtly malfunctioning under real strain — something a genuine post-install TEST would have caught immediately, rather than everyone trusting "the installation step said it was done" as equivalent to "it is genuinely working."'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Full Relay, From Monica\'s Kitchen to the Table Actually Being Served',
      text: 'Getting a finished dish from Monica\'s kitchen to a genuinely satisfied customer at the table is not one single action either, and the restaurant learned this the hard way once too. The dish is finished (the build). It is physically carried out to the dining room (the push, to somewhere it can actually be delivered from). It is set down at the correct table (the deploy). And — the step a rushed new server once skipped — someone actually confirms the CUSTOMER received the right dish and it matches what they wanted, not just that a plate was physically set down somewhere in the dining room. On that earlier occasion, the server reported the delivery as "done" the instant the plate touched the table and immediately moved to the next table, only for Monica to discover ten minutes later that it had been set down at entirely the WRONG table — something a genuine, deliberate confirmation step would have caught in seconds, rather than treating "a plate got carried out and set down somewhere" as equivalent to "the actual job is genuinely complete."'
    },
    why: 'Both relays — Galley-La\'s part reaching the Sunny, Monica\'s dish reaching the customer — have the same four real links: build, push (physically deliver), deploy (install/place), and VERIFY (confirm it actually, genuinely worked, not just that the delivery step itself completed). Both stories\' rushed mistake — trusting "the delivery step said done" as equivalent to "the actual outcome is correct" — is exactly why a pipeline needs `kubectl rollout status` as an explicit verification step, rather than treating a successful `kubectl apply` command alone as proof the deploy genuinely succeeded.'
  },
  tech: [
    {
      q: 'Why should a CI pipeline\'s cluster credentials be scoped as narrowly as possible, rather than simply using full cluster-admin access for convenience?',
      a: 'A CI pipeline\'s credentials effectively become an automated actor with SOME level of access to a real, running production system — and that credential is stored in a place (GitHub secrets, on a system with its own attack surface: compromised dependencies in the workflow, a misconfigured workflow accidentally exposing it, a compromised contributor account) genuinely different from, and often less tightly controlled than, however human operators normally authenticate to the cluster. Scoping the credential narrowly (permission to update Deployments in one specific namespace, nothing broader) follows the same least-privilege principle this course has applied repeatedly — exactly like a container should not run as root unnecessarily, and exactly like the docker group\'s root-equivalent risk was flagged in the installing-docker lesson — limiting the BLAST RADIUS if that specific credential were ever compromised, rather than granting broad access purely for pipeline-configuration convenience.'
    },
    {
      q: 'Concretely, why does `kubectl set image` leave a repository\'s own Deployment YAML file "silently out of sync," and why does that matter?',
      a: '`kubectl set image` patches the LIVE, running Deployment object directly, in the cluster\'s own stored state — it does not touch, read, or write anything in the git repository at all. If the repository ALSO contains a Deployment YAML file (common, for infrastructure-as-code purposes) with an image tag hardcoded or left at some earlier value, that file now silently disagrees with what is ACTUALLY running in the cluster, since the running state was updated directly while the file was not. This matters because anyone later reading that YAML file to understand "what should be running" would get a wrong, stale answer — and if that stale file were ever reapplied for an unrelated reason (a routine `kubectl apply -f` to update some OTHER field), it would silently roll the image tag back to the stale value, an easy-to-miss, genuinely confusing regression.'
    },
    {
      q: 'Why does `kubectl rollout status` block and wait, rather than simply checking the Deployment\'s state once and returning immediately?',
      a: 'A rollout is inherently an ASYNCHRONOUS process — updating a Deployment\'s desired image is accepted instantly by the API server, but the actual work (scheduling new Pods, waiting for their readiness probes to pass, gradually replacing old Pods) genuinely takes real time to complete, and checking the Deployment\'s state at any single instant immediately after the update would very likely catch it mid-transition, neither cleanly "old" nor "new," which would be an unreliable, misleading signal either way. `kubectl rollout status` is specifically designed to poll and WAIT until the rollout reaches a genuinely stable, complete, successful state (or explicitly fails/times out) — giving the pipeline a reliable, meaningful pass/fail signal that corresponds to "the rollout actually finished successfully," rather than an arbitrary snapshot of a still-in-progress transition.'
    }
  ],
  code: {
    title: 'The complete pipeline, from the previous lesson, now with authentication and verification',
    intro: 'This extends the github-actions-fundamentals lesson\'s workflow with the two pieces this lesson adds: real cluster auth, and a verified rollout.',
    code: `# .github/workflows/deploy.yml (excerpt — build/test/push steps omitted, unchanged from before)

      - name: Configure cluster access
        if: github.event_name == 'push'
        run: |
          mkdir -p ~/.kube
          echo "\${{ secrets.KUBE_CONFIG }}" | base64 -d > ~/.kube/config
          # ^ KUBE_CONFIG secret holds a base64-encoded kubeconfig,
          #   scoped to only what this pipeline actually needs

      - name: Deploy new image
        if: github.event_name == 'push'
        run: |
          kubectl set image deployment/my-app \\
            my-app=myregistry.example.com/myteam/my-app:\${{ github.sha }} \\
            --namespace production

      - name: Verify rollout actually succeeded
        if: github.event_name == 'push'
        run: |
          kubectl rollout status deployment/my-app \\
            --namespace production \\
            --timeout=120s
          # ^ BLOCKS until every new Pod is genuinely healthy, or fails
          #   the whole pipeline after 120s if it never gets there —
          #   this is what makes "the pipeline passed" mean something real`,
    notes: [
      'Without the final "Verify rollout" step, this pipeline would report success the instant kubectl set image returned — even if the new Pods immediately entered CrashLoopBackOff moments later.',
      '--namespace production makes the target environment explicit rather than implicit — a genuinely important habit once multiple environments (staging, production) are in play.'
    ]
  },
  lab: {
    title: 'Trace a commit through the pipeline and identify the missing verification',
    prompt: 'This pipeline excerpt is missing the rollout-verification step this lesson covers. Add it after the deploy step, using --namespace staging and a 90s timeout, and write one sentence explaining what specific failure mode this step would catch that the deploy step alone would miss.',
    starter: `      - name: Deploy new image
        if: github.event_name == 'push'
        run: |
          kubectl set image deployment/my-app \\
            my-app=myregistry.example.com/myteam/my-app:\${{ github.sha }} \\
            --namespace staging

      # Your added verification step:


      # What failure mode would this catch that "kubectl set image" succeeding alone would miss?

`,
    checks: [
      { re: 'kubectl\\s+rollout\\s+status\\s+deployment/my-app', flags: 'i', must: true, hint: 'kubectl rollout status deployment/my-app', pass: 'rollout status command ✓' },
      { re: '--namespace\\s+staging', flags: 'i', must: true, hint: '--namespace staging (matching the deploy step above)', pass: '--namespace staging ✓' },
      { re: '--timeout=90s', flags: 'i', must: true, hint: '--timeout=90s', pass: '--timeout=90s ✓' },
      { re: 'crashloop|imagepull|unhealthy|fail(ed|ing)?\\s+to\\s+become\\s+ready|not\\s+(actually\\s+)?ready', flags: 'i', must: true, hint: 'Explain that this catches a rollout where the API accepted the change but the new Pods never actually became healthy (e.g. CrashLoopBackOff).', pass: 'explanation present ✓' }
    ],
    run: 'No real cluster needed to check the YAML — but if you have kind/minikube available, try deliberately deploying a broken image tag and watch kubectl rollout status correctly fail and time out.',
    solution: `      - name: Deploy new image
        if: github.event_name == 'push'
        run: |
          kubectl set image deployment/my-app \\
            my-app=myregistry.example.com/myteam/my-app:\${{ github.sha }} \\
            --namespace staging

      - name: Verify rollout actually succeeded
        if: github.event_name == 'push'
        run: |
          kubectl rollout status deployment/my-app \\
            --namespace staging \\
            --timeout=90s

      # What failure mode would this catch that "kubectl set image" succeeding alone would miss?
      # kubectl set image only confirms the API server ACCEPTED the new desired state -
      # it says nothing about whether the new Pods actually became healthy afterward.
      # Without rollout status, a new image stuck in CrashLoopBackOff or ImagePullBackOff
      # would leave the pipeline reporting "success" while production silently serves
      # broken or zero healthy replicas.`,
    notes: [
      'This exact pattern (deploy, then explicitly verify) is worth applying to EVERY automated deploy step this course covers from here on, including the upcoming capstone.',
      'A pipeline that "passes" without genuinely verifying the outcome is arguably worse than no automation at all — it creates false confidence that something worked when it may not have.'
    ]
  },
  quiz: [
    {
      q: 'Why does a GitHub Actions runner need an explicit configuration step before it can run kubectl against a real cluster?',
      options: ['kubectl works automatically on any runner with no configuration', 'A runner starts as a generic, credential-less machine with no built-in access to any specific cluster — credentials must be explicitly supplied, typically via a GitHub secret', 'Kubernetes clusters do not support automated access at all', 'Only GitHub-owned clusters can be accessed from Actions'],
      correct: 1,
      explain: 'Runners are generic, disposable machines with no pre-existing cluster access — authentication must be deliberately configured, usually via a secret holding cluster credentials.'
    },
    {
      q: 'What is the key difference between `kubectl set image` and `kubectl apply -f deployment.yaml` for updating a running Deployment?',
      options: ['They are functionally identical in every way', 'set image imperatively patches just the image field of an existing Deployment; apply -f declaratively submits the entire manifest\'s desired state, keeping the repository\'s YAML file in sync', 'apply -f only works for creating new objects, never updating them', 'set image is always the safer choice'],
      correct: 1,
      explain: 'set image is a targeted, single-field patch; apply -f submits the full desired state from a file, which also keeps that file an accurate record of what should be running.'
    },
    {
      q: 'Why can `kubectl set image` returning successfully NOT be trusted as proof the deploy actually succeeded?',
      options: ['kubectl set image never actually returns successfully', 'It only confirms the API server accepted the new desired state — the actual rollout (new Pods becoming healthy) happens asynchronously afterward and could still fail', 'Deploys never fail once accepted by the API server', 'kubectl set image automatically verifies health as part of the same command'],
      correct: 1,
      explain: 'Accepting a desired state and successfully achieving it are two different things — kubectl rollout status is needed to confirm the latter.'
    },
    {
      q: 'What does `kubectl rollout status --timeout=120s` actually do?',
      options: ['It immediately returns the current state without waiting', 'It blocks and waits for up to 120 seconds for the rollout to reach a genuinely healthy, complete state, failing if it does not', 'It deletes the deployment after 120 seconds', 'It only works for rollbacks, not forward deploys'],
      correct: 1,
      explain: 'rollout status polls and waits for the rollout to genuinely complete (or fail/time out), giving a reliable, meaningful pass/fail signal for the pipeline.'
    },
    {
      q: 'Why should a CI pipeline\'s cluster credentials be scoped as narrowly as the deployment task requires, rather than using broad cluster-admin access?',
      options: ['Narrow scoping has no real security benefit', 'It limits the blast radius if that specific credential is ever compromised, following the same least-privilege principle applied elsewhere in this course', 'Kubernetes requires all CI credentials to be cluster-admin by default', 'Narrow scoping makes the pipeline run faster'],
      correct: 1,
      explain: 'A pipeline\'s credentials are an automated actor with real cluster access — scoping them narrowly limits potential damage if that credential were ever compromised.'
    }
  ],
  pitfalls: [
    'Using cluster-admin credentials for a CI pipeline purely for configuration convenience, rather than scoping access to exactly what the deploy task needs.',
    'Relying on `kubectl set image` alone in a repository that also keeps a Deployment YAML file, without updating that file too — leaving it silently out of sync with what is actually running.',
    'Treating a successful `kubectl apply`/`kubectl set image` command as proof the deploy worked, without an explicit `kubectl rollout status` step actually verifying the new Pods became healthy.'
  ],
  interview: [
    {
      q: 'Walk through, end to end, everything that happens from a developer\'s git push to that change being verified as live in production, naming the Kubernetes/Docker concept each stage relies on.',
      a: 'A push to main triggers the workflow (github-actions-fundamentals). checkout retrieves the exact commit. docker build, exploiting correct Dockerfile layer ordering (dockerfile-best-practices), produces an image tagged with the commit SHA (image-registries lesson\'s specific-tag principle). Tests run against that build, hard-gating everything after on success (ci-cd-concepts). The image is pushed to a registry, making it pullable (image-registries, again). The pipeline authenticates to the cluster using narrowly-scoped credentials (this lesson). The Deployment is updated to reference the new tag, either via set image or apply (this lesson), triggering the Deployment controller\'s reconciliation loop (why-kubernetes, deployments-and-services) to gradually create new Pods and retire old ones, with the Service continuing to route only to currently-healthy Pods throughout (deployments-and-services). Finally, kubectl rollout status explicitly verifies the new Pods actually became healthy, turning "we told Kubernetes what we wanted" into "we confirmed it actually happened" (this lesson\'s closing point) — only after that verification passes does the pipeline itself report success.'
    },
    {
      q: 'A pipeline reports every deploy as successful, but the on-call team keeps discovering broken deploys manually, sometimes hours later. What is the most likely gap in the pipeline, and how would you fix it?',
      a: 'The most likely gap is exactly this lesson\'s core point: the pipeline is almost certainly treating a successful `kubectl set image` or `kubectl apply` command as proof of a successful deploy, without an explicit verification step actually confirming the resulting rollout reached a genuinely healthy state. Since the API server accepting a new desired state and that state actually being achieved are two different things happening asynchronously, a pipeline lacking `kubectl rollout status` (or an equivalent explicit health check) would report "success" the instant the update command returns, even if the new Pods subsequently fail to become healthy — exactly matching the described symptom of deploys silently breaking, discovered only much later by someone manually checking. The fix is adding an explicit, blocking rollout-status check (or equivalent smoke test against the newly deployed version) as a required pipeline step, with a failure there correctly failing the whole pipeline and alerting immediately, rather than hours later via manual discovery.'
    },
    {
      q: 'Why might a team deliberately choose the more complex "keep the Deployment YAML in the repo, template in the new tag, kubectl apply -f" approach over the simpler `kubectl set image`, despite the extra pipeline complexity?',
      a: 'The core benefit is that the repository\'s own YAML file remains an accurate, version-controlled record of exactly what SHOULD be running at any point in history — genuinely valuable for infrastructure-as-code discipline: anyone can read the manifest at any past commit to know precisely what was deployed at that point, code review can catch a problematic manifest CHANGE (not just an image tag change) before it deploys, and the full Deployment spec (not just the image field) stays under the same change-tracking and review process as application code itself. `kubectl set image` alone updates only the live cluster state, leaving the repository\'s manifest to drift out of sync — acceptable for a team that only ever changes the image tag and never touches other Deployment fields through this pipeline, but a real limitation for a team wanting genuine infrastructure-as-code guarantees across the FULL manifest, not just the image field specifically.'
    },
    {
      q: 'How would you extend this lesson\'s pipeline to support deploying to both a staging and a production environment, using concepts already established in this course?',
      a: 'I would use two separate triggers (or trigger conditions) mapped to two separate target environments, directly following the ci-cd-concepts lesson\'s trigger-design guidance: merges to a "staging" branch (or a manual workflow_dispatch trigger) deploy to a staging namespace/cluster, using --namespace staging (or an entirely separate staging cluster\'s credentials, stored as a separate GitHub secret), while merges to "main" specifically deploy to --namespace production using separate, production-scoped credentials. Both paths would use the identical build-test-push sequence (the SAME image, same tag, genuinely tested once) and both would include the rollout-status verification step — the only things that should genuinely differ between the two paths are the target namespace/cluster and its specific credentials, keeping "build once, deploy the identical, already-tested artifact to multiple environments" intact rather than rebuilding separately per environment, which would undermine the guarantee that what was tested is exactly what gets deployed.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover wiring authentication, image-tag connection, and verification into one working pipeline. This is what is underneath: automatic rollback on a failed rollout, environment-specific manifest management with Kustomize, and the GitOps alternative to a pipeline directly running kubectl at all.',
    sections: [
      {
        h: 'Automatic rollback: reacting to a failed rollout-status check, not just reporting it',
        p: [
          'This lesson\'s pipeline fails the WORKFLOW when `kubectl rollout status` times out or fails — a genuinely important signal, but by itself it leaves the CLUSTER in a partially-updated, unhealthy state, with a human needing to notice the pipeline failure and manually intervene. A more complete pipeline adds an explicit rollback step, conditioned on the rollout-status step\'s failure (`if: failure()` in GitHub Actions syntax): `kubectl rollout undo deployment/my-app --namespace production`, which reverts the Deployment to its PREVIOUS ReplicaSet (recall the deployments-and-services deepDive\'s explanation of how a Deployment keeps the prior ReplicaSet scaled to zero specifically to make this fast) — automatically returning the cluster to its last-known-good state within seconds of detecting a failed rollout, rather than leaving a broken deploy live until a human notices and reacts.'
        ]
      },
      {
        h: 'Kustomize: managing per-environment manifest differences without full duplication',
        p: [
          'Maintaining entirely separate, hand-copied Deployment YAML files per environment (dev/staging/production) risks the same near-duplicate-file drift problem the docker-compose-essentials deepDive\'s multiple-Compose-files section addressed at the Compose layer. Kustomize (built directly into kubectl via `kubectl apply -k`) addresses this at the Kubernetes layer: a BASE set of manifests captures what is common across all environments, and per-environment "overlay" directories declare only the specific DIFFERENCES (a different replica count, a different image tag, an added environment variable) — `kubectl apply -k overlays/production` applies the base manifests with that overlay\'s specific patches merged in, avoiding hand-copied, drifting duplicates while still letting each environment genuinely differ where it needs to.'
        ]
      },
      {
        h: 'GitOps: a fundamentally different way to connect a pipeline to a cluster',
        p: [
          'This lesson\'s entire approach has the CI PIPELINE directly running `kubectl` commands against the cluster — meaning the pipeline itself needs cluster credentials, and the cluster\'s actual current state can, in principle, drift from whatever is recorded in the git repository if anyone ever runs kubectl manually outside the pipeline. GitOps inverts this relationship: instead of a pipeline PUSHING changes to the cluster, an agent running INSIDE the cluster itself (commonly Argo CD or Flux) continuously WATCHES a git repository and automatically reconciles the cluster\'s actual state to match whatever manifests are currently committed there — the CI pipeline\'s job shrinks to just building, testing, and pushing an image, then updating the manifest\'s image tag IN THE GIT REPOSITORY (a plain commit, not a kubectl command), and the in-cluster GitOps agent picks up that commit and applies it. This has a genuine security benefit (no CI pipeline ever needs direct cluster-write credentials, since the agent living IN the cluster is the only thing that ever actually applies changes) and makes git itself the sole, unambiguous source of truth for cluster state — a meaningfully different architecture from this lesson\'s pipeline-pushes-directly model, worth knowing exists even though this course\'s capstone uses the simpler, more directly-taught approach.'
        ]
      }
    ]
  }
};
