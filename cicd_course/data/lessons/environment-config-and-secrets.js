window.LESSONS = window.LESSONS || {};
window.LESSONS['environment-config-and-secrets'] = {
  id: 'environment-config-and-secrets',
  title: 'Config In, Secrets Out: Env Vars, Build Args & What Never Belongs in an Image',
  category: 'Part 2 — Building Good Images',
  timeMin: 35,
  summary: 'A Dockerfile\'s ENV instruction bakes a value into the image permanently — genuinely fine for a non-sensitive default, genuinely dangerous for a database password or API key, since anyone who later pulls or inspects that image can read it back out, even from an old layer that a later instruction supposedly "removed." This lesson draws the actual line: what configuration is safe and appropriate to bake into an image at build time, what belongs supplied at run time instead, and why a secret baked into any layer is effectively permanent and public the moment that image is pushed anywhere shared.',
  goals: [
    'Distinguish build-time configuration (ARG) from run-time configuration (-e / ENV) and know when to use each',
    'Explain precisely why a secret set via ENV or a RUN command is not actually removed by a later instruction',
    'Explain why an image pushed to any shared registry should be treated as effectively public for anything baked into it',
    'Use Docker BuildKit secrets (or an equivalent mechanism) to use a credential during build without baking it into the image',
    'Design a 12-factor-style config strategy: safe defaults in the image, real values supplied at deploy/run time'
  ],
  concept: [
    {
      h: 'ARG vs. ENV: build-time input vs. baked-in, run-time-visible value',
      p: [
        '`ARG <name>` declares a build-time variable, supplied via `docker build --build-arg NAME=value`, available ONLY during the build itself (usable in later Dockerfile instructions) and, critically, NOT automatically present as an environment variable in containers run from the finished image, unless a later `ENV` instruction explicitly re-exposes it. `ENV <name>=<value>` sets a variable that IS baked into the image\'s metadata and IS automatically present in every container started from it — the previous lessons\' example, `ENV PORT=3000`, is exactly this: a genuinely permanent, image-level default.',
        'The practical distinction: ARG is appropriate for values needed only to CONTROL the build itself (which version of a dependency to install, which build target to compile) and that the running application itself has no need to see. ENV is appropriate for genuinely safe, non-sensitive RUNTIME defaults the application reads at startup — never for anything that should not be visible to everyone who ever pulls or inspects the resulting image.'
      ]
    },
    {
      h: 'Why a secret baked into ANY layer is not actually removed by deleting it later',
      p: [
        'A genuinely common, genuinely dangerous mistake: `RUN echo $API_KEY > /tmp/key && do-something-with-key && rm /tmp/key`, on the assumption that the final `rm` cleans up the secret. It does not, in the sense that matters: each RUN/COPY/ENV instruction creates its own PERMANENT, immutable layer, and a later instruction can only ADD a new layer on top — it cannot retroactively erase content from an earlier layer\'s own history. The file existed, fully, in an earlier layer; `rm` in a later layer only makes it invisible in the FINAL merged filesystem view, while the actual bytes remain permanently present and extractable from that earlier layer, readable by anyone with the image (`docker save`, then simply un-tarring it, is enough to recover it — no special tooling required).',
        'This is not a Docker bug or an edge case — it is a direct, structural consequence of the same immutable, read-only layering that makes images reproducible and cacheable in the first place. The only way to genuinely keep a secret out of an image\'s history is to make sure it never gets written into ANY layer at all, not to write it and then attempt to delete it afterward.'
      ]
    },
    {
      h: 'A pushed image should be treated as effectively public',
      p: [
        'Once an image is pushed to any shared registry — even a "private" one — it should be treated, for the purposes of this decision, as though anyone with pull access could extract anything baked into it, because that is literally true: pulling an image and inspecting its layers (`docker save`, `docker history`, or simply running a container and looking around) is a completely standard, unprivileged operation, not some exotic attack requiring special access. A "private" registry restricts WHO can pull the image, but says nothing about what someone who legitimately CAN pull it — a teammate, a CI system, a future employee — is able to extract from it once they have.',
        'This reframes the actual question from "is this registry private enough" to "would I be comfortable if EVERYONE who can pull this image could read this value" — for a database password, an API key, a TLS private key, the honest answer is almost always no, regardless of how restricted the registry access itself is.'
      ]
    },
    {
      h: 'The correct pattern: build-time secrets that never land in a layer, run-time secrets injected at deploy',
      p: [
        'For secrets genuinely needed DURING the build (e.g., a private package-registry credential to install a dependency), Docker BuildKit\'s `RUN --mount=type=secret` mounts a secret file into the build environment for the DURATION of that one RUN instruction only — it is available to the command being run, but is never written into the resulting layer at all, solving the "rm doesn\'t actually help" problem structurally rather than by convention. For secrets the running APPLICATION needs (a database password, an API key), the correct pattern is supplying them at RUN/deploy time — `docker run -e DB_PASSWORD=...` locally, or (as a later lesson covers) a Kubernetes Secret object in production — never baked into the image at all, so the exact same image can be safely reused across dev/staging/production environments, each supplying its own environment-appropriate values at deploy time.',
        'This is the core of what is often called 12-factor-app configuration: the image itself should be identical, generic, and safe to share across every environment, with everything environment-specific (and everything sensitive) supplied externally at run time — never baked in as a fixed part of the image itself.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s Map Never Shows Where the Treasure Actually Is',
      text: 'Nami draws exquisitely detailed maps — genuinely precise, showing coastlines, currents, and island layouts other navigators would kill for — and hands them out freely to any crew she trusts enough to trade information with. But there is one thing that never, ever appears on any map she hands to someone else: the actual precise location of her own hidden treasure stash. Early on, Usopp, trying to be helpful, once suggests just marking the stash location on the map and "crossing it out" before sharing it with a particularly trustworthy ally — surely that hides it? Nami\'s answer is immediate and completely dismissive of the idea: a crossed-out mark on a map still tells anyone paying attention roughly where to dig, and worse, the ORIGINAL map, the one Nami drew before crossing anything out, still exists somewhere with the real mark plainly visible — "crossing it out" on a copy does nothing to un-draw it from the original. The only actually safe map is one that never had the treasure\'s location drawn on it in the first place, not one that had it drawn and then covered up after the fact.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Vault Combination Was Never Actually On the Whiteboard',
      text: 'Sheldon keeps a shared physics whiteboard, photographed and shared with collaborators constantly — genuinely useful, genuinely meant to be seen by other people. Early in setting up his home office, he briefly writes his apartment\'s security-panel code directly on a corner of that same whiteboard as a personal reminder, then erases just that corner before the whiteboard\'s next photograph goes out to a collaborator. Leonard, who happened to see the whiteboard BEFORE that corner was erased (in an earlier photo Sheldon had already sent that morning), points out the actual problem with visible alarm: the code was already captured, permanently, in that earlier photo, sitting in a collaborator\'s inbox — erasing the physical whiteboard afterward does precisely nothing to un-send that already-shared image. Sheldon\'s eventual, grudging fix is not "erase it faster next time" — it is to never write anything genuinely sensitive on the shared whiteboard in the first place, keeping it on a completely separate, never-photographed, never-shared piece of paper instead.'
    },
    why: 'Nami\'s crossed-out map mark and Sheldon\'s erased whiteboard corner both make the same point: once something sensitive has been WRITTEN and captured — a copied map, an earlier photograph — removing it afterward does not un-capture it from wherever it already exists. That is exactly a Docker image layer: a secret written into an earlier RUN or ENV instruction is permanently captured in that layer\'s history, and a later `rm` is exactly the crossed-out map mark — visually gone from the final view, but still fully present and recoverable in the layer that came before it.'
  },
  tech: [
    {
      q: 'Why does ARG not automatically make a value available as an environment variable inside a running container, while ENV does?',
      a: 'ARG and ENV are designed for genuinely different purposes and different lifetimes. ARG values exist only DURING the build process — available to be used by later Dockerfile instructions (e.g., to select a version number, or as an input to a RUN command) — but the finished image\'s metadata does not include ARG values as environment variables by default, precisely because ARG values are frequently build-time-only inputs (like a build-arg specifying which internal package-registry mirror to use) that the running application has no legitimate need to see or reference. ENV values ARE written into the image\'s metadata specifically so every container started from it automatically has that variable available at runtime — if you genuinely want an ARG value to also be visible at runtime, the explicit, deliberate way to do that is `ARG MY_ARG` followed by `ENV MY_ARG=$MY_ARG`, making that choice an intentional one rather than an accident of which instruction happened to be used.'
    },
    {
      q: 'Concretely, why does `docker save` (or just unpacking an image\'s layers) let someone recover a value that a later RUN instruction deleted with `rm`?',
      a: 'A Docker image is stored on disk as a set of layer archives (roughly, tarballs), one per instruction that produced filesystem changes, stacked and referenced in order. `docker save <image>` exports the complete set of these layer archives, including every one of them individually — not just the final merged view a running container would see. Opening the SPECIFIC layer archive that corresponds to the RUN instruction which wrote the secret shows that secret\'s file, present and complete, exactly as it was written — a LATER layer\'s `rm` instruction only adds a "this file is deleted" marker to a SUBSEQUENT layer in the stack; it does not and cannot modify or erase the earlier layer\'s own archived content. This is genuinely simple, unprivileged tooling — no exploit or special access is required, just `docker save` and a standard archive tool.'
    },
    {
      q: 'What does `RUN --mount=type=secret,id=mysecret cat /run/secrets/mysecret` actually do differently from a normal ENV-based secret, mechanically?',
      a: 'BuildKit\'s secret mount makes the secret file available at a specific path (here, `/run/secrets/mysecret`) ONLY for the duration of that ONE RUN instruction\'s execution — it is mounted fresh for that instruction and explicitly excluded from the layer that instruction produces, by design, at the BuildKit engine level rather than by convention or a later cleanup step. This is a structural guarantee rather than a "please remember to delete it" pattern: even if the RUN command itself never explicitly removes anything, the secret still never appears in the resulting image\'s layer history, because BuildKit never writes it there to begin with — solving the exact problem that "write it, use it, then rm it" fails to solve.'
    }
  ],
  code: {
    title: 'Build-time secret, correctly, with BuildKit',
    intro: 'A private package registry token, used only during install, never baked into any layer.',
    code: `# syntax=docker/dockerfile:1
FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json .npmrc.template ./

# The secret is mounted ONLY for this one RUN instruction's duration —
# it is never written into any image layer, by BuildKit's design.
RUN --mount=type=secret,id=npm_token \\
    NPM_TOKEN=$(cat /run/secrets/npm_token) && \\
    sed "s/TOKEN_PLACEHOLDER/$NPM_TOKEN/" .npmrc.template > .npmrc && \\
    npm install --production && \\
    rm .npmrc
# ^ the rm here is just tidiness for THIS layer's own files —
#   the real safety came from --mount=type=secret, not from this rm

COPY . .
CMD ["node", "server.js"]

# Build with:
# docker build --secret id=npm_token,src=./npm_token.txt -t my-app .
# ^ npm_token.txt itself is NEVER copied or baked in — only mounted transiently`,
    notes: [
      'The `# syntax=docker/dockerfile:1` line at the top is required to opt into the BuildKit frontend features like --mount=type=secret.',
      'Contrast this with `ENV NPM_TOKEN=abc123` or `ARG NPM_TOKEN` used directly in a RUN command without --mount — either of those WOULD leave the token recoverable in the image\'s layer history.'
    ]
  },
  lab: {
    title: 'Spot the leaked secret',
    prompt: 'This Dockerfile snippet has a real secret-leakage bug. Identify which instruction leaks the secret into the image\'s permanent layer history, and rewrite the snippet so the same install works without ever baking the credential into any layer (use the --mount=type=secret pattern).',
    starter: `FROM python:3.12-slim
WORKDIR /app
ARG PYPI_TOKEN
ENV PYPI_TOKEN=$PYPI_TOKEN
RUN pip install --extra-index-url https://user:$PYPI_TOKEN@pypi.example.com/simple mypackage
COPY . .
CMD ["python", "app.py"]

# Which line leaks the secret, and why?


# Your fixed version (use --mount=type=secret):

`,
    checks: [
      { re: 'ENV\\s+PYPI_TOKEN', flags: 'i', must: false, hint: 'The fixed version should NOT use ENV to hold the secret at all — that is exactly what leaks it.', pass: 'No ENV holding the secret ✓' },
      { re: '--mount=type=secret', flags: 'i', must: true, hint: 'Use RUN --mount=type=secret,id=... to make the credential available only for that one RUN instruction, never baked into a layer.', pass: '--mount=type=secret used ✓' },
      { re: '/run/secrets/', flags: 'i', must: true, hint: 'Read the secret from its mounted path, /run/secrets/<id>, inside the RUN instruction.', pass: 'reads from /run/secrets/ ✓' },
      { re: 'syntax=docker/dockerfile', flags: 'i', must: true, hint: 'Add the # syntax=docker/dockerfile:1 line to opt into BuildKit secret mounts.', pass: 'syntax directive present ✓' }
    ],
    run: 'Try it for real: docker build --secret id=pypi_token,src=./token.txt -t my-app . and confirm docker history shows no trace of the token.',
    solution: `# The leak: the original ENV instruction bakes the token into the image's
# metadata permanently — every container run from this image, and anyone
# who inspects it, can read it straight out. The RUN instruction using it
# in a URL also writes it into that layer's history regardless.

# syntax=docker/dockerfile:1
FROM python:3.12-slim
WORKDIR /app
RUN --mount=type=secret,id=pypi_token \\
    PYPI_TOKEN=$(cat /run/secrets/pypi_token) && \\
    pip install --extra-index-url https://user:$PYPI_TOKEN@pypi.example.com/simple mypackage
COPY . .
CMD ["python", "app.py"]`,
    notes: [
      'ARG followed by ENV is a doubly bad pattern here: ARG alone would already leak into build history in some Docker versions/logging, and the ENV instruction makes it permanently part of the image\'s runtime-visible metadata on top of that.',
      'The fix does not change WHAT gets installed — only HOW the credential is made available during that one step, without it ever being written to a layer.'
    ]
  },
  quiz: [
    {
      q: 'What is the key difference between ARG and ENV in a Dockerfile?',
      options: ['They are exactly interchangeable', 'ARG is a build-time-only value not automatically present in running containers; ENV is baked into the image and automatically present in every container run from it', 'ENV only works during the build; ARG only works at runtime', 'ARG can only be used once per Dockerfile'],
      correct: 1,
      explain: 'ARG values exist only during the build process. ENV values are written into the image and appear automatically in every container started from it.'
    },
    {
      q: 'A Dockerfile writes a secret to a file with RUN, uses it, then deletes it with `rm` in the same RUN instruction. Is the secret actually removed from the image?',
      options: ['Yes, rm permanently deletes it from the image', 'No — each RUN/COPY/ENV instruction creates a permanent, immutable layer, and a later rm only hides the file from the final merged view, not from the earlier layer\'s own archived history', 'Only if --no-cache is used during the build', 'It depends on which base image is used'],
      correct: 1,
      explain: 'Docker layers are immutable once created. rm in a later step only masks the file in the merged filesystem view — the earlier layer still contains it, recoverable via docker save.'
    },
    {
      q: 'Why should an image pushed to a "private" registry still be treated as effectively public for anything baked into it?',
      options: ['Private registries are always misconfigured', 'Registry privacy restricts WHO can pull the image, but anyone who legitimately can pull it can trivially extract anything baked into its layers', 'Docker does not support private registries', 'Private registries automatically strip secrets from images'],
      correct: 1,
      explain: 'Pulling and inspecting an image (docker save, docker history) is a standard, unprivileged operation. Registry access control says nothing about what a legitimate puller can extract.'
    },
    {
      q: 'What does BuildKit\'s `RUN --mount=type=secret` do that a plain ENV-based secret does not?',
      options: ['It encrypts the secret inside the image permanently', 'It makes the secret available only for the duration of that one RUN instruction, and structurally never writes it into any resulting layer', 'It automatically rotates the secret', 'It is functionally identical to ENV, just newer syntax'],
      correct: 1,
      explain: '--mount=type=secret mounts the secret transiently for one RUN instruction and never includes it in the layer that instruction produces — a structural guarantee, not a cleanup convention.'
    },
    {
      q: 'In a 12-factor-style configuration strategy, where should a database password live?',
      options: ['Baked into the image via ENV, so it is always available', 'Supplied externally at run/deploy time (docker run -e, or a Kubernetes Secret) — never baked into the image itself', 'In a comment in the Dockerfile for documentation', 'ARG is sufficient since it is build-time only'],
      correct: 1,
      explain: 'Sensitive, environment-specific values should be supplied at run time, keeping the image itself identical and safe to share across every environment.'
    }
  ],
  pitfalls: [
    'Believing `rm` in a later Dockerfile instruction actually removes a secret written in an earlier one — it only hides it from the final view; the earlier layer still contains it permanently.',
    'Treating a "private" registry as sufficient protection for a secret baked into an image — private controls WHO can pull, not what a legitimate puller can extract once they have.',
    'Using ARG for a value that the running application actually needs, forgetting that ARG values are not automatically present as environment variables in the running container without an explicit ENV re-exposing them.'
  ],
  interview: [
    {
      q: 'A security review flags that an old, no-longer-used image in your registry contains a database password from six months ago, even though that password was rotated and the image was later rebuilt without it. Why is this possible, and what should actually happen next?',
      a: 'It is possible because the OLD image is a separate, already-built, immutable artifact — rebuilding a NEWER image without the password does nothing to the older image, which still sits in the registry with its own layer history containing the old password intact, permanently, exactly as it was written to that layer originally. The password having been rotated helps (an attacker extracting it from the old image gets a credential that no longer works), but the correct immediate actions are: confirm the rotation genuinely happened and the old credential is fully invalidated everywhere, delete the old image (and any other historical images built the same insecure way) from the registry, and fix the actual root cause in the Dockerfile so future images never bake the secret in at all — rotation alone does not retroactively make a leaked-into-history secret safe if it somehow gets reused or if related systems were not equally rotated.'
    },
    {
      q: 'Explain, mechanically, why "delete the secret in a later RUN instruction" fails to actually protect it, using Docker\'s layer model specifically.',
      a: 'Each RUN, COPY, or ENV instruction in a Dockerfile produces its own distinct, immutable, read-only layer, stacked on top of the layers before it — this is the exact same layering mechanism that makes builds cacheable and images shareable, and it applies with no special exception for instructions that happen to write sensitive data. A later `rm` instruction produces ANOTHER new layer, whose only effect is a "this path is deleted" marker that changes what a MERGED view across all layers shows — it does not and structurally cannot reach back and modify or erase the actual archived content of an earlier layer. Anyone with the image can extract that earlier layer\'s archive directly (via `docker save` plus a standard unpacking tool) and read the secret exactly as it was originally written, completely bypassing the later deletion marker, because they are simply not looking at the merged view a running container would show — they are looking at the raw layer history itself.'
    },
    {
      q: 'How would you audit an existing set of Dockerfiles and CI pipelines for secret-leakage risk, and what specific patterns would you flag?',
      a: 'I would search Dockerfiles for ARG or ENV instructions with names suggesting sensitive values (TOKEN, PASSWORD, KEY, SECRET), and for RUN instructions that reference credentials directly in a command (especially in a URL, as in the lab\'s pip --extra-index-url example) without a --mount=type=secret — both patterns risk baking a secret into layer history. I would also check CI configuration for build-arg usage passing secrets (`--build-arg PASSWORD=...`), since build args can leak into build logs or, without care, into the image itself depending on how they are subsequently used. For anything flagged, the fix is migrating to BuildKit secret mounts for build-time credentials and externally-supplied environment variables or a secrets-management system for run-time credentials — and, for any image that already shipped with a baked-in secret, treating that credential as compromised and rotating it, since the old image (even if later superseded) remains a permanent historical record of it.'
    },
    {
      q: 'Why is the distinction between "build-time configuration" and "run-time configuration" useful for deciding what belongs in a Dockerfile at all, beyond just the secrets question?',
      a: 'Build-time configuration (which dependency version to install, which build target to compile) genuinely only matters for PRODUCING the image, and belongs as ARG, kept out of the running application\'s visible environment entirely, since baking a build-only detail in as a permanent runtime-visible ENV needlessly widens what the image exposes and can make images subtly less interchangeable across environments than they should be. Run-time configuration that differs legitimately by environment (which database to connect to, feature-flag values, log verbosity) belongs supplied externally at deploy time — not baked in as ENV at all — specifically so the SAME image, byte-for-byte, can be safely and confidently deployed to dev, staging, and production, with only the externally-supplied values differing. Getting this distinction right is what makes "build once, deploy the identical artifact everywhere" (a core CI/CD principle this course builds toward) actually achievable, rather than needing a separately-built image per environment.'
    }
  ]
};
