window.LESSONS = window.LESSONS || {};
window.LESSONS['sets-queues-deques'] = {
  id: 'sets-queues-deques',
  title: 'Sets, Queues & Deques: HashSet Family, PriorityQueue, ArrayDeque',
  category: 'Part 3 — Collections & Generics',
  timeMin: 40,
  summary: 'The last two branches of the collections framework. Sets enforce the "no duplicates" contract you already understand from Maps (HashSet is literally a HashMap in a trenchcoat) — HashSet for speed, LinkedHashSet for insertion order, TreeSet for automatic sorting. Queues model "process in order": the exception-throwing vs special-value method pairs, the min-heap PriorityQueue that always serves the smallest/most-urgent item first (with a classic iteration-order gotcha), and ArrayDeque — the modern double-ended queue that replaces both the legacy Stack class and LinkedList as a stack or queue. This closes out Part 3\'s "which collection when" judgment.',
  goals: [
    'Choose among HashSet, LinkedHashSet, and TreeSet by the speed/order/sorting tradeoff, and connect each to the Map it\'s backed by',
    'Perform set algebra — union, intersection, difference — with addAll/retainAll/removeAll and know when to copy defensively first',
    'Explain the Queue interface\'s two method families (throws vs returns-special-value) and use offer/poll/peek correctly',
    'Use PriorityQueue for "always process the most urgent item next" and explain why iterating it does NOT yield sorted order',
    'Use ArrayDeque as both a stack (push/pop) and a queue (offer/poll) and explain why it beats java.util.Stack and LinkedList for both roles'
  ],
  concept: [
    {
      h: 'Set: the "no duplicates" contract — and it\'s literally a Map underneath',
      p: [
        'A <code>Set</code> is a <code>Collection</code> that enforces uniqueness: <code>add(x)</code> on an element already present is a no-op that returns <code>false</code>, and duplicates never accumulate — the mirror image of the maps lesson\'s KEY uniqueness, now applied to a single collection of values. Every general-purpose Set implementation is, structurally, a Map wearing a trenchcoat: <b>HashSet</b> is literally backed by a <code>HashMap</code> internally (your elements become keys, with a dummy constant value), so it inherits everything from the maps lesson — O(1) average add/contains/remove via hashCode+equals, no ordering guarantee, and the SAME "never mutate a field a stored element\'s hashCode depends on" danger. <b>LinkedHashSet</b> is backed by a <code>LinkedHashMap</code> — same O(1) speed, but a linked list threads through the entries so iteration order is INSERTION order, predictable and stable. <b>TreeSet</b> is backed by a <code>TreeMap</code> — always kept sorted (natural ordering or a <code>Comparator</code>), O(log n) operations, and it implements <code>NavigableSet</code> so you get <code>first()</code>, <code>last()</code>, <code>higher(x)</code>, <code>lower(x)</code>, <code>ceiling(x)</code>, <code>floor(x)</code>, and range views like <code>headSet</code>/<code>tailSet</code>/<code>subSet</code> — the same range-query power the maps lesson gave TreeMap.',
        'The decision rule is identical in shape to the maps lesson: default to <b>HashSet</b> when you just need fast membership testing and don\'t care about order; reach for <b>LinkedHashSet</b> when you want that speed PLUS predictable, insertion-ordered iteration (e.g., de-duplicating a stream of items while preserving the order they first appeared); reach for <b>TreeSet</b> when you need the collection to stay sorted at all times or need range queries ("everything below this bounty," "the next tag alphabetically"). And exactly like Map keys, elements stored in a HashSet/LinkedHashSet must have a correct, stable <code>equals</code>/<code>hashCode</code> pair (Part 1\'s contract, paying rent again), while TreeSet elements must be mutually comparable (implement <code>Comparable</code> or supply a <code>Comparator</code>).'
      ]
    },
    {
      h: 'Set algebra: union, intersection, difference',
      p: [
        'Because Sets model mathematical sets, Java gives you set algebra for free through ordinary Collection methods applied BETWEEN two sets — but all three MUTATE the receiver, so you almost always copy first. <b>Union</b> (everything in either set): <code>Set&lt;T&gt; union = new HashSet&lt;&gt;(a); union.addAll(b);</code> — a is copied so the original isn\'t touched, then everything from b is merged in (duplicates silently absorbed). <b>Intersection</b> (only what\'s in BOTH): <code>Set&lt;T&gt; intersection = new HashSet&lt;&gt;(a); intersection.retainAll(b);</code> — retainAll keeps only elements also present in b, discarding the rest. <b>Difference</b> (in a but NOT in b): <code>Set&lt;T&gt; difference = new HashSet&lt;&gt;(a); difference.removeAll(b);</code> — removeAll strips out anything also in b.',
        'The pitfall that catches nearly everyone once: calling <code>a.retainAll(b)</code> or <code>a.removeAll(b)</code> DIRECTLY mutates <code>a</code> — if <code>a</code> is a field you still need afterward, you\'ve just silently destroyed data. The defensive-copy habit (<code>new HashSet&lt;&gt;(a)</code> before the algebra) is not optional style, it\'s the difference between a correct utility method and a bug that corrupts a caller\'s set. Pick the copy\'s implementation the same way as any Set: HashSet for speed, LinkedHashSet to preserve a meaningful order, TreeSet if the result should stay sorted.'
      ]
    },
    {
      h: 'Queue: two method families — one throws, one reports',
      p: [
        'The <code>Queue</code> interface models "process items in order" and deliberately offers EVERY core operation TWICE, in two families with different failure behavior. The "throws on failure" family — <code>add(e)</code>, <code>remove()</code>, <code>element()</code> — behaves like the historical Collection methods: fail loudly with an exception (<code>IllegalStateException</code> on a full add, <code>NoSuchElementException</code> on an empty remove/element) when the operation can\'t complete. The "special value" family — <code>offer(e)</code>, <code>poll()</code>, <code>peek()</code> — instead returns <code>false</code> or <code>null</code> on failure, letting you check the result rather than catch an exception. <code>add</code>/<code>offer</code> insert; <code>remove</code>/<code>poll</code> remove-and-return the head; <code>element</code>/<code>peek</code> look at the head without removing it.',
        'The practical guidance: prefer <code>offer</code>/<code>poll</code>/<code>peek</code> in almost all code. Emptiness and fullness are routine, expected conditions for a queue (a real queue empties out; a bounded queue can fill up) — not exceptional ones — so modeling them as a checkable return value rather than a thrown exception matches how you actually use a queue: <code>String next = queue.poll(); if (next == null) { /* nothing to do */ }</code> reads naturally, while wrapping every poll in a try/catch for the exception-throwing twin would be verbose and wrong-shaped for a routine case (echoing the exceptions lesson\'s "exceptions are for the exceptional" rule). Reach for <code>add</code>/<code>remove</code>/<code>element</code> only when hitting an empty/full queue truly IS a programming error you want to fail loudly on.'
      ]
    },
    {
      h: 'PriorityQueue: always serve the most urgent item — but don\'t trust the iteration order',
      p: [
        'A <code>PriorityQueue</code> is a Queue implementation backed by a BINARY HEAP (a compact array, not linked nodes) that keeps one guarantee: <code>poll()</code> always returns the SMALLEST element by natural ordering, or by a <code>Comparator</code> you supply at construction (<code>new PriorityQueue&lt;&gt;(Comparator.comparingInt(Task::priority))</code>). Insert (<code>offer</code>) and remove-the-min (<code>poll</code>) are both O(log n) — the heap does just enough reshuffling to keep the smallest element reachable in O(1) at the root, without maintaining full sorted order everywhere else. That "just enough" is the whole point: a PriorityQueue answers "what\'s most urgent RIGHT NOW?" cheaply, without paying the cost of a fully sorted structure like TreeSet.',
        'The gotcha that trips up nearly everyone the first time: <b>iterating a PriorityQueue (a for-each, or calling <code>toString()</code>) does NOT yield elements in priority order</b> — only <code>poll()</code> (and <code>peek()</code> for the head) is guaranteed to respect priority; the rest of the backing array is merely heap-ordered (each parent ≤ its children), which is a much weaker guarantee than fully sorted. If you print a PriorityQueue directly, or loop over it with a for-each, you\'ll see a jumble that LOOKS wrong but isn\'t — the heap invariant was never promising sorted iteration, only a sorted extraction sequence. To actually walk the queue in priority order, you must repeatedly <code>poll()</code> (which drains it) or drain a COPY: <code>while (!copy.isEmpty()) process(copy.poll());</code>.'
      ]
    },
    {
      h: 'Deque and ArrayDeque: one structure, both ends, replaces Stack and (usually) LinkedList',
      p: [
        'A <code>Deque</code> ("deck," double-ended queue) supports insertion and removal at BOTH ends: <code>addFirst</code>/<code>addLast</code>, <code>removeFirst</code>/<code>removeLast</code>, <code>peekFirst</code>/<code>peekLast</code> (plus offer/poll variants of each, following the same throws-vs-special-value split as Queue). Because it supports both ends, a single Deque implementation naturally plays TWO roles: as a <b>stack</b> — <code>push(e)</code> (= addFirst) and <code>pop()</code> (= removeFirst), LIFO — and as a <b>queue</b> — <code>offer(e)</code> (= addLast) and <code>poll()</code> (= removeFirst), FIFO. <code>ArrayDeque</code> is the modern, default implementation: a resizable circular array (like ArrayList\'s growable-array trick, but able to grow at BOTH ends), giving O(1) amortized operations at either end with the same compact, cache-friendly memory layout ArrayList enjoys over LinkedList.',
        'Two pieces of legacy baggage ArrayDeque replaces, and why: the old <code>java.util.Stack</code> class extends <code>Vector</code>, inheriting synchronized (and therefore slower, uncontended-lock-paying) methods and a needless "is-a Vector" design that lets you accidentally call vector methods that break stack discipline — the Java docs themselves now recommend ArrayDeque instead. And while <code>LinkedList</code> also implements Deque, ArrayDeque beats it here for the same reason it usually loses the List comparison: no per-element node objects, no scattered memory, better cache locality, less overhead — so <b>ArrayDeque is the right default for both stack and queue use</b>, with LinkedList only relevant if you specifically need null elements (ArrayDeque rejects nulls, catching bugs early) or true List-style access alongside deque operations.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Most-Wanted board, the boarding queue, and the plank with two ends',
      text: 'Marine HQ keeps a MOST-WANTED BOARD with one hard rule: one poster per pirate, no duplicates — pin a second poster for a pirate already up there and it\'s simply rejected, the board unchanged (Set: add() on a duplicate returns false, nothing accumulates). The everyday board is HashSet: posters pinned wherever there\'s a free nail, dead fast to check "is this pirate already wanted?" but no order to how they hang (HashSet: O(1) contains, no order). Garp keeps a SECOND board, pinned in the exact chronological order pirates were added — same speed, but now readable as "who got wanted first" (LinkedHashSet: O(1) + insertion order). And the ELITE board — the Top Ten — is kept PERPETUALLY SORTED by bounty amount, automatically re-sorting the instant a new poster with a bigger number goes up (TreeSet: sorted, O(log n), and Garp can ask "who\'s just below Luffy\'s bounty" — floor/ceiling). When two Marine bases compare wanted lists — who do BOTH bases want (intersection), who does EITHER base want (union), who\'s wanted by this base but not that one (difference) — they always work from a COPY of their own board first, because merging or trimming a live board by accident would silently erase real Marine records. At the dock, boarding follows a QUEUE with two disciplines: Sengoku barks orders that FAIL LOUDLY if the ship\'s full or the line\'s empty (add/remove/element throw), while a calmer dock officer just reports "no room" or "nobody\'s waiting" without panic (offer/poll/peek). And when an emergency alert comes in, the fleet doesn\'t process threats first-come-first-served — it always dispatches against the HIGHEST-URGENCY target next, a PRIORITY list where poll always yields the top threat, even though a glance at the whole clipboard shows the REST of the names in no obvious order at all (PriorityQueue: poll is guaranteed correct, the rest of the list is merely heap-ordered, not sorted). Finally, the boarding plank at Sunny\'s side works from BOTH ends at once — Sanji loads supplies on from the stern while crew hop off the bow, and Zoro, training alone, uses that SAME plank as a sword rack, stacking blades on and off one end only (Deque: both ends usable; ArrayDeque plays stack OR queue with the same structure).',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s comic shelf, the whiteboard chore list, and the Cheesecake Factory line',
      text: 'Sheldon\'s comic-book shelf has one rule: he never owns two copies of the same issue — before buying, he checks "do I already have this?" and a duplicate is simply declined at the register (Set: add() on a duplicate is a no-op). Organized for a quick weekend sort, the shelf is a HashSet — instant "do I own this?" checks, but the books sit in no particular order. Organized as his "acquisition log," it\'s a LinkedHashSet — same fast lookups, but now the shelf also reads left-to-right as the exact order he bought each issue. And his SPECIAL "most valuable" case is a TreeSet — permanently sorted by resale value, automatically re-sorting the moment a new comic\'s value is appraised, letting him ask "what\'s the next one below $50" instantly (floor). When Sheldon and Leonard compare convention badges to settle "which cons have we BOTH been to" (intersection) or "which cons has EITHER of us been to" (union), Sheldon insists on working from a PHOTOCOPY of his own badge list first — merging directly into the original, he explains, would be "an unacceptable and irreversible corruption of the primary record." His chore whiteboard runs on Queue discipline: Sheldon\'s own rigid list THROWS a fit (an actual exception, verbally) if you try to add a chore when the board\'s full or remove one when it\'s empty, while Leonard\'s calmer method just quietly reports "no room" or "nothing pending" and moves on. For actual emergencies — a physics deadline, a bus schedule, a Comic Con line — Sheldon runs a PRIORITY list: whatever\'s poll()ed next is guaranteed to be the single most urgent item, even though the rest of the whiteboard, glanced at as a whole, looks completely unordered (the heap promises the front, not the rest). And the Cheesecake Factory take-out counter is one line used two ways: as a plain FIFO queue for walk-ins (first ordered, first served) and, when Sheldon personally drops off and picks back up his OWN order at the same spot, as a LIFO stack (last thing he set down is the first thing he grabs back) — one physical line, both disciplines, exactly like ArrayDeque.',
    },
    why: 'The wanted board / comic shelf is Set: HashSet for speed with no order, LinkedHashSet for speed WITH insertion order, TreeSet for permanent sorting with range queries — and cross-base comparisons (set algebra) always work from a defensive copy so the original board/shelf survives. The dock/whiteboard queue is Queue\'s two method families: add/remove/element throw on failure, offer/poll/peek report failure as a value — prefer the latter since empty/full is routine, not exceptional. The emergency dispatch/urgent-chore list is PriorityQueue: poll() is always correct, but the rest of the list is only heap-ordered, not sorted — never trust a for-each over it for order. And the two-ended plank / Cheesecake Factory line is ArrayDeque: one structure, usable as a stack (push/pop) or a queue (offer/poll), replacing both the legacy Stack class and LinkedList for these roles.'
  },
  storyAnim: {
    title: 'Wanted board, boarding queue, dispatch list, and the two-ended plank',
    h: 320,
    props: [
      { id: 'hashset', emoji: '📌', label: 'HashSet board: instant check, no order', x: 12, y: 10 },
      { id: 'linkedset', emoji: '📋', label: 'LinkedHashSet board: instant + chronological', x: 40, y: 10 },
      { id: 'treeset', emoji: '🏆', label: 'TreeSet board: always sorted by bounty', x: 68, y: 10 },
      { id: 'algebra', emoji: '📑', label: 'compare boards: copy first, then retainAll/addAll/removeAll', x: 90, y: 10 },
      { id: 'throwq', emoji: '📢', label: 'Sengoku: add/remove/element — throws on failure', x: 16, y: 44 },
      { id: 'offerq', emoji: '🧑‍✈️', label: 'dock officer: offer/poll/peek — reports failure', x: 44, y: 44 },
      { id: 'pq', emoji: '🚨', label: 'dispatch list: poll() = most urgent, rest unordered', x: 74, y: 44 },
      { id: 'deque', emoji: '🪵', label: 'two-ended plank: ArrayDeque as stack OR queue', x: 40, y: 80 }
    ],
    actors: [
      { id: 'garp', emoji: '👴', label: 'Garp', x: 10, y: 26 }
    ],
    steps: [
      { c: 'The everyday wanted board (HashSet): pin wherever there\'s room, instant "already wanted?" checks, but no order to the posters.', p: { hashset: 'good' }, a: { garp: [12, 26] } },
      { c: 'Garp\'s chronological board (LinkedHashSet): same instant checks, but now readable in the exact order pirates were added.', p: { linkedset: 'good' } },
      { c: 'The Top Ten board (TreeSet): permanently sorted by bounty, re-sorting itself the instant a bigger number goes up.', p: { treeset: 'lit' } },
      { c: 'Comparing two bases\' boards — who\'s on both, who\'s on either, who\'s only on one — always starts from a COPY, or the original board gets silently altered.', p: { algebra: 'good' } },
      { c: 'Sengoku\'s boarding orders throw loudly if the ship\'s full or the line\'s empty — add/remove/element, the exception-throwing family.', p: { throwq: 'bad' } },
      { c: 'The calmer dock officer just reports "no room" or "no one\'s waiting" as a value instead of panicking — offer/poll/peek, the special-value family. Prefer this one.', p: { offerq: 'good' } },
      { c: 'Emergency dispatch always pulls the single most urgent target next (poll is guaranteed correct) — but a glance at the WHOLE clipboard shows the rest in no obvious order. Never trust a for-each over a PriorityQueue for ordering.', p: { pq: 'bad' } },
      { c: 'The boarding plank works from both ends — Sanji loads from the stern while crew hop off the bow (queue), and Zoro racks swords on and off one end alone (stack). One ArrayDeque, both disciplines.', p: { deque: 'lit' } }
    ]
  },
  conceptFlow: {
    title: 'Choosing among Sets, Queues, and Deques',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Set: pick by order/speed',
        nodes: [
          { id: 'hashset', text: 'HashSet\nO(1), no order — default' },
          { id: 'linkedhashset', text: 'LinkedHashSet\nO(1) + insertion order' },
          { id: 'treeset', text: 'TreeSet\nO(log n), always sorted, range queries' }
        ]
      },
      {
        label: 'Set algebra',
        nodes: [
          { id: 'copyfirst', text: 'copy first!\nnew HashSet<>(a)' },
          { id: 'setops', text: 'addAll = union\nretainAll = intersection\nremoveAll = difference' }
        ]
      },
      {
        label: 'Queue: pick a method family',
        nodes: [
          { id: 'throwsfam', text: 'add/remove/element\nthrows on failure' },
          { id: 'specialfam', text: 'offer/poll/peek\nreturns null/false — prefer this' }
        ]
      },
      {
        label: 'Priority and both ends',
        nodes: [
          { id: 'pq', text: 'PriorityQueue\npoll() = min, iteration ≠ sorted!' },
          { id: 'deque', text: 'ArrayDeque\nstack (push/pop) or queue (offer/poll)' }
        ]
      }
    ],
    steps: [
      { active: ['hashset'], note: 'Default Set: fast membership testing, no ordering guarantee — exactly like HashMap, because it IS one underneath (elements become keys).' },
      { active: ['linkedhashset'], note: 'Same O(1) speed as HashSet, plus a threaded linked list giving predictable insertion-order iteration — good for de-duplicating while preserving first-seen order.' },
      { active: ['treeset'], note: 'Backed by TreeMap: always sorted (natural order or Comparator), O(log n), and NavigableSet methods (first/last/higher/lower/ceiling/floor) for range queries.' },
      { active: ['copyfirst'], note: 'retainAll/removeAll/addAll all MUTATE the receiver. Always copy the set you need to keep before doing set algebra on it.' },
      { active: ['setops'], note: 'union = copy + addAll(other); intersection = copy + retainAll(other); difference = copy + removeAll(other). Three lines each, always starting from a defensive copy.' },
      { active: ['throwsfam'], note: 'add(e)/remove()/element() throw IllegalStateException or NoSuchElementException on failure — treats empty/full as exceptional.' },
      { active: ['specialfam'], note: 'offer(e)/poll()/peek() return false/null on failure instead — matches the routine, expected nature of an empty or full queue. Prefer these in almost all code.' },
      { active: ['pq'], note: 'PriorityQueue is a binary heap: poll() always returns the smallest (or Comparator-defined highest-priority) element in O(log n) — but iterating it (for-each, toString) shows only heap order, NOT sorted order. Only the head is guaranteed.' },
      { active: ['deque'], note: 'ArrayDeque supports both ends: push/pop for LIFO stack behavior, offer/poll for FIFO queue behavior — one resizable-array structure replacing both java.util.Stack and LinkedList for these roles.' }
    ]
  },
  tech: [
    {
      q: 'Compare HashSet, LinkedHashSet, and TreeSet — internals, complexity, and when you\'d pick each.',
      a: 'All three enforce Set\'s no-duplicates contract, and all three are literally built on top of the corresponding Map from the maps lesson — a Set implementation stores your elements as Map KEYS with a shared dummy value. HashSet is backed by a HashMap: elements are hashed to buckets via hashCode, disambiguated within a bucket via equals, giving O(1) average add/contains/remove with NO ordering guarantee — it inherits every HashMap property, including the danger of mutating a field an already-stored element\'s hashCode depends on (the element gets stranded in the wrong bucket, just like a mutated HashMap key). LinkedHashSet is backed by a LinkedHashMap: same O(1) average operations, but a doubly-linked list threads through the entries so iteration order is INSERTION order (or access order, if configured, though that\'s far more common for LinkedHashMap\'s LRU-cache use case than for sets) — you pay a little extra memory for that linked list and get predictable iteration in return. TreeSet is backed by a TreeMap (a red-black tree): elements stay continuously SORTED by natural ordering (Comparable) or a supplied Comparator, giving O(log n) add/contains/remove (slower than the hash-based two) but continuous sortedness plus NavigableSet operations — first(), last(), higher(x), lower(x), ceiling(x), floor(x), and headSet/tailSet/subSet range views. My decision rule mirrors the maps lesson exactly: HashSet is the default when I just need fast "have I seen this?" checks and don\'t care about order; LinkedHashSet when I additionally want stable, insertion-ordered iteration (e.g., de-duplicating a stream while preserving first-seen order for display); TreeSet when the collection itself must stay sorted or I need range/nearest-neighbor queries. And the equals/hashCode contract from Part 1 is load-bearing for the first two exactly as it is for HashMap/LinkedHashMap keys, while TreeSet instead requires elements to be mutually comparable.'
    },
    {
      q: 'How do you compute union, intersection, and difference of two sets in Java, and what\'s the classic mistake?',
      a: 'Java gives you set algebra through ordinary Collection methods used pairwise: union is a.addAll(b) (b\'s elements merged into a, duplicates silently absorbed since a is a Set); intersection is a.retainAll(b) (a keeps only elements also present in b, discarding the rest); difference is a.removeAll(b) (a loses any element also present in b). The classic mistake — and it bites almost everyone once — is calling these DIRECTLY on a set you still need afterward: all three MUTATE the receiver in place. Set<String> mine = repository.getTags(); mine.retainAll(other.getTags()); doesn\'t just compute an intersection, it OVERWRITES repository\'s actual tag set, silently corrupting stored state (the Part 1 mutable-state-leak family of bug, now via a return value you then mutate). The fix is a defensive copy BEFORE the algebra: Set<String> intersection = new HashSet<>(mine); intersection.retainAll(other.getTags()); — now the original mine is untouched and intersection holds the computed result. I pick the copy\'s concrete type the same way as any set: HashSet for a throwaway result, LinkedHashSet if the result\'s iteration order matters (e.g., preserve the order elements appeared in the first set), TreeSet if the result should stay sorted. The one-sentence rule I apply automatically now: any time I see retainAll, removeAll, or addAll, I ask "do I need the receiver afterward?" — if yes, copy first.'
    },
    {
      q: 'Explain the Queue interface\'s two method families and why you\'d prefer one over the other.',
      a: 'Queue deliberately duplicates every core operation into two families that differ only in how they signal failure. The "throws" family — add(e), remove(), element() — behaves like a strict Collection: add(e) throws IllegalStateException if the queue is capacity-restricted and full; remove() and element() throw NoSuchElementException if the queue is empty. The "special value" family — offer(e), poll(), peek() — does the SAME operations but reports failure through a return value instead: offer(e) returns false if it couldn\'t insert; poll() and peek() return null if the queue is empty (which is also why these methods forbid storing null elements in most queue implementations — null is reserved as the "nothing here" signal). My default is the special-value family in essentially all code, because an empty or full queue is a ROUTINE, expected state for a queue to be in — not a programming error — so representing it as a checkable value (if (queue.poll() == null) { ... }) reads naturally and matches how queues actually get used, the same "exceptions are for the exceptional" principle from the exceptions lesson. I reach for add/remove/element only when hitting empty or full genuinely IS a bug I want to fail loudly and immediately on — for instance, a fixed-capacity queue where offering past capacity should never happen and, if it does, I want a stack trace, not a silently-dropped item.'
    },
    {
      q: 'How does PriorityQueue work internally, and what\'s the #1 mistake people make with it?',
      a: 'PriorityQueue is backed by a BINARY HEAP stored in a plain resizable array (not linked nodes) — a compact tree-shaped structure where every parent is ≤ its children (for the default min-heap; a Comparator can invert this). That single invariant is enough to guarantee that the SMALLEST (or highest-priority, by your Comparator) element is always at index 0 / the root, so peek() is O(1). offer(e) appends the new element and "sifts it up" past any larger parents until the heap property holds again — O(log n). poll() removes the root, moves the LAST element into its place, and "sifts it down" past smaller children until the property holds — also O(log n). The heap deliberately does the MINIMUM work needed to keep the root correct; it does NOT maintain full sorted order among the other elements, because that would cost more (that\'s exactly what TreeSet/TreeMap do instead, at a genuine cost). The #1 mistake — I\'ve made it myself — is treating PriorityQueue as if it iterates in sorted order: a for-each loop, or printing the queue directly, walks the underlying array in heap order, which only guarantees each parent ≤ its children, NOT that element 1 ≤ element 2 ≤ element 3 in sequence. The output looks "almost sorted but wrong," which is more confusing than obviously broken. The only ways to get elements out in true priority order are to repeatedly poll() (which drains the queue) or to poll() a COPY of it if you still need the original. The practical takeaway I give people: PriorityQueue answers "what\'s most urgent right now," cheaply and repeatedly — it is not a sorted-view data structure, and if you need a live sorted VIEW rather than a drain-to-extract structure, that\'s what TreeSet is for.'
    }
  ],
  code: {
    title: 'LogPose triage: unique tags, urgent ideas, and a browsing history stack',
    intro: 'A research-log app needs all three: a de-duplicated, order-preserving tag set; a queue that always serves the most urgent idea next; and a two-ended history you can both push onto and pop from. This shows the right default for each.',
    code: `import java.util.*;

class Idea implements Comparable<Idea> {
    final String text;
    final int priority;   // 1 = most urgent, matches min-heap "smallest first"

    Idea(String text, int priority) { this.text = text; this.priority = priority; }

    @Override public int compareTo(Idea other) { return Integer.compare(this.priority, other.priority); }
    @Override public String toString() { return "[P" + priority + "] " + text; }
}

class Backlog {
    // Unique tags, but the ORDER they were first used still matters for display.
    private final Set<String> tags = new LinkedHashSet<>();

    // Always serve the most urgent idea next; a heap, not a sorted list.
    private final PriorityQueue<Idea> ideas = new PriorityQueue<>();

    // Recently-viewed entries: usable as a stack (undo the last view) via push/pop.
    private final Deque<String> recentlyViewed = new ArrayDeque<>();

    boolean tag(String t) { return tags.add(t); }              // false if already tagged (dedupe)
    Set<String> tags()    { return Collections.unmodifiableSet(tags); }

    void flag(Idea idea)  { ideas.offer(idea); }                // O(log n) insert
    Idea nextUrgent()     { return ideas.poll(); }              // O(log n), always the smallest-priority

    void view(String entryId) { recentlyViewed.push(entryId); } // addFirst — most recent on top
    String back()              { return recentlyViewed.poll(); } // FIFO from the front... see notes

    public static void main(String[] args) {
        Backlog log = new Backlog();

        System.out.println("tag 'flaky-tests': " + log.tag("flaky-tests"));   // true — new
        System.out.println("tag 'embeddings': "  + log.tag("embeddings"));    // true — new
        System.out.println("tag 'flaky-tests': " + log.tag("flaky-tests"));   // false — duplicate, ignored
        System.out.println("tags in insertion order: " + log.tags());        // [flaky-tests, embeddings]

        log.flag(new Idea("investigate timeout flakiness", 2));
        log.flag(new Idea("embedding cache eviction bug", 1));   // most urgent — smallest number
        log.flag(new Idea("mentoring notes cleanup", 3));

        System.out.println("next urgent: " + log.nextUrgent());  // [P1] embedding cache eviction bug
        System.out.println("next urgent: " + log.nextUrgent());  // [P2] investigate timeout flakiness

        // THE GOTCHA — do NOT trust a for-each for priority order:
        PriorityQueue<Idea> demo = new PriorityQueue<>(
            List.of(new Idea("c", 3), new Idea("a", 1), new Idea("b", 2)));
        System.out.print("for-each over PriorityQueue (NOT sorted!): ");
        for (Idea i : demo) System.out.print(i + " ");           // heap order, NOT [P1] [P2] [P3]
        System.out.println();

        log.view("entry-42");
        log.view("entry-7");
        System.out.println("most recently viewed (peekFirst): " + log.recentlyViewed.peekFirst()); // entry-7
    }
}`,
    notes: [
      'tags is a LinkedHashSet: O(1) dedupe like the maps lesson\'s HashMap, plus insertion-order iteration for a stable UI list. tag() returning boolean is the same "did this actually change anything?" signal Set.add gives you for free.',
      'ideas is a PriorityQueue<Idea> using Idea\'s natural ordering (compareTo by priority, smallest first = most urgent). offer/poll are the special-value Queue family — no exceptions for the routine "queue is empty" case.',
      'The demo for-each block is deliberate: it prints the SAME three ideas in heap order, not [P1] [P2] [P3], to make the "iteration ≠ sorted" gotcha visible rather than just described. Run: javac Backlog.java Idea.java && java Backlog (or one file with both classes).',
      'recentlyViewed uses push() (addFirst) in view() but poll() (removeFirst too, since ArrayDeque\'s poll is FIFO from the head) in back() — on purpose, both push and poll operate on the SAME end (the front), so this actually behaves as a stack end-to-end (LIFO), which is exactly what "undo the last view" needs; peekFirst confirms the most recent entry sits at the front.'
    ]
  },
  lab: {
    title: 'Build a review-assignment triage board',
    prompt: 'Write a class <code>ReviewBoard</code> that combines all three structures. Fields: (1) a <code>Set&lt;String&gt;</code> field named <code>reviewers</code> — declared as <code>Set</code>, built as <code>LinkedHashSet</code> — tracking unique reviewer names in the order first added; (2) a <code>PriorityQueue&lt;String&gt;</code> field named <code>urgent</code> holding paper titles, using NATURAL STRING ORDERING (no custom Comparator needed for this lab); (3) a <code>Deque&lt;String&gt;</code> field named <code>history</code> used as a STACK (push/pop only). Methods: <code>boolean addReviewer(String name)</code> (returns whether it was newly added); <code>void flagUrgent(String title)</code> (offer onto the priority queue); <code>String nextUrgent()</code> (poll the priority queue); <code>void open(String title)</code> (push onto history); <code>String closeLast()</code> (pop history).',
    starter: `import java.util.*;

class ReviewBoard {
    private final Set<String> reviewers = new LinkedHashSet<>();
    private final PriorityQueue<String> urgent = new PriorityQueue<>();
    private final Deque<String> history = new ArrayDeque<>();

    boolean addReviewer(String name) {
        // add to reviewers, return whether it was newly added
        return false; // replace
    }

    void flagUrgent(String title) {
        // offer onto urgent
    }

    String nextUrgent() {
        // poll from urgent
        return null; // replace
    }

    void open(String title) {
        // push onto history
    }

    String closeLast() {
        // pop from history
        return null; // replace
    }
}`,
    checks: [
      { re: 'Set\\s*<\\s*String\\s*>\\s+reviewers\\s*=\\s*new\\s+LinkedHashSet', must: true, hint: 'reviewers must be declared Set<String> but constructed as LinkedHashSet — order-preserving dedupe.', pass: 'LinkedHashSet reviewers ✓' },
      { re: 'PriorityQueue\\s*<\\s*String\\s*>\\s+urgent\\s*=\\s*new\\s+PriorityQueue', must: true, hint: 'urgent must be a PriorityQueue<String>.', pass: 'PriorityQueue urgent ✓' },
      { re: 'Deque\\s*<\\s*String\\s*>\\s+history\\s*=\\s*new\\s+ArrayDeque', must: true, hint: 'history must be declared Deque<String> but constructed as ArrayDeque.', pass: 'ArrayDeque history ✓' },
      { re: 'reviewers\\.add\\s*\\(', must: true, hint: 'addReviewer must call reviewers.add(name) and return its boolean result.', pass: 'addReviewer uses Set.add ✓' },
      { re: 'urgent\\.offer\\s*\\(', must: true, hint: 'flagUrgent must call urgent.offer(title).', pass: 'flagUrgent uses offer ✓' },
      { re: 'urgent\\.poll\\s*\\(', must: true, hint: 'nextUrgent must call urgent.poll().', pass: 'nextUrgent uses poll ✓' },
      { re: 'history\\.push\\s*\\(', must: true, hint: 'open must call history.push(title) — stack discipline.', pass: 'open uses push ✓' },
      { re: 'history\\.pop\\s*\\(', must: true, hint: 'closeLast must call history.pop() — stack discipline.', pass: 'closeLast uses pop ✓' }
    ],
    run: 'add a main method: addReviewer a couple names (repeat one to see false), flagUrgent a few titles out of alphabetical order and confirm nextUrgent() returns them alphabetically, open a couple titles and confirm closeLast() returns the LAST one opened first (LIFO). javac ReviewBoard.java && java ReviewBoard.',
    solution: `import java.util.*;

class ReviewBoard {
    private final Set<String> reviewers = new LinkedHashSet<>();
    private final PriorityQueue<String> urgent = new PriorityQueue<>();
    private final Deque<String> history = new ArrayDeque<>();

    boolean addReviewer(String name) {
        return reviewers.add(name);
    }

    void flagUrgent(String title) {
        urgent.offer(title);
    }

    String nextUrgent() {
        return urgent.poll();
    }

    void open(String title) {
        history.push(title);
    }

    String closeLast() {
        return history.pop();
    }

    public static void main(String[] args) {
        ReviewBoard board = new ReviewBoard();
        System.out.println(board.addReviewer("Nami"));   // true
        System.out.println(board.addReviewer("Nami"));   // false — duplicate

        board.flagUrgent("Zoro's paper");
        board.flagUrgent("Ace's paper");
        board.flagUrgent("Luffy's paper");
        System.out.println(board.nextUrgent());          // Ace's paper (alphabetically first)
        System.out.println(board.nextUrgent());          // Luffy's paper

        board.open("entry-1");
        board.open("entry-2");
        System.out.println(board.closeLast());           // entry-2 — last opened, first closed (LIFO)
        System.out.println(board.closeLast());           // entry-1
    }
}`,
    notes: [
      'addReviewer returning Set.add\'s own boolean is the idiomatic pattern — Set already tells you whether anything changed, no need to check contains() first (which would also be a wasted second lookup).',
      'urgent uses String\'s natural (alphabetical) ordering since no Comparator was supplied — poll() always returns the alphabetically-first remaining title, which is why "Ace" beats "Luffy" and "Zoro" despite insertion order.',
      'history is used ONLY with push/pop (both operate on the front), which is what makes it behave as a clean LIFO stack — mixing in offer/poll (which also touch the front for offer but the same front for poll on ArrayDeque\'s Queue view) is exactly the kind of end-mixing that makes Deque code confusing; pick one discipline per Deque field and stick to it.'
    ]
  },
  quiz: [
    {
      q: 'What is a HashSet, structurally, and what does that tell you about its ordering and its equals/hashCode requirement?',
      options: ['A HashSet is backed by a HashMap (elements become keys) — so it has O(1) average operations, NO ordering guarantee, and requires a correct, stable equals/hashCode pair on its elements, exactly like HashMap keys', 'A HashSet is a sorted array with binary search', 'A HashSet is backed by a linked list for insertion order', 'A HashSet has no relationship to any Map implementation'],
      correct: 0,
      explain: 'HashSet literally wraps a HashMap internally. Every HashMap property transfers: O(1) average add/contains, no order, and the same equals/hashCode contract and mutated-key-field danger from the maps lesson.'
    },
    {
      q: 'You need to compute the intersection of two sets but must NOT modify either original set. What\'s the correct code?',
      options: ['Set<T> result = new HashSet<>(a); result.retainAll(b); — copy first, then retainAll, so a and b stay untouched', 'a.retainAll(b); — directly, since retainAll returns the intersection', 'Set<T> result = a; result.retainAll(b); — assignment makes a safe copy', 'Use a.equals(b) to check if they intersect'],
      correct: 0,
      explain: 'retainAll/removeAll/addAll all mutate the RECEIVER in place. Copying into a new set first (new HashSet<>(a)) before calling retainAll(b) is the only way to compute an intersection without corrupting either original — a plain assignment (result = a) does NOT copy, it aliases the same set.'
    },
    {
      q: 'Why would you generally prefer offer/poll/peek over add/remove/element on a Queue?',
      options: ['Because an empty or full queue is a routine, expected condition, not a programming error — offer/poll/peek report that as a value (false/null) instead of throwing, matching how queues are normally used', 'Because add/remove/element don\'t exist on all Queue implementations', 'Because offer/poll/peek are always faster (better Big-O)', 'Because add/remove/element are deprecated'],
      correct: 0,
      explain: 'Both families do the same work; they differ only in failure signaling. offer/poll/peek treat empty/full as routine (return false/null), while add/remove/element treat it as exceptional (throw) — the "exceptions are for the exceptional" principle applied to queues.'
    },
    {
      q: 'You build a PriorityQueue<Integer> with several values, then print it with a for-each loop. What do you see?',
      options: ['The elements in heap order — NOT sorted order; only poll() (and peek() for the head) is guaranteed to respect priority, the rest of the internal array is merely heap-ordered', 'The elements in fully sorted ascending order, guaranteed', 'A compile error — PriorityQueue isn\'t iterable', 'The elements in the order they were inserted (offer order)'],
      correct: 0,
      explain: 'A PriorityQueue only guarantees that poll() returns the smallest element next — the heap invariant (parent ≤ children) is weaker than full sorted order, so a for-each or toString() shows heap order, which looks "almost right" but isn\'t sorted. To get sorted output, repeatedly poll (draining the queue or a copy of it).'
    },
    {
      q: 'What does ArrayDeque replace, and why is it usually the better choice?',
      options: ['It replaces both java.util.Stack (legacy, extends Vector, synchronized/slower) and LinkedList (per-element node overhead, poor cache locality) for stack and queue use, offering O(1) amortized operations at both ends with a compact, cache-friendly resizable array', 'It only replaces ArrayList and has nothing to do with stacks or queues', 'It replaces HashMap for key-value storage', 'It is slower than both Stack and LinkedList but offers more methods'],
      correct: 0,
      explain: 'ArrayDeque is a resizable circular array supporting both ends — push/pop for a stack, offer/poll for a queue — without Stack\'s legacy Vector baggage (synchronized methods) or LinkedList\'s per-node memory overhead and cache-unfriendliness. The Java docs themselves recommend it over both for these roles.'
    }
  ],
  testFlow: {
    title: 'Test yourself: sets, queues, and deques under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You need a collection of unique tag strings that also preserves the exact order tags were first added, for a stable UI list. Which Set implementation?',
        choices: [
          { text: 'LinkedHashSet — O(1) average dedupe like HashSet, plus a threaded linked list that gives predictable insertion-order iteration', to: 'q1_right' },
          { text: 'HashSet — it\'s the fastest Set, so it must be the right default here too', to: 'q1_wrong_hash' },
          { text: 'TreeSet — sets are always sorted in Java', to: 'q1_wrong_tree' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — LinkedHashSet gives you HashSet\'s O(1) dedupe speed PLUS stable insertion-order iteration via its internal linked list, exactly matching "unique AND in first-added order." HashSet would drop the order guarantee; TreeSet would reorder alphabetically instead of preserving insertion order.', next: 'q2' },
      q1_wrong_hash: { end: true, correct: false, text: 'HashSet is fast but gives NO ordering guarantee at all — iterating it would show tags in an arbitrary bucket order, not the order they were added. LinkedHashSet keeps the same O(1) speed and adds the insertion-order guarantee you actually need.', retry: 'q1' },
      q1_wrong_tree: { end: true, correct: false, text: 'Sets are not "always sorted" — only TreeSet is, and it sorts by natural/Comparator order (e.g., alphabetically), NOT by insertion order, so it would scramble the "first added" sequence you want to preserve. LinkedHashSet is the one that preserves insertion order.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A PriorityQueue<Task> ranks tasks by urgency. A teammate writes `for (Task t : queue) log.info(t)` expecting the log to print tasks from most to least urgent. What actually happens, and the fix?',
        choices: [
          { text: 'The for-each prints tasks in heap order, NOT sorted priority order — only poll() is guaranteed correct; to log them in priority order, repeatedly poll() a COPY of the queue instead', to: 'q2_right' },
          { text: 'Nothing is wrong — PriorityQueue always iterates in priority order', to: 'q2_wrong_assume' },
          { text: 'The code won\'t compile because PriorityQueue isn\'t Iterable', to: 'q2_wrong_compile' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — the heap only guarantees the ROOT (via poll/peek) is the most urgent; the rest of the backing array is merely heap-ordered, not sorted, so a for-each shows a jumble that looks "almost right." Draining a copy with repeated poll() is the correct way to observe true priority order without destroying the original queue.', next: 'q3' },
      q2_wrong_assume: { end: true, correct: false, text: 'This is the classic gotcha — PriorityQueue explicitly does NOT guarantee iteration order matches priority, only that poll() returns the next-most-urgent element. A for-each will print a heap-ordered jumble, not a sorted list.', retry: 'q2' },
      q2_wrong_compile: { end: true, correct: false, text: 'PriorityQueue does implement Collection (and therefore Iterable), so the for-each compiles fine and runs — it just doesn\'t produce the sorted order your teammate expected. The bug is a logic mistake about iteration order, not a compile error.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'You need a stack for an undo feature. Should you use java.util.Stack, LinkedList, or ArrayDeque, and why?',
        choices: [
          { text: 'ArrayDeque via push/pop — it avoids Stack\'s legacy Vector baggage (synchronized methods) and LinkedList\'s per-node memory overhead, giving O(1) amortized push/pop on a compact, cache-friendly array; the JDK docs recommend it over both', to: 'q3_right' },
          { text: 'java.util.Stack — it\'s literally named "Stack," so it must be the intended tool', to: 'q3_wrong_stack' },
          { text: 'LinkedList — it\'s the fastest option for stack operations because it\'s a linked structure', to: 'q3_wrong_linked' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — ArrayDeque is the modern default for stack (and queue) use: no synchronized-method overhead like the legacy Stack class, no per-element node allocation like LinkedList, and O(1) amortized operations at either end on a resizable circular array. push()/pop() give you clean LIFO semantics.', next: null },
      q3_wrong_stack: { end: true, correct: false, text: 'The name is misleading — java.util.Stack extends Vector, inheriting synchronized (slower under normal single-threaded use) methods and a Vector "is-a" surface that lets you break stack discipline by calling non-stack methods. The JDK docs themselves recommend ArrayDeque instead.', retry: 'q3' },
      q3_wrong_linked: { end: true, correct: false, text: 'LinkedList CAN act as a stack (it implements Deque too), but each element costs a separate node object with two extra references, and the scattered nodes hurt cache locality — the same reason LinkedList usually loses the List comparison. ArrayDeque\'s compact array beats it here too.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Assuming a HashSet iterates in a useful order — it doesn\'t promise ANY order. Use LinkedHashSet if insertion order matters, TreeSet if sorted order matters.',
    'Calling retainAll/removeAll/addAll directly on a set you still need afterward — all three MUTATE the receiver. Always copy first: new HashSet<>(original) before doing set algebra.',
    'Trusting a for-each (or toString()) over a PriorityQueue to show elements in priority order — only poll()/peek() are guaranteed correct; the rest is merely heap-ordered. Drain a copy with repeated poll() if you need true sorted order.',
    'Using java.util.Stack for new code — it extends Vector, inheriting synchronized methods and a leaky "is-a Vector" surface. Use ArrayDeque with push/pop instead.',
    'Mixing add/remove/element with offer/poll/peek inconsistently and being surprised by an exception — pick the special-value family (offer/poll/peek) by default since empty/full is a routine condition, not exceptional.',
    'Storing null in an ArrayDeque or PriorityQueue — both reject nulls (throw NullPointerException) because null is reserved as the "nothing here" sentinel for poll()/peek(). Use a sentinel value or Optional instead.'
  ],
  interview: [
    {
      q: 'Compare HashSet, LinkedHashSet, and TreeSet, and connect each one to the Map it\'s built on.',
      a: 'All three are literally thin wrappers over the corresponding Map from the maps lesson: your elements become Map keys with a shared dummy value. HashSet wraps HashMap: hashCode buckets the element, equals disambiguates within a bucket, giving O(1) average add/contains/remove with no ordering guarantee — and it inherits the same danger as HashMap keys, where mutating a field an element\'s hashCode depends on strands it in the wrong bucket. LinkedHashSet wraps LinkedHashMap: identical O(1) average speed, plus a doubly-linked list threading through entries that gives predictable insertion-order iteration, useful for de-duplicating a stream while preserving first-seen order. TreeSet wraps TreeMap (a red-black tree): elements stay continuously sorted by natural ordering or a supplied Comparator, at O(log n) per operation instead of O(1), but you get NavigableSet\'s range and nearest-neighbor operations — first/last/higher/lower/ceiling/floor and headSet/tailSet/subSet views. My rule for picking: HashSet by default for pure membership testing; LinkedHashSet when I also want stable iteration order at the same speed; TreeSet when the set itself needs to stay sorted or I need range queries. The equals/hashCode contract from Part 1 governs HashSet and LinkedHashSet elements exactly as it governs HashMap/LinkedHashMap keys; TreeSet instead requires elements to implement Comparable or be given a Comparator, and uses THAT — not equals — to determine uniqueness (a subtle trap: two "unequal by equals but compareTo-equal" elements collapse into one in a TreeSet).'
    },
    {
      q: 'Walk through how PriorityQueue works internally and explain the single most common mistake people make with it.',
      a: 'PriorityQueue is a binary heap stored in a plain array — a tree-shaped structure obeying one invariant: every parent is less-than-or-equal-to its children (min-heap, by natural order or a supplied Comparator). That invariant alone guarantees the smallest/highest-priority element sits at the root (index 0), so peek() is O(1). offer(e) appends the element at the end of the array and "sifts it up," swapping with its parent repeatedly while it\'s smaller, until the heap property is restored — O(log n) because the tree height is log n. poll() takes the root (the answer), moves the LAST array element into the root\'s spot, then "sifts it down" past smaller children until the property holds again — also O(log n). Crucially, the heap does the MINIMUM work to keep the root correct; it never bothers keeping the rest of the array sorted, because that extra ordering is never needed for the queue\'s actual job (that\'s what a TreeSet/TreeMap is for, at a real ongoing cost). The single most common mistake — I\'ve watched it happen live in code review — is treating PriorityQueue as an always-sorted collection: a for-each loop, or logging the queue directly, walks the backing array in raw heap order, which is NOT the same as priority order — only parent ≤ children is guaranteed, not element[1] ≤ element[2] ≤ element[3] across the whole array. The output looks plausible but wrong, which is worse than an obvious crash. The fix, when you genuinely need elements in priority order (not just "give me the next one"), is to repeatedly poll() — either draining the real queue if you\'re done with it, or draining a COPY (new PriorityQueue<>(original)) if you still need the original intact afterward.'
    },
    {
      q: 'What\'s the difference between the Queue methods add/remove/element and offer/poll/peek, and which should you default to?',
      a: 'They perform identical operations — add/offer insert an element, remove/poll remove-and-return the head, element/peek look at the head without removing — but they signal FAILURE completely differently. add(e) throws IllegalStateException if a capacity-bounded queue is full; remove() and element() throw NoSuchElementException if the queue is empty. offer(e) instead returns false if it couldn\'t insert; poll() and peek() return null if the queue is empty. My default in almost all code is the offer/poll/peek family, because an empty or full queue is a completely ROUTINE state — queues empty out during normal operation, bounded queues can fill up under load — not a programming error, so representing that as a checkable return value (String next = queue.poll(); if (next == null) return;) is both the natural control flow and avoids paying for exception construction/unwinding on a common path. This is the same "exceptions are for exceptional conditions, not routine control flow" principle from the exceptions lesson, applied specifically to queues. I reach for add/remove/element only in the rarer case where hitting empty/full truly IS a bug I want to fail loudly on immediately — e.g., a queue I\'ve proven by design can never legitimately be polled when empty, where a silent null would hide a real defect rather than represent a normal state. One side effect worth knowing: because poll/peek use null as the "nothing here" signal, most Queue implementations (including PriorityQueue and ArrayDeque) reject null elements outright, throwing NullPointerException on offer(null) — which is actually helpful, since it stops null from ever being ambiguous between "a stored null" and "empty."'
    },
    {
      q: 'What does ArrayDeque give you that java.util.Stack and LinkedList don\'t, and how do you use one structure as both a stack and a queue?',
      a: 'ArrayDeque is a resizable, double-ended array (a circular buffer, conceptually similar to ArrayList\'s growable-array trick but able to grow at BOTH ends) implementing the Deque interface, which exposes addFirst/addLast, removeFirst/removeLast, and peekFirst/peekLast (plus offer/poll variants of each). Because both ends support O(1) amortized insertion and removal with a compact, cache-friendly memory layout, one ArrayDeque instance can play two different roles just by which methods you call: as a STACK, use push(e) (which is addFirst) and pop() (removeFirst) — LIFO, last pushed is first popped; as a QUEUE, use offer(e) (addLast) and poll() (removeFirst) — FIFO, first offered is first polled. It replaces two older tools for these exact roles. Against java.util.Stack: Stack extends Vector, which means every method is synchronized (paying uncontended-lock overhead even in single-threaded code) and Stack inherits Vector\'s full API surface, so nothing stops you from calling insertElementAt or remove(int index) and quietly breaking stack discipline from outside — the JDK documentation itself recommends ArrayDeque instead. Against LinkedList (which also implements Deque and could serve either role): ArrayDeque avoids LinkedList\'s per-element node allocation (two extra reference fields and a separate heap object per entry) and the resulting scattered, cache-unfriendly memory layout — the same array-vs-nodes tradeoff that makes ArrayList beat LinkedList for most List use. The one case LinkedList still wins is if you specifically need to store null elements, since ArrayDeque (like most Deque/Queue implementations) rejects null to keep poll()/peek()\'s null-means-empty signal unambiguous. My default, and what I\'d tell a team: ArrayDeque for both stack and queue use, unless you have a specific, checked reason to reach for something else.'
    }
  ]
};
