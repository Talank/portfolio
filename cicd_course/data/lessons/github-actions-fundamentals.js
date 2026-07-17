window.LESSONS = window.LESSONS || {};
window.LESSONS['github-actions-fundamentals'] = {
  id: 'github-actions-fundamentals',
  title: 'GitHub Actions: Workflows, Jobs, Steps & Triggers',
  category: 'Part 6 — CI/CD Pipelines',
  timeMin: 40,
  summary: 'The previous lesson\'s pipeline-stages map was tool-agnostic. This lesson makes it concrete in GitHub Actions specifically — the CI/CD tool most tightly integrated with GitHub itself, and a reasonable, widely-used default choice. A workflow file\'s actual YAML structure — `on:` triggers, `jobs:`, `steps:` — maps directly onto the previous lesson\'s trigger/stage vocabulary, and this lesson\'s real, complete workflow file is the first concrete artifact this course has built toward its actual capstone: automatically building, testing, and pushing a Docker image on every push to main.',
  goals: [
    'Explain the structural relationship between a workflow, a job, and a step in GitHub Actions',
    'Write a workflow file\'s `on:` section to trigger correctly on push and pull_request events',
    'Use a pre-built action (`uses:`) versus a raw shell command (`run:`), and explain when each is appropriate',
    'Pass a secret (like a registry credential) into a workflow securely via GitHub\'s encrypted secrets',
    'Explain what happens to a job\'s later steps when an earlier step in that same job fails'
  ],
  concept: [
    {
      h: 'Workflow, job, and step: the three-level structure',
      p: [
        'A GitHub Actions <b>workflow</b> is a YAML file living at `.github/workflows/<name>.yml` in the repository — one workflow file typically corresponds to one overall CI/CD process (e.g., "build, test, and deploy on push to main"). A workflow contains one or more <b>jobs</b>, each of which runs on its own fresh virtual machine (a "runner"), and — importantly — jobs run in PARALLEL by default unless explicitly configured to depend on each other via `needs:`. Each job contains an ordered sequence of <b>steps</b>, which DO run sequentially, one after another, within that job\'s one runner.',
        'This structure maps directly onto the previous lesson\'s stage vocabulary: the previous lesson\'s "checkout, build, test, push, deploy" sequence could be five STEPS within one JOB (since they genuinely depend on each other in strict order), or split across multiple jobs with explicit `needs:` dependencies if, say, build-and-test should run on multiple OS/version combinations in parallel before a single deploy job runs afterward — a pattern this lesson\'s deepDive covers as a matrix build.'
      ]
    },
    {
      h: '`on:`: triggers, in actual GitHub Actions syntax',
      p: [
        'The previous lesson\'s trigger concepts become the `on:` key at the top of a workflow file: `on: push: branches: [main]` triggers on any push directly to main; `on: pull_request: branches: [main]` triggers when a PR targeting main is opened or updated — exactly the previous lesson\'s "build+test on PR, full pipeline on merge to main" pattern, implemented as two workflow files (or one workflow with conditional logic) each with its own specific `on:` configuration.',
        'GitHub Actions supports many other trigger types beyond these two — `workflow_dispatch` (a manual "run this workflow" button in the GitHub UI, useful for on-demand runs like the earlier "human approval gate" Continuous Delivery pattern), `schedule` (cron-syntax timed triggers), and triggers for other repository events entirely (a new release being published, an issue being labeled) — but `push` and `pull_request` cover the large majority of a typical CI/CD workflow\'s actual needs.'
      ]
    },
    {
      h: '`uses:` vs. `run:`: a pre-built action, or a raw command',
      p: [
        'A step can either `run:` a raw shell command directly (`run: docker build -t my-app .`, executed on the runner exactly as if typed into its terminal) or `uses:` a pre-built, reusable ACTION — a packaged piece of automation, typically referenced as `owner/repo@version` (e.g., `actions/checkout@v4`), that someone else has already written and published, handling a common task\'s details so you do not have to reimplement them yourself. `actions/checkout@v4` is genuinely the most common first step in nearly every real workflow — it performs the previous lesson\'s "checkout" stage, cloning the exact commit\'s code onto the runner, correctly handling details (shallow clones, submodules, credentials) that a hand-rolled `git clone` command would need to reimplement.',
        'The practical guidance: reach for an existing, well-maintained action (from GitHub itself, like `actions/checkout` and `actions/setup-node`, or a Docker-specific one like `docker/build-push-action`) whenever one exists for the task at hand, since it is generally more reliable and handles edge cases a hand-written equivalent would likely miss — reach for a raw `run:` command for anything simple, project-specific, or genuinely not covered by an existing action.'
      ]
    },
    {
      h: 'Secrets, and step failure behavior',
      p: [
        'A workflow that needs a credential (a registry password, an API token) references it via `${{ secrets.MY_SECRET }}`, where `MY_SECRET` is configured once in the repository\'s (or organization\'s) Settings, encrypted at rest by GitHub, and never printed in plaintext in workflow logs (GitHub automatically masks a secret\'s exact value if it happens to appear in log output) — this is the CI-pipeline-level equivalent of the Docker-level environment-config-and-secrets lesson\'s "never bake a secret into a build artifact," applied to keeping credentials out of the WORKFLOW FILE itself, which is committed to source control and visible to anyone with repository access.',
        'Within one job, if any step fails (returns a non-zero exit code), every SUBSEQUENT step in that same job is skipped by default, and the job is marked failed — exactly the previous lesson\'s "a failing stage stops the pipeline" principle, now implemented concretely: a failing `docker build` step means the `test`, `push`, and `deploy` steps after it in the same job never execute at all. This default can be deliberately overridden per-step with `continue-on-error: true` for steps where a failure genuinely should not block the rest (a non-critical linting step, for instance) — but that should be a deliberate, considered exception, not the default assumption.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Standing Departure Checklist, Posted Once, Followed Every Time',
      text: 'After enough near-disasters from ad hoc departures, the crew settles on a written, standing DEPARTURE CHECKLIST, posted permanently in the galley — not something Nami re-explains verbally every single time, but a fixed, reusable document that automatically applies whenever the trigger condition ("we are actually departing") occurs. The checklist itself is broken into clear steps, run in strict order — sails, then anchor, then final headcount — and, crucially, if the headcount step reveals someone is missing, the departure does not proceed to "cast off" anyway; the entire remaining sequence halts right there until the actual problem is resolved. Some steps on the list are themselves references to ALREADY-ESTABLISHED procedures the crew has separately, thoroughly worked out before (Usopp\'s specific rigging-check routine, referenced by name rather than re-explained from scratch on the checklist itself) — reusing an already-proven procedure rather than reinventing it inline every single time.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Standing Moving-Day Checklist, Posted Once, Followed Every Time',
      text: 'After one too many chaotic moves, Sheldon insists on a written, standing MOVING-DAY CHECKLIST, taped permanently inside a closet door — not something he re-explains from scratch verbally to Leonard and Howard every single time, but a fixed, reusable document that automatically applies whenever the actual trigger ("we are moving something today") occurs. The checklist is broken into clear steps in strict order — label boxes, THEN load the truck, THEN do a final apartment walkthrough — and if the walkthrough step reveals something was left behind, the process does not proceed to "close the truck and leave" regardless; it halts right there until the actual gap is fixed. Certain steps on the list reference already-established, separately-perfected sub-procedures (Sheldon\'s specific box-labeling system, referenced by name rather than re-explained inline every single time) — reusing something already worked out rather than reinventing it from scratch on every single move.'
    },
    why: 'The posted departure checklist and moving-day checklist are both a GitHub Actions WORKFLOW: a fixed, reusable file, automatically triggered by a specific event, containing ordered STEPS that halt the whole remaining sequence the instant one fails, with some steps REUSING already-proven external procedures (Usopp\'s rigging routine; Sheldon\'s labeling system) rather than reinventing them inline — exactly what `uses: actions/checkout@v4` does, reusing a proven, published action instead of hand-writing the same logic from scratch in every single workflow.'
  },
  tech: [
    {
      q: 'Why do jobs within one workflow run in PARALLEL by default, while steps within one job run strictly SEQUENTIALLY?',
      a: 'Each job gets its own fresh, independent runner (virtual machine), with no shared state or dependency assumed between jobs unless explicitly declared via `needs:` — this default parallelism is genuinely useful, since many real CI tasks (running tests against multiple language/OS versions, for instance) are naturally independent of each other and benefit from running simultaneously rather than needlessly waiting in sequence. Steps within ONE job, by contrast, execute on that SAME runner, in the SAME environment, and very often have real, meaningful dependencies on each other (a test step needs the build step\'s output to already exist) — sequential execution within a job is the correct default precisely because steps commonly build on each other\'s results in a way separate jobs typically do not.'
    },
    {
      q: 'Why is `actions/checkout@v4` almost always the very first step in a real workflow, rather than the runner already having the repository code available?',
      a: 'A GitHub Actions runner starts as a genuinely fresh, empty virtual machine for every single job run — it has no pre-existing knowledge of, or access to, any specific repository\'s code by default, precisely because runners are meant to be disposable, generic compute environments reused across any workflow, for any repository, rather than pre-loaded with any one specific project\'s state. `actions/checkout@v4` is the step that explicitly clones the triggering commit\'s exact code onto that fresh runner — correctly handling authentication (using a token GitHub automatically provides), fetching the right commit/branch, and other details a hand-rolled `git clone` would need to reimplement — which is why it is the near-universal first step: nearly every subsequent step needs actual repository code to exist on the runner before it can do anything useful.'
    },
    {
      q: 'Mechanically, how does `${{ secrets.MY_SECRET }}` avoid the exact "secret baked into permanent history" problem the Docker-level secrets lesson covered?',
      a: 'GitHub stores a configured repository/organization secret encrypted at rest, separate entirely from the workflow YAML file itself (which IS committed to source control, permanently, and visible to anyone with repository read access) — the `${{ secrets.MY_SECRET }}` syntax is a runtime SUBSTITUTION, injected into the running job\'s environment only at execution time, never written into the workflow file\'s own committed text at all. This is structurally similar to the Docker BuildKit `--mount=type=secret` mechanism from the environment-config-and-secrets lesson: the actual secret value never becomes part of something PERMANENTLY STORED and broadly readable (a committed YAML file, an image layer) — it exists only transiently, at the point of actual use, injected fresh on each run.'
    }
  ],
  code: {
    title: 'A complete, real workflow: build, test, and push on push to main',
    intro: 'Every piece here maps directly onto the previous lesson\'s stage vocabulary — this file, almost unmodified, is exactly what the upcoming capstone builds on.',
    code: `# .github/workflows/ci.yml
name: Build, Test & Push

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-test-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t my-app:\${{ github.sha }} .

      - name: Run tests
        run: docker run --rm my-app:\${{ github.sha }} npm test

      # Push only on an actual push to main — NOT on a pull request,
      # matching the previous lesson's "build+test on PR, full pipeline
      # on merge to main" trigger design.
      - name: Log in to registry
        if: github.event_name == 'push'
        run: echo "\${{ secrets.REGISTRY_PASSWORD }}" | docker login myregistry.example.com -u myuser --password-stdin

      - name: Push image
        if: github.event_name == 'push'
        run: |
          docker tag my-app:\${{ github.sha }} myregistry.example.com/myteam/my-app:\${{ github.sha }}
          docker push myregistry.example.com/myteam/my-app:\${{ github.sha }}`,
    notes: [
      '${{ github.sha }} is a built-in GitHub Actions variable holding the exact commit SHA that triggered this run — used directly as the image tag, exactly the image-registries lesson\'s "tag with a specific, immutable identifier" guidance, automated.',
      'The if: github.event_name == \'push\' condition on the last two steps is precisely how ONE workflow file implements "build+test always, but push only on an actual push to main" without needing two separate files.'
    ]
  },
  lab: {
    title: 'Add a deploy step, correctly gated',
    prompt: 'Extend the workflow above with a final "Deploy to Kubernetes" step that runs `kubectl set image deployment/my-app my-app=myregistry.example.com/myteam/my-app:${{ github.sha }}` — but ONLY when the trigger was an actual push to main, never on a pull request (use the same conditional pattern as the push step above).',
    starter: `      - name: Push image
        if: github.event_name == 'push'
        run: |
          docker tag my-app:\${{ github.sha }} myregistry.example.com/myteam/my-app:\${{ github.sha }}
          docker push myregistry.example.com/myteam/my-app:\${{ github.sha }}

      # Your new step:
      - name: ???
        if: ???
        run: ???
`,
    checks: [
      { re: "if:\\s*github\\.event_name\\s*==\\s*'push'", flags: 'i', must: true, hint: "The deploy step needs if: github.event_name == 'push', same as the push step.", pass: 'Correctly gated on push event ✓' },
      { re: 'kubectl\\s+set\\s+image\\s+deployment/my-app', flags: 'i', must: true, hint: 'run: kubectl set image deployment/my-app my-app=...', pass: 'kubectl set image command ✓' },
      { re: '\\$\\{\\{\\s*github\\.sha\\s*\\}\\}', flags: 'i', must: true, hint: 'The image tag should use ${{ github.sha }}, matching the push step\'s tag exactly.', pass: 'Uses github.sha tag ✓' }
    ],
    run: 'No real cluster needed to check this — but if you have kind/minikube available, try running the equivalent kubectl command by hand first to confirm the syntax is correct.',
    solution: `      - name: Deploy to Kubernetes
        if: github.event_name == 'push'
        run: kubectl set image deployment/my-app my-app=myregistry.example.com/myteam/my-app:\${{ github.sha }}`,
    notes: [
      'Using the exact same ${{ github.sha }} tag for both push and deploy is essential — deploying a DIFFERENT tag than the one just pushed would deploy the wrong build entirely.',
      'This deploy step assumes the runner already has kubectl configured with cluster credentials — a real workflow would need an additional step (or secret-based kubeconfig setup) to authenticate to the cluster first, beyond this lesson\'s scope.'
    ]
  },
  quiz: [
    {
      q: 'What is the structural relationship between a workflow, a job, and a step in GitHub Actions?',
      options: ['They are three names for the same concept', 'A workflow contains one or more jobs (which run in parallel by default); each job contains an ordered sequence of steps (which run sequentially)', 'A step contains multiple jobs, which contain multiple workflows', 'Jobs and steps are identical; only workflows are distinct'],
      correct: 1,
      explain: 'Workflow -> jobs (parallel by default) -> steps (sequential within a job) is the three-level structure every GitHub Actions file follows.'
    },
    {
      q: 'Why is `actions/checkout@v4` almost always the first step in a real workflow?',
      options: ['It is required by GitHub Actions syntax rules', 'A fresh runner has no repository code by default — this step explicitly clones the triggering commit onto the runner, which nearly every later step depends on', 'It sets up secrets automatically', 'It builds the Docker image'],
      correct: 1,
      explain: 'Runners start empty for every job run. checkout is what actually gets the repository\'s code onto the runner before anything else can meaningfully happen.'
    },
    {
      q: 'What is the difference between `uses:` and `run:` in a workflow step?',
      options: ['They are interchangeable syntax for the same thing', '`uses:` invokes a pre-built, reusable action; `run:` executes a raw shell command directly on the runner', '`run:` only works for Docker commands', '`uses:` is deprecated in favor of `run:`'],
      correct: 1,
      explain: '`uses:` references a packaged, reusable action (like actions/checkout); `run:` executes an arbitrary shell command as-is.'
    },
    {
      q: 'How does `${{ secrets.MY_SECRET }}` avoid permanently exposing a credential in the workflow file itself?',
      options: ['It does not — secrets are stored in plaintext in the YAML file', 'The secret is stored encrypted separately by GitHub and substituted in only at runtime — the actual value is never written into the committed workflow file', 'Secrets are only available to repository administrators', 'It automatically deletes the secret after one use'],
      correct: 1,
      explain: 'GitHub secrets exist separately from the workflow file, injected at execution time only — the committed YAML never contains the actual secret value.'
    },
    {
      q: 'If a step named "Run tests" fails in the middle of a job, what happens to the steps after it in that same job by default?',
      options: ['They run anyway, ignoring the failure', 'They are skipped, and the job is marked failed — exactly the "failing stage stops the pipeline" principle', 'Only steps with the same name are skipped', 'The entire workflow file is deleted'],
      correct: 1,
      explain: 'By default, a failed step halts all subsequent steps in that job, matching the CI/CD-concepts lesson\'s hard-gate-on-failure principle.'
    }
  ],
  pitfalls: [
    'Hardcoding a credential directly in a workflow YAML file instead of referencing it via ${{ secrets.NAME }} — the YAML is committed to source control and visible to anyone with repository access.',
    'Assuming steps across DIFFERENT jobs run in the same order they are written — jobs run in parallel by default; only steps within the SAME job are guaranteed sequential.',
    'Forgetting to gate a push/deploy step with an `if:` condition on the trigger event, causing it to run even on pull requests, potentially pushing or deploying unmerged, unreviewed code.'
  ],
  interview: [
    {
      q: 'Explain why GitHub Actions runs jobs in parallel by default but steps sequentially, and how you would use `needs:` to introduce a deliberate dependency between jobs when one genuinely is required.',
      a: 'Jobs default to parallel because they run on independent, isolated runners with no assumed relationship between them — many real CI tasks (testing across multiple language versions, for instance) are naturally independent and benefit from concurrent execution rather than needless sequential waiting. Steps within one job default to sequential because they share ONE runner and very commonly have genuine dependencies on each other\'s output (a test step needs the build step\'s artifact to exist). When a genuine cross-job dependency exists — say, a "deploy" job that should only run after a "test" job across multiple OS versions has fully passed — `needs: [test]` on the deploy job\'s definition makes that dependency explicit, causing GitHub Actions to wait for the named job(s) to complete successfully before starting the dependent one, rather than running everything in unconstrained parallel.'
    },
    {
      q: 'A team\'s workflow file has a registry password hardcoded directly in the YAML, with a comment saying "temporary, will move to secrets later." Why is this a genuinely serious problem even if the repository itself is private?',
      a: 'A workflow YAML file is committed to source control, meaning the credential is now part of the repository\'s permanent git HISTORY — even if someone later removes it from the current file\'s content, the OLD commit containing it remains fully retrievable by anyone with read access to the repository, exactly the same "a later rm does not actually delete it" problem the Docker-level secrets lesson demonstrated for image layers. Repository privacy also is not a durable guarantee: access lists change over time, a repository could be made public later (accidentally or deliberately), and every contributor with current or PAST read access has already had the opportunity to see and copy that credential. The correct fix is not "move it to secrets later" as a low-priority followup — it is immediately rotating the exposed credential (treating it as already compromised) AND moving future use to GitHub secrets, since the historical exposure cannot be undone by simply editing the current file.'
    },
    {
      q: 'How would you design a GitHub Actions setup for a team wanting build+test feedback on every PR, but push+deploy only on merges to main — using this lesson\'s trigger and conditional mechanisms specifically?',
      a: 'One reasonable approach: a single workflow file with `on: push: branches: [main]` and `on: pull_request: branches: [main]` both configured, so the workflow runs for both event types, and then gate the push/deploy-specific steps with `if: github.event_name == \'push\'` (exactly as this lesson\'s code example does) — ensuring build and test run unconditionally for both PR and push events (giving PR feedback), while push and deploy only execute when the trigger was an actual push (merge) to main, never a pull request. An alternative, equally valid approach is two entirely separate workflow files — one triggered only by pull_request running build+test, another triggered only by push to main running the full sequence — which trades a bit of duplication for slightly simpler per-file logic; either design achieves the same underlying trigger discipline the CI/CD-concepts lesson described.'
    },
    {
      q: 'Why does using `${{ github.sha }}` as the image tag in a CI workflow directly implement a principle established in an earlier, unrelated lesson — and what would go wrong without it?',
      a: 'This directly implements the image-registries lesson\'s "never rely on :latest, always tag with something specific and immutable" guidance — `github.sha` is the exact commit SHA that triggered the workflow run, giving every build a unique, traceable, immutable tag automatically, with zero manual tagging effort required from any developer. Without it — say, if the workflow instead built and pushed with no explicit tag, defaulting to `:latest` — the exact "which version is actually running in production" and "how do I roll back to a specific previous version" problems that lesson described would resurface immediately, except now happening automatically, on every single CI run, rather than from an occasional manual mistake — automating a bad practice does not fix it, it just makes the bad practice happen more consistently and more often.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover a real, complete single-job workflow. This is what is underneath: matrix builds for testing multiple configurations in parallel, GitHub Actions\' own caching mechanism for build speed, and reusable workflows for avoiding duplicated YAML across multiple repositories.',
    sections: [
      {
        h: 'Matrix builds: one job definition, run across multiple configurations automatically',
        p: [
          'A `strategy: matrix:` block on a job lets ONE job definition run MULTIPLE TIMES automatically, once per combination of specified values — for example, `matrix: node-version: [18, 20, 22]` runs the entire job three times, once per Node.js version, in parallel, each as its own independent job run, without needing to hand-write three nearly-identical job definitions. This is genuinely valuable for testing an application against multiple language versions, multiple operating systems, or any other combination of variables where "does this work correctly across all of these" is a real requirement — a matrix with two dimensions (say, 3 Node versions × 2 operating systems) automatically produces 6 parallel job runs, one per combination, from one compact job definition.'
        ]
      },
      {
        h: 'Caching dependencies between workflow runs',
        p: [
          'By default, every job run starts on a completely fresh runner with nothing cached from any PREVIOUS run — meaning a `npm install` or equivalent dependency-install step re-downloads every dependency from scratch on every single run, exactly the slow-build problem the Dockerfile-best-practices lesson\'s BuildKit cache-mount deepDive addressed at the Docker layer, now showing up again at the CI-runner layer. The `actions/cache` action (or built-in caching parameters on some setup actions, like `actions/setup-node`\'s `cache:` option) persists a specified directory (a dependency cache folder) BETWEEN separate workflow runs, keyed on something like a lockfile\'s content hash — a subsequent run with an unchanged lockfile can restore that cached directory instead of re-downloading everything, often cutting minutes off a dependency-install step, mirroring the exact same "cache based on content, invalidate on genuine change" principle Docker\'s own build cache uses.'
        ]
      },
      {
        h: 'Reusable workflows: avoiding copy-pasted YAML across repositories',
        p: [
          'A team with many repositories sharing a nearly-identical CI/CD pattern (checkout, build, test, push, deploy, with only the image name and a few details differing) faces a real maintenance problem if each repository has its own hand-copied, slightly-drifted version of essentially the same workflow file. GitHub Actions supports REUSABLE workflows — a workflow file marked with `on: workflow_call` (rather than a normal trigger) that other workflows can invoke via `uses: owner/repo/.github/workflows/reusable.yml@version`, passing in specific inputs (the image name, for instance) as parameters — genuinely analogous to extracting a repeated code pattern into a shared function, applied to CI/CD configuration itself, so a fix or improvement to the shared logic can be made in exactly one place rather than needing to be manually propagated across every repository\'s own copy.'
        ]
      }
    ]
  }
};
