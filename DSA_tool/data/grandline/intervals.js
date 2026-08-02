/* Alabasta — the intervals arc. Sweeping a sorted line and closing blocks.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['summary-ranges'] = {
    id: 'summary-ranges',
    epNumber: 62,
    title: 'The Roll Call of the Rebel Army',
    arc: 'Alabasta',
    patternId: 'merge-intervals',
    scene: 'sea',
    leetcode: { name: 'Summary Ranges', number: 228, difficulty: 'Easy', url: 'https://leetcode.com/problems/summary-ranges/' },
    problem: 'Given a sorted array of distinct integers, return the smallest sorted list of ranges that covers every number exactly once. A range of one number is written on its own; a longer run is written as "start->end".',
    example: 'nums = [0, 1, 2, 4, 5, 7]  →  ["0->2", "4->5", "7"]',

    h: 210,
    props: [
      { id: 'n0', emoji: '🪖', label: '0', x: 12, y: 36 },
      { id: 'n1', emoji: '🪖', label: '1', x: 28, y: 36 },
      { id: 'n2', emoji: '🪖', label: '2', x: 44, y: 36 },
      { id: 'n3', emoji: '🪖', label: '4', x: 60, y: 36 },
      { id: 'n4', emoji: '🪖', label: '5', x: 76, y: 36 },
      { id: 'n5', emoji: '🪖', label: '7', x: 92, y: 36 }
    ],
    ledger: [
      { id: 'L0', x: 25, y: 80 },
      { id: 'L1', x: 55, y: 80 },
      { id: 'L2', x: 85, y: 80 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Vivi needs the rebel roll call summarised before dawn. We have every surviving squad number, already in order, no repeats — but reading out six thousand numbers one at a time will take all night.",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So we shout the blocks instead! 'Squads zero through two, present!' Anything that runs unbroken gets one call.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then the only thing we ever need to notice is where a run BREAKS. Since the numbers are sorted and distinct, a run continues exactly when the next number is one more than this one.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Zero. One is next, so that's still the same block. Two is next — still the same block. Then four. Four is not three, so the block ends here.",
        p: { n0: 'lit', n1: 'lit', n2: 'lit' }, l: { L0: '0 → 2' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Call it: squads zero through two. Then a new block opens at four. Five follows it, so the block grows. Seven does not follow five, so we close it.",
        p: { n0: 'good', n1: 'good', n2: 'good', n3: 'lit', n4: 'lit' }, l: { L1: '4 → 5' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And then seven is alone at the end. There's nothing after it at all — so the run of length one just gets shouted as itself. Not 'seven through seven'. That would sound ridiculous.",
        p: { n3: 'good', n4: 'good', n5: 'good' }, l: { L2: '7' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Notice the shape of it. We remember only where the current block STARTED, and we walk forward closing it the moment the chain snaps. One pass, and nothing is stored twice.",
        l: { L0: '0 → 2 ✓', L1: '4 → 5 ✓', L2: '7 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Three calls instead of six. And on the real roll — six thousand numbers — that's a handful of shouts instead of a night of them.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "The last block is the one that gets people. There's no 'next number' to break it, so if you only close blocks on a break, the final one never gets called at all!",
        p: { n5: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why the loop closes the block when the chain snaps, and once more when the line ends. Two places, same closing move.",
        p: { n5: 'good' },
        sfx: 'chime'
      }
    ],

    insight: 'When the input is already sorted, a summary is a single sweep: remember where the current block began, and close it the moment the next value fails to continue it — plus once more when the input runs out.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b> beyond the output. No sorting is needed because the problem hands you sorted, distinct values; that guarantee is what makes the "is it exactly one more?" test sufficient.',
    pitfall: 'Forgetting to emit the final block. There is no "next" element to break the last run, so the close has to happen both on a break <b>and</b> after the loop. The other classic is printing <code>7-&gt;7</code> for a single number instead of just <code>7</code>.',
    solution: `def summary_ranges(nums):
    out = []
    i = 0
    n = len(nums)
    while i < n:
        start = i
        # Walk forward while the chain is unbroken. Sorted + distinct means
        # "continues" is exactly "the next value is one larger".
        while i + 1 < n and nums[i + 1] == nums[i] + 1:
            i += 1
        # A run of one is written on its own, not as "x->x".
        out.append(str(nums[start]) if start == i
                   else f"{nums[start]}->{nums[i]}")
        i += 1
    return out`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different problem, same sweep: Franky lists the berth numbers on the dock that are currently EMPTY, sorted and with no repeats, and wants them announced as blocks. What single condition tells him the current block has ended?",
        options: [
          'The next berth number is not exactly one more than the current one',
          'The next berth number is smaller than the current one',
          'The next berth number is different from the current one',
          'He has counted three berths in the block'
        ],
        correct: 0,
        explain: 'Sorted and distinct means values always increase, so "different" is true at every single step and would end every block after one berth. The real test is contiguity — one more, exactly. If berths could repeat, you would have to skip duplicates before applying the test.',
        hint: 'Since the numbers are distinct and sorted, how often is "the next one is different" true?'
      },
      {
        tag: 'TWEAK',
        q: "Same roll call, but a clerk hands Nami the squad numbers UNSORTED: [5, 1, 4, 0, 2]. She runs the one-pass block sweep unchanged. What comes out?",
        options: [
          'Five separate single-number ranges, because almost nothing is contiguous in that order',
          'The correct answer, since the algorithm sorts as it goes',
          'A crash, because the numbers are out of order',
          'One range covering 0 to 5'
        ],
        correct: 0,
        explain: 'The sweep never sorts — it only compares neighbours as given. In that order, 5 then 1 breaks, 1 then 4 breaks, and so on, so it emits five one-element ranges. Sortedness is a precondition, not something the algorithm establishes; sort first (O(n log n)) and the same sweep is correct again.',
        hint: 'The algorithm only ever looks at the pair in front of it. What does it see here?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp writes the sweep so that a block is recorded only when it is broken by the next value. He runs it on a roster of [3, 4, 5]. What does he get?",
        options: [
          'An empty list — the only block is never broken, so it is never recorded',
          '["3->5"], which is correct',
          '["3", "4", "5"]',
          '["3->4"], missing the last element'
        ],
        correct: 0,
        explain: 'One unbroken run to the very end means the "break" condition never fires, so nothing is ever emitted. The fix is to close the open block after the loop as well. This shows up on any input that ends mid-run, which includes the trivial single-block case.',
        hint: 'Walk his loop by hand and ask when the record-the-block line actually runs.'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
