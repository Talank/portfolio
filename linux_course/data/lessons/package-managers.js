window.LESSONS = window.LESSONS || {};
window.LESSONS['package-managers'] = {
  id: 'package-managers',
  title: 'Package Managers: apt/dnf/brew, Installing, Updating & Why Containers Go Minimal',
  category: 'Part 6 — Packages & Archives',
  timeMin: 35,
  summary: 'Every real Linux system needs software installed on it beyond what came pre-loaded — a package manager is how that happens safely and repeatably, instead of downloading random binaries off the internet and hoping for the best. This lesson covers apt (the tool on Debian/Ubuntu, most common on servers you will SSH into), how it compares to dnf and brew (your own Mac\'s package manager), and why production container images deliberately install as little as possible.',
  goals: [
    'Explain what a package manager does: dependency resolution, trusted sources, and clean removal',
    'Use apt to install, search for, and remove a package on Debian/Ubuntu',
    'Explain the difference between "apt update" and "apt upgrade" — a genuinely common point of confusion',
    'Explain, at a conceptual level, how apt, dnf, and brew relate to each other despite different syntax',
    'Explain why production and container images deliberately minimize installed packages'
  ],
  concept: [
    {
      h: 'What a package manager actually does',
      p: [
        'A <b>package manager</b> installs, updates, and removes software from a trusted, centrally-maintained REPOSITORY, handling three things that manually downloading and compiling software leaves entirely up to you: <b>dependency resolution</b> (a package needing three other libraries gets those three pulled in and installed automatically, at compatible versions, without you having to chase each one down by hand), <b>trust and integrity</b> (packages in an official repository are checksummed and typically signed, so what actually gets installed is verifiably what the maintainer published, not something tampered with in transit), and <b>clean removal</b> (the package manager tracks exactly what files a package put where, so uninstalling it actually removes what it added, rather than leaving orphaned files scattered around indefinitely).',
        'Contrast this with downloading a random binary off some website, or running a "curl | bash" install script found online: no dependency tracking, no verified authorship, and no clean, tracked way to fully remove it later — occasionally unavoidable for genuinely obscure software, but a real, understood tradeoff each time, not a habit to reach for by default.'
      ]
    },
    {
      h: 'apt: install, update, and upgrade on Debian/Ubuntu',
      p: [
        '<code>apt</code> is the package manager on Debian and Ubuntu-family systems, far and away the most common family you will encounter SSHing into a Linux server. <code>sudo apt install nginx</code> installs a package (and anything it depends on); <code>sudo apt remove nginx</code> uninstalls it while leaving its configuration files in place (useful if you might reinstall it later with the same settings); <code>sudo apt purge nginx</code> removes the package AND its configuration files entirely; <code>apt search keyword</code> looks for available packages matching a keyword.',
        'The genuinely common point of confusion: <code>sudo apt update</code> does NOT install anything — it refreshes apt\'s local INDEX of what packages and versions are currently available in the configured repositories, essentially "check what is new" without acting on it. <code>sudo apt upgrade</code> is the separate step that actually installs newer versions of packages ALREADY installed on the system, based on whatever that (possibly stale) local index currently says is available. Running upgrade without having run update first can miss genuinely available newer versions, since it is working from outdated information — which is exactly why <code>sudo apt update && sudo apt upgrade</code> is the standard, combined habit, not two unrelated commands people happen to run separately.'
      ]
    },
    {
      h: 'Different systems, same underlying idea: dnf, yum, and brew',
      p: [
        'Fedora, RHEL, CentOS, and their relatives use <code>dnf</code> (or the older <code>yum</code>, which dnf largely replaced) — conceptually identical to apt, with different command syntax: <code>sudo dnf install nginx</code>, <code>sudo dnf update</code> (which, notably, combines apt\'s separate update+upgrade into roughly one step, a genuine syntax difference worth knowing rather than assuming behaves identically to apt). Which family a given server uses depends entirely on which distribution it runs — checking <code>cat /etc/os-release</code> is the fast way to confirm which package manager applies before typing a command that assumes the wrong one.',
        'On your own Mac, <code>brew</code> (Homebrew) fills the exact same conceptual role for macOS, which does not ship a built-in package manager the way Linux distributions do: <code>brew install</code>, <code>brew update</code> (refresh Homebrew\'s own package index — analogous to apt update), <code>brew upgrade</code> (actually upgrade installed packages — analogous to apt upgrade, and notably NOT combined into one step, matching apt\'s two-step pattern rather than dnf\'s one-step pattern). The commands differ across all three, but the underlying problem — trusted repository, dependency resolution, clean install/removal — is genuinely the same idea, which is why once one is understood, the others are mostly a matter of learning new syntax for a familiar concept.'
      ]
    },
    {
      h: 'Why production and container images deliberately install as little as possible',
      p: [
        'Every installed package is, simultaneously, potential functionality AND potential <b>attack surface</b> — a vulnerability discovered in some tool you never actually use, but happen to have installed anyway, is still a real, exploitable weakness on that system. Production servers and especially container images (the next course\'s entire subject) deliberately minimize what gets installed for exactly this reason: fewer packages means fewer things that can have a vulnerability, fewer things needing security patches tracked and applied, and a smaller, faster, more predictable image to build and deploy.',
        'This is exactly why a production container image commonly starts from a minimal base (sometimes even one with no shell or package manager present AT ALL, once a build is finished) rather than a full desktop-style Linux install — every convenience tool NOT installed is one less thing that could ever be the entry point for something going wrong, a genuine, deliberate tradeoff between "convenient to poke around in" and "minimal attack surface," and production environments consistently lean toward the latter.'
      ]
    }
  ],
  conceptFlow: {
    title: 'apt install nginx — dependency resolution, step by step',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The request',
        nodes: [
          { id: 'request', text: 'sudo apt install nginx' }
        ]
      },
      {
        label: 'Check dependencies',
        nodes: [
          { id: 'checkdeps', text: 'nginx requires:\nlibpcre3, zlib1g, openssl-related libs' }
        ]
      },
      {
        label: 'Check what is already installed',
        nodes: [
          { id: 'checkinstalled', text: 'zlib1g already present\nlibpcre3 and openssl libs missing' }
        ]
      },
      {
        label: 'Resolve and install',
        nodes: [
          { id: 'installmissing', text: 'Install ONLY the missing pieces:\nlibpcre3, openssl libs' },
          { id: 'installtarget', text: 'Then install nginx itself' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'done', text: 'nginx works correctly —\nevery dependency satisfied, nothing redundant reinstalled' }
        ]
      }
    ],
    steps: [
      { active: ['request'], note: 'A single install request for one specific package — nginx does not run in isolation, it needs several supporting libraries to function correctly.' },
      { active: ['checkdeps'], note: 'apt consults nginx\'s declared dependencies — the specific set of other packages it genuinely requires to run.' },
      { active: ['checkinstalled'], note: 'apt then checks what is ALREADY present on this specific system — no point reinstalling something already satisfied.' },
      { active: ['installmissing'], note: 'Only the genuinely missing dependencies get installed — zlib1g is skipped entirely since it is already there.' },
      { active: ['installtarget'], note: 'With every dependency now satisfied, nginx itself is installed last.' },
      { active: ['done'], note: 'The end result: nginx works correctly with everything it needs present, without the user having ever needing to manually track down or verify a single one of those dependencies themselves.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Galley-La\'s Parts Catalog, and the Difference Between "New Catalog" and "New Parts"',
      text: 'Franky\'s ship-outfitting work at Water 7 runs through Galley-La\'s master parts catalog rather than scavenging scrap from unknown sources, and there is a genuinely good reason for that discipline beyond simple convenience. Every part in the catalog is VERIFIED — checked, stamped, traceable to a known, trusted supplier — meaning Franky can install something without personally re-verifying its integrity from scratch every single time; a part from an unknown scrap dealer, by contrast, could be anything, sabotaged or simply unsafe, with no real way to confirm its quality before it is already bolted onto the ship. And crucially, ordering one complex component — a new navigation system, say — does not require Franky personally chasing down every sub-part it depends on; the catalog system automatically pulls in exactly the supporting components that specific system needs, nothing more, nothing he has to manually track down himself one at a time. There is one distinction new dockworkers reliably get backwards: "check the catalog for what is newly available this week" is an entirely different action from "actually replace what is currently installed on the Sunny with newer versions" — the first just refreshes what the catalog SAYS is available, changing nothing on the ship itself; the second is the separate step that actually swaps out installed parts for newer ones, and it can only work correctly against an UP-TO-DATE catalog. A dockworker who upgrades parts using a catalog they forgot to refresh first ends up "upgrading" to versions that were already out of date the moment they were installed — technically following the right procedure, working from the wrong information. And Franky is characteristically firm about one more thing when outfitting a ship meant for serious, dangerous voyages rather than casual dockside repairs: install only what the voyage genuinely needs, nothing extra "just in case" — every unnecessary part bolted onto a real combat vessel is one more thing that could fail, break, or be exploited by an enemy who finds a weakness in it, and a leaner, more deliberately outfitted ship is a more defensible one.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Kitchen Supplier, and Chandler Confusing Two Very Different Steps',
      text: 'Monica sources her professional kitchen equipment through one trusted, established supplier rather than grabbing whatever shows up cheapest at a random discount outlet, and her reasoning is entirely practical: equipment from her regular supplier is verified, warrantied, and traceable if anything ever goes wrong — a mystery appliance from an unknown source could be anything, and there is no real way to confirm it is actually safe and reliable before it is already installed in a working professional kitchen. When she orders one piece of complex equipment — a new industrial mixer, say — she does not have to separately track down and order every individual attachment and part it requires; the supplier\'s system automatically includes exactly what that specific mixer needs to function, without her manually chasing down each supporting piece herself. The genuinely common mix-up, which Chandler falls into almost immediately the one time he tries to help manage kitchen orders: "check the supplier\'s catalog for what is newly available this month" is a completely different action from "actually replace the currently-installed equipment with newer versions" — the first just refreshes what the CATALOG says exists, changing nothing in Monica\'s actual kitchen; the second is the separate, deliberate step of swapping in upgraded equipment, and it only works correctly if it is done against a freshly-refreshed catalog. Chandler, having skipped the refresh step entirely, "upgrades" a piece of equipment straight to a version that was already outdated by the time it arrived — technically following the right two-step process in his head, just executing it against stale information. And Monica, running a lean, serious professional kitchen rather than a hobbyist\'s cluttered one, keeps a deliberately minimal set of equipment on hand — every extra gadget sitting around unused is one more thing that can break, one more thing to maintain, and one more thing cluttering a space that needs to run efficiently under real pressure.'
    },
    why: 'Franky\'s catalog and Monica\'s supplier are the trusted repository — verified sources instead of gambling on unknown scrap. Automatically pulling in a component\'s required sub-parts is dependency resolution. And the mix-up both dockworkers and Chandler fall into — confusing "refresh what is available" with "actually install newer versions" — is exactly apt update vs apt upgrade. Franky\'s and Monica\'s shared instinct to keep only what is genuinely needed, nothing extra "just in case," is exactly why production and container images deliberately stay minimal.'
  },
  tech: [
    {
      q: 'Concretely, what goes wrong if someone runs "apt upgrade" without ever running "apt update" first?',
      a: '"apt upgrade" installs newer versions of currently-installed packages based on apt\'s LOCAL index of what versions are available — and that local index is only ever as current as the last time "apt update" refreshed it. If that index is stale (days or weeks old, say), "apt upgrade" will faithfully install whatever it believes are the latest versions, but those may already be outdated relative to what the actual repository currently offers — the command succeeds, packages genuinely get upgraded, but not necessarily to the truly latest available versions, which can be a quietly incomplete "upgrade" that looks successful while still leaving the system behind on updates that were already available.'
    },
    {
      q: 'Why is installing software via a package manager\'s repository generally considered safer than running a random "curl https://example.com/install.sh | bash" found online?',
      a: 'A package in an official repository has gone through some level of maintainer review, is typically checksummed and often cryptographically signed (so the package manager can verify what actually gets installed matches what was published, unaltered), and is tracked by the package manager\'s own database (enabling clean removal and dependency accounting later). A "curl | bash" install script, by contrast, executes arbitrary code immediately, with no verification of its integrity, no tracking of what it actually did to the system, and — notably — no reliable way to cleanly remove everything it changed afterward, since the package manager has no record of any of it. This is not to say curl-pipe-bash installs are always wrong (sometimes genuinely the only practical option for obscure or brand-new software), but it is a real, understood tradeoff each time, not a default habit to reach for casually.'
    },
    {
      q: 'Beyond attack surface, what other concrete reasons justify a minimal package footprint on a production server or container image?',
      a: 'Image/system SIZE — fewer installed packages means a smaller image to build, push, pull, and store, which matters at scale across many deployments and directly affects deploy speed. PATCHING BURDEN — every installed package is something that needs security updates tracked and applied over the system\'s lifetime; fewer packages means fewer things to keep current and audit. PREDICTABILITY — a minimal, deliberately-specified set of installed software is far easier to reason about and reproduce exactly across different environments (a teammate\'s machine, a CI runner, production itself) than an environment that has accumulated whatever happened to get installed over time — directly foreshadowing why Dockerfiles in the next course are typically written to install only an explicit, minimal, intentional list of packages rather than a broad, convenient default set.'
    }
  ],
  code: {
    title: 'apt in practice',
    intro: 'These commands need sudo and modify the system — try them on a disposable VM or container if you want to experiment freely.',
    code: `$ cat /etc/os-release | grep -i ^NAME
NAME="Ubuntu"
# Confirms this system uses apt, not dnf.

$ sudo apt update
Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Reading package lists... Done
# Refreshes the LOCAL INDEX of available packages. Installs nothing yet.

$ apt list --upgradable
curl/jammy 7.81.0-1ubuntu1.15 amd64 [upgradable from: 7.81.0-1ubuntu1.14]
# Now the index knows curl has a newer version available.

$ sudo apt upgrade
# NOW actually installs the newer curl (and anything else upgradable).

$ apt search nginx
nginx/jammy 1.18.0-6ubuntu14 amd64
  small, powerful, scalable web/proxy server

$ sudo apt install nginx
Reading package lists... Done
The following additional packages will be installed:
  libnginx-mod-http-image-filter nginx-common ...
# Dependencies pulled in automatically alongside the package you actually asked for.

$ dpkg -l | grep nginx
ii  nginx          1.18.0-6ubuntu14  amd64  small, powerful web server

$ sudo apt remove nginx
# Removes nginx, LEAVES its config files in place.

$ sudo apt purge nginx
# Removes nginx AND its config files entirely.

# On macOS, the equivalent everyday commands:
$ brew update      # refresh Homebrew's own package index
$ brew upgrade      # actually upgrade installed packages
$ brew install wget`,
    notes: [
      '"apt list --upgradable" (after an update) is a genuinely useful way to see WHAT would be upgraded before actually committing to "apt upgrade."',
      'dpkg -l lists all installed packages directly — "dpkg -l | grep name" is a fast way to confirm whether something is already installed, and at exactly which version.'
    ]
  },
  lab: {
    title: 'Write the right package-manager commands',
    prompt: 'Write exactly one command per task, assuming a Debian/Ubuntu system (apt).',
    starter: `# Task: refresh apt's package index (do NOT install/upgrade anything yet)


# Task: actually install any available newer versions of currently-installed packages


# Task: install the package "htop"


# Task: completely remove "htop", including its configuration files

`,
    checks: [
      { re: 'sudo\\s+apt\\s+update(?!\\s*&&)', flags: 'i', must: true, hint: 'sudo apt update refreshes the index only.', pass: 'sudo apt update ✓' },
      { re: 'sudo\\s+apt\\s+upgrade', flags: 'i', must: true, hint: 'sudo apt upgrade actually installs newer versions.', pass: 'sudo apt upgrade ✓' },
      { re: 'sudo\\s+apt\\s+install\\s+htop', flags: 'i', must: true, hint: 'sudo apt install htop', pass: 'sudo apt install htop ✓' },
      { re: 'sudo\\s+apt\\s+purge\\s+htop', flags: 'i', must: true, hint: 'sudo apt purge htop removes it AND its config files.', pass: 'sudo apt purge htop ✓' }
    ],
    run: 'Try it for real on a disposable VM or container: apt update, then apt list --upgradable to see what would change before running apt upgrade.',
    solution: `# Task: refresh apt's package index (do NOT install/upgrade anything yet)
sudo apt update

# Task: actually install any available newer versions of currently-installed packages
sudo apt upgrade

# Task: install the package "htop"
sudo apt install htop

# Task: completely remove "htop", including its configuration files
sudo apt purge htop`,
    notes: [
      'In real daily use, "sudo apt update && sudo apt upgrade" is typically run together as one habitual combined command, exactly because upgrade only works correctly against a freshly-refreshed index.',
      '"apt remove" (not purge) would be the right answer if the task had said "keep the configuration for a possible future reinstall" instead of "completely remove."'
    ]
  },
  quiz: [
    {
      q: 'What does "sudo apt update" actually do?',
      options: ['It installs the newest versions of all installed packages', 'It refreshes apt\'s local index of what packages/versions are currently available — it does not install anything', 'It deletes packages that are no longer needed', 'It is identical to "sudo apt upgrade"'],
      correct: 1,
      explain: '"apt update" only refreshes the local package index — it installs nothing. "apt upgrade" is the separate step that actually installs newer versions.'
    },
    {
      q: 'What is the key difference between "apt remove" and "apt purge"?',
      options: ['They are identical commands', 'remove uninstalls the package but leaves its config files; purge removes the package AND its config files', 'purge only works on packages installed via dpkg directly', 'remove requires sudo; purge does not'],
      correct: 1,
      explain: '"apt remove" leaves configuration files in place (useful if reinstalling later); "apt purge" removes the package and its configuration entirely.'
    },
    {
      q: 'Why does a package manager\'s dependency resolution matter, beyond just convenience?',
      options: ['It has no real benefit over manual installation', 'It automatically installs the correct, compatible versions of everything a package needs, without the user having to track each one down individually', 'It only matters for very large software projects', 'Dependency resolution is unique to brew and does not apply to apt or dnf'],
      correct: 1,
      explain: 'Dependency resolution automatically identifies and installs everything a package genuinely requires at compatible versions — manually chasing down and correctly versioning each dependency by hand is error-prone and slow by comparison.'
    },
    {
      q: 'Why do production container images typically install as few packages as possible?',
      options: ['Package managers do not work inside containers at all', 'Fewer installed packages means less attack surface, smaller image size, and less ongoing patching burden', 'Containers have a hard technical limit on how many packages can be installed', 'It has no real benefit; it is purely a stylistic convention'],
      correct: 1,
      explain: 'Every installed package is potential attack surface and something that needs security patches tracked — minimizing what is installed reduces risk, image size, and long-term maintenance burden.'
    },
    {
      q: 'What is a genuine, understood risk of installing software via "curl https://example.com/install.sh | bash" instead of a package manager?',
      options: ['It is always slower than using apt', 'The script runs with no integrity verification and is not tracked, making clean removal and trust verification difficult compared to a signed, tracked package', 'curl cannot download install scripts, only static files', 'It only works on macOS, never Linux'],
      correct: 1,
      explain: 'Unlike a package manager, curl-pipe-bash provides no signature/checksum verification and no tracked record of what was installed — making trust and clean removal genuinely harder.'
    }
  ],
  pitfalls: [
    'Running "apt upgrade" without having run "apt update" recently, silently upgrading against a stale index that may not reflect the actually-latest available versions.',
    'Reaching for "apt remove" when the intent was a truly clean uninstall — leftover configuration files can cause confusing behavior on a later reinstall of the same package.',
    'Casually installing convenience tools on a production server or container image "just in case," without weighing the real (if often small) increase in attack surface and patch-tracking burden each one represents.'
  ],
  interview: [
    {
      q: 'Explain what a package manager actually solves, beyond just "a way to install software."',
      a: 'A package manager solves three genuinely separate problems at once: dependency resolution (a piece of software needing other libraries at compatible versions gets those installed automatically, without manual tracking), trust and integrity (packages come from a maintained repository, typically checksummed and signed, so what actually installs is verifiably what was published), and lifecycle management (installs are tracked, so upgrading or cleanly removing software later actually works correctly, rather than leaving orphaned files or unclear version state behind). Manually downloading and compiling software leaves all three of these entirely up to the person doing it, which does not scale and introduces real risk the more software a system accumulates over time.'
    },
    {
      q: 'Why is "apt update && apt upgrade" run together as a combined habit, rather than upgrade alone being sufficient on its own?',
      a: '"apt upgrade" only ever acts on apt\'s LOCAL index of available package versions — it has no independent way of knowing what is actually currently available in the repository beyond what that local index says. If that index is stale, "apt upgrade" will faithfully upgrade packages to whatever it believes is current, which may already be behind the real latest versions. "apt update" is what actually refreshes that local index from the real repository first. Running them together ensures upgrade is always working from current information — treating them as two unrelated, independently-optional commands is exactly the mistake that leads to a system that "upgrades" successfully while still silently lagging behind on genuinely available updates.'
    },
    {
      q: 'Why does macOS need a third-party tool like Homebrew, when Linux distributions ship a package manager built in?',
      a: 'Linux distributions are built and maintained as complete, cohesive operating system releases where the distribution maintainers themselves curate an official package repository as a core, integral part of the OS itself. macOS is built and shipped by Apple with a different philosophy — it does not ship an equivalent open, general-purpose package repository as a first-class OS feature, and Apple\'s own software distribution is handled separately (the App Store, individual installers). Homebrew emerged specifically to fill that gap for command-line and developer tools on macOS, functioning conceptually like apt or dnf (a repository, dependency resolution, tracked installs) but built and maintained by a separate community project rather than by Apple itself.'
    },
    {
      q: 'A colleague argues "just install everything we might possibly need on the production image, storage is cheap." What would you push back on, specifically?',
      a: 'Storage cost is genuinely the smallest of the real concerns here. The larger issues: every additional installed package is additional ATTACK SURFACE — a vulnerability in a tool nobody on the team actively uses is still a real, exploitable weakness if it happens to be present on the system. It also means additional PATCHING BURDEN indefinitely into the future — every installed package needs its security updates tracked and applied over the system\'s entire lifetime, work that scales with how much is installed, not how much is actually used. And a large, loosely-scoped set of installed software makes the environment harder to reason about and reproduce exactly and consistently across different machines and deployments. "Storage is cheap" addresses only the smallest, most easily dismissed cost of over-installing — the real costs are security surface, ongoing maintenance, and predictability, none of which get cheaper just because disk space does.'
    }
  ]
};
