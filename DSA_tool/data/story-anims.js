/* Animated One Piece story scenes — one per pattern, acting out the same anecdote
   used in that pattern's Story Mode. Consumed by js/story-anim-engine.js.
   Coordinates are percentages of the stage. Step captions carry the storyline. */

(function () {
  'use strict';

  const S = {};

  // Evenly spaced row of props from x0..x1
  function track(prefix, vals, y, x0, x1, emoji) {
    const n = vals.length;
    return vals.map((v, i) => ({
      id: prefix + i,
      emoji: emoji,
      label: String(v),
      x: n === 1 ? (x0 + x1) / 2 : x0 + i * (x1 - x0) / (n - 1),
      y: y
    }));
  }

  const TP_X = [12, 27.2, 42.4, 57.6, 72.8, 88];

  S['two-pointers'] = {
    h: 220,
    props: track('v', [1, 3, 4, 6, 8, 11], 42, 12, 88, '🧪'),
    actors: [
      { id: 'chopper', emoji: '🦌', label: 'Chopper', x: TP_X[0], y: 76 },
      { id: 'usopp', emoji: '🔭', label: 'Usopp', x: TP_X[5], y: 76 }
    ],
    steps: [
      { c: "Doctor's orders: two vials that mix to exactly 10. The vials are sorted, so Chopper takes the weakest end and Usopp the strongest.", p: { v0: 'lit', v5: 'lit' } },
      { c: '1 + 11 = 12 — too strong. Only one honest fix: Usopp steps down to a weaker vial.', p: { v5: 'dim', v4: 'lit' }, a: { usopp: [TP_X[4], 76] } },
      { c: '1 + 8 = 9 — too weak. Chopper steps up.', p: { v0: 'dim', v1: 'lit' }, a: { chopper: [TP_X[1], 76] } },
      { c: '3 + 8 = 11 — too strong. Usopp steps down again.', p: { v4: 'dim', v3: 'lit' }, a: { usopp: [TP_X[3], 76] } },
      { c: '3 + 6 = 9 — too weak. Chopper steps up.', p: { v1: 'dim', v2: 'lit' }, a: { chopper: [TP_X[2], 76] } },
      { c: '4 + 6 = 10 ✓ — dose found. Every move ruled out a whole batch of pairs, and no pair was ever re-checked. One pass: O(n).', p: { v2: 'good', v3: 'good' } }
    ]
  };

  S['sliding-window'] = {
    h: 230,
    props: track('v', [4, 2, 7, 1, 3, 5], 46, 12, 88, '🍖'),
    actors: [
      { id: 'luffy', emoji: '😋', label: 'Luffy (right edge)', x: TP_X[0], y: 16 },
      { id: 'sanji', emoji: '🍳', label: 'Sanji (left edge)', x: TP_X[0], y: 80 }
    ],
    steps: [
      { c: "All-you-can-eat — but the bill can't pass 9. Luffy eats plate after plate; Sanji tracks the running total. Plate 4 → total 4.", p: { v0: 'lit' } },
      { c: 'Next plate: 4 + 2 = 6. Still fine — the window grows to the right.', p: { v1: 'lit' }, a: { luffy: [TP_X[1], 16] } },
      { c: 'Next: 6 + 7 = 13 — over budget!', p: { v2: 'bad' }, a: { luffy: [TP_X[2], 16] } },
      { c: "Sanji doesn't restart the meal. He drops plates from the LEFT until it fits: −4 → total 9. The window slides.", p: { v0: 'dim', v2: 'lit' }, a: { sanji: [TP_X[1], 80] } },
      { c: 'Grow again: 9 + 1 = 10 — over. Drop the 2 → total 8. The left edge only ever chases the right; neither retreats.', p: { v3: 'lit', v1: 'dim' }, a: { luffy: [TP_X[3], 16], sanji: [TP_X[2], 80] } },
      { c: 'Every plate enters the window once and leaves at most once — about 2n moves total. That is why this is O(n), not O(n²).', p: { v2: 'good', v3: 'good' } }
    ]
  };

  // Loop nodes: n0,n1 tail; n2..n7 form the cycle
  const FS = {
    n0: [8, 55], n1: [24, 55], n2: [40, 55], n3: [54, 26],
    n4: [74, 20], n5: [90, 45], n6: [78, 78], n7: [55, 82]
  };
  function fsA(node, who) { // Chopper walks above the trees, Luffy below
    const p = FS[node];
    return who === 'c' ? [p[0], p[1] - 15] : [p[0], p[1] + 15];
  }
  S['fast-slow-pointers'] = {
    h: 250,
    props: Object.keys(FS).map(k => ({ id: k, emoji: '🌲', x: FS[k][0], y: FS[k][1] })),
    actors: [
      { id: 'chopper', emoji: '🦌', label: 'walk ×1', x: fsA('n0', 'c')[0], y: fsA('n0', 'c')[1] },
      { id: 'luffy', emoji: '⚡', label: 'run ×2', x: fsA('n0', 'l')[0], y: fsA('n0', 'l')[1] }
    ],
    steps: [
      { c: 'A forest path feeds into a hidden loop. Chopper walks one tree per tick; Gear-Second Luffy blurs past two.' },
      { c: 'One tick: Chopper at tree 1, Luffy already at tree 2 — inside the loop without knowing it.', a: { chopper: fsA('n1', 'c'), luffy: fsA('n2', 'l') } },
      { c: 'Chopper enters the loop. The gap between them grows by exactly one tree per tick…', a: { chopper: fsA('n2', 'c'), luffy: fsA('n4', 'l') } },
      { c: '…but inside a loop, a growing gap wraps around. Luffy is now coming up behind Chopper.', a: { chopper: fsA('n3', 'c'), luffy: fsA('n6', 'l') } },
      { c: "Luffy laps the loop. On a straight path he'd be gone forever — on a loop, he must circle back.", a: { chopper: fsA('n4', 'c'), luffy: fsA('n2', 'l') } },
      { c: 'The gap now closes by one every tick — a collision is guaranteed, not lucky.', a: { chopper: fsA('n5', 'c'), luffy: fsA('n4', 'l') } },
      { c: 'They collide at tree 6. Meeting PROVES the loop exists — no visited set, O(1) space.', a: { chopper: fsA('n6', 'c'), luffy: fsA('n6', 'l') }, p: { n6: 'good' } }
    ]
  };

  S['merge-intervals'] = {
    h: 200,
    props: [
      { id: 's0', emoji: '⚓', label: '1–4', x: 18, y: 36 },
      { id: 's1', emoji: '⚓', label: '3–7', x: 40, y: 36 },
      { id: 's2', emoji: '⚓', label: '8–10', x: 62, y: 36 },
      { id: 's3', emoji: '⚓', label: '9–12', x: 84, y: 36 }
    ],
    actors: [{ id: 'marine', emoji: '🫡', label: 'HQ sweep', x: 18, y: 72 }],
    steps: [
      { c: 'Four patrol shifts, already sorted by start time. HQ sweeps left to right, merging any shift that overlaps the patrol currently on the water.', p: { s0: 'lit' } },
      { c: '3–7 starts before the current patrol ends at 4 — same patrol. Merge them: 1–7.', l: { s0: '1–7' }, p: { s1: 'off' }, a: { marine: [40, 72] } },
      { c: '8–10 starts after 7 — the old patrol is sealed and a new one opens.', p: { s0: 'good', s2: 'lit' }, a: { marine: [62, 72] } },
      { c: '9–12 overlaps 8–10 → merge into 8–12.', l: { s2: '8–12' }, p: { s3: 'off' }, a: { marine: [84, 72] } },
      { c: 'Done: two patrols, zero double-manning. Sort once (O(n log n)), sweep once (O(n)) — and none of it works if you skip the sort.', p: { s2: 'good' } }
    ]
  };

  const BS_X = [10, 23.3, 36.7, 50, 63.3, 76.7, 90];
  S['binary-search'] = {
    h: 210,
    props: BS_X.map((x, i) => ({ id: 'i' + i, emoji: '🏝', label: String(i), x: x, y: 42 })),
    actors: [{ id: 'nami', emoji: '🧭', label: 'Nami', x: 50, y: 76 }],
    steps: [
      { c: "Seven islands; the treasure signal comes from exactly one, and it reads stronger the closer you are. Nami doesn't sail island by island — she jumps straight to the middle.", p: { i3: 'lit' } },
      { c: 'At island 3 the signal points EAST. The entire western half is ruled out with one reading. Jump to the middle of what remains.', p: { i0: 'dim', i1: 'dim', i2: 'dim', i3: 'dim', i5: 'lit' }, a: { nami: [BS_X[5], 76] } },
      { c: 'At island 5 the signal points WEST. Island 6 is out — only island 4 remains.', p: { i5: 'dim', i6: 'dim', i4: 'lit' }, a: { nami: [BS_X[4], 76] } },
      { c: 'Island 4: treasure ✓. Three readings for seven islands — and doubling the sea would add just ONE more reading. That is O(log n), and it only works because the signal is monotonic.', p: { i4: 'good' } }
    ]
  };

  S['hashing-patterns'] = {
    h: 200,
    props: [
      { id: 'b0', emoji: '📜', label: '—', x: 20, y: 34 },
      { id: 'b1', emoji: '📜', label: '—', x: 40, y: 34 },
      { id: 'b2', emoji: '📜', label: '—', x: 60, y: 34 },
      { id: 'b3', emoji: '📜', label: '—', x: 80, y: 34 }
    ],
    actors: [{ id: 'clerk', emoji: '🫡', label: 'clerk', x: 20, y: 70 }],
    steps: [
      { c: "Every pirate's name maps to one fixed slot on the bounty board — that mapping is the hash. Report on Luffy: pinned straight into his slot, no scanning.", l: { b1: 'Luffy' }, p: { b1: 'lit' }, a: { clerk: [40, 70] } },
      { c: 'Report on Zoro: straight to his slot.', l: { b3: 'Zoro' }, p: { b3: 'lit', b1: '' }, a: { clerk: [80, 70] } },
      { c: 'Report on Nami: pinned.', l: { b0: 'Nami' }, p: { b0: 'lit', b3: '' }, a: { clerk: [20, 70] } },
      { c: "New report: 'Luffy'. Seen before? The clerk walks straight to the slot the name maps to — already filled. Answered in O(1).", p: { b1: 'good', b0: '' }, a: { clerk: [40, 70] } },
      { c: "The board never gets slower as it fills. 'Have I seen this?', complements (Two Sum), grouping anagrams — all one slot-lookup away." }
    ]
  };

  const PS_X = [12, 27.2, 42.4, 57.6, 72.8, 88];
  S['prefix-sum'] = {
    h: 230,
    props: track('d', [5, 3, 8, 2, 6, 4], 34, 12, 88, '🌊').concat(
      PS_X.map((x, i) => ({ id: 'p' + i, label: '?', x: x, y: 68 }))
    ),
    actors: [{ id: 'nami', emoji: '🧭', label: 'Nami', x: 12, y: 88 }],
    steps: [
      { c: "A Log Pose only ever points toward the next island — it says nothing about how far the crew has already sailed. So Nami keeps her own running ledger. Day 0: 5 miles sailed. Running total: 5.", l: { p0: '5' }, p: { p0: 'lit', d0: 'lit' } },
      { c: "Day 1: 3 more miles. She doesn't note '3' on its own — she writes the NEW total: 5 + 3 = 8.", l: { p1: '8' }, p: { p1: 'lit', d1: 'lit', p0: '' }, a: { nami: [PS_X[1], 88] } },
      { c: 'Day 2: 8 more. New total: 8 + 8 = 16.', l: { p2: '16' }, p: { p2: 'lit', d2: 'lit', p1: '' }, a: { nami: [PS_X[2], 88] } },
      { c: 'Day 3: 2 more (total 18). Day 4: 6 more (total 24). Day 5: 4 more (total 28) — the whole ledger built in one pass down the voyage.', l: { p3: '18', p4: '24', p5: '28' }, p: { p3: 'lit', p4: 'lit', p5: 'lit', d3: 'lit', d4: 'lit', d5: 'lit', p2: '' }, a: { nami: [PS_X[5], 88] } },
      { c: "Weeks later: 'how far between day 1 and day 3?' No re-adding — running total after day 3 (18) minus running total before day 1, i.e. after day 0 (5): 13 miles. One subtraction.", p: { p3: 'good', p0: 'good' } },
      { c: 'Ask again, day 2 through day 5: 28 minus 8 is 20. The ledger was built ONCE, O(n) — every range question after that is O(1), forever.', p: { p5: 'good', p1: 'good' } }
    ]
  };

  S['linked-list-reversal'] = {
    h: 220,
    props: [
      { id: 'p0', emoji: '🟫', label: 'A', x: 20, y: 56 },
      { id: 'p1', emoji: '🟫', label: 'B', x: 40, y: 56 },
      { id: 'p2', emoji: '🟫', label: 'C', x: 60, y: 56 },
      { id: 'p3', emoji: '🟫', label: 'D', x: 80, y: 56 },
      { id: 'a0', label: '→', x: 20, y: 26 },
      { id: 'a1', label: '→', x: 40, y: 26 },
      { id: 'a2', label: '→', x: 60, y: 26 },
      { id: 'a3', label: '→', x: 80, y: 26 }
    ],
    actors: [
      { id: 'prev', emoji: '🚩', label: 'prev', x: 6, y: 84 },
      { id: 'curr', emoji: '👉', label: 'curr', x: 20, y: 84 }
    ],
    steps: [
      { c: 'A rope bridge of planks, each pointing to the next. To reverse it in place, flip one plank at a time — but ALWAYS grab the next plank before you flip, or the bridge behind you is lost.' },
      { c: "Plank A: save B (next), then flip A's arrow backward — at nothing, since A becomes the new tail. Advance prev and curr.", l: { a0: '←' }, p: { a0: 'lit' }, a: { prev: [20, 84], curr: [40, 84] } },
      { c: 'Plank B: save C, flip B to point at A.', l: { a1: '←' }, p: { a1: 'lit', a0: '' }, a: { prev: [40, 84], curr: [60, 84] } },
      { c: 'Plank C: save D, flip C to point at B.', l: { a2: '←' }, p: { a2: 'lit', a1: '' }, a: { prev: [60, 84], curr: [80, 84] } },
      { c: 'Plank D: nothing left to save. Flip D to point at C — prev now stands on the new head.', l: { a3: '←' }, p: { a3: 'lit', a2: '' }, a: { prev: [80, 84], curr: [94, 84] } },
      { c: 'The whole bridge reversed in one crossing: O(n) time, three markers, O(1) space. Return prev — not curr, which walked off the end.', p: { a0: 'good', a1: 'good', a2: 'good', a3: 'good' } }
    ]
  };

  S['monotonic-stack'] = {
    h: 240,
    props: [
      { id: 'gate', emoji: '🏟', label: 'Corrida gate', x: 16, y: 40 },
      { id: 'f5', emoji: '🤺', label: '5', x: 72, y: 76, cls: 'off' },
      { id: 'f3', emoji: '🤺', label: '3', x: 72, y: 48, cls: 'off' },
      { id: 'f4', emoji: '🤺', label: '4', x: 86, y: 48, cls: 'off' },
      { id: 'f8', emoji: '🤺', label: '8', x: 86, y: 76, cls: 'off' }
    ],
    actors: [{ id: 'ref', emoji: '🎺', label: 'announcer', x: 44, y: 22 }],
    steps: [
      { c: 'Corrida Colosseum block battles: fighters enter one at a time, and the standings only ever hold fighters that nobody after them has beaten — a decreasing stack. Power 5 enters an empty floor and stands.', p: { f5: 'lit' } },
      { c: "Power 3 enters. He can't beat 5, so he stacks on top. Standings stay decreasing: 5, 3.", p: { f3: 'lit', f5: '' } },
      { c: "Power 4 enters — and knocks 3 out. The instant 3 falls we learn something permanent: 4 is the first fighter after 3 who beats him. That pop IS the 'next greater element' answer.", p: { f3: 'bad' } },
      { c: "3 leaves; 4 stacks (he still can't beat 5). Standings: 5, 4.", p: { f3: 'off', f4: 'lit' } },
      { c: 'Power 8 storms in: knocks out 4, then 5 — each pop pairs a fallen fighter with his next-greater = 8.', p: { f4: 'bad', f5: 'bad' } },
      { c: 'Standings: just 8. Every fighter entered once and was knocked out at most once — 2n events total. O(n), not the O(n²) of re-scanning.', p: { f4: 'off', f5: 'off', f8: 'good' } }
    ]
  };

  const QD_X = [14, 32, 50, 68, 86];
  S['queue-deque'] = {
    h: 230,
    props: track('v', [2, 7, 4, 1, 6], 32, 14, 86, '🪖').concat(
      [2, 7, 4, 1, 6].map((v, i) => ({ id: 'd' + i, emoji: '💪', label: String(v), x: QD_X[i], y: 74, cls: 'off' }))
    ),
    actors: [{ id: 'cap', emoji: '📣', label: 'captain', x: 6, y: 52 }],
    steps: [
      { c: 'Sliding-window max: the captain keeps a lineup (top row = recruits marching past; bottom = the lineup) where the strongest always stands at the FRONT. Recruit 2 arrives and joins.', p: { d0: 'lit', v0: 'lit' } },
      { c: 'Recruit 7 arrives — everyone weaker is dismissed from the back before he joins. 2 leaves; 7 now leads.', p: { d0: 'off', d1: 'lit', v1: 'lit' } },
      { c: 'Recruit 4: weaker than 7, so he stands behind. The lineup is always decreasing: 7, 4.', p: { d2: 'lit', v2: 'lit' } },
      { c: "Recruit 1 joins: lineup 7, 4, 1. The window of 3 is full — who's strongest? The FRONT of the lineup: 7. No rescan, O(1).", p: { d3: 'lit', d1: 'good', v3: 'lit', v0: 'dim' } },
      { c: "The window slides past 7's post → he retires from the front (his index left the window). Recruit 6 dismisses 4 and 1 from the back. Lineup: 6 — still the instant max.", p: { d1: 'off', d2: 'off', d3: 'off', d4: 'good', v4: 'lit', v1: 'dim' } },
      { c: 'Each recruit joins once and is dismissed at most once — the whole march is O(n). Store INDICES, not values, so you know when the front expires.' }
    ]
  };

  S['tree-dfs-bfs'] = {
    h: 240,
    props: [
      { id: 'R', emoji: '🍃', x: 50, y: 14 },
      { id: 'L', emoji: '🍃', x: 30, y: 45 },
      { id: 'Rt', emoji: '🍃', x: 70, y: 45 },
      { id: 'LL', emoji: '🍃', x: 16, y: 78 },
      { id: 'LR', emoji: '🍃', x: 42, y: 78 },
      { id: 'RL', emoji: '🍃', x: 58, y: 78 },
      { id: 'RR', emoji: '🍃', x: 84, y: 78 }
    ],
    actors: [{ id: 'luffy', emoji: '🏴‍☠️', label: 'Luffy', x: 50, y: 4 }],
    steps: [
      { c: 'Two ways to explore a tree. DFS is the Skypiea beanstalk: commit to one branch and climb it to the very end before touching another.', p: { R: 'lit' }, a: { luffy: [50, 14] } },
      { c: 'Down the left branch first…', p: { L: 'lit' }, a: { luffy: [30, 45] } },
      { c: '…all the way to the leaf. Only now does DFS back up. The call stack remembers the way home.', p: { LL: 'lit' }, a: { luffy: [16, 78] } },
      { c: 'Backtrack one level, take the next branch — that stack-driven order is all DFS is.', p: { LL: 'good', LR: 'lit' }, a: { luffy: [42, 78] } },
      { c: 'BFS is Impel Down: clear an entire floor before descending. Floor 1: the root.', p: { R: 'good', L: '', LL: '', LR: '' }, a: { luffy: [50, 14] } },
      { c: 'Floor 2: both children, side by side. A queue holds the current floor while the next floor lines up behind it.', p: { L: 'good', Rt: 'good' }, a: { luffy: [50, 45] } },
      { c: 'Floor 3: all the leaves. Same O(n) visits either way — the only difference is the ORDER: stack = depth, queue = breadth. Need the shallowest answer? BFS finds it first.', p: { LL: 'good', LR: 'good', RL: 'good', RR: 'good' }, a: { luffy: [50, 78] } }
    ]
  };

  S['binary-search-trees'] = {
    h: 240,
    props: [
      { id: 'n500', emoji: '💰', label: '500', x: 50, y: 14 },
      { id: 'n300', emoji: '💰', label: '300', x: 28, y: 46 },
      { id: 'n900', emoji: '💰', label: '900', x: 72, y: 46 },
      { id: 'n100', emoji: '💰', label: '100', x: 14, y: 78 },
      { id: 'n400', emoji: '💰', label: '400', x: 40, y: 78 },
      { id: 'n700', emoji: '💰', label: '700', x: 58, y: 78 },
      { id: 'n1500', emoji: '💰', label: '1500', x: 86, y: 78 }
    ],
    actors: [{ id: 'hunter', emoji: '🕵️', label: 'bounty hunter', x: 50, y: 4 }],
    steps: [
      { c: 'The bounty ladder: everything LEFT of a name is a lower bounty, everything RIGHT is higher — at every rung. Target: the 700M pirate. Start at the root: 500.', p: { n500: 'lit' }, a: { hunter: [50, 14] } },
      { c: "700 > 500 → the target can't be anywhere in the left half. Three entries eliminated by one comparison.", p: { n300: 'dim', n100: 'dim', n400: 'dim', n900: 'lit', n500: 'dim' }, a: { hunter: [72, 46] } },
      { c: '700 < 900 → drop everything right of 900.', p: { n1500: 'dim', n700: 'lit', n900: 'dim' }, a: { hunter: [58, 78] } },
      { c: 'Found: 700 ✓. Three hops through seven entries — each hop halves the ladder: O(log n) while the tree stays balanced.', p: { n700: 'good' } },
      { c: 'But file names into the ladder in already-sorted order and it degenerates into a chain — O(n). That is exactly why interviewers ask "what if the tree is skewed?"' }
    ]
  };

  S['heaps-top-k'] = {
    h: 220,
    props: [
      { id: 'b0', emoji: '📌', label: '—', x: 74, y: 22 },
      { id: 'b1', emoji: '📌', label: '—', x: 74, y: 46 },
      { id: 'b2', emoji: '📌', label: '—', x: 74, y: 70 },
      { id: 'door', emoji: '🚪', label: 'doorkeeper = min', x: 42, y: 70 }
    ],
    actors: [{ id: 'snail', emoji: '🐌', label: 'Den Den Mushi', x: 10, y: 46 }],
    steps: [
      { c: "HQ's board keeps only the top-3 bounties, and the SMALLEST of the three guards the door — in code, that's the min sitting on top of a min-heap of size k. Report: 300 → board.", l: { b0: '300' }, p: { b0: 'lit' } },
      { c: 'Report: 900 → board.', l: { b0: '900', b1: '300' }, p: { b1: 'lit', b0: '' } },
      { c: 'Report: 100 → board is full: {900, 300, 100}. Doorkeeper: 100.', l: { b2: '100' }, p: { b2: 'lit', b1: '' } },
      { c: 'Report: 1200 — bigger than the doorkeeper. 100 is evicted on the spot.', p: { b2: 'bad' }, a: { snail: [42, 46] } },
      { c: '1200 walks in; the board re-settles: {1200, 900, 300}. New doorkeeper: 300.', l: { b0: '1200', b1: '900', b2: '300' }, p: { b2: 'lit' }, a: { snail: [10, 46] } },
      { c: 'Report: 250 — smaller than the doorkeeper: rejected at the door without touching the board. Millions of reports, each costing one door-check and at most one log k insert: O(n log k).', p: { b2: 'good' } }
    ]
  };

  S['backtracking'] = {
    h: 240,
    props: [
      { id: 'S', emoji: '⛩', label: 'start', x: 50, y: 14 },
      { id: 'A', emoji: '🌴', label: 'left fork', x: 28, y: 45 },
      { id: 'B', emoji: '🌴', label: 'right fork', x: 72, y: 45 },
      { id: 'A1', emoji: '📍', label: '?', x: 14, y: 78 },
      { id: 'A2', emoji: '📍', label: '?', x: 40, y: 78 },
      { id: 'B1', emoji: '📍', label: '?', x: 72, y: 78 }
    ],
    actors: [{ id: 'nami', emoji: '🧭', label: 'Nami', x: 50, y: 4 }],
    steps: [
      { c: "Nami's treasure map branches, and some trails are drawn to deceive. The only way to know: walk a trail fully — and if it lies, walk BACK.", p: { S: 'lit' }, a: { nami: [50, 14] } },
      { c: 'Take the left fork.', p: { A: 'lit' }, a: { nami: [28, 45] } },
      { c: 'Dead end — ☠️. The path is abandoned the moment it fails.', l: { A1: '☠️' }, p: { A1: 'bad' }, a: { nami: [14, 78] } },
      { c: 'Backtrack — UNDO the last choice, return to the fork, try its next trail: ☠️ again. The left fork is exhausted.', l: { A2: '☠️' }, p: { A2: 'bad', A: 'dim' }, a: { nami: [40, 78] } },
      { c: 'Backtrack to the start. That disciplined undo — choose, explore, un-choose — is the entire pattern. Now the right fork.', p: { B: 'lit' }, a: { nami: [72, 45] } },
      { c: '💰. Every dead end was dropped the instant it failed — that pruning is what keeps an O(2ⁿ) search space actually finishable.', l: { B1: '💰' }, p: { B1: 'good' }, a: { nami: [72, 78] } }
    ]
  };

  S['graphs-bfs-dfs-topo-union'] = {
    h: 220,
    props: [
      { id: 'ship', emoji: '🚢', label: 'get a ship', x: 16, y: 28 },
      { id: 'crew', emoji: '👥', label: 'gather crew', x: 16, y: 72 },
      { id: 'nav', emoji: '🧭', label: 'navigator', x: 52, y: 50 },
      { id: 'gl', emoji: '🌊', label: 'Grand Line', x: 86, y: 50 },
      { id: 'e1', label: '→', x: 33, y: 37 },
      { id: 'e2', label: '→', x: 33, y: 63 },
      { id: 'e3', label: '→', x: 69, y: 50 }
    ],
    actors: [{ id: 'boat', emoji: '⛵', label: '', x: 4, y: 50 }],
    steps: [
      { c: 'A voyage plan is a dependency graph: no navigator without a ship AND a crew; no Grand Line without a navigator. A topological order is any legal plan.' },
      { c: "'Get a ship' has zero prerequisites → do it first.", p: { ship: 'good' }, a: { boat: [16, 28] } },
      { c: "'Gather crew' also has zero → next. Any zero-prerequisite pick is valid — topo order isn't unique.", p: { crew: 'good' }, a: { boat: [16, 72] } },
      { c: "Both arrows into 'navigator' are satisfied — its prerequisite count hits zero and it unlocks.", p: { nav: 'good', e1: 'lit', e2: 'lit' }, a: { boat: [52, 50] } },
      { c: "Grand Line last. Repeatedly taking any node whose count hits zero is Kahn's algorithm — and if you run out of zero-prereq nodes before finishing, you've PROVED the plan has a cycle.", p: { gl: 'good', e3: 'lit' }, a: { boat: [86, 50] } }
    ]
  };

  const DP_X = [12, 31, 50, 69, 88];
  S['dynamic-programming'] = {
    h: 230,
    props: track('t', [0, 3, 2, 5, 1], 34, 12, 88, '🏝').concat(
      DP_X.map((x, i) => ({ id: 'dp' + i, label: '?', x: x, y: 64 }))
    ),
    actors: [{ id: 'nami', emoji: '🧭', label: 'Nami', x: 12, y: 86 }],
    steps: [
      { c: 'The Log Pose only points forward — Nami can never re-sail a leg. So she keeps a ledger (bottom row): the cheapest cost to reach each island, written down exactly once. Home island: cost 0.', l: { dp0: '0' }, p: { dp0: 'lit' } },
      { c: 'Island 1 (toll 3) is reachable only from island 0: 0 + 3 = 3.', l: { dp1: '3' }, p: { dp1: 'lit', dp0: '' }, a: { nami: [31, 86] } },
      { c: "Island 2 (toll 2): hop from island 0 or island 1. She doesn't re-sail either route — she READS the ledger: min(0, 3) + 2 = 2.", l: { dp2: '2' }, p: { dp2: 'lit', dp1: '' }, a: { nami: [50, 86] } },
      { c: 'Island 3: min(3, 2) + 5 = 7. Island 4: min(2, 7) + 1 = 3.', l: { dp3: '7', dp4: '3' }, p: { dp4: 'lit', dp2: '' }, a: { nami: [88, 86] } },
      { c: 'The final answer was assembled entirely from stored sub-answers — nothing computed twice. Exponentially many routes collapsed into 5 ledger lines. State = island, transition = the hop: that is DP.', p: { dp4: 'good' } }
    ]
  };

  S['greedy'] = {
    h: 210,
    props: [
      { id: 'g0', emoji: '🎪', label: '1–3', x: 14, y: 38 },
      { id: 'g1', emoji: '🎪', label: '2–5', x: 32, y: 38 },
      { id: 'g2', emoji: '🎪', label: '4–6', x: 50, y: 38 },
      { id: 'g3', emoji: '🎪', label: '7–8', x: 68, y: 38 },
      { id: 'g4', emoji: '🎪', label: '5–9', x: 86, y: 38 }
    ],
    actors: [{ id: 'buggy', emoji: '🤡', label: 'Buggy', x: 14, y: 72 }],
    steps: [
      { c: "One stage, five acts, overlapping time slots. Buggy's booking rule: always take the act that ENDS soonest — it leaves the most stage time for everything after. (Acts shown sorted by end time.)" },
      { c: 'Act 1–3 ends first: booked.', p: { g0: 'good' } },
      { c: 'Act 2–5 overlaps the booked act → cut. No regret, no lookahead, no undo.', p: { g1: 'bad' }, a: { buggy: [32, 72] } },
      { c: 'Act 4–6 starts after 3 → booked. Act 5–9 overlaps it → cut.', p: { g1: 'dim', g2: 'good', g4: 'bad' }, a: { buggy: [50, 72] } },
      { c: 'Act 7–8 fits → booked. Three acts — provably the maximum. The exchange argument: any optimal schedule can be rewritten to start with the earliest-ending act, so the greedy pick is never wrong. Greedy differs from DP in exactly one way: it never revisits a choice.', p: { g4: 'dim', g3: 'good' }, a: { buggy: [68, 72] } }
    ]
  };

  S['bit-manipulation'] = {
    h: 200,
    props: track('e', [7, 3, 7, 5, 3], 36, 14, 86, '📜'),
    actors: [{ id: 'clerk', emoji: '🖋', label: 'XOR clerk', x: 14, y: 70 }],
    steps: [
      { c: 'The Marine ledger logs every raid twice — except one ghost entry. XOR the whole column: any value XOR itself is 0, so pairs erase themselves no matter how far apart they sit.' },
      { c: 'Read 7 — held in the running XOR.', p: { e0: 'lit' }, a: { clerk: [14, 70] } },
      { c: 'Read 3, then 7 again — and the two 7s annihilate: 7 ^ 7 = 0. They vanish from the ledger.', p: { e1: 'lit', e0: 'bad', e2: 'bad' }, a: { clerk: [50, 70] } },
      { c: 'The 7s are gone. Read 5, then 3 — and the 3s annihilate too.', p: { e0: 'dim', e2: 'dim', e3: 'lit', e1: 'bad', e4: 'bad' }, a: { clerk: [86, 70] } },
      { c: 'Everything paired has cancelled itself. The survivor: 5 — found in O(n) time and O(1) space. No hash map, no sort, order irrelevant (XOR is commutative).', p: { e1: 'dim', e4: 'dim', e3: 'good' } }
    ]
  };

  S['trie'] = {
    h: 240,
    props: [
      { id: 'root', emoji: '📖', label: 'registry', x: 50, y: 12 },
      { id: 'D', emoji: '⭕', label: 'D.', x: 50, y: 40, cls: 'off' },
      { id: 'L', emoji: '⭕', label: 'L', x: 32, y: 64, cls: 'off' },
      { id: 'T', emoji: '⭕', label: 'T', x: 68, y: 64, cls: 'off' },
      { id: 'UFFY', emoji: '⭕', label: 'UFFY', x: 18, y: 88, cls: 'off' },
      { id: 'AW', emoji: '⭕', label: 'AW', x: 44, y: 88, cls: 'off' },
      { id: 'EACH', emoji: '⭕', label: 'EACH', x: 82, y: 88, cls: 'off' }
    ],
    actors: [{ id: 'clerk', emoji: '🖋', label: 'archivist', x: 50, y: 4 }],
    steps: [
      { c: 'The World Government files names letter by letter; names that share a prefix share the same shelves. First filing: Monkey D. Luffy — shelves D → L → UFFY are built.', p: { D: 'good', L: 'good', UFFY: 'good' }, a: { clerk: [18, 88] } },
      { c: "Next: Trafalgar D. Law. The 'D.' shelf already exists — walk it, don't rebuild it.", p: { D: 'lit', L: 'lit' }, a: { clerk: [32, 64] } },
      { c: "Only 'AW' is new: one new shelf files a whole new name.", p: { AW: 'good' }, a: { clerk: [44, 88] } },
      { c: "Marshall D. Teach: reuse 'D.' again, then add T → EACH.", p: { D: 'lit', L: '', T: 'good', EACH: 'good' }, a: { clerk: [82, 88] } },
      { c: "Lookup 'D. Law': follow D → L → AW. Cost = the length of the NAME, O(L) — not the number of names in the registry. And the shared 'D.' is stored exactly once, no matter how many carry the Will of D.", p: { D: 'good', L: 'good', AW: 'good', T: '', EACH: '' }, a: { clerk: [44, 88] } }
    ]
  };

  window.STORY_ANIMS = S;
})();
