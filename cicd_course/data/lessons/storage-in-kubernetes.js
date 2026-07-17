window.LESSONS = window.LESSONS || {};
window.LESSONS['storage-in-kubernetes'] = {
  id: 'storage-in-kubernetes',
  title: 'Storage in Kubernetes: PersistentVolumes & Claims',
  category: 'Part 5 — Kubernetes in Practice',
  timeMin: 35,
  summary: 'The Docker-level volumes-and-persistence lesson solved persistence for ONE machine: a named volume survives a container being replaced, as long as the replacement runs on that same machine. Kubernetes breaks that assumption immediately — a replacement Pod can be scheduled onto a COMPLETELY DIFFERENT node, and a Docker named volume, tied to one specific machine\'s disk, would simply not be there. PersistentVolumes and PersistentVolumeClaims are Kubernetes\'s answer: a storage abstraction that follows a Pod\'s replacement across the cluster, not tied to any one specific node the way Docker volumes are tied to one specific machine.',
  goals: [
    'Explain precisely why a Docker-style named volume is insufficient once Pods can be rescheduled across multiple nodes',
    'Distinguish a PersistentVolume (the actual storage resource) from a PersistentVolumeClaim (a Pod\'s request for storage)',
    'Explain what a StorageClass is and how dynamic provisioning removes the need to manually pre-create PersistentVolumes',
    'Mount a PersistentVolumeClaim into a Pod and reason about what happens to its data if that Pod is rescheduled',
    'Identify which of a stateful application\'s directories genuinely need a PersistentVolumeClaim versus which can safely use ephemeral, Pod-local storage'
  ],
  concept: [
    {
      h: 'Why a Docker-style volume is not enough anymore',
      p: [
        'The Docker volumes-and-persistence lesson\'s solution — a named volume that survives a container being removed and recreated — implicitly assumed the replacement container runs on the SAME machine as the original, since a Docker named volume is physically stored on ONE specific host\'s disk. Kubernetes breaks that assumption as a matter of routine operation: when a Deployment replaces a failed Pod (the deployments-and-services lesson\'s core behavior), the scheduler is free to place that replacement Pod on ANY node in the cluster with available capacity — quite possibly a completely different physical machine than the original Pod ran on, with no access whatsoever to that original machine\'s local disk.',
        'This is precisely the gap Kubernetes needs a genuinely different storage abstraction to close: something that provides durable storage a rescheduled Pod can access REGARDLESS of which specific node it lands on, rather than storage tied to one specific machine\'s local disk the way a Docker named volume implicitly is.'
      ]
    },
    {
      h: 'PersistentVolume: the actual storage resource, cluster-wide',
      p: [
        'A <b>PersistentVolume</b> (PV) represents an actual piece of storage available to the CLUSTER as a whole — commonly backed by cloud block storage (an AWS EBS volume, a GCP Persistent Disk) or a network filesystem, deliberately NOT tied to any one specific node\'s local disk, so that whichever node a Pod needing it happens to be scheduled onto, the underlying storage can be attached and made accessible there. This is the storage layer\'s answer to the exact problem the previous section raised: because a PV is not bound to one specific machine, a Pod using it can be rescheduled to a different node and still have that same underlying storage correctly attached wherever it ends up.',
        'A PV is a genuinely cluster-level resource, typically provisioned and managed by a cluster administrator (or, far more commonly in practice, provisioned AUTOMATICALLY — covered two sections below) — an individual application team writing a Deployment does not typically create PVs directly by hand; they request storage through the next object instead.'
      ]
    },
    {
      h: 'PersistentVolumeClaim: a Pod\'s request for storage, decoupled from the specific PV',
      p: [
        'A <b>PersistentVolumeClaim</b> (PVC) is what an application team actually writes — a REQUEST for storage with certain characteristics ("give me 10GB, with these access requirements"), submitted to the API server, which Kubernetes then BINDS to an actual matching PersistentVolume on the requester\'s behalf. A Pod references the PVC (not a specific PV directly) in its volume configuration, and Kubernetes handles finding, binding, and attaching the right underlying PV wherever that Pod ends up being scheduled — the Pod\'s manifest never needs to know or reference specifics about the actual underlying storage implementation at all.',
        'This PVC-to-PV indirection mirrors a pattern this course has now seen several times: exactly like a Deployment finds Pods via label selector rather than hardcoded names, and a Service finds Pods via the same mechanism, a PVC finds its underlying PV through Kubernetes\'s own binding process rather than a Pod manifest needing to reference specific storage details directly — decoupling the REQUEST for a resource from the specific underlying resource actually satisfying it, a recurring Kubernetes design theme worth recognizing by now.'
      ]
    },
    {
      h: 'StorageClass and dynamic provisioning: PVs created automatically, on demand',
      p: [
        'Manually pre-creating an exact PersistentVolume for every single PVC an application might ever request does not scale well operationally — <b>dynamic provisioning</b> solves this: a <b>StorageClass</b> defines HOW to automatically create a new PV on demand (which underlying storage backend to use, what performance tier, and other provisioner-specific settings), and when a PVC references a StorageClass and no existing PV already satisfies it, Kubernetes automatically provisions a brand-new PV that does, with no cluster administrator needing to manually create anything in advance.',
        'In practice, on any modern managed Kubernetes offering (from a cloud provider), a reasonable default StorageClass usually already exists, and most PVCs simply reference it (or rely on a configured DEFAULT StorageClass, requiring no explicit reference at all) — meaning, for most real applications, requesting persistent storage is genuinely just "write a PVC asking for the size and access mode you need," with the entire PV creation and binding process happening automatically and largely invisibly underneath that one request.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Cargo Hold Contract Follows the Shipment, Not One Specific Warehouse',
      text: 'Early on, the crew\'s arrangement with a specific merchant guild meant cargo was always stored in ONE particular warehouse at ONE particular dock — genuinely fine, until the crew needed to redirect an urgent shipment to an entirely different port on short notice, and discovered the arrangement meant nothing at the new location; that specific warehouse\'s storage simply was not there. Robin negotiates a fundamentally different kind of arrangement afterward: a standing CONTRACT with the guild itself, not with one specific building — "guarantee us storage space matching these requirements (this much capacity, kept dry, accessible on short notice), and the guild is responsible for finding and providing SOME warehouse, at whichever port we actually need it, that satisfies that contract." The crew never again needs to know or care about the internal specifics of which literal building is holding their cargo at any given port — only that the CONTRACT\'s requirements are being met, wherever they currently happen to be docked.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Storage-Unit Contract Follows You, Not One Specific Building',
      text: 'When Ross first rents a storage unit for his overflow furniture, he specifically requests "Unit 14 at the Bedford Avenue facility" — genuinely fine, until that exact facility unexpectedly closes for renovations, and he discovers his arrangement was tied to that ONE PHYSICAL BUILDING, not to any actual guarantee of storage generally, leaving him scrambling. Chandler, helping him sort out a replacement, points him toward a fundamentally different kind of contract instead: a standing agreement with the storage COMPANY itself — "guarantee me a unit matching these requirements (this much square footage, climate-controlled), and the company is responsible for providing SOME unit, at whichever of their locations actually has availability, satisfying that requirement." Ross never again needs to care which specific building or which specific unit number is holding his stuff — only that his contract\'s requirements are being met, wherever the company currently has him assigned.'
    },
    why: 'Robin\'s standing guild contract and Chandler\'s storage-company agreement are both a PersistentVolumeClaim: a REQUEST describing what you need (capacity, access requirements), decoupled entirely from any one specific physical location. Kubernetes (like the guild, like the storage company) is responsible for finding or creating an actual PersistentVolume satisfying that request, wherever it is actually needed — exactly why a PVC-backed Pod can be rescheduled to a completely different node and still correctly have its storage available, unlike a Docker volume tied to one specific "warehouse."'
  },
  tech: [
    {
      q: 'Concretely, what happens if a Pod using a Docker-style local-node volume (not a proper PVC) gets rescheduled to a different node after its original node fails?',
      a: 'The replacement Pod starts on the new node with an entirely EMPTY version of whatever was mounted at that path — the original node\'s local disk, and whatever data was written there, is simply inaccessible from the new node, since local storage is physically tied to the specific machine it lives on, with no cluster-level mechanism making it available elsewhere. This is precisely the failure mode PersistentVolumes exist to prevent: a PV backed by proper network-attached or cloud block storage can be attached to WHATEVER node the Pod actually lands on, so the replacement Pod sees the exact same data the original Pod had, correctly, regardless of which specific node it was scheduled onto.'
    },
    {
      q: 'Why does a Pod manifest reference a PersistentVolumeClaim rather than a PersistentVolume directly?',
      a: 'This indirection decouples the APPLICATION\'s storage REQUEST (expressed in a PVC: how much space, what access characteristics) from the actual underlying STORAGE IMPLEMENTATION (a PV, potentially backed by any of several different cloud or network storage systems) — an application team writes a PVC describing requirements in application-relevant terms, without needing to know or specify cloud-provider-specific storage details, and the cluster (via a StorageClass, if using dynamic provisioning) handles matching or creating an actual PV satisfying those requirements. This mirrors the same benefit Deployment/Service label-selector indirection provides: the consumer (a Pod, via its PVC) is insulated from needing to know the specific identity of whatever is actually satisfying its request underneath.'
    },
    {
      q: 'What does a StorageClass\'s "dynamic provisioning" actually automate, and why does that matter operationally at scale?',
      a: 'Without dynamic provisioning, a cluster administrator would need to manually pre-create an exact PersistentVolume, correctly sized and configured, for every single PVC any application team might ever submit — genuinely impractical at any real scale, and it would create an awkward, slow dependency where application teams are blocked waiting on manual PV creation before their own Deployment could actually start. A StorageClass defines the RECIPE for automatically creating a new PV on demand (calling out to the actual cloud/storage backend\'s provisioning API), so when a PVC references a StorageClass and no existing PV already satisfies it, the appropriate PV is created automatically, immediately, as a normal part of that PVC being submitted — removing the manual provisioning step from the application team\'s critical path entirely.'
    }
  ],
  code: {
    title: 'A PVC-backed database, portable across node reschedules',
    intro: 'The Pod template references the PVC by name — it never mentions a specific node, disk, or storage backend at all.',
    code: `# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-storage
spec:
  accessModes:
    - ReadWriteOnce        # readable/writable by one node at a time
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard    # references a StorageClass for dynamic provisioning

---
# deployment.yaml (excerpt)
spec:
  template:
    spec:
      containers:
        - name: postgres
          image: postgres:16
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: db-storage    # references the PVC by NAME, nothing else

$ kubectl apply -f pvc.yaml
persistentvolumeclaim/db-storage created

$ kubectl get pvc db-storage
NAME         STATUS   VOLUME                                     CAPACITY
db-storage   Bound    pvc-a1b2c3d4-...                            10Gi
# ^ "Bound" — Kubernetes automatically provisioned and attached a
#   matching PersistentVolume via the "standard" StorageClass

# If the node this Pod is running on fails, and the Pod is rescheduled:
$ kubectl get pods -o wide
NAME                   NODE
postgres-...-k9j2w     node-3
# ^ the REPLACEMENT pod, now on a DIFFERENT node than the original —
#   but db-storage's underlying PV attaches correctly to node-3 too,
#   since it was never tied to the original node's local disk`,
    notes: [
      '"ReadWriteOnce" is one of several access modes — appropriate for a single-writer database; a workload needing multiple Pods to write the same storage simultaneously would need ReadWriteMany, which not every storage backend supports.',
      'Nothing in the Deployment or Pod template references node-3, a specific disk, or a specific cloud storage volume ID anywhere — that indirection is the entire point.'
    ]
  },
  lab: {
    title: 'Write a PVC and mount it into a Pod',
    prompt: 'Write a PersistentVolumeClaim named "uploads-storage" requesting 5Gi with ReadWriteOnce access, using StorageClass "standard". Then write a Pod volumeMounts/volumes excerpt mounting it at /app/uploads inside a container.',
    starter: `# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ???
spec:
  accessModes:
    - ???
  resources:
    requests:
      storage: ???
  storageClassName: ???

# Pod excerpt:
      volumeMounts:
        - name: uploads
          mountPath: ???
      volumes:
        - name: uploads
          persistentVolumeClaim:
            claimName: ???
`,
    checks: [
      { re: 'name:\\s*uploads-storage', flags: 'i', must: true, hint: 'metadata.name: uploads-storage', pass: 'PVC name ✓' },
      { re: 'ReadWriteOnce', flags: 'i', must: true, hint: 'accessModes: [ReadWriteOnce]', pass: 'ReadWriteOnce ✓' },
      { re: 'storage:\\s*5Gi', flags: 'i', must: true, hint: 'resources.requests.storage: 5Gi', pass: 'storage: 5Gi ✓' },
      { re: 'storageClassName:\\s*standard', flags: 'i', must: true, hint: 'storageClassName: standard', pass: 'storageClassName: standard ✓' },
      { re: 'mountPath:\\s*/app/uploads', flags: 'i', must: true, hint: 'volumeMounts[0].mountPath: /app/uploads', pass: 'mountPath ✓' },
      { re: 'claimName:\\s*uploads-storage', flags: 'i', must: true, hint: 'volumes[0].persistentVolumeClaim.claimName: uploads-storage', pass: 'claimName ✓' }
    ],
    run: 'Try it for real: kubectl apply -f pvc.yaml, then kubectl get pvc uploads-storage to confirm it reaches Bound status.',
    solution: `# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uploads-storage
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard

# Pod excerpt:
      volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      volumes:
        - name: uploads
          persistentVolumeClaim:
            claimName: uploads-storage`,
    notes: [
      'The volume name ("uploads") only needs to match BETWEEN volumeMounts and volumes in the same Pod spec — it has no relationship to the PVC\'s own name.',
      'claimName is the only place the PVC\'s actual name (uploads-storage) is referenced — the Pod never mentions a PersistentVolume or storage backend directly.'
    ]
  },
  quiz: [
    {
      q: 'Why is a Docker-style named volume insufficient once a Pod can be rescheduled onto a different node?',
      options: ['Docker volumes are too slow for Kubernetes', 'A Docker named volume is physically tied to one specific machine\'s disk — a Pod rescheduled to a different node would have no access to it at all', 'Kubernetes does not support any form of persistent storage', 'Named volumes only work with certain container images'],
      correct: 1,
      explain: 'Local, single-machine storage cannot follow a Pod across nodes — exactly the gap PersistentVolumes, backed by cluster-wide-accessible storage, are designed to close.'
    },
    {
      q: 'What is the relationship between a PersistentVolumeClaim (PVC) and a PersistentVolume (PV)?',
      options: ['They are the same object with two different names', 'A PVC is a request for storage with certain characteristics; Kubernetes binds it to an actual matching PV, decoupling the request from the specific underlying storage resource', 'A PV is created by an application team; a PVC is created by a cluster administrator', 'PVCs are only used for temporary, non-persistent storage'],
      correct: 1,
      explain: 'A PVC expresses a storage requirement; Kubernetes finds or provisions a PV to satisfy it — the Pod only ever references the PVC, never the PV directly.'
    },
    {
      q: 'What does a StorageClass\'s dynamic provisioning automate?',
      options: ['Automatically deleting old PersistentVolumes', 'Automatically creating a new PersistentVolume on demand when a PVC references it and no existing PV already satisfies the request', 'Automatically backing up all cluster data daily', 'Automatically compressing stored data'],
      correct: 1,
      explain: 'Dynamic provisioning removes the need to manually pre-create PVs — a StorageClass defines how to create one automatically whenever a PVC needs it.'
    },
    {
      q: 'If a PVC-backed Pod is rescheduled to a different node after the original node fails, what happens to its data?',
      options: ['The data is lost, since it was tied to the original node', 'The underlying PersistentVolume, not being tied to any one specific node, attaches correctly to whichever node the replacement Pod lands on — the data remains accessible', 'The Pod must be manually reconfigured with the new node\'s IP address', 'Kubernetes automatically copies the data to a backup location first'],
      correct: 1,
      explain: 'PVs are deliberately not tied to one node\'s local disk, so a rescheduled Pod\'s PVC binds correctly to the same underlying storage regardless of which node it now runs on.'
    },
    {
      q: 'Why does the PVC-to-PV indirection mirror the label-selector pattern seen in Deployments and Services?',
      options: ['It does not — they are unrelated mechanisms', 'Both decouple a REQUEST or REFERENCE from the specific underlying resource satisfying it, letting Kubernetes handle the matching/binding rather than hardcoding specific identities', 'PVCs actually use label selectors internally, identical to Deployments', 'This is a coincidental naming similarity with no architectural connection'],
      correct: 1,
      explain: 'This is a recurring Kubernetes design theme: requests/selectors reference desired characteristics, and Kubernetes handles binding them to whatever specific resource currently satisfies them.'
    }
  ],
  pitfalls: [
    'Assuming a Pod\'s locally-mounted storage (not a proper PVC) will survive that Pod being rescheduled to a different node — it will not; only a genuine PersistentVolume, not tied to one node, survives a reschedule.',
    'Using a PersistentVolumeClaim for every single directory a container writes to, including genuinely disposable, regeneratable data — not everything needs persistent storage, exactly as the Docker-level volumes lesson established.',
    'Forgetting that ReadWriteOnce access mode means only ONE node can mount the volume at a time — attempting to scale a ReadWriteOnce-backed Deployment to multiple replicas needing simultaneous write access to the same volume will fail or behave unexpectedly.'
  ],
  interview: [
    {
      q: 'Explain why Kubernetes needed to introduce PersistentVolumes and PersistentVolumeClaims as new concepts, rather than simply extending Docker\'s existing named-volume mechanism.',
      a: 'Docker\'s named volumes solve persistence within the scope of ONE machine — a volume survives a container being replaced, as long as the replacement runs on that same host\'s disk. Kubernetes fundamentally breaks that single-machine assumption: a Deployment\'s replacement Pod can be scheduled onto ANY node in the cluster with available capacity, and a Docker-style local volume would simply be unreachable from a different node. PersistentVolumes solve this by representing storage that is not tied to one specific node — commonly backed by network-attached or cloud block storage that can be attached to whichever node actually needs it — and PersistentVolumeClaims let an application request that kind of cluster-portable storage declaratively, the same way it requests any other Kubernetes resource, rather than needing a fundamentally different, node-specific mechanism.'
    },
    {
      q: 'A stateful application\'s Pod keeps losing its data every time it gets rescheduled after a node failure, even though the team believes they configured persistent storage correctly. What would you check first?',
      a: 'I would first check whether the Pod is actually using a PersistentVolumeClaim-backed volume at all, or whether it is (perhaps mistakenly, copied from a Docker-era example) using an `emptyDir` or a node-local `hostPath` volume — both of these ARE valid Kubernetes volume types, but neither survives a Pod being rescheduled to a different node, since emptyDir is explicitly Pod-lifetime-scoped and hostPath is explicitly tied to one specific node\'s local filesystem, functioning much like a Docker bind mount rather than a genuine cluster-portable PersistentVolume. If a proper PVC is genuinely being used, I would next check `kubectl get pvc` for its actual bound status and access mode, and confirm the underlying StorageClass\'s provisioner genuinely supports being attached across different nodes (a misconfigured or node-local-only storage backend, despite being wrapped in a PV/PVC, can still effectively behave like node-local storage if the underlying implementation does not actually support cross-node attachment).'
    },
    {
      q: 'Why would a team choose ReadWriteOnce over ReadWriteMany for a database\'s storage, given that ReadWriteMany sounds like it supports more flexibility?',
      a: 'ReadWriteOnce (mountable read-write by exactly one node at a time) is the CORRECT and safer choice for a typical relational database specifically because most such databases are not designed to have multiple independent processes writing directly to the same underlying data files simultaneously without severe data corruption risk — a single-writer model is what the database\'s own internal consistency guarantees assume. ReadWriteMany (multiple nodes mounting simultaneously) is intended for genuinely different use cases — a shared file store multiple Pods need to read and write concurrently, where the application-level logic (not database internals) safely coordinates concurrent access, or a storage backend and application specifically designed for concurrent multi-writer access. Choosing ReadWriteMany for a standard single-writer database would not add safe flexibility — it would create a real risk of data corruption if multiple replicas somehow ended up writing to the same underlying files without the database\'s own coordination expecting that.'
    },
    {
      q: 'How would you decide, for a new stateful application being deployed to Kubernetes, which of its directories need a PersistentVolumeClaim versus which can safely use ephemeral, Pod-local storage?',
      a: 'The deciding question is identical in spirit to the Docker-level volumes lesson\'s guidance, just applied at the Kubernetes layer: does this specific directory hold data the application genuinely cannot regenerate or afford to lose across a Pod replacement (a database\'s actual data files, persistently uploaded user content) — if so, it needs a PVC. Does it hold genuinely disposable, regeneratable, or short-lived data (temporary processing files, an in-memory cache\'s disk spillover, build artifacts recreated on every startup) — if so, an `emptyDir` (Pod-lifetime-scoped, no PVC needed) is appropriate and avoids the real operational overhead (provisioning, backup strategy, storage cost) that unnecessary PersistentVolumeClaims add. I would go through the application\'s actual directory structure explicitly with this question, rather than defaulting to either "PVC everything" or "PVC nothing" as a blanket policy.'
    }
  ]
};
