window.LESSONS = window.LESSONS || {};
window.LESSONS['why-kubernetes'] = {
  id: 'why-kubernetes',
  title: 'Why Kubernetes: The Problem Compose Cannot Solve',
  category: 'Part 4 — Kubernetes Fundamentals',
  timeMin: 35,
  summary: 'Docker Compose (Part 3\'s capstone) reliably runs several containers together, on ONE machine, started with ONE command. Kubernetes exists for the genuinely different problem Compose was never designed to solve: keeping a system running reliably when it spans MULTIPLE machines, when individual machines or containers can and do fail, and when the number of replicas needed changes over time. This lesson does not touch YAML or kubectl yet — it builds the mental model first: Kubernetes as a continuous reconciliation loop, constantly comparing what you DECLARED you want against what is ACTUALLY running, and correcting the difference, automatically, without a human watching.',
  goals: [
    'State precisely what problem Kubernetes solves that Docker Compose does not',
    'Explain the declarative "desired state vs. actual state" model at the heart of Kubernetes',
    'Explain what a reconciliation loop (a "controller") does, in plain terms',
    'Explain why self-healing in Kubernetes does not require a human to notice and react to a failure',
    'Distinguish Kubernetes\'s core job (declared state reconciliation) from what it does NOT do'
  ],
  concept: [
    {
      h: 'The problem, stated precisely',
      p: [
        'Compose starts several containers, correctly networked, on one machine, with one command — genuinely solved, for that scope. What Compose has no answer for at all: what happens when the ONE machine running everything goes down entirely — a hardware failure, a kernel panic, a cloud provider maintenance event? What happens when traffic grows beyond what a fixed number of containers on that one machine can handle, and you need FIVE copies of a service, load-balanced, instead of one? What happens when one specific container silently crashes at 3 AM — does anything notice, and does anything bring it back, without a human being paged and manually typing `docker restart`?',
        'Kubernetes exists specifically to answer all three of these — reliability across machine failure, horizontal scaling across many machines, and automatic recovery from individual failures — by treating a CLUSTER of multiple machines (called <b>nodes</b>) as one unified pool of compute, and taking on the ongoing, continuous responsibility of keeping a DECLARED number of healthy replicas of your application running SOMEWHERE across that pool, at all times, without a human manually intervening for the routine cases.'
      ]
    },
    {
      h: 'The core idea: declare WHAT you want, not HOW to get there',
      p: [
        '`docker run` and `docker compose up` are <b>imperative</b>: you tell Docker the exact sequence of actions to take, right now, in order — start this container, with these flags. Kubernetes is fundamentally <b>declarative</b>: you write a manifest describing the DESIRED END STATE you want to exist — "I want 3 replicas of this image, running, reachable at this address" — and Kubernetes\'s own internal machinery is responsible for figuring out and continuously maintaining WHATEVER actions are needed to make reality match that declaration, not just once, but ON AN ONGOING BASIS, indefinitely.',
        'This distinction is the single most important mental shift moving from Docker/Compose into Kubernetes: you are no longer thinking in terms of "run this command now" — you are thinking in terms of "this is the state I want to be true, permanently, and I am trusting the system to continuously enforce it," which is a genuinely different way of interacting with infrastructure than everything covered so far in this course.'
      ]
    },
    {
      h: 'Reconciliation loops: the mechanism behind "automatically maintained"',
      p: [
        'Kubernetes implements "continuously maintain the desired state" through <b>controllers</b> — background processes, each responsible for one kind of resource, running an endless loop: read the DESIRED state (what you declared), read the ACTUAL current state (what is really running right now), compute the difference, and take whatever action closes that difference — then repeat, forever, typically every few seconds. If you declared "3 replicas" and only 2 are currently actually running (one crashed), the relevant controller notices that difference on its very next loop iteration and starts a new replica to restore the count to 3 — not because anything alerted a human, and not because anyone manually intervened, but because the controller\'s continuous comparison caught the discrepancy and corrected it as a completely routine part of its ordinary, ongoing operation.',
        'This reconciliation-loop pattern is not one special mechanism confined to just replica counts — it is THE core architectural pattern Kubernetes is built from, and it reappears, in slightly different forms, for essentially everything the next several lessons cover: Deployments reconcile replica count, Services reconcile which Pods currently receive traffic, and so on. Understanding "declare desired state, a controller continuously reconciles actual state toward it" IS understanding the architectural core of Kubernetes — everything else is a specific application of this one repeated idea.'
      ]
    },
    {
      h: 'What Kubernetes does NOT do — keeping the scope honest',
      p: [
        'Kubernetes does not build your image (that is still Docker\'s job, covered in Parts 1-2), does not replace a registry (it PULLS images from one, exactly as `docker run` does), and does not, by itself, automate testing or deployment triggers on a git push (that is CI/CD\'s job, covered in Part 6) — Kubernetes\'s job begins once you already have a container image and want it running reliably, at whatever scale, across a cluster of machines. Keeping this scope honest matters: a common early-Kubernetes confusion is expecting it to solve problems (building images, running tests, triggering deploys) that genuinely belong to earlier or later stages of the pipeline this course\'s very first lesson mapped out.',
        'The next lesson (Pods & the API Server) starts making this concrete: the actual object Kubernetes runs your container inside, and the API server that every declarative manifest ultimately gets submitted to, kicking off the reconciliation-loop behavior this lesson has so far only described conceptually.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Log Pose Keeps Correcting the Course, Without Anyone Steering by Hand',
      text: 'Early in the crew\'s journey, keeping the Sunny on course meant Nami personally, continuously watching the wind and current and manually calling out helm corrections — genuinely exhausting to sustain, and completely dependent on Nami herself staying awake and paying attention every single moment, with no coverage at all the instant she looked away. A properly set Log Pose changes the entire nature of the problem: it does not steer the ship itself, but it continuously, automatically indicates the CORRECT heading toward the next island, constantly, on its own, whether or not anyone is actively watching it at any given instant — and critically, if the Sunny drifts off course from a current or a storm, the Log Pose does not need to be told to "notice" the drift; its own needle simply continues pointing at the true correct heading regardless, and whoever glances at it next sees the correction needed immediately, automatically, without having had to manually track the drift as it happened. The crew stopped needing one person exhaustingly watching the wind every second — they needed a system that continuously, on its own, kept indicating the true desired heading, correctable at a glance, at any moment, by anyone.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Thermostat Keeps Correcting the Temperature, Without Anyone Watching It',
      text: 'Before Monica finally convinces the group to just get a proper thermostat, keeping the apartment at a comfortable temperature meant someone physically checking a plain thermometer periodically and manually adjusting the heater by hand — worked fine as long as someone actually remembered to keep checking, and failed completely the moment everyone got distracted for an evening and the apartment drifted uncomfortably cold with nobody noticing until someone happened to feel it. A proper thermostat changes the entire nature of the problem: you set ONE desired temperature, once, and the thermostat itself continuously, automatically checks the actual current temperature against that desired setting, on its own, constantly, correcting the heater\'s behavior the instant a difference appears — nobody needs to be actively watching a thermometer at all anymore, because the correcting mechanism runs continuously, by itself, whether or not any human is paying attention in that exact moment.'
    },
    why: 'The set Log Pose and the thermostat both replace "a human continuously watching and manually correcting" with "a system that continuously compares a DECLARED desired state (the correct heading; the set temperature) against the ACTUAL current state, and corrects the difference on its own, constantly, without needing anyone to notice and react." That is precisely a Kubernetes reconciliation loop — declare "3 replicas," and a controller continuously checks actual-vs-desired and corrects any gap, automatically, exactly like a thermostat, not like someone manually watching a thermometer.'
  },
  tech: [
    {
      q: 'Concretely, what is the difference between "imperative" (Docker/Compose) and "declarative" (Kubernetes) as applied to actually running a container?',
      a: 'An imperative command like `docker run -d --name web nginx` specifies the EXACT ACTION to take, right now, once — Docker executes it and considers its job done; if that container later crashes, nothing about the original command causes anything to happen automatically, since the command already fully executed and is not being continuously re-evaluated. A declarative Kubernetes manifest instead specifies a DESIRED END STATE — "there should be 3 replicas of this Pod running" — submitted once to the API server, but continuously ENFORCED afterward by a controller that keeps comparing that declaration against reality indefinitely; if a replica crashes, the controller notices the gap between "3 declared" and "2 actually running" on its very next check and starts a new one, with no new command needing to be issued by anyone.'
    },
    {
      q: 'What, mechanically, does a Kubernetes "controller" actually do in its reconciliation loop?',
      a: 'A controller runs an effectively endless loop: read the desired state for the resource type it is responsible for (from objects stored via the API server), read the actual current state (by observing what is really running in the cluster right now), compute the difference between the two, and issue whatever specific actions are needed to reduce that difference — then wait briefly and repeat the entire cycle again, indefinitely. Different controllers are responsible for different resource types (a ReplicaSet controller reconciles Pod replica counts, a Deployment controller reconciles rollout state across ReplicaSets, and so on, covered in the next two lessons) — but every one of them follows this exact same read-desired / read-actual / diff / correct / repeat pattern, which is the architectural core the rest of Kubernetes builds on.'
    },
    {
      q: 'Why does self-healing in Kubernetes not require any alerting or human intervention for the routine case of a single crashed replica?',
      a: 'Because the relevant controller\'s reconciliation loop is running CONTINUOUSLY and CHECKS ACTUAL STATE ITSELF, independent of any external notification — it does not need to be told a replica crashed; it simply observes, on its next routine check (typically within seconds), that the count of actually-running, healthy replicas no longer matches the declared desired count, and this observed discrepancy alone is sufficient to trigger corrective action, with no human, alert, or external trigger involved in that decision at all. This is a fundamentally different failure-recovery model than a human being paged and manually running `docker restart` after noticing something is down — the correction happens automatically, as a routine part of the controller\'s ordinary, continuous operation, not as an exceptional, human-driven response.'
    }
  ],
  code: {
    title: 'The same intent, imperative vs. declarative, side by side',
    intro: 'Nothing here is meant to be run yet — the actual manifest syntax is the next two lessons\' subject. This is purely the CONCEPTUAL contrast.',
    code: `# IMPERATIVE (Docker / Compose) — what Part 0-3 covered:
# "Run this container, right now, with these settings."
$ docker run -d --name web -p 8080:80 nginx
# If it crashes later: nothing happens automatically.
# A human (or a separate monitoring/restart script) must notice and act.


# DECLARATIVE (Kubernetes) — this Part's subject:
# "I want 3 replicas of this Pod running, always, permanently."
---
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  # ... (full syntax covered next lesson)

# Submitted ONCE to the API server. From then on, a controller
# continuously checks: "are 3 healthy replicas ACTUALLY running?"
# If one crashes: the controller notices on its own, within seconds,
# and starts a replacement — automatically, with no human involved.`,
    notes: [
      'The Docker example executes once and is "done" the moment the command returns. The Kubernetes example is submitted once but enforced CONTINUOUSLY, indefinitely, by a controller.',
      'This is exactly the shift from "an action I performed" to "a state I declared and the system now maintains" — the single biggest mental model change this Part introduces.'
    ]
  },
  lab: {
    title: 'Classify: imperative action or declarative desired state?',
    prompt: 'For each statement, write "IMPERATIVE" if it describes a one-time action being performed, or "DECLARATIVE" if it describes a desired end state being continuously maintained.',
    starter: `"Start a container named web from the nginx image."   ->
"There should always be 3 healthy replicas of this Pod running."  ->
"Run docker restart on container web."                 ->
"This service should always be reachable at this address, no matter which specific replicas are currently healthy." ->
`,
    checks: [
      { re: '"Start a container[\\s\\S]*?->\\s*imperative', flags: 'i', must: true, hint: 'Starting one specific container right now is an IMPERATIVE action.', pass: 'Statement 1: IMPERATIVE ✓' },
      { re: '"There should always be 3[\\s\\S]*?->\\s*declarative', flags: 'i', must: true, hint: 'A continuously-maintained replica count is a DECLARATIVE desired state.', pass: 'Statement 2: DECLARATIVE ✓' },
      { re: '"Run docker restart[\\s\\S]*?->\\s*imperative', flags: 'i', must: true, hint: 'Running one specific restart command right now is IMPERATIVE.', pass: 'Statement 3: IMPERATIVE ✓' },
      { re: '"This service should always be reachable[\\s\\S]*?->\\s*declarative', flags: 'i', must: true, hint: 'A continuously-maintained stable address regardless of which replicas are healthy is DECLARATIVE.', pass: 'Statement 4: DECLARATIVE ✓' }
    ],
    run: 'No real command yet — this is purely conceptual. Revisit after the next two lessons and check your classifications still make sense once you have seen real manifest syntax.',
    solution: `"Start a container named web from the nginx image."   -> IMPERATIVE
"There should always be 3 healthy replicas of this Pod running."  -> DECLARATIVE
"Run docker restart on container web."                 -> IMPERATIVE
"This service should always be reachable at this address, no matter which specific replicas are currently healthy." -> DECLARATIVE`,
    notes: [
      'The pattern: imperative statements describe a single ACTION taken once; declarative statements describe an ongoing CONDITION that should remain true indefinitely.',
      'Every Kubernetes manifest this course writes from here on is declarative in exactly this sense — a desired state, not a sequence of steps.'
    ]
  },
  quiz: [
    {
      q: 'What specific problem does Kubernetes solve that Docker Compose does not?',
      options: ['Kubernetes builds Docker images faster than Compose', 'Reliability and scale across MULTIPLE machines — automatic recovery from failures and running many replicas across a cluster, which Compose (a single-machine tool) has no mechanism for', 'Kubernetes replaces the need for a Dockerfile', 'Compose and Kubernetes solve identical problems'],
      correct: 1,
      explain: 'Compose is explicitly single-machine with no built-in multi-machine reliability or scaling story — exactly the gap Kubernetes closes.'
    },
    {
      q: 'What does it mean that Kubernetes is "declarative" rather than "imperative"?',
      options: ['You declare a desired end state (e.g., "3 replicas running"), and Kubernetes continuously works to maintain reality matching that state, rather than executing one specific action once', 'Declarative means Kubernetes requires no configuration at all', 'Imperative and declarative are just two names for the same thing', 'Declarative means commands run faster'],
      correct: 0,
      explain: 'Declarative means specifying WHAT should be true, continuously, rather than WHAT ACTION to take once — Kubernetes\'s controllers do the ongoing work of maintaining that declared state.'
    },
    {
      q: 'What does a Kubernetes controller\'s reconciliation loop actually do?',
      options: ['It runs once at cluster startup and never again', 'It continuously compares desired state against actual state and takes action to correct any difference, repeating indefinitely', 'It only runs when a human manually triggers it', 'It deletes resources that have not been used recently'],
      correct: 1,
      explain: 'A controller runs an endless loop: read desired state, read actual state, compute the difference, correct it, repeat — the core mechanism behind Kubernetes\'s automatic behavior.'
    },
    {
      q: 'Why does a crashed replica get automatically replaced without a human being paged first?',
      options: ['Kubernetes sends the crash report to a human who must approve the restart', 'The relevant controller\'s reconciliation loop continuously checks actual vs. desired state on its own, and simply observing the discrepancy is sufficient to trigger a fix — no external alert or human trigger is needed', 'Kubernetes cannot actually detect crashed replicas', 'A cron job checks for crashes once per day'],
      correct: 1,
      explain: 'The controller\'s continuous, self-driven checking is what makes self-healing automatic — the discrepancy itself, observed by the loop, is what triggers correction.'
    },
    {
      q: 'Which of these is explicitly NOT something Kubernetes itself does?',
      options: ['Maintaining a declared number of healthy replicas', 'Building a Docker image from a Dockerfile', 'Automatically restarting a crashed replica', 'Providing a stable address for a set of replicas'],
      correct: 1,
      explain: 'Kubernetes pulls and runs already-built images — building the image itself remains Docker\'s job (Parts 1-2), not Kubernetes\'s.'
    }
  ],
  pitfalls: [
    'Expecting Kubernetes to build images, run tests, or trigger deploys on a git push — those are Docker\'s and CI/CD\'s jobs respectively; Kubernetes\'s scope begins once an image already exists and needs to run reliably.',
    'Thinking of a Kubernetes manifest as "a command that runs once," carrying over the Docker/Compose mental model — a manifest describes an ongoing desired state, continuously enforced, not a one-time action.',
    'Assuming self-healing means Kubernetes "watches for crashes" with some special detection mechanism — it is simpler and more general than that: a controller just keeps comparing desired vs. actual state, and any discrepancy, crash-caused or otherwise, gets corrected the same way.'
  ],
  interview: [
    {
      q: 'Explain, to someone who only knows Docker and Compose, what Kubernetes actually adds, in terms of the specific reliability and scale problems it solves.',
      a: 'Docker Compose reliably runs multiple containers together, networked and configured correctly, on ONE machine, started with one command — genuinely solved for that scope. Kubernetes exists for a larger, genuinely different problem: keeping an application reliably running when it needs to survive individual machine failures (by spreading replicas across a CLUSTER of multiple machines, called nodes), when it needs to scale to more replicas than one machine could handle, and when individual container crashes need to be detected and corrected automatically, without a human manually intervening every time. It is not "Compose but newer" — it solves a problem Compose was never designed to address at all, since Compose has no concept of multiple machines or automatic recovery in the first place.'
    },
    {
      q: 'What is a reconciliation loop, and why is it described as the architectural core of Kubernetes rather than just one specific feature?',
      a: 'A reconciliation loop is the continuous process a Kubernetes controller runs: read the declared desired state for the resource type it manages, read the actual current state by observing the cluster, compute the difference, take action to close that difference, and repeat indefinitely. It is described as the architectural core because nearly every Kubernetes capability — replica maintenance, service traffic routing, rolling updates, and more, each covered in upcoming lessons — is implemented as a SPECIFIC INSTANCE of this exact same general pattern, just applied to a different kind of resource and a different notion of "desired" versus "actual." Understanding this one repeated pattern deeply is what makes each subsequent Kubernetes concept feel like a variation on something already understood, rather than an entirely new mechanism to learn from scratch each time.'
    },
    {
      q: 'A junior engineer says "Kubernetes automatically fixes any problem with my application." How would you correct this, precisely?',
      a: 'Kubernetes automatically corrects DISCREPANCIES BETWEEN DECLARED AND ACTUAL STATE for the specific resources it manages — a crashed replica being replaced, an unhealthy Pod being removed from a Service\'s traffic routing — but it has no awareness of, and cannot fix, problems that do not show up as such a discrepancy: a bug in the application\'s own logic (it will happily keep "successfully" running 3 replicas of genuinely broken code, since from Kubernetes\'s perspective, 3 replicas ARE running, matching the declared count), a misconfigured desired state (declaring the wrong image or the wrong replica count in the first place), or a problem entirely outside what a manifest declares (a slow database query, a third-party API outage). Kubernetes reliably maintains what you TOLD it to maintain — it does not independently determine what "correct" behavior should be, and correcting a genuinely broken declared state still requires a human to notice and fix the manifest itself.'
    },
    {
      q: 'Why is the shift from imperative to declarative thinking described as the single biggest mental model change moving from Docker/Compose into Kubernetes, rather than just a syntax difference?',
      a: 'It is not merely that the CONFIGURATION FORMAT changes from CLI flags to YAML — it is that the fundamental RELATIONSHIP between the operator and the running system changes. With Docker/Compose, you are responsible for noticing problems and issuing the next corrective command yourself — the system does exactly what you told it, once, and nothing more, ever, until you act again. With Kubernetes, you are responsible for accurately declaring the state you want, and then TRUSTING an ongoing, autonomous process to maintain it — your job shifts from "notice problems and react" to "declare intent correctly and trust the reconciliation loop," which requires a genuinely different operational mindset (and a different kind of debugging instinct — checking whether the DECLARED state is actually what you meant, rather than checking whether the last command you ran succeeded) than anything Parts 0-3 of this course required.'
    }
  ]
};
