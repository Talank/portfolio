window.LESSONS = window.LESSONS || {};
window.LESSONS['the-dockerfile'] = {
  id: 'the-dockerfile',
  title: 'The Dockerfile: Scripting an Image, Layer by Layer',
  category: 'Part 1 — Docker Fundamentals',
  timeMin: 40,
  summary: 'A Dockerfile is the recipe from the very first lesson\'s Franky-blueprint story, made literal: a plain-text, sequenced list of instructions that `docker build` executes top to bottom, each instruction producing exactly one new image layer stacked on the one before it. This lesson covers the small set of instructions that cover the vast majority of real Dockerfiles — FROM, RUN, COPY, WORKDIR, ENV, EXPOSE, CMD — and, just as importantly, the mental model of "each line is a layer" that explains both how builds work and why instruction ORDER matters.',
  goals: [
    'Write a working Dockerfile for a small application from scratch',
    'Explain what each of FROM, RUN, COPY, WORKDIR, ENV, EXPOSE, and CMD actually does',
    'Explain why each Dockerfile instruction produces its own image layer',
    'Distinguish CMD from ENTRYPOINT at a basic level, and know which one to reach for by default',
    'Build an image from a Dockerfile and run a container from the result'
  ],
  concept: [
    {
      h: 'FROM: every image starts from a base',
      p: [
        'Every Dockerfile begins with `FROM <base-image>`, which does exactly what it says: it picks an existing image as the starting point, and every subsequent instruction adds layers on top of that base\'s own layers. This is not a special case — it is the SAME layering mechanism the previous lesson covered, just made explicit as the very first line: `FROM ubuntu:22.04` starts from a full Ubuntu base, `FROM node:20-slim` starts from a Node.js runtime already installed on a slimmed-down base, `FROM alpine:3.19` starts from a genuinely minimal ~7MB Linux base with almost nothing pre-installed.',
        'Choosing a base is a real, consequential decision, not a formality: a heavier base like full `ubuntu` gives you more pre-installed tooling at the cost of a larger image; a minimal base like `alpine` gives you a much smaller image but may be missing common libraries (Alpine uses `musl` instead of `glibc`, which occasionally causes compatibility surprises with software expecting glibc). The next lesson\'s multi-stage builds revisit this tradeoff in more depth — for now, the essential point is that FROM is where the image\'s starting layer stack comes from, and everything else in the file builds on top of it.'
      ]
    },
    {
      h: 'RUN, COPY, WORKDIR: building up the filesystem',
      p: [
        '`RUN <command>` executes a shell command DURING the build, and whatever that command changes on the filesystem (installing a package, creating a directory) becomes a new read-only layer, permanently baked into the image. This is genuinely different from a container\'s writable layer covered last lesson — a RUN instruction\'s changes happen once, at build time, and become part of the image itself, not a disposable, per-container layer.',
        '`COPY <src> <dest>` copies files from your local build context (the directory `docker build` is run from) into the image, at build time — the standard way source code, config files, or a compiled binary actually get into the image. `WORKDIR <path>` sets the working directory for every subsequent instruction (RUN, COPY, CMD) in the file, creating that directory if it does not already exist — using it instead of `RUN cd <path>` matters because `RUN cd` only affects that ONE RUN instruction\'s own shell process, while WORKDIR persists for everything after it in the file.'
      ]
    },
    {
      h: 'ENV and EXPOSE: metadata that shapes runtime behavior',
      p: [
        '`ENV KEY=value` sets an environment variable that is baked into the image and automatically present in every container started from it — useful for configuration defaults an application reads at startup (a later lesson covers the more nuanced question of what kind of configuration belongs here versus supplied at runtime). `EXPOSE <port>` does NOT actually publish a port to the host machine — it is documentation, baked into the image, declaring which port(s) the containerized application listens on; actually making that port reachable from outside the container still requires the separate `-p` flag on `docker run` (covered in the CLI-essentials lesson), a common early point of confusion.',
        'Both instructions are metadata rather than filesystem changes, but they still each occupy their own layer in the image\'s history — a useful reminder that "layer" means "one step in the build," not strictly "one filesystem change."'
      ]
    },
    {
      h: 'CMD: what runs when the container starts',
      p: [
        '`CMD` specifies the default command a container runs when it starts — this is genuinely different from RUN, which executes during the BUILD and becomes part of the image; CMD instead defines what happens at CONTAINER START, every time, and does not execute at all during `docker build`. The preferred form is the JSON-array ("exec") syntax, `CMD ["node", "server.js"]`, which runs the command directly rather than through a shell — slightly more predictable signal handling (important for the graceful-shutdown behavior a later lesson covers) than the shell form, `CMD node server.js`.',
        'A Dockerfile can only have one CMD take effect — a later CMD instruction in the same file silently overrides an earlier one, rather than both running. `ENTRYPOINT` is a closely related instruction (briefly: it sets the actual executable, with CMD supplying default ARGUMENTS to it) that this lesson intentionally does not go deep on — for a first Dockerfile, CMD alone is the right default choice, and ENTRYPOINT is worth reaching for later specifically when you want a container to behave like a fixed, dedicated command-line tool rather than a flexible default that is easy to override.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s Blueprint, Read Top to Bottom, In Order',
      text: 'A Galley-La dock crew, working from Franky\'s written blueprint for the very first time, learns the hard way that the blueprint is not just a list of facts about the finished ship — it is a SEQUENCE, meant to be followed in a specific order, where each step genuinely depends on the ones before it. Skip ahead and try attaching the hull\'s outer plating before the frame underneath it is actually assembled, and there is nothing solid to attach it TO — the step is not just early, it is structurally impossible out of order. Iceburg, walking a newer apprentice through their first blueprint-guided build, makes the point plainly: every stage in the blueprint adds ONE new, concrete piece of the ship, permanently, on top of whatever already exists from the stages before it — you do not get to un-plate the frame later without redoing everything built on top of it since. Build the frame first, and the plating, wiring, and finishing touches after it all inherit a solid frame to attach to. Build them out of order, and there is no frame there to inherit at all.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Recipe Card, Step by Numbered Step',
      text: 'Monica\'s recipe cards are notoriously exact — not just a list of ingredients, but a strictly NUMBERED sequence, and she is genuinely unforgiving about anyone attempting to run the steps out of order. Rachel, cooking from one of Monica\'s cards for the first time and impatient to speed things up, tries seasoning the dish before the base sauce has actually finished reducing — and the result is not just "slightly wrong," it is structurally broken, because the seasoning step\'s entire instruction ("season the reduced sauce") assumed a reduced sauce already existed to season. Monica, tasting the result and immediately diagnosing exactly what went wrong without being told, explains it to Rachel in blunt, characteristically Monica terms: every single step on that card builds directly on whatever the PREVIOUS step already produced — reduce the sauce, THEN season the reduced sauce, THEN plate the seasoned reduced sauce — and reordering any of it does not just change the outcome, it breaks the entire chain of steps that came after the one you skipped.'
    },
    why: 'Franky\'s blueprint and Monica\'s recipe card both make the same point a Dockerfile makes structurally: it is not a flat, order-independent list of facts, it is a SEQUENCE, executed top to bottom, where each instruction (RUN, COPY, and the rest) produces one concrete result stacked directly on whatever the previous instructions already produced — exactly one new image layer per step, in exact written order, with no reordering after the fact.'
  },
  tech: [
    {
      q: 'What is the actual difference between RUN and CMD — why can\'t they be used interchangeably?',
      a: 'RUN executes during the BUILD (`docker build`), and its effects (installed packages, created files) become permanent, baked-in layers of the resulting image — it never runs again once the image is built. CMD defines the DEFAULT command a container runs when it STARTS (`docker run`), and it does not execute at all during the build — it is stored as metadata that gets executed fresh every time a new container starts from that image. Using RUN where CMD belongs would try to execute the application during the build (when it likely has no runtime environment ready yet, and the build would just hang or fail); using CMD where RUN belongs would mean the intended one-time setup step never actually happens, since CMD\'s command only runs at container start, not at build time.'
    },
    {
      q: 'Why doesn\'t EXPOSE actually make a container\'s port reachable from the host machine?',
      a: 'EXPOSE is purely declarative metadata baked into the image — it documents which port(s) the containerized process listens on, useful for tooling and for humans reading the Dockerfile, but it does not perform any actual network configuration. Making a port genuinely reachable from outside the container requires explicit PUBLISHING at container-run time, via `docker run -p <host-port>:<container-port>`, which sets up the actual network forwarding rule. This is a deliberate two-step design: the image declares what it CAN listen on; the person running the container decides, at run time, whether and how to actually expose that to the outside world — keeping that decision out of the image itself.'
    },
    {
      q: 'Why does instruction ORDER in a Dockerfile matter for build speed, not just correctness?',
      a: 'Docker\'s build cache works layer by layer, top to bottom: it reuses a cached layer for any instruction that is byte-identical to a previous build AND every instruction before it is also unchanged and cached. The instant one instruction changes (or its inputs change — e.g. a COPY\'d file\'s contents differ), that layer and EVERY layer after it in the file must be rebuilt from scratch, even if those later instructions themselves did not change. This is why the very next lesson\'s "dockerfile best practices" puts such emphasis on ordering — putting rarely-changing instructions (like installing dependencies) BEFORE frequently-changing ones (like copying application source code) means routine code changes only invalidate the cache from that point forward, not the whole file.'
    }
  ],
  code: {
    title: 'A complete, minimal Dockerfile for a small Node app',
    intro: 'Every instruction here maps directly to one of this lesson\'s four concept sections — read it top to bottom as the sequence it actually is.',
    code: `# FROM: start from an official Node.js base image
FROM node:20-slim

# WORKDIR: everything below happens relative to /app inside the image
WORKDIR /app

# COPY: bring in just the dependency manifest first (see next lesson for why)
COPY package.json package-lock.json ./

# RUN: install dependencies — becomes a permanent layer in the image
RUN npm install --production

# COPY: now bring in the actual application source code
COPY . .

# ENV: a default environment variable, baked into the image
ENV PORT=3000

# EXPOSE: documentation — the app listens on 3000 (does NOT publish it)
EXPOSE 3000

# CMD: what runs when a container starts from this image
CMD ["node", "server.js"]`,
    notes: [
      'Build it with `docker build -t my-app .` (the trailing `.` is the build context — the directory Docker reads COPY sources from).',
      'Run it with `docker run -p 3000:3000 my-app` — note the explicit `-p`, without which EXPOSE alone would not make port 3000 reachable from your machine.'
    ]
  },
  lab: {
    title: 'Write a Dockerfile for a small Python app',
    prompt: 'Write a Dockerfile for a Python Flask app with this structure: base image python:3.12-slim, working directory /app, install dependencies from requirements.txt BEFORE copying the rest of the source, set an ENV variable FLASK_ENV=production, document that it listens on port 5000, and run app.py with python as the default command.',
    starter: `# FROM: use python:3.12-slim


# WORKDIR: /app


# COPY: just requirements.txt first


# RUN: pip install -r requirements.txt


# COPY: the rest of the source


# ENV: FLASK_ENV=production


# EXPOSE: 5000


# CMD: run app.py with python
`,
    checks: [
      { re: 'FROM\\s+python:3\\.12-slim', flags: 'i', must: true, hint: 'FROM python:3.12-slim', pass: 'FROM ✓' },
      { re: 'WORKDIR\\s+/app', flags: 'i', must: true, hint: 'WORKDIR /app', pass: 'WORKDIR ✓' },
      { re: 'COPY\\s+requirements\\.txt', flags: 'i', must: true, hint: 'COPY requirements.txt (alone, before the rest) ./ or similar', pass: 'COPY requirements.txt first ✓' },
      { re: 'RUN\\s+pip\\s+install\\s+-r\\s+requirements\\.txt', flags: 'i', must: true, hint: 'RUN pip install -r requirements.txt', pass: 'RUN pip install ✓' },
      { re: 'ENV\\s+FLASK_ENV\\s*=\\s*production', flags: 'i', must: true, hint: 'ENV FLASK_ENV=production', pass: 'ENV ✓' },
      { re: 'EXPOSE\\s+5000', flags: 'i', must: true, hint: 'EXPOSE 5000', pass: 'EXPOSE ✓' },
      { re: 'CMD\\s*\\[\\s*"python"\\s*,\\s*"app\\.py"\\s*\\]', flags: 'i', must: true, hint: 'CMD ["python", "app.py"] — JSON-array form', pass: 'CMD ✓' }
    ],
    run: 'Try it for real: docker build -t my-flask-app . then docker run -p 5000:5000 my-flask-app',
    solution: `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install -r requirements.txt

COPY . .

ENV FLASK_ENV=production

EXPOSE 5000

CMD ["python", "app.py"]`,
    notes: [
      'requirements.txt is copied and installed BEFORE the rest of the source specifically so code-only changes do not invalidate the (slow) pip install layer — the very subject of the next lesson.',
      'CMD uses the JSON-array form deliberately, for the more predictable signal handling mentioned in this lesson\'s concept section.'
    ]
  },
  quiz: [
    {
      q: 'What does the FROM instruction do?',
      options: ['Deletes the previous image', 'Picks an existing image as the starting point that every later instruction builds layers on top of', 'Sets an environment variable', 'Publishes a port to the host'],
      correct: 1,
      explain: 'FROM chooses the base image — the starting layer stack — for everything the rest of the Dockerfile adds.'
    },
    {
      q: 'Why does the order of instructions in a Dockerfile affect build speed?',
      options: ['It does not — Docker always rebuilds every layer from scratch', 'Docker\'s build cache reuses unchanged layers, but a change to any instruction invalidates the cache for that instruction AND every one after it', 'Later instructions run faster than earlier ones automatically', 'Instruction order only affects readability, not performance'],
      correct: 1,
      explain: 'Docker caches layers top to bottom. Any changed instruction invalidates its own layer and every subsequent layer\'s cache, which is why frequently-changing instructions should come last.'
    },
    {
      q: 'What is the key difference between RUN and CMD?',
      options: ['They are exactly the same, just different names', 'RUN executes at build time and its results become permanent image layers; CMD defines the default command executed at container start time, every time', 'CMD executes at build time; RUN executes at container start', 'RUN can only be used once per Dockerfile; CMD can be used unlimited times'],
      correct: 1,
      explain: 'RUN\'s effects are baked into the image during docker build. CMD is stored as metadata and only actually executes when a container starts from the image.'
    },
    {
      q: 'What does EXPOSE actually do?',
      options: ['It automatically publishes the port to the host machine', 'It is documentation baked into the image about which port the app listens on — actually publishing requires -p at docker run time', 'It opens a firewall rule on the host', 'It sets the port the container will use to build the image'],
      correct: 1,
      explain: 'EXPOSE is metadata only. Making a port genuinely reachable from the host requires the explicit -p flag on docker run.'
    },
    {
      q: 'Why is WORKDIR preferred over using `RUN cd <path>` before other commands?',
      options: ['WORKDIR is faster to type', 'RUN cd only changes directory for that single RUN instruction\'s own shell process; WORKDIR persists for every subsequent instruction in the file', 'They are functionally identical in every way', 'WORKDIR is required by Docker and RUN cd is not allowed'],
      correct: 1,
      explain: 'Each RUN instruction runs in its own shell process, so a `cd` inside one RUN does not carry over to the next. WORKDIR sets the directory for all following instructions (RUN, COPY, CMD) persistently.'
    }
  ],
  pitfalls: [
    'Assuming EXPOSE alone makes a service reachable from outside the container — it is documentation only; `docker run -p` is what actually publishes a port.',
    'Copying all source code before installing dependencies, which invalidates the (often slow) dependency-install layer\'s cache on every single code change, even when dependencies themselves did not change — covered in depth next lesson.',
    'Using `RUN cd some/path && command` and expecting the directory change to persist to later instructions — it does not; use WORKDIR for anything meant to persist.'
  ],
  interview: [
    {
      q: 'Walk through what happens, layer by layer, when `docker build` processes a Dockerfile with FROM, RUN, COPY, and CMD instructions.',
      a: 'FROM establishes the starting layer stack from the chosen base image. Each subsequent RUN or COPY instruction executes in turn, and Docker checks its build cache first: if that instruction (and everything before it) matches a previous build exactly, the cached layer is reused; otherwise, the instruction actually executes and its result — files changed by RUN, files copied by COPY — becomes a new, permanent, read-only layer stacked on top of everything before it. CMD is different: it does not produce a filesystem layer at all in the traditional sense — it is stored as image metadata (the default command), and only actually executes later, when a container is created from the finished image via `docker run`.'
    },
    {
      q: 'A teammate writes a Dockerfile that installs dependencies AFTER copying the entire source tree. What is wrong with this, concretely, and how would you fix it?',
      a: 'The concrete problem is cache invalidation: because COPY of the full source tree happens before the dependency-install RUN, ANY change to ANY source file (even one unrelated to dependencies) invalidates the COPY layer\'s cache, which cascades to invalidate the dependency-install layer right after it too — meaning dependencies get needlessly reinstalled on every single build, even when the dependency manifest itself never changed, dramatically slowing down routine builds. The fix is reordering: copy only the dependency manifest (package.json, requirements.txt, etc.) first, run the install step, and only THEN copy the rest of the source — so a source-only change invalidates just the final COPY layer, and the (often much slower) install step keeps reusing its cached layer as long as the manifest itself is unchanged.'
    },
    {
      q: 'Explain the difference between EXPOSE and actually publishing a port, and why Docker separates these into two distinct steps.',
      a: 'EXPOSE is build-time, declarative metadata baked into the image, documenting which ports the containerized process is designed to listen on — it has no effect on host networking by itself. Publishing a port is a run-time decision, made explicitly via `docker run -p <host>:<container>`, which sets up actual network address translation so traffic to the host port reaches the container port. Docker separates these deliberately because the image author and the person running the container are often different people with different concerns: the image should be able to declare "I listen on 5000" without unilaterally deciding that port must always be exposed to the host network — the person actually running the container, in their specific environment, decides whether and how that exposure should happen.'
    },
    {
      q: 'Why might a Dockerfile use CMD in JSON-array ("exec") form rather than shell form, and when does that distinction actually matter in practice?',
      a: 'The JSON-array form (`CMD ["node", "server.js"]`) runs the specified process directly as PID 1 inside the container, with no intermediate shell. The shell form (`CMD node server.js`) instead runs `/bin/sh -c "node server.js"`, meaning the shell itself becomes PID 1, and your actual application runs as a CHILD of that shell. This matters concretely for signal handling: when Docker sends a stop signal (SIGTERM) to a container, it goes to PID 1 — with the exec form, your application receives it directly and can shut down gracefully; with the shell form, the shell process receives it, and whether/how that signal actually reaches your application as a child process depends on the shell\'s own signal-forwarding behavior, which is not always reliable and can cause slower or less graceful shutdowns (sometimes requiring Docker to escalate to SIGKILL after a timeout).'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover the instructions that appear in nearly every Dockerfile. This is what is underneath: exactly how the build cache decides "changed" vs. "unchanged," the ENTRYPOINT/CMD interaction in full, and the .dockerignore mechanism that keeps build context lean.',
    sections: [
      {
        h: 'How the build cache actually decides a layer is "unchanged"',
        p: [
          'For RUN instructions, Docker\'s cache key is essentially the exact instruction TEXT itself, compared byte-for-byte against the instruction that produced the cached layer — meaning even a purely cosmetic change (extra whitespace, a reordered flag) counts as "changed" and invalidates the cache, since Docker has no way to know the change is behavior-neutral. For COPY (and ADD) instructions, the cache key additionally includes a checksum of the actual file CONTENTS being copied — not just the instruction text — so `COPY . .` invalidates its cache the moment any file in the build context changes, even if the COPY instruction\'s text is identical to the previous build. This content-aware caching for COPY, combined with text-only caching for RUN, is exactly why splitting "copy manifest, install, copy rest of source" into separate steps works: the RUN install step\'s cache is keyed on its own unchanging instruction text plus the manifest COPY\'s content checksum, not on the full source tree\'s checksum.'
        ]
      },
      {
        h: 'ENTRYPOINT and CMD together: defaults vs. fixed behavior',
        p: [
          'CMD alone sets a default command that is trivially overridden — `docker run my-image echo hi` replaces the entire CMD with `echo hi`. ENTRYPOINT sets the actual fixed executable that always runs; CMD, when both are present, supplies DEFAULT ARGUMENTS to that entrypoint, which a `docker run` caller can still override, but only the arguments — the entrypoint executable itself stays fixed. For example, `ENTRYPOINT ["python", "app.py"]` with no CMD always runs exactly that; `ENTRYPOINT ["python"]` plus `CMD ["app.py"]` runs `python app.py` by default, but `docker run my-image other_script.py` would run `python other_script.py` instead — the entrypoint (python) stays fixed, only the argument changes. This pattern is genuinely common for images meant to behave like a dedicated CLI tool rather than a flexible, easily-replaced default process.'
        ]
      },
      {
        h: '.dockerignore: keeping the build context (and cache) clean',
        p: [
          'The "build context" is the entire directory tree `docker build` sends to the daemon before evaluating any instruction — by default, EVERYTHING in that directory, including things like `.git`, `node_modules`, or large local data files that should never end up baked into an image. A `.dockerignore` file, syntactically similar to `.gitignore`, excludes matching paths from being sent as part of the build context at all — smaller context means faster builds (less data transferred to the daemon) and, just as importantly, prevents accidentally COPY-ing something like a `.env` file full of local secrets into an image that might later be pushed to a shared registry, a genuinely common and serious real-world mistake.'
        ]
      }
    ]
  }
};
