window.LESSONS = window.LESSONS || {};
window.LESSONS['why-linux-matters'] = {
  id: 'why-linux-matters',
  title: 'Why Linux: the Landscape, the Philosophy, and Why SSH Lives Here',
  category: 'Part 0 — Orientation & Terminal',
  timeMin: 25,
  summary: 'Before typing a single command, get the map straight: what "Linux" actually names (a kernel, not one operating system), why there are dozens of distros that all still feel similar once you know the fundamentals, the Unix philosophy that still shapes every tool you\'ll touch, and why almost every server, cloud VM, and CI/CD runner on Earth boots this instead of anything else — which is exactly why you SSH into Linux boxes for a living, and exactly why this course exists.',
  goals: [
    'Explain the difference between "the Linux kernel" and "a Linux distribution," and place Ubuntu/Debian, Fedora/RHEL, and Arch on that map',
    'State the core Unix philosophy in one sentence — small tools, text streams, do one thing well — and recognize it as the reason pipes and grep exist',
    'Explain concretely why servers, cloud infrastructure, and CI/CD runners are overwhelmingly Linux, not desktop OSes',
    'Know what to expect for practicing this course: macOS Terminal is close enough for most of it, with a real SSH connection to a Linux box arriving in Part 5',
    'Describe, at a high level, why understanding Linux is what makes Docker and Kubernetes make sense later — a container is not magic, it is a Linux process'
  ],
  concept: [
    {
      h: '"Linux" names a kernel, not an operating system',
      p: [
        'This trips people up for years because casual speech doesn\'t distinguish it: <b>Linux</b>, strictly, is one program — the <b>kernel</b>, started by Linus Torvalds in 1991. It\'s the layer that talks to the actual hardware: it schedules which process gets the CPU next, manages memory, and hands out access to disks and network cards. On its own, a kernel is not something you "use" — there\'s no prompt, no <code>ls</code>, nothing to log into.',
        'A <b>distribution</b> ("distro") is the kernel plus everything needed to make it a usable system: a package manager, a set of core command-line tools (mostly from the GNU project — more on that below), system startup machinery, and a set of defaults and conventions. Ubuntu, Debian, Fedora, RHEL (Red Hat Enterprise Linux), and Arch are all different distributions built around the <i>same</i> kernel. That\'s why, once you know the fundamentals this course teaches, you can sit down at almost any of them and be productive in minutes: the differences are mostly at the edges (which package manager, which default shell, which init system flavor), not in the ground truth of how files, processes, and permissions work.',
        '<div class="math">Linux (the kernel) + GNU core tools + a package manager + defaults = a distribution<br>Ubuntu, Debian, Fedora, RHEL, Arch, Alpine… all different distributions, same kernel underneath<span class="mnote">This is also why "which distro should I learn" is close to a non-question for this course: you\'re learning the 90% that\'s identical everywhere, with distro-specific commands (Part 6) called out explicitly when they diverge.</span></div>'
      ]
    },
    {
      h: 'The Unix philosophy — small tools, text streams, compose them',
      p: [
        'Linux inherited its design DNA from Unix (1970s Bell Labs), and one idea from that era explains almost every tool you\'ll meet in this course: <b>write small programs that each do one thing well, that read text and write text, and let people combine them.</b> <code>grep</code> only searches text. <code>sort</code> only sorts lines. <code>wc</code> only counts. None of them know or care about the others — but because they all speak the same "plain text in, plain text out" language, you can chain them with a pipe (<code>|</code>, Part 3) into pipelines no single tool\'s author ever anticipated.',
        'This is a genuinely different design instinct from a big GUI application that tries to do everything internally. It\'s also why the command line rewards learning over memorizing: once you understand that everything is text flowing between small filters, a huge fraction of "how do I do X" questions decompose into "which two or three small tools do I chain together" — a skill this course builds deliberately, culminating in real bash scripts (Part 4) and a capstone (Part 7) that\'s nothing but small tools wired together.'
      ]
    },
    {
      h: 'Why the server world — and CI/CD — runs on Linux',
      p: [
        'Your laptop might run macOS or Windows, but the machine your code actually deploys to almost certainly doesn\'t. The reasons are concrete, not just tradition: Linux is free and open-source (no per-server licensing cost at cloud scale), it\'s extremely stable running headless for months without a GUI, it\'s the most-supported target for every cloud provider (AWS, GCP, Azure images default to it), and — the one that matters most for where this course is headed — <b>Docker containers are Linux processes using Linux-specific kernel features</b> (namespaces and cgroups, which get a full explanation in Part 7). There is no such thing as a "Windows container" or "Mac container" running the same way; container tooling on Mac/Windows works by quietly running a Linux virtual machine underneath.',
        'Put together: your CI/CD pipeline runs on Linux, the containers it builds run on Linux, and the Kubernetes nodes that eventually schedule those containers are Linux boxes. When you SSH into a server to debug a deploy, read a log, or check why a service crashed, you\'re on a Linux box using exactly the tools this course teaches. Skipping this layer and jumping straight to "learn Docker" is possible, but everything from here on gets a lot less mysterious once you know what a container actually is underneath the marketing term — that\'s the whole reason this course exists before the Docker/Kubernetes one.'
      ]
    },
    {
      h: 'How you\'ll practice: your Mac now, a real box later',
      p: [
        'Good news for getting started today: macOS is Unix (BSD-flavored, not Linux, but a close cousin), so its built-in Terminal app already runs a real shell and most of the commands through Part 4 of this course behave identically. You don\'t need anything installed to begin. A few small differences will come up along the way — macOS ships BSD versions of some tools (like <code>ls</code> and <code>sed</code>) with slightly different flags than the GNU versions Linux servers use — and they\'ll be called out explicitly as pitfalls when they matter, not left as a surprise later.',
        'Part 5 (Networking & SSH) is where this stops being a simulation: you\'ll set up a real SSH connection to an actual Linux machine (a cheap cloud VM, or a Raspberry Pi, or a spare machine — the lesson covers the options) and everything after that runs for real, on a real remote Linux box, which is exactly the day-to-day reality this whole course is preparing you for.'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials above are everything you need to start. If you want the fuller picture — useful for interviews and for understanding why people argue about this stuff online — here\'s more.',
    sections: [
      {
        h: 'The distro family tree, properly',
        p: [
          'Distros cluster into a small number of families that share a package format and philosophy, and knowing the family tells you 80% of what you need to guess about an unfamiliar box: <b>Debian family</b> (Debian itself, Ubuntu, Linux Mint, Raspberry Pi OS) — <code>.deb</code> packages, <code>apt</code>/<code>apt-get</code>, favors stability and huge community package repos; <b>Red Hat family</b> (RHEL, Fedora, CentOS Stream, Rocky Linux, AlmaLinux) — <code>.rpm</code> packages, <code>dnf</code> (formerly <code>yum</code>), common in enterprise and government deployments, RHEL specifically dominates paid enterprise support contracts; <b>Arch family</b> (Arch, Manjaro, EndeavourOS) — rolling release (no big version jumps, continuous updates), <code>pacman</code>, prized for being minimal and unopinionated, popular with people who want to understand everything about their system; <b>Alpine</b> — deliberately tiny (a few MB base image), musl libc instead of glibc, the default base image for a huge fraction of Docker images specifically because smaller images pull and start faster — you will meet Alpine again by name in the next course.'
        ]
      },
      {
        h: 'GNU/Linux — the naming argument, briefly',
        p: [
          'The kernel Torvalds wrote needed a full set of surrounding tools to be usable — a shell, compilers, core utilities like <code>ls</code> and <code>cp</code> — and almost all of those, on a typical distro, come from the <b>GNU project</b> (Richard Stallman\'s free-software effort, started years before Linux existed, aiming to build a complete free Unix-like OS — it had everything except a working kernel). When Linux arrived as that missing kernel, most distros combined it with the existing GNU userland. Stallman and the Free Software Foundation have long argued the result should be called "GNU/Linux" to credit the userland\'s origin; nearly everyone else just says "Linux." You don\'t need a side in this to use the system, but it explains why so many core commands (<code>grep</code>, <code>sed</code>, <code>bash</code> itself) are literally named "GNU &lt;something&gt;" in their own documentation.'
        ]
      },
      {
        h: 'Where Linux actually runs — the scale most people underestimate',
        p: [
          'Beyond servers: essentially all of the top supercomputers in the world run Linux. Android — the most-installed mobile OS on Earth — runs on a modified Linux kernel. Most of the internet\'s web servers do. Your home router almost certainly runs embedded Linux. macOS and iOS are Unix-family but NOT Linux (they descend from BSD via Darwin — a genuinely separate lineage, which is why "is macOS Linux" is a real, common, and wrong assumption worth being able to correct). The practical upshot for your career: Linux fundamentals transfer to an enormous, unusually stable fraction of the infrastructure you\'ll ever touch professionally — this is not a niche skill with a shelf life.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'One handbook, every Marine base',
      text: 'A Marine officer gets transferred constantly — Windmill Village\'s sleepy coastal post this month, the Baratie\'s floating supply station next, a Water 7 shipyard base after that. On the surface these postings could not feel more different: different local customs, different daily rhythms, different supply routes, even different regional dialects among the staff. A green recruit assumes she has to relearn everything from scratch at every transfer, and dreads it. A veteran officer knows better: every single Marine base in the world, no matter how different its surface culture, runs off the exact same High Command handbook — the same chain of command, the same signal-flag protocol, the same procedure for logging a supply request. Learn THAT once, deeply, and you can walk onto literally any base on the Grand Line and be operational within the hour, because you learned the system underneath the local color, not the local color itself. The bases are the distros — Windmill Village runs its post one particular way (call it the Ubuntu of outposts, chosen because it\'s the friendliest for new recruits), the Baratie\'s crew has their own particular supply-chain quirks (the Fedora of outposts, favored by the more technically obsessive officers), Water 7\'s shipyard base runs leaner and rougher, expecting you to know your own gear (the Arch of outposts). Different flags flying, same High Command handbook underneath — the kernel every base answers to. And the whole reason a transferred officer stays calm walking into an unfamiliar base is the same reason you\'re about to spend this course on fundamentals instead of memorizing one specific distro\'s cheat sheet: the handbook is what actually transfers.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon can find the bathroom in any apartment in America',
      text: 'Sheldon Cooper, dragged to a physics conference and forced to stay in a hotel he has never seen, walks in, sets down his bag, and within ninety seconds has located the thermostat, the bathroom, and the nearest fire exit — without asking anyone. Leonard, mildly astonished, asks how. Sheldon\'s answer, delivered as though it were obvious: every building in the country that wants an occupancy permit has to follow the same building code — plumbing goes where plumbing has to go, electrical follows the same core rules, exits are marked the same way by law. Leonard\'s apartment, Penny\'s apartment across the hall, and this hotel room two states away are decorated completely differently — different furniture, different paint, different vibe entirely — but underneath the decor, the same code governs all of them, which is exactly why someone who understands the CODE, not the decor, is never actually lost in an unfamiliar building. Penny\'s apartment is Ubuntu with mismatched furniture. Howard\'s childhood bedroom-turned-workshop is Arch, configured within an inch of its life by someone who insists on doing everything himself. Sheldon isn\'t memorizing floor plans — he learned the building code once, and it transfers everywhere, which is the entire bet this course is making about spending Part 0 through Part 6 on fundamentals instead of "37 Ubuntu commands to memorize."'
    },
    why: 'A distro is the decor; the kernel is the building code. Learn the code — filesystem layout, permissions, processes, the shell — and every distro you\'re handed becomes a familiar building with different furniture, not a foreign country you have to relearn from zero.'
  },
  storyAnim: {
    title: 'One handbook, three Marine bases',
    h: 260,
    props: [
      { id: 'base1', emoji: '🏝️', label: 'Windmill Village post (Ubuntu / Debian)', x: 14, y: 58 },
      { id: 'base2', emoji: '🍽️', label: 'Baratie supply post (Fedora / RHEL)', x: 50, y: 74 },
      { id: 'base3', emoji: '⚙️', label: 'Water 7 shipyard post (Arch)', x: 86, y: 58 },
      { id: 'handbook', emoji: '📖', label: 'High Command handbook (the Linux kernel)', x: 50, y: 14 }
    ],
    actors: [
      { id: 'officer', emoji: '🎖️', label: 'Transferred officer (you)', x: 50, y: 40 }
    ],
    steps: [
      { c: 'Three Marine bases. On the surface, nothing alike — different routines, different local culture, different day-to-day feel.', p: { base1: 'dim', base2: 'dim', base3: 'dim' } },
      { c: 'A green recruit dreads the transfer to Windmill Village — new place, new rules to learn from zero, or so it seems.', a: { officer: [14, 46] }, p: { base1: 'lit' } },
      { c: 'A veteran transfers to the Baratie post instead and barely notices the change — different supply quirks, sure, but she is operational in an hour.', a: { officer: [50, 60] }, p: { base2: 'lit' } },
      { c: 'Same story at the Water 7 shipyard base — leaner, rougher, expects more self-sufficiency, but still nothing that shakes her.', a: { officer: [86, 46] }, p: { base3: 'lit' } },
      { c: 'The reason: every base, however different on the surface, answers to the exact same High Command handbook — the same chain of command, the same signal protocol.', p: { handbook: 'good' } },
      { c: 'That handbook is the kernel. The bases are the distros. Learn the handbook once — filesystem, permissions, processes, the shell — and no base is ever truly foreign again.', a: { officer: [50, 30] }, p: { base1: 'good', base2: 'good', base3: 'good', handbook: 'lit' } }
    ]
  },
  tech: [
    {
      q: 'Is macOS "a kind of Linux"?',
      a: 'No — and this is a very common mix-up worth being able to correct precisely. macOS descends from BSD Unix via Apple\'s Darwin, a genuinely separate lineage from Linux, though both are Unix-family and both honor much of the POSIX standard (which is why so many everyday commands feel identical). Practically: your Mac Terminal is a completely real, non-simulated Unix shell, and the vast majority of what this course teaches through Part 4 works on it unmodified. The differences that DO show up are usually in specific tool flags — macOS ships BSD versions of tools like <code>ls</code>, <code>sed</code>, and <code>date</code>, while Linux servers ship the GNU versions, and the flags don\'t always match one-for-one. Those spots get called out explicitly as pitfalls when the course reaches them, rather than surprising you mid-lesson.'
    },
    {
      q: 'What does "everything is a file" actually buy you, concretely?',
      a: 'On Linux, far more things are represented through the filesystem interface than you\'d expect from the name: regular documents, yes, but also hardware devices (<code>/dev/sda</code> for a disk), running-kernel information (<code>/proc/cpuinfo</code>, readable with plain <code>cat</code>), and even some inter-process communication. The payoff is uniformity: the small set of tools built around "read/write a stream of bytes" — <code>cat</code>, redirection, pipes — work on all of these without needing device-specific software. Want a peek right now, no installation required? Open Terminal on your Mac and try <code>cat /proc/cpuinfo</code> — on a real Linux box (not on macOS, which doesn\'t expose <code>/proc</code> the same way) this prints live details about every CPU core, using nothing but the same <code>cat</code> command you\'ll use to read a text file in the very next lesson. Part 1\'s filesystem-hierarchy lesson goes deeper into which parts of the tree are "real" files versus this kind of live kernel window.'
    },
    {
      q: 'If I only ever use a managed cloud platform (Heroku-style, or fully serverless), do I still need this?',
      a: 'You need less of it day-to-day, but the leverage of understanding it doesn\'t disappear — it moves. Even fully managed platforms are Linux containers under a friendly abstraction, and the moment something behaves unexpectedly — a memory limit killing your process, a permissions error reading a mounted file, a cron-like scheduled job not firing when you expect — the error messages and mental model you need to debug it are exactly the Linux fundamentals this course covers. The honest framing: managed platforms remove the NEED to SSH in and fix things by hand day-to-day, but they don\'t remove the need to understand what\'s happening when the abstraction leaks, which it eventually always does.'
    }
  ],
  code: {
    title: 'Your very first commands — read them, you\'ll type them for real next lesson',
    intro: 'No installation needed for any of this — open the Terminal app already on your Mac (Applications → Utilities → Terminal, or press ⌘+Space and type "Terminal") and these all just work. The next lesson explains each one properly; today just skim the shape.',
    code: `$ whoami
tbaral

$ pwd
/Users/tbaral

$ echo "the same shell, everywhere on the Unix family tree"
the same shell, everywhere on the Unix family tree

$ uname -a
Darwin MacBook-Pro.local 23.5.0 Darwin Kernel Version 23.5.0 ...
# "Darwin" is macOS's kernel name — proof it's a BSD cousin, not literally Linux.
# On a real Linux server this same command prints "Linux", not "Darwin".`,
    notes: [
      '<code>uname -a</code> is the fastest way to prove to yourself, on any machine, exactly which kernel you\'re standing on — you\'ll use it constantly once you start SSHing into real boxes in Part 5.',
      'Nothing here required installing anything — that\'s deliberate. This course front-loads zero setup cost so you can start today.'
    ]
  },
  lab: {
    title: 'Label the map',
    prompt: 'No terminal commands needed yet — this lab checks the MAP from this lesson. In the editor, write one line per scenario (as a shell comment, starting with <code>#</code>), assigning the correct term: <code>kernel</code>, <code>distro</code>, <code>GNU</code>, or <code>POSIX</code>. Scenario 1 is done for you.',
    starter: `# Scenario 1: The single program that talks to hardware, schedules processes, and manages memory.
# ANSWER 1: kernel

# Scenario 2: Ubuntu, Fedora, and Arch are three different examples of this.
# ANSWER 2:

# Scenario 3: The project that supplied most of the core command-line tools (ls, cp, grep) bundled with a typical Linux distro.
# ANSWER 3:

# Scenario 4: The standard that explains why macOS and Linux share so many identical everyday commands despite different kernels.
# ANSWER 4:

# BONUS: Is macOS's kernel literally "Linux"? Answer yes or no.
# BONUS ANSWER:`,
    checks: [
      { re: 'ANSWER\\s*2\\s*:\\s*distro', flags: 'i', must: true, hint: 'Scenario 2: Ubuntu/Fedora/Arch are distributions ("distros") — same kernel, different packaging and defaults.', pass: 'Scenario 2: distro ✓' },
      { re: 'ANSWER\\s*3\\s*:\\s*GNU', flags: 'i', must: true, hint: 'Scenario 3: most core CLI tools come from the GNU project.', pass: 'Scenario 3: GNU ✓' },
      { re: 'ANSWER\\s*4\\s*:\\s*POSIX', flags: 'i', must: true, hint: 'Scenario 4: POSIX is the shared standard behind the command overlap between macOS and Linux.', pass: 'Scenario 4: POSIX ✓' },
      { re: 'BONUS\\s*ANSWER\\s*:\\s*no', flags: 'i', must: true, hint: 'Bonus: no — macOS\'s kernel (Darwin/XNU) descends from BSD, a Unix cousin, not Linux itself.', pass: 'Bonus: no, macOS is BSD-family, not Linux ✓' }
    ],
    run: 'nothing to execute this time — this lab is pure map-labeling. Your first real terminal commands happen in the very next lesson.',
    solution: `# Scenario 1: The single program that talks to hardware, schedules processes, and manages memory.
# ANSWER 1: kernel

# Scenario 2: Ubuntu, Fedora, and Arch are three different examples of this.
# ANSWER 2: distro

# Scenario 3: The project that supplied most of the core command-line tools (ls, cp, grep) bundled with a typical Linux distro.
# ANSWER 3: GNU

# Scenario 4: The standard that explains why macOS and Linux share so many identical everyday commands despite different kernels.
# ANSWER 4: POSIX

# BONUS: Is macOS's kernel literally "Linux"? Answer yes or no.
# BONUS ANSWER: no`,
    notes: [
      'If any of these took more than a second, replay the Marine-base animation — different bases (distros), one handbook (the kernel) they all answer to.',
      'The bonus is the single most common Linux-adjacent misconception to be able to correct cleanly in conversation or an interview.'
    ]
  },
  quiz: [
    {
      q: '"Linux," strictly speaking, refers to:',
      options: ['The kernel only', 'An entire operating system including a desktop', 'A specific company\'s product', 'A programming language'],
      correct: 0,
      explain: 'Linux is the kernel. A "distro" adds a package manager, core tools, and defaults around it to make a usable system.'
    },
    {
      q: 'Which pair is correctly matched (distro → package family)?',
      options: ['Fedora → .deb / apt', 'Ubuntu → .rpm / dnf', 'RHEL/Fedora → .rpm / dnf', 'Arch → .deb / apt'],
      correct: 2,
      explain: 'Red Hat family (RHEL, Fedora, CentOS Stream, Rocky, Alma) uses .rpm packages and dnf (formerly yum). Debian family (Debian, Ubuntu, Mint) uses .deb and apt. Arch uses pacman.'
    },
    {
      q: 'The core Unix philosophy behind pipes and grep is best summarized as:',
      options: ['One giant program should handle every task internally', 'Small programs, each doing one thing well, composed via plain text streams', 'Every tool should have a graphical interface', 'Configuration should always live in a database, never a text file'],
      correct: 1,
      explain: 'Small, single-purpose tools that read and write plain text can be chained with pipes into pipelines nobody explicitly designed — the foundation for grep, sed, awk, and every bash script in Part 4.'
    },
    {
      q: 'Why do Docker containers not run "natively" on macOS or Windows the way they do on a Linux server?',
      options: ['Docker doesn\'t support Mac or Windows at all', 'Containers rely on Linux-specific kernel features (namespaces, cgroups), so Mac/Windows Docker quietly runs a Linux VM underneath', 'Mac and Windows containers are actually faster, so nobody minds', 'Docker converts containers into native Mac/Windows applications automatically'],
      correct: 1,
      explain: 'A container is Linux-kernel isolation, not a portable virtual machine format. Docker Desktop on Mac/Windows runs a small Linux VM behind the scenes to provide that kernel — full explanation in Part 7 and the next course.'
    },
    {
      q: 'For most of this course (through Part 4), practicing on a Mac\'s built-in Terminal is:',
      options: ['Useless — you must have a Linux machine from day one', 'Fine — macOS is Unix-family and most commands behave identically, with real Linux/SSH work starting in Part 5', 'Only useful for looking at file icons, not real commands', 'Exactly identical to Linux in every single detail with zero exceptions'],
      correct: 1,
      explain: 'macOS Terminal is a real Unix shell; almost everything through Part 4 works unmodified. A few GNU-vs-BSD tool flag differences get flagged as pitfalls when they come up. Part 5 introduces a real remote Linux box over SSH.'
    }
  ],
  testFlow: {
    title: 'Test yourself: kernel, distro, or neither?',
    start: 'q1',
    nodes: {
      q1: {
        q: 'Your friend says "I installed Linux on my laptop, specifically Ubuntu." What relationship does that sentence describe?',
        choices: [
          { text: 'Ubuntu is a distro built around the Linux kernel', to: 'end_q1_right' },
          { text: 'Ubuntu and Linux are two unrelated operating systems that happen to share files', to: 'end_q1_wrong' },
          { text: 'Linux is a program that runs inside Ubuntu, like an app', to: 'end_q1_wrong2' }
        ]
      },
      end_q1_right: { end: true, correct: true, text: 'Exactly — Ubuntu is a distribution: the Linux kernel plus a package manager, tools, and defaults. Saying "I installed Linux, specifically Ubuntu" is precise, not redundant.', next: 'q2' },
      end_q1_wrong: { end: true, correct: false, text: 'Not quite — they\'re not unrelated. Ubuntu IS built directly around the Linux kernel; it packages it with tools and a package manager.', retry: 'q1' },
      end_q1_wrong2: { end: true, correct: false, text: 'Backwards — the kernel is the foundation Ubuntu is built ON, not something running inside it as an app.', retry: 'q1' },
      q2: {
        q: 'A coworker says "our CI pipeline runs on Linux, but our containers should work identically on any OS since Docker is cross-platform." What\'s the precise correction?',
        choices: [
          { text: 'Docker itself works on multiple host OSes, but the containers it runs are Linux processes — Mac/Windows hosts run a hidden Linux VM to provide that', to: 'end_q2_right' },
          { text: 'No correction needed — that statement is exactly right', to: 'end_q2_wrong' }
        ]
      },
      end_q2_right: { end: true, correct: true, text: 'Right. "Cross-platform" describes where you can run the Docker tooling from, not what a container fundamentally is underneath — it\'s Linux kernel isolation either way.' },
      end_q2_wrong: { end: true, correct: false, text: 'That statement glosses over something important: containers rely on Linux-specific kernel features. Mac/Windows Docker isn\'t running containers "natively" — it\'s running a Linux VM behind the scenes.', retry: 'q2' }
    }
  },
  pitfalls: [
    'Assuming "Linux" and "a specific distro" are interchangeable in conversation — in an interview, being able to say "the kernel" vs "the distribution" precisely reads as real fluency, not memorized trivia.',
    'Assuming macOS Terminal commands will be 100% identical to a Linux server\'s — most are, but GNU vs BSD tool-flag differences (ls, sed, date, and a few others) are real and worth knowing exist before they surprise you.',
    'Treating "learn Docker" as something you can skip Linux fundamentals to get to faster — the next course assumes exactly what this one teaches, and skipping it just means learning it later, mid-debugging-session, under worse conditions.'
  ],
  interview: [
    {
      q: 'What\'s the difference between the Linux kernel and a Linux distribution?',
      a: 'The kernel is a single program: it schedules processes, manages memory, and mediates access to hardware. A distribution takes that kernel and adds everything needed to make it a usable system — a package manager, core command-line tools (largely from the GNU project), an init system, and a set of conventions/defaults. Ubuntu, Fedora, and Arch are three different distributions built around the identical Linux kernel; the differences between them are mostly at the packaging and tooling layer, not in fundamentals like the filesystem model, permissions, or process model.'
    },
    {
      q: 'Why do virtually all cloud servers and CI/CD runners use Linux instead of Windows or macOS?',
      a: 'A combination of concrete, practical reasons: no per-instance licensing cost at cloud scale (macOS licensing also legally restricts running it on non-Apple hardware, ruling it out for generic cloud infrastructure entirely), proven stability running headless for extended periods, first-class support from every major cloud provider, and — increasingly the decisive one — Docker containers are fundamentally Linux processes using Linux-specific kernel isolation (namespaces and cgroups). There\'s no equivalent "native Windows container" or "native Mac container" running the same way; both platforms run a hidden Linux VM to support Docker at all.'
    },
    {
      q: 'Is macOS "a type of Linux"? What\'s actually true?',
      a: 'No. macOS\'s kernel (XNU, via the Darwin OS) descends from BSD Unix — a separate lineage from Linux, though both are Unix-family and both largely follow POSIX, which is why so many day-to-day commands (ls, grep, ssh, the shell itself) feel identical. The practical consequence: macOS is a genuinely good place to practice most shell and scripting fundamentals, but it is not literally Linux, and a few tools (notably BSD vs GNU versions of ls, sed, date) have different flags between the two.'
    },
    {
      q: 'What is the "Unix philosophy," and where do you actually see it in daily tooling?',
      a: 'The core idea: build small programs that each do one job well, that communicate via plain text streams, and let users compose them rather than building one monolithic tool that tries to do everything. You see it directly in the pipe operator (|) chaining single-purpose tools like grep, sort, uniq, and wc into pipelines nobody explicitly designed in advance, and in the design of tools like sed and awk, which do exactly one category of text transformation and nothing else. It\'s also a real engineering trade-off worth being able to discuss: composability and scriptability versus the discoverability and hand-holding of an integrated GUI tool — Unix explicitly bet on the former.'
    }
  ]
};
