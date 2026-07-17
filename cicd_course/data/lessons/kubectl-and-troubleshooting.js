window.LESSONS = window.LESSONS || {};
window.LESSONS['kubectl-and-troubleshooting'] = {
  id: 'kubectl-and-troubleshooting',
  title: 'kubectl & Troubleshooting: describe, logs, exec & the Debugging Loop',
  category: 'Part 5 — Kubernetes in Practice',
  timeMin: 40,
  summary: 'Parts 4-5 have introduced Pods, Deployments, Services, ConfigMaps/Secrets, and PersistentVolumeClaims — this lesson is the capstone of "Kubernetes in Practice": the actual day-to-day debugging toolkit for when any of those objects are not behaving as expected. Exactly like the Docker CLI-essentials lesson gave a specific command for each specific question ("is it running," "what did it say," "let me look inside"), this lesson gives the Kubernetes equivalents — plus the genuinely new layer Kubernetes adds on top: is the object SCHEDULED at all, and does its declared state even match what you think you applied.',
  goals: [
    'Use kubectl get and kubectl describe to answer "what is this object\'s current state, and why"',
    'Use kubectl logs to read a Pod\'s output, including for a Pod with multiple containers',
    'Use kubectl exec to get an interactive shell inside a running Pod\'s container',
    'Diagnose the most common Pod failure states (Pending, CrashLoopBackOff, ImagePullBackOff) from their name alone',
    'Follow a structured debugging sequence from "something is wrong" to a specific, actionable diagnosis'
  ],
  concept: [
    {
      h: '`kubectl get` and `kubectl describe`: the first two stops, always',
      p: [
        '`kubectl get <resource> <name>` gives a compact, one-line-per-object summary — for a Pod, this includes the READY count (containers ready / total containers) and STATUS column, the fastest possible check for "is this even in a healthy-looking state at all." `kubectl describe <resource> <name>` goes considerably deeper: full details of the object\'s current spec AND status, plus — genuinely the most valuable part for debugging — an EVENTS section at the bottom, a chronological log of everything Kubernetes itself has observed and done regarding this specific object (scheduling decisions, image pull attempts, health check failures, restarts), often containing the exact, specific reason something is wrong in plain language.',
        'The practical habit worth building: `kubectl describe` BEFORE `kubectl logs`, when the failure looks like it might be happening BEFORE the container\'s own application code ever got to run (the Pod never reaching Running status, an image that failed to pull) — logs only capture what the container\'s own process actually printed, which is nothing at all if the container never successfully started in the first place; the Events section is where a scheduling or image-pull failure actually gets reported.'
      ]
    },
    {
      h: '`kubectl logs`: the same idea as Docker, one layer up',
      p: [
        '`kubectl logs <pod-name>` prints a Pod\'s (single) container\'s stdout/stderr — precisely the same underlying capture mechanism the Docker CLI-essentials lesson\'s `docker logs` relied on, since a kubelet is, underneath, managing the same kind of container runtime this course started with. `-f` follows live, exactly like `docker logs -f`; `--previous` is a genuinely important Kubernetes-specific addition, printing logs from the PREVIOUS instance of a container that has already restarted — crucial for diagnosing a crash, since by the time you notice a Pod has restarted, the CURRENT logs only show what happened AFTER the restart, and the actual crash reason lived in the now-replaced previous attempt\'s logs.',
        'For a Pod with MULTIPLE containers (the pods-and-the-api-server lesson\'s sidecar case), `kubectl logs <pod-name> -c <container-name>` is required to specify which container\'s logs you actually want — omitting `-c` on a multi-container Pod either defaults to a specific one or errors asking you to specify, depending on the kubectl version, and forgetting this flag is a common early confusion when debugging a Pod that genuinely has more than one container in it.'
      ]
    },
    {
      h: '`kubectl exec`: a shell inside a running Pod, one layer up from Docker',
      p: [
        '`kubectl exec -it <pod-name> -- sh` (or `bash`) gets an interactive shell inside a running Pod\'s container — mechanically the exact same `-it` (interactive + pseudo-TTY) combination the Docker CLI-essentials lesson covered, now routed through the kubelet on whichever node the Pod actually happens to be running on, rather than talking to a local Docker daemon directly. The `--` before the command is worth noting specifically: it separates kubectl\'s OWN flags from the command being executed inside the container, needed whenever that command might otherwise be ambiguously parsed as more kubectl flags.',
        'Exactly as with Docker, `kubectl exec` should be the LAST resort in the debugging sequence, not the first — `kubectl describe` and `kubectl logs` answer most questions faster, with less effort, and without needing the target container to even have a usable shell available at all (a genuinely minimal or distroless-based image, from the earlier dockerfile-best-practices lesson\'s deepDive, may have no shell inside it whatsoever, making `kubectl exec -it ... sh` simply fail regardless of how badly you want to look around).'
      ]
    },
    {
      h: 'Recognizing common failure states by name',
      p: [
        'A handful of Pod STATUS values recur constantly and are worth recognizing on sight: <b>Pending</b> means the Pod has been accepted by the API server but has not yet been SCHEDULED onto any node at all — commonly because no node currently has enough available CPU/memory capacity to satisfy the Pod\'s resource requests, or because a PersistentVolumeClaim it depends on has not yet been bound (`kubectl describe pod` Events section will name the specific reason). <b>ImagePullBackOff</b> (or the closely related `ErrImagePull`) means the node could not successfully pull the specified image — most commonly a typo in the image name/tag, a private registry credential issue, or the image genuinely not existing at that exact reference (recall the image-registries lesson\'s emphasis on specific, correct tags).',
        '<b>CrashLoopBackOff</b> means the container DID start, but its main process exited (crashed, or simply finished and exited when it was expected to run indefinitely), and Kubernetes is now repeatedly restarting it with an increasing backoff delay between attempts — this is exactly where `kubectl logs --previous` becomes essential, since the CURRENT container instance may not have run long enough to produce any useful output before crashing again, while the PREVIOUS instance\'s logs likely captured the actual error. Recognizing these three states by NAME alone, before even running a single debugging command, already substantially narrows down where the actual problem lives.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Chopper\'s Diagnostic Order: History First, Symptoms Second, Only Then the Scalpel',
      text: 'When a crew member turns up genuinely unwell, Chopper never reaches straight for the most invasive option first — his actual practiced sequence is disciplined and specific. First: check the RECORD — has this person been injured recently, exposed to anything unusual, is there a known recent event that already explains this? Second, if the record alone is not conclusive: examine visible SYMPTOMS directly — temperature, breathing, obvious external signs — genuinely informative, still not invasive. Only if BOTH of those fail to produce a clear answer does Chopper move to something more invasive — an actual physical examination requiring cutting into the problem directly. Usopp, panicking during one incident and immediately suggesting the most drastic intervention right away "just to be safe," gets firmly redirected by Chopper: jumping straight to the most invasive option, skipping the record and the visible symptoms, means potentially doing real additional harm chasing a problem the FIRST two steps might have identified in seconds, with zero additional risk.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Fault-Diagnosis Order: Check the History, Then the Symptoms, Only Then Open the Case',
      text: 'When Sheldon\'s computer setup misbehaves, his insistence on a strict diagnostic ORDER is, characteristically, non-negotiable. First: check the SYSTEM LOG — what actually happened recently, in the computer\'s own recorded history, right before the problem started; genuinely often sufficient on its own. Second, if the log alone does not explain it: observe visible SYMPTOMS directly — error messages on screen, unusual sounds, specific visible behavior; still non-invasive. Only if both of those genuinely fail does Sheldon allow moving to the most invasive step: actually opening the computer\'s case and physically inspecting components directly. Howard, once, impatient and reaching straight for a screwdriver to open the case first, "since that is obviously where the actual problem is," gets stopped cold by Sheldon, who is uncharacteristically right about the specific danger: skipping straight to physically opening things up, without first checking the log and the visible symptoms, risks introducing an entirely NEW problem (a loose connection, static damage) while chasing something the log alone might have explained instantly, with zero risk at all.'
    },
    why: 'Chopper\'s record-then-symptoms-then-scalpel and Sheldon\'s log-then-symptoms-then-open-the-case are both the exact debugging sequence this lesson teaches: `kubectl describe` (the record — Events, recent history) first, `kubectl logs` (visible symptoms — what the process actually said) second, and `kubectl exec` (opening things up directly) only as the last, most invasive resort. Jumping straight to the most invasive tool, skipping the earlier, faster, less risky checks, is exactly the mistake both stories\' impatient side character makes — and exactly the pitfall this lesson is warning against.'
  },
  tech: [
    {
      q: 'Why is `kubectl describe pod`\'s Events section often more useful than `kubectl logs` for a Pod stuck in Pending or ImagePullBackOff?',
      a: '`kubectl logs` only ever shows output the container\'s OWN PROCESS actually printed — and in both of these failure states, the container\'s process never actually started running at all (Pending means it was never even scheduled onto a node; ImagePullBackOff means the image itself never finished downloading, so there is no process yet to produce any output). The Events section, by contrast, is populated by KUBERNETES ITSELF — the scheduler, the kubelet, the image-pull mechanism — reporting on what THEY observed and attempted, which is exactly where a scheduling failure reason or an image-pull error message actually gets recorded, since that failure happened entirely at a layer BELOW where the container\'s own application code ever had a chance to run or log anything.'
    },
    {
      q: 'Why does `kubectl logs --previous` matter specifically for diagnosing a CrashLoopBackOff, when plain `kubectl logs` seems like it should show the same information?',
      a: 'Plain `kubectl logs <pod>` shows output from the CURRENTLY running (or most recently started) container instance — but in a CrashLoopBackOff, that current instance may have started only seconds ago (the latest restart attempt) and may not yet have produced the actual error output, especially if the crash happens very early in startup, before whatever caused it even gets logged. `--previous` specifically retrieves logs from the PRIOR container instance — the one that just crashed and triggered the current restart — which is exactly where the actual crash-causing error was most likely logged, immediately before that previous instance terminated. Checking both (current and --previous) gives the fullest picture: current for "is it still crashing the same way," previous for "what specifically caused the crash that led to this restart."'
    },
    {
      q: 'Why might `kubectl exec -it <pod> -- sh` simply fail with "OCI runtime exec failed" or similar, even though the Pod shows as Running?',
      a: 'A Pod showing "Running" only confirms its container\'s main process is actively executing — it says nothing about whether a SHELL BINARY (sh, bash) is even present inside that container\'s filesystem at all. A minimal or distroless-based image (the dockerfile-best-practices lesson\'s deepDive covered this tradeoff explicitly) may contain nothing but the application\'s own runtime and its direct dependencies, with no shell installed whatsoever — `kubectl exec` trying to run `sh` inside such a container fails not because of a Kubernetes problem, but simply because the requested executable genuinely does not exist inside that container\'s filesystem, which is precisely the debuggability tradeoff that deepDive section flagged as a real, deliberate cost of choosing a shell-less base image.'
    }
  ],
  code: {
    title: 'The structured debugging sequence, applied to a real CrashLoopBackOff',
    intro: 'describe first (the record), logs --previous second (the symptom), exec last (opening it up) — in that order, exactly as the story lessons this lesson taught.',
    code: `$ kubectl get pods
NAME                     READY   STATUS             RESTARTS   AGE
my-app-7d9f8c6b5d-2xk4p   0/1    CrashLoopBackOff   5          4m

$ kubectl describe pod my-app-7d9f8c6b5d-2xk4p
...
Events:
  Type     Reason     Age                  From     Message
  ----     ------     ----                 ----     -------
  Normal   Pulled     4m                   kubelet  Successfully pulled image
  Normal   Started    4m (x5 over 4m)      kubelet  Started container my-app
  Warning  BackOff    30s (x12 over 3m)    kubelet  Back-off restarting failed container
# ^ confirms: image pulled fine, container DOES start, but keeps exiting
#   and being restarted — points toward an application-level crash,
#   not a scheduling or image problem

$ kubectl logs my-app-7d9f8c6b5d-2xk4p
# ^ (empty, or just started — the CURRENT instance hasn't crashed yet)

$ kubectl logs my-app-7d9f8c6b5d-2xk4p --previous
Error: Cannot connect to database at db-svc:5432 - connection refused
    at Database.connect (/app/db.js:12)
# ^ THERE is the actual reason — found without ever needing kubectl exec

# Only if this were still unclear would exec be the next, last-resort step:
$ kubectl exec -it my-app-7d9f8c6b5d-2xk4p -- sh
# (in this case, unnecessary — the logs already gave a clear, actionable answer)`,
    notes: [
      'Notice how much was learned from describe + logs --previous alone, with zero invasive action taken — this is precisely the "cheapest, least invasive check first" discipline this lesson\'s stories illustrate.',
      'The actual fix here would be investigating why db-svc is not accepting connections — likely a separate issue in the database Deployment/Service, discoverable with the exact same describe-then-logs sequence applied to THAT Pod next.'
    ]
  },
  lab: {
    title: 'Diagnose three Pod failure states from their symptoms',
    prompt: 'For each described scenario, name the most likely STATUS value (Pending, ImagePullBackOff, or CrashLoopBackOff) and the ONE kubectl command you would run FIRST to confirm it.',
    starter: `# Scenario 1: kubectl get pods shows a Pod that has been stuck for 10 minutes
# with 0/1 READY, and the STATUS column itself already tells you the image
# tag was mistyped in the Deployment manifest.
# Likely status: ???
# First command: ???

# Scenario 2: A Pod's container starts, runs for about 8 seconds, then exits
# and is restarted, repeatedly, with RESTARTS climbing steadily.
# Likely status: ???
# First command: ???

# Scenario 3: A Pod has existed for 5 minutes but never shows a NODE assigned
# in "kubectl get pods -o wide", and the cluster is known to be near full
# capacity on every node.
# Likely status: ???
# First command: ???
`,
    checks: [
      { re: 'scenario\\s*1[\\s\\S]*ImagePullBackOff', flags: 'i', must: true, hint: 'Scenario 1 (mistyped image tag) -> ImagePullBackOff', pass: 'Scenario 1: ImagePullBackOff ✓' },
      { re: 'scenario\\s*2[\\s\\S]*CrashLoopBackOff', flags: 'i', must: true, hint: 'Scenario 2 (starts, exits, restarts repeatedly) -> CrashLoopBackOff', pass: 'Scenario 2: CrashLoopBackOff ✓' },
      { re: 'scenario\\s*3[\\s\\S]*Pending', flags: 'i', must: true, hint: 'Scenario 3 (never scheduled to a node, cluster near capacity) -> Pending', pass: 'Scenario 3: Pending ✓' },
      { re: 'kubectl\\s+describe\\s+pod', flags: 'i', must: true, hint: 'kubectl describe pod should be the first command for at least the ImagePullBackOff and Pending cases (Events section explains both).', pass: 'kubectl describe pod used ✓' },
      { re: 'kubectl\\s+logs.*--previous', flags: 'i', must: true, hint: 'For the CrashLoopBackOff scenario, kubectl logs --previous is the right first command to see what caused the crash.', pass: 'kubectl logs --previous used ✓' }
    ],
    run: 'Try it for real: intentionally deploy a Pod with a typo\'d image tag, and confirm kubectl describe pod names the exact reason in its Events section.',
    solution: `# Scenario 1: mistyped image tag
# Likely status: ImagePullBackOff
# First command: kubectl describe pod <name>   (Events section will show the exact pull error)

# Scenario 2: starts, runs ~8s, exits, restarts repeatedly
# Likely status: CrashLoopBackOff
# First command: kubectl logs <name> --previous   (see what the crashed instance actually printed)

# Scenario 3: never scheduled, cluster near capacity
# Likely status: Pending
# First command: kubectl describe pod <name>   (Events section will show the scheduling failure reason, e.g. insufficient CPU/memory)`,
    notes: [
      'Notice describe pod is the right FIRST command for two of the three scenarios — it is the most broadly useful single diagnostic step, exactly as this lesson\'s concept section emphasized.',
      'kubectl exec never appears as the right FIRST command for any of these three — consistent with it being the last-resort tool, not the default reach.'
    ]
  },
  quiz: [
    {
      q: 'Why is `kubectl describe pod`\'s Events section often the best first check for a Pod that never reaches Running status?',
      options: ['Events show the container\'s own printed output', 'Events are populated by Kubernetes itself (scheduler, kubelet) reporting what THEY observed, which is exactly where failures happening before the container\'s own code ever ran get recorded', 'Events only show information about successful Pods', 'Events require kubectl exec access to view'],
      correct: 1,
      explain: 'Events capture Kubernetes\'s own observations (scheduling, image pulls, health checks) — the right place to look when the container never got far enough to log anything itself.'
    },
    {
      q: 'What does `kubectl logs --previous` retrieve that plain `kubectl logs` does not?',
      options: ['Logs from a different, unrelated Pod', 'Logs from the PRIOR container instance that crashed and triggered the current restart, rather than only the current, possibly very-recently-started instance', 'Logs from before the cluster existed', 'It is identical to plain kubectl logs'],
      correct: 1,
      explain: '--previous is essential for CrashLoopBackOff diagnosis, since the actual crash reason often lived in the instance that just failed, not the brand-new current one.'
    },
    {
      q: 'What does the ImagePullBackOff status most commonly indicate?',
      options: ['The application crashed after starting successfully', 'The node could not successfully pull the specified image — often a typo\'d name/tag, a missing registry credential, or a nonexistent image reference', 'The Pod was never scheduled to any node', 'The Pod is running correctly but slowly'],
      correct: 1,
      explain: 'ImagePullBackOff specifically means the image pull itself failed — the container never even had a chance to start.'
    },
    {
      q: 'Why should kubectl exec generally be the LAST debugging step, not the first?',
      options: ['kubectl exec is always slower than other commands', 'kubectl describe and kubectl logs usually answer the question faster, with less effort, and without requiring the container to even have a usable shell available', 'kubectl exec requires special cluster-admin permissions no one has', 'It is actually fine to always use kubectl exec first'],
      correct: 1,
      explain: 'Less invasive checks (describe, logs) are faster and more broadly available — some containers (minimal/distroless images) have no shell for exec to even use.'
    },
    {
      q: 'A Pod is stuck in Pending status. What is a likely underlying cause worth checking via kubectl describe?',
      options: ['The application code has a bug', 'No node currently has enough available CPU/memory capacity to satisfy the Pod\'s resource requests, or a dependent PersistentVolumeClaim has not yet bound', 'The image tag is always the cause of Pending status', 'Pending always means the cluster itself is down'],
      correct: 1,
      explain: 'Pending means the Pod has not been scheduled onto any node yet — commonly a resource-capacity issue or an unbound dependency, both visible in the Events section.'
    }
  ],
  pitfalls: [
    'Reaching for kubectl exec before checking kubectl describe and kubectl logs — the less invasive checks usually answer the question faster and work even when a container has no shell to exec into.',
    'Checking only current kubectl logs on a CrashLoopBackOff Pod and concluding there is no error output — the actual crash reason is very often only in the previous instance\'s logs, retrieved with --previous.',
    'Forgetting the -c <container> flag on kubectl logs/exec for a multi-container Pod, and being confused when the output does not match the container you actually meant to inspect.'
  ],
  interview: [
    {
      q: 'Walk through the exact sequence of kubectl commands you would run to diagnose a Pod that is not serving traffic, and explain why that specific order.',
      a: 'First, `kubectl get pods` for the fastest possible status check — is it even Running, and how many restarts has it had. Second, `kubectl describe pod <name>`, specifically for its Events section, which surfaces scheduling issues, image-pull failures, and health-check failures — anything Kubernetes itself observed, often with the exact underlying reason stated in plain language, at essentially zero cost to check. Third, `kubectl logs <name>` (and `--previous` if it has restarted), to see what the application\'s own process actually reported, which is where a genuine application-level bug or a downstream-dependency failure (a database connection refused, for instance) would show up. Only if all of that remains inconclusive would I reach for `kubectl exec -it <name> -- sh` to manually inspect the container\'s live environment directly — the least efficient, most invasive option, reserved for when the faster, less invasive checks did not already produce an actionable answer.'
    },
    {
      q: 'Explain the difference between ImagePullBackOff and CrashLoopBackOff precisely, and why confusing the two would lead someone to investigate the wrong layer of the system.',
      a: 'ImagePullBackOff means the container image itself never successfully finished downloading onto the node — the failure happens entirely at the infrastructure/registry layer, before any application code has any chance to execute at all; the fix lives in checking the image reference (name/tag), registry credentials, or registry availability, never in the application\'s own code. CrashLoopBackOff means the image WAS pulled successfully and the container DID start, but the application\'s own process is exiting (crashing, or exiting when it should run indefinitely) — the failure happens at the application layer, and the fix lives in the application\'s own logic, its configuration, or a downstream dependency it depends on at startup, never in the image-pull mechanism itself. Someone investigating ImagePullBackOff by reading application logs, or investigating CrashLoopBackOff by re-checking registry credentials, is looking in entirely the wrong place — recognizing which of the two states is actually occurring, from its name alone, immediately points to the right layer to investigate.'
    },
    {
      q: 'A distroless-based production image makes kubectl exec -it <pod> -- sh fail outright. How would you debug an issue inside that container without a shell available at all?',
      a: 'The primary tools remain unaffected by the missing shell: `kubectl describe pod` and `kubectl logs` (including `--previous`) do not require executing anything INSIDE the container at all — they read Kubernetes\'s own observed events and the container\'s already-captured stdout/stderr output respectively, both fully available regardless of whether a shell exists inside the container\'s filesystem. If genuinely deeper, interactive inspection is needed, Kubernetes\'s "ephemeral containers" feature (a more advanced mechanism, attaching a SEPARATE, temporary debugging container — one WITH a shell and debugging tools — into the same Pod\'s namespaces, sharing its network and process view without modifying the original container at all) is the modern, purpose-built answer for exactly this scenario, letting genuine interactive debugging happen without ever needing the production image itself to carry unnecessary shell/debugging tooling that would undermine the security benefit distroless images are chosen for in the first place.'
    },
    {
      q: 'Why is understanding these specific Pod status values (Pending, ImagePullBackOff, CrashLoopBackOff) valuable beyond just recognizing them — what does each one tell you about WHERE in the system to focus your very first debugging step?',
      a: 'Each status name effectively pre-narrows the search space to a specific LAYER of the system before any actual investigation even begins: Pending points to the SCHEDULING layer (cluster capacity, PVC binding, node affinity/taint constraints) — worth checking `kubectl describe`\'s Events immediately, never application code. ImagePullBackOff points to the IMAGE/REGISTRY layer (naming, tagging, credentials, registry availability) — again, never application code, and never the running-process logs, since no process has started yet. CrashLoopBackOff points to the APPLICATION layer (the process\'s own logic, its configuration, or an immediate startup-time dependency) — here, `kubectl logs --previous` is exactly the right tool, and checking scheduling or image-pull details would be looking in the wrong place entirely. Recognizing the status by name is effectively a fast, free routing decision for where the very first, most useful debugging command should even be aimed.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover the core describe/logs/exec sequence and the three most common failure states. This is what is underneath: resource requests/limits as a frequent Pending cause, liveness vs. readiness probes as the actual mechanism behind restarts and traffic routing, and kubectl port-forward as a debugging tool distinct from a full Service.',
    sections: [
      {
        h: 'Resource requests and limits: a frequent, easy-to-miss Pending cause',
        p: [
          'A Pod can declare `resources.requests` (the minimum CPU/memory the scheduler guarantees it when deciding which node to place it on) and `resources.limits` (a hard ceiling the running container is not allowed to exceed, with memory limit violations resulting in the container being killed — an OOMKilled status, a close cousin of CrashLoopBackOff worth recognizing separately). A Pod stuck Pending is frequently explained by its `requests` simply being larger than any single node\'s currently AVAILABLE (not total — available, after accounting for everything else already scheduled there) capacity — `kubectl describe pod`\'s Events section names this explicitly ("Insufficient cpu" or similar), and the fix is either reducing the request to something realistic, or the cluster genuinely needing more capacity (more nodes, or larger nodes) — not a Kubernetes bug, but an honest resource-accounting mismatch.'
        ]
      },
      {
        h: 'Liveness vs. readiness probes: two distinct health checks, two distinct consequences',
        p: [
          'A <b>liveness probe</b> failing tells Kubernetes "this container is broken and should be RESTARTED" — repeated liveness failures are literally what triggers the restart-and-backoff behavior behind CrashLoopBackOff, even for a container that never explicitly crashed on its own (a hung, unresponsive-but-still-running process would eventually get killed and restarted via a failing liveness probe, not because the process itself exited). A <b>readiness probe</b> failing tells Kubernetes something meaningfully different — "this container should be REMOVED FROM SERVICE ROUTING temporarily, but do NOT restart it" — exactly the mechanism behind the deployments-and-services lesson\'s claim that a Service only routes to "ready" Pods; a Pod that is alive but not yet ready (still warming up, or a temporary downstream dependency outage) gets quietly excluded from traffic without being needlessly restarted over something that was never actually a crash.'
        ]
      },
      {
        h: '`kubectl port-forward`: a direct debugging tunnel, distinct from a Service',
        p: [
          '`kubectl port-forward pod/<name> 8080:80` opens a direct, temporary network tunnel from your own local machine straight to ONE SPECIFIC Pod\'s port — genuinely useful for debugging (hitting a Pod\'s API directly to isolate whether an issue is in that one specific Pod versus a load-balancing or Service-routing problem affecting the whole set) but deliberately NOT a substitute for a real Service: it targets exactly one Pod by name, provides no load-balancing across replicas, and the tunnel exists only as long as the `kubectl port-forward` command itself keeps running in your terminal. This distinction matters for debugging specifically: if a Service-routed request fails but `kubectl port-forward` directly to one of its backing Pods succeeds, that strongly narrows the problem toward the Service\'s selector/routing configuration rather than the Pod/application itself — a genuinely useful diagnostic technique for isolating which layer an issue actually lives in.'
        ]
      }
    ]
  }
};
