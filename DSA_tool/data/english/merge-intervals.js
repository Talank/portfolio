window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['merge-intervals'] = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  titleNe: 'Dashain tika — merging invites whose times overlap',
  intro: 'sort by start, then sweep once, merging anything that overlaps',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Input is a list of <b>ranges</b>: <code>[start, end]</code> — times, bookings, reservations.',
        'Words like overlap, merge, conflict, “minimum rooms”, “free time”.',
        'Almost always step 1 is the same: <b>sort by start</b>.',
      ],
      narration: "Now Merge Intervals — the pattern most tied to real life. Here's a Dashain story. Five houses invite you for tika — your maternal uncle's from eleven to one, your elder uncle's from twelve to two, your aunt's from three-thirty to five. How many separate trips do you need? The maternal uncle's and elder uncle's times overlap — you can cover both in one outing, one long block, eleven to two. The aunt's is separate. That's merging. The moment you see words like ranges, bookings, meetings, overlap, or conflict, reach for this pattern. And the first step is almost always the same — sort by start time.",
    },
    {
      heading: 'Story: Why sorting first changes everything',
      bullets: [
        'Unsorted: any interval might clash with any other → O(n²) pairwise checks.',
        'Sorted by start: an overlap can <b>only</b> be with the interval right before you.',
        'So one linear sweep after sorting is enough.',
      ],
      narration: "Why is sorting the first move? Without sorting, any invitation's time could clash with any other — checking all pairs is O(n squared). But once you order them by start, magic happens: now if an invitation overlaps anything, it can only overlap the block right before it. Because everything earlier started even sooner — and that previous block already absorbed those. So after sorting, one single sweep is enough — for each new interval you just ask: do you fall inside the current block, or are you separate? Total cost O(n log n) — just the cost of the sort.",
    },
    {
      heading: 'Mnemonic',
      big: '“Sort first — if they touch, join; if not, drop and start anew.”',
      bullets: [
        'Overlap test (after sorting): <code>new.start &lt;= current.end</code>',
        'Merge: <code>current.end = max(current.end, new.end)</code>',
        'Else: push current, start a fresh block.',
      ],
      narration: "The hook: sort first, and if they touch, join; if not, drop and start anew. How do you know they touch? If the new one's start is less than or equal to the current block's end, they touch. How do you join? Extend the end — but be careful, take the max, because the new interval might be fully swallowed inside the old one, and in that case the end must not shrink back. That max is the most famous bug in this pattern. If they don't touch, push the current block into the result and start a fresh one.",
    },
    {
      heading: 'Python template',
      code: 'def merge(intervals):\n    intervals.sort(key=lambda iv: iv[0])   # sort first\n    merged = []\n    for iv in intervals:\n        if merged and iv[0] <= merged[-1][1]:          # touch?\n            merged[-1][1] = max(merged[-1][1], iv[1])  # join (max!)\n        else:\n            merged.append(iv)                          # drop — new block\n    return merged',
      narration: "The template is short — sort, then one for loop. Comparing only against the last block in merged is enough; we proved that on the previous slide. One subtle question comes up in interviews — what about intervals that merely touch at the edge, say one ending at one o'clock and another starting exactly at one — join them or not? It depends on the problem: for bookings you usually join, otherwise you ask. In code that's the single-character decision between less-than-or-equal and strict less-than — so ask before you write it.",
    },
    {
      heading: 'Watch out! The famous variants',
      bullets: [
        '<b>Meeting Rooms II</b> (min rooms): don’t merge — sort starts and ends separately, sweep counting +1/−1.',
        '<b>Insert Interval</b>: list already sorted — before / overlapping / after, three phases.',
        '<b>Employee Free Time</b>: merge everything, then read the <i>gaps</i>.',
      ],
      narration: "Get to know three famous problems in this family. Meeting Rooms Two asks how many rooms you need — here you don't merge, you count: plus one at every start, minus one at every end, and track the biggest crowd. It's like a wedding at a party palace — how many tables you need is just the largest number of guests present at one moment. Insert Interval gives you an already-sorted list — don't waste O(n log n) re-sorting it; in three phases it's O(n) — copy the ones before, merge the overlapping ones, copy the ones after. And Employee Free Time — once you've merged all the busy times, the gaps in between are the answer. Learn to merge, and the free time falls out for free.",
    },
  ],
};
