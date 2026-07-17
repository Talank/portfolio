window.LESSONS = window.LESSONS || {};
window.LESSONS['dockerfile-best-practices'] = {
  id: 'dockerfile-best-practices',
  title: 'Layer Caching & Multi-Stage Builds: Small, Fast, Reproducible Images',
  category: 'Part 2 — Building Good Images',
  timeMin: 40,
  summary: 'A Dockerfile that merely WORKS and a Dockerfile that is actually good at its job are different things: the difference is almost entirely about instruction ORDER (for build speed, exploiting the cache the previous lesson introduced) and about SEPARATING what you need to BUILD something from what you need to RUN it (for image size, via multi-stage builds). This lesson turns "I can write a working Dockerfile" into "I can write one a real team would accept in review" — smaller images, faster CI builds, and fewer accidental leftovers from the build toolchain shipped into production.',
  goals: [
    'Order Dockerfile instructions to maximize build-cache reuse on routine code changes',
    'Explain why a large image is a real cost, not just an aesthetic preference',
    'Write a multi-stage Dockerfile that separates a build stage from a slim runtime stage',
    'Explain what COPY --from=<stage> does and why it is the mechanism multi-stage builds rely on',
    'Choose an appropriately minimal base image for a given runtime, and explain the tradeoff involved'
  ],
  concept: [
    {
      h: 'Ordering for cache reuse: least-changing instructions first',
      p: [
        'The previous lesson established that a changed instruction invalidates its own build-cache layer and every layer after it. The direct, practical consequence: instructions that change RARELY (installing system packages, installing dependencies from a manifest) belong EARLY in the Dockerfile, and instructions that change OFTEN (copying application source code) belong LATE — so that a routine code change, which is the overwhelming majority of real commits, only invalidates the cache from that point forward, leaving the slow dependency-install step untouched and reused from cache.',
        'This is exactly why the previous lesson\'s example copied `package.json`/`requirements.txt` alone, installed dependencies, and only THEN copied the rest of the source — that ordering is not a stylistic preference, it is the single highest-leverage change available for keeping CI build times low as a codebase grows, since dependency installation is very often the slowest single step in the entire build.'
      ]
    },
    {
      h: 'Why image size is a real cost, not vanity',
      p: [
        'A larger image takes longer to build, longer to push to a registry, longer to pull on every machine that runs it (including, later in this course, every time Kubernetes schedules a new replica), and consumes more disk space at every one of those points — multiplied across every developer machine, every CI run, and every node in a production cluster, small size differences compound into real time and cost. A larger image also has a larger attack surface: more installed packages means more potential vulnerabilities to track and patch, even for software the running application never actually uses at runtime.',
        'The single biggest, most common source of unnecessary size: shipping an entire BUILD toolchain (compilers, dev headers, package-manager caches) inside the same image that actually RUNS in production, when that toolchain was only ever needed to PRODUCE the compiled artifact, never to run it. A compiled Go binary, for instance, needs the Go compiler to be BUILT but needs nothing but the resulting binary itself to RUN — shipping the compiler alongside it in the final image is pure, avoidable waste.'
      ]
    },
    {
      h: 'Multi-stage builds: separate the toolchain from the runtime',
      p: [
        'A multi-stage Dockerfile has more than one `FROM` instruction, each starting a new, independent BUILD STAGE — and, critically, `COPY --from=<stage-name>` lets a LATER stage copy specific files out of an EARLIER stage\'s filesystem, without carrying over anything else from that earlier stage. The pattern: an early stage, based on a full-featured image with a compiler/build tools, does the actual compiling; a final stage, based on a minimal runtime-only image, copies JUST the compiled artifact from the build stage via `COPY --from=build /app/binary /app/binary`, and ships that final stage as the actual image — the build stage\'s compiler, source code, and intermediate build files never appear in the final image at all.',
        'This routinely cuts image sizes by an order of magnitude for compiled languages — a Go or Rust build stage might be 1GB+ with its full toolchain, while the final runtime stage, containing only the compiled binary on a minimal base, can be tens of megabytes. Even for interpreted languages (Node, Python) where the win is less dramatic, multi-stage builds are still valuable for separating dev-only dependencies (test frameworks, linters, TypeScript compilers) from what actually needs to exist in the production image.'
      ]
    },
    {
      h: 'Choosing a base image: the size/compatibility tradeoff, made concrete',
      p: [
        'The earlier "FROM" lesson introduced this tradeoff briefly; multi-stage builds are exactly where it becomes a genuinely important decision for the FINAL stage specifically (the build stage\'s size matters far less, since it never ships). A "slim" variant (e.g. `node:20-slim`, `python:3.12-slim`) typically strips out documentation, some locale data, and build tools not needed at runtime, while staying on the same underlying glibc-based OS as the full image — usually the safest default, genuinely smaller with very low compatibility risk. An `alpine`-based variant goes further, built on the musl C library instead of glibc, and can be dramatically smaller still — but occasionally surfaces subtle compatibility issues with software (particularly compiled native dependencies) that assumes glibc is present, which is exactly why "just always use alpine" is not a universally safe default despite the appealing size numbers.',
        'A reasonable default sequence for choosing a final-stage base: start with the "slim" variant of the relevant official runtime image; only reach for `alpine` (and budget time to actually test for compatibility issues) if image size is a genuinely pressing concern, not as an automatic first choice made purely from the size column in a comparison table.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Forge Stays on the Dock; Only the Finished Blade Goes Aboard',
      text: 'Franky, building a new weapon for the crew, does all the actual forging — the furnace, the anvil, the raw ingots, the whole heavy, messy toolchain of turning ore into a blade — at a dedicated dock workshop, never on the Sunny itself. Once the blade is actually finished, exactly ONE thing makes the trip onto the ship: the completed blade. The furnace stays at the dock. The half-finished ingots stay at the dock. Every offcut and scrap from the forging process stays at the dock. Usopp, watching the process and initially assuming the whole forge would need to come aboard "just in case," gets corrected fast: the Sunny does not need to CARRY a forge to have a working blade — it only ever needed the forge to exist somewhere, temporarily, long enough to PRODUCE the one thing that actually matters for the voyage. Loading the forge itself onto the ship would just be dead weight, slowing everything down for a tool the voyage itself never actually uses again.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Test Kitchen Stays at the Restaurant; Only the Dish Goes to the Table',
      text: 'Monica, catering an event from her restaurant\'s test kitchen, does all the messy work there — mixing bowls, raw ingredients, failed early attempts at a garnish, every pot and pan the recipe needed along the way — and NONE of that mess travels to the actual event. What leaves the kitchen and arrives at the table is exactly one thing: the finished, plated dish. Rachel, helping load the catering van for the first time and instinctively trying to pack extra mixing bowls and ingredient bags "just in case something needs fixing on-site," gets stopped by Monica with a very specific correction: the venue does not need a working kitchen, it needs a finished dish, and the recipe\'s messy, ingredient-heavy PROCESS already happened, fully, back where it belonged — carrying that process along to the venue would just be extra weight and clutter for something the actual event never needed to touch again.'
    },
    why: 'Franky\'s dock forge and Monica\'s test kitchen both stay behind, contributing only their FINISHED output to what actually ships — exactly a multi-stage build\'s early "build" stage (the full toolchain, compilers, and intermediate mess) staying out of the final image, which receives only the finished artifact via COPY --from, via the exact same logic: you needed the toolchain to PRODUCE the result, never to actually USE it afterward.'
  },
  tech: [
    {
      q: 'Concretely, what does `COPY --from=build /app/binary /app/binary` do, and why can it reach into an EARLIER stage\'s filesystem?',
      a: 'In a multi-stage Dockerfile, each `FROM` instruction starts a new, independently-tracked build stage, optionally named via `FROM <image> AS build`. Docker keeps every stage\'s filesystem available (until the build finishes) specifically so a LATER stage can reach back and copy files out of an earlier one — `COPY --from=build /app/binary /app/binary` tells Docker "take the file at /app/binary from the stage named build, and copy it to /app/binary in THIS stage." Only the files explicitly copied this way carry over; everything else in the build stage (the compiler, intermediate files, source code not explicitly copied) is simply never included in the final stage\'s image, and stages that are never referenced by the final `FROM` are not even part of the resulting image at all.'
    },
    {
      q: 'Why does dependency-manifest-first ordering matter MORE as a codebase grows, rather than being a fixed, one-time optimization?',
      a: 'The benefit scales with how often source code changes relative to how often dependencies change — and in almost any actively developed codebase, source commits vastly outnumber dependency-manifest changes. Every one of those routine source-only commits, with correct ordering, reuses the cached dependency-install layer and only rebuilds the (typically fast) final COPY-and-CMD layers; without correct ordering, EVERY commit re-triggers a full dependency reinstall, and as a project\'s dependency tree grows larger over time, that reinstall step itself tends to get slower, compounding the cost of the wrong ordering on every single build, not just occasionally.'
    },
    {
      q: 'Why is "just use alpine everywhere for the smallest possible image" not automatically good advice?',
      a: 'Alpine\'s dramatic size reduction comes partly from using musl libc instead of the glibc most Linux software (and most pre-built binary dependencies) is built and tested against — for pure interpreted-language code with no native dependencies, this is usually a non-issue, but for anything with compiled native extensions (common in Python/Node ecosystems) or software that assumes glibc-specific behavior, alpine can surface genuinely confusing runtime errors that a glibc-based "slim" image would not, and diagnosing them costs real engineering time. The honest tradeoff is: alpine\'s size win is real and often worth it, but it needs to be a DELIBERATE choice, verified by actually testing the application on it, not a reflexive default chosen purely because it is the smallest number in a base-image comparison chart.'
    }
  ],
  code: {
    title: 'A multi-stage Dockerfile for a compiled Go service',
    intro: 'Two FROM instructions, two stages — only the second stage\'s content becomes the final image.',
    code: `# ---- Stage 1: build ----
FROM golang:1.22 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server .
# ^ this stage ends up ~900MB (full Go toolchain) — but it never ships

# ---- Stage 2: runtime ----
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/server /app/server
# ^ ONLY the compiled binary crosses over from stage 1
EXPOSE 8080
CMD ["/app/server"]
# ^ final image: ~15MB — no compiler, no source code, no Go toolchain at all`,
    notes: [
      '`AS build` names the first stage so the second stage can reference it by name in `COPY --from=build` — an unnamed stage can also be referenced by its index (--from=0), but naming is far more readable.',
      'CGO_ENABLED=0 produces a fully static binary with no dynamic library dependencies, which is exactly what makes it able to run on a minimal base like alpine with essentially nothing else installed.'
    ]
  },
  lab: {
    title: 'Convert a single-stage Dockerfile into a multi-stage one',
    prompt: 'This single-stage Dockerfile works but ships the entire Node.js dev toolchain (including devDependencies and a TypeScript compiler) into production. Rewrite it as a two-stage build: stage 1 (named "build", using node:20) installs ALL dependencies and runs `npm run build` to compile TypeScript to dist/; stage 2 (a slim final image, using node:20-slim) installs ONLY production dependencies and copies just the compiled dist/ folder from stage 1.',
    starter: `# ORIGINAL (single-stage, ships everything):
# FROM node:20
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm install
# COPY . .
# RUN npm run build
# CMD ["node", "dist/server.js"]

# YOUR two-stage rewrite:

# ---- Stage 1: build ----


# ---- Stage 2: runtime ----

`,
    checks: [
      { re: 'FROM\\s+node:20\\s+AS\\s+build', flags: 'i', must: true, hint: 'Stage 1: FROM node:20 AS build', pass: 'Stage 1 FROM ... AS build ✓' },
      { re: 'RUN\\s+npm\\s+install', flags: 'i', must: true, hint: 'Stage 1 needs full npm install (including devDependencies) to run the TypeScript build.', pass: 'npm install in build stage ✓' },
      { re: 'RUN\\s+npm\\s+run\\s+build', flags: 'i', must: true, hint: 'Stage 1: RUN npm run build compiles TypeScript to dist/.', pass: 'npm run build ✓' },
      { re: 'FROM\\s+node:20-slim', flags: 'i', must: true, hint: 'Stage 2: FROM node:20-slim — the minimal runtime base.', pass: 'Stage 2 FROM node:20-slim ✓' },
      { re: 'npm\\s+install\\s+--(production|omit=dev)', flags: 'i', must: true, hint: 'Stage 2 should install ONLY production dependencies (npm install --production or --omit=dev).', pass: 'production-only install in runtime stage ✓' },
      { re: 'COPY\\s+--from=build\\s+/app/dist', flags: 'i', must: true, hint: 'Stage 2: COPY --from=build /app/dist ./dist copies only the compiled output.', pass: 'COPY --from=build ✓' }
    ],
    run: 'Try it for real: build both versions (docker build) and compare `docker images` sizes side by side.',
    solution: `# ---- Stage 1: build ----
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]`,
    notes: [
      'Stage 2 does its OWN production-only npm install rather than copying node_modules from stage 1 — this avoids copying devDependencies (TypeScript, test frameworks) that stage 1 needed but the running app never does.',
      'Only the compiled dist/ folder crosses the stage boundary via COPY --from=build — the TypeScript source and compiler never appear in the final image.'
    ]
  },
  quiz: [
    {
      q: 'Why should dependency-installation instructions come BEFORE copying application source code in a Dockerfile?',
      options: ['It is required by Docker syntax', 'Source code changes far more often than dependencies, so this ordering keeps the (often slow) install step cached and reused on routine code changes', 'It makes the Dockerfile shorter', 'Dependencies must always be the first instruction in any Dockerfile'],
      correct: 1,
      explain: 'Placing rarely-changing instructions early maximizes cache reuse: a source-only change only invalidates the layers from that point forward, leaving the dependency-install layer cached.'
    },
    {
      q: 'What is the core mechanism a multi-stage Dockerfile uses to keep build tools out of the final image?',
      options: ['Deleting the build tools with a RUN rm command at the end', '`COPY --from=<stage>`, which copies only specific files from an earlier stage into a later one, leaving everything else behind', 'A special .dockerignore entry', 'Multi-stage builds automatically compress all layers into one'],
      correct: 1,
      explain: 'COPY --from=<stage> selectively copies files across stages. Only what is explicitly copied ends up in the later stage; the earlier stage\'s full toolchain never does.'
    },
    {
      q: 'Why is a smaller image size a real, practical cost concern rather than just aesthetics?',
      options: ['Smaller images are always more secure with no tradeoffs', 'Larger images take longer to build, push, and pull everywhere they are used, and carry a larger attack surface from unused installed packages', 'Image size has no effect on anything except disk space', 'Docker charges by image size'],
      correct: 1,
      explain: 'Size compounds across every build, push, pull, and deployment — plus more installed packages means more potential vulnerabilities to track, even for things never used at runtime.'
    },
    {
      q: 'What is the tradeoff between an alpine-based final image and a "slim" (glibc-based) final image?',
      options: ['There is no real difference between them', 'Alpine is typically smaller but uses musl libc instead of glibc, which can occasionally cause compatibility issues with software expecting glibc — slim is a safer default, alpine a deliberate size-motivated choice worth testing', 'Slim images are always smaller than alpine images', 'Alpine cannot run any compiled software at all'],
      correct: 1,
      explain: 'Alpine\'s size advantage comes with a real compatibility tradeoff (musl vs. glibc) that should be a deliberate, tested choice rather than an automatic default.'
    },
    {
      q: 'In a multi-stage Dockerfile, what happens to a build stage that no later stage ever references via COPY --from?',
      options: ['It causes a build error', 'It is not included in the final image at all — only stages actually referenced by the final image contribute anything to it', 'It is included anyway, just marked as unused', 'It replaces the final stage entirely'],
      correct: 1,
      explain: 'Only files explicitly copied via COPY --from end up in later stages. A build stage that nothing copies from contributes nothing to the final resulting image.'
    }
  ],
  pitfalls: [
    'Copying the entire source tree before installing dependencies out of habit, silently defeating the build cache on every single commit — the single most common, most impactful Dockerfile mistake.',
    'Copying node_modules (or an equivalent dependency directory) wholesale from the build stage instead of doing a fresh production-only install in the final stage — this often drags devDependencies along unintentionally.',
    'Switching to alpine purely because it is the smallest base in a comparison chart, without actually testing the application against musl libc\'s subtle behavioral differences from glibc.'
  ],
  interview: [
    {
      q: 'A CI pipeline\'s Docker build step takes 8 minutes for what should be a one-line code change. How would you diagnose and likely fix this?',
      a: 'The first suspect is Dockerfile instruction ordering: if application source code is copied BEFORE dependencies are installed, every single code change — even a one-line one — invalidates the cache for the dependency-install layer too, forcing a full reinstall on every build regardless of how small the actual change was. I would inspect the Dockerfile for that pattern specifically, and reorder it so the dependency manifest is copied and installed FIRST, with application source copied afterward — that alone often takes an 8-minute build down to well under a minute for source-only changes, since the (usually slow) dependency-install layer would then be reused from cache instead of rerun.'
    },
    {
      q: 'Explain multi-stage builds to someone who has only ever written single-stage Dockerfiles, including a concrete example of when they matter most.',
      a: 'A multi-stage Dockerfile has more than one FROM instruction, each starting an independent build stage; a later stage can selectively copy specific files out of an earlier stage via `COPY --from=<stage>`, without inheriting anything else from it. This matters most for compiled languages: a build stage based on a full toolchain image (say, `golang:1.22`, at nearly a gigabyte) compiles the source into a single binary, and the final stage, based on a minimal runtime image (say, `alpine`, at a few megabytes), copies ONLY that compiled binary across — shipping a final image that might be 15MB instead of 900MB+, because the compiler, source code, and intermediate build artifacts never appear in what actually ships. Even for interpreted languages, it is valuable for separating dev-only tooling (test frameworks, TypeScript compilers, linters) from what genuinely needs to exist at runtime.'
    },
    {
      q: 'How would you decide, for a specific service, whether to use a "slim" or an "alpine" base image for its final stage?',
      a: 'I would start with "slim" as the safe default, since it stays on the same glibc-based foundation most software (including compiled native dependencies) is built and tested against, while still trimming meaningful size compared to the full base image. I would only move to alpine if image size were a genuinely pressing concern — high deployment frequency at scale, tight registry storage costs, or slow network pulls in a constrained environment — and I would budget real time to actually test the application against alpine specifically, watching for anything that depends on glibc-specific behavior or ships pre-built native binaries assuming glibc, rather than assuming compatibility and finding out the hard way in production.'
    },
    {
      q: 'Why does Docker\'s build cache key for a COPY instruction include file content, while a RUN instruction\'s cache key is based only on the instruction text itself — and why does that distinction matter for how you structure a Dockerfile?',
      a: 'A RUN instruction\'s outcome depends only on the command text and the state of the filesystem at that point in the build — Docker has no efficient way to know in advance whether re-running an identical command would produce a different result, so it caches based on instruction-text equality plus upstream layer state. A COPY instruction\'s outcome depends directly on the CONTENTS of the files being copied, which Docker can and does check via content hashing — so a COPY layer\'s cache is correctly invalidated the moment the copied files\' actual content changes, even if the COPY instruction\'s text is identical. This is exactly why splitting "COPY manifest, RUN install, COPY rest of source" works as a caching strategy: the RUN install step\'s cache key depends on the manifest COPY\'s content hash (which changes rarely) rather than the full source tree\'s content hash (which changes on nearly every commit) — structuring COPY instructions narrowly and early is what makes this optimization actually effective.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover ordering and multi-stage builds as the two highest-leverage techniques. This is what is underneath: BuildKit\'s cache-mount feature for genuinely persistent package-manager caches, distroless images as an even more minimal alternative to alpine, and how to actually measure whether an optimization made a real difference.',
    sections: [
      {
        h: 'BuildKit cache mounts: persisting a package-manager cache ACROSS builds, not just within one',
        p: [
          'Ordinary layer caching only reuses a layer if the instruction and its inputs are unchanged — the moment a dependency manifest DOES change, even by one line, the entire install step reruns from scratch, redownloading every dependency, not just the changed one. BuildKit (Docker\'s modern build engine, the default in current Docker versions) supports `RUN --mount=type=cache,target=/root/.npm npm install` (or the equivalent cache path for pip, apt, cargo, etc.) — this mounts a PERSISTENT cache directory that survives ACROSS separate builds, not just within one, so even a full manifest change only needs to download packages that are not already sitting in that persistent cache from a previous build. This is a genuinely different mechanism from ordinary layer caching, and it is worth reaching for specifically when dependency manifests change often enough that ordinary layer-cache reuse alone is not enough.'
        ]
      },
      {
        h: 'Distroless: going further than alpine by removing the shell entirely',
        p: [
          'Google\'s "distroless" base images go a step further than alpine\'s size reduction: they contain essentially nothing but the language runtime and its direct dependencies — no shell, no package manager, no coreutils. This has a genuinely different motivation than pure size: a distroless final image has almost nothing for an attacker to exploit even AFTER gaining code execution inside the container, since there is no shell to spawn, no package manager to install additional tools with, nothing beyond the application\'s own runtime. The tradeoff is debuggability: `docker exec -it <container> sh` — this course\'s CLI-essentials lesson\'s go-to debugging move — simply does not work against a distroless container, since there is no shell inside it at all, which is a genuinely serious operational tradeoff worth weighing deliberately, not a strictly-better upgrade over alpine.'
        ]
      },
      {
        h: 'Actually measuring the difference: docker history and docker images',
        p: [
          '`docker history <image>` lists every layer in an image along with each layer\'s individual size and the instruction that created it — the single best way to actually SEE where an image\'s size is coming from, rather than guessing, and it will immediately reveal a bloated layer (an unnecessarily large RUN instruction, an accidentally-copied large file) that a size-focused Dockerfile review should target first. `docker images` with `--format` flags, or the newer `docker scout` tooling, gives comparable overall-size numbers before and after a change — the honest practice worth adopting is measuring BEFORE claiming an optimization worked, since some intuitive-seeming changes (like switching base images) occasionally save far less than expected once layer sharing with other images already on a machine is accounted for.'
        ]
      }
    ]
  }
};
