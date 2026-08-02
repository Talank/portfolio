/* Transfer quizzes for the original episodes (data/episodes.js).
 *
 * Those episodes predate the quiz field, but every one of the LeetCode Top
 * Interview 150 is meant to end with a transfer check — a scenario DIFFERENT
 * from the episode's own story that needs the SAME pattern, so it tests whether
 * the idea moved rather than whether the story stuck. This file attaches them
 * without touching the episode text.
 *
 * Must load after data/episodes.js. Consumed by episode.html and dojo.html.
 */
(function (root) {
  'use strict';
  /* Keyed by LeetCode number as well as attached to the episode, so the Dojo
     can find a problem's quiz without loading the 270 KB of episode prose it
     has no use for. episode.html gets the attachment; dojo.html reads the map. */
  var BY_NUMBER = {};
  var E = root.EPISODES || {};

  function attach(id, n, quiz) {
    BY_NUMBER[n] = quiz;
    if (E[id]) E[id].quiz = quiz;
  }

  /* ---- hash maps --------------------------------------------------------- */

  attach('two-sum', 1, [
    {
      tag: 'TRANSFER',
      q: "Different island, same insight: Franky has a pile of scrap lengths and needs two that weld to exactly 90cm. He wants one pass. What does he look up at each piece?",
      options: [
        'Whether he has already seen the piece that completes it — 90 minus this length',
        'Whether he has already seen this exact length',
        'Whether this length is less than 90',
        'The largest length seen so far'
      ],
      correct: 0,
      explain: 'Looking up the COMPLEMENT is what makes each element O(1) work. Checking whether the value itself has been seen answers "is there a duplicate", a different question entirely. And the check must happen before storing the current piece, or a length of 45 pairs with itself.',
      hint: 'Fix the current piece. What single other value would finish the job?'
    },
    {
      tag: 'TWEAK',
      q: "The scrap pile arrives already sorted, and Franky must return the two lengths rather than their positions. Is the hash map still the best tool?",
      options: [
        'No — sorted input licenses two pointers walking inward, giving O(1) extra space instead of O(n)',
        'Yes, the hash map is always optimal',
        'No, it now requires sorting again',
        'Yes, but it becomes O(n log n)'
      ],
      correct: 0,
      explain: 'Sortedness means moving the left pointer can only raise the sum and the right pointer only lower it, so each step discards a candidate permanently. Both are O(n) in time, but the two-pointer version needs no extra memory — and since indices are not required, nothing is lost by reordering.',
      hint: 'What does sortedness let you conclude when the current pair sums too low?'
    }
  ]);

  attach('group-anagrams', 49, [
    {
      tag: 'TRANSFER',
      q: "Different cargo: Nami sorts crates into families where two crates match if one's contents are a rearrangement of the other's. What makes a correct grouping key?",
      options: [
        'A canonical form of the contents — sorted, or a count tuple per item type',
        'The number of items in the crate',
        'The first item in the crate',
        'A hash of the crate as it stands'
      ],
      correct: 0,
      explain: 'The key must be identical for exactly the crates that belong together — that is what "canonical form" means. Counts and first-items collide wildly, and hashing the unsorted contents makes every crate its own family, which is the opposite of grouping.',
      hint: 'Design the key so that "same key" means precisely "same family", no more and no less.'
    },
    {
      tag: 'TWEAK',
      q: "The strings are 10,000 characters long and there are only 26 possible letters. Which key is faster to build?",
      options: [
        'A 26-slot count tuple — O(n) per string, against O(n log n) for sorting it',
        'The sorted string, always',
        'The string length',
        'They are identical in cost'
      ],
      correct: 0,
      explain: 'Both are valid canonical forms; they differ in construction cost. Counting is linear in the string length, while sorting adds a log factor — which matters once the strings get long. Recognising that a bounded alphabet enables counting is the same instinct as bucket-sorting frequencies.',
      hint: 'How expensive is sorting 10,000 characters, and is there a canonical form that avoids the comparison sort?'
    }
  ]);

  attach('longest-consecutive-sequence', 128, [
    {
      tag: 'TRANSFER',
      q: "Different chart: Robin has unsorted berth numbers and wants the longest unbroken block of consecutive berths, in O(n). Which guard keeps it linear?",
      options: [
        'Only start counting upward from a berth whose predecessor is absent from the set',
        'Sort the berths first',
        'Skip duplicates before building the set',
        'Count downward instead of upward'
      ],
      correct: 0,
      explain: 'Without that guard, every member of a run starts its own walk and a run of length k costs O(k²). With it, only the true start walks, so the total work across all runs is linear. Sorting works but is O(n log n) and misses the point of the exercise.',
      hint: 'What is the cost if a run of 10,000 berths is walked from all 10,000 of its members?'
    },
    {
      tag: 'TWEAK',
      q: "The berth numbers arrive already sorted. What is the simplest correct approach now?",
      options: [
        'A single linear scan comparing each value with its predecessor, skipping duplicates — no set needed',
        'The same hash set method',
        'Binary search for each run start',
        'It still needs O(n) extra space'
      ],
      correct: 0,
      explain: 'Sortedness makes consecutiveness a local property, so the set — which existed only to answer "does value − 1 exist?" — becomes unnecessary. Duplicates still need skipping, since they must not break or extend a run. Recognising when a data structure has been made redundant is as useful as knowing when to reach for it.',
      hint: 'The set answered one question. Does sorted order answer it for free?'
    }
  ]);

  /* ---- two pointers ------------------------------------------------------ */

  attach('two-sum-ii', 167, [
    {
      tag: 'TRANSFER',
      q: "Different deck: Sanji has a sorted rack of spice jars by weight and needs two summing to a target. His current pair is too heavy. Which pointer moves?",
      options: [
        'The right one moves left — only a smaller value can reduce the sum',
        'The left one moves right',
        'Both move inward together',
        'He restarts the right pointer from the end'
      ],
      correct: 0,
      explain: 'Sorted order is the licence: with the sum too high, the only move that can help is reducing the larger side. Each step permanently discards one candidate, which is what makes the whole sweep O(n) with no extra memory.',
      hint: 'Which single move is guaranteed to lower the sum, given the rack is sorted?'
    },
    {
      tag: 'TWEAK',
      q: "The rack is NOT sorted and Sanji must return the original shelf positions. What changes?",
      options: [
        'Two pointers lose their licence — use a hash map of value to index in one pass',
        'Sort it first; positions are unaffected',
        'Nothing; two pointers work on any array',
        'It becomes O(n²) necessarily'
      ],
      correct: 0,
      explain: 'The move rule rested entirely on monotonicity. Without it, a larger sum could lie in either direction. Sorting would restore the rule but destroy the positions the question asks for, unless you carry the original indices along — which is more work than simply hashing.',
      hint: 'The rule was "moving left can only raise the sum". Is that still true unsorted?'
    }
  ]);

  attach('container-with-most-water', 11, [
    {
      tag: 'TRANSFER',
      q: "Different shore: Usopp picks two posts to hang the widest possible sail, its area being the distance between them times the SHORTER post. Two pointers at the ends. Why move the shorter post inward?",
      options: [
        'Keeping the shorter post can never beat what you just measured — width only shrinks and height stays capped by it',
        'The taller post is more likely to be in the answer',
        'Either side works equally well',
        'The shorter post might be zero height'
      ],
      correct: 0,
      explain: 'Any later pair still using the shorter post has strictly less width and a height still capped by that same post, so it cannot improve on the current area. The shorter post is therefore fully used up and can be discarded — which is what makes the single sweep correct.',
      hint: 'Imagine keeping the short post. What happens to width, and what caps the height?'
    },
    {
      tag: 'TWEAK',
      q: "The rule changes so the sail's height is the AVERAGE of the two posts rather than the shorter one. Does the same sweep still work?",
      options: [
        'No — the discard argument depended on the minimum being capped; with an average, a taller partner can still rescue a short post',
        'Yes, unchanged',
        'Yes, but move the taller post instead',
        'No, and it becomes unsolvable'
      ],
      correct: 0,
      explain: 'The proof was that keeping the shorter post bounds the height forever. Under an average, raising the other side raises the height, so a short post is not used up — and the greedy discard becomes unsound. A change that looks cosmetic can remove the entire licence.',
      hint: 'What exactly did "the shorter post can never help again" depend on?'
    }
  ]);

  attach('three-sum', 15, [
    {
      tag: 'TRANSFER',
      q: "Different pile: Zoro needs every distinct trio of weights summing to zero, from a list with repeats. After sorting, what stops the same trio being reported twice?",
      options: [
        'Skipping a fixed value equal to its predecessor, and advancing past duplicates after recording a match',
        'Using a set of results and de-duplicating at the end',
        'Skipping all repeated values entirely',
        'Starting the fixed index at 1'
      ],
      correct: 0,
      explain: 'Sorting groups equal values together, so the same trio can be produced many times. Skipping duplicates at each level keeps it O(n²) and produces unique triplets directly. De-duplicating afterwards works but wastes all the exploration that generated the duplicates — and skipping repeated values entirely would lose valid trios like (0, 0, 0).',
      hint: 'What is the difference between "the first occurrence of this value at this level" and a later one?'
    },
    {
      tag: 'TWEAK',
      q: "Zoro now needs the trio whose sum is CLOSEST to a target, not exactly equal. What changes?",
      options: [
        'Keep the same sorted fix-and-sweep, but track the best difference seen instead of stopping on an exact match',
        'It requires checking every trio',
        'Duplicate skipping becomes mandatory',
        'The array must not be sorted'
      ],
      correct: 0,
      explain: 'That is 3Sum Closest. The structure is identical — sorted, fix one, two-pointer the rest — and only the bookkeeping changes from "record equals" to "record nearest". Duplicate skipping becomes an optimisation rather than a correctness requirement, since only one answer is returned.',
      hint: 'Which part of the algorithm encodes "sum equals zero", and what would "nearest" put in its place?'
    }
  ]);

  /* ---- sliding window ---------------------------------------------------- */

  attach('longest-substring', 3, [
    {
      tag: 'TRANSFER',
      q: "Different log: Chopper wants the longest stretch of patient visits with no repeated patient. He keeps a map of patient to their last visit index. On seeing a repeat, where does the left edge go?",
      options: [
        'To max(left, lastSeen + 1) — never backwards',
        'To lastSeen + 1, always',
        'One step right of where it is',
        'Back to the start of the log'
      ],
      correct: 0,
      explain: 'The map may hold a position from before the current window, so assigning lastSeen + 1 blindly can drag the left edge backwards and inflate the answer. Clamping with max keeps both pointers monotone, which is also what keeps the scan O(n).',
      hint: 'Can the recorded position be behind the current left edge? What would using it do?'
    },
    {
      tag: 'TWEAK',
      q: "The rule relaxes to at most TWO visits from any one patient within the stretch. What changes?",
      options: [
        'Keep a count per patient and shrink from the left only while some count exceeds two',
        'Nothing; the same code works',
        'The window must become fixed-size',
        'It requires sorting the log'
      ],
      correct: 0,
      explain: 'Counts replace last-seen positions, and the shrink condition becomes "some count is over its allowance". This is the same generalisation that turns "no repeats" into "at most k of any character" — the window skeleton is untouched and only the validity test changes.',
      hint: 'What does "valid window" mean now, and what is the smallest state that can test it?'
    }
  ]);

  attach('minimum-window-substring', 76, [
    {
      tag: 'TRANSFER',
      q: "Different manifest: Nami needs the shortest run of crates containing at least two barrels, one crate of rope and three of nails. How does she test validity in O(1)?",
      options: [
        'Track how many distinct requirements are fully satisfied and compare that count to the number of requirements',
        'Compare the whole window map against the requirement map every step',
        'Track only the total number of crates in the window',
        'Sort the window and compare against the sorted requirements'
      ],
      correct: 0,
      explain: 'A single satisfied-requirements counter, bumped when an item reaches its quota and decremented when it drops below, makes validity a constant-time check. Re-comparing whole maps is what turns an O(n) window into O(n·k), and a bare total ignores which items are present.',
      hint: 'You need "is it valid" in constant time. What is the smallest summary that answers it?'
    },
    {
      tag: 'TWEAK',
      q: "One crate type is required ZERO times — it simply must not appear at all. Does the counting window still work?",
      options: [
        'Yes, but "must not appear" is a different constraint — it is cleanest to reset the window past any forbidden crate rather than to count it',
        'Yes, with a requirement of zero',
        'No, it becomes unsolvable',
        'Yes, unchanged'
      ],
      correct: 0,
      explain: 'A quota of zero is a prohibition, not a requirement, and no window spanning a forbidden crate can ever be valid — so shrinking one step at a time just re-derives that repeatedly. Clearing the counts and jumping past it is both correct and what keeps the scan linear.',
      hint: 'Can any valid window contain the forbidden crate? What does that imply about shrinking gradually?'
    }
  ]);

  /* ---- intervals --------------------------------------------------------- */

  attach('merge-intervals-ep', 56, [
    {
      tag: 'TRANSFER',
      q: "Different roster: Franky merges overlapping repair bookings on one dock. Sort by which endpoint, and why?",
      options: [
        'By start — then everything that could overlap the current block is adjacent to it, so one sweep suffices',
        'By end, because merging needs the earliest finisher',
        'By duration, shortest first',
        'No sort is needed'
      ],
      correct: 0,
      explain: 'Sorted by start, all possible overlappers are neighbours, so a single pass either extends the current block or closes it. Sorting by end is the right key for a DIFFERENT problem — choosing the maximum number of non-overlapping bookings.',
      hint: 'You want every potential overlapper to sit next to the block it might join.'
    },
    {
      tag: 'TWEAK',
      q: "Franky must instead report the maximum number of repairs running at the same moment. What is the cleanest method?",
      options: [
        'Split each booking into a +1 at its start and a −1 at its end, sort the events, and track the running maximum',
        'Merge the bookings and count the merged blocks',
        'Sort by start and count the list length',
        'Sort by end and take the last one'
      ],
      correct: 0,
      explain: 'This is a sweep line over EVENTS rather than intervals: the running sum is the concurrency at every moment, and its peak is the answer. Merged blocks tell you when the dock is busy at all, not how busy — a genuinely different question with a genuinely different tool.',
      hint: 'You care about moments in time, not about the bookings as objects.'
    }
  ]);

  attach('insert-interval', 57, [
    {
      tag: 'TRANSFER',
      q: "Different dock: a new booking must be slotted into an already sorted, non-overlapping list without re-sorting. How many existing bookings can it absorb?",
      options: [
        'Any number — widen it against every overlapper, then copy the rest',
        'At most one, on each side',
        'At most two',
        'None; it must be inserted unchanged'
      ],
      correct: 0,
      explain: 'A long new booking can swallow many existing ones, which is why the middle phase is a loop rather than a pair of checks. Three phases — strictly before, overlapping, strictly after — cover it in one linear pass with no sorting.',
      hint: 'Picture a new booking spanning the whole week against a list of daily ones.'
    },
    {
      tag: 'TWEAK',
      q: "The existing list is NOT sorted. What is the cheapest correct approach?",
      options: [
        'Append the new booking, sort by start, then run the standard merge sweep',
        'The same three-phase pass',
        'Insert it at the front and merge backwards',
        'It cannot be done'
      ],
      correct: 0,
      explain: 'The three-phase pass relies on sortedness to know that overlappers are contiguous. Without it you are simply back at Merge Intervals, which costs the O(n log n) sort — a good illustration of what the "already sorted" precondition was actually buying.',
      hint: 'Which assumption let the algorithm stop scanning once it passed the overlapping region?'
    }
  ]);

  attach('min-arrows-burst-balloons', 452, [
    {
      tag: 'TRANSFER',
      q: "Different volley: Usopp must cut every rope on the deck with the fewest sword strokes, each stroke cutting all ropes crossing one line. What is the greedy?",
      options: [
        'Sort by right endpoint, strike at the current earliest end, and skip every rope already crossed',
        'Sort by left endpoint and strike at each start',
        'Strike at the midpoint of the longest rope',
        'Count the maximum overlap depth'
      ],
      correct: 0,
      explain: 'Striking at the earliest ending rope cuts that one plus everything else already open, and no stroke further right could do more. It is activity selection with the strokes counted rather than the kept set — the same greedy as non-overlapping intervals.',
      hint: 'Which single strike position is guaranteed never to be worse than any alternative?'
    },
    {
      tag: 'PITFALL',
      q: "Two ropes span [1,4] and [4,6]. Does one stroke cut both?",
      options: [
        'It depends on whether the endpoints are inclusive — a clarifying question worth asking, since it decides < versus <=',
        'Always yes',
        'Always no',
        'Only if sorted by start'
      ],
      correct: 0,
      explain: 'Touching endpoints are the single most common source of a near-miss in interval problems, and the answer changes one character of the comparison. In the balloon version they do count as burst together; in a meeting-room version they usually do not.',
      hint: 'The code differs by one character. Which character, and what decides it?'
    }
  ]);

  /* ---- greedy / arrays --------------------------------------------------- */

  attach('jump-game', 55, [
    {
      tag: 'TRANSFER',
      q: "Different crossing: Chopper checks whether a line of ice floes can be crossed, each floe stating the furthest he may leap from it. What single value does he carry?",
      options: [
        'The furthest index reachable so far — he fails if he ever stands beyond it',
        'The number of leaps taken',
        'The largest jump value seen',
        'The index of the last zero'
      ],
      correct: 0,
      explain: 'One frontier variable answers the whole question. The count of leaps is a different problem (Jump Game II), and the largest single jump says nothing about position. Reachability is a running maximum against the current index.',
      hint: 'What is the only thing you need to know on arriving at position i?'
    },
    {
      tag: 'PITFALL',
      q: "Chopper reasons that a floe marked 0 anywhere means the crossing is impossible. Is that right?",
      options: [
        'No — a zero is only fatal if the frontier cannot pass it; an earlier floe may leap clean over',
        'Yes, any zero blocks the crossing',
        'Yes, unless the zero is the last floe',
        'Only if there are two zeros'
      ],
      correct: 0,
      explain: 'A zero stops you only if you are forced to stand on it. On [3, 0, 0, 1] the first floe reaches index 3 directly. The frontier test handles this without any special reasoning about zeros — which is why it is the right invariant to track.',
      hint: 'Construct a line with a zero in it that is still crossable.'
    }
  ]);

  attach('gas-station', 134, [
    {
      tag: 'TRANSFER',
      q: "Different circuit: Nami sails a ring of supply depots, gaining and spending stores at each. Total gain covers total spend, so a start exists. Her stores run out at depot j. What does she know?",
      options: [
        'No depot from her current start through j can work — restart at j+1',
        'Only her current start fails; restart one later',
        'Depot j is the answer',
        'No answer exists'
      ],
      correct: 0,
      explain: 'Any start between her start and j arrives at that same failing depot with no more banked stores than she had, so it fails too. Skipping the whole block is what turns an O(n²) search into a single pass.',
      hint: 'How much surplus does a later start have banked by the time it reaches the same failing depot?'
    },
    {
      tag: 'PITFALL',
      q: "The total gain is LESS than the total spend. What must the answer be, and does the one-pass scan detect it?",
      options: [
        '-1, and yes — the running total over the whole circuit is negative, which is exactly the check to make',
        '-1, but it needs a separate pass to notice',
        'The best partial start',
        '0'
      ],
      correct: 0,
      explain: 'The existence check and the position search fall out of the same traversal: accumulate the overall surplus alongside the restart logic, and a negative overall total means no start can work. Two answers, one pass — worth noticing rather than writing two loops.',
      hint: 'What quantity, summed over the entire circuit, decides whether ANY start can succeed?'
    }
  ]);

  attach('product-of-array-except-self', 238, [
    {
      tag: 'TRANSFER',
      q: "Different ledger: each entry must become the product of every OTHER entry, and division is banned because one entry is zero. What is the approach?",
      options: [
        'Sweep left building prefix products, then sweep right multiplying in suffix products',
        'Multiply everything, then divide by each entry',
        'For each entry, loop over all the others',
        'Sort, then multiply neighbours'
      ],
      correct: 0,
      explain: 'answer[i] is the product of everything left of i times everything right of i. Two passes, with the output array holding the prefixes so no third array is needed. Division fails on a single zero — and on two zeros it fails differently, which is why the ban is in the problem.',
      hint: 'Split "all the others" into two halves that meet exactly at i.'
    },
    {
      tag: 'TWEAK',
      q: "Division is allowed after all, and the ledger contains exactly one zero. What is the answer?",
      options: [
        'Every position is 0 except the zero\'s own position, which holds the product of all the others',
        'Every position is 0',
        'The same as with no zeros',
        'It is undefined'
      ],
      correct: 0,
      explain: 'Worth reasoning through rather than reciting: every other entry has the zero among "the others", so its product is 0 — while the zero\'s own position excludes itself and gets the real product. With two or more zeros, everything is 0. Counting the zeros is the whole special case.',
      hint: 'For a position that is NOT the zero, is the zero among the entries being multiplied?'
    }
  ]);

  /* ---- binary search ----------------------------------------------------- */

  attach('search-rotated-sorted-array', 33, [
    {
      tag: 'TRANSFER',
      q: "Different chart: Robin searches a sorted log that has been cut and swapped at an unknown point. What is true at every step of the binary search?",
      options: [
        'At least one half is still properly sorted — identify it and test whether the target lies inside it',
        'Both halves are sorted',
        'The pivot must be found first, always',
        'Neither half is usable, so both must be searched'
      ],
      correct: 0,
      explain: 'Comparing the low element with the middle identifies the ordered half, and a simple range test then says which side to discard. Finding the pivot first is a valid two-pass alternative, not a requirement — and searching both halves would forfeit the log-time bound.',
      hint: 'Draw a rotated array and mark the midpoint. What is guaranteed about at least one side?'
    },
    {
      tag: 'TWEAK',
      q: "The log now contains DUPLICATE entries. What breaks?",
      options: [
        'When the low, middle and high values are equal, neither half can be identified as sorted — the worst case degrades to O(n)',
        'Nothing; duplicates are handled naturally',
        'The array can no longer be searched at all',
        'Only the pivot-finding version breaks'
      ],
      correct: 0,
      explain: 'The halving depends on being able to tell which side is ordered, and equal endpoints make that undecidable — the standard fix is to shrink the range by one and continue, which costs the guarantee. It is a good example of duplicates quietly removing an algorithm\'s licence.',
      hint: 'On [3,3,3,1,3], what can you conclude by comparing the ends with the middle?'
    }
  ]);

  attach('find-minimum-in-rotated-sorted-array', 153, [
    {
      tag: 'TRANSFER',
      q: "Different dial: Usopp finds the smallest reading on a sorted dial that has been rotated by an unknown amount. Why compare the middle against the HIGH end rather than the low end?",
      options: [
        'Comparing to high separates the two cases cleanly; comparing to low is ambiguous when the dial is not rotated at all',
        'Because high is always the largest value',
        'It is arbitrary; both work identically',
        'Because low may be out of bounds'
      ],
      correct: 0,
      explain: 'If mid exceeds high, the minimum lies strictly right; otherwise it is at mid or to its left. Note the asymmetry that follows: hi = mid, not mid − 1, because mid is still a candidate. Against low, an unrotated array gives no usable signal.',
      hint: 'Try [1,2,3,4,5] with both comparisons and see which one still behaves.'
    },
    {
      tag: 'PITFALL',
      q: "Usopp writes <code>while lo &lt;= hi</code> together with <code>hi = mid</code>. What happens?",
      options: [
        'An infinite loop once lo equals hi — the range stops shrinking but the condition stays true',
        'It returns the wrong index',
        'It skips the last element',
        'Nothing; the forms are interchangeable'
      ],
      correct: 0,
      explain: 'The two binary-search templates are internally consistent pairs: lo < hi with hi = mid, or lo <= hi with hi = mid − 1. Mixing them is the classic cause of a hang. Pick one template and keep it.',
      hint: 'When lo and hi are equal, what does mid become, and what does hi become after the update?'
    }
  ]);

  /* ---- bits -------------------------------------------------------------- */

  attach('single-number', 136, [
    {
      tag: 'TRANSFER',
      q: "Different rack: every blade appears twice except one. Zoro XORs them all together. Why does that isolate the loner?",
      options: [
        'XOR is its own inverse and order-independent, so pairs cancel to zero and only the loner survives',
        'XOR sums the values',
        'It works only if the rack is sorted',
        'It works only when the loner is the largest'
      ],
      correct: 0,
      explain: 'x ^ x = 0 and x ^ 0 = x, and XOR is commutative and associative — so the pairs can be regrouped in any order and cancelled. O(n) time and O(1) space, where a hash set would cost O(n) memory.',
      hint: 'What is x XOR x, and does the order of the operations matter?'
    },
    {
      tag: 'TWEAK',
      q: "Now exactly TWO blades appear once and the rest appear twice. Does XOR still work?",
      options: [
        'It gives the XOR of the two loners — split the rack by any bit where that result is 1, and XOR each group separately',
        'No, XOR cannot handle two',
        'Yes, it returns the smaller of the two',
        'Yes, unchanged'
      ],
      correct: 0,
      explain: 'A set bit in the combined XOR means the two loners differ there, so partitioning on that bit puts one in each group with all the pairs intact. That is Single Number III, and it is the natural follow-up — still O(n) time and O(1) space.',
      hint: 'The XOR of everything is now the XOR of the two loners. What does a set bit in it tell you about them?'
    }
  ]);

  attach('number-of-1-bits', 191, [
    {
      tag: 'TRANSFER',
      q: "Different tally: Franky counts the set bits in a number. What does <code>n & (n - 1)</code> do to it?",
      options: [
        'Clears the lowest set bit — so looping until zero takes exactly as many steps as there are ones',
        'Sets the lowest zero bit',
        'Halves the number',
        'Returns the lowest set bit'
      ],
      correct: 0,
      explain: 'Subtracting one flips the lowest 1 to 0 and turns everything below it to 1; the AND then wipes that entire tail. Kernighan\'s trick, and the same expression tests for a power of two when the result is zero.',
      hint: 'Write 12 as 1100, subtract 1, and AND the two together.'
    },
    {
      tag: 'TWEAK',
      q: "Franky needs the bit count for every number from 0 to n, not just one. What is better than calling the counter n times?",
      options: [
        'bits[i] = bits[i >> 1] + (i & 1) — reuse the answer for i with its last bit removed',
        'bits[i] = bits[i - 1] + 1',
        'Sort the numbers by bit count',
        'Nothing; call the counter n times'
      ],
      correct: 0,
      explain: 'Shifting right drops one bit, whose value is added back with i & 1 — giving O(n) total instead of O(n log n). It is a one-line dynamic program, and the variant bits[i] = bits[i & (i−1)] + 1 works just as well.',
      hint: 'How does the binary form of i relate to that of i >> 1?'
    }
  ]);

  /* ---- trees and BSTs ---------------------------------------------------- */

  attach('validate-binary-search-tree', 98, [
    {
      tag: 'TRANSFER',
      q: "Different archive: Robin checks whether a tree obeys the search-tree rule. Why is \"left child < node < right child\" at every node not enough?",
      options: [
        'It is a local check — a deep left descendant can exceed a distant ancestor while still beating its own parent',
        'It fails only on duplicate values',
        'It fails only on empty trees',
        'It is enough; the objection is a myth'
      ],
      correct: 0,
      explain: 'Every node must lie within a range inherited from ALL its ancestors, so the recursion carries (low, high) downward and tightens them. The counterexample is root 10 with left child 5 whose right child is 12 — locally fine, globally invalid.',
      hint: 'Try root 10, left child 5, and give that 5 a right child of 12.'
    },
    {
      tag: 'TWEAK',
      q: "Robin prefers to validate by traversal instead. Which traversal, and what is the check?",
      options: [
        'In-order — the values must come out strictly increasing',
        'Pre-order — the values must come out sorted',
        'Post-order — the values must come out sorted',
        'Level-order — each level must be sorted'
      ],
      correct: 0,
      explain: 'In-order is the only traversal that yields sorted output for a BST, so checking that each value exceeds the previous one is an equivalent validation. It also needs only one carried value rather than a range pair — and the "strictly" matters if duplicates are disallowed.',
      hint: 'Which traversal of a valid BST produces its values in order?'
    }
  ]);

  attach('kth-smallest-element-in-a-bst', 230, [
    {
      tag: 'TRANSFER',
      q: "Different archive: Brook wants the kth smallest entry in a search tree, faster than reading the lot. What does he do?",
      options: [
        'In-order traversal with an early exit at the kth visit — O(h + k)',
        'Sort all the values, then index',
        'Level-order traversal and take the kth dequeued',
        'Take the kth node in pre-order'
      ],
      correct: 0,
      explain: 'In-order yields sorted order, so you can stop as soon as you have counted k. Level-order and pre-order visit in orders that say nothing about rank, and sorting everything throws away the structure the tree already provides.',
      hint: 'In-order gives sorted order. When can you stop walking?'
    },
    {
      tag: 'TWEAK',
      q: "The tree is queried thousands of times and is modified between queries. What is the better design?",
      options: [
        'Augment each node with its subtree size, making each query an O(h) descent',
        'Cache the sorted list and rebuild it on every modification',
        'Convert the tree to an array once',
        'Nothing; repeat the in-order walk each time'
      ],
      correct: 0,
      explain: 'This is the stated follow-up. Subtree sizes let you decide at each node whether the kth element is left, here, or right — a descent rather than a traversal. A cached list is invalidated by every modification, which is exactly the case the question sets up.',
      hint: 'What extra fact per node would let you skip an entire subtree in one comparison?'
    }
  ]);

  attach('maximum-depth-of-binary-tree', 104, [
    {
      tag: 'TRANSFER',
      q: "Different mast: Chopper measures the height of a rigging tree. What is the recursion?",
      options: [
        '1 + the larger of the two children\'s heights, with an absent child measuring 0',
        '1 + the sum of the two children\'s heights',
        'The number of nodes divided by 2',
        'The count of leaves'
      ],
      correct: 0,
      explain: 'Height is the longest downward path, so a node takes the better of its two sides and adds itself. Summing the sides would measure something closer to a diameter, and node counts say nothing about shape.',
      hint: 'A parent can only descend into ONE child on any single path.'
    },
    {
      tag: 'TWEAK',
      q: "Chopper now wants the MINIMUM depth — the shortest root-to-leaf path. Is it just min instead of max?",
      options: [
        'No — an absent child must not count as a path of length 0, so a node with one child takes that child\'s depth rather than the minimum',
        'Yes, swapping max for min is sufficient',
        'No, it requires BFS exclusively',
        'Yes, but only for balanced trees'
      ],
      correct: 0,
      explain: 'A leaf is a node with NO children, so a one-child node is not the end of a path. A naive min would return 1 for a long left-leaning chain. This asymmetry is why Minimum Depth is trickier than its maximum counterpart — and why BFS, which stops at the first leaf, is often preferred.',
      hint: 'On a root with only a left child, what does the naive min return, and is the root a leaf?'
    }
  ]);

  attach('binary-tree-level-order-traversal', 102, [
    {
      tag: 'TRANSFER',
      q: "Different tower: Nami lists each floor's rooms separately using a queue. What single step makes the grouping work?",
      options: [
        'Snapshot the queue length at the top of each round, then dequeue exactly that many',
        'Push a null marker after every node',
        'Store each node\'s depth alongside it',
        'Use a stack instead of a queue'
      ],
      correct: 0,
      explain: 'At the top of each round the queue holds exactly one complete level, so its length is that level\'s width. Capturing it before enqueuing children is essential — otherwise you drain into the next level. (Depth markers also work; they just cost extra state.)',
      hint: 'What is in the queue at the exact moment a level begins?'
    },
    {
      tag: 'PITFALL',
      q: "Nami snapshots the level width AFTER she has begun enqueuing children. What happens?",
      options: [
        'The levels bleed into one another, so the grouping is wrong from the second level onward',
        'Only the last level is wrong',
        'It crashes',
        'Nothing; the order is unaffected'
      ],
      correct: 0,
      explain: 'The queue length is only meaningful before it is extended. Once children have been added it counts a mixture of two levels, and every subsequent boundary is off. One line, and the entire family of level-order problems depends on it.',
      hint: 'After enqueuing two children, what does the queue length now describe?'
    }
  ]);

  /* ---- graphs ------------------------------------------------------------ */

  attach('number-of-islands', 200, [
    {
      tag: 'TRANSFER',
      q: "Different chart: Usopp counts separate lakes on a map grid. What is a node and what is an edge?",
      options: [
        'Each water cell is a node; edges join orthogonally adjacent water cells — count the connected components',
        'Each row is a node; edges join adjacent rows',
        'Each lake is a node; edges are channels',
        'There is no graph here'
      ],
      correct: 0,
      explain: 'Modelling first is the whole job: after that it is a flood fill — scan for an unvisited water cell, sink its entire component, and add one to the count. The grid IS the adjacency structure, so no edge list is ever built.',
      hint: 'What is directly connected to what, and does that give you a graph?'
    },
    {
      tag: 'TWEAK',
      q: "Cells are now connected diagonally as well. What changes?",
      options: [
        'The neighbour list grows from 4 directions to 8; nothing else about the method changes',
        'It becomes a union-find problem',
        'The scan must start from the borders',
        'The flood fill no longer terminates'
      ],
      correct: 0,
      explain: 'Adjacency is a parameter of the flood, not part of its logic. Keeping the directions as data rather than as four hard-coded calls is what makes this a one-line change — and the same code then covers knight-move connectivity too.',
      hint: 'Which single part of the flood fill encodes what "adjacent" means?'
    }
  ]);

  attach('course-schedule', 207, [
    {
      tag: 'TRANSFER',
      q: "Different yard: Franky checks whether a set of assembly steps with prerequisites can be completed at all. What is he detecting?",
      options: [
        'A cycle — if fewer than n steps ever reach zero prerequisites, the leftovers depend on each other',
        'A disconnected component',
        'A step with more than one prerequisite',
        'Duplicate steps'
      ],
      correct: 0,
      explain: 'Only a cycle can leave steps permanently waiting. Multiple prerequisites are ordinary, and disconnected pieces simply mean independent sub-builds that interleave freely. The emitted count is the entire cycle test.',
      hint: 'What is the only reason a step can never reach in-degree zero?'
    },
    {
      tag: 'PITFALL',
      q: "Franky reads the pair [a, b] as \"a must come before b\" and builds the edge a → b, when the convention is the reverse. What is the symptom?",
      options: [
        'For the yes/no question, none — reversing every edge of a DAG still gives a DAG, so cycle detection is unaffected',
        'It always reports a cycle',
        'It always reports no cycle',
        'It crashes on the in-degree array'
      ],
      correct: 0,
      explain: 'Worth being precise: for "can it be finished", the direction genuinely does not matter, because a graph has a cycle exactly when its reverse does. It matters enormously for Course Schedule II, where the ORDER is the answer and reversal produces a plausible-looking sequence that is exactly backwards.',
      hint: 'Does reversing every edge of an acyclic graph ever create a cycle?'
    }
  ]);

  /* ---- heaps, divide and conquer, DP ------------------------------------- */

  attach('kth-largest-element-in-an-array', 215, [
    {
      tag: 'TRANSFER',
      q: "Different haul: Sanji needs the 5th heaviest fish from a stream he can only read once. Which heap, and how big?",
      options: [
        'A MIN-heap of size 5 — its root is the weakest keeper, so anything smaller is rejected in O(1)',
        'A max-heap of size 5',
        'A min-heap holding every fish',
        'A max-heap holding every fish'
      ],
      correct: 0,
      explain: 'Opposite polarity, size k. The root being the weakest survivor is what makes the rejection test cheap. O(n log k) time and O(k) space, which beats sorting whenever k is small relative to n.',
      hint: 'You need to evict the WORST of your k keepers cheaply. Which root gives you that?'
    },
    {
      tag: 'TWEAK',
      q: "The whole array is available in memory and Sanji wants the best expected time. What beats the heap?",
      options: [
        'Quickselect — expected O(n), since each partition discards one side entirely',
        'Sorting, at O(n log n)',
        'A max-heap of all n elements',
        'Nothing beats the size-k heap'
      ],
      correct: 0,
      explain: 'Quickselect partitions and recurses into only one side, giving n + n/2 + n/4 + … = O(n) expected. Its worst case is O(n²) on adversarial pivots, which randomisation makes vanishingly unlikely — and the heap remains the right answer for a streaming input.',
      hint: 'After partitioning around a pivot, how much of the array still needs examining?'
    }
  ]);

  attach('merge-k-sorted-lists', 23, [
    {
      tag: 'TRANSFER',
      q: "Different convoy: Nami merges k sorted supply manifests into one. Which approach is O(N log k) rather than O(N k)?",
      options: [
        'A min-heap of the k current heads, or repeated pairwise merging that halves the manifest count each round',
        'Scanning all k heads each time to find the smallest',
        'Concatenating everything and sorting',
        'Merging them one at a time into an accumulator'
      ],
      correct: 0,
      explain: 'Per output element, "which of the k fronts is smallest?" costs O(k) by scanning and O(log k) with a heap. Pairwise merging reaches the same bound via log k rounds of O(N) work; merging one at a time re-walks the growing accumulator and is O(N k).',
      hint: 'How expensive is each output element under each strategy?'
    },
    {
      tag: 'PITFALL',
      q: "Nami pushes tuples of (value, node) into a min-heap and two manifests contain the same value. What can go wrong?",
      options: [
        'The heap falls through to comparing the nodes themselves, which may not be comparable and raises an error',
        'The merge silently loses one of the duplicates',
        'The heap becomes unbalanced',
        'Nothing; ties are handled automatically'
      ],
      correct: 0,
      explain: 'A classic language-level trap in Python. Adding a monotonically increasing counter as a tiebreaker — (value, counter, node) — resolves ties before any node comparison happens, and it also makes the merge stable.',
      hint: 'When two tuples have equal first elements, what does the comparison do next?'
    }
  ]);

  attach('climbing-stairs', 70, [
    {
      tag: 'TRANSFER',
      q: "Different ladder: Chopper climbs n rungs taking one or two at a time and counts the distinct ways. What is the recurrence?",
      options: [
        'ways[n] = ways[n-1] + ways[n-2] — arriving from one rung below or two',
        'ways[n] = ways[n-1] * 2',
        'ways[n] = n * (n-1) / 2',
        'ways[n] = ways[n-1] + 1'
      ],
      correct: 0,
      explain: 'Every route to rung n arrives from exactly one of two places, and those two sets are disjoint — so the counts add. It is the Fibonacci recurrence, and it reaches back only two steps, which is why the table collapses to two variables.',
      hint: 'The last move was either a single step or a double. Where did each come from?'
    },
    {
      tag: 'TWEAK',
      q: "Chopper may now take one, two OR three rungs at a time. What changes?",
      options: [
        'A third term: ways[n] = ways[n-1] + ways[n-2] + ways[n-3], with three base cases',
        'Multiply the answer by 3',
        'Nothing; the recurrence is unchanged',
        'It becomes exponential'
      ],
      correct: 0,
      explain: 'The recurrence sums over the allowed last moves, so allowing a third move adds a third term — and a third base case, since the recursion now reaches three steps back. The state space and the table are otherwise identical.',
      hint: 'The recurrence enumerated the possible LAST moves. How many are there now?'
    }
  ]);

  attach('house-robber', 198, [
    {
      tag: 'TRANSFER',
      q: "Different row: Usopp raids a line of warehouses but cannot hit two adjacent ones. What is the recurrence?",
      options: [
        'best[i] = max(best[i-1], best[i-2] + value[i]) — skip this warehouse, or take it plus the best from two back',
        'best[i] = best[i-1] + value[i]',
        'best[i] = max(value[i], best[i-1])',
        'best[i] = best[i-2] + value[i]'
      ],
      correct: 0,
      explain: 'At each warehouse there are exactly two options, and the recurrence writes both down. Since it reaches back only two steps, the array collapses to a pair of scalars and the space drops to O(1).',
      hint: 'At warehouse i you have exactly two choices. Write both out.'
    },
    {
      tag: 'TWEAK',
      q: "The warehouses are arranged in a RING, so the first and last are adjacent. How does that change things?",
      options: [
        'Run the linear version twice — once excluding the first warehouse, once excluding the last — and take the better',
        'Nothing; the same recurrence works',
        'The recurrence needs a third term',
        'It becomes exponential'
      ],
      correct: 0,
      explain: 'That is House Robber II. Since the first and last cannot both be taken, fixing one of them out of consideration reduces the ring to a line — and two linear passes cover both possibilities. Reducing a circular constraint to two linear cases is a widely reusable move.',
      hint: 'The only new constraint couples two specific warehouses. What if you simply forbid one of them?'
    }
  ]);

  attach('coin-change', 322, [
    {
      tag: 'TRANSFER',
      q: "Different purse: Nami makes an exact amount from unlimited coins of given values, using as few coins as possible. What must dp[amount] hold when the amount is unreachable?",
      options: [
        'A sentinel such as infinity — distinct from 0, which means "zero coins needed"',
        '0',
        '-1',
        'The amount itself'
      ],
      correct: 0,
      explain: 'A min-DP must distinguish "impossible" from "free". Seeding unreachable amounts with infinity means they never win a minimum, and dp[0] = 0 is the genuine base case. Using 0 for both collapses the two meanings and produces answers that are far too good.',
      hint: 'What does dp[0] mean, and how must it differ from an amount that cannot be formed?'
    },
    {
      tag: 'TWEAK',
      q: "Nami now wants the NUMBER OF WAYS to make the amount rather than the fewest coins. What changes?",
      options: [
        'Sum over choices instead of minimising, seed dp[0] = 1, and iterate coins in the outer loop to avoid counting permutations',
        'Only the combiner changes, from min to +',
        'Nothing; the same table answers both',
        'It requires backtracking'
      ],
      correct: 0,
      explain: 'Two changes, and the second catches people. Swapping min for + and seeding with 1 turns it into a counting DP — but with the amount in the outer loop you would count 1+2 and 2+1 separately. Coins outer, amount inner, counts combinations. That is Coin Change II.',
      hint: 'Beyond the combiner, what stops 1+2 and 2+1 being counted as two different ways?'
    }
  ]);

  /* ---- backtracking ------------------------------------------------------ */

  attach('combination-sum', 39, [
    {
      tag: 'TRANSFER',
      q: "Different galley: Sanji picks ingredients (reusable, unlimited) summing to an exact weight, and each distinct multiset counts once. What stops him listing the same set in different orders?",
      options: [
        'Passing a start index forward, so each level may only choose from that ingredient onward',
        'A used-set marking each ingredient',
        'Sorting the results at the end',
        'Nothing; permutations are wanted'
      ],
      correct: 0,
      explain: 'A start index enforces non-decreasing choices, which makes each multiset reachable by exactly one path. Crucially, reuse is allowed here, so the recursion passes the SAME index forward rather than index + 1 — that single difference is what permits repeats.',
      hint: 'Is [2,3] the same answer as [3,2] here, and what enforces that?'
    },
    {
      tag: 'TWEAK',
      q: "Each ingredient may now be used at most ONCE, and the input contains duplicates. What changes?",
      options: [
        'Recurse with index + 1, and skip a candidate equal to its predecessor unless it is the first pick at that depth',
        'Only the recursion index changes',
        'Only the duplicate skip is needed',
        'Nothing changes'
      ],
      correct: 0,
      explain: 'Both changes are needed, for different reasons: index + 1 enforces single use, and the duplicate skip stops two identical ingredients producing the same combination twice. That is Combination Sum II, and it is the pair of edits people most often make only half of.',
      hint: 'One change enforces "use once". What does the other one prevent?'
    }
  ]);

  attach('permutations', 46, [
    {
      tag: 'TRANSFER',
      q: "Different line-up: Zoro lists every ORDER the crew could stand in. What distinguishes this recursion from one that lists subsets?",
      options: [
        'A used-set, considering every unused member at each depth, rather than a start index that only looks forward',
        'The base case',
        'The depth of the recursion',
        'Nothing; they are the same recursion'
      ],
      correct: 0,
      explain: 'A start index means order does not matter and gives 2ⁿ subsets; a used-set allows every ordering and gives n! permutations. Picking the wrong one is picking the wrong problem — and this single choice is the fork between the two halves of the backtracking family.',
      hint: 'Is [1,2] the same answer as [2,1] in each of the two problems?'
    },
    {
      tag: 'PITFALL',
      q: "Zoro appends the shared path list to his results at each leaf without copying it. What does he end up with?",
      options: [
        'n! references to the same list, which is empty by the end — every result identical',
        'The correct permutations',
        'Only one permutation',
        'A list of single elements'
      ],
      correct: 0,
      explain: 'The path is one object that every un-choose pops from, so after the search unwinds it is empty and all the stored references point at it. The results list has the right LENGTH and the wrong content, which is what makes this bug confusing to diagnose.',
      hint: 'How many separate list objects exist during the whole search?'
    }
  ]);

  /* ---- tries and linked lists -------------------------------------------- */

  attach('implement-trie-prefix-tree', 208, [
    {
      tag: 'TRANSFER',
      q: "Different index: Robin stores route names so she can ask both \"is this an exact route?\" and \"does any route start with this?\". What does the end-of-word flag do?",
      options: [
        'Distinguishes a stored word from a mere prefix — without it, searching "car" succeeds just because "card" was inserted',
        'Marks that the node is a leaf',
        'Marks that the node has children',
        'Counts the words below the node'
      ],
      correct: 0,
      explain: 'The flag is the entire difference between search() and startsWith(). Leaf-ness is not a substitute: "car" ends mid-path when "card" is also stored, so a node can be a word without being a leaf.',
      hint: 'Insert "card", then search for "car". What should each of the two queries answer?'
    },
    {
      tag: 'TWEAK',
      q: "The alphabet grows to full Unicode. What should change in the node representation?",
      options: [
        'Swap the fixed-size child array for a hash map — sparse alphabets waste enormous space in a dense array',
        'Nothing; arrays scale fine',
        'Store the children in a sorted list',
        'Flatten the trie into a hash set'
      ],
      correct: 0,
      explain: 'A fixed array is O(1) indexed and ideal for a small dense alphabet, but allocating thousands of mostly-empty slots per node is untenable. Naming the trade — space against constant-factor lookup — is better than insisting on one.',
      hint: 'How many slots does each node allocate under each representation, and how many are used?'
    }
  ]);

  attach('design-add-and-search-words', 211, [
    {
      tag: 'TRANSFER',
      q: "Different index: Robin's search accepts a wildcard matching any single character. What does that do to the walk?",
      options: [
        'It branches — a wildcard must recurse into every existing child, turning the walk into a DFS',
        'It skips one node and continues',
        'It requires a second trie',
        'It falls back to scanning every stored word'
      ],
      correct: 0,
      explain: 'A concrete letter follows one path; a wildcard follows all of them. Worst case (all wildcards) is proportional to the node count, but real queries prune hard because the first concrete letter collapses the branching immediately.',
      hint: 'A wildcard means "any child is acceptable". What does that do to a single-path walk?'
    },
    {
      tag: 'TWEAK',
      q: "A wildcard that matches ZERO OR MORE characters is added. Is that the same problem?",
      options: [
        'No — it can consume any number of characters, so the search must try every split point, which is closer to regular-expression matching',
        'Yes, the same recursion works',
        'Yes, with one extra child pointer',
        'No, and it is impossible on a trie'
      ],
      correct: 0,
      explain: 'Single-character wildcards keep query position and trie depth in lockstep; a multi-character one breaks that correspondence, so the search must consider consuming 0, 1, 2 … characters at each point. It is the same jump in difficulty as going from Wildcard Matching to full regex.',
      hint: 'With a single-character wildcard, does the query index always advance by exactly one?'
    }
  ]);

  attach('reverse-linked-list-ii', 92, [
    {
      tag: 'TRANSFER',
      q: "Different chain: Franky reverses only the links between positions left and right, leaving the rest alone. What must he hold on to before reversing?",
      options: [
        'The node just BEFORE position left, so the reversed section can be stitched back in',
        'The node at position right only',
        'The list length',
        'A copy of the whole chain'
      ],
      correct: 0,
      explain: 'Every in-place section reversal needs its predecessor, because that node must end up pointing at the section\'s new head. When left is 1 there is no predecessor — which is exactly why a dummy head is standard here.',
      hint: 'After the section is reversed, what has to point at its new first node?'
    },
    {
      tag: 'PITFALL',
      q: "Franky reverses the section correctly but forgets to link its new tail forward. What is the result?",
      options: [
        'The list is truncated — everything after the reversed section becomes unreachable',
        'The list develops a cycle',
        'Only the order is wrong',
        'Nothing; the tail links itself'
      ],
      correct: 0,
      explain: 'Every section reversal needs TWO stitches: the predecessor to the new head, and the new tail to whatever followed. The old head becomes the new tail, and it still points backwards into the reversed section unless you fix it — losing the remainder of the list.',
      hint: 'The node that was first in the section is now last. Where is it still pointing?'
    }
  ]);

  attach('linked-list-cycle', 141, [
    {
      tag: 'TRANSFER',
      q: "Different chain: Brook checks whether a chain loops. Floyd sends one walker at single speed and one at double. Why must they meet if a loop exists?",
      options: [
        'Inside the loop the gap between them changes by exactly one each step, so it must reach zero — it cannot be stepped over',
        'The fast walker always laps the slow one exactly once',
        'The loop length must be even',
        'They meet only if the loop starts at the head'
      ],
      correct: 0,
      explain: 'Working modulo the cycle length, the fast walker closes the gap by exactly one per step, so it lands on zero. A speed of 3 could jump over the gap; a speed of 2 cannot. O(1) space, against O(n) for a visited set.',
      hint: 'Track the distance between the two walkers per step. Does it change by one, or by more?'
    },
    {
      tag: 'TWEAK',
      q: "Brook now needs the node where the loop BEGINS, not merely whether one exists. What is the extra step?",
      options: [
        'After they meet, restart one walker at the head and advance both at single speed — they meet at the loop entrance',
        'Count the loop length and walk that far from the head',
        'Reverse the list and repeat',
        'It requires a visited set after all'
      ],
      correct: 0,
      explain: 'That is Linked List Cycle II, and it follows from the distance arithmetic: the distance from the head to the entrance equals the distance from the meeting point to the entrance, going around. Two extra lines, still O(1) space.',
      hint: 'The meeting point is not arbitrary. What is special about its distance from the loop entrance?'
    }
  ]);

  root.LEGACY_QUIZZES = BY_NUMBER;
}(typeof window !== 'undefined' ? window : this));
