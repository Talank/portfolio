window.LESSONS = window.LESSONS || {};
window.LESSONS['tramp-remote-editing'] = {
  id: 'tramp-remote-editing',
  title: 'TRAMP: Editing a File on a Remote SSH Server as if It Were Local',
  category: 'Part 7 — Terminal, Shell, Remote & Capstone',
  timeMin: 40,
  summary: 'TRAMP (Transparent Remote Access, Multiple Protocols) lets a single Emacs command, C-x C-f, open a file that physically lives on a completely different machine, over SSH, and edit it with every single Emacs feature working exactly as if the file were sitting on your own local disk. There is no separate remote-editing mode to learn — the trick is entirely in a special filename syntax, and everything downstream of that just works.',
  goals: [
    'Open a remote file over SSH using TRAMP\'s special filename syntax',
    'Explain what actually happens over the wire when TRAMP opens and saves a remote file',
    'Use Dired on a remote directory exactly as you would on a local one',
    'Explain why TRAMP is architecturally different from copying a file down, editing it, then copying it back',
    'Recognize when a remote command run through TRAMP is genuinely running on the remote machine, not locally'
  ],
  concept: [
    {
      h: 'The special filename syntax that turns any command remote',
      p: [
        'TRAMP works by recognizing a special FILENAME pattern: <code>/ssh:user@host:/path/to/file</code>. There is no separate "remote mode" to switch into and no separate command to learn — you use the exact same <code>C-x C-f</code> (find-file) you would use for any local file; you simply give it a filename that happens to start with <code>/ssh:</code> instead of a local path, and TRAMP recognizes that pattern and transparently routes everything through an SSH connection instead of local disk access.',
        'Because this is just a filename convention, it works everywhere Emacs accepts a filename — <code>C-x C-f</code>, Dired, even inside another command\'s filename prompt — with zero special-casing required anywhere else in Emacs. Any Emacs feature that already knows how to work with "a file" automatically gains the ability to work with "a remote file," because from that feature\'s own point of view, nothing about the interface has actually changed at all.'
      ]
    },
    {
      h: 'What genuinely happens over the wire',
      p: [
        'When you open <code>/ssh:user@host:/etc/nginx/nginx.conf</code>, TRAMP opens a real SSH connection to <code>host</code>, reads the file\'s contents over that connection, and populates a normal Emacs buffer with them locally — at that point, editing happens entirely in local memory, using every ordinary Emacs command, with zero network activity per keystroke. Saving with <code>C-x C-s</code> is the moment TRAMP sends the buffer\'s new contents back over the same SSH connection, overwriting the file on the remote machine.',
        'This is a genuinely important distinction from something like mounting a remote filesystem: TRAMP is not creating any persistent local mount point, and the file never actually exists as a separate local file on disk anywhere — it exists remotely the whole time, and locally only as an in-memory Emacs buffer between the moment it was opened and the moment (if ever) it is explicitly saved back.'
      ]
    },
    {
      h: 'Dired, and genuinely everything else, works remotely too',
      p: [
        '<code>C-x d</code> (Dired) accepts the exact same <code>/ssh:user@host:/path/</code> syntax for a DIRECTORY, and the result is a completely ordinary Dired buffer — except every file listed in it is remote, and every Dired operation performed on it (deleting, renaming, marking multiple files, even running a shell command on marked files with <code>!</code>) is transparently executed on the remote machine over the same SSH connection, exactly as it would be executed locally.',
        'This generalizes further than just Dired: grep-searching across remote files, running a compile command against remote code, even opening an eshell whose current directory is a remote TRAMP path (so its commands actually execute on the remote machine) — all of it works, because TRAMP is not a feature bolted onto a few specific commands, it is a general redirection built into Emacs\'s own file-handling machinery that essentially everything else in Emacs already goes through.'
      ]
    },
    {
      h: 'TRAMP vs manually copying a file down and back',
      p: [
        'The manual alternative — <code>scp</code> the file down, edit it locally, <code>scp</code> it back up — genuinely works, but it introduces a real, avoidable risk: a real local copy of the file exists the entire time you are editing, and if someone else (or another process) modifies the remote original while your local copy is out for editing, your eventual copy-back silently overwrites their change with no warning at all, because nothing is tracking the relationship between your local copy and the remote original once the initial download finishes.',
        'TRAMP genuinely avoids this specific risk in the common case: because there is no separate, disconnected local file at all — only an in-memory buffer directly tied to the remote path — Emacs\'s normal "file changed on disk since you opened it" detection (the same mechanism protecting against two people editing the same LOCAL file at once) applies to the remote file too, warning you if the remote copy changed since you opened it, before you save over it.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Den Den Mushi Line That Makes the Distant Warehouse Feel Local',
      text: 'Managing supplies stored in a warehouse on a distant, rarely-visited island used to mean a genuinely awkward two-step process: sail there, physically carry the relevant ledger back to the ship, make whatever changes were needed, then sail all the way back to return it — and if anyone else at the warehouse touched that same ledger while it was away on the ship, their changes were simply gone, overwritten, with nobody the wiser until much later. The alternative Nami sets up instead is a permanent Den Den Mushi line directly to the warehouse\'s own record-keeper: she asks for changes to be read out over the line, edits her OWN working notes in real time based on what she hears, and reads her changes back over the same line to be written into the real ledger, on the real island, without the ledger itself ever actually leaving the warehouse at all. Critically, the record-keeper on the other end still warns her immediately if someone else has touched the real ledger since she started her call — the same warning that would apply to any two people trying to edit the same physical ledger sitting in front of them, extended transparently over the Den Den Mushi line to cover this exact distant case too. Franky, watching her work this way, sums it up: "You are not carrying the ledger back and forth anymore. You are just talking directly to the island, in real time, and the warehouse still knows to tell you if somebody else got there first."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Live Video Line Into the Whiteboard in Leonard\'s Old Office',
      text: 'When Sheldon needs to update a physics whiteboard that is physically sitting in an office across campus, the old, awkward approach was genuinely two separate steps: walk over, photograph the whiteboard, come back and think about it, then walk BACK over to actually make the change — and if a collaborator erased or added something on the real board in between those two trips, Sheldon\'s eventual update would simply overwrite it, with no warning at all, since nothing was tracking what the real board looked like in the meantime. What he sets up instead is a permanent live video connection directly into that office: he can see the real whiteboard\'s current, live state at all times, make his changes by directing a colleague physically standing there to write exactly what he specifies, and the whiteboard itself never actually leaves that office even once. And critically, if a collaborator has genuinely changed something on the real board since Sheldon\'s session began, he is told immediately, before his own change goes up — the exact same "someone else already changed this" warning that would apply if two people were standing at the same physical board at once, just extended transparently over the live video line to cover the across-campus case too. Leonard, watching this replace weeks of Sheldon\'s "walk over, photograph, walk back" routine, says it plainly: "You are not carrying a photo back and forth anymore. You are just looking directly at the real board, live, and it still tells you if someone else got there first."'
    },
    why: 'The Den Den Mushi line straight to the warehouse\'s real ledger, and the live video line straight into the real whiteboard, are exactly what TRAMP\'s SSH connection provides: direct, live access to the REAL remote file, edited through a completely normal local interface, with no disconnected local copy ever actually existing to silently go stale. And the fact that each system still warns about changes made by someone else at the real, remote location before overwriting is exactly TRAMP inheriting Emacs\'s normal "file changed since you opened it" protection for remote files too.'
  },
  tech: [
    {
      q: 'Precisely describe what happens, mechanically, when you open /ssh:user@host:/etc/nginx/nginx.conf with C-x C-f.',
      a: 'TRAMP recognizes the /ssh: filename prefix and opens a real SSH connection to host as user. It reads the file\'s current contents over that connection and populates a normal, local Emacs buffer with them. From that point until you either save or kill the buffer, all editing happens entirely in local memory using ordinary Emacs commands, with no network activity triggered per keystroke. Only C-x C-s (save) triggers another round-trip: TRAMP sends the buffer\'s current contents back over the same SSH connection, overwriting the file at that exact remote path. No persistent local file is ever created on disk anywhere in this process — the file exists remotely throughout, and locally only as an in-memory buffer.'
    },
    {
      q: 'Why is TRAMP described as architecturally different from manually scp-ing a file down, editing it, and scp-ing it back — what specific risk does the manual approach introduce that TRAMP avoids?',
      a: 'The manual scp-down/edit/scp-up approach creates a genuine, disconnected local copy of the file that exists independently of the remote original for the entire editing session — if the remote original is modified by someone or something else during that window, nothing detects or warns about that divergence, and copying the edited local file back simply, silently overwrites whatever changed remotely, with no warning at all. TRAMP does not create an independent local copy in that sense — the buffer is directly tied to the remote path, and Emacs\'s normal "file has changed on disk since this buffer was opened" detection mechanism (the same one that protects against two people editing the same LOCAL file simultaneously) applies to the TRAMP-backed remote file too, meaning a genuine remote-side change made while you were editing triggers a warning before your save can silently overwrite it.'
    },
    {
      q: 'Why does Dired work identically on a remote TRAMP path as it does locally, with essentially zero special-casing required in Dired\'s own code?',
      a: 'TRAMP is implemented as a general redirection built into Emacs\'s own core file-handling machinery — the low-level functions Emacs uses everywhere to read a directory\'s contents, open a file, or write one — rather than as a feature bolted onto specific commands like Dired individually. Because Dired, like essentially every other Emacs feature that touches files, is built on top of those same core file-handling functions rather than reimplementing its own file access, it automatically gains TRAMP\'s remote capability for free, with no Dired-specific code needed to recognize or handle the /ssh: prefix at all — from Dired\'s own point of view, it is simply calling the same file functions it always calls, and TRAMP is what makes those functions transparently remote-aware underneath.'
    }
  ],
  code: {
    title: 'Opening a remote file and browsing a remote directory',
    intro: 'Requires SSH access already configured to the target host (the same access you would use for a normal "ssh user@host" from a terminal).',
    code: `C-x C-f
/ssh:user@example.com:/etc/nginx/nginx.conf <RET>
;; TRAMP opens a real SSH connection to example.com as "user",
;; reads the file over that connection, and populates a normal buffer.
;; Edit exactly as you would any local file — isearch, M-%, everything works.

C-x C-s
;; Sends the buffer's current contents back over SSH, overwriting the
;; real remote file at that exact path. No local file was ever created.

;; Browsing a remote directory with Dired:
C-x d
/ssh:user@example.com:/var/log/ <RET>
;; A completely normal Dired buffer — except every listed file is remote,
;; and every Dired operation (mark, delete, rename, shell command with !)
;; executes transparently on example.com over the same SSH connection.

;; Editing as a different user on the SAME remote host (e.g. root, via sudo)
;; can be chained with another TRAMP method:
C-x C-f
/ssh:user@example.com|sudo:root@example.com:/etc/nginx/nginx.conf <RET>
;; First connects as "user" over SSH, then "sudo"s to root on that same
;; connection -- editing a root-owned file on a remote host with no
;; separate manual sudo/scp dance required at all.`,
    notes: [
      'The very first connection to a given host in a session takes a moment (establishing the real SSH connection); subsequent file opens to the same host reuse that connection and are noticeably faster.',
      'TRAMP paths work anywhere Emacs accepts a filename, including inside grep-find, compile, and shell-command prompts — not just C-x C-f and Dired specifically.'
    ]
  },
  lab: {
    title: 'Write the correct TRAMP filenames for each task',
    prompt: 'Fill in each blank with the correct TRAMP path or command.',
    starter: `# Task: open /var/www/config.yml on host 192.0.2.10 as user "deploy" via SSH


# Task: open a Dired buffer on the remote directory /home/deploy/logs/
# on that same host


# Task: open /etc/hosts on host db1.internal, connecting as "ops" over SSH
# and then sudo-ing to root on that same connection


# Q: In one or two sentences, explain why saving a TRAMP-opened file does
# not require a separate manual upload step.

`,
    checks: [
      { re: '/ssh:deploy@192\\.0\\.2\\.10:/var/www/config\\.yml', flags: '', must: true, hint: 'TRAMP syntax: /ssh:user@host:/path', pass: 'Remote file path ✓' },
      { re: '/ssh:deploy@192\\.0\\.2\\.10:/home/deploy/logs/', flags: '', must: true, hint: 'Dired accepts the same /ssh:user@host:/path/ syntax for a directory.', pass: 'Remote Dired path ✓' },
      { re: '/ssh:ops@db1\\.internal\\|sudo:root@db1\\.internal:/etc/hosts', flags: '', must: true, hint: 'Chain methods with | : /ssh:user@host|sudo:root@host:/path', pass: 'Chained sudo TRAMP path ✓' },
      { re: 'save|C-x C-s|sends|writes|upload', flags: 'i', must: true, hint: 'C-x C-s itself sends the buffer contents back over the same SSH connection -- that IS the upload, no separate step needed.', pass: 'Explained save-is-upload ✓' }
    ],
    run: 'Try it for real: C-x C-f /ssh:you@somehost:/some/path on a host you actually have SSH access to.',
    solution: `# Task: open /var/www/config.yml on host 192.0.2.10 as user "deploy" via SSH
C-x C-f /ssh:deploy@192.0.2.10:/var/www/config.yml

# Task: open a Dired buffer on the remote directory /home/deploy/logs/
# on that same host
C-x d /ssh:deploy@192.0.2.10:/home/deploy/logs/

# Task: open /etc/hosts on host db1.internal, connecting as "ops" over SSH
# and then sudo-ing to root on that same connection
C-x C-f /ssh:ops@db1.internal|sudo:root@db1.internal:/etc/hosts

# Q: In one or two sentences, explain why saving a TRAMP-opened file does
# not require a separate manual upload step.
# C-x C-s itself IS the upload -- it sends the buffer's current contents
# directly back over the same SSH connection TRAMP already opened,
# overwriting the remote file in one step, with no separate scp needed.`,
    notes: [
      'The chained sudo: method is genuinely useful beyond TRAMP itself -- it is the same pattern SSH-course material referred to when covering privilege escalation over an existing connection, just now reachable directly from C-x C-f.',
      'A typo in the hostname or path produces a connection error, not a silent failure -- TRAMP surfaces real SSH errors directly.'
    ]
  },
  quiz: [
    {
      q: 'What does the /ssh:user@host:/path syntax do when given to C-x C-f?',
      options: ['Nothing special -- it is treated as a literal local filename', 'TRAMP recognizes the prefix and transparently opens the file over a real SSH connection to that host', 'It opens a local file named exactly that string', 'It requires a separate remote-editing mode to be enabled first'],
      correct: 1,
      explain: 'TRAMP recognizes the special filename pattern and routes the file operation through SSH, with no separate mode to enable.'
    },
    {
      q: 'Where does editing actually happen after a TRAMP-opened file is loaded into a buffer?',
      options: ['Every keystroke is sent over the network immediately', 'Entirely in local memory, in a normal Emacs buffer, with no network activity until you explicitly save', 'On the remote machine directly, with the local buffer just mirroring it', 'TRAMP requires a persistent local mount point that syncs continuously'],
      correct: 1,
      explain: 'After the initial read, editing is entirely local; only C-x C-s triggers another round trip to write the changes back.'
    },
    {
      q: 'What specific risk does manually scp-ing a file down, editing it, and scp-ing it back introduce, that TRAMP avoids?',
      options: ['There is no difference between the two approaches', 'A disconnected local copy can silently diverge from the remote original if something else modifies it during editing, with no warning on copy-back', 'Manual scp is always faster than TRAMP', 'TRAMP cannot edit files larger than the manual approach can'],
      correct: 1,
      explain: 'TRAMP\'s buffer stays tied to the remote path, so Emacs\'s normal changed-on-disk detection warns you if the remote file changed since you opened it -- a disconnected manual copy has no such protection.'
    },
    {
      q: 'Why does Dired work on remote TRAMP paths with essentially no special-casing in Dired\'s own code?',
      options: ['Dired has a dedicated remote-specific reimplementation', 'TRAMP is built into Emacs\'s core file-handling machinery, which Dired (like most file-touching features) already uses, so it inherits remote support automatically', 'Dired cannot actually browse remote directories', 'Remote Dired requires a separate paid extension'],
      correct: 1,
      explain: 'Because Dired is built on the same core file functions TRAMP redirects, it gets remote support for free with no Dired-specific code needed.'
    },
    {
      q: 'What does chaining /ssh:user@host|sudo:root@host:/path accomplish?',
      options: ['It opens two separate unrelated files', 'It connects via SSH as "user" and then sudos to root on that same connection, letting you edit a root-owned remote file directly', 'It is invalid syntax and will always fail', 'It only works for local files, not remote ones'],
      correct: 1,
      explain: 'TRAMP methods can be chained with | -- connect over SSH first, then apply sudo on that same connection, all from a single C-x C-f.'
    }
  ],
  pitfalls: [
    'Assuming a TRAMP-opened file exists as a real local file somewhere on disk -- it does not; it exists remotely the whole time, and locally only as an in-memory buffer until explicitly saved back.',
    'Forgetting that the very first connection to a given host takes a real moment to establish (a genuine SSH handshake) and mistaking that pause for Emacs hanging.',
    'Typing the TRAMP path with a single slash typo (e.g. missing the second colon) and being confused by a "no such file" error that is really just malformed TRAMP syntax, not an actual remote filesystem problem.'
  ],
  interview: [
    {
      q: 'Explain, precisely, what happens over the network when a TRAMP-opened remote file is edited and then saved.',
      a: 'Opening the file triggers exactly one network round trip: TRAMP establishes a real SSH connection to the target host and reads the file\'s current contents over it into a normal, local Emacs buffer. From that point, every edit happens entirely in local memory using ordinary Emacs editing commands -- there is no per-keystroke network activity at all. Saving with C-x C-s triggers the second and only other network round trip: the buffer\'s current full contents are sent back over the same SSH connection, overwriting the file at that exact remote path. No persistent local file is created at any point in this process -- the file exists remotely throughout, and only ever exists locally as transient, in-memory buffer content.'
    },
    {
      q: 'Why is it inaccurate to describe TRAMP as "basically the same as scp-ing a file down, editing it, and scp-ing it back, just automated"?',
      a: 'The manual scp-down/edit/scp-up approach creates a genuinely independent local COPY of the file that exists disconnected from the remote original for the full duration of editing -- if the remote file changes during that window, nothing detects the divergence, and the manual copy-back silently clobbers it with no warning. TRAMP\'s buffer, by contrast, stays conceptually tied to the remote path the entire time -- it participates in Emacs\'s normal "file changed on disk since this buffer was opened" detection, the same mechanism guarding against two people editing one local file simultaneously, just extended to cover the remote case. That protection is a genuine behavioral difference, not merely an automation convenience -- "automated scp" would not, on its own, provide any equivalent safeguard against a remote-side change happening mid-edit.'
    },
    {
      q: 'Why does chained authentication (/ssh:user@host|sudo:root@host:/path) work, and what does this reveal about TRAMP\'s general design?',
      a: 'TRAMP models remote access as a sequence of composable METHODS rather than a single fixed connection type -- /ssh: establishes the base SSH connection as a given user, and |sudo: layers an additional privilege-escalation step on top of that same already-established connection, landing you as root for file-access purposes without a separate, manual sudo/scp workflow. This reveals that TRAMP is not narrowly built around "one specific way to reach a remote file" but rather a general, composable connection-method system -- SSH is the most common base method, but the chaining mechanism itself is generic, which is why sudo (and other methods) can be layered on top of it without TRAMP needing special-cased support for that exact combination.'
    },
    {
      q: 'A teammate proposes mounting remote servers with sshfs and editing the mounted files locally instead of using TRAMP -- what is the genuine tradeoff between the two approaches?',
      a: 'sshfs creates a real, persistent local mount point where the remote filesystem appears to live locally -- any local tool, not just Emacs, can then operate on it as if it were a normal local file, which is a genuine advantage TRAMP does not provide since TRAMP is Emacs-specific. The tradeoff is that sshfs requires actual filesystem-level mounting (often needing elevated permissions or a FUSE setup) and keeps a persistent, systemwide connection open regardless of whether anything is actively using it; TRAMP requires no mounting or special permissions at all, connects on demand per Emacs file operation, and needs no setup beyond normal SSH access -- but its benefit is scoped entirely to Emacs itself, and a separate, non-Emacs tool touching the same remote file would not go through TRAMP or benefit from its changed-on-disk protection at all.'
    }
  ],
  deepDive: {
    timeMin: 12,
    intro: 'The essentials cover opening and saving a single remote file and browsing a remote directory. This is what is underneath: TRAMP\'s other connection methods beyond SSH, and how it minimizes the actual number of remote commands it runs.',
    sections: [
      {
        h: 'TRAMP methods beyond /ssh:',
        p: [
          'SSH is the most commonly used TRAMP method, but it is one of several -- <code>/sudo:</code> alone (without a preceding SSH hop) applies sudo to a LOCAL file, letting you edit a root-owned file on your own machine without leaving Emacs or manually running sudo in a separate terminal; <code>/docker:</code> connects into a running Docker container\'s filesystem directly, treating container paths the same way remote SSH paths are treated. All of these share the exact same underlying design: a method prefix, composable with others via the same | chaining syntax used for sudo-over-SSH, all routed through the identical core file-handling redirection that makes any of this transparent to the rest of Emacs.'
        ]
      },
      {
        h: 'Why TRAMP feels reasonably fast despite being SSH-backed',
        p: [
          'A naive implementation might run a separate SSH command for every single small operation TRAMP needs (checking if a file exists, reading its permissions, reading its contents), which would be genuinely slow given SSH\'s real per-command connection overhead. TRAMP avoids this by keeping a persistent SSH connection open for the duration of a session with a given host (rather than reconnecting per operation) and batching many of its own internal bookkeeping operations over that single, already-open connection wherever possible -- which is also why the FIRST file opened on a given host in a session has a noticeably longer delay than subsequent ones: that first open pays the real cost of establishing the connection that every later operation on that same host then reuses.'
        ]
      }
    ]
  }
};
