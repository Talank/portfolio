window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['heaps-top-k'] = {
  id: 'heaps-top-k',
  title: 'Heaps / Top-K',
  titleNe: 'Always the smallest (or largest) on top',
  intro: 'a lazy tree that only guarantees the top of the pile — perfect for “k best” questions',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“Top K”, “Kth largest/smallest”, “K closest points”, “merge K sorted lists” — the K is the signal.',
        'Heap gives O(log n) push/pop and O(1) peek at the best — much cheaper than sorting everything.',
        'Python’s <code>heapq</code> is a <b>min-heap only</b> — negate values to fake a max-heap.',
      ],
      narration: "Now the Heap, and its most beloved use — Top-K problems. Whenever you see the letter K in a problem — kth largest, K closest, top K frequent — let a heap ring in your mind. Why? Because sorting the whole array is far too much work — we only need the top of the pile, we don't need to make the whole bed. Picture it this way — a stack of kitchen pots; you always want the smallest pot, and you don't need to order the whole stack, it's enough that the smallest is always on top. In Python there's a container called heapq, but it always keeps only the smallest on top — if you want the largest, the custom is to negate the values as a trick.",
    },
    {
      heading: 'Story: Why keep only K in the heap',
      bullets: [
        'For “K largest”, keep a <b>min-heap of size K</b> — the smallest of your current top-K sits on top.',
        'New number bigger than the top? It deserves a spot — evict the top, push the new one.',
        'This keeps the heap at size K forever — O(n log K), not O(n log n).',
      ],
      narration: "Here's the inner trick, and it's a little counter-intuitive. Even to find the K largest, you use a min-heap that keeps the smallest on top — why not the largest? Think of it as a VIP lounge with K seats. The weakest person inside stands at the door — because when a new guest arrives, they're the first one to compare against, to decide whether to evict. If the new guest is stronger than the one at the door — throw the door-person out, let the new one in. If weaker, don't even let them in, turn them away at the door. This way the lounge always holds exactly K people, and the one at the door is the weakest inside — the only person you ever need to look at. By keeping the heap capped at size K instead of stuffing the whole array in, the time drops to O(n log K), which when K is small is much faster than O(n log n).",
    },
    {
      heading: 'Mnemonic',
      big: '“Want K largest? Keep the small on top, the weakest at the door.”',
      bullets: [
        'K largest → min-heap of size K. K smallest → max-heap of size K (opposite!).',
        '“Kth largest” = the top of a size-K min-heap after processing everything.',
        'K closest points → same trick, but ordered by distance instead of value.',
      ],
      narration: "The hook: want K largest? Keep the small on top, the weakest at the door. There's a trap that confuses many — for K smallest it flips — there you need a max-heap keeping the largest on top, because now the worst inside — the largest — stands at the door for comparison. Memorize this pair as opposites — min-heap for largest, max-heap for smallest. Kth largest is a single-number question — after processing the whole array this way, the top of the heap is the answer. And for a problem like K closest points to origin, the same trick — you just compare by distance instead of by value.",
    },
    {
      heading: 'Python template',
      code: 'import heapq\n\ndef k_largest(nums, k):\n    heap = []                          # min-heap, size ≤ k\n    for x in nums:\n        heapq.heappush(heap, x)\n        if len(heap) > k:\n            heapq.heappop(heap)        # throw the weakest out the door\n    return heap                        # heap[0] = kth largest\n\n# One-liner using heapq directly:\ndef k_largest_v2(nums, k):\n    return heapq.nlargest(k, nums)\n\ndef top_k_frequent(nums, k):\n    from collections import Counter\n    count = Counter(nums)\n    return heapq.nlargest(k, count.keys(), key=count.get)',
      narration: "The first function shows the whole logic in code — keep pushing, and each time the size passes k, pop — at the end the heap holds exactly the K largest, and heap of zero is the kth largest. Python gives you all this in a single line though — heapq-dot-nlargest — in an interview, explain the logic first, then show you also know this shortcut. Top K Frequent is a nice combo — first Counter tallies (a good example of each module reusing the previous one), then heapq picks the largest k over those counts.",
    },
    {
      heading: 'Watch out! Pitfalls and cousins',
      bullets: [
        'Min-heap of size K trick only wins when K ≪ n — for K ≈ n, plain sort is simpler and fine.',
        'Merge K Sorted Lists: push one “head” per list, pop-min, push its successor — classic heap use.',
        '<code>heapq</code> needs comparable tuples — ties on the first element compare the second, which can crash on objects.',
        'Quickselect gives O(n) average for a single “kth” query — heap wins when you need the whole top-K, repeatedly.',
      ],
      narration: "Final warnings. This K-sized heap trick only pays off when K is much smaller than n — if K is nearly n, plain sorting is just as good and even simpler. Merge K Sorted Lists is a classic use — put the front node of each list in the heap, pop the smallest, then push the next node of that same list — merging n lists in log n. One technical trap — when heapq compares tuples, if the first values tie it compares the second, and if that second is an object that can't be compared, it crashes; so always put something comparable second in the tuple, or add an index. And finally — if you need only a single kth element, there's a technique faster than a heap called Quickselect, O(n) on average — know the name; but when you need the whole top-K, repeatedly, the heap wins.",
    },
  ],
};
