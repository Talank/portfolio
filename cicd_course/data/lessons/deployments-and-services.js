window.LESSONS = window.LESSONS || {};
window.LESSONS['deployments-and-services'] = {
  id: 'deployments-and-services',
  title: 'Deployments & Services: Self-Healing Replicas With a Stable Address',
  category: 'Part 4 — Kubernetes Fundamentals',
  timeMin: 45,
  summary: 'The previous lesson\'s bare Pod, deleted, is gone permanently — nothing recreates it. And even a running Pod has no stable address that survives it being replaced. This lesson closes both gaps: a Deployment wraps Pods with exactly the reconciliation-loop behavior the why-kubernetes lesson described (declare "3 replicas," a controller keeps that many running, always), and a Service gives whatever Pods a Deployment is currently managing ONE stable name and address, automatically updated as Pods come and go — together, the two objects most real applications spend the most time actually configuring in Kubernetes.',
  goals: [
    'Explain what a Deployment adds on top of a bare Pod, and why that addition is exactly a reconciliation loop',
    'Write a Deployment manifest with a specified replica count and confirm self-healing by deleting a Pod manually',
    'Explain precisely how a Service finds the right Pods to route to (label selectors), without hardcoding anything',
    'Explain why a Service provides a stable address even as the specific Pods behind it change over time',
    'Distinguish a Deployment\'s job (maintaining replicas) from a Service\'s job (providing stable, load-balanced access to them)'
  ],
  concept: [
    {
      h: 'A Deployment: the previous lesson\'s reconciliation loop, made concrete',
      p: [
        'A <b>Deployment</b> manifest declares a desired PodTemplate (essentially, the same container spec the previous lesson\'s bare Pod manifest had) plus a desired REPLICA COUNT — "run 3 copies of Pods matching this template, always." Submitted to the API server, the Deployment controller\'s reconciliation loop continuously compares that declared count against how many matching, healthy Pods actually currently exist, and creates (or removes) Pods as needed to close any gap — exactly the previous lesson\'s abstract "controller" description, now attached to a specific, genuinely useful behavior: automatic replica maintenance.',
        'This is precisely the fix for the previous lesson\'s bare-Pod problem: delete one of a Deployment\'s managed Pods manually, and — unlike the bare Pod, which stayed deleted — the Deployment controller notices the discrepancy (2 running, 3 desired) on its very next reconciliation pass and creates a replacement Pod within seconds, with no human intervention, exactly the self-healing behavior the why-kubernetes lesson described conceptually, now happening for real.'
      ]
    },
    {
      h: 'How a Deployment finds "its" Pods: labels and selectors, not names',
      p: [
        'A Deployment does not track its managed Pods by remembering their exact names (which, per the previous lesson, are not stable anyway across replacement) — it uses a <b>label selector</b>: the Deployment declares `selector.matchLabels: {app: my-app}`, and the Deployment controller considers ANY Pod currently carrying the label `app: my-app` (created by ITS OWN Pod template, in normal operation) as one it is responsible for counting toward the desired replica total. Labels are simply arbitrary key-value metadata attached to an object — genuinely simple as a mechanism, but this label-based matching, rather than matching by specific name or identity, is precisely what makes it trivial for the controller to correctly recognize a brand-new replacement Pod (with a totally new, randomly-generated name) as "one of mine" the instant it is created, since it carries the same label the template always applies.',
        'This same label-selector mechanism — rather than being a Deployment-specific quirk — is the general way Kubernetes objects refer to GROUPS of other objects throughout the system, and it reappears in the very next concept section for exactly the same reason: a Service needs to find "which Pods should I route traffic to" without hardcoding specific Pod names, for exactly the same reasons a Deployment does.'
      ]
    },
    {
      h: 'A Service: one stable address for a changing set of Pods',
      p: [
        'A <b>Service</b> declares its OWN label selector (commonly the exact same labels the corresponding Deployment\'s Pods carry) and, based on that selector, continuously maintains a stable network address plus DNS name that automatically routes to WHICHEVER Pods currently match that selector and are healthy — genuinely analogous to the docker-networking lesson\'s DNS-based container-name discovery, but considerably more capable: a Service load-balances across MULTIPLE matching Pods (not just resolving to one container\'s current IP), and it automatically updates which Pods receive traffic as Pods are replaced, scaled up, or scaled down, none of which the earlier Docker-level DNS mechanism handled at all.',
        'Concretely: a Service named `my-app-svc` is reachable, from anywhere else in the cluster, at exactly that name — `my-app-svc:80`, say — and Kubernetes\'s own internal DNS (CoreDNS, running as a cluster service itself) resolves that name to the Service\'s own stable virtual IP, which in turn transparently load-balances actual connections across whichever of the Deployment\'s current Pods are healthy RIGHT NOW — if one Pod is being replaced this very second, traffic simply routes to the OTHER healthy replicas instead, with the calling service never needing to know or care that a replacement was even happening.'
      ]
    },
    {
      h: 'Deployment and Service together: two distinct jobs, deliberately separated',
      p: [
        'It is worth being precise about the division of labor, since conflating the two is a common early confusion: the DEPLOYMENT\'s job is ensuring the right NUMBER of healthy Pod replicas exist, replacing failed ones — it has no concept of network addressing or traffic routing at all. The SERVICE\'s job is providing a STABLE address and load-balancing traffic across whichever Pods currently match its selector — it does not create, delete, or manage Pods in any way; it purely watches which Pods currently exist and match its selector, and routes accordingly.',
        'These two objects are deliberately independent and loosely coupled, connected ONLY by both happening to select the same labels — a Service will happily route to Pods created by a Deployment, by a bare Pod manifest, or by anything else that happens to apply the matching label, and a Deployment functions completely correctly with NO Service pointed at it at all (useful for background workers that never need to receive inbound traffic). This separation of concerns — one object for "how many, kept healthy," a different object for "how do I reach them" — is a deliberate Kubernetes design pattern that shows up repeatedly as the course goes on.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Watch Rotation Keeps Three Lookouts, Whoever They Currently Are',
      text: 'The Sunny\'s standing order is always exactly three crew members on active lookout duty, at all times, rotating individually as people tire, get reassigned, or need to rest — the NUMBER three is the actual standing rule, never tied to which three SPECIFIC people currently happen to be filling those spots. When one lookout finishes their shift and steps down, whoever is next in the established rotation simply steps up, filling the vacancy automatically, keeping the count at three without anyone needing to specially announce or negotiate the replacement each time. Separately, and completely independently, anyone on the ship needing to relay an urgent sighting does not need to know or track WHICH three specific people currently hold the lookout posts — they simply shout "Lookout!" toward the crow\'s nest, and whoever currently holds that position responds, correctly, regardless of who that happens to be at that exact moment. The rotation rule (always exactly three, refilled automatically) and the "shout toward the post, not toward a specific person" addressing convention are two genuinely separate systems, working together but never needing to know the details of each other.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Central Perk Always Has Two Baristas on Shift, Reachable at "the Counter"',
      text: 'Central Perk\'s actual staffing policy is always exactly two baristas working the counter at any given time, rotating individually across shifts, breaks, and eventual staff turnover — the NUMBER two is the genuine standing policy, never tied to which two specific people currently happen to be working. When one barista\'s shift ends, the schedule automatically has the next person step in, keeping the count at two without Gunther needing to personally arrange each individual handoff. Separately, and completely independently, a customer wanting to order does not need to know or care WHICH two specific baristas are currently working — they simply walk up to "the counter" and are served by whoever currently happens to be staffing it, correctly, regardless of the specific people involved that day. The staffing policy (always two, automatically refilled) and "order at the counter, not from a specific named person" are two genuinely separate systems that happen to work together seamlessly, without either needing to know the other\'s internal details.'
    },
    why: 'The lookout rotation (always exactly three, automatically refilled) is a Deployment — reconciling a declared COUNT, regardless of which specific individuals currently fill it. "Shout toward the crow\'s nest" and "order at the counter" are a Service — a stable ADDRESS that reaches whoever currently, correctly holds that role, without the caller needing to track individual identities. The two systems staying genuinely separate, each doing its own distinct job, is exactly why Kubernetes keeps Deployments (replica count) and Services (stable addressing) as two deliberately independent objects.'
  },
  tech: [
    {
      q: 'Concretely, what happens, step by step, when you manually delete one Pod that a Deployment with replicas: 3 is managing?',
      a: 'The API server processes the deletion, and that specific Pod object is removed from the cluster\'s actual state. On its next reconciliation pass (typically within seconds), the Deployment controller reads the current actual state — Pods matching its label selector — and counts only 2 currently existing, compares that against its declared desired count of 3, detects the discrepancy, and creates ONE new Pod from its declared Pod template to close the gap. That new Pod gets scheduled (potentially onto a different node than the one that was deleted), started by that node\'s kubelet, and — once healthy — is indistinguishable in FUNCTION from the one that was deleted, though it has an entirely new name and IP, exactly the "replace, do not repair" ephemerality the previous lesson established.'
    },
    {
      q: 'Why does a Service need its own SEPARATE label selector rather than just automatically tracking "whatever Pods the associated Deployment currently has"?',
      a: 'Services and Deployments are deliberately independent objects with no direct object-level reference to each other at all — a Service genuinely has no built-in concept of "which Deployment" it is associated with; it only knows its own selector and continuously watches for any currently-existing Pods matching it, from WHATEVER source created them. This independence is a real, deliberate flexibility: a single Service could route to Pods created by multiple different Deployments (or a mix of Deployment-managed and manually-created Pods) as long as they all carry matching labels, and conversely, a Deployment\'s Pods could be targeted by zero, one, or even multiple different Services with different selectors — the loose coupling via labels alone, rather than a direct object reference, is what enables these flexible combinations.'
    },
    {
      q: 'When a Service load-balances traffic across multiple matching Pods, and one of those Pods is mid-replacement (old one terminating, new one not yet ready), what determines whether traffic gets routed to it?',
      a: 'A Service only routes traffic to Pods that are both matching its label selector AND currently marked as READY — readiness is typically determined by a readiness probe (a health check Kubernetes runs against each Pod, covered more in the rolling-updates lesson), and a Pod that has not yet passed its readiness check, or that is in the process of terminating, is excluded from the Service\'s active routing targets during that window. This is precisely what allows a Pod replacement to happen with zero dropped requests from the calling side: traffic during the transition window is simply routed to whichever OTHER matching Pods are already healthy and ready, and the new replacement Pod is only added to the routable set once it has actually proven itself ready to receive traffic.'
    }
  ],
  code: {
    title: 'A Deployment and a Service, working together',
    intro: 'Notice the Service\'s selector matches the Deployment\'s Pod template labels exactly — that shared label is the ONLY connection between the two objects.',
    code: `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app          # <- the Deployment's OWN selector: "these are mine"
  template:
    metadata:
      labels:
        app: my-app          # <- every Pod it creates carries this label
    spec:
      containers:
        - name: my-app
          image: myregistry.example.com/myteam/my-app:1.4.2
          ports:
            - containerPort: 3000

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  selector:
    app: my-app             # <- SAME label — the only link to the Deployment
  ports:
    - port: 80
      targetPort: 3000       # <- routes Service port 80 to container port 3000

$ kubectl apply -f deployment.yaml -f service.yaml
deployment.apps/my-app created
service/my-app-svc created

$ kubectl get pods -l app=my-app
NAME                       READY   STATUS    RESTARTS   AGE
my-app-7d9f8c6b5d-2xk4p   1/1     Running   0          10s
my-app-7d9f8c6b5d-8mz9q   1/1     Running   0          10s
my-app-7d9f8c6b5d-p3v7r   1/1     Running   0          10s

$ kubectl delete pod my-app-7d9f8c6b5d-2xk4p
pod "my-app-7d9f8c6b5d-2xk4p" deleted

$ kubectl get pods -l app=my-app
NAME                       READY   STATUS    RESTARTS   AGE
my-app-7d9f8c6b5d-8mz9q   1/1     Running   0          45s
my-app-7d9f8c6b5d-p3v7r   1/1     Running   0          45s
my-app-7d9f8c6b5d-k9j2w   1/1     Running   0          3s
# ^ a NEW Pod (k9j2w) appeared automatically — the Deployment noticed
#   2/3 and closed the gap. my-app-svc keeps routing correctly the
#   whole time, since it was never tracking that one Pod by name.`,
    notes: [
      'The Pod names have a Deployment-generated hash suffix (7d9f8c6b5d) plus a random suffix per Pod — never hand-typed, never something to depend on staying the same.',
      'my-app-svc:80 remains reachable throughout the entire delete-and-replace sequence — that continuity is the whole point of separating "stable address" (Service) from "replica maintenance" (Deployment).'
    ]
  },
  lab: {
    title: 'Write a Deployment and matching Service',
    prompt: 'Write a Deployment named "api" with 2 replicas, label app=api, running image myregistry.example.com/myteam/api:2.1.0 on containerPort 8080. Then write a matching Service named "api-svc" that selects app=api and routes Service port 80 to targetPort 8080.',
    starter: `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ???
spec:
  replicas: ???
  selector:
    matchLabels:
      app: ???
  template:
    metadata:
      labels:
        app: ???
    spec:
      containers:
        - name: api
          image: ???
          ports:
            - containerPort: ???

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ???
spec:
  selector:
    app: ???
  ports:
    - port: ???
      targetPort: ???
`,
    checks: [
      { re: 'name:\\s*api\\s*$[\\s\\S]*replicas:\\s*2', flags: 'im', must: true, hint: 'Deployment metadata.name: api and spec.replicas: 2', pass: 'Deployment name/replicas ✓' },
      { re: 'matchLabels:\\s*\\n\\s*app:\\s*api', flags: 'i', must: true, hint: 'selector.matchLabels.app: api', pass: 'matchLabels app: api ✓' },
      { re: 'image:\\s*myregistry\\.example\\.com/myteam/api:2\\.1\\.0', flags: 'i', must: true, hint: 'containers[0].image: myregistry.example.com/myteam/api:2.1.0', pass: 'image ✓' },
      { re: 'containerPort:\\s*8080', flags: 'i', must: true, hint: 'containers[0].ports[0].containerPort: 8080', pass: 'containerPort: 8080 ✓' },
      { re: 'kind:\\s*Service[\\s\\S]*name:\\s*api-svc', flags: 'i', must: true, hint: 'Service metadata.name: api-svc', pass: 'Service name: api-svc ✓' },
      { re: 'port:\\s*80\\s*\\n\\s*targetPort:\\s*8080', flags: 'i', must: true, hint: 'Service ports: port: 80, targetPort: 8080', pass: 'Service port/targetPort ✓' }
    ],
    run: 'Try it for real: kubectl apply -f deployment.yaml -f service.yaml, then kubectl get pods -l app=api and kubectl get svc api-svc.',
    solution: `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myregistry.example.com/myteam/api:2.1.0
          ports:
            - containerPort: 8080

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-svc
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080`,
    notes: [
      'The Deployment\'s spec.selector.matchLabels, template.metadata.labels, and the Service\'s spec.selector must all reference the SAME label (app: api) — this shared label is the only thing connecting all three.',
      'port (80) is what OTHER things call this Service on; targetPort (8080) is the actual containerPort inside the Pods it routes to — they do not have to match, and often intentionally do not.'
    ]
  },
  quiz: [
    {
      q: 'What does a Deployment add on top of a bare Pod?',
      options: ['Faster container startup', 'A reconciliation loop that maintains a declared number of healthy replicas, automatically replacing failed or deleted Pods', 'Network routing and load balancing', 'Persistent storage'],
      correct: 1,
      explain: 'A Deployment continuously reconciles a declared replica count, creating replacement Pods automatically — exactly the self-healing behavior a bare Pod lacks.'
    },
    {
      q: 'How does a Deployment know which currently-existing Pods count toward its declared replica total?',
      options: ['By tracking exact Pod names it originally created', 'By label selector — any Pod currently carrying the matching label counts, regardless of name or exact identity', 'By checking which Pods were created in the last hour', 'By IP address range'],
      correct: 1,
      explain: 'Deployments use label selectors, not names, to identify their managed Pods — which is exactly why a replacement Pod with a brand-new name is correctly recognized as "one of mine."'
    },
    {
      q: 'What is the core job of a Service, as distinct from a Deployment?',
      options: ['Creating and destroying Pods to maintain a replica count', 'Providing a stable name/address that load-balances traffic across whichever Pods currently match its selector and are healthy', 'Building container images', 'Storing persistent data'],
      correct: 1,
      explain: 'A Service does not create or manage Pods at all — it purely provides stable, load-balanced access to whichever Pods match its own selector.'
    },
    {
      q: 'What is the ONLY connection between a Deployment and a Service that routes to its Pods?',
      options: ['A direct object reference stored in both manifests', 'A shared label — the Service\'s selector matches the same labels the Deployment\'s Pod template applies', 'They must have the exact same metadata.name', 'Kubernetes automatically links any Deployment to any Service in the same file'],
      correct: 1,
      explain: 'Deployments and Services are deliberately independent objects, connected only by both happening to select the same labels — no direct reference exists between them.'
    },
    {
      q: 'A Pod managed by a Deployment is mid-replacement (old Pod terminating, new one not yet ready). What happens to traffic sent to the corresponding Service?',
      options: ['All traffic fails until the replacement is fully ready', 'Traffic is routed to whichever OTHER matching Pods are currently healthy and ready — the calling service does not need to know a replacement is happening', 'The Service stops accepting any new connections', 'Traffic is queued indefinitely until the new Pod is ready'],
      correct: 1,
      explain: 'A Service only routes to Pods that are ready — during a replacement, traffic simply continues to other healthy replicas, achieving continuity without the caller noticing.'
    }
  ],
  pitfalls: [
    'Creating a bare Pod when what was actually needed was a Deployment — the bare Pod will not be automatically replaced if it fails or is deleted.',
    'Forgetting that a Service\'s selector must match the labels the Deployment\'s Pod TEMPLATE applies (not the Deployment\'s own metadata.name) — a typo or mismatch here silently results in a Service routing to nothing.',
    'Assuming a Service tracks a specific Deployment directly — it does not; it is purely label-driven, and any other object producing matching-labeled Pods would be routed to just the same.'
  ],
  interview: [
    {
      q: 'Explain the specific division of responsibility between a Deployment and a Service, and why Kubernetes keeps them as two separate objects instead of one combined one.',
      a: 'A Deployment\'s sole responsibility is maintaining a declared number of healthy Pod replicas, replacing failed or deleted ones — it has no concept of network addressing at all. A Service\'s sole responsibility is providing a stable name and address that load-balances across whichever Pods currently match its selector and are ready — it does not create, delete, or manage Pods in any way. Keeping them separate, connected only via shared labels rather than a direct reference, is a deliberate design choice enabling flexible combinations: a Service can route to Pods from multiple different sources, a Deployment can run with zero Services pointed at it (for background workers needing no inbound traffic), and either piece can be reasoned about, debugged, and modified independently of the other — a single combined object would force these two genuinely distinct concerns to always change together, which is unnecessary coupling.'
    },
    {
      q: 'A Deployment shows 3/3 Pods Running and Ready in kubectl, but requests to its Service are intermittently failing. What would you investigate, given what you know about how these two objects relate?',
      a: 'Since a Service is connected to its Pods purely via label selector matching, with no direct reference to the Deployment at all, I would first verify the Service\'s selector genuinely matches the labels the Deployment\'s Pods actually carry — a subtle typo or mismatch (extra label, different casing, a leftover label from a previous version) would cause the Service to be routing to FEWER Pods than the 3 actually healthy ones (or, in a worse case, zero), which would explain intermittent failures if only some backing Pods are actually receiving traffic while others sit idle and unused. I would run `kubectl get endpoints <service-name>` specifically, which shows exactly which Pod IPs the Service currently considers valid routing targets — if that list has fewer entries than the 3 Running/Ready Pods kubectl get pods shows, the selector mismatch theory is confirmed, and the fix is correcting either the Service\'s selector or the Deployment\'s Pod template labels to match.'
    },
    {
      q: 'Why does readiness (not just "the container process is running") matter for whether a Service routes traffic to a given Pod?',
      a: 'A container process being started and running does not necessarily mean the APPLICATION inside it is actually ready to correctly handle requests — it might still be loading configuration, warming a cache, or establishing its own downstream connections (to a database, for instance) for a brief window after starting. If a Service routed traffic to a Pod purely based on "the container is running," requests could be sent to a Pod during that not-actually-ready window and fail or behave incorrectly, even though the Pod would appear healthy by a naive running-or-not check. Readiness probes let a Pod explicitly signal "I am running AND actually ready to correctly handle traffic" as two separate, distinguishable states, and a Service only routes to Pods currently reporting the second, stricter condition — directly enabling the zero-dropped-requests rolling replacement behavior described earlier in this lesson.'
    },
    {
      q: 'How would you explain, to someone debugging their first Kubernetes application, why they should never hardcode a Pod\'s IP address anywhere in their application configuration, using what this lesson and the previous one established?',
      a: 'The previous lesson established that Pods are explicitly ephemeral — a replaced Pod gets an entirely new IP, never a reused one, by design, since Kubernetes replaces rather than repairs failed Pods. This lesson\'s Service object exists SPECIFICALLY to provide the stable reference a Pod itself deliberately does not provide: any configuration that should point at "the database" or "the API" should reference the SERVICE\'s stable name (which never changes, regardless of how many times the Pods behind it are individually replaced), never a specific Pod\'s IP, which is close to guaranteed to change at some point during normal, routine cluster operation — hardcoding a Pod IP is building a dependency on precisely the one thing Kubernetes\'s architecture explicitly does not guarantee to stay stable.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover Deployments and Services as the two core building blocks. This is what is underneath: how a Deployment actually performs a rolling update via an intermediate ReplicaSet, the different Service types, and what "headless" Services are for.',
    sections: [
      {
        h: 'Deployments do not manage Pods directly — they manage ReplicaSets',
        p: [
          'A Deployment does not, itself, directly create and track individual Pods — it creates and manages a <b>ReplicaSet</b> (a simpler controller object, itself responsible ONLY for maintaining a declared Pod replica count, with no rollout-history awareness at all), and it is the ReplicaSet that actually creates and reconciles the individual Pods. This extra layer of indirection is precisely what makes rolling UPDATES (changing the image version, covered in more depth in Part 7) possible cleanly: updating a Deployment\'s Pod template creates a brand-new ReplicaSet (with the new template), and the Deployment controller gradually scales the NEW ReplicaSet up while scaling the OLD ReplicaSet down, giving a smooth, gradual transition between old and new Pods rather than an abrupt all-at-once replacement — and, critically, the OLD ReplicaSet is kept around (scaled to zero, not deleted) specifically to make a rollback fast: reverting to a previous version means simply scaling the old ReplicaSet back up and the new one down, rather than rebuilding Pods from scratch.'
        ]
      },
      {
        h: 'Service types: ClusterIP, NodePort, and LoadBalancer',
        p: [
          'This lesson\'s examples used the DEFAULT Service type, `ClusterIP` — reachable only from WITHIN the cluster, which is exactly right for internal service-to-service communication (an API reaching a database, for instance) that should never be directly exposed to the outside world. `NodePort` additionally exposes the Service on a specific, fixed port on EVERY node\'s own IP address, making it reachable from outside the cluster — genuinely useful for development/testing, but rarely the final production answer, since it ties external access to specific node IPs and a somewhat awkward port range. `LoadBalancer` (typically only meaningful on a cloud provider\'s managed Kubernetes) provisions an actual external cloud load balancer, automatically wired up to route to the Service — the standard production mechanism for exposing a service to genuine internet traffic, and the type most real production Services needing external exposure actually use.'
        ]
      },
      {
        h: 'Headless Services: when you want the individual Pod addresses, not load-balancing',
        p: [
          'Setting `clusterIP: None` on a Service creates a "headless" Service — instead of providing one single load-balanced virtual address, DNS lookups against a headless Service\'s name return the INDIVIDUAL IP addresses of every currently-matching, ready Pod directly. This is genuinely useful for a narrower but real class of applications — particularly distributed, stateful systems (some database clusters, for instance) where each individual replica has a genuinely distinct role or needs to be addressed specifically, rather than "any healthy replica, load-balanced" being an acceptable answer — a case ordinary load-balancing Services are not designed for, and headless Services exist specifically to support.'
        ]
      }
    ]
  }
};
