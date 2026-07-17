window.LESSONS = window.LESSONS || {};
window.LESSONS['ci-cd-concepts'] = {
  id: 'ci-cd-concepts',
  title: 'CI/CD Concepts: What Actually Happens Between "git push" and "It Is Live"',
  category: 'Part 6 — CI/CD Pipelines',
  timeMin: 30,
  summary: 'Every Docker and Kubernetes command in this course so far has been typed by hand. This lesson is the conceptual bridge to Part 6\'s actual subject: replacing that manual sequence — build the image, push it, apply the manifest — with an AUTOMATED pipeline that runs the same steps, consistently, triggered by a git push, with no human needing to remember the right commands in the right order under time pressure. Before any real GitHub Actions syntax (next lesson), this lesson defines CI and CD precisely as two related but distinct practices, and walks through what a real pipeline\'s stages actually are and why they run in that specific order.',
  goals: [
    'Define Continuous Integration and Continuous Delivery/Deployment precisely, and explain how they differ',
    'List the typical stages of a CI/CD pipeline in the order they run, and explain why that order matters',
    'Explain what a "pipeline trigger" is and name the most common trigger types',
    'Explain the difference between continuous DELIVERY and continuous DEPLOYMENT specifically',
    'Explain why a failing test stage should block every stage after it, rather than just being reported'
  ],
  concept: [
    {
      h: 'Continuous Integration: catching problems the moment code merges, not later',
      p: [
        '<b>Continuous Integration</b> (CI) is the practice of automatically building and testing every code change as soon as it is pushed or merged — rather than each developer working in isolation for days or weeks and discovering integration problems (conflicting changes, one person\'s change breaking another\'s code) only much later, all at once, in a much more expensive-to-untangle pile. A CI pipeline runs automatically, on every relevant push, executing the same build-and-test sequence a developer WOULD run manually, consistently and immediately, catching a broken build or a failing test within minutes of the change that caused it rather than days later.',
        'The actual value of CI is almost entirely about SPEED OF FEEDBACK: a test failure caught in 3 minutes, while the change is still fresh in the author\'s mind and easy to fix, is a fundamentally cheaper problem than the same failure discovered a week later, after several other changes have been built on top of the broken one and the original author has moved on to something else entirely.'
      ]
    },
    {
      h: 'Continuous Delivery vs. Continuous Deployment: a genuinely important distinction',
      p: [
        'Both terms build on CI\'s foundation, but they differ in one specific, important way. <b>Continuous Delivery</b> means every change that passes the full pipeline is automatically packaged into a deployable artifact and made READY to deploy at any time — but an explicit, deliberate human action (clicking "deploy," approving a release) is still required to actually PUSH it to production. <b>Continuous Deployment</b> goes one step further: every change that passes the full pipeline is deployed to production AUTOMATICALLY, with no human approval step at all — genuinely deploying to production potentially many times a day, entirely hands-off, as long as the pipeline itself passes.',
        'This "CD" ambiguity (Delivery vs. Deployment) is worth being precise about in conversation, since the two imply meaningfully different levels of automation and risk tolerance — a team practicing Continuous Delivery still has a human gate before production; a team practicing Continuous Deployment does not, and is trusting its automated test suite as the ENTIRE safety net before code reaches real users, which is a genuinely bigger commitment to test quality and pipeline reliability than Continuous Delivery requires.'
      ]
    },
    {
      h: 'The typical pipeline stages, and why the order is not arbitrary',
      p: [
        'A real CI/CD pipeline for a containerized application typically runs, in this order: (1) <b>checkout</b> — get the exact commit\'s source code; (2) <b>build</b> — compile/install dependencies, and specifically for this course\'s subject, `docker build` the image; (3) <b>test</b> — run the automated test suite against that build; (4) <b>push</b> — if tests passed, push the built image to a registry, tagged specifically (recall the image-registries lesson\'s "never rely on :latest" guidance — this is exactly where a commit-SHA or version tag gets applied, automatically, as part of the pipeline); (5) <b>deploy</b> — update the running Kubernetes Deployment to use the newly-pushed image.',
        'This order is not arbitrary — each stage is a genuine PREREQUISITE gate for the one after it: there is no point pushing an image that failed to even build, no point pushing an image whose tests failed (shipping known-broken code to a registry, ready to be deployed, defeats the entire purpose of having tests), and no point deploying an image that was never successfully pushed anywhere a cluster could actually pull it from. A failing stage should always STOP the pipeline immediately, not merely get reported while later stages proceed anyway — the whole value of the ordering collapses if a failed test stage does not actually prevent the deploy stage from running.'
      ]
    },
    {
      h: 'Triggers: what actually starts a pipeline run',
      p: [
        'A pipeline needs a <b>trigger</b> — an event that causes it to actually run. The most common: a push to a specific branch (often triggering the full build-test-push-deploy sequence for a `main`/`production` branch specifically, while feature branches might trigger only build-and-test, stopping short of push/deploy); a pull request being opened or updated (commonly triggering build-and-test only, to give feedback BEFORE a change is even merged, catching problems earlier still than a post-merge CI run would); and a scheduled trigger (running on a timer, useful for things like nightly full test suites too slow to run on every single push).',
        'Configuring the right trigger for the right pipeline is a genuinely important design decision, not a technicality: triggering a full production DEPLOY on every single push to every branch would be reckless (deploying half-finished feature-branch work straight to production), while triggering NOTHING except a manual button click would forfeit most of CI/CD\'s actual value — the standard, sensible pattern is build-and-test on every push/PR for fast feedback, with push-and-deploy reserved specifically for merges to the branch that represents "this is meant to actually ship."'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Baratie\'s Ticket Rail Never Skips a Check Before the Next One',
      text: 'Sanji\'s kitchen runs on a strict ticket-rail sequence, and it is genuinely non-negotiable in what order things happen: an order is first CONFIRMED as complete and correct against what was actually requested, THEN it is tasted/quality-checked by a second set of eyes, and ONLY THEN does it get called out to actually go to the table — never skipping ahead, never sending a dish to the table because "the confirm step probably would have passed anyway." Early on, a rushed trainee, under pressure during a packed dinner service, tries pushing a dish straight to the table after confirming the order but skipping the taste-check entirely, reasoning it would probably have passed anyway and saving a few seconds mattered more that night. Sanji catches it before it goes out and is unambiguous about why the skip is unacceptable regardless of how likely it was to have passed: the entire POINT of a strict, unskippable sequence is that "probably fine" is exactly the assumption a real check exists to verify, not to skip past under pressure — the one time it is actually wrong is exactly the time nobody would have caught it, precisely because the check that would have caught it was the one skipped.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Expo Rail Never Skips a Check Before the Next One',
      text: 'Monica\'s kitchen, much like Sanji\'s, runs on a genuinely non-negotiable sequence at the pass: a dish is first confirmed as matching the actual ticket, THEN visually and quality checked by Monica or her expo before it leaves the kitchen, and ONLY THEN does it get sent out to the table — no skipping ahead, ever, regardless of how busy the night gets. During one especially chaotic service, a stressed line cook tries sending a dish straight out after confirming the ticket but skipping Monica\'s quality check, reasoning it looked fine and every second mattered during the rush. Monica catches it before it reaches the table and is completely unbending about why: the entire reason the check exists in the strict, unskippable sequence it does is precisely for the rare case where something LOOKS fine but genuinely is not — skipping the check specifically because "it\'s probably fine" defeats the actual purpose of having a check at all, since a check that only gets applied when nobody is worried is not actually doing anything.'
    },
    why: 'The Baratie\'s ticket rail and Monica\'s expo rail both enforce a strict, unskippable SEQUENCE where each check is a genuine gate for whatever comes after it — exactly a CI/CD pipeline\'s build-then-test-then-push-then-deploy order, where a failing test stage must actually STOP the pipeline, not just get reported while later stages proceed anyway "because it probably would have passed." Both trainees\' "skip it, it\'s probably fine" instinct is exactly the mistake a real pipeline\'s hard-gate-on-failure design exists to prevent.'
  },
  tech: [
    {
      q: 'Why is "speed of feedback" specifically the core value proposition of Continuous Integration, rather than just "automated testing" in general?',
      a: 'Automated testing itself is valuable regardless of when it runs, but CI\'s specific additional contribution is running that testing IMMEDIATELY, automatically, on every push — meaning a broken change is caught within minutes, while the context is still fresh in the author\'s mind, related code is still fresh in reviewers\' minds, and the fix is typically small and localized. Without CI, the same tests might still exist and eventually run, but only periodically or manually, by which point several unrelated changes may have been built on top of the broken one, making the actual root cause considerably harder to isolate, and the original author may have moved entirely on to different work, making the fix more expensive in real terms — the tests themselves are not what changed, WHEN they run relative to the change is what CI actually adds.'
    },
    {
      q: 'Concretely, what is the operational difference between a Continuous Delivery pipeline and a Continuous Deployment pipeline, in terms of what actually happens after tests pass?',
      a: 'In Continuous Delivery, once a change passes the full pipeline (build, test, package), the pipeline stops just short of actually pushing to production — it produces a deployable, ready artifact and typically waits for an explicit human trigger (approving a release, clicking "deploy") before that artifact reaches production. In Continuous Deployment, the pipeline does not stop there at all — passing the full pipeline (through and including deploy) is itself sufficient to reach production automatically, with no additional human approval gate, meaning a merged, tested change can be live in production within minutes with zero manual intervention. The difference is exactly one gate: an explicit human approval step present in Delivery, absent in Deployment.'
    },
    {
      q: 'Why does triggering "build and test" on every pull request, separate from triggering "push and deploy" only on merges to main, represent a deliberate, sensible design rather than an arbitrary convention?',
      a: 'Running build-and-test on a pull request gives feedback BEFORE a change is even merged — catching a problem at the earliest possible point, before it has affected anyone else\'s work at all, which is strictly better than only catching it after merge. Reserving push-and-deploy specifically for merges to the branch representing "ready to ship" (commonly `main`) avoids the genuinely reckless alternative of deploying every half-finished feature-branch commit straight to production — the trigger configuration itself is effectively encoding "which branch represents code meant to actually run in production," and getting that specific configuration wrong (e.g., accidentally deploying on every push to every branch) is a real, common, and genuinely dangerous CI/CD misconfiguration.'
    }
  ],
  code: {
    title: 'A pipeline\'s stages, as a conceptual sequence',
    intro: 'Nothing here is real GitHub Actions syntax yet — that is the next lesson. This is purely the stage sequence and its gating logic.',
    code: `# Triggered by: push to "main" branch

STAGE 1: checkout
  -> get the exact commit's source code
  -> FAILS if the repository is unreachable (rare) -> pipeline stops

STAGE 2: build
  -> docker build -t my-app:$GIT_SHA .
  -> FAILS if the Dockerfile has an error, or a dependency install fails
  -> pipeline stops here; STAGE 3+ never run

STAGE 3: test
  -> run the automated test suite against the built image
  -> FAILS if any test fails
  -> pipeline stops here; STAGE 4+ never run
  -> (this is the gate that matters most — a broken build reaching
  --    the registry defeats the entire purpose of having tests)

STAGE 4: push
  -> docker push myregistry.example.com/myteam/my-app:$GIT_SHA
  -> only reachable if stages 1-3 all succeeded
  -> FAILS if registry auth is misconfigured, or push is rejected

STAGE 5: deploy
  -> kubectl set image deployment/my-app my-app=...:$GIT_SHA
  -> only reachable if stages 1-4 all succeeded
  -> this is the ONLY stage that actually changes what production runs`,
    notes: [
      'Every stage after a failure is simply never executed at all — not executed-and-ignored, genuinely never run, which is the entire point of hard-gating on failure.',
      'The tag used in STAGE 4 is $GIT_SHA — a direct callback to the image-registries lesson\'s specific-tag guidance, now applied automatically by the pipeline instead of requiring a human to remember it.'
    ]
  },
  lab: {
    title: 'Order the pipeline stages and identify the correct trigger',
    prompt: 'Given these five pipeline stages in SCRAMBLED order, write them in the correct execution order, and state which branch event should trigger the full push+deploy sequence versus which event should trigger only build+test.',
    starter: `# Scrambled stages: deploy, test, checkout, push, build

# Correct order (1 through 5):
# 1.
# 2.
# 3.
# 4.
# 5.

# Trigger for FULL push+deploy sequence:


# Trigger for build+test ONLY (no push/deploy):

`,
    checks: [
      { re: '1\\.\\s*checkout', flags: 'i', must: true, hint: 'Stage 1: checkout', pass: '1. checkout ✓' },
      { re: '2\\.\\s*build', flags: 'i', must: true, hint: 'Stage 2: build', pass: '2. build ✓' },
      { re: '3\\.\\s*test', flags: 'i', must: true, hint: 'Stage 3: test', pass: '3. test ✓' },
      { re: '4\\.\\s*push', flags: 'i', must: true, hint: 'Stage 4: push', pass: '4. push ✓' },
      { re: '5\\.\\s*deploy', flags: 'i', must: true, hint: 'Stage 5: deploy', pass: '5. deploy ✓' },
      { re: 'main|merge', flags: 'i', must: true, hint: 'Full push+deploy should trigger on push/merge to main (the "ready to ship" branch).', pass: 'main branch trigger for deploy ✓' },
      { re: 'pull request|pr|feature branch', flags: 'i', must: true, hint: 'Build+test only should trigger on pull requests / feature branches.', pass: 'PR trigger for build+test ✓' }
    ],
    run: 'No real command yet — verify your ordering by rereading this lesson\'s code example, which spells out the same sequence with real reasons for each gate.',
    solution: `# Correct order (1 through 5):
# 1. checkout
# 2. build
# 3. test
# 4. push
# 5. deploy

# Trigger for FULL push+deploy sequence:
Push (merge) to the main branch — the branch representing code meant to actually ship.

# Trigger for build+test ONLY (no push/deploy):
Pull request opened/updated — gives feedback before the change is even merged, without deploying unfinished work.`,
    notes: [
      'checkout must come first structurally — every later stage needs the actual source code to operate on.',
      'test must come before push — pushing a broken, untested build to the registry defeats the purpose of having tests at all.'
    ]
  },
  quiz: [
    {
      q: 'What is the core value Continuous Integration adds beyond simply "having automated tests"?',
      options: ['CI makes tests run faster in absolute terms', 'CI runs tests automatically and immediately on every push, catching problems within minutes rather than days, while context is still fresh', 'CI eliminates the need for tests entirely', 'CI only matters for very large teams'],
      correct: 1,
      explain: 'CI\'s specific contribution is WHEN tests run relative to the change — immediate feedback is dramatically cheaper to act on than delayed feedback.'
    },
    {
      q: 'What is the key difference between Continuous Delivery and Continuous Deployment?',
      options: ['They are identical terms for the same practice', 'Continuous Delivery stops short of production, requiring explicit human approval to deploy; Continuous Deployment deploys to production automatically with no human approval gate', 'Continuous Deployment requires more manual testing than Continuous Delivery', 'Continuous Delivery only applies to mobile apps'],
      correct: 1,
      explain: 'The distinguishing factor is exactly one gate: a human approval step present in Delivery, absent in Deployment.'
    },
    {
      q: 'Why must a failing test stage stop the pipeline entirely, rather than just being reported while later stages continue?',
      options: ['It technically cannot be configured any other way', 'Allowing later stages (push, deploy) to proceed after a test failure would ship known-broken code, defeating the entire purpose of having tests', 'Failing tests should only be reported, never block anything', 'Test failures are usually false positives anyway'],
      correct: 1,
      explain: 'Each stage is a genuine prerequisite gate — proceeding past a failed test stage undermines the whole point of testing before shipping.'
    },
    {
      q: 'Why is it a sensible design to trigger build+test on every pull request but reserve push+deploy for merges to main?',
      options: ['There is no real reason — it is an arbitrary convention', 'PR-triggered build+test catches problems before merge, at minimal risk; reserving deploy for main avoids automatically shipping half-finished feature-branch work to production', 'GitHub Actions technically cannot trigger deploy on feature branches', 'Feature branches should never be tested at all'],
      correct: 1,
      explain: 'This trigger configuration deliberately encodes "which branch represents production-ready code" while still getting fast feedback on in-progress work.'
    },
    {
      q: 'In a typical pipeline, why does "push" (to a registry) come before "deploy" rather than after?',
      options: ['The order between push and deploy does not matter at all', 'A Kubernetes cluster deploying an updated image needs to actually PULL that image from a registry — it must already be pushed there before a deploy can reference it', 'Push is optional and can be skipped entirely', 'Deploy always happens locally, with no registry involved'],
      correct: 1,
      explain: 'Deploy updates a Kubernetes Deployment to reference a specific image tag — that image must already exist in a registry the cluster can pull from, which is exactly what the push stage provides.'
    }
  ],
  pitfalls: [
    'Conflating Continuous Delivery and Continuous Deployment as interchangeable terms — they imply meaningfully different levels of automation and risk tolerance, worth being precise about.',
    'Configuring a pipeline to deploy on every push to every branch, rather than reserving the deploy stage specifically for the branch representing production-ready code.',
    'Allowing a pipeline to continue past a failed stage (reporting the failure but proceeding anyway) instead of hard-stopping — this silently defeats the purpose of every gate after the point of failure.'
  ],
  interview: [
    {
      q: 'Explain Continuous Integration to someone who has only ever worked with manual, infrequent code merges, focusing on WHY it actually helps rather than just what it does.',
      a: 'Without CI, developers typically work in relative isolation for extended periods, and integration problems — one person\'s change conflicting with or breaking another\'s — only surface when changes are eventually merged and tested together, by which point the root cause can be genuinely hard to isolate among several combined changes, and the context needed to fix it efficiently has often faded. CI inverts this by running an automated build-and-test sequence on every single push, immediately — a broken change is caught within minutes, while it is still isolated (nothing else has been built on top of it yet) and while the author still has full context on what they just changed. The actual mechanism (automated tests) is not new; what CI adds is running that mechanism continuously and immediately rather than periodically or manually, which is what makes problems cheap to fix instead of expensive.'
    },
    {
      q: 'A team wants to move from manual deployments to full Continuous Deployment. What would you want to be confident about before recommending that, given what Continuous Deployment actually removes?',
      a: 'Continuous Deployment removes the human approval gate entirely — meaning the automated test suite becomes the ENTIRE safety net between a merged change and real production traffic, with no human reviewing the specific change immediately before it goes live. Before recommending it, I would want confidence that the test suite genuinely has strong, meaningful coverage of the application\'s actual critical paths (not just high coverage numbers that do not correspond to real confidence), that the pipeline itself is reliable (a flaky pipeline automatically deploying on a false-positive pass is a real risk), and that the team has a genuinely fast, well-practiced rollback mechanism (covered in the next-but-one lesson) for the cases where something does slip through despite testing — Continuous Deployment is a reasonable, common practice for teams with strong test discipline and fast rollback capability, and a risky one for teams without either.'
    },
    {
      q: 'Why does the specific ORDER of pipeline stages (build, then test, then push, then deploy) matter architecturally, not just as a convention?',
      a: 'Each stage is a genuine, meaningful PREREQUISITE for the one after it, not an arbitrary sequencing choice: test requires a successful build to have something to test against; push requires passing tests, since pushing an untested or known-broken build to a registry (making it available for ANYONE to pull and deploy) defeats the entire point of having a test stage; and deploy requires a successfully pushed image, since a Kubernetes cluster deploying an update needs to actually pull that specific image from somewhere it was already pushed to. Reordering these (say, pushing before testing) would create a real, meaningful hole in the safety guarantees the pipeline is supposed to provide — it is not a cosmetic convention, it directly encodes the actual dependency relationships between what each stage produces and what the next stage consumes.'
    },
    {
      q: 'How would you design pipeline triggers for a team with a main branch (production), a staging branch, and regular feature branches, given everything this lesson covered about trigger design?',
      a: 'Feature branches and pull requests targeting either staging or main: trigger build+test only, giving fast feedback before any merge, with no push or deploy stage running at all — this catches problems at the earliest, cheapest point without risking anything reaching a real environment. Merges to staging: trigger the full pipeline through deploy, but targeting the STAGING Kubernetes cluster/namespace specifically, giving the team a real, running environment to validate changes against before they reach production. Merges to main: trigger the full pipeline through deploy, targeting PRODUCTION specifically — this is the only trigger path that should ever be capable of updating what real users interact with, and keeping it strictly separate from the staging-targeting pipeline (different deploy target, likely a different Kubernetes namespace or cluster entirely) is what prevents a staging-bound change from accidentally reaching production through trigger misconfiguration.'
    }
  ]
};
