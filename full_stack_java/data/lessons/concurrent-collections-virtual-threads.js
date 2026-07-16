window.LESSONS = window.LESSONS || {};
window.LESSONS['concurrent-collections-virtual-threads'] = {
  id: 'concurrent-collections-virtual-threads',
  title: 'ConcurrentHashMap, Atomics & Virtual Threads (Project Loom)',
  category: 'Part 5 — Concurrency',
  timeMin: 45,
  summary: 'threads-basics fixed a shared counter with synchronized; executors-futures managed WORK with a bounded pool of threads. This closing Part 5 lesson gives you purpose-built tools instead of hand-rolled locks: ConcurrentHashMap for a map many threads read and write at once (the maps-deep-dive lesson\'s HashMap is flatly unsafe here), the java.util.concurrent.atomic classes for lock-free counters and references built on compare-and-swap, CopyOnWriteArrayList for read-mostly lists shared across threads, and virtual threads (Project Loom, Java 21+) — a fundamentally lighter-weight kind of thread that makes thread-per-task viable again for I/O-bound work, while every correctness rule from threads-basics about shared mutable state still applies unchanged.',
  goals: [
    'Explain why plain HashMap is unsafe under concurrent modification, and use ConcurrentHashMap\'s atomic compound operations (putIfAbsent, computeIfAbsent, merge) correctly',
    'Use AtomicInteger/AtomicLong/AtomicReference and explain compare-and-swap (CAS) as a lock-free alternative to synchronized for simple counters and references',
    'Choose CopyOnWriteArrayList correctly for read-heavy, write-rare lists shared across threads, and explain its snapshot-iterator semantics and copying cost',
    'Explain what a virtual thread is, how it differs from a platform thread, and why it makes thread-per-task viable again for blocking I/O-bound workloads',
    'Recognize that virtual threads change thread COST, not concurrency correctness rules — shared mutable state still needs synchronized/atomics/concurrent collections, and explain the pinning gotcha'
  ],
  concept: [
    {
      h: 'Why HashMap is unsafe under concurrency, and what ConcurrentHashMap actually buys you',
      p: [
        'The maps-deep-dive lesson covered HashMap\'s internals — buckets, resizing, treeification — entirely from a single-threaded point of view, and that\'s not an oversight: HashMap makes NO promises whatsoever about concurrent access. Two threads calling put() on the same HashMap at the same time can corrupt its internal bucket structure outright (historically, concurrent resizes could even produce an infinite loop in older JDK versions), and Collections.synchronizedMap(new HashMap<>()) — wrapping every method with one single lock — fixes memory-safety but creates a NEW problem: every operation, from every thread, contends for that ONE lock, so a synchronized map serializes ALL access even when two threads are working on completely unrelated keys, becoming a throughput bottleneck under real concurrent load.',
        'ConcurrentHashMap solves both problems at once: it\'s safe for concurrent access WITHOUT external synchronization, and internally it uses fine-grained locking (conceptually, locking only the specific bucket/bin being modified, not the whole map) so that threads working on DIFFERENT keys don\'t block each other at all — only threads that happen to collide on the exact same bucket contend. It also provides genuinely ATOMIC compound operations that a plain HashMap simply cannot offer safely under concurrency: putIfAbsent(key, value) (insert only if absent, as one indivisible step — doing "if (!map.containsKey(k)) map.put(k, v)" as two separate calls on a HashMap is itself a check-then-act race condition), computeIfAbsent(key, function) (the maps-deep-dive lesson\'s lazy-initialization tool, now guaranteed to invoke the function at most once per key even under concurrent calls for that same key), and merge(key, value, remappingFunction) (the maps-deep-dive lesson\'s tool for atomic read-modify-write updates like counters keyed by tag, now safe to call from multiple threads on the same key without losing updates).'
      ]
    },
    {
      h: 'Atomic classes: compare-and-swap as a lock-free alternative to synchronized',
      p: [
        'The threads-basics lesson fixed a shared counter with a synchronized increment() method — correct, but it means every incrementing thread BLOCKS while another holds the lock, a real cost under high contention. java.util.concurrent.atomic.AtomicInteger (and AtomicLong, AtomicBoolean, AtomicReference<T>) offers a LOCK-FREE alternative for exactly this case: atomicCounter.incrementAndGet() is atomic without ever blocking a thread the way synchronized does. Under the hood, atomic classes are built on a hardware-level instruction called COMPARE-AND-SWAP (CAS): "update this memory location to newValue, but ONLY if it currently still holds expectedValue; tell me whether that succeeded." A thread wanting to increment reads the current value, computes the new value, and attempts a CAS; if another thread updated the value in between (the CAS fails because the "currently holds expectedValue" check no longer matches), the first thread simply RETRIES the whole read-compute-CAS sequence from scratch, in a tight loop, until it succeeds — no thread is ever put into the BLOCKED state waiting for a lock to be released.',
        'This retry-until-success pattern is why atomics are called "lock-free" rather than "wait-free" — under very heavy contention a thread COULD in principle retry many times, but in practice CAS-based updates are dramatically cheaper than acquiring a monitor lock for simple operations, because there\'s no OS-level scheduling involved in a failed CAS attempt (a thread doesn\'t get parked and later woken up the way a BLOCKED thread waiting on synchronized does — it just loops and tries again, typically succeeding within a few attempts). The decision rule: for a SINGLE variable undergoing simple compound updates (a counter, a reference being swapped), reach for the matching Atomic class before reaching for synchronized — it\'s simpler to write correctly (no lock to forget) and typically faster under contention. The moment you need to update MULTIPLE related variables together as one atomic unit, atomics stop being sufficient (there\'s no way to CAS two independent fields as a single indivisible operation) and you\'re back to synchronized (or a concurrent collection\'s own built-in atomicity, as in the previous section).'
      ]
    },
    {
      h: 'CopyOnWriteArrayList: safe iteration for read-heavy, write-rare lists',
      p: [
        'The collections-lists lesson established that ArrayList is fail-fast — iterating it while another thread structurally modifies it throws ConcurrentModificationException, a detection mechanism, not a fix. CopyOnWriteArrayList takes a completely different strategy suited specifically to lists that are READ constantly but WRITTEN rarely: every mutating operation (add, remove, set) copies the ENTIRE underlying array, performs the modification on the fresh copy, and then atomically swaps the reference so future reads see the new array — meanwhile, any iterator already in progress keeps iterating over the OLD array it captured a reference to at creation time, seeing a consistent, unchanging SNAPSHOT of the list as it existed at that moment, with no possibility of ConcurrentModificationException and no need for any external synchronization to iterate safely.',
        'The cost is exactly what the name promises: every single write copies the whole backing array, an O(n) operation regardless of how small the actual change is, which makes CopyOnWriteArrayList a genuinely poor choice for a list with frequent writes (each write\'s cost grows with list size, and copies pile up under write-heavy concurrent load) but an excellent, purpose-built choice for the read-heavy, write-rare shape that comes up constantly in real systems — a list of registered event listeners, a list of active configuration overrides, a set of connected clients — read far more often (by many threads, concurrently, with zero locking overhead on the read path) than it\'s ever modified.'
      ]
    },
    {
      h: 'Virtual threads: a lighter-weight thread for I/O-bound work, not a new concurrency model',
      p: [
        'Every thread discussed so far — in threads-basics and executors-futures — is a PLATFORM thread: a thin wrapper around one real OS thread, with the memory and scheduling cost that implies, which is precisely why executors-futures introduced bounded thread POOLS instead of creating a thread per task. Virtual threads (finalized in Java 21, from Project Loom) are a genuinely different kind of Thread: they are managed by the JVM itself rather than the OS, are dramatically cheaper to create (megabytes of platform threads\' worth of memory becomes kilobytes per virtual thread, and you can realistically run millions of them, not thousands), and are created with Thread.ofVirtual().start(runnable) or, more commonly in application code, Executors.newVirtualThreadPerTaskExecutor() — an ExecutorService that hands out a BRAND NEW virtual thread per submitted task, deliberately reviving the "one thread per task" style executors-futures steered you away from for platform threads, because for virtual threads that style is now cheap and appropriate.',
        'The mechanism that makes this work: many virtual threads share a small pool of real OS "carrier" threads, and the JVM automatically UNMOUNTS a virtual thread from its carrier the instant it blocks on I/O (a network call, a file read, anything that would otherwise tie up a whole OS thread doing nothing but waiting) — freeing that carrier thread to run a DIFFERENT virtual thread in the meantime, then re-mounting the original virtual thread onto some available carrier once its I/O completes. This is precisely why virtual threads target I/O-BOUND workloads specifically: a web service handling thousands of concurrent requests that each spend most of their time waiting on a database call or a downstream HTTP call can now use one virtual thread per request — simple, sequential-looking blocking code, no CompletableFuture pipeline required to avoid tying up scarce platform threads — while the JVM transparently multiplexes thousands of them onto a handful of real OS threads underneath. For CPU-BOUND work (computation that never blocks), virtual threads offer no advantage at all — there\'s no idle waiting time to reclaim, so a bounded platform-thread pool sized to available cores remains the right tool.'
      ]
    },
    {
      h: 'Virtual threads don\'t change concurrency correctness — and the pinning gotcha',
      p: [
        'This is the single most important thing to internalize about virtual threads: they change the COST of having many threads, not a single rule about shared mutable state. Every hazard from threads-basics still applies identically — a race condition on an unsynchronized counter is exactly as real with virtual threads as with platform threads; ConcurrentHashMap, the Atomic classes, and CopyOnWriteArrayList are exactly as necessary; deadlock from inconsistent lock ordering is exactly as possible. Millions of cheap virtual threads racing on the same unsynchronized field produces the exact same lost-update bug as two platform threads did — cheaper threads make the RACE WINDOW get hit more often (more concurrent contenders), not less dangerous.',
        'The one genuinely new gotcha virtual threads introduce is PINNING: when a virtual thread executes a synchronized block or method, the JVM currently cannot unmount it from its carrier thread for the duration of that block — the virtual thread stays "pinned" to its carrier even if it then blocks on I/O inside that synchronized section, which means the carrier thread is stuck waiting right along with it, defeating the whole cheap-unmount-on-blocking-I/O mechanism for exactly that stretch of code. This matters concretely when you have a LOT of virtual threads and a SMALL pool of carrier threads: if many virtual threads simultaneously pin their carriers inside a synchronized block that also does blocking I/O, you can exhaust the carrier pool and stall progress across the whole application, in effect recreating the exact thread-pool-exhaustion symptom the jvm-tools-reflection lesson\'s thread-dump reading covered — just now with virtual threads pinned to carriers instead of platform threads blocked on a downstream call. The mitigation: prefer java.util.concurrent.locks.ReentrantLock over synchronized in code paths that run on virtual threads and also perform blocking I/O inside the locked section, since ReentrantLock does NOT pin — the correctness guarantee (mutual exclusion) is identical, only the pinning behavior differs.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The galley\'s sectioned ledger, the vote-die that only turns on a match, the freshly reprinted wanted board, and Franky\'s grappling-hook army',
      text: 'The old crew ledger used to have ONE lock for the whole book — whoever wanted to write ANYTHING, even a totally unrelated page, had to wait for whoever currently held the book, no matter how far apart their entries were (a single-lock synchronizedMap: safe, but everyone serializes behind one lock even on unrelated keys). Nami\'s redesign splits the ledger into many independently-locked sections — the map section, the bounty section, the recipe section — so two crew members updating DIFFERENT sections never wait on each other at all, only colliding if they somehow grab the exact same page at once (ConcurrentHashMap: fine-grained locking per bucket, not one lock for the whole map), and she adds a rule that lets anyone safely write "only if this page is still blank" (putIfAbsent) or "look up my running total for this key and update it in one motion" (merge) without two crewmates ever quietly erasing each other\'s entry. For a running vote tally during a crew debate, nobody bothers with the ledger\'s lock system at all — there\'s a single die that only advances if you can show it currently reads the number you expect; if someone else turned it first, you check the new number and try again (compare-and-swap: AtomicInteger, retry instead of blocking). The wanted board works differently still: every time a new poster goes up, Nami doesn\'t pin it onto the existing board — she has an entirely FRESH board printed with the new poster included, then swaps it in, so anyone currently reading the OLD board keeps seeing a clean, complete, unchanging view, never a half-nailed poster mid-update (CopyOnWriteArrayList: copy-on-write, snapshot iteration). And when the crew needs to signal thousands of scouts across an island at once, Franky doesn\'t assign each one a bunk on the ship (an OS thread) — he hands out cheap grappling hooks by the thousand (virtual threads); a scout dangling on a hook, WAITING for a signal, costs the ship almost nothing, and only needs one of the ship\'s few actual winches (a carrier/OS thread) the moment they\'re genuinely hauling something. But if a scout grabs a winch and refuses to let go while still just hanging there waiting (a synchronized block held while blocked on something else), that winch stays stuck with them the whole time — pinned, unusable by anyone else — which is why Franky\'s new rule is to use the quick-release clamps (ReentrantLock) instead of the old fixed grip (synchronized) for exactly that situation.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The whiteboard\'s marked-off sections, the Rock-Paper-Scissors-Lizard-Spock clicker, the freshly reprinted Wall of Shame, and Comic-Con\'s badge army',
      text: 'The apartment used to have ONE marker rule for the whole whiteboard — whoever wanted to write ANYTHING, even in a totally unrelated corner, had to wait for whoever currently held the marker (a single-lock synchronizedMap: safe, but everyone serializes behind one lock regardless of which section they actually needed). Sheldon\'s revised Roommate Agreement divides the board into independently-claimable zones — the physics zone, the chore-chart zone, the D&D-schedule zone — so Leonard updating the chore chart never has to wait for Sheldon mid-equation in the physics zone, only colliding if they somehow reach for the exact same square (ConcurrentHashMap: locking only the specific section being touched). For tracking the running Rock-Paper-Scissors-Lizard-Spock score, nobody touches the marker system at all — there\'s a mechanical clicker that only advances if it currently shows the number you expect; if someone else already clicked it, you re-check and try again (compare-and-swap: AtomicInteger, retry instead of waiting for a lock). Sheldon\'s Wall of Shame works differently: every time a new embarrassing photo is added, he doesn\'t pin it onto the existing frame — he has the WHOLE frame reprinted fresh with the new photo included, then hangs the new one in place of the old, so anyone already looking at the old frame keeps seeing a clean, complete, unchanging picture, never a half-finished collage (CopyOnWriteArrayList: copy-on-write, safe snapshot viewing). And when Sheldon volunteers the group to staff Comic-Con registration, he doesn\'t assign each of the thousands of attendees a dedicated staff member (an OS thread) — he hands out cheap temporary badges by the thousand (virtual threads); an attendee just standing in line, WAITING, costs the convention almost nothing, and only needs one of the handful of actual staff radios (a carrier/OS thread) the instant they\'re genuinely being helped. But if a volunteer keys their radio and just holds the button down while doing something else entirely unrelated (a synchronized block held while blocked on something else), that radio is stuck with them the whole time — pinned, useless to anyone else — which is exactly why the new house rule is to use the walkie-talkies with the quick-release button (ReentrantLock) instead of the old stuck-key model (synchronized) for that specific situation.',
    },
    why: 'The sectioned ledger/whiteboard is ConcurrentHashMap: fine-grained, per-section locking instead of one lock for the whole structure, plus atomic putIfAbsent/computeIfAbsent/merge operations a plain HashMap can\'t offer safely under concurrency. The vote-die/RPSLS clicker that only advances on a match is an Atomic class built on compare-and-swap: lock-free, retry-on-conflict instead of block-and-wait. The freshly reprinted wanted board/Wall of Shame is CopyOnWriteArrayList: every write copies the whole structure and swaps it in, so readers always see a clean, unchanging snapshot with zero synchronization needed to iterate safely. And Franky\'s grappling-hook army / Comic-Con\'s badge army is virtual threads: cheap enough to hand out by the millions for I/O-bound waiting, multiplexed onto a small pool of real carrier threads — but a scout/volunteer who holds a fixed grip (synchronized) while otherwise idle pins a real winch/radio the whole time, which is exactly the pinning gotcha ReentrantLock avoids.'
  },
  storyAnim: {
    title: 'Sectioned ledger, the vote-die, the fresh reprint, and the hook army',
    h: 320,
    props: [
      { id: 'onelock', emoji: '🔒', label: 'old way: ONE lock for the WHOLE ledger — everyone waits, even on unrelated pages', x: 8, y: 10 },
      { id: 'sections', emoji: '📖', label: 'new way: sections lock independently (ConcurrentHashMap)', x: 30, y: 10 },
      { id: 'die', emoji: '🎲', label: 'vote-die: advances only if it still shows the expected number (CAS)', x: 52, y: 10 },
      { id: 'board', emoji: '📋', label: 'wanted board: fully reprinted fresh on every change (CopyOnWriteArrayList)', x: 74, y: 10 },
      { id: 'hooks', emoji: '🪝', label: 'thousands of cheap grappling hooks — one per scout (virtual threads)', x: 30, y: 50 },
      { id: 'winch', emoji: '⚙️', label: 'only a few real winches shared by everyone (carrier/OS threads)', x: 52, y: 50 },
      { id: 'pin', emoji: '📌', label: 'holding the winch while idle pins it — use quick-release instead (ReentrantLock)', x: 74, y: 50 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 20, y: 74 },
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 55, y: 74 }
    ],
    steps: [
      { c: 'The old ledger has ONE lock for everything — even writing to an unrelated page means waiting your turn behind everyone else. Safe, but everyone serializes.', p: { onelock: 'bad' }, a: { nami: [20, 26] } },
      { c: 'Nami\'s fix: split the ledger into independently-locked sections. Two crewmates on DIFFERENT sections never wait on each other. That\'s ConcurrentHashMap.', p: { sections: 'good' } },
      { c: 'For a running vote tally, skip the ledger entirely — a die only advances if it currently shows the number you expect, otherwise you re-check and try again. That\'s an Atomic class using compare-and-swap.', p: { die: 'lit' } },
      { c: 'The wanted board is different again: every new poster means a WHOLE fresh board gets printed and swapped in, so readers always see a clean, unchanging view. That\'s CopyOnWriteArrayList.', p: { board: 'good' } },
      { c: 'Franky hands out thousands of cheap grappling hooks — one per scout, costing almost nothing while they just wait. That\'s a virtual thread per task.', p: { hooks: 'good' }, a: { franky: [30, 60] } },
      { c: 'Only a handful of real winches exist, shared across everyone actually hauling right now — a scout waiting on a hook needs no winch at all. That\'s the small pool of carrier threads.', p: { winch: 'lit' } },
      { c: 'But a scout who grabs a winch with a fixed grip and doesn\'t let go — even while just idly waiting — pins that winch the whole time. Use the quick-release clamp instead. That\'s the pinning gotcha and ReentrantLock.', p: { pin: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'From unsafe HashMap to lock-free atomics, copy-on-write, and virtual threads',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'ConcurrentHashMap',
        nodes: [
          { id: 'hashmapunsafe', text: 'plain HashMap: unsafe under\nconcurrent modification' },
          { id: 'finegrained', text: 'ConcurrentHashMap: locks per\nbucket, not the whole map' },
          { id: 'atomicops', text: 'putIfAbsent / computeIfAbsent / merge\nare atomic compound ops' }
        ]
      },
      {
        label: 'Atomic classes',
        nodes: [
          { id: 'cas', text: 'compare-and-swap: update only if\nvalue still matches expected' },
          { id: 'lockfree', text: 'lock-free: retry on conflict,\nnever BLOCKED waiting' }
        ]
      },
      {
        label: 'CopyOnWriteArrayList',
        nodes: [
          { id: 'copyonwrite', text: 'every write copies the WHOLE\narray, then swaps the reference' },
          { id: 'snapshotread', text: 'iterators see a stable snapshot —\nno ConcurrentModificationException' }
        ]
      },
      {
        label: 'Virtual threads',
        nodes: [
          { id: 'cheapthreads', text: 'JVM-managed, kilobytes not megabytes —\nmillions are realistic' },
          { id: 'unmount', text: 'unmounts from carrier on blocking I/O,\nremounts when ready' },
          { id: 'iobound', text: 'wins for I/O-bound work;\nno benefit for CPU-bound work' }
        ]
      },
      {
        label: 'Same correctness rules, one new gotcha',
        nodes: [
          { id: 'samecorrectness', text: 'races/deadlock rules unchanged —\nonly thread COST changed' },
          { id: 'pinning', text: 'synchronized pins a virtual thread\nto its carrier — prefer ReentrantLock' }
        ]
      }
    ],
    steps: [
      { active: ['hashmapunsafe'], note: 'A plain HashMap makes no concurrency guarantees at all — concurrent modification can corrupt its internal structure, not just throw an exception.' },
      { active: ['finegrained'], note: 'ConcurrentHashMap locks at the bucket level internally, so threads touching different keys proceed without blocking each other — unlike a single-lock synchronizedMap.' },
      { active: ['atomicops'], note: 'putIfAbsent, computeIfAbsent, and merge are single atomic operations — safe under concurrent calls on the same key, unlike separate containsKey+put calls.' },
      { active: ['cas'], note: 'Compare-and-swap updates a value only if it still matches an expected value, reporting success or failure — the hardware primitive atomic classes are built on.' },
      { active: ['lockfree'], note: 'A failed CAS just retries the read-compute-CAS sequence in a loop — no thread is ever parked BLOCKED waiting for a lock to release.' },
      { active: ['copyonwrite'], note: 'Every mutation on a CopyOnWriteArrayList copies the entire backing array and atomically swaps in the new one — O(n) per write, regardless of write size.' },
      { active: ['snapshotread'], note: 'An iterator captures a reference to the array at creation time and keeps reading that same snapshot — safe, but it will not reflect writes that happen after iteration starts.' },
      { active: ['cheapthreads'], note: 'Virtual threads are managed by the JVM, not the OS, and cost kilobytes rather than megabytes — realistically supporting millions concurrently, not thousands.' },
      { active: ['unmount'], note: 'A virtual thread unmounts from its carrier OS thread the instant it blocks on I/O, freeing that carrier for other virtual threads, then remounts once ready to continue.' },
      { active: ['iobound'], note: 'This benefits I/O-bound workloads specifically — CPU-bound work has no idle waiting to reclaim, so a bounded platform-thread pool remains the right tool there.' },
      { active: ['samecorrectness'], note: 'Every race-condition, synchronized, and deadlock rule from threads-basics applies identically to virtual threads — only the cost of having many threads changed.' },
      { active: ['pinning'], note: 'A virtual thread executing a synchronized block stays pinned to its carrier for the duration, even if it blocks on I/O inside — prefer ReentrantLock in that situation to avoid pinning.' }
    ]
  },
  tech: [
    {
      q: 'Why is a plain HashMap unsafe under concurrent access, and precisely how does ConcurrentHashMap improve on wrapping a HashMap with Collections.synchronizedMap?',
      a: 'A plain HashMap provides absolutely no concurrency guarantees — it was designed purely for single-threaded use, and concurrent structural modification (two threads calling put() at the same time, especially if either triggers a resize) can corrupt its internal bucket/bin structure outright, not merely throw a detectable exception; in some historical JDK versions, concurrent resizing could even produce an infinite loop that pegs a CPU core permanently. Collections.synchronizedMap(new HashMap<>()) fixes the memory-safety problem by wrapping every single method call with synchronization on one shared lock object, which does make it safe to call from multiple threads — but that safety comes at the cost of serializing ALL access through that ONE lock, meaning two threads working on completely unrelated keys still fully contend with each other on every operation, turning the map into a throughput bottleneck under real concurrent load, exactly analogous to the "protect the smallest necessary section" principle from the threads-basics synchronized discussion, violated at the whole-map scale. ConcurrentHashMap solves both problems simultaneously: internally, it uses fine-grained locking — conceptually, locking only the specific bucket being read or modified rather than the entire map — so operations on different keys proceed fully concurrently with no contention at all, and only genuinely colliding operations on the SAME bucket ever wait on each other. Beyond the locking granularity improvement, ConcurrentHashMap also exposes atomic COMPOUND operations that neither a plain HashMap nor a synchronizedMap can offer safely without extra external locking: putIfAbsent(k, v) performs "insert only if the key is currently absent" as one indivisible step (doing the equivalent containsKey-then-put as two separate calls is itself a check-then-act race condition under concurrency), computeIfAbsent(k, fn) guarantees the supplied function runs AT MOST ONCE per key even if multiple threads call it concurrently for that same key, and merge(k, v, fn) performs an atomic read-modify-write update — the same tool the maps-deep-dive lesson introduced for counting/aggregating by key, now safe to call from many threads on the same key without losing updates the way an unsynchronized get-then-put sequence would.'
    },
    {
      q: 'Explain compare-and-swap (CAS) in detail, and describe exactly why atomic classes built on it are called "lock-free" rather than simply "faster synchronized."',
      a: 'Compare-and-swap is a hardware-level atomic instruction with the semantics: "update this memory location to a NEW value, but only if it CURRENTLY still holds the EXPECTED value I\'m providing; report back whether the update actually happened." A thread using an AtomicInteger to increment a counter internally performs a loop: read the current value, compute the desired new value (current + 1), then attempt a CAS passing both the value it originally read (as the expected value) and the computed new value; if no other thread modified the counter in between the read and the CAS attempt, the CAS succeeds atomically in one hardware operation and the thread is done; if another thread DID modify it in between, the CAS fails (because the actual current value no longer matches what this thread read earlier), and the thread simply RE-READS the now-current value and retries the entire sequence, typically looping only a handful of times before succeeding even under real contention. The critical distinction from synchronized: a thread whose CAS attempt fails is NEVER placed into the BLOCKED thread-dump state waiting for a lock to be released by another thread — there is no OS-level scheduling involved in a failed CAS attempt at all, the thread simply loops and retries entirely within its own execution, without ever yielding control or being parked by the scheduler. This is precisely why the term is "lock-free" rather than merely "a faster lock": no lock object is involved anywhere in the mechanism, no thread ever waits on another thread\'s explicit release of anything, and — importantly — there is no possibility of one thread holding something and never releasing it (a lock-holder that dies or hangs mid-critical-section can, in principle, block every other thread forever; a CAS-based retry loop has no equivalent single point of failure, since there\'s nothing to "hold"). The tradeoff that keeps this from being universally superior to synchronized: CAS only atomically updates a SINGLE memory location at a time, so it works cleanly for one counter or one reference, but the moment correctness requires multiple related fields to change together as one atomic unit, there is no way to CAS several independent locations in one indivisible step, and synchronized (or a purpose-built concurrent collection\'s internal atomicity) becomes necessary again.'
    },
    {
      q: 'Explain how CopyOnWriteArrayList achieves thread-safe iteration without locking readers, what its snapshot semantics actually mean in practice, and when it is the wrong choice.',
      a: 'CopyOnWriteArrayList\'s core mechanism is exactly what its name states: every mutating operation — add, remove, set, or any structural change — allocates an entirely NEW backing array, copies every existing element into it along with the requested change, and then atomically swaps an internal reference to point readers at the new array instead of the old one; the OLD array is left completely untouched and simply becomes eligible for garbage collection once nothing references it anymore. This design has a direct, powerful consequence for iteration: an iterator obtained via iterator() (or the enhanced for-loop, which uses it implicitly) captures a reference to whichever backing array existed at the moment the iterator was created, and it continues reading from THAT SAME array for its entire lifetime, completely unaffected by any concurrent writes that happen afterward on other threads — which means iterating a CopyOnWriteArrayList never throws ConcurrentModificationException (the collections-lists lesson\'s fail-fast ArrayList behavior) and requires no external synchronization to iterate safely, because there is structurally no way for a write to corrupt or interleave with an in-progress read of an already-captured array. The practical implication worth internalizing explicitly: an iterator started before a concurrent write will NOT see that write\'s effects, even if the write completes before the iterator finishes — this is a genuine snapshot-as-of-iterator-creation-time semantic, not "eventually consistent" or "sometimes sees new writes," and code relying on an in-progress iteration to observe a concurrent update elsewhere needs a different tool entirely. The cost that makes this the wrong choice for many use cases: every single write is an O(n) operation (copying the entire array, regardless of whether the actual change was adding one element to a million-element list), so a CopyOnWriteArrayList subjected to frequent concurrent writes will burn substantial CPU and memory churning through full-array copies — it is a deliberately specialized tool for lists that are read constantly, by many threads, but modified only occasionally (event listener lists, active-configuration snapshots, connected-client rosters), and a poor choice for anything resembling a write-heavy queue or frequently-mutated collection, where a genuinely different concurrent structure (or external synchronization around a plain ArrayList) is more appropriate.'
    },
    {
      q: 'Explain precisely what a virtual thread is, why it targets I/O-bound workloads specifically, and describe the pinning gotcha in detail.',
      a: 'Every thread used in the threads-basics and executors-futures lessons is a PLATFORM thread — a thin JVM wrapper around one real, dedicated OS thread, carrying that OS thread\'s full memory footprint (a stack, typically several hundred kilobytes to a megabyte) and full OS-level scheduling overhead, which is exactly why executors-futures introduced bounded thread pools rather than creating one platform thread per task. A virtual thread, introduced as a stable feature in Java 21 via Project Loom, is a fundamentally different implementation: it is scheduled and managed entirely by the JVM rather than the OS, has a dramatically smaller footprint (kilobytes rather than megabytes, since its stack can grow and shrink and doesn\'t require a fixed OS-level reservation), and is cheap enough that running MILLIONS of them concurrently in a single JVM process is realistic, not thousands. Virtual threads are created directly via Thread.ofVirtual().start(runnable) or, far more commonly in application code, via Executors.newVirtualThreadPerTaskExecutor(), an ExecutorService that deliberately creates a brand-new virtual thread for every single submitted task — reviving the exact "one thread per task" pattern that executors-futures explicitly steered away from for platform threads, because for virtual threads specifically, that pattern is now both cheap and the RECOMMENDED style. The mechanism explaining why this targets I/O-bound work: many virtual threads share a comparatively small pool of real OS "carrier" threads underneath, and the instant a virtual thread performs a blocking I/O operation (a network call, a database query, a file read — anything that would otherwise tie up a whole OS thread doing nothing productive but waiting), the JVM automatically UNMOUNTS that virtual thread from its carrier, freeing the carrier immediately to run a completely different virtual thread in the meantime, and later re-mounts the original virtual thread onto whatever carrier is available once its I/O actually completes — letting a small number of real OS threads transparently service a vastly larger number of virtual threads that are mostly just waiting. This is why virtual threads offer essentially zero benefit for CPU-BOUND work: a computation that never blocks on I/O never triggers the unmount mechanism at all, so there\'s no idle waiting time to reclaim, and a properly-sized bounded platform-thread pool (matched to available CPU cores) remains the correct tool for that workload shape. The pinning gotcha is the one genuinely new hazard virtual threads introduce: when a virtual thread executes code inside a synchronized block or method, the JVM currently CANNOT unmount it from its carrier for the duration of that block, even if the virtual thread then blocks on I/O while still inside it — the virtual thread stays "pinned," and its carrier thread is stuck sitting idle right alongside it, unable to serve any other virtual thread, for as long as the pin lasts. With a very large number of virtual threads and only a small, fixed pool of carriers, many simultaneous pins (from many virtual threads all executing a shared synchronized-and-blocking-I/O code path at once) can exhaust the entire carrier pool and stall the whole application\'s progress — a variant of the exact thread-pool-exhaustion symptom the jvm-tools-reflection lesson\'s thread-dump reading covered, just with virtual threads pinned to carriers instead of platform threads directly blocked. The practical mitigation is to prefer java.util.concurrent.locks.ReentrantLock over synchronized specifically in code paths that both run on virtual threads and perform blocking I/O inside the locked section, since ReentrantLock provides the identical mutual-exclusion correctness guarantee without triggering the pinning behavior.'
    }
  ],
  code: {
    title: 'ConcurrentHashMap merge, an AtomicInteger race-free counter, and virtual threads for I/O-bound work',
    intro: 'A tag-count map updated concurrently via merge(), an AtomicInteger counter compared to threads-basics\' synchronized version, and Executors.newVirtualThreadPerTaskExecutor() running many I/O-simulating tasks cheaply.',
    code: `import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ConcurrentToolsDemo {
    public static void main(String[] args) throws Exception {
        // --- ConcurrentHashMap: safe, atomic merge() from many threads on overlapping keys ---
        ConcurrentHashMap<String, Integer> tagCounts = new ConcurrentHashMap<>();
        List<String> tagsSeen = List.of("flaky", "ci", "flaky", "junit", "flaky", "ci");
        try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
            for (String tag : tagsSeen) {
                pool.submit(() -> tagCounts.merge(tag, 1, Integer::sum));  // atomic read-modify-write per key
            }
            pool.shutdown();
            pool.awaitTermination(5, TimeUnit.SECONDS);
        }
        System.out.println("tag counts: " + tagCounts);   // {flaky=3, ci=2, junit=1} -- always exact, never lost

        // --- AtomicInteger: lock-free counter, no synchronized needed ---
        AtomicInteger hits = new AtomicInteger(0);
        Runnable incrementTask = () -> {
            for (int i = 0; i < 100_000; i++) hits.incrementAndGet();   // CAS-based, no BLOCKED threads
        };
        Thread t1 = new Thread(incrementTask);
        Thread t2 = new Thread(incrementTask);
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println("atomic hits (always exactly 200000): " + hits.get());

        // --- Virtual threads: cheap enough to spin up one per "request" that blocks on I/O ---
        try (ExecutorService virtualPool = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<String>> results = new java.util.ArrayList<>();
            for (int i = 0; i < 1000; i++) {
                int requestId = i;
                results.add(virtualPool.submit(() -> {
                    Thread.sleep(10);   // simulates a blocking I/O call -- the virtual thread unmounts here
                    return "handled request " + requestId;
                }));
            }
            System.out.println("first result: " + results.get(0).get());
            System.out.println("total requests handled: " + results.size());
        }
    }
}`,
    notes: [
      'tagCounts.merge(tag, 1, Integer::sum) is safe to call from many threads concurrently on the SAME key — a plain HashMap doing get-then-put for the same logic would lose updates exactly like the threads-basics count++ race.',
      'hits.incrementAndGet() replaces threads-basics\' synchronized SafeCounter entirely — same correctness guarantee (always exactly 200000), no lock, no BLOCKED thread state ever entered.',
      '1000 virtual threads each "blocking" for 10ms would tie up 1000 platform threads for that whole duration if run on a fixed pool; on a virtual-thread-per-task executor, the JVM unmounts each one during its sleep and reuses a small number of real carrier threads underneath. Both try-with-resources blocks rely on ExecutorService\'s AutoCloseable support (Java 19+) to shut the pool down automatically.'
    ]
  },
  lab: {
    title: 'Count tags safely from many threads with ConcurrentHashMap.merge',
    prompt: 'Write a class <code>TagCounter</code> with a <code>private final ConcurrentHashMap&lt;String, Integer&gt; counts = new ConcurrentHashMap&lt;&gt;();</code> field and a method <code>void record(String tag)</code> that atomically increments that tag\'s count using <code>counts.merge(tag, 1, Integer::sum)</code>. Write a <code>main</code> method that creates a fixed thread pool of size 4, submits 100 tasks that each call <code>record("flaky")</code>, waits for all tasks to finish (shutdown + awaitTermination), and prints <code>counts.get("flaky")</code> — it must always print exactly <code>100</code>.',
    starter: `import java.util.concurrent.*;

class TagCounter {
    private final ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();

    void record(String tag) {
        // atomically increment counts for this tag using merge
    }

    public static void main(String[] args) throws InterruptedException {
        TagCounter counter = new TagCounter();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 100; i++) {
            pool.submit(() -> counter.record("flaky"));
        }
        // shut the pool down, wait for termination, then print counter.counts.get("flaky") -- must be 100
    }
}`,
    checks: [
      { re: 'ConcurrentHashMap<\\s*String\\s*,\\s*Integer\\s*>', must: true, hint: 'counts must be declared as a ConcurrentHashMap<String, Integer>.', pass: 'ConcurrentHashMap declared ✓' },
      { re: 'counts\\.merge\\(\\s*tag\\s*,\\s*1\\s*,\\s*Integer::sum\\s*\\)', must: true, hint: 'record(tag) must call counts.merge(tag, 1, Integer::sum).', pass: 'merge used for atomic increment ✓' },
      { re: 'Executors\\.newFixedThreadPool\\(\\s*4\\s*\\)', must: true, hint: 'main must create a fixed pool of size 4.', pass: 'fixed pool of size 4 ✓' },
      { re: 'pool\\.shutdown\\s*\\(\\s*\\)', must: true, hint: 'Shut the pool down with pool.shutdown().', pass: 'pool.shutdown() called ✓' },
      { re: 'awaitTermination', must: true, hint: 'Call pool.awaitTermination(...) to wait for all submitted tasks to finish before reading the result.', pass: 'awaitTermination used ✓' },
      { re: 'synchronized', must: false, hint: 'No synchronized keyword needed at all -- ConcurrentHashMap.merge is already atomic on its own.', pass: 'no unnecessary synchronized ✓' }
    ],
    run: 'javac TagCounter.java && java TagCounter — run it several times; it must always print exactly 100, with no synchronized keyword anywhere in the class.',
    solution: `import java.util.concurrent.*;

class TagCounter {
    private final ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();

    void record(String tag) {
        counts.merge(tag, 1, Integer::sum);
    }

    public static void main(String[] args) throws InterruptedException {
        TagCounter counter = new TagCounter();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 100; i++) {
            pool.submit(() -> counter.record("flaky"));
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println(counter.counts.get("flaky"));   // always exactly 100
    }
}`,
    notes: [
      'counts.merge(tag, 1, Integer::sum) is atomic per key — 100 concurrent calls for the same "flaky" key always sum to exactly 100, with no lost updates and no synchronized keyword written anywhere.',
      'awaitTermination(5, TimeUnit.SECONDS) is essential before reading counts.get("flaky") — without it, main could read the result before all 100 submitted tasks have actually run, printing a number less than 100 even though merge() itself is perfectly safe.',
      'Try the experiment of replacing ConcurrentHashMap with a plain HashMap and merge with an unsynchronized get-then-put sequence to see the exact same class of lost-update bug threads-basics demonstrated with count++.'
    ]
  },
  quiz: [
    {
      q: 'Why is Collections.synchronizedMap(new HashMap<>()) safe but potentially a throughput bottleneck compared to ConcurrentHashMap?',
      options: ['synchronizedMap wraps every operation with ONE shared lock, so even threads working on completely unrelated keys serialize behind it; ConcurrentHashMap uses fine-grained locking so only threads colliding on the same bucket actually contend', 'synchronizedMap does not actually prevent concurrent modification exceptions', 'ConcurrentHashMap does not support the same methods as HashMap', 'There is no real difference; both use identical locking internally'],
      correct: 0,
      explain: 'synchronizedMap uses a single lock for the entire map, so all operations from all threads serialize regardless of which keys are involved. ConcurrentHashMap locks at a much finer granularity (conceptually per-bucket), letting threads on different keys proceed without blocking each other.'
    },
    {
      q: 'What does compare-and-swap (CAS), the mechanism behind AtomicInteger, actually do?',
      options: ['It atomically updates a memory location to a new value ONLY if it currently still holds an expected value, reporting success or failure — a failed attempt retries rather than blocking', 'It acquires a lock, performs the update, and releases the lock, just like synchronized', 'It permanently locks the variable so no other thread can ever read or write it again', 'It rounds the value to the nearest valid CPU register size before updating'],
      correct: 0,
      explain: 'CAS is a hardware instruction: update a location to newValue only if it still equals expectedValue, and report whether that succeeded. A thread whose CAS fails simply re-reads the current value and retries — no lock is acquired and no thread is ever BLOCKED waiting.'
    },
    {
      q: 'An iterator is created over a CopyOnWriteArrayList, and then another thread adds a new element to the list. What does the in-progress iterator see?',
      options: ['The iterator continues over the snapshot array it captured when created and does NOT see the new element, with no ConcurrentModificationException thrown', 'It throws ConcurrentModificationException, just like a plain ArrayList would', 'It immediately reflects the new element mid-iteration', 'The iteration silently restarts from the beginning'],
      correct: 0,
      explain: 'CopyOnWriteArrayList\'s writes copy the entire backing array and swap in the new one; an already-created iterator keeps reading the OLD array it captured, so it sees a stable, unchanging snapshot and simply does not observe writes that happen after iteration begins — with no exception thrown.'
    },
    {
      q: 'Why do virtual threads specifically benefit I/O-bound workloads rather than CPU-bound ones?',
      options: ['A virtual thread unmounts from its carrier OS thread the instant it blocks on I/O, freeing the carrier for other virtual threads — CPU-bound work never blocks, so there is no idle time to reclaim this way', 'Virtual threads execute CPU instructions faster than platform threads', 'CPU-bound work is not permitted to run on virtual threads at all', 'Virtual threads eliminate the need for a JIT compiler on CPU-bound code'],
      correct: 0,
      explain: 'The core mechanism is unmounting a virtual thread from its carrier during blocking I/O so the carrier can serve other virtual threads. CPU-bound work has no blocking/idle time to reclaim this way, so a properly sized platform-thread pool remains the right tool there.'
    },
    {
      q: 'What is the "pinning" gotcha with virtual threads, and what is the recommended mitigation?',
      options: ['A virtual thread executing a synchronized block stays pinned to its carrier thread for that block\'s duration, even if it blocks on I/O inside it — prefer java.util.concurrent.locks.ReentrantLock in that situation, since it does not pin', 'Virtual threads can never use any form of locking at all', 'Pinning means a virtual thread permanently occupies 100% CPU on its carrier', 'Pinning only happens when more than 1000 virtual threads exist simultaneously'],
      correct: 0,
      explain: 'A synchronized block currently prevents the JVM from unmounting a virtual thread from its carrier for that block\'s duration, even across blocking I/O inside it — tying up the carrier the whole time. ReentrantLock provides the same mutual-exclusion guarantee without this pinning behavior.'
    }
  ],
  testFlow: {
    title: 'Test yourself: concurrent collections, atomics, and virtual threads under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A service uses a plain HashMap, shared across request-handling threads, to cache computed results, protected by nothing (no synchronized, no wrapper). Under load testing with many concurrent requests, it occasionally throws bizarre exceptions or even hangs. What\'s the most direct fix?',
        choices: [
          { text: 'Replace the plain HashMap with a ConcurrentHashMap — it is safe for concurrent access without external synchronization and uses fine-grained locking so unrelated keys don\'t contend', to: 'q1_right' },
          { text: 'Increase the HashMap\'s initial capacity so it never needs to resize under load', to: 'q1_wrong_capacity' },
          { text: 'Switch every request-handling thread to use the same Runnable instance instead of separate instances', to: 'q1_wrong_runnable' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — a plain HashMap provides zero concurrency guarantees and concurrent modification can corrupt its internal structure or, in some cases, hang. ConcurrentHashMap is purpose-built for exactly this shared-cache-across-threads scenario, with fine-grained internal locking so unrelated keys never block each other.', next: 'q2' },
      q1_wrong_capacity: { end: true, correct: false, text: 'A larger initial capacity reduces how OFTEN a resize happens, but it doesn\'t make concurrent modification safe — even without any resize at all, two threads calling put() concurrently on a plain HashMap can still corrupt its bucket structure. The fix has to be a concurrency-safe map, not a capacity tweak.', retry: 'q1' },
      q1_wrong_runnable: { end: true, correct: false, text: 'Which Runnable instance is used has nothing to do with the underlying HashMap\'s thread-safety — the defect is the shared, unsynchronized HashMap itself being accessed concurrently, regardless of how the request-handling tasks are structured or shared.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A simple hit counter is incremented from many threads under high contention. Using AtomicInteger.incrementAndGet() instead of a synchronized increment() method changes what, exactly?',
        choices: [
          { text: 'It removes lock-based blocking — a thread whose compare-and-swap attempt fails just retries in a loop rather than entering the BLOCKED state waiting for another thread to release a lock; correctness (an always-accurate final count) is identical either way', to: 'q2_right' },
          { text: 'It makes the counter eventually consistent, so the final count may be slightly off under high contention', to: 'q2_wrong_consistency' },
          { text: 'It has no real effect; AtomicInteger internally just calls synchronized methods itself', to: 'q2_wrong_internal' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct — both approaches guarantee a perfectly accurate final count; the difference is purely mechanism and cost. synchronized blocks a contending thread until a lock is released; AtomicInteger\'s CAS-based approach retries in a tight loop with no thread ever parked waiting, which is typically cheaper under contention.', next: 'q3' },
      q2_wrong_consistency: { end: true, correct: false, text: 'AtomicInteger is fully atomic and provides an exactly-correct final count, not an approximate or "eventually consistent" one — every single incrementAndGet() call is guaranteed to be reflected exactly once in the final value, with no lost updates, identical in correctness to a properly synchronized counter.', retry: 'q2' },
      q2_wrong_internal: { end: true, correct: false, text: 'AtomicInteger does NOT use synchronized internally — it is built on the hardware compare-and-swap instruction, a genuinely lock-free mechanism where a failed update attempt retries instead of blocking on any lock. That\'s precisely what distinguishes it from a synchronized counter.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A web service migrates from a fixed platform-thread pool of 200 threads to Executors.newVirtualThreadPerTaskExecutor(), handling one virtual thread per incoming request. Most request handlers call a shared cache update guarded by a synchronized block, and that same code path also makes a slow downstream HTTP call while holding the lock. Under heavy load, what should you watch out for?',
        choices: [
          { text: 'Pinning: each virtual thread executing that synchronized block stays pinned to its carrier thread for the block\'s duration, even while blocked on the slow HTTP call inside it — with enough concurrent requests, this can exhaust the small carrier pool and stall the whole service', to: 'q3_right' },
          { text: 'Nothing — virtual threads eliminate all synchronization concerns automatically, so the synchronized block has no effect anymore', to: 'q3_wrong_eliminate' },
          { text: 'The cache update will silently stop being thread-safe once virtual threads are introduced, corrupting the cache', to: 'q3_wrong_unsafe' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — synchronized currently pins a virtual thread to its carrier for the block\'s duration, including through any blocking I/O performed inside it. Many virtual threads simultaneously pinned this way on a small carrier pool can exhaust it and stall progress across the whole service. The fix is to replace synchronized with ReentrantLock in that specific code path, since it provides the same correctness without pinning.', next: null },
      q3_wrong_eliminate: { end: true, correct: false, text: 'Virtual threads change thread COST, not concurrency correctness rules — synchronized still provides exactly the same mutual-exclusion guarantee it always did on a virtual thread. The actual new concern introduced by virtual threads here is pinning: that same synchronized block now also ties up a scarce carrier thread for its entire duration.', retry: 'q3' },
      q3_wrong_unsafe: { end: true, correct: false, text: 'The cache update remains just as thread-safe under virtual threads as it was under platform threads — synchronized\'s mutual-exclusion guarantee is unchanged. The actual risk introduced by virtual threads is a performance/availability one (pinning exhausting the carrier pool), not a correctness regression in the cache update itself.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Using a plain HashMap (even wrapped in Collections.synchronizedMap) as a shared cache under heavy concurrent read/write load — synchronizedMap is safe but serializes ALL access through one lock; ConcurrentHashMap\'s fine-grained locking is almost always the better choice for genuinely concurrent access.',
    'Doing "if (!map.containsKey(k)) map.put(k, v)" as two separate calls on a ConcurrentHashMap — this is still a check-then-act race even on a concurrent map; use the atomic putIfAbsent(k, v) instead.',
    'Reaching for AtomicInteger/AtomicLong when multiple related fields need to change together as one atomic unit — CAS only atomically updates a SINGLE memory location; compound multi-field updates still need synchronized or a lock.',
    'Using CopyOnWriteArrayList for a list with frequent writes — every write copies the entire backing array (O(n)), making it a poor fit for write-heavy workloads despite its safe, lock-free reads.',
    'Assuming virtual threads remove the need for synchronized, atomics, or concurrent collections — they change thread COST, not concurrency correctness; every race-condition and deadlock rule from threads-basics still applies exactly as before.',
    'Using synchronized (instead of ReentrantLock) around blocking I/O in code that runs on virtual threads — this pins the virtual thread to its carrier for the block\'s duration, and enough simultaneous pins can exhaust the small carrier pool and stall the whole application.'
  ],
  interview: [
    {
      q: 'Design a thread-safe, high-concurrency cache-population strategy: many threads may request the same not-yet-computed key simultaneously, and the expensive computation must run at most once per key. What would you use and why?',
      a: 'The right tool is a ConcurrentHashMap<K, V> combined with its computeIfAbsent(key, mappingFunction) method, which is specifically designed to guarantee the supplied mapping function is invoked AT MOST ONCE per key, even when multiple threads call computeIfAbsent concurrently for that exact same key — internally, ConcurrentHashMap\'s fine-grained per-bucket locking ensures that if two threads race to compute the same missing key, one of them wins and actually runs the (possibly expensive) computation while the other blocks briefly and then simply receives the winner\'s result once it\'s available, rather than both redundantly performing the expensive work. This is a meaningfully different and stronger guarantee than the naive alternative of "if (!cache.containsKey(k)) { V v = expensiveCompute(k); cache.put(k, v); }" on either a plain HashMap or even a ConcurrentHashMap used this way — that pattern is a textbook check-then-act race condition, where two threads can both observe the key as absent (since neither\'s put() has landed yet), both proceed to run the expensive computation redundantly, and one\'s result simply overwrites the other\'s, wasting the redundant computation entirely and potentially producing surprising behavior if the computation has side effects. One caveat worth stating explicitly in an interview: the mapping function passed to computeIfAbsent should be reasonably fast and, critically, must not itself attempt to modify the SAME ConcurrentHashMap (adding or removing other entries) from within the function, since ConcurrentHashMap explicitly documents that this can cause deadlock or undefined behavior — for a genuinely slow computation (a network call, a heavy calculation), a common refinement is to have computeIfAbsent store a CompletableFuture<V> representing the in-progress computation rather than the final value directly, so concurrent callers for the same key all receive the SAME in-flight future to await (via .join()) rather than one thread\'s call blocking others on the map itself for the computation\'s full duration.'
    },
    {
      q: 'Compare synchronized, AtomicInteger, and ConcurrentHashMap.merge() as three different ways to implement a thread-safe counter, and explain when each is the right choice.',
      a: 'All three genuinely solve the "increment a shared counter safely from multiple threads" problem correctly, but they differ in scope, mechanism, and the shape of state they\'re built for. A synchronized increment() method on a plain int field (the threads-basics approach) provides full mutual exclusion via a monitor lock — it\'s the most general tool, correctly extending to protect ANY compound operation on ANY amount of related state, including multiple fields that need to change together atomically, but it comes with the real cost of contending threads entering the BLOCKED state and waiting for the lock to be released, plus the ever-present risk of deadlock if that lock is ever combined inconsistently with others. AtomicInteger.incrementAndGet() is purpose-built for exactly the single-variable case: it uses compare-and-swap to update the counter lock-free, meaning a thread whose update attempt loses a race simply retries in a tight loop rather than blocking — this is typically both simpler to write correctly (there\'s no lock object to forget or misuse) and measurably faster under contention for this narrow single-variable case specifically, but it fundamentally cannot extend to updating multiple related fields as one atomic unit, since CAS only ever atomically touches one memory location. ConcurrentHashMap.merge(key, 1, Integer::sum) solves a related but distinct problem — not a single global counter, but MANY independent counters keyed by something (a per-tag count, a per-user request count), where merge() provides the same atomic-read-modify-write guarantee AtomicInteger gives for one variable, but scoped per-key inside a map, letting counters for different keys update fully concurrently without any contention between them, and consolidating what would otherwise require either a map of AtomicIntegers (with its own added complexity around initializing a new AtomicInteger the first time a key appears) or a synchronized block around the whole map. The choice in practice: synchronized for compound updates spanning multiple related fields or requiring coordination beyond a single value; AtomicInteger/AtomicLong for exactly one shared counter or reference; ConcurrentHashMap.merge for many independent, key-scoped counters or accumulations.'
    },
    {
      q: 'Explain how virtual threads change the tradeoffs around thread-per-request server design, contrasting with the executors-futures lesson\'s bounded-pool-plus-CompletableFuture approach, and where each remains the right choice.',
      a: 'Before virtual threads, handling a large volume of concurrent, I/O-heavy requests (each spending most of its time waiting on a database call, a downstream HTTP call, or similar) forced a real architectural choice: either use a small, bounded pool of expensive platform threads and write the request-handling logic as a non-blocking CompletableFuture pipeline (supplyAsync/thenApply/thenCompose chains, per executors-futures), which uses threads efficiently but requires structuring code around callbacks rather than simple sequential logic, adding real complexity (harder to read, harder to debug with a single coherent stack trace, easy to introduce subtle bugs like accidentally blocking inside an async callback) — or use one platform thread per request with ordinary sequential blocking code, which is far simpler to write and reason about but doesn\'t scale, since each blocked platform thread still fully consumes its OS-level memory and scheduling slot while just sitting idle waiting on I/O, capping realistic concurrency at perhaps a few thousand simultaneous requests before exhausting memory or OS thread limits. Virtual threads change this tradeoff fundamentally: because a virtual thread automatically unmounts from its shared carrier OS thread the moment it blocks on I/O (freeing that carrier to serve a different virtual thread in the meantime) and remounts once the I/O completes, you can now write completely ordinary, sequential, blocking-looking request-handling code — one virtual thread per request, via Executors.newVirtualThreadPerTaskExecutor() — and still scale to realistically millions of concurrent in-flight requests, because each idle-waiting virtual thread costs almost nothing while it waits, and the small number of real carrier threads underneath are only ever occupied by virtual threads that are ACTUALLY doing CPU work at that instant. This means, for I/O-bound server workloads specifically, virtual threads let you have both simplicity (sequential blocking code, normal stack traces, no callback pyramid) AND the scalability that used to require the CompletableFuture-pipeline approach — a genuine improvement, not merely a style preference. What does NOT change: for CPU-bound work (heavy in-memory computation with no blocking I/O to unmount during), virtual threads offer no scaling advantage at all, since there\'s no idle time for the JVM to reclaim by unmounting — a properly bounded platform-thread pool sized to the number of available CPU cores remains exactly the right tool there, same as before virtual threads existed; and every concurrency-correctness concern (races, the need for synchronized/atomics/concurrent collections around genuinely shared mutable state, deadlock from inconsistent lock ordering) applies completely unchanged to virtual-thread-per-request code, plus the added pinning consideration around synchronized blocks that also perform blocking I/O.'
    },
    {
      q: 'A colleague proposes replacing a CopyOnWriteArrayList of event listeners (added rarely at startup, iterated frequently on every event) with a plain ArrayList wrapped in Collections.synchronizedList for "consistency with the rest of the codebase." Evaluate this change.',
      a: 'This is very likely a real regression, not a neutral consistency improvement, and the core reason is a mismatch between the workload\'s actual read/write ratio and each collection\'s design intent. The described workload — listeners added rarely, essentially only at startup, but iterated on every single event, potentially from multiple threads processing events concurrently — is precisely the read-heavy, write-rare shape CopyOnWriteArrayList is purpose-built for: its writes are expensive (each one copies the entire backing array), but that cost is paid extremely infrequently here, while its reads (iteration) require zero locking overhead whatsoever and are guaranteed never to throw ConcurrentModificationException even if a listener happens to be added concurrently with an in-progress iteration elsewhere. Switching to Collections.synchronizedList(new ArrayList<>()) trades this for a fundamentally different profile: every single iteration now needs to either be manually wrapped in a synchronized(list) block for its full duration (synchronizedList\'s own documentation explicitly requires this for safe iteration, since the wrapper only synchronizes individual method calls, not the iterator\'s full traversal) or risk a ConcurrentModificationException / a race if a listener is added mid-iteration on another thread — and every event-processing thread iterating listeners now contends for that ONE shared lock, even though listener iteration was previously lock-free and could proceed on many threads fully in parallel with CopyOnWriteArrayList. In other words, the proposed change takes the (rare) write path from "occasionally expensive" to "still occasionally expensive but now also requires careful manual synchronization to use correctly" and takes the (frequent) read path from "lock-free and always safe" to "requires a shared lock on every access, and is easy to get wrong if the required manual synchronized-block-around-iteration is missed anywhere in the codebase." The right response is to push back on "consistency" as the deciding factor here: collection choice should follow the actual read/write shape of each specific use case, and this particular workload is close to the canonical textbook case CopyOnWriteArrayList exists to serve well — the "consistency" argument would be better served by documenting WHY this particular list uses CopyOnWriteArrayList (a short comment citing its read-heavy, write-rare access pattern) than by standardizing on a strictly worse tool for this specific case.'
    }
  ]
};
