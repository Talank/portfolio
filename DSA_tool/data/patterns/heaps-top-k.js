window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['heaps-top-k'] = {
  id: 'heaps-top-k',
  title: 'Heaps / Top-K / K-Way Merge',
  category: 'Trees & Graphs',
  timeMin: 12,
  summary: 'Maintain a size-k heap to track the "best k so far" in O(n log k), or merge k sorted sources by always popping the current global minimum in O(log k).',
  concept: [
    'A heap is a binary tree stored implicitly in an array where every parent satisfies the heap property relative to its children (min-heap: parent ≤ children). Python\'s <code>heapq</code> module only implements a <b>min-heap</b> — there is no built-in max-heap, so "kth largest" problems require inverting the comparison (negate values, or use the min-heap-of-size-k trick below) rather than reaching for a max-heap that doesn\'t exist.',
    'The <b>top-k</b> application: to track the k largest elements seen so far in a stream, counterintuitively maintain a <b>min-heap</b> of size k. Push every new element, and if the heap grows past size k, pop the smallest — whatever survives is always the current top-k, and the heap\'s root (the minimum of the survivors) is exactly the kth largest overall. This gives O(n log k), which beats a full O(n log n) sort whenever k is much smaller than n.',
    'The <b>k-way merge</b> application is a different use of the same data structure: given k sorted sources, keep one "frontier" candidate per source in a heap of size k, repeatedly pop the global minimum (O(log k)) and push that source\'s next element. This turns an O(k) linear scan-for-minimum at each step into O(log k), and is the mechanism behind merging k sorted lists and behind external/streaming merge sort.',
    'The size-k min-heap\'s correctness for top-k rests on a loop invariant provable by induction on the number of elements processed: after processing the first i elements, the heap contains exactly the k largest values among those i elements (or all of them, if i < k). The inductive step: when element i+1 arrives, it\'s pushed in, temporarily giving the heap the k+1 largest-so-far candidates plus the new one — but the subsequent pop removes the minimum of that size-(k+1) set, and that minimum is provably not among the true top-k of the first i+1 elements, since at least k other surviving values are all ≥ it. Because the invariant holds after processing all n elements, <code>heap[0]</code> — the minimum of the surviving k — is exactly the kth largest overall, not an approximation of it.',
  ],
  recognitionSignals: [
    '"Kth largest/smallest", "top k frequent", "k closest points to origin" — direct top-k phrasing.',
    'Need a running/streaming top-k as data arrives incrementally and re-sorting from scratch each time would be wasteful (e.g. a class with a persistent add() method).',
    '"Merge k sorted lists/arrays/streams" — k-way merge, a related but distinct heap application from top-k.',
    'If k is close to n, plain sorting (O(n log n)) is simpler and asymptotically similar — heaps specifically win when k << n, so check whether the problem\'s constraints make that gap meaningful before reaching for a heap.',
  ],
  complexity: 'Time: O(n log k) to scan n elements while maintaining a size-k heap (each push/pop is O(log k)); O(n log k) for k-way merge over n total elements across k sources. Space: O(k) for the heap.',
  canonical: {
    name: 'Kth Largest Element in an Array (LeetCode 215)',
    statement: 'Given an integer array nums and an integer k, return the kth largest element in the array — note this is the kth largest in sorted order, not the kth distinct largest.',
  },
  story: {
    onePiece: {
      title: 'Cipher Pol\'s running top-10 bounty board, and the Den Den Mushi merge',
      text: [
        'Cipher Pol maintains a standing "10 Most Wanted" leaderboard, and bounty reports don\'t arrive all at once sorted by size — they trickle in one at a time from across the world. When a new report lands, an agent doesn\'t re-rank all ten entries from scratch; they only need to check it against the single weakest bounty currently on the board. If the new report beats that weakest entry, it displaces it and the weakest survivor becomes whichever one is now smallest among the ten. If it doesn\'t beat the weakest entry, it\'s ignored entirely — no other comparison is needed. That weakest-entry-on-the-board is exactly the root of a min-heap of size 10, and "compare only against the root" is exactly why maintaining a running top-k is so much cheaper than re-sorting the whole list on every update.',
        'A related but different job: reconstructing one master timeline out of K separate Den Den Mushi call logs, each already sorted by time internally but scattered across K different snails. You can\'t just concatenate them — you need the true chronological order across all K logs combined. So you look at only the earliest next-unread call from each of the K logs simultaneously, take the globally earliest one, record it, and replace it with the next call from that same log. Repeat until every log is drained. That "cheapest next candidate from each of K sources" is a heap of size K, and it\'s a genuinely different use of the same structure from the top-10 leaderboard — one evicts to stay capped at size k, the other keeps exactly one live candidate per source at all times.',
      ],
    },
    history: {
      title: 'The FBI\'s Ten Most Wanted Fugitives list (1950–present)',
      text: [
        'Since 1950, the FBI has maintained a literal, continuously updated "Ten Most Wanted Fugitives" list. New candidates are proposed over time, and the list has always held a fixed size of ten — when a new nomination is serious enough to make the cut, it displaces whichever fugitive on the current list is judged the least significant threat among the ten, not the entire list rebuilt from scratch. This is a real, maintained, size-bounded ranking updated incrementally as new information arrives, evaluated only against the weakest current entry — precisely the operational shape of a size-k min-heap.',
      ],
    },
    why: 'Top-k and k-way merge are easy to blur together because they share a data structure, so it helps to anchor them to two visibly different scenes — a single fixed-size leaderboard evicting its weakest member vs. K parallel logs each contributing one live candidate — rather than one blurry "heap problem" memory that collapses the distinction when you need it most.',
  },
  tricks: [
    {
      name: 'Always evict — an unconditionally growing heap silently loses the whole point',
      idea: 'Skipping the size-k eviction step doesn\'t make the algorithm wrong in the sense of returning a bad answer — you can still recover a correct result some other way — but it silently abandons the O(log k) per-operation and O(k) space bounds that justified reaching for a heap over a full sort in the first place.',
      before:
`import heapq

def find_kth_largest(nums, k):
    heap = []
    for num in nums:
        heapq.heappush(heap, num)  # BUG: no eviction — heap grows to O(n)
    # "works" by falling back to a full sort over the now-size-n heap,
    # but this has thrown away the entire reason to use a heap
    return heapq.nlargest(k, heap)[-1]`,
      after:
`import heapq

def find_kth_largest(nums, k):
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)  # keeps the heap bounded at size k
    return heap[0]`,
      explain: 'The buggy version still terminates and can still be coaxed into a correct answer, which is exactly what makes it a dangerous mistake to internalize — it "passes" small test cases while quietly paying O(n) space and O(n log n) time, the same cost as just sorting the array outright. The eviction line is not a nicety; it is the entire reason a heap beats a sort here.',
    },
    {
      name: 'K-way merge: always push the popped source\'s next node back',
      idea: 'In Merge K Sorted Lists, forgetting to re-push the next node from the list you just popped from doesn\'t crash or raise an error — it silently truncates that list to a single contributed node, producing a shorter-than-correct merged result that\'s easy to miss without checking total length.',
      before:
`import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))

    dummy = ListNode()
    tail = dummy
    while heap:
        val, i, node = heapq.heappop(heap)
        tail.next = node
        tail = tail.next
        # BUG: never pushes node.next back onto the heap —
        # list i silently contributes only this one node and vanishes
    return dummy.next`,
      after:
`import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))

    dummy = ListNode()
    tail = dummy
    while heap:
        val, i, node = heapq.heappop(heap)
        tail.next = node
        tail = tail.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`,
      explain: 'The heap is supposed to always hold one "frontier" candidate per still-active source. Popping a node without pushing its successor back permanently removes that source from consideration after contributing exactly one value, so the merge silently drops the remainder of that list instead of erroring — the <code>i</code> tiebreaker in the tuple exists precisely so this push-back can happen even when values collide, since ListNode objects aren\'t directly comparable.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Top K Frequent Elements (LC 347)',
      twist: 'First build a frequency <code>Counter</code> in O(n), then maintain a size-k min-heap keyed on frequency rather than raw value — heap entries become <code>(count, value)</code> tuples. Python compares tuples lexicographically, so a tie on count falls through to comparing value directly, which raises a TypeError if values aren\'t mutually comparable (e.g. mixed types); add an explicit tiebreaker or wrap entries in a class with <code>__lt__</code> to guard against this.',
    },
    {
      company: 'Meta-style',
      title: 'Merge K Sorted Lists (LeetCode 23)',
      twist: 'This is k-way merge, not top-k, and it\'s easy to conflate the two: the heap holds one candidate per list as <code>(value, list_index, node)</code> — the list_index tiebreaker is required because ListNode objects aren\'t comparable and ties on value would otherwise crash the comparison. You pop the global minimum, append it to the result, then push that same list\'s *next* node — heap size stays fixed at k (or shrinks as lists exhaust) throughout, unlike top-k where a cutoff of exactly k is enforced by evicting.',
    },
    {
      company: 'Amazon-style',
      title: 'Kth Largest Element in a Stream (LeetCode 703)',
      twist: 'A class with a persistent heap across many <code>add(val)</code> calls, not a one-shot function. Build the size-k min-heap once in <code>__init__</code> (heapify the initial k largest), and each <code>add()</code> does one push then conditionally one pop if size exceeds k — O(log k) per call, versus re-scanning or re-sorting on every insertion which would be O(n log n) per call.',
    },
  ],
  pythonSolution: {
    title: 'Kth Largest Element in an Array',
    code:
`import heapq

def find_kth_largest(nums, k):
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
    notes: [
      '<code>heapq</code> is min-heap only — maintaining a min-heap of exactly size k (evicting the smallest whenever size exceeds k) is the standard trick for "kth largest," since the survivors\' minimum is precisely the kth largest overall.',
      'The <code>if len(heap) > k: heapq.heappop(heap)</code> guard is what keeps the heap bounded at O(k) space and O(log k) per operation — omitting it lets the heap grow to O(n), turning this into an expensive full-sort-via-heap instead of a true top-k algorithm.',
      '<code>heap[0]</code> (not <code>heapq.heappop(heap)</code>) reads the minimum without removing it — appropriate here since we just want to report the answer, not continue draining the heap.',
      'For "kth smallest" instead, either negate every value pushed (store <code>-num</code>) and negate again on read, or simply use <code>heapq.nsmallest(k, nums)[-1]</code> / <code>heapq.nlargest(k, nums)[-1]</code>, which are heapq\'s own convenience wrappers for exactly this pattern.',
    ],
  },
  pitfalls: [
    'Forgetting <code>heapq</code> is min-heap only and reaching for a max-heap that doesn\'t exist — for "kth largest," you need a min-heap of size k (or negated values), not a max-heap of the whole array.',
    'Pushing <code>heapq.heappush(heap, num)</code> unconditionally without the <code>if len(heap) > k: heappop(heap)</code> eviction — the heap silently grows to O(n), defeating the O(log k) advantage and turning the algorithm into an expensive O(n log n) full heap-sort.',
    'In Top-K Frequent, pushing raw <code>(count, value)</code> tuples without considering tie-breaking — if two elements share a count, heapq compares the second tuple element (value) directly, which throws a TypeError for unorderable types; add an explicit tiebreaker when value comparability isn\'t guaranteed.',
    'In k-way merge, forgetting to push the popped list\'s *next* node back onto the heap — silently truncates that list from the merge, producing a wrong (too-short) result instead of an error.',
  ],
  viz: {
    type: 'array',
    initialArray: [3, 2, 1, 5, 6, 4],
    steps: [
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { heap: '[3]', k: 2 }, message: "Push 3 → heap=[3]. Size 1 ≤ k=2, nothing to evict." },
      { highlights: { 0: 'a', 1: 'a' }, pointers: { i: 1 }, vars: { heap: '[2,3]', k: 2 }, message: "Push 2 → min-heap=[2,3] (root 2). Size 2 ≤ k, still nothing to evict." },
      { highlights: { 0: 'a', 1: 'a', 2: 'bad' }, pointers: { i: 2 }, vars: { heap: '[2,3]', k: 2 }, message: "Push 1 → heap=[1,2,3], size 3 > k → pop smallest (1). heap=[2,3]. 1 is evicted — it can't be in the top-2." },
      { highlights: { 0: 'a', 1: 'bad', 2: 'bad', 3: 'a' }, pointers: { i: 3 }, vars: { heap: '[3,5]', k: 2 }, message: "Push 5 → heap=[2,3,5], size 3 > k → pop smallest (2). heap=[3,5]. 2 is now evicted too." },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'a', 4: 'a' }, pointers: { i: 4 }, vars: { heap: '[5,6]', k: 2 }, message: "Push 6 → heap=[3,5,6], size 3 > k → pop smallest (3). heap=[5,6]." },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'a', 4: 'a', 5: 'bad' }, pointers: { i: 5 }, vars: { heap: '[5,6]', k: 2 }, message: "Push 4 → heap=[4,5,6], size 3 > k → pop smallest (4). heap=[5,6] unchanged — 4 never survives." },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'c', 4: 'a', 5: 'bad' }, pointers: {}, vars: { heap: '[5,6]', answer: 5 }, message: "Scan complete. heap=[5,6]; the min-heap's root is the 2nd-largest element = 5." },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most directly signals a heap/top-k approach rather than a full sort?',
      options: [
        '"Return the array sorted in ascending order"',
        '"Return the kth largest element" or "the k closest points to the origin," especially when k is much smaller than n or elements arrive in a stream',
        '"Find the longest palindromic substring"',
        '"Detect a cycle in a linked list"',
      ],
      correct: 1,
      explain: 'Kth-largest / top-k / k-closest phrasing, especially with a streaming or "k << n" framing, is the heap signature — sorting the whole input is correct but asymptotically wasteful compared to a size-k heap.',
    },
    {
      q: 'What is the time complexity of the size-k min-heap approach to "kth largest," and when does it beat sorting the whole array?',
      options: [
        'O(n log n), identical to sorting — there is no advantage',
        'O(n log k) — better than O(n log n) sorting whenever k is meaningfully smaller than n',
        'O(n), because heaps have constant-time insertion',
        'O(k log n), because only k elements ever get pushed',
      ],
      correct: 1,
      explain: 'Every one of the n elements does an O(log k) push (and occasionally an O(log k) pop), giving O(n log k) total. When k is small relative to n, log k is much cheaper than log n, so the heap approach wins over a full O(n log n) sort.',
    },
    {
      q: 'Why does the reference solution check `if len(heap) > k: heapq.heappop(heap)` after every push, rather than pushing unconditionally?',
      options: [
        'It\'s an optional optimization with no effect on correctness',
        'Without it, the heap grows to hold all n elements, which still gives a correct answer via heap[-k] but destroys the O(log k) per-operation bound and the O(k) space bound that make this approach worth using',
        'It\'s required to make heapq.heappush thread-safe',
        'It converts the min-heap into a max-heap',
      ],
      correct: 1,
      explain: 'The eviction step is what keeps the heap bounded at exactly size k. Without it, you\'d still eventually get a correct answer some other way, but the heap becomes an O(n)-sized structure with O(log n) operations, losing the entire point of using a size-k heap in the first place.',
    },
    {
      q: 'A variant asks you to merge k sorted linked lists into one sorted list (LC 23). How does this differ from the top-k pattern in the canonical problem?',
      options: [
        'It doesn\'t use a heap at all — that would be a different pattern entirely',
        'The heap holds one "frontier" candidate per list and you repeatedly pop the global minimum and push that list\'s next node — this is k-way merge, a heap application distinct from evicting-to-size-k top-k tracking',
        'It\'s identical code with no changes required',
        'It requires a max-heap instead of a min-heap',
      ],
      correct: 1,
      explain: 'Top-k evicts elements to keep the heap capped at size k, tracking "best k so far." K-way merge keeps exactly one candidate per source and replaces it after each pop, using the heap purely to find the next-smallest frontier element cheaply — same data structure, different mechanics and different problem shape.',
    },
    {
      q: 'What happens if you forget the tiebreaker in `heapq.heappush(heap, (count, value))` when two elements in Top K Frequent Elements have equal count, and `value` happens to be an unorderable type (e.g. a custom object without `__lt__`)?',
      options: [
        'Python silently picks one arbitrarily and continues',
        'heapq falls through to comparing the tuples\' second elements (the values) directly to break the tie, which raises a TypeError if those values aren\'t mutually comparable',
        'It always raises an IndexError instead',
        'The heap property is silently violated but no error occurs',
      ],
      correct: 1,
      explain: 'Tuple comparison in Python compares element-by-element, only moving to the next element on a tie. If two entries tie on count, Python must compare the values to break the tie — and if those values can\'t be compared (e.g. incompatible types, or custom objects with no ordering defined), that raises a TypeError at runtime, often the first time two counts happen to collide.',
    },
  ],
};
