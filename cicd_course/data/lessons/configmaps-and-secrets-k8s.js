window.LESSONS = window.LESSONS || {};
window.LESSONS['configmaps-and-secrets-k8s'] = {
  id: 'configmaps-and-secrets-k8s',
  title: 'ConfigMaps & Secrets: Configuration Kubernetes\'s Way',
  category: 'Part 5 — Kubernetes in Practice',
  timeMin: 35,
  summary: 'The environment-config-and-secrets lesson established the principle at the Docker level: config in, secrets out, supplied at run time rather than baked into an image. Kubernetes gives that principle two dedicated, first-class objects — ConfigMaps for non-sensitive configuration, Secrets for sensitive values — both injectable into a Pod as environment variables or mounted files, decoupled entirely from the Deployment\'s own Pod template. This is what makes the EXACT SAME Deployment manifest deployable, unmodified, to dev/staging/production, with only the referenced ConfigMap/Secret differing per environment.',
  goals: [
    'Explain what a ConfigMap is and how it differs from hardcoding values directly in a Pod template',
    'Explain what a Kubernetes Secret is, and precisely how much protection it does and does not actually provide by default',
    'Inject a ConfigMap and a Secret into a Pod, both as environment variables and as a mounted file',
    'Explain why base64 encoding in a Secret is not encryption, and why that distinction matters',
    'Design a config/secret split so the identical Deployment manifest works unmodified across multiple environments'
  ],
  concept: [
    {
      h: 'ConfigMaps: non-sensitive configuration, decoupled from the Pod template',
      p: [
        'A <b>ConfigMap</b> is a Kubernetes object holding arbitrary key-value configuration data — created independently of any Deployment or Pod, then REFERENCED from a Pod template rather than having its values hardcoded directly inline. A Pod can consume a ConfigMap\'s values as individual environment variables (`envFrom: configMapRef` or `env: valueFrom: configMapKeyRef`, for one specific key) or as an entire mounted FILE inside the container\'s filesystem (each key in the ConfigMap becoming a separate file, with that key\'s value as the file\'s content) — genuinely useful for an application expecting a real config file on disk rather than environment variables specifically.',
        'The direct payoff of this decoupling: the exact same Deployment manifest — same image, same container spec, same everything else — can reference a ConfigMap by NAME, and different environments simply have DIFFERENT ConfigMaps with that same name containing different values (a "staging" cluster\'s ConfigMap pointing at a staging database host, a "production" cluster\'s ConfigMap pointing at the production one) — the Deployment manifest itself never needs to change or be duplicated per environment, exactly the "build once, deploy the identical artifact everywhere" principle the earlier Docker-level secrets lesson introduced, now extended to the Kubernetes deployment layer.'
      ]
    },
    {
      h: 'Secrets: the same mechanism, marked as sensitive — but read the fine print',
      p: [
        'A <b>Secret</b> is structurally almost identical to a ConfigMap — same key-value shape, same env-variable and mounted-file injection mechanisms — but Kubernetes handles it with additional care in a few specific ways: `kubectl get secret` does not print raw values by default (they show as `<base64 encoded>` or similar), and Kubernetes stores Secrets with somewhat more restricted default access patterns than ConfigMaps. This is genuinely useful operational hygiene, but it is important to be precise about what it does NOT provide: by default, out of the box, Secrets are stored in etcd (the same underlying datastore backing all cluster state) as BASE64-ENCODED, not encrypted — and base64 is an ENCODING, not an encryption scheme, meaning anyone with read access to etcd, or with sufficient cluster permissions to read the Secret object directly via the API, can trivially decode it back to plaintext with nothing more than a standard base64 decode.',
        'This is a genuinely common, genuinely dangerous misconception worth being precise about: seeing a Secret\'s value rendered as an unreadable base64 blob in `kubectl get secret -o yaml` output FEELS like it is "encrypted" or "protected," but that appearance is closer to the crossed-out map mark from the earlier Docker secrets lesson\'s story than to genuine protection — trivially reversible by design, not a real security boundary on its own. Real protection for Secrets at rest requires enabling encryption-at-rest for etcd specifically (a cluster-level configuration this course does not go deep on) or using an external secrets-management integration.'
      ]
    },
    {
      h: 'What Secrets DO genuinely provide, and why they are still worth using over a ConfigMap',
      p: [
        'Despite the base64-is-not-encryption caveat, Secrets are still the correct choice over a ConfigMap for sensitive values, for reasons distinct from at-rest encryption: Kubernetes RBAC (role-based access control, briefly mentioned here) can be configured to grant different, more restrictive permissions specifically for Secret objects than for ConfigMaps, letting a cluster operator genuinely limit WHO can read Secret values even among people with broader cluster access; `kubectl get secret` not printing raw values by default avoids ACCIDENTAL exposure (in a screen share, a copy-pasted terminal log, a CI job\'s console output) in a way a ConfigMap\'s plainly-visible values would not; and using the Secret type specifically signals INTENT clearly to anyone reading the manifest or auditing the cluster — "this value is sensitive," which matters for security review processes even independent of the underlying storage mechanics.',
        'The honest, complete picture: Secrets are meaningfully BETTER than ConfigMaps for sensitive values (better default access-control posture, better accidental-exposure prevention, clearer intent-signaling) but are NOT, by themselves and by default, cryptographically secure at rest — treating a Kubernetes Secret as equivalent to "genuinely encrypted, safe from anyone with any cluster access" is the exact mistake this lesson is correcting, and for genuinely high-sensitivity credentials, pairing Kubernetes Secrets with etcd encryption-at-rest and/or an external secrets manager (HashiCorp Vault, a cloud provider\'s secrets service) integration is the more complete, defensible answer.'
      ]
    },
    {
      h: 'Injecting both into a Pod, and the update-propagation caveat',
      p: [
        'Both mechanisms are injected identically in a Pod template — `envFrom` for bulk environment-variable injection of every key, `env: valueFrom` for one specific key mapped to one specific environment variable name, or `volumes`/`volumeMounts` for file-based injection — and a single Pod can freely mix ConfigMap-sourced and Secret-sourced values, environment variables and mounted files, according to whatever each specific value actually needs.',
        'One genuinely important operational caveat: updating a ConfigMap or Secret\'s VALUE after a Pod is already running does NOT automatically restart that Pod or refresh environment-variable-injected values inside it — environment variables are set once, at container start, and are not live-updated. Mounted-file-based injection DOES eventually update the file\'s content inside a running Pod (via a periodic sync, not instantaneous), but the application itself still needs to actually notice the file changed and reload it, which most applications do not do automatically without being specifically built to watch for it. The reliable, standard way to apply a ConfigMap/Secret change to running Pods is a proper rolling restart of the Deployment (covered in Part 7), not an expectation that already-running Pods will somehow pick up the change on their own.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Public Duty Roster vs. the Sealed Orders in Nami\'s Cabin',
      text: 'The Sunny keeps two genuinely different kinds of posted information. A public DUTY ROSTER — who has lookout, who is cooking, when the next supply stop is planned — hangs openly in the galley, freely readable by literally anyone aboard, crew and any temporary guest alike, because none of it is remotely sensitive and hiding it would only make coordinating the ship harder. Separately, Nami keeps certain genuinely sensitive information — the crew\'s actual current bounty totals, a specific ally\'s real identity that needs protecting — in a LOCKED cabin drawer, not posted anywhere public, and only specific trusted crew members even have a key to that drawer at all. Usopp, once, jokingly suggests just writing the sensitive information in a slightly obscured code and posting IT on the public roster too, "same as everything else, just harder to read at a glance" — and Nami shuts that down immediately: something merely being WRITTEN OBSCURELY on a PUBLIC board is nothing like actually being locked away from people who should not see it at all; anyone who genuinely wanted to could still just read the obscured note directly off the same public board everyone else can already see.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The Whiteboard List vs. Sheldon\'s Actually Locked File Cabinet',
      text: 'Sheldon keeps two genuinely different categories of information around the apartment. A public WHITEBOARD lists the chore rotation, whose turn it is to pick the takeout order, the current Halo tournament bracket — freely visible to literally anyone who walks in, roommates and guests alike, because none of it is remotely sensitive. Separately, Sheldon keeps certain genuinely sensitive documents — actual legal paperwork, private financial details — in a locked file cabinet in his room, with the key kept specifically away from casual access, not posted or displayed anywhere the group casually gathers. Leonard, once, jokingly suggests Sheldon could just write the sensitive financial numbers on the public whiteboard too, "just in slightly smaller, harder-to-read handwriting, same as everything else" — and Sheldon\'s response is immediate and characteristically precise: writing something in slightly harder-to-read handwriting on a PUBLICLY VISIBLE whiteboard is nothing whatsoever like it being genuinely locked away — anyone who actually wanted to could just walk up and read the small handwriting directly, same as anything else on that same public board.'
    },
    why: 'The public duty roster and the locked file cabinet are exactly ConfigMap versus Secret: two genuinely different objects for two genuinely different sensitivity levels, with real handling differences (who can access them, how casually they get exposed). But Usopp\'s and Leonard\'s "just obscure it slightly, same public board" suggestion is exactly the base64-is-not-encryption mistake — a Kubernetes Secret\'s base64 encoding LOOKS obscured, the same way slightly-harder-to-read handwriting looks obscured, but it is trivially reversible by anyone who can already see it, nothing like the genuine access restriction a real lock (real encryption-at-rest) actually provides.'
  },
  tech: [
    {
      q: 'Concretely, what does `kubectl get secret my-secret -o jsonpath="{.data.password}" | base64 -d` demonstrate, and why does it matter?',
      a: 'This command retrieves the raw, base64-encoded value stored for the `password` key in a Secret named `my-secret`, then pipes it through a completely standard, publicly-documented base64 DECODE utility — recovering the original plaintext value with no special tooling, no cracking, no exploit, just the same everyday decoding operation used for countless unrelated, non-sensitive purposes. It matters because it directly demonstrates, hands-on, that a Secret\'s "protection" via base64 is NOT cryptographic security — anyone with sufficient permission to read the Secret object via the API (or read etcd\'s underlying storage directly, if that access exists) can recover the plaintext this trivially, which is exactly the distinction the lesson\'s concept section is making concrete.'
    },
    {
      q: 'Why does updating a ConfigMap\'s value not automatically update an already-injected environment variable inside a currently-running Pod?',
      a: 'Environment variables are resolved and set into a container\'s process environment exactly ONCE, at the moment that container actually starts — this is a fundamental property of how process environments work generally (not something specific to Kubernetes), and nothing about updating the SOURCE ConfigMap object afterward reaches into an already-running process to modify its already-set environment variables, since that process already read and fixed those values at its own startup, before the ConfigMap update even happened. This is exactly why a rolling restart (recreating the Pods, so their containers start fresh and read the NOW-updated ConfigMap at that fresh startup) is the reliable mechanism for propagating a config change — not any kind of "live update" of already-running processes\' environments, which is not something Kubernetes (or operating systems generally) provides for plain environment variables.'
    },
    {
      q: 'Why might mounted-file-based ConfigMap injection be preferable to environment-variable injection for an application that needs to notice configuration changes without a full restart?',
      a: 'Kubernetes DOES periodically sync a mounted ConfigMap volume\'s file content when the source ConfigMap changes (typically within roughly a minute, via the kubelet\'s periodic sync, not instantaneous but genuinely automatic) — this is a real, meaningful difference from environment variables, which never update after container start under any circumstances. An application specifically WRITTEN to watch its config file for changes (using a file-watching mechanism, common in some frameworks) can pick up that updated file content and reload its own configuration live, without needing a Pod restart at all — genuinely useful for configuration that changes more frequently than a full deployment cycle would comfortably accommodate. This requires the application to actually implement that file-watching behavior itself; Kubernetes updates the file, but does not force the application to notice or act on the change.'
    }
  ],
  code: {
    title: 'A ConfigMap and Secret, injected into one Pod',
    intro: 'Notice the identical injection mechanism (envFrom / valueFrom) for both — the meaningful difference is entirely in the object kind and how Kubernetes handles it, not in how a Pod consumes it.',
    code: `# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  FEATURE_FLAG_NEW_UI: "true"

---
# secret.yaml (values here would normally be created via kubectl create secret,
# which base64-encodes automatically — shown decoded here for readability)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DATABASE_PASSWORD: cGFzc3dvcmQxMjM=   # base64 of "password123" — NOT encrypted

---
# deployment.yaml (excerpt)
spec:
  template:
    spec:
      containers:
        - name: app
          image: myregistry.example.com/myteam/my-app:1.4.2
          envFrom:
            - configMapRef:
                name: app-config      # injects EVERY key in app-config
          env:
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: DATABASE_PASSWORD   # injects ONE specific Secret key

# Verify what's inside, WITHOUT accidentally exposing it in a log/screenshot:
$ kubectl get secret app-secrets -o jsonpath="{.data.DATABASE_PASSWORD}" | base64 -d
password123
# ^ trivially recovered — confirming base64 is encoding, not encryption`,
    notes: [
      'envFrom (bulk, every key) and env: valueFrom (one specific key, one specific env var name) can both be used in the same Pod, mixed freely across ConfigMaps and Secrets.',
      'kubectl create secret generic app-secrets --from-literal=DATABASE_PASSWORD=password123 is the standard way to create this Secret without manually base64-encoding it yourself.'
    ]
  },
  lab: {
    title: 'Fix a Deployment leaking config the wrong way',
    prompt: 'This Deployment excerpt hardcodes both a non-sensitive log level AND a sensitive database password directly as plain env values, defeating the entire point of ConfigMaps/Secrets. Rewrite it to use a ConfigMap (for LOG_LEVEL) and a Secret (for DATABASE_PASSWORD) reference instead, assuming a ConfigMap named "app-config" (key LOG_LEVEL) and a Secret named "app-secrets" (key DATABASE_PASSWORD) already exist.',
    starter: `# Original (hardcoded, defeats the purpose):
# env:
#   - name: LOG_LEVEL
#     value: "debug"
#   - name: DATABASE_PASSWORD
#     value: "hunter2"

# Your fixed version:
env:
  - name: LOG_LEVEL
    valueFrom:
      ???
  - name: DATABASE_PASSWORD
    valueFrom:
      ???
`,
    checks: [
      { re: 'configMapKeyRef:\\s*\\n\\s*name:\\s*app-config\\s*\\n\\s*key:\\s*LOG_LEVEL', flags: 'i', must: true, hint: 'LOG_LEVEL should use valueFrom.configMapKeyRef.name: app-config, key: LOG_LEVEL', pass: 'LOG_LEVEL via configMapKeyRef ✓' },
      { re: 'secretKeyRef:\\s*\\n\\s*name:\\s*app-secrets\\s*\\n\\s*key:\\s*DATABASE_PASSWORD', flags: 'i', must: true, hint: 'DATABASE_PASSWORD should use valueFrom.secretKeyRef.name: app-secrets, key: DATABASE_PASSWORD', pass: 'DATABASE_PASSWORD via secretKeyRef ✓' },
      { re: 'value:\\s*"(debug|hunter2)"', flags: 'i', must: false, hint: 'Remove the hardcoded plain values entirely — both should be valueFrom references now.', pass: 'No hardcoded plain values ✓' }
    ],
    run: 'Try it for real: kubectl apply the ConfigMap and Secret first, then this Deployment, and confirm both env vars are correctly populated with kubectl exec ... env.',
    solution: `env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: LOG_LEVEL
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: DATABASE_PASSWORD`,
    notes: [
      'Notice LOG_LEVEL — genuinely non-sensitive — still benefits from the ConfigMap indirection: it can now differ per environment without editing this Deployment manifest at all.',
      'DATABASE_PASSWORD uses secretKeyRef specifically (not configMapKeyRef) — using the wrong object type here would lose the access-control and accidental-exposure protections Secrets provide over ConfigMaps.'
    ]
  },
  quiz: [
    {
      q: 'What is the main structural similarity between a ConfigMap and a Secret?',
      options: ['They are literally the same object type with a different name', 'Both are key-value objects, decoupled from the Pod template, injected via the same environment-variable or mounted-file mechanisms — the difference is in sensitivity handling, not injection mechanics', 'ConfigMaps can only hold one value; Secrets can hold many', 'Only Secrets can be mounted as files'],
      correct: 1,
      explain: 'ConfigMaps and Secrets share the same shape and injection mechanisms — Secrets add sensitivity-focused handling (access control, hidden-by-default display) on top of that same structure.'
    },
    {
      q: 'Why is base64 encoding in a Kubernetes Secret NOT equivalent to encryption?',
      options: ['Base64 is actually a strong encryption algorithm', 'Base64 is a reversible encoding scheme — anyone with read access to the Secret can trivially decode it back to plaintext with a standard, widely available decode operation, no cracking required', 'Secrets are never actually base64 encoded', 'Base64 encoding requires a secret key that only Kubernetes has'],
      correct: 1,
      explain: 'Base64 is an encoding, not an encryption scheme — it is trivially reversible by design, providing no cryptographic protection against someone with read access.'
    },
    {
      q: 'What do Kubernetes Secrets genuinely provide over ConfigMaps, despite base64 not being encryption?',
      options: ['Nothing — they provide no real benefit at all', 'More restrictive default access-control posture, hidden-by-default display (avoiding accidental exposure), and clear intent-signaling that a value is sensitive', 'Automatic encryption at rest, always, with no configuration needed', 'Secrets are always physically stored on a different server than ConfigMaps'],
      correct: 1,
      explain: 'Secrets offer real, meaningful benefits (access control, accidental-exposure prevention, clear intent) even though they are not cryptographically encrypted at rest by default.'
    },
    {
      q: 'A ConfigMap is updated with a new value, but a Pod that already injected the old value as an environment variable is still running. What happens to that Pod\'s environment variable?',
      options: ['It updates automatically within a few seconds', 'It stays at the OLD value — environment variables are set once at container start and are not live-updated; a rolling restart is needed to pick up the change', 'The Pod crashes immediately', 'Kubernetes automatically restarts the Pod to apply the change'],
      correct: 1,
      explain: 'Environment variables are fixed at container start. Picking up a ConfigMap/Secret change requires recreating the Pod (a rolling restart), not waiting for a live update.'
    },
    {
      q: 'Why does decoupling configuration into ConfigMaps/Secrets (rather than hardcoding values in the Deployment manifest) matter for multi-environment deployment?',
      options: ['It has no practical benefit over hardcoding', 'The identical Deployment manifest can be used unchanged across dev/staging/production, with only the referenced ConfigMap/Secret (same name, different values per environment) actually differing', 'It makes the Deployment manifest run faster', 'ConfigMaps are required by Kubernetes syntax rules'],
      correct: 1,
      explain: 'Referencing config by name rather than hardcoding values is what enables "build once, deploy the identical artifact everywhere" at the Kubernetes layer, matching the same principle from the Docker-level secrets lesson.'
    }
  ],
  pitfalls: [
    'Treating a Kubernetes Secret\'s base64 encoding as if it were genuine encryption — it is trivially reversible, and real at-rest protection requires etcd encryption-at-rest or an external secrets manager.',
    'Hardcoding configuration values directly in a Deployment manifest instead of referencing a ConfigMap/Secret — this forces maintaining separate, near-duplicate manifests per environment instead of one manifest with per-environment config objects.',
    'Updating a ConfigMap or Secret and expecting already-running Pods to automatically pick up the change — environment-variable injection requires a Pod restart; only mounted-file injection updates live, and only if the application itself watches for the change.'
  ],
  interview: [
    {
      q: 'A security review flags that your team is storing database passwords in Kubernetes Secrets and considers this "encrypted, so it\'s fine." How would you correct this understanding, precisely?',
      a: 'I would clarify that a Kubernetes Secret\'s values are, by default, stored as base64-ENCODED, not encrypted — base64 is a completely reversible, publicly-documented encoding scheme, not a cryptographic mechanism, so anyone with sufficient permission to read the Secret object via the Kubernetes API, or to read etcd\'s underlying storage directly, can recover the plaintext value trivially with a standard decode operation. What Secrets DO genuinely provide over a plain ConfigMap is a better default access-control posture (RBAC can restrict Secret access more tightly than general resource access) and protection against accidental exposure in casual contexts like kubectl output. For genuine at-rest cryptographic protection, the cluster needs etcd encryption-at-rest explicitly enabled, and for the highest-sensitivity credentials, integrating an external secrets manager (Vault, a cloud provider\'s secrets service) is the more complete, defensible approach — "it\'s a Secret object" alone should not be treated as equivalent to "it\'s encrypted."'
    },
    {
      q: 'Design a config/secret strategy for a Deployment that needs to run identically across dev, staging, and production, with different database connection details and different log verbosity per environment.',
      a: 'The Deployment manifest itself stays byte-for-byte identical across all three environments — it references a ConfigMap named, say, `app-config` (for LOG_LEVEL and any other non-sensitive per-environment values) and a Secret named `app-secrets` (for DATABASE_PASSWORD and any other sensitive per-environment values) purely BY NAME, never by inline value. Each environment (dev/staging/production, likely separate namespaces or separate clusters) then has its OWN ConfigMap and Secret objects, both named identically (`app-config`, `app-secrets`) but populated with environment-appropriate values — dev\'s ConfigMap pointing LOG_LEVEL to "debug" and a dev database host, production\'s pointing to "warn" and the production database host. Deploying to any environment is then just "apply the same Deployment manifest, plus that environment\'s own ConfigMap/Secret" — no manifest duplication or environment-specific branching logic needed anywhere in the Deployment YAML itself.'
    },
    {
      q: 'Why does the mounted-file injection mechanism for ConfigMaps eventually reflect updates, while environment-variable injection never does, and what does that difference imply for application design?',
      a: 'Mounted-file injection works through an actual filesystem mount that the kubelet keeps periodically synced to the current ConfigMap content (roughly within a minute of a change, via a real, ongoing sync process) — the FILE\'s content genuinely can change while the Pod keeps running, because the underlying mount mechanism supports that. Environment variables, by contrast, are a property of a PROCESS, fixed by the operating system at the moment that process starts, with no OS-level mechanism for externally modifying an already-running process\'s environment variables at all — Kubernetes has no way to "push" an update into something that fundamentally does not support being updated after the fact. The design implication: an application wanting to support live config reloads without a full Pod restart should consume config via mounted FILES with its own file-watching logic, not environment variables, which structurally cannot support that pattern regardless of what Kubernetes does on its end.'
    },
    {
      q: 'How would you audit a cluster for Secrets that might be under-protected, given that Secret creation alone does not guarantee strong protection?',
      a: 'I would check whether etcd encryption-at-rest is actually enabled for the cluster (a cluster-level, not per-Secret, configuration) — without it, EVERY Secret in the cluster is only base64-protected, regardless of how carefully individual manifests are written. I would review RBAC policies for who has `get`/`list` permissions on Secret resources specifically, looking for overly broad grants (a role intended for read-only monitoring that accidentally also grants Secret read access, for instance) that would undermine the access-control benefit Secrets are meant to provide over ConfigMaps. And I would check whether any CI/CD pipeline logs, deployment scripts, or `kubectl describe`/`get -o yaml` outputs captured in build logs might have inadvertently printed decoded Secret values into a less-protected system (a CI log retained for months, readable by a much broader set of people than the cluster\'s own RBAC would allow) — a genuinely common, easy-to-overlook leak path that bypasses Kubernetes\'s own Secret protections entirely.'
    }
  ]
};
