window.LESSONS = window.LESSONS || {};
window.LESSONS['volumes-and-persistence'] = {
  id: 'volumes-and-persistence',
  title: 'Volumes: Making Data Outlive the Container',
  category: 'Part 3 — Multi-Container Apps',
  timeMin: 30,
  summary: 'The images-vs-containers lesson established that a container\'s writable layer is disposable — deleted along with the container. For a stateless web server, that is fine; for a database, it is catastrophic, since it means every restart or redeploy would silently wipe all stored data. Volumes are Docker\'s answer: storage that exists OUTSIDE any one container\'s lifecycle, mounted INTO a container, surviving that container being stopped, removed, and replaced entirely — the mechanism that makes running anything genuinely stateful in Docker actually viable.',
  goals: [
    'Explain precisely why a container\'s writable layer is the wrong place for data that needs to survive',
    'Distinguish named volumes from bind mounts and know when each is the right choice',
    'Mount a volume into a container and confirm data survives the container being removed and recreated',
    'Explain why a bind mount is the right choice for local development but the wrong one for production data',
    'Identify a container that should be treated as stateful and reason about what volume(s) it needs'
  ],
  concept: [
    {
      h: 'Recap: why the writable layer alone is not enough for real data',
      p: [
        'A container\'s writable layer, from the images-vs-containers lesson, is created fresh with every `docker run` and destroyed permanently when that specific container is removed — genuinely fine for temporary files, logs meant to be ephemeral, or anything the application can safely regenerate. For a database\'s actual stored rows, a user-uploaded file, or any data representing real, non-regenerable state, losing it on every container replacement (a crash restart, a routine image update, a redeploy to a new version) is not an inconvenience, it is data loss — and "the database container got replaced with a newer image" is an extremely routine, frequent event in any actively maintained system, not a rare edge case.',
        'This is precisely the gap volumes close: a VOLUME is storage managed by Docker (or, for a bind mount, a specific host directory) that exists independently of any one container\'s lifecycle, and a container MOUNTS a volume at a specific path inside its filesystem — anything written to that path is written to the volume, not to the container\'s own disposable writable layer, and survives exactly as long as the volume itself does, regardless of what happens to the container mounting it.'
      ]
    },
    {
      h: 'Named volumes: Docker-managed, the right default for real data',
      p: [
        'A named volume (`docker volume create my-data`, or created implicitly via `docker run -v my-data:/path/in/container`) is storage that Docker itself creates and manages, typically living under Docker\'s own storage directory on the host, with a name you choose to reference it by. This is the right default for data a production service actually depends on: Docker manages the underlying storage details, the volume persists independently of any container (surviving `docker rm` on the container that was using it), and a NEW container can mount the SAME named volume later and immediately see exactly the data a previous container left there — this is precisely how a database container can be replaced with an updated image while retaining every row it had before the replacement.',
        '`docker volume ls` lists volumes that exist independently of any currently-running container; `docker volume rm` deletes one explicitly — volumes are NOT automatically deleted when a container that used them is removed (a deliberate safety default, since accidentally destroying persisted data alongside a routine container replacement would be a genuinely serious failure mode), though `docker run --rm -v` combined with certain flags can opt into more aggressive cleanup when that is genuinely intended.'
      ]
    },
    {
      h: 'Bind mounts: mapping a specific host path in, mainly for development',
      p: [
        'A bind mount (`docker run -v /exact/host/path:/path/in/container`) maps a SPECIFIC, already-existing directory on the HOST machine directly into the container, rather than letting Docker manage the storage location — the container sees, and can modify, the exact files sitting at that host path, live, in both directions. This is genuinely powerful for LOCAL DEVELOPMENT specifically: bind-mounting your actual source code directory into a container running a dev server means editing a file on your host machine is immediately visible inside the running container, without needing to rebuild the image or restart the container for every single code change.',
        'Bind mounts are a poor fit for PRODUCTION data specifically because they tie a container tightly to one exact host filesystem path and layout — a bind-mounted container cannot simply be moved to run on a different machine (a routine event in any real deployment, and especially once Kubernetes, covered starting Part 4, is scheduling containers across a cluster of machines) without that exact path existing, populated correctly, on the NEW machine too. Named volumes have no such constraint, since Docker (or, in Kubernetes, the cluster\'s own storage layer) manages exactly where the underlying data actually lives.'
      ]
    },
    {
      h: 'Choosing between them, and the pattern that combines both',
      p: [
        'A practical, common local-development pattern for a database: use a NAMED volume for the database\'s actual data directory (so data survives container restarts and image updates cleanly, exactly as production would want), while a web application\'s SOURCE CODE, being actively edited during development, is often bind-mounted for live-reload convenience — a decision made per-mount, on a container-by-container and path-by-path basis, not an all-or-nothing choice for an entire application.',
        'The general rule of thumb worth internalizing: reach for a NAMED volume by default for anything that is genuinely DATA the application depends on and cannot regenerate (database files, uploaded user content); reach for a BIND MOUNT specifically when you want a container to see and interact with a specific, already-existing set of files on your own development machine, most commonly your own source code during active local development — and be deliberate about which one a given container\'s given mount actually needs, since choosing the wrong one for the wrong reason is a common, avoidable source of both lost-data and "why isn\'t my code change showing up" frustrations.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Ship\'s Log Survives Even When a Crew Member Leaves',
      text: 'The Sunny keeps its official ship\'s log in a dedicated, permanently mounted logbook cabinet, built directly into the ship\'s own structure — genuinely separate from any one crew member\'s personal quarters. Crew members come and go over the voyage (temporary allies joining for an arc, someone recovering ashore for a stretch), and each one, while aboard, can read from and write into that shared logbook — but crucially, the logbook itself is not tied to any ONE crew member\'s presence: if a temporary ally who had been actively updating the log during their time aboard eventually leaves the crew, the log they wrote stays exactly where it was, in the ship\'s own cabinet, fully intact, immediately readable by whoever comes aboard next. Nami is characteristically clear about why this separation matters, explaining it to a new short-term ally confused about where to record something: "your OWN cabin\'s belongings leave when you do — that\'s yours. The ship\'s log stays with the SHIP, no matter who\'s currently aboard, because the log was never actually about any one person being here."'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Apartment\'s Shared Photo Album Survives a Roommate Moving Out',
      text: 'Monica\'s apartment keeps one shared photo album on the coffee table — genuinely communal, added to by whoever is currently living there or visiting regularly, holding years of accumulated memories that predate and outlast any one specific roommate\'s tenancy. Roommates come and go over the years (Rachel moving in, various short-term arrangements, people moving out for new jobs or relationships) — and whoever is currently living there can add photos to it, flip through it, genuinely use it as their own while they are there. But when a roommate eventually moves out, taking their own personal boxes and belongings with them, the shared album stays exactly where it was, on the coffee table, completely intact, with every photo anyone ever added to it still there for whoever moves in next. Monica, explaining the household\'s unwritten rule to a new roommate on their very first day, draws the line plainly: "your own room\'s stuff is yours, and it leaves with you. The album stays with the APARTMENT — it was never really about any one roommate being here."'
    },
    why: 'The ship\'s log cabinet and the coffee-table photo album are both storage that outlives any one temporary occupant — exactly a named Docker volume, which persists independently of whichever specific container happens to currently be mounting it. A crew member\'s own cabin (or a roommate\'s own room) that leaves WITH them when they go is the container\'s disposable writable layer — genuinely theirs while they are there, genuinely gone the moment they leave.'
  },
  tech: [
    {
      q: 'Why does removing a container that was using a named volume NOT delete the volume itself, and is this the right default?',
      a: 'Docker deliberately decouples a volume\'s lifecycle from any one container\'s lifecycle — a volume is an independent object, created and destroyed by its own explicit commands (`docker volume create`/`docker volume rm`), not implicitly tied to whichever container most recently mounted it. This is the right default specifically because containers are routinely removed and replaced as an entirely normal part of operating a system (image updates, crash recovery, scaling), and if removing a container automatically destroyed any data it had been using, that would make every routine container replacement a potential data-loss event — the explicit, separate volume-removal step exists specifically to require a deliberate, intentional action before persisted data is actually destroyed.'
    },
    {
      q: 'Concretely, what makes a bind mount tightly coupled to a specific machine in a way a named volume is not?',
      a: 'A bind mount references an EXACT host filesystem path (`/Users/alice/project/src`, `/home/deploy/data`), which is meaningful only on the specific machine where that exact path exists and is populated correctly — moving the container to run on a different machine (a different laptop, a different production server, or, once Kubernetes enters the picture, a different node in a cluster) means that exact path likely does not exist there, or exists with different, unrelated content. A named volume, by contrast, is referenced purely by NAME, with Docker (or the cluster\'s storage layer) responsible for resolving that name to wherever the actual underlying storage lives — the container\'s configuration itself never hardcodes a specific host path at all, which is precisely what makes it portable across machines in a way a bind mount structurally cannot be.'
    },
    {
      q: 'Why is bind-mounting source code for live-reload development a fundamentally different use case than using a named volume for a database\'s data directory, even though both use the `-v` flag?',
      a: 'The bind-mount case is fundamentally about REACHING INTO an already-existing, actively-edited set of files on the host — the actual point is that a human is editing those files directly with their own local editor, and the container should see those exact live edits reflected immediately, with the host filesystem serving as the genuine source of truth. The named-volume case for a database is about PERSISTING data the CONTAINER itself generates and manages internally, with no human directly hand-editing individual files on the host — the actual point is durability across container replacement, not live human editing of the underlying files, and the specific host location of that data is deliberately left as an implementation detail Docker manages, precisely because no human needs to reach in and touch those files directly the way they do with bind-mounted source code.'
    }
  ],
  code: {
    title: 'A named volume surviving container removal, observed directly',
    intro: 'A transcript proving data written by one container instance is still there for a completely different, freshly-created container instance.',
    code: `$ docker volume create db-data

$ docker run -d --name db-v1 -v db-data:/var/lib/postgresql/data postgres:16
$ docker exec db-v1 psql -U postgres -c "CREATE TABLE notes (text TEXT);"
$ docker exec db-v1 psql -U postgres -c "INSERT INTO notes VALUES ('hello');"

$ docker stop db-v1 && docker rm db-v1
# ^ the CONTAINER is completely gone now — its writable layer deleted

$ docker run -d --name db-v2 -v db-data:/var/lib/postgresql/data postgres:16
# ^ a BRAND NEW container, but mounting the SAME named volume

$ docker exec db-v2 psql -U postgres -c "SELECT * FROM notes;"
 text
-------
 hello
(1 row)
# ^ the data survived — it was never in db-v1's writable layer at all,
#   it was in the "db-data" volume, independent of either container

# Contrast: a bind mount for local source-code live-reload
$ docker run -d --name dev-app -v $(pwd)/src:/app/src my-dev-image
# ^ /app/src inside the container IS $(pwd)/src on the host, live,
#   in both directions — edit a file locally, see it change instantly inside`,
    notes: [
      'db-v1 and db-v2 are genuinely different containers (different container IDs) — only the volume, referenced by name, is the same object across both.',
      'The bind-mount example uses an absolute host path ($(pwd)/src) rather than a Docker-managed name — that distinction IS the named-volume-vs-bind-mount difference in practice.'
    ]
  },
  lab: {
    title: 'Choose named volume or bind mount for each case',
    prompt: 'For each scenario, write whether a NAMED VOLUME or a BIND MOUNT is the more appropriate choice, and the docker run -v flag you would use (using placeholder names/paths as needed).',
    starter: `# Scenario 1: A production Postgres database's data directory,
# needs to survive container restarts and image updates
# Choice: ??? | flag: -v ???

# Scenario 2: Local development — editing React source code on your laptop
# and wanting a running dev-server container to reflect changes instantly
# Choice: ??? | flag: -v ???

# Scenario 3: A production Redis cache used only for ephemeral session data
# that is fine to lose on restart (data is a cache, easily regenerated)
# Choice: ??? | flag: -v ??? (or explain why NEITHER is needed)
`,
    checks: [
      { re: 'scenario\\s*1[\\s\\S]*named\\s*volume', flags: 'i', must: true, hint: 'Scenario 1 (production DB data) should use a NAMED VOLUME.', pass: 'Scenario 1: named volume ✓' },
      { re: 'scenario\\s*2[\\s\\S]*bind\\s*mount', flags: 'i', must: true, hint: 'Scenario 2 (local dev live-reload) should use a BIND MOUNT.', pass: 'Scenario 2: bind mount ✓' },
      { re: '-v\\s+[\\w-]+:/var/lib/postgresql/data', flags: 'i', must: true, hint: 'Scenario 1 flag: -v db-data:/var/lib/postgresql/data (a NAME, not a host path)', pass: 'Scenario 1 flag ✓' },
      { re: '-v\\s+\\$\\(pwd\\)|-v\\s+/[\\w./]+:/app', flags: 'i', must: true, hint: 'Scenario 2 flag: -v $(pwd)/src:/app/src (an actual host path)', pass: 'Scenario 2 flag ✓' }
    ],
    run: 'Try it for real: run a Postgres container with a named volume, insert data, remove and recreate the container, and confirm the data is still there.',
    solution: `# Scenario 1: A production Postgres database's data directory,
# needs to survive container restarts and image updates
# Choice: NAMED VOLUME | flag: -v db-data:/var/lib/postgresql/data

# Scenario 2: Local development — editing React source code on your laptop
# and wanting a running dev-server container to reflect changes instantly
# Choice: BIND MOUNT | flag: -v $(pwd)/src:/app/src

# Scenario 3: A production Redis cache used only for ephemeral session data
# that is fine to lose on restart (data is a cache, easily regenerated)
# Choice: NEITHER — no volume needed at all. The container's own writable
# layer (or no persistence at all) is appropriate, since losing this data
# on restart is explicitly acceptable and even expected for a pure cache.`,
    notes: [
      'Scenario 3 is deliberately included to reinforce that volumes are not a default "always use one" — they solve a specific problem (surviving container replacement) that does not apply to genuinely disposable data.',
      'Notice scenario 1\'s flag uses a NAME (db-data) while scenario 2\'s uses an actual HOST PATH ($(pwd)/src) — that distinction is exactly what makes one a named volume and the other a bind mount.'
    ]
  },
  quiz: [
    {
      q: 'Why is a container\'s own writable layer the wrong place for a database\'s actual data?',
      options: ['Writable layers are read-only and cannot store data at all', 'The writable layer is deleted when the container is removed, and container replacement (updates, crash recovery) is a routine, frequent event — meaning the data would be routinely lost', 'Writable layers have a hard size limit of a few megabytes', 'Databases are technically incapable of writing to a writable layer'],
      correct: 1,
      explain: 'A container\'s writable layer is disposable, tied to that one container\'s lifecycle. Real data needs to survive routine container replacement, which volumes provide and the writable layer does not.'
    },
    {
      q: 'What happens to a named volume when the container that was using it is removed with `docker rm`?',
      options: ['The volume is automatically deleted along with the container', 'The volume persists independently — it must be explicitly removed with a separate docker volume rm command', 'The volume becomes read-only', 'The volume\'s data is moved to the image itself'],
      correct: 1,
      explain: 'Volumes are decoupled from any one container\'s lifecycle by design — removing a container never implicitly destroys a volume it was using.'
    },
    {
      q: 'Why is a bind mount a poor fit for production data, even though it works fine functionally?',
      options: ['Bind mounts are always slower than named volumes', 'A bind mount ties the container to an exact host filesystem path, making it difficult to move the container to run on a different machine', 'Bind mounts cannot store more than 1GB of data', 'Bind mounts are deprecated and no longer supported'],
      correct: 1,
      explain: 'Bind mounts hardcode a specific host path, which breaks portability across machines — a real concern once containers are deployed across a cluster.'
    },
    {
      q: 'What is the primary use case a bind mount is genuinely well-suited for?',
      options: ['Storing a production database\'s permanent data', 'Local development, where you want a container to see live edits to source code files on your own machine immediately', 'Long-term archival storage', 'Sharing data between two unrelated production clusters'],
      correct: 1,
      explain: 'Bind mounts shine specifically when a human is actively editing files on the host and wants those live changes reflected inside a running container immediately.'
    },
    {
      q: 'A Redis cache stores ephemeral session data that is explicitly fine to lose on restart. What is the appropriate volume strategy?',
      options: ['A named volume is mandatory for any database-like container', 'A bind mount to ensure maximum development flexibility', 'Neither a named volume nor a bind mount is needed — the data is explicitly disposable, matching the container\'s own writable layer', 'Two named volumes for redundancy'],
      correct: 2,
      explain: 'Volumes solve the specific problem of surviving container replacement. When data loss on restart is explicitly acceptable, no volume is needed at all.'
    }
  ],
  pitfalls: [
    'Running a production database with no volume at all, only discovering the writable-layer data-loss problem the first time the container needs to be replaced or restarted.',
    'Using a bind mount for production data because it "worked in development," without accounting for the machine-portability problem that only surfaces once deployment moves beyond one fixed machine.',
    'Assuming `docker rm` on a container automatically cleans up any volumes it used — it does not, which is usually desirable, but can also lead to orphaned, forgotten volumes silently consuming disk space over time.'
  ],
  interview: [
    {
      q: 'Explain why Docker volumes exist as a separate concept from a container\'s own filesystem, rather than simply making container filesystems permanent by default.',
      a: 'Containers are DESIGNED to be disposable and replaceable — that disposability (easy to stop, remove, recreate from an updated image) is a deliberate, valuable property, not an oversight, and it is exactly what makes rolling updates, crash recovery, and scaling practical. If container filesystems were permanent by default, every container would need special handling to safely replace, since routine operations (deploying a new image version) would risk destroying whatever state had accumulated in that container\'s filesystem. Volumes solve this by explicitly separating "the container\'s own disposable execution environment" from "data that needs to genuinely persist," letting containers stay cheaply disposable while STILL supporting real, durable, stateful workloads — the two concerns are independent, and conflating them would undermine the disposability that makes containers useful in the first place.'
    },
    {
      q: 'A team\'s local development setup uses a bind mount for their production Postgres data directory, copied verbatim from a tutorial, and it has "worked fine" in development. What specific problems would you expect once this same approach is used to actually deploy to a real production environment (especially once Kubernetes is involved)?',
      a: 'The core problem is the bind mount\'s hardcoded host path, which assumes the container will always run on the SAME specific machine with that exact path present and correctly populated — a reasonable assumption on one developer\'s laptop, but one that breaks down immediately once deployment involves multiple machines or an orchestrator (Kubernetes) that can schedule a Pod onto ANY node in a cluster. If the database Pod gets rescheduled onto a different node (a routine event — node failure, cluster rebalancing, a rolling node upgrade), the bind-mounted path would not exist on that new node at all, or would exist with unrelated content, effectively causing data loss or a failed startup. The correct production approach is a named volume backed by proper persistent storage (this course\'s Kubernetes storage lesson covers PersistentVolumes specifically), which Kubernetes can correctly attach to the database Pod regardless of which node it actually ends up running on.'
    },
    {
      q: 'How would you decide, for a new containerized service you are designing, which of its data needs a volume at all, and which can safely live in the container\'s own writable layer?',
      a: 'The deciding question is whether the data represents something the application genuinely CANNOT regenerate or afford to lose — a database\'s stored rows, user-uploaded files, anything representing real accumulated state — versus something that is either fully derivable from other sources or explicitly acceptable to lose (a cache that can be rebuilt from the source of truth, temporary processing files, session data with a short, acceptable expiry). For the former, I would use a named volume (or, in Kubernetes, a PersistentVolumeClaim) specifically scoped to that data\'s actual path, keeping everything else in the container\'s ordinary, disposable writable layer — deliberately avoiding the instinct to volume-mount everything "just in case," since unnecessary volumes add real operational complexity (backup strategy, storage provisioning, migration handling) without a corresponding benefit for data that was never going to matter if lost.'
    },
    {
      q: 'What would you check first if a container using a named volume appears to have "lost" its data after a redeploy?',
      a: 'First, confirm the redeploy actually referenced the SAME volume name as before — a genuinely common cause is a typo, a renamed environment variable, or an updated deployment script that inadvertently created or referenced a DIFFERENT volume name, which would appear from the application\'s perspective as "my data is gone" when in fact the old volume, with the old data fully intact, still exists under its original name, just no longer mounted by anything. `docker volume ls` would immediately reveal whether the expected volume still exists (ruling in or out actual deletion) and whether an unexpected second volume was created alongside it — the fix, if this is the cause, is correcting the volume name reference back to the original, not attempting to somehow "recover" data that was never actually deleted, just orphaned under its original, no-longer-referenced name.'
    }
  ]
};
