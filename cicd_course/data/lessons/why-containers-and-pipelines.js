window.LESSONS = window.LESSONS || {};
window.LESSONS['why-containers-and-pipelines'] = {
  id: 'why-containers-and-pipelines',
  title: 'From "Just a Process" to a Shippable Pipeline: Why This Course Exists',
  category: 'Part 0 — From Process to Pipeline',
  timeMin: 25,
  summary: 'The Linux course ended on a demystifying idea: a container is not a lightweight virtual machine, it is an ordinary process, restricted by namespaces (what it can see) and cgroups (what it can use). That idea explains what a RUNNING container is. It says nothing yet about how you get from "a restricted process on this one machine" to "the exact same environment, reproduced identically on any machine, deployed automatically every time someone pushes code." That gap is this entire course: Docker packages the recipe (the image), Kubernetes runs many of those recipes reliably at scale, and CI/CD automates the path from a commit to a running system, with no human manually SSHing in to make it happen.',
  goals: [
    'Recap what a container actually is (a namespaced, cgroup-limited process) and why that matters going forward',
    'Explain the gap between "a restricted process on one machine" and "a reproducible, deployable image"',
    'Name the three layers this course adds on top of that idea: Docker, Kubernetes, and CI/CD',
    'Explain why each layer exists to solve a specific, distinct problem the previous layer does not solve',
    'Describe the shape of the capstone this course builds toward: one command push resulting in a live, running deployment'
  ],
  concept: [
    {
      h: 'Recap: a container is a restricted process, not a mini virtual machine',
      p: [
        'If you have not just finished the Linux course, the short version: a running container is an ordinary process on the host machine, visible in the host\'s own <code>ps</code> output, subject to the same PID/signal/permission rules as any other process. What makes it "a container" is two restrictions applied at creation time — a <b>namespace</b> restricting what it can SEE (its own PID 1, its own network interfaces, its own filesystem root) and a <b>cgroup</b> restricting what it can USE (a CPU limit, a memory cap). Nothing is virtualized at the hardware or kernel level; visibility and usage are restricted, and that is the entire mechanism.',
        'That fact matters here for a very practical reason: everything this course adds on top — images, orchestration, pipelines — is built ON that same ordinary-process foundation, not on some separate, heavier virtualization technology. When something goes wrong three lessons from now inside a Kubernetes Pod, the honest debugging instinct is still "this is a restricted process, and I can inspect it roughly like any other process," not "this is magic infrastructure I have no way to reason about."'
      ]
    },
    {
      h: 'The gap: a restricted process on THIS machine is not yet reproducible ANYWHERE',
      p: [
        'Namespaces and cgroups explain how one running container is isolated on the machine it is currently running on. They say nothing about how that exact environment — the right binary, the right libraries, the right filesystem layout — gets reproduced on a teammate\'s laptop, a staging server, or a production cluster you have never logged into. Manually recreating "install exactly these packages, in exactly this order, with exactly these config files" on every new machine is exactly the fragile, error-prone process the phrase "works on my machine" describes.',
        'Docker\'s actual contribution (Part 1) is not the container mechanism itself — Linux already had that — it is a standard, portable RECIPE format (the Dockerfile) and a packaged, shippable RESULT (the image) that reproduces the identical environment anywhere Docker itself runs, with no manual step-by-step reconstruction required. An image is the recipe made concrete: every layer, every dependency, exactly specified, buildable once and runnable identically a thousand times.'
      ]
    },
    {
      h: 'One reproducible container is not yet a reliable SYSTEM',
      p: [
        'A single Docker image solves reproducibility for one container on one machine you manually run it on. It does not solve what happens when that container crashes at 3 AM and nobody is watching, when you need five identical copies running behind a stable address instead of one, or when a new version needs to roll out without a window of total downtime. Docker Compose (Part 3) handles a modest version of "several containers, one machine, one command" — genuinely useful for local development and small deployments, but it has no answer for a container disappearing on a machine that stops responding.',
        'Kubernetes (Parts 4-5) exists specifically for that gap: given a DECLARATION of what should be running ("I want 3 replicas of this image, reachable at this stable address"), it continuously works to make reality match that declaration — restarting crashed containers, spreading replicas across machines, replacing unhealthy ones — without a human manually intervening every time something fails. It is a genuinely different problem than Compose solves, which is why the two are not competitors so much as tools for two different scales of the same underlying idea.'
      ]
    },
    {
      h: 'A reliable system that only deploys when a human remembers to type the commands is still fragile',
      p: [
        'Even with a perfect image and a perfect Kubernetes setup, someone still has to build the new image, push it to a registry, and tell the cluster to use it, every single time code changes — done manually, by memory, under time pressure, this is exactly where mistakes creep in: a forgotten test, a wrong tag, a deploy to the wrong environment. CI/CD (Parts 6-7) automates that entire sequence: a pipeline triggered by a git push runs the tests, builds the image, pushes it to a registry, and updates the running deployment, consistently, the same way every time, with the manual steps replaced by a defined, auditable, repeatable process.',
        'The whole course, in one sentence: Docker answers "how do I package this reliably," Kubernetes answers "how do I run many of these reliably," and CI/CD answers "how do I get from a commit to a running deployment reliably, without doing it by hand." The capstone (Part 7\'s final lesson) puts all three together on one real, small application — a Dockerfile, a Kubernetes manifest, and a pipeline that ships a code change to a running deployment on every push.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s Blueprints Leave the Workshop',
      text: 'Last time (on the Sunny), Franky\'s partitioned workshops kept each specialist\'s workspace restricted in what it could see and use, all still genuinely part of the one ship. That solved safety and organization for THAT ship, docked at THAT yard, with Franky physically present to answer questions. It solved nothing about what happens when Galley-La gets a request to build a second ship, at a different dock, to the exact same exacting standard, without Franky there to personally supervise every joint and partition. So Franky does something categorically different: he produces complete, exact blueprints — every measurement, every material, every partition\'s dimensions, written down precisely enough that a totally different dock crew, in a totally different yard, can reproduce the identical ship without a single clarifying question. Iceburg, reviewing the blueprint set before signing off on it, points out what makes it genuinely usable rather than merely accurate: it is not just A description of the ship Franky already built — it is a buildable RECIPE, sequenced in the right ORDER, that any competent crew could follow from nothing to the finished vessel. The ship itself was never the hard part to isolate. Making it reproducible by someone else, somewhere else, without Franky standing there, is the entirely separate problem the blueprint solves.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Protocol Document Leaves the Room',
      text: 'Last time, Caltech\'s partitioned lab benches kept each researcher\'s equipment and reagent allotment restricted, safely, within the one shared lab room — genuinely solved, as long as everyone stayed in that one room with Sheldon around to enforce it. The problem Sheldon runs into next is different: a collaborating lab at another university wants to reproduce his exact experimental setup, and he will not be there to walk them through it personally. His first instinct — a long phone call, talking someone through it step by step, in real time — turns out to be exactly the fragile, error-prone approach the rest of the group warns him against, since it depends entirely on Sheldon\'s availability and the other researcher\'s memory. So, at Leonard\'s genuinely reasonable suggestion, Sheldon instead writes an exhaustive, exactly-sequenced protocol document — every reagent quantity, every equipment setting, every step in the precise order it must happen — detailed enough that a researcher who has never met Sheldon could follow it and end up with the identical experimental setup, unsupervised, on the first try. Amy, reading the finished document, makes the actual point out loud: it stopped being "notes about what Sheldon did" the moment it became precise and sequenced enough to be followed by someone else, cold, with no Sheldon in the room to fill in gaps.'
    },
    why: 'Franky\'s blueprint and Sheldon\'s protocol document are both the same leap: from "a correctly restricted setup that works HERE, with an expert present" to "a precise, sequenced RECIPE that reproduces the identical setup ANYWHERE, with no expert required." That is exactly a Dockerfile\'s job — turning "a correctly configured, namespaced/cgrouped process on my machine" into a reproducible, buildable recipe (the image) that runs identically anywhere Docker does, which is where the very next lesson picks up.'
  },
  tech: [
    {
      q: 'If Linux already has namespaces and cgroups, what does Docker actually add that Linux does not already provide on its own?',
      a: 'Namespaces and cgroups are low-level kernel mechanisms — genuinely powerful, but raw and manual to use directly: you would need to hand-construct namespaces, hand-configure cgroup limits, and hand-assemble a filesystem for the process to see, every single time, on every machine. Docker adds a standard packaging format (the image, built from a Dockerfile) plus a daemon and CLI that automate constructing those namespaces/cgroups and assembling that filesystem consistently, and — critically — a way to SHIP the resulting package (the image) to another machine so it reproduces identically there. The kernel mechanism was always available; Docker is the tooling and format that makes it practical and portable.'
    },
    {
      q: 'Why is "it works on my machine" specifically a reproducibility problem, in the terms this lesson uses?',
      a: 'It happens when the actual runtime environment — installed package versions, environment variables, filesystem layout, even subtle OS differences — was never precisely specified anywhere, only accumulated by hand over time on one particular machine. Without a precise, buildable recipe, there is no reliable way to reproduce that exact environment elsewhere; small undocumented differences (a slightly different library version, a missing config file) are exactly what causes identical-looking code to behave differently on a different machine. A Dockerfile forces that recipe to be written down explicitly and sequenced, which is what makes the resulting image reproducible rather than merely "works where I happened to build it."'
    },
    {
      q: 'Why does the lesson frame Kubernetes and CI/CD as solving genuinely different problems from Docker, rather than as "more advanced Docker features"?',
      a: 'Docker\'s job ends once you have a reproducible image — it does not know or care whether that image should have three replicas, whether one of them just crashed, or whether traffic should be load-balanced across them; that is an orchestration problem, which is what Kubernetes exists for. Separately, Docker does not know when a new image should be built, tested, or deployed — that is an automation/workflow problem, which is what CI/CD exists for. Each layer takes the previous layer\'s output as a given and solves a distinct problem on top of it: Docker makes one environment reproducible, Kubernetes makes many reproduced environments reliable at scale, and CI/CD makes the whole build-test-deploy sequence happen automatically and consistently.'
    }
  ],
  code: {
    title: 'The shape of the whole course, as one pipeline',
    intro: 'Nothing here is a real command yet — this is the map the rest of the course fills in, lesson by lesson, part by part.',
    code: `# Part 0-2: Docker Fundamentals & Building Good Images
#   Dockerfile  →  docker build  →  a reproducible IMAGE
#   (the recipe, written once, that reproduces the exact environment anywhere)

# Part 3: Multi-Container Apps
#   docker-compose.yml  →  docker compose up  →  several containers,
#   networked together, running on ONE machine with one command

# Part 4-5: Kubernetes Fundamentals & in Practice
#   deployment.yaml + service.yaml  →  kubectl apply  →  N reliable replicas,
#   self-healing, reachable at one stable address, across MANY machines

# Part 6: CI/CD Pipelines
#   git push  →  pipeline runs tests → builds image → pushes to registry
#   → updates the Kubernetes deployment — no manual steps

# Part 7: Capstone
#   One real small app, all four layers together:
#   Dockerfile → image → Kubernetes manifests → CI/CD pipeline → it's live`,
    notes: [
      'Each layer in this map is the subject of one or more upcoming Parts — nothing here needs to make full sense yet.',
      'Every layer takes the PREVIOUS layer\'s output as a given: Compose and Kubernetes both start from "I already have a Docker image," and CI/CD starts from "I already know how to build and deploy one."'
    ]
  },
  lab: {
    title: 'Sequence the pipeline',
    prompt: 'Write out the four-stage pipeline map for a code change reaching a live deployment, as a short comment-style outline, naming the tool responsible for each stage.',
    starter: `# Stage 1: turn source code + dependencies into a reproducible package
# tool: ???

# Stage 2: run several of those packages together, networked, on one machine
# tool: ???

# Stage 3: run many of those packages reliably across multiple machines,
# self-healing, reachable at one stable address
# tool: ???

# Stage 4: automatically run tests, build, and deploy on every git push
# tool: ???
`,
    checks: [
      { re: 'docker(?!\\s*compose)', flags: 'i', must: true, hint: 'Stage 1 (packaging into a reproducible image) is Docker.', pass: 'Stage 1: Docker ✓' },
      { re: 'compose', flags: 'i', must: true, hint: 'Stage 2 (several containers, one machine, one command) is Docker Compose.', pass: 'Stage 2: Docker Compose ✓' },
      { re: 'kubernetes|k8s|kubectl', flags: 'i', must: true, hint: 'Stage 3 (many replicas, multiple machines, self-healing) is Kubernetes.', pass: 'Stage 3: Kubernetes ✓' },
      { re: 'ci|cd|pipeline|actions', flags: 'i', must: true, hint: 'Stage 4 (automatic test/build/deploy on push) is CI/CD (e.g. GitHub Actions).', pass: 'Stage 4: CI/CD ✓' }
    ],
    run: 'No real command yet — this is the conceptual map. Revisit it after the capstone and check that every stage now has a command you have actually typed.',
    solution: `# Stage 1: turn source code + dependencies into a reproducible package
# tool: Docker (Dockerfile -> docker build -> image)

# Stage 2: run several of those packages together, networked, on one machine
# tool: Docker Compose (docker-compose.yml -> docker compose up)

# Stage 3: run many of those packages reliably across multiple machines,
# self-healing, reachable at one stable address
# tool: Kubernetes (deployment.yaml + service.yaml -> kubectl apply)

# Stage 4: automatically run tests, build, and deploy on every git push
# tool: CI/CD (e.g. GitHub Actions workflow)`,
    notes: [
      'This ordering is also the course\'s Part ordering — each stage is taught only after the previous one\'s vocabulary is already in place.',
      'Notice each tool solves ONE distinct problem — there is no single tool in this map that does two of these jobs at once.'
    ]
  },
  quiz: [
    {
      q: 'What did the Linux course establish a container fundamentally is?',
      options: ['A lightweight virtual machine with its own kernel', 'An ordinary process, restricted by namespaces (visibility) and cgroups (usage)', 'A compiled binary with no dependencies', 'A network protocol for isolating traffic'],
      correct: 1,
      explain: 'A container is an ordinary host process with two restrictions applied at creation: namespaces restrict what it can see, cgroups restrict what it can use.'
    },
    {
      q: 'What gap does this lesson say Docker specifically closes?',
      options: ['It closes the gap between "restricted process on one machine" and "reproducible package that runs identically anywhere"', 'It replaces namespaces and cgroups with a faster mechanism', 'It removes the need for a Linux kernel entirely', 'It closes the gap between development and testing environments only'],
      correct: 0,
      explain: 'Docker\'s contribution is a standard recipe (Dockerfile) and packaged result (image) that reproduce an identical environment on any machine Docker runs on — reproducibility, not a new isolation mechanism.'
    },
    {
      q: 'Why does the lesson say Kubernetes is not just "more advanced Docker Compose"?',
      options: ['Kubernetes and Compose solve the exact same problem at the exact same scale', 'Kubernetes solves reliability across MANY machines (self-healing, replicas, stable addressing) — a genuinely different problem than Compose\'s one-machine, one-command scope', 'Kubernetes does not use Docker images at all', 'Compose is strictly more powerful than Kubernetes'],
      correct: 1,
      explain: 'Compose handles several containers on one machine well. Kubernetes exists for the distinct problem of reliability and scale across multiple machines, with self-healing and stable addressing Compose has no answer for.'
    },
    {
      q: 'What specific problem does CI/CD solve that a working Kubernetes deployment alone does not?',
      options: ['CI/CD makes containers start faster', 'CI/CD automates the build-test-deploy sequence itself, replacing manual, error-prone, by-hand steps with a consistent, repeatable pipeline triggered by a git push', 'CI/CD is a replacement for Kubernetes', 'CI/CD only matters for very large companies'],
      correct: 1,
      explain: 'Even a perfect Kubernetes setup still needs someone to build, push, and deploy a new image every change — CI/CD automates exactly that sequence, consistently, rather than relying on a human doing it correctly every time by hand.'
    },
    {
      q: 'In the four-stage pipeline map, what does each later stage assume about the stage before it?',
      options: ['Each stage is fully independent and could be done in any order', 'Each stage takes the previous stage\'s output as a given — Compose and Kubernetes assume you already have a Docker image, CI/CD assumes you already know how to build and deploy one', 'Later stages replace the need for earlier stages', 'The stages are unrelated tools that happen to be taught together'],
      correct: 1,
      explain: 'The pipeline is genuinely sequential: Compose/Kubernetes both start from "I already have a reproducible image," and CI/CD automates a build-and-deploy sequence that presumes you already know how to do it manually.'
    }
  ],
  pitfalls: [
    'Treating Docker, Kubernetes, and CI/CD as interchangeable "DevOps stuff" rather than three tools solving three genuinely distinct problems — conflating them makes it much harder to reason about which layer a real production issue actually lives in.',
    'Jumping straight to Kubernetes or a CI/CD pipeline before being solid on a single Dockerfile and image — every later layer assumes that foundation is already comfortable, not still shaky.',
    'Forgetting that a container is still, underneath everything in this course, an ordinary namespaced/cgrouped process — losing that mental model makes debugging feel like opaque magic instead of a system you can actually reason about.'
  ],
  interview: [
    {
      q: 'Explain the relationship between "a container is just a process" and "a Docker image is reproducible" — are these the same idea?',
      a: 'No — they are related but distinct. "A container is just a process" describes the RUNTIME isolation mechanism: namespaces restrict visibility, cgroups restrict usage, on the machine the process is currently running on. It says nothing about reproducing that setup elsewhere. "A Docker image is reproducible" describes a separate, packaging-and-distribution problem: a precisely specified recipe (the Dockerfile) that builds an artifact (the image) which, when run anywhere Docker is installed, produces the identical namespaced/cgrouped process every time. The isolation mechanism is the foundation; the image format is what makes that foundation portable and repeatable.'
    },
    {
      q: 'A team says "we don\'t need Kubernetes, Docker Compose already runs all our containers." When would that reasoning break down?',
      a: 'It breaks down once reliability and scale requirements exceed what a single machine and manual intervention can provide: if a machine running Compose goes down, everything on it goes down with no automatic recovery; if traffic grows beyond what a fixed set of containers on one host can handle, Compose has no built-in way to add replicas across additional machines or load-balance across them; and if a container silently crashes, Compose does not proactively reconcile that back to a declared desired state the way Kubernetes does. Compose is a legitimate, correct choice for local development and small, single-machine deployments — the reasoning breaks down specifically when "one machine, restarted by a human if it breaks" stops being an acceptable reliability bar.'
    },
    {
      q: 'Why is "works on my machine" specifically framed as a reproducibility failure rather than a testing failure?',
      a: 'Because the root cause is usually that the actual runtime environment was never precisely specified anywhere — it accumulated by hand, over time, on one particular machine, with small undocumented differences (a library version, an environment variable, a config file someone edited once and forgot about) that were never captured in a buildable recipe. More or better tests would not fix that, because the tests themselves would run in that same unreproducible environment. The actual fix is a precise, version-controlled build recipe (a Dockerfile) that specifies the environment explicitly enough to reproduce it identically anywhere — turning an implicit, machine-specific setup into an explicit, portable one.'
    },
    {
      q: 'Describe, at a high level, what the capstone of this course is meant to demonstrate, and why building all four layers together (rather than each in isolation) matters.',
      a: 'The capstone takes one small real application through the full path: a Dockerfile that builds it into a reproducible image, a Docker Compose setup for local multi-container development, Kubernetes manifests (Deployment + Service, at minimum) that run it reliably on a cluster, and a CI/CD pipeline that automatically tests, builds, and deploys a code change end to end. Building each layer in isolation risks learning four disconnected skills without understanding how they hand off to each other — the CI/CD pipeline\'s "build" step only makes sense in terms of the Dockerfile from Part 1, and its "deploy" step only makes sense in terms of the Kubernetes manifests from Part 4-5. The capstone specifically tests whether those handoffs are actually understood, not just each piece independently.'
    }
  ]
};
