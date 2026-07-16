window.LESSONS = window.LESSONS || {};
window.LESSONS['ssh-fundamentals'] = {
  id: 'ssh-fundamentals',
  title: 'SSH: Keys, Agents, ~/.ssh/config, and How the Handshake Actually Works',
  category: 'Part 5 — Networking & SSH',
  timeMin: 50,
  summary: 'This is the lesson the whole course has been building toward — everything about the filesystem, permissions, processes, and networking was groundwork for genuinely understanding what happens the moment you type "ssh myserver." This covers SSH key pairs (and why they beat passwords), getting a key authorized on a remote server, ~/.ssh/config for shortcuts, and ssh-agent — the pieces that turn "typing a password every time" into a fast, secure, low-friction daily habit.',
  goals: [
    'Explain what SSH is and why key-based authentication is more secure than password authentication',
    'Generate an SSH key pair with ssh-keygen and explain the difference between the public and private key',
    'Authorize a public key on a remote server so it can be used to log in',
    'Write a ~/.ssh/config entry to turn a long ssh command into a short alias',
    'Explain what ssh-agent does and why it matters for a passphrase-protected key'
  ],
  concept: [
    {
      h: 'What SSH actually is, and why it replaced its plaintext predecessors',
      p: [
        'SSH (Secure SHell) is an encrypted protocol for logging into a remote machine, running commands on it, and transferring files to and from it — genuinely the single most common way anyone interacts with a Linux server they do not have physical access to. It replaced older tools like <b>telnet</b> and <b>rsh</b>, which did the same basic job but sent EVERYTHING — including the login password itself — as plain, unencrypted text over the network, meaning anyone able to observe the traffic (a shared network, a compromised router along the path) could simply read the password directly. SSH encrypts the entire session, password and all subsequent commands included, specifically closing that hole.',
        '<code>ssh user@hostname</code> is the basic form — connect to <code>hostname</code>, log in as <code>user</code>. Without a username specified, SSH defaults to trying your CURRENT local username on the remote machine, which is often wrong when connecting to a server where your account has a different name.'
      ]
    },
    {
      h: 'Public/private key pairs: proving who you are without ever sending a secret',
      p: [
        'An SSH <b>key pair</b> consists of two mathematically related files: a <b>private key</b> (kept secret, never shared, never leaves your machine) and a <b>public key</b> (safe to share freely, even publish — it grants no access on its own). The relationship between them allows something genuinely clever: the private key can SIGN something in a way that only the matching public key can VERIFY, without the private key itself ever being transmitted anywhere, at any point, during that verification.',
        '<code>ssh-keygen -t ed25519</code> generates a new key pair (ed25519 being a modern, strong, widely-recommended key type — RSA is the older, still-common alternative, generated with <code>ssh-keygen -t rsa -b 4096</code>). This produces two files: <code>id_ed25519</code> (the private key — this is the one from the earlier permissions lesson that MUST be locked down to <code>chmod 600</code>, or ssh will flatly refuse to use it) and <code>id_ed25519.pub</code> (the public key, safe to copy anywhere). Setting a PASSPHRASE on the private key during generation adds a second layer of defense: even if the private key FILE itself were somehow stolen, it remains useless without also knowing the passphrase that decrypts it.'
      ]
    },
    {
      h: 'Getting a public key authorized on a server',
      p: [
        'A remote server only allows key-based login from public keys it has been explicitly told to trust — those live in <code>~/.ssh/authorized_keys</code> on the SERVER, one public key per line, under the account you are logging in as. <code>ssh-copy-id user@hostname</code> automates the whole process: it copies your public key over (typically still using password auth, one last time) and appends it to that file correctly — after which, the corresponding PRIVATE key on your local machine is what future logins will use instead of a password at all.',
        'This is worth being precise about: "passwordless login" does not mean "no authentication happening" — it means authentication now happens via cryptographic proof of possessing the private key, which is a fundamentally different (and generally stronger) mechanism than a password, not the absence of one.'
      ]
    },
    {
      h: '~/.ssh/config for shortcuts, and ssh-agent for not re-typing a passphrase constantly',
      p: [
        '<code>~/.ssh/config</code> lets you define a short alias for a connection you use often, instead of remembering and typing a full hostname, username, and any non-default port every time: <code>Host myserver</code> followed by indented <code>HostName</code>, <code>User</code>, <code>Port</code>, and <code>IdentityFile</code> (which private key to use) lines turns a command like <code>ssh -i ~/.ssh/work_key -p 2222 nami@203.0.113.42</code> into simply <code>ssh myserver</code>. Multiple <code>Host</code> blocks can each define their own separate server, each with its own settings.',
        '<b>ssh-agent</b> solves a genuine annoyance: a passphrase-protected private key would otherwise need that passphrase re-entered on EVERY single connection, all session long. ssh-agent runs in the background, holds a DECRYPTED copy of your private key in memory (never written back to disk decrypted) after you unlock it once with <code>ssh-add</code>, and hands it to ssh automatically on subsequent connections for as long as the agent keeps running — the passphrase is asked for once per agent session, not once per connection, while the key still sits safely encrypted on disk the rest of the time.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Public-key authentication: proving identity without sending the secret',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Connection attempt',
        nodes: [
          { id: 'connect', text: 'ssh nami@server\nclient connects' }
        ]
      },
      {
        label: 'The server\'s check',
        nodes: [
          { id: 'checkauthorized', text: 'Server checks:\nis this public key in ~/.ssh/authorized_keys?' }
        ]
      },
      {
        label: 'The challenge',
        nodes: [
          { id: 'challenge', text: 'Server sends a random challenge\n(some data unique to this attempt)' }
        ]
      },
      {
        label: 'The proof',
        nodes: [
          { id: 'sign', text: 'Client SIGNS the challenge\nusing the PRIVATE key — locally, never transmitted' }
        ]
      },
      {
        label: 'Verification',
        nodes: [
          { id: 'verify', text: 'Server verifies the signature\nusing the PUBLIC key it already has on file' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'granted', text: 'Signature valid ->\naccess granted' }
        ]
      }
    ],
    steps: [
      { active: ['connect'], note: 'The client initiates a connection, claiming to be "nami."' },
      { active: ['checkauthorized'], note: 'The server checks whether the PUBLIC key the client is offering even appears in nami\'s authorized_keys file at all — if not, this stops right here.' },
      { active: ['challenge'], note: 'Assuming the public key is recognized, the server generates a fresh, random challenge — unique to this specific connection attempt, never reused.' },
      { active: ['sign'], note: 'The client uses its PRIVATE key to cryptographically sign that challenge — this happens entirely locally, on the client\'s own machine. The private key itself never travels over the network at any point in this exchange.' },
      { active: ['verify'], note: 'The server takes the signed response and verifies it using the PUBLIC key it already has on file — mathematically confirming the signature could only have been produced by the matching private key, without ever needing to see that private key directly.' },
      { active: ['granted'], note: 'If the signature checks out, the server has cryptographic proof the client genuinely holds the private key — access is granted, and at no point in this entire exchange was any secret actually transmitted over the network.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Marine Seal: Verified Without the Ring Ever Leaving Its Owner\'s Hand',
      text: 'High-ranking Marine officers authenticate their most sensitive orders with a specific, deliberately hard-to-replicate wax seal, pressed by a personal signet ring only they possess — and the verification system built around it is more clever than it first looks. Every base that needs to verify a given officer\'s orders keeps, on file, a known-good REFERENCE impression of that officer\'s seal — freely shared, openly kept in a reference book, no secrecy about the reference impression itself at all. When an order arrives freshly sealed, the receiving base does not need the officer\'s actual ring, ever, at any point — they simply compare the NEW impression against their on-file reference; if the fine, near-impossible-to-forge details match, that alone proves the order genuinely came from someone in possession of that exact physical ring, without the ring itself ever traveling anywhere near the verifying base. A courier delivering the order never even touches the ring — the seal, once pressed, IS the proof, and the ring stays locked away with its owner the entire time. Garp, briefing a new officer on why this system beats simply memorizing a spoken password, puts it plainly: a spoken password has to be SAID out loud to be checked, which means it can be overheard, repeated, and reused by anyone who caught it once. A sealed impression proves the ring was used, without the ring — or anything secret about it — ever being transmitted or spoken aloud in the first place. And separately, some officers keep their actual ring inside a personally-combination-locked case rather than loose in a pocket — an extra layer, so that even if the case itself were somehow stolen, the ring inside remains useless without also knowing the combination.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Catering Contracts, and the Signature the Venue Already Has on File',
      text: 'Monica\'s catering business, once it grows past a certain size, adopts a genuinely clever verification process for contracts, borrowed loosely from how her lawyer explained bank signature cards work. Every venue she regularly works with keeps, on file, a verified REFERENCE copy of her actual signature — nothing secret about that reference copy at all, it sits openly in their records for exactly this comparison purpose. When a new contract arrives with her signature on it, the venue does not need Monica\'s actual pen, her physical presence, or anything else secret from her — they simply compare the new signature\'s specific flourish against the reference already on file; if it genuinely matches in the ways that matter, that alone is accepted as proof Monica herself signed it, without her signing PEN or her physical hand ever needing to be anywhere near the venue\'s own records. Chandler, encountering this system for the first time and slightly missing the point, asks why Monica does not just tell venues a secret PASSWORD instead, to save the hassle of comparing signatures. Monica\'s answer is sharper than he expects: a spoken password has to be SAID to be checked, which means anyone who overhears it once can repeat it and pass as her from then on — but a signature comparison never requires the actual secret (her physical signing hand, her genuine pen-hand coordination) to be transmitted or exposed anywhere at all; the comparison alone is the whole proof. And, being appropriately careful, Monica also keeps her actual signing pen — the one with the specific nib that produces her exact flourish — locked in a drawer only she has the key to, an extra layer so that even someone who stole the pen itself still could not produce her real signature without also knowing exactly how she uses it.'
    },
    why: 'The Marine seal and Monica\'s signature are both public-key authentication: a freely-shared reference (the public key) lets anyone VERIFY a signature without ever needing the actual signing instrument (the private key) to travel anywhere. A password, by contrast, has to be transmitted or spoken to be checked at all — which is exactly the weakness key-based SSH auth avoids entirely. And the locked drawer / combination-locked ring case is a passphrase on the private key — a second layer of protection, in case the key ITSELF is ever stolen.'
  },
  tech: [
    {
      q: 'Why is SSH key-based authentication considered more secure than password authentication, beyond just "it is more modern"?',
      a: 'With password auth, the secret (the password) has to be transmitted (even if encrypted in transit by SSH itself) and checked against a stored value on the server — meaning it is vulnerable to being guessed via brute-force attempts, phished if a user is tricked into entering it somewhere illegitimate, or compromised if the server\'s stored password data is ever breached. With key-based auth, the actual secret (the private key) is NEVER transmitted at all, at any point, even in encrypted form — the server only ever needs and stores the PUBLIC key, which grants no access on its own even if fully exposed, and authentication instead relies on a cryptographic signature that mathematically proves possession of the private key without revealing it. Brute-forcing a modern key is also computationally infeasible in any practical timeframe, unlike a weak or reused password, which is exactly why key-based auth is the strongly recommended default for anything beyond casual, low-stakes use.'
    },
    {
      q: 'If the private key file is already meant to be secret (protected by file permissions, chmod 600), why does it ALSO need a passphrase?',
      a: 'File permissions (chmod 600) protect the key while it sits on a properly-configured, uncompromised filesystem — but they do nothing at all if the key FILE itself is copied off that machine somehow: a stolen laptop, a misconfigured backup that got exposed, a compromised account with read access despite the permissions. A passphrase adds a genuinely separate layer of defense: even with the raw key FILE in hand, an attacker still cannot use it without also knowing the passphrase that decrypts it. This is exactly the "defense in depth" principle — multiple independent layers of protection, so that one layer failing (the file getting copied) does not automatically mean total compromise, as long as the other layer (the passphrase) still holds.'
    },
    {
      q: 'What specific problem does ssh-agent solve, and why can it not just be "always ask for the passphrase, every time, and accept that as the cost of using a passphrase at all"?',
      a: 'Without ssh-agent, a passphrase-protected key would need that passphrase re-entered for literally every single new SSH connection — genuinely painful friction across a normal working session that might involve dozens of separate connections to different servers, or reconnecting repeatedly to the same one. ssh-agent solves this by holding a DECRYPTED copy of the private key in memory (specifically in the agent\'s own memory, never written back to disk in decrypted form) after the passphrase is entered once via ssh-add, then automatically supplying it to ssh for every subsequent connection during that same agent session — meaning the passphrase is required once per agent session (commonly once per login/reboot, or once per terminal session depending on setup), not once per individual connection, without ever weakening the key\'s actual protection at rest on disk.'
    }
  ],
  code: {
    title: 'Generating a key, authorizing it, and setting up shortcuts',
    intro: 'Try this against a real server you have access to (a cloud VM, a personal server) — never against a machine you do not own or have explicit permission to configure.',
    code: `$ ssh-keygen -t ed25519 -C "nami@laptop"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/nami/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
# Creates id_ed25519 (private) and id_ed25519.pub (public).

$ ls -l ~/.ssh/id_ed25519
-rw------- 1 nami crew 0 Jul 16 10:00 /home/nami/.ssh/id_ed25519
# 600 — owner read/write only. ssh refuses to use a key with looser permissions.

$ cat ~/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxx... nami@laptop
# Safe to share freely — grants no access on its own.

$ ssh-copy-id nami@203.0.113.42
# Copies the public key to the server's ~/.ssh/authorized_keys (one last password prompt).

$ ssh nami@203.0.113.42
# Now authenticates via the key — no password needed.

$ cat ~/.ssh/config
Host myserver
  HostName 203.0.113.42
  User nami
  Port 2222
  IdentityFile ~/.ssh/id_ed25519

$ ssh myserver
# Same connection as the long form above, via the alias.

$ eval "$(ssh-agent -s)"
Agent pid 12345
$ ssh-add ~/.ssh/id_ed25519
Enter passphrase for /home/nami/.ssh/id_ed25519:
Identity added: /home/nami/.ssh/id_ed25519

$ ssh myserver
# No passphrase prompt this time — ssh-agent supplied it automatically.`,
    notes: [
      'ssh-copy-id itself still uses a password over the (already encrypted) SSH connection for this one-time setup step — after that, key-based auth takes over for all future logins.',
      '"ssh -v myserver" (verbose mode) is genuinely useful the first time a key-based connection is not working — it shows exactly which keys were offered and why the server accepted or rejected each one.'
    ]
  },
  lab: {
    title: 'Write the SSH commands and config for a real setup',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: generate a new ed25519 SSH key pair, adding a comment "deploy-key"


# Task: copy your public key to a server at 198.51.100.7, logging in as user "deploy"


# Write a ~/.ssh/config block for a host aliased "prod", pointing at 198.51.100.7,
# user "deploy", port 2200, using the key ~/.ssh/id_ed25519


# Task: start ssh-agent and add ~/.ssh/id_ed25519 to it

`,
    checks: [
      { re: 'ssh-keygen\\s+-t\\s+ed25519\\s+-C\\s+.?deploy-key.?', flags: 'i', must: true, hint: 'ssh-keygen -t ed25519 -C "deploy-key"', pass: 'ssh-keygen -t ed25519 -C deploy-key ✓' },
      { re: 'ssh-copy-id\\s+deploy@198\\.51\\.100\\.7', flags: 'i', must: true, hint: 'ssh-copy-id deploy@198.51.100.7', pass: 'ssh-copy-id deploy@198.51.100.7 ✓' },
      { re: 'Host\\s+prod[\\s\\S]*HostName\\s+198\\.51\\.100\\.7[\\s\\S]*User\\s+deploy[\\s\\S]*Port\\s+2200', flags: 'i', must: true, hint: 'Host prod / HostName 198.51.100.7 / User deploy / Port 2200 / IdentityFile ~/.ssh/id_ed25519', pass: 'Host prod block correct ✓' },
      { re: 'ssh-agent[\\s\\S]*ssh-add\\s+~?/?\\.ssh/id_ed25519|eval.*ssh-agent[\\s\\S]*ssh-add', flags: 'i', must: true, hint: 'eval "$(ssh-agent -s)" then ssh-add ~/.ssh/id_ed25519', pass: 'ssh-agent + ssh-add ✓' }
    ],
    run: 'Try it for real against a server you control: generate a key, ssh-copy-id it over, then confirm passwordless login works.',
    solution: `# Task: generate a new ed25519 SSH key pair, adding a comment "deploy-key"
ssh-keygen -t ed25519 -C "deploy-key"

# Task: copy your public key to a server at 198.51.100.7, logging in as user "deploy"
ssh-copy-id deploy@198.51.100.7

# Write a ~/.ssh/config block for a host aliased "prod", pointing at 198.51.100.7,
# user "deploy", port 2200, using the key ~/.ssh/id_ed25519
Host prod
  HostName 198.51.100.7
  User deploy
  Port 2200
  IdentityFile ~/.ssh/id_ed25519

# Task: start ssh-agent and add ~/.ssh/id_ed25519 to it
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519`,
    notes: [
      'After the config block is in place, "ssh prod" alone replaces the entire long-form command — exactly the point of ~/.ssh/config.',
      'ssh-agent typically only needs to be started once per login session — running "ssh-add -l" checks whether it is already running and which keys it currently holds.'
    ]
  },
  quiz: [
    {
      q: 'What is the fundamental security problem with telnet that SSH was designed to fix?',
      options: ['telnet is slower than SSH', 'telnet sends everything, including passwords, as plain unencrypted text over the network', 'telnet cannot connect to Linux servers', 'telnet does not support file transfer'],
      correct: 1,
      explain: 'telnet transmits all data, including login credentials, in plaintext — anyone observing the network traffic could read a password directly. SSH encrypts the entire session.'
    },
    {
      q: 'In an SSH key pair, which key must NEVER be shared, and which one is safe to share freely?',
      options: ['Both must be kept equally secret', 'The private key must never be shared; the public key is safe to share and grants no access on its own', 'The public key must never be shared; the private key is safe to share', 'Neither key needs to be protected once generated'],
      correct: 1,
      explain: 'The private key proves identity and must stay secret; the public key is meant to be shared and distributed, since it alone cannot be used to authenticate as you.'
    },
    {
      q: 'What file on a REMOTE server determines which public keys are allowed to log in as a given user?',
      options: ['~/.ssh/id_ed25519 on the server', '~/.ssh/authorized_keys on the server', '~/.ssh/config on the local client', '/etc/passwd on the server'],
      correct: 1,
      explain: '~/.ssh/authorized_keys on the SERVER, under the target user\'s home directory, lists the public keys allowed to authenticate as that user — ssh-copy-id automates adding a key to it.'
    },
    {
      q: 'What does ~/.ssh/config primarily let you do?',
      options: ['Generate new SSH key pairs', 'Define per-host shortcuts (hostname, user, port, key) so a long ssh command can be replaced with a short alias', 'Encrypt files before sending them over SSH', 'Store server passwords in plaintext for convenience'],
      correct: 1,
      explain: '~/.ssh/config lets you define named Host blocks bundling a real hostname, username, port, and identity file, so "ssh alias" replaces a much longer explicit command.'
    },
    {
      q: 'What specific problem does ssh-agent solve?',
      options: ['It generates SSH keys automatically', 'It avoids needing to re-enter a private key\'s passphrase on every single new connection, by holding the decrypted key in memory for the session', 'It replaces the need for a private key entirely', 'It encrypts traffic that would otherwise be unencrypted'],
      correct: 1,
      explain: 'ssh-agent holds a decrypted copy of the private key in memory after the passphrase is entered once (via ssh-add), then supplies it automatically to future connections during that session — without weakening the key\'s protection at rest on disk.'
    }
  ],
  pitfalls: [
    'Leaving a private key file at permissions looser than 600 — ssh will flatly refuse to use it, exactly the enforcement the earlier permissions-ownership lesson foreshadowed.',
    'Generating a key WITHOUT a passphrase for anything beyond a low-stakes, disposable use case — it means the key file alone, if ever stolen or copied, is immediately usable with no second layer of protection at all.',
    'Assuming "passwordless login" means "no authentication is happening" — it means authentication happens via a cryptographic key instead of a password, a different (and generally stronger) mechanism, not the absence of one.'
  ],
  interview: [
    {
      q: 'Walk through the SSH public-key authentication handshake, and explain specifically why the private key never needs to be transmitted.',
      a: 'The client offers a public key; the server checks whether that exact public key appears in the target user\'s authorized_keys file. If it does, the server generates a fresh, random challenge and sends it to the client. The client uses its PRIVATE key to cryptographically SIGN that challenge — entirely locally, on the client\'s own machine — and sends back only the resulting signature, never the key itself. The server then verifies that signature using the PUBLIC key it already has on file, which mathematically confirms the signature could only have been produced by the corresponding private key, without the server ever needing to see or possess that private key directly. This is the core property that makes key-based auth fundamentally different from password auth: the actual secret never crosses the network at any point, even in encrypted form — only PROOF of possessing it does.'
    },
    {
      q: 'Explain the difference between what a passphrase protects and what file permissions (chmod 600) protect, for a private key.',
      a: 'File permissions (chmod 600) restrict who, on the SAME machine, with normal filesystem access, can even read the key file — they protect against another local user or process on that machine improperly accessing it, but do nothing once the raw file itself leaves that machine\'s filesystem (stolen via a compromised backup, copied off a stolen laptop, exfiltrated by malware with sufficient privilege). A passphrase protects the key\'s actual CONTENTS — even with the raw file fully in hand, outside any permission system entirely, it remains cryptographically useless without also knowing the passphrase that decrypts it. The two are complementary, independent layers: permissions limit who can get the file at all; a passphrase limits what they can do with it even if they succeed.'
    },
    {
      q: 'Why would a team managing many servers prefer ~/.ssh/config over remembering and typing full ssh commands each time, beyond just convenience?',
      a: 'Beyond the obvious typing-speed benefit, ~/.ssh/config centralizes and makes explicit exactly which identity file, user, and port apply to each specific server — reducing the chance of accidentally using the WRONG key or username against the wrong server, especially once dozens of servers with differing configurations are in play. It also makes onboarding a new team member (or reconfiguring your own setup after a new laptop) far more mechanical: share or reconstruct one config file rather than everyone independently having to remember and correctly type out a growing list of long, error-prone explicit connection strings from memory.'
    },
    {
      q: 'A colleague asks why their SSH key was rejected even though ssh-copy-id "succeeded" and the public key is genuinely present in authorized_keys on the server. What would you check?',
      a: 'First, the permissions on the PRIVATE key locally (must be 600 or ssh refuses to offer it at all) and on authorized_keys / the .ssh directory on the SERVER side (overly permissive permissions there can cause the server itself to refuse to trust the file, depending on configuration). Second, whether the client is actually offering the right key at all — if multiple keys exist, ssh may be trying a different one first and never reaching the correct one, checkable with "ssh -v" to see exactly which keys were offered and the server\'s response to each. Third, whether the server\'s sshd configuration even permits public-key authentication at all (PubkeyAuthentication yes in sshd_config) — a server explicitly configured to reject key-based auth would refuse a perfectly valid key regardless of any client-side setup. "ssh -v" (or -vvv for more detail) is the single fastest tool for actually narrowing down which of these it is, rather than guessing.'
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: 'The essentials cover generating a key, authorizing it, and daily-use shortcuts. This is what is underneath: what "signing a challenge" actually means mathematically, agent forwarding\'s real risk, and a few genuinely useful ~/.ssh/config features beyond the basics.',
    sections: [
      {
        h: 'What "signing" actually means, conceptually',
        p: [
          'Public-key cryptography relies on a mathematical relationship where two keys are generated together as a PAIR, such that data encrypted or signed with one can only be correctly verified with the other — and critically, knowing the public key does not make it computationally feasible to derive the private key (for a modern algorithm like ed25519, with current computing power, this would take dramatically longer than the remaining lifespan of the universe to brute-force). "Signing" a challenge means running it through a specific mathematical function using the private key, producing a signature that is provably tied to both that exact challenge AND that exact private key — verifiable by anyone holding the public key, but not FORGEABLE by anyone who only holds the public key. This is exactly the same underlying mathematics (though different specific algorithms) used in TLS/HTTPS certificate verification and cryptocurrency transaction signing — one general-purpose tool, several different applications.'
        ]
      },
      {
        h: 'Agent forwarding: real convenience, real risk',
        p: [
          '<code>ssh -A server</code> (agent forwarding) lets a key loaded in your LOCAL ssh-agent be used for further SSH connections made FROM that remote server, without copying your private key onto it — genuinely useful for hopping through a bastion/jump host to reach a further internal server. The real risk: anyone with sufficient privilege on the intermediate server (root, or a compromised process running as you) can, while your forwarded agent connection is active, use your forwarded agent to authenticate as YOU to anywhere your key is trusted — without ever seeing the private key\'s actual bytes, but still fully able to USE it during that window. This is exactly why agent forwarding should be enabled deliberately, per-connection, rather than left on by default in config for every host — and why <code>ProxyJump</code> (below) is often the safer alternative for the bastion-host use case specifically.'
        ]
      },
      {
        h: 'Useful ~/.ssh/config features beyond the basics',
        p: [
          '<code>ProxyJump bastion-host</code> inside a Host block routes the connection THROUGH another host first (a bastion/jump box), without needing agent forwarding at all for that specific purpose — the connection is tunneled through, but the intermediate host never gets your key or a usable forwarded agent session. <code>Host *</code> defines settings applied to EVERY host as a fallback default (useful for something like a shared IdentityFile default), with more specific Host blocks appearing ABOVE it taking precedence for matching hosts — config is read top to bottom, and the FIRST matching value for a given setting wins. <code>ServerAliveInterval 60</code> sends a periodic keepalive, useful for preventing an idle SSH session from being silently dropped by a firewall or NAT timeout during a long-running but quiet connection.'
        ]
      }
    ]
  }
};
