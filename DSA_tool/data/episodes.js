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
    epNumber: 16,
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
    epNumber: 3,
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
    epNumber: 4,
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
    epNumber: 7,
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
    epNumber: 10,
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
    epNumber: 13,
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
    epNumber: 27,
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
    epNumber: 26,
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
    epNumber: 29,
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
    epNumber: 28,
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
    epNumber: 19,
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
    epNumber: 22,
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
    epNumber: 21,
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
    epNumber: 20,
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


  /* --- Batch 2: bringing every pattern up to at least 3 episodes each --- */

  E['reverse-linked-list'] = {
    id: 'reverse-linked-list',
    epNumber: 23,
    title: 'The Trail That Learned to Walk Backward',
    patternId: 'linked-list-reversal',
    leetcode: { name: 'Reverse Linked List', number: 206, difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/' },
    problem: 'Given the head of a singly linked list, reverse the list in place and return the new head — every node\'s "next" pointer should end up pointing at the node that used to come before it.',
    example: 'head = [1, 2, 3]  →  answer: [3, 2, 1]',
    h: 200,
    props: [
      { id: 'n0', emoji: '🪧', label: '1', x: 20, y: 50 },
      { id: 'n1', emoji: '🪧', label: '2', x: 50, y: 50 },
      { id: 'n2', emoji: '🪧', label: '3', x: 80, y: 50 }
    ],
    ledger: [
      { id: 'trail', emoji: '🧭', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Picture it: a shipwreck survivor's escape trail — sign one points to sign two, sign two points to sign three, and sign three points at nothing, because that is where the trail used to end!", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Problem is, we are leaving FROM sign three. If we want a trail that guides someone back the way we came, every single arrow needs to point the opposite direction — and we can only carry a couple of signs in our hands at once, not the whole trail.", sfx: null },
      { speaker: 'zoro', pos: 'left', line: "Wrong way is basically my specialty. Let's go.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Three hands is all it takes. One hand — prev — holds the last sign we already flipped, empty at the start. One hand — curr — holds the sign we are working on right now, starting at sign one. And before we flip curr's arrow, we write down where it used to point, in a third hand, next — or we would lose the rest of the trail forever.", p: { n0: 'lit' }, l: { trail: 'prev: none  ·  curr: 1' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Sign one: I note that it used to point to sign two — that's next. Now I flip sign one's arrow to point at prev, which is nothing yet. Prev becomes sign one. Curr moves up to sign two.", p: { n0: 'good', n1: 'lit' }, l: { trail: 'prev: 1  ·  curr: 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Sign two: next is sign three. Flip sign two's arrow back to point at prev, sign one. Prev becomes sign two, curr moves up to sign three.", p: { n1: 'good', n2: 'lit' }, l: { trail: 'prev: 2  ·  curr: 3' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Sign three: next is nothing — the old end of the trail. Flip sign three's arrow back to point at prev, sign two. Prev becomes sign three, and curr runs off the end. We're out of signs to flip.", p: { n2: 'good' }, l: { trail: 'prev: 3  ·  curr: none — done' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Now sign three points to two, two points to one, and one points at nothing — the trail runs the exact opposite way!", sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "Told you. Every trail I walk ends up backward eventually.", sfx: 'pop' }
    ],
    complexity: 'Time: O(n) — each node is visited and its pointer flipped exactly once. Space: O(1) — only three hand-held references (prev, curr, next), no extra list is built.',
    pitfall: 'Overwriting curr.next before saving it into next — once you flip the arrow, the rest of the original trail is gone and you can never reach it again.',
    solution: `def reverse_list(head):
      prev = None
      curr = head
      while curr:
          nxt = curr.next   # save the rest of the trail before we flip
          curr.next = prev  # flip this sign's arrow backward
          prev = curr        # prev catches up
          curr = nxt          # curr moves to the saved next sign
      return prev`
  };

  E['reverse-linked-list-ii'] = {
    id: 'reverse-linked-list-ii',
    epNumber: 25,
    title: 'The Detour That Only Touched the Middle',
    patternId: 'linked-list-reversal',
    leetcode: { name: 'Reverse Linked List II', number: 92, difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-linked-list-ii/' },
    problem: 'Given the head of a singly linked list and two 1-indexed positions left and right (left <= right), reverse only the nodes from position left to position right, leaving the rest of the list untouched, and do it in a single pass without extra data structures.',
    example: 'head = [1, 2, 3, 4, 5], left = 2, right = 4  →  answer: [1, 4, 3, 2, 5]',
    h: 200,
    props: [
      { id: 'n1', emoji: '🪧', label: '1', x: 10, y: 50 },
      { id: 'n2', emoji: '🪧', label: '2', x: 28, y: 50 },
      { id: 'n3', emoji: '🪧', label: '3', x: 46, y: 50 },
      { id: 'n4', emoji: '🪧', label: '4', x: 64, y: 50 },
      { id: 'n5', emoji: '🪧', label: '5', x: 82, y: 50 }
    ],
    ledger: [
      { id: 'trail', emoji: '🧭', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Same trail, five signs this time: one through five. But the merchant only wants the MIDDLE stretch flipped — signs two through four. Signs one and five stay exactly as they are.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "And we still only get one walk down the trail — no rebuilding it from scratch, no spare pile of signs on the side.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "First, walk to the sign just before position two — that's sign one. Call it the anchor. Everything after the anchor is the stretch we're allowed to touch.", p: { n1: 'lit' }, l: { trail: 'anchor: 1' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Curr starts at sign two — it will end up as the TAIL of the flipped stretch, so it stays put the whole time. Each round, I grab whatever sign currently sits right after curr, and re-hang it directly after the anchor instead.", p: { n1: 'lit', n2: 'lit' }, l: { trail: 'anchor: 1  ·  curr: 2 (stays put)' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Round one: the sign right after curr is three. Pull it out, hang it right after the anchor. Trail now reads one, three, two, four, five.", p: { n1: 'lit', n2: 'lit', n3: 'lit' }, l: { trail: 'moved 3 → 1, 3, 2, 4, 5' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Round two: curr — still sign two — now has sign four sitting right after it. Pull four out, hang it right after the anchor too. Trail reads one, four, three, two, five.", p: { n4: 'lit' }, l: { trail: 'moved 4 → 1, 4, 3, 2, 5' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "That's right minus left — two rounds — and positions two through four are fully flipped. I never touched sign one or sign five.", p: { n1: 'good', n2: 'good', n3: 'good', n4: 'good' }, l: { trail: 'segment reversed: 1, 4, 3, 2, 5' }, sfx: 'gong' },
      { speaker: 'chopper', pos: 'left', line: "So sign one and sign five never even noticed anything happened?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Exactly. That's the whole point of stopping the anchor exactly one sign before the range — everything outside it just stays wired to whatever the range's new ends turn out to be.", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI, half a trail flipped and nobody had to redraw the whole map!", sfx: 'victory' }
    ],
    complexity: 'Time: O(n) — one pass to walk to the anchor plus (right - left) pointer rewires for the sub-range. Space: O(1) — a dummy node and a couple of references, no recursion.',
    pitfall: 'Skipping the dummy node when left = 1 — with no real predecessor to serve as the anchor, the very first reassignment has nothing to attach to and crashes or silently drops the new head.',
    solution: `def reverse_between(head, left, right):
      dummy = ListNode(0, head)
      anchor = dummy
      for _ in range(left - 1):
          anchor = anchor.next        # walk anchor to just before position left
      curr = anchor.next               # curr stays put as the tail of the flipped range
      for _ in range(right - left):
          moved = curr.next            # sign to pull out and re-hang
          curr.next = moved.next
          moved.next = anchor.next
          anchor.next = moved
      return dummy.next`
  };

  E['swap-nodes-in-pairs'] = {
    id: 'swap-nodes-in-pairs',
    epNumber: 24,
    title: "The Relay Line's Partner Swap",
    patternId: 'linked-list-reversal',
    leetcode: { name: 'Swap Nodes in Pairs', number: 24, difficulty: 'Medium', url: 'https://leetcode.com/problems/swap-nodes-in-pairs/' },
    problem: 'Given the head of a singly linked list, swap every pair of adjacent nodes and return the new head. Swap the NODES themselves (rewire the pointers), not just their values, and if there is an odd node left over at the end, leave it in place.',
    example: 'head = [1, 2, 3, 4]  →  answer: [2, 1, 4, 3]',
    h: 200,
    props: [
      { id: 'n1', emoji: '🎽', label: '1', x: 15, y: 50 },
      { id: 'n2', emoji: '🎽', label: '2', x: 38, y: 50 },
      { id: 'n3', emoji: '🎽', label: '3', x: 61, y: 50 },
      { id: 'n4', emoji: '🎽', label: '4', x: 84, y: 50 }
    ],
    ledger: [
      { id: 'trail', emoji: '🧭', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'luffy', pos: 'left', line: "Four crew members lined up for the relay, one through four! Vivi says we gotta swap every NEIGHBORING pair — but only by re-tying the baton cords, no starting the line over from scratch!", sfx: null },
      { speaker: 'nami', pos: 'right', line: "So runner one and two trade spots, then runner three and four trade spots. If there's an odd runner left alone at the very end with no partner, they just stay put.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Same trick as always — an anchor standing just before the current pair. Point the anchor at the SECOND runner, point the first runner at whatever came after the second, then point the second runner back at the first. That's the whole swap.", p: { n1: 'lit', n2: 'lit' }, l: { trail: 'pair: 1, 2' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Pair one done: the anchor now points to runner two, runner two points to runner one, and runner one points to whatever comes next — runner three. The line reads two, one, three, four so far.", p: { n1: 'good', n2: 'good' }, l: { trail: 'swapped → 2, 1, 3, 4' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Move the anchor up to runner one, since that pair is finished. Next pair: three and four.", p: { n3: 'lit', n4: 'lit' }, l: { trail: 'pair: 3, 4' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Pair two done: runner one now points to runner four, runner four points to runner three, and runner three points to nothing — the end of the line. Final order: two, one, four, three.", p: { n3: 'good', n4: 'good' }, l: { trail: 'swapped → 2, 1, 4, 3' }, sfx: 'gong' },
      { speaker: 'chopper', pos: 'left', line: "We never had to write down a whole new list — we just kept re-tying three cords at a time?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Exactly — one anchor, one pair, three arrows rewired, every round. Constant extra space.", sfx: null },
      { speaker: 'zoro', pos: 'left', line: "Fine. Just don't make me swap with Sanji.", sfx: 'pop' }
    ],
    complexity: 'Time: O(n) — one pass, a constant number of pointer rewires per pair. Space: O(1) iteratively (O(n) recursion stack if solved recursively instead).',
    pitfall: 'Rewiring the anchor to point at the second node before saving where the first node needs to point next — set first.next = second.next and second.next = first BEFORE moving the anchor, or you overwrite the link back into the rest of the list.',
    solution: `def swap_pairs(head):
      dummy = ListNode(0, head)
      anchor = dummy
      while anchor.next and anchor.next.next:
          first = anchor.next
          second = first.next
          first.next = second.next   # first now points past the pair
          second.next = first        # second points back at first
          anchor.next = second       # anchor now points at the new pair-leader
          anchor = first              # first is now the tail of this finished pair
      return dummy.next`
  };

  E['sliding-window-maximum'] = {
    id: 'sliding-window-maximum',
    epNumber: 32,
    title: 'The Tallest Wave in Every Three-Length Watch',
    patternId: 'queue-deque',
    leetcode: { name: 'Sliding Window Maximum', number: 239, difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/' },
    problem: 'Given an array of integers nums and a window size k, a window of size k slides from the very left of the array to the very right, one step at a time. For each position of the window, return the maximum value currently inside it.',
    example: 'nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3  →  answer: [3, 3, 5, 5, 6, 7]',
    h: 240,
    props: [
      { id: 'w0', emoji: '🌊', label: '1', x: 6, y: 45 },
      { id: 'w1', emoji: '🌊', label: '3', x: 18, y: 45 },
      { id: 'w2', emoji: '🌊', label: '-1', x: 30, y: 45 },
      { id: 'w3', emoji: '🌊', label: '-3', x: 42, y: 45 },
      { id: 'w4', emoji: '🌊', label: '5', x: 54, y: 45 },
      { id: 'w5', emoji: '🌊', label: '3', x: 66, y: 45 },
      { id: 'w6', emoji: '🌊', label: '6', x: 78, y: 45 },
      { id: 'w7', emoji: '🌊', label: '7', x: 90, y: 45 }
    ],
    ledger: [
      { id: 'deque', emoji: '📋', x: 30, y: 88 },
      { id: 'answer', emoji: '🏁', x: 72, y: 88 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Eight wave-height readings roll in off the bow: one, three, minus one, minus three, five, three, six, seven! Nami wants the TALLEST wave in every stretch of three consecutive readings, sliding one at a time, all the way down the line!", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Checking all three readings by hand for every single window works, but with eight numbers that's already six windows re-scanned from scratch. On a real logbook with thousands of readings, that's far too slow.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "We don't need to re-scan. Keep a lineup of candidate wave heights, largest to smallest, front to back — the moment a new reading beats whoever's waiting at the back, those smaller ones get tossed immediately, since they can never win a window while a taller wave still stands in front of them. And before reading off the front as our answer, we always check whether that front reading has aged out of the current window entirely.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Reading one: height one. Lineup is empty, so it just joins: [1].", p: { w0: 'lit' }, l: { deque: '[1]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Reading two: height three. Bigger than the one at the back of the lineup, so one gets tossed out first — then three joins alone: [3].", p: { w0: 'dim', w1: 'lit' }, l: { deque: '[3]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Reading three: minus one. Smaller than the back of the lineup, so it just joins behind: [3, -1]. Now three readings are in view — window complete. The tallest is whoever's at the very front: three.", p: { w2: 'lit' }, l: { deque: '[3, -1]', answer: '[3]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Reading four: minus three. Also smaller than the back, joins behind: [3, -1, -3]. Front is still three, and three is still inside our three-wide window, so the answer stays three.", p: { w3: 'lit' }, l: { deque: '[3, -1, -3]', answer: '[3, 3]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Reading five: height five! Bigger than everyone currently waiting, so minus three, minus one, AND three all get tossed — five stands alone: [5]. New tallest: five.", p: { w1: 'dim', w2: 'dim', w3: 'dim', w4: 'lit' }, l: { deque: '[5]', answer: '[3, 3, 5]' }, sfx: 'gong' },
      { speaker: 'robin', pos: 'right', line: "Reading six: height three. Smaller than the back (five), so it just joins behind: [5, 3]. Front is still five — still tallest.", p: { w5: 'lit' }, l: { deque: '[5, 3]', answer: '[3, 3, 5, 5]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Reading seven: height six. Bigger than three AND five, so both get tossed — six stands alone: [6].", p: { w4: 'dim', w5: 'dim', w6: 'lit' }, l: { deque: '[6]', answer: '[3, 3, 5, 5, 6]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Reading eight, the last one: height seven. Bigger than six, tosses it too — seven stands alone: [7]. Tallest of the final window: seven.", p: { w6: 'dim', w7: 'lit' }, l: { deque: '[7]', answer: '[3, 3, 5, 5, 6, 7]' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Every window's tallest wave, and nobody ever had to look backward — only forward, tossing the little ones overboard!", sfx: 'victory' },
      { speaker: 'chopper', pos: 'left', line: "And a wave only ever gets tossed out once, right? So it's not nearly as much work as it looked at first!", sfx: null }
    ],
    complexity: 'Time: O(n) — every index is pushed onto the lineup and popped off at most once across the whole run, so total work is linear even though it looks nested. Space: O(k) — the lineup holds at most k indices at a time.',
    pitfall: 'Storing values instead of INDICES in the lineup — without the index you cannot tell whether the front reading has aged out of the current window and must be dropped, only whether a new value beats it.',
    solution: `from collections import deque

  def max_sliding_window(nums, k):
      dq = deque()  # stores indices, values kept front-to-back decreasing
      result = []
      for i, num in enumerate(nums):
          while dq and nums[dq[-1]] <= num:
              dq.pop()               # smaller readings behind a bigger one can never win
          dq.append(i)
          if dq[0] <= i - k:
              dq.popleft()            # front has aged out of the window
          if i >= k - 1:
              result.append(nums[dq[0]])
      return result`
  };

  E['moving-average-from-data-stream'] = {
    id: 'moving-average-from-data-stream',
    epNumber: 30,
    title: 'Three Heartbeats at a Time',
    patternId: 'queue-deque',
    leetcode: { name: 'Moving Average from Data Stream', number: 346, difficulty: 'Easy', url: 'https://leetcode.com/problems/moving-average-from-data-stream/' },
    problem: 'Design a data structure that calculates the moving average of the last "size" values from a stream of integers. Each time a new value arrives via next(val), return the average of the most recent "size" values seen so far (or fewer, if fewer than "size" values have arrived yet).',
    example: 'size = 3; calls: next(1) → 1.0, next(10) → 5.5, next(3) → 4.67, next(5) → 6.0',
    h: 210,
    props: [
      { id: 'r0', emoji: '📈', label: '1', x: 15, y: 50 },
      { id: 'r1', emoji: '📈', label: '10', x: 38, y: 50 },
      { id: 'r2', emoji: '📈', label: '3', x: 61, y: 50 },
      { id: 'r3', emoji: '📈', label: '5', x: 84, y: 50 }
    ],
    ledger: [
      { id: 'window', emoji: '🩺', x: 35, y: 88 },
      { id: 'avg', emoji: '🧮', x: 70, y: 88 }
    ],
    steps: [
      { speaker: 'chopper', pos: 'left', line: "New vitals reading every few seconds — but a single reading jumps all over the place! I only want the average of the LAST three readings, updated every time a new one comes in.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Recomputing the sum of the last three from scratch every single time works, but on a long stream that's a lot of repeated adding for numbers we already added before.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "So don't repeat it. Keep a small line of at most three readings, plus a running total. Add the new reading to the total and to the back of the line — and the moment the line grows past three, drop the oldest one off the front, subtracting it from the total too.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "First reading: one. Line: [1]. Total: one. Average of one reading: 1.0.", p: { r0: 'lit' }, l: { window: '[1]', avg: 'sum=1, avg=1.0' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Second reading: ten. Line: [1, 10]. Total: eleven. Average of two readings: 5.5.", p: { r1: 'lit' }, l: { window: '[1, 10]', avg: 'sum=11, avg=5.5' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Third reading: three. Line: [1, 10, 3] — full, exactly three readings. Total: fourteen. Average: about 4.67.", p: { r2: 'lit' }, l: { window: '[1, 10, 3]', avg: 'sum=14, avg=4.67' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Fourth reading: five. The line is already full, so before adding five, drop the oldest reading — one — off the front, and subtract it from the total. New total: thirteen. Now add five: line [10, 3, 5], total eighteen.", p: { r0: 'dim', r3: 'lit' }, l: { window: '[10, 3, 5]', avg: 'sum=18, avg=6.0' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Average of the last three, every time, and you never re-added the same number twice!", sfx: 'victory' },
      { speaker: 'chopper', pos: 'left', line: "That's exactly the smoothing I needed — one running total, one small line, done.", sfx: null }
    ],
    complexity: 'Time: O(1) per call — one addition, one possible subtraction, no re-scanning the window. Space: O(size) — the line only ever holds up to "size" readings.',
    pitfall: 'Letting the stored window grow unbounded and re-summing all of it each call instead of maintaining a running total — still correct, but O(size) or worse per call, defeating the point of using a queue.',
    solution: `from collections import deque

  class MovingAverage:
      def __init__(self, size: int):
          self.size = size
          self.window = deque()
          self.total = 0

      def next(self, val: int) -> float:
          self.window.append(val)
          self.total += val
          if len(self.window) > self.size:
              self.total -= self.window.popleft()  # drop oldest, adjust total
          return self.total / len(self.window)`
  };

  E['design-circular-deque'] = {
    id: 'design-circular-deque',
    epNumber: 31,
    title: 'The Rum Barrel With Only Three Pegs',
    patternId: 'queue-deque',
    leetcode: { name: 'Design Circular Deque', number: 641, difficulty: 'Medium', url: 'https://leetcode.com/problems/design-circular-deque/' },
    problem: 'Design a circular double-ended queue (deque) with a fixed capacity k. Support inserting a value at the front or the back, deleting a value from the front or the back, peeking at the front or rear value, and checking whether the deque is empty or full — every operation in O(1), without shifting existing elements.',
    example: 'capacity = 3; insertLast(1)→true, insertLast(2)→true, insertFront(3)→true, insertFront(4)→false, getRear()→2, isFull()→true, deleteLast()→true, insertFront(4)→true, getFront()→4',
    h: 220,
    props: [
      { id: 'slotA', emoji: '🛢️', label: '·', x: 50, y: 15 },
      { id: 'slotB', emoji: '🛢️', label: '·', x: 22, y: 75 },
      { id: 'slotC', emoji: '🛢️', label: '·', x: 78, y: 75 }
    ],
    ledger: [
      { id: 'status', emoji: '📍', x: 50, y: 96 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Behold! The Legendary Three-Peg Rum Barrel of Baratie! Exactly three pegs, arranged in a ring — sacks can be hung from the FRONT peg or the BACK peg, and pulled off from either end too. But there is no fourth peg. Ever.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "And we are not shifting every sack over each time something changes — the barrel just tracks which peg is currently the front and which is currently the rear, and walks around the ring.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "insertLast, one: hang sack one on an empty peg, and mark it BOTH the front and the rear, since it's the only sack in the barrel.", p: { slotA: 'lit' }, l: { slotA: '1', status: 'front=A rear=A · [1]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "insertLast, two: hang sack two on the next peg around, and move the rear marker up to it.", p: { slotB: 'lit' }, l: { slotB: '2', status: 'front=A rear=B · [1, 2]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "insertFront, three: hang sack three on the peg just BEFORE the current front, and move the front marker back to it. Now all three pegs are full: three, one, two.", p: { slotC: 'lit' }, l: { slotC: '3', status: 'front=C rear=B · [3, 1, 2]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "insertFront, four: every peg is already hung. There's nowhere to put it — return false, and the barrel doesn't change at all.", sfx: 'error' },
      { speaker: 'usopp', pos: 'left', line: "getRear! The peg marked rear is holding sack two — so getRear returns two, no lifting required, just a peek!", sfx: null },
      { speaker: 'nami', pos: 'right', line: "isFull, checked: three pegs, three sacks. True.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "deleteLast: lift sack two off the rear peg, and move the rear marker back one peg, to sack one. The barrel now holds three, one — one peg free again.", p: { slotB: 'dim' }, l: { slotB: '·', status: 'front=C rear=A · [3, 1]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "insertFront, four again: now there IS a free peg, just before the current front. Hang four there, and move the front marker to it. Barrel: four, three, one.", p: { slotB: 'lit' }, l: { slotB: '4', status: 'front=B rear=A · [4, 3, 1]' }, sfx: 'chime' },
      { speaker: 'brook', pos: 'left', line: "Yohohoho! And getFront now returns four, the newest sack at the front peg — though I have no lips left to whistle at how tidy that ring buffer is.", sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "No shifting, no new barrel. Just walk the ring.", sfx: null }
    ],
    complexity: 'Time: O(1) for every operation — insertFront, insertLast, deleteFront, deleteLast, getFront, getRear, isEmpty, isFull all just move a marker or check one, never shift the array. Space: O(k) — a fixed-size array of capacity k.',
    pitfall: 'Using front == rear alone to mean "full" — that condition is also true when the barrel is EMPTY. You need a separate count of currently-hung sacks (or one deliberately wasted peg) to tell full and empty apart.',
    solution: `class MyCircularDeque:
      def __init__(self, k: int):
          self.cap = k
          self.buf = [0] * k
          self.front = 0
          self.count = 0

      def insertFront(self, value: int) -> bool:
          if self.count == self.cap:
              return False
          self.front = (self.front - 1) % self.cap
          self.buf[self.front] = value
          self.count += 1
          return True

      def insertLast(self, value: int) -> bool:
          if self.count == self.cap:
              return False
          rear = (self.front + self.count) % self.cap
          self.buf[rear] = value
          self.count += 1
          return True

      def deleteFront(self) -> bool:
          if self.count == 0:
              return False
          self.front = (self.front + 1) % self.cap
          self.count -= 1
          return True

      def deleteLast(self) -> bool:
          if self.count == 0:
              return False
          self.count -= 1
          return True

      def getFront(self) -> int:
          return -1 if self.count == 0 else self.buf[self.front]

      def getRear(self) -> int:
          if self.count == 0:
              return -1
          rear = (self.front + self.count - 1) % self.cap
          return self.buf[rear]

      def isEmpty(self) -> bool:
          return self.count == 0

      def isFull(self) -> bool:
          return self.count == self.cap`
  };

  E['binary-tree-level-order-traversal'] = {
    id: 'binary-tree-level-order-traversal',
    epNumber: 35,
    title: 'Clearing the Watchtower, Floor by Floor',
    patternId: 'tree-dfs-bfs',
    leetcode: { name: 'Binary Tree Level Order Traversal', number: 102, difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
    problem: 'Given the root of a binary tree, return the values of its nodes grouped level by level, from top to bottom, and left to right within each level.',
    example: 'root = [3,9,20,null,null,15,7]  →  answer: [[3],[9,20],[15,7]]',
    h: 240,
    props: [
      { id: 'root', emoji: '🚪', label: '3', x: 50, y: 15 },
      { id: 'nodeL', emoji: '🚪', label: '9', x: 25, y: 45 },
      { id: 'nodeR', emoji: '🚪', label: '20', x: 75, y: 45 },
      { id: 'nodeLL', emoji: '🚪', label: '15', x: 62, y: 78 },
      { id: 'nodeLR', emoji: '🚪', label: '7', x: 88, y: 78 }
    ],
    ledger: [
      { id: 'queue', emoji: '📋', x: 30, y: 96 },
      { id: 'levels', emoji: '🏁', x: 72, y: 96 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "The Marine watchtower has three floors of guards: the commander alone at the top — room three. Below, two lieutenants — rooms nine and twenty. Below THEM, two grunts — rooms fifteen and seven, both guarding under room twenty.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "We are not sneaking straight down to the grunts. We clear a floor COMPLETELY before descending to the next one — record every room on this floor, then move to their doors.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "That's a queue, not a stack. Push the root in first: room three. Queue: [3].", p: { root: 'lit' }, l: { queue: '[3]' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Before draining, I snapshot how many rooms are on this floor — right now, just one. Pop room three, record it as this level's list, and push its two children, nine and twenty, onto the back of the queue.", p: { root: 'good', nodeL: 'lit', nodeR: 'lit' }, l: { queue: '[9, 20]', levels: '[[3]]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "New floor, new snapshot: two rooms waiting. Pop room nine — it has no children, nothing to push. Pop room twenty — push ITS two children, fifteen and seven, onto the back.", p: { nodeL: 'good', nodeR: 'good', nodeLL: 'lit', nodeLR: 'lit' }, l: { queue: '[15, 7]', levels: '[[3], [9, 20]]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Final floor: two rooms, fifteen and seven. Pop both, neither has children, nothing more gets pushed. Queue is empty — we've cleared every floor.", p: { nodeLL: 'good', nodeLR: 'good' }, l: { queue: '[]', levels: '[[3], [9, 20], [15, 7]]' }, sfx: 'gong' },
      { speaker: 'chopper', pos: 'left', line: "So the snapshot number is what keeps us from mixing a grunt from THIS floor in with a lieutenant from the last one?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Exactly — grab that count once, drain exactly that many before you check the count again. New children pushed mid-floor never get counted until the NEXT floor's snapshot.", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Top floor first, then both floors under it, together, never skipping ahead! Now let's go get the commander!", sfx: 'victory' }
    ],
    complexity: 'Time: O(n) — every node is pushed and popped from the queue exactly once. Space: O(n) — in the worst case the widest level holds close to n/2 nodes in the queue at once.',
    pitfall: 'Checking the queue length WHILE draining the current level instead of snapshotting it once beforehand — children you just pushed get counted as part of the current level and everything smears into one long list.',
    solution: `from collections import deque

  def level_order(root):
      if not root:
          return []
      result = []
      queue = deque([root])
      while queue:
          level_size = len(queue)      # snapshot BEFORE draining
          level = []
          for _ in range(level_size):
              node = queue.popleft()
              level.append(node.val)
              if node.left:
                  queue.append(node.left)
              if node.right:
                  queue.append(node.right)
          result.append(level)
      return result`
  };

  E['maximum-depth-of-binary-tree'] = {
    id: 'maximum-depth-of-binary-tree',
    epNumber: 33,
    title: 'How Deep Do the Tunnels Go?',
    patternId: 'tree-dfs-bfs',
    leetcode: { name: 'Maximum Depth of Binary Tree', number: 104, difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
    problem: 'Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from the root down to the farthest leaf node.',
    example: 'root = [3,9,20,null,null,15,7]  →  answer: 3',
    h: 220,
    props: [
      { id: 'root', emoji: '🕳️', label: '3', x: 50, y: 15 },
      { id: 'nodeL', emoji: '🕳️', label: '9', x: 25, y: 45 },
      { id: 'nodeR', emoji: '🕳️', label: '20', x: 75, y: 45 },
      { id: 'nodeLL', emoji: '🕳️', label: '15', x: 62, y: 78 },
      { id: 'nodeLR', emoji: '🕳️', label: '7', x: 88, y: 78 }
    ],
    ledger: [
      { id: 'depth', emoji: '📏', x: 50, y: 96 }
    ],
    steps: [
      { speaker: 'chopper', pos: 'left', line: "This ruin has branching tunnels — from the entrance, LEFT goes to a passage, RIGHT goes to another. I want to know how many tunnel-lengths deep the FARTHEST dead end goes.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Ask each branch how deep IT goes, and trust the answer. A tunnel with no branches past it is one level deep, all by itself.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Left branch from the entrance, room nine: no further branches. Depth one.", p: { nodeL: 'lit' }, l: { depth: 'depth(9) = 1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Right branch from the entrance, room twenty: not a dead end — it splits again into room fifteen and room seven. Ask THEM first.", p: { nodeR: 'lit', nodeLL: 'lit', nodeLR: 'lit' }, l: { depth: 'asking depth(15), depth(7)...' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Room fifteen: no further branches. Depth one. Room seven: same, no further branches. Depth one.", p: { nodeLL: 'good', nodeLR: 'good' }, l: { depth: 'depth(15)=1, depth(7)=1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "So room twenty's depth is one MORE than the deeper of its two children — both are depth one, so room twenty is depth two.", p: { nodeR: 'good' }, l: { depth: 'depth(20) = 1 + max(1, 1) = 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Back at the entrance: left branch was depth one, right branch was depth two. The entrance's own depth is one more than the DEEPER of the two — one more than two.", p: { root: 'lit' }, l: { depth: 'depth(3) = 1 + max(1, 2) = 3' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Three tunnel-lengths deep, straight down through room twenty and room fifteen or room seven! Let's go find treasure!", p: { root: 'good' }, sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "Every dead end reports back up. No need to check the whole map at once.", sfx: null }
    ],
    complexity: 'Time: O(n) — every node is visited exactly once. Space: O(h) — the recursion stack goes as deep as the tree is tall, from O(log n) for a balanced tree up to O(n) for a completely lopsided one.',
    pitfall: 'Returning 0 for a leaf node instead of 1 (or forgetting the +1 for the current node) — an easy off-by-one that undercounts the depth of every path by exactly one level.',
    solution: `def max_depth(root) -> int:
      if not root:
          return 0
      return 1 + max(max_depth(root.left), max_depth(root.right))`
  };

  E['diameter-of-binary-tree'] = {
    id: 'diameter-of-binary-tree',
    epNumber: 34,
    title: 'The Longest Bridge Between Any Two Crewmates',
    patternId: 'tree-dfs-bfs',
    leetcode: { name: 'Diameter of Binary Tree', number: 543, difficulty: 'Easy', url: 'https://leetcode.com/problems/diameter-of-binary-tree/' },
    problem: 'Given the root of a binary tree, return the length (in edges) of the longest path between any two nodes in the tree. This path may or may not pass through the root.',
    example: 'root = [1,2,3,4,5]  →  answer: 3  (path 4 → 2 → 1 → 3, or 5 → 2 → 1 → 3)',
    h: 240,
    props: [
      { id: 'root', emoji: '🧍', label: '1', x: 50, y: 15 },
      { id: 'nodeL', emoji: '🧍', label: '2', x: 28, y: 45 },
      { id: 'nodeR', emoji: '🧍', label: '3', x: 72, y: 45 },
      { id: 'nodeLL', emoji: '🧍', label: '4', x: 14, y: 78 },
      { id: 'nodeLR', emoji: '🧍', label: '5', x: 42, y: 78 }
    ],
    ledger: [
      { id: 'height', emoji: '📏', x: 30, y: 96 },
      { id: 'best', emoji: '🌉', x: 72, y: 96 }
    ],
    steps: [
      { speaker: 'nami', pos: 'right', line: "Five crewmates are posted at lookout points, connected like a family tree: one at the center, two and three branching off from one, and four and five branching off from two. I want the LONGEST rope bridge connecting any two of them — and it doesn't have to pass through the center.", sfx: null },
      { speaker: 'brook', pos: 'left', line: "Yohohoho, a bridge that may skip the captain entirely? How delightfully mutinous.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Measure it from the bottom up. At every crewmate, ask: how tall is my left branch, and how tall is my right branch? The longest bridge crossing through ME is left-height plus right-height — track the biggest one we see anywhere in the tree, not just at the center.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Crewmate four: no branches at all. Height one. Crewmate five: same, height one. Neither contributes a bridge on their own.", p: { nodeLL: 'lit', nodeLR: 'lit' }, l: { height: 'h(4)=1, h(5)=1', best: 'best = 0' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Crewmate two: left branch height one (crewmate four), right branch height one (crewmate five). A bridge through crewmate two spans one plus one — two rope-lengths. That's our best so far. Crewmate two's own height is one more than the taller branch: two.", p: { nodeL: 'lit' }, l: { height: 'h(2) = 1 + max(1,1) = 2', best: 'best = 1 + 1 = 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Crewmate three: no branches. Height one. No bridge to track there.", p: { nodeR: 'lit' }, l: { height: 'h(3) = 1', best: 'best = 2' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "The center, crewmate one: left branch height two (crewmate two's whole side), right branch height one (crewmate three). A bridge through the center spans two plus one — THREE rope-lengths. That beats our previous best of two.", p: { root: 'lit' }, l: { height: 'h(1) = 1 + max(2,1) = 3', best: 'best = 2 + 1 = 3' }, sfx: 'gong' },
      { speaker: 'nami', pos: 'right', line: "Three rope-lengths, running from crewmate four or five, through crewmate two, through the center, out to crewmate three. And it never mattered that the center was involved — the math treated it the same as any other post.", p: { root: 'good', nodeL: 'good', nodeR: 'good', nodeLL: 'good', nodeLR: 'good' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Longest bridge on the whole island, and we found it just by asking every post how tall its own branches were!", sfx: 'victory' }
    ],
    complexity: 'Time: O(n) — one post-order pass, each node visited once, height and best-diameter both computed on the way back up. Space: O(h) — recursion stack depth equals the tree height.',
    pitfall: 'Tracking the diameter only AT the root (root-left-height + root-right-height) instead of checking every node — the longest path often lives entirely inside one subtree and never touches the root at all, like the four/two/five side of this very example if crewmate three were removed.',
    solution: `def diameter_of_binary_tree(root) -> int:
      diameter = 0

      def height(node) -> int:
          nonlocal diameter
          if not node:
              return 0
          left_h = height(node.left)
          right_h = height(node.right)
          diameter = max(diameter, left_h + right_h)  # best bridge through this node
          return 1 + max(left_h, right_h)

      height(root)
      return diameter`
  };
  E['validate-binary-search-tree'] = {
    id: 'validate-binary-search-tree',
    epNumber: 36,
    title: 'The Forged Bounty Ledger',
    patternId: 'binary-search-trees',
    leetcode: { name: 'Validate Binary Search Tree', number: 98, difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
    problem: "Given the root of a binary tree, determine whether it is a valid binary search tree (BST): for every node, ALL values in its left subtree must be smaller than the node's value, and ALL values in its right subtree must be larger — not just the node's immediate children, but every descendant at every depth.",
    example: 'tree = [10, 5, 15, null, null, 6, 20] (10 is root; 5 and 15 are its children; 6 and 20 are children of 15)  →  answer: false (6 sits in 10\'s right subtree but is smaller than 10)',
    h: 230,
    props: [
      { id: 'p0', emoji: '📜', label: '10', x: 50, y: 12 },
      { id: 'p1', emoji: '📜', label: '5', x: 25, y: 42 },
      { id: 'p2', emoji: '📜', label: '15', x: 75, y: 42 },
      { id: 'p3', emoji: '📜', label: '6', x: 62, y: 72 },
      { id: 'p4', emoji: '📜', label: '20', x: 88, y: 72 }
    ],
    ledger: [
      { id: 'range', emoji: '📐', x: 50, y: 94 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Sengoku found this filed as a proper Bounty Ledger — a search tree, sorted so anyone can find a name by going left for smaller, right for bigger! But is it REAL, or forged?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "The rule for a real one is strict: at EVERY node, everything in its left branch must be smaller, and everything in its right branch must be bigger — no matter how many levels down.", sfx: null },
      { speaker: 'chopper', pos: 'left', line: "Can't we just check each entry against its own parent? That seems like less work.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "That's the trap. A node has to obey EVERY ancestor above it, not just the one directly above. So as I go down, I'll carry a valid range — a floor and a ceiling — that narrows at each branch.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Root: 10, range is wide open. Fine. Its left branch must now stay below 10; its right branch must stay above 10.", p: { p0: 'lit' }, l: { range: '(-inf, inf)' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Left to 5, range (-inf, 10): 5 fits, no children to check. That whole branch is clean.", p: { p0: 'good', p1: 'good' }, l: { range: '(-inf, 10)' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Right to 15, range (10, inf): 15 fits. Its left child now inherits BOTH bounds — must stay above 10 (from the root) AND below 15 (from its own parent).", p: { p2: 'lit' }, l: { range: '(10, inf)' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "15's left child is 6. Range required: (10, 15). 6 is below 15, sure — but it is NOT above 10. Forged.", p: { p3: 'bad' }, l: { range: '(10, 15) → 6 fails!' }, sfx: 'error' },
      { speaker: 'nami', pos: 'left', line: "And there's the con — if we'd only compared 6 to its direct parent, 15, it would've looked perfectly fine. The root's rule has to follow every entry all the way down.", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! One sneaky little 6 stuffed two levels deep, and the WHOLE ledger's a fake!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "Answer: false. We didn't even need to check 20 once the left side broke it.", p: { p4: 'dim' }, sfx: 'victory' }
    ],
    complexity: 'Time: O(n) — every node is visited once with its running (low, high) range. Space: O(h) for the recursion stack, where h is the tree height (O(n) worst case for a skewed tree, O(log n) for a balanced one).',
    pitfall: "Comparing each node only to its immediate parent instead of tracking the full inherited (low, high) range from every ancestor. That naive check would wrongly accept [10,5,15,null,null,6,20] as valid, since 6 < 15 looks fine locally even though 6 violates the root's rule.",
    solution: `def is_valid_bst(root):
      def validate(node, low, high):
          if not node:
              return True
          if not (low < node.val < high):
              return False
          return validate(node.left, low, node.val) and validate(node.right, node.val, high)
      return validate(root, float("-inf"), float("inf"))`
  };

  E['lowest-common-ancestor-of-a-bst'] = {
    id: 'lowest-common-ancestor-of-a-bst',
    epNumber: 38,
    title: 'The Fork in the Log Pose Trail',
    patternId: 'binary-search-trees',
    leetcode: { name: 'Lowest Common Ancestor of a Binary Search Tree', number: 235, difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' },
    problem: "Given the root of a binary search tree (BST) and two of its node values, p and q, find the lowest common ancestor (LCA) — the deepest node that has both p and q as descendants (a node can be its own descendant).",
    example: 'tree = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5] (6 root; 2 and 8 its children; 0,4 under 2; 7,9 under 8; 3,5 under 4), p = 3, q = 5  →  answer: 4',
    h: 250,
    props: [
      { id: 'p0', emoji: '🏴', label: '6', x: 50, y: 10 },
      { id: 'p1', emoji: '🏴', label: '2', x: 25, y: 36 },
      { id: 'p2', emoji: '🏴', label: '8', x: 75, y: 36 },
      { id: 'p3', emoji: '🏴', label: '0', x: 10, y: 62 },
      { id: 'p4', emoji: '🏴', label: '4', x: 40, y: 62 },
      { id: 'p5', emoji: '🏴', label: '7', x: 60, y: 62 },
      { id: 'p6', emoji: '🏴', label: '9', x: 90, y: 62 },
      { id: 'p7', emoji: '🧭', label: '3', x: 30, y: 90 },
      { id: 'p8', emoji: '🧭', label: '5', x: 50, y: 90 }
    ],
    ledger: [
      { id: 'compare', emoji: '🧭', x: 50, y: 12 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Two scouts are posted on this sorted lookout tree — one at value 3, one at value 5. Command wants the lowest post that watches over BOTH of them.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "The safe way: walk from the root all the way down to 3, walk from the root all the way down to 5, write down both full paths, then compare them to see where they last agree. Works, but it's two walks and two lists.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "We can do it in ONE walk, because this is a search tree. At each post, compare both 3 and 5 to the post's value: if BOTH are smaller, the answer is further left. If BOTH are bigger, further right. The moment they land on different sides, that post IS the answer.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Start at 6: is 3 < 6? Yes. Is 5 < 6? Yes. Both smaller — go left.", p: { p0: 'lit' }, l: { compare: '3, 5 < 6 → go left' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "At 2: is 3 < 2? No. Is 5 < 2? No. Both are BIGGER than 2 — go right.", p: { p0: 'dim', p1: 'lit' }, l: { compare: '3, 5 > 2 → go right' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "At 4: 3 is smaller than 4, but 5 is bigger than 4. They finally split! This is the deepest post where the two trails part ways — so 4 is the lowest common ancestor.", p: { p1: 'good', p4: 'good' }, l: { compare: '3 < 4 < 5 → split! LCA = 4' }, sfx: 'gong' },
      { speaker: 'chopper', pos: 'left', line: "Wait, what if one scout IS an ancestor of the other, like p=2 and q=4? Does the trick still work?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Yes — at post 2, 4 wouldn't be strictly less than 2, so we'd stop right there and 2 itself is the split point, since 2 is an ancestor of 4 by definition.", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! And we never even looked at 0, 8, 7, or 9 — straight down the middle and stop the second the trail forks!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "One pass, no stored paths. That's the whole trick.", sfx: 'victory' }
    ],
    complexity: 'Time: O(h), one downward walk where h is the tree height. Space: O(1) iterative (O(h) if written recursively, for the call stack).',
    pitfall: "Ignoring the BST ordering and solving it like a generic binary tree LCA (recursing into both children and bubbling results up), which needs O(n) time and extra space. A BST already tells you which side to go with a single value comparison — use that instead of a full traversal.",
    solution: `def lowest_common_ancestor(root, p, q):
      node = root
      while node:
          if p.val < node.val and q.val < node.val:
              node = node.left
          elif p.val > node.val and q.val > node.val:
              node = node.right
          else:
              return node
      return None`
  };

  E['kth-smallest-element-in-a-bst'] = {
    id: 'kth-smallest-element-in-a-bst',
    epNumber: 37,
    title: "Sengoku's Sorted Vault",
    patternId: 'binary-search-trees',
    leetcode: { name: 'Kth Smallest Element in a BST', number: 230, difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/' },
    problem: 'Given the root of a binary search tree (BST) and an integer k, find the k-th smallest value stored in the tree (k is 1-indexed, so k=1 means the smallest).',
    example: 'tree = [5, 3, 6, 2, 4, null, null, 1] (5 root; 3,6 its children; 2,4 under 3; 1 under 2), k = 3  →  answer: 3',
    h: 250,
    props: [
      { id: 'p0', emoji: '💰', label: '5', x: 50, y: 10 },
      { id: 'p1', emoji: '💰', label: '3', x: 30, y: 38 },
      { id: 'p2', emoji: '💰', label: '6', x: 72, y: 38 },
      { id: 'p3', emoji: '💰', label: '2', x: 15, y: 64 },
      { id: 'p4', emoji: '💰', label: '4', x: 45, y: 64 },
      { id: 'p5', emoji: '💰', label: '1', x: 8, y: 90 }
    ],
    ledger: [
      { id: 'count', emoji: '🔢', x: 50, y: 90 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Sengoku's vault is sorted like a search tree: k = 3. We need the 3rd-smallest bounty on file — without dumping every entry out and sorting them again.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Here's the trick: an INORDER walk — all of the left branch, then the node itself, then all of the right branch — visits every BST node in strictly ascending order automatically. That's just what left-smaller/right-bigger means, applied recursively.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "So instead of pulling all six values into a list and sorting — O(n log n) — we walk in that order and just COUNT, stopping the instant we hit the k-th one.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Dive left first, as far as it goes: 5 to 3.", p: { p0: 'dim', p1: 'lit' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Still left: 3 to 2.", p: { p1: 'dim', p3: 'lit' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Still left: 2 to 1 — no left child left. This is the smallest value in the whole tree, so the walk finally visits it first.", p: { p3: 'dim', p5: 'lit' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Visit 1: count = 1. Not k yet. 1 has no right child either, so step back up to 2.", l: { count: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Visit 2: count = 2. Still not k. No right child under 2 either, so step back up to 3.", p: { p3: 'good' }, l: { count: '2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Visit 3: count = 3. That's k! The 3rd smallest value is 3 — stop right here.", p: { p1: 'good' }, l: { count: '3 → match!' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! And we never even had to look at 4, 5, or 6!", sfx: 'pop' },
      { speaker: 'chopper', pos: 'left', line: "That early stop matters a lot when k is small but the vault has thousands of entries — no reason to sort the whole thing.", sfx: 'victory' }
    ],
    complexity: 'Time: O(H + k) on average with the early stop (H = height to reach the leftmost node), O(n) worst case if k is close to n. Space: O(H) for the traversal stack.',
    pitfall: "Doing a full inorder traversal into a list first and then indexing list[k-1]. That always costs O(n) time and O(n) space, even when k is 1 — stopping the walk the moment the count hits k avoids visiting the rest of the tree at all.",
    solution: `def kth_smallest(root, k):
      count = 0
      stack = []
      node = root
      while stack or node:
          while node:
              stack.append(node)
              node = node.left
          node = stack.pop()
          count += 1
          if count == k:
              return node.val
          node = node.right
      return -1`
  };

  E['kth-largest-element-in-an-array'] = {
    id: 'kth-largest-element-in-an-array',
    epNumber: 39,
    title: "Weatheria's Second-Strongest Storm",
    patternId: 'heaps-top-k',
    leetcode: { name: 'Kth Largest Element in an Array', number: 215, difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
    problem: "Given an unsorted array of numbers and an integer k, find the k-th LARGEST value in the array (not the k-th distinct value — duplicates count by position).",
    example: 'nums = [3, 2, 1, 5, 6, 4], k = 2  →  answer: 5 (sorted descending: 6, 5, 4, 3, 2, 1 — the 2nd entry is 5)',
    h: 230,
    props: [
      { id: 'p0', emoji: '⛈️', label: '3', x: 8, y: 40 },
      { id: 'p1', emoji: '⛈️', label: '2', x: 24, y: 40 },
      { id: 'p2', emoji: '⛈️', label: '1', x: 40, y: 40 },
      { id: 'p3', emoji: '⛈️', label: '5', x: 56, y: 40 },
      { id: 'p4', emoji: '⛈️', label: '6', x: 72, y: 40 },
      { id: 'p5', emoji: '⛈️', label: '4', x: 88, y: 40 }
    ],
    ledger: [
      { id: 'heap', emoji: '📋', x: 50, y: 80 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Weatheria's tracking six storm readings: 3, 2, 1, 5, 6, 4. We need the SECOND-strongest one, k = 2.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "Sort all six and grab index 1 — that works, but it's O(n log n) and we'd re-sort readings we don't even care about.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Instead, keep a min-heap that holds only the k STRONGEST readings seen so far. Every time it grows past size k, evict the weakest one inside it. Whatever survives on top at the end is exactly the k-th largest.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Reading 3: heap has room, just drop it in.", p: { p0: 'lit' }, l: { heap: '[3]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Reading 2: heap has room (size 2 = k), drop it in too. Weakest on top is 2.", p: { p1: 'lit' }, l: { heap: '[2, 3]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Reading 1: push it in, now size 3 — over capacity. Evict the weakest, which is 1 itself.", p: { p2: 'bad' }, l: { heap: '[2, 3] (1 evicted)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Reading 5: push, size 3, evict weakest — that's 2 this time.", p: { p1: 'dim', p3: 'lit' }, l: { heap: '[3, 5] (2 evicted)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Reading 6: push, size 3, evict weakest — 3 goes.", p: { p0: 'dim', p4: 'lit' }, l: { heap: '[5, 6] (3 evicted)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Reading 4: push, size 3, evict weakest — 4 is the smallest of the three, so it's the one that leaves immediately.", p: { p5: 'bad' }, l: { heap: '[5, 6] (4 evicted)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "No readings left. The weakest survivor still sitting on top of our size-2 heap is 5 — that's the 2nd-strongest storm.", p: { p3: 'good', p4: 'good' }, l: { heap: '[5, 6] → answer: 5' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! We only ever kept two readings around at once, no matter how many storms rolled in!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "That's the point — the heap never holds more than k.", sfx: 'victory' }
    ],
    complexity: 'Time: O(n log k) — each of the n elements costs at most one O(log k) push and possibly one O(log k) pop on a heap capped at size k. Space: O(k) for the heap.',
    pitfall: "Building a max-heap out of ALL n elements (or fully sorting the array) instead of capping a min-heap at size k. It still gives the right answer, but costs O(n log n) time and O(n) space instead of O(n log k) and O(k) — wasteful when k is much smaller than n.",
    solution: `import heapq

  def find_kth_largest(nums, k):
      heap = []
      for num in nums:
          heapq.heappush(heap, num)
          if len(heap) > k:
              heapq.heappop(heap)
      return heap[0]`
  };

  E['top-k-frequent-elements'] = {
    id: 'top-k-frequent-elements',
    epNumber: 40,
    title: 'The Two Most-Printed Wanted Posters',
    patternId: 'heaps-top-k',
    leetcode: { name: 'Top K Frequent Elements', number: 347, difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/' },
    problem: 'Given an array of numbers and an integer k, return the k values that appear most frequently in the array (in any order).',
    example: 'nums = [1, 1, 1, 2, 2, 3], k = 2  →  answer: [1, 2] (1 appears 3 times, 2 appears 2 times, 3 appears once)',
    h: 220,
    props: [
      { id: 'p0', emoji: '📄', label: '1 ×3', x: 20, y: 40 },
      { id: 'p1', emoji: '📄', label: '2 ×2', x: 50, y: 40 },
      { id: 'p2', emoji: '📄', label: '3 ×1', x: 80, y: 40 }
    ],
    ledger: [
      { id: 'heap', emoji: '📋', x: 50, y: 82 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "The Marines seized six wanted posters: 1, 1, 1, 2, 2, 3. HQ only has wall space for the k = 2 most REPRINTED faces.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "First, count how often each face shows up — that part's unavoidable. Tally: 1 appears 3 times, 2 appears 2 times, 3 appears once.", p: { p0: 'lit', p1: 'lit', p2: 'lit' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Now, instead of sorting all the distinct faces by count, keep a min-heap of size k keyed on frequency — the k MOST reprinted faces seen so far. Whenever it grows past k, evict whichever one has the LOWEST count.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Face 1, count 3: heap has room, drop it in.", l: { heap: '[(3:1)]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Face 2, count 2: heap has room (size 2 = k), drop it in too. Lowest count on top is 2.", l: { heap: '[(2:2), (3:1)]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Face 3, count 1: push it, size 3 — over capacity. Evict the lowest count in the heap, which is face 3 itself.", p: { p2: 'bad' }, l: { heap: '[(2:2), (3:1)] (3 evicted)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "No faces left to check. Whatever survives in the heap IS our answer, in any order.", p: { p0: 'good', p1: 'good' }, l: { heap: '→ answer: [1, 2]' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Poor guy with just one poster never even had a chance!", sfx: 'pop' },
      { speaker: 'chopper', pos: 'left', line: "And notice we only ever compare COUNTS in the heap, not the face values — the values just ride along as the payload.", sfx: null },
      { speaker: 'zoro', pos: 'left', line: "Two posters on the wall. Order doesn't matter, only the set does.", sfx: 'victory' }
    ],
    complexity: 'Time: O(n + m log k) — O(n) to tally frequencies for n elements, then O(log k) per push/pop for each of the m distinct values on a heap capped at size k. Space: O(m + k) for the frequency map and the heap.',
    pitfall: "Pushing every raw occurrence into the heap instead of one aggregated (count, value) entry per distinct value. Without tallying first, the heap size no longer tracks 'how many distinct values we're keeping' and duplicate entries corrupt the frequency comparison entirely.",
    solution: `import heapq
  from collections import Counter

  def top_k_frequent(nums, k):
      counts = Counter(nums)
      heap = []
      for val, freq in counts.items():
          heapq.heappush(heap, (freq, val))
          if len(heap) > k:
              heapq.heappop(heap)
      return [val for freq, val in heap]`
  };

  E['merge-k-sorted-lists'] = {
    id: 'merge-k-sorted-lists',
    epNumber: 41,
    title: 'Three Maps, One True Route',
    patternId: 'heaps-top-k',
    leetcode: { name: 'Merge k Sorted Lists', number: 23, difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
    problem: 'Given k linked lists, each already sorted in ascending order, merge them all into a single sorted linked list and return it.',
    example: 'lists = [[1,4,5], [1,3,4], [2,6]]  →  answer: [1,1,2,3,4,4,5,6]',
    h: 260,
    props: [
      { id: 'a0', emoji: '🗺️', label: '1', x: 15, y: 18 },
      { id: 'a1', emoji: '🗺️', label: '4', x: 40, y: 18 },
      { id: 'a2', emoji: '🗺️', label: '5', x: 65, y: 18 },
      { id: 'b0', emoji: '🗺️', label: '1', x: 15, y: 46 },
      { id: 'b1', emoji: '🗺️', label: '3', x: 40, y: 46 },
      { id: 'b2', emoji: '🗺️', label: '4', x: 65, y: 46 },
      { id: 'c0', emoji: '🗺️', label: '2', x: 15, y: 74 },
      { id: 'c1', emoji: '🗺️', label: '6', x: 40, y: 74 }
    ],
    ledger: [
      { id: 'heap', emoji: '📋', x: 78, y: 46 },
      { id: 'out', emoji: '🧭', x: 50, y: 94 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Three separate route maps, each already sorted by distance: [1,4,5], [1,3,4], and [2,6]. The Log Pose needs them merged into ONE single sorted route.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "Dump every stop into one pile and sort it fresh — that works, but it throws away the fact that each map is already sorted.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Instead: a min-heap holding just the CURRENT front stop of each map. Always take the smallest front overall, then bring that same map's next stop up to take its place.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Fronts loaded: map A shows 1, map B shows 1, map C shows 2.", p: { a0: 'lit', b0: 'lit', c0: 'lit' }, l: { heap: '[1(A), 1(B), 2(C)]', out: '[]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Smallest is 1 from map A. Take it, output grows. Map A's next stop, 4, enters the heap.", p: { a0: 'good', a1: 'lit' }, l: { heap: '[1(B), 2(C), 4(A)]', out: '[1]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Smallest is 1 from map B. Take it. Map B's next, 3, enters.", p: { b0: 'good', b1: 'lit' }, l: { heap: '[2(C), 3(B), 4(A)]', out: '[1, 1]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Smallest is 2 from map C. Take it. Map C's next, 6, enters.", p: { c0: 'good', c1: 'lit' }, l: { heap: '[3(B), 4(A), 6(C)]', out: '[1, 1, 2]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Smallest is 3 from map B. Take it. Map B's next, 4, enters.", p: { b1: 'good', b2: 'lit' }, l: { heap: '[4(A), 4(B), 6(C)]', out: '[1, 1, 2, 3]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Two fronts tied at 4 — take either, say map A's. It has no stops left after this.", p: { a1: 'good' }, l: { heap: '[4(B), 5(A), 6(C)]', out: '[1, 1, 2, 3, 4]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Take map B's 4. Map B is now fully exhausted — nothing new enters for it.", p: { b2: 'good' }, l: { heap: '[5(A), 6(C)]', out: '[1, 1, 2, 3, 4, 4]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Take 5, map A's last stop.", p: { a2: 'good' }, l: { heap: '[6(C)]', out: '[1, 1, 2, 3, 4, 4, 5]' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Take 6, map C's last stop. Heap's empty — every map is fully spent.", p: { c1: 'good' }, l: { heap: '[]', out: '[1, 1, 2, 3, 4, 4, 5, 6]' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! One clean route out of three tangled ones!", sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "The heap only ever holds one stop per map — never more than k at a time.", sfx: null }
    ],
    complexity: 'Time: O(N log k) — N is the total number of nodes across all lists, and every node costs one O(log k) push/pop on a heap that never holds more than k fronts. Space: O(k) for the heap, plus O(N) for the merged output.',
    pitfall: "In Python, pushing raw (value, node) tuples into heapq without a tie-breaker. When two front values are equal, heapq compares the NEXT tuple element to break the tie — and linked-list nodes aren't comparable, so it raises a TypeError. Push (value, list_index, node) instead, so ties fall back to comparing plain integers.",
    solution: `import heapq

  def merge_k_lists(lists):
      heap = []
      for i, node in enumerate(lists):
          if node:
              heapq.heappush(heap, (node.val, i, node))

      dummy = tail = ListNode()
      while heap:
          val, i, node = heapq.heappop(heap)
          tail.next = node
          tail = node
          if node.next:
              heapq.heappush(heap, (node.next.val, i, node.next))
      return dummy.next`
  };

  E['subsets'] = {
    id: 'subsets',
    epNumber: 44,
    title: 'Every Way to Split the Loot',
    patternId: 'backtracking',
    leetcode: { name: 'Subsets', number: 78, difficulty: 'Medium', url: 'https://leetcode.com/problems/subsets/' },
    problem: 'Given an array of unique numbers, return every possible subset (the power set) — including the empty subset and the full array itself, in any order.',
    example: 'nums = [1, 2, 3]  →  answer: [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]  (8 subsets total)',
    h: 220,
    props: [
      { id: 'p0', emoji: '🧭', label: '1', x: 20, y: 40 },
      { id: 'p1', emoji: '🧭', label: '2', x: 50, y: 40 },
      { id: 'p2', emoji: '🧭', label: '3', x: 80, y: 40 }
    ],
    ledger: [
      { id: 'path', emoji: '🎒', x: 35, y: 80 },
      { id: 'found', emoji: '🔢', x: 70, y: 80 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Three treasure emblems on the table: 1, 2, 3. The archivists want every possible bag we could pack — including the empty bag and the bag with everything.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "For each emblem, in order, we either pack it or skip it. And here's the key: EVERY partial bag we build along the way is itself a valid answer — not just the finished ones. Record it, then keep going deeper.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Bag is empty right now — that counts as subset #1 all by itself.", l: { path: '[]', found: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Pack 1. New bag [1] — record it, subset #2.", p: { p0: 'lit' }, l: { path: '[1]', found: '2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Pack 2 on top of 1. Bag [1,2] — subset #3.", p: { p1: 'lit' }, l: { path: '[1, 2]', found: '3' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Pack 3 on top. Bag [1,2,3] — subset #4. Nothing left after 3, so UNDO it — unpack 3, unpack 2 — back to just [1].", p: { p2: '', p1: '' }, l: { path: '[1]', found: '4' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'left', line: "That's the backtrack — we don't restart from scratch, we just take the last item back out and try the NEXT option in its place.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "With 1 still packed, try 3 instead of 2. Bag [1,3] — subset #5. Fully unpack back to empty.", p: { p2: 'lit' }, l: { path: '[1, 3]', found: '5' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Bag empty again. Skip 1 entirely, pack 2. Bag [2] — subset #6. Pack 3 too: [2,3] — subset #7. Unpack both.", p: { p0: '', p2: '' }, l: { path: '[]', found: '7' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Only 3 left to try alone: bag [3] — subset #8. Unpack it — nothing left to try anywhere.", p: { p0: 'good', p1: 'good', p2: 'good' }, l: { path: '[]', found: '8' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Eight bags out of three emblems — empty, three singles, three pairs, and the full haul!", sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "Two choices per emblem, three emblems: 2×2×2 = 8. Every combo, exactly once.", sfx: null }
    ],
    complexity: 'Time: O(n × 2^n) — there are 2^n subsets, and copying each one into the result costs up to O(n). Space: O(n) for the recursion depth, plus O(n × 2^n) to store all the output subsets.',
    pitfall: "Appending the live `path` list directly to the results instead of a COPY (path[:]). Since path is mutated in place as the recursion continues (more items packed, then unpacked), every stored 'subset' would actually be a reference to the SAME list, and they'd all end up showing whatever path looks like at the very end — usually empty.",
    solution: `def subsets(nums):
      result = []
      path = []

      def backtrack(start):
          result.append(path[:])
          for i in range(start, len(nums)):
              path.append(nums[i])
              backtrack(i + 1)
              path.pop()

      backtrack(0)
      return result`
  };

  E['permutations'] = {
    id: 'permutations',
    epNumber: 43,
    title: "The Crow's Nest Watch Rotation",
    patternId: 'backtracking',
    leetcode: { name: 'Permutations', number: 46, difficulty: 'Medium', url: 'https://leetcode.com/problems/permutations/' },
    problem: 'Given an array of unique numbers, return every possible ordering (permutation) of them, in any order.',
    example: 'nums = [1, 2, 3]  →  answer: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]  (6 orderings total)',
    h: 220,
    props: [
      { id: 'p0', emoji: '👤', label: '1', x: 20, y: 35 },
      { id: 'p1', emoji: '👤', label: '2', x: 50, y: 35 },
      { id: 'p2', emoji: '👤', label: '3', x: 80, y: 35 }
    ],
    ledger: [
      { id: 'path', emoji: '🌀', x: 35, y: 75 },
      { id: 'found', emoji: '🔢', x: 70, y: 75 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Three crewmates — 1, 2, 3 — need a lookout ORDER for the Crow's Nest. Unlike splitting loot, order matters here: [1,2,3] and [3,2,1] are different rotations.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Fill the rotation one slot at a time: pick any crewmate not already placed, add them to the line, and recurse. Once the line is full, record it — then undo the last pick and try the next unused crewmate in that slot.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Slot 1: place 1.", p: { p0: 'lit' }, l: { path: '[1]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Slot 2: only 2 or 3 remain unused — place 2.", p: { p1: 'lit' }, l: { path: '[1, 2]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Slot 3: only 3 remains — place it. Line is full: [1,2,3] — rotation #1!", p: { p2: 'lit' }, l: { path: '[1, 2, 3]', found: '1' }, sfx: 'gong' },
      { speaker: 'robin', pos: 'right', line: "Undo slot 3, undo slot 2 — back to [1]. Now try 3 in slot 2 instead, since 2 was already tried there.", p: { p1: '', p2: '' }, l: { path: '[1]' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Slot 2: place 3. Slot 3: only 2 left — place it. [1,3,2] — rotation #2! Then fully undo back to an empty line.", p: { p2: 'lit', p1: 'lit' }, l: { path: '[1, 3, 2]', found: '2' }, sfx: 'gong' },
      { speaker: 'nami', pos: 'left', line: "Every branch under '1 first' is used up — two rotations found. Same process starting with 2 first, then with 3 first.", p: { p0: '', p1: '', p2: '' }, l: { path: '[]' }, sfx: null },
      { speaker: 'usopp', pos: 'left', line: "Starting with 2: [2,1,3] and [2,3,1]. Starting with 3: [3,1,2] and [3,2,1]. Same choose-recurse-undo dance, every time.", p: { p0: 'good', p1: 'good', p2: 'good' }, l: { found: '6' }, sfx: 'chime' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Six full rotations out of three lookouts!", sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "3 choices for slot 1, times 2 for slot 2, times 1 for slot 3 — 3! = 6. Order matters, so it grows a lot faster than subsets did.", sfx: null }
    ],
    complexity: 'Time: O(n × n!) — there are n! permutations, each costing O(n) to build and copy. Space: O(n) for the recursion depth and the `used` tracker, plus O(n × n!) to store the output.',
    pitfall: "Forgetting to reset a crewmate's `used` flag (or fully undo the placement) after backtracking out of a branch. Leftover 'used' markers make later branches silently skip that crewmate, undercounting the permutations — the whole point of backtracking is that undoing a choice must restore the exact state from before it was made.",
    solution: `def permute(nums):
      result = []
      path = []
      used = [False] * len(nums)

      def backtrack():
          if len(path) == len(nums):
              result.append(path[:])
              return
          for i in range(len(nums)):
              if used[i]:
                  continue
              used[i] = True
              path.append(nums[i])
              backtrack()
              path.pop()
              used[i] = False

      backtrack()
      return result`
  };

  E['combination-sum'] = {
    id: 'combination-sum',
    epNumber: 42,
    title: "Exact Toll for Punk Hazard's Gate",
    patternId: 'backtracking',
    leetcode: { name: 'Combination Sum', number: 39, difficulty: 'Medium', url: 'https://leetcode.com/problems/combination-sum/' },
    problem: 'Given an array of distinct positive candidate numbers and a target, return every unique combination of candidates that sums exactly to the target. The SAME candidate may be reused any number of times, and combinations that use the same numbers in a different order do not count as different.',
    example: 'candidates = [2, 3, 6, 7], target = 7  →  answer: [[2,2,3], [7]]',
    h: 220,
    props: [
      { id: 'p0', emoji: '🪩', label: '2', x: 15, y: 35 },
      { id: 'p1', emoji: '🪩', label: '3', x: 40, y: 35 },
      { id: 'p2', emoji: '🪩', label: '6', x: 65, y: 35 },
      { id: 'p3', emoji: '🪩', label: '7', x: 90, y: 35 }
    ],
    ledger: [
      { id: 'path', emoji: '🎟️', x: 32, y: 78 },
      { id: 'sum', emoji: '🧮', x: 70, y: 78 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Punk Hazard's toll gate takes coins worth 2, 3, 6, or 7 — reuse any coin as many times as you like — and it must land on EXACTLY 7. Find every way to pay it.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "Brute-forcing every possible pile of coins gets messy fast. Better: keep adding coins and track the running total, but the moment it goes OVER 7, that pile is dead — stop right there.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "And to avoid counting [2,3] and [3,2] as different piles, only add coins at the CURRENT position or later in the list — never go back to an earlier coin type.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Add a 2. Pile [2], sum 2.", p: { p0: 'lit' }, l: { path: '[2]', sum: '2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Add another 2 (reuse allowed). Pile [2,2], sum 4.", l: { path: '[2, 2]', sum: '4' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Add a third 2. Pile [2,2,2], sum 6. Still under 7 — keep going.", l: { path: '[2, 2, 2]', sum: '6' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "A fourth 2 would push the sum to 8 — over target. Dead end, undo it. Try 3 instead: pile [2,2,3], sum 7. EXACT MATCH — pay accepted!", p: { p1: 'lit' }, l: { path: '[2, 2, 3]', sum: '7 → match!' }, sfx: 'gong' },
      { speaker: 'robin', pos: 'right', line: "Undo all the way back to empty. Try starting with 3 alone, or 6 alone — 3+3+3=9, 3+6=9, 6+6=12, 6+7=13 — every path through them overshoots 7 without ever landing on it exactly. All dead ends.", p: { p0: '', p1: '', p2: 'bad' }, l: { path: '[]', sum: '0' }, sfx: 'error' },
      { speaker: 'robin', pos: 'right', line: "Last candidate: 7 alone. Pile [7], sum 7 — EXACT MATCH again!", p: { p3: 'lit' }, l: { path: '[7]', sum: '7 → match!' }, sfx: 'gong' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Two ways through the gate: three coins, or just the one big 7!", p: { p0: 'good', p1: 'good', p3: 'good' }, sfx: 'victory' },
      { speaker: 'chopper', pos: 'left', line: "Pruning the moment the sum passes 7 is what saves us — no point building a taller pile once it's already too heavy.", sfx: null }
    ],
    complexity: "Time: exponential in the worst case — roughly O(2^(target / min(candidates))) branches are explored, though the sum-exceeds-target prune cuts most of them off early. Space: O(target / min(candidates)) for the recursion depth of the deepest valid pile.",
    pitfall: "Copying the Subsets pattern exactly and recursing with i+1 instead of i. That would forbid reusing the SAME candidate twice in a row, making it impossible to ever build [2,2,3] — Combination Sum explicitly allows unlimited reuse of each candidate, so the next recursive call must still start at index i, not i+1.",
    solution: `def combination_sum(candidates, target):
      result = []
      path = []

      def backtrack(start, remaining):
          if remaining == 0:
              result.append(path[:])
              return
          if remaining < 0:
              return
          for i in range(start, len(candidates)):
              path.append(candidates[i])
              backtrack(i, remaining - candidates[i])
              path.pop()

      backtrack(0, target)
      return result`
  };
  E['number-of-islands'] = {
    id: 'number-of-islands',
    epNumber: 45,
    title: 'The Reef Chart After the Storm',
    patternId: 'graphs-bfs-dfs-topo-union',
    leetcode: { name: 'Number of Islands', number: 200, difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/' },
    problem: "Given a 2D grid where each cell is either land (1) or water (0), count the number of islands. An island is a group of land cells connected horizontally or vertically (never diagonally), surrounded by water on every other side.",
    example: "grid = [[1,1,0],[0,1,0],[0,0,1]]  →  answer: 2 islands",
    h: 240,
    props: [
      { id: 'c00', emoji: '🏝️', label: '', x: 20, y: 18 },
      { id: 'c01', emoji: '🏝️', label: '', x: 50, y: 18 },
      { id: 'c02', emoji: '🌊', label: '', x: 80, y: 18 },
      { id: 'c10', emoji: '🌊', label: '', x: 20, y: 45 },
      { id: 'c11', emoji: '🏝️', label: '', x: 50, y: 45 },
      { id: 'c12', emoji: '🌊', label: '', x: 80, y: 45 },
      { id: 'c20', emoji: '🌊', label: '', x: 20, y: 72 },
      { id: 'c21', emoji: '🌊', label: '', x: 50, y: 72 },
      { id: 'c22', emoji: '🏝️', label: '', x: 80, y: 72 }
    ],
    ledger: [
      { id: 'count', emoji: '🧭', x: 50, y: 94 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "The great cartographer Usopp presents: the reef chart, redrawn after last night's storm! Every square is either dry land or open sea — but the storm scrambled the shoreline into pieces!", sfx: null },
      { speaker: 'chopper', pos: 'right', line: "But some land squares are right next to each other! Do we count each square as its own tiny island, or do the touching ones count as one big island?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "One big island — but only if they touch up, down, left, or right. Diagonal doesn't count. So here's the plan: scan every square once. The moment we find land we haven't charted yet, we flood outward from it, marking every connected land square as the SAME island before we move on.", p: { c02: 'dim', c10: 'dim', c12: 'dim', c20: 'dim', c21: 'dim' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Top-left corner, (0,0): land, and unmarked. New island! I'll flood outward from here.", p: { c00: 'lit' }, l: { count: 'islands: 0' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Its right neighbor (0,1) is also land — same island, mark it too. Its neighbor below (0,1)'s square, (1,1), is land as well — still the same flood.", p: { c01: 'lit', c11: 'lit' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "No more unmarked land touches this cluster. That flood is finished — three squares, one island.", p: { c00: 'good', c01: 'good', c11: 'good' }, l: { count: 'islands: 1' }, sfx: 'chime' },
      { speaker: 'usopp', pos: 'left', line: "Keep scanning! (0,2) sea, skip. (1,0) sea, skip. (1,2) sea, skip. (2,0) and (2,1), both sea, skip and skip!", sfx: null },
      { speaker: 'chopper', pos: 'right', line: "Bottom-right corner, (2,2) — land, and it's never been touched by either flood! That has to be a brand new island, all on its own.", p: { c22: 'lit' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Correct — nothing connects to it. Its own island.", p: { c22: 'good' }, l: { count: 'islands: 2' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Two islands, and we only ever floated over each square ONE time! Perfect for exploring — and for lunch, if either one has meat!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "Scan once. Flood once per new landmass. Never re-check a square that's already been claimed. That's the whole technique.", sfx: null }
    ],
    complexity: "Time: O(rows × cols) — every cell is visited exactly once, either during the outer scan or exactly once during the flood-fill that claims it. Space: O(rows × cols) worst case for the recursion stack (or BFS queue) if the entire grid is a single island.",
    pitfall: "Forgetting to mark a land cell as visited the MOMENT it's added to the flood (not after it's fully processed) — without that, a cell can be re-queued by two different neighbors and get double-counted or cause infinite recursion.",
    solution: `def num_islands(grid):
      if not grid:
          return 0
      rows, cols = len(grid), len(grid[0])
      visited = set()

      def flood(r, c):
          stack = [(r, c)]
          visited.add((r, c))
          while stack:
              cr, cc = stack.pop()
              for dr, dc in ((1,0), (-1,0), (0,1), (0,-1)):
                  nr, nc = cr + dr, cc + dc
                  if (0 <= nr < rows and 0 <= nc < cols
                          and grid[nr][nc] == '1' and (nr, nc) not in visited):
                      visited.add((nr, nc))
                      stack.append((nr, nc))

      islands = 0
      for r in range(rows):
          for c in range(cols):
              if grid[r][c] == '1' and (r, c) not in visited:
                  visited.add((r, c))
                  flood(r, c)
                  islands += 1
      return islands`
  };

  E['course-schedule'] = {
    id: 'course-schedule',
    epNumber: 46,
    title: 'The Order of the Trials',
    patternId: 'graphs-bfs-dfs-topo-union',
    leetcode: { name: 'Course Schedule', number: 207, difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/' },
    problem: "There are numCourses courses labeled 0 to numCourses-1. Given a list of prerequisite pairs [a, b] meaning course b must be completed before course a, determine whether it's possible to finish all courses — that is, whether the prerequisite graph contains no cycle.",
    example: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]  →  answer: true (a valid order is 0, 1, 2, 3)",
    h: 240,
    props: [
      { id: 'n0', emoji: '📘', label: 'Trial 0 (in:0)', x: 50, y: 15 },
      { id: 'n1', emoji: '📘', label: 'Trial 1 (in:1)', x: 20, y: 55 },
      { id: 'n2', emoji: '📘', label: 'Trial 2 (in:1)', x: 80, y: 55 },
      { id: 'n3', emoji: '📘', label: 'Trial 3 (in:2)', x: 50, y: 92 }
    ],
    ledger: [
      { id: 'queue', emoji: '📋', x: 50, y: 55 }
    ],
    steps: [
      { speaker: 'zoro', pos: 'left', line: "Four trials to earn passage past this island. The scroll says Trial 1 needs Trial 0 done first, Trial 2 also needs Trial 0, and Trial 3 needs BOTH Trial 1 and Trial 2 finished before you can attempt it. Can we even complete all four, or is there a loop trapping us?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Count how many un-cleared prerequisites each trial still has — its 'in-degree'. Trial 0 needs none. Trial 1 and Trial 2 each need one. Trial 3 needs two. Any trial with zero remaining prerequisites can be attempted right now.", l: { queue: 'queue: [0]' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Only Trial 0 starts at zero, so it goes in the queue first.", p: { n0: 'lit' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Clear Trial 0. Now anything that listed Trial 0 as a prerequisite gets to drop it — Trial 1's count goes from 1 to 0, Trial 2's count goes from 1 to 0. Both join the queue.", p: { n0: 'good', n1: 'lit', n2: 'lit' }, l: { queue: 'queue: [1, 2]' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Clear Trial 1. Trial 3 needed it — drop Trial 3's count from 2 to 1. Not zero yet, so Trial 3 still waits.", p: { n1: 'good' }, l: { queue: 'queue: [2]' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Clear Trial 2. Trial 3 needed this one too — drop its count from 1 to 0. NOW Trial 3 joins the queue.", p: { n2: 'good', n3: 'lit' }, l: { queue: 'queue: [3]' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Clear Trial 3. Nothing left waiting on anything.", p: { n3: 'good' }, l: { queue: 'queue: []' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "We cleared all four trials — exactly numCourses of them. If even one trial had been stuck forever above zero, that would mean a cycle: two trials each secretly waiting on the other. But nothing got stuck here.", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! No loop, no trap — just do them in this order: 0, then 1 and 2 in either order, then 3!", sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "Peel off whatever's free right now, update what depended on it, repeat. If the queue ever runs dry before every trial is cleared, it's impossible.", sfx: 'pop' }
    ],
    complexity: "Time: O(V + E) — each course enters the queue once, and each prerequisite edge is examined exactly once when its source course is processed. Space: O(V + E) for the adjacency list and in-degree array.",
    pitfall: "Trying to detect the cycle with a single visited/unvisited flag during DFS instead of tracking the current recursion path (or, in the BFS version shown here, comparing the count of processed courses to numCourses) — a course can be fully explored down one branch and still sit on a cycle reachable from another branch.",
    solution: `from collections import deque

  def can_finish(num_courses, prerequisites):
      graph = [[] for _ in range(num_courses)]
      in_degree = [0] * num_courses
      for course, prereq in prerequisites:
          graph[prereq].append(course)
          in_degree[course] += 1

      queue = deque(c for c in range(num_courses) if in_degree[c] == 0)
      cleared = 0
      while queue:
          course = queue.popleft()
          cleared += 1
          for nxt in graph[course]:
              in_degree[nxt] -= 1
              if in_degree[nxt] == 0:
                  queue.append(nxt)

      return cleared == num_courses`
  };

  E['number-of-provinces'] = {
    id: 'number-of-provinces',
    epNumber: 47,
    title: 'Big Mom’s Round Tea Table',
    patternId: 'graphs-bfs-dfs-topo-union',
    leetcode: { name: 'Number of Provinces', number: 547, difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-provinces/' },
    problem: "There are n cities. You're given an n x n matrix isConnected where isConnected[i][j] = 1 if city i and city j are directly connected, and 0 otherwise. A province is a group of cities that are directly or indirectly connected. Return the total number of provinces.",
    example: "isConnected = [[1,1,0],[1,1,0],[0,0,1]]  →  answer: 2 provinces (city 0 and city 1 form one; city 2 is alone)",
    h: 230,
    props: [
      { id: 'city0', emoji: '🏝️', label: 'City 0', x: 20, y: 45 },
      { id: 'city1', emoji: '🏝️', label: 'City 1', x: 50, y: 45 },
      { id: 'city2', emoji: '🏝️', label: 'City 2', x: 80, y: 45 }
    ],
    ledger: [
      { id: 'roots', emoji: '📜', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'nami', pos: 'left', line: "Big Mom's tea table has a seat for every city on this stretch of the Grand Line. The invitation list tells us which pairs of cities have a DIRECT road between them. We need to know: how many separate travel clusters are there in total?", l: { roots: 'roots: 0→0, 1→1, 2→2' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "Give every city its own little flag at first — each one is its own boss, its own root. Whenever we find a direct road between two cities, we merge their flags: one root absorbs the other. At the end, we just count how many distinct roots survive.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "City 0 and City 1: isConnected says 1 — a direct road. Merge them. City 1's flag now points to City 0's root.", p: { city0: 'lit', city1: 'lit' }, l: { roots: 'roots: 0→0, 1→0, 2→2' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'left', line: "City 0 and City 2: isConnected says 0. No road, no merge — leave them as they are.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "City 1 and City 2: also 0. Still no road. City 2 stays its own boss the whole time.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "That's every pair checked. City 0 and City 1 share one root now; City 2 kept its own. Two distinct roots on the table.", p: { city0: 'good', city1: 'good', city2: 'good' }, l: { roots: 'roots: 0→0, 1→0, 2→2  |  2 groups' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Two tea tables' worth of guests, then! One big one for City 0 and City 1, and a lonely little one for City 2!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "Union what's directly linked, let the roots settle, count what's left standing. Never had to trace a single full path by hand.", sfx: null }
    ],
    complexity: "Time: O(n² · α(n)) — we scan the n×n matrix once, and each union/find operation is nearly O(1) with path compression and union by rank. Space: O(n) for the parent array.",
    pitfall: "Forgetting path compression (or union by rank) in the find() step — without it, long chains of merges can degrade each find() toward O(n), turning the whole algorithm quadratic-ish in the worst case instead of near-linear.",
    solution: `def find_circle_num(is_connected):
      n = len(is_connected)
      parent = list(range(n))

      def find(x):
          while parent[x] != x:
              parent[x] = parent[parent[x]]  # path compression
              x = parent[x]
          return x

      def union(a, b):
          root_a, root_b = find(a), find(b)
          if root_a != root_b:
              parent[root_b] = root_a

      for i in range(n):
          for j in range(i + 1, n):
              if is_connected[i][j] == 1:
                  union(i, j)

      return len({find(city) for city in range(n)})`
  };

  E['climbing-stairs'] = {
    id: 'climbing-stairs',
    epNumber: 48,
    title: 'The Crow’s Nest Staircase',
    patternId: 'dynamic-programming',
    leetcode: { name: 'Climbing Stairs', number: 70, difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
    problem: "You're climbing a staircase with n steps. On each move you can climb either 1 step or 2 steps. Return the number of distinct ways to reach the top.",
    example: "n = 5  →  answer: 8 distinct ways",
    h: 200,
    props: [
      { id: 's0', emoji: '🪜', label: 'step 0: ?', x: 8, y: 50 },
      { id: 's1', emoji: '🪜', label: 'step 1: ?', x: 25, y: 50 },
      { id: 's2', emoji: '🪜', label: 'step 2: ?', x: 42, y: 50 },
      { id: 's3', emoji: '🪜', label: 'step 3: ?', x: 59, y: 50 },
      { id: 's4', emoji: '🪜', label: 'step 4: ?', x: 76, y: 50 },
      { id: 's5', emoji: '🪜', label: 'step 5: ?', x: 93, y: 50 }
    ],
    steps: [
      { speaker: 'chopper', pos: 'left', line: "Five steps up to the crow's nest! On every move I can hop up 1 step or 2 steps. How many different ways could I hop all the way to the top?", sfx: null },
      { speaker: 'nami', pos: 'right', line: "If we try to list every possible sequence of hops by hand it balloons fast. Better to build the answer step by step, using the answers for SMALLER staircases we've already solved.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Base cases first. Standing at step 0 already, doing nothing, counts as exactly 1 way. And there's exactly 1 way to reach step 1 — a single hop.", p: { s0: 'good', s1: 'good' }, l: { s0: 'step 0: 1', s1: 'step 1: 1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Every step after that: you either hopped 1 from the step before it, or hopped 2 from the step before THAT. So ways(step) = ways(step-1) + ways(step-2).", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Step 2: ways(1) + ways(0) = 1 + 1 = 2.", p: { s2: 'good' }, l: { s2: 'step 2: 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Step 3: ways(2) + ways(1) = 2 + 1 = 3.", p: { s3: 'good' }, l: { s3: 'step 3: 3' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Step 4: ways(3) + ways(2) = 3 + 2 = 5.", p: { s4: 'good' }, l: { s4: 'step 4: 5' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Step 5, the crow's nest itself: ways(4) + ways(3) = 5 + 3 = 8.", p: { s5: 'good' }, l: { s5: 'step 5: 8' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Eight different ways up, and we barely climbed at all — we just added two numbers, five times!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "You never need the whole staircase in memory, either. Just the last two numbers.", sfx: null }
    ],
    complexity: "Time: O(n) — one pass computing each step's value once from the two before it. Space: O(1) if you only keep the last two values instead of the full table (O(n) as drawn here for the trace).",
    pitfall: "Solving this with naive top-down recursion and no memoization — the same sub-staircases (like ways(2)) get recomputed exponentially many times, blowing up to O(2^n) instead of O(n).",
    solution: `def climb_stairs(n):
      if n <= 1:
          return 1
      prev2, prev1 = 1, 1  # ways(0), ways(1)
      for step in range(2, n + 1):
          prev2, prev1 = prev1, prev1 + prev2
      return prev1`
  };

  E['house-robber'] = {
    id: 'house-robber',
    epNumber: 49,
    title: 'The Alarm-Chained Vault Street',
    patternId: 'dynamic-programming',
    leetcode: { name: 'House Robber', number: 198, difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/' },
    problem: "You're planning a heist down a street of houses, each holding a known amount of loot. Adjacent houses share a connected alarm system — if you rob two houses next to each other, the alarm trips. Return the maximum total loot you can steal without ever robbing two adjacent houses.",
    example: "nums = [2, 7, 9, 3, 1]  →  answer: 12 (rob house 0, house 2, and house 4: 2 + 9 + 1 = 12)",
    h: 210,
    props: [
      { id: 'h0', emoji: '🏠', label: '$2', x: 12, y: 45 },
      { id: 'h1', emoji: '🏠', label: '$7', x: 31, y: 45 },
      { id: 'h2', emoji: '🏠', label: '$9', x: 50, y: 45 },
      { id: 'h3', emoji: '🏠', label: '$3', x: 69, y: 45 },
      { id: 'h4', emoji: '🏠', label: '$1', x: 88, y: 45 }
    ],
    ledger: [
      { id: 'best', emoji: '💰', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'nami', pos: 'left', line: "Five houses on this street, holding 2, 7, 9, 3, and 1 thousand Berries. Rob two houses that are next-door neighbors and both alarms scream at once. What's the most we can walk away with?", sfx: null },
      { speaker: 'luffy', pos: 'right', line: "Easy! Just rob all five!", sfx: null },
      { speaker: 'robin', pos: 'right', line: "The alarms won't allow that, captain. For each house, we only have two honest choices: skip it and keep whatever was best up to the house before it, or rob it and add its loot to whatever was best up to TWO houses before it.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "House 0: nothing before it to conflict with. Best so far: rob it. 2.", p: { h0: 'good' }, l: { best: 'best: 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "House 1: rob it alone (7) beats keeping house 0's 2. Best so far: 7 — meaning house 0's plan gets replaced.", p: { h0: 'dim', h1: 'good' }, l: { best: 'best: 7' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "House 2: skip it and keep 7, OR rob it plus whatever was best before house 1 (which was house 0's 2): 9 + 2 = 11. 11 beats 7 — rob houses 0 and 2.", p: { h1: 'dim', h2: 'good', h0: 'good' }, l: { best: 'best: 11' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "House 3: skip it, keep 11, OR rob it plus the best before house 2 (house 1's 7): 3 + 7 = 10. 11 still wins — skip house 3 entirely.", p: { h3: 'bad' }, l: { best: 'best: 11' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "House 4: skip it, keep 11, OR rob it plus the best before house 3 (still 11, from houses 0 and 2): 1 + 11 = 12. 12 wins!", p: { h4: 'good' }, l: { best: 'best: 12' }, sfx: 'victory' },
      { speaker: 'nami', pos: 'left', line: "Houses 0, 2, and 4: 2 + 9 + 1 = 12,000 Berries, and not one pair of them is adjacent.", sfx: null },
      { speaker: 'luffy', pos: 'right', line: "SHISHISHI! 12,000 Berries of meat money!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'right', line: "Every house only ever looks two decisions back. No need to keep the whole street in your head.", sfx: null }
    ],
    complexity: "Time: O(n) — one pass, constant work per house. Space: O(1) if only the last two running best-totals are kept instead of a full table (O(n) as drawn here for the trace).",
    pitfall: "Comparing a house only against its immediate previous house's best, instead of against 'skip vs. rob + best-before-the-previous-one' — that shortcut misses cases like this one, where the optimal plan skips house 3 entirely because reaching back to house 1 wasn't as good as the run already banked at house 2.",
    solution: `def rob(nums):
      prev2, prev1 = 0, 0  # best total using houses [..i-2], [..i-1]
      for money in nums:
          prev2, prev1 = prev1, max(prev1, prev2 + money)
      return prev1`
  };

  E['coin-change'] = {
    id: 'coin-change',
    epNumber: 50,
    title: 'The Fewest Coins to Buy the Log Pose',
    patternId: 'dynamic-programming',
    leetcode: { name: 'Coin Change', number: 322, difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/' },
    problem: "Given a set of coin denominations and a target amount, return the fewest number of coins needed to make that amount exactly, using an unlimited supply of each denomination. If it's impossible to make that exact amount, return -1.",
    example: "coins = [1, 3, 4], amount = 6  →  answer: 2 coins (3 + 3 = 6)",
    h: 210,
    props: [
      { id: 'a0', emoji: '🪙', label: '0 Berries: 0', x: 8, y: 45 },
      { id: 'a1', emoji: '🪙', label: '1: ∞', x: 21, y: 45 },
      { id: 'a2', emoji: '🪙', label: '2: ∞', x: 34, y: 45 },
      { id: 'a3', emoji: '🪙', label: '3: ∞', x: 47, y: 45 },
      { id: 'a4', emoji: '🪙', label: '4: ∞', x: 60, y: 45 },
      { id: 'a5', emoji: '🪙', label: '5: ∞', x: 73, y: 45 },
      { id: 'a6', emoji: '🪙', label: '6: ∞', x: 88, y: 45 }
    ],
    ledger: [
      { id: 'coins', emoji: '🪙', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'nami', pos: 'left', line: "We owe exactly 6 Berries for the Log Pose, and our coin pouch only has denominations of 1, 3, and 4. We can use as many of each as we like — what's the FEWEST coins that add up to exactly 6?", l: { coins: 'coins available: 1, 3, 4' }, sfx: null },
      { speaker: 'chopper', pos: 'right', line: "Trying every combination of coins sounds like it could take forever if the amount's big!", sfx: null },
      { speaker: 'robin', pos: 'right', line: "So build it up instead. For every amount from 0 to 6, ask: for each coin no bigger than this amount, what's 1 plus the fewest coins needed for (amount minus that coin)? Take the smallest result. Amount 0 needs 0 coins — that's free.", p: { a0: 'good' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Amount 1: only coin 1 fits. 1 + ways(0) = 1 + 0 = 1 coin.", p: { a1: 'good' }, l: { a1: '1: 1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Amount 2: only coin 1 fits (twice, effectively). 1 + ways(1) = 1 + 1 = 2 coins.", p: { a2: 'good' }, l: { a2: '2: 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Amount 3: coin 1 gives 1 + ways(2) = 3. But coin 3 gives 1 + ways(0) = 1. The smaller wins — just 1 coin.", p: { a3: 'good' }, l: { a3: '3: 1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Amount 4: coin 1 gives 1 + ways(3) = 2. Coin 3 gives 1 + ways(1) = 2. Coin 4 gives 1 + ways(0) = 1. Smallest is 1 coin.", p: { a4: 'good' }, l: { a4: '4: 1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Amount 5: coin 1 gives 1 + ways(4) = 2. Coin 3 gives 1 + ways(2) = 3. Coin 4 gives 1 + ways(1) = 2. Smallest is 2 coins.", p: { a5: 'good' }, l: { a5: '5: 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Amount 6, the target: coin 1 gives 1 + ways(5) = 3. Coin 3 gives 1 + ways(3) = 2. Coin 4 gives 1 + ways(2) = 3. Smallest is 2 coins — that's coin 3 twice.", p: { a6: 'good' }, l: { a6: '6: 2' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Two coins, both threes, and we're set sail!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "Every amount only ever needs the answers already sitting below it. Nothing gets recomputed twice.", sfx: null }
    ],
    complexity: "Time: O(amount × number of coins) — for each amount from 1 to the target, we try every coin denomination once. Space: O(amount) for the DP table.",
    pitfall: "Initializing unreachable amounts to 0 instead of infinity (or amount+1) — that makes an impossible amount look like it costs 0 coins, silently poisoning every larger amount that builds on it. Any table entry still at infinity at the end means -1, not 0.",
    solution: `def coin_change(coins, amount):
      INF = float('inf')
      dp = [0] + [INF] * amount   # dp[a] = fewest coins to make amount a
      for a in range(1, amount + 1):
          for coin in coins:
              if coin <= a and dp[a - coin] + 1 < dp[a]:
                  dp[a] = dp[a - coin] + 1
      return dp[amount] if dp[amount] != INF else -1`
  };

  E['jump-game'] = {
    id: 'jump-game',
    epNumber: 51,
    title: 'The Stepping Stones to Fishman Island',
    patternId: 'greedy',
    leetcode: { name: 'Jump Game', number: 55, difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game/' },
    problem: "Given an array of non-negative integers where each element is the maximum jump length from that position, and starting at index 0, determine whether it's possible to reach the last index.",
    example: "nums = [2, 3, 1, 1, 4]  →  answer: true (reachable, e.g. jump 0→1→4)",
    h: 220,
    props: [
      { id: 'k0', emoji: '🪨', label: 'power 2', x: 10, y: 45 },
      { id: 'k1', emoji: '🪨', label: 'power 3', x: 28, y: 45 },
      { id: 'k2', emoji: '🪨', label: 'power 1', x: 46, y: 45 },
      { id: 'k3', emoji: '🪨', label: 'power 1', x: 64, y: 45 },
      { id: 'k4', emoji: '🏁', label: 'goal', x: 82, y: 45 }
    ],
    ledger: [
      { id: 'reach', emoji: '📏', x: 50, y: 88 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Five stepping stones across the current, each one lets you leap forward AT MOST as many stones as its power number says. Starting on stone 0, can the great Captain Usopp reach stone 4, the goal?", l: { reach: 'farthest reach: 0' }, sfx: null },
      { speaker: 'luffy', pos: 'right', line: "Just jump as far as you can, every time, right?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "That instinct is almost right — let's make it precise. Walk the stones left to right and track the FARTHEST stone reachable so far. If we ever reach a stone that's beyond that farthest mark, we're stuck in the water. If the farthest mark ever reaches or passes the goal, we've made it.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Stone 0, power 2: farthest reach becomes 0 + 2 = stone 2.", p: { k0: 'good' }, l: { reach: 'farthest reach: 2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Stone 1 is within reach (1 ≤ 2). Its power 3 pushes us to 1 + 3 = stone 4 — already the goal stone!", p: { k1: 'good' }, l: { reach: 'farthest reach: 4' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Stone 2 is within reach (2 ≤ 4). Its power 1 only reaches stone 3 — no improvement, farthest stays 4.", p: { k2: 'good' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Stone 3 is within reach (3 ≤ 4). Its power 1 only reaches stone 4 — still no improvement, farthest stays 4.", p: { k3: 'good' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Stone 4, the goal itself, is within reach (4 ≤ 4). We're done — it's reachable!", p: { k4: 'good' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Fishman Island, here we come! And we didn't even need to know the EXACT path, just that we could always reach far enough!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "One pass, one running number. The second the current position outruns the farthest reach, stop — it's over.", sfx: null }
    ],
    complexity: "Time: O(n) — a single left-to-right scan, updating one running maximum. Space: O(1) — only the farthest-reach value is kept.",
    pitfall: "Bailing out early the instant a stone with power 0 is seen, without first checking whether the farthest reach ALREADY carried you past that stone — a zero mid-array is only fatal if nothing earlier could jump over it.",
    solution: `def can_jump(nums):
      farthest = 0
      for i, power in enumerate(nums):
          if i > farthest:
              return False          # this stone was never reachable
          farthest = max(farthest, i + power)
          if farthest >= len(nums) - 1:
              return True
      return True`
  };

  E['gas-station'] = {
    id: 'gas-station',
    epNumber: 52,
    title: 'The Circular Supply Run',
    patternId: 'greedy',
    leetcode: { name: 'Gas Station', number: 134, difficulty: 'Medium', url: 'https://leetcode.com/problems/gas-station/' },
    problem: "There are n gas stations arranged in a circle. Station i has gas[i] fuel, and it costs cost[i] fuel to travel from station i to the next station. Starting with an empty tank at one station, find the starting station index that lets you complete the entire circuit exactly once (guaranteed to be unique if a solution exists), or return -1 if no valid starting station exists.",
    example: "gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]  →  answer: start at station 3",
    h: 230,
    props: [
      { id: 'st0', emoji: '⛽', label: 'gas 1 / cost 3', x: 50, y: 12 },
      { id: 'st1', emoji: '⛽', label: 'gas 2 / cost 4', x: 85, y: 35 },
      { id: 'st2', emoji: '⛽', label: 'gas 3 / cost 5', x: 70, y: 78 },
      { id: 'st3', emoji: '⛽', label: 'gas 4 / cost 1', x: 30, y: 78 },
      { id: 'st4', emoji: '⛽', label: 'gas 5 / cost 2', x: 15, y: 35 }
    ],
    ledger: [
      { id: 'tank', emoji: '🪣', x: 50, y: 52 }
    ],
    steps: [
      { speaker: 'nami', pos: 'left', line: "Five gas stations on this ring route. Each one gives you a set amount of fuel, but it costs a set amount to reach the NEXT station. We start with an empty tank — which station lets us make the full loop without ever running dry?", l: { tank: 'tank: 0, candidate start: 0' }, sfx: null },
      { speaker: 'luffy', pos: 'right', line: "Just try starting at every station and see which one works?", sfx: null },
      { speaker: 'nami', pos: 'left', line: "That works, but it is slow to redo the whole loop five separate times. Here's the shortcut: if total gas across the whole route is at least total cost, SOME starting station must work. Walk the loop once, tracking the running tank from a candidate start — the moment the tank goes negative, none of the stations we just tried could have been the true start, so move the candidate to the very next station and reset the tank to zero.", sfx: null },
      { speaker: 'nami', pos: 'left', line: "Station 0: gain 1, spend 3, net -2. Tank drops to -2 — negative! Station 0 can't be the start. Try station 1 next, tank resets to 0.", p: { st0: 'bad' }, l: { tank: 'tank: -2 → reset. candidate start: 1' }, sfx: 'error' },
      { speaker: 'nami', pos: 'left', line: "Station 1: gain 2, spend 4, net -2. Tank drops to -2 again — negative! Move on to station 2, reset.", p: { st1: 'bad' }, l: { tank: 'tank: -2 → reset. candidate start: 2' }, sfx: 'error' },
      { speaker: 'nami', pos: 'left', line: "Station 2: gain 3, spend 5, net -2. Negative again! Move on to station 3, reset.", p: { st2: 'bad' }, l: { tank: 'tank: -2 → reset. candidate start: 3' }, sfx: 'error' },
      { speaker: 'nami', pos: 'left', line: "Station 3: gain 4, spend 1, net +3. Tank climbs to 3 — positive, keep station 3 as our candidate and keep going.", p: { st3: 'good' }, l: { tank: 'tank: 3, candidate start: 3' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'left', line: "Station 4: gain 5, spend 2, net +3. Tank climbs to 6 — still positive, and that was the last station on the loop.", p: { st4: 'good' }, l: { tank: 'tank: 6, candidate start: 3' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Total gas (1+2+3+4+5 = 15) equals total cost (3+4+5+1+2 = 15), so a valid start does exist — and since the tank never went negative again after we locked in station 3, that's the one.", sfx: 'victory' },
      { speaker: 'luffy', pos: 'right', line: "SHISHISHI! Fill up at station 3 and we sail the whole loop without running dry!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'right', line: "Every time the tank goes negative, it wasn't the driver's fault — it was every station tried so far. Wipe the slate, start fresh from the next one.", sfx: null }
    ],
    complexity: "Time: O(n) — a single pass around the circuit tracking a running tank and a candidate start. Space: O(1).",
    pitfall: "Forgetting to first confirm that total gas ≥ total cost overall — the single-pass trick correctly finds the ONE candidate that never goes negative twice in a row, but if the totals don't balance, no station works at all and the answer must be -1, even though the scan will still \"find\" a candidate.",
    solution: `def can_complete_circuit(gas, cost):
      total_surplus = 0
      tank = 0
      start = 0
      for i in range(len(gas)):
          net = gas[i] - cost[i]
          total_surplus += net
          tank += net
          if tank < 0:
              start = i + 1   # no station from the old start through i can work
              tank = 0
      return start if total_surplus >= 0 else -1`
  };

  E['min-arrows-burst-balloons'] = {
    id: 'min-arrows-burst-balloons',
    epNumber: 53,
    title: 'The Sniper’s Minimum Volley',
    patternId: 'greedy',
    leetcode: { name: 'Minimum Number of Arrows to Burst Balloons', number: 452, difficulty: 'Medium', url: 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/' },
    problem: "Balloons are given as [start, end] intervals along a horizontal line. An arrow shot straight up at a single x-coordinate bursts every balloon whose interval it passes through, including balloons that only touch at an endpoint. Find the minimum number of arrows needed to burst every balloon.",
    example: "points = [[10,16],[2,8],[1,6],[7,12]]  →  answer: 2 arrows",
    h: 220,
    props: [
      { id: 'b0', emoji: '🎈', label: '1–6', x: 15, y: 45 },
      { id: 'b1', emoji: '🎈', label: '2–8', x: 40, y: 45 },
      { id: 'b2', emoji: '🎈', label: '7–12', x: 65, y: 45 },
      { id: 'b3', emoji: '🎈', label: '10–16', x: 88, y: 45 }
    ],
    ledger: [
      { id: 'arrow', emoji: '🏹', x: 50, y: 85 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Behold! Four balloons strung along the wall, each spanning a range: 10-to-16, 2-to-8, 1-to-6, and 7-to-12. One arrow fired straight up at a single point bursts EVERY balloon whose range includes that point. What's the fewest arrows the great sniper Usopp needs to pop them all?", sfx: null },
      { speaker: 'chopper', pos: 'right', line: "There are only four, but if there were hundreds, trying every possible arrow position sounds impossible!", sfx: null },
      { speaker: 'robin', pos: 'right', line: "First, sort the balloons by where they END: 1–6, then 2–8, then 7–12, then 10–16. Now the rule is simple — always aim the next arrow at the END of the earliest still-unburst balloon. That one arrow is guaranteed to also burst every later balloon that starts before or at that point.", sfx: null },
      { speaker: 'usopp', pos: 'left', line: "First balloon, 1–6: no arrow fired yet. Fire one at x = 6, its end point!", p: { b0: 'good' }, l: { arrow: 'arrows fired: 1, last arrow at x=6' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Next, 2–8: it starts at 2, which is at or before our arrow at 6. Already burst — no new arrow needed.", p: { b1: 'good' }, sfx: 'chime' },
      { speaker: 'usopp', pos: 'left', line: "Next, 7–12: it starts at 7, which is PAST our arrow at 6. This one survived! Fire a second arrow at its end, x = 12.", p: { b2: 'good' }, l: { arrow: 'arrows fired: 2, last arrow at x=12' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Last, 10–16: it starts at 10, which is at or before our arrow at 12. Already burst by the same second arrow — no new arrow needed.", p: { b3: 'good' }, sfx: 'chime' },
      { speaker: 'usopp', pos: 'left', line: "All four balloons down, and it only took TWO arrows! The legendary sniper strikes again!", sfx: 'victory' },
      { speaker: 'luffy', pos: 'right', line: "SHISHISHI! Usopp, that was actually really cool!", sfx: 'pop' },
      { speaker: 'zoro', pos: 'right', line: "Sort by where things end, not where they start. Fire only when forced to. Nothing fancier than that.", sfx: null }
    ],
    complexity: "Time: O(n log n) — dominated by sorting the balloons by end coordinate; the greedy sweep afterward is a single O(n) pass. Space: O(1) extra (O(n) or O(log n) depending on the sort's implementation).",
    pitfall: "Sorting by START coordinate instead of END coordinate — that breaks the greedy guarantee, because the earliest-starting balloon might stretch out much farther than a balloon that starts later but ends sooner, causing the algorithm to under- or over-count arrows.",
    solution: `def find_min_arrow_shots(points):
      if not points:
          return 0
      points.sort(key=lambda p: p[1])   # sort by END coordinate
      arrows = 1
      arrow_pos = points[0][1]
      for start, end in points[1:]:
          if start > arrow_pos:         # this balloon escapes the current arrow
              arrows += 1
              arrow_pos = end
      return arrows`
  };
  E['single-number'] = {
    id: 'single-number',
    epNumber: 54,
    title: 'The Last Duelist Standing on Sabaody',
    patternId: 'bit-manipulation',
    leetcode: { name: 'Single Number', number: 136, difficulty: 'Easy', url: 'https://leetcode.com/problems/single-number/' },
    problem: 'Given an array of integers where every number appears exactly twice except for one number that appears exactly once, find that single number. You must do it in linear time and without using extra memory for a counting structure.',
    example: 'nums = [4, 1, 2, 1, 2]  →  answer: 4',
    h: 220,
    props: [
      { id: 'p0', emoji: '🎴', label: '4', x: 10, y: 40 },
      { id: 'p1', emoji: '🎴', label: '1', x: 28, y: 40 },
      { id: 'p2', emoji: '🎴', label: '2', x: 46, y: 40 },
      { id: 'p3', emoji: '🎴', label: '1', x: 64, y: 40 },
      { id: 'p4', emoji: '🎴', label: '2', x: 82, y: 40 }
    ],
    ledger: [
      { id: 'acc', emoji: '🧮', x: 46, y: 82 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Gather round! Five cards on the table at the Sabaody duel ring — and legend says every card has an exact rival among the others, matched down to the bit... except ONE, the Unrivaled Card!", l: { acc: '000' }, sfx: null },
      { speaker: 'nami', pos: 'right', line: "With only five cards I could just compare every pair by hand, sure. But if this table had ten thousand cards, checking every pair against every other one would take forever.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "There is an operation called XOR — it flips a bit where two numbers disagree and leaves it alone where they agree. Two identical numbers XORed together always land on zero.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "And zero XORed with anything just gives back that thing unchanged. So if I fold every card into one running total, any card with a rival cancels itself out completely — no matter what order they arrive in.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Card one: 4. Running total was 000, now it is 100.", p: { p0: 'lit' }, l: { acc: '100' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Card two: 1. Fold it in — total becomes 101.", p: { p0: 'dim', p1: 'lit' }, l: { acc: '101' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Card three: 2. Total becomes 111.", p: { p1: 'dim', p2: 'lit' }, l: { acc: '111' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Card four: 1 again — its rival! Folding it in flips those same bits right back, so the 1's worth cancels out of the total. New total: 110.", p: { p1: 'bad', p3: 'bad', p2: 'lit' }, l: { acc: '110' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Card five: 2 again — its rival too! Cancel it out the same way. New total: 100.", p: { p2: 'bad', p4: 'bad' }, l: { acc: '100' }, sfx: 'gong' },
      { speaker: 'zoro', pos: 'left', line: "Every card that had a partner is gone from the total now. Only the 4 never got cancelled.", p: { p0: 'good' }, sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! The Unrivaled Card is the 4! We never even had to write down which cards we'd already seen!", sfx: 'victory' },
      { speaker: 'robin', pos: 'right', line: "That is the whole trick: one running XOR, one pass, no lookup table needed — the pairs cancel themselves out of existence.", sfx: null }
    ],
    complexity: 'Time: O(n) — one pass over the array, one XOR per element. Space: O(1) — just a single running accumulator, no hash map or counting structure needed.',
    pitfall: "Reaching for a hash-map count of occurrences works but violates the \"constant extra space\" requirement — the whole point of this pattern is that XOR gives you the same answer with zero extra memory, since a^a=0 and a^0=a for any a.",
    solution: `def single_number(nums):
      acc = 0  # running XOR total — pairs cancel themselves out
      for num in nums:
          acc ^= num
      return acc  # whatever never found its rival survives`
  };

  E['number-of-1-bits'] = {
    id: 'number-of-1-bits',
    epNumber: 55,
    title: "Chopper's Lantern Count",
    patternId: 'bit-manipulation',
    leetcode: { name: 'Number of 1 Bits', number: 191, difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/' },
    problem: 'Given an unsigned integer, count how many of its bits are set to 1 (its "Hamming weight"). Do it without checking all 32 bit positions one by one if you can avoid it.',
    example: 'n = 11 (binary 1011)  →  answer: 3',
    h: 220,
    props: [
      { id: 'bit3', emoji: '🏮', label: '1', x: 20, y: 40 },
      { id: 'bit2', emoji: '🏮', label: '0', x: 40, y: 40 },
      { id: 'bit1', emoji: '🏮', label: '1', x: 60, y: 40 },
      { id: 'bit0', emoji: '🏮', label: '1', x: 80, y: 40 }
    ],
    ledger: [
      { id: 'nval', emoji: '📜', x: 30, y: 78 },
      { id: 'count', emoji: '🔥', x: 70, y: 78 }
    ],
    steps: [
      { speaker: 'chopper', pos: 'left', line: "n is 1011 in binary — eleven! But how many of these four lanterns are actually lit? I only count two hands' worth of fingers, this is confusing!", p: { bit2: 'dim' }, l: { nval: '1011', count: '0' }, sfx: null },
      { speaker: 'nami', pos: 'right', line: "We could just walk through all 32 bit positions of a real integer and check each one for a 1. It works, but most positions are already zero — that is a lot of wasted checks.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "There is a shortcut: n AND (n minus 1) always clears out the lowest lit lantern and leaves every other lantern exactly as it was. So we just repeat that and count each clear, until n goes dark.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "n is 1011, n-1 is 1010. AND them together and the lowest lantern — bit0 — snuffs out. Count: 1.", p: { bit0: 'lit' }, l: { nval: '1010', count: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Snuffed.", p: { bit0: 'bad' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "n is now 1010, n-1 is 1001. AND them and the next lowest lantern — bit1 — snuffs out. Count: 2.", p: { bit1: 'lit' }, l: { nval: '1000', count: '2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Snuffed.", p: { bit1: 'bad' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "n is now 1000, n-1 is 0111. AND them and the last lantern — bit3 — snuffs out too. Count: 3.", p: { bit3: 'lit' }, l: { nval: '0000', count: '3' }, sfx: 'gong' },
      { speaker: 'zoro', pos: 'left', line: "n's zero now. Nothing left to clear. Three lanterns were lit.", p: { bit3: 'bad' }, sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Three! And that middle lantern was never even lit, we didn't waste a single check on it!", sfx: 'victory' },
      { speaker: 'robin', pos: 'right', line: "That is the whole idea: only spend a step for each 1-bit that actually exists, instead of marching past every position whether it is lit or not.", sfx: null }
    ],
    complexity: 'Time: O(k) where k is the number of set bits (at most 32 for a 32-bit integer) — each iteration clears exactly one 1-bit. Space: O(1).',
    pitfall: 'Forgetting that `n & (n-1)` only clears the LOWEST set bit, not all bits below it — some people assume it zeroes out everything to the right, which would silently produce a wrong count for numbers with multiple 1-bits.',
    solution: `def hamming_weight(n):
      count = 0
      while n:
          n &= (n - 1)  # clear the lowest set lantern
          count += 1
      return count`
  };

  E['counting-bits'] = {
    id: 'counting-bits',
    epNumber: 56,
    title: 'Half the Work, Twice the Numbers',
    patternId: 'bit-manipulation',
    leetcode: { name: 'Counting Bits', number: 338, difficulty: 'Easy', url: 'https://leetcode.com/problems/counting-bits/' },
    problem: 'Given a non-negative integer n, return an array where the value at each index i (from 0 to n) is the number of 1-bits in the binary representation of i. Try to do it faster than recomputing the bit count from scratch for every number.',
    example: 'n = 5  →  answer: [0, 1, 1, 2, 1, 2]  (bit counts for 0, 1, 2, 3, 4, 5)',
    h: 230,
    props: [
      { id: 'idx0', emoji: '🔢', label: 'i=0', x: 8, y: 30 },
      { id: 'idx1', emoji: '🔢', label: 'i=1', x: 25, y: 30 },
      { id: 'idx2', emoji: '🔢', label: 'i=2', x: 42, y: 30 },
      { id: 'idx3', emoji: '🔢', label: 'i=3', x: 59, y: 30 },
      { id: 'idx4', emoji: '🔢', label: 'i=4', x: 76, y: 30 },
      { id: 'idx5', emoji: '🔢', label: 'i=5', x: 93, y: 30 }
    ],
    ledger: [
      { id: 'ans0', emoji: '📶', x: 8, y: 78 },
      { id: 'ans1', emoji: '📶', x: 25, y: 78 },
      { id: 'ans2', emoji: '📶', x: 42, y: 78 },
      { id: 'ans3', emoji: '📶', x: 59, y: 78 },
      { id: 'ans4', emoji: '📶', x: 76, y: 78 },
      { id: 'ans5', emoji: '📶', x: 93, y: 78 }
    ],
    steps: [
      { speaker: 'brook', pos: 'left', line: "Yohohoho~ We need the bit-count for every number from 0 to 5 — though I have no bits to count myself, being all bone! Shall we compute each one fresh, from nothing?", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Recomputing from scratch for every single number is wasteful — we would be redoing work we basically already did for a smaller number just a few steps ago.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Every number i is just its own half — i shifted right by one bit — with maybe one extra 1-bit tacked on at the end. So bits[i] = bits[i >> 1] + (i's last bit). We only ever look back at answers we already have.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "i=0 is our base case: zero has no bits at all. bits[0] = 0.", p: { idx0: 'lit', ans0: 'good' }, l: { ans0: '0' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "i=1: half of 1 is 0, and 1's last bit is 1. bits[1] = bits[0] + 1 = 1.", p: { idx0: 'lit', idx1: 'lit', ans1: 'good' }, l: { ans1: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "i=2: half of 2 is 1, and 2's last bit is 0. bits[2] = bits[1] + 0 = 1.", p: { idx1: 'lit', idx2: 'lit', ans2: 'good' }, l: { ans2: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "i=3: half of 3 is 1, and 3's last bit is 1. bits[3] = bits[1] + 1 = 2.", p: { idx1: 'lit', idx3: 'lit', ans3: 'good' }, l: { ans3: '2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "i=4: half of 4 is 2, and 4's last bit is 0. bits[4] = bits[2] + 0 = 1.", p: { idx2: 'lit', idx4: 'lit', ans4: 'good' }, l: { ans4: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "i=5: half of 5 is 2, and 5's last bit is 1. bits[5] = bits[2] + 1 = 2.", p: { idx2: 'lit', idx5: 'lit', ans5: 'good' }, l: { ans5: '2' }, sfx: 'gong' },
      { speaker: 'zoro', pos: 'left', line: "0, 1, 1, 2, 1, 2. Every answer built off one we already had.", sfx: null },
      { speaker: 'brook', pos: 'left', line: "How elegant — not a single number computed twice from scratch! A tidy tune, wouldn't you agree?", sfx: 'victory' }
    ],
    complexity: 'Time: O(n) — each index does O(1) work, reusing an already-computed answer. Space: O(n) for the output array itself (no extra structure beyond that).',
    pitfall: 'Computing bits[i >> 1] recursively or from scratch instead of reading it out of the already-built answer array turns this back into O(n log n) or worse — the entire speedup comes from treating the output array itself as the lookup table as you fill it left to right.',
    solution: `def count_bits(n):
      bits = [0] * (n + 1)
      for i in range(1, n + 1):
          bits[i] = bits[i >> 1] + (i & 1)
      return bits`
  };

  E['implement-trie-prefix-tree'] = {
    id: 'implement-trie-prefix-tree',
    epNumber: 57,
    title: 'The Scroll That Branches by Letter',
    patternId: 'trie',
    leetcode: { name: 'Implement Trie (Prefix Tree)', number: 208, difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/' },
    problem: 'Design a trie (prefix tree) that supports three operations: insert(word) adds a word; search(word) returns true only if that exact word was inserted; startsWith(prefix) returns true if any inserted word begins with that prefix.',
    example: 'insert("apple"); search("apple")→true; search("app")→false; startsWith("app")→true; insert("app"); search("app")→true',
    h: 260,
    props: [
      { id: 'root', emoji: '🌱', label: 'root', x: 50, y: 6 },
      { id: 'n_a', emoji: '🔤', label: 'a', x: 50, y: 22 },
      { id: 'n_p1', emoji: '🔤', label: 'p', x: 50, y: 38 },
      { id: 'n_p2', emoji: '🔤', label: 'p', x: 50, y: 54 },
      { id: 'n_l', emoji: '🔤', label: 'l', x: 50, y: 70 },
      { id: 'n_e', emoji: '🔤', label: 'e', x: 50, y: 86 }
    ],
    ledger: [
      { id: 'path', emoji: '📍', x: 85, y: 46 }
    ],
    steps: [
      { speaker: 'usopp', pos: 'left', line: "Watch this, I'm building a scroll-tree! One node per letter, growing down from a single root — so any word that starts the same way shares the same trunk!", sfx: null },
      { speaker: 'chopper', pos: 'left', line: "How do you even put a whole word like 'apple' into it?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Letter by letter. Starting at the root, for each letter I either follow an existing branch or grow a brand new one — then I step down onto it before reading the next letter.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "a-p-p-l-e: five new branches grow straight down from the root. The very last one gets marked as a true word ending, not just a passing letter.", p: { root: 'lit', n_a: 'good', n_p1: 'good', n_p2: 'good', n_l: 'good', n_e: 'good' }, l: { path: 'apple', n_e: 'e*' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "search('apple') just retraces that same path. Every letter exists, and the final node is flagged as a word ending — so it returns true.", p: { n_a: 'lit', n_p1: 'lit', n_p2: 'lit', n_l: 'lit', n_e: 'lit' }, l: { path: 'apple ✓ end-flag found' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Now try search('app'). The path a-p-p exists — we can walk it fine — but that second 'p' node was only ever a pass-through on the way to 'apple'. It was never flagged as an ending.", p: { n_a: 'lit', n_p1: 'lit', n_p2: 'lit', n_l: 'dim', n_e: 'dim' }, l: { path: 'app — path ok, no end-flag' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "So search('app') returns false. Existing on the path is not enough — the node has to be specifically marked as somebody's actual word ending.", p: { n_p2: 'bad' }, sfx: 'error' },
      { speaker: 'luffy', pos: 'left', line: "But what if I just want to know if ANY word starts with 'app', I don't care if 'app' itself is a whole word?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "That is startsWith — same walk, but we skip the end-flag check entirely. The path a-p-p exists, so startsWith('app') returns true, even though search('app') just told us false.", p: { n_p2: 'lit' }, l: { path: 'app ✓ path exists, no flag needed' }, sfx: 'chime' },
      { speaker: 'usopp', pos: 'left', line: "Now insert('app')! No new branches needed at all — that second 'p' node already exists, we just raise its ending flag.", p: { n_p2: 'good' }, l: { path: 'app', n_p2: 'p*' }, sfx: 'gong' },
      { speaker: 'zoro', pos: 'left', line: "search('app') returns true now. Same tree, one flag flipped.", sfx: 'victory' },
      { speaker: 'robin', pos: 'right', line: "That is a trie in full: shared trunks for shared prefixes, and a single flag per node deciding whether that exact point is a real word.", sfx: null }
    ],
    complexity: 'Time: O(L) per operation, where L is the length of the word or prefix — each letter is one hop down the tree. Space: O(total letters inserted) across all nodes in the worst case.',
    pitfall: "Implementing search() by only checking whether the final node exists, without checking its end-of-word flag, silently makes search() behave identically to startsWith() — which is exactly why search('app') must return false even though the 'app' path is fully present.",
    solution: `class TrieNode:
      def __init__(self):
          self.children = {}
          self.is_word = False

  class Trie:
      def __init__(self):
          self.root = TrieNode()

      def insert(self, word):
          node = self.root
          for ch in word:
              node = node.children.setdefault(ch, TrieNode())
          node.is_word = True

      def _walk(self, prefix):
          node = self.root
          for ch in prefix:
              if ch not in node.children:
                  return None
              node = node.children[ch]
          return node

      def search(self, word):
          node = self._walk(word)
          return node is not None and node.is_word

      def startsWith(self, prefix):
          return self._walk(prefix) is not None`
  };

  E['design-add-and-search-words'] = {
    id: 'design-add-and-search-words',
    epNumber: 58,
    title: 'The Smudged Wanted Poster',
    patternId: 'trie',
    leetcode: { name: 'Design Add and Search Words Data Structure', number: 211, difficulty: 'Medium', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/' },
    problem: 'Design a data structure that supports adding words and then searching for a word, where the search word may contain "." characters that can match any single letter. addWord(word) adds a word; search(word) returns true if some added word matches, treating "." as a wildcard for one letter.',
    example: 'addWord("bad"); addWord("dad"); addWord("mad"); search("pad")→false; search("bad")→true; search(".ad")→true; search("b..")→true',
    h: 260,
    props: [
      { id: 'root', emoji: '🌱', label: 'root', x: 50, y: 6 },
      { id: 'nb', emoji: '🔤', label: 'b', x: 15, y: 26 },
      { id: 'nd', emoji: '🔤', label: 'd', x: 50, y: 26 },
      { id: 'nm', emoji: '🔤', label: 'm', x: 85, y: 26 },
      { id: 'nba', emoji: '🔤', label: 'a', x: 15, y: 48 },
      { id: 'nda', emoji: '🔤', label: 'a', x: 50, y: 48 },
      { id: 'nma', emoji: '🔤', label: 'a', x: 85, y: 48 },
      { id: 'nbad', emoji: '🏁', label: 'd*', x: 15, y: 70 },
      { id: 'ndad', emoji: '🏁', label: 'd*', x: 50, y: 70 },
      { id: 'nmad', emoji: '🏁', label: 'd*', x: 85, y: 70 }
    ],
    ledger: [
      { id: 'path', emoji: '📍', x: 50, y: 92 }
    ],
    steps: [
      { speaker: 'brook', pos: 'left', line: "Yohoho~ Three wanted posters go up on the same board tonight: bad, dad, mad. All rhyme, all three letters, all end the same way!", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Same trie idea as always — each word gets its own branch from the root, and the very last letter of each gets flagged as a true ending.", p: { root: 'lit', nb: 'good', nd: 'good', nm: 'good', nba: 'good', nda: 'good', nma: 'good', nbad: 'good', ndad: 'good', nmad: 'good' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Someone asks for 'pad'. With three posters up that is nothing, but imagine thousands — we do not want to compare 'pad' letter-by-letter against every single stored word by hand.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "We do not have to. At the root we look for a branch labeled 'p' — there is none. Dead end immediately, no letters left to check.", l: { path: "'p' — no branch at root" }, sfx: 'error' },
      { speaker: 'zoro', pos: 'left', line: "search('bad') is the easy case. Walk b, a, d — every letter matches a real branch, and the last one is flagged. True.", p: { nb: 'lit', nba: 'lit', nbad: 'lit' }, l: { path: 'bad ✓' }, sfx: 'chime' },
      { speaker: 'luffy', pos: 'left', line: "Now the weird one — '.ad'. That dot could be ANYTHING! How do you follow a branch that isn't even a real letter?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "You do not follow one branch — you try all of them. At a '.', branch out into every child the current node has, and keep searching down each one. If even ONE of those paths finishes as a match, the whole search is true.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "'.ad': at the root the dot tries b, d, and m all at once. Following 'b' first: then 'a' matches for real, then 'd' matches and it is flagged. Found a match — stop right there.", p: { nd: 'dim', nm: 'dim', nda: 'dim', nma: 'dim', ndad: 'dim', nmad: 'dim' }, l: { path: '.ad → b-a-d ✓ (found, stopped)' }, sfx: 'gong' },
      { speaker: 'nami', pos: 'right', line: "And 'b..'? First letter is fixed as 'b', no wildcard there. But the next two are both dots — so from the 'b' branch, try every child at each level.", p: { nd: 'off', nm: 'off', nda: 'off', nma: 'off', ndad: 'off', nmad: 'off' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "From 'b', the only child is 'a' — the first dot matches it. From there, the only child is the flagged 'd' — the second dot matches that too. True.", p: { nb: 'good', nba: 'good', nbad: 'good' }, l: { path: 'b.. → b-a-d ✓' }, sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "Every dot just means: branch into all children here instead of one.", sfx: null }
    ],
    complexity: 'Time: O(26^d · L) worst case, where d is the number of dots and L the word length — each dot can branch into every possible child. Without dots it collapses back to the normal O(L) trie walk.',
    pitfall: "Treating '.' as matching zero-or-more letters (like a regex star) instead of exactly one letter is a common mix-up — here every '.' must consume precisely one position in the word, so the DFS still needs to track remaining length exactly, it just fans out over children when it hits a dot.",
    solution: `class TrieNode:
      def __init__(self):
          self.children = {}
          self.is_word = False

  class WordDictionary:
      def __init__(self):
          self.root = TrieNode()

      def addWord(self, word):
          node = self.root
          for ch in word:
              node = node.children.setdefault(ch, TrieNode())
          node.is_word = True

      def search(self, word):
          def dfs(node, i):
              if i == len(word):
                  return node.is_word
              ch = word[i]
              if ch == '.':
                  return any(dfs(child, i + 1) for child in node.children.values())
              child = node.children.get(ch)
              return child is not None and dfs(child, i + 1)
          return dfs(self.root, 0)`
  };

  E['replace-words'] = {
    id: 'replace-words',
    epNumber: 59,
    title: 'The Root That Speaks for the Whole Branch',
    patternId: 'trie',
    leetcode: { name: 'Replace Words', number: 648, difficulty: 'Medium', url: 'https://leetcode.com/problems/replace-words/' },
    problem: 'Given a dictionary of root words and a sentence, replace every word in the sentence that has one of the roots as a prefix with that shortest matching root. If a word has no matching root, leave it unchanged. Return the rebuilt sentence.',
    example: 'roots = ["cat", "bat", "rat"], sentence = "the cattle was rattled by the battery"  →  answer: "the cat was rat by the bat"',
    h: 260,
    props: [
      { id: 'root', emoji: '🌱', label: 'root', x: 50, y: 6 },
      { id: 'nc', emoji: '🔤', label: 'c', x: 15, y: 28 },
      { id: 'nb', emoji: '🔤', label: 'b', x: 50, y: 28 },
      { id: 'nr', emoji: '🔤', label: 'r', x: 85, y: 28 },
      { id: 'nca', emoji: '🔤', label: 'a', x: 15, y: 50 },
      { id: 'nba', emoji: '🔤', label: 'a', x: 50, y: 50 },
      { id: 'nra', emoji: '🔤', label: 'a', x: 85, y: 50 },
      { id: 'ncat', emoji: '🏁', label: 't*', x: 15, y: 72 },
      { id: 'nbat', emoji: '🏁', label: 't*', x: 50, y: 72 },
      { id: 'nrat', emoji: '🏁', label: 't*', x: 85, y: 72 }
    ],
    ledger: [
      { id: 'out', emoji: '📰', x: 50, y: 92 }
    ],
    steps: [
      { speaker: 'luffy', pos: 'left', line: "The newspaper's full of huge fancy words — cattle, rattled, battery! Let's shrink every last one of 'em down to its root!", sfx: null },
      { speaker: 'usopp', pos: 'left', line: "First we plant the roots in a scroll-tree: cat, bat, rat. Three branches from one trunk, each one flagged where the root word ends.", p: { root: 'lit', nc: 'good', nb: 'good', nr: 'good', nca: 'good', nba: 'good', nra: 'good', ncat: 'good', nbat: 'good', nrat: 'good' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Now for every word in the sentence, we walk it letter by letter down this tree. The instant we hit a flagged ending, we stop and swap in that root — we do not even look at the rest of the word.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "'the': first letter 't' is not even a branch at the root. No match at all — it stays exactly as 'the'.", l: { out: 'the' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "'cattle': c-a-t reaches a flagged ending after only three letters. We stop right there, ignoring 't', 'l', 'e' — swap in 'cat'.", p: { nc: 'lit', nca: 'lit', ncat: 'lit' }, l: { out: 'the cat' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "That is the key part: stop at the FIRST flagged root you reach, the shortest one. We never need to keep matching to the end of the full word.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "'was': 'w' is not a branch at the root either. Stays as-is.", l: { out: 'the cat was' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "'rattled': r-a-t reaches a flagged ending. Stop, ignore 't', 'l', 'e', 'd' — swap in 'rat'.", p: { nr: 'lit', nra: 'lit', nrat: 'lit' }, l: { out: 'the cat was rat' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "'by' and 'the' again: neither one even starts down a branch that exists. Both stay unchanged.", l: { out: 'the cat was rat by the' }, sfx: null },
      { speaker: 'robin', pos: 'right', line: "'battery': b-a-t reaches a flagged ending. Stop, ignore 't', 'e', 'r', 'y' — swap in 'bat'.", p: { nb: 'lit', nba: 'lit', nbat: 'lit' }, l: { out: 'the cat was rat by the bat' }, sfx: 'gong' },
      { speaker: 'zoro', pos: 'left', line: "'the cat was rat by the bat.' Every long word traded for its shortest root.", sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Way faster than reading the whole big word every time!", sfx: null }
    ],
    complexity: 'Time: O(total letters in the sentence) to walk every word down the trie, plus O(total letters in the roots) to build it — each character is visited once. Space: O(total letters in the roots) for the trie.',
    pitfall: 'Sorting roots by length and checking startswith() against each one for every sentence word also works but is much slower on large dictionaries; the bug version of the trie approach is forgetting to STOP at the first flagged node — continuing past it and checking the rest of the word can make you miss the shortest valid root or apply the wrong one.',
    solution: `class TrieNode:
      def __init__(self):
          self.children = {}
          self.is_root = False

  def replace_words(roots, sentence):
      trie = TrieNode()
      for root in roots:
          node = trie
          for ch in root:
              node = node.children.setdefault(ch, TrieNode())
          node.is_root = True

      def shortest_root(word):
          node = trie
          for i, ch in enumerate(word):
              if ch not in node.children:
                  return word  # no matching root at all
              node = node.children[ch]
              if node.is_root:
                  return word[:i + 1]  # stop at first flagged ending
          return word

      return ' '.join(shortest_root(w) for w in sentence.split())`
  };
  E['group-anagrams'] = {
    id: 'group-anagrams',
    epNumber: 17,
    title: 'The Scrambled-Letter Bounty Scrolls',
    patternId: 'hashing-patterns',
    leetcode: { name: 'Group Anagrams', number: 49, difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/' },
    problem: 'Given a list of strings, group together the strings that are anagrams of each other (same letters, different order). Return the groups in any order; the strings inside a group can be in any order too.',
    example: 'strs = ["eat","tea","tan","ate","nat","bat"]  →  answer: [["eat","tea","ate"], ["tan","nat"], ["bat"]]',

    h: 220,
    props: [
      { id: 'e0', emoji: '📜', label: 'eat', x: 8, y: 34 },
      { id: 'e1', emoji: '📜', label: 'tea', x: 24, y: 34 },
      { id: 'e2', emoji: '📜', label: 'tan', x: 40, y: 34 },
      { id: 'e3', emoji: '📜', label: 'ate', x: 56, y: 34 },
      { id: 'e4', emoji: '📜', label: 'nat', x: 72, y: 34 },
      { id: 'e5', emoji: '📜', label: 'bat', x: 88, y: 34 }
    ],
    ledger: [
      { id: 'g0', emoji: '📦', x: 20, y: 80 },
      { id: 'g1', emoji: '📦', x: 50, y: 80 },
      { id: 'g2', emoji: '📦', x: 80, y: 80 }
    ],

    steps: [
      { speaker: 'usopp', pos: 'left', line: "Six wanted-poster scrolls came off the same press, but the ink smudged and the letters got shuffled on half of them — eat, tea, tan, ate, nat, bat. Some of these are the SAME name in disguise!", sfx: null },
      { speaker: 'chopper', pos: 'left', line: "How do we know which ones are really the same name spelled differently, without checking every scroll against every other scroll?", sfx: null },
      { speaker: 'nami', pos: 'right', line: "We don't compare scroll to scroll at all. Sort the letters INSIDE each name alphabetically first — two names that are anagrams of each other always collapse to the exact same sorted spelling. That sorted spelling becomes the label on a filing box.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "\"eat\" sorted is \"a-e-t\". No box with that label yet — open a new one.", p: { e0: 'lit', g0: 'lit' }, l: { g0: '"aet": eat' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "\"tea\" sorted is also \"a-e-t\" — straight into the same box as \"eat\".", p: { e1: 'lit' }, l: { g0: '"aet": eat, tea' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "\"tan\" sorted is \"a-n-t\" — a new label, a new box.", p: { e2: 'lit', g1: 'lit' }, l: { g1: '"ant": tan' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "\"ate\" sorted is \"a-e-t\" again — box one.", p: { e3: 'lit' }, l: { g0: '"aet": eat, tea, ate' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "\"nat\" sorted is \"a-n-t\" — box two.", p: { e4: 'lit' }, l: { g1: '"ant": tan, nat' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "\"bat\" sorted is \"a-b-t\" — nothing matches. A third box.", p: { e5: 'lit', g2: 'lit' }, l: { g2: '"abt": bat' }, sfx: 'gong' },
      { speaker: 'zoro', pos: 'left', line: "Three boxes. One pass. Never opened a scroll twice.", p: { e0: 'good', e1: 'good', e2: 'good', e3: 'good', e4: 'good', e5: 'good', g0: 'good', g1: 'good', g2: 'good' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! Same crew, different aliases — can't fool a filing box! So, is any of these boxes food?", sfx: 'pop' }
    ],

    complexity: 'Time: O(n*k log k) — n strings, each sorted to build its signature key in O(k log k) where k is the string length; grouping by that key in a hash map is O(1) amortized per string. Space: O(n*k) to store all strings across the hash map buckets.',
    pitfall: 'Using a key that is not canonical (e.g. hashing the string as-is, or concatenating characters in input order) instead of a true signature — sorting the letters of each string (or building a 26-length character-count tuple) guarantees every anagram of a word produces the identical key.',
    solution: `def group_anagrams(strs):
      groups = {}  # sorted-letters signature -> list of original strings
      for s in strs:
          key = ''.join(sorted(s))
          groups.setdefault(key, []).append(s)
      return list(groups.values())`
  };

  E['longest-consecutive-sequence'] = {
    id: 'longest-consecutive-sequence',
    epNumber: 18,
    title: 'The Longest Chain in the Log Pose Ruins',
    patternId: 'hashing-patterns',
    leetcode: { name: 'Longest Consecutive Sequence', number: 128, difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-consecutive-sequence/' },
    problem: 'Given an unsorted array of integers, find the length of the longest run of consecutive integers (numbers that increase by exactly one with no gaps between them) that appears anywhere in the array, in O(n) time.',
    example: 'nums = [100, 4, 200, 1, 3, 2]  →  answer: 4  (the sequence 1, 2, 3, 4)',

    h: 220,
    props: [
      { id: 'v100', emoji: '🏝️', label: '100', x: 8, y: 34 },
      { id: 'v4', emoji: '🏝️', label: '4', x: 24, y: 34 },
      { id: 'v200', emoji: '🏝️', label: '200', x: 40, y: 34 },
      { id: 'v1', emoji: '🏝️', label: '1', x: 56, y: 34 },
      { id: 'v3', emoji: '🏝️', label: '3', x: 72, y: 34 },
      { id: 'v2', emoji: '🏝️', label: '2', x: 88, y: 34 }
    ],
    ledger: [
      { id: 'start', emoji: '📍', x: 22, y: 80 },
      { id: 'len', emoji: '🔗', x: 50, y: 80 },
      { id: 'best', emoji: '🏆', x: 78, y: 80 }
    ],

    steps: [
      { speaker: 'usopp', pos: 'left', line: "The Log Pose lists six island coordinates in whatever order the current dropped them in — 100, 4, 200, 1, 3, 2 — and somewhere in that mess is the longest unbroken CHAIN of islands, each exactly one degree east of the last!", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "Easy! Just line them up smallest to biggest and walk the line!", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Sorting works, Luffy, but it costs extra time just to line them up. There's a faster way: drop every coordinate into a set for instant checking, then only START walking a chain from an island that has NO island directly to its west — because that means nothing shorter completes it. It has to be a true beginning.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Island 100 — is 99 anywhere on the list? No. So 100 begins a chain. Walk east: is 101 on the list? No. Chain length one.", p: { v100: 'lit' }, l: { start: '100', len: '1', best: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Island 4 — is 3 on the list? Yes. Then 4 can never be a chain's start, only its middle — skip it without walking anywhere.", p: { v4: 'dim' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Island 200 — is 199 on the list? No, another true start. Walk east: 201 isn't there either. Chain length one, no better than before.", p: { v200: 'lit' }, l: { start: '200', len: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Island 1 — is 0 on the list? No! A true start. Walk east: 2 is there, 3 is there, 4 is there, 5 is not. That chain runs four islands deep.", p: { v1: 'lit', v2: 'lit', v3: 'lit', v4: 'good' }, l: { start: '1', len: '4', best: '4' }, sfx: 'gong' },
      { speaker: 'robin', pos: 'right', line: "Island 3 and island 2 each have a western neighbor already on the list, so they were never chain starts at all — just the middle of the chain we already counted, from island 1.", p: { v3: 'good', v2: 'good' }, sfx: null },
      { speaker: 'zoro', pos: 'left', line: "Four islands, one look each. That's the longest run: 1, 2, 3, 4.", p: { v1: 'good' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! And we never even had to sort the map!", sfx: 'pop' }
    ],

    complexity: 'Time: O(n) — every number enters the set once, and the inner walk only ever runs from true chain starts; across the whole array those walks together touch each number at most twice, so total work stays linear. Space: O(n) for the hash set.',
    pitfall: 'Trying to walk a chain from EVERY number instead of only from numbers with no left neighbor (num - 1) in the set. Skipping that check turns the algorithm back into O(n^2) in the worst case, e.g. a fully consecutive array re-walks the same shrinking chain starting from every single element.',
    solution: `def longest_consecutive(nums):
      num_set = set(nums)
      best = 0
      for num in num_set:
          if num - 1 not in num_set:  # only walk from a TRUE start of a chain
              length = 1
              while num + length in num_set:
                  length += 1
              best = max(best, length)
      return best`
  };

  E['container-with-most-water'] = {
    id: 'container-with-most-water',
    epNumber: 1,
    title: 'The Deepest Cistern at Water 7',
    patternId: 'two-pointers',
    leetcode: { name: 'Container With Most Water', number: 11, difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/' },
    problem: 'Given an array of non-negative integers where each value is the height of a vertical line at that index, choose two lines that, together with the x-axis, form a container. The container holds water up to width (the distance between the two lines) times height (the shorter of the two line heights) — find the maximum amount of water any pair of lines can hold.',
    example: 'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]  →  answer: 49  (lines at index 1 and index 8: width 7 × height min(8, 7) = 49)',

    h: 220,
    props: [
      { id: 'h0', emoji: '🗿', label: '1', x: 6, y: 40 },
      { id: 'h1', emoji: '🗿', label: '8', x: 17, y: 40 },
      { id: 'h2', emoji: '🗿', label: '6', x: 28, y: 40 },
      { id: 'h3', emoji: '🗿', label: '2', x: 39, y: 40 },
      { id: 'h4', emoji: '🗿', label: '5', x: 50, y: 40 },
      { id: 'h5', emoji: '🗿', label: '4', x: 61, y: 40 },
      { id: 'h6', emoji: '🗿', label: '8', x: 72, y: 40 },
      { id: 'h7', emoji: '🗿', label: '3', x: 83, y: 40 },
      { id: 'h8', emoji: '🗿', label: '7', x: 94, y: 40 }
    ],
    ledger: [
      { id: 'L', emoji: '👈', x: 20, y: 85 },
      { id: 'R', emoji: '👉', x: 80, y: 85 },
      { id: 'best', emoji: '🏆', x: 50, y: 85 }
    ],

    steps: [
      { speaker: 'zoro', pos: 'left', line: "Nine stone pillars, all different heights. Wall off two of them and the gap between holds rainwater — but only up to whichever pillar is SHORTER. Height above that just spills over the top.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Checking every pair by hand is thirty-six comparisons for just nine pillars. That's not a plan, that's a chore.", sfx: null },
      { speaker: 'chopper', pos: 'left', line: "Is there a way to skip pairs without even looking at them?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Start at the two outer pillars — the widest gap there is. Whichever one is shorter is the bottleneck. Moving the TALLER pillar's pointer inward only shrinks the width and can never raise that bottleneck, so it can never help. Only stepping the SHORTER pillar inward has any chance of finding something taller. That's the only move we ever make.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Pillar 0 is height 1, pillar 8 is height 7. Width eight, bottleneck height one — eight units of water. The left pillar is shorter, so it steps in.", p: { h0: 'lit', h8: 'lit' }, l: { L: 'idx0 (h1)', R: 'idx8 (h7)', best: '8' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Pillar 1 is height 8, pillar 8 is still height 7. Width seven, bottleneck height seven — forty-nine! Now the RIGHT pillar is the shorter one, so it steps in next.", p: { h0: 'dim', h1: 'lit' }, l: { L: 'idx1 (h8)', best: '49' }, sfx: 'gong' },
      { speaker: 'robin', pos: 'right', line: "From here the gap only keeps narrowing — pillar 8 down to 7, then 6, then 5, then 4, then 3, then 2 — and none of those widths, even against pillar 1's wall of eight, can multiply back up to forty-nine.", p: { h7: 'dim', h6: 'dim', h5: 'dim', h4: 'dim', h3: 'dim', h2: 'dim' }, l: { R: 'stepping inward...' }, sfx: 'pop' },
      { speaker: 'chopper', pos: 'left', line: "So the two walls just keep marching toward each other until they meet, and whatever the biggest number we wrote down was — that stays the answer?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Exactly. Once the pointers meet, we stop. Best area found: forty-nine, between pillar 1 and pillar 8.", p: { h1: 'good', h8: 'good' }, l: { best: '49 (final)' }, sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "One pass. Never move the tall one.", sfx: 'pop' }
    ],

    complexity: 'Time: O(n) — the two pointers start at opposite ends and only ever move inward, so together they cross the array once. Space: O(1) — just two index variables and a running best.',
    pitfall: 'Moving the taller pointer (or both pointers) instead of always moving the shorter one. Moving the taller side can only shrink the width while the bottleneck height stays capped by the same short pillar (or gets worse), so it can silently step past the true optimal pair.',
    solution: `def max_area(height):
      left, right = 0, len(height) - 1
      best = 0
      while left < right:
          width = right - left
          best = max(best, width * min(height[left], height[right]))
          if height[left] < height[right]:
              left += 1   # the shorter side is the bottleneck; only it can improve things
          else:
              right -= 1
      return best`
  };

  E['three-sum'] = {
    id: 'three-sum',
    epNumber: 2,
    title: "Nami's Zero-Balance Ledger",
    patternId: 'two-pointers',
    leetcode: { name: '3Sum', number: 15, difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/' },
    problem: 'Given an array of integers, find all unique triplets [a, b, c] such that a + b + c equals zero. Return the triplets in any order, with no duplicate triplets in the result.',
    example: 'nums = [-1, 0, 1, 2, -1, -4]  →  answer: [[-1, -1, 2], [-1, 0, 1]]',

    h: 220,
    props: [
      { id: 'm4', emoji: '💰', label: '-4', x: 8, y: 34 },
      { id: 'a1', emoji: '💰', label: '-1', x: 24, y: 34 },
      { id: 'a2', emoji: '💰', label: '-1', x: 40, y: 34 },
      { id: 'z0', emoji: '💰', label: '0', x: 56, y: 34 },
      { id: 'p1', emoji: '💰', label: '1', x: 72, y: 34 },
      { id: 'p2', emoji: '💰', label: '2', x: 88, y: 34 }
    ],
    ledger: [
      { id: 'FIX', emoji: '📌', x: 15, y: 80 },
      { id: 'L', emoji: '👈', x: 45, y: 80 },
      { id: 'R', emoji: '👉', x: 75, y: 80 }
    ],

    steps: [
      { speaker: 'brook', pos: 'right', line: "Yohoho — imagine the ship's ledger as a row of six entries, already sorted from biggest debt to biggest credit: minus four, minus one, minus one, zero, one, two. Somewhere in here are THREE entries that balance to exactly zero, with no entry counted twice.", sfx: null },
      { speaker: 'chopper', pos: 'left', line: "Do we have to check every possible group of three? With six entries that's already twenty different trios!", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Not one at a time. The ledger is sorted, so we fix ONE entry as the anchor, then hunt the other two with a two-pointer sweep on the rest — the exact same trick as balancing a two-person split, just repeated for every possible anchor.", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Anchor at minus four. Left pointer starts right after it, right pointer at the far end: minus one and two.", p: { m4: 'lit', a1: 'lit', p2: 'lit' }, l: { FIX: '-4', L: '-1', R: '2' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Minus four plus minus one plus two is minus three — too low. Only sliding the left pointer up can raise that sum, and it never catches up before the pointers cross. No triplet starts with minus four.", p: { m4: 'dim', a1: 'dim', a2: 'dim', z0: 'dim', p1: 'dim', p2: 'dim' }, sfx: 'pop' },
      { speaker: 'nami', pos: 'right', line: "Anchor moves to the next entry: minus one. Left resets just after it, right resets to the far end.", p: { a1: 'lit', a2: 'lit', p2: 'lit' }, l: { FIX: '-1', L: '-1', R: '2' }, sfx: 'chime' },
      { speaker: 'nami', pos: 'right', line: "Minus one plus minus one plus two is zero — balanced! Log this trio, then slide both pointers inward to keep hunting under the same anchor.", p: { a1: 'good', a2: 'good', p2: 'good' }, sfx: 'gong' },
      { speaker: 'nami', pos: 'right', line: "Left steps to zero, right steps to one: minus one plus zero plus one is zero again — a second balanced trio!", p: { z0: 'good', p1: 'good' }, sfx: 'victory' },
      { speaker: 'zoro', pos: 'left', line: "Next anchor candidate is another minus one — the same value we already anchored on. Skip it, or we'd just log the same two trios twice.", sfx: 'pop' },
      { speaker: 'chopper', pos: 'left', line: "Anchor moves to zero: zero plus one plus two is three — too high, and the pointers are already meeting each other. Nothing there.", sfx: null },
      { speaker: 'brook', pos: 'right', line: "Two trios, no repeats. The ledger balances to zero exactly twice. Yohoho!", sfx: 'victory' }
    ],

    complexity: 'Time: O(n^2) — sorting costs O(n log n), then for each of n anchors the two-pointer sweep is O(n), which dominates the total. Space: O(1) extra beyond the output (O(n) if you count the space sorting itself uses).',
    pitfall: 'Forgetting to skip a repeated anchor value (or repeated left/right values right after logging a match) — without that skip, the same triplet gets logged multiple times whenever the sorted array has duplicate numbers.',
    solution: `def three_sum(nums):
      nums.sort()
      n = len(nums)
      result = []
      for i in range(n - 2):
          if i > 0 and nums[i] == nums[i - 1]:
              continue  # skip a duplicate anchor
          left, right = i + 1, n - 1
          while left < right:
              total = nums[i] + nums[left] + nums[right]
              if total < 0:
                  left += 1
              elif total > 0:
                  right -= 1
              else:
                  result.append([nums[i], nums[left], nums[right]])
                  left += 1
                  right -= 1
                  while left < right and nums[left] == nums[left - 1]:
                      left += 1  # skip a duplicate left value
                  while left < right and nums[right] == nums[right + 1]:
                      right -= 1  # skip a duplicate right value
      return result`
  };

  E['minimum-window-substring'] = {
    id: 'minimum-window-substring',
    epNumber: 6,
    title: 'The Shortest Excerpt Worth Copying',
    patternId: 'sliding-window',
    leetcode: { name: 'Minimum Window Substring', number: 76, difficulty: 'Hard', url: 'https://leetcode.com/problems/minimum-window-substring/' },
    problem: 'Given a string s and a string t, find the smallest contiguous window (substring) of s that contains every character of t, including matching counts for repeated characters. Return that substring, or an empty string if no such window exists.',
    example: 's = "ADOBECODEBANC", t = "ABC"  →  answer: "BANC"  (the shortest window of s containing every letter of t)',

    h: 220,
    props: [
      { id: 'c0', emoji: '📜', label: 'A', x: 4, y: 34 },
      { id: 'c1', emoji: '📜', label: 'D', x: 11, y: 34 },
      { id: 'c2', emoji: '📜', label: 'O', x: 19, y: 34 },
      { id: 'c3', emoji: '📜', label: 'B', x: 26, y: 34 },
      { id: 'c4', emoji: '📜', label: 'E', x: 33, y: 34 },
      { id: 'c5', emoji: '📜', label: 'C', x: 41, y: 34 },
      { id: 'c6', emoji: '📜', label: 'O', x: 48, y: 34 },
      { id: 'c7', emoji: '📜', label: 'D', x: 56, y: 34 },
      { id: 'c8', emoji: '📜', label: 'E', x: 63, y: 34 },
      { id: 'c9', emoji: '📜', label: 'B', x: 70, y: 34 },
      { id: 'c10', emoji: '📜', label: 'A', x: 78, y: 34 },
      { id: 'c11', emoji: '📜', label: 'N', x: 85, y: 34 },
      { id: 'c12', emoji: '📜', label: 'C', x: 93, y: 34 }
    ],
    ledger: [
      { id: 'window', emoji: '🪟', x: 30, y: 82 },
      { id: 'best', emoji: '🏆', x: 70, y: 82 }
    ],

    steps: [
      { speaker: 'usopp', pos: 'left', line: "This parchment reads A-D-O-B-E-C-O-D-E-B-A-N-C, and somewhere inside it is the SMALLEST possible stretch that still holds one A, one B, and one C. Find it, and only it gets copied out!", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "Just find any place where A, B, and C are all sitting close together, right? Why does it matter if it's the SMALLEST one?", sfx: null },
      { speaker: 'nami', pos: 'right', line: "Because every letter of parchment we copy costs us ink and time — the smaller the excerpt, the less we haul back to the ship.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "So: grow a window from the right until it holds every letter we need, then shrink it from the left as far as it'll still hold all of them, recording the smallest valid window each time. Expand to satisfy, shrink to tighten.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Expanding right — A, D, O, B, E, C. The moment C lands, at index five, I finally have one A, one B, one C. First valid window: index zero through five.", p: { c0: 'lit', c1: 'lit', c2: 'lit', c3: 'lit', c4: 'lit', c5: 'lit' }, l: { window: '[0,5] "ADOBEC"', best: '6 "ADOBEC"' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Try shrinking from the left — but dropping index zero throws away my only A. Invalid. So I stop shrinking there and keep pushing the right edge instead.", p: { c0: 'dim' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "O, D, E, B go by — nothing new needed — until index ten brings a second A. Valid again, but now the window stretches all the way from index one to index ten.", p: { c6: 'lit', c7: 'lit', c8: 'lit', c9: 'lit', c10: 'lit' }, l: { window: '[1,10] "DOBECODEBA"' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Now shrink hard — D, O, that extra B, and E all peel off the left edge without losing A, B, or C, since I still have the C at index five and the new A at index ten.", p: { c1: 'dim', c2: 'dim', c3: 'dim', c4: 'dim' }, l: { window: '[5,10] "CODEBA"', best: '6 (tied, no improvement)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "One more drop takes the C at index five with it — invalid. Stop shrinking, push right again.", p: { c5: 'dim' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "N goes by, then a second C lands at index twelve. Valid once more, window six through twelve.", p: { c11: 'lit', c12: 'lit' }, l: { window: '[6,12] "ODEBANC"' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Shrink again — O, D, E, and that extra B all peel off, and I still hold my A, my B, my C. Index nine through twelve: B, A, N, C. Four letters — the smallest yet.", p: { c6: 'dim', c7: 'dim', c8: 'dim', c9: 'good', c10: 'good', c11: 'good', c12: 'good' }, l: { window: '[9,12] "BANC"', best: '4 "BANC"' }, sfx: 'victory' },
      { speaker: 'nami', pos: 'right', line: "Try to drop the B at index nine and the window loses its only B — invalid, and there's no more parchment to the right. Four letters is as small as it gets.", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! BANC! ...is that a snack?", sfx: 'pop' }
    ],

    complexity: 'Time: O(|s| + |t|) — building the need-counts from t is O(|t|); the right pointer advances at most |s| times and the left pointer advances at most |s| times total across the whole scan, each step doing O(1) work with the count maps. Space: O(|s| + |t|) worst case for the count maps (bounded by alphabet size in practice).',
    pitfall: 'Checking window validity as "does every needed character appear at least once" instead of "does every needed character appear at least as many times as in t" — this breaks the moment t has a repeated character (e.g. t = "AAB"), since a window holding only one A would incorrectly count as valid.',
    solution: `from collections import Counter

  def min_window(s, t):
      if not t or not s:
          return ""
      need = Counter(t)
      required = len(need)          # number of distinct chars that must be satisfied
      window_counts = {}
      formed = 0
      left = 0
      best_len, best_left, best_right = float('inf'), 0, 0
      for right, ch in enumerate(s):
          window_counts[ch] = window_counts.get(ch, 0) + 1
          if ch in need and window_counts[ch] == need[ch]:
              formed += 1
          while formed == required:
              if right - left + 1 < best_len:
                  best_len = right - left + 1
                  best_left, best_right = left, right
              left_ch = s[left]
              window_counts[left_ch] -= 1
              if left_ch in need and window_counts[left_ch] < need[left_ch]:
                  formed -= 1
              left += 1
      return "" if best_len == float('inf') else s[best_left:best_right + 1]`
  };

  E['longest-repeating-character-replacement'] = {
    id: 'longest-repeating-character-replacement',
    epNumber: 5,
    title: 'The Banner With One Patch to Spare',
    patternId: 'sliding-window',
    leetcode: { name: 'Longest Repeating Character Replacement', number: 424, difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/' },
    problem: 'Given a string s of uppercase English letters and an integer k, you may change up to k characters in s to any other uppercase letter. Return the length of the longest substring achievable that contains only one repeated letter after making at most k changes.',
    example: 's = "AABABBA", k = 1  →  answer: 4  (one replacement turns some 4-letter stretch into a single repeated letter)',

    h: 220,
    props: [
      { id: 'd0', emoji: '🚩', label: 'A', x: 6, y: 34 },
      { id: 'd1', emoji: '🚩', label: 'A', x: 20, y: 34 },
      { id: 'd2', emoji: '🚩', label: 'B', x: 34, y: 34 },
      { id: 'd3', emoji: '🚩', label: 'A', x: 48, y: 34 },
      { id: 'd4', emoji: '🚩', label: 'B', x: 62, y: 34 },
      { id: 'd5', emoji: '🚩', label: 'B', x: 76, y: 34 },
      { id: 'd6', emoji: '🚩', label: 'A', x: 90, y: 34 }
    ],
    ledger: [
      { id: 'window', emoji: '🪟', x: 22, y: 82 },
      { id: 'maxFreq', emoji: '📈', x: 52, y: 82 },
      { id: 'best', emoji: '🏆', x: 82, y: 82 }
    ],

    steps: [
      { speaker: 'brook', pos: 'right', line: "A banner sewn letter by letter — A, A, B, A, B, B, A. We want the longest stretch that could be repainted into ONE repeated letter, but the sewing budget only allows repainting k = 1 patch. Yohoho, threadbare economics!", sfx: null },
      { speaker: 'luffy', pos: 'left', line: "Why not just repaint the WHOLE banner into one letter?", sfx: null },
      { speaker: 'robin', pos: 'right', line: "Because the budget is only one patch, Luffy — that's what makes it hard. Grow a window to the right, and track the highest count any single letter has reached inside it so far — call it the record. The window stays affordable exactly when its length minus that record is at most our budget, because that difference IS how many patches repainting would cost. Cross the budget, shrink one letter off the left, and check again.", sfx: null },
      { speaker: 'robin', pos: 'right', line: "First letter, A. Record for A is one. Window length one, cost zero. Affordable — window grows.", p: { d0: 'lit' }, l: { window: '[0,0] "A"', maxFreq: '1', best: '1' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Second letter, A again. Record climbs to two. Window length two, cost zero. Still affordable.", p: { d1: 'lit' }, l: { window: '[0,1] "AA"', maxFreq: '2', best: '2' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Third letter, B. The record stays at two — B hasn't caught up. Window length three, cost one. Exactly at budget — still affordable.", p: { d2: 'lit' }, l: { window: '[0,2] "AAB"', best: '3' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Fourth letter, A. Record climbs to three. Window length four, cost one. Still exactly at budget.", p: { d3: 'lit' }, l: { window: '[0,3] "AABA"', maxFreq: '3', best: '4' }, sfx: 'chime' },
      { speaker: 'robin', pos: 'right', line: "Fifth letter, B. Record still three. Window length is now five — index zero through four — cost five minus three is two. Over budget! Drop the leftmost letter, index zero. Window shrinks to indices one through four, length four, cost back to one.", p: { d4: 'lit', d0: 'dim' }, l: { window: '[1,4] "ABAB"', best: '4 (holding)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Sixth letter, B. Record holds at three. Window stretches to indices one through five, length five, cost two — over budget again. Drop index one. Window shrinks to indices two through five, length four, cost one.", p: { d5: 'lit', d1: 'dim' }, l: { window: '[2,5] "BABB"', best: '4 (holding)' }, sfx: 'pop' },
      { speaker: 'robin', pos: 'right', line: "Last letter, A. Record holds at three. Window stretches to indices two through six, length five, cost two — over budget once more, and the banner's out of letters after this. Drop index two. Window shrinks to indices three through six, length four, cost one — that's as far as we get.", p: { d6: 'lit', d2: 'dim' }, l: { window: '[3,6] "ABBA"', best: '4 (final)' }, sfx: 'pop' },
      { speaker: 'zoro', pos: 'left', line: "Four letters, one patch, no better window left to check. That's the answer.", p: { d3: 'good', d4: 'good', d5: 'good', d6: 'good' }, sfx: 'victory' },
      { speaker: 'luffy', pos: 'left', line: "SHISHISHI! One patch of paint and we get a banner four letters strong. Iron Pirate Luffy approves!", sfx: 'pop' }
    ],

    complexity: 'Time: O(n) — the right pointer advances once per character and the left pointer only ever moves forward, so total pointer movement across the whole scan is linear; the frequency record updates in O(1) each step. Space: O(26), i.e. O(1), for the per-letter counts.',
    pitfall: 'Recomputing the record (maxFreq) honestly every time the window shrinks. It is allowed to go stale, overcounting a letter that is no longer fully inside the window, because the window length never needs to shrink below the best length already found; a stale record only ever blocks growth until a genuinely larger one appears. Forcing an honest recount on every shrink is extra work that changes nothing about the final answer.',
    solution: `def character_replacement(s, k):
      counts = {}
      left = 0
      max_freq = 0
      best = 0
      for right, ch in enumerate(s):
          counts[ch] = counts.get(ch, 0) + 1
          max_freq = max(max_freq, counts[ch])  # record high, allowed to go stale
          window_len = right - left + 1
          if window_len - max_freq > k:
              counts[s[left]] -= 1
              left += 1
          best = max(best, right - left + 1)
      return best`
  };
  E['linked-list-cycle-ii'] = {
    id: 'linked-list-cycle-ii',
    epNumber: 9,
    title: "The Loop's Front Door",
    patternId: 'fast-slow-pointers',
    leetcode: { name: 'Linked List Cycle II', number: 142, difficulty: 'Medium', url: 'https://leetcode.com/problems/linked-list-cycle-ii/' },
    problem: "Given the head of a linked list that may contain a cycle, find and return the NODE where the cycle begins — not just whether a cycle exists. If there is no cycle, return null. You must do it in O(1) extra space.",
    example: "list = 3 → 2 → 0 → -4, and the tail (-4) connects back to the node with value 2  →  answer: the node with value 2",
    h: 240,
    props: [
      { id: 'n0', emoji: '🛟', label: '3', x: 8, y: 60 },
      { id: 'n1', emoji: '🌫️', label: '2', x: 35, y: 22 },
      { id: 'n2', emoji: '🌫️', label: '0', x: 62, y: 22 },
      { id: 'n3', emoji: '🌫️', label: '-4', x: 48, y: 88 }
    ],
    ledger: [
      { id: 'Slow', emoji: '🦌', x: 25, y: 100 },
      { id: 'Fast', emoji: '⚡', x: 75, y: 100 }
    ],
    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Four scrolls on this treasure trail: three, then two, then zero, then negative four. But the last one doesn't lead off the map — it loops back into the trail somewhere earlier! Last time we only needed to know IF a trail loops. This time the Log Pose needs the EXACT scroll where the loop begins.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Same trick as the Florian Triangle — I walk one scroll at a time, you go Gear Second, two scrolls at a time. When we land on the same scroll, we know it loops. But that meeting scroll won't be where the loop actually STARTS — not yet.",
        p: { n0: 'lit', Slow: 'lit', Fast: 'lit' }, l: { Slow: '3', Fast: '3' },
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "One step in — I'm already at scroll zero. You're only at scroll two.",
        p: { n0: 'dim', n1: 'lit', n2: 'lit' }, l: { Slow: '2', Fast: '0' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two steps in — I've caught up to scroll zero. And you... you're back at scroll two? The trail looped you right back around already!",
        p: { n1: 'lit', n2: 'lit' }, l: { Slow: '0', Fast: '2' },
        sfx: 'pop'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "Three steps — I'm at negative four. And... so are you! Same scroll!",
        p: { n3: 'lit' }, l: { Slow: '-4', Fast: '-4' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That meeting scroll isn't where the loop begins — it's just wherever you two happened to collide. Here's the fix: send one of you all the way back to the very first scroll, scroll three. Leave the other exactly where you met. Now both of you walk at the SAME plain, one-scroll-a-time pace.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Back at the start — scroll three. You stay put at negative four, even if your legs want to keep running.",
        p: { n0: 'lit', n3: 'lit' }, l: { Slow: '3', Fast: '-4' },
        sfx: 'pop'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "One step each — you go from three to two. I go from negative four to... two! Same scroll again!",
        p: { n1: 'good' }, l: { Slow: '2', Fast: '2' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And that's the proof — wherever you two meet on this second, equal-speed walk is exactly where the loop begins. Scroll two is the front door of the loop.",
        sfx: 'victory'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Straight line, three to two. Loop after that: two, zero, negative four — forever.",
        sfx: null
      }
    ],
    complexity: 'Time: O(n) — phase one (finding a meeting point) takes at most O(n) steps, and phase two (finding the cycle start) takes at most another O(n) steps; still linear overall. Space: O(1) — only two pointers, no visited set.',
    pitfall: "Advancing the reset pointer and the meeting-point pointer at different speeds in phase two (e.g. still moving one of them two steps at a time). The math behind this trick — distance from head to the cycle start equals distance from the meeting point to the cycle start, going forward around the loop — only holds if BOTH pointers move exactly one step at a time during phase two.",
    solution: `def detect_cycle(head):
      slow = fast = head
      while fast and fast.next:
          slow = slow.next            # walk x1
          fast = fast.next.next       # walk x2
          if slow is fast:
              # phase 2: reset one pointer to head, both now walk x1
              ptr = head
              while ptr is not slow:
                  ptr = ptr.next
                  slow = slow.next
              return ptr               # the cycle's entry node
      return None                      # fast fell off the end -- no cycle`
  };

  E['middle-of-the-linked-list'] = {
    id: 'middle-of-the-linked-list',
    epNumber: 8,
    title: 'The Midpoint Knot',
    patternId: 'fast-slow-pointers',
    leetcode: { name: 'Middle of the Linked List', number: 876, difficulty: 'Easy', url: 'https://leetcode.com/problems/middle-of-the-linked-list/' },
    problem: "Given the head of a singly linked list, return the middle node. If the list has an even number of nodes, return the SECOND of the two middle nodes.",
    example: "list = 1 → 2 → 3 → 4 → 5  →  answer: the node with value 3",
    h: 210,
    props: [
      { id: 'f1', emoji: '🚩', label: '1', x: 10, y: 40 },
      { id: 'f2', emoji: '🚩', label: '2', x: 28, y: 40 },
      { id: 'f3', emoji: '🚩', label: '3', x: 46, y: 40 },
      { id: 'f4', emoji: '🚩', label: '4', x: 64, y: 40 },
      { id: 'f5', emoji: '🚩', label: '5', x: 82, y: 40 }
    ],
    ledger: [
      { id: 'Slow', emoji: '👣', x: 30, y: 80 },
      { id: 'Fast', emoji: '💨', x: 70, y: 80 }
    ],
    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Five flags strung along the cliff path, marking the way to the buried Den Den Mushi — numbered one through five in order. We need to plant a marker at the exact MIDDLE flag. Only rule: no measuring the path twice.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Can't we just count all five flags, then walk to flag number three?",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "That's counting the whole path once, then walking part of it again — two passes. There's a way to do it in ONE walk: send one of us at normal speed and one at double speed, together. When the fast walker runs out of path, the slow walker is standing exactly on the middle flag.",
        p: { f1: 'lit', Slow: 'lit', Fast: 'lit' }, l: { Slow: '1', Fast: '1' },
        sfx: null
      },
      {
        speaker: 'brook', pos: 'left',
        line: "Yohohoho, a race where the loser wins just by standing still in the middle! Though — skeleton, I have no stamina to spend either way!",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "One step for the slow walker: flag two. Two steps for the fast one: flag three.",
        p: { f1: 'dim', f2: 'lit', f3: 'lit' }, l: { Slow: '2', Fast: '3' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Another step slow: flag three. Another double-step fast: through flag four, landing on flag five — the very last flag. No path left ahead of it.",
        p: { f2: 'dim', f3: 'lit', f5: 'lit' }, l: { Slow: '3', Fast: '5' },
        sfx: 'pop'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Fast walker's out of road. Slow walker's on flag three. That's the middle.",
        p: { f3: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'right',
        line: "SHISHISHI, and neither of us ever had to count anything first! We just walked until one of us ran out of path!",
        sfx: 'pop'
      }
    ],
    complexity: 'Time: O(n) — one pass; the fast pointer covers the list in about n/2 iterations. Space: O(1) — two pointers, nothing else.',
    pitfall: "Counting the list length first, then walking length // 2 steps from the head in a second pass. That works, but for EVEN-length lists it's easy to grab the wrong middle (the first of the two, index length//2 - 1, instead of the second, index length//2) — the two-pointer walk above naturally lands on the correct one because the loop condition `while fast and fast.next` stops exactly when it should.",
    solution: `def middle_node(head):
      slow = fast = head
      while fast and fast.next:
          slow = slow.next            # walk x1
          fast = fast.next.next       # walk x2
      return slow                     # fast ran out -- slow is the middle`
  };

  E['insert-interval'] = {
    id: 'insert-interval',
    epNumber: 11,
    title: "The Late Ship's Berth",
    patternId: 'merge-intervals',
    leetcode: { name: 'Insert Interval', number: 57, difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-interval/' },
    problem: "You are given a list of non-overlapping intervals, already sorted by start time, plus one new interval. Insert the new interval into the list, merging it with any existing intervals it overlaps, and return the resulting list of intervals — still sorted, still non-overlapping.",
    example: "intervals = [[1,3],[6,9]], newInterval = [2,5]  →  answer: [[1,5],[6,9]]",
    h: 220,
    props: [
      { id: 'e0', emoji: '🏠', label: '1–3', x: 18, y: 36 },
      { id: 'e1', emoji: '🏠', label: '6–9', x: 80, y: 36 },
      { id: 'nw', emoji: '⛵', label: '2–5', x: 49, y: 80 }
    ],
    ledger: [
      { id: 'result', emoji: '📋', x: 50, y: 100 }
    ],
    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Two ships already have dock slots booked at Water 7: hours one to three, and hours six to nine. Now a third ship radios in wanting hours two to five — and it isn't on the schedule yet. Where does it fit?",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "If it doesn't overlap anybody, we just slot it in wherever it belongs by start hour and we're done. But if it DOES overlap an existing booking, we can't just staple it in — the two bookings have to become one longer one.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So we walk the schedule once, in order, and ask three questions about each existing slot: does it end before the new one even starts? Does it start after the new one ends? Or does it overlap?",
        p: { nw: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "First slot, one to three. It doesn't end before hour two — its end, three, is past our new booking's start. And it doesn't start after hour five either. That's overlap. We swallow it into the new booking: the low end stays one, the high end stretches to five.",
        p: { e0: 'lit' }, l: { nw: '1–5' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Second slot, six to nine. Does it start after our now-grown booking ends at five? Yes — six is past five. No overlap. That means our merged booking is finished growing, and this slot stands entirely on its own, right after it.",
        p: { e0: 'off', e1: 'lit', nw: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "One to five, then six to nine. Two slots on the board, in order — and the new ship folded straight into slot one without anybody reshuffling the whole schedule by hand.",
        p: { e1: 'good' }, l: { result: '[1–5], [6–9]' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "So the new ship didn't even need its OWN dock — it just moved into ship one's spot and made it bigger! SHISHISHI!",
        sfx: 'pop'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "One pass. Keep what ends before you start, merge whatever overlaps, keep what starts after you end.",
        sfx: null
      }
    ],
    complexity: 'Time: O(n) — the input is already sorted and non-overlapping, so a single sweep is enough; no sort needed. Space: O(n) for the output list.',
    pitfall: "Forgetting to append the growing new interval to the result if it never gets appended inside the loop — e.g. when the new interval overlaps nothing and belongs after every existing one, the sweep can finish without ever placing it. Always append the (possibly merged) new interval once, after the 'ends before' loop and before the 'starts after' loop, not conditionally inside either.",
    solution: `def insert(intervals, new_interval):
      result = []
      i, n = 0, len(intervals)
      start, end = new_interval

      # 1) every existing interval that ends strictly before the new one starts
      while i < n and intervals[i][1] < start:
          result.append(intervals[i])
          i += 1

      # 2) merge everything that overlaps the (possibly growing) new interval
      while i < n and intervals[i][0] <= end:
          start = min(start, intervals[i][0])
          end = max(end, intervals[i][1])
          i += 1
      result.append([start, end])

      # 3) everything left starts after the new interval -- copy as-is
      while i < n:
          result.append(intervals[i])
          i += 1

      return result`
  };

  E['non-overlapping-intervals'] = {
    id: 'non-overlapping-intervals',
    epNumber: 12,
    title: 'Whoever Frees the Tower First',
    patternId: 'merge-intervals',
    leetcode: { name: 'Non-overlapping Intervals', number: 435, difficulty: 'Medium', url: 'https://leetcode.com/problems/non-overlapping-intervals/' },
    problem: "Given a list of intervals, find the minimum number of intervals you must remove so that none of the remaining intervals overlap each other.",
    example: "intervals = [[1,4],[2,3],[3,5],[6,8]]  →  answer: 1  (remove [1,4]; keep [2,3], [3,5], [6,8])",
    h: 220,
    props: [
      { id: 'gA', emoji: '🗼', label: '2–3', x: 15, y: 36 },
      { id: 'gB', emoji: '🗼', label: '1–4', x: 38, y: 36 },
      { id: 'gC', emoji: '🗼', label: '3–5', x: 61, y: 36 },
      { id: 'gD', emoji: '🗼', label: '6–8', x: 84, y: 36 }
    ],
    ledger: [
      { id: 'lastEnd', emoji: '⏱️', x: 30, y: 80 },
      { id: 'removed', emoji: '🚫', x: 70, y: 80 }
    ],
    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Four scouts radio in wanting the watchtower tonight — shift windows of one to four, two to three, three to five, and six to eight o'clock. Some of those windows overlap. We can only grant the shifts that never overlap each other, and I want as few scouts turned away as possible.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Feels natural to just grant whoever asked with the EARLIEST start first — scout one, one to four. Lock that in and work forward from there, right?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Not quite. Sort by when each shift ENDS instead of when it starts. The window that frees the tower soonest — two to three — should always be the one we lock in first, no matter who asked, or when.",
        l: { lastEnd: '—', removed: '0' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Two to three doesn't conflict with anything yet, so it's free — keep it. Tower's booked until hour three.",
        p: { gA: 'good' }, l: { lastEnd: '3' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Next shortest-to-end: scout one's one to four. But it STARTS at hour one — before hour three, when the tower's already booked. Overlap. Turn this one away.",
        p: { gB: 'bad' }, l: { removed: '1' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Next: three to five. Starts right at hour three, the moment the tower frees up — no overlap. Keep it. Booked until hour five now.",
        p: { gC: 'good' }, l: { lastEnd: '5' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Last one: six to eight. Starts well after hour five. Clean. Keep it too.",
        p: { gD: 'good' }, l: { lastEnd: '8' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Three shifts kept, only one scout turned away. If I'd locked in scout one's LONG shift first like I almost suggested, it would have blocked both two-to-three AND three-to-five — we'd have kept fewer overall.",
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "So the shift that gets OUT OF THE WAY fastest wins the tower first, even if it asked last! SHISHISHI, that's just like leaving room for everyone at the dinner table!",
        sfx: 'pop'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Sort by end. Keep it if it starts on or after the last one you kept ends. Count what you drop.",
        sfx: null
      }
    ],
    complexity: 'Time: O(n log n) — dominated by sorting by end time; the greedy sweep after that is a single O(n) pass. Space: O(1) extra beyond the sort.',
    pitfall: "Sorting by START time instead of END time. Sorting by start greedily favors whichever interval was scheduled first, even if it's long and blocks many later ones — sorting by END time and always keeping whichever interval frees up soonest is what actually maximizes how many intervals survive (and so minimizes how many must be removed).",
    solution: `def erase_overlap_intervals(intervals):
      intervals.sort(key=lambda iv: iv[1])   # sort by END time
      removed = 0
      last_end = float('-inf')
      for start, end in intervals:
          if start >= last_end:              # no overlap with the one we kept
              last_end = end                  # keep it, tower free again at 'end'
          else:
              removed += 1                    # overlaps -- drop this one
      return removed`
  };

  E['find-minimum-in-rotated-sorted-array'] = {
    id: 'find-minimum-in-rotated-sorted-array',
    epNumber: 14,
    title: "The Spun Sundial's True Zero",
    patternId: 'binary-search',
    leetcode: { name: 'Find Minimum in Rotated Sorted Array', number: 153, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },
    problem: "An array that was once sorted in ascending order has been rotated at some unknown pivot, with no duplicate values. Find the minimum element in O(log n) time.",
    example: "nums = [4, 5, 6, 7, 0, 1, 2]  →  answer: 0",
    h: 210,
    props: [
      { id: 's0', emoji: '🪨', label: '4', x: 6, y: 36 },
      { id: 's1', emoji: '🪨', label: '5', x: 21, y: 36 },
      { id: 's2', emoji: '🪨', label: '6', x: 36, y: 36 },
      { id: 's3', emoji: '🪨', label: '7', x: 51, y: 36 },
      { id: 's4', emoji: '🪨', label: '0', x: 66, y: 36 },
      { id: 's5', emoji: '🪨', label: '1', x: 81, y: 36 },
      { id: 's6', emoji: '🪨', label: '2', x: 96, y: 36 }
    ],
    ledger: [
      { id: 'range', emoji: '📐', x: 50, y: 80 }
    ],
    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Okay, I MIGHT have tripped into the garden sundial this morning. The seven hour-stones used to run smallest to biggest all the way around — now they're spun to some unknown point. There's exactly one smallest stone hiding in the ring. Find it, and we know exactly how far it turned.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Can't we just look at all seven stones and see which one is smallest?",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "With seven, sure. With seven hundred, we'd be here all night. It's still HALF sorted at any split — same trick as always: cut it in half and figure out which half is hiding the smallest one.",
        l: { range: '[0,6]' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Middle stone, index three: marked seven. Compare it to the LAST stone in range, index six, marked two. Seven is bigger than two — stones only ever drop from big back to small once, at the turnover point, and that hasn't happened yet by index three. So the smallest stone is still ahead, past the middle.",
        p: { s3: 'lit', s6: 'lit' }, l: { range: '[0,6] mid=7 > edge=2 → right' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Throw away index zero through three entirely. Search only four through six.",
        p: { s0: 'dim', s1: 'dim', s2: 'dim', s3: 'dim' }, l: { range: '[4,6]' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "New middle: index five, marked one. Compare to the last stone in THIS range, index six, marked two. One is smaller — the turnover already happened at or before index five, so the smallest is index five or something before it, never past it.",
        p: { s5: 'lit' }, l: { range: '[4,6] mid=1 <= edge=2 → keep incl. mid' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Search shrinks to index four through five.",
        p: { s6: 'dim' }, l: { range: '[4,5]' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Middle now: index four, marked zero. Compare to the last stone in range, index five, marked one. Zero is smaller — same logic. The smallest is index four or before, never past it.",
        p: { s4: 'lit' }, l: { range: '[4,5] mid=0 <= edge=1 → keep incl. mid' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "That shrinks the range to exactly one stone: index four.",
        p: { s5: 'dim' }, l: { range: '[4,4]' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One stone left in range means we're done — a range of exactly one is always, trivially, its own smallest. Stone marked zero it is.",
        p: { s4: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "SHISHISHI, so the sundial used to start counting right THERE, and Usopp spun it four stones too far!",
        sfx: 'pop'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Compare the middle to the edge of your range, not to some target. Bigger than the edge, the drop's still ahead — go right. Smaller or equal, the drop already happened — stay left, keep the middle in play.",
        sfx: null
      }
    ],
    complexity: 'Time: O(log n) — each comparison halves the search range, same as ordinary binary search. Space: O(1).',
    pitfall: "Comparing the middle stone against the FIRST stone in range instead of the LAST one. Comparing mid to the range's left edge tells you whether the rotation point is inside the left half, but it doesn't cleanly tell you whether to keep or discard the middle itself — comparing mid to the right edge (hi) lets you always shrink with `hi = mid` (keeping mid as a live candidate) instead of accidentally skipping past the true minimum.",
    solution: `def find_min(nums):
      lo, hi = 0, len(nums) - 1
      while lo < hi:
          mid = (lo + hi) // 2
          if nums[mid] > nums[hi]:
              lo = mid + 1        # drop-off is still ahead -- minimum is to the right
          else:
              hi = mid             # drop-off already happened -- keep mid in play
      return nums[lo]              # lo == hi: the minimum`
  };

  E['koko-eating-bananas'] = {
    id: 'koko-eating-bananas',
    epNumber: 15,
    title: 'Bananas Before the Tide',
    patternId: 'binary-search',
    leetcode: { name: 'Koko Eating Bananas', number: 875, difficulty: 'Medium', url: 'https://leetcode.com/problems/koko-eating-bananas/' },
    problem: "There are several piles of bananas and h hours until the ship leaves. Each hour, pick one pile and eat up to k bananas from it at a chosen constant integer speed k (bananas per hour); if the pile has fewer than k left, finish that pile for the hour and don't start another pile until the next hour. Find the minimum integer eating speed k such that every pile is finished within h hours.",
    example: "piles = [3, 6, 7, 11], h = 8  →  answer: 4",
    h: 250,
    props: [
      { id: 'sp1', emoji: '🍌', label: '1', x: 4, y: 42 },
      { id: 'sp2', emoji: '🍌', label: '2', x: 13, y: 42 },
      { id: 'sp3', emoji: '🍌', label: '3', x: 22, y: 42 },
      { id: 'sp4', emoji: '🍌', label: '4', x: 31, y: 42 },
      { id: 'sp5', emoji: '🍌', label: '5', x: 40, y: 42 },
      { id: 'sp6', emoji: '🍌', label: '6', x: 49, y: 42 },
      { id: 'sp7', emoji: '🍌', label: '7', x: 58, y: 42 },
      { id: 'sp8', emoji: '🍌', label: '8', x: 67, y: 42 },
      { id: 'sp9', emoji: '🍌', label: '9', x: 76, y: 42 },
      { id: 'sp10', emoji: '🍌', label: '10', x: 85, y: 42 },
      { id: 'sp11', emoji: '🍌', label: '11', x: 94, y: 42 }
    ],
    ledger: [
      { id: 'piles', emoji: '📋', x: 50, y: 8 },
      { id: 'range', emoji: '📐', x: 50, y: 84 }
    ],
    steps: [
      {
        speaker: 'nami', pos: 'right',
        line: "Sunny casts off in exactly eight hours — the tide won't wait a minute longer. There are four banana piles left on the dock: three, six, seven, and eleven bananas. And Luffy will not leave without every single one eaten first.",
        l: { piles: 'piles 3,6,7,11 · 8 hrs' },
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "I'll eat every pile! Just tell me how many bananas an hour to go so it fits EXACTLY in eight hours — and not one banana an hour faster than I have to, my stomach has limits!",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Remember the rule — you eat from only ONE pile per hour, at whatever speed you pick. If the pile runs out partway through the hour, that hour is still used up; you can't start a new pile until the next one begins.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So we aren't searching the piles at all — we're searching every POSSIBLE eating speed, from one banana an hour up to eleven, enough to clear the biggest pile in a single hour. Somewhere in that range is the slowest speed that still finishes on time. Binary search for it.",
        l: { range: '[1,11]' },
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Try the middle speed: six bananas an hour. Pile three needs one hour, pile six needs one hour, pile seven needs two hours, pile eleven needs two hours. Six hours total.",
        p: { sp6: 'lit' }, l: { range: '[1,11] speed 6 → 6 hrs' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Six hours fits inside our eight-hour limit with room to spare, so speed six works — but something slower might work too. Keep searching the lower half.",
        p: { sp6: 'good' }, l: { range: '[1,6]' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Middle of what's left: three bananas an hour. One hour, two hours, three hours, four hours — ten hours total.",
        p: { sp3: 'lit' }, l: { range: '[1,6] speed 3 → 10 hrs' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Ten hours blows past our eight-hour limit. Speed three is too slow — Luffy needs to eat faster than that. Search the upper half instead.",
        p: { sp3: 'bad' }, l: { range: '[4,6]' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Middle of four to six: five bananas an hour. One hour, two hours, two hours, three hours — eight hours total.",
        p: { sp5: 'lit' }, l: { range: '[4,6] speed 5 → 8 hrs' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Eight hours lands exactly on the limit — that still counts as finishing on time. Five works. Try slower still.",
        p: { sp5: 'good' }, l: { range: '[4,5]' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Middle of four to five: four bananas an hour. One hour, two hours, two hours, three hours — eight hours total, again exactly at the limit.",
        p: { sp4: 'lit' }, l: { range: '[4,5] speed 4 → 8 hrs' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Four also finishes exactly on time, and there's nothing slower left in range to test. Four bananas an hour is the floor.",
        p: { sp4: 'good' }, l: { range: '[4,4]' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "Four it is! ...wait, that's SLOWER than I wanted to eat! Ugh — fine. SHISHISHI, still bananas!",
        sfx: 'pop'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "We never searched the piles themselves — only the speeds. Same halving trick, aimed at a different range.",
        sfx: null
      }
    ],
    complexity: 'Time: O(n log m) — binary search over the speed range (width up to max(piles), call it m), and each feasibility check costs an O(n) pass over the piles. Space: O(1).',
    pitfall: "Using floor division (pile // speed) to count hours needed for a pile instead of ceiling division. At speed six, a pile of seven bananas takes floor(7/6) = 1 hour by mistake, but Koko-, er, Luffy-, actually needs TWO hours — one hour eats six, leaving one banana that still needs its own hour. Always use ceiling: (pile + speed - 1) // speed, or math.ceil(pile / speed).",
    solution: `def min_eating_speed(piles, h):
      lo, hi = 1, max(piles)
      while lo < hi:
          mid = (lo + hi) // 2
          hours = sum((pile + mid - 1) // mid for pile in piles)  # ceiling division
          if hours <= h:
              hi = mid              # fast enough -- try an even slower speed
          else:
              lo = mid + 1           # too slow -- must eat faster
      return lo`
  };

  window.EPISODES = E;
})();
