window.LESSONS = window.LESSONS || {};
window.LESSONS['image-registries'] = {
  id: 'image-registries',
  title: 'Registries & Tags: Pushing, Pulling & Versioning Images',
  category: 'Part 2 — Building Good Images',
  timeMin: 30,
  summary: 'An image built locally with `docker build` only exists on the machine that built it — genuinely useless to a teammate, a CI runner, or a production cluster until it is pushed somewhere they can pull it FROM. This lesson covers registries (where images actually live once shared), the full anatomy of an image reference (registry/namespace/repository:tag), and the single tagging mistake — relying on `:latest` as if it meant something stable — that causes more confusing "which version is actually running" incidents than almost anything else in this course.',
  goals: [
    'Explain what a registry is and why a locally-built image needs one to be shared',
    'Parse the full anatomy of an image reference: registry/namespace/repository:tag',
    'Tag an image correctly and push it to a registry',
    'Explain precisely why `:latest` does not mean "the newest version" in any reliable sense',
    'Design a tagging strategy that makes "what is actually running in production" answerable at a glance'
  ],
  concept: [
    {
      h: 'What a registry actually is',
      p: [
        'A <b>registry</b> is a server (or hosted service) that stores images and serves them on request — `docker push` uploads an image TO a registry, `docker pull` downloads one FROM a registry, and `docker run <image>` implicitly pulls first if the image is not already present locally. Docker Hub is the default, well-known public registry (and where an unqualified image name like `nginx` or `alpine` is assumed to live, unless told otherwise) — but it is one option among many: GitHub Container Registry, GitLab Container Registry, AWS ECR, Google Artifact Registry, and self-hosted registries are all common, especially for private, organization-internal images.',
        'A locally-built image sitting only in `docker images` on one developer\'s laptop is invisible to everyone and everything else — a teammate cannot run it, a CI pipeline building on a fresh runner cannot use it, and (this course\'s later Kubernetes lessons depend on this directly) a cluster cannot schedule a container from an image it has no way to pull. Pushing to a registry is the step that actually makes an image SHAREABLE, which is why it sits directly in the middle of the CI/CD pipeline map from this course\'s very first lesson: build, then push, then deploy.'
      ]
    },
    {
      h: 'Anatomy of an image reference',
      p: [
        'A full image reference has the shape `[registry/][namespace/]repository[:tag]`. `nginx` alone actually expands to `docker.io/library/nginx:latest` — Docker Hub (`docker.io`) is the assumed registry when none is specified, `library` is the special namespace for Docker\'s own official images, and `latest` is the assumed tag when none is given. `myregistry.example.com/myteam/my-app:1.4.2` spells out every part explicitly: a specific self-hosted or third-party registry, a namespace (often an org or username), a repository name, and a specific tag.',
        'The <b>namespace</b> matters for organization and access control — `myteam/my-app` and `otherteam/my-app` are genuinely different repositories that happen to share a repository name, with potentially very different push/pull permissions attached to each namespace. The <b>tag</b> is what this lesson spends the most time on, since it is both the most commonly misused part of the reference and the part that determines exactly which build of an image you actually get.'
      ]
    },
    {
      h: 'Why `:latest` does not mean what it sounds like it means',
      p: [
        '`:latest` is not a special, automatically-maintained pointer to "whatever the newest build happens to be" in any enforced sense — it is simply the DEFAULT tag applied when no tag is explicitly specified on `docker build` or `docker push`, and it behaves exactly like any other tag: it points to whatever image was most recently pushed WITH that specific tag, and nothing stops an OLDER build from being re-tagged and re-pushed as `:latest` later, silently making "latest" point backward in time. Two different people building from two different commits, both forgetting to specify a tag, could both push as `:latest`, with the second push silently overwriting the first — and anyone pulling `:latest` afterward has no way to know, from the tag alone, which actual commit or build they are running.',
        'This ambiguity is exactly why relying on `:latest` in a production deployment is a genuinely common source of "wait, which version is actually running" incidents: if a rollback is needed, there is no way to pull "the version before latest" using the tag alone, since `:latest` carries no historical information whatsoever — it is a moving pointer with no built-in memory of what it used to point to.'
      ]
    },
    {
      h: 'A tagging strategy that actually answers "what is running"',
      p: [
        'The practical fix is tagging every real build with something SPECIFIC and immutable — a semantic version (`1.4.2`), a git commit SHA (`a1b2c3d`), or a build number (`build-4821`) — and treating that specific tag as the one that ever actually gets deployed, with `:latest` (if used at all) reserved purely as a convenience pointer for local development, never for anything running in a real environment. With this discipline, "what is running in production" is answerable exactly, just by checking which specific tag is currently deployed, and rolling back is simply re-deploying a previous, still-existing specific tag — no guessing, no ambiguity.',
        'Image digests (`@sha256:abc123...`, a content hash of the image itself) go a step further than even a specific tag: unlike a tag, which is just a mutable pointer that COULD theoretically be moved to a different image later, a digest refers to one exact, immutable set of bytes, permanently — genuinely useful for the highest-assurance deployments where even the (small, unlikely) possibility of a tag being silently repointed is unacceptable, at the cost of a much less human-readable reference than a semantic version tag.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Baratie\'s Menu Board Says "Today\'s Special" Every Single Day',
      text: 'The Baratie keeps a chalkboard reading "Today\'s Special" above the kitchen pass — updated fresh every single day with whatever Sanji actually cooked that morning, which is genuinely fine and useful IF you are standing in the restaurant reading it on the actual day in question. The problem surfaces when a customer, having eaten an amazing dish there last month, comes back specifically asking for "the special" by that exact label — and gets served whatever TODAY\'s special happens to be instead, which might be something completely different. Sanji, mildly exasperated explaining this to a regular who keeps making this mistake, is blunt about it: "Today\'s Special" was never a name for one specific dish — it is a label that gets silently REPOINTED to a new dish every single day, and if you actually want the exact dish you had last month, you need its real, specific name, not the label that happens to point somewhere different every day you ask.'
    },
    sitcom: {
      show: 'Friends',
      title: '"The New Guy\'s Chair" Keeps Meaning a Different Chair',
      text: 'At Central Perk, the regulars start calling one specific spot on the couch "the new guy\'s chair" — except "the new guy" keeps changing as new people cycle through the friend group\'s orbit over the months, and the LABEL "the new guy\'s chair" silently starts referring to a completely different actual person\'s usual seat each time, with nobody ever formally updating the meaning, it just drifts. Joey, trying to leave a note for someone to "meet me at the new guy\'s chair" weeks after the label had already silently shifted to mean someone else\'s spot, causes a mildly chaotic mix-up when two different people show up expecting to be the one being referred to. Chandler\'s explanation afterward is exactly the underlying issue: "the new guy\'s chair" was never actually a fixed name for one location — it is a label that quietly points to whoever is newest AT THE TIME someone says it, and if you actually mean one SPECIFIC person\'s seat, you need to just say their name.'
    },
    why: 'The Baratie\'s "Today\'s Special" and Central Perk\'s "the new guy\'s chair" are both labels that silently repoint to something different over time, with no memory of what they used to mean — exactly `:latest`, which is not a fixed reference to one specific build, just a mutable pointer to whatever was most recently pushed with that tag. A specific version tag (or, going further, an image digest) is the equivalent of using the actual dish\'s real name or the actual person\'s real name — unambiguous, regardless of what "latest" happens to mean today.'
  },
  tech: [
    {
      q: 'Concretely, what does `docker tag my-app:latest myregistry.example.com/myteam/my-app:1.4.2` do, and does it modify the original image?',
      a: '`docker tag` creates a NEW reference pointing to the exact same underlying image content — it does not copy, duplicate, or modify any actual image data, it simply adds another name by which that same image can be referred to. After this command, `my-app:latest` and `myregistry.example.com/myteam/my-app:1.4.2` both point to the identical image (confirmable by checking they share the same IMAGE ID in `docker images`); `docker push` is then typically run against the newly-tagged, fully-qualified reference, since Docker needs the registry hostname and namespace in the reference to know WHERE to push it to.'
    },
    {
      q: 'Why can two different people\'s builds both end up tagged `:latest`, and what actually happens when the second one is pushed?',
      a: 'Because `:latest` is simply the default tag applied whenever `docker build` or `docker push` is run without an explicit `-t`/tag argument — it carries no built-in mechanism preventing two unrelated builds from both using it. When the second build is pushed as `:latest`, the registry updates the `:latest` tag to point to that second image\'s content, and the FIRST image\'s content still exists in the registry (assuming it was not otherwise garbage-collected) but is no longer reachable via the `:latest` tag at all — anyone subsequently pulling `:latest` gets the second build, with no indication from the tag alone that a different image used to answer to that same name.'
    },
    {
      q: 'What is the practical difference between referencing an image by tag versus by digest (`@sha256:...`)?',
      a: 'A tag is a MUTABLE pointer — the registry lets it be reassigned to point at different image content over time (exactly the `:latest` problem this lesson covers), so pulling by tag today and pulling by the SAME tag next month could, in principle, return genuinely different image content. A digest is a content hash of the image itself — pulling by digest is guaranteed to return that EXACT, byte-identical image content every time, forever, because the digest IS derived from that content; there is no mechanism by which a digest could be "reassigned" to different content, since doing so would simply produce a different digest. Digests are less human-readable than a semantic version tag, which is why most workflows use specific version tags for everyday reference and reserve digest-pinning for situations demanding the strongest possible reproducibility guarantee.'
    }
  ],
  code: {
    title: 'Build, tag correctly, and push',
    intro: 'A transcript of the correct sequence — building once, tagging with a specific version, and pushing that specific tag.',
    code: `$ docker build -t my-app .
# ^ builds and tags as "my-app:latest" locally by default

$ docker tag my-app:latest myregistry.example.com/myteam/my-app:1.4.2
# ^ adds a second, fully-qualified, SPECIFIC tag pointing at the SAME image

$ docker images
REPOSITORY                                    TAG      IMAGE ID       SIZE
my-app                                        latest   a1b2c3d4e5f6   180MB
myregistry.example.com/myteam/my-app          1.4.2    a1b2c3d4e5f6   180MB
# ^ SAME IMAGE ID — these are two names for the identical image content

$ docker login myregistry.example.com
$ docker push myregistry.example.com/myteam/my-app:1.4.2
The push refers to repository [myregistry.example.com/myteam/my-app]
1.4.2: digest: sha256:9f8e7d6c5b4a... size: 1789

# On another machine (or in a CI pipeline / Kubernetes cluster):
$ docker pull myregistry.example.com/myteam/my-app:1.4.2
# ^ pulls that EXACT build, unambiguously — no guessing what "latest" means

# Rolling back later is just:
$ docker pull myregistry.example.com/myteam/my-app:1.4.1
# ^ the PREVIOUS specific tag still exists, still pullable, still exact`,
    notes: [
      'Building with -t my-app (no registry/namespace) is fine locally, but it must be re-tagged with the full registry/namespace/repo path before docker push knows where to send it.',
      'Notice the IMAGE ID stays identical across both tags — tagging never duplicates or changes image content, it only adds another name.'
    ]
  },
  lab: {
    title: 'Parse and fix a bad tagging habit',
    prompt: 'A CI pipeline currently runs `docker build -t myregistry.example.com/myteam/my-app .` (which defaults to :latest) and `docker push myregistry.example.com/myteam/my-app` on every merge to main, with production always pulling `:latest`. Rewrite the two commands to tag with the git commit SHA (available as $GIT_SHA) instead, and write one sentence explaining why this fixes the "which version is running" problem.',
    starter: `# Original (bad): always builds and pushes as :latest
# docker build -t myregistry.example.com/myteam/my-app .
# docker push myregistry.example.com/myteam/my-app

# Your fixed build command (tag with $GIT_SHA):


# Your fixed push command:


# Why this fixes the problem (one sentence):

`,
    checks: [
      { re: 'docker\\s+build\\s+-t\\s+myregistry\\.example\\.com/myteam/my-app:\\$GIT_SHA', flags: 'i', must: true, hint: 'docker build -t myregistry.example.com/myteam/my-app:$GIT_SHA .', pass: 'build tagged with $GIT_SHA ✓' },
      { re: 'docker\\s+push\\s+myregistry\\.example\\.com/myteam/my-app:\\$GIT_SHA', flags: 'i', must: true, hint: 'docker push myregistry.example.com/myteam/my-app:$GIT_SHA', pass: 'push with $GIT_SHA ✓' },
      { re: 'immutable|specific|unambiguous|exact|rollback', flags: 'i', must: true, hint: 'Explain that a commit-SHA tag is specific/immutable, unlike :latest, which makes "what is running" and rollback unambiguous.', pass: 'explanation present ✓' }
    ],
    run: 'Try it for real: in any repo, echo $(git rev-parse --short HEAD) to see a real commit SHA you could use as a tag.',
    solution: `# Your fixed build command (tag with $GIT_SHA):
docker build -t myregistry.example.com/myteam/my-app:$GIT_SHA .

# Your fixed push command:
docker push myregistry.example.com/myteam/my-app:$GIT_SHA

# Why this fixes the problem (one sentence):
Each build now gets its own specific, immutable tag tied to an exact commit, so "what is running in production" is answerable exactly, and rolling back means simply deploying a previous commit SHA's still-existing tag instead of guessing what :latest used to point to.`,
    notes: [
      'A commit SHA tag also creates a direct, traceable link from a running container back to the exact source code that produced it — genuinely useful when debugging a production issue.',
      ':latest is not removed from the registry by this change — it just stops being the tag production actually deploys, which is the part that matters.'
    ]
  },
  quiz: [
    {
      q: 'What is a registry, in one sentence?',
      options: ['A local cache of images on one machine', 'A server or hosted service that stores images and serves push/pull requests, making images shareable beyond the machine that built them', 'A tool for writing Dockerfiles', 'A synonym for a container'],
      correct: 1,
      explain: 'A registry is where images actually live once shared — docker push uploads to it, docker pull downloads from it.'
    },
    {
      q: 'In the image reference `myregistry.example.com/myteam/my-app:1.4.2`, what does "myteam" represent?',
      options: ['The registry hostname', 'The tag', 'The namespace — often an organization or username, distinguishing this repository from others with the same repository name', 'The image ID'],
      correct: 2,
      explain: 'The namespace sits between the registry hostname and the repository name, and typically governs access control and organization.'
    },
    {
      q: 'Why is relying on `:latest` in a production deployment risky?',
      options: ['It is not risky — latest always means the newest, most tested build', ':latest is just the default tag with no enforced meaning; it can be silently overwritten by any build, and it carries no history, making rollback and "what is running" ambiguous', 'latest tags cannot be pulled by production systems', ':latest images are always larger than versioned ones'],
      correct: 1,
      explain: ':latest is a mutable pointer to whatever was most recently pushed with that tag — it has no built-in guarantee of being the newest or most tested, and no memory of what it used to point to.'
    },
    {
      q: 'What does `docker tag` actually do to the underlying image?',
      options: ['It duplicates the image data under a new name', 'It creates a new reference (name) pointing to the exact same, unmodified image content', 'It rebuilds the image with a different tag', 'It compresses the image for the registry'],
      correct: 1,
      explain: 'Tagging only adds another name for the same image content — confirmable by the identical IMAGE ID shown for both tags in docker images.'
    },
    {
      q: 'What guarantee does an image digest (@sha256:...) provide that a tag does not?',
      options: ['Digests are always smaller than tags', 'A digest is a content hash — pulling by digest guarantees the exact same image content every time, since a digest cannot be reassigned to different content without becoming a different digest', 'Digests are human-readable version numbers', 'There is no difference between a tag and a digest'],
      correct: 1,
      explain: 'A digest is derived directly from the image content, so it cannot point to different content later — unlike a tag, which is a mutable, reassignable pointer.'
    }
  ],
  pitfalls: [
    'Deploying `:latest` to production and then having no reliable way to know exactly which build is currently running, or to roll back to a specific previous one.',
    'Forgetting that `docker tag` does not push anything by itself — it only creates a local reference; `docker push` is the separate step that actually uploads to the registry.',
    'Treating a private registry\'s access restrictions as equivalent to secrecy for anything baked into the image itself — registry privacy controls who can pull, not what a legitimate puller can extract (the previous lesson\'s subject).'
  ],
  interview: [
    {
      q: 'A production incident occurs, and the team cannot determine exactly which version of the application is currently deployed, because everything has always been deployed from `:latest`. How would you fix this going forward, and how would you handle the immediate incident?',
      a: 'For the immediate incident: check the actual running container\'s image ID (`docker inspect` or the equivalent in whatever orchestrator is in use) and cross-reference that specific ID against the registry\'s or CI system\'s build history to identify which commit it actually corresponds to — the tag alone (`:latest`) cannot answer this, but the underlying image ID/digest can, if build records were kept. Going forward, the fix is a tagging policy change: every CI build gets tagged with something specific and immutable (a git commit SHA or semantic version), production deployments always reference that specific tag rather than `:latest`, and `:latest` (if kept at all) is treated as a local-development convenience only, never something a real environment pulls from.'
    },
    {
      q: 'Explain why `:latest` can end up pointing to an OLDER build than what is already running, and why that is a genuinely dangerous failure mode.',
      a: '`:latest` is reassigned to whatever image was most recently PUSHED with that tag, which is not necessarily the most recently BUILT or most feature-complete version — if a hotfix branch is built and pushed as `:latest` after a newer feature branch\'s build was already pushed as `:latest`, the tag now points to the hotfix, and pulling `:latest` again returns something OLDER than what a previous pull already retrieved, with nothing about the tag itself indicating this happened. This is dangerous specifically in automated redeploy scenarios (e.g., a system configured to periodically re-pull `:latest` and restart) where a "rollback" could occur completely silently and unintentionally, with no deployment event, alert, or commit associated with the change in what is actually running.'
    },
    {
      q: 'What tagging convention would you recommend for a team shipping to production multiple times a day, and why?',
      a: 'I would recommend tagging every CI-built image with the git commit SHA it was built from (short SHA is usually sufficient and more readable), used as the actual deployment tag in every environment — this gives an exact, unambiguous, automatically-generated mapping from "what is running" back to "what code produced it," with zero manual versioning effort required per deploy. I would layer semantic-version tags (1.4.2) on top for RELEASE builds specifically, aimed at human-readable release communication rather than every single CI build, and keep `:latest` around only as a convenience default for local development pulls, explicitly excluded from any real deployment pipeline\'s configuration.'
    },
    {
      q: 'When would you choose to pin a deployment to an image digest rather than a specific version tag, given that both are far better than `:latest`?',
      a: 'A specific version tag is already immutable in PRACTICE if the team enforces a policy of never reusing or reassigning tags — but that immutability depends entirely on process discipline, not on any technical guarantee, since nothing stops someone from force-pushing a different image to an existing tag if they genuinely wanted to (accidentally or otherwise). A digest is immutable by CONSTRUCTION, not by policy — it is mathematically impossible for a digest to silently point to different content. I would reach for digest-pinning specifically in the highest-assurance scenarios: regulated environments requiring an auditable, tamper-evident record of exactly what was deployed, or any situation where the team cannot fully trust that tag-reuse policy will always be followed correctly by every contributor with push access.'
    }
  ]
};
