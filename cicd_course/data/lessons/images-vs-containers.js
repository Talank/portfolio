window.LESSONS = window.LESSONS || {};
window.LESSONS['images-vs-containers'] = {
  id: 'images-vs-containers',
  title: 'Images vs. Containers: A Class and Its Instances',
  category: 'Part 1 — Docker Fundamentals',
  timeMin: 30,
  summary: 'The single most important vocabulary distinction in Docker, and the one beginners blur together most often: an IMAGE is a read-only, layered template — inert, unchanging, sitting on disk or in a registry. A CONTAINER is a running (or stopped) instance created FROM an image, with its own thin writable layer on top. One image can produce any number of independent containers, exactly the way one class definition can produce any number of independent objects — and confusing the two is the source of a large fraction of early Docker confusion, including "why did my changes disappear."',
  goals: [
    'State the precise distinction between an image and a container in one sentence',
    'Explain the union filesystem / layered structure that makes images efficient to store and share',
    'Explain why changes made inside a running container do not persist to the image it came from',
    'Run multiple independent containers from the same image and observe their isolation from each other',
    'Use docker images and docker ps/docker ps -a to distinguish what exists as an image vs. a container'
  ],
  concept: [
    {
      h: 'An image is a class; a container is an instance',
      p: [
        'An <b>image</b> is a read-only template: a specific, versioned filesystem snapshot plus metadata (what command to run, what ports it expects, what environment variables it wants) — built once, from a Dockerfile, and then never modified. A <b>container</b> is what you get when you actually RUN an image: a live (or stopped) process with its own writable layer on top of that image\'s read-only layers, and its own namespace/cgroup restrictions, exactly as the earlier "just a process" idea described. The relationship is precisely a class-and-instance relationship from object-oriented programming: the image is the definition, the container is a concrete instantiation of it, and — crucially — you can create MANY containers from the same one image, each completely independent of the others, the same way many objects can be instantiated from one class.',
        'This is why `docker run <image>` can be executed repeatedly, producing a brand-new, independent container each time, without ever modifying or "using up" the image itself. The image sitting on disk after ten `docker run` calls is byte-for-byte identical to the image before the first one — it is inert, unchanging, exactly like a class definition is not altered by creating objects from it.'
      ]
    },
    {
      h: 'Images are layered, and layers are shared',
      p: [
        'An image is not one monolithic blob — it is a stack of read-only <b>layers</b>, each one typically corresponding to one instruction in the Dockerfile that built it (covered in the next lesson), stored using a union filesystem that presents them to a running container as one seamless merged view. This layering is not just an implementation detail — it is the mechanism that makes Docker genuinely efficient in practice: if two different images share several of the same base layers (say, both built `FROM` the same base OS image), Docker stores that shared layer ONCE on disk and reuses it for both images, rather than duplicating it. Pulling a new image that shares layers with one you already have only downloads the layers you are actually missing.',
        'Layers are also why image builds can be fast on repeated builds: Docker caches each layer\'s result, and if a given instruction and everything before it in the Dockerfile has not changed, Docker reuses the cached layer instead of rebuilding it — a mechanism the next-but-one lesson (dockerfile-best-practices) leans on heavily for build speed.'
      ]
    },
    {
      h: 'A container\'s writable layer: where changes actually go, and why they vanish',
      p: [
        'When a container starts, Docker adds one more layer on top of the image\'s read-only stack: a thin, container-specific <b>writable layer</b>. Any file changes made while the container runs — a log file being written, a temp file being created, even a package installed by hand inside a running container — land in THAT writable layer, not in the underlying read-only image layers, which remain genuinely untouched. This is precisely why installing something by hand inside a running container, then deleting that container, makes the change disappear entirely: it was never in the image to begin with, only in that specific container\'s now-deleted writable layer.',
        'This is a feature, not a bug, once it is understood correctly: it is exactly what makes many independent containers from the same image safe to run simultaneously — container A writing files does not affect container B\'s view, container B\'s changes do not affect container A, and neither affects the shared, read-only image layers underneath both of them. The correct way to make a change PERMANENT is not to hand-edit a running container — it is to change the Dockerfile and rebuild the image, so the change becomes part of the image\'s own read-only layers instead of one container\'s disposable writable layer.'
      ]
    },
    {
      h: 'Seeing the distinction in the CLI',
      p: [
        '`docker images` lists what IMAGES exist locally — inert templates, none of them "running" in any sense, each with a repository name, a tag, and a size that reflects its layers (with shared layers not double-counted across images that share them). `docker ps` lists RUNNING containers; `docker ps -a` lists every container regardless of state — created, running, or exited — each one a distinct instantiation, even if several were created from the exact same image.',
        'Running `docker run <image>` three times, then checking `docker ps -a`, shows three separate container entries, each with its own unique container ID and its own independent writable layer — while `docker images` still shows exactly one entry for the image they all came from, unchanged in size or content by however many containers have been created from it.'
      ]
    }
  ],
  conceptFlow: {
    title: 'One image, three independent containers',
    intro: 'Click through to see how one read-only image produces multiple independent running containers, each with its own writable layer.',
    stages: [
      {
        label: 'Start',
        nodes: [
          { id: 'image', text: 'IMAGE (read-only)\nlayered filesystem + metadata\non disk, inert, unchanging' }
        ]
      },
      {
        label: 'docker run (x3)',
        nodes: [
          { id: 'c1', text: 'Container A\nimage layers (read-only)\n+ its OWN writable layer' },
          { id: 'c2', text: 'Container B\nimage layers (read-only)\n+ its OWN writable layer' },
          { id: 'c3', text: 'Container C\nimage layers (read-only)\n+ its OWN writable layer' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'Changes in A, B, or C stay in THAT\ncontainer\'s writable layer only —\nthe shared image underneath never changes' }
        ]
      }
    ],
    steps: [
      { active: ['image'], note: 'The image is a stack of read-only layers, sitting on disk, unchanged by anything that happens next.' },
      { active: ['c1'], note: 'docker run creates Container A: the same read-only image layers, plus a new, empty writable layer just for A.' },
      { active: ['c2'], note: 'A second docker run creates Container B — independently. B shares the SAME underlying read-only image layers as A (no duplication), but has its own separate writable layer.' },
      { active: ['c3'], note: 'A third docker run creates Container C, same story. Three independent containers, one shared image.' },
      { active: ['result'], note: 'Write a file inside Container A: it lands only in A\'s writable layer. B and C never see it, and the original image on disk is completely unaffected.' }
    ]
  },
  story: {
    onePiece: {
      title: 'One Recipe Book, Three Independent Kitchens',
      text: 'Sanji writes down one exact, finished recipe for a specific dish — ingredients, quantities, method, all fixed and written once. That recipe book itself never changes no matter how many times it is used; it just sits on the shelf, an unchanging reference. When three different island restaurants each want to serve that dish, each one INDEPENDENTLY cooks their own batch, starting from that same one recipe — and crucially, whatever any one kitchen does DURING cooking (a chef improvising a garnish, burning one batch slightly, running out of an ingredient partway through) stays entirely within that one kitchen\'s pan, that one night. One kitchen\'s burnt batch does not retroactively burn the recipe book, and does not affect what the OTHER two kitchens are independently cooking from that exact same written recipe. Sanji, visiting all three restaurants afterward, is characteristically precise about the distinction a confused new cook keeps missing: the recipe is not "used up" or changed by any kitchen cooking from it, and nothing that happens in any one kitchen\'s pan ever writes itself back into the recipe book — only a NEW written recipe, deliberately updated, would actually change what future kitchens start from.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'One IKEA Instruction Sheet, Three Independent Bookshelves',
      text: 'Sheldon buys the exact same IKEA bookshelf model for three different rooms — one instruction sheet, printed once, describing exactly how to assemble it. That one instruction sheet does not get altered or consumed by being followed; Leonard, Howard, and Raj each independently assemble their OWN bookshelf from copies of the same unchanged sheet. And whatever happens during any one assembly — Howard stripping a screw, Raj mismatching two side panels and having to redo them, Leonard adding an extra shelf brace that was not in the instructions — stays entirely within THAT one bookshelf, in that one room. Howard\'s stripped screw does not retroactively appear in Raj\'s bookshelf, or change the instruction sheet itself for future builds. Sheldon, inspecting all three finished bookshelves with his usual excess of pedantry, makes exactly this point out loud to Penny, who is puzzled that all three shelves look at least slightly different despite "the same instructions": the sheet defines what SHOULD happen; what actually happened during each individual, independent assembly is a separate matter entirely, specific to that one shelf.'
    },
    why: 'The recipe/instruction sheet is the IMAGE: written once, unchanging, reusable any number of times. Each independent kitchen/bookshelf-build is a CONTAINER: a live instantiation with its own specific outcome, isolated from every other instantiation of the same source. Nothing that happens during one instantiation writes back into the shared, unchanging template — exactly Docker\'s image (read-only, shared) versus container (a live instance with its own disposable writable layer) relationship.'
  },
  tech: [
    {
      q: 'If I `docker exec` into a running container and install a package by hand, then stop and remove that container, why is the package gone?',
      a: 'Anything installed or changed while a container is running is written into that specific container\'s writable layer — a thin, container-scoped layer sitting on top of the image\'s read-only layers, created fresh when that container started. The underlying image layers are never touched by anything that happens inside a running container; they remain exactly as they were when the image was built. When the container is removed, its writable layer is deleted along with it, and since the package was only ever recorded in that now-deleted writable layer — never in the image\'s own read-only layers — it is genuinely gone, not hidden somewhere. The correct fix is adding an installation instruction to the Dockerfile and rebuilding the image, so the package becomes part of the image\'s permanent read-only layers instead.'
    },
    {
      q: 'Why does Docker store images as a stack of layers instead of one single flat filesystem snapshot?',
      a: 'Layering enables sharing and caching, both of which matter enormously in practice. Sharing: if two images both build `FROM` the same base image, or share several early Dockerfile instructions, Docker stores those shared layers on disk exactly once and both images reference the same copy — pulling a new image that shares layers with one you already have only needs to download the layers that differ. Caching: during a build, Docker can reuse a previously-built layer instead of rebuilding it, as long as that instruction and everything before it in the Dockerfile is unchanged — turning a full rebuild that might take minutes into an incremental one that takes seconds, which the very next lesson covers in more depth.'
    },
    {
      q: 'What is the actual difference between `docker images` and `docker ps -a`, and why would you use one over the other?',
      a: '`docker images` lists IMAGES — inert, read-only templates stored locally, each shown once regardless of how many containers have ever been created from it. `docker ps -a` lists CONTAINERS — every instantiation ever created from any image, running or stopped, each with its own unique ID even if several came from the identical image. Use `docker images` to answer "what templates do I have available to run" and `docker ps -a` to answer "what have I actually instantiated, and what state is each instantiation in" — genuinely different questions, and conflating them is exactly the source of confusion this lesson is addressing.'
    }
  ],
  code: {
    title: 'One image, three independent containers, observed directly',
    intro: 'A transcript showing the image staying constant while containers created from it multiply and diverge independently.',
    code: `$ docker images
REPOSITORY   TAG       IMAGE ID       SIZE
alpine       latest    9cee2b8cf8c9   7.8MB
# ^ exactly ONE image entry — this stays true no matter how many
#   containers we create from it below

$ docker run -d --name box-a alpine sleep 1000
$ docker run -d --name box-b alpine sleep 1000
$ docker run -d --name box-c alpine sleep 1000

$ docker ps
CONTAINER ID   IMAGE    COMMAND       NAMES
1a2b3c4d5e6f   alpine   "sleep 1000"  box-a
2b3c4d5e6f7a   alpine   "sleep 1000"  box-b
3c4d5e6f7a8b   alpine   "sleep 1000"  box-c
# ^ THREE independent containers, all from the ONE image above

$ docker exec box-a sh -c "echo hello > /tmp/note.txt"
$ docker exec box-a cat /tmp/note.txt
hello

$ docker exec box-b cat /tmp/note.txt
cat: can't open '/tmp/note.txt': No such file or directory
# ^ box-b never sees box-a's change — separate writable layers

$ docker images
REPOSITORY   TAG       IMAGE ID       SIZE
alpine       latest    9cee2b8cf8c9   7.8MB
# ^ still exactly one entry, still the same size — the image
#   itself was never touched by anything that happened in a-c`,
    notes: [
      '`sleep 1000` is used here just to keep the containers running long enough to exec into them — alpine has no default long-running process of its own.',
      'This is the single clearest way to internalize the distinction: run it yourself and watch `docker images` stay static while `docker ps` grows with every `docker run`.'
    ]
  },
  lab: {
    title: 'Classify: image operation or container operation?',
    prompt: 'For each Docker command below, write "IMAGE" if it operates on images (the template) or "CONTAINER" if it operates on containers (a running/stopped instance).',
    starter: `docker images       ->
docker ps -a         ->
docker run <image>   ->
docker rmi <image>   ->
docker rm <container> ->
docker exec <container> <cmd> ->
`,
    checks: [
      { re: 'docker\\s+images\\s*->\\s*image', flags: 'i', must: true, hint: 'docker images lists IMAGE templates.', pass: 'docker images -> IMAGE ✓' },
      { re: 'docker\\s+ps\\s*-a\\s*->\\s*container', flags: 'i', must: true, hint: 'docker ps -a lists CONTAINER instances.', pass: 'docker ps -a -> CONTAINER ✓' },
      { re: 'docker\\s+rmi.*->\\s*image', flags: 'i', must: true, hint: 'docker rmi removes an IMAGE.', pass: 'docker rmi -> IMAGE ✓' },
      { re: 'docker\\s+rm\\s.*->\\s*container', flags: 'i', must: true, hint: 'docker rm removes a CONTAINER.', pass: 'docker rm -> CONTAINER ✓' },
      { re: 'docker\\s+exec.*->\\s*container', flags: 'i', must: true, hint: 'docker exec runs a command inside a running CONTAINER.', pass: 'docker exec -> CONTAINER ✓' }
    ],
    run: 'Try it for real: run `docker images` and `docker ps -a` side by side on your own machine after a few `docker run` calls, and confirm which list grows and which stays fixed.',
    solution: `docker images       -> IMAGE (lists templates)
docker ps -a         -> CONTAINER (lists all instances, any state)
docker run <image>   -> CONTAINER (creates a new instance FROM an image)
docker rmi <image>   -> IMAGE (removes a template)
docker rm <container> -> CONTAINER (removes an instance)
docker exec <container> <cmd> -> CONTAINER (runs inside an existing instance)`,
    notes: [
      '`docker rmi` fails if a container (even a stopped one) still exists from that image — Docker will not silently delete a template something still depends on.',
      'Notice `docker run` is the one command that spans both concepts: it reads an IMAGE and produces a CONTAINER.'
    ]
  },
  quiz: [
    {
      q: 'What is the precise relationship between an image and a container?',
      options: ['They are two names for the same thing', 'An image is a read-only template; a container is a running (or stopped) instance created from that image, with its own writable layer', 'A container is what an image becomes after being deleted', 'An image is created FROM a container'],
      correct: 1,
      explain: 'An image is the inert, read-only template. A container is a live instantiation of it, analogous to a class and its instances — one image can produce many independent containers.'
    },
    {
      q: 'Why does Docker structure an image as a stack of layers instead of one flat snapshot?',
      options: ['Purely historical accident, with no real benefit today', 'It enables sharing identical layers across multiple images and caching unchanged layers between builds', 'Layers make images slower but more secure', 'It is required by every operating system'],
      correct: 1,
      explain: 'Layering lets Docker store shared layers once (saving disk and download time) and reuse cached, unchanged layers on rebuild (saving build time).'
    },
    {
      q: 'A change is made by hand inside a running container, then the container is removed. What happens to that change?',
      options: ['It is automatically saved back into the image', 'It is lost — it only ever existed in that container\'s writable layer, which is deleted along with the container', 'It is saved to a random other container', 'Docker prompts you to confirm before deleting it'],
      correct: 1,
      explain: 'Changes inside a running container live only in its own writable layer, never in the shared read-only image layers. Removing the container deletes that writable layer and the change with it.'
    },
    {
      q: 'What does `docker ps -a` show that `docker images` does not?',
      options: ['docker ps -a shows every container instance (running or stopped); docker images shows templates, not instances at all', 'They show exactly the same information', 'docker images shows running processes', 'docker ps -a shows disk usage per layer'],
      correct: 0,
      explain: 'docker ps -a lists container instances in any state. docker images lists the read-only templates those instances were created from — a fundamentally different kind of object.'
    },
    {
      q: 'Three containers are created from the same image, and one of them writes a new file. What do the other two see?',
      options: ['They all see the new file immediately, since they share the same image', 'Nothing changes for them — each container has its own independent writable layer, isolated from the others', 'The image itself is corrupted', 'Only the first container created can write files'],
      correct: 1,
      explain: 'Each container gets its own writable layer on top of the shared read-only image layers. Writes in one container\'s layer are invisible to sibling containers and never touch the shared image.'
    }
  ],
  pitfalls: [
    'Hand-editing a running container to "fix" something, then being surprised the fix disappears the next time that container (or a fresh one from the same image) starts — permanent changes belong in the Dockerfile, not in a live container\'s writable layer.',
    'Assuming `docker rmi` on an image will also clean up containers created from it — Docker refuses to remove an image that a container (even a stopped one) still depends on, and for good reason.',
    'Confusing "the image got bigger" with "a container using it wrote more data" — a container\'s writable-layer growth never changes the underlying image\'s own size on disk.'
  ],
  interview: [
    {
      q: 'Explain the image/container relationship the way you would to someone with a programming background but no Docker experience.',
      a: 'An image is analogous to a class definition: a fixed, unchanging specification — in this case, a layered filesystem snapshot plus metadata about what to run. A container is analogous to an instance of that class: created via `docker run`, it has its own independent state (a writable layer) layered on top of the shared, read-only image, exactly like an object has its own instance state built on a shared class definition. You can create arbitrarily many containers from one image, each fully independent of the others, the same way you can instantiate many objects from one class — and just as instantiating an object does not modify the class definition, running a container never modifies the image it came from.'
    },
    {
      q: 'Why is Docker\'s layered image format specifically important for both storage efficiency and build speed — walk through both.',
      a: 'Storage efficiency: when multiple images share identical layers (commonly a shared base OS image, or shared early Dockerfile instructions), Docker\'s content-addressed layer storage keeps exactly one copy of that shared layer on disk, referenced by every image that includes it, rather than duplicating it per image — meaningful at scale, where many images might share a common base. Build speed: Docker caches the result of each Dockerfile instruction as its own layer, and on a rebuild, it can reuse a cached layer instead of re-executing that instruction, as long as the instruction and everything before it in the file is byte-identical to the previous build — meaning a well-ordered Dockerfile (covered in the very next lesson) can turn a multi-minute rebuild into a few-second one when only late-file instructions changed.'
    },
    {
      q: 'A developer complains: "I ran a container, made some config changes to test something, then reran `docker run` on the same image later and my changes were gone — is this a bug?"',
      a: 'Not a bug — this is the writable-layer design working exactly as intended, and the actual mistake is a mental-model one, not a Docker one. Each `docker run` creates a NEW container with a fresh, empty writable layer on top of the image\'s unchanged read-only layers; it does not resume or reuse any previous container\'s writable layer unless you specifically reference that exact same container again (e.g., `docker start <same container>` rather than a new `docker run`). Config changes meant to persist across runs belong either in the image itself (add them to the Dockerfile and rebuild) or in an external, mounted volume (a later lesson\'s subject) — not in a container\'s disposable writable layer, which is scoped to exactly that one container instance.'
    },
    {
      q: 'How would you determine, from the CLI alone, whether disk space is being consumed primarily by images or by container writable layers?',
      a: '`docker images` (optionally with `--format` for sizes, or `docker system df` for a summary) shows space used by image layers, factoring in layer sharing across images. `docker ps -a -s` shows each container\'s writable-layer size specifically (the "size" column, distinct from the shared "virtual size" that includes the underlying image). `docker system df -v` gives the most complete breakdown, separating images, containers, and volumes into distinct categories with reclaimable-space estimates for each — genuinely useful when disk usage grows unexpectedly and it is not obvious whether stale images, abandoned stopped containers, or bloated writable layers are the actual cause.'
    }
  ]
};
