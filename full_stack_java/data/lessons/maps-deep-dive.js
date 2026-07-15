window.LESSONS = window.LESSONS || {};
window.LESSONS['maps-deep-dive'] = {
  id: 'maps-deep-dive',
  title: 'Maps Deep Dive: HashMap, LinkedHashMap, TreeMap & EnumMap',
  category: 'Part 3 — Collections & Generics',
  timeMin: 55,
  summary: 'The most important collection to truly understand, because it is everywhere and because interviews probe it relentlessly. You will see how HashMap actually works inside — buckets, hashing, collision chains, treeification, and resizing — which is where the Part 1 equals/hashCode contract finally pays off in full. Then the four Map implementations you must be able to choose between on demand: HashMap (fast, unordered), LinkedHashMap (insertion- or access-ordered, the LRU-cache tool), TreeMap (sorted, log-time, range queries), and EnumMap (tiny and blazing for enum keys). Plus the modern Map methods (getOrDefault, computeIfAbsent, merge) that make map code clean, and the null and mutation gotchas.',
  goals: [
    'Explain HashMap internals — hashCode → bucket, equals within a bucket, collision chains, treeification, load factor and resizing',
    'Connect the equals/hashCode contract from Part 1 to why a broken key silently fails in a HashMap',
    'Choose correctly among HashMap, LinkedHashMap, TreeMap, and EnumMap by ordering, performance, and key type',
    'Use LinkedHashMap access-order to build an LRU cache, and TreeMap for sorted/range queries',
    'Write clean map code with getOrDefault, computeIfAbsent, and merge, and avoid the null-key/value and mutable-key traps'
  ],
  concept: [
    {
      h: 'How HashMap works: buckets, hashing, and equals',
      p: [
        'A <code>HashMap</code> is an array of <b>buckets</b>. To store <code>put(key, value)</code>, it computes the key\'s <code>hashCode()</code>, spreads the bits (an internal mixing step to reduce clustering), and takes that modulo the array size to pick a bucket index — then stores the entry there. To <code>get(key)</code>, it does the SAME computation to jump straight to the bucket, then walks that bucket comparing with <code>equals()</code> to find the exact key. This two-step — <b>hashCode to find the bucket, equals to confirm the key</b> — is the whole reason lookup is O(1) on average: you don\'t scan the map, you jump to one small bucket and check a few entries.',
        'When two different keys land in the same bucket (a <b>collision</b> — inevitable, since infinitely many objects map to finitely many buckets), the entries form a chain in that bucket. Historically a linked list; since Java 8, once a single bucket\'s chain grows past a threshold (8 entries, with the table large enough), it <b>treeifies</b> into a balanced red-black tree so that even a pathological all-collide case degrades to O(log n) rather than O(n). This is a real defense — it hardened HashMap against hash-collision denial-of-service attacks. The average case stays O(1); the worst case is now O(log n), not O(n).'
      ]
    },
    {
      h: 'Load factor, resizing, and why the equals/hashCode contract is load-bearing',
      p: [
        'A HashMap can\'t let buckets grow without bound or lookups slow down, so it tracks a <b>load factor</b> (default 0.75). When the number of entries exceeds capacity × load factor, it <b>resizes</b>: allocates a bucket array twice as large and <b>rehashes</b> every entry into the new, bigger table. Resizing is O(n) but rare (amortized away), and it keeps buckets short. The 0.75 default is a tuned tradeoff — lower wastes space, higher lengthens chains. If you know you\'ll insert N entries, constructing <code>new HashMap&lt;&gt;(expectedCapacity)</code> avoids repeated resizes (pass roughly N / 0.75).',
        'Here is where Part 1 comes due. A HashMap finds keys by hashCode-then-equals, so the <b>equals/hashCode contract is not optional — it is what makes the map work.</b> If you override <code>equals</code> but NOT <code>hashCode</code>, two "equal" keys can produce different hashCodes, land in different buckets, and the map looks in the wrong bucket — your key is stored yet unfindable (the exact "lost key" bug from the strings-equals-hashcode lesson). If your key\'s hashCode changes while it\'s in the map (a MUTABLE field used in hashCode), the entry sits in its old bucket while lookups compute the new bucket and miss — lost again. This is why <b>keys should be immutable</b> and why <code>String</code> (immutable, caches its hash) is the ideal key. Every map you use rides on this contract holding.'
      ]
    },
    {
      h: 'The four implementations: order, speed, and key type',
      p: [
        '<b>HashMap</b> — the default. O(1) average get/put, but NO order guarantee: iterate it and entries come out in an arbitrary, unstable order. Allows one null key and null values. Use it unless you need ordering or sorting.',
        '<b>LinkedHashMap</b> — a HashMap that also threads a doubly-linked list through its entries to remember order. By default that\'s <b>insertion order</b> (iterate in the order you added keys — predictable, great for stable output). Constructed with <code>accessOrder=true</code>, it becomes <b>access-ordered</b> (every get/put moves the key to the end), and overriding <code>removeEldestEntry</code> turns it into a ready-made <b>LRU cache</b> — the least-recently-used key is at the front, evicted first (this is exactly the bounded-cache fix from the GC lesson). Slightly more memory than HashMap for the linkage; still O(1).',
        '<b>TreeMap</b> — keeps keys SORTED (by their natural <code>Comparable</code> order, or a <code>Comparator</code> you supply). get/put/remove are O(log n) (it\'s a red-black tree), not O(1) — the price of sorted order. Its superpower is RANGE queries and navigation: <code>firstKey</code>, <code>lastKey</code>, <code>floorKey</code>, <code>ceilingKey</code>, <code>headMap</code>, <code>tailMap</code>, <code>subMap</code> — "all entries between X and Y," "the largest key ≤ K." Does NOT allow a null key (it must compare keys). Use it when you need sorted iteration or range lookups.',
        '<b>EnumMap</b> — a specialized, extremely efficient map whose keys are enum constants. Internally it\'s just an ARRAY indexed by the enum\'s ordinal, so it\'s tiny, allocation-light, and faster than HashMap, with keys iterated in enum declaration order. Use it whenever your keys are a fixed enum (a status→count map, a day→schedule map). The lesson: matching the implementation to the key type and access pattern is free performance.'
      ]
    },
    {
      h: 'Modern map methods and the gotchas',
      p: [
        'Pre-Java-8 map code was full of "check if present, then insert or update" boilerplate. The modern methods collapse it. <code>getOrDefault(key, fallback)</code> returns the value or a default without a null check. <code>computeIfAbsent(key, k -&gt; new ArrayList&lt;&gt;())</code> is THE idiom for a multimap (map of key → list): it inserts a fresh list only if absent, then you add to it — one line, no race between check and insert. <code>merge(key, 1, Integer::sum)</code> is THE idiom for counting: "put 1 if absent, else add 1 to the existing value" — the canonical word-frequency counter. <code>compute</code>, <code>putIfAbsent</code>, and <code>forEach((k,v) -&gt; ...)</code> round out the set. These make map code shorter, clearer, and less bug-prone.',
        'The gotchas to keep straight. NULLS: HashMap and LinkedHashMap allow one null key and null values; TreeMap forbids a null key (it can\'t compare null); the immutable <code>Map.of(...)</code> forbids nulls entirely. Beware <code>get</code> returning null being ambiguous — "key absent" vs "key present with null value" — use <code>containsKey</code> or <code>getOrDefault</code> to disambiguate. ITERATION: you iterate a Map via its VIEWS — <code>entrySet()</code> (best — key and value together), <code>keySet()</code>, or <code>values()</code> — never the map directly (a Map isn\'t Iterable), and structurally modifying the map during that iteration throws <code>ConcurrentModificationException</code> just like lists (use the entrySet iterator\'s remove, or the map\'s own <code>remove</code> after). MUTABLE KEYS: never mutate a field that participates in a key\'s hashCode/equals while it\'s in the map. Get these right and maps become the most powerful everyday tool in the collections framework.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Log Pose files islands by magnetic fingerprint',
      text: 'The Log Pose — the device this whole app is named for — is a HashMap made of brass and glass. It navigates by filing each island under its magnetic FINGERPRINT: point the needle, read the field, and it jumps straight to the right island without sailing past every other island in the sea (hashCode picks the bucket in O(1), no scan). But two different islands can share a similar magnetic reading (a collision) — so within that reading the crew still has to check the actual coastline to confirm which island it really is (equals confirms the key within the bucket). Nami learned the iron law of the device the hard way, and it\'s the equals/hashCode contract exactly: two islands the crew considers the SAME destination MUST give the SAME fingerprint, or the Log Pose files a return-trip under one reading and searches for it under another — the island is recorded yet forever unreachable (override equals but not hashCode: the key is stored but lost). And an island whose magnetism DRIFTS after you file it (a mutable key) becomes unfindable too — the needle now points to a drawer the island was never filed in. Now the four devices in the navigator\'s kit, each a different Map. The standard Log Pose (HashMap) is fastest but records islands in no particular order — flip it open and they\'re just... there, unsorted. The LOGBOOK Log Pose (LinkedHashMap) additionally keeps a threaded ribbon recording the ORDER islands were logged, so the crew can retrace their exact voyage; set it to "most-recently-visited" mode and it becomes a limited-memory pose that forgets the island you haven\'t visited in longest when it runs out of room (access-order LRU cache — evict the eldest). The Eternal Pose collection sorted by distance (TreeMap) keeps islands in SORTED order and answers "what\'s the nearest island at least 50 leagues out?" and "every island between here and Raftel" (log-time navigation: floorKey/ceilingKey/subMap). And for the fixed, known set of sea-zones — the four Blues plus the Grand Line, a closed enum of regions — there\'s a tiny slotted rack (EnumMap) with one slot per zone, indexed directly, no searching at all. Right device for the job: the fastest fingerprint file, the order-remembering logbook, the sorted distance-chart, or the tiny fixed rack.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon files everything four different ways',
      text: 'Sheldon Cooper\'s filing systems ARE the four Map implementations, and he will explain the distinctions whether you asked or not. His comic collection is a HashMap: each issue filed by a computed CODE that sends him straight to its exact slot without flipping through the whole box (hashCode → bucket, O(1) retrieval) — and when two issues hash to nearby slots, he confirms the right one by inspecting the actual cover (equals within the bucket). The contract obsesses him: two comics he deems "the same issue" MUST file to the same code, or he\'d own a comic and be structurally unable to find it — present in the collection, lost to the index (equals-without-hashCode, the lost key). His EMAIL, by contrast, he keeps in strict CHRONOLOGICAL order — a LinkedHashMap remembering the exact sequence things arrived — and his limited-shelf-space rule ("when the shelf is full, the thing I haven\'t touched longest goes to storage") is a literal access-order LRU cache with removeEldestEntry. His spice rack and his contacts, though, he keeps ALPHABETICALLY SORTED (a TreeMap), which is why he can instantly answer "what comes right after Koothrappali?" and "everyone in the address book between C and F" (sorted order, floor/ceiling/subMap range queries) — at the cost of a bit more effort to insert a new entry in its correct sorted place (O(log n), not O(1)). And for the days of the week — a FIXED, closed set, an enum if there ever was one — Sheldon has a rigid seven-slot schedule board (an EnumMap): Monday-is-Thai-food is not filed or searched, it\'s slotted directly at the Monday index, tiny and instant. Sheldon would tell you, correctly, that using the wrong structure is a category error: you don\'t alphabetize email (you\'d lose the timeline), you don\'t chronologically order a spice rack (you couldn\'t find cumin), and you certainly don\'t use a general filing code for the seven days when a fixed rack is faster and smaller. Match the structure to the ordering and the key type — the entire maps lesson, delivered as Sheldon\'s pedantry.',
    },
    why: 'The Log Pose (and Sheldon\'s comic file) is a HashMap: file each island/issue by a computed fingerprint to jump straight to it (hashCode → bucket, O(1)), confirming the exact one by its coastline/cover (equals within the bucket). The iron law is the equals/hashCode contract — same destination must give the same fingerprint, or the island is filed-yet-unreachable (equals without hashCode = lost key), and a drifting/mutable key is lost the same way. The four devices are the four Maps: the fast unordered fingerprint-file (HashMap), the voyage-order logbook that forgets the least-recently-visited when full (LinkedHashMap / access-order LRU), the sorted distance-chart answering nearest/between queries (TreeMap, log-time, range navigation), and the tiny fixed slotted rack for a closed set of zones/days (EnumMap). Match the device to the ordering and key type.'
  },
  storyAnim: {
    title: 'File by fingerprint, confirm by coastline — and four devices for four jobs',
    h: 300,
    props: [
      { id: 'hash', emoji: '🧭', label: 'put: hashCode(island) → bucket index', x: 16, y: 12 },
      { id: 'bucket', emoji: '🗄️', label: 'stored in that bucket', x: 50, y: 12 },
      { id: 'equals', emoji: '🏝️', label: 'get: jump to bucket, confirm by coastline (equals)', x: 84, y: 12 },
      { id: 'contract', emoji: '⚖️', label: 'same destination → same fingerprint (or LOST)', x: 24, y: 46 },
      { id: 'collide', emoji: '🔗', label: 'collision: chain, then treeify → O(log n)', x: 62, y: 46 },
      { id: 'hashmap', emoji: '⚡', label: 'HashMap: fast, unordered', x: 14, y: 80 },
      { id: 'linked', emoji: '🎗️', label: 'LinkedHashMap: order / LRU', x: 40, y: 80 },
      { id: 'tree', emoji: '📈', label: 'TreeMap: sorted, ranges', x: 63, y: 80 },
      { id: 'enum', emoji: '🎚️', label: 'EnumMap: fixed enum keys', x: 86, y: 80 }
    ],
    actors: [
      { id: 'nami', emoji: '🗺️', label: 'Nami', x: 12, y: 30 }
    ],
    steps: [
      { c: 'put(island, note): the Log Pose computes the island\'s magnetic fingerprint — hashCode — and spreads the bits to pick a bucket index.', p: { hash: 'lit' }, a: { nami: [16, 30] } },
      { c: 'The entry is stored in that bucket. No scanning the whole sea — the fingerprint decides where it lives.', p: { bucket: 'good' } },
      { c: 'get(island): recompute the fingerprint, jump straight to the bucket, then confirm the exact island by its coastline — equals. hashCode finds the bucket; equals confirms the key. That\'s the O(1) average.', p: { equals: 'good' } },
      { c: 'The iron law: two islands judged the SAME destination MUST share a fingerprint, or the return trip is filed under one reading and searched under another — stored yet unreachable. Override equals, you MUST override hashCode. A mutable/drifting key is lost the same way.', p: { contract: 'bad' } },
      { c: 'Different islands can share a reading — a collision. They chain in the bucket; if one bucket\'s chain grows too long, Java treeifies it to a balanced tree, so the worst case is O(log n), not O(n).', p: { collide: 'lit' } },
      { c: 'Four devices for four jobs. HashMap: fastest, no order.', p: { hashmap: 'good' } },
      { c: 'LinkedHashMap: remembers insertion order — or, in access-order mode, forgets the least-recently-visited island when full (an LRU cache). TreeMap: keeps islands SORTED and answers nearest/between range queries in log time.', p: { linked: 'good', tree: 'good' } },
      { c: 'EnumMap: for a fixed, closed set of keys (the sea-zones, the days) — a tiny slotted rack indexed directly by ordinal, faster and smaller than HashMap. Match the device to the ordering and the key type.', p: { enum: 'good' }, a: { nami: [86, 80] } }
    ]
  },
  conceptFlow: {
    title: 'A HashMap put/get, and choosing among the four maps',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'put(key, value)',
        nodes: [
          { id: 'hashput', text: 'key.hashCode()\nspread bits → bucket index' },
          { id: 'store', text: 'store in bucket\ncollision → chain, maybe treeify' }
        ]
      },
      {
        label: 'get(key)',
        nodes: [
          { id: 'hashget', text: 'key.hashCode()\nsame bucket index' },
          { id: 'eq', text: 'equals() within the bucket\nconfirm the exact key' }
        ]
      },
      {
        label: 'staying fast',
        nodes: [
          { id: 'load', text: 'entries > capacity × 0.75\n→ resize ×2, rehash all' },
          { id: 'contract', text: 'equal keys → equal hash\nkeys immutable, or lost' }
        ]
      },
      {
        label: 'pick the map',
        nodes: [
          { id: 'unordered', text: 'no order needed → HashMap' },
          { id: 'ordered', text: 'insertion/LRU → LinkedHashMap' },
          { id: 'sorted', text: 'sorted/range → TreeMap; enum keys → EnumMap' }
        ]
      }
    ],
    steps: [
      { active: ['hashput'], note: 'put computes the key\'s hashCode and mixes the bits, then takes it modulo the table size to choose a bucket. The hash decides where the entry lives.' },
      { active: ['store'], note: 'The entry goes in that bucket. If other keys already collided there, it joins the chain; if a chain gets long enough (8, with a big-enough table), Java converts it to a red-black tree so worst-case lookup is O(log n).' },
      { active: ['hashget'], note: 'get recomputes the same hashCode to jump to the same bucket in O(1) — no scan of the map. An equal key MUST hash the same as it did at put, or this jump lands in the wrong bucket.' },
      { active: ['eq'], note: 'Within the bucket, the map walks the (short) chain calling equals to find the exact key. Both methods fire every lookup: hashCode to locate the bucket, equals to confirm the key.' },
      { active: ['load'], note: 'When entries exceed capacity × load factor (0.75), the map doubles its table and rehashes everything — O(n) but rare, keeping buckets short. Pre-size with new HashMap<>(N/0.75) if you know N.' },
      { active: ['contract'], note: 'The Part 1 contract is load-bearing here: equal keys must produce equal hashCodes, and key fields must be immutable — or a stored key becomes unfindable (wrong bucket). This is why String is the ideal key.' },
      { active: ['unordered'], note: 'Choosing: if you need no particular order, HashMap — fastest, O(1), the default.' },
      { active: ['ordered'], note: 'If you need predictable insertion order for output, or an access-order LRU cache, LinkedHashMap — same O(1) with a linked list threading the entries.' },
      { active: ['sorted'], note: 'If you need sorted iteration or range queries (floor/ceiling/subMap), TreeMap — O(log n), a red-black tree. If your keys are a fixed enum, EnumMap — a tiny ordinal-indexed array, faster and lighter than HashMap.' }
    ]
  },
  tech: [
    {
      q: 'Walk me through exactly what happens inside HashMap on put and get, including collisions and treeification.',
      a: 'A HashMap holds an array of buckets. On put(key, value): it calls key.hashCode(), applies an internal spreading function (hash ^ (hash >>> 16)) to mix high bits into low bits so that keys with poorly-distributed hashCodes don\'t all cluster in a few buckets, and then takes that modulo the table size (actually a bitmask, since capacity is always a power of two) to get the bucket index. It places the entry there. If the bucket is empty, done. If not — a COLLISION — the entry joins the bucket\'s chain, which is a singly-linked list of nodes; if a key with the same hashCode AND equals already exists, its value is overwritten instead. On get(key): it repeats the exact same hashCode-spread-and-index computation to jump directly to the one bucket in O(1) (no scanning the whole map), then walks that bucket\'s chain calling equals to find the matching key. So every operation is hashCode-to-find-the-bucket, equals-to-confirm-the-key. Collisions are inevitable (infinitely many objects, finitely many buckets, pigeonhole), and short chains are fine — a couple of equals checks. The danger is a bucket whose chain grows long (many collisions, or a hash-collision DoS attack feeding crafted keys), degrading that bucket to O(n). Java 8 added TREEIFICATION: when a single bucket\'s chain length reaches 8 AND the table capacity is at least 64, that bucket is converted from a linked list into a balanced red-black tree keyed by hash (and Comparable order when available), so lookups within even a pathologically overloaded bucket are O(log n) instead of O(n) (it untreeifies back to a list if the bucket shrinks below 6 during removals/resizes). This bounded the worst case and hardened HashMap against algorithmic-complexity attacks. Net complexity: average O(1) get/put with a good hash distribution; worst case O(log n) since Java 8. The two things a candidate should always mention: the hashCode-then-equals two-step, and that treeification made the worst case O(log n).'
    },
    {
      q: 'How do load factor and resizing work, and why is the equals/hashCode contract essential to a working HashMap?',
      a: 'LOAD FACTOR and RESIZING: a HashMap tracks how full it is via the load factor (default 0.75). When the entry count exceeds capacity × load factor, it RESIZES — allocates a new bucket array of double the capacity and REHASHES every existing entry into the new table (each entry\'s bucket index changes because it\'s computed modulo the new, larger size). Resizing is O(n), but because capacity doubles each time, it happens logarithmically rarely and is amortized to O(1) per insertion overall; its purpose is to keep the average chain length bounded (~load factor) so lookups stay fast. The 0.75 default balances space against speed: a lower load factor wastes memory (more empty buckets) but shortens chains; a higher one packs tighter but lengthens chains and slows lookups. If you know you\'ll insert N entries, constructing new HashMap<>(initialCapacity) with initialCapacity ≈ N / 0.75 avoids the repeated grow-and-rehash cycles (a real, cheap optimization for large known-size maps). WHY THE CONTRACT IS ESSENTIAL: the map locates keys by hashCode-then-equals, so both methods must behave per the Part 1 contract or the map silently breaks. (1) If you override equals but not hashCode, two objects that are equal() can have different hashCodes, so they hash to different buckets; you put with one and get with an equal one and the map searches the wrong bucket, returning null — the key is provably in the map (iterate and you\'ll see it) yet unfindable via get/containsKey. This is the classic "lost key" bug. (2) If hashCode is inconsistent with equals in the other direction, or if it isn\'t stable, lookups become unreliable. (3) If a key\'s hashCode-determining fields are MUTABLE and you mutate them after insertion, the entry stays physically in its original bucket while get() computes the new bucket and misses — the key is lost by mutation. These are exactly why keys should be immutable, why String (immutable, and it caches its hashCode after first computation for speed) is the ideal key, and why the equals/hashCode contract from Part 1 isn\'t academic — every HashMap, HashSet, and LinkedHashMap in your program depends on it holding. The one-line summary: load factor + resizing keep buckets short for O(1); the equals/hashCode contract is what makes "find the right bucket, confirm the right key" actually work.'
    },
    {
      q: 'Compare HashMap, LinkedHashMap, TreeMap, and EnumMap — ordering, performance, nulls, and when to use each.',
      a: 'HashMap: backed by a bucket array; average O(1) get/put/remove; NO ordering guarantee (iteration order is arbitrary and can change across resizes); allows one null key and multiple null values. The default choice when you just need key→value lookup and don\'t care about order. LinkedHashMap: a HashMap that additionally maintains a doubly-linked list through all entries to preserve order; O(1) operations with slightly more memory (two extra references per entry). By default it iterates in INSERTION order (predictable output, reproducible tests, deterministic serialization). Constructed with accessOrder=true, it iterates in ACCESS order (each get/put moves the entry to the end), and overriding removeEldestEntry to return true past a capacity turns it into a ready-made LRU CACHE — the least-recently-used entry sits at the head and is evicted first (this is exactly the bounded-cache fix from the GC lesson, and how you\'d bound LogPose\'s embedding cache). Allows null key/values like HashMap. TreeMap: a red-black tree keeping keys SORTED by natural Comparable order or a supplied Comparator; O(log n) get/put/remove (the cost of maintaining sort order); does NOT allow a null key (it must compare keys, and comparing null fails); implements NavigableMap, giving range and navigation operations HashMap can\'t — firstKey/lastKey, floorKey/ceilingKey (largest ≤ / smallest ≥ a given key), lowerKey/higherKey, and headMap/tailMap/subMap for range views. Use it when you need sorted iteration or range/nearest queries. EnumMap: a specialized map for ENUM keys, internally just an array indexed by the enum constant\'s ordinal — so it\'s extremely compact, allocation-light, and faster than HashMap (no hashing, no collisions), and it iterates in enum DECLARATION order; keys must all be of one enum type and null keys are not permitted. Use it whenever your keys are a fixed enum (status→count, dayOfWeek→tasks) — it\'s free performance for matching the structure to the key type. Decision guide: default HashMap; LinkedHashMap for predictable iteration order or an LRU cache; TreeMap for sorted order or range queries; EnumMap for enum keys. The interview point is being able to justify the choice by ordering needs, complexity, and key type — and knowing that TreeMap trades O(1) for O(log n) to buy sorting, while EnumMap beats HashMap precisely because a fixed enum key set lets it skip hashing entirely.'
    },
    {
      q: 'Show me the modern Map methods that replace check-then-act boilerplate, and the null/iteration gotchas.',
      a: 'The Java 8+ default methods eliminate the old "get, null-check, then put" patterns and their check-then-act race windows. getOrDefault(key, fallback) returns the mapped value or fallback if absent, without a manual null check — clean for reads with a default. computeIfAbsent(key, k -> new ArrayList<>()) is THE multimap idiom: it computes and inserts a value only if the key is absent, then returns the (existing or new) value, so map.computeIfAbsent(tag, k -> new ArrayList<>()).add(entry) builds a Map<Tag, List<Entry>> in one atomic-per-key line with no redundant lookups. merge(key, 1, Integer::sum) is THE counting idiom: if the key is absent it stores the given value, else it applies the remapping function to combine old and new — map.merge(word, 1, Integer::sum) is the canonical word-frequency counter. compute and computeIfPresent handle "update based on current value," putIfAbsent inserts only if missing (returning any existing value), and forEach((k, v) -> ...) and replaceAll iterate/transform concisely. These make map code shorter and less error-prone, and on ConcurrentHashMap the compute-family methods are also atomic. GOTCHAS: (1) NULLS differ by implementation — HashMap/LinkedHashMap allow one null key and null values; TreeMap forbids a null key (comparison); Map.of/copyOf forbid nulls entirely (NPE). (2) A get returning null is AMBIGUOUS — it can mean "key absent" OR "key present, mapped to null" — so use containsKey or getOrDefault to disambiguate, and prefer not storing null values. (3) computeIfAbsent\'s function must not modify the same map (it can throw ConcurrentModificationException), and if the function returns null nothing is stored. (4) ITERATION is via VIEWS, not the map directly: entrySet() (best — gives Map.Entry with both key and value, avoiding a second lookup per key), keySet(), or values(); a Map is not Iterable itself. Structurally modifying the map during that iteration throws ConcurrentModificationException just like lists — remove via the entrySet iterator\'s remove() or collect keys and remove after. (5) MUTABLE KEYS: never mutate a field involved in a key\'s hashCode/equals while it\'s in the map, or you lose the entry. Master these and map code becomes both concise and correct.'
    }
  ],
  code: {
    title: 'Four maps for four LogPose jobs — plus the counting and multimap idioms',
    intro: 'LogPose needs several maps: fast lookup by id, deterministic tag ordering for output, sorted-by-date navigation, and a per-status tally. Each job picks a different implementation, and the modern map methods keep the code to one line each.',
    code: `import java.util.*;

enum Status { IDEA, IN_PROGRESS, DONE }   // a fixed, closed key set — perfect for EnumMap

public class MapsDemo {
    public static void main(String[] args) {
        // 1) HashMap: fast lookup by id, order irrelevant.
        Map<Integer, String> byId = new HashMap<>();
        byId.put(1, "flaky-test triage");
        byId.put(2, "embedding cache");
        System.out.println("get(2): " + byId.get(2));           // O(1) average

        // 2) LinkedHashMap: deterministic INSERTION order for stable output.
        Map<String, Integer> tagOrder = new LinkedHashMap<>();
        tagOrder.put("flaky", 3);
        tagOrder.put("cache", 2);
        tagOrder.put("mentoring", 1);
        System.out.println("insertion order: " + tagOrder.keySet());  // [flaky, cache, mentoring]

        // 2b) LinkedHashMap as an LRU cache (access-order + removeEldestEntry).
        int MAX = 2;
        Map<String, String> lru = new LinkedHashMap<>(16, 0.75f, true) {
            @Override protected boolean removeEldestEntry(Map.Entry<String,String> e) {
                return size() > MAX;
            }
        };
        lru.put("a", "1"); lru.put("b", "2");
        lru.get("a");                 // touch "a" -> now "b" is least-recently-used
        lru.put("c", "3");            // inserting "c" evicts "b" (the eldest by access)
        System.out.println("LRU keeps: " + lru.keySet());        // [a, c]

        // 3) TreeMap: sorted by date, with range/navigation queries.
        TreeMap<String, String> byDate = new TreeMap<>();
        byDate.put("2026-07-10", "kickoff");
        byDate.put("2026-07-14", "ablation");
        byDate.put("2026-07-15", "writeup");
        System.out.println("first: " + byDate.firstKey());               // 2026-07-10
        System.out.println("on/after 12th: " + byDate.ceilingKey("2026-07-12")); // 2026-07-14
        System.out.println("range: " + byDate.subMap("2026-07-11", "2026-07-15")); // {14: ablation}

        // 4) EnumMap: per-status tally, tiny + fast, iterates in enum order.
        Map<Status, Integer> counts = new EnumMap<>(Status.class);
        for (Status s : List.of(Status.DONE, Status.IDEA, Status.DONE, Status.IN_PROGRESS)) {
            counts.merge(s, 1, Integer::sum);        // THE counting idiom
        }
        System.out.println("counts: " + counts);      // {IDEA=1, IN_PROGRESS=1, DONE=2} (enum order)

        // Multimap idiom: Map<tag, List<entryId>> via computeIfAbsent.
        Map<String, List<Integer>> byTag = new HashMap<>();
        byTag.computeIfAbsent("flaky", k -> new ArrayList<>()).add(1);
        byTag.computeIfAbsent("flaky", k -> new ArrayList<>()).add(3);   // reuses the same list
        System.out.println("flaky entries: " + byTag.get("flaky"));      // [1, 3]
    }
}`,
    notes: [
      'Each map matches its job: HashMap for unordered fast lookup, LinkedHashMap for deterministic order (and as an access-order LRU cache — the GC-lesson bounded-cache fix), TreeMap for sorted/range/navigation queries, EnumMap for the fixed Status enum (an ordinal-indexed array, faster and smaller than HashMap).',
      'merge(s, 1, Integer::sum) is the canonical counter — "1 if absent, else add 1" in one line. computeIfAbsent(tag, k -> new ArrayList<>()).add(id) is the canonical multimap builder — insert the list only if absent, then add. No check-then-act boilerplate, no redundant lookups.',
      'Run: javac MapsDemo.java && java MapsDemo. Note TreeMap\'s ceilingKey/subMap answering "on or after" and "between" — queries a HashMap simply cannot do. Swap the LRU\'s access to see a different key evicted.'
    ]
  },
  lab: {
    title: 'Count with merge, group with computeIfAbsent',
    prompt: 'Master the two idioms every Java dev uses constantly. Write a class <code>Tally</code> with two static methods: (1) <code>static Map&lt;String, Integer&gt; wordCounts(List&lt;String&gt; words)</code> that returns a frequency map using <code>merge</code> (NOT get-then-put); (2) <code>static Map&lt;Character, List&lt;String&gt;&gt; byFirstLetter(List&lt;String&gt; words)</code> that groups words by their first character using <code>computeIfAbsent</code>. Use a <code>LinkedHashMap</code> in <code>byFirstLetter</code> so the group order is deterministic. In a comment, answer: why is <code>map.merge(w, 1, Integer::sum)</code> better than <code>map.put(w, map.get(w) + 1)</code> for the very first occurrence of a word?',
    starter: `import java.util.*;

class Tally {
    static Map<String, Integer> wordCounts(List<String> words) {
        // use merge(word, 1, Integer::sum)
        return null; // replace
    }

    static Map<Character, List<String>> byFirstLetter(List<String> words) {
        // use a LinkedHashMap + computeIfAbsent(firstChar, k -> new ArrayList<>()).add(word)
        return null; // replace
    }
}

// Q: why is map.merge(w, 1, Integer::sum) better than map.put(w, map.get(w) + 1) for a word's
//    FIRST occurrence?
// ANSWER:`,
    checks: [
      { re: '\\.merge\\s*\\(', must: true, hint: 'wordCounts must use merge(word, 1, Integer::sum).', pass: 'uses merge ✓' },
      { re: 'Integer::sum|\\(\\w+\\s*,\\s*\\w+\\)\\s*->', must: true, hint: 'Pass a remapping function like Integer::sum to merge.', pass: 'remap function ✓' },
      { re: 'computeIfAbsent\\s*\\(', must: true, hint: 'byFirstLetter must use computeIfAbsent(firstChar, k -> new ArrayList<>()).', pass: 'uses computeIfAbsent ✓' },
      { re: 'new\\s+LinkedHashMap', must: true, hint: 'Use a LinkedHashMap in byFirstLetter for deterministic group order.', pass: 'LinkedHashMap for order ✓' },
      { re: '\\.charAt\\s*\\(\\s*0\\s*\\)', must: true, hint: 'Group by the first character: word.charAt(0).', pass: 'groups by first char ✓' },
      { re: '\\.add\\s*\\(', must: true, hint: 'After computeIfAbsent returns the list, add the word to it.', pass: 'adds to group list ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: for a new word, map.get(w) returns null, so map.get(w) + 1 throws a NullPointerException (unboxing null); merge handles the absent case by storing the initial value.', pass: 'rationale given ✓' },
      { re: 'ANSWER\\s*:.*(null|NullPointer|absent|NPE)', flags: 'i', must: true, hint: 'The key point: get(w) is null for a new word, so + 1 unboxes null and throws NPE; merge stores the initial value when absent.', pass: 'identifies the NPE/absent case ✓' }
    ],
    run: 'put Tally and a main in <code>Tally.java</code>; <code>javac Tally.java &amp;&amp; java Tally</code>. Call both on ["flaky","cache","flaky","code","cache","flaky"] and print the results — counts {flaky=3, cache=2, code=1} and groups by first letter, in deterministic order.',
    solution: `import java.util.*;

class Tally {
    static Map<String, Integer> wordCounts(List<String> words) {
        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);   // 1 if absent, else +1
        return counts;
    }

    static Map<Character, List<String>> byFirstLetter(List<String> words) {
        Map<Character, List<String>> groups = new LinkedHashMap<>();  // deterministic group order
        for (String w : words) {
            if (w.isEmpty()) continue;
            groups.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w);
        }
        return groups;
    }

    public static void main(String[] args) {
        var words = List.of("flaky", "cache", "flaky", "code", "cache", "flaky");
        System.out.println(wordCounts(words));      // {flaky=3, cache=2, code=1} (order may vary)
        System.out.println(byFirstLetter(words));   // {f=[flaky, flaky, flaky], c=[cache, code, cache]}
    }
}

// ANSWER: For a word's first occurrence the key is absent, so map.get(w) returns null and
// map.get(w) + 1 unboxes null → NullPointerException. merge(w, 1, Integer::sum) handles the
// absent case by storing the initial value (1) and only applies the sum function when a value
// already exists — so it's both correct for the first occurrence and free of check-then-act
// boilerplate.`,
    notes: [
      'merge collapses "if absent put initial, else combine" into one call and sidesteps the null-unboxing NPE that get-then-put hits on the first occurrence. It is THE counting idiom.',
      'computeIfAbsent inserts the list only when the key is new, then returns it either way, so .add() always targets the right list — THE multimap idiom, with no redundant get/containsKey.',
      'Using LinkedHashMap for the groups makes iteration order deterministic (insertion order of first-seen letters) — valuable for reproducible output and stable tests, where a plain HashMap\'s arbitrary order would flake.'
    ]
  },
  quiz: [
    {
      q: 'How does a HashMap find a key\'s value in O(1) average time?',
      options: ['It computes the key\'s hashCode to jump directly to one bucket, then uses equals to confirm the exact key within that (short) bucket — no scan of the whole map', 'It scans every entry comparing with equals until it finds a match', 'It keeps keys sorted and binary-searches them', 'It stores each value at an index equal to the key itself'],
      correct: 0,
      explain: 'hashCode picks the bucket, equals confirms the key — the two-step that makes lookup O(1) average. The Log Pose files each island by magnetic fingerprint (jump to the bucket), then confirms by its coastline (equals). Both methods fire on every lookup.'
    },
    {
      q: 'You override equals on your key class but forget hashCode, then use it in a HashMap. What breaks?',
      options: ['Two "equal" keys can hash to different buckets, so get() looks in the wrong bucket and returns null even though the key is stored — the classic "lost key" bug', 'The code fails to compile', 'Every lookup returns the wrong value but never null', 'Nothing — hashCode is optional when equals is defined'],
      correct: 0,
      explain: 'The map locates by hashCode first; break the equal-keys-same-hash contract and equal keys scatter to different buckets — stored but unfindable. This is the Part 1 contract coming due. Keys must be immutable too, or a drifting hash loses them the same way.'
    },
    {
      q: 'You need a map that iterates its keys in SORTED order and can answer "smallest key ≥ X". Which implementation?',
      options: ['TreeMap — a red-black tree keeping keys sorted, with O(log n) operations and navigation methods like ceilingKey, floorKey, and subMap for range queries', 'HashMap — it sorts keys automatically', 'LinkedHashMap — insertion order is the same as sorted order', 'EnumMap — it sorts any key type'],
      correct: 0,
      explain: 'TreeMap keeps keys sorted (O(log n), the price of order) and uniquely supports range/navigation queries (ceilingKey, subMap, firstKey). HashMap has no order; LinkedHashMap remembers insertion/access order, not sorted order. Nami\'s distance-sorted Eternal Pose chart.'
    },
    {
      q: 'Your keys are the constants of a fixed enum (e.g. Status.IDEA/IN_PROGRESS/DONE). Best map?',
      options: ['EnumMap — internally an array indexed by the enum ordinal, so it\'s tiny, allocation-light, faster than HashMap, and iterates in enum declaration order', 'HashMap — enums need hashing like any key', 'TreeMap — to keep the enum values sorted', 'LinkedHashMap — to preserve enum order'],
      correct: 0,
      explain: 'EnumMap exploits the fixed, ordinal-indexed key set: it\'s just an array, no hashing or collisions, smaller and faster than HashMap, iterating in declaration order. Matching the implementation to the key type is free performance. Sheldon\'s seven-slot day board.'
    },
    {
      q: 'Which one-liner correctly counts occurrences into a Map<String,Integer>?',
      options: ['map.merge(word, 1, Integer::sum) — stores 1 if absent, else adds 1 to the existing value, with no null-unboxing bug', 'map.put(word, map.get(word) + 1) — always correct and safe', 'map.computeIfAbsent(word, k -> 1) — increments on every call', 'map.getOrDefault(word, 0) — this alone updates the map'],
      correct: 0,
      explain: 'merge is THE counting idiom: initial value if absent, else combine via the function. put(word, get(word)+1) throws NullPointerException on the first occurrence (get returns null, +1 unboxes null). getOrDefault only READS; computeIfAbsent won\'t re-run once present.'
    }
  ],
  testFlow: {
    title: 'Test yourself: maps under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You put a key into a HashMap, then mutate a field of that key object that participates in its hashCode. Later get(sameKey) returns null. Why?',
        choices: [
          { text: 'Mutating a hashCode field changed which bucket the key hashes to; the entry still sits physically in its OLD bucket, but get() now computes the NEW bucket and searches there, missing it — the key is lost by mutation', to: 'q1_right' },
          { text: 'HashMap automatically removed the key when it changed', to: 'q1_wrong_removed' },
          { text: 'get() is broken and should be replaced with containsKey()', to: 'q1_wrong_contains' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — the entry doesn\'t move when the key mutates, but its computed bucket does, so lookups go to the wrong bucket and miss. This is why keys must be IMMUTABLE (and why String, immutable and hash-caching, is the ideal key). Mutating a live key\'s hash strands it in the map.', next: 'q2' },
      q1_wrong_removed: { end: true, correct: false, text: 'HashMap does not watch its keys for mutation — it has no way to know a field changed. The entry stays in its original bucket while the key\'s hash now points elsewhere, so it\'s stranded, not removed. The fix is never to mutate a stored key\'s hash fields; use immutable keys.', retry: 'q1' },
      q1_wrong_contains: { end: true, correct: false, text: 'containsKey has the SAME problem — it also computes the (now wrong) bucket from the mutated key and misses. The bug isn\'t get(); it\'s mutating a field the hashCode depends on while the key is in the map. Keep key fields immutable.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You need a cache that holds at most 100 entries and evicts the least-recently-used one when full. What\'s the simplest built-in tool?',
        choices: [
          { text: 'A LinkedHashMap constructed with accessOrder=true and removeEldestEntry overridden to return size() > 100 — a ready-made LRU cache', to: 'q2_right' },
          { text: 'A TreeMap sorted by insertion time', to: 'q2_wrong_tree' },
          { text: 'A plain HashMap — it evicts old entries automatically', to: 'q2_wrong_hash' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — access-order LinkedHashMap moves each accessed key to the end, so the head is always the least-recently-used, and removeEldestEntry returning size() > 100 evicts it on the next insert. This is the exact bounded-cache fix from the GC lesson, and how you\'d cap LogPose\'s embedding cache.', next: 'q3' },
      q2_wrong_tree: { end: true, correct: false, text: 'A TreeMap sorts by KEY order and has no notion of recency or eviction — you\'d have to track access times and evict manually. The purpose-built tool is an access-order LinkedHashMap with removeEldestEntry, which does LRU eviction for free.', retry: 'q2' },
      q2_wrong_hash: { end: true, correct: false, text: 'A plain HashMap NEVER evicts — it grows without bound (the unbounded-cache leak from the GC lesson). You need explicit eviction; an access-order LinkedHashMap with removeEldestEntry provides LRU eviction out of the box.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'You want to build a Map<Tag, List<Entry>> and keep appending entries under each tag. What\'s the clean, correct idiom?',
        choices: [
          { text: 'map.computeIfAbsent(tag, k -> new ArrayList<>()).add(entry) — inserts a fresh list only if the tag is new, then adds to the (existing or new) list in one line', to: 'q3_right' },
          { text: 'if (map.get(tag) == null) map.put(tag, new ArrayList<>()); map.get(tag).add(entry); — three lookups', to: 'q3_wrong_verbose' },
          { text: 'map.merge(tag, new ArrayList<>(), (a,b) -> a) — merge is for lists', to: 'q3_wrong_merge' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — computeIfAbsent is THE multimap idiom: it creates the list only when the tag is absent and returns it either way, so .add always targets the right list, with a single lookup and no check-then-act race. Concise and correct.', next: null },
      q3_wrong_verbose: { end: true, correct: false, text: 'That works but is verbose (up to three lookups) and repeats the null-check-then-put boilerplate computeIfAbsent was designed to replace. computeIfAbsent(tag, k -> new ArrayList<>()).add(entry) does the same in one clean, single-lookup line.', retry: 'q3' },
      q3_wrong_merge: { end: true, correct: false, text: 'merge is the idiom for COMBINING values (like summing counts), not for lazily creating a container to append into — and it would allocate a throwaway ArrayList on every call. For a map-of-lists, computeIfAbsent is the right tool.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Overriding equals but not hashCode on a key (or using mutable fields in them) — equal keys scatter to different buckets and become unfindable, or a mutated key\'s hash strands it. Override both from the SAME immutable fields; prefer immutable keys.',
    'Using a HashMap when you needed ordering — its iteration order is arbitrary and unstable across resizes, which flakes tests and output. Use LinkedHashMap for insertion order or TreeMap for sorted order when order matters.',
    'Treating a null return from get() as "key absent" — it\'s ambiguous with "key present, value null". Use containsKey or getOrDefault, and avoid storing null values (TreeMap and Map.of reject nulls entirely; TreeMap also rejects a null key).',
    'Writing get-then-put counting: map.put(w, map.get(w) + 1) throws NullPointerException on the first occurrence (get returns null, +1 unboxes null). Use map.merge(w, 1, Integer::sum).',
    'Iterating a map with keySet() and then calling map.get(k) for each value — that\'s a second lookup per entry. Iterate entrySet() to get key and value together. And never structurally modify the map during iteration (ConcurrentModificationException).',
    'Reaching for HashMap when keys are a fixed enum — an EnumMap is smaller and faster (an ordinal-indexed array, no hashing). Similarly, don\'t default to TreeMap unless you actually need sorting/ranges; its O(log n) is a needless cost otherwise.'
  ],
  interview: [
    {
      q: 'Explain how HashMap works internally, including collisions, treeification, and resizing.',
      a: 'A HashMap is an array of buckets. On put, it computes the key\'s hashCode, applies an internal spreading function (mixing high bits into low bits so poorly-distributed hashCodes don\'t cluster), and indexes into the bucket array (capacity is a power of two, so it\'s a bitmask rather than a true modulo). The entry is stored in that bucket; if a key with equal hash and equals already exists, its value is overwritten. On get, it repeats the identical computation to jump straight to the one bucket in O(1) — no scanning — then walks that bucket\'s chain calling equals to find the exact key. So every operation is hashCode-to-locate-the-bucket, equals-to-confirm-the-key, which is the source of O(1) average performance. COLLISIONS (multiple keys in one bucket) are inevitable and normally cheap (a short chain of a few equals checks). Since Java 8, if a single bucket\'s chain reaches length 8 while the table has at least 64 buckets, that bucket TREEIFIES from a linked list into a balanced red-black tree, bounding worst-case lookup within an overloaded bucket to O(log n) instead of O(n) — this hardened HashMap against hash-collision denial-of-service attacks and improves degenerate cases (it converts back to a list if the bucket later shrinks). RESIZING: the map tracks fullness via the load factor (default 0.75); when entry count exceeds capacity × 0.75 it doubles the table and rehashes every entry into the larger array — O(n) but rare, so amortized O(1), and it keeps average chain length bounded so lookups stay fast. Pre-sizing (new HashMap<>(N/0.75)) avoids repeated resizes for a known N. The headline facts an interviewer wants: the hashCode-then-equals two-step, average O(1) / worst-case O(log n) since treeification, and that the whole thing depends on the equals/hashCode contract holding.'
    },
    {
      q: 'Why does the equals/hashCode contract matter so much for maps, and what exactly goes wrong if it\'s violated?',
      a: 'Because a HashMap (and HashSet, and LinkedHashMap) locates keys by computing hashCode to pick a bucket and then using equals to confirm the key within that bucket, both methods must obey the contract or the map silently malfunctions. The contract\'s load-bearing clause is: if two objects are equal by equals, they MUST have the same hashCode (the reverse isn\'t required — unequal objects may collide, which the map handles). VIOLATION 1 — override equals but not hashCode: two objects that are equal() inherit Object\'s identity-based hashCode and thus produce DIFFERENT hashes, so they land in different buckets. You put with one key and get with an equal key, the map jumps to a different bucket, walks it, doesn\'t find the key, and returns null — the entry is provably in the map (iteration reveals it) yet unreachable via get/containsKey. That\'s the classic "lost key" bug, and HashSet exhibits the analogous "duplicate not detected" bug (two equal elements hash to different buckets, so the set never compares them and stores both). VIOLATION 2 — mutable key fields: if hashCode is computed from fields you MUTATE after insertion, the entry stays physically in its original bucket while lookups compute the new bucket and miss — the key is lost by mutation, even though equals/hashCode are individually consistent. This is why keys should be immutable and why String (immutable, and it caches its hashCode after first use) is the canonical ideal key. VIOLATION 3 — inconsistent or non-reflexive/symmetric equals causes unpredictable membership. The remedy is the discipline from Part 1: override equals and hashCode TOGETHER, derive both from the SAME set of identity-defining, immutable fields (Objects.hash and Objects.equals make it a one-liner each), and prefer records for value-type keys since they generate a correct contract automatically. The reason this matters so much is scope: essentially every hash-based collection in your program silently depends on it, so a single broken key class can produce baffling, data-dependent "it\'s in there but I can\'t find it" bugs far from their cause.'
    },
    {
      q: 'How do you choose between HashMap, LinkedHashMap, TreeMap, and EnumMap? Give concrete scenarios.',
      a: 'I choose by three axes: ordering needs, key type, and performance. HashMap is my DEFAULT — average O(1) get/put, no ordering guarantee, allows null key/values — for any straightforward key→value lookup where iteration order doesn\'t matter (a cache keyed by id, a lookup table). LinkedHashMap when I need PREDICTABLE ITERATION ORDER or an LRU cache: by default it iterates in insertion order, which matters for reproducible output, stable tests, and deterministic serialization; and constructed with accessOrder=true plus an overridden removeEldestEntry it becomes a bounded LRU cache that evicts the least-recently-used entry — exactly how I\'d cap something like an embedding cache to avoid the unbounded-cache leak. It costs slightly more memory than HashMap for the linkage but keeps O(1). TreeMap when I need SORTED iteration or RANGE/NAVIGATION queries: it keeps keys sorted by natural or Comparator order at O(log n), and uniquely supports firstKey/lastKey, floorKey/ceilingKey (nearest key ≤/≥), and headMap/tailMap/subMap (range views) — so for "show entries between two dates" or "the largest key not exceeding X," TreeMap is the tool; it does not allow a null key (it must compare). EnumMap whenever the keys are constants of a single ENUM: it\'s internally an array indexed by ordinal, so it\'s tiny, allocation-light, faster than HashMap (no hashing, no collisions), and iterates in enum declaration order — ideal for a status→count tally or a dayOfWeek→schedule map. Concretely: fast id lookup → HashMap; deterministic tag order for a report or an LRU cache → LinkedHashMap; entries sorted by date with range queries → TreeMap; per-Status counts → EnumMap. The decision principle worth stating is that matching the implementation to the access pattern and key type is essentially free performance and correctness — defaulting everything to HashMap works but leaves ordering, range queries, and enum-key efficiency on the table, while reaching for TreeMap when you don\'t need sorting pays an unnecessary O(log n) tax.'
    },
    {
      q: 'What are the modern Map methods you reach for, and what null and iteration pitfalls do you watch for?',
      a: 'The Java 8+ default methods replace check-then-act boilerplate and make map code concise and correct. getOrDefault(key, fallback) reads with a default, no null check. computeIfAbsent(key, k -> new ArrayList<>()) is THE multimap idiom — it lazily creates and inserts a container only if the key is absent, returning it either way, so map.computeIfAbsent(tag, k -> new ArrayList<>()).add(entry) builds a Map<K, List<V>> in one single-lookup line. merge(key, 1, Integer::sum) is THE counting idiom — store the initial value if absent, else combine old and new via the function — so map.merge(word, 1, Integer::sum) is the canonical frequency counter and avoids the NullPointerException that map.put(w, map.get(w)+1) throws on a word\'s first occurrence (get returns null, +1 unboxes null). compute/computeIfPresent handle "update from current value," putIfAbsent inserts only if missing, and forEach/replaceAll iterate/transform cleanly; on ConcurrentHashMap the compute-family is atomic. PITFALLS I watch for: (1) Null semantics differ — HashMap/LinkedHashMap allow one null key and null values, TreeMap forbids a null key, Map.of/copyOf forbid nulls entirely — so I avoid storing null values and use containsKey/getOrDefault to disambiguate "absent" from "present-but-null," since a null from get() is ambiguous. (2) Iteration is via VIEWS — I iterate entrySet() to get key and value together (avoiding a second get() per key that keySet()-then-get incurs), and I never structurally modify the map during iteration or it throws ConcurrentModificationException (I remove via the entrySet iterator or collect-then-remove). (3) computeIfAbsent\'s mapping function must not modify the same map (CME risk), and returning null from it stores nothing. (4) Mutable keys — I never mutate a field involved in a stored key\'s hashCode/equals. Following these, the modern methods make map code both shorter and less bug-prone than the old get-null-check-put patterns.'
    }
  ]
};
