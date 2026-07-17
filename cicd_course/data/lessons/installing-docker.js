window.LESSONS = window.LESSONS || {};
window.LESSONS['installing-docker'] = {
  id: 'installing-docker',
  title: 'Installing Docker & Your First Container',
  category: 'Part 0 — From Process to Pipeline',
  timeMin: 25,
  summary: 'Before writing a single Dockerfile, this lesson gets Docker itself installed and running, and explains the piece almost every "what is Docker" explanation skips: the CLI you type commands into and the daemon that actually does the work are two separate things, talking over an API — and the difference matters the moment something is not behaving as expected. It ends with the smallest possible real container, run for real, to confirm everything is wired up correctly before anything else in this course builds on top of it.',
  goals: [
    'Install Docker Desktop (Mac/Windows) or Docker Engine (Linux) and confirm it is running',
    'Explain the client/daemon split: the docker CLI is a thin client, dockerd is the actual engine',
    'Run a container for the first time and explain exactly what happened, step by step',
    'Distinguish "the container exited" from "the container failed" — a source of early confusion',
    'Know where to look first when `docker` commands fail: is the daemon actually running?'
  ],
  concept: [
    {
      h: 'What you are actually installing: a daemon, not just a command',
      p: [
        'Docker is not one program — it is (at minimum) two. <b>dockerd</b>, the Docker daemon, is a long-running background process that does the actual work: building images, starting and stopping containers, managing networks and volumes. The <b>docker</b> command you type is a comparatively thin CLI client that sends requests to dockerd over an API (a Unix socket on Linux/Mac, a named pipe on Windows) and prints back whatever dockerd reports. This split matters practically: "Docker" being installed does not automatically mean the daemon is RUNNING, and a huge fraction of early "docker doesn\'t work" confusion is actually "the daemon is not running" wearing a more mysterious-looking error message.',
        'Docker Desktop (Mac/Windows) bundles a small Linux virtual machine that actually runs dockerd, because containers are fundamentally a Linux kernel feature — Docker Desktop makes that VM close to invisible, but it is genuinely there, which is why Docker Desktop needs to be running (not just installed) before any `docker` command will succeed. On native Linux, dockerd runs directly on the host kernel with no VM layer needed at all — one of the reasons Linux servers remain the most common place to actually run Docker in production.'
      ]
    },
    {
      h: 'Installing it, per platform',
      p: [
        'Mac and Windows: install Docker Desktop from Docker\'s official site, then actually LAUNCH the Docker Desktop application — installation alone does not start the daemon; it needs to be running (look for the whale icon in the menu bar/system tray) before any CLI command will succeed. Linux: install Docker Engine directly via your distribution\'s package manager (the exact steps differ by distro), then `sudo systemctl enable --now docker` to make sure dockerd both starts now and starts automatically on future boots — familiar territory if you have already done the Linux course\'s systemd-services lesson, since dockerd is, itself, just another systemd-managed service.',
        'One Linux-specific wrinkle worth fixing immediately: by default, the `docker` command needs root privileges, because it talks to a socket owned by root. Adding your user to the `docker` group (`sudo usermod -aG docker $USER`, then logging out and back in) lets you run `docker` commands without typing `sudo` every single time — genuinely convenient, though worth knowing that membership in that group is effectively root-equivalent access to the whole machine, since anyone in it can, through Docker, mount arbitrary host paths into a container.'
      ]
    },
    {
      h: 'Confirming it actually works',
      p: [
        '`docker --version` only confirms the CLI is installed — it does NOT confirm the daemon is reachable, a distinction worth internalizing early. `docker info` is the real check: it asks the daemon for its own status, and a working setup prints back real details (server version, number of containers, storage driver); a daemon that is not running instead prints a clear connection-refused-style error, telling you exactly where to look.',
        'The canonical first real test is `docker run hello-world` — a deliberately tiny image whose entire job is printing an explanation of what Docker just did to pull and run it, then exiting. Running it successfully confirms every layer of the stack works end to end: the CLI reached the daemon, the daemon pulled an image from a registry, and the daemon successfully started a container from it.'
      ]
    },
    {
      h: '"Exited" is not the same as "failed" — a genuinely common early confusion',
      p: [
        'Running `docker run hello-world` and then `docker ps` immediately afterward shows an empty list — no running containers — which looks alarming the first time you see it, as if the container vanished or crashed. It did neither: `hello-world`\'s whole job was to print its message and immediately exit, and a container, being just a process, stops existing (as a RUNNING container) the moment its main process exits — exactly the same way a shell script ends the instant its last line finishes running. `docker ps -a` (note the `-a`) shows ALL containers, including stopped ones, and confirms `hello-world` exited with status 0 — a clean, successful, INTENTIONAL exit, not a crash.',
        'This distinction — a container that has finished its job and exited cleanly, versus one that has actually failed — comes up constantly once you are running longer-lived services (a web server, a database) later in this course, where an unexpected exit genuinely does mean something went wrong. Learning to check the exit CODE (`docker ps -a`, or `docker inspect` for the precise value) rather than just "is it still in `docker ps`" is the actual skill this lesson is planting early.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Log Pose Needs Setting Before It Points Anywhere',
      text: 'A Log Pose is useless the instant it comes out of the box — it has to be SET at a specific island first, absorbing that island\'s unique magnetic signature before it will reliably point toward the next one. A brand-new crew member, eager to start navigating immediately, tries reading an unset Log Pose and gets nothing coherent — not because the device is broken, but because the actual working PART of it (the magnetic core actively syncing to a location) has not started yet, even though the device itself is physically right there in hand. Nami\'s first, unglamorous lesson to any new navigator is not how to read a Log Pose\'s needle — it is confirming, first, that it has actually been set and is actively tracking, before trusting a single reading from it. Only once that quiet, unglamorous confirmation is done does the actual voyage-planning begin.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Espresso Machine Nobody Plugged In',
      text: 'Central Perk gets a shiny new espresso machine, and Gunther, showing a new barista trainee around, points out something the trainee almost missed entirely: the machine being physically installed on the counter, buttons and all, does not mean it is actually ON. There is a separate power switch around the back, and a warm-up cycle after that switch is flipped, before the machine will do anything at all — press a button on an unpowered machine and nothing coherent happens, not because the machine is broken, but because the part that actually DOES the work has not started yet. Gunther\'s entire onboarding routine for a new hire is, essentially, one repeated point: check that it is actually running — really running, warmed up, ready — before assuming a button press failed to do anything.'
    },
    why: 'An unset Log Pose and an unpowered espresso machine are both "the device is present, but the part that actually does the work has not started yet" — precisely the docker CLI (present the moment you install it) versus dockerd, the daemon (which has to actually be running before any command does anything). `docker info` is the equivalent of Nami checking the Log Pose is set, or Gunther checking the machine is warmed up — the unglamorous first check, before trusting anything that follows.'
  },
  tech: [
    {
      q: 'Concretely, what happens end to end when you type `docker run hello-world`?',
      a: 'The `docker` CLI sends a request to dockerd over its API asking it to run a container from the `hello-world` image. dockerd checks whether it already has that image locally; if not, it pulls it from Docker Hub (the default registry). It then creates a new container from that image — setting up namespaces and a cgroup, exactly as the Linux course\'s container-preview lesson described — and starts the image\'s designated process running inside those restrictions. That process prints its message to stdout, which dockerd streams back to the CLI to display in your terminal, and then the process exits, ending the container\'s run.'
    },
    {
      q: 'Why does Docker Desktop on Mac/Windows need a hidden Linux VM, when Docker on Linux does not?',
      a: 'Namespaces and cgroups — the actual isolation mechanisms containers rely on — are Linux kernel features; they do not exist natively in the macOS or Windows kernels. Docker Desktop works around this by running a small, mostly invisible Linux virtual machine in the background, and dockerd runs INSIDE that VM, using the VM\'s Linux kernel to create genuine namespaces/cgroups exactly as it would on a real Linux host. On native Linux, that VM layer is unnecessary because the host\'s own kernel already provides everything dockerd needs directly — one of the practical reasons Linux is the dominant platform for actually running Docker in production, where that extra VM layer would be pure overhead.'
    },
    {
      q: 'Why is `docker ps` showing an empty list after `docker run hello-world` not itself a sign of a problem?',
      a: '`docker ps` (with no flags) only lists CURRENTLY RUNNING containers, and `hello-world`\'s container stopped running the instant its one job — printing a message — finished, because a container, being just a process, ceases to exist as a running container the moment its main process exits. This is expected, correct behavior, not an error. `docker ps -a` lists every container regardless of state, including stopped ones, and is the command that actually confirms what happened — checking its exit code (visible in that output, or via `docker inspect`) is the reliable way to tell "finished cleanly" apart from "crashed."'
    }
  ],
  code: {
    title: 'Confirm the whole stack works, one command at a time',
    intro: 'A transcript of the exact sequence to run once Docker is installed and (for Desktop users) actually launched.',
    code: `$ docker --version
Docker version 27.x.x, build xxxxxxx
# ^ only confirms the CLI is installed — NOT that the daemon is reachable

$ docker info
Client:
 Version:    27.x.x
Server:
 Containers: 0
 Running: 0
 ...
# ^ if this succeeds and shows a "Server:" section, the daemon IS reachable.
# If it instead errors with something like "Cannot connect to the Docker
# daemon" — the daemon is not running. On Desktop: launch the app. On
# Linux: sudo systemctl start docker

$ docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
...

$ docker ps
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
# ^ empty — expected. hello-world already finished and exited.

$ docker ps -a
CONTAINER ID   IMAGE         COMMAND    CREATED         STATUS
a1b2c3d4e5f6   hello-world   "/hello"   2 minutes ago   Exited (0) 2 minutes ago
# ^ "Exited (0)" = clean, successful exit. This is what success looks like.`,
    notes: [
      'The very first `docker run hello-world` pulls the image over the network, so it prints "Pulling from..." lines the first time; running it again afterward is near-instant, since the image is now cached locally.',
      'Exit code 0 means success by universal shell/process convention — this is the same convention covered in the Linux course, not something Docker invented.'
    ]
  },
  lab: {
    title: 'Diagnose a "docker command failed" report',
    prompt: 'A teammate says: "I installed Docker Desktop, but every docker command just hangs or errors out." Write the exact sequence of checks/commands you would have them run, in order, to isolate the problem — CLI installed? Daemon actually running? and the exact command to prove it either way.',
    starter: `# Step 1: confirm the CLI itself is installed


# Step 2: confirm the DAEMON is actually reachable (the real check)


# Step 3: if step 2 fails on Mac/Windows, what should they check/do?


# Step 4: if step 2 fails on Linux, what command starts the daemon?

`,
    checks: [
      { re: 'docker\\s+--version', flags: 'i', must: true, hint: 'Step 1: docker --version confirms the CLI is installed.', pass: 'Step 1: docker --version ✓' },
      { re: 'docker\\s+info', flags: 'i', must: true, hint: 'Step 2: docker info is the real daemon-reachability check.', pass: 'Step 2: docker info ✓' },
      { re: 'desktop|launch|whale|open', flags: 'i', must: true, hint: 'Step 3: on Mac/Windows, check whether the Docker Desktop app is actually launched/running.', pass: 'Step 3: check Docker Desktop is launched ✓' },
      { re: 'systemctl\\s+(start|enable)\\s+docker', flags: 'i', must: true, hint: 'Step 4: sudo systemctl start docker (or enable --now docker) starts the daemon on Linux.', pass: 'Step 4: systemctl start docker ✓' }
    ],
    run: 'Try it for real: on your own machine, quit/stop the Docker daemon deliberately, then run docker info and read the exact error message it produces.',
    solution: `# Step 1: confirm the CLI itself is installed
docker --version

# Step 2: confirm the DAEMON is actually reachable (the real check)
docker info

# Step 3: if step 2 fails on Mac/Windows, what should they check/do?
Check whether the Docker Desktop application is actually launched (menu bar/system tray whale icon) — installed is not the same as running.

# Step 4: if step 2 fails on Linux, what command starts the daemon?
sudo systemctl start docker   (or: sudo systemctl enable --now docker to also start it on future boots)`,
    notes: [
      '"It just hangs or errors out" is exactly the symptom of the CLI trying and failing to reach a daemon that is not running — always check docker info before anything else.',
      'This same isolate-the-layer instinct (CLI vs. daemon) reapplies constantly later in the course: is it the client failing, or the thing it is talking to?'
    ]
  },
  quiz: [
    {
      q: 'What are the two separate pieces that make up "Docker" on your machine?',
      options: ['The docker CLI client, and dockerd, the background daemon that does the actual work', 'A compiler and a linker', 'Docker Hub and Docker Desktop', 'An image and a container'],
      correct: 0,
      explain: 'The docker command is a thin client; dockerd is the long-running daemon that actually builds images and runs containers, communicating over an API.'
    },
    {
      q: 'Why does Docker Desktop on Mac need a hidden Linux virtual machine?',
      options: ['To make the whale icon animate', 'Namespaces and cgroups are Linux kernel features, which macOS does not have natively, so dockerd needs a real Linux kernel to run on', 'To speed up image downloads', 'It does not — this is a myth'],
      correct: 1,
      explain: 'Containers rely on Linux-specific kernel features. Docker Desktop runs a small Linux VM in the background specifically so dockerd has a real Linux kernel to create namespaces and cgroups on.'
    },
    {
      q: 'Which command actually confirms the Docker daemon is running and reachable, not just that the CLI is installed?',
      options: ['docker --version', 'docker info', 'docker --help', 'which docker'],
      correct: 1,
      explain: 'docker --version only reports the CLI\'s own version. docker info asks the daemon directly for its status, so it fails clearly if the daemon is not reachable.'
    },
    {
      q: 'After `docker run hello-world`, `docker ps` shows an empty list. What does this mean?',
      options: ['The container crashed and was deleted', 'Docker is not installed correctly', 'Nothing is wrong — hello-world already finished its one job and exited cleanly, and docker ps only lists currently RUNNING containers', 'The image failed to download'],
      correct: 2,
      explain: 'docker ps only shows running containers. hello-world prints its message and exits immediately by design; docker ps -a would show it as "Exited (0)" — a clean, successful exit.'
    },
    {
      q: 'On Linux, what does adding your user to the `docker` group actually grant, and why is that worth knowing?',
      options: ['Read-only access to view containers', 'Effectively root-equivalent access to the machine, since anyone in that group can use Docker to mount arbitrary host paths into a container', 'Access only to images you personally built', 'No real permissions change — it is cosmetic'],
      correct: 1,
      explain: 'Docker group membership avoids typing sudo constantly, but it is a meaningful security boundary: Docker can mount host paths and run privileged operations, so that group is effectively root-equivalent.'
    }
  ],
  pitfalls: [
    'Assuming "Docker is installed" means "Docker is running" — on Mac/Windows especially, the Docker Desktop application has to actually be launched, not just present in Applications, before any docker command will work.',
    'Panicking when `docker ps` shows nothing after running a container — check `docker ps -a` and the exit code before assuming something failed; a clean exit is not a crash.',
    'Running every `docker` command with `sudo` forever on Linux instead of fixing group membership once — it works, but it is a sign the actual setup step (adding your user to the docker group) was skipped.'
  ],
  interview: [
    {
      q: 'Explain the client/daemon architecture of Docker and why it matters for troubleshooting.',
      a: 'The `docker` command is a thin CLI client; it does not itself build images or run containers — it sends requests over an API to `dockerd`, a separate, long-running background daemon that does the actual work and reports results back. This matters for troubleshooting because a large class of "docker isn\'t working" problems are actually "the client cannot reach the daemon" — the daemon might not be running, might be running under a different user without the right socket permissions, or might be unreachable for a networking reason. The correct first diagnostic step is always confirming the daemon itself is reachable (`docker info`), not just that the CLI binary exists (`docker --version`), because those two checks answer genuinely different questions.'
    },
    {
      q: 'Why does Docker on Mac and Windows require a Linux VM under the hood, and what practical implications does that have?',
      a: 'Containers are isolated using Linux kernel features — namespaces and cgroups — which do not exist natively on macOS or Windows kernels. Docker Desktop resolves this by running a lightweight Linux VM in the background and running dockerd inside it, so it has a genuine Linux kernel to work with; the VM is made close to invisible in the UI, but it is genuinely there. Practical implications: resource limits (CPU/memory) for Docker Desktop are actually limits on that VM, file system performance for bind-mounted volumes can be noticeably slower than native Linux (crossing the VM boundary), and native Linux hosts, having no VM layer at all, are typically the most performant and most common place to run Docker in production.'
    },
    {
      q: 'A container exits immediately after starting. How would you determine whether that is expected behavior or a real failure?',
      a: 'First check the exit code with `docker ps -a` (or `docker inspect <container> --format=\'{{.State.ExitCode}}\'`) rather than relying on whether it still appears in plain `docker ps`, since a container disappearing from `docker ps` just means its process is no longer running — expected for a short-lived task, a real problem for a long-running service. Exit code 0 with output that looks like the intended job finishing (as with hello-world) is expected. A non-zero exit code, or an unexpected exit for something meant to run indefinitely (a web server, a database), warrants checking `docker logs <container>` for the actual error the process produced before it stopped.'
    },
    {
      q: 'What security consideration comes with adding a user to the `docker` group on Linux, and how would you explain that to someone who wants to avoid typing sudo constantly?',
      a: 'Being in the docker group lets a user talk to the Docker socket without sudo, but the Docker daemon itself runs as root and can perform operations equivalent to root access — most notably, it can mount arbitrary host paths (including sensitive system paths) into a container and then access them from inside that container. So membership in the docker group is, practically, root-equivalent access to the whole machine, not a scoped-down permission. The honest tradeoff to communicate: it is a reasonable, common convenience on a personal development machine, but it is not something to hand out casually on a shared or production system, where a more restricted approach (rootless Docker, or simply requiring sudo) is often the more defensible choice.'
    }
  ]
};
