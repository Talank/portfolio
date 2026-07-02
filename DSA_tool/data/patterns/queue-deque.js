window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['queue-deque'] = {
  id: 'queue-deque',
  title: 'Queue / Deque (Sliding Window Max, BFS Scaffolding)',
  category: 'Hashing & Linear Structures',
  timeMin: 10,
  summary: 'Use a double-ended queue to maintain a running max/min over a sliding window in O(1) amortized per step, or a plain queue as the traversal engine for BFS.',
  concept: [
    'A deque (double-ended queue) supports O(1) push/pop from <i>both</i> ends, which is exactly what a sliding-window running max/min needs: evict useless small (or large) candidates from the <b>back</b> as new elements arrive, and evict elements that have aged out of the window from the <b>front</b> by index. The front of the deque is always the current window\'s extreme value — no scanning, no heap.',
    'The monotonic-deque invariant is: values in the deque, read front to back, are strictly decreasing (for a running max) or increasing (for a running min). When a new element arrives, pop from the back any element it dominates (smaller-or-equal for a max-deque) — those elements can <i>never</i> be the answer again while the new, larger element remains in range, so keeping them around is pure waste, not a correctness requirement.',
    'A plain (single-ended) queue is also the backbone data structure of BFS traversal — FIFO order naturally explores a graph level by level. A useful extension is <b>0-1 BFS</b>: when edge weights are only 0 or 1, a deque can replace a full priority queue (Dijkstra) by pushing zero-weight relaxations to the <i>front</i> and one-weight relaxations to the <i>back</i>, keeping the queue implicitly sorted at O(1) per push instead of O(log n).',
  ],
  recognitionSignals: [
    '"Maximum/minimum of every contiguous window of size k" — the classic sliding-window-maximum signature; a heap also works but costs O(n log k) instead of O(n).',
    '"Shortest path," "level order," "minimum number of steps" on an unweighted (or 0/1-weighted) graph — signals a queue-driven BFS, not DFS or Dijkstra.',
    'Edge weights restricted to exactly {0, 1} — signals 0-1 BFS with a deque standing in for a priority queue.',
    'Distinguish from a monotonic stack: a deque needs eviction from <i>both</i> ends (small elements from the back, aged-out elements from the front based on a window boundary), whereas a stack only ever pops from one end and has no notion of an index "aging out."',
  ],
  complexity: 'Time: O(n) amortized for sliding window maximum — every index is pushed and popped from the deque at most once, same amortized argument as a monotonic stack. Space: O(k) for the deque itself, O(n) for the output array. Plain BFS: O(V + E) time, O(V) space for the queue and visited set.',
  canonical: {
    name: 'Sliding Window Maximum (LeetCode 239)',
    statement: 'Given an array nums and a sliding window of size k moving from the left of the array to the right, return an array of the maximum value in the window at each position it slides to.',
  },
  variants: [
    {
      company: 'Amazon-style',
      title: 'Shortest Subarray with Sum at Least K (LeetCode 862)',
      twist: 'The array can contain negative numbers, which breaks a plain sliding window\'s monotonicity (growing the window no longer only ever increases the sum). The fix is to work with prefix sums and a monotonic <i>increasing</i> deque of prefix-sum indices: pop from the <b>front</b> whenever the front\'s prefix sum already lets the current index form a valid subarray (record the length, since the front is the earliest, and thus shortest, valid start), and pop from the <b>back</b> whenever the current prefix sum is smaller than the back\'s (a smaller prefix sum is always a strictly better future starting point, so the larger one is now useless). This is the same two-ended-eviction skeleton as sliding window maximum, just applied to prefix sums instead of raw values, and it is the reason plain sliding window cannot be patched to handle negatives.',
    },
    {
      company: 'Google-style',
      title: '0-1 BFS for shortest path with binary edge weights',
      twist: 'Instead of unweighted BFS or a Dijkstra priority queue, edges have weight 0 or 1. Replace the queue with a deque: when relaxing a 0-weight edge, push the neighbor to the <b>front</b> (it should be processed before anything already queued, since it costs nothing extra); when relaxing a 1-weight edge, push to the <b>back</b>. This keeps the deque implicitly sorted by distance at O(1) per push, giving O(V + E) instead of Dijkstra\'s O((V + E) log V) — tests whether you recognize that a deque can substitute for a heap when the weight structure is this restricted.',
    },
    {
      company: 'Meta-style',
      title: 'Constrained Subsequence Sum (LeetCode 1425)',
      twist: 'This combines the sliding-window-maximum deque with a 1D dynamic programming recurrence: dp[i] = nums[i] + max(0, max(dp[i-k..i-1])), where the max over the last k dp-values needs O(1) amortized lookup or the DP degrades to O(nk). The deque now stores (index, dp-value) pairs instead of raw array values — you pop from the front when an index falls more than k behind the current one, and from the back when a smaller dp-value sits behind a larger one, exactly like the canonical problem, but the values being compared are computed on the fly as part of the DP transition rather than given upfront.',
    },
  ],
  pythonSolution: {
    title: 'Sliding Window Maximum',
    code:
`from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq = deque()  # indices; nums[dq[0]] is always the current window's max
    result = []
    for i, n in enumerate(nums):
        while dq and nums[dq[-1]] <= n:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result`,
    notes: [
      '<code>collections.deque</code> gives O(1) append/pop from <i>both</i> ends; a plain <code>list</code> would make <code>pop(0)</code> (front eviction) O(n), silently degrading the whole algorithm to O(nk).',
      '<code>enumerate(nums)</code> supplies the index needed for window-boundary bookkeeping, since the deque stores indices, not values.',
      '<code>while dq and nums[dq[-1]] <= n</code> uses short-circuit evaluation to avoid indexing into an empty deque, the same idiom used for monotonic stacks.',
      '<code>dq[0]</code> peeks the front without removing it — used both to check for expiry (<code>dq[0] <= i - k</code>) and to read the current max, only calling <code>popleft()</code> when the front has actually aged out.',
    ],
  },
  pitfalls: [
    'Using a plain Python <code>list</code> as the queue and calling <code>pop(0)</code>/<code>insert(0, ...)</code> — each is O(n), turning the whole algorithm into O(nk) instead of O(n); always use <code>collections.deque</code> for two-ended work.',
    'Storing raw values in the deque instead of indices — without an index you cannot tell when the current front has aged out of the window (there is nothing to compare against <code>i - k</code>).',
    'Getting the front-eviction comparison off by one: it is <code>dq[0] <= i - k</code> (equivalently <code>dq[0] < i - k + 1</code>), not <code>dq[0] < i - k</code> — the wrong operator evicts the max one step too early or keeps a stale one too long.',
    'Forgetting the <code>if i >= k - 1</code> guard before appending to the result — without it you emit k-1 bogus results for windows that aren\'t yet full size k.',
  ],
  viz: {
    type: 'array',
    initialArray: [1, 3, -1, -3, 5, 3, 6, 7],
    steps: [
      { highlights: { 0: 'a' }, pointers: { R: 0 }, vars: { deque: '[0]', result: '[]' }, message: 'i=0, num=1. Deque empty → push index 0. deque=[0]. Window not yet size k=3.' },
      { highlights: { 0: 'bad', 1: 'a' }, pointers: { R: 1 }, vars: { deque: '[1]', result: '[]' }, message: 'i=1, num=3. nums[0]=1 ≤ 3 → pop index 0 from the back (it can never be the max again). Push 1. deque=[1].' },
      { highlights: { 1: 'c', 2: 'a' }, pointers: { L: 0, R: 2 }, vars: { deque: '[1, 2]', result: '[3]' }, message: 'i=2, num=-1 doesn\'t beat the back (3) → just push 2. deque=[1, 2]. Window [0..2] now full size k=3; front index 1 (value 3) is the max → result=[3].' },
      { highlights: { 1: 'c', 2: 'b', 3: 'a' }, pointers: { L: 1, R: 3 }, vars: { deque: '[1, 2, 3]', result: '[3, 3]' }, message: 'i=3, num=-3 doesn\'t beat the back → push 3. deque=[1, 2, 3]. Front index 1 is still inside window [1..3] → result stays max=3.' },
      { highlights: { 3: 'bad', 2: 'bad', 1: 'bad', 4: 'a' }, pointers: { L: 2, R: 4 }, vars: { deque: '[4]', result: '[3, 3, 5]' }, message: 'i=4, num=5 beats everything in the deque → pop 3, 2, and 1 from the back (all smaller, all now useless), push 4. deque=[4]. New window max=5.' },
      { highlights: { 4: 'c', 5: 'a' }, pointers: { L: 3, R: 5 }, vars: { deque: '[4, 5]', result: '[3, 3, 5, 5]' }, message: 'i=5, num=3 doesn\'t beat the back (5) → push 5. deque=[4, 5]. Front index 4 still in window [3..5] → max stays 5.' },
      { highlights: { 5: 'bad', 4: 'bad', 6: 'a' }, pointers: { L: 4, R: 6 }, vars: { deque: '[6]', result: '[3, 3, 5, 5, 6]' }, message: 'i=6, num=6 beats the whole deque → pop 5 and 4, push 6. deque=[6]. New max=6.' },
      { highlights: { 6: 'bad', 7: 'a' }, pointers: { L: 5, R: 7 }, vars: { deque: '[7]', result: '[3, 3, 5, 5, 6, 7]' }, message: 'i=7, num=7 beats index 6 (value 6) → pop it, push 7. deque=[7]. Final window max=7.' },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'c', 4: 'c', 5: 'c' }, arrayOverride: [3, 3, 5, 5, 6, 7], pointers: {}, vars: { result: '[3, 3, 5, 5, 6, 7]' }, message: 'Done. Sliding window maximums for k=3: [3, 3, 5, 5, 6, 7] — each computed in O(1) amortized time thanks to the monotonic deque.' },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most strongly signals a monotonic deque rather than a monotonic stack?',
      options: [
        '"For each element, find the next element to its right that is strictly greater"',
        '"Return the maximum value in every contiguous window of size k as the window slides"',
        '"Determine whether the parentheses in this string are balanced"',
        '"Reverse a linked list in place"',
      ],
      correct: 1,
      explain: '"Next greater element" is the monotonic-stack signature (single-ended eviction). "Maximum in every sliding window of size k" needs eviction from both ends — new small elements from the back, aged-out elements from the front — which only a deque supports efficiently.',
    },
    {
      q: 'What is the time complexity of Sliding Window Maximum using a monotonic deque, and why?',
      options: [
        'O(nk), because every window position rescans up to k elements',
        'O(n log k), because a heap of size k is used',
        'O(n) amortized, because each index is pushed and popped from the deque at most once across the whole run',
        'O(n²), because the deque must be re-sorted after every insertion',
      ],
      correct: 2,
      explain: 'Just like a monotonic stack, every index enters the deque exactly once and leaves at most once (from either end), so total deque operations are bounded by O(n) regardless of k.',
    },
    {
      q: 'In the reference code, why does the eviction check use `dq[0] <= i - k` rather than `dq[0] < i - k`?',
      options: [
        'Either one works identically; it is purely stylistic',
        'An index equal to i - k is exactly one position outside the current window [i-k+1, i], so it must be evicted; using strict < would leave a now-invalid index at the front one step too long',
        'It prevents an IndexError on an empty deque',
        'It is only relevant when k equals 1',
      ],
      correct: 1,
      explain: 'The current window is [i-k+1, i]. An index of i-k falls just before that range, so it is stale and must be popped from the front. Using < instead of <= would fail to evict it on the exact step it expires, corrupting the reported max for that window.',
    },
    {
      q: 'The Shortest Subarray with Sum at Least K variant (LC 862) allows negative numbers. Why does that break a plain sliding window and require a deque instead?',
      options: [
        'Negative numbers cause integer overflow',
        'A plain sliding window relies on the window sum changing monotonically as you grow or shrink it; negative numbers break that monotonicity, so a deque of prefix-sum indices with two-sided eviction is needed instead',
        'Deques cannot store negative numbers either, so this is a trick question',
        'It doesn\'t actually require a deque — a standard two-pointer window still works unchanged',
      ],
      correct: 1,
      explain: 'Sliding window correctness depends on "growing the window only ever helps or only ever hurts" the validity condition. With negative numbers, extending the window can decrease the sum, breaking that guarantee — so the problem is reframed with prefix sums and a monotonic deque that evicts both stale (too-old) and dominated (larger prefix sum) indices.',
    },
    {
      q: 'What happens in the reference implementation if k is larger than len(nums)?',
      options: [
        'It raises an IndexError',
        'It loops forever',
        'The deque and result-building logic behave correctly per index, but `i >= k - 1` is never true for any i, so result ends up empty',
        'It returns a list of zeros',
      ],
      correct: 2,
      explain: 'Since i ranges only from 0 to len(nums)-1, and k-1 >= len(nums) in this case, the guard `i >= k - 1` never fires, so no window is ever "full size k" and result stays empty — the correct behavior when no valid window of size k exists, though worth stating explicitly as an edge case in an interview.',
    },
  ],
};
