window.LESSONS = window.LESSONS || {};
window.LESSONS['docker-cli-essentials'] = {
  id: 'docker-cli-essentials',
  title: 'The Docker CLI: run, ps, logs, exec, stop & rm',
  category: 'Part 1 — Docker Fundamentals',
  timeMin: 35,
  summary: 'With images and Dockerfiles covered, this lesson is the day-to-day toolkit: the handful of docker commands that cover the overwhelming majority of real work — starting a container with the right flags, inspecting what is actually running, reading its output, getting a shell inside it, and cleanly stopping and removing it. Each command maps to a specific, common question ("what is running," "why did it fail," "let me poke around inside it"), and knowing which one answers which question is most of what "comfortable with Docker day to day" actually means.',
  goals: [
    'Start a container with the right combination of -d, -p, --name, and -e flags for a given task',
    'Distinguish `docker ps` from `docker ps -a` and know when each is the right check',
    'Read a failing container\'s output with `docker logs`, including `-f` for a live stream',
    'Get an interactive shell inside a running container with `docker exec -it`',
    'Cleanly stop and remove containers, and explain the difference between stop and kill'
  ],
  concept: [
    {
      h: '`docker run`: the flags that come up constantly',
      p: [
        '`docker run <image>` alone runs in the FOREGROUND, attached to your terminal — fine for a quick test, impractical for anything meant to keep running while you do something else. `-d` (detached) starts the container in the background and immediately returns your terminal, which is what you want for any long-running service; `--name <name>` gives the container a memorable name instead of a random one, so later commands can reference it by name rather than hunting for its ID.',
        '`-p <host-port>:<container-port>` publishes a port, as the previous lesson\'s EXPOSE discussion set up — without it, a web server running happily inside a container is completely unreachable from your machine. `-e KEY=value` sets an environment variable for THIS specific container, overriding or supplementing whatever ENV instructions the image itself defined — the run-time counterpart to the Dockerfile\'s build-time ENV, and the mechanism a later lesson leans on for injecting configuration without baking it into the image.'
      ]
    },
    {
      h: '`docker ps`: what is actually running right now',
      p: [
        '`docker ps` (no flags) lists only currently RUNNING containers — the first, most natural question ("is my thing actually up?") most people reach for it to answer. `docker ps -a` lists every container regardless of state, including ones that exited (cleanly or not) — the previous lesson\'s "exited is not the same as failed" distinction depends on checking THIS command, not plain `docker ps`, since a stopped container simply will not appear in the un-flagged version at all.',
        '`docker ps` output includes a STATUS column worth reading carefully: "Up 3 minutes" means genuinely running; "Exited (0) 2 minutes ago" means it stopped cleanly; "Exited (137)" or similar non-zero codes generally mean it was killed or crashed — the exit code itself is a real diagnostic signal, not just a formality, and is frequently the very first thing worth checking when a container is not behaving as expected.'
      ]
    },
    {
      h: '`docker logs`: reading what a container actually said',
      p: [
        '`docker logs <container>` prints everything the container\'s main process has written to stdout/stderr since it started — the single most important first diagnostic step when a container crashed, is misbehaving, or simply is not doing what you expected, since it is almost always where the actual error message lives. `docker logs -f <container>` follows the log stream live, printing new output as it happens — genuinely useful for watching a service start up in real time, or reproducing an intermittent issue while watching it happen.',
        '`docker logs --tail 50 <container>` limits output to the most recent 50 lines — practical for a container that has been running (and logging) for a long time, where the full log would be an unmanageable wall of text. This all works because, by default, Docker captures a container\'s stdout/stderr and stores it — one more reason a containerized process should log to stdout/stderr rather than to some internal file only it can see, a convention this lesson\'s lab reinforces directly.'
      ]
    },
    {
      h: '`docker exec`, `docker stop`, and `docker rm`',
      p: [
        '`docker exec -it <container> <command>` runs a NEW command inside an ALREADY-RUNNING container — most commonly `docker exec -it <container> sh` (or `bash`, if available) to get an interactive shell for poking around, checking a file, or debugging live. The `-it` combination (interactive + pseudo-TTY) is what makes it behave like a real interactive session rather than running one command and immediately returning — leaving off `-it` for an interactive shell produces a session that looks broken (no prompt, no working input) even though the command technically ran.',
        '`docker stop <container>` sends a graceful termination signal (SIGTERM) and waits a grace period (10 seconds by default) for the process to shut down on its own before forcibly killing it — the correct default for stopping something cleanly. `docker kill <container>` skips straight to a forceful SIGKILL, no grace period — occasionally necessary for a genuinely hung container, but not the everyday default, since it gives the process no chance to clean up. `docker rm <container>` removes a STOPPED container entirely (its writable layer and all); it refuses to remove a still-running one unless you add `-f` to force it — a deliberate safety check against accidentally deleting something that is actively doing work.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Reading the Sunny\'s Own Instruments, Not Guessing',
      text: 'Franky builds the Thousand Sunny with a full panel of actual gauges and readouts — not decoration, genuinely functional instruments reporting exactly what is happening inside the ship at any given moment: which systems are running, what the coal furnace\'s actual output is, whether a specific mechanism jammed or is working fine. Early on, Luffy\'s instinct in any uncertain moment is to just open something up and look with his own eyes — occasionally useful, but slow, and it means physically climbing into machinery that a gauge could have told him about from the bridge in two seconds. Franky\'s actual lesson to the crew, delivered with his usual bluntness, is not "trust me, I know the ship" — it is "check the actual gauge before guessing, and if the gauge alone is not enough, THEN go open the panel and look directly." Reading the right instrument for the right question, before resorting to manually opening things up, is what separates a crew that diagnoses a problem in thirty seconds from one that spends an hour taking the wrong panel apart first.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Checking the Actual Sensor Log Before Opening the Telescope',
      text: 'Sheldon\'s rooftop telescope setup logs everything — tracking status, whether it is currently active, a full timestamped record of what it observed and when, all viewable from his laptop without ever climbing up to the telescope itself. When something seems off with an observation, Sheldon\'s insistence — to Leonard\'s occasional exasperation — is always the same, rigid sequence: check whether it is actually currently running (is it even active right now?), THEN check the log for what it actually recorded and when problems started, and ONLY THEN, if that is genuinely insufficient, physically go up and inspect the hardware directly. Leonard, once, skips straight to climbing up and fiddling with the telescope\'s hardware first, based on a hunch — and wastes twenty minutes on a component that turns out to be fine, when the log (which he never checked) would have shown the actual problem was a software setting, in about four seconds of reading.'
    },
    why: 'Franky\'s gauges and Sheldon\'s sensor log are both the same idea applied to a running system: check the right INSTRUMENT for the right question before manually climbing in to look — `docker ps` for "is it running," `docker logs` for "what did it actually say," and only THEN `docker exec` to manually go inside and look around directly, in that order, rather than reaching for the most invasive tool first out of habit.'
  },
  tech: [
    {
      q: 'Why does `docker exec -it <container> sh` need both -i and -t to work as an interactive shell?',
      a: '`-i` (interactive) keeps STDIN open so you can actually type input to the process — without it, anything you type has nowhere to go. `-t` allocates a pseudo-TTY, which is what makes the session behave like a genuine terminal — showing a shell prompt, supporting line editing, handling Ctrl-C correctly — rather than a raw, unbuffered pipe. Either flag alone produces a broken-feeling session (input with no visible prompt, or a prompt that does not actually accept typed input); together, `-it` is what makes `docker exec` feel like SSH-ing into the container, which is why it is almost always written as one combined flag in practice.'
    },
    {
      q: 'Why does `docker stop` wait before forcibly stopping a container, and when would you reach for `docker kill` instead?',
      a: '`docker stop` sends SIGTERM first — a request the process can catch and respond to by shutting down cleanly (closing open connections, flushing buffered writes, finishing an in-flight request) — and only escalates to SIGKILL after a grace period (10 seconds by default, configurable with `-t`) if the process has not exited on its own by then. This graceful-first approach matters for anything stateful (a database, a service mid-request) where an abrupt kill could lose data or leave things in an inconsistent state. `docker kill` skips straight to SIGKILL with no grace period, appropriate specifically when a container is genuinely hung and unresponsive to SIGTERM, or when you deliberately need it gone immediately and do not care about a graceful shutdown.'
    },
    {
      q: 'Why does `docker rm` refuse to remove a running container without an explicit -f flag?',
      a: 'It is a deliberate safety check: removing a container also deletes its writable layer permanently, and a RUNNING container is, by definition, actively doing something — serving traffic, processing data, holding open connections — that abruptly disappearing would likely disrupt or corrupt. Requiring `-f` (force) to remove a running container makes that a conscious, explicit choice rather than something that could happen accidentally from a mistyped command or a script that assumed a container was already stopped. The safer, non-forced default path is `docker stop` (graceful) followed by `docker rm` (removal of the now-stopped container) as two distinct, deliberate steps.'
    }
  ],
  code: {
    title: 'The everyday sequence, start to finish',
    intro: 'A transcript of the commands that cover most real day-to-day Docker work, in the order they naturally get used.',
    code: `$ docker run -d --name my-web -p 8080:80 -e MODE=production nginx
a1b2c3d4e5f6...

$ docker ps
CONTAINER ID   IMAGE   STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx   Up 5 seconds   0.0.0.0:8080->80/tcp   my-web

$ curl localhost:8080
<!DOCTYPE html> ... nginx welcome page ...

$ docker logs my-web
172.17.0.1 - - [.../GET / HTTP/1.1" 200 ...

$ docker logs -f my-web
# ^ now streaming live — Ctrl+C to stop watching (does NOT stop the container)

$ docker exec -it my-web sh
/ # cat /etc/nginx/nginx.conf | head -5
/ # exit

$ docker stop my-web
my-web
# ^ SIGTERM sent, graceful shutdown, up to 10s grace period

$ docker ps -a
CONTAINER ID   IMAGE   STATUS                      NAMES
a1b2c3d4e5f6   nginx   Exited (0) 3 seconds ago    my-web

$ docker rm my-web
my-web
# ^ container fully removed — its writable layer is gone`,
    notes: [
      'Ctrl+C while attached to `docker logs -f` only stops WATCHING the logs — it does not stop the container itself, a common mix-up.',
      '`docker stop` followed by `docker rm` (two separate, deliberate steps) is the safer default over `docker rm -f`, which skips the graceful shutdown entirely.'
    ]
  },
  lab: {
    title: 'Pick the right command for each task',
    prompt: 'For each described task, write the exact docker command (with flags) that accomplishes it.',
    starter: `# Task: start an nginx container in the background, named "web",
# publishing container port 80 to host port 8080


# Task: check whether "web" is currently running (not just whether it exists)


# Task: view the last 20 lines of "web"'s logs


# Task: get an interactive shell inside the running "web" container


# Task: gracefully stop "web", then remove it
`,
    checks: [
      { re: 'docker\\s+run\\s+-d.*--name\\s+web.*-p\\s+8080:80.*nginx|docker\\s+run\\s+-d.*-p\\s+8080:80.*--name\\s+web.*nginx', flags: 'i', must: true, hint: 'docker run -d --name web -p 8080:80 nginx (flag order can vary)', pass: 'docker run -d --name web -p 8080:80 nginx ✓' },
      { re: 'docker\\s+ps(?!\\s+-a)', flags: 'i', must: true, hint: 'docker ps (no -a) shows only currently running containers.', pass: 'docker ps ✓' },
      { re: 'docker\\s+logs\\s+--tail\\s+20\\s+web', flags: 'i', must: true, hint: 'docker logs --tail 20 web', pass: 'docker logs --tail 20 web ✓' },
      { re: 'docker\\s+exec\\s+-it\\s+web\\s+(sh|bash)', flags: 'i', must: true, hint: 'docker exec -it web sh (or bash)', pass: 'docker exec -it web sh ✓' },
      { re: 'docker\\s+stop\\s+web', flags: 'i', must: true, hint: 'docker stop web — graceful stop first', pass: 'docker stop web ✓' },
      { re: 'docker\\s+rm\\s+web', flags: 'i', must: true, hint: 'docker rm web — after it has stopped', pass: 'docker rm web ✓' }
    ],
    run: 'Try it for real: run each command against a real nginx container and confirm the output matches what you expect.',
    solution: `# Task: start an nginx container in the background, named "web",
# publishing container port 80 to host port 8080
docker run -d --name web -p 8080:80 nginx

# Task: check whether "web" is currently running (not just whether it exists)
docker ps

# Task: view the last 20 lines of "web"'s logs
docker logs --tail 20 web

# Task: get an interactive shell inside the running "web" container
docker exec -it web sh

# Task: gracefully stop "web", then remove it
docker stop web
docker rm web`,
    notes: [
      'docker ps (without -a) is specifically the right check for "is it running RIGHT NOW" — docker ps -a would also show stopped containers, which is not what the task asked.',
      'stop then rm as two separate commands is the deliberate, safer default over docker rm -f on a running container.'
    ]
  },
  quiz: [
    {
      q: 'What does the `-d` flag do on `docker run`?',
      options: ['Deletes the image after running', 'Runs the container in the background (detached), returning your terminal immediately', 'Enables debug logging', 'Downloads the image without running it'],
      correct: 1,
      explain: '-d (detached) starts the container in the background instead of attaching your terminal to its foreground output.'
    },
    {
      q: 'Why is `docker logs` usually the first command to run when a container is misbehaving?',
      options: ['It restarts the container automatically', 'It shows everything the container\'s main process has written to stdout/stderr — almost always where the actual error message lives', 'It lists all images on the system', 'It only works on stopped containers'],
      correct: 1,
      explain: 'docker logs surfaces the container\'s captured stdout/stderr output, which is typically the fastest way to see what actually went wrong.'
    },
    {
      q: 'Why does `docker exec -it <container> sh` need both -i and -t?',
      options: ['Either flag alone is sufficient; using both is redundant', '-i keeps STDIN open for typed input, -t allocates a pseudo-TTY for proper terminal behavior — together they make it feel like a real interactive session', 'They are unrelated flags with no connection to interactivity', '-it is required only on Windows'],
      correct: 1,
      explain: '-i and -t serve different purposes: -i for input, -t for terminal behavior. Both together produce a genuinely interactive shell session.'
    },
    {
      q: 'What is the practical difference between `docker stop` and `docker kill`?',
      options: ['They are identical commands with different names', 'docker stop sends SIGTERM and waits a grace period before forcing termination; docker kill sends SIGKILL immediately with no grace period', 'docker kill only works on images, not containers', 'docker stop deletes the container; docker kill only pauses it'],
      correct: 1,
      explain: 'docker stop gives the process a chance to shut down gracefully first. docker kill skips straight to a forceful, immediate termination.'
    },
    {
      q: 'Why does `docker rm` refuse to remove a running container by default?',
      options: ['It is a bug that will eventually be fixed', 'It is a deliberate safety check, since removing a container permanently deletes its writable layer while it may still be actively doing work', 'Running containers cannot technically be removed by the filesystem', 'docker rm only works on images, never containers'],
      correct: 1,
      explain: 'This is intentional: forcing an explicit -f flag to remove a running container prevents accidentally destroying something still actively in use.'
    }
  ],
  pitfalls: [
    'Reaching for `docker exec` to poke around and debug before checking `docker logs` first — logs usually answer the question faster, with less effort, than manually exploring inside the container.',
    'Using `docker rm -f` as a default habit instead of `docker stop` then `docker rm` — skipping the graceful shutdown risks losing in-flight work for anything stateful.',
    'Forgetting `-p` on `docker run` and then being confused that a service "isn\'t working," when it is actually running fine but simply not published to the host at all.'
  ],
  interview: [
    {
      q: 'A container is not responding to requests. Walk through the exact sequence of docker commands you would run to diagnose it, and why in that order.',
      a: 'First, `docker ps` to confirm it is actually still running at all — a container that exited would explain "not responding" trivially, and this check is the fastest way to rule that in or out. If it is running, `docker logs <container>` (optionally `-f` to watch live, or `--tail` for just recent output) to look for an actual error message or stack trace — this is usually where the real cause surfaces, and it requires no invasive action. Only if logs are inconclusive would I reach for `docker exec -it <container> sh` to manually inspect the running process\'s environment, check config files, or test connectivity from inside the container directly — the more invasive, slower option, reserved for when the less invasive checks did not already answer the question.'
    },
    {
      q: 'Explain why `docker stop` is generally preferred over `docker kill` for stopping a production service, with a concrete example of what could go wrong with the wrong choice.',
      a: '`docker stop` sends SIGTERM and gives the process a grace period to shut down cleanly — for something like a database or a web server mid-request, that grace period is what allows in-flight writes to be flushed, open connections to be closed properly, and any cleanup logic to actually run before the process exits. `docker kill` sends SIGKILL immediately, which the process cannot catch or respond to at all — a database killed mid-write could leave its on-disk state inconsistent or corrupted, and a web server killed mid-request would drop that request\'s connection abruptly rather than completing or gracefully rejecting it. `docker kill` is appropriate specifically when a process is genuinely hung and unresponsive even to SIGTERM, not as a routine default.'
    },
    {
      q: 'What is the difference between `docker ps` and `docker ps -a`, and describe a realistic scenario where checking the wrong one would lead to a mistaken conclusion.',
      a: '`docker ps` lists only currently running containers; `docker ps -a` lists every container regardless of state, including ones that have exited. A realistic mistaken-conclusion scenario: a container was supposed to run a one-off migration script and finish, so it is EXPECTED to exit when done — but checking only `docker ps` afterward would show it missing from the list and could be misread as "the migration never ran" or "something deleted it," when in fact `docker ps -a` would show it present with an "Exited (0)" status, meaning it ran to completion successfully and simply is not currently running anymore, which is entirely expected for a finite task rather than a long-running service.'
    },
    {
      q: 'Why is it considered a best practice for a containerized application to log to stdout/stderr rather than to an internal log file?',
      a: 'Docker automatically captures a container\'s stdout and stderr streams and makes them available via `docker logs`, without any special configuration — this gives a consistent, tool-agnostic way to access logs for ANY container, regardless of what is running inside it. A process that instead writes logs only to an internal file requires `docker exec`-ing in and manually locating and reading that file — more invasive, less consistent across different images, and it breaks the moment the container is removed (that internal file, like anything else in the container\'s writable layer, is deleted along with it, unless it happens to be on a persisted volume). Logging to stdout/stderr also plays well with external log-aggregation tooling in real deployments, which is typically configured to collect exactly Docker\'s captured stdout/stderr streams from every container uniformly.'
    }
  ]
};
