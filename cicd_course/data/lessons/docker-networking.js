window.LESSONS = window.LESSONS || {};
window.LESSONS['docker-networking'] = {
  id: 'docker-networking',
  title: 'Docker Networking: How Containers Find Each Other',
  category: 'Part 3 — Multi-Container Apps',
  timeMin: 35,
  summary: 'A single containerized app is only half the picture — real applications are usually several containers (an API, a database, a cache) that need to talk to EACH OTHER, reliably, without hardcoding IP addresses that change every time a container restarts. This lesson covers Docker\'s default bridge networking, why containers on the same user-defined network can reach each other BY NAME (genuinely useful DNS-based service discovery, not a convenience trick), and the container-to-container vs. container-to-host distinction that trips up nearly everyone the first time they need a container to reach something running directly on their own machine.',
  goals: [
    'Explain what a Docker bridge network is and why containers get their own private IP addresses',
    'Create a user-defined network and explain why it enables DNS-based service discovery by container name',
    'Explain why relying on a container\'s IP address directly is fragile, and name-based discovery is not',
    'Connect two containers on the same network and have one reach the other by name',
    'Explain the specific mechanism for a container to reach a service running on the HOST machine itself'
  ],
  concept: [
    {
      h: 'The default bridge network: containers get their own private IPs',
      p: [
        'By default, Docker creates containers attached to a "bridge" network — a private, virtual network internal to the Docker host, where each container gets its own IP address, distinct from the host machine\'s own IP. This is what makes container isolation genuinely work at the network level: two containers running services on the SAME port (say, both listening on port 80 internally) do not conflict with each other, because each has its own private IP address, and port PUBLISHING (the `-p` flag from the CLI-essentials lesson) is what selectively maps a specific container port to a specific host port when external reachability is actually wanted.',
        'Containers on Docker\'s DEFAULT bridge network (literally named "bridge") can reach each other, but only by IP address, and — this is the part that causes real problems — that IP address is not guaranteed to stay the same across a container restart, since it is assigned dynamically from the network\'s address pool. Hardcoding a container\'s current IP into another container\'s configuration works right up until the referenced container restarts and gets reassigned a different one, at which point everything referencing the old IP silently breaks.'
      ]
    },
    {
      h: 'User-defined networks: DNS-based discovery by container NAME',
      p: [
        'Creating a network explicitly — `docker network create my-net` — and attaching containers to it (`docker run --network my-net ...`) unlocks something the default bridge network deliberately does not provide: containers on the SAME user-defined network can reach each other by CONTAINER NAME, resolved automatically via Docker\'s built-in embedded DNS server, with no manual IP address involved at all. A container named `db`, reachable at `db:5432` from any other container on that same user-defined network, stays reachable at exactly that name even after `db` restarts and receives a brand-new internal IP address — the DNS entry updates automatically, transparently, and whatever was connecting to `db:5432` never needs to know or care that the underlying IP changed underneath it.',
        'This is precisely why Docker Compose (the very next lesson) can let services in a `docker-compose.yml` reference each other by their service name directly in configuration (a web app configured with `DATABASE_HOST=db`) — Compose automatically creates a user-defined network for the whole stack and attaches every service to it, so this name-based reachability comes essentially for free, without ever manually running `docker network create`.'
      ]
    },
    {
      h: 'Why IP-hardcoding is fragile, and name-based discovery is the actual fix',
      p: [
        'Consider a two-container setup — an app container and a database container — where the app\'s configuration hardcodes the database\'s current IP address, obtained by manually inspecting `docker inspect db`. This works, right up until the database container is restarted (a crash recovery, an image update, a routine redeploy) and Docker assigns it a new internal IP from the bridge network\'s address pool — at which point the app\'s hardcoded configuration is now silently pointing at an address that either does not resolve to anything, or worse, resolves to a completely different container that happened to be assigned that now-freed IP.',
        'Name-based discovery on a user-defined network solves this structurally, not by convention: the NAME is the stable, meaningful reference (`db` always means "the database service," regardless of restarts), and Docker\'s embedded DNS keeps that name correctly mapped to whatever the CURRENT actual IP happens to be, updated automatically on every restart. This same underlying idea — reach a service by a stable NAME rather than a volatile IP — reappears, considerably formalized, in this course\'s Kubernetes Services lesson (Part 4), which is genuinely solving the exact same category of problem at a much larger, multi-machine scale.'
      ]
    },
    {
      h: 'Reaching the HOST machine from inside a container',
      p: [
        'A genuinely common point of confusion: a container trying to reach a service running directly on the DEVELOPER\'s own machine (not in another container) — say, a locally-running database outside of Docker entirely — cannot simply use `localhost` from inside the container, because `localhost` inside a container refers to the CONTAINER\'s own network namespace, not the host machine\'s. Docker provides a special DNS name, `host.docker.internal`, specifically for this case (works out of the box on Docker Desktop for Mac/Windows; on Linux it may need an explicit `--add-host=host.docker.internal:host-gateway` flag on `docker run`), resolving to the host machine\'s own address as seen from inside the container.',
        'This distinction — container-to-container (by container/service name, on a shared user-defined network) versus container-to-host (via `host.docker.internal`) — is worth keeping explicitly separate in your mental model, since reaching for the wrong mechanism (trying `localhost` for a sibling container, or a container name for something running on the bare host) is a genuinely common, genuinely confusing early debugging trap.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Den Den Mushi Directory Beats Memorizing a Snail\'s Number',
      text: 'Every Den Den Mushi has its own specific frequency, effectively its own private "number" — and early on, Nami tries keeping track of allied crews by memorizing their snail\'s specific frequency directly, writing it down once and reusing it. This works fine right up until an allied crew replaces a damaged Den Den Mushi with a new one — same crew, same PURPOSE, but the new snail has an entirely different frequency, and Nami\'s memorized old number now reaches nobody, or worse, connects to a completely different, unrelated snail that happens to now be using that freed frequency. Robin\'s fix, once she takes over managing allied contacts, is a proper directory: crews are looked up by NAME ("the Whiskey Peak contact," not "frequency 4471") through a maintained listing that is updated automatically whenever a crew\'s actual snail changes — so calling "the Whiskey Peak contact" by name always reaches the CURRENT correct snail, whatever its underlying frequency happens to be today, with nobody needing to manually track frequency changes at all.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Speed-Dial by Name Survives a Phone Number Change',
      text: 'Sheldon, setting up the group\'s phones early on, insists everyone memorize each other\'s actual phone NUMBERS directly, dismissing contact names as an unnecessary abstraction — until Raj gets a new number after switching carriers, and everyone who memorized his OLD number keeps calling it, reaching a stranger\'s new number entirely, with no idea Raj even changed anything. Penny\'s fix — genuinely simple, and one Sheldon grudgingly adopts afterward despite his initial objection — is exactly what contact names are FOR: save "Raj" as a name in your phone, pointing at whatever his current number actually is, and update that ONE entry whenever it changes; everyone still just dials "Raj" by name, and the phone\'s own address book handles translating that name to whatever the current correct number actually is, transparently, without every caller needing to separately track and re-memorize the change themselves.'
    },
    why: 'Robin\'s allied-crew directory and Penny\'s phone contact list are both DNS by another name: a stable NAME that always resolves to whatever the current, possibly-changed underlying address actually is, maintained centrally so nobody calling by name needs to manually track changes themselves. That is exactly what Docker\'s user-defined network gives two containers — reach `db` by name, and Docker\'s embedded DNS keeps that name correctly pointed at whatever `db`\'s current internal IP actually is, even across restarts that would otherwise silently break anything hardcoded to an old IP.'
  },
  tech: [
    {
      q: 'Why can containers on Docker\'s DEFAULT bridge network reach each other by IP but NOT by name, while a user-defined network allows both?',
      a: 'Docker\'s embedded DNS server, which resolves container names to their current IP addresses, is only enabled for USER-DEFINED networks — a deliberate design choice, not an oversight, largely for backward compatibility with older Docker versions where the default bridge network was the only option and name-based resolution did not yet exist. Containers on the default bridge network can still reach each other over the network at the IP layer (nothing prevents that), but without the DNS layer active on that particular network, there is no name-to-IP translation available — which is exactly why creating an explicit user-defined network (`docker network create`) is the standard, recommended practice for any multi-container setup that needs reliable inter-container communication, rather than relying on the default bridge network at all.'
    },
    {
      q: 'Mechanically, what happens when a container on a user-defined network is restarted — does its name-based reachability survive, and why?',
      a: 'On restart, Docker very likely assigns the container a NEW internal IP address from the network\'s address pool (the old one is not guaranteed to be reused) — but Docker\'s embedded DNS server, which maintains the name-to-IP mapping for that network, updates its record for that container\'s name to point at the new IP automatically, as part of the container\'s normal restart/reattachment process. Anything that was reaching the container by NAME continues working immediately after the restart with no reconfiguration needed, since the name itself never changed — only the underlying IP did, and that translation layer is precisely what DNS-based discovery is insulating callers from having to track themselves.'
    },
    {
      q: 'Why does `localhost` inside a container not refer to the host machine, and what does `host.docker.internal` actually resolve to instead?',
      a: 'Each container gets its own network namespace (the same namespace mechanism the Linux course\'s container-preview lesson introduced), and `localhost` inside that namespace refers to the CONTAINER\'s own loopback interface — its own private "self" — completely distinct from the host machine\'s own loopback interface, even though both are conventionally called "localhost." `host.docker.internal` is a special DNS name Docker provides specifically to bridge this gap: it resolves, from inside a container\'s isolated network namespace, to an address that actually reaches the host machine\'s own network stack — a deliberate, explicit mechanism precisely because there is no way for "localhost" itself to mean two different things depending on context; a distinct name was needed for the "reach the host, not myself" case.'
    }
  ],
  code: {
    title: 'A user-defined network, name-based discovery, observed directly',
    intro: 'A transcript creating a network, attaching two containers, and confirming name-based reachability survives a restart.',
    code: `$ docker network create my-net

$ docker run -d --name db --network my-net postgres:16
$ docker run -d --name app --network my-net my-app-image

$ docker exec app ping -c 1 db
PING db (172.20.0.2): 56 data bytes
64 bytes from 172.20.0.2: icmp_seq=0 ttl=64 time=0.089 ms
# ^ "db" resolved by NAME to its current IP — this is the DNS layer at work

$ docker restart db
db
# ^ db gets a NEW internal IP after restart

$ docker exec app ping -c 1 db
PING db (172.20.0.3): 56 data bytes
64 bytes from 172.20.0.3: icmp_seq=0 ttl=64 time=0.076 ms
# ^ different IP (.3 instead of .2) — but "db" still resolves correctly,
#   automatically, with zero reconfiguration on the "app" side

# Reaching a service on the HOST machine itself (not another container):
$ docker run --rm alpine ping -c 1 host.docker.internal
PING host.docker.internal (192.168.65.2): 56 data bytes
64 bytes from 192.168.65.2: icmp_seq=0 ttl=64 time=0.15 ms
# ^ NOT "localhost" — that would mean the container itself`,
    notes: [
      'The default bridge network (no --network flag) would NOT resolve "db" by name here — this only works because both containers were explicitly attached to the user-defined "my-net" network.',
      'On Linux hosts, host.docker.internal may need `--add-host=host.docker.internal:host-gateway` added to docker run to work — it is automatic on Docker Desktop for Mac/Windows.'
    ]
  },
  lab: {
    title: 'Diagnose a container networking failure',
    prompt: 'A web app container cannot reach its database container. It was started with `docker run -d --name web my-web-image` (no --network flag) and the database with `docker run -d --name db postgres` (also no --network flag), and the app is configured to connect to host "db". Identify the bug and write the corrected commands so "web" can reach "db" by name.',
    starter: `# Original (broken):
# docker run -d --name web my-web-image
# docker run -d --name db postgres

# What is wrong?


# Your fixed commands:

`,
    checks: [
      { re: 'docker\\s+network\\s+create', flags: 'i', must: true, hint: 'Create a user-defined network first: docker network create <name>', pass: 'docker network create ✓' },
      { re: '--network\\s+\\S+.*--name\\s+web|--name\\s+web.*--network\\s+\\S+', flags: 'i', must: true, hint: 'Run "web" with --network <your-network> attached.', pass: '--network on web ✓' },
      { re: '--network\\s+\\S+.*--name\\s+db|--name\\s+db.*--network\\s+\\S+', flags: 'i', must: true, hint: 'Run "db" with the SAME --network <your-network> attached.', pass: '--network on db ✓' },
      { re: 'default\\s+bridge|no\\s+(--)?network|not\\s+attached', flags: 'i', must: true, hint: 'Explain the bug: both containers are on the default bridge network, which has no DNS-based name resolution.', pass: 'explanation of bug ✓' }
    ],
    run: 'Try it for real: reproduce this exact bug (two containers, no --network flag), confirm ping by name fails, then fix it and confirm it works.',
    solution: `# What is wrong?
# Both containers were started with no --network flag, meaning both landed
# on Docker's DEFAULT bridge network, which does NOT run the embedded DNS
# server needed for name-based resolution — so "db" as a hostname never
# resolves from inside "web", even though both containers can technically
# reach each other by IP.

# Your fixed commands:
docker network create my-net
docker run -d --name db --network my-net postgres
docker run -d --name web --network my-net my-web-image`,
    notes: [
      'This exact bug — two containers running fine individually, but unable to find each other by name — is one of the most common early multi-container debugging traps.',
      'The fix does not change either image or container at all — only which NETWORK they are attached to.'
    ]
  },
  quiz: [
    {
      q: 'Why do two containers on Docker\'s DEFAULT bridge network fail to reach each other by container NAME?',
      options: ['The default bridge network blocks all traffic between containers', 'Docker\'s embedded DNS server (which resolves names to IPs) is only enabled on user-defined networks, not the default bridge network', 'Container names are only valid for one container at a time', 'This is not actually true — the default bridge network supports name resolution'],
      correct: 1,
      explain: 'Name-based DNS resolution is a feature specific to user-defined networks. The default bridge network allows IP-based reachability but not name-based.'
    },
    {
      q: 'A container is hardcoded to connect to another container\'s IP address directly. What happens when the referenced container restarts?',
      options: ['Nothing — Docker guarantees IPs never change on restart', 'The IP address may change on restart, silently breaking the hardcoded reference', 'The restart is blocked until the reference is updated', 'Docker automatically updates all hardcoded IP references'],
      correct: 1,
      explain: 'Container IPs on a bridge network are dynamically assigned and not guaranteed to persist across restarts — hardcoding them is fragile for exactly this reason.'
    },
    {
      q: 'What does creating a user-defined network and attaching containers to it actually enable?',
      options: ['Faster network throughput only', 'DNS-based service discovery: containers on that network can reach each other by container name, with Docker automatically keeping the name-to-IP mapping current', 'It removes the need for any networking at all', 'It merges the containers into a single process'],
      correct: 1,
      explain: 'User-defined networks run Docker\'s embedded DNS, letting containers resolve each other by name — a name that stays valid across IP changes from restarts.'
    },
    {
      q: 'Why does `localhost` inside a container not reach a service running on the host machine?',
      options: ['localhost is disabled inside all containers', 'Each container has its own network namespace, and localhost inside it refers to the container\'s own loopback interface, not the host\'s', 'localhost only works for database connections', 'It does reach the host — this is a common misconception with no real basis'],
      correct: 1,
      explain: 'Network namespace isolation means "localhost" inside a container is scoped to that container itself. host.docker.internal is the mechanism for reaching the host specifically.'
    },
    {
      q: 'Why does Docker Compose let services reference each other by service name in configuration, seemingly "for free"?',
      options: ['Compose disables networking entirely between services', 'Compose automatically creates a user-defined network for the whole stack and attaches every service to it, enabling name-based discovery without manual docker network create calls', 'Service names in Compose are just cosmetic labels with no networking effect', 'Compose requires manually configuring DNS servers for every service'],
      correct: 1,
      explain: 'Docker Compose handles the user-defined network creation and attachment automatically, so service-name-based reachability works out of the box.'
    }
  ],
  pitfalls: [
    'Running multiple related containers with no --network flag and then being confused why they cannot reach each other by name — they landed on the default bridge network, which has no DNS resolution.',
    'Hardcoding a container\'s IP address into another container\'s configuration instead of using its name on a shared user-defined network — works until the first restart reassigns the IP.',
    'Trying to reach a host-machine service from inside a container using `localhost` — that refers to the container itself; `host.docker.internal` is the correct mechanism.'
  ],
  interview: [
    {
      q: 'Explain why Docker\'s user-defined networks solve a genuinely similar problem to DNS on the broader internet, and why that similarity is not a coincidence.',
      a: 'Both solve the same underlying problem: a stable, human-meaningful NAME needs to reliably map to a potentially-changing underlying ADDRESS, without every caller needing to manually track address changes themselves. On the broader internet, DNS lets you reach "example.com" without knowing or caring about its current IP, which can change (server migrations, load balancer changes) without breaking anything that references the domain name. Docker\'s embedded DNS on a user-defined network solves the exact same shape of problem at a much smaller scale: reach a container by its NAME, and Docker\'s DNS keeps that name correctly mapped to whatever the container\'s CURRENT internal IP actually is, transparently surviving restarts. It is not a coincidence — it is the same general pattern (indirection through a name-resolution layer) applied at a different scale, and it reappears again, more formally, in Kubernetes Services.'
    },
    {
      q: 'A multi-container application works fine in local development (started manually with individual `docker run` commands) but fails intermittently in a way that seems related to one specific container restarting. What would you investigate first?',
      a: 'I would first check whether the containers were started with an explicit `--network` flag pointing to a shared user-defined network, or whether they landed on the default bridge network — if the latter, and if any configuration references another container by IP address rather than by name, that IP reference would silently break every time the referenced container restarts and gets reassigned a new address, producing exactly the intermittent, restart-correlated failure pattern described. The fix is twofold: create (or confirm) a shared user-defined network with both containers attached, and update any hardcoded IP references to use the container\'s NAME instead, which Docker\'s embedded DNS will keep correctly resolved across restarts.'
    },
    {
      q: 'Why does `host.docker.internal` need to exist as a distinct mechanism, rather than simply making `localhost` inside a container resolve to the host?',
      a: 'Network namespace isolation is a deliberate, foundational container property — each container is meant to have its OWN private view of "localhost," specifically so a service inside one container binding to `localhost:5432` does not accidentally collide with, or unintentionally expose, a service on the actual host also using `localhost:5432`; collapsing the two would undermine the isolation the entire container mechanism is built on. `host.docker.internal` exists as a SEPARATE, explicit name precisely because "reach the host" and "reach myself" need to remain two genuinely distinguishable, deliberately different addresses — conflating them would be a meaningful regression in container isolation, not a convenience.'
    },
    {
      q: 'How does the container-to-container name resolution problem this lesson covers relate to the problem Kubernetes Services will later solve, and what is genuinely different about the Kubernetes version?',
      a: 'Both solve "reach a service by a stable name, insulated from the underlying address changing" — Docker\'s user-defined network DNS resolves a container NAME to its current internal IP, on one Docker host. Kubernetes Services solve a meaningfully larger version of the same problem: a Service provides one stable name AND address for a set of Pod REPLICAS that can be spread across MULTIPLE machines, individually created and destroyed (rescheduled, scaled, replaced after a crash) far more dynamically than a single Docker container restarting — the Service also load-balances across however many healthy replicas currently exist, which is a genuinely additional capability Docker\'s single-container DNS resolution does not provide at all. The core pattern (name-based indirection over an unstable set of addresses) is the same; the scale, the dynamism of what is behind the name, and the added load-balancing responsibility are what meaningfully differ.'
    }
  ]
};
