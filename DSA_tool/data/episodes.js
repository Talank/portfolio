/* One Piece Episodes — Blind 75 (+ roadmap-filler) problems retold as fully
   original short scenes: character dialogue, an animated prop board, and
   sound cues. All writing, character portraits (data/characters.js) and
   audio (js/audio-engine.js) are original work made for this site — no
   copyrighted OST, voice clips, or fan art are embedded anywhere.
   Consumed by js/episode-engine.js on episode.html. */

(function () {
  'use strict';

  const E = {};

  E['two-sum'] = {
    id: 'two-sum',
    epNumber: 1,
    title: 'The Twin-Chest Riddle',
    patternId: 'hashing-patterns',
    leetcode: { name: 'Two Sum', number: 1, difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
    problem: 'Given a list of numbers and a target value, return the indices of the two numbers that add up to the target exactly. Assume exactly one valid pair exists, and the same element can\'t be used twice.',
    example: 'nums = [3, 2, 4], target = 6  →  answer: [1, 2]  (2 + 4 = 6)',

    // Prop board: three treasure chests, laid out left to right.
    h: 210,
    props: [
      { id: 'c0', emoji: '🧰', label: '300k', x: 22, y: 40 },
      { id: 'c1', emoji: '🧰', label: '200k', x: 50, y: 40 },
      { id: 'c2', emoji: '🧰', label: '400k', x: 78, y: 40 }
    ],
    ledger: [
      { id: 'L0', x: 22, y: 78 },
      { id: 'L1', x: 50, y: 78 },
      { id: 'L2', x: 78, y: 78 }
    ],

    steps: [
      {
        speaker: 'luffy', pos: 'left',
        line: "The merchant wants exactly 600,000 Berries for the map piece — not a coin more, not a coin less — and he only accepts TWO chests at once!",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "There are only three chests here, so we could just try every pair by hand... but that gets ugly fast if there are hundreds of them.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then let's not check every pair. I'll remember every chest we've already opened — and for each new one, I only need to ask: 'have I already seen the amount that completes it?'",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Chest one: 300,000. I need 300,000 more to reach the target — nothing in my notes yet. I'll log it and move on.",
        p: { c0: 'lit', L0: 'lit' }, l: { L0: '300k seen' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Chest two: 200,000. I need 400,000 more — still nothing logged that matches. Log this one too.",
        p: { c0: 'dim', c1: 'lit', L1: 'lit' }, l: { L1: '200k seen' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Chest three: 400,000. I need 200,000 more to complete it — and that's already in my notes, from chest two!",
        p: { c1: 'lit', c2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Chest two and chest three — 200,000 plus 400,000 is exactly 600,000. That's the pair.",
        p: { c1: 'good', c2: 'good', L1: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "SHISHISHI! And you never even touched chest one again! Meat time!",
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That's the whole trick: check the notes before you write anything new down, and you only ever look at each chest once. One pass, one pair — never re-comparing chests against each other directly.",
        sfx: null
      }
    ],

    complexity: 'Time: O(n) — a single pass, one hash-map lookup and one insert per chest. Space: O(n) for the ledger (hash map) in the worst case.',
    pitfall: 'Log the current chest AFTER checking for its complement, not before — otherwise a target that is exactly double one value (e.g. target=6, chest=3) would incorrectly pair a chest with itself.',
    solution: `def two_sum(nums, target):
    seen = {}  # value -> index, i.e. "chests already opened"
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i  # log AFTER checking, so a chest never pairs with itself
    return []`
  };

  E['two-sum-ii'] = {
    id: 'two-sum-ii',
    epNumber: 2,
    title: 'The Keel of the Thousand Sunny',
    patternId: 'two-pointers',
    leetcode: { name: 'Two Sum II — Input Array Is Sorted', number: 167, difficulty: 'Medium', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' },
    problem: 'Given a list of numbers already sorted in ascending order and a target value, return the 1-indexed positions of the two numbers that add up to the target exactly, using O(1) extra space.',
    example: 'numbers = [4, 7, 9, 13, 16, 20], target = 25  →  answer: [3, 5]  (9 + 16 = 25)',

    // Prop board: six salvaged iron plates racked lightest to heaviest.
    h: 210,
    props: [
      { id: 'p0', emoji: '⚙️', label: '4', x: 8, y: 36 },
      { id: 'p1', emoji: '⚙️', label: '7', x: 26, y: 36 },
      { id: 'p2', emoji: '⚙️', label: '9', x: 44, y: 36 },
      { id: 'p3', emoji: '⚙️', label: '13', x: 62, y: 36 },
      { id: 'p4', emoji: '⚙️', label: '16', x: 80, y: 36 },
      { id: 'p5', emoji: '⚙️', label: '20', x: 98, y: 36 }
    ],
    ledger: [
      { id: 'L', emoji: '👈', x: 32, y: 78 },
      { id: 'R', emoji: '👉', x: 68, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Iceburg's blueprint says the crossbeam brace needs two salvaged plates that weigh EXACTLY 25 stone together. Over or under and the whole frame's stress rating is wrong.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Six plates on the rack, already sorted lightest to heaviest. We are NOT weighing every possible pair — that's fifteen trips up this ladder.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Lightest plate and heaviest plate, together: 4 plus 20 is 24. One short. The only honest fix is the light end giving us more.",
        p: { p0: 'lit', p5: 'lit', L: 'lit', R: 'lit' }, l: { L: '4', R: '20' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Then I step in from the light end — plate 7 instead of plate 4.",
        p: { p0: 'dim', p1: 'lit' }, l: { L: '7' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "7 plus 20 is 27 — now we're over. Heavy end steps down.",
        p: { p5: 'dim', p4: 'lit' }, l: { R: '16' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "7 plus 16 is 23 — short again. Light end steps in once more, to plate 9.",
        p: { p1: 'dim', p2: 'lit' }, l: { L: '9' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "9 plus 16 is 25. Exact. Plates three and five come off the rack.",
        p: { p2: 'good', p4: 'good' }, l: { L: '9 ✓', R: '16 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And plate 4, plate 20 — never touched again after we stepped past them. Once an end steps inward, it never steps back out. That's the whole trick, Iceburg-san!",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — the two ends together cross the array once, each index visited at most once. Space: O(1) — just two index variables, no hash map, because sortedness does the work a hash map would otherwise do.',
    pitfall: 'Moving the wrong end: if the sum is too small you must move the LEFT pointer inward (to a bigger value), not the right one. Moving the wrong pointer can step past the only valid pair.',
    solution: `def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]  # 1-indexed
        elif total < target:
            left += 1   # too small: only a bigger LEFT value can help
        else:
            right -= 1  # too big: only a smaller RIGHT value can help
    return []`
  };

  E['longest-substring'] = {
    id: 'longest-substring',
    epNumber: 3,
    title: "Bink's Sake, Never Twice in a Row",
    patternId: 'sliding-window',
    leetcode: { name: 'Longest Substring Without Repeating Characters', number: 3, difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
    problem: 'Given a string, find the length of the longest contiguous substring in which no character repeats.',
    example: 's = "BINKBS"  →  answer: 5  ("INKBS", starting from the second letter)',

    // Prop board: six notes of a half-remembered tune, left to right.
    h: 220,
    props: [
      { id: 'n0', emoji: '🎵', label: 'B', x: 8, y: 34 },
      { id: 'n1', emoji: '🎵', label: 'I', x: 26, y: 34 },
      { id: 'n2', emoji: '🎵', label: 'N', x: 44, y: 34 },
      { id: 'n3', emoji: '🎵', label: 'K', x: 62, y: 34 },
      { id: 'n4', emoji: '🎵', label: 'B', x: 80, y: 34 },
      { id: 'n5', emoji: '🎵', label: 'S', x: 98, y: 34 }
    ],
    ledger: [
      { id: 'win', emoji: '📜', x: 32, y: 78 },
      { id: 'best', emoji: '🏆', x: 74, y: 78 }
    ],

    steps: [
      {
        speaker: 'brook', pos: 'right',
        line: "Fifty years alone on the Rumbar's deck, and I only had this much of the melody left in my head — I promised Laboon I'd play the whole thing someday. Yohoho.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'left',
        line: "But some of the notes repeat! If I hum a note twice in the same phrase it sounds muddy — you said so yourself. What's the LONGEST clean run in here, with no note repeated?",
        sfx: null
      },
      {
        speaker: 'brook', pos: 'right',
        line: "First note: B. A phrase of one, and it's clean so far.",
        p: { n0: 'lit', win: 'lit', best: 'lit' }, l: { win: 'B', best: '1' },
        sfx: 'chime'
      },
      {
        speaker: 'brook', pos: 'right',
        line: "I, then N, then K — none of them repeat anything still ringing in the phrase. The window just keeps growing to the right.",
        p: { n1: 'lit', n2: 'lit', n3: 'lit' }, l: { win: 'B-I-N-K', best: '4' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'left',
        line: "Next note's a B again — and we already have one ringing, back at the start of the phrase!",
        sfx: null
      },
      {
        speaker: 'brook', pos: 'right',
        line: "So the phrase can no longer start before the note right after that old B. Drop it from the front — the window's left edge jumps forward, not one note at a time, straight to where it needs to be.",
        p: { n0: 'dim', n4: 'lit' }, l: { win: 'I-N-K-B', best: '4' },
        sfx: 'pop'
      },
      {
        speaker: 'brook', pos: 'right',
        line: "Last note: S. Nothing in the current phrase repeats it — the window grows again, and this is the longest clean run yet.",
        p: { n5: 'lit' }, l: { win: 'I-N-K-B-S', best: '5' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'left',
        line: "Five notes, never checking a note twice against the whole phrase — just remembering the last place you saw each one. That's amazing, Brook!",
        p: { n1: 'good', n2: 'good', n3: 'good', n4: 'good', n5: 'good' },
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — each note enters the window once and the left edge only ever moves forward, so the whole scan is a single pass. Space: O(min(n, alphabet size)) for the last-seen-index map.',
    pitfall: 'Shrinking the window one note at a time from the left instead of jumping the left edge directly to (last seen index of the repeat) + 1 — it still works, but throws away the O(1)-per-step jump that makes the single-pass argument clean.',
    solution: `def length_of_longest_substring(s: str) -> int:
    last_seen = {}   # character -> most recent index
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1   # jump the window's left edge past the old repeat
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best`
  };

  E['linked-list-cycle'] = {
    id: 'linked-list-cycle',
    epNumber: 4,
    title: 'The Fog That Never Lets Go',
    patternId: 'fast-slow-pointers',
    leetcode: { name: 'Linked List Cycle', number: 141, difficulty: 'Easy', url: 'https://leetcode.com/problems/linked-list-cycle/' },
    problem: 'Given the head of a linked list, determine whether it contains a cycle — some node\'s "next" pointer leads back to a node already visited — using O(1) extra space.',
    example: 'A → B → C → D → E → (back to C)  →  answer: True, the route loops forever starting at C',

    // Prop board: two charted waypoints (A, B) leading into a loop of three (C, D, E → back to C).
    h: 240,
    props: [
      { id: 'wA', emoji: '🛟', label: 'A', x: 8, y: 60 },
      { id: 'wB', emoji: '🛟', label: 'B', x: 26, y: 60 },
      { id: 'wC', emoji: '🌫️', label: 'C', x: 50, y: 20 },
      { id: 'wD', emoji: '🌫️', label: 'D', x: 82, y: 38 },
      { id: 'wE', emoji: '🌫️', label: 'E', x: 66, y: 82 }
    ],
    ledger: [
      { id: 'Slow', emoji: '🦌', x: 30, y: 100 },
      { id: 'Fast', emoji: '⚡', x: 70, y: 100 }
    ],

    steps: [
      {
        speaker: 'luffy', pos: 'left',
        line: "Ships go into the Florian Triangle's fog and just... never come back out, right? Let's find out if our OWN charted course is one of those loops before we sail it for real.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "I'll walk the route at normal speed, one waypoint per minute. You go Gear Second — two waypoints a minute. If the course loops, you'll catch up to me eventually. If it doesn't, you just sail off the edge of the chart and we're done.",
        p: { wA: 'lit', Slow: 'lit', Fast: 'lit' }, l: { Slow: 'A', Fast: 'A' },
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "One minute in: I'm already two waypoints ahead, at C. You're only at B.",
        p: { wA: 'dim', wB: 'lit', wC: 'lit' }, l: { Slow: 'B', Fast: 'C' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two minutes: I've reached C. You've raced ahead to E — through D. If this route were a straight line to open sea, you'd just keep pulling away from me forever.",
        p: { wB: 'dim', wC: 'lit', wD: 'lit', wE: 'lit' }, l: { Slow: 'C', Fast: 'E' },
        sfx: 'pop'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "But it's NOT a straight line — past E, the fog loops back to C! So my next two steps put me right back at D... and you're walking into D too!",
        p: { wC: 'dim', wD: 'lit', wE: 'dim' }, l: { Slow: 'D', Fast: 'D' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "We're standing on the same waypoint. The fast route lapped the slow one — that ONLY happens if the course loops. It's the Florian Triangle, alright. We chart around it.",
        p: { wD: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "SHISHISHI, no ghost ship's getting the Sunny! And I didn't even need a map of every waypoint we'd already visited — just two speeds!",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — once the slow pointer enters a cycle of length k, the fast pointer closes the gap by one node per step, so they meet within k steps. Space: O(1) — two pointers, no visited-set needed.',
    pitfall: 'Advancing the fast pointer without checking `fast.next` first — on a list with no cycle, fast reaches the end and `fast.next.next` crashes on None unless both `fast` and `fast.next` are checked every iteration.',
    solution: `def has_cycle(head) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next          # walk ×1
        fast = fast.next.next     # walk ×2
        if slow is fast:          # compare identity, not value
            return True
    return False`
  };

  E['merge-intervals-ep'] = {
    id: 'merge-intervals-ep',
    epNumber: 5,
    title: 'The Three Open Hours of Alubarna',
    patternId: 'merge-intervals',
    leetcode: { name: 'Merge Intervals', number: 56, difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/' },
    problem: 'Given a list of intervals, merge all overlapping intervals and return the resulting set of non-overlapping intervals.',
    example: 'intervals = [[2,5],[4,8],[11,13],[12,16]]  →  answer: [[2,8],[11,16]]',

    // Prop board: four Baroque Works patrol shifts along the palace wall, sorted by start hour.
    h: 210,
    props: [
      { id: 'g0', emoji: '🏰', label: '2–5', x: 12, y: 36 },
      { id: 'g1', emoji: '🏰', label: '4–8', x: 36, y: 36 },
      { id: 'g2', emoji: '🏰', label: '11–13', x: 62, y: 36 },
      { id: 'g3', emoji: '🏰', label: '12–16', x: 88, y: 36 }
    ],
    ledger: [
      { id: 'gap', emoji: '🕳️', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'zoro', pos: 'left',
        line: "We stole Baroque Works' patrol logs. Four watch shifts on the palace wall, sorted by the hour each one starts. We need to get Vivi's group in through a gap in the watch — not fight through it.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "First shift: hours 2 to 5.",
        p: { g0: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Next shift starts at hour 4 — before the first one even ends at 5. That's not a second watch, that's the SAME watch overlapping. Merge them: 2 to 8.",
        p: { g1: 'off' }, l: { g0: '2–8' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Hour 11 starts after hour 8 — nobody's watching in between. New block.",
        p: { g0: 'good', g2: 'lit' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "But hour 12 overlaps THAT one before it's done at 13. Merge again: 11 to 16.",
        p: { g3: 'off' }, l: { g2: '11–16' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Two guarded stretches, start to finish: 2 to 8, and 11 to 16. Everything else — including the three hours between 8 and 11 — is open air.",
        p: { g2: 'good', gap: 'lit' }, l: { gap: 'open: 8–11' },
        sfx: 'victory'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "We didn't need to know who was on which shift, or when any ONE guard blinks. Just where the merged blocks end — and where they don't reach. That's our window.",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n log n) — dominated by the sort; the merge sweep itself is a single O(n) pass once shifts are ordered by start hour. Space: O(n) for the output list of merged blocks.',
    pitfall: 'Comparing the next interval\'s start against the PREVIOUS interval\'s original end instead of the merged block\'s (possibly extended) end — always extend with `max(current_end, next_end)`, never overwrite it, or a later, shorter interval can silently shrink an already-merged block.',
    solution: `def merge(intervals):
    intervals.sort(key=lambda pair: pair[0])   # sort by start hour
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:                  # overlaps (or touches) the open block
            merged[-1] = [last_start, max(last_end, end)]
        else:
            merged.append([start, end])         # a genuine gap — new block
    return merged`
  };

  E['search-rotated-sorted-array'] = {
    id: 'search-rotated-sorted-array',
    epNumber: 6,
    title: 'The Spun Shelf Beneath Alubarna',
    patternId: 'binary-search',
    leetcode: { name: 'Search in Rotated Sorted Array', number: 33, difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
    problem: 'A once-sorted array has been rotated at an unknown pivot. Given the rotated array and a target value, find the target\'s index in O(log n) time, or return -1 if it isn\'t present.',
    example: 'nums = [50, 60, 70, 10, 20, 30, 40], target = 20  →  answer: index 4',

    // Prop board: seven scrolls on a rotating stone shelf beneath Alubarna.
    h: 220,
    props: [
      { id: 's0', emoji: '📜', label: '50', x: 6, y: 36 },
      { id: 's1', emoji: '📜', label: '60', x: 21, y: 36 },
      { id: 's2', emoji: '📜', label: '70', x: 36, y: 36 },
      { id: 's3', emoji: '📜', label: '10', x: 51, y: 36 },
      { id: 's4', emoji: '📜', label: '20', x: 66, y: 36 },
      { id: 's5', emoji: '📜', label: '30', x: 81, y: 36 },
      { id: 's6', emoji: '📜', label: '40', x: 96, y: 36 }
    ],
    ledger: [
      { id: 'range', emoji: '📐', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The old dynasty stored these scrolls by year, earliest to latest. Then the tremor spun this shelf — it's no longer sorted start to end, but it's not random either. We want the scroll marked 20.",
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "So how do we search a sorted shelf that isn't sorted anymore?!",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "We still check the middle first. Scroll three: '10'.",
        p: { s3: 'lit' }, l: { range: '[0,6]' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The FIRST scroll reads '50', bigger than the middle one — that proves the left side is the half that got wrapped around. The right side, 10 through 40, is still in honest year order, and 20 falls inside that range. So we hunt to the right.",
        p: { s0: 'dim', s1: 'dim', s2: 'dim', s3: 'dim', s4: 'lit' }, l: { range: '[4,6]' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Middle of what's left: scroll five, '30'. Our target is smaller, and this little stretch is still sorted — so 20 has to sit before it.",
        p: { s5: 'lit' }, l: { range: '[4,4]' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which leaves exactly one scroll. Scroll four: '20'. Found.",
        p: { s4: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "Three checks for seven scrolls! ...but how did you know WHICH half was the honest one?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A single rotation only ever breaks the order in one place. So at every split, at least one half is still perfectly sorted — I just compare its two ends to know which one to trust, and rule out the other half entirely.",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(log n) — each comparison discards one whole half, exactly like ordinary binary search; the rotation only changes WHICH half is guaranteed sorted, not how much work is done. Space: O(1).',
    pitfall: 'Comparing `nums[mid]` only against `target` and forgetting to first check `nums[lo] <= nums[mid]` to figure out which half is actually sorted — skip that check and you can throw away the half the target is really in.',
    solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:            # left half [lo..mid] is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                # right half [mid..hi] is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`
  };

  // ---- Monotonic Stack: four episodes, since it's the pattern people bounce off hardest ----

  E['daily-temperatures'] = {
    id: 'daily-temperatures',
    epNumber: 7,
    title: 'The Corrida Colosseum Undercard',
    patternId: 'monotonic-stack',
    leetcode: { name: 'Daily Temperatures', number: 739, difficulty: 'Medium', url: 'https://leetcode.com/problems/daily-temperatures/' },
    problem: 'Given a list of daily temperatures, return a list where answer[i] is the number of days you must wait after day i to see a strictly warmer day. If no such day ever comes, put 0.',
    example: 'temps = [73, 74, 75, 71, 69, 72, 76, 73]  →  answer: [1, 1, 4, 2, 1, 1, 0, 0]',

    // Prop board: eight gladiators entering the Corrida ring in order, by power.
    h: 220,
    props: [
      { id: 'g0', emoji: '🤺', label: '73', x: 6, y: 34 },
      { id: 'g1', emoji: '🤺', label: '74', x: 19, y: 34 },
      { id: 'g2', emoji: '🤺', label: '75', x: 32, y: 34 },
      { id: 'g3', emoji: '🤺', label: '71', x: 45, y: 34 },
      { id: 'g4', emoji: '🤺', label: '69', x: 58, y: 34 },
      { id: 'g5', emoji: '🤺', label: '72', x: 71, y: 34 },
      { id: 'g6', emoji: '🤺', label: '76', x: 84, y: 34 },
      { id: 'g7', emoji: '🤺', label: '73', x: 97, y: 34 }
    ],
    ledger: [
      { id: 'stack', emoji: '📋', x: 30, y: 80 },
      { id: 'resolved', emoji: '🔔', x: 74, y: 80 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'right',
        line: "LADIES AND GENTLEMEN! Corrida Colosseum block battle undercard! Bring me every gladiator's power reading as they step in, one at a time, and I've gotta tell the crowd: how many MORE entrances until somebody finally tops THIS one?!",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "First in: power 73. Nobody's beaten him yet — he goes on my 'still waiting' list, on top.",
        p: { g0: 'lit', stack: 'lit', resolved: 'lit' }, l: { stack: '[73]', resolved: '—' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Power 74 steps in — stronger than 73! That settles it: gladiator one is topped after exactly ONE more entrance. He's off my list; 74 takes his spot.",
        p: { g0: 'bad', g1: 'lit' }, l: { stack: '[74]', resolved: 'g0 waited 1' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "75 tops 74 — same story, ONE entrance later. 75 takes the spot on my list now.",
        p: { g1: 'bad', g2: 'lit' }, l: { stack: '[75]', resolved: 'g1 waited 1' },
        sfx: 'pop'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "71's nowhere near strong enough to touch 75!",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Right — so he doesn't knock anyone out. He just joins the waiting list BEHIND 75. Both stay up, and my list is no longer just one name — it's ordered strongest-first.",
        p: { g3: 'lit' }, l: { stack: '[75, 71]' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "69's weaker still — joins the back of the list too. Three unresolved gladiators now, strictly getting weaker toward the back.",
        p: { g4: 'lit' }, l: { stack: '[75, 71, 69]' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Now 72 walks in. He beats 69 at the BACK of my list — one entrance, resolved. Then he beats 71 too — that one waited TWO entrances. But he does NOT beat 75, still standing at the front. Two knockouts, one arrival.",
        p: { g4: 'bad', g3: 'bad', g5: 'lit' }, l: { stack: '[75, 72]', resolved: 'g4 waited 1, g3 waited 2' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "76 flattens what's left of my list — beats 72 (one entrance) AND beats 75, who'd been waiting since gladiator two — FOUR entrances. The whole list is empty. 76 stands alone.",
        p: { g5: 'bad', g2: 'bad', g6: 'lit' }, l: { stack: '[76]', resolved: 'g5 waited 1, g2 waited 4' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Last one in: 73. Doesn't beat 76. Joins the list — and the show's over before anyone tops him.",
        p: { g7: 'lit' }, l: { stack: '[76, 73]' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Gladiator six and seven — 76 and 73 — nobody ever showed up to beat them. Their wait stays 0. And notice: I never once rewound the tape to recheck an earlier fighter. Every gladiator gets resolved the SECOND somebody stronger walks in — or never.",
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "SHISHISHI, so the 'wait' list only ever GROWS at the back and gets chopped from the top — you never have to go digging through the middle!",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) amortized — every index is pushed exactly once and popped at most once across the whole run, so total stack operations are bounded by 2n even though a single arrival can trigger several pops. Space: O(n) worst case (a strictly falling sequence never pops, so everyone stays on the list).',
    pitfall: 'Using <= instead of < in the while condition: an EQUAL temperature is not "warmer," so popping on ties silently assigns a wait count to a day that never actually saw a strictly hotter day.',
    solution: `def daily_temperatures(temps):
    answer = [0] * len(temps)
    stack = []  # indices, strictly decreasing temperatures — the "still waiting" list
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j       # resolved the instant someone stronger arrives
        stack.append(i)
    return answer`
  };

  E['next-greater-element-ii'] = {
    id: 'next-greater-element-ii',
    epNumber: 8,
    title: "Big Mom's Round Tea Table",
    patternId: 'monotonic-stack',
    leetcode: { name: 'Next Greater Element II', number: 503, difficulty: 'Medium', url: 'https://leetcode.com/problems/next-greater-element-ii/' },
    problem: 'Given a CIRCULAR array of numbers, return an array where result[i] is the next number greater than nums[i], searching forward and wrapping past the end back to the start if needed. If none exists even after wrapping, put -1.',
    example: 'nums = [5, 3, 8, 3, 6]  (circular)  →  answer: [8, 8, -1, 6, 8]',

    // Prop board: five treats arranged clockwise around Big Mom's round tea table.
    h: 260,
    props: [
      { id: 't0', emoji: '🍰', label: '5', x: 50, y: 8 },
      { id: 't1', emoji: '🍰', label: '3', x: 88, y: 34 },
      { id: 't2', emoji: '🍰', label: '8', x: 74, y: 82 },
      { id: 't3', emoji: '🍰', label: '3', x: 26, y: 82 },
      { id: 't4', emoji: '🍰', label: '6', x: 12, y: 34 }
    ],
    ledger: [
      { id: 'stack', emoji: '📋', x: 30, y: 104 },
      { id: 'note', emoji: '📝', x: 74, y: 104 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'left',
        line: "Big Mom's tea table is ROUND — five treats, tier heights 5, 3, 8, 3, 6, going clockwise from the top. For each treat, what's the next TALLER one clockwise? And since the table's a circle, 'next' is allowed to wrap all the way back around to the start!",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "First treat: 5 layers. Nothing taller has shown up yet — it just waits.",
        p: { t0: 'lit', stack: 'lit', note: 'lit' }, l: { stack: '[5]', note: 'lap 1' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Next, clockwise: 3 layers. Shorter than 5 — it just joins behind it on the wait list.",
        p: { t1: 'lit' }, l: { stack: '[5, 3]' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Third treat: 8 layers — taller than the 3 right behind it in line, AND taller than the 5 before that. Both resolve at once, answer 8 for each. The wait list is empty again.",
        p: { t1: 'good', t0: 'good', t2: 'lit' }, l: { stack: '[8]', note: 'treat1→8, treat0→8' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fourth: 3 layers again. Shorter than 8 — waits.",
        p: { t3: 'lit' }, l: { stack: '[8, 3]' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fifth: 6 layers. Taller than the 3 waiting behind it — that one resolves, answer 6. But NOT taller than the 8 still standing before it, so that one keeps waiting.",
        p: { t3: 'good', t4: 'lit' }, l: { stack: '[8, 6]', note: 'treat3→6' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'left',
        line: "We're back at the top of the table — but the 8-layer treat is STILL undefeated, and the 6-layer one is still waiting behind it. Since it's round, we just... keep going?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly — one more lap. Passing the 5-layer and 3-layer treats again changes nothing, they're already resolved. But passing the 8-layer treat a SECOND time — it finally tops the 6-layer treat still waiting behind it. Found by wrapping around.",
        p: { t4: 'good' }, l: { stack: '[8]', note: 'treat4→8 (found on lap 2!)' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One treat never gets topped, even after two full laps — the 8-layer one itself. Its answer stays 'none.' And we only ever circled the table TWICE total, not once per treat — still O(n), not O(n²).",
        p: { t2: 'good' }, l: { note: 'treat2→ none, ever' },
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "So a round table just means: walk it twice instead of once, but the stack doesn't care that it's round at all!",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — simulating two laps (2n iterations) over an n-element decreasing stack, each index still pushed once and popped at most once across the whole run. Space: O(n) for the stack and output.',
    pitfall: 'Physically duplicating the array in memory (nums + nums) to fake the wraparound — it works, but doubles the space for no reason. The idiomatic fix is iterating `i` from 0 to 2n-1 and indexing with `nums[i % n]`, leaving the array itself untouched.',
    solution: `def next_greater_elements(nums):
    n = len(nums)
    result = [-1] * n
    stack = []  # indices, decreasing values — the "still waiting" list
    for i in range(2 * n):            # two laps around the table
        idx = i % n
        while stack and nums[stack[-1]] < nums[idx]:
            top = stack.pop()
            result[top] = nums[idx]   # resolved — possibly by something earlier in the array
        if i < n:                     # only push new indices on the first lap
            stack.append(idx)
    return result`
  };

  E['largest-rectangle-histogram'] = {
    id: 'largest-rectangle-histogram',
    epNumber: 9,
    title: 'The Widest Tarp on Dock One',
    patternId: 'monotonic-stack',
    leetcode: { name: 'Largest Rectangle in Histogram', number: 84, difficulty: 'Hard', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/' },
    problem: 'Given a row of bars with given heights (all the same width, 1 unit each), find the area of the largest rectangle that fits entirely under the bars\' outline.',
    example: 'heights = [2, 1, 5, 6, 2, 3]  →  answer: 10  (the 5-tall and 6-tall stacks together, at height 5, width 2)',

    // Prop board: six stacks of salvaged lumber, varying heights, along the dock.
    h: 220,
    props: [
      { id: 'h0', emoji: '🪵', label: '2', x: 6, y: 40 },
      { id: 'h1', emoji: '🪵', label: '1', x: 24, y: 40 },
      { id: 'h2', emoji: '🪵', label: '5', x: 42, y: 40 },
      { id: 'h3', emoji: '🪵', label: '6', x: 60, y: 40 },
      { id: 'h4', emoji: '🪵', label: '2', x: 78, y: 40 },
      { id: 'h5', emoji: '🪵', label: '3', x: 96, y: 40 }
    ],
    ledger: [
      { id: 'stack', emoji: '📋', x: 30, y: 80 },
      { id: 'best', emoji: '🏆', x: 74, y: 80 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Dock One's got six stacks of salvaged lumber, different heights, lined up in a row. Iceburg wants ONE tarp — a single rectangle — laid across as many CONSECUTIVE stacks as possible. Snag is, the tarp can only stand as tall as the SHORTEST stack it covers, or it sags into the gap.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "First stack: 2 feet. Nothing to compare yet — just note it and keep going.",
        p: { h0: 'lit', stack: 'lit', best: 'lit' }, l: { stack: '[2]', best: '0' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Second stack: only 1 foot — shorter than the first! That means the 2-foot stack can NEVER anchor a tarp past this point. Close it out right now: 2 feet tall, exactly 1 stack wide. 2 square feet — our best so far.",
        p: { h0: 'good', h1: 'lit' }, l: { stack: '[1]', best: '2' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Third: 5 feet — taller than the 1-foot stack waiting. No closing yet, just stack it onto the wait list.",
        p: { h2: 'lit' }, l: { stack: '[1, 5]' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Fourth: 6 feet, taller still. The wait list keeps growing — strictly increasing heights, bottom to top.",
        p: { h3: 'lit' }, l: { stack: '[1, 5, 6]' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Fifth: only 2 feet. Shorter than BOTH the 6-footer and the 5-footer. First, the 6-foot stack closes out — by itself, just 1 stack wide: 6 square feet. Then the 5-foot stack closes out too — and now it stretches across where the 6-footer USED to stand: 5 tall, 2 wide, 10 square feet!",
        p: { h3: 'good', h2: 'good', h4: 'lit' }, l: { stack: '[1, 2]', best: '10' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Sixth and last: 3 feet, taller than what's waiting. Stack it — nothing closes yet.",
        p: { h5: 'lit' }, l: { stack: '[1, 2, 3]' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "No more stacks coming in — but three are STILL sitting on the wait list, and every single one still needs an answer. Close them out, right to left.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The 3-footer only ever had 1 stack under it: 3 square feet. The 2-footer, once the 3-foot stack is gone, actually spans FOUR stacks: 2 times 4 is 8. And the very FIRST stack we ever placed — 1 foot tall — once everything taller is cleared, spans the whole dock: all 6 stacks, 6 square feet.",
        p: { h5: 'good', h4: 'good', h1: 'good' }, l: { stack: '[]' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Biggest tarp on the whole dock: still 10 square feet, from stacks three and four. And that flush-at-the-end step — closing out whoever's LEFT once the stacks run out — is the part everybody forgets. The wait list doesn't resolve itself just because there's nothing new arriving.",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) amortized — same push-once-pop-at-most-once argument as Daily Temperatures, PLUS one final pass to flush and resolve whatever is still on the stack when the input ends. Space: O(n) for the stack.',
    pitfall: "Forgetting the flush-at-the-end step: any index still on the stack once the array is exhausted never triggered a pop mid-scan, but it still needs its area computed against the array's right edge — skip this and you silently miss the answer whenever the tallest bars are at the end.",
    solution: `def largest_rectangle_area(heights):
    stack = []           # indices, strictly increasing heights — the "still waiting" list
    best = 0
    n = len(heights)
    for i in range(n):
        while stack and heights[stack[-1]] >= heights[i]:
            h = heights[stack.pop()]
            left = stack[-1] if stack else -1      # new top = left boundary
            width = i - left - 1                    # current index = right boundary
            best = max(best, h * width)
        stack.append(i)
    while stack:                                    # flush: no more bars are coming
        h = heights[stack.pop()]
        left = stack[-1] if stack else -1
        width = n - left - 1
        best = max(best, h * width)
    return best`
  };

  E['online-stock-span'] = {
    id: 'online-stock-span',
    epNumber: 10,
    title: "Nami's Running Haul Ledger",
    patternId: 'monotonic-stack',
    leetcode: { name: 'Online Stock Span', number: 901, difficulty: 'Medium', url: 'https://leetcode.com/problems/online-stock-span/' },
    problem: 'Design a class that, given the price for the current day (one at a time, with no knowledge of future days), returns the "span" — the number of consecutive days ending with today, going backward, where the price was less than or equal to today\'s price.',
    example: 'prices arrive as: 100, 80, 60, 70, 60, 75, 85  →  spans: 1, 1, 1, 2, 1, 4, 6',

    // Prop board: seven days of treasure haul totals (thousands of Berries), revealed one at a time.
    h: 210,
    props: [
      { id: 'd0', emoji: '💰', label: '100', x: 6, y: 36 },
      { id: 'd1', emoji: '💰', label: '80', x: 21, y: 36 },
      { id: 'd2', emoji: '💰', label: '60', x: 36, y: 36 },
      { id: 'd3', emoji: '💰', label: '70', x: 51, y: 36 },
      { id: 'd4', emoji: '💰', label: '60', x: 66, y: 36 },
      { id: 'd5', emoji: '💰', label: '75', x: 81, y: 36 },
      { id: 'd6', emoji: '💰', label: '85', x: 96, y: 36 }
    ],
    ledger: [
      { id: 'stack', emoji: '📋', x: 30, y: 78 },
      { id: 'span', emoji: '📈', x: 74, y: 78 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'right',
        line: "Every day of this voyage, I log the day's total haul — and I want to know, the SECOND I write it down, how many days in a row, counting backward from today, were all worth LESS than or equal to today. No peeking ahead — I only know today's number when I log it.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 0: 100k. First entry, nothing behind it to compare. Span: 1.",
        p: { d0: 'lit', stack: 'lit', span: 'lit' }, l: { stack: '[(100,1)]', span: '1' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 1: 80k. Worse than yesterday — can't absorb anything behind it. Span: 1, on its own.",
        p: { d1: 'lit' }, l: { stack: '[(100,1), (80,1)]', span: '1' },
        sfx: 'pop'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "That's a bad haul day, Nami!",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 2: 60k. Even worse. Span: 1 again — three straight days now that just sit on the ledger, none of them beating the one before.",
        p: { d2: 'lit' }, l: { stack: '[(100,1), (80,1), (60,1)]', span: '1' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 3: 70k — beats yesterday's 60k! I don't just say 'span 1' — I ABSORB yesterday's whole span into mine: 1 (mine) plus 1 (theirs) is 2. But 70 does NOT beat day 1's 80k, so I stop absorbing there.",
        p: { d2: 'bad', d3: 'lit' }, l: { stack: '[(100,1), (80,1), (70,2)]', span: '2' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 4: 60k again — worse than yesterday's 70k. Can't absorb anything. Back down to span 1.",
        p: { d4: 'lit' }, l: { stack: '[(100,1), (80,1), (70,2), (60,1)]', span: '1' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 5: 75k. Beats yesterday's 60k — absorb its span of 1. THEN beats day 3's 70k too — and that one's span was already 2, since it had already absorbed day 2! Absorb that whole chain: 1 plus 1 plus 2 is 4. Stops there — 75 doesn't beat day 1's 80k.",
        p: { d4: 'bad', d3: 'bad', d5: 'lit' }, l: { stack: '[(100,1), (80,1), (75,4)]', span: '4' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 6: 85k — our best haul yet! Beats yesterday's 75k, absorbing its span of 4. THEN beats day 1's 80k too, absorbing its span of 1. Total: 1 plus 4 plus 1 is 6 — six days running, all at or below today, every single one of them chained together without ever re-reading a single day's price twice.",
        p: { d5: 'bad', d1: 'bad', d6: 'lit' }, l: { stack: '[(100,1), (85,6)]', span: '6' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "Only day 0's 100k is still standing above us! SHISHISHI, we're on a hot streak, Nami!",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(1) amortized per call to next(price) — each day\'s (price, span) pair is pushed once and popped at most once across the whole run, so total work across n calls is O(n). Space: O(n) for the stack.',
    pitfall: "Recomputing each popped day's span by re-scanning backward instead of just READING the span already stored with it on the stack — that throws away the whole point of storing (price, span) pairs and silently turns an O(1)-amortized call into an O(n) one.",
    solution: `class StockSpanner:
    def __init__(self):
        self.stack = []  # (price, span) pairs — the "still waiting" list

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            _, prev_span = self.stack.pop()
            span += prev_span    # absorb the whole chain behind it, already computed
        self.stack.append((price, span))
        return span`
  };

  // ---- Prefix Sum: four episodes covering build-once-query-many, prefix+hashmap counting,
  // the modulo variant, and the prefix/suffix-product generalization ----

  E['range-sum-query-immutable'] = {
    id: 'range-sum-query-immutable',
    epNumber: 11,
    title: "Nami's Running Voyage Ledger",
    patternId: 'prefix-sum',
    leetcode: { name: 'Range Sum Query - Immutable', number: 303, difficulty: 'Easy', url: 'https://leetcode.com/problems/range-sum-query-immutable/' },
    problem: 'Given an integer array that never changes, implement a class that answers many calls to sumRange(i, j) — the sum of elements from index i to j inclusive — as efficiently as possible.',
    example: 'distances = [5, 3, 8, 2, 6, 4]  →  sumRange(1, 3) = 13, sumRange(2, 5) = 20',

    // Prop board: six days of sailing distance, plus a running-total ledger row underneath.
    h: 230,
    props: [
      { id: 'd0', emoji: '⛵', label: '5', x: 8, y: 30 },
      { id: 'd1', emoji: '⛵', label: '3', x: 24, y: 30 },
      { id: 'd2', emoji: '⛵', label: '8', x: 40, y: 30 },
      { id: 'd3', emoji: '⛵', label: '2', x: 56, y: 30 },
      { id: 'd4', emoji: '⛵', label: '6', x: 72, y: 30 },
      { id: 'd5', emoji: '⛵', label: '4', x: 88, y: 30 }
    ],
    ledger: [
      { id: 'L0', emoji: '📒', x: 8, y: 72 },
      { id: 'L1', emoji: '📒', x: 24, y: 72 },
      { id: 'L2', emoji: '📒', x: 40, y: 72 },
      { id: 'L3', emoji: '📒', x: 56, y: 72 },
      { id: 'L4', emoji: '📒', x: 72, y: 72 },
      { id: 'L5', emoji: '📒', x: 88, y: 72 },
      { id: 'query', emoji: '🧮', x: 50, y: 100 }
    ],

    steps: [
      {
        speaker: 'luffy', pos: 'left',
        line: "Nami, how far did we sail between the crab island and the singing cliffs?",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Hang on — before I answer that by hand, I'm writing down a running total for the WHOLE voyage, once. Day 0: 5 miles. Running total after day 0: 5.",
        p: { d0: 'lit', L0: 'lit' }, l: { L0: '5' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 1: 3 more miles. I don't just note '3' — I write the NEW total: 5 plus 3 is 8. Day 2: 8 more, total 16.",
        p: { d1: 'lit', d2: 'lit', L1: 'lit', L2: 'lit' }, l: { L1: '8', L2: '16' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Day 3: 2 more, total 18. Day 4: 6 more, total 24. Day 5: 4 more, total 28. Ledger's done — built ONCE, in a single pass down the whole voyage.",
        p: { d3: 'lit', d4: 'lit', d5: 'lit', L3: 'lit', L4: 'lit', L5: 'lit' }, l: { L3: '18', L4: '24', L5: '28' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So: how far from day 1 to day 3? I don't re-add a single mile. Running total AFTER day 3, minus running total BEFORE day 1 — which is just the total after day 0. 18 minus 5 is 13.",
        p: { L3: 'good', L0: 'good' }, l: { query: 'day1–3 = 18 − 5 = 13' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "Ooh — what about day 2 through day 5?!",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Same trick: total after day 5 minus total after day 1. 28 minus 8 is 20. I could answer a THOUSAND more of these and never touch the raw distances again.",
        p: { L5: 'good', L1: 'good' }, l: { query: 'day2–5 = 28 − 8 = 20' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "SHISHISHI, you only walked the voyage once, and now you can answer forever!",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) to build the running ledger once; O(1) per range query afterward, no matter how far apart the two days are. Space: O(n) for the ledger.',
    pitfall: 'Sizing the ledger the same length as the input instead of one longer — without a "day -1 = total 0" slot, a query starting at day 0 needs an awkward special case instead of the same subtraction formula every other query uses.',
    solution: `class NumArray:
    def __init__(self, nums: list[int]):
        self.prefix = [0] * (len(nums) + 1)  # prefix[0] = 0: the "before any day" slot
        for i, n in enumerate(nums):
            self.prefix[i + 1] = self.prefix[i] + n

    def sum_range(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]`
  };

  E['subarray-sum-equals-k'] = {
    id: 'subarray-sum-equals-k',
    epNumber: 12,
    title: 'The Sacred Number of Shandora',
    patternId: 'prefix-sum',
    leetcode: { name: 'Subarray Sum Equals K', number: 560, difficulty: 'Medium', url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
    problem: 'Given an array of integers (positive, negative, or zero) and an integer k, return the number of contiguous subarrays whose elements sum exactly to k.',
    example: 'glyphs = [2, 3, -2, 5, 1, -3, 4], k = 5  →  answer: 3 matching stretches',

    // Prop board: seven ancient glyph-values carved along a Shandora ruin wall.
    h: 220,
    props: [
      { id: 'n0', emoji: '🗿', label: '2', x: 6, y: 32 },
      { id: 'n1', emoji: '🗿', label: '3', x: 21, y: 32 },
      { id: 'n2', emoji: '🗿', label: '-2', x: 36, y: 32 },
      { id: 'n3', emoji: '🗿', label: '5', x: 51, y: 32 },
      { id: 'n4', emoji: '🗿', label: '1', x: 66, y: 32 },
      { id: 'n5', emoji: '🗿', label: '-3', x: 81, y: 32 },
      { id: 'n6', emoji: '🗿', label: '4', x: 96, y: 32 }
    ],
    ledger: [
      { id: 'run', emoji: '📜', x: 26, y: 76 },
      { id: 'freq', emoji: '📋', x: 62, y: 76 },
      { id: 'count', emoji: '🔔', x: 90, y: 76 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "This corridor's wall is carved with a running sequence of numbers — some marked with a subtractive stroke. I want every stretch of CONSECUTIVE glyphs that adds to exactly 5, this shrine's sacred number.",
        p: { run: 'lit', freq: 'lit', count: 'lit' }, l: { freq: '{0: 1}', run: 'total=0', count: '0' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Before reading a single glyph, I log one thing for free: a running total of 0, meaning 'nothing read yet.' That's what lets a stretch starting at the very FIRST glyph get counted too.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "First glyph: +2. Running total: 2. To close a stretch HERE, I'd need to have already logged a total of 2 minus 5 — negative 3. I haven't. Log today's total and move on.",
        p: { n0: 'lit' }, l: { run: 'total=2, need=−3', freq: '{0:1, 2:1}' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Second glyph: +3. Running total: 5. I need a PREVIOUS total of 5 minus 5 — zero. And I logged exactly that, before I'd even read a glyph! Glyphs one and two together sum to 5. First stretch found.",
        p: { n0: 'good', n1: 'good' }, l: { run: 'total=5, need=0 ✓', freq: '{0:1, 2:1, 5:1}', count: '1' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'left',
        line: "You never rescanned! You just asked your notes if you'd already seen that number!",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Third glyph: -2, the subtractive mark. Running total: 3. Need 3 minus 5 — negative 2. Not logged. Log 3 and continue.",
        p: { n2: 'lit' }, l: { run: 'total=3, need=−2', freq: '{...,3:1}' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fourth glyph: +5, on its own. Running total: 8. Need 8 minus 5 — three. I logged THAT one just now, from glyph three! So glyph four, all by itself, is a stretch that sums to 5.",
        p: { n3: 'good' }, l: { run: 'total=8, need=3 ✓', freq: '{...,8:1}', count: '2' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fifth: +1, total 9, need 4 — not logged. Sixth: -3, total 6, need 1 — not logged. Log both and keep walking.",
        p: { n4: 'lit', n5: 'lit' }, l: { run: 'total=6, need=1', freq: '{...,9:1, 6:1}' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Seventh, last glyph: +4. Running total: 10. Need 10 minus 5 — five. And I logged THAT one all the way back after glyph two! So glyphs THREE through SEVEN — five glyphs, subtractive marks and all — also sum to 5.",
        p: { n2: 'good', n3: 'good', n4: 'good', n5: 'good', n6: 'good' }, l: { run: 'total=10, need=5 ✓', freq: '{...,10:1}', count: '3' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Three stretches — a pair, a lone glyph, and a five-glyph run — found in one walk down the wall. The number I ever needed to have already seen was always today's total minus 5.",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — one pass, one hashmap lookup and one insert per glyph. Space: O(n) for the frequency map in the worst case.',
    pitfall: 'Forgetting to seed the frequency map with {0: 1} before scanning — without it, any stretch that starts at the very first glyph has no earlier total to match against and is silently never counted.',
    solution: `def subarray_sum(nums, k):
    freq = {0: 1}   # empty prefix (total 0) has occurred once, before any element
    prefix = 0
    count = 0
    for num in nums:
        prefix += num
        count += freq.get(prefix - k, 0)   # how many earlier totals would complete a stretch here?
        freq[prefix] = freq.get(prefix, 0) + 1
    return count`
  };

  E['continuous-subarray-sum'] = {
    id: 'continuous-subarray-sum',
    epNumber: 13,
    title: 'The Coup de Burst Fuel Cycle',
    patternId: 'prefix-sum',
    leetcode: { name: 'Continuous Subarray Sum', number: 523, difficulty: 'Medium', url: 'https://leetcode.com/problems/continuous-subarray-sum/' },
    problem: 'Given an array of non-negative integers and an integer k, determine whether the array has a contiguous subarray of size AT LEAST 2 whose elements sum to a multiple of k.',
    example: 'fuel = [9, 3, 6, 8, 2], k = 8  →  answer: True (days 2–4 burn 6 + 8 + 2 = 16, two full 8-unit tanks)',

    // Prop board: five days of Coup de Burst fuel readings.
    h: 210,
    props: [
      { id: 'd0', emoji: '🔥', label: '9', x: 8, y: 32 },
      { id: 'd1', emoji: '🔥', label: '3', x: 28, y: 32 },
      { id: 'd2', emoji: '🔥', label: '6', x: 48, y: 32 },
      { id: 'd3', emoji: '🔥', label: '8', x: 68, y: 32 },
      { id: 'd4', emoji: '🔥', label: '2', x: 88, y: 32 }
    ],
    ledger: [
      { id: 'run', emoji: '📜', x: 26, y: 76 },
      { id: 'seen', emoji: '📋', x: 74, y: 76 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The Going Merry's booster tank holds fuel in units of 8 — one full cycle. I log units burned every day. Is there ever a stretch of AT LEAST TWO consecutive days that burns an exact multiple of 8 — clean cycles, zero left over?",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Day 0: burned 9. Running total: 9. Here's the trick — I don't care about the total itself, only the REMAINDER after dividing by 8: 9 mod 8 is 1. Never seen remainder 1 — log it, tagged to day 0.",
        p: { d0: 'lit' }, l: { run: 'total=9, rem=1', seen: '{1: day0}' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Day 1: 3 more, total 12. Remainder: 12 mod 8 is 4. New — log it. Day 2: 6 more, total 18. Remainder: 18 mod 8 is 2. Also new — log it.",
        p: { d1: 'lit', d2: 'lit' }, l: { run: 'total=18, rem=2', seen: '{1:day0, 4:day1, 2:day2}' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Day 3: burned 8 more — a FULL tank, all by itself! Running total 26. Remainder: 26 mod 8 is 2. I've SEEN that remainder — at day 2! But day 2 to day 3 is only ONE day apart.",
        p: { d3: 'bad' }, l: { run: 'total=26, rem=2 (seen at day2)' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "But day 3 burned EXACTLY 8 — a whole tank! Doesn't that count?!",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Not on its own — the rule needs a STRETCH of at least two days working together, not one lucky day. I keep the OLDER day-2 remainder logged, and I do NOT count this one.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Day 4: 2 more, total 28. Remainder: 28 mod 8 is 4 — and THAT remainder was logged all the way back at day 1! Days 2 through 4: three whole days, burning 6 plus 8 plus 2, sixteen units — exactly two full tanks.",
        p: { d2: 'good', d3: 'good', d4: 'good' }, l: { run: 'total=28, rem=4 (seen at day1 — 3 days apart ✓)' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "That's the one everybody forgets — checking the gap length BEFORE celebrating a remainder match. A lone perfect day doesn't prove a cycle. A stretch does.",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — one pass, one modulo, one hashmap lookup and (at most) one insert per day. Space: O(min(n, k)) for the remainder map.',
    pitfall: 'Accepting a remainder match that is only one index away (a single element that happens to be an exact multiple of k) instead of requiring the gap to be at least 2 — and forgetting that k == 0 makes "modulo k" undefined, requiring a fallback to comparing raw totals instead.',
    solution: `def check_subarray_sum(nums, k):
    seen = {0: -1}   # remainder -> earliest index (index -1 = "before day 0")
    prefix = 0
    for i, num in enumerate(nums):
        prefix += num
        rem = prefix % k if k else prefix
        if rem in seen:
            if i - seen[rem] >= 2:      # stretch, not a coincidence
                return True
            # too short: do NOT overwrite — keep the earliest index for this remainder
        else:
            seen[rem] = i
    return False`
  };

  E['product-of-array-except-self'] = {
    id: 'product-of-array-except-self',
    epNumber: 14,
    title: 'The Gate of Justice Dial Lock',
    patternId: 'prefix-sum',
    leetcode: { name: 'Product of Array Except Self', number: 238, difficulty: 'Medium', url: 'https://leetcode.com/problems/product-of-array-except-self/' },
    problem: 'Given an array of integers, return an array where each element is the product of all the OTHER elements — without using division, in O(n) time.',
    example: 'dials = [4, 3, 0, 5]  →  answer: [0, 0, 60, 0]',

    // Prop board: four control dials on the Tower of Justice's judicial gate.
    h: 210,
    props: [
      { id: 'dial0', emoji: '🔘', label: '4', x: 12, y: 34 },
      { id: 'dial1', emoji: '🔘', label: '3', x: 38, y: 34 },
      { id: 'dial2', emoji: '🔘', label: '0', x: 64, y: 34 },
      { id: 'dial3', emoji: '🔘', label: '5', x: 90, y: 34 }
    ],
    ledger: [
      { id: 'left', emoji: '➡️', x: 24, y: 74 },
      { id: 'right', emoji: '⬅️', x: 76, y: 74 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The Gate of Justice control panel — four dials. CP9 designed it so no single dial's correct setting can be read off directly: each dial's true value has to equal the PRODUCT of all three OTHER dials.",
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "So multiply the other three together for each dial. What's the problem?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One dial currently reads zero. The lazy shortcut — multiply ALL four dials, then divide by each one — breaks the instant you divide by that zero. We need a way that never divides at all.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "First sweep, left to right: a running product of everything BEFORE each dial. Nothing sits before dial one — its 'before' product is 1. Carry dial one's own value, 4, forward for whoever's next.",
        p: { dial0: 'lit' }, l: { left: '1', dial0: '≡1' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Dial two: everything before it is just dial one — 'before' product 4. Dial three: everything before it is dial one and two — 4 times 3 is 12.",
        p: { dial1: 'lit', dial2: 'lit' }, l: { left: '12', dial1: '≡4', dial2: '≡12' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Dial four: everything before it includes the zero dial — so its 'before' product is 0. That's not a mistake to fix — dial three genuinely erases everything that comes after it.",
        p: { dial3: 'lit' }, l: { left: '0', dial3: '≡0' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Second sweep, right to left: a running product of everything AFTER each dial, combined with what we already have. Dial four: nothing after it — combine with 1. Its answer stays 0.",
        l: { right: '1', dial3: '0 (final)' }, p: { dial3: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Dial three: everything after it is just dial four, value 5. Combine: 12 times 5 is 60. Dial three's true setting is 60.",
        l: { right: '5', dial2: '60 (final)' }, p: { dial2: 'good' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Dial two: everything after it includes dial three's zero — 4 times 0 is 0. Dial one: everything after it also includes that same zero — 1 times 0 is 0.",
        l: { right: '0', dial1: '0 (final)' }, p: { dial1: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Final dial: 0 too, for the same reason. Three of the four true settings are zero, and only dial three actually matters — and we never divided by the zero dial that would have crashed the whole calculation.",
        l: { dial0: '0 (final)' }, p: { dial0: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Two clean sweeps. Left to right, then right to left. No division anywhere. Let's move.",
        sfx: 'pop'
      }
    ],

    complexity: 'Time: O(n) — two linear passes, one left to right and one right to left. Space: O(1) extra, not counting the output array itself.',
    pitfall: 'Computing the total product of the whole array and dividing by nums[i] for each answer — this crashes outright when any element is zero, and silently produces all-zero output when two or more elements are zero, instead of the correct single non-zero answer.',
    solution: `def product_except_self(nums):
    n = len(nums)
    answer = [1] * n
    left = 1
    for i in range(n):
        answer[i] = left       # product of everything BEFORE i
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        answer[i] *= right     # combine with product of everything AFTER i
        right *= nums[i]
    return answer`
  };

  window.EPISODES = E;
})();
