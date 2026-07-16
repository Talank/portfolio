window.LESSONS = window.LESSONS || {};
window.LESSONS['networking-basics'] = {
  id: 'networking-basics',
  title: 'Networking Basics: IPs, Ports, DNS, curl & wget',
  category: 'Part 5 — Networking & SSH',
  timeMin: 35,
  summary: 'Everything from here on — SSH, scp/rsync, package managers pulling from remote repositories — happens over a network, and all of it rests on three ideas: an address to reach a specific machine (IP), a sub-address for a specific service on that machine (port), and a human-friendly name that translates to an address (DNS). This lesson covers all three, plus curl and wget, the two command-line tools for actually making a request over the network.',
  goals: [
    'Explain what an IP address is, including the difference between public and private address ranges',
    'Explain what a port is, and name a few well-known ports (22, 80, 443)',
    'Explain what DNS does at a conceptual level: translating a domain name to an IP address',
    'Use curl to make an HTTP request, including checking just the response headers',
    'Explain when wget is a better fit than curl, and vice versa'
  ],
  concept: [
    {
      h: 'IP addresses: a numeric address for a specific machine',
      p: [
        'An <b>IP address</b> (IPv4, the form you will see constantly) is a four-number "dotted quad" like <code>192.168.1.42</code>, each number 0-255 — a unique-enough address identifying a specific machine on a network. <code>127.0.0.1</code> (also reachable as the name <code>localhost</code>) is special: it always means "this machine, talking to itself," regardless of what machine you are actually on — genuinely useful for testing a service running locally before it is reachable from anywhere else.',
        'Certain ranges are reserved as <b>private</b> — <code>10.0.0.0–10.255.255.255</code>, <code>172.16.0.0–172.31.255.255</code>, and <code>192.168.0.0–192.168.255.255</code> — meaning they are only meaningful within a local network (a home network, an office, a cloud provider\'s internal network) and are not directly reachable from the wider internet at all; a router performs NAT (Network Address Translation) to let machines on a private range share one actual <b>public</b> IP address when reaching the outside world. This is exactly why your laptop\'s own IP (often something like <code>192.168.1.x</code>) is not the same address a website sees when you visit it — the private address is local-only, the public one is what the rest of the internet actually sees.'
      ]
    },
    {
      h: 'Ports: which SERVICE on that machine, not just which machine',
      p: [
        'An IP address gets you to a specific machine — a <b>port</b> (a number from 0 to 65535) then identifies WHICH service on that machine should handle the connection, since one machine commonly runs many different network services simultaneously. Certain ports are so consistently used for the same purpose they are called "well-known": <b>22</b> (SSH, next lesson\'s entire subject), <b>80</b> (HTTP, unencrypted web traffic), <b>443</b> (HTTPS, encrypted web traffic), <b>3306</b> (MySQL), and many more, though nothing technically prevents a service from listening on a different, non-standard port if configured to.',
        'An address like <code>192.168.1.10:8080</code> combines both pieces — the machine (<code>192.168.1.10</code>) and the specific service on it (port <code>8080</code>) — and this is exactly the shape URLs use too, just with the port usually implied rather than written out (<code>https://example.com</code> implies port 443, since that is HTTPS\'s well-known default).'
      ]
    },
    {
      h: 'DNS: translating a name humans can remember into an address machines use',
      p: [
        'Nobody actually types IP addresses to visit websites — <b>DNS</b> (Domain Name System) is the distributed lookup system that translates a human-friendly domain name (<code>example.com</code>) into the actual IP address a connection needs. <code>dig example.com</code> or the simpler <code>nslookup example.com</code> shows exactly what IP a domain currently resolves to — genuinely useful when troubleshooting "the website is down" (is DNS resolving at all?) versus "the website is slow" (DNS resolved fine, something else is the bottleneck).',
        'DNS results are CACHED, at multiple layers (your own machine, your router, your ISP), for a duration set by the record\'s TTL (time-to-live) — which is exactly why a freshly-changed DNS record does not take effect everywhere instantly; it can take anywhere from minutes to (rarely) up to a day or more to fully "propagate" as cached copies expire and get refreshed. <code>/etc/hosts</code> is a local override, checked BEFORE DNS is ever consulted — adding a line like <code>127.0.0.1 myapp.local</code> lets you test a domain name locally without any real DNS involved at all.'
      ]
    },
    {
      h: 'curl and wget: making an actual request from the command line',
      p: [
        '<code>curl url</code> makes an HTTP(S) request and prints the response body to stdout — genuinely the standard tool for quickly checking an API, downloading a single file, or debugging a web service directly from a terminal, including one you are SSHed into with no browser available at all. <code>curl -I url</code> fetches just the response HEADERS (a HEAD request), useful for a fast "is this even up, and what does it claim about itself" check without downloading the whole body. <code>curl -o filename url</code> saves the response to a file instead of printing it; <code>curl -sS</code> is a genuinely common combo for scripts — silent (no progress bar) but Still showing errors if something actually goes wrong.',
        '<code>wget url</code> covers similar ground but is specifically optimized for DOWNLOADING — its defaults save straight to a file (curl\'s default is to print to stdout instead), and it has strong built-in support for resuming an interrupted download and recursively mirroring an entire site or directory tree, something curl does not do natively at all. As a rough rule of thumb: reach for curl when interacting with an API, inspecting headers, or scripting a request with fine control over method/headers/body; reach for wget when the goal is simply "download this file (or this whole directory) to disk."'
      ]
    }
  ],
  conceptFlow: {
    title: 'curl https://example.com — from typed command to printed response',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The command',
        nodes: [
          { id: 'cmd', text: 'curl https://example.com' }
        ]
      },
      {
        label: 'Step 1: DNS',
        nodes: [
          { id: 'dns', text: 'Resolve "example.com"\nvia DNS -> an IP address' }
        ]
      },
      {
        label: 'Step 2: connect',
        nodes: [
          { id: 'connect', text: 'Open a connection to\nthat IP, on port 443 (HTTPS default)' }
        ]
      },
      {
        label: 'Step 3: request',
        nodes: [
          { id: 'request', text: 'Send an HTTP request\nover that connection' }
        ]
      },
      {
        label: 'Step 4: response',
        nodes: [
          { id: 'response', text: 'Server sends back\nheaders + body' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'print', text: 'curl prints the body\nto stdout' }
        ]
      }
    ],
    steps: [
      { active: ['cmd'], note: 'curl is handed a URL, which contains a domain name, not an address — the domain has to be resolved before any actual connection can happen.' },
      { active: ['dns'], note: 'curl first asks DNS to resolve "example.com" into an actual IP address — nothing else can happen until this step completes.' },
      { active: ['connect'], note: 'With an IP in hand, curl opens a network connection to that specific address, on port 443 — the well-known default for HTTPS, since the URL used "https://".' },
      { active: ['request'], note: 'Over that now-open connection, curl sends an actual HTTP request — by default, a GET request asking for the page at "/".' },
      { active: ['response'], note: 'The server processes the request and sends back a response: status line, headers, and a body — the actual HTML (or JSON, or whatever content type) being requested.' },
      { active: ['print'], note: 'curl\'s default behavior is to print just the response BODY to stdout — "curl -I" would instead have shown only the headers from step 4, skipping the body entirely.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Den Den Mushi Network: Numbers, Channels, and the Directory Snail',
      text: 'Every Den Den Mushi across the Grand Line has its own specific number, and reaching a specific person requires dialing THEIR snail\'s exact number — not a general "call the Sunny" broadcast, a precise number reaching precisely one snail and nobody else, exactly the way an IP address reaches one specific machine and no other. Some numbers are only meaningful within a single, closed network of connected snails — a small island\'s internal relay system, useless for anyone dialing in from outside that island\'s own local relay — while other numbers are genuinely reachable from anywhere across the wider Den Den Mushi network, the "public" kind everyone actually uses to call between distant islands. On any single ship, MULTIPLE snails often sit side by side, each dedicated to a different specific purpose — one line reserved strictly for navigation coordination, a separate line for medical emergencies, another for general crew chatter — and reaching the ship at all is not enough; you also have to specify WHICH of its several lines you actually need, exactly the way a machine\'s IP address alone is not enough without also specifying the port for the specific service you want. And because nobody sailing the Grand Line actually memorizes thousands of raw snail numbers, there exists a specialized directory service — ask it for "Nami, the Straw Hats\' navigator" by NAME, and it looks up and hands back her snail\'s actual dialable number — precisely DNS\'s job, translating a name a person can remember into the raw address a connection actually needs. And it caches: once someone has looked a name up recently, they often just remember the number for a while rather than re-querying the directory every single time, which is exactly why a snail whose number recently CHANGED can still get reached, briefly, at its old, no-longer-current number, until that cached memory eventually refreshes.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Caltech\'s Campus Directory, Building Numbers, and Extension Lines',
      text: 'Caltech\'s campus runs on a system Sheldon, of all people, genuinely respects for its precision, even while constantly complaining about unrelated things. Every building on campus has an exact address — reach the WRONG building number and you are simply nowhere near where Leonard\'s lab actually is, no matter how close you get in general vicinity, exactly the way an IP address specifies one exact machine, not "somewhere in the general area." Some building numbers only make sense for INTERNAL campus routing — an internal mail-cart designation meaningless to an outside delivery service — while the building\'s actual public street address is what anyone from OUTSIDE campus needs to actually find it, a public-vs-private distinction running in parallel underneath the internal one. Within a single building, MULTIPLE distinct departments share the same street address but each answer a DIFFERENT extension line — physics on one extension, the department office on another — so simply reaching "the building" is never enough on its own; you additionally need the specific extension for whichever department you are actually trying to reach, precisely the role a port number plays alongside an IP address. And separately, nobody on campus memorizes raw extension numbers for people they call semi-regularly — there is a campus directory you look up "Dr. Cooper, Physics" in BY NAME, and it hands back his actual dialable extension, exactly DNS\'s job. Penny, new to campus and trying to visit Leonard\'s lab for the first time, initially tries to navigate using ONLY the campus\'s general area name, without a specific building number OR a department extension — and predictably ends up wandering an entire complex for twenty minutes before someone points out that "the general vicinity" was never actually enough information to begin with.'
    },
    why: 'Den Den Mushi numbers (and Caltech\'s building addresses) are IP addresses — one exact identifier for one exact machine, nothing vaguer. A single ship\'s (or building\'s) multiple dedicated lines are ports — the SAME address hosting several genuinely different services, each needing its own specific line to actually be reached. And the directory snail (and Caltech\'s campus directory) is DNS — translating a name a person can actually remember into the raw, precise address a real connection requires, with caching explaining why a recently-changed address can still briefly answer at its old number.'
  },
  tech: [
    {
      q: 'Why do private IP ranges (like 192.168.x.x) exist at all, instead of every device just having a unique public IP?',
      a: 'The internet\'s pool of available IPv4 addresses is a genuinely finite resource, nowhere near large enough for every individual device on every home and office network worldwide to have its own unique public address. Private ranges (10.x, 172.16-31.x, 192.168.x) are specifically reserved as NEVER publicly routable — meaning they can be reused independently on millions of different local networks simultaneously without any conflict, since a private address only has to be unique WITHIN its own local network, not globally. A router performs NAT (Network Address Translation) to let every device on that private network share the router\'s single actual public IP when reaching the wider internet — which is exactly why your laptop\'s own local IP and the IP a website sees when you visit it are two different, unrelated addresses.'
    },
    {
      q: 'Why can a freshly-updated DNS record still resolve to the OLD IP address for a while, even after the change was made correctly?',
      a: 'DNS results are cached at multiple layers along the resolution path — your own machine, your local router, and your ISP\'s DNS resolver may all be holding onto a previously-looked-up answer rather than re-querying the authoritative source every single time. Each DNS record specifies a TTL (time-to-live) — how long a cached copy is considered valid before it should be re-checked — and until that TTL genuinely expires at every layer that cached the old answer, some requests will keep landing on the old IP purely because a cached copy has not yet been invalidated, not because the actual DNS record update itself failed. This is exactly why DNS changes are described as "propagating" rather than taking effect instantly everywhere.'
    },
    {
      q: 'Beyond "curl prints to stdout by default and wget saves to a file," what is the deeper reason to reach for one over the other?',
      a: 'curl is fundamentally an HTTP CLIENT built for fine-grained control over an individual request — custom headers, different HTTP methods (GET/POST/PUT/DELETE), inspecting exactly what was sent and received, integrating cleanly into scripts that need to parse or act on a response — which is exactly why it is the standard tool for interacting with APIs. wget is fundamentally a DOWNLOAD tool, optimized for the specific case of reliably getting a file (or an entire linked set of files, recursively) onto disk, with strong built-in support for resuming an interrupted transfer and mirroring a whole site\'s directory structure — capabilities curl does not natively replicate. The right tool depends on the actual goal: precise control over a single request (curl) versus robustly getting content onto disk, possibly recursively (wget).'
    }
  ],
  code: {
    title: 'Networking basics, hands-on',
    intro: 'Try these on any machine with internet access — none of them modify anything.',
    code: `$ hostname -I
192.168.1.42
# Your machine's own (likely private) IP address on the local network.

$ dig +short example.com
93.184.216.34
# The actual IP example.com currently resolves to.

$ curl -I https://example.com
HTTP/2 200
content-type: text/html; charset=UTF-8
content-length: 1256
# Just the response headers — fast, no body downloaded.

$ curl -sS https://example.com -o page.html
$ ls -la page.html
-rw-r--r-- 1 nami crew 1256 Jul 16 14:00 page.html
# Silent (no progress bar), but Still shows real errors — saved to a file.

$ wget https://example.com/archive.tar.gz
# Downloads to archive.tar.gz by default — resumable with wget -c if interrupted.

$ cat /etc/hosts
127.0.0.1   localhost
127.0.0.1   myapp.local
# A local override, checked BEFORE any real DNS lookup happens.

$ curl http://myapp.local:8080/health
{"status":"ok"}
# Combines a locally-overridden hostname with an explicit, non-default port.`,
    notes: [
      '"dig +short" trims dig\'s normally verbose output down to just the resolved IP — genuinely the fastest way to answer "what does this domain actually resolve to right now."',
      'curl -I sends a HEAD request specifically, which some servers handle slightly differently from a full GET — if headers look suspicious, cross-check with a plain curl -sI -X GET as well.'
    ]
  },
  lab: {
    title: 'Write the right networking command for each task',
    prompt: 'Write exactly one command per task below.',
    starter: `# Task: look up just the IP address that api.example.com currently resolves to


# Task: fetch ONLY the response headers for https://api.example.com/health, not the body


# Task: download https://example.com/data.csv and save it as data.csv (using wget)


# Task: make a silent (no progress bar) curl request to https://example.com, saving the body to out.html, but still show errors if something fails

`,
    checks: [
      { re: 'dig\\s+\\+short\\s+api\\.example\\.com|nslookup\\s+api\\.example\\.com', flags: 'i', must: true, hint: 'dig +short api.example.com (or nslookup api.example.com)', pass: 'dig +short api.example.com ✓' },
      { re: 'curl\\s+-I\\s+https://api\\.example\\.com/health', flags: 'i', must: true, hint: 'curl -I https://api.example.com/health fetches headers only.', pass: 'curl -I https://api.example.com/health ✓' },
      { re: 'wget\\s+https://example\\.com/data\\.csv', flags: 'i', must: true, hint: 'wget https://example.com/data.csv saves it as data.csv by default.', pass: 'wget https://example.com/data.csv ✓' },
      { re: 'curl\\s+-sS\\s+https://example\\.com\\s+-o\\s+out\\.html', flags: 'i', must: true, hint: 'curl -sS https://example.com -o out.html', pass: 'curl -sS https://example.com -o out.html ✓' }
    ],
    run: 'Try it for real: dig +short any domain you like, and curl -I any real website to see its response headers.',
    solution: `# Task: look up just the IP address that api.example.com currently resolves to
dig +short api.example.com

# Task: fetch ONLY the response headers for https://api.example.com/health, not the body
curl -I https://api.example.com/health

# Task: download https://example.com/data.csv and save it as data.csv (using wget)
wget https://example.com/data.csv

# Task: make a silent (no progress bar) curl request to https://example.com, saving the body to out.html, but still show errors if something fails
curl -sS https://example.com -o out.html`,
    notes: [
      'nslookup is an equally valid answer to the first task on systems without dig installed — both query DNS, dig\'s output is just more scriptable.',
      '"-sS" specifically balances quiet scripted output with still surfacing real failures — plain "-s" alone would hide errors too, often a worse default for a script that needs to know if something actually broke.'
    ]
  },
  quiz: [
    {
      q: 'What does an IP address identify, and what does a port additionally specify?',
      options: ['An IP identifies a specific FILE; a port identifies a specific USER', 'An IP identifies a specific MACHINE; a port identifies WHICH service on that machine should handle the connection', 'They are interchangeable terms for the same thing', 'A port identifies a machine; an IP identifies a service'],
      correct: 1,
      explain: 'An IP address gets a connection to a specific machine; the port then specifies which of possibly many services running on that machine should actually handle it.'
    },
    {
      q: 'Why is 192.168.1.42 (a private-range IP) not directly reachable from the wider internet?',
      options: ['It is a typo; that is not a valid IP', 'Private IP ranges are reserved for use only within local networks, and are never publicly routable — a router uses NAT to let local devices share one public IP externally', 'Private IPs are simply slower than public ones', 'All private IPs are automatically blocked by DNS'],
      correct: 1,
      explain: 'Private ranges (10.x, 172.16-31.x, 192.168.x) are reserved specifically for local-network use and are not routable on the public internet — NAT is what lets devices on that private range share one public IP.'
    },
    {
      q: 'What does DNS do?',
      options: ['It encrypts network traffic', 'It translates a human-friendly domain name into the IP address needed to actually connect', 'It compresses files for faster downloads', 'It manages user permissions on a remote server'],
      correct: 1,
      explain: 'DNS resolves a domain name (like example.com) into the actual IP address a connection requires — the internet\'s equivalent of a phone directory.'
    },
    {
      q: 'What is the key practical difference between curl and wget in their DEFAULT behavior?',
      options: ['They behave identically by default', 'curl prints the response to stdout by default; wget saves it to a file by default', 'wget cannot make HTTPS requests at all', 'curl can only download files, never inspect headers'],
      correct: 1,
      explain: 'curl\'s default is to print the response body to stdout (useful for inspecting or piping); wget\'s default is to save the response to a file — reflecting their different primary use cases.'
    },
    {
      q: 'Why might a freshly-changed DNS record still resolve to its OLD value for some users shortly after being updated?',
      options: ['DNS changes are always instant; this cannot happen', 'Cached copies of the old answer, held at various layers (local machine, router, ISP), remain valid until their TTL expires', 'The domain has been permanently broken', 'Only curl and wget are affected by DNS changes, not browsers'],
      correct: 1,
      explain: 'DNS answers are cached at multiple layers with a TTL (time-to-live) controlling how long a cached answer is considered valid — propagation delay is exactly cached copies gradually expiring, not the update itself failing.'
    }
  ],
  pitfalls: [
    'Confusing a machine\'s private, local-network IP with its public IP — they are genuinely different addresses, and "my local IP" is meaningless to anyone trying to reach you from outside that local network.',
    'Assuming a DNS change takes effect instantly everywhere — cached answers at various layers, controlled by each record\'s TTL, mean propagation can take anywhere from minutes to much longer.',
    'Reaching for wget when the actual task is inspecting or scripting an API response (needing headers, custom methods, or precise control) — curl is the better-suited tool for that specific job, even though wget could technically fetch the same URL.'
  ],
  interview: [
    {
      q: 'Explain the relationship between an IP address and a port, using a concrete example.',
      a: 'An IP address identifies a specific machine on a network — a unique-enough numeric address like a street address for a building. A port then identifies WHICH specific service on that machine a connection is meant for, since a single machine commonly runs many independent network services at once. The combination, like 192.168.1.10:443, specifies both: reach exactly this machine (192.168.1.10), and specifically talk to whatever service is listening on port 443 (conventionally HTTPS) — analogous to a building\'s street address plus a specific suite or extension number once you have actually arrived.'
    },
    {
      q: 'Walk through, step by step, what happens between running "curl https://example.com" and seeing a response.',
      a: 'First, curl extracts the domain (example.com) from the URL and performs a DNS lookup to resolve it into an actual IP address — nothing else can proceed until this resolves. Second, curl opens a network connection to that IP, on port 443 by default (since the URL specified https://, whose well-known default port is 443). Third, over that established connection, curl sends an actual HTTP request — a GET request for "/" by default. Fourth, the server processes the request and sends back a response containing a status line, headers, and a body. Finally, curl\'s default behavior is to print just the response BODY to stdout — "curl -I" would instead print only the headers from that same response, skipping the body.'
    },
    {
      q: 'Why do private IP ranges exist, and what mechanism lets a device with a private IP still reach the public internet?',
      a: 'IPv4\'s total address space is a finite, genuinely scarce resource — nowhere near sufficient for every device on every home and office network worldwide to hold a unique public address. Private ranges (10.x, 172.16-31.x, 192.168.x) are reserved as never publicly routable, meaning the SAME private address can be reused independently across millions of unrelated local networks without conflict, since it only needs to be unique within its own local network. NAT (Network Address Translation), typically performed by a router, is the mechanism that lets every device behind it share that router\'s one actual public IP address when communicating with the outside internet — rewriting outgoing traffic to appear as if it came from the shared public address, and routing responses back to the correct originating device internally.'
    },
    {
      q: 'When troubleshooting "this website/API seems down," how would knowing about IP/port/DNS separately help you narrow down where the actual problem is?',
      a: 'Checking DNS resolution first (dig +short the domain) answers "is the NAME resolving to an IP at all" — if it fails here, the problem is DNS itself, or the domain\'s configuration, before any actual connection is even attempted. If DNS resolves fine, trying to connect directly to that IP and the relevant port (or using curl -I against the domain) answers "is a service actually listening and responding there" — a DNS success but a connection failure narrows the problem to the SERVER or network path, not the naming layer. This layered troubleshooting — name resolution, then reachability, then the actual application response — is a genuinely standard, systematic way to localize a networking problem rather than guessing at the cause from a single symptom like "the website does not load."'
    }
  ]
};
