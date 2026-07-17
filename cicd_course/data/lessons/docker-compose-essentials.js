window.LESSONS = window.LESSONS || {};
window.LESSONS['docker-compose-essentials'] = {
  id: 'docker-compose-essentials',
  title: 'Docker Compose: Your Whole Stack, One File, One Command',
  category: 'Part 3 — Multi-Container Apps',
  timeMin: 40,
  summary: 'Everything Part 3 has covered so far — networking two containers together, giving one a persistent volume — has been done with individual, hand-typed `docker run` commands, one per container, each with several flags to remember and get right, every single time. Docker Compose collapses that entire multi-container setup into ONE declarative YAML file and ONE command (`docker compose up`) that creates the network, starts every service, and wires up every volume automatically — the natural capstone of everything Part 3 has built toward, and the tool most real local-development setups actually use day to day.',
  goals: [
    'Write a docker-compose.yml defining multiple services, a network, and a volume',
    'Explain what docker compose up actually does under the hood, in terms of the individual docker commands it replaces',
    'Use service names for inter-container communication in a Compose file, without manually creating a network',
    'Explain the difference between `docker compose up` and `docker compose up -d`, and between stopping and removing a Compose stack',
    'Recognize the scale boundary where Compose stops being sufficient and Kubernetes becomes necessary'
  ],
  concept: [
    {
      h: 'What docker-compose.yml actually declares',
      p: [
        'A `docker-compose.yml` file declares, in one place, EVERY service (container) that makes up an application stack, each with its own image (or `build:` instructions to build one), ports to publish, environment variables, volumes to mount, and — this is the part that ties everything in this Part together — a `depends_on` relationship expressing which services need which others. Compose reads this ONE file and translates it into the exact same underlying Docker operations covered so far in this Part: creating a network, starting each container with the right flags, attaching each to that network, and mounting whatever volumes were declared — it introduces no new underlying mechanism, it is a declarative, single-command interface OVER the exact primitives already covered.',
        'This is precisely why everything from the previous three lessons transfers directly: services in a Compose file reach each other by SERVICE NAME (the docker-networking lesson\'s DNS-based discovery, working automatically because Compose creates a user-defined network for the whole stack by default), and a `volumes:` section at the top level declares NAMED volumes exactly like `docker volume create` did, just declared alongside everything else instead of run as a separate command.'
      ]
    },
    {
      h: '`docker compose up`: one command, several containers, correctly wired',
      p: [
        '`docker compose up` (from the directory containing `docker-compose.yml`) reads the file and, for every service declared, creates the shared network (if it does not already exist), starts a container for that service with its declared image/build/ports/environment/volumes, and attaches it to that shared network — accomplishing in one command exactly what would otherwise be a sequence of several individual `docker network create` and `docker run` commands, each needing to be typed correctly, in the right order, every single time the stack needs to start.',
        '`docker compose up` (no `-d`) runs in the FOREGROUND, streaming every service\'s logs interleaved in one terminal — genuinely useful for actively watching what a multi-service stack is doing during development. `docker compose up -d` runs detached, exactly like `docker run -d`, returning your terminal immediately while everything keeps running in the background — the more common choice once you are confident the stack starts correctly and just want it running.'
      ]
    },
    {
      h: 'Stopping vs. removing a Compose stack',
      p: [
        '`docker compose stop` stops every service\'s containers (gracefully, via SIGTERM, exactly like `docker stop`) without removing them — the containers, network, and any volumes all remain, ready to be started again quickly with `docker compose start`. `docker compose down` goes further: it stops AND removes the containers and the network Compose created, though by default it deliberately does NOT remove named volumes, preserving persisted data (like a development database\'s contents) across a `down`/`up` cycle — exactly the volumes-and-persistence lesson\'s "removing a container does not delete its volume" behavior, extended to the whole stack at once.',
        '`docker compose down -v` additionally removes volumes declared in the file — a genuinely destructive operation for anything containing real data, worth treating with the same deliberate caution as `docker volume rm` on any individual volume, and a common, avoidable mistake is reaching for `down -v` out of habit (perhaps copied from a tutorial or a "clean slate" script) without registering that it discards persisted data, not just running containers.'
      ]
    },
    {
      h: 'Where Compose stops being enough',
      p: [
        'Docker Compose is explicitly a SINGLE-MACHINE tool — every service in a `docker-compose.yml` runs as a container on the ONE machine `docker compose up` was run on, with no built-in concept of spreading services across multiple machines, no automatic recovery if that one machine goes down entirely, and no built-in mechanism for running multiple REPLICAS of a service load-balanced across several machines for either reliability or scale. This is not a missing feature to be added later — it is a genuinely different scope of problem than Compose was designed to solve, which is exactly the gap this course\'s very first lesson identified Kubernetes (starting Part 4) as existing specifically to close.',
        'The practical, honest guidance: Compose is an excellent, genuinely production-appropriate choice for a small application that comfortably fits on one machine, and it remains the standard tool for LOCAL DEVELOPMENT of even much larger, ultimately-Kubernetes-deployed applications, since spinning up a full multi-service dev environment with one command is exactly what Compose is best at, regardless of how the same application is eventually deployed to production.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'One Departure Order Instead of Shouting Ten Separate Commands',
      text: 'Getting the Sunny underway used to mean Nami shouting a sequence of individual commands, one at a time, to different crew members — "Usopp, sails!" then "Franky, engine!" then "Zoro, anchor!" — correctly, in the right order, every single departure, with real room for someone missing a call or the order getting garbled in the chaos of an actual urgent departure. Once the crew settles into a more established routine, Nami instead writes and posts one single "DEPARTURE ORDER" note in the galley — listing every single station\'s job in one place, all at once — and calling "Departure Order, go!" triggers every crew member checking that same one posted list and doing their own already-known part, correctly, without Nami needing to individually shout each instruction in real time. The actual set of tasks did not change even slightly — sails still need raising, the engine still needs starting, the anchor still needs lifting — only the INTERFACE changed, from "shout ten separate commands correctly, in order, every time" to "post one list, say one word, and everyone\'s already-known job happens correctly together."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'One Group Text Instead of Ten Separate Phone Calls',
      text: 'Organizing the group\'s regular game night used to mean Sheldon individually calling Leonard, then Howard, then Raj, then Penny, one at a time, each with the exact same information repeated fresh every single week — genuinely tedious, and prone to someone getting called last, forgetting a detail, or the calls happening in a slightly different order producing a slightly different, confusing outcome each time. Amy eventually sets up one single group text thread instead — every relevant detail (time, location, whose turn to bring snacks) posted ONCE, to everyone simultaneously, with one message. The actual content of what needs to happen is completely unchanged — Leonard still needs to know the time, Howard still needs to know to bring snacks — only the INTERFACE changed, from "several separate, individually-executed calls, in some order" to "one message, sent once, reaching everyone who needs it at the same time, correctly."'
    },
    why: 'The posted Departure Order and the group text both replace SEVERAL separate, individually-executed instructions with ONE declared list that everyone acts on together, correctly, without needing to be individually walked through step by step every time. That is exactly `docker-compose.yml` plus `docker compose up`: the same underlying `docker run`/`docker network create` operations from earlier lessons in this Part, just declared once, together, in one file, and triggered with one command instead of several separately-typed ones.'
  },
  tech: [
    {
      q: 'When two services in a docker-compose.yml reference each other by service name (e.g., an app service configured with DATABASE_HOST=db), what is actually making that resolve correctly, under the hood?',
      a: 'Exactly the mechanism the docker-networking lesson covered: Compose automatically creates a user-defined network for the entire stack (by default, named after the project directory) and attaches every declared service\'s container to it, which activates Docker\'s embedded DNS server for that network. The service name `db` in the Compose file becomes the CONTAINER name Compose assigns that service\'s container, and because both containers share that same user-defined network, `db` resolves via DNS to the database container\'s current internal IP — the exact same name-based discovery mechanism from the previous lesson, just configured automatically by Compose instead of requiring a manual `docker network create` and explicit `--network` flags on each `docker run`.'
    },
    {
      q: 'Why does `docker compose down` (without -v) preserve named volumes, while removing containers and the network?',
      a: 'This mirrors the volumes-and-persistence lesson\'s core principle applied at the whole-stack level: volumes are deliberately decoupled from any one container\'s (or, here, any one COMPOSE STACK\'s) lifecycle, specifically so that stopping and later recreating a stack — a routine development operation, done constantly while iterating — does not silently destroy a development database\'s accumulated data every single time. Containers and the network Compose created are considered disposable, recreatable infrastructure; volumes are considered potentially-precious data, requiring the explicit, separate `-v` flag as a deliberate opt-in before Compose will actually destroy them alongside everything else.'
    },
    {
      q: 'Why is `depends_on` in a Compose file about START ORDER, not about actually WAITING for a dependency to be fully ready?',
      a: 'By default, `depends_on: [db]` on a service only guarantees that Compose starts the `db` container BEFORE starting the dependent service\'s container — it does not wait for `db` to be fully initialized and actually ready to accept connections (a database process starting is not instantaneous; there is often a real initialization period after the container itself starts before it is genuinely ready). This is a genuinely common source of confusing, INTERMITTENT startup failures — the dependent service starts fast enough that it tries connecting to a database container that is technically running but not yet actually accepting connections. The correct fix is either application-level retry logic (the dependent service retries its connection attempt with backoff until it succeeds) or Compose\'s `depends_on` with an explicit `condition: service_healthy`, which does wait for a defined healthcheck to pass — start-order alone is a necessary but not sufficient guarantee.'
    }
  ],
  code: {
    title: 'A complete two-service stack: app + database, networked and persisted',
    intro: 'Every piece here maps directly to a previous Part-3 lesson: networking (service-name reachability), volumes (the db-data volume), and now, Compose tying it together in one file.',
    code: `# docker-compose.yml
services:
  app:
    build: .                    # builds from the Dockerfile in this directory
    ports:
      - "3000:3000"
    environment:
      - DATABASE_HOST=db         # reaches "db" by NAME — same-stack DNS
      - DATABASE_PORT=5432
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=devpassword
    volumes:
      - db-data:/var/lib/postgresql/data
                                 # ^ NAMED volume — survives "compose down"

volumes:
  db-data:                      # declared once, referenced above

# Start everything, in the foreground (watch all logs):
# $ docker compose up

# Start everything, detached:
# $ docker compose up -d

# Stop but keep containers/network/volumes (fast restart later):
# $ docker compose stop

# Stop AND remove containers/network (volumes preserved):
# $ docker compose down

# Stop, remove EVERYTHING including volumes (data loss!):
# $ docker compose down -v`,
    notes: [
      'This ONE file replaces what would otherwise be: docker network create, two docker run commands (each with several flags), and docker volume create, typed correctly, in the right order, every time.',
      'app reaches db at "db:5432" — no IP address anywhere in this file, exactly the docker-networking lesson\'s DNS-based discovery, working automatically.'
    ]
  },
  lab: {
    title: 'Write a docker-compose.yml for a three-service stack',
    prompt: 'Write a docker-compose.yml with three services: "web" (build from the current directory, publish port 8080 to container port 80, depends on "api"), "api" (image my-api:1.0, environment REDIS_HOST=cache, depends on "cache"), and "cache" (image redis:7, no volume needed — cache data is disposable). No named volumes are required for this stack.',
    starter: `services:
  web:
    # build, ports, depends_on


  api:
    # image, environment REDIS_HOST=cache, depends_on


  cache:
    # image only — no volume, disposable cache data

`,
    checks: [
      { re: 'web:[\\s\\S]*build:\\s*\\.', flags: 'i', must: true, hint: 'web service needs "build: ."', pass: 'web build: . ✓' },
      { re: '"8080:80"|8080:80', flags: 'i', must: true, hint: 'web needs ports: ["8080:80"]', pass: 'web ports 8080:80 ✓' },
      { re: 'api:[\\s\\S]*image:\\s*my-api:1\\.0', flags: 'i', must: true, hint: 'api service needs "image: my-api:1.0"', pass: 'api image ✓' },
      { re: 'REDIS_HOST\\s*=\\s*cache', flags: 'i', must: true, hint: 'api needs environment: REDIS_HOST=cache', pass: 'REDIS_HOST=cache ✓' },
      { re: 'cache:[\\s\\S]*image:\\s*redis:7', flags: 'i', must: true, hint: 'cache service needs "image: redis:7"', pass: 'cache image redis:7 ✓' },
      { re: 'depends_on:[\\s\\S]*-\\s*api', flags: 'i', must: true, hint: 'web needs depends_on: [api]', pass: 'web depends_on api ✓' }
    ],
    run: 'Try it for real: docker compose up -d on a real version of this stack, then docker compose ps to see all three services running.',
    solution: `services:
  web:
    build: .
    ports:
      - "8080:80"
    depends_on:
      - api

  api:
    image: my-api:1.0
    environment:
      - REDIS_HOST=cache
    depends_on:
      - cache

  cache:
    image: redis:7`,
    notes: [
      'No top-level "volumes:" section is needed here at all — the task explicitly noted cache data is disposable, so it correctly uses no volume, consistent with the previous lesson\'s "not everything needs one" guidance.',
      'depends_on here only guarantees start ORDER, not readiness — worth remembering from this lesson\'s tech section if "api" tries connecting to "cache" before Redis is actually ready to accept connections.'
    ]
  },
  quiz: [
    {
      q: 'What does docker-compose.yml declare, at a high level?',
      options: ['A single container\'s Dockerfile instructions', 'Every service in a multi-container application stack, along with their images, ports, environment, volumes, and dependencies, in one file', 'A Kubernetes deployment manifest', 'A CI/CD pipeline configuration'],
      correct: 1,
      explain: 'Compose declares an entire application stack — multiple services and how they relate — in one declarative YAML file.'
    },
    {
      q: 'How do services in a Compose file typically reach each other?',
      options: ['By hardcoded IP addresses', 'By service name, resolved via the user-defined network Compose automatically creates and attaches every service to', 'They cannot communicate without manual network configuration', 'Only through the host machine\'s localhost'],
      correct: 1,
      explain: 'Compose creates a shared user-defined network by default, enabling the same DNS-based, name-based discovery covered in the docker-networking lesson, automatically.'
    },
    {
      q: 'What is the key difference between `docker compose stop` and `docker compose down`?',
      options: ['They are identical commands', 'stop halts containers without removing them (fast restart later); down stops AND removes containers and the network (but preserves named volumes by default)', 'down is faster than stop', 'stop removes volumes; down does not'],
      correct: 1,
      explain: 'stop is a pause; down is a teardown of containers/network. Neither removes named volumes unless -v is explicitly added to down.'
    },
    {
      q: 'Why does `depends_on` alone not guarantee a dependent service can successfully connect to its dependency immediately on startup?',
      options: ['depends_on is purely cosmetic and has no effect', 'By default, depends_on only guarantees START ORDER, not that the dependency is fully initialized and ready to accept connections', 'depends_on only works for exactly two services', 'Compose ignores depends_on unless running in production mode'],
      correct: 1,
      explain: 'A container starting is not the same as the process inside it being ready. Without a healthcheck-based condition, depends_on only sequences container starts, not readiness.'
    },
    {
      q: 'Why is Docker Compose explicitly described as a single-machine tool, and what does that imply about its relationship to Kubernetes?',
      options: ['Compose and Kubernetes solve the exact same problem and are interchangeable', 'Every Compose service runs on the one machine docker compose up was run on, with no multi-machine scheduling or automatic recovery — Kubernetes exists for that genuinely different, larger-scale problem', 'Compose is a deprecated precursor to Kubernetes with no remaining use', 'Compose requires Kubernetes to be installed first'],
      correct: 1,
      explain: 'Compose has no concept of spreading services across multiple machines or recovering from a whole-machine failure — that is precisely the distinct problem Kubernetes is designed to solve.'
    }
  ],
  pitfalls: [
    'Running `docker compose down -v` as a reflexive "clean slate" habit, not registering that -v also destroys named volumes and any data they hold.',
    'Assuming `depends_on` means "wait until the dependency is actually ready" rather than just "start it first" — leading to intermittent startup-race failures that only a healthcheck-based condition (or application-level retries) actually fixes.',
    'Trying to scale a Compose-based application across multiple machines for reliability, discovering only then that Compose has no built-in mechanism for that — a sign the application has outgrown Compose and needs Kubernetes.'
  ],
  interview: [
    {
      q: 'Explain what docker compose up actually does under the hood, in terms of the individual Docker primitives it replaces.',
      a: 'It reads docker-compose.yml and, for the declared services, performs the same sequence of operations you would otherwise type by hand: create a user-defined network scoped to the project (docker network create equivalent), and for each service, either build an image from a Dockerfile (docker build) or use a specified existing image, then start a container from it with the declared ports published, environment variables set, and volumes mounted (docker run equivalent, with all the relevant flags derived from the YAML), attaching every one of those containers to the shared network so they can reach each other by service name. It introduces no fundamentally new underlying mechanism — it is a declarative, single-command orchestration layer over exactly the docker run/network/volume primitives covered earlier in this course.'
    },
    {
      q: 'A team says "we don\'t need Kubernetes, we already use Docker Compose in production and it works fine." When does that reasoning hold up, and when does it break down?',
      a: 'It holds up genuinely well for an application that comfortably fits on one machine, where the team is comfortable with manual intervention (a human restarting things) if that one machine has an issue, and where the traffic/reliability requirements do not demand automatic failover or horizontal scaling across multiple machines — plenty of real, legitimate small-to-medium production systems fit this description honestly. It breaks down the moment any of these stop being true: if the one machine running Compose goes down, everything on it goes down with no automatic recovery; if traffic outgrows what that one machine can handle, there is no built-in way to add replicas across additional machines; and if the business genuinely needs "acceptable downtime measured in seconds, not until someone notices and intervenes," Compose alone cannot provide that. The honest framing is not "Compose is inferior" — it is "Compose and Kubernetes are scoped to different reliability/scale requirements, and outgrowing Compose\'s scope is the actual signal to move to Kubernetes, not a fixed timeline or company size."'
    },
    {
      q: 'Why does Compose remain the standard tool for LOCAL DEVELOPMENT even for applications that are ultimately deployed to Kubernetes in production?',
      a: 'Local development has fundamentally different priorities than production: a developer wants to spin up an entire multi-service stack (an app, a database, a cache, maybe a message queue) on their own single laptop, quickly, repeatably, with one simple command, and tear it down and recreate it just as easily while iterating — exactly what Compose is purpose-built for, and Kubernetes\'s multi-machine orchestration features are simply unnecessary overhead for a stack that is deliberately meant to run entirely on one developer\'s machine. Using the full Kubernetes toolchain (a local cluster like kind or minikube, full manifests, kubectl) for pure local development is possible and some teams do it specifically to mirror production configuration exactly, but it is a genuinely heavier setup than most day-to-day local development actually needs — Compose\'s single-machine simplicity is a feature for this specific use case, not a limitation.'
    },
    {
      q: 'How would you fix a Compose stack where the "api" service intermittently fails on startup because it connects to "db" before Postgres is actually ready to accept connections, given that `depends_on` alone did not solve it?',
      a: 'The most robust fix is a Compose healthcheck on the db service (a `healthcheck:` block running something like `pg_isready` on an interval) combined with `depends_on: db: condition: service_healthy` on the api service — this makes Compose actually WAIT for the healthcheck to report healthy before starting api, rather than just sequencing container start order. As a complementary, defense-in-depth measure (worth having regardless, since the exact same race condition can occur outside Compose too — e.g., during a Kubernetes rolling restart), I would also add connection-retry logic with backoff in the application itself, so it does not simply crash on the first failed connection attempt but retries for a reasonable window before giving up — genuinely resilient startup behavior should not depend entirely on the orchestration layer getting sequencing perfectly right.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover writing and running a Compose stack. This is what is underneath: how Compose actually computes what changed between two `up` calls, environment-specific overrides via multiple Compose files, and the genuine conceptual bridge from a Compose file to a Kubernetes manifest.',
    sections: [
      {
        h: 'How `docker compose up` decides what to actually recreate',
        p: [
          'Running `docker compose up` a second time, after editing the Compose file, does not blindly tear down and recreate every service — Compose computes a configuration hash for each service (covering its image, environment, ports, volumes, and other declared settings) and compares it against the hash of the currently-running container for that service; only services whose computed configuration actually CHANGED get recreated, while unchanged services are left running untouched. This is genuinely efficient for iterative development — editing one service\'s environment variable and rerunning `docker compose up` recreates only THAT service, leaving a slow-starting database service running the whole time rather than needlessly restarting it too.'
        ]
      },
      {
        h: 'Multiple Compose files: environment-specific overrides without duplicating everything',
        p: [
          'Compose supports layering multiple YAML files via `-f`, with later files OVERRIDING or extending fields from earlier ones — a common real pattern is a base `docker-compose.yml` with shared configuration, plus a `docker-compose.override.yml` (loaded automatically alongside the base file with no extra flag needed) for local-development-specific additions like bind-mounting source code, and a separate `docker-compose.prod.yml` for production-leaning overrides (different resource limits, no bind mounts) loaded explicitly via `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`. This avoids maintaining several near-duplicate full Compose files, keeping the shared, common configuration in exactly one place.'
        ]
      },
      {
        h: 'From Compose to Kubernetes: the conceptual bridge, not a literal translation',
        p: [
          'A Compose "service" and a Kubernetes "Deployment + Service pair" (Part 4\'s subject) are solving analogous but NOT identical problems: a Compose service is one or more containers on one machine with a fixed identity, while a Kubernetes Deployment manages a DYNAMIC, scalable NUMBER of Pod replicas, potentially spread across many machines, with a Kubernetes Service providing the stable name/address across whichever replicas currently happen to be healthy — genuinely more than Compose\'s single-container-per-service model does. Tools like `kompose` exist to auto-generate a rough first-draft Kubernetes manifest FROM a docker-compose.yml, which can be a reasonable starting point for migration, but it is genuinely a starting point requiring real review, not a drop-in equivalent — replica counts, resource limits, health checks, and storage all need Kubernetes-specific decisions a Compose file never had to make in the first place.'
        ]
      }
    ]
  }
};
