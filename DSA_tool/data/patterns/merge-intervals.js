window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['merge-intervals'] = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  category: 'Arrays & Two-Pointer Family',
  timeMin: 10,
  summary: 'Sort intervals by start time, then sweep once, merging any interval that overlaps the tail of the output into it.',
  concept: [
    'Sort the intervals by start value first — this is what turns an O(n²) all-pairs overlap check into a single O(n) linear sweep, because once sorted, an interval can only possibly overlap the <i>most recently merged</i> interval, never one further back.',
    'Maintain an output list. For each interval in sorted order, compare its start against the end of the last interval already in the output: if <code>start ≤ last.end</code>, they overlap (or touch) — extend <code>last.end</code> to <code>max(last.end, end)</code> (not just <code>end</code>, since a contained interval can have a smaller end than what\'s already merged). Otherwise, push the interval as a new, disjoint entry.',
    'This same "sort, then single sweep comparing against a running tail" skeleton is the basis for a whole family of interval problems — inserting into an already-sorted disjoint list, counting maximum overlap for room-scheduling, and intersecting two separate interval lists all reuse it with a different comparison or bookkeeping step.',
    'The correctness proof is an induction on the output list, and it\'s worth stating explicitly: after processing the sorted intervals through some index i, assume every entry already in the output is pairwise disjoint (except possibly touching) and that each entry\'s end is the maximum end of everything merged into it so far. Because the input is sorted by start, the next interval\'s start is ≥ every previous interval\'s start; if it doesn\'t overlap the current tail, it also cannot overlap any earlier output entry, since every earlier entry\'s end is ≤ the tail\'s end (that\'s exactly what "maximum end so far" guarantees). That inductive step is what licenses comparing only against the single running tail instead of against the whole output list — it\'s a proof that the omitted comparisons could never have mattered, not just a convenient shortcut.',
  ],
  recognitionSignals: [
    'Problem gives a list of <code>[start, end]</code> pairs — meetings, ranges, time windows — and asks you to combine overlapping ones, count conflicts, or find gaps.',
    'Words like "overlapping", "conflicting", "free time", "conference rooms", "merge" applied to ranges.',
    'Distinguish from two pointers on a single sorted array of scalars: here each element is itself a range, and the comparison is against a running merged tail, not a target sum.',
    'If the intervals are stated to already be sorted and non-overlapping and you\'re asked to add exactly one more, that\'s the O(n) Insert Interval variant — sorting is unnecessary there.',
  ],
  complexity: 'Time: O(n log n), dominated by the sort (the merge sweep itself is O(n)). Space: O(n) for the output list, or O(log n)–O(n) additionally for the sort depending on the language\'s sort implementation.',
  canonical: {
    name: 'Merge Intervals (LeetCode 56)',
    statement: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.',
  },
  story: {
    onePiece: {
      title: 'Marine HQ scheduling patrol shifts across the Grand Line',
      text: [
        'Marine HQ has a roster of vice-admirals, each assigned to patrol a stretch of the Grand Line during a specific window of time — Vice-Admiral A covers a stretch starting Monday and ending Thursday, Vice-Admiral B covers a stretch starting Wednesday and ending Saturday, and so on, dozens of overlapping assignments submitted in no particular order.',
        'Command\'s first move is always the same: lay every shift out sorted by its start time. Once sorted, they walk down the list once, keeping a running "currently covered through" marker. If the next vice-admiral\'s patrol starts before that marker, their coverage folds into the current block and the marker extends to whichever end is later — Command never needs to glance back at earlier vice-admirals\' shifts to know they\'re already accounted for.',
        'The moment a vice-admiral\'s patrol starts *after* the marker, that\'s a real gap in sea coverage — no ship watching that stretch of water — and a brand new coverage block begins. What falls out of this single pass is exactly what HQ needs: the total contiguous stretches of patrolled sea, and the gaps between them where a pirate crew could slip through unseen.',
      ],
    },
    history: {
      title: 'The General Time Convention, 1883',
      text: [
        'Before 1883, American railroads each kept their own local solar time — a train timetable in one city could be off by tens of minutes from a city just a few hundred miles east or west. With hundreds of independent local time "intervals" all slightly offset from each other, schedules routinely conflicted: two trains could each be running exactly on their own local schedule and still collide, because "the same time" meant different things in different places.',
        'On November 18, 1883, the railroads\' General Time Convention collapsed that mess of overlapping, conflicting local times into a small handful of standardized time zones spanning the continent — a real, historical instance of taking a large set of overlapping intervals (each town\'s local time offset) and merging them down into the minimum number of non-overlapping, consistent ranges.',
      ],
    },
    why: 'The merge-sweep is a short algorithm but an easy one to blank on mid-interview when asked to justify why a single running tail suffices. Marine HQ\'s patrol roster gives a concrete "why compare only against the most recent block" intuition, while the real 1883 time-zone consolidation anchors the *outcome* — overlapping ranges collapsing into a minimal covering set — in an event that actually happened, not just a textbook abstraction.',
  },
  tricks: [
    {
      name: 'Extend the merged end with max(), never overwrite it',
      idea: 'A later interval in sorted-by-start order can be fully nested inside the interval already at the tail of the output, with a smaller end value. Overwriting the tail\'s end unconditionally throws away coverage that was already established.',
      before:
`def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda iv: iv[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = end   # BUG: overwrites instead of extending
        else:
            merged.append([start, end])
    return merged`,
      after:
`def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda iv: iv[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)   # keep the larger end
        else:
            merged.append([start, end])
    return merged`,
      explain: 'Given [[1,10],[2,3]]: after sorting the order is unchanged. start=2 <= merged[-1][1]=10, so they merge — but the buggy version sets merged[-1][1] = 3, shrinking the output to [1,3] and silently losing the coverage from 3 to 10. max(10, 3) correctly keeps the tail at [1,10].',
    },
    {
      name: 'Treat touching endpoints as overlapping',
      idea: 'LeetCode 56 defines two intervals that merely touch at a shared endpoint (like [1,3] and [3,5]) as overlapping and requires them merged. Using a strict less-than comparison instead of <= misses exactly that boundary case.',
      before:
`def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda iv: iv[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start < merged[-1][1]:   # BUG: strict <, misses touching intervals
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      after:
`def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda iv: iv[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:   # touching endpoints (start == tail end) also merge
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      explain: 'Given [[1,3],[3,5]]: the shared endpoint 3 means these describe a single contiguous stretch, and LeetCode 56 expects [1,5] back. The buggy strict-< version treats start=3 < merged[-1][1]=3 as false, leaving them as two separate output intervals — technically correct-looking output that fails the problem\'s own definition of overlap.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Insert Interval (LeetCode 57)',
      twist: 'You\'re given intervals that are already sorted and disjoint, plus one new interval to insert and merge — no sort is needed or wanted. The algorithm reshapes into three linear phases over the existing list: copy all intervals ending strictly before the new one starts, merge all intervals that overlap the new one (expanding its own bounds as you go), then copy the rest unchanged. Skipping the sort and doing this in one O(n) pass instead of appending-then-re-merging-everything is the entire point of the follow-up.',
    },
    {
      company: 'Meta-style',
      title: 'Meeting Rooms II (LeetCode 253) — minimum number of conference rooms needed',
      twist: 'The goal flips from "merge into fewer intervals" to "count maximum simultaneous overlap." The merge-sweep skeleton doesn\'t directly apply; instead you split starts and ends into two separately sorted arrays (or push end-times onto a min-heap as you scan starts in order) and walk them together: every new meeting that starts before the earliest currently-running meeting ends needs an additional room. The output is a single integer (peak concurrency), not a list of merged ranges — a fundamentally different aggregation over the same input shape.',
    },
    {
      company: 'Amazon/Microsoft-style',
      title: 'Interval List Intersections (LeetCode 986) / Employee Free Time',
      twist: 'Instead of merging one list, you\'re given two (or more) separately sorted, disjoint interval lists and must find where they overlap (intersections) or where none of them cover a time slot (free time). This uses a two-pointer walk across both lists simultaneously — at each step compute <code>overlap = [max(a.start,b.start), min(a.end,b.end)]</code>, emit it if non-empty, then advance whichever interval ends first — rather than merging everything into one sorted stream first. Multi-list free-time additionally requires merging all lists together first, then reporting the gaps between consecutive merged intervals.',
    },
  ],
  pythonSolution: {
    title: 'Merge Intervals',
    code:
`def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda iv: iv[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    notes: [
      '<code>intervals.sort(key=lambda iv: iv[0])</code> sorts by start value without writing a custom comparator — the idiomatic way to sort by a derived key in Python.',
      'Tuple unpacking <code>for start, end in intervals[1:]</code> avoids manual indexing into each pair.',
      '<code>merged[-1]</code> accesses the running tail directly instead of tracking a separate "last merged index" variable.',
      '<code>max(merged[-1][1], end)</code> is required, not <code>= end</code> — a later interval can be fully contained inside the current merged one and have a smaller end, so a naive overwrite would incorrectly shrink the merged range.',
    ],
  },
  pitfalls: [
    'Forgetting to sort first (or sorting by the wrong key) — the entire single-pass algorithm assumes intervals arrive in start order; on unsorted input it silently produces wrong, incomplete merges instead of erroring.',
    'Overwriting <code>merged[-1][1] = end</code> instead of taking <code>max(...)</code> — breaks the moment a later interval is contained within (not just overlapping) the current merged range, e.g. [1,10] followed by [2,3].',
    'Using <code>start < merged[-1][1]</code> instead of <code>start <= merged[-1][1]</code> — LeetCode 56 treats touching intervals like [1,3] and [3,5] as overlapping and requires them merged; the strict inequality misses this boundary case.',
    'Building the output with repeated list concatenation (<code>merged = merged + [[start, end]]</code>) inside the loop instead of <code>append</code> — each concatenation copies the whole list, degrading the sweep from O(n) to O(n²).',
  ],
  viz: {
    type: 'array',
    initialArray: ['[1,3]', '[2,6]', '[8,10]', '[15,18]'],
    steps: [
      { highlights: { 0: 'a' }, pointers: { tail: 0 }, vars: { merged: '[[1,3]]' }, message: 'Sort by start (already sorted here). Initialize merged output with the first interval [1,3].' },
      { highlights: { 0: 'a', 1: 'b' }, pointers: { tail: 0, i: 1 }, vars: { merged: '[[1,3]]' }, message: 'Compare [2,6].start=2 with tail\'s end=3. 2 ≤ 3 → overlap, merge into [1,6].' },
      { arrayOverride: ['[1,6]', '[8,10]', '[15,18]'], highlights: { 0: 'c' }, pointers: { tail: 0, i: 1 }, vars: { merged: '[[1,6]]' }, message: '[2,6] absorbed into the tail; the working array shrinks from 4 intervals to 3.' },
      { arrayOverride: ['[1,6]', '[8,10]', '[15,18]'], highlights: { 0: 'a', 1: 'b' }, pointers: { tail: 0, i: 1 }, vars: { merged: '[[1,6]]' }, message: 'Compare [8,10].start=8 with tail\'s end=6. 8 > 6 → no overlap, push [8,10] as a new interval.' },
      { arrayOverride: ['[1,6]', '[8,10]', '[15,18]'], highlights: { 1: 'c' }, pointers: { tail: 1, i: 2 }, vars: { merged: '[[1,6],[8,10]]' }, message: '[8,10] pushed as the new tail. tail pointer advances to index 1.' },
      { arrayOverride: ['[1,6]', '[8,10]', '[15,18]'], highlights: { 1: 'a', 2: 'b' }, pointers: { tail: 1, i: 2 }, vars: { merged: '[[1,6],[8,10]]' }, message: 'Compare [15,18].start=15 with tail\'s end=10. 15 > 10 → no overlap, push [15,18].' },
      { arrayOverride: ['[1,6]', '[8,10]', '[15,18]'], highlights: { 2: 'c' }, pointers: { tail: 2 }, vars: { merged: '[[1,6],[8,10],[15,18]]' }, message: 'All intervals processed. Final merged result: [[1,6],[8,10],[15,18]].' },
    ],
  },
  quiz: [
    {
      q: 'What is the single most important precondition the merge-sweep algorithm depends on?',
      options: [
        'The intervals must all have the same length',
        'The intervals must be sorted by start value before the sweep begins',
        'The intervals must not contain negative numbers',
        'The input must be a linked list, not an array',
      ],
      correct: 1,
      explain: 'Sorting by start is what guarantees an interval can only possibly overlap the most recently merged one, letting a single linear pass replace an all-pairs comparison.',
    },
    {
      q: 'What is the overall time complexity of Merge Intervals, and what dominates it?',
      options: [
        'O(n), dominated by the merge sweep',
        'O(n log n), dominated by the initial sort — the merge sweep itself is O(n)',
        'O(n²), because every interval is compared against every other interval',
        'O(2ⁿ), because all subsets of intervals are considered',
      ],
      correct: 1,
      explain: 'The merge sweep is a single O(n) pass, but sorting the intervals by start value first costs O(n log n), which dominates the total.',
    },
    {
      q: 'In the reference solution, why is `merged[-1][1] = max(merged[-1][1], end)` used instead of simply `merged[-1][1] = end`?',
      options: [
        'max() is only there for readability, both are equivalent',
        'A later interval can be fully contained within the current merged interval and have a smaller end value; overwriting without max() would incorrectly shrink the merged range',
        'It\'s required to make the sort stable',
        'It converts the result to a different data type',
      ],
      correct: 1,
      explain: 'Consider [1,10] followed by [2,3]: 2 ≤ 10 so they merge, but end=3 is smaller than the existing merged end of 10. Overwriting would wrongly shrink the interval to [1,3]; max() correctly keeps it at [1,10].',
    },
    {
      q: 'A variant asks for the minimum number of meeting rooms needed to host all given meetings (Meeting Rooms II) instead of the merged interval list. What changes about the approach?',
      options: [
        'Nothing — run the exact same merge sweep and count the output list length',
        'The problem needs peak concurrent overlap, not merged ranges — typically solved by separately sorting start/end times (or a min-heap of end times) and counting how many meetings are simultaneously in progress, not by merging',
        'It can only be solved with dynamic programming',
        'You must first convert all meetings into a graph and run BFS',
      ],
      correct: 1,
      explain: 'Merging collapses overlapping intervals into fewer ranges, losing the concurrency count. Meeting Rooms II needs the maximum number of intervals active at the same instant, which requires tracking starts and ends as separate events, not merging them together.',
    },
    {
      q: 'Given intervals [[1,4],[4,5]], does the canonical algorithm merge them into a single [1,5], and why?',
      options: [
        'No — 4 is not strictly less than 4, so they stay separate',
        'Yes — the merge condition uses `start <= tail.end`, and touching endpoints (4 <= 4) count as overlapping per LeetCode 56\'s definition',
        'It depends on the order they appear in the input',
        'No — merging touching intervals is undefined behavior',
      ],
      correct: 1,
      explain: 'The <= (not <) comparison is deliberate: LeetCode 56 defines intervals that merely touch at an endpoint as overlapping, so [1,4] and [4,5] merge into [1,5]. Using strict < would leave them incorrectly unmerged.',
    },
  ],
};
