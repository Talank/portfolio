/* Dawn Island — arrays and strings, where the voyage begins and ends.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['merge-sorted-array'] = {
    id: 'merge-sorted-array',
    epNumber: 154,
    title: 'Two Crews, One Berth List',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Merge Sorted Array', number: 88, difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-sorted-array/' },
    problem: 'Merge two sorted arrays into the first one, which has exactly enough spare room at its end. Do it in place.',
    example: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3  →  [1,2,2,3,5,6]',

    h: 200,
    props: [
      { id: 'a1', emoji: '📋', label: '1', x: 12, y: 30 },
      { id: 'a2', emoji: '📋', label: '2', x: 28, y: 30 },
      { id: 'a3', emoji: '📋', label: '3', x: 44, y: 30 },
      { id: 'e1', emoji: '⬜', label: '', x: 60, y: 30 },
      { id: 'e2', emoji: '⬜', label: '', x: 76, y: 30 },
      { id: 'e3', emoji: '⬜', label: '', x: 92, y: 30 }
    ],
    ledger: [
      { id: 'W', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Two crew rosters, both already in order. The first has empty berths at the end — exactly enough for the second. Merge them without renting a second ship.",
        p: { a1: 'lit', a2: 'lit', a3: 'lit', e1: 'lit', e2: 'lit', e3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Start at the front and insert each name where it belongs? Every insert shoves everyone after it one berth along.",
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So fill from the BACK instead. The free berths are at the end, so start there and write the LARGEST remaining name each time.",
        p: { W: 'lit' }, l: { W: 'write from the tail' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the crucial property: the write position is always at or behind both read positions, so a write can never land on a name you have not read yet.",
        p: { e3: 'good' }, l: { W: 'write is never ahead of a read' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Six against three — six is larger, so it goes in the last berth. Then five. Then three from the first roster. Then two, two, one.",
        p: { e2: 'good', e1: 'good', a3: 'good', a2: 'good', a1: 'good' }, l: { W: 'merged ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And what happens when one of the two rosters runs out before the other?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "If the FIRST runs out, whatever remains of the second still has to be copied in. If the second runs out, the rest of the first is already sitting in exactly the right place — nothing to do.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "That asymmetry is the one thing worth remembering here. Everything else falls out of writing backwards.",
        sfx: 'gong'
      }
    ],

    insight: 'The free space is at the tail, so writing largest-first keeps the write pointer behind both read pointers — a write can never clobber a value still to be read.',
    complexity: '<b>Time O(m + n)</b> — one pass. <b>Space O(1)</b>. Merging forwards would need either a copy of nums1 or O(n) shifting per insert.',
    pitfall: 'Merging from the front, which overwrites unread values. And forgetting that leftovers in nums2 must still be copied when nums1 is exhausted, while leftovers in nums1 are already in place.',
    solution: `def merge(nums1, m, nums2, n):
    i, j, w = m - 1, n - 1, m + n - 1     # read heads, and the write tail

    while j >= 0:                          # only nums2 leftovers need copying
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[w] = nums1[i]; i -= 1
        else:
            nums1[w] = nums2[j]; j -= 1
        w -= 1`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "On a different pair of rosters — nums1 = [2,4,0,0] with m = 2, nums2 = [1,3] — Usopp merges from the front, writing the smaller head into position 0, then 1, and so on. What goes wrong first?",
        options: [
          'Writing 1 into index 0 destroys the 2 that has not been read yet',
          'It runs off the end of nums1',
          'It produces a correct but unsorted result',
          'Nothing; forward merging is fine here'
        ],
        correct: 0,
        explain: 'The very first write lands on live data: 1 is smaller than 2, so it goes into index 0 — where the unread 2 was sitting. Forward merging puts the write cursor among values still to be read. The backwards version works precisely because the spare room is at the end, so the direction of the free space dictates the direction of the merge.',
        hint: 'Which value occupies index 0 before the first write, and has it been read yet?'
      },
      {
        tag: 'TWEAK',
        q: "The spare room is at the FRONT of nums1 instead of the end. Which direction should the merge run?",
        options: [
          'Forwards — write from index 0, taking the smallest remaining each time',
          'Backwards, as before',
          'Either direction works',
          'It needs a temporary array'
        ],
        correct: 0,
        explain: 'The rule generalises: write into the free space, moving away from the data. Free space at the front means writing forwards with the smallest first, which again keeps the write cursor from overtaking the reads. Memorising "merge backwards" without the reason fails this variant.',
        hint: 'Which end can you write into without stepping on unread values?'
      },
      {
        tag: 'TRANSFER',
        q: "Different roster: Nami merges two sorted LINKED lists. Does she need the backwards trick?",
        options: [
          'No — links can be spliced anywhere, so there is no shifting to avoid and a forward merge is natural',
          'Yes, lists must also be merged backwards',
          'Yes, but only if one list is longer',
          'No, but it requires a copy'
        ],
        correct: 0,
        explain: 'The backwards merge exists to avoid the cost of shifting inside a contiguous array. A linked list has no such cost — rewiring a pointer is O(1) anywhere — so the constraint disappears entirely. Same problem, different data structure, different technique.',
        hint: 'What made inserting into the middle of an array expensive, and does it apply to a list?'
      }
    ]
  };

  E['remove-element'] = {
    id: 'remove-element',
    epNumber: 155,
    title: 'Throwing the Rotten Barrels Overboard',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Remove Element', number: 27, difficulty: 'Easy', url: 'https://leetcode.com/problems/remove-element/' },
    problem: 'Remove all occurrences of a value from an array in place, and return the number of elements that remain. The order of the kept elements may change, and what lies beyond the returned length does not matter.',
    example: 'nums = [3,2,2,3], val = 3  →  2, with the first two positions holding 2 and 2',

    h: 200,
    props: [
      { id: 'b0', emoji: '🛢️', label: '3', x: 20, y: 32 },
      { id: 'b1', emoji: '🛢️', label: '2', x: 40, y: 32 },
      { id: 'b2', emoji: '🛢️', label: '2', x: 60, y: 32 },
      { id: 'b3', emoji: '🛢️', label: '3', x: 80, y: 32 }
    ],
    ledger: [
      { id: 'K', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The rotten barrels have to go over the side. We can't rent a second hold, and nobody cares what's left in the space after the good barrels.",
        p: { b0: 'lit', b1: 'lit', b2: 'lit', b3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Splice each rotten one out as we find it? Every splice shifts everything after it. That's quadratic on a full hold.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two indices over one array instead. One reads every barrel; the other marks where the next KEEPER goes. The write index only advances when something is kept.",
        p: { K: 'lit' }, l: { K: 'write index = keepers so far' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So everything before the write index is guaranteed good. It's the answer, growing as we go.",
        p: { b0: 'bad' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "First barrel is rotten — skip it, write index stays at zero. Second is good — copy it to position zero, write index becomes one. Third is good — position one. Fourth is rotten — skip.",
        p: { b1: 'good', b2: 'good', b3: 'bad' }, l: { K: 'two keepers ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The write index at the end IS the count to return. It was never a separate thing to compute.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And since order doesn't matter here, there's an even cheaper version — swap the rotten barrel with the last one and shrink the hold.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which does fewer writes when removals are rare, and is worth mentioning. But the write-pointer version is the one that generalises to every problem in this family.",
        sfx: 'gong'
      }
    ],

    insight: 'One array, two indices: the reader visits everything and the writer advances only on a keeper — so the prefix before the write index is always the answer so far.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>. Splicing each removal out is O(n) per removal, hence O(n²) overall.',
    pitfall: 'Shifting the array on every removal. Also, trying to preserve what lies beyond the returned length — the problem explicitly does not care, and neither should the code.',
    solution: `def remove_element(nums, val):
    write = 0
    for read in range(len(nums)):
        if nums[read] != val:
            nums[write] = nums[read]     # keepers move forward
            write += 1
    return write                          # the count IS the write index`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different hold: Franky must move all the zeros in an array to the end while keeping the order of everything else. What is the shape?",
        options: [
          'The same write pointer for non-zeros, then fill the remainder with zeros',
          'Sort the array',
          'Swap each zero with the last element',
          'Count the zeros and rebuild the array'
        ],
        correct: 0,
        explain: 'Move Zeroes is this problem with a cleanup pass. The swap-with-last trick would work if order did not matter — but here it does, which is exactly the distinction between this problem and its neighbour.',
        hint: 'Which requirement rules out swapping with the last element?'
      },
      {
        tag: 'TWEAK',
        q: "The removed value is very rare — one occurrence in a million elements. Which version does less work?",
        options: [
          'The swap-with-last version, which writes only once per removal rather than copying every keeper',
          'The write-pointer version, always',
          'They perform identically',
          'Neither; both are O(n²) here'
        ],
        correct: 0,
        explain: 'Both are O(n) in time, but the write-pointer version performs a write per kept element while the swap version performs one per removed element. When removals are rare that is a real difference in constant factors — and it is only valid because order is not required.',
        hint: 'Count the assignments each version performs when only one element is removed.'
      },
      {
        tag: 'PITFALL',
        q: "Nami returns <code>len(nums)</code> minus a count of removals, computed separately in a second loop. Is that wrong?",
        options: [
          'Not wrong, but redundant — the write index already equals the number of keepers when the loop ends',
          'Yes, it gives the wrong count',
          'Yes, it is O(n²)',
          'It only works when val is absent'
        ],
        correct: 0,
        explain: 'A fair answer that does more work than needed. Noticing that a variable you already maintain IS the requested output is a small habit that keeps these solutions short — and it removes a second place for an off-by-one to hide.',
        hint: 'What does the write index count, by definition, at the end of the loop?'
      }
    ]
  };

  E['remove-duplicates-sorted-array'] = {
    id: 'remove-duplicates-sorted-array',
    epNumber: 156,
    title: 'One Barrel of Each Kind',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Remove Duplicates from Sorted Array', number: 26, difficulty: 'Easy', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/' },
    problem: 'Given a sorted array, remove duplicates in place so each value appears once, keeping the original order, and return the new length.',
    example: 'nums = [0,0,1,1,1,2]  →  3, with the first three positions holding 0, 1, 2',

    h: 200,
    props: [
      { id: 'c0', emoji: '🍺', label: '0', x: 14, y: 32 },
      { id: 'c1', emoji: '🍺', label: '0', x: 30, y: 32 },
      { id: 'c2', emoji: '🍺', label: '1', x: 46, y: 32 },
      { id: 'c3', emoji: '🍺', label: '1', x: 62, y: 32 },
      { id: 'c4', emoji: '🍺', label: '2', x: 86, y: 32 }
    ],
    ledger: [
      { id: 'U', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The manifest is sorted, and Zeff only wants one barrel listed per kind. Same rule as before — in place, and whatever sits past the new length is irrelevant.",
        p: { c0: 'lit', c1: 'lit', c2: 'lit', c3: 'lit', c4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Sortedness is what makes this easy: identical values are guaranteed adjacent, so a barrel is a duplicate exactly when it matches the one just kept.",
        p: { U: 'lit' }, l: { U: 'compare with the last keeper' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So the write pointer again — but the test is no longer against a fixed value, it's against whatever we most recently wrote.",
        p: { c0: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Keep the first barrel unconditionally, then for each subsequent one ask whether it differs from the last keeper. If so, write it and advance.",
        p: { c1: 'bad', c2: 'good', c3: 'bad', c4: 'good' }, l: { U: '0, 1, 2 → length 3 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And an empty manifest? There's no first barrel to keep.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So guard it, or start the write index at zero and let the loop handle everything — either is fine as long as you have decided which.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Without sorting, this would need a set and O of n memory. The order in the input is doing real work.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the recurring lesson of this whole island: read what the input guarantees, because the guarantee usually IS the algorithm.",
        sfx: 'gong'
      }
    ],

    insight: 'Sortedness turns "have I seen this before?" into "does it match the one I just kept?" — a global question answered by a local comparison, with no extra memory.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>. Unsorted input would need a hash set and O(n) space.',
    pitfall: 'Comparing against <code>nums[read - 1]</code> rather than against the last KEPT value. They coincide here, but the distinction matters the moment the rule changes to allow k copies.',
    solution: `def remove_duplicates(nums):
    if not nums:
        return 0
    write = 1                              # the first element is always kept
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:  # differs from the last keeper
            nums[write] = nums[read]
            write += 1
    return write`,

    quiz: [
      {
        tag: 'TWEAK',
        q: "The rule changes to allow at most TWO copies of each value. What is the smallest change?",
        options: [
          'Compare against <code>nums[write - 2]</code> instead of <code>nums[write - 1]</code>, and start the write index at 2',
          'Add a counter for each value',
          'Sort the array again',
          'Use a hash map of counts'
        ],
        correct: 0,
        explain: 'Beautifully small: comparing two positions back asks "would this be a third copy?". The pattern generalises to k copies by looking k back, and it is why the comparison should be phrased against the last KEEPER rather than the last element read.',
        hint: 'A value is a third copy exactly when it equals the keeper two slots back.'
      },
      {
        tag: 'PITFALL',
        q: "Chopper compares <code>nums[read] != nums[read - 1]</code> instead. Does it work here, and does it survive the at-most-two variant?",
        options: [
          'It works for the one-copy rule but breaks for at-most-two, because the array is being rewritten under the read index',
          'It fails immediately, even here',
          'It works for both',
          'It only fails on empty input'
        ],
        correct: 0,
        explain: 'For one copy, the two comparisons happen to coincide. Once the write pointer lags behind, comparing against read positions asks about the ORIGINAL array while the answer depends on what has been kept. Phrasing the invariant against the keepers keeps the code correct as the rule changes.',
        hint: 'In the at-most-two version, does nums[read - 1] still hold what you think it does?'
      },
      {
        tag: 'TRANSFER',
        q: "Different manifest: Nami must de-duplicate an UNSORTED list while preserving first-appearance order. What changes?",
        options: [
          'A hash set of values already kept, at O(n) extra space — the local comparison is no longer sufficient',
          'Nothing; the same comparison works',
          'Sort first, which preserves the order',
          'It becomes O(n²) necessarily'
        ],
        correct: 0,
        explain: 'Without sortedness, a duplicate may be arbitrarily far away, so "seen before" needs real memory. Note that sorting first would give O(n log n) AND destroy the first-appearance order the problem asks for — so it is not a shortcut here.',
        hint: 'How far away can the previous copy of a value be in an unsorted list?'
      }
    ]
  };

  E['remove-duplicates-sorted-array-ii'] = {
    id: 'remove-duplicates-sorted-array-ii',
    epNumber: 157,
    title: 'Two Barrels of Each, No More',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Remove Duplicates from Sorted Array II', number: 80, difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/' },
    problem: 'Given a sorted array, remove duplicates in place so each value appears at most twice, and return the new length.',
    example: 'nums = [1,1,1,2,2,3]  →  5, with the first five positions holding 1,1,2,2,3',

    h: 200,
    props: [
      { id: 'd0', emoji: '🍶', label: '1', x: 14, y: 32 },
      { id: 'd1', emoji: '🍶', label: '1', x: 30, y: 32 },
      { id: 'd2', emoji: '🍶', label: '1', x: 46, y: 32 },
      { id: 'd3', emoji: '🍶', label: '2', x: 62, y: 32 },
      { id: 'd4', emoji: '🍶', label: '2', x: 78, y: 32 },
      { id: 'd5', emoji: '🍶', label: '3', x: 94, y: 32 }
    ],
    ledger: [
      { id: 'K2', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "New rule from the quartermaster: two of each kind may stay, a third is over the side.",
        p: { d0: 'lit', d1: 'lit', d2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Count how many of each we've kept as we go? That means an extra variable and a reset whenever the value changes.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is something neater. A barrel would be a THIRD copy exactly when it equals the keeper two positions back. So compare against the keeper at write minus two — and no counter is needed at all.",
        p: { K2: 'lit' }, l: { K2: 'compare with nums[write - 2]' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Because if it matches two keepers back, and the manifest is sorted, everything between them is that same value too.",
        p: { d0: 'good', d1: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The first two barrels are always kept unconditionally, so the write index starts at two and the comparison is always in range.",
        p: { d2: 'bad', d3: 'good', d4: 'good', d5: 'good' }, l: { K2: 'length 5 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "And it generalises. Allow k copies and you compare against write minus k.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the reason to phrase the comparison against the keepers rather than the reads. Write it that way for the simple version and the harder one is a single character.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One character. I'd have written a counter and a reset and probably got the reset wrong.",
        sfx: 'gong'
      }
    ],

    insight: 'Comparing against the keeper k positions back replaces an explicit counter entirely — in a sorted array, matching that keeper is exactly what "this would be copy number k+1" means.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>.',
    pitfall: 'Comparing against read positions rather than write positions, which breaks once the write pointer lags. And forgetting that the first k elements are kept unconditionally so the index stays in range.',
    solution: `def remove_duplicates(nums, k=2):
    write = 0
    for x in nums:
        # A (k+1)th copy is exactly one that matches the keeper k slots back.
        if write < k or x != nums[write - k]:
            nums[write] = x
            write += 1
    return write`,

    quiz: [
      {
        tag: 'TWEAK',
        q: "The quartermaster allows THREE of each kind. What changes?",
        options: [
          'Compare against <code>nums[write - 3]</code> and keep the first three unconditionally',
          'Add a counter that resets on each new value',
          'Sort the array again',
          'It requires a hash map'
        ],
        correct: 0,
        explain: 'One constant. Writing the general form with k as a parameter — as the solution above does — makes all three variants the same function, which is a good sign the abstraction is the right one.',
        hint: 'What did the "two" in "write minus two" correspond to?'
      },
      {
        tag: 'PITFALL',
        q: "Nami compares against <code>nums[read - 2]</code> instead of <code>nums[write - 2]</code>. On [1,1,1,1,2] what does she return?",
        options: [
          'A wrong result — read positions refer to the original array, which is being overwritten underneath her',
          'The correct answer, 3',
          'It crashes on the first comparison',
          'The same as the write version, always'
        ],
        correct: 0,
        explain: 'Once elements are dropped, the write pointer lags and the two index spaces diverge — read positions describe the input, write positions describe the output being built. The rule is about the output, so the comparison must be too.',
        hint: 'After one element is dropped, do nums[read - 2] and nums[write - 2] still refer to the same slot?'
      },
      {
        tag: 'TRANSFER',
        q: "Different rule: at most two copies, but the input is UNSORTED and order must be preserved. What is needed?",
        options: [
          'A count map, since equal values are no longer adjacent and the local comparison cannot see them',
          'The same comparison, unchanged',
          'Sorting first, then the same algorithm',
          'Two passes over the array'
        ],
        correct: 0,
        explain: 'The k-positions-back trick is entirely a consequence of sortedness grouping equal values together. Scattered duplicates need real memory. And sorting first would break the order-preservation requirement, which is the same trap as in the previous episode.',
        hint: 'What did sortedness guarantee about where the other copies of a value live?'
      }
    ]
  };

  E['majority-element'] = {
    id: 'majority-element',
    epNumber: 158,
    title: 'The Flag More Than Half the Fleet Flies',
    arc: 'Dawn Island',
    patternId: 'hashing-patterns',
    scene: 'sea',
    leetcode: { name: 'Majority Element', number: 169, difficulty: 'Easy', url: 'https://leetcode.com/problems/majority-element/' },
    problem: 'Given an array where one element appears more than n/2 times, return that element. You may assume it always exists.',
    example: 'nums = [2,2,1,1,1,2,2]  →  2',

    h: 200,
    props: [
      { id: 'f1', emoji: '🏴', label: '2', x: 12, y: 32 },
      { id: 'f2', emoji: '🏴', label: '2', x: 28, y: 32 },
      { id: 'f3', emoji: '🏳️', label: '1', x: 44, y: 32 },
      { id: 'f4', emoji: '🏳️', label: '1', x: 60, y: 32 },
      { id: 'f5', emoji: '🏳️', label: '1', x: 76, y: 32 },
      { id: 'f6', emoji: '🏴', label: '2', x: 92, y: 32 }
    ],
    ledger: [
      { id: 'CD', x: 32, y: 78 },
      { id: 'CT', x: 70, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "One flag flies on more than half the fleet. Which one? And Nami has confiscated my notebook, so no tallying.",
        p: { f1: 'lit', f3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Sort the fleet and look at the middle ship — the majority flag has to cover the centre. That's n log n and it works.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Correct, and worth saying. But there is a linear method needing exactly two variables: a candidate flag and a count.",
        p: { CD: 'lit', CT: 'lit' }, l: { CD: 'candidate', CT: 'count' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "When the count is zero, adopt whatever flag you are looking at. Then add one for every ship flying it and subtract one for every ship that is not.",
        p: { f1: 'good' }, l: { CD: '2', CT: '1' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So it's a duel. Every other flag trades itself one-for-one against the majority flag.",
        p: { f3: 'dim', f4: 'dim', f5: 'dim' }, l: { CT: 'cancelled to 0' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And since the majority holds strictly more than half, it cannot be cancelled out — there simply are not enough other ships. Whatever is standing at the end is the answer.",
        p: { f6: 'good', f2: 'good' }, l: { CD: '2 survives ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "It relies on the majority genuinely existing, though. Without that guarantee the survivor could be anything.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So if the guarantee is removed, a second pass counting the candidate confirms it. One extra loop, and the claim becomes honest.",
        sfx: 'gong'
      }
    ],

    insight: 'Boyer-Moore is a cancellation argument: each non-majority element can annihilate at most one majority element, and a strict majority has more than enough to survive.',
    complexity: '<b>Time O(n)</b>, <b>Space O(1)</b>. Sorting and taking the middle is O(n log n); a hash map of counts is O(n) time but O(n) space.',
    pitfall: 'Applying it without the majority guarantee — the survivor is then meaningless and needs a verification pass. And resetting the candidate on every mismatch rather than only when the count reaches zero.',
    solution: `def majority_element(nums):
    candidate, count = None, 0
    for x in nums:
        if count == 0:
            candidate = x          # adopt only when nothing is standing
        count += 1 if x == candidate else -1
    return candidate
    # Without the guarantee, verify: nums.count(candidate) > len(nums) // 2`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "The guarantee is dropped and the input is [1, 2, 3]. What does the algorithm return, and what should it?",
        options: [
          '3 — the last survivor — when there is no majority element at all',
          '1, correctly',
          'None, correctly',
          'It crashes'
        ],
        correct: 0,
        explain: 'Every element cancels the previous one, so the last one adopted is left standing with a count of one. The algorithm always produces a candidate; only the guarantee makes that candidate meaningful. Adding a verification pass is a one-loop fix.',
        hint: 'Trace the candidate and count through all three elements.'
      },
      {
        tag: 'TRANSFER',
        q: "Different fleet: Nami wants every flag flown by more than n/3 of the ships. How does the idea extend?",
        options: [
          'Track TWO candidates with two counts — there can be at most two such flags — then verify both in a second pass',
          'Run the same algorithm twice',
          'Sort and take the elements at n/3 and 2n/3',
          'It cannot be done in O(1) space'
        ],
        correct: 0,
        explain: 'Majority Element II. The generalisation is that at most k−1 elements can exceed n/k, so k−1 candidate slots suffice — with a mandatory verification pass, since the n/3 version has no existence guarantee.',
        hint: 'How many different flags can each be flown by more than a third of the fleet?'
      },
      {
        tag: 'TWEAK',
        q: "Usopp updates the candidate whenever the current flag differs from it, rather than only when the count hits zero. What breaks?",
        options: [
          'The count stops being a cancellation tally and becomes meaningless — the majority can be displaced by a single different ship',
          'Nothing; it is equivalent',
          'It becomes O(n²)',
          'It only fails on empty input'
        ],
        correct: 0,
        explain: 'The count represents the surplus of the current candidate over everything seen since it was adopted. Swapping candidates while a surplus still stands throws that surplus away, and the argument collapses. The "only when zero" rule is the entire invariant.',
        hint: 'What does a positive count mean about the candidate, and what does swapping discard?'
      }
    ]
  };

  E['rotate-array'] = {
    id: 'rotate-array',
    epNumber: 159,
    title: 'The Whole Crew Shifts Post',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Rotate Array', number: 189, difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-array/' },
    problem: 'Rotate an array to the right by k steps, in place, where k is non-negative.',
    example: 'nums = [1,2,3,4,5,6,7], k = 3  →  [5,6,7,1,2,3,4]',

    h: 200,
    props: [
      { id: 'p1', emoji: '⚓', label: '1', x: 12, y: 32 },
      { id: 'p2', emoji: '⚓', label: '2', x: 28, y: 32 },
      { id: 'p3', emoji: '⚓', label: '3', x: 44, y: 32 },
      { id: 'p4', emoji: '⚓', label: '4', x: 60, y: 32 },
      { id: 'p5', emoji: '⚓', label: '5', x: 76, y: 32 },
      { id: 'p6', emoji: '⚓', label: '6', x: 92, y: 32 }
    ],
    ledger: [
      { id: 'R', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Everyone shifts three posts around the deck, and the last three wrap around to the front. No spare deck to stage them on.",
        p: { p1: 'lit', p4: 'lit', p5: 'lit', p6: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Move the last one to the front, k times? That's k passes over the whole crew.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Three reversals instead. Reverse the entire line — that puts the last k at the front, but backwards. Then reverse the first k to straighten them, and reverse the rest to straighten those.",
        p: { R: 'lit' }, l: { R: 'reverse all, then each block' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Three linear passes, no extra deck. And every element ends up exactly where it should.",
        p: { p4: 'good', p5: 'good', p6: 'good', p1: 'good' }, l: { R: '5 6 7 1 2 3 4 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Why does that work? It looks like a coincidence.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Reversing the whole line reverses each block AND swaps their positions. Reversing each block afterwards undoes the first half of that, leaving only the swap — which is the rotation.",
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And k can be larger than the crew. Rotating seven people by ten is the same as rotating by three.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So reduce k modulo the length first, or the block boundaries fall outside the array. That one line is where most attempts break.",
        sfx: 'gong'
      }
    ],

    insight: 'Reversing the whole array both reverses each block and swaps their positions — reversing the blocks back leaves only the swap, which is exactly a rotation.',
    complexity: '<b>Time O(n)</b> — three linear passes. <b>Space O(1)</b>. The naive shift-by-one is O(n · k); using a second array is O(n) space.',
    pitfall: 'Forgetting <code>k %= n</code>, which sends the block boundary out of range. And rotating left instead of right — reversing the first n−k rather than the first k.',
    solution: `def rotate(nums, k):
    n = len(nums)
    k %= n                      # rotating by n is rotating by 0
    if k == 0:
        return

    def reverse(lo, hi):
        while lo < hi:
            nums[lo], nums[hi] = nums[hi], nums[lo]
            lo += 1; hi -= 1

    reverse(0, n - 1)           # last k are now at the front, backwards
    reverse(0, k - 1)           # straighten them
    reverse(k, n - 1)           # straighten the rest`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp omits <code>k %= n</code> and calls rotate with n = 5 and k = 7. What happens?",
        options: [
          'The block boundary at index 7 is outside the array, so the reversals operate on nonsense ranges',
          'It rotates correctly by 7',
          'It rotates by 5 and returns the original',
          'It loops forever'
        ],
        correct: 0,
        explain: 'The three-reversal method assumes k is a valid split point. Rotating by n returns the array unchanged, so only k mod n is meaningful — and a k larger than n makes the split index invalid rather than merely wasteful.',
        hint: 'Where is the boundary between the two blocks when k exceeds the array length?'
      },
      {
        tag: 'TWEAK',
        q: "Rotate LEFT by k instead of right. What changes?",
        options: [
          'Reverse the first k and the remaining n−k, having reversed the whole array — equivalently, rotate right by n−k',
          'Reverse the array twice',
          'Nothing; the operations are symmetric',
          'It requires a temporary array'
        ],
        correct: 0,
        explain: 'The cleanest mental model is that a left rotation by k equals a right rotation by n − k, so one implementation covers both. The block split simply moves — everything else about the three reversals is unchanged.',
        hint: 'If shifting everyone three posts right is one thing, how far right is shifting three posts left?'
      },
      {
        tag: 'TRANSFER',
        q: "Different deck: Nami rotates a linked list right by k. Does the reversal trick apply?",
        options: [
          'No — the cleaner move is to close the list into a ring and cut it at the right place, since lists splice freely',
          'Yes, identical code',
          'Yes, but it needs a doubly linked list',
          'No, and lists cannot be rotated in O(1) space'
        ],
        correct: 0,
        explain: 'Arrays cannot be closed into rings, and lists cannot be reversed in place as cheaply — so each structure gets the technique that suits it. What they share is the <code>k %= length</code> reduction, which is required in both.',
        hint: 'Which operation is cheap on a list and impossible on an array?'
      }
    ]
  };

  E['best-time-to-buy-sell-stock'] = {
    id: 'best-time-to-buy-sell-stock',
    epNumber: 160,
    title: 'One Buy, One Sell',
    arc: 'Dawn Island',
    patternId: 'greedy',
    scene: 'sea',
    leetcode: { name: 'Best Time to Buy and Sell Stock', number: 121, difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
    problem: 'Given daily prices, find the maximum profit from a single buy followed by a single later sell. If no profit is possible, return 0.',
    example: 'prices = [7,1,5,3,6,4]  →  5   (buy at 1, sell at 6)',

    h: 200,
    props: [
      { id: 'q7', emoji: '📈', label: '7', x: 12, y: 26 },
      { id: 'q1', emoji: '📉', label: '1', x: 28, y: 54 },
      { id: 'q5', emoji: '📈', label: '5', x: 44, y: 36 },
      { id: 'q3', emoji: '📉', label: '3', x: 60, y: 46 },
      { id: 'q6', emoji: '📈', label: '6', x: 76, y: 30 },
      { id: 'q4', emoji: '📉', label: '4', x: 92, y: 42 }
    ],
    ledger: [
      { id: 'MN', x: 32, y: 82 },
      { id: 'BP', x: 70, y: 82 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "One purchase, one sale, and the sale must come after the purchase. What is the most we can make on these readings?",
        p: { q7: 'lit', q1: 'lit', q6: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Compare every buy day against every sell day after it? That's every pair again.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fix the sell day instead, and ask what you need to know about the past. Only one thing: the cheapest price seen before it.",
        p: { MN: 'lit', BP: 'lit' }, l: { MN: 'min so far', BP: 'best profit' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So one walk forward carrying two numbers. Update the minimum, and test today's price against it.",
        p: { q1: 'good' }, l: { MN: 'min 1' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Seven sets the minimum. One replaces it. Five gives a profit of four. Three gives two. Six gives five — the best. Four gives three.",
        p: { q6: 'good' }, l: { BP: 'best 5 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Why track the minimum rather than the maximum?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because the buy must come FIRST. Tracking the maximum so far would let you sell before you bought — and on a falling market it would report a profit that is impossible.",
        p: { q7: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And on a market that only falls, the answer is zero. We are allowed to do nothing at all.",
        p: { q7: 'dim' },
        sfx: 'gong'
      }
    ],

    insight: 'Fix the later endpoint and ask what the past must supply — here the running minimum is the only thing a sell day needs, which collapses every pair into one pass.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>. Comparing all pairs is O(n²).',
    pitfall: 'Tracking the maximum price so far instead of the minimum, which permits selling before buying. And returning a negative number on a falling market — doing nothing is allowed, so the floor is zero.',
    solution: `def max_profit(prices):
    cheapest = float('inf')
    best = 0                      # doing nothing is allowed
    for price in prices:
        cheapest = min(cheapest, price)     # the buy must come first
        best = max(best, price - cheapest)
    return best`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp tracks the maximum price seen so far and returns <code>max_so_far - min_so_far</code> at the end. On [7, 6, 4, 3, 1] what does he get?",
        options: [
          '6, an impossible profit — the maximum came before the minimum, so that trade could never be made',
          '0, correctly',
          '-6',
          '1'
        ],
        correct: 0,
        explain: 'The ordering constraint is the whole problem. Taking the global max and min ignores which came first, and on a monotonically falling market it reports the largest possible LOSS as a gain. Carrying the running minimum forward enforces the order automatically.',
        hint: 'On a market that only falls, when do the maximum and minimum each occur?'
      },
      {
        tag: 'TWEAK',
        q: "Unlimited transactions are now allowed, buying and selling as often as you like. What is the answer?",
        options: [
          'Sum every upward step — every rise can be captured independently, so the greedy total is optimal',
          'The same single-transaction answer',
          'The difference between the global max and min',
          'It requires dynamic programming'
        ],
        correct: 0,
        explain: 'With no limit, a long rise can be decomposed into consecutive daily gains totalling the same amount, so capturing every up-step is optimal and provably so. That is Best Time II — a rare case where the greedy is both obvious and correct.',
        hint: 'Is buying on day 1 and selling on day 3 worth more or less than buying and selling on both days?'
      },
      {
        tag: 'TRANSFER',
        q: "Different reading: Nami wants the maximum DROP from a peak to a later trough. What changes?",
        options: [
          'Track the running MAXIMUM instead and maximise peak minus current — the mirror of this problem',
          'Nothing; the same code works',
          'Sort the prices first',
          'It requires two passes'
        ],
        correct: 0,
        explain: 'Reversing which endpoint is fixed reverses which extreme you carry. Recognising a problem as the mirror of one you know — rather than starting from scratch — is precisely the habit these variants are training.',
        hint: 'The buy-low-sell-high version carried the minimum. What does sell-high-buy-low carry?'
      }
    ]
  };
  E['best-time-to-buy-sell-stock-ii'] = {
    id: 'best-time-to-buy-sell-stock-ii',
    epNumber: 161,
    title: 'Trade as Often as the Tide Turns',
    arc: 'Dawn Island',
    patternId: 'greedy',
    scene: 'sea',
    leetcode: { name: 'Best Time to Buy and Sell Stock II', number: 122, difficulty: 'Medium', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/' },
    problem: 'Given daily prices, maximise profit with unlimited transactions. You may hold at most one unit at a time, and may buy and sell on the same day.',
    example: 'prices = [7,1,5,3,6,4]  →  7   (buy 1 sell 5, buy 3 sell 6)',

    h: 200,
    props: [
      { id: 'u1', emoji: '📉', label: '1', x: 20, y: 52 },
      { id: 'u5', emoji: '📈', label: '5', x: 40, y: 30 },
      { id: 'u3', emoji: '📉', label: '3', x: 60, y: 42 },
      { id: 'u6', emoji: '📈', label: '6', x: 80, y: 26 }
    ],
    ledger: [
      { id: 'G', x: 50, y: 80 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The limit is gone — we may trade as often as we like, so long as we never hold two lots at once.",
        p: { u1: 'lit', u5: 'lit', u3: 'lit', u6: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Find every trough and every peak, pair them up, add the gains? Sounds fiddly to get right at the edges.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a far simpler equivalent. Buying at a trough and selling at a peak earns exactly the same as buying and selling on every single day of the rise.",
        p: { G: 'lit' }, l: { G: 'sum every up-step' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Because the intermediate buys and sells cancel out. So we can just add up every day-to-day increase and ignore the peaks entirely.",
        p: { u1: 'good', u5: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "One to five is four. Three to six is three. Seven in total — and I never had to identify a single peak or trough.",
        p: { u3: 'good', u6: 'good' }, l: { G: 'profit 7 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The greedy is correct here because every rise is independent — capturing one never prevents capturing another. That is exactly the property the single-transaction version lacked.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And a falling day contributes nothing, because we simply do not hold anything through it.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Add a transaction fee, though, and the argument collapses — a tiny rise might not cover the fee, so the decomposition stops being free. Know why the greedy works, not just that it does.",
        sfx: 'gong'
      }
    ],

    insight: 'A long rise decomposes into consecutive daily gains of the same total, so summing every upward step is optimal — and it works only because the gains are independent.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>. A peak-and-trough scan is the same complexity with more edge cases.',
    pitfall: 'Assuming this greedy survives added constraints. With a transaction fee, or a cooldown, or a transaction limit, the decomposition is no longer free and the problem becomes a state-machine DP.',
    solution: `def max_profit(prices):
    # Every upward step can be captured independently.
    return sum(max(0, prices[i] - prices[i - 1])
               for i in range(1, len(prices)))`,

    quiz: [
      {
        tag: 'TWEAK',
        q: "A fixed fee is charged on every sale. Does summing the up-steps still work?",
        options: [
          'No — a rise smaller than the fee is not worth taking, so the daily decomposition stops being free and it becomes a two-state DP',
          'Yes, subtract the fee once at the end',
          'Yes, subtract the fee from each up-step',
          'Yes, unchanged'
        ],
        correct: 0,
        explain: 'The decomposition rests on splitting one trade into many at no cost. A per-sale fee makes each split cost extra, so holding through a small dip can beat selling and rebuying. That is LeetCode 714 — hold and sold states, with the fee applied on the transition.',
        hint: 'Under a fee, is one trade across a long rise still worth the same as many small ones?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp reasons that the answer is simply the maximum price minus the minimum price. When is that wrong?",
        options: [
          'Whenever the market rises, falls and rises again — those are separate trades, and his formula captures only one',
          'Only when the prices are decreasing',
          'Never; it is equivalent',
          'Only when the array is short'
        ],
        correct: 0,
        explain: 'That formula answers the single-transaction problem, and even then only when the minimum precedes the maximum. On [1, 5, 3, 6] the true answer is 7 while max minus min is 5 — the middle dip is a second opportunity he never takes.',
        hint: 'Try [1, 5, 3, 6] under both approaches.'
      },
      {
        tag: 'TRANSFER',
        q: "Different market: Nami may hold at most one lot but must wait one day after selling before buying again. What changes?",
        options: [
          'The up-step greedy fails — with a forced gap, a small rise may not be worth the lost day, so it becomes a three-state DP',
          'Nothing; the greedy still works',
          'Only alternate up-steps are summed',
          'It becomes a single-transaction problem'
        ],
        correct: 0,
        explain: 'That is Best Time with Cooldown. Any constraint that couples one trade to the next destroys the independence the greedy relies on. The pattern is reliable: unconstrained means greedy, coupled means state machine.',
        hint: 'The greedy works because captured rises are independent. Does a cooldown keep them independent?'
      }
    ]
  };

  E['jump-game-ii'] = {
    id: 'jump-game-ii',
    epNumber: 162,
    title: 'The Fewest Leaps Across the Stones',
    arc: 'Dawn Island',
    patternId: 'greedy',
    scene: 'sea',
    leetcode: { name: 'Jump Game II', number: 45, difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game-ii/' },
    problem: 'Each position holds the maximum jump length from there. Starting at index 0, return the minimum number of jumps to reach the last index. Reaching it is guaranteed possible.',
    example: 'nums = [2,3,1,1,4]  →  2   (index 0 to 1, then 1 to 4)',

    h: 200,
    props: [
      { id: 's0', emoji: '🪨', label: '2', x: 14, y: 34 },
      { id: 's1', emoji: '🪨', label: '3', x: 34, y: 34 },
      { id: 's2', emoji: '🪨', label: '1', x: 54, y: 34 },
      { id: 's3', emoji: '🪨', label: '1', x: 74, y: 34 },
      { id: 's4', emoji: '🏁', label: '4', x: 94, y: 34 }
    ],
    ledger: [
      { id: 'RE', x: 32, y: 78 },
      { id: 'FA', x: 72, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Stepping stones across the shallows. Each stone tells you the furthest you may leap from it — not the exact distance, the maximum. Fewest leaps to the far side.",
        p: { s0: 'lit', s1: 'lit', s4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Breadth-first search, treating each stone as a node? That would work, and it would give the shortest path.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It would — and there is a way to do the same thing without a queue. Think in RINGS: everything reachable in one leap, then everything reachable in two.",
        p: { RE: 'lit', FA: 'lit' }, l: { RE: 'end of this ring', FA: 'furthest seen' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So walk forward, tracking the furthest stone anything in the current ring can reach.",
        p: { s0: 'good' }, l: { FA: 'reach 2' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And when you arrive at the END of the current ring, you must leap — increment the count, and the new ring extends to the furthest point discovered so far.",
        p: { s1: 'good' }, l: { RE: 'ring ends here → jump', FA: 'reach 4' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "From stone zero the ring ends at index one. Standing there, we can reach index four — the far side. Two leaps.",
        p: { s4: 'good' }, l: { RE: '2 jumps ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "It's breadth-first search with the queue replaced by two integers. Same rings, no storage.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One detail: the loop must stop before the last stone. Arriving there is the goal, and counting a leap from it would add one too many.",
        sfx: 'gong'
      }
    ],

    insight: 'This is BFS with the queue collapsed into two integers — the end of the current ring and the furthest point discovered — and a jump is counted exactly when you reach the ring\'s edge.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>. An explicit BFS is also O(n) but needs a queue; the DP formulation is O(n²).',
    pitfall: 'Looping to the last index inclusive, which counts one jump too many on arrival. And greedily jumping to the furthest single stone each time, which is a different and incorrect rule.',
    solution: `def jump(nums):
    jumps = 0
    ring_end = 0        # last index reachable with the jumps taken so far
    farthest = 0        # furthest index any stone in this ring can reach

    for i in range(len(nums) - 1):        # stop before the last: arriving is the goal
        farthest = max(farthest, i + nums[i])
        if i == ring_end:                 # edge of the ring: must jump
            jumps += 1
            ring_end = farthest
    return jumps`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "On a different crossing, [1,2,1,1], Nami loops to <code>len(nums) - 1</code> inclusive. What does she return?",
        options: [
          '3 instead of 2 — arriving at the last stone triggers one more jump that is never taken',
          '2, correctly',
          '1',
          'It crashes'
        ],
        correct: 0,
        explain: 'The final index is the destination, not a departure point. Including it lets the ring-edge test fire there and count a leap from the goal. Off-by-one at the loop bound is the standard failure in this problem.',
        hint: 'What happens when i equals the last index and it also happens to be the ring edge?'
      },
      {
        tag: 'TWEAK',
        q: "A greedy that always jumps to the stone allowing the single furthest onward reach — chosen from the current ring — versus this ring-based method. Are they the same?",
        options: [
          'Effectively yes: this method implicitly picks that stone, since farthest is the maximum over the whole ring',
          'No, the ring method is incorrect',
          'No, the furthest-onward greedy is incorrect',
          'They differ in complexity but not in answer'
        ],
        correct: 0,
        explain: 'Worth being precise. Taking the maximum reach over the entire ring IS choosing the best stone in it — the ring formulation just never has to name which one. The incorrect greedy is a different one: jumping to the furthest stone by DISTANCE rather than by onward reach.',
        hint: 'What does `farthest` represent by the time you reach the ring edge?'
      },
      {
        tag: 'TRANSFER',
        q: "Different crossing: Franky only needs to know WHETHER the far side is reachable, not in how many leaps. What is the simplest test?",
        options: [
          'Track the furthest reachable index in one pass and fail if the current index ever exceeds it',
          'Run the same jump-counting algorithm and check it terminates',
          'Depth-first search from index 0',
          'Check that no value is zero'
        ],
        correct: 0,
        explain: 'That is Jump Game I, and it needs only one variable — no rings, no counting. A single zero is not disqualifying, since a stone before it may leap clean over; the reachability frontier is what actually decides it.',
        hint: 'You no longer care how many leaps. What is the only thing you still need to track?'
      }
    ]
  };

  E['h-index'] = {
    id: 'h-index',
    epNumber: 163,
    title: 'The Bounty That Proves a Reputation',
    arc: 'Dawn Island',
    patternId: 'hashing-patterns',
    scene: 'sea',
    leetcode: { name: 'H-Index', number: 274, difficulty: 'Medium', url: 'https://leetcode.com/problems/h-index/' },
    problem: 'Given an array of citation counts, return the h-index: the largest h such that at least h papers have h or more citations each.',
    example: 'citations = [3,0,6,1,5]  →  3   (three papers have at least 3 citations)',

    h: 200,
    props: [
      { id: 'h3', emoji: '📄', label: '3', x: 16, y: 34 },
      { id: 'h0', emoji: '📄', label: '0', x: 34, y: 34 },
      { id: 'h6', emoji: '📄', label: '6', x: 52, y: 34 },
      { id: 'h1', emoji: '📄', label: '1', x: 70, y: 34 },
      { id: 'h5', emoji: '📄', label: '5', x: 88, y: 34 }
    ],
    ledger: [
      { id: 'H', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "A pirate's standing is measured like this: the largest number h such that at least h of their bounties are worth h million or more.",
        p: { h3: 'lit', h6: 'lit', h5: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "That definition ties itself in a knot. The answer appears on both sides of it.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So sort the bounties from largest down. Then walk them and ask: is the bounty in position i worth at least i plus one?",
        p: { H: 'lit' }, l: { H: 'sorted: 6 5 3 1 0' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Six is at least one. Five is at least two. Three is at least three. But one is not at least four. So the answer is three.",
        p: { h6: 'good', h5: 'good', h3: 'good' }, l: { H: 'h = 3 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Sorting makes the self-reference collapse, because position and count line up.",
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "That's n log n, though. Can we do better?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Yes — counting sort. The h-index can never exceed the number of papers, so every bounty above that ceiling can be lumped into one bucket. Count how many fall in each bucket, then sweep downward accumulating.",
        p: { H: 'good' }, l: { H: 'buckets → O(n)' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Because a value larger than the paper count can't raise h any further. The ceiling is what makes bucketing possible.",
        sfx: 'gong'
      }
    ],

    insight: 'A self-referential definition usually unknots once the data is ordered — and here the answer is bounded by n, which is exactly the condition that permits counting sort instead of comparison sort.',
    complexity: '<b>Time O(n log n)</b> sorting, or <b>O(n)</b> with counting buckets. <b>Space O(1)</b> or O(n) respectively.',
    pitfall: 'Comparing the value at position i against i rather than i+1 when using zero-based indexing. And forgetting that citations above n can all be lumped into a single bucket, which is what makes the linear version work.',
    solution: `def h_index(citations):
    n = len(citations)
    # h can never exceed n, so anything above n lands in the top bucket.
    buckets = [0] * (n + 1)
    for c in citations:
        buckets[min(c, n)] += 1

    total = 0
    for h in range(n, -1, -1):          # sweep downward, accumulating
        total += buckets[h]
        if total >= h:
            return h
    return 0`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami sorts descending and returns the first i where <code>citations[i] < i</code>, using zero-based indices. On [6,5,3,1,0] what does she get?",
        options: [
          'She stops at i = 3 and reports 3 by luck here, but the comparison should be against i + 1 — the paper at index i is the (i+1)th',
          '3, and the comparison is correct',
          '4',
          '0'
        ],
        correct: 0,
        explain: 'With zero-based indexing, position i means "the (i+1)th largest", so the test is <code>citations[i] &gt;= i + 1</code>. Off-by-one here produces answers that are right on some inputs and wrong on others — the worst kind of bug to test for.',
        hint: 'How many papers have you seen once you are standing at index i?'
      },
      {
        tag: 'TWEAK',
        q: "The citations arrive already sorted in ascending order. What is the better approach?",
        options: [
          'Binary search for the boundary — the predicate "at least n − i papers have citations[i] or more" is monotone',
          'The same counting buckets',
          'Reverse the array and use the descending scan',
          'Nothing changes'
        ],
        correct: 0,
        explain: 'That is H-Index II, and the point is that pre-sorted input unlocks O(log n). Recognising which predicate is monotone — here, whether index i can support an h of n − i — is exactly the binary-search-the-answer skill.',
        hint: 'Sorted input plus a monotone condition means what?'
      },
      {
        tag: 'TRANSFER',
        q: "Why can a citation count of 10,000 be lumped in with a count of n when there are only 5 papers?",
        options: [
          'Because h can never exceed the number of papers, so any value at or above n contributes identically to the answer',
          'Because large values are rare',
          'Because the array is sorted',
          'It cannot; that loses information'
        ],
        correct: 0,
        explain: 'Bounding the answer is what makes counting sort applicable — values beyond the bound are indistinguishable for this question. The same reasoning is why counting sort beats comparison sort whenever the value range is small relative to the input size.',
        hint: 'With only 5 papers, what is the largest h that is even conceivable?'
      }
    ]
  };

  E['insert-delete-getrandom'] = {
    id: 'insert-delete-getrandom',
    epNumber: 164,
    title: 'The Lottery Barrel',
    arc: 'Dawn Island',
    patternId: 'hashing-patterns',
    scene: 'sea',
    leetcode: { name: 'Insert Delete GetRandom O(1)', number: 380, difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-delete-getrandom-o1/' },
    problem: 'Design a structure supporting insert, remove and getRandom, all in average O(1) time, where getRandom returns a uniformly random element currently present.',
    example: 'insert 1, insert 2, remove 1, getRandom → always returns 2',

    h: 200,
    props: [
      { id: 'ar', emoji: '🛢️', label: 'array of values', x: 30, y: 30 },
      { id: 'mp', emoji: '🗺️', label: 'value → index', x: 72, y: 30 },
      { id: 'sw', emoji: '🔄', label: 'swap with last', x: 50, y: 62 }
    ],
    ledger: [
      { id: 'O', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The lottery barrel has to do three things instantly: take a token, remove a named token, and draw a fair random one.",
        p: { ar: 'lit', mp: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "A hash set does the first two. But drawing uniformly from a set means walking it — that's linear.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A fair draw needs contiguous indexing, so an array is forced. And removing a named token needs a lookup, so a map is forced. Keep both.",
        p: { ar: 'good', mp: 'good' }, l: { O: 'array + map of indices' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "But removing from the middle of an array shifts everything after it.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So do not remove from the middle. Swap the doomed token with the LAST one, then pop the end. The array stays dense and nothing shifts.",
        p: { sw: 'good' }, l: { O: 'swap, then pop' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "And the map entry for the token that moved has to be updated, or the next lookup points at the wrong slot.",
        p: { mp: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That single line is what people forget. Then a draw is one random index into a dense array — genuinely uniform, genuinely constant.",
        p: { mp: 'good' }, l: { O: 'all three O(1) ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two structures, each covering what the other cannot do. Same shape as the cache design.",
        sfx: 'gong'
      }
    ],

    insight: 'Uniform random selection requires dense contiguous storage, and deletion by value requires a lookup — pair an array with an index map, and remove by swapping with the last element so nothing ever shifts.',
    complexity: '<b>Time O(1)</b> average for all three operations. <b>Space O(n)</b>. A set alone cannot draw uniformly in O(1); an array alone cannot delete by value in O(1).',
    pitfall: 'Forgetting to update the map entry of the element moved into the vacated slot. And removing from the middle of the array, which is O(n) and destroys the whole design.',
    solution: `import random

class RandomizedSet:
    def __init__(self):
        self.values = []       # dense array: enables uniform getRandom
        self.index = {}        # value -> position: enables O(1) remove

    def insert(self, val):
        if val in self.index:
            return False
        self.index[val] = len(self.values)
        self.values.append(val)
        return True

    def remove(self, val):
        if val not in self.index:
            return False
        i = self.index[val]
        last = self.values[-1]
        self.values[i] = last        # move the last element into the gap
        self.index[last] = i         # the line people forget
        self.values.pop()
        del self.index[val]
        return True

    def getRandom(self):
        return random.choice(self.values)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami swaps the doomed value with the last one and pops, but does not update the moved value's map entry. What happens on the next remove of that moved value?",
        options: [
          'It reads a stale index pointing past the end or at the wrong slot, corrupting the structure',
          'Nothing; the map self-corrects',
          'getRandom becomes non-uniform',
          'It simply returns False'
        ],
        correct: 0,
        explain: 'The map is the only record of where a value lives, so moving the value without updating it breaks the invariant the design rests on. The corruption is silent until a later operation touches that entry — the classic failure mode of paired structures.',
        hint: 'After the swap, where does the map say the moved value is, and where is it actually?'
      },
      {
        tag: 'TWEAK',
        q: "The structure must now allow DUPLICATE values. What changes?",
        options: [
          'The map holds a SET of indices per value, and removal picks any one of them — with care when the removed index is the last position',
          'Nothing; duplicates work already',
          'The array must be sorted',
          'It becomes impossible in O(1)'
        ],
        correct: 0,
        explain: 'That is LeetCode 381. One index per value is no longer enough, so each value maps to a set of positions. The fiddly case is when the element being removed is itself the last one — updating the moved element\'s index set must not undo the removal.',
        hint: 'If the value 5 appears three times, what does the map need to store for it?'
      },
      {
        tag: 'TRANSFER',
        q: "Which operation is the one that forces an array to exist at all?",
        options: [
          'getRandom — uniform selection needs contiguous indices, which a hash set cannot provide',
          'insert',
          'remove',
          'None; a hash set would suffice for all three'
        ],
        correct: 0,
        explain: 'Identifying which requirement forces which structure is the design skill here. Insert and remove are both natural for a hash set; only the uniform draw demands dense indexing — and once you have an array, the swap-with-last trick is what keeps removal cheap.',
        hint: 'Which of the three operations cannot be done in O(1) with a hash set alone?'
      }
    ]
  };

  E['candy'] = {
    id: 'candy',
    epNumber: 165,
    title: 'Sharing the Sweets Without a Riot',
    arc: 'Dawn Island',
    patternId: 'greedy',
    scene: 'sea',
    leetcode: { name: 'Candy', number: 135, difficulty: 'Hard', url: 'https://leetcode.com/problems/candy/' },
    problem: 'Children stand in a line with ratings. Each must get at least one sweet, and any child with a higher rating than a neighbour must get more sweets than that neighbour. Return the minimum total.',
    example: 'ratings = [1,0,2]  →  5   (2, 1, 2)',

    h: 200,
    props: [
      { id: 'k1', emoji: '🧒', label: '1', x: 26, y: 34 },
      { id: 'k0', emoji: '🧒', label: '0', x: 50, y: 34 },
      { id: 'k2', emoji: '🧒', label: '2', x: 74, y: 34 }
    ],
    ledger: [
      { id: 'L2R', x: 30, y: 78 },
      { id: 'R2L', x: 70, y: 78 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Every child gets at least one sweet, and any child rated above a neighbour must get strictly more than that neighbour. Use as few sweets as possible.",
        p: { k1: 'lit', k0: 'lit', k2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "There are two constraints pulling in opposite directions — the left neighbour and the right neighbour. Satisfying one can break the other.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So satisfy them one at a time. Walk left to right giving one extra sweet whenever a child outranks the one on their left. That handles every left-hand constraint and ignores the right.",
        p: { L2R: 'lit' }, l: { L2R: 'pass 1: left rules' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Then walk right to left doing the same for the right-hand neighbour.",
        p: { R2L: 'lit' }, l: { R2L: 'pass 2: right rules' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And take the MAXIMUM of the two demands at each child. The maximum satisfies both, and nothing smaller could satisfy either.",
        p: { k1: 'good', k0: 'good', k2: 'good' }, l: { L2R: 'max of both ✓', R2L: 'total 5' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Why doesn't the second pass break what the first one established?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because it only ever raises a value, and raising a child's count can never violate a left-hand constraint that was already satisfied. Taking the maximum is monotone — that is the whole argument.",
        p: { L2R: 'good', R2L: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two passes, one array, linear time. And equal ratings impose nothing at all — only a STRICTLY higher rating demands more.",
        sfx: 'gong'
      }
    ],

    insight: 'When two constraints pull in opposite directions, satisfy each in its own pass and combine with a maximum — valid because raising a value can only ever help the constraint already satisfied.',
    complexity: '<b>Time O(n)</b> — two passes. <b>Space O(n)</b> for the per-child counts, reducible to O(1) with a more intricate slope-counting version.',
    pitfall: 'A single pass, which cannot see a rise that begins after the current child. And giving more sweets on EQUAL ratings — the rule fires only on a strictly higher rating.',
    solution: `def candy(ratings):
    n = len(ratings)
    sweets = [1] * n              # everyone gets at least one

    for i in range(1, n):         # left-to-right: satisfy left-hand rules
        if ratings[i] > ratings[i - 1]:
            sweets[i] = sweets[i - 1] + 1

    for i in range(n - 2, -1, -1):    # right-to-left: satisfy right-hand rules
        if ratings[i] > ratings[i + 1]:
            sweets[i] = max(sweets[i], sweets[i + 1] + 1)   # max keeps both

    return sum(sweets)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper does only the left-to-right pass. On ratings [1, 2, 3, 1] what does he give, and what is wrong?",
        options: [
          '[1,2,3,1] — the last child is rated below the third but the third only got 3, which happens to hold; the real failure is a descending run like [3,2,1], giving [1,1,1]',
          '[1,2,3,4], which is too many',
          'Nothing is wrong; one pass suffices',
          'It crashes on the last element'
        ],
        correct: 0,
        explain: 'Worth tracing rather than assuming. A single left-to-right pass never sees that a child outranks the one on their RIGHT, so any descending run comes out flat — [3,2,1] gets [1,1,1], violating both right-hand constraints. The second pass exists for exactly that.',
        hint: 'Run a strictly descending rating sequence through the left-to-right pass alone.'
      },
      {
        tag: 'TWEAK',
        q: "In the second pass, Nami assigns <code>sweets[i] = sweets[i+1] + 1</code> directly instead of taking a maximum. What breaks?",
        options: [
          'It can LOWER a value the first pass had raised, breaking a left-hand constraint that was already satisfied',
          'It gives too many sweets',
          'Nothing; the assignment is equivalent',
          'It only fails on equal ratings'
        ],
        correct: 0,
        explain: 'The maximum is what makes the two passes compose. A direct assignment discards the first pass\'s work whenever the right-hand demand is smaller — and the left-hand constraint silently breaks. This is the crux of the whole solution.',
        hint: 'What if the first pass gave a child 4 and the right-hand rule only demands 2?'
      },
      {
        tag: 'TRANSFER',
        q: "Different queue: Franky must assign ranks so that anyone taller than a neighbour ranks higher, minimising the total, but ties may share a rank. What is the same?",
        options: [
          'The two-pass max composition — one pass per direction, combined by taking the larger demand',
          'A single sort by height',
          'A priority queue',
          'It needs dynamic programming'
        ],
        correct: 0,
        explain: 'The technique generalises to any problem with independent constraints in opposing directions along a line. Note the tie handling matters: strict comparisons mean equal neighbours constrain nothing, which is also true in the sweets problem and is easy to get wrong.',
        hint: 'How many directions do the constraints point in, and can each be handled alone?'
      }
    ]
  };

  E['trapping-rain-water'] = {
    id: 'trapping-rain-water',
    epNumber: 166,
    title: 'The Water Held Between the Cliffs',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Trapping Rain Water', number: 42, difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water/' },
    problem: 'Given an elevation map where each bar has width 1, compute how much rain water it can trap.',
    example: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]  →  6',

    h: 200,
    props: [
      { id: 'w1', emoji: '⛰️', label: '2', x: 22, y: 36 },
      { id: 'w2', emoji: '💧', label: '0', x: 44, y: 52 },
      { id: 'w3', emoji: '⛰️', label: '3', x: 66, y: 28 },
      { id: 'w4', emoji: '⛰️', label: '1', x: 88, y: 46 }
    ],
    ledger: [
      { id: 'ML', x: 28, y: 82 },
      { id: 'MR', x: 72, y: 82 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Rain pools between the cliffs. How much does the whole coastline hold?",
        p: { w1: 'lit', w2: 'lit', w3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Think column by column rather than pool by pool. The water above any single column is decided by the tallest wall to its left and the tallest to its right — specifically, by the SMALLER of those two, minus the column's own height.",
        p: { ML: 'lit', MR: 'lit' }, l: { ML: 'max left', MR: 'max right' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So precompute both, then one pass to add it up? That's three passes and two arrays, but it's easy to argue.",
        p: { w2: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And there is a two-pointer version with no arrays at all. Walk inward from both ends, each side carrying the tallest wall it has seen.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "The trick is knowing which side to move.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Always the SHORTER one. If the left maximum is below the right maximum, then for that column the smaller of the two IS the left maximum — whatever is still hidden on the right cannot lower it. So the column can be settled immediately.",
        p: { ML: 'good' }, l: { ML: 'shorter side is decided' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "We don't need the true right maximum — only the knowledge that it's at least as tall as what we've already seen.",
        p: { MR: 'good' }, l: { MR: 'total 6 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One pass, two numbers. That reasoning — 'I have enough information to commit, even without the full picture' — is what two-pointer arguments always come down to.",
        sfx: 'gong'
      }
    ],

    insight: 'Water over a column is min(maxLeft, maxRight) − height, and when maxLeft is the smaller you already know the minimum regardless of what lies ahead — so that column can be settled and its pointer advanced.',
    complexity: '<b>Time O(n)</b>, <b>Space O(1)</b> with two pointers. The precomputed-arrays version is O(n) time and O(n) space; a monotonic stack also solves it in O(n).',
    pitfall: 'Moving the taller side, which advances past information you still need. And computing per-pool rather than per-column, which makes the bookkeeping far harder for no benefit.',
    solution: `def trap(height):
    left, right = 0, len(height) - 1
    max_left = max_right = 0
    total = 0

    while left < right:
        if height[left] < height[right]:
            # The left side is the binding constraint: settle this column.
            max_left = max(max_left, height[left])
            total += max_left - height[left]
            left += 1
        else:
            max_right = max(max_right, height[right])
            total += max_right - height[right]
            right -= 1
    return total`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp always advances the TALLER side. Why is that unsafe?",
        options: [
          'The taller side\'s column depends on the smaller maximum, which is still unknown — so it cannot be settled yet',
          'It runs off the end of the array',
          'It double-counts columns',
          'It is safe; either side works'
        ],
        correct: 0,
        explain: 'The whole argument is that the smaller of the two maxima determines the water, so you may only commit a column when you already know which maximum binds. On the taller side that is precisely what you do not know.',
        hint: 'Which of the two maxima appears in the formula, and which side do you already know it for?'
      },
      {
        tag: 'TRANSFER',
        q: "Different coastline: Nami wants the largest single pool of water between exactly TWO walls, ignoring everything in between. What changes?",
        options: [
          'It becomes Container With Most Water — area is width times the shorter wall, and you still move the shorter pointer, but for a different reason',
          'The same algorithm gives the answer',
          'It requires sorting the heights',
          'It becomes O(n²)'
        ],
        correct: 0,
        explain: 'Both move the shorter side, but the justifications differ: here the shorter wall\'s column is fully determined, while there the shorter wall can never do better with any narrower width. Same move, different argument — worth being able to state each one.',
        hint: 'In the container problem, what happens to width and height if you keep the shorter wall?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer asks for a solution using a monotonic stack instead. What does the stack hold?",
        options: [
          'Indices of bars in decreasing height — when a taller bar arrives, it and the new stack top bound a horizontal layer of water over the popped bar',
          'The heights in increasing order',
          'The water totals so far',
          'Every index seen'
        ],
        correct: 0,
        explain: 'The stack version accumulates water in horizontal layers rather than vertical columns, and each pop resolves one layer bounded by the popped bar\'s two taller neighbours. Same O(n), a genuinely different decomposition — and a good answer to have ready.',
        hint: 'What becomes computable the moment a bar taller than the stack top arrives?'
      }
    ]
  };

  E['roman-to-integer'] = {
    id: 'roman-to-integer',
    epNumber: 167,
    title: 'Reading the Old Kingdom Numerals',
    arc: 'Dawn Island',
    scene: 'sea',
    leetcode: { name: 'Roman to Integer', number: 13, difficulty: 'Easy', url: 'https://leetcode.com/problems/roman-to-integer/' },
    problem: 'Convert a Roman numeral string to an integer. A smaller value placed before a larger one is subtracted rather than added.',
    example: 's = "MCMXCIV"  →  1994',

    h: 200,
    props: [
      { id: 'rM', emoji: '🏛️', label: 'M', x: 18, y: 34 },
      { id: 'rC', emoji: '🏛️', label: 'C', x: 38, y: 34 },
      { id: 'rM2', emoji: '🏛️', label: 'M', x: 58, y: 34 },
      { id: 'rX', emoji: '🏛️', label: 'X', x: 78, y: 34 },
      { id: 'rC2', emoji: '🏛️', label: 'C', x: 94, y: 34 }
    ],
    ledger: [
      { id: 'SM', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The Old Kingdom carved its numbers as letters, largest first — except where a smaller letter sits before a larger one, and then it is subtracted.",
        p: { rM: 'lit', rC: 'lit', rM2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So we need to spot the six special pairs — IV, IX, XL, XC, CD, CM — and handle them separately?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "You can, but there is a rule that needs no list at all. Walk the letters and compare each to the one after it. If it is smaller, subtract it. Otherwise add it.",
        p: { SM: 'lit' }, l: { SM: 'smaller before larger → subtract' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "M is not smaller than C, so add a thousand. C IS smaller than M, so subtract a hundred. Then M, add a thousand.",
        p: { rM: 'good', rC: 'bad', rM2: 'good' }, l: { SM: '1000 - 100 + 1000' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "X before C subtracts ten, C adds a hundred, I before V subtracts one, V adds five. Nineteen ninety-four, with a single rule.",
        p: { rX: 'bad', rC2: 'good' }, l: { SM: '1994 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One comparison replaces six special cases. Why does that work?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because the notation is defined by that very property — a smaller symbol before a larger one is the only situation in which subtraction occurs. The six pairs are consequences of the rule, not the rule itself.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The last letter has nothing after it, so it is always added. That falls out naturally if you treat a missing successor as zero.",
        sfx: 'gong'
      }
    ],

    insight: 'Find the rule that the special cases are consequences of — subtraction happens exactly when a smaller symbol precedes a larger one, which replaces the six-pair lookup entirely.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>, since the symbol table is a fixed seven entries.',
    pitfall: 'Enumerating the six subtractive pairs, which works but is longer and easier to get wrong. And forgetting that the final character has no successor and is therefore always added.',
    solution: `def roman_to_int(s):
    value = {'I': 1, 'V': 5, 'X': 10, 'L': 50,
             'C': 100, 'D': 500, 'M': 1000}
    total = 0
    for i, ch in enumerate(s):
        # Smaller before larger is the ONLY subtractive case.
        if i + 1 < len(s) and value[ch] < value[s[i + 1]]:
            total -= value[ch]
        else:
            total += value[ch]
    return total`,

    quiz: [
      {
        tag: 'TWEAK',
        q: "Nami handles the six subtractive pairs explicitly with a lookup table of two-character strings. Is that wrong?",
        options: [
          'Not wrong — it is correct and common, just longer and with more places for a typo than the single comparison',
          'Yes, it misses CM',
          'Yes, it is O(n²)',
          'Yes, two-character lookups cannot work'
        ],
        correct: 0,
        explain: 'Both approaches are standard. The comparison version is preferable because it encodes the actual rule rather than its enumerated consequences — which is why it needs no changes if the symbol set were extended.',
        hint: 'Ask whether the two approaches differ in correctness or only in how much they hard-code.'
      },
      {
        tag: 'TRANSFER',
        q: "Different direction: Franky must convert an integer INTO a Roman numeral. What is the cleanest approach?",
        options: [
          'A descending list of value-symbol pairs including the six subtractive ones, greedily taking the largest that fits',
          'The reverse of the comparison rule',
          'Recursion on the digits',
          'A lookup table of every number'
        ],
        correct: 0,
        explain: 'Including 900/CM, 400/CD, 90/XC, 40/XL, 9/IX and 4/IV as first-class entries makes the greedy simply work, with no subtractive special-casing. Note the asymmetry: parsing benefits from the rule, generating benefits from the enumeration.',
        hint: 'What if the subtractive forms were just more entries in the value table?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp compares each character with the PREVIOUS one instead of the next, adding when larger and subtracting when smaller. Does it work?",
        options: [
          'It can be made to work, but the sign logic inverts and the running total must be corrected by twice the previous value — easier to get wrong',
          'Yes, identically',
          'No, it is impossible backwards',
          'Yes, and it is simpler'
        ],
        correct: 0,
        explain: 'A right-to-left scan comparing against the previously seen value is a genuinely popular variant, and it is correct — but the forward version, where you subtract the current value on seeing a larger successor, needs no correction step at all. Both are defensible; only one is hard to get wrong at speed.',
        hint: 'In a backwards scan, by the time you notice the pair, what have you already added to the total?'
      }
    ]
  };
  E['integer-to-roman'] = {
    id: 'integer-to-roman',
    epNumber: 168,
    title: 'Carving the Number Back Into Stone',
    arc: 'Dawn Island',
    patternId: 'greedy',
    scene: 'sea',
    leetcode: { name: 'Integer to Roman', number: 12, difficulty: 'Medium', url: 'https://leetcode.com/problems/integer-to-roman/' },
    problem: 'Convert an integer to a Roman numeral, using the subtractive forms where they apply.',
    example: 'num = 1994  →  "MCMXCIV"',

    h: 200,
    props: [
      { id: 't1000', emoji: '🗿', label: 'M 1000', x: 20, y: 30 },
      { id: 't900', emoji: '🗿', label: 'CM 900', x: 50, y: 30 },
      { id: 't90', emoji: '🗿', label: 'XC 90', x: 80, y: 30 },
      { id: 't4', emoji: '🗿', label: 'IV 4', x: 50, y: 60 }
    ],
    ledger: [
      { id: 'GR', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Now the other direction — carve nineteen ninety-four into the stone the old way. And the subtractive pairs have to come out right.",
        p: { t1000: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Do we handle the digits one at a time, with a special case whenever a digit is four or nine?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a tidier way. Put the six subtractive forms into the value table as first-class entries — nine hundred is CM, four is IV — and then simply take the largest that fits, repeatedly.",
        p: { t900: 'good', t90: 'good', t4: 'good' }, l: { GR: 'greedy over 13 entries' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So no special cases at all. Nineteen ninety-four: M leaves nine ninety-four. CM leaves ninety-four. XC leaves four. IV leaves nothing.",
        p: { t1000: 'good' }, l: { GR: 'MCMXCIV ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Why is the greedy safe? Greedy algorithms usually need an argument.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because this particular set of values is designed so that taking the largest that fits is always optimal — it is a canonical system. The same greedy on an arbitrary coin set would be wrong.",
        p: { GR: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So the correctness comes from the value set, not from the algorithm. Good to know which is doing the work.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And note the asymmetry with reading numerals. Parsing is cleanest with the comparison RULE; generating is cleanest with the six forms ENUMERATED. Opposite choices, same notation.",
        sfx: 'gong'
      }
    ],

    insight: 'Promote the special cases into the data: with the six subtractive forms as ordinary table entries, a plain greedy over descending values needs no special handling at all.',
    complexity: '<b>Time O(1)</b> — the input is bounded at 3999, so the loop runs a bounded number of times. <b>Space O(1)</b>.',
    pitfall: 'Handling each decimal digit with a branch for 4 and 9, which is longer and error-prone. And assuming the greedy is generally safe — it is correct here because the Roman value set is canonical, not because greedy always works on coin-like problems.',
    solution: `def int_to_roman(num):
    # The six subtractive forms are ordinary entries, so no special cases.
    table = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'),
             (100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'),
             (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]

    out = []
    for value, symbol in table:
        count, num = divmod(num, value)
        out.append(symbol * count)
    return ''.join(out)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami uses only the seven basic symbols and takes the largest that fits. What does she produce for 4?",
        options: [
          '"IIII" instead of "IV" — the subtractive forms must be in the table for the greedy to reach them',
          '"IV", correctly',
          '"VI"',
          'An empty string'
        ],
        correct: 0,
        explain: 'The greedy can only produce combinations its table contains. Without CM, CD, XC, XL, IX and IV as entries, it emits the additive forms — which are not valid modern Roman numerals. Promoting the special cases into the data is what makes the algorithm trivial.',
        hint: 'With only I, V, X, L, C, D and M available, what is the largest value that fits into 4?'
      },
      {
        tag: 'TRANSFER',
        q: "Different currency: Franky makes change from coins of 1, 3 and 4 using the same largest-first greedy. For 6, what does he get?",
        options: [
          '4 + 1 + 1, three coins, when 3 + 3 would do it in two — the greedy is wrong for this coin set',
          '3 + 3, correctly',
          '4 + 2, correctly',
          'The greedy is always optimal for coins'
        ],
        correct: 0,
        explain: 'The essential contrast. Roman values form a canonical system where largest-first is provably optimal; arbitrary coin sets do not, which is why Coin Change is a DP problem. Knowing that the correctness lives in the value set is the transferable part.',
        hint: 'Work 6 by hand with coins of 1, 3 and 4, greedily and then optimally.'
      },
      {
        tag: 'TWEAK',
        q: "Why is parsing numerals cleanest with a comparison rule, while generating them is cleanest with the six forms enumerated?",
        options: [
          'Parsing sees the pair already written and can detect it by comparison; generating must decide to produce it, and having it in the table makes that decision automatic',
          'Because parsing is easier than generating',
          'Because the six forms cannot be detected by comparison',
          'They should use the same approach'
        ],
        correct: 0,
        explain: 'A nice illustration that the right representation depends on direction of travel. Reading, the subtractive pair is evident from the local ordering. Writing, there is no ordering yet — you have to choose to emit CM, and the cheapest way to make that choice is to have CM be a thing you can choose.',
        hint: 'When parsing, is the pair already in front of you? When generating, is it?'
      }
    ]
  };

  E['length-of-last-word'] = {
    id: 'length-of-last-word',
    epNumber: 169,
    title: 'The Last Word on the Signpost',
    arc: 'Dawn Island',
    scene: 'sea',
    leetcode: { name: 'Length of Last Word', number: 58, difficulty: 'Easy', url: 'https://leetcode.com/problems/length-of-last-word/' },
    problem: 'Given a string of words separated by spaces, return the length of the last word. There may be trailing spaces.',
    example: 's = "Hello World   "  →  5',

    h: 200,
    props: [
      { id: 'wh', emoji: '🪧', label: 'Hello', x: 26, y: 34 },
      { id: 'ww', emoji: '🪧', label: 'World', x: 54, y: 34 },
      { id: 'ws', emoji: '␣', label: 'spaces', x: 82, y: 34 }
    ],
    ledger: [
      { id: 'C', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The signpost has been weathered and there are stray spaces trailing off the end. How long is the last actual word?",
        p: { wh: 'lit', ww: 'lit', ws: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Split on spaces and take the last piece? That works, but it builds a list of every word to look at one of them.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Walk backwards instead. Skip any trailing spaces, then count letters until you meet a space or run out of signpost.",
        p: { C: 'lit' }, l: { C: 'skip spaces, then count' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two loops, no allocation, and it stops as soon as it has the answer — even if the signpost is a thousand words long.",
        p: { ws: 'dim', ww: 'good' }, l: { C: 'length 5 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "The trailing spaces are the whole trick, aren't they. Without skipping them first you'd count zero.",
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And a string that is entirely spaces has no last word at all — the answer is zero, and the second loop simply never runs.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Easy problems still have edge cases. This one has two, and both live at the end of the string.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is a good habit generally: when a problem mentions the end of something, check what happens when the end is ragged or empty.",
        sfx: 'gong'
      }
    ],

    insight: 'When only the tail of a string matters, walk backwards — it turns an O(n) split-and-discard into a scan that stops as soon as the answer is known.',
    complexity: '<b>Time O(n)</b> worst case but typically far less — it touches only the trailing spaces and the last word. <b>Space O(1)</b>. Splitting is O(n) time and O(n) space.',
    pitfall: 'Forgetting the trailing spaces, which gives a length of zero. And assuming there is always a last word — an all-space string must return 0.',
    solution: `def length_of_last_word(s):
    i = len(s) - 1
    while i >= 0 and s[i] == ' ':      # skip trailing spaces first
        i -= 1

    length = 0
    while i >= 0 and s[i] != ' ':      # then count the word
        length += 1
        i -= 1
    return length`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami counts backwards from the last character without skipping trailing spaces. On \"Hello World   \" what does she return?",
        options: [
          '0 — the very last character is a space, so her count stops immediately',
          '5, correctly',
          '11',
          'It crashes'
        ],
        correct: 0,
        explain: 'The counting loop stops on the first space it meets, and with trailing whitespace that is the first character it looks at. Two loops — skip, then count — is the whole fix, and the problem statement mentions trailing spaces precisely because this is the trap.',
        hint: 'What is the last character of that string?'
      },
      {
        tag: 'TWEAK',
        q: "The input is \"   \" — nothing but spaces. What should the code return, and does the two-loop version handle it?",
        options: [
          '0, and yes — the skip loop consumes everything and the count loop never runs',
          '3, from counting the spaces',
          'It should raise an error',
          'It crashes on a negative index'
        ],
        correct: 0,
        explain: 'The index bound in both loops handles the degenerate case without a special branch. Writing the loops with their bounds correct from the start is what lets edge cases fall out rather than needing guards — the same instinct as the sentinel values elsewhere.',
        hint: 'Trace i through both loops when every character is a space.'
      },
      {
        tag: 'TRANSFER',
        q: "Different signpost: Franky needs the length of the FIRST word instead. Does backwards scanning help?",
        options: [
          'No — scan forwards from the start, skipping leading spaces then counting; the direction should follow which end you need',
          'Yes, reverse the string first',
          'Yes, the same code works',
          'It requires splitting'
        ],
        correct: 0,
        explain: 'The lesson is not "scan backwards" but "scan from the end you care about". Reversing the string to reuse the code would cost O(n) time and space for no benefit — which is exactly the kind of trade worth noticing before making it.',
        hint: 'Which end of the string holds the answer, and where should the scan begin?'
      }
    ]
  };

  E['longest-common-prefix'] = {
    id: 'longest-common-prefix',
    epNumber: 170,
    title: 'What All the Charts Agree On',
    arc: 'Dawn Island',
    patternId: 'trie',
    scene: 'sea',
    leetcode: { name: 'Longest Common Prefix', number: 14, difficulty: 'Easy', url: 'https://leetcode.com/problems/longest-common-prefix/' },
    problem: 'Find the longest common prefix shared by an array of strings. Return an empty string if there is none.',
    example: 'strs = ["flower","flow","flight"]  →  "fl"',

    h: 200,
    props: [
      { id: 'g1', emoji: '🗺️', label: 'flower', x: 24, y: 30 },
      { id: 'g2', emoji: '🗺️', label: 'flow', x: 50, y: 30 },
      { id: 'g3', emoji: '🗺️', label: 'flight', x: 76, y: 30 }
    ],
    ledger: [
      { id: 'P', x: 50, y: 74 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Three charts of the same waters, drawn by three cartographers. How much of the beginning do all three agree on?",
        p: { g1: 'lit', g2: 'lit', g3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Compare position zero across all three, then position one, and stop at the first disagreement?",
        p: { P: 'lit' }, l: { P: 'column by column' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the vertical scan, and it is the best of the simple approaches — because it stops as soon as the answer is known, without examining the rest of any chart.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "All three start with f. All three have l next. Then 'o', 'o', 'i' — disagreement. Two characters.",
        p: { g1: 'good', g2: 'good', g3: 'good' }, l: { P: '"fl" ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And if one chart runs out before the others?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then the prefix cannot be longer than that chart, so the scan stops there too. The answer is bounded by the SHORTEST string, always.",
        p: { g2: 'dim' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "There's a horizontal version too — take the first chart as a running prefix and shrink it against each of the others.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Same complexity in the worst case, but it reads every chart even when the answer is empty. If the very first characters disagree, the vertical scan is finished after one comparison.",
        sfx: 'gong'
      }
    ],

    insight: 'Scanning column by column stops at the first disagreement, so the work is proportional to the ANSWER rather than to the input — and the prefix can never outlast the shortest string.',
    complexity: '<b>Time O(S)</b> in the worst case where S is the total character count, but only O(n · answer) in practice. <b>Space O(1)</b>. Sorting and comparing the first and last strings is O(S log n).',
    pitfall: 'Indexing past the end of the shortest string. And returning the whole first string when the array has one element but forgetting the empty-array case, which must return "".',
    solution: `def longest_common_prefix(strs):
    if not strs:
        return ""

    for i in range(len(strs[0])):          # column by column
        ch = strs[0][i]
        for other in strs[1:]:
            if i == len(other) or other[i] != ch:
                return strs[0][:i]         # first disagreement, or a string ended
    return strs[0]                          # the first string is itself the prefix`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different charts: Nami must answer many prefix queries against a fixed set of 100,000 strings. What structure now?",
        options: [
          'A trie — it makes the shared prefix structure explicit and answers each query by walking down it',
          'The same vertical scan per query',
          'Sort the strings once and binary search',
          'A hash set of the strings'
        ],
        correct: 0,
        explain: 'Repeated prefix questions against a fixed set is the signal for a trie: the common prefix of the whole set is just the path from the root to the first branching node. A hash set cannot answer prefix questions at all, and re-scanning per query wastes the fixed structure.',
        hint: 'What has to be rebuilt on every query with the scanning approach, and can it be built once instead?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp iterates over the length of the FIRST string and indexes every other string at that position, without a length check. On [\"abc\", \"ab\"] what happens?",
        options: [
          'It indexes past the end of "ab" and crashes — the prefix is bounded by the shortest string',
          'It returns "ab", correctly',
          'It returns "abc"',
          'It returns an empty string'
        ],
        correct: 0,
        explain: 'The first string is not necessarily the shortest, so its length is the wrong loop bound without a per-string check. The alternative is to find the shortest string first — either way, the bound must come from the minimum length, not from an arbitrary element.',
        hint: 'Which string in the array determines how long the answer can possibly be?'
      },
      {
        tag: 'TWEAK',
        q: "Robin suggests sorting the array and comparing only the first and last strings. Is that correct?",
        options: [
          'Yes — lexicographic order puts the two most dissimilar strings at the ends, so their common prefix is the whole set\'s',
          'No, sorting destroys the prefixes',
          'Only if all strings are the same length',
          'Yes, and it is asymptotically faster'
        ],
        correct: 0,
        explain: 'A genuinely correct and elegant alternative: any string between them lexicographically must share at least that prefix. It costs O(S log n) for the sort, so it is slower than the vertical scan — but it is a good answer to have ready when asked for another approach.',
        hint: 'After sorting, what can you say about a string that lies between the first and the last?'
      }
    ]
  };

  E['reverse-words-in-a-string'] = {
    id: 'reverse-words-in-a-string',
    epNumber: 171,
    title: 'The Order of the Message, Turned Around',
    arc: 'Dawn Island',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Reverse Words in a String', number: 151, difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-words-in-a-string/' },
    problem: 'Reverse the order of the words in a string. Words are separated by one or more spaces; the result must have single spaces and no leading or trailing space.',
    example: 's = "  the sky   is blue  "  →  "blue is sky the"',

    h: 200,
    props: [
      { id: 'v1', emoji: '💬', label: 'the', x: 20, y: 32 },
      { id: 'v2', emoji: '💬', label: 'sky', x: 42, y: 32 },
      { id: 'v3', emoji: '💬', label: 'is', x: 62, y: 32 },
      { id: 'v4', emoji: '💬', label: 'blue', x: 84, y: 32 }
    ],
    ledger: [
      { id: 'RV', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The message has to be read back with its words in reverse order — and the transcription is full of stray spaces that must not survive.",
        p: { v1: 'lit', v2: 'lit', v3: 'lit', v4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Split on whitespace, reverse the list, join with single spaces. Three operations and the spacing is handled for free.",
        p: { RV: 'lit' }, l: { RV: 'split, reverse, join' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the right answer in most languages, and worth saying plainly. A whitespace split with no argument collapses runs of spaces and drops the empty pieces automatically.",
        p: { v4: 'good', v3: 'good', v2: 'good', v1: 'good' }, l: { RV: '"blue is sky the" ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if they ask for it in place, on a character array?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then it is the reversal trick again. Reverse the entire string, which puts the words in the right order but each one backwards. Then reverse each word individually to straighten it.",
        p: { RV: 'good' }, l: { RV: 'reverse all, then each word' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Exactly the same double-reversal as rotating an array. Two applications of one idea.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Plus a compaction pass to squeeze the extra spaces out, which is the fiddly part and the reason the split version is preferable when it is allowed.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Know both, offer the simple one, and have the in-place version ready for the follow-up.",
        sfx: 'gong'
      }
    ],

    insight: 'Reversing the whole sequence and then reversing each block is the general way to reorder blocks in place — the same move as rotating an array, applied to words instead of positions.',
    complexity: '<b>Time O(n)</b> either way. <b>Space O(n)</b> for the split version, or <b>O(1)</b> extra for the in-place double reversal on a mutable character array.',
    pitfall: 'Splitting on a single space rather than on whitespace runs, which produces empty strings between repeated spaces. And leaving a leading or trailing space in the joined result.',
    solution: `def reverse_words(s):
    return ' '.join(reversed(s.split()))
    # s.split() with no argument collapses runs of whitespace and
    # drops the empty pieces, which handles all the spacing rules.

    # In-place variant on a mutable char array:
    #   1. reverse the whole array
    #   2. reverse each word in it
    #   3. compact multiple spaces down to one`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami uses <code>s.split(' ')</code> on \"the sky   is blue\". What does she get?",
        options: [
          'Empty strings between the repeated spaces, which then appear as stray spaces in the joined result',
          'The correct word list',
          'A single-element list',
          'An error'
        ],
        correct: 0,
        explain: 'Splitting on an explicit single space treats each one as a separator, so consecutive spaces produce empty pieces. The no-argument form splits on whitespace RUNS and discards empties — a one-character difference with a visible effect on the output.',
        hint: 'How many separators are there between "sky" and "is", and what lies between them?'
      },
      {
        tag: 'TRANSFER',
        q: "Different message: Franky must reverse the CHARACTERS of each word while keeping the word order. What changes?",
        options: [
          'Only the second half of the in-place trick — reverse each word and skip the whole-string reversal',
          'Reverse the whole string only',
          'Nothing changes',
          'It requires a stack'
        ],
        correct: 0,
        explain: 'The two reversals are independent: reversing the whole string reorders the words, and reversing each word fixes their internal order. Wanting only one of those effects means performing only one of the two steps — which is a good way to check you understood what each was doing.',
        hint: 'Of the two reversals, which one changed the ORDER of the words?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer requires O(1) extra space on a mutable character array. Which step is the awkward one?",
        options: [
          'The compaction — squeezing out extra spaces while shifting the remaining characters left without an extra buffer',
          'The whole-string reversal',
          'Reversing each word',
          'Finding the word boundaries'
        ],
        correct: 0,
        explain: 'The two reversals are straightforward two-pointer swaps. Compaction is a write-pointer pass that must copy characters leftward while tracking word boundaries — the same in-place write-index shape as removing elements from an array, and the part most likely to go wrong.',
        hint: 'Which step changes the LENGTH of the useful content?'
      }
    ]
  };

  E['zigzag-conversion'] = {
    id: 'zigzag-conversion',
    epNumber: 172,
    title: 'The Message Written Down the Mast',
    arc: 'Dawn Island',
    scene: 'sea',
    leetcode: { name: 'Zigzag Conversion', number: 6, difficulty: 'Medium', url: 'https://leetcode.com/problems/zigzag-conversion/' },
    problem: 'Write a string in a zigzag pattern across a given number of rows, then read it off row by row.',
    example: 's = "PAYPALISHIRING", numRows = 3  →  "PAHNAPLSIIGYIR"',

    h: 200,
    props: [
      { id: 'z1', emoji: '⬇️', label: 'row 0', x: 30, y: 26 },
      { id: 'z2', emoji: '↕️', label: 'row 1', x: 30, y: 46 },
      { id: 'z3', emoji: '⬆️', label: 'row 2', x: 30, y: 66 },
      { id: 'zd', emoji: '🔃', label: 'flip at the ends', x: 74, y: 46 }
    ],
    ledger: [
      { id: 'Z', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The message runs down the mast, then diagonally back up, then down again — and to read it you take each crossbar in turn, left to right.",
        p: { z1: 'lit', z2: 'lit', z3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Do we have to build the whole grid? Most of it would be empty.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "No grid at all. Keep one bucket per row and walk the message once, appending each character to the row you are currently on.",
        p: { Z: 'lit' }, l: { Z: 'one bucket per row' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the row index just goes down, down, down, then up, up, up.",
        p: { zd: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Carry a direction of plus one or minus one, and flip it whenever you reach the top row or the bottom row. That single flip is the entire zigzag.",
        p: { zd: 'good' }, l: { Z: 'flip at row 0 and row n-1' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Then concatenate the buckets in order and you have the answer. Linear time, and only the characters themselves are stored.",
        p: { z1: 'good', z2: 'good', z3: 'good' }, l: { Z: 'join the rows ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "What if there's only one row? Then there's no zigzag at all.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The direction would flip on every character and the index would try to leave the mast. So guard it: one row, or a row count at least the message length, means the answer is the message unchanged.",
        sfx: 'gong'
      }
    ],

    insight: 'Simulate the traversal rather than the grid — one bucket per row and a direction that flips at the boundaries captures the whole pattern with no empty cells stored.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(n)</b> for the buckets, which hold each character exactly once. Building a full grid would be O(n · rows) and mostly empty.',
    pitfall: 'The numRows = 1 case, where the direction flips every step and the row index escapes the range. Also, building the two-dimensional grid explicitly, which wastes space on cells that are never used.',
    solution: `def convert(s, num_rows):
    if num_rows == 1 or num_rows >= len(s):
        return s                        # no zigzag happens at all

    rows = [[] for _ in range(num_rows)]
    row, step = 0, 1
    for ch in s:
        rows[row].append(ch)
        if row == 0:
            step = 1                    # bounce off the top
        elif row == num_rows - 1:
            step = -1                   # bounce off the bottom
        row += step

    return ''.join(''.join(r) for r in rows)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami omits the numRows = 1 guard. What happens on that input?",
        options: [
          'The direction flips every character, so the row index oscillates out of range or the output is wrong',
          'It returns the string reversed',
          'It returns an empty string',
          'Nothing; the general case handles it'
        ],
        correct: 0,
        explain: 'With a single row, index 0 is simultaneously the top and the bottom, so both flip conditions fire and the index steps out of the valid range. Degenerate parameters are worth tracing rather than assuming — the guard states the fact that no zigzag exists.',
        hint: 'When numRows is 1, which row is both the first and the last?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer asks for O(1) extra space beyond the output — no buckets. What is the approach?",
        options: [
          'Derive each row\'s character indices arithmetically: within a cycle of 2·rows − 2, each row has a fixed pattern of offsets',
          'Sort the characters by row',
          'Reverse the string first',
          'It is impossible without buckets'
        ],
        correct: 0,
        explain: 'The zigzag is periodic, so row r contains indices at a computable arithmetic pattern — with middle rows contributing two characters per cycle and the top and bottom rows one. It is fiddlier to derive, which is exactly why the simulation is the answer to give first.',
        hint: 'How many characters pass before the pattern returns to the top row?'
      },
      {
        tag: 'TRANSFER',
        q: "Different mast: Franky reads a message written in a spiral rather than a zigzag. What is the shared technique?",
        options: [
          'Simulate the traversal with a direction that changes at boundaries, rather than materialising the layout',
          'Sort by position',
          'Build the full grid, since spirals need it',
          'They share nothing'
        ],
        correct: 0,
        explain: 'Both are traversal-order problems, and both are cleanest when you simulate the walk and let the boundary conditions steer it. The spiral needs four shrinking walls where the zigzag needs one flipping direction, but the instinct — simulate the path, not the container — is the same.',
        hint: 'What did the direction variable represent, and what would a spiral need instead?'
      }
    ]
  };

  E['find-first-occurrence'] = {
    id: 'find-first-occurrence',
    epNumber: 173,
    title: 'Finding the Phrase in the Log',
    arc: 'Dawn Island',
    patternId: 'sliding-window',
    scene: 'sea',
    leetcode: { name: 'Find the Index of the First Occurrence in a String', number: 28, difficulty: 'Easy', url: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/' },
    problem: 'Return the index of the first occurrence of needle in haystack, or -1 if it does not occur.',
    example: 'haystack = "sadbutsad", needle = "sad"  →  0',

    h: 200,
    props: [
      { id: 'hs', emoji: '📖', label: 'haystack', x: 34, y: 30 },
      { id: 'nd', emoji: '🔍', label: 'needle', x: 74, y: 30 },
      { id: 'kp', emoji: '⏭️', label: 'skip smartly', x: 50, y: 62 }
    ],
    ledger: [
      { id: 'F', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Find where a phrase first appears in the ship's log — the position, not merely whether it is there.",
        p: { hs: 'lit', nd: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Try every starting position and compare forward from each. That's the obvious way.",
        p: { F: 'lit' }, l: { F: 'O(n·m) sliding compare' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And it is a perfectly good answer — n times m in the worst case, but far better in practice, because most comparisons fail on the first character.",
        p: { F: 'good' }, l: { F: 'found at 0 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "What makes the worst case bad?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Highly repetitive text — a log of a thousand a's searched for a thousand a's followed by a b. Every start matches almost to the end and then fails.",
        p: { kp: 'lit' },
        sfx: 'error'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And the fix is to remember what we already matched, rather than throwing it away and restarting.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is KMP. Precompute, for each prefix of the phrase, the longest proper prefix that is also a suffix of it — then on a mismatch you know exactly how far you may skip without missing anything.",
        p: { kp: 'good' }, l: { F: 'KMP → O(n + m)' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So the naive version is the answer to give, and KMP is the answer to be able to describe.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Precisely. Name it, explain what the failure table means, and offer to write it. Very few interviews require the code; most want to know that you know why it exists.",
        sfx: 'gong'
      }
    ],

    insight: 'A failed match is information — KMP\'s failure table records how much of the pattern is still valid after a mismatch, so the haystack pointer never has to go backwards.',
    complexity: '<b>Time O(n · m)</b> for the straightforward scan, or <b>O(n + m)</b> with KMP. <b>Space O(1)</b> or O(m) for the failure table.',
    pitfall: 'Restarting the comparison from scratch after every mismatch, which is only slow on repetitive input — the case the worst-case bound is about. And forgetting that an empty needle conventionally returns 0.',
    solution: `def str_str(haystack, needle):
    n, m = len(haystack), len(needle)
    if m == 0:
        return 0
    # Straightforward scan: fine in practice, O(n*m) in the worst case.
    for i in range(n - m + 1):
        if haystack[i:i + m] == needle:
            return i
    return -1

    # KMP replaces the restart: build a failure table over the needle so
    # that after a mismatch the pattern pointer falls back to the longest
    # prefix that is also a suffix, and the haystack pointer never rewinds.`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "For which input is the straightforward scan genuinely slow?",
        options: [
          'Highly repetitive text — a haystack of many "a"s searched for many "a"s ending in "b"',
          'Very long haystacks with random text',
          'Needles longer than the haystack',
          'It is never slow in practice'
        ],
        correct: 0,
        explain: 'With random text, a mismatch usually occurs within a character or two, so the scan is effectively linear. The quadratic behaviour needs long partial matches that repeatedly fail at the end, which is exactly what repetitive input produces — and exactly what KMP fixes.',
        hint: 'For the scan to be slow, each attempted match must get FAR before failing. What text does that?'
      },
      {
        tag: 'TRANSFER',
        q: "Different log: Nami must find every occurrence of the phrase, not merely the first. What changes with KMP?",
        options: [
          'Almost nothing — on a full match, fall back through the failure table instead of stopping, and continue scanning',
          'The failure table must be rebuilt after each match',
          'It requires a separate pass per occurrence',
          'KMP can only find the first occurrence'
        ],
        correct: 0,
        explain: 'The failure table already encodes how much of the pattern is still valid, so a full match is handled exactly like a mismatch at the end — fall back and keep going. This is what lets KMP find overlapping occurrences in a single linear pass.',
        hint: 'A complete match is just a mismatch that happened one character too late. What do you do on a mismatch?'
      },
      {
        tag: 'TWEAK',
        q: "The needle is empty. What should the function return?",
        options: [
          '0 — the empty string is conventionally found at position 0',
          '-1',
          'The haystack length',
          'It is undefined'
        ],
        correct: 0,
        explain: 'A convention rather than a deduction, which is why it is worth confirming out loud in an interview. Most standard library implementations agree on 0, and the problem statement generally specifies it — but assuming without checking is how a passing solution becomes a failing one.',
        hint: 'This is a definition question rather than an algorithmic one. Where would you look for the answer?'
      }
    ]
  };

  E['text-justification'] = {
    id: 'text-justification',
    epNumber: 174,
    title: 'The Last Page of the Log',
    arc: 'Dawn Island',
    patternId: 'greedy',
    scene: 'sea',
    leetcode: { name: 'Text Justification', number: 68, difficulty: 'Hard', url: 'https://leetcode.com/problems/text-justification/' },
    problem: 'Format an array of words into lines of exactly maxWidth characters, fully justified. Extra spaces go to the leftmost gaps first. The final line is left-justified.',
    example: 'words = ["This","is","an"], maxWidth = 16  →  ["This    is    an"]',

    h: 200,
    props: [
      { id: 'ln', emoji: '📏', label: 'pack the line', x: 26, y: 30 },
      { id: 'gp', emoji: '␣', label: 'spread the gaps', x: 62, y: 30 },
      { id: 'lf', emoji: '⬅️', label: 'last line: left', x: 44, y: 60 }
    ],
    ledger: [
      { id: 'J', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The log has to be set in justified columns — every line exactly the same width, spaces spread between the words, and the final line left-aligned like a signature.",
        p: { ln: 'lit', gp: 'lit', lf: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Nothing here is clever, is it. It's just a lot of rules, all of which have to be right at once.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is exactly what this problem tests. Do it in two clearly separated jobs: first decide WHICH words go on the line, then decide HOW to space them.",
        p: { J: 'lit' }, l: { J: 'pack, then space' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Packing is greedy — keep adding words while they fit, remembering that each new word needs at least one space before it.",
        p: { ln: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then the spacing. Take the leftover width, divide it among the gaps, and give the remainder one extra space each to the LEFTMOST gaps. That is what 'extra spaces on the left' means, precisely.",
        p: { gp: 'good' }, l: { J: 'quotient to all, remainder to the left' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And a line holding just one word has no gaps at all, so dividing would be dividing by zero.",
        p: { gp: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So a single-word line is left-justified and padded on the right — the same treatment as the final line. Two special cases that resolve to the same rule.",
        p: { gp: 'good', lf: 'good' }, l: { J: 'justified ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The way to survive this is to write the two jobs as separate functions and test them apart.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And to read the specification twice before writing anything. Almost every failure on this problem is a misread rule rather than a broken algorithm.",
        sfx: 'gong'
      }
    ],

    insight: 'Separate the two decisions — which words fit, and how to distribute the leftover spaces — so that each can be reasoned about and tested on its own.',
    complexity: '<b>Time O(total characters)</b> — each word is packed once and written once. <b>Space O(total)</b> for the output lines.',
    pitfall: 'Dividing by the gap count on a single-word line, which is zero. And justifying the last line, which must be left-aligned with a single space between words and padding on the right.',
    solution: `def full_justify(words, max_width):
    lines, cur, cur_len = [], [], 0

    for w in words:
        # Each additional word needs at least one space before it.
        if cur_len + len(cur) + len(w) > max_width:
            lines.append(cur)
            cur, cur_len = [], 0
        cur.append(w)
        cur_len += len(w)
    lines.append(cur)

    out = []
    for i, line in enumerate(lines):
        if i == len(lines) - 1 or len(line) == 1:
            # Last line, or a lone word: left-justified, padded right.
            text = ' '.join(line)
            out.append(text + ' ' * (max_width - len(text)))
        else:
            total_spaces = max_width - sum(len(w) for w in line)
            gaps = len(line) - 1
            base, extra = divmod(total_spaces, gaps)
            parts = []
            for j, w in enumerate(line[:-1]):
                # The remainder goes to the LEFTMOST gaps.
                parts.append(w + ' ' * (base + (1 if j < extra else 0)))
            parts.append(line[-1])
            out.append(''.join(parts))
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "A line contains a single long word. Usopp's justification code computes <code>total_spaces // gaps</code>. What happens?",
        options: [
          'A division by zero — one word means zero gaps, so it must be handled as a left-justified line instead',
          'The word is centred',
          'The line is left blank',
          'Nothing; the division is safe'
        ],
        correct: 0,
        explain: 'A line of one word has no gaps to distribute into, so the spacing rule does not apply at all. It gets the same treatment as the last line — left-aligned, padded right. Two distinct special cases collapsing into one rule is worth noticing.',
        hint: 'How many gaps are there between the words on a line holding one word?'
      },
      {
        tag: 'PITFALL',
        q: "Nami distributes the leftover spaces so that the remainder goes to the RIGHTMOST gaps instead. What is wrong?",
        options: [
          'The specification requires extra spaces on the left — the output is well-formed but does not match the expected result',
          'The lines come out the wrong length',
          'It divides by zero',
          'Nothing; either is accepted'
        ],
        correct: 0,
        explain: 'A pure specification failure rather than an algorithmic one, which is what makes this problem Hard. The lines are the right width and look reasonable — they simply are not what was asked for. Reading the rules twice is the actual technique here.',
        hint: 'Does the output violate any structural property, or just a stated rule?'
      },
      {
        tag: 'TWEAK',
        q: "The packing step decides whether a word fits. Why is <code>cur_len + len(cur) + len(w)</code> the right test?",
        options: [
          '<code>len(cur)</code> counts the minimum one space needed before each existing word plus the new one — the tightest possible packing',
          'It is an approximation that happens to work',
          'It should be cur_len + len(w) alone',
          'It over-counts by one and should be reduced'
        ],
        correct: 0,
        explain: 'With k words already on the line, adding one more requires k separating spaces at minimum — which is exactly <code>len(cur)</code> before the append. Getting this bound wrong by one either overfills lines or wastes a word per line, and it is the single most common packing bug.',
        hint: 'If a line already holds 3 words and you add a 4th, how many spaces are mandatory?'
      }
    ]
  };

}(typeof window !== 'undefined' ? window : this));
