/* Grand Line Dojo — the cast, the opponents, and the question banks.
 *
 * Every one of the Top Interview 150 must be fightable, including the ones
 * whose episode is not written yet, so the drills here are keyed by *pattern*
 * rather than by problem. A fight pulls from its pattern's bank and, when the
 * episode exists, mixes in that episode's own tweaked-scenario quiz.
 *
 * Writing style for the banks: the question is a scene, the options are moves,
 * and the explanation is the only part that has to survive being read alone at
 * 2am. Wrong options are real misconceptions, never filler.
 *
 * Consumed by dojo.html together with js/fight-engine.js and js/stickman.js.
 */
(function (root) {
  'use strict';

  /* ---- the crew ---------------------------------------------------------
     Appearance only. The Devil Fruit power is applied per arc at fight time,
     because in this course a power *is* the algorithm's metaphor — the same
     crewmate fights with the pattern the island teaches. */
  var CREW = {
    luffy:  { name: 'Luffy',  eyes: 'wide',   mouth: 'bigGrin', hair: 'scruff', hat: 'straw',   hatColor: '#e0b23c', color: '#e94b3c', scar: true },
    zoro:   { name: 'Zoro',   eyes: 'angry',  mouth: 'flat',    hair: 'spiky',  hat: 'bandana', hatColor: '#1a1a1a', color: '#2f855a', scar: true },
    nami:   { name: 'Nami',   eyes: 'dot',    mouth: 'grin',    hair: 'long',   hat: 'none',    color: '#f6ad55' },
    usopp:  { name: 'Usopp',  eyes: 'dot',    mouth: 'smirk',   hair: 'afro',   hat: 'bandana', hatColor: '#c05621', color: '#b7791f' },
    sanji:  { name: 'Sanji',  eyes: 'shade',  mouth: 'smirk',   hair: 'bob',    hat: 'none',    color: '#4299e1' },
    chopper:{ name: 'Chopper',eyes: 'wide',   mouth: 'grin',    hair: 'scruff', hat: 'tophat',  hatColor: '#c53030', color: '#ed8936' },
    robin:  { name: 'Robin',  eyes: 'closed', mouth: 'smirk',   hair: 'long',   hat: 'none',    color: '#805ad5' },
    franky: { name: 'Franky', eyes: 'shade',  mouth: 'bigGrin', hair: 'spiky',  hat: 'none',    color: '#38b2ac' },
    brook:  { name: 'Brook',  eyes: 'hollow', mouth: 'fang',    hair: 'afro',   hat: 'tophat',  hatColor: '#2d3748', color: '#a0aec0' },
    jinbe:  { name: 'Jinbe',  eyes: 'angry',  mouth: 'flat',    hair: 'bob',    hat: 'none',    color: '#3182ce' },
    law:    { name: 'Law',    eyes: 'shade',  mouth: 'flat',    hair: 'scruff', hat: 'cap',     hatColor: '#2b6cb0', color: '#4fd1c5' },
    ace:    { name: 'Ace',    eyes: 'star',   mouth: 'grin',    hair: 'scruff', hat: 'cap',     hatColor: '#dd6b20', color: '#f56565' },
    aokiji: { name: 'Aokiji', eyes: 'shade',  mouth: 'flat',    hair: 'scruff', hat: 'none',    color: '#63b3ed' }
  };

  /* ---- who you fight ----------------------------------------------------
     Chosen deterministically from the problem number, so a given problem always
     has the same opponent — the fight becomes a landmark you remember. */
  var FOES = {
    grunt: [
      { name: 'Checkpoint Marine', taunt: 'Halt! Nobody crosses without the paperwork.' },
      { name: 'Petty Officer',     taunt: 'You look lost, rookie. Turn around.' },
      { name: 'Harbour Guard',     taunt: 'This dock is closed. Try me if you disagree.' },
      { name: 'Bounty Hunter',     taunt: 'That poster of yours pays for a month of drinks.' },
      { name: 'Pirate Deckhand',   taunt: 'Captain said sink anything that floats past.' }
    ],
    officer: [
      { name: 'Captain Morgan-Class', taunt: 'So you know the pattern. Hold it under pressure.' },
      { name: 'Vice Admiral Aide',    taunt: 'Textbook answers die in the first exchange.' },
      { name: 'CP9 Agent',            taunt: 'I have read every move you are about to make.' },
      { name: 'Baroque Officer',      taunt: 'Mister Interviewer, if you please. Shall we?' },
      { name: 'Fleet Commander',      taunt: 'Three clean exchanges. Then we will talk.' }
    ],
    warlord: [
      { name: 'Warlord of the Sea', taunt: 'You are out of your depth. Two mistakes and this ends.' },
      { name: 'Yonko Commander',    taunt: 'Everyone before you also thought they had prepared.' },
      { name: 'Admiral',            taunt: 'Absolute Justice. Absolute complexity analysis.' },
      { name: 'Emperor of the Sea', taunt: 'Show me something I have not already crushed.' }
    ]
  };

  /* ---- the one sentence each arc has to leave you with ------------------- */
  var LESSONS = {
    'array-string':
      'Array work is almost always a second index in disguise: a write pointer, a prefix carried forward, or two ends walking inward. Reach for extra space only after you have proved one pass cannot carry enough state.',
    'two-pointers':
      'Two pointers work when moving one of them can never make the answer better — sortedness or monotonicity is the licence. Without that licence you are just guessing which side to move.',
    'sliding-window':
      'A window is a subarray you never rebuild. Grow on the right while the window is legal, shrink from the left the moment it is not, and record the answer at exactly one of those two moments.',
    'matrix':
      'A grid is an array with arithmetic. Get the index formula right on paper first — row/col swaps, layer bounds, the 3x3 box index — and the code becomes trivial.',
    'hashmap':
      'A hash map buys you the question "have I seen this before?" for O(1). The skill is choosing the key so that "seen" means exactly the thing you care about.',
    'intervals':
      'Sort by one endpoint and the chaos collapses into a single sweep. Which endpoint you sort by — start or end — is the entire decision.',
    'stack':
      'A stack is for work you must postpone until you meet its partner: a closing bracket, a taller bar, a higher temperature. If the answer depends on "the most recent unresolved thing", it is a stack.',
    'linked-list':
      'You cannot index a list, so you buy position with pointers: one ahead, one behind, or one moving twice as fast. Draw the three nodes around a rewire before you write it.',
    'tree':
      'Recursion on a tree is one honest question: what do I need from my children, and what do I hand my parent? Answer that and the traversal writes itself.',
    'tree-bfs':
      'Level order means the queue length at the top of the loop is exactly one level. Snapshot that count first, then drain precisely that many.',
    'bst':
      'A BST turns a search into a decision: too big, too small, or done. Its in-order traversal is sorted, and most BST problems are that fact wearing a costume.',
    'graph':
      'Model first, traverse second. Decide what a node is and what an edge means, and the problem usually becomes plain DFS, BFS, or a topological sort.',
    'graph-bfs':
      'BFS is the shortest-path algorithm for unweighted graphs because it finishes a whole ring before starting the next. Mark visited when you enqueue, not when you dequeue.',
    'trie':
      'A trie makes the prefix itself the address. It pays off when many strings share heads and you are asked about prefixes rather than whole words.',
    'backtracking':
      'Choose, recurse, un-choose. The entire craft is in pruning — every branch you cut before exploring is an exponential subtree you never pay for.',
    'divide-conquer':
      'Split into halves that are the same problem, solve them independently, and spend your cleverness on the merge. The merge is where the algorithm actually lives.',
    'kadane':
      'At every position ask one local question: extend the run, or start fresh here? Carry the best answer seen so far separately from the run you are currently in.',
    'binary-search':
      'Binary search needs a monotone predicate, not a sorted array. Once "false false false true true" describes your space, you can halve it — even if you are searching over answers rather than elements.',
    'heap':
      'A heap is for "the best k so far" when the stream keeps coming. Size-k heap of the opposite polarity: min-heap for the k largest, max-heap for the k smallest.',
    'bits':
      'Bits are a set you can hold in a register. XOR cancels pairs, n & (n-1) clears the lowest set bit, and masks let you loop over subsets for free.',
    'math':
      'Most interview "math" problems are about overflow, digit extraction, or a cycle you can detect. Find the invariant and stop simulating.',
    'dp-1d':
      'Define the state as a sentence in English first: "dp[i] is the best answer considering the first i things." If that sentence is precise, the recurrence and the base case are forced.',
    'dp-2d':
      'Two dimensions means two independent things move — two strings, a row and a capacity, a cell and a direction. Draw the table, fill one row by hand, and the transition appears.'
  };

  var BANKS = {};

  /* ---- Dawn Island — arrays and strings ---------------------------------- */
  BANKS['array-string'] = [
    {
      tag: 'MECHANICS',
      q: 'Nami merges two sorted crew rosters. The first has empty berths at the end — exactly enough for the second. Filling from the front means shoving names right on every insert. What does filling from the BACK buy you?',
      options: [
        'Every write lands in a berth that is already empty, so nothing you still need gets overwritten',
        'It avoids having to compare the two rosters at all',
        'It halves the number of comparisons',
        'It sorts the two rosters as a side effect'
      ],
      correct: 0,
      explain: 'The free space is at the tail. Writing largest-first fills it right-to-left, and both read pointers stay left of the write pointer, so a write can never clobber an unread value. O(m+n) time, no second array.',
      hint: 'Ask where the free space is, then ask whether a write can ever land on a value you have not read yet.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Rotten barrels must go over the side, and you cannot rent a second ship for the sorting. Which move keeps it O(1) extra space?',
      options: [
        'Keep a write index; copy each keeper forward onto it, and return that index as the new length',
        'Build a clean list elsewhere, then copy it back',
        'Splice each rotten barrel out of the middle the moment you find it',
        'Sort first so the rotten ones bunch at the end'
      ],
      correct: 0,
      explain: 'Two indices over one array: read scans everything, write advances only on a keeper, and the prefix [0, write) is always the answer so far. Splicing from the middle is O(n) per removal, so O(n²) overall.',
      hint: 'One array, two speeds. What is true of everything left of the slower index?'
    },
    {
      tag: 'MECHANICS',
      q: 'The whole crew must shift k posts around a circular deck, and there is no spare deck to stage them on. What is the three-move trick?',
      options: [
        'Reverse the whole line, then reverse the first k, then reverse the rest',
        'Reverse the first k, then reverse the rest, and stop there',
        'Swap element i with element i+k for every i',
        'Sort, rotate, then restore the original order'
      ],
      correct: 0,
      explain: 'Reversing everything puts the last k at the front, but backwards; reversing each block straightens it. Three linear passes, O(1) space. Take k %= n first or you spin past the end.',
      hint: 'What does reversing the entire array already do to the last k elements?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Log Pose readings arrive day by day. You may buy once and sell once, and never sell before you buy. What single number do you carry forward?',
      options: [
        'The cheapest reading so far — each day, test today against it',
        'The most expensive reading so far',
        'The running average of everything seen',
        'Nothing; you need every pair, so it is inherently O(n²)'
      ],
      correct: 0,
      explain: 'Best profit ending today = today − min(everything before today). Carry the running minimum, update the best profit, one pass, O(1) space. Tracking the max instead fails whenever the peak comes before the trough.',
      hint: 'Fix the sell day. What is the only thing about the past that matters?'
    },
    {
      tag: 'MECHANICS',
      q: 'Every chest must be relabelled with the product of ALL the other chests — and division is forbidden, because one chest holds a zero.',
      options: [
        'Sweep left building prefix products, then sweep right multiplying in suffix products',
        'Multiply everything once, then divide by each chest',
        'For each chest, loop over all the others',
        'Sort the chests, then multiply neighbouring pairs'
      ],
      correct: 0,
      explain: 'answer[i] = (product of everything left of i) × (product of everything right of i). Two passes, and the output array can hold the prefixes so extra space is O(1). Division dies on a single zero — and on two zeros it dies twice.',
      hint: 'Split "all the others" into two halves that meet at i.'
    },
    {
      tag: 'TRAP',
      q: 'You circle an island of fuel depots. Total fuel is at least total cost, so some start works. Running from depot `s`, your tank goes negative at depot `j`. What do you now know?',
      options: [
        'No depot from s through j can work — restart the attempt at j+1',
        'Only s fails; restart at s+1',
        'Depot j is the answer',
        'No answer exists, so return -1'
      ],
      correct: 0,
      explain: 'Any start between s and j begins with a non-negative tank at that point — and that was already not enough to reach j. So the whole block is dead and you skip it. That is what turns O(n²) into a single pass.',
      hint: 'How much fuel does a later start have banked when it arrives at the same failing depot?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'One flag flies on more than half the ships. Boyer-Moore keeps just a candidate and a count. Why is that enough?',
      options: [
        'Each non-majority ship can cancel at most one majority ship, and the majority has more than half',
        'The majority flag is always the median flag',
        'The scan implicitly sorts the ships',
        'It only works when identical flags are already adjacent'
      ],
      correct: 0,
      explain: 'Pair every majority element off against a different one. Since the majority holds strictly more than n/2, it cannot be fully cancelled and survives as the candidate. O(n) time, O(1) space — sorting and taking the middle also works, but costs O(n log n).',
      hint: 'Think of it as every other element trading itself one-for-one against a majority element.'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Rain pools between cliffs. Two pointers walk inward, each carrying the tallest wall it has seen on its side. Why is it safe to always move the SHORTER side?',
      options: [
        'The shorter side is the binding constraint, so the water above that column is already decided',
        'The shorter wall always holds less water than the taller one',
        'Moving the taller side would skip past a cliff',
        'It keeps the two pointers the same distance from the ends'
      ],
      correct: 0,
      explain: 'Water over a column is min(maxLeft, maxRight) − height. When maxLeft < maxRight, that min is maxLeft regardless of anything still hidden on the right, so the column can be settled now and the pointer advanced. O(n) time, O(1) space.',
      hint: 'You do not need to know the true right-hand maximum — only that it is at least the one you have.'
    }
  ];

  /* ---- Twin Capes — two pointers ----------------------------------------- */
  BANKS['two-pointers'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'A sorted line of barrels; find two whose weights sum to the harbourmaster\'s figure. One pointer at each end. The current sum is too small. Which pointer moves?',
      options: [
        'The left one moves right, because only a bigger value can raise the sum',
        'The right one moves left, to narrow the search',
        'Both move inward together',
        'Restart the left pointer from the beginning'
      ],
      correct: 0,
      explain: 'Sorted order is the licence: moving left rightward is the only way to increase the sum, and moving right leftward is the only way to decrease it. Each step permanently discards one candidate, so the whole scan is O(n).',
      hint: 'Which move can possibly increase the sum, given the array is sorted?'
    },
    {
      tag: 'TRAP',
      q: 'Same two-pointer sweep, but the barrels arrive UNSORTED and you must return their original berth numbers. What breaks?',
      options: [
        'The move rule loses its licence — without order, a bigger sum could lie in either direction',
        'Nothing; two pointers work on any array',
        'Only the return value changes; the sweep still works',
        'It still works but becomes O(n log n)'
      ],
      correct: 0,
      explain: 'Two pointers need monotonicity to know which side to give up. Unsorted, the correct tool is a hash map of value → index in one pass. Sorting first would work but destroys the original indices unless you carry them along.',
      hint: 'The whole trick was "moving left can only raise the sum". Is that still true?'
    },
    {
      tag: 'MECHANICS',
      q: 'Two sea walls, water between them, area = distance × the shorter wall. Two pointers at the ends. Why move the shorter wall inward?',
      options: [
        'Keeping the shorter wall can never beat what you just measured — width only shrinks, height is capped by it',
        'The taller wall is more likely to be part of the answer',
        'Moving either side works equally well',
        'The shorter wall might be zero'
      ],
      correct: 0,
      explain: 'Any later pair that still uses the shorter wall has strictly smaller width and height still capped by that same wall — so it cannot beat the current area. The shorter wall is therefore fully used up and can be discarded. O(n).',
      hint: 'Imagine keeping the short wall. What happens to width, and what caps the height?'
    },
    {
      tag: 'MECHANICS',
      q: '3Sum: after sorting, you fix one barrel and two-pointer the rest. What is the step people forget, that turns a correct answer into a wrong one?',
      options: [
        'Skipping over duplicate values at the fixed index and after each match, so triplets are not repeated',
        'Re-sorting the array inside the inner loop',
        'Using a hash set for the inner search instead',
        'Starting the fixed index at 1 instead of 0'
      ],
      correct: 0,
      explain: 'Sorting groups equal values together, so the same triplet can be produced many times. Skip a fixed value equal to its predecessor, and after recording a hit advance both pointers past their duplicates. O(n²) overall.',
      hint: 'The problem asks for unique triplets, and sorting puts equal values next to each other.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Is one message a subsequence of another — the letters in order, gaps allowed? Two pointers, one per string.',
      options: [
        'Advance the short pointer only on a match; advance the long pointer every step; success is the short one running out',
        'Advance both pointers every step and compare',
        'Both pointers must start at opposite ends',
        'Count letter frequencies and compare the counts'
      ],
      correct: 0,
      explain: 'Greedy matching is optimal here: taking the earliest possible match never blocks a later one. O(n+m), O(1) space. Frequency counts would answer "anagram", not "subsequence" — they throw away order.',
      hint: 'Order matters, and gaps are free. Which pointer is allowed to stall?'
    },
    {
      tag: 'EDGE CASE',
      q: 'Valid palindrome, ignoring punctuation and case. Two pointers walking inward. Which detail sinks most first attempts?',
      options: [
        'Skipping non-alphanumerics inside the loop — and guarding those skips with left < right',
        'Comparing characters before lowercasing them',
        'Handling odd-length strings, which need a special middle case',
        'Empty strings, which should return false'
      ],
      correct: 0,
      explain: 'Both skip loops need the left < right guard or a string of pure punctuation walks the pointers past each other. Odd lengths need nothing special — the pointers simply meet. An empty string is a palindrome.',
      hint: 'What happens on an input like ".,;" if the inner skip loops have no bound?'
    }
  ];

  /* ---- Whisky Peak — sliding window -------------------------------------- */
  BANKS['sliding-window'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'The shortest stretch of consecutive days whose total catch reaches the quota. All the daily catches are positive. What tells you a window will do?',
      options: [
        'Positive values make the window sum monotone — growing right raises it, shrinking left lowers it',
        'The array is sorted',
        'The quota is small relative to the array',
        'Nothing; this needs a prefix-sum plus binary search'
      ],
      correct: 0,
      explain: 'Positivity is the licence for a window: extending right can only help, shrinking left can only hurt, so a shrink is safe exactly while the sum still clears the quota. O(n). Introduce negatives and the monotonicity dies — then you genuinely need prefix sums plus a map.',
      hint: 'What would a negative day do to "shrinking always lowers the sum"?'
    },
    {
      tag: 'MECHANICS',
      q: 'Longest stretch with no repeated flag. You keep a map of flag → last position seen. On seeing a repeat inside the window, where does the left edge go?',
      options: [
        'To max(left, lastSeen + 1) — never backwards',
        'To lastSeen + 1 always',
        'One step right of where it is now',
        'Back to the start of the array'
      ],
      correct: 0,
      explain: 'The map may hold a position from before the current window, so assigning lastSeen + 1 blindly can drag the left edge backwards and inflate the answer. Clamping with max keeps it monotone, which is also what keeps the scan O(n).',
      hint: 'The stale entry is the enemy. Can lastSeen be behind the current left edge?'
    },
    {
      tag: 'MECHANICS',
      q: 'The smallest stretch of the log containing every symbol of a target pattern, duplicates counted. How do you know the window is currently valid without rescanning it?',
      options: [
        'Keep a count of how many distinct required symbols are fully satisfied, and compare that to the number of distinct requirements',
        'Compare the whole window map against the target map on every step',
        'Track only the total number of characters in the window',
        'Sort the window and compare it to the sorted target'
      ],
      correct: 0,
      explain: 'A single `formed` counter, bumped when a symbol\'s count reaches its requirement and decremented when it drops below, makes validity an O(1) check. Re-comparing whole maps is what turns this into O(n·k).',
      hint: 'You need "is it valid" in constant time. What is the smallest summary that gives you that?'
    },
    {
      tag: 'TRAP',
      q: 'Longest run you can make uniform by replacing at most k characters. The classic solution never shrinks the window below its best size. Why is that not a bug?',
      options: [
        'The answer is the maximum window ever reached, so a stale-but-same-size window can never lower it and will grow again only when it is genuinely valid',
        'It is a bug, but the tests are weak',
        'Because k is bounded by the alphabet size',
        'Because the window is always valid'
      ],
      correct: 0,
      explain: 'The window is allowed to become invalid; it just stops growing. Since you only ever report the maximum width reached, an invalid window of that width contributes nothing new, and any growth requires validity at that moment. It stays O(n) with one pass.',
      hint: 'Ask what quantity is actually reported at the end.'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Why is a two-pointer window O(n) even though the inner while loop looks nested?',
      options: [
        'Each pointer only ever moves forward, so together they take at most 2n steps across the whole run',
        'The inner loop runs at most a constant number of times per outer step',
        'Because the window size is bounded',
        'It is not — it is O(n²) in the worst case'
      ],
      correct: 0,
      explain: 'This is amortised analysis: the left pointer never resets, so the total work of all shrink loops combined is bounded by n. Nesting in the source does not imply nesting in the cost.',
      hint: 'Count total moves of the left pointer over the entire algorithm, not per iteration.'
    },
    {
      tag: 'EDGE CASE',
      q: 'A fixed-size window of width k over the readings. What must happen before you start recording answers?',
      options: [
        'The window must first fill to k elements — record only once the right edge has reached index k−1',
        'The array must be sorted',
        'k must be checked against zero and the array reversed',
        'Nothing — record from the very first element'
      ],
      correct: 0,
      explain: 'Fixed windows have a warm-up: the first k−1 positions do not yet form a full window. Recording early produces answers computed over short windows, which is the classic off-by-one in this family.',
      hint: 'When does the first legitimate window actually exist?'
    }
  ];

  /* ---- Little Garden — matrix -------------------------------------------- */
  BANKS['matrix'] = [
    {
      tag: 'MECHANICS',
      q: 'Rotate the island map 90° clockwise, in place. Which pair of moves does it?',
      options: [
        'Transpose (swap across the main diagonal), then reverse each row',
        'Reverse each row, then transpose',
        'Reverse each column, then transpose',
        'Transpose twice'
      ],
      correct: 0,
      explain: 'Transpose turns rows into columns; reversing each row then flips left-right, which lands exactly on a clockwise quarter turn. For counter-clockwise, transpose then reverse each *column* instead. Transposing twice is the identity.',
      hint: 'Try it on a 2×2 with distinct entries — it takes ten seconds and settles the order for good.'
    },
    {
      tag: 'EDGE CASE',
      q: 'Spiral traversal of a rectangular chart with four moving bounds. Which check prevents the classic double-read?',
      options: [
        'Before the bottom row and the left column passes, re-check that top ≤ bottom and left ≤ right',
        'Checking that the matrix is square',
        'Visiting corners twice and de-duplicating afterwards',
        'Starting from the centre and spiralling outward'
      ],
      correct: 0,
      explain: 'After the top row and right column are consumed, the bounds may have crossed. Without a re-check, a single remaining row or column gets read a second time in reverse. Non-square inputs are exactly where this shows up.',
      hint: 'Think about a 1×5 matrix, or the last row of a 3×4.'
    },
    {
      tag: 'MECHANICS',
      q: 'Set the entire row and column to zero wherever a zero appears — and do it with O(1) extra space. What is the trick?',
      options: [
        'Use the first row and first column as the marker arrays, handling those two separately with a pair of flags',
        'Do it in one pass, zeroing as you go',
        'Copy the matrix, then read from the copy',
        'Sort each row so the zeros gather'
      ],
      correct: 0,
      explain: 'The matrix stores its own bookkeeping. The catch is that the first row and column are both markers and data, so you record whether each originally held a zero before overwriting, and apply those two last.',
      hint: 'Zeroing as you go is the trap — a zero you write is indistinguishable from a zero that was there.'
    },
    {
      tag: 'MECHANICS',
      q: 'Validating a Sudoku grid: what index turns a cell (r, c) into its 3×3 box number?',
      options: [
        '(r / 3) * 3 + (c / 3), using integer division',
        'r * 3 + c',
        '(r + c) / 3',
        '(r % 3) * 3 + (c % 3)'
      ],
      correct: 0,
      explain: 'Integer division collapses each coordinate to its band (0, 1 or 2); multiplying the row band by 3 lays the nine boxes out in row-major order. With that one formula, all three constraints check in a single pass over 81 cells.',
      hint: 'You want the band, not the offset inside the band — so divide, do not modulo.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'A matrix whose rows are sorted and where each row starts after the previous row ends. Fastest search?',
      options: [
        'Treat it as one sorted array of length m·n and binary search, mapping index i to (i / n, i % n)',
        'Binary search every row in turn',
        'Walk from the top-right corner, stepping left or down',
        'Linear scan; the structure does not help'
      ],
      correct: 0,
      explain: 'The global sortedness makes it a single sorted array in disguise: O(log(mn)). The staircase walk from a corner is the right tool for the *other* problem, where rows and columns are each sorted but the rows do not chain.',
      hint: 'Read the guarantee carefully — is the whole flattened matrix sorted, or only each row and column?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Game of Life on the grid, in place, with all cells updating simultaneously. How do you avoid a half-updated grid corrupting its own neighbour counts?',
      options: [
        'Encode both states in one cell — for instance a second bit for the next state — then shift everything down in a second pass',
        'Update row by row from the top',
        'Update a copy, then swap the references',
        'Count neighbours for the whole grid first into a second matrix'
      ],
      correct: 0,
      explain: 'Two bits per cell keeps the old state readable while the new one accumulates, giving genuine O(1) extra space. Copying works and is perfectly reasonable — it just is not in place, which is what the follow-up asks for.',
      hint: 'A cell has to answer "what was I?" and "what will I be?" at the same time.'
    }
  ];

  /* ---- Drum Island — hash maps ------------------------------------------- */
  BANKS['hashmap'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Two chests must sum to the merchant\'s price. The one-pass hash solution asks a specific question at each chest. Which one?',
      options: [
        '"Have I already seen target − this value?" — check first, then store the current value',
        '"Have I already seen this value?" — check first, then store',
        'Store everything first, then loop again looking for complements',
        '"Is this value less than the target?"'
      ],
      correct: 0,
      explain: 'Looking up the complement makes each element O(1) work, and checking before storing is what stops an element from pairing with itself. Storing everything first also works but needs care for exactly that self-pairing case.',
      hint: 'The check must happen before the insert. Why?'
    },
    {
      tag: 'MECHANICS',
      q: 'Group the crew\'s messages into anagram families. What makes a good map key?',
      options: [
        'The sorted letters — or a 26-slot count tuple, which is O(n) instead of O(n log n) per word',
        'The length of the word',
        'The first letter and the length',
        'A hash of the word itself'
      ],
      correct: 0,
      explain: 'The key must be identical for exactly the strings that belong together. Sorted letters achieve that; length or first-letter keys collide wildly. The count tuple is the faster canonical form when words are long.',
      hint: 'Design the key so that "same key" means precisely "same family" — no more, no less.'
    },
    {
      tag: 'TRAP',
      q: 'Longest run of consecutive numbers in an unsorted pile, required in O(n). The set-based solution has one guard that makes or breaks the complexity. Which?',
      options: [
        'Only start counting from x when x−1 is absent from the set, so each run is walked exactly once',
        'Sorting the set first',
        'Skipping duplicates before building the set',
        'Counting downward instead of upward'
      ],
      correct: 0,
      explain: 'Without that guard, every element of a run starts its own walk and the cost becomes O(n²) on a long run. With it, only the true start walks, so the total work across all runs is linear. Sorting would be O(n log n) and misses the point of the exercise.',
      hint: 'What is the cost if a run of length 10,000 is walked from all 10,000 of its members?'
    },
    {
      tag: 'MECHANICS',
      q: 'Subarrays summing to a target k, counted in one pass. What do you actually store in the map?',
      options: [
        'Prefix sum → how many times it has occurred, seeded with {0: 1}',
        'Each element → its index',
        'Each subarray sum you have formed so far',
        'The running sum → the index where it last occurred'
      ],
      correct: 0,
      explain: 'sum(i..j) = prefix[j] − prefix[i−1], so at each j you ask how many earlier prefixes equal prefix[j] − k. Counts, not indices, because you want every such subarray. The {0: 1} seed is what lets a prefix that equals k itself be counted.',
      hint: 'Why would the map need an entry for a sum of zero before you have read anything?'
    },
    {
      tag: 'EDGE CASE',
      q: 'Ransom-note style containment — can note be built from the letters in magazine? What is the failure mode of using a set?',
      options: [
        'A set loses multiplicity, so a note needing two "a"s passes on a magazine holding one',
        'A set is slower than a map here',
        'Sets cannot hold characters',
        'Nothing fails; a set is correct'
      ],
      correct: 0,
      explain: 'Containment questions about *how many* need counts. Decrement a frequency map and fail on a negative, or count both sides and compare. It is the same distinction as anagram-versus-subsequence.',
      hint: 'Ask what happens when the note repeats a letter.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Insert, delete, and getRandom, all in O(1) average. What structure pairing does it?',
      options: [
        'An array of values plus a map from value → its index; delete swaps the doomed value with the last one and pops',
        'A linked list plus a map',
        'A balanced BST',
        'Two stacks'
      ],
      correct: 0,
      explain: 'getRandom needs contiguous indexing (array); delete-by-value needs a lookup (map). The swap-with-last trick keeps the array dense without shifting, and the map entry for the moved element must be updated — that update is the step people forget.',
      hint: 'Which of the three operations forces you to have an array at all?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'When does a hash map\'s O(1) actually stop being O(1) in an interview answer?',
      options: [
        'When keys are adversarial or badly distributed — worst case is O(n) per operation, so you say "O(1) average"',
        'Never; hash maps are always O(1)',
        'Only when the map exceeds memory',
        'When the keys are strings'
      ],
      correct: 0,
      explain: 'Say "amortised/average O(1)". Hashing a long string is also O(length), not O(1), which matters when keys are big. Being precise about this is a reliable signal in an interview.',
      hint: 'What does an interviewer want to hear about collisions?'
    }
  ];

  /* ---- Alabasta — intervals ----------------------------------------------- */
  BANKS['intervals'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Merging overlapping watch shifts. Sort by which endpoint, and why?',
      options: [
        'By start — then a shift either extends the current merged block or begins a new one, decided by a single comparison',
        'By end — merging always needs the earliest finisher',
        'By length, shortest first',
        'No sort is needed'
      ],
      correct: 0,
      explain: 'Sorted by start, everything that could overlap the current block is adjacent to it, so one linear sweep suffices: if next.start ≤ current.end, extend the end to the max; otherwise close the block. O(n log n) dominated by the sort.',
      hint: 'You want all possible overlappers to be neighbours in the sorted order.'
    },
    {
      tag: 'TRAP',
      q: 'Removing the fewest shifts so none overlap. Now sort by which endpoint?',
      options: [
        'By END — greedily keep the earliest finisher, because it leaves the most room for everything after it',
        'By start, same as merging',
        'By length, dropping the longest first',
        'By start, but keep the latest starter'
      ],
      correct: 0,
      explain: 'This is the classic activity-selection greedy: among conflicting choices, the one that frees the timeline soonest is never worse. Sorting by start and keeping the first is a genuinely different — and wrong — greedy. Same input family, opposite key.',
      hint: 'Which single kept interval leaves the largest remaining timeline?'
    },
    {
      tag: 'MECHANICS',
      q: 'Inserting one new shift into an already sorted, non-overlapping list — without re-sorting everything.',
      options: [
        'Copy everything ending before it, absorb every overlapper into it by widening both ends, then copy the rest',
        'Append it and re-sort',
        'Binary search for its slot and insert it unchanged',
        'Merge it with only the first interval it touches'
      ],
      correct: 0,
      explain: 'Three phases, one pass, O(n): strictly-before, overlapping (min the starts, max the ends), strictly-after. A new interval can swallow many existing ones, which is why only widening against the first is wrong.',
      hint: 'How many existing intervals can a single new one overlap?'
    },
    {
      tag: 'MECHANICS',
      q: 'The fewest arrows to burst every balloon, where an arrow pops everything its x-line crosses. What is the greedy?',
      options: [
        'Sort by end; fire at the current end; skip every balloon that starts at or before that x; repeat',
        'Sort by start and fire at each start',
        'Fire at the midpoint of the widest balloon',
        'Count the maximum overlap depth'
      ],
      correct: 0,
      explain: 'Firing at the earliest end pops that balloon plus everything else already open, and no arrow placed further right could do more. Same shape as the non-overlapping-intervals greedy — recognising that equivalence is the win.',
      hint: 'It is activity selection with the answer counted instead of the kept set.'
    },
    {
      tag: 'EDGE CASE',
      q: 'Intervals [1,4] and [4,5]: do they overlap?',
      options: [
        'It depends on the problem — for merging, touching usually counts; for a meeting room ending at 4 and one starting at 4, usually not',
        'Always yes',
        'Always no',
        'Only if the list is sorted by end'
      ],
      correct: 0,
      explain: 'This is a clarifying question worth asking out loud in an interview. It decides whether your comparison is < or ≤, and it is the single most common source of a near-miss answer in this family.',
      hint: 'Ask whether the endpoints are inclusive — the code differs by one character.'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Maximum number of shifts running at once (minimum rooms). What is the sweep-line form?',
      options: [
        'Split each interval into a +1 at its start and a −1 at its end, sort the events, and track the running maximum',
        'Sort by start and count the list length',
        'Merge all intervals and count the merged blocks',
        'Sort by end and take the last one'
      ],
      correct: 0,
      explain: 'Events, not intervals: the running sum over sorted events is the concurrency at every moment, so its peak is the answer. Order ties so that ends are processed before starts if touching does not count as overlap. O(n log n).',
      hint: 'You care about moments in time, not about the intervals as objects.'
    }
  ];

  /* ---- Jaya — stacks ------------------------------------------------------ */
  BANKS['stack'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Nested seals must close in the order they opened. What makes a stack the right tool rather than three counters?',
      options: [
        'Counters lose the order, so "([)]" would pass — a stack enforces that the most recent opener closes first',
        'Counters are slower',
        'A stack uses less memory',
        'Counters cannot handle more than two bracket types'
      ],
      correct: 0,
      explain: 'The requirement is not "equal numbers" but "properly nested", and nesting is exactly last-in-first-out. Any problem phrased "the most recent unresolved thing" is a stack problem.',
      hint: 'Find an input with balanced counts that is still invalid.'
    },
    {
      tag: 'MECHANICS',
      q: 'Next warmer day for every day in the log. The monotonic stack holds what, and in what order?',
      options: [
        'Indices of days still waiting for an answer, with temperatures decreasing from bottom to top',
        'Temperatures in increasing order',
        'Every day seen so far, unsorted',
        'Only the maximum seen so far'
      ],
      correct: 0,
      explain: 'A new, warmer day pops everything cooler than it, and each pop resolves one day permanently. Indices rather than values, because the answer is a distance. Every element is pushed and popped once, so the whole thing is O(n).',
      hint: 'What does a warm day let you finally answer, and how many days at once?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Largest rectangle in a skyline. Why is the monotonic-stack solution O(n) despite the inner while loop?',
      options: [
        'Each bar is pushed once and popped once, so the total pop work across the entire run is at most n',
        'The while loop runs at most twice per bar',
        'Because the heights are bounded',
        'It is not — it is O(n²)'
      ],
      correct: 0,
      explain: 'Amortised accounting again: charge each pop to the push that put it there. When a bar is popped, its full rectangle is determined — the popped height, bounded left by the new stack top and right by the current index.',
      hint: 'Count total pushes and total pops over the whole algorithm.'
    },
    {
      tag: 'MECHANICS',
      q: 'A stack that also reports its minimum in O(1). How?',
      options: [
        'Push the running minimum alongside each value (or keep a parallel min-stack), so a pop restores the previous minimum for free',
        'Sort the stack on every push',
        'Keep a single min variable and update it on pop',
        'Use a heap instead of a stack'
      ],
      correct: 0,
      explain: 'A single variable cannot survive a pop — once the minimum leaves, the previous minimum is unrecoverable. Storing the min *as of each push* makes the history explicit, which is why it costs O(n) extra space and not O(1).',
      hint: 'Ask what happens to a lone min variable when the minimum itself is popped.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Evaluating Reverse Polish notation from a battle log. What is the operand order trap?',
      options: [
        'The second value popped is the LEFT operand — critical for subtraction and division',
        'Operators must be pushed too',
        'You must reverse the tokens first',
        'Division should round toward negative infinity'
      ],
      correct: 0,
      explain: 'Pop b, then pop a, then compute a op b. Addition and multiplication hide the bug; subtraction and division expose it immediately. (Rounding direction is worth clarifying too — most versions truncate toward zero.)',
      hint: 'Which operand went onto the stack first?'
    },
    {
      tag: 'MECHANICS',
      q: 'Simplifying a Unix-style path such as /a/./b/../c. What does the stack hold?',
      options: [
        'Resolved directory names — push a real name, pop on "..", ignore "." and empty segments',
        'Every character of the path',
        'The indices of the slashes',
        'Both the names and the dots, cleaned at the end'
      ],
      correct: 0,
      explain: 'Split on "/" and treat each segment as a token. ".." pops (with an empty-stack guard, since /.. is just /), "." and "" are skipped, everything else pushes. Join with "/" at the end and prefix a slash.',
      hint: 'What should "/../" resolve to, and what does that imply about popping an empty stack?'
    }
  ];

  /* ---- Skypiea — linked lists -------------------------------------------- */
  BANKS['linked-list'] = [
    {
      tag: 'MECHANICS',
      q: 'Reversing a chain of golden bells, one link at a time. Which three references does the loop body need?',
      options: [
        'prev, curr, and next — save next before rewiring, or the rest of the chain is lost',
        'Only curr and next',
        'Only head and tail',
        'prev and curr; next can be recomputed'
      ],
      correct: 0,
      explain: 'The moment you set curr.next = prev, the forward link is gone — so next must be captured first. The loop is: save next, rewire, advance prev, advance curr. Return prev, because curr ends at null.',
      hint: 'Which pointer does the rewire destroy, and is it still needed afterwards?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Is the chain a loop? Floyd sends one runner at single speed and one at double. Why must they meet inside a cycle?',
      options: [
        'The gap between them changes by exactly one each step, so it eventually reaches zero — it cannot be stepped over',
        'The fast runner always laps the slow one exactly once',
        'The cycle length must be even',
        'They meet only if the cycle starts at the head'
      ],
      correct: 0,
      explain: 'Inside the cycle, treat it modulo the cycle length: the fast runner closes the gap by one per step, so it hits zero exactly. Speed 3 could jump the gap; speed 2 cannot. O(n) time, O(1) space, versus a hash set that costs O(n) space.',
      hint: 'Track the distance between them per step — does it change by one, or by more?'
    },
    {
      tag: 'MECHANICS',
      q: 'A dummy head node in front of the real list — what does it actually save you from?',
      options: [
        'Branching on "am I modifying the head?", since every node now has a predecessor',
        'Null pointer errors in the middle of the list',
        'Needing a tail pointer',
        'Extra memory'
      ],
      correct: 0,
      explain: 'Deleting the first node, inserting before it, merging into an empty result — all become the ordinary case. Return dummy.next rather than the saved head, because the head may well have changed.',
      hint: 'What is special about the first node, and how do you make it unspecial?'
    },
    {
      tag: 'EDGE CASE',
      q: 'Remove the nth node from the end in one pass. Two pointers, n apart. What does the dummy node fix here specifically?',
      options: [
        'Removing the head itself when n equals the list length — the lead pointer would otherwise walk off the end',
        'Lists containing cycles',
        'Lists shorter than n',
        'Duplicate values'
      ],
      correct: 0,
      explain: 'Start the lead pointer n steps ahead, then advance both until it hits the end; the trail pointer lands on the predecessor of the target. With a dummy, "predecessor of the head" exists and the case vanishes.',
      hint: 'What is the predecessor of the first node, and does it exist without a dummy?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Reorder a list as first, last, second, second-last... Which three standard moves compose into it?',
      options: [
        'Find the middle with fast/slow, reverse the second half, then interleave the two halves',
        'Sort the list, then interleave',
        'Reverse the whole list, then split it',
        'Copy to an array and index; nothing else works'
      ],
      correct: 0,
      explain: 'Almost every hard linked-list problem is two or three easy ones stacked. Recognising the composition is the skill — each piece is O(n) and O(1) space, so the whole thing is too. (The array copy works but costs O(n) space.)',
      hint: 'What do you need in order to walk backwards through a singly linked list?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Merging k sorted chains. Which approach is O(N log k) rather than O(N k)?',
      options: [
        'A min-heap of the k current heads — or repeated pairwise merging, halving the number of lists each round',
        'Scanning all k heads each time to find the smallest',
        'Concatenating everything and sorting',
        'Merging them one at a time into an accumulator'
      ],
      correct: 0,
      explain: 'Scanning all heads is O(k) per output node. A heap makes it O(log k), and pairwise merging reaches the same bound via log k rounds of O(N) work. Merging one at a time re-walks the accumulator repeatedly — O(N k).',
      hint: 'Per output element, how expensive is "which of the k fronts is smallest?"'
    }
  ];

  /* ---- Water Seven — trees ------------------------------------------------ */
  BANKS['tree'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Recursion on a tree comes down to one honest question at each node. Which?',
      options: [
        '"What do I need from my children, and what do I hand my parent?"',
        '"How deep am I?"',
        '"How many nodes are left?"',
        '"Is the tree balanced?"'
      ],
      correct: 0,
      explain: 'Answer that and the shape follows: the return value is what the parent needs, the recursive calls are what you need. Most tree problems are a post-order traversal wearing different return types.',
      hint: 'The return value of your function IS the contract with the parent.'
    },
    {
      tag: 'TRAP',
      q: 'Maximum path sum, where a path may bend through a node without continuing upward. Why do the returned value and the recorded answer differ?',
      options: [
        'A parent can only use one branch, so you return node + max(left, right); the answer may use both, so you record node + left + right',
        'They do not differ — both use both branches',
        'The return value should be the global maximum',
        'The answer should also use only one branch'
      ],
      correct: 0,
      explain: 'This split — one value to propagate, another to record globally — is the reusable idea for the whole family (diameter, longest zig-zag, and friends). Also clamp negative branches to zero: a harmful branch is simply not taken.',
      hint: 'Can your parent walk down into both of your children and back?'
    },
    {
      tag: 'MECHANICS',
      q: 'Lowest common ancestor in a plain binary tree. What does the recursion return?',
      options: [
        'The node itself if it is p or q; otherwise, whichever side returned non-null — and the node itself if both sides did',
        'Always null unless the node is p or q',
        'The depth of the deeper of p and q',
        'The parent pointer of p'
      ],
      correct: 0,
      explain: 'Both sides reporting a find means the split happens here, so this node is the LCA. One side reporting means the answer lies that way and the finding is passed up unchanged. O(n), one pass, no parent pointers needed.',
      hint: 'What does it mean when p came from the left and q from the right?'
    },
    {
      tag: 'MECHANICS',
      q: 'Rebuilding a tree from preorder and inorder. What does each sequence give you?',
      options: [
        'Preorder gives the root; inorder, split at that root, gives the sizes of the two subtrees',
        'Inorder gives the root; preorder gives the sizes',
        'Preorder gives the leaves; inorder gives the root',
        'Either one alone is sufficient'
      ],
      correct: 0,
      explain: 'Root from the front of preorder, then find it in inorder: everything left is the left subtree, everything right the right. Index the inorder positions in a map first, or the repeated searching makes it O(n²).',
      hint: 'Which traversal puts the root somewhere you can find it immediately?'
    },
    {
      tag: 'EDGE CASE',
      q: 'Checking whether a tree is height-balanced. What does the naive version get wrong?',
      options: [
        'Recomputing height at every node makes it O(n²) — return height and balance together in one post-order pass',
        'It fails on empty trees',
        'It fails on single-node trees',
        'It needs a queue rather than recursion'
      ],
      correct: 0,
      explain: 'Calling height() inside isBalanced() re-walks each subtree once per ancestor. Returning a sentinel (say −1) for "already unbalanced" alongside the height collapses it to O(n).',
      hint: 'How many times does the naive version compute the height of a leaf?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'What is the space cost of recursive DFS on a tree, and when does it bite?',
      options: [
        'O(h) for the call stack — O(log n) when balanced, but O(n) on a degenerate chain, which can overflow',
        'Always O(1)',
        'Always O(n)',
        'O(n log n)'
      ],
      correct: 0,
      explain: 'Recursion depth is tree height, and a linked-list-shaped tree makes that n. Saying this out loud, and knowing the iterative-with-explicit-stack alternative, is a strong interview signal.',
      hint: 'Picture a tree where every node has only a right child.'
    }
  ];

  /* ---- Enies Lobby — BFS on trees ----------------------------------------- */
  BANKS['tree-bfs'] = [
    {
      tag: 'MECHANICS',
      q: 'Level-order traversal, grouped one list per level. What single line makes the grouping work?',
      options: [
        'Snapshot the queue size at the top of the loop, then dequeue exactly that many',
        'Push a null marker after every node',
        'Track each node\'s depth in a parallel map',
        'Use a stack instead of a queue'
      ],
      correct: 0,
      explain: 'At the top of each iteration the queue holds exactly one complete level, so its length is that level\'s width. Capture it before you start enqueuing children, or you will drain into the next level.',
      hint: 'What is in the queue at the exact moment a level begins?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Right-side view of the tree. What is the smallest change to a level-order traversal?',
      options: [
        'Record the last node dequeued in each level',
        'Traverse only right children',
        'Reverse each level then take the first',
        'Use DFS and record the deepest node'
      ],
      correct: 0,
      explain: 'The rightmost node of every level is what you would see from the side — and a node with only a left child still shows if nothing is to its right. Traversing only right children misses exactly that case.',
      hint: 'Does a node with no right sibling anywhere on its level still get seen?'
    },
    {
      tag: 'MECHANICS',
      q: 'Zigzag level order. Where does the alternation belong?',
      options: [
        'Build each level normally and reverse the odd ones — or push to the front of a deque on those levels',
        'Alternate which child you enqueue first',
        'Use two stacks and swap them',
        'Sort each level'
      ],
      correct: 0,
      explain: 'Keep the traversal boring and handle presentation at the level boundary. Alternating enqueue order corrupts the parent-child relationship for the level after next, which is the subtle bug here. (Two stacks does work, but is more moving parts.)',
      hint: 'Changing enqueue order affects the NEXT level too — is that what you wanted?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Space cost of BFS on a tree, and how it compares to DFS?',
      options: [
        'O(w), the maximum width — which for a complete tree is about n/2, so BFS can cost more space than DFS\'s O(h)',
        'O(h), the same as DFS',
        'O(1)',
        'O(n log n)'
      ],
      correct: 0,
      explain: 'The bottom level of a complete tree holds roughly half its nodes, and BFS holds a whole level at once. DFS costs O(height) = O(log n) there. Which traversal is cheaper genuinely depends on the tree\'s shape.',
      hint: 'How many nodes are on the last level of a complete binary tree?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Average value per level. Why is BFS the natural fit even though DFS can do it?',
      options: [
        'The level is materialised as a unit, so sum and count are right there — DFS needs depth-indexed accumulators',
        'DFS cannot compute averages',
        'BFS is asymptotically faster here',
        'DFS would visit nodes twice'
      ],
      correct: 0,
      explain: 'Both are O(n); BFS just matches the shape of the question. Choosing the traversal whose natural unit is the answer\'s unit is a small habit that removes whole classes of bookkeeping bugs.',
      hint: 'Which traversal hands you an entire level at once?'
    },
    {
      tag: 'EDGE CASE',
      q: 'What is the very first thing a level-order function must handle?',
      options: [
        'A null root — otherwise you enqueue null and dereference it immediately',
        'A tree with one node',
        'A tree of depth greater than 1000',
        'Duplicate values'
      ],
      correct: 0,
      explain: 'Empty input is the free test case that catches the most submissions in this family. Guard the root, and guard children before enqueuing them.',
      hint: 'What goes into the queue before the loop starts?'
    }
  ];

  /* ---- Thriller Bark — BSTs ----------------------------------------------- */
  BANKS['bst'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'The single fact behind most BST problems is?',
      options: [
        'An in-order traversal visits the values in sorted order',
        'A BST is always balanced',
        'The root is the median',
        'Every leaf is at the same depth'
      ],
      correct: 0,
      explain: 'Kth smallest, validation, "is it sorted", minimum absolute difference, converting to a sorted list — all are in-order traversals in costume. Nothing guarantees balance unless the problem says so.',
      hint: 'Write out the traversal of a small BST and look at the sequence.'
    },
    {
      tag: 'TRAP',
      q: 'Validating a BST. Why is "left child < node < right child" at every node not enough?',
      options: [
        'It is a local check — a deep left descendant can exceed an ancestor while still beating its own parent',
        'It fails on duplicate values only',
        'It fails only on empty trees',
        'It is enough; the objection is a myth'
      ],
      correct: 0,
      explain: 'Every node must lie inside a range inherited from all its ancestors, so carry (low, high) down and tighten on each step. The counterexample: root 10, left child 5, and 5\'s right child 12 — locally fine, globally invalid.',
      hint: 'Try root 10 with left child 5 whose right child is 12.'
    },
    {
      tag: 'MECHANICS',
      q: 'Kth smallest in a BST, in better than O(n) when the tree is balanced.',
      options: [
        'In-order traversal with an early exit at the kth visit — or augment nodes with subtree sizes for O(h) lookups',
        'Sort all the values, then index',
        'BFS and take the kth dequeued',
        'Take the kth node in preorder'
      ],
      correct: 0,
      explain: 'The early exit makes it O(h + k). If the structure is queried repeatedly, subtree-size augmentation turns each query into O(h) — that follow-up is what the interviewer is usually driving at.',
      hint: 'In-order gives sorted order — so when can you stop walking?'
    },
    {
      tag: 'MECHANICS',
      q: 'Lowest common ancestor in a BST — cheaper than in a general tree. Why?',
      options: [
        'Compare both targets to the current value: if they fall on opposite sides (or one is the node), you are standing on the LCA',
        'The LCA is always the root',
        'You must still search both subtrees',
        'You need parent pointers'
      ],
      correct: 0,
      explain: 'Ordering turns the search into a walk: both smaller, go left; both larger, go right; otherwise stop. O(h) time and O(1) space iteratively, against O(n) for the general-tree version.',
      hint: 'What does it mean when p is smaller than the node and q is larger?'
    },
    {
      tag: 'MECHANICS',
      q: 'Building a height-balanced BST from a sorted array. What is the recursion?',
      options: [
        'Take the middle element as the root, then recurse on the two halves',
        'Insert each element in order',
        'Take the first element as the root, then insert the rest',
        'Sort the array again, then link it up'
      ],
      correct: 0,
      explain: 'The middle splits the remaining values evenly, which is exactly the balance condition. Inserting in sorted order builds a degenerate chain of height n — the worst possible BST.',
      hint: 'Which element leaves equal numbers of values on both sides?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'What is the actual cost of search in a BST, stated honestly?',
      options: [
        'O(h), which is O(log n) only when the tree is balanced and O(n) in the worst case',
        'O(log n) always',
        'O(1) average',
        'O(n log n)'
      ],
      correct: 0,
      explain: 'A plain BST built from sorted inserts is a linked list. Self-balancing variants (AVL, red-black) restore the O(log n) guarantee — naming that distinction lands well in an interview.',
      hint: 'What shape does a BST take if you insert 1, 2, 3, 4, 5 in that order?'
    }
  ];

  /* ---- Sabaody — graphs --------------------------------------------------- */
  BANKS['graph'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Counting islands in a sea chart. What is a node and what is an edge?',
      options: [
        'Each land cell is a node; edges join orthogonally adjacent land cells — count the connected components',
        'Each row is a node; edges join adjacent rows',
        'Each island is a node; edges are sea routes',
        'There is no graph here; it is pure counting'
      ],
      correct: 0,
      explain: 'Modelling first is the whole job — after that it is a flood fill: scan for an unvisited land cell, sink its whole component with DFS or BFS, add one to the count. O(rows × cols).',
      hint: 'The grid IS the adjacency structure; you never build an edge list.'
    },
    {
      tag: 'MECHANICS',
      q: 'Course prerequisites: can every course be taken? Which algorithm, and what does failure look like?',
      options: [
        'Topological sort — failure is a cycle, seen as fewer than n nodes emitted, or as a grey node revisited during DFS',
        'BFS from course 0; failure is an unreached node',
        'Union-Find; failure is two nodes in one set',
        'Sorting the courses by prerequisite count'
      ],
      correct: 0,
      explain: 'Kahn\'s algorithm repeatedly removes zero-in-degree nodes; if it stops early, the leftovers form a cycle. The DFS form uses three colours — white unvisited, grey on the current stack, black done — and a grey-to-grey edge is the cycle.',
      hint: 'Union-Find spots cycles in undirected graphs; is a prerequisite edge undirected?'
    },
    {
      tag: 'TRAP',
      q: 'Cloning a graph with cycles. What stops the recursion from looping forever?',
      options: [
        'A map from original node → its clone, checked before recursing — it is both the visited set and the wiring table',
        'A visited set of booleans',
        'Limiting the recursion depth',
        'Cloning breadth-first instead'
      ],
      correct: 0,
      explain: 'A plain boolean visited set prevents the infinite loop but leaves you unable to attach the right clone when you meet a node again. The map does both jobs, which is why the clone family always reaches for one.',
      hint: 'When you meet an already-visited node, what exactly do you need to attach?'
    },
    {
      tag: 'MECHANICS',
      q: 'Surrounded regions: capture every region not touching the border. What is the inversion that makes it easy?',
      options: [
        'Start from the border cells and mark everything reachable as safe; everything unmarked afterwards is captured',
        'Flood fill every region and check its cells for border membership',
        'Scan the interior only',
        'Use Union-Find with one set per region'
      ],
      correct: 0,
      explain: 'Searching for "not touching the border" is awkward; searching for "reachable from the border" is a plain multi-source flood fill, and the complement is the answer. Inverting the condition is the reusable trick.',
      hint: 'The easy property is the negation of the one you were asked for.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'When is Union-Find the better answer than DFS for connectivity?',
      options: [
        'When edges arrive incrementally or connectivity is queried repeatedly — near-constant per operation, no rebuild',
        'Always; it is strictly faster',
        'Only for directed graphs',
        'Only when the graph is a tree'
      ],
      correct: 0,
      explain: 'DFS answers connectivity for a fixed graph in one O(V+E) pass. Union-Find shines when the graph grows or is queried many times: with union by rank and path compression, operations are effectively O(α(n)). It does not handle deletions.',
      hint: 'Does the graph change between questions?'
    },
    {
      tag: 'EDGE CASE',
      q: 'Where do you mark a node visited in an iterative DFS or BFS, and why does it matter?',
      options: [
        'At enqueue/push time — marking at pop time lets a node enter the frontier many times and can blow up the memory',
        'At pop time, so the frontier stays accurate',
        'Either; it makes no difference',
        'After processing all its neighbours'
      ],
      correct: 0,
      explain: 'On a dense graph, marking late means a node is pushed once per incoming edge. Marking at insertion keeps each node in the structure at most once — and for BFS it also preserves the shortest-distance guarantee.',
      hint: 'How many times can a single node be pushed if it is only marked on pop?'
    }
  ];

  /* ---- Impel Down — BFS on graphs ----------------------------------------- */
  BANKS['graph-bfs'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Fewest moves through the levels of the prison, every corridor the same length. Which search, and why not the other?',
      options: [
        'BFS — it finishes an entire ring of distance d before touching distance d+1, so the first arrival is the shortest',
        'DFS, because it goes deep fastest',
        'Dijkstra, which is required for any shortest path',
        'Either works; they give the same answer'
      ],
      correct: 0,
      explain: 'DFS finds *a* path, not the shortest. Dijkstra is correct but unnecessary — on unweighted edges it degenerates into BFS with extra overhead. Saying that out loud is worth marks.',
      hint: 'What is BFS\'s invariant about the order in which distances are settled?'
    },
    {
      tag: 'MECHANICS',
      q: 'Rotting spreads to every adjacent cell each minute, from several sources at once. How do you handle multiple starting points?',
      options: [
        'Seed the queue with all sources before the loop starts — multi-source BFS is one BFS, not many',
        'Run one BFS per source and take the minimum',
        'Pick the most central source',
        'BFS backwards from every fresh cell'
      ],
      correct: 0,
      explain: 'All sources at distance 0 means the wave expands from all of them simultaneously, and each cell is first reached by its nearest source. One pass, O(cells). Running separate searches multiplies the cost by the number of sources.',
      hint: 'What is in the queue at time zero if the rot starts in three places?'
    },
    {
      tag: 'MECHANICS',
      q: 'Word ladder — one letter changed per step. What is the graph, and where does the cost actually go?',
      options: [
        'Words are nodes and one-letter changes are edges; building neighbours via wildcard patterns beats comparing every pair',
        'Letters are nodes and words are edges',
        'The graph is a tree, so BFS is unnecessary',
        'It must be solved with DFS and memoisation'
      ],
      correct: 0,
      explain: 'Comparing all pairs is O(n²·L). Bucketing by patterns like h*t gives neighbours in O(n·L²) with far better constants on real word lists. Bidirectional BFS from both ends is the next optimisation the interviewer will ask for.',
      hint: 'How do you find every word one letter away, without testing every other word?'
    },
    {
      tag: 'TRAP',
      q: 'What is the classic BFS bug that silently returns a distance that is too large, or hangs?',
      options: [
        'Marking visited on dequeue instead of enqueue, so the same node is queued repeatedly',
        'Using a stack instead of a queue',
        'Forgetting to store distances',
        'Starting from the wrong node'
      ],
      correct: 0,
      explain: 'Late marking lets duplicates into the queue; each is processed with whatever distance it carried, and on a dense graph the queue can grow quadratically. Mark the instant you enqueue.',
      hint: 'What can happen between a node being enqueued and being dequeued?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'BFS on a grid of R rows and C columns — cost?',
      options: [
        'O(R·C) time and O(R·C) space, since each cell is enqueued at most once and has at most four neighbours',
        'O(R·C·log(R·C)) because of the queue',
        'O((R·C)²) in the worst case',
        'O(R + C)'
      ],
      correct: 0,
      explain: 'Constant degree means total edge work is proportional to the number of cells. The space is the queue plus the visited grid; the queue peak is the widest frontier, which on a grid can be O(R + C) but is bounded by the cell count.',
      hint: 'How many neighbours does a grid cell have, and how many times is it enqueued?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'When must you reach for Dijkstra instead of plain BFS?',
      options: [
        'When edges carry different non-negative weights — BFS\'s ring invariant only holds if every edge costs the same',
        'When the graph is directed',
        'When the graph has cycles',
        'When there are multiple sources'
      ],
      correct: 0,
      explain: 'Uniform weights are exactly what makes "first arrival = shortest" true. With varied weights you need a priority queue. And with negative weights, Dijkstra breaks too — that is Bellman-Ford territory.',
      hint: 'Which assumption of BFS does a weight of 5 on one edge violate?'
    }
  ];

  /* ---- Marineford — tries -------------------------------------------------- */
  BANKS['trie'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'When does a trie beat a hash set of the same words?',
      options: [
        'When the questions are about prefixes — "does anything start with this?" is a walk, not a scan',
        'Always; tries are faster for exact lookup too',
        'When the words are short',
        'When there are fewer than a hundred words'
      ],
      correct: 0,
      explain: 'A hash set answers exact membership in O(L) and prefix questions not at all — you would scan everything. A trie makes the prefix itself the address, and shares storage across common heads.',
      hint: 'Ask what a hash set has to do to answer "any word starting with car?"'
    },
    {
      tag: 'MECHANICS',
      q: 'What does the flag on a trie node mean, and why can it not be dropped?',
      options: [
        '"A word ends here" — without it, searching for "car" would succeed merely because "card" was inserted',
        'That the node is a leaf',
        'That the node has children',
        'The number of words below the node'
      ],
      correct: 0,
      explain: 'The distinction between "is a word" and "is a prefix" is the entire difference between search() and startsWith(). Leaf-ness is not a substitute: "car" ends mid-path when "card" is also present.',
      hint: 'Insert "card", then search for "car". What should happen?'
    },
    {
      tag: 'MECHANICS',
      q: 'A trie search where "." matches any single character. What changes?',
      options: [
        'On a dot, recurse into every existing child — the search branches instead of walking',
        'Dots are stored as an extra child slot',
        'You must build a second trie',
        'You fall back to scanning all words'
      ],
      correct: 0,
      explain: 'The walk becomes a DFS. Worst case (all dots) is O(number of nodes), but real queries prune hard because a concrete letter collapses the branching immediately.',
      hint: 'A dot means "any child is acceptable" — what does that do to a single-path walk?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Insert and search costs for a trie holding n words of length up to L?',
      options: [
        'O(L) per operation, independent of n — the number of stored words does not slow a lookup',
        'O(n) per operation',
        'O(n·L) per operation',
        'O(log n) per operation'
      ],
      correct: 0,
      explain: 'You walk one character at a time, so cost tracks the query length only. Space is the trade: O(total characters) in the worst case, though shared prefixes claw much of that back.',
      hint: 'How many nodes does a lookup touch, in terms of the query string?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Word Search II — many words hidden in a letter grid. Why put the words in a trie rather than searching each one?',
      options: [
        'One DFS over the grid can carry all the words at once, and a dead prefix prunes every word sharing it',
        'Tries store the grid more compactly',
        'It converts the problem to BFS',
        'It removes the need for a visited set'
      ],
      correct: 0,
      explain: 'Per-word search repeats the same grid walks over and over. With a trie, the moment the current path is not a prefix of anything, you abandon the entire family. Pruning finished trie branches as you find words is the standard extra optimisation.',
      hint: 'What do "cat", "car" and "card" share while you are walking the grid?'
    },
    {
      tag: 'MECHANICS',
      q: 'How should trie children be stored?',
      options: [
        'A fixed array when the alphabet is small and dense; a hash map when it is large or sparse — a space-versus-lookup trade',
        'Always a fixed 26-slot array',
        'Always a hash map',
        'A sorted list, for binary search'
      ],
      correct: 0,
      explain: 'A 26-slot array is O(1) indexed and cheap for lowercase English, but wasteful for Unicode or sparse tries. Naming the trade-off is better than picking one, since the interviewer is usually probing for exactly that.',
      hint: 'What does a 26-slot array cost per node if most slots stay empty?'
    }
  ];

  /* ---- Fish-Man Island — backtracking -------------------------------------- */
  BANKS['backtracking'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'The three-line skeleton of every backtracking solution is?',
      options: [
        'Choose, recurse, un-choose — the un-choose is what lets one shared buffer serve every branch',
        'Sort, recurse, merge',
        'Recurse, memoise, return',
        'Enumerate everything, then filter'
      ],
      correct: 0,
      explain: 'Forgetting the un-choose leaks state between siblings and produces answers containing choices from other branches. It is the single most common bug in the family.',
      hint: 'What must be true about the shared path buffer when a branch returns?'
    },
    {
      tag: 'TRAP',
      q: 'Appending the current path to your results list without copying it. What happens?',
      options: [
        'Every stored answer aliases the same buffer, so at the end they are all identical — usually all empty',
        'Nothing; the list is copied automatically',
        'Only the last answer is wrong',
        'It doubles the memory used'
      ],
      correct: 0,
      explain: 'The buffer is mutated all the way back up as branches unwind. Store a copy — path[:] in Python, new ArrayList<>(path) in Java. The symptom is a results list of the right length full of empty lists.',
      hint: 'The path is one object shared by every recursive call.'
    },
    {
      tag: 'MECHANICS',
      q: 'Combinations with duplicates in the input, where each answer must be unique. What is the standard guard?',
      options: [
        'Sort first, then at each depth skip a candidate equal to its predecessor unless it is the first pick at that depth',
        'Use a set of results and de-duplicate at the end',
        'Skip all duplicates entirely',
        'Recurse only on distinct values'
      ],
      correct: 0,
      explain: 'Sorting puts equal values adjacent so the guard is local: `if i > start and nums[i] == nums[i-1]: continue`. De-duplicating at the end works but wastes the exponential exploration that produced the duplicates.',
      hint: 'What is the difference between "the first duplicate at this level" and "a later one"?'
    },
    {
      tag: 'MECHANICS',
      q: 'N-Queens: how do you test a diagonal in O(1)?',
      options: [
        'Two sets keyed by row − col and row + col — each is constant along one diagonal direction',
        'Scan the board on every placement',
        'Store the queens in a list and compare all pairs',
        'Only columns need checking; diagonals follow'
      ],
      correct: 0,
      explain: 'row − col is invariant down a ↘ diagonal, row + col down a ↙ one. Three sets (columns and the two diagonals) reduce each safety check to constant time, which is what makes the pruning worth doing.',
      hint: 'Compute row − col for a few cells along one diagonal and look at the pattern.'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Why is pruning the whole game in backtracking, rather than a micro-optimisation?',
      options: [
        'Cutting a branch at depth d removes an entire exponential subtree, so early checks are worth far more than fast inner loops',
        'Because it reduces the constant factor',
        'Because it turns exponential into polynomial',
        'It is not; it only tidies the code'
      ],
      correct: 0,
      explain: 'The search tree is exponential, so where you cut matters enormously — a check one level higher can remove a branching factor\'s worth of work. It rarely changes the complexity class, but it routinely changes runtime by orders of magnitude.',
      hint: 'How many leaves hang below a node you pruned at depth 3?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Subsets versus permutations — what differs in the recursion?',
      options: [
        'Subsets pass a start index forward so order never repeats; permutations track which elements are used and consider all of them at every depth',
        'They are the same algorithm with different base cases',
        'Permutations need sorting; subsets do not',
        'Subsets need a used-array; permutations need a start index'
      ],
      correct: 0,
      explain: 'A start index enforces "combinations, order irrelevant" — 2ⁿ of them. A used set allows every ordering — n! of them. Picking the wrong one is picking the wrong problem.',
      hint: 'Is [1,2] the same answer as [2,1] in each problem?'
    }
  ];

  /* ---- Punk Hazard — divide and conquer ------------------------------------ */
  BANKS['divide-conquer'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Where does the real algorithm live in a divide-and-conquer solution?',
      options: [
        'In the combine step — splitting is mechanical, and the merge is where the problem is actually solved',
        'In the base case',
        'In the split, which must be perfectly balanced',
        'In the recursion depth'
      ],
      correct: 0,
      explain: 'Merge sort splits trivially and does everything in the merge. Counting inversions is merge sort with a counter in the merge. When stuck, ask what you can compute cheaply while combining two solved halves.',
      hint: 'What does merge sort actually DO, once the halves come back sorted?'
    },
    {
      tag: 'MECHANICS',
      q: 'Sorting a linked list in O(n log n) with O(1) extra space beyond the recursion. Which sort, and why?',
      options: [
        'Merge sort — splitting is a fast/slow walk and merging is pointer rewiring, with no random access needed',
        'Quicksort, because it is in place',
        'Heapsort, using the list as a heap',
        'Insertion sort, since lists insert cheaply'
      ],
      correct: 0,
      explain: 'Quicksort needs random access for good partitioning and degrades badly on lists; heaps need indexing outright. Merge sort is the natural fit — and it is stable, which linked-list problems often care about.',
      hint: 'Which sort never needs to jump to the middle of the data?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'A recursion that splits in half and does O(n) work per level costs?',
      options: [
        'O(n log n) — log n levels, O(n) per level',
        'O(n²)',
        'O(n)',
        'O(log n)'
      ],
      correct: 0,
      explain: 'This is the Master Theorem case T(n) = 2T(n/2) + O(n). Compare with T(n) = 2T(n/2) + O(1), which is O(n), and T(n) = T(n/2) + O(1), which is O(log n) — binary search.',
      hint: 'How many levels are there, and what does each full level cost in total?'
    },
    {
      tag: 'MECHANICS',
      q: 'Building a balanced BST from a sorted array, or a max-heap-like tree from an array. What is the shared move?',
      options: [
        'Take the middle (or the extreme) as the root, recurse on the two sides, and let the split do the balancing',
        'Insert elements one at a time',
        'Sort, then link sequentially',
        'Build bottom-up from the leaves'
      ],
      correct: 0,
      explain: 'Choosing the root so that the remaining work splits evenly is the whole trick — it is what makes the recursion depth logarithmic. The same shape appears in maximum binary tree and construct-from-traversal problems.',
      hint: 'Which choice of root leaves two equal-sized subproblems?'
    },
    {
      tag: 'TRAP',
      q: 'Which recursion is NOT genuinely divide and conquer?',
      options: [
        'Fibonacci by naive recursion — the two subproblems overlap heavily, which is a signal for dynamic programming instead',
        'Merge sort',
        'Binary search',
        'Quickselect'
      ],
      correct: 0,
      explain: 'Divide and conquer requires *independent* subproblems. Overlapping ones mean recomputation, and the fix is memoisation or a table — that overlap is precisely the line between the two techniques.',
      hint: 'Do the two halves of fib(n) share any work?'
    },
    {
      tag: 'MECHANICS',
      q: 'Quickselect for the kth largest: expected O(n), but what is the worst case and the fix?',
      options: [
        'O(n²) on adversarial pivots — randomise the pivot (or use median-of-medians for a guarantee)',
        'O(n log n), fixed by sorting first',
        'O(n²), unavoidable',
        'O(log n), with no worst case'
      ],
      correct: 0,
      explain: 'Each partition discards one side, so expected work is n + n/2 + n/4 + ... = O(n). Consistently terrible pivots make it quadratic; random pivots make that vanishingly unlikely. Median-of-medians gives a true O(n) guarantee at a heavy constant.',
      hint: 'What happens if the pivot is always the smallest remaining element?'
    }
  ];

  /* ---- Dressrosa — Kadane -------------------------------------------------- */
  BANKS['kadane'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Kadane asks exactly one question at each position. Which?',
      options: [
        '"Is the run I am carrying helping me, or should I start fresh here?"',
        '"Is this element positive?"',
        '"Is this element bigger than the best so far?"',
        '"How long is the current run?"'
      ],
      correct: 0,
      explain: 'current = max(x, current + x). If the carried sum is negative it can only hurt, so drop it. Keep the global best separately — the running value and the answer are different variables, and conflating them is the usual bug.',
      hint: 'When is dragging the previous sum along strictly worse than starting over?'
    },
    {
      tag: 'TRAP',
      q: 'The array is all negative. What does a Kadane implementation initialised to zero return, and what should it return?',
      options: [
        'It returns 0, an empty subarray — but the answer should be the largest single element, so initialise best to −infinity or to nums[0]',
        'It returns the correct answer either way',
        'It returns the sum of everything',
        'It throws on an empty result'
      ],
      correct: 0,
      explain: 'Initialising to zero silently assumes the empty subarray is allowed. Seeding both variables with nums[0] and scanning from index 1 fixes it. This is the single most common Kadane failure.',
      hint: 'Test [−3, −1, −7] against your code in your head.'
    },
    {
      tag: 'MECHANICS',
      q: 'Maximum product subarray. Why does the same one-variable trick fail?',
      options: [
        'A large negative can become the best product the moment another negative arrives, so you must carry the running minimum too',
        'Products overflow',
        'Zeros break the recurrence',
        'It does not fail; the same code works'
      ],
      correct: 0,
      explain: 'Track both the max and the min ending here, and swap them when the current element is negative. Sums have no such sign flip, which is exactly why the product variant is a step harder.',
      hint: 'What does multiplying by a negative do to the ordering of your candidates?'
    },
    {
      tag: 'MECHANICS',
      q: 'The maximum subarray in a CIRCULAR array. How do the two cases split?',
      options: [
        'Either the answer does not wrap (plain Kadane), or it wraps — and then the complement is the minimum subarray, so it is total − minSum',
        'Duplicate the array and run Kadane over 2n elements',
        'Run Kadane from every starting index',
        'Sort the array first'
      ],
      correct: 0,
      explain: 'A wrapping segment is exactly "everything except a contiguous middle", so maximising it means minimising that middle. Guard the all-negative case: total − minSum is 0 there, which would wrongly beat the real answer. (Duplicating works but costs more.)',
      hint: 'What shape does the part you did NOT take have, when the answer wraps around?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Kadane\'s cost?',
      options: [
        'O(n) time and O(1) space — one pass, two scalars',
        'O(n log n) time',
        'O(n) time and O(n) space',
        'O(n²) time'
      ],
      correct: 0,
      explain: 'It is really dynamic programming with the table collapsed to a single value, since dp[i] only ever needs dp[i−1]. Recognising that collapse is a general DP skill, not a Kadane trick.',
      hint: 'How far back does the recurrence actually reach?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'You must also report WHERE the best subarray starts and ends. What changes?',
      options: [
        'Track a tentative start that resets whenever you start fresh, and commit both endpoints whenever the best improves',
        'Nothing; the indices come out of the sums',
        'You must run it twice, forwards and backwards',
        'It becomes O(n²)'
      ],
      correct: 0,
      explain: 'Two extra variables, no change in complexity. The subtlety is committing the start only when the best actually improves — updating it at every reset gives the start of the current run, not the winning one.',
      hint: 'The moment you discard the carried sum is the moment a candidate window begins.'
    }
  ];

  /* ---- Zou — binary search ------------------------------------------------- */
  BANKS['binary-search'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'What does binary search actually require?',
      options: [
        'A monotone predicate — some property that is false, false, false, then true, true forever',
        'A sorted array',
        'Distinct elements',
        'Random access and a known length'
      ],
      correct: 0,
      explain: 'Sortedness is only the most familiar way to get monotonicity. "Can we finish in ≤ x days?" is monotone in x, which is why you can binary search the *answer* even with no sorted array in sight.',
      hint: 'What do rotated arrays, capacity problems and plain sorted arrays all share?'
    },
    {
      tag: 'TRAP',
      q: 'Which mid computation is safe in a fixed-width integer language?',
      options: [
        'lo + (hi − lo) / 2',
        '(lo + hi) / 2',
        '(lo + hi) >> 1',
        '(lo + hi + 1) / 2'
      ],
      correct: 0,
      explain: 'Adding two large indices can overflow before the division; subtracting first cannot. This is the famous bug that sat in the JDK\'s binarySearch for years. Python\'s unbounded ints make it moot there, but say it anyway.',
      hint: 'What if lo and hi are both near the maximum integer?'
    },
    {
      tag: 'MECHANICS',
      q: 'Searching a rotated sorted array. What is the key observation at each step?',
      options: [
        'At least one half is still properly sorted — identify it, test whether the target lies inside it, and discard accordingly',
        'The pivot must be found first, always',
        'Both halves are sorted',
        'You must search both halves'
      ],
      correct: 0,
      explain: 'Compare nums[lo] with nums[mid] to find the ordered half, then a simple range test tells you which side to keep. Still O(log n). Finding the pivot first is a valid two-pass alternative, not a requirement.',
      hint: 'Draw a rotated array and mark the mid. What is true of at least one side?'
    },
    {
      tag: 'MECHANICS',
      q: 'Koko eating bananas, ship capacity in D days, minimum speed — the "binary search the answer" family. What are you halving?',
      options: [
        'The answer space, using a feasibility check as the predicate — the smallest x for which feasible(x) is true',
        'The input array',
        'The number of days',
        'Nothing; it is greedy'
      ],
      correct: 0,
      explain: 'Bounds come from the problem (1 to max pile, or max weight to total weight), feasible() is a linear simulation, and monotonicity comes from "more capacity never hurts". Cost is O(n log(range)).',
      hint: 'If speed 7 works, does speed 8 also work? That answer is the licence.'
    },
    {
      tag: 'EDGE CASE',
      q: 'Finding the first and last position of a repeated value. What is the smallest change to a standard binary search?',
      options: [
        'On a match, do not return — keep searching left for the first, or right for the last',
        'Scan linearly outward from any match',
        'Sort the array again',
        'Use a hash map of value → indices'
      ],
      correct: 0,
      explain: 'Two boundary-flavoured searches, each O(log n). Scanning outward is O(n) when the value fills the array, which is exactly the case the problem is testing.',
      hint: 'What if every element equals the target?'
    },
    {
      tag: 'MECHANICS',
      q: 'Finding the minimum in a rotated sorted array. Why compare mid against HI rather than LO?',
      options: [
        'Comparing to hi cleanly separates the two cases; comparing to lo is ambiguous when the array is not rotated at all',
        'It is arbitrary; both work identically',
        'Because hi is always the largest element',
        'Because lo may be out of bounds'
      ],
      correct: 0,
      explain: 'If nums[mid] > nums[hi] the minimum is strictly right, so lo = mid + 1; otherwise it is at mid or left, so hi = mid. Note the asymmetry — hi = mid, not mid − 1, since mid itself is still a candidate.',
      hint: 'Try [1,2,3,4,5] with both comparisons and see which one still behaves.'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Why does the loop condition (lo < hi versus lo <= hi) matter so much?',
      options: [
        'It decides whether the loop can leave a candidate unexamined or spin forever — pair it with the right update and the right return',
        'It only affects performance',
        'It matters only for even-length arrays',
        'They are interchangeable'
      ],
      correct: 0,
      explain: 'Pick one template and keep it: lo <= hi with hi = mid − 1 and a return inside for exact search; lo < hi with hi = mid and a return of lo for boundary search. Mixing them is what causes infinite loops.',
      hint: 'What does the loop do when lo == hi and the update is hi = mid?'
    }
  ];

  /* ---- Whole Cake — heaps ------------------------------------------------- */
  BANKS['heap'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'The kth LARGEST element from a stream. Which heap, and how big?',
      options: [
        'A MIN-heap of size k — its root is the kth largest, and anything smaller is rejected in O(1)',
        'A max-heap of size k',
        'A min-heap of size n',
        'A max-heap of size n − k'
      ],
      correct: 0,
      explain: 'Opposite polarity, size k. The root is the weakest survivor, so comparing against it is the cheap rejection test. O(n log k) time and O(k) space — better than sorting when k is small.',
      hint: 'You need to evict the WORST of your k keepers cheaply. Which root gives you that?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Top k frequent elements. Which is genuinely better than sorting everything?',
      options: [
        'Count with a map, then either a size-k heap for O(n log k) or bucket sort by frequency for O(n)',
        'Sort by frequency; O(n log n) is optimal here',
        'Use a max-heap of all n elements and pop k times',
        'Quickselect cannot help'
      ],
      correct: 0,
      explain: 'Frequencies are bounded by n, so they can be bucketed into an array of lists indexed by count — O(n) with no comparisons. The size-k heap is the standard answer; bucket sort is the one that impresses.',
      hint: 'What is the largest possible frequency, and what does that let you index by?'
    },
    {
      tag: 'MECHANICS',
      q: 'The running median of a stream. What structure?',
      options: [
        'Two heaps — a max-heap of the lower half and a min-heap of the upper — kept balanced within one element',
        'One min-heap and a counter',
        'A sorted list with binary-search insertion',
        'A single max-heap'
      ],
      correct: 0,
      explain: 'The two roots straddle the middle, so the median is one root or the average of both. O(log n) per insert, O(1) per query. Sorted insertion is O(n) per element because of the shifting.',
      hint: 'You need instant access to the largest of the small half and the smallest of the large half.'
    },
    {
      tag: 'MECHANICS',
      q: 'A task scheduler / meeting-room count where you must know when the earliest thing frees up. Which heap?',
      options: [
        'A min-heap keyed by finish time — the root is always the next resource to free',
        'A max-heap keyed by start time',
        'A min-heap keyed by duration',
        'No heap; sorting is enough'
      ],
      correct: 0,
      explain: 'Sort by start, and heap by end. Sorting alone gives you the order to process in; the heap answers "can I reuse a room?" in O(log n). The pairing of a sort with a heap is the reusable shape here.',
      hint: 'Which single fact do you need repeatedly as each new interval arrives?'
    },
    {
      tag: 'TRAP',
      q: 'Your language only gives you a min-heap, and you need a max-heap. What do you do?',
      options: [
        'Push the negated values (or an inverted comparator) and negate again on pop',
        'Pop everything and reverse it',
        'Use a sorted list instead',
        'Build the heap from the end of the array'
      ],
      correct: 0,
      explain: 'Negation is the standard Python idiom, since heapq is min-only. For tuples, negate the key you order by, and beware ties falling through to a comparison of the payload — attach a counter to break them.',
      hint: 'What does the smallest negated value correspond to?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Building a heap from n items: repeated insertion versus heapify?',
      options: [
        'Insertion is O(n log n); bottom-up heapify is O(n), because most nodes are near the leaves and sift down barely at all',
        'Both are O(n log n)',
        'Both are O(n)',
        'Heapify is O(n log n) and insertion is O(n)'
      ],
      correct: 0,
      explain: 'Half the nodes are leaves with zero work, a quarter sift at most one level, and the sum telescopes to O(n). It is a favourite follow-up precisely because the intuition says otherwise.',
      hint: 'How much work does a leaf need when you sift DOWN?'
    }
  ];

  /* ---- Wano — bit manipulation -------------------------------------------- */
  BANKS['bits'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'Every number appears twice except one. XOR everything. Why does that work?',
      options: [
        'XOR is its own inverse and is order-independent, so pairs annihilate and only the loner survives',
        'XOR sums the values',
        'It works only if the array is sorted',
        'It only works when the loner is odd'
      ],
      correct: 0,
      explain: 'x ^ x = 0 and x ^ 0 = x, and XOR is commutative and associative, so the pairs can be regrouped and cancelled in any order. O(n) time, O(1) space — no hash set required.',
      hint: 'What is x ^ x, and does the order of the XORs matter?'
    },
    {
      tag: 'MECHANICS',
      q: 'What does n & (n − 1) do?',
      options: [
        'Clears the lowest set bit — so looping until zero counts set bits in as many steps as there are ones',
        'Sets the lowest zero bit',
        'Halves the number',
        'Returns the lowest set bit'
      ],
      correct: 0,
      explain: 'Subtracting one flips the lowest 1 to 0 and everything below it to 1; ANDing wipes that whole tail. Brian Kernighan\'s trick. And n & (n − 1) == 0 is the standard test for a power of two.',
      hint: 'Write 12 as 1100 and subtract 1, then AND the two.'
    },
    {
      tag: 'MECHANICS',
      q: 'Counting set bits for every number from 0 to n. What is the DP recurrence?',
      options: [
        'bits[i] = bits[i >> 1] + (i & 1) — reuse the answer for i with its last bit removed',
        'bits[i] = bits[i − 1] + 1',
        'bits[i] = bits[i / 2] * 2',
        'There is none; count each number independently'
      ],
      correct: 0,
      explain: 'Shifting right drops one bit, whose value you add back with i & 1. That is O(n) total instead of O(n log n). The variant bits[i] = bits[i & (i−1)] + 1 works just as well.',
      hint: 'How does the binary form of i relate to that of i >> 1?'
    },
    {
      tag: 'TRAP',
      q: 'Adding two integers without + or −, using XOR and AND. What is the loop?',
      options: [
        'XOR gives the sum without carries; (a & b) << 1 gives the carries; repeat until the carry is zero',
        'XOR alone is enough',
        'AND gives the sum and XOR gives the carry',
        'It is impossible without arithmetic operators'
      ],
      correct: 0,
      explain: 'XOR is addition modulo 2 per bit; AND finds the positions that generate a carry, and the shift moves it into place. In languages with fixed-width signed ints, mask to 32 bits and sign-extend at the end.',
      hint: 'In a single-bit adder, which gate produces the sum and which the carry?'
    },
    {
      tag: 'MECHANICS',
      q: 'Reversing the 32 bits of an unsigned integer. What is the straightforward loop?',
      options: [
        'Shift the result left, OR in the input\'s lowest bit, shift the input right — 32 times',
        'Reverse the decimal digits, then convert',
        'XOR with 0xFFFFFFFF',
        'Swap the two 16-bit halves and stop'
      ],
      correct: 0,
      explain: 'You are pouring bits from one end into the other. The divide-and-conquer version — swap halves, then quarters, then pairs with masks — is the follow-up, and it runs in five steps instead of 32.',
      hint: 'Think of it as popping the lowest bit off one number and pushing it onto another.'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'Enumerating every subset of a set of n items using bits?',
      options: [
        'Loop mask from 0 to 2ⁿ − 1; item i is in the subset when mask has bit i set',
        'Recursion is the only way',
        'Loop from 1 to n and shift',
        'Use n nested loops'
      ],
      correct: 0,
      explain: 'The integer IS the subset, which makes subset DP and bitmask DP possible. The idiom for iterating the submasks of a mask — sub = (sub − 1) & mask — is the next step up.',
      hint: 'How many subsets are there, and how many n-bit integers?'
    }
  ];

  /* ---- Onigashima — math -------------------------------------------------- */
  BANKS['math'] = [
    {
      tag: 'TRAP',
      q: 'Reversing the digits of a signed 32-bit integer. What is the whole difficulty?',
      options: [
        'Detecting overflow BEFORE it happens — check against the limit divided by ten prior to multiplying',
        'Handling negative numbers',
        'Handling trailing zeros',
        'Handling zero itself'
      ],
      correct: 0,
      explain: 'In a fixed-width language, overflow is undefined or wraps silently, so checking afterwards is too late: test result > (MAX − digit) / 10 first. Signs and trailing zeros fall out naturally.',
      hint: 'You cannot inspect a value that has already wrapped around.'
    },
    {
      tag: 'MECHANICS',
      q: 'Fast exponentiation, x to the power n. Why is it O(log n)?',
      options: [
        'Squaring halves the exponent each round — x^n is (x^(n/2))², with an extra factor of x when n is odd',
        'Because multiplication is O(1)',
        'Because the result fits in a machine word',
        'It is not; it is O(n)'
      ],
      correct: 0,
      explain: 'Each step consumes one bit of the exponent, so there are log n steps. Watch for a negative exponent (invert x and negate n) and for n = INT_MIN, where negation itself overflows.',
      hint: 'How many times can you halve n before reaching zero?'
    },
    {
      tag: 'PATTERN CHECK',
      q: 'The Sieve of Eratosthenes: why start crossing out at i·i rather than 2i?',
      options: [
        'Every smaller multiple already has a smaller prime factor and was crossed out earlier',
        'To avoid overflow',
        'It is an arbitrary optimisation',
        'Because i·i is always prime'
      ],
      correct: 0,
      explain: 'Any multiple k·i with k < i was struck when the sieve processed k\'s smallest prime factor. Together with looping i only up to √n, the total cost is O(n log log n).',
      hint: 'Who already crossed out 3 × 5, before the sieve reached 5?'
    },
    {
      tag: 'MECHANICS',
      q: 'Happy number: repeatedly sum the squares of the digits. How do you detect a non-terminating case?',
      options: [
        'Cycle detection — a seen-set, or Floyd\'s fast and slow pointers for O(1) space',
        'Cap the iterations at 1000',
        'Check whether the number is prime',
        'Check whether any digit is zero'
      ],
      correct: 0,
      explain: 'The process either reaches 1 or falls into a cycle, so this is Floyd\'s algorithm applied to a function rather than a linked list. Spotting that transfer is the point of the problem.',
      hint: 'The sequence is a linked list where next(x) is a function of x.'
    },
    {
      tag: 'MECHANICS',
      q: 'Counting trailing zeros in n factorial.',
      options: [
        'Count the factors of five: n/5 + n/25 + n/125 + ... — twos are always more plentiful',
        'Compute the factorial and count the zeros',
        'Count the factors of ten',
        'It equals n divided by 10'
      ],
      correct: 0,
      explain: 'A trailing zero needs a 2 and a 5, and fives are the scarce resource. Higher powers of five contribute extra factors, hence the sum. Computing the factorial itself overflows almost immediately.',
      hint: 'How many 2s versus 5s are there among the factors of 100!?'
    },
    {
      tag: 'EDGE CASE',
      q: 'Which single case breaks the most integer-math solutions?',
      options: [
        'INT_MIN — its absolute value does not fit in the same signed type, so abs() and negation both overflow',
        'Zero',
        'One',
        'Negative one'
      ],
      correct: 0,
      explain: 'The signed range is asymmetric: −2³¹ has no positive counterpart in 32 bits. Division of INT_MIN by −1 overflows too. Mentioning it unprompted is a strong signal.',
      hint: 'How many negative 32-bit integers are there versus positive ones?'
    }
  ];

  /* ---- Egghead — 1-D dynamic programming ---------------------------------- */
  BANKS['dp-1d'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'What is the first thing to write down when starting a DP problem?',
      options: [
        'The state, as an English sentence — "dp[i] is the best answer considering the first i items"',
        'The base case',
        'The loop bounds',
        'The final answer\'s index'
      ],
      correct: 0,
      explain: 'A precise state sentence forces the recurrence and the base case. A vague one ("dp[i] is something about i") produces code that works on the sample and fails everywhere else.',
      hint: 'If you cannot say what dp[i] MEANS, you cannot say what it depends on.'
    },
    {
      tag: 'MECHANICS',
      q: 'House Robber: no two adjacent houses. What is the recurrence?',
      options: [
        'dp[i] = max(dp[i−1], dp[i−2] + value[i]) — skip this house, or take it plus the best from two back',
        'dp[i] = dp[i−1] + value[i]',
        'dp[i] = max(value[i], dp[i−1])',
        'dp[i] = dp[i−2] + value[i]'
      ],
      correct: 0,
      explain: 'Every 1-D DP is "the choice at i, combined with an already-solved prefix". Since it reaches back only two steps, the array collapses to two scalars and the space drops to O(1).',
      hint: 'At house i you have exactly two options. Write both down.'
    },
    {
      tag: 'TRAP',
      q: 'Coin Change (fewest coins) versus Climbing Stairs (count the ways). What is structurally different?',
      options: [
        'Coin Change minimises over choices and needs an unreachable sentinel; Climbing Stairs sums over choices',
        'Nothing; they are the same recurrence',
        'Coin Change requires sorting the coins',
        'Climbing Stairs needs a 2-D table'
      ],
      correct: 0,
      explain: 'min-DP versus count-DP. The min version must distinguish "impossible" from "zero coins" — hence the infinity sentinel and the dp[0] = 0 base. The counting version seeds dp[0] = 1, meaning one way to make nothing.',
      hint: 'What should dp[amount] hold if that amount cannot be formed at all?'
    },
    {
      tag: 'MECHANICS',
      q: 'Longest Increasing Subsequence in O(n log n). What does the maintained array actually hold?',
      options: [
        'The smallest possible tail for an increasing subsequence of each length — its length is the answer, though it is not itself a valid subsequence',
        'The longest increasing subsequence found so far',
        'The sorted input',
        'The dp values from the O(n²) version'
      ],
      correct: 0,
      explain: 'Each element either extends the tails array or replaces the first tail that is ≥ it, found by binary search. Keeping tails as small as possible maximises future room. The contents are not a real subsequence — only the length is meaningful.',
      hint: 'Why would you ever want to replace a tail with a smaller value?'
    },
    {
      tag: 'MECHANICS',
      q: 'Word Break: can the string be cut into dictionary words? What is dp[i]?',
      options: [
        '"The first i characters can be segmented" — true if some j < i has dp[j] true and s[j:i] in the dictionary',
        '"Character i starts a word"',
        '"The suffix from i is a word"',
        'The number of ways to segment the first i characters'
      ],
      correct: 0,
      explain: 'A boolean prefix state with dp[0] = true. O(n²) substring checks with a hash set of words; capping the inner span at the longest dictionary word is the usual practical speed-up.',
      hint: 'What does dp[0] mean, and why must it be true?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'When can a 1-D DP array be collapsed to a couple of variables?',
      options: [
        'When the recurrence only ever reaches back a fixed number of steps',
        'Never; the array is always needed',
        'Only when the answer is dp[n]',
        'Only for counting problems'
      ],
      correct: 0,
      explain: 'Reaching back two steps means only two values are ever live. If the problem also wants the reconstructed solution rather than just its value, you must keep the full table — that is the trade.',
      hint: 'How many previous entries does the recurrence actually read?'
    }
  ];

  /* ---- Laugh Tale — 2-D dynamic programming ------------------------------- */
  BANKS['dp-2d'] = [
    {
      tag: 'PATTERN CHECK',
      q: 'What tells you a DP needs two dimensions rather than one?',
      options: [
        'Two things vary independently — two strings, or an index plus a remaining capacity',
        'The input is a matrix',
        'The answer is a pair',
        'The recurrence is recursive'
      ],
      correct: 0,
      explain: 'The state must capture everything the future depends on. Two independent moving parts means two indices. A grid problem may still be 1-D if only the position matters — the count of dimensions comes from the state, not from the input shape.',
      hint: 'How many numbers do you need to describe "where you are" in the problem?'
    },
    {
      tag: 'MECHANICS',
      q: 'Longest Common Subsequence. What is the recurrence at (i, j)?',
      options: [
        'If the characters match, 1 + dp[i−1][j−1]; otherwise max(dp[i−1][j], dp[i][j−1])',
        'Always 1 + dp[i−1][j−1]',
        'Always max(dp[i−1][j], dp[i][j−1])',
        'dp[i−1][j] + dp[i][j−1]'
      ],
      correct: 0,
      explain: 'Matching consumes one character from each string; not matching means dropping one from either and taking the better. O(n·m), and rows collapse to two 1-D arrays if only the length is wanted.',
      hint: 'On a match, is there ever a reason NOT to take the pairing?'
    },
    {
      tag: 'TRAP',
      q: '0/1 knapsack compressed into a 1-D array. Which way must the capacity loop run, and why?',
      options: [
        'Backwards — a forward loop would let the same item be picked more than once, which is the unbounded knapsack',
        'Forwards, to keep the recurrence causal',
        'Either direction gives the same result',
        'Backwards, purely for cache efficiency'
      ],
      correct: 0,
      explain: 'Iterating downward means dp[w − weight] still holds the previous row — the state before this item existed. Iterating upward reads a value already updated with this item, which is exactly the unbounded variant. Same code, one word changed, different problem.',
      hint: 'When you read dp[w − weight], has it already been updated for this item?'
    },
    {
      tag: 'MECHANICS',
      q: 'Edit distance. What do the three transitions correspond to?',
      options: [
        'Insert, delete and replace — dp[i−1][j], dp[i][j−1] and dp[i−1][j−1], each plus one when the characters differ',
        'Insert, delete and swap',
        'Only insert and delete',
        'Insert, delete and reverse'
      ],
      correct: 0,
      explain: 'Base cases are the costs of building from nothing: dp[i][0] = i and dp[0][j] = j. Matching characters propagate the diagonal at no cost. Adding transposition as a fourth move gives Damerau-Levenshtein.',
      hint: 'Each neighbouring cell in the table is one edit away from the current one.'
    },
    {
      tag: 'MECHANICS',
      q: 'Unique paths through a grid with obstacles. How do obstacles enter the recurrence?',
      options: [
        'An obstacle cell is forced to zero ways, so nothing downstream can route through it',
        'Skip the cell and continue from the next one',
        'Subtract the blocked paths at the end',
        'Treat the obstacle as a wall and restart'
      ],
      correct: 0,
      explain: 'Zero is the natural absorbing value for a counting DP — it propagates correctly with no special cases. Watch the first row and column, where a single obstacle zeroes everything after it.',
      hint: 'How many ways are there to reach a cell you cannot stand on?'
    },
    {
      tag: 'COMPLEXITY',
      q: 'Why is the knapsack\'s O(n·W) called PSEUDO-polynomial?',
      options: [
        'W is a numeric value, not an input size — writing it takes only log W bits, so the cost is exponential in the input length',
        'Because it is really O(n²)',
        'Because W is usually small',
        'Because the DP table is sparse'
      ],
      correct: 0,
      explain: 'Polynomial complexity is measured against the number of bits of input. Doubling the bit-length of W squares the runtime, which is why knapsack is NP-hard despite the tidy-looking table. This distinction is a genuine senior-level signal.',
      hint: 'How many bits does it take to write the number W?'
    },
    {
      tag: 'MECHANICS',
      q: 'Maximal square of 1s in a binary matrix. What does dp[i][j] mean, and what is the transition?',
      options: [
        'The side of the largest square whose bottom-right corner is (i, j): 1 + min of the three neighbours above, left, and diagonal, when the cell is 1',
        'The count of 1s in the rectangle up to (i, j); take the maximum',
        'Whether the cell is part of any square',
        'The largest square anywhere in the submatrix'
      ],
      correct: 0,
      explain: 'The min of the three neighbours is the binding constraint — a square only extends as far as its weakest supporting corner. Anchoring the state at a corner is the reusable idea for this whole family.',
      hint: 'For a 3×3 square to end here, what must be true of the three cells touching this corner?'
    }
  ];

  root.DOJO = { crew: CREW, foes: FOES, lessons: LESSONS, banks: BANKS };
}(typeof window !== 'undefined' ? window : this));
