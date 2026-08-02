/* Dressrosa — the Colosseum arc. Kadane's algorithm.
 *
 * Grand Line episodes covering the LeetCode Top Interview 150. Same shape as
 * data/episodes.js (prop board, dialogue steps, sound cues) plus three fields
 * the newer episodes carry: `arc`, `insight`, and `quiz` — where every quiz is
 * set in a DIFFERENT scenario from the episode that needs the SAME pattern, so
 * it tests whether the idea transferred rather than whether the story stuck.
 *
 * All writing original. Loaded on demand by js/grandline-loader.js.
 */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['maximum-subarray'] = {
    id: 'maximum-subarray',
    epNumber: 60,
    title: 'The Colosseum Run',
    arc: 'Dressrosa',
    patternId: 'dynamic-programming',
    scene: 'colosseum',
    leetcode: { name: 'Maximum Subarray', number: 53, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/' },
    problem: 'Given an array of numbers, find the contiguous subarray with the largest sum, and return that sum. The subarray must contain at least one number.',
    example: 'blocks = [-2, 1, -3, 4, -1, 2, 1]  →  answer: 6  (the run 4, -1, 2, 1)',

    h: 210,
    props: [
      { id: 'b0', emoji: '🩸', label: '-2', x: 10, y: 36 },
      { id: 'b1', emoji: '💪', label: '+1', x: 24, y: 36 },
      { id: 'b2', emoji: '🩸', label: '-3', x: 38, y: 36 },
      { id: 'b3', emoji: '💪', label: '+4', x: 52, y: 36 },
      { id: 'b4', emoji: '🩸', label: '-1', x: 66, y: 36 },
      { id: 'b5', emoji: '💪', label: '+2', x: 80, y: 36 },
      { id: 'b6', emoji: '💪', label: '+1', x: 94, y: 36 }
    ],
    ledger: [
      { id: 'Lc', x: 32, y: 80 },
      { id: 'Lb', x: 72, y: 80 }
    ],

    steps: [
      {
        speaker: 'luffy', pos: 'left',
        line: "Zoro's fighting the whole Colosseum block in one go! Every round either builds him up or beats him down, and he can't skip a round in the middle — once he starts a run, he takes them in order.",
        sfx: 'gong'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "So the only choice I have is where to START and where to STOP. Which stretch of consecutive rounds leaves me strongest at the end?",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Just try every stretch! Start at round one, try all the endings, then start at round two... uh. That's every pair. With a hundred rounds that's thousands of runs.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "We don't need thousands. Walk forward once, and at every round ask exactly one question: is the run I'm carrying still helping me — or should I throw it away and start fresh right here?",
        p: { Lc: 'lit', Lb: 'lit' }, l: { Lc: 'run: —', Lb: 'best: —' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Round one is minus two. There's no run behind me, so that IS the run. Carrying minus two — and it's the best we've seen, because it's all we've seen.",
        p: { b0: 'lit' }, l: { Lc: 'run: -2', Lb: 'best: -2' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Round two is plus one. Now: minus two plus one is minus one — worse than just starting fresh at plus one. So we drop everything behind us. The run resets.",
        p: { b0: 'dim', b1: 'lit' }, l: { Lc: 'run: +1', Lb: 'best: +1' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Round three, minus three. One minus three is minus two — but starting fresh here would be minus three, which is worse. So I keep dragging the run along. Being negative doesn't mean I abandon it; being a burden does.",
        p: { b2: 'lit' }, l: { Lc: 'run: -2', Lb: 'best: +1' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Round four, plus four. Minus two plus four is two — but fresh is four. Fresh wins. Cut the run loose and start again at round four.",
        p: { b0: 'dim', b1: 'dim', b2: 'dim', b3: 'good' }, l: { Lc: 'run: +4', Lb: 'best: +4' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Minus one takes me to three. Plus two takes me to five. Plus one takes me to six. Every one of those is worth carrying — and six is the highest I've ever stood.",
        p: { b4: 'good', b5: 'good', b6: 'good' }, l: { Lc: 'run: +6', Lb: 'best: +6' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Rounds four through seven. Six. And you only walked the line once — no going back, no trying every pair.",
        p: { Lb: 'good' }, l: { Lb: 'best: +6 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two numbers were enough the whole time: the run I'm in, and the best I've ever recorded. Notice they are separate — the run went negative twice, and the record never budged.",
        sfx: null
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "So the rule is: if what you're carrying is dragging you down, drop it. But keep the memory of your best day! SHISHISHI!",
        sfx: 'pop'
      }
    ],

    insight: 'At every position ask one local question — extend the run, or start fresh here? — and keep the record of your best run in a separate variable from the run you are currently in.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b> — two numbers. This is dynamic programming with the table collapsed to a single value, because dp[i] only ever needs dp[i-1].',
    pitfall: 'Initialising <code>best = 0</code> quietly assumes an empty run is allowed. On an all-negative array it returns 0 instead of the largest single element. Seed <b>both</b> variables with <code>nums[0]</code> and scan from index 1.',
    solution: `def max_subarray(nums):
    # "run" is the best sum ending exactly here; "best" is the best ever seen.
    # They are deliberately separate: the run may dip negative while the
    # record stands untouched.
    run = best = nums[0]
    for x in nums[1:]:
        # Extend the run, or abandon it and start fresh at x — whichever is
        # larger. Dragging a negative run along is the only thing to avoid.
        run = max(x, run + x)
        best = max(best, run)
    return best`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different island, same shape: Nami's tangerine stall logs a profit or a loss every day, and she wants the best unbroken stretch of trading days. She insists on carrying only ONE number as she walks the ledger. Which single number is it?",
        options: [
          'The best total ending on the day she is currently looking at',
          'The largest single day\'s profit seen so far',
          'The running total of every day from the start',
          'The number of profitable days so far'
        ],
        correct: 0,
        explain: 'The state that makes the recurrence work is "best sum ending here" — it is the only thing the next day needs in order to decide between extending and restarting. (She needs a second number for the best ever seen, but that is the record, not the state.) The largest single day is the answer to a different question, and a running total from the start can never restart.',
        hint: 'What does tomorrow need to know about today in order to make its own choice?'
      },
      {
        tag: 'TRAP',
        q: "Storm season. Every day of Nami's ledger is a loss: [-4, -2, -7, -3]. She must trade on at least one day. What is the best stretch worth?",
        options: [
          '-2, the least bad single day',
          '0, by trading on no days at all',
          '-16, the whole ledger',
          '-6, the two smallest losses together'
        ],
        correct: 0,
        explain: 'With at least one day required, the answer is the largest single element — here -2. Code that starts <code>best = 0</code> returns 0, which is the right answer only if an empty stretch counts, and it does not. This is the single most common Kadane bug, and it only shows up on all-negative input.',
        hint: 'Ask what your initial value for "best" secretly assumes.'
      },
      {
        tag: 'TWEAK',
        q: "The Colosseum changes the rules: Zoro must now fight AT LEAST THREE consecutive rounds. The card is [+2, -1, +2, -10, +7]. What is his best possible finish?",
        options: [
          '+3, from rounds one through three',
          '+7, from the last round alone',
          '+9, from rounds one through three plus the last',
          '+2, from a single round'
        ],
        correct: 0,
        explain: 'Plain Kadane answers +7 — a single round — but a minimum length of three forbids it. Checking the legal windows: [2,-1,2] = 3, [-1,2,-10] = -9, [2,-10,7] = -1, and the longer ones are worse. So +3. A length constraint turns this into a fixed-window sweep over prefix sums, not plain Kadane; noticing that the constraint breaks the recurrence is the whole point.',
        hint: 'The unconstrained answer is a single round. Is that still allowed?'
      }
    ]
  };

  E['maximum-sum-circular-subarray'] = {
    id: 'maximum-sum-circular-subarray',
    epNumber: 61,
    title: 'The Ring That Has No End',
    arc: 'Dressrosa',
    patternId: 'dynamic-programming',
    scene: 'colosseum',
    leetcode: { name: 'Maximum Sum Circular Subarray', number: 918, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-sum-circular-subarray/' },
    problem: 'Same as maximum subarray, except the array is circular: the run may wrap around from the end back to the beginning. Each element may still be used at most once.',
    example: 'blocks = [5, -3, 5]  →  answer: 10  (the last block and the first, wrapping around)',

    h: 210,
    props: [
      { id: 'r0', emoji: '💪', label: '+5', x: 22, y: 34 },
      { id: 'r1', emoji: '🩸', label: '-3', x: 50, y: 34 },
      { id: 'r2', emoji: '💪', label: '+5', x: 78, y: 34 }
    ],
    ledger: [
      { id: 'La', x: 22, y: 78 },
      { id: 'Lb', x: 50, y: 78 },
      { id: 'Lc', x: 78, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Bad news. The Colosseum floor is a RING. After the last block, the gate opens straight back onto the first one. Zoro's run can wrap right around the far side.",
        sfx: 'gong'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Five, then minus three, then five. Walking it straight, my best is a single block: five. But if I finish on the last block and carry through onto the first — that's ten.",
        p: { r2: 'lit', r0: 'lit' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So do we simulate the ring? Lay the blocks out twice and run the whole thing again? That works, but it doubles everything and we have to police the length so nobody fights the same block twice.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There's a cleaner way. Look at what a wrapping run leaves BEHIND. It always leaves one unbroken block of rounds in the middle — the part he skipped.",
        p: { r1: 'bad' }, l: { Lb: 'skipped' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So a wrapping run is simply everything, minus that middle stretch. To make the run as large as possible, make the skipped stretch as SMALL as possible.",
        l: { La: 'total', Lb: 'minus worst', Lc: '= wrap' },
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Two runs of Kadane, then. One hunting the best stretch, one hunting the worst. Total is seven. The worst stretch is that lone minus three. Seven minus minus three is ten.",
        p: { r0: 'good', r2: 'good' }, l: { La: 'total 7', Lb: 'worst -3', Lc: 'wrap 10' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Ten beats the straight-line answer of five. So the answer is the better of the two cases — no wrap, or wrap.",
        p: { Lc: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One trap, and it is a nasty one. If every block is a loss, then the 'smallest middle stretch' is the entire ring — and total minus total is zero, which means fighting nothing at all.",
        p: { Lc: 'bad' }, l: { Lc: 'wrap = 0?' },
        sfx: 'error'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "And I'm not allowed to fight nothing. So when the straight-line best is already negative, that IS the answer — ignore the wrap entirely.",
        p: { Lc: 'lit' }, l: { Lc: 'guard it' },
        sfx: 'chime'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "The ring has no end, so you take the whole thing and cut out the worst part! That's easier than running around twice!",
        sfx: 'pop'
      }
    ],

    insight: 'A wrapping run is exactly "everything except a contiguous middle", so maximising it means minimising that middle — run Kadane twice, once for the maximum and once for the minimum.',
    complexity: '<b>Time O(n)</b> — two Kadane passes, or one pass tracking both. <b>Space O(1)</b>. Duplicating the array to length 2n also works but costs more time and needs a length guard.',
    pitfall: 'When every element is negative, <code>total - minSum</code> is 0 — the empty subarray — and it will beat the real answer. Guard it: if the straight-line maximum is negative, return that and never consider the wrap.',
    solution: `def max_subarray_circular(nums):
    total = 0
    cur_max = best_max = nums[0]
    cur_min = best_min = nums[0]

    # Both Kadanes in one pass: the largest run, and the smallest run.
    for i, x in enumerate(nums):
        total += x
        if i:
            cur_max = max(x, cur_max + x)
            best_max = max(best_max, cur_max)
            cur_min = min(x, cur_min + x)
            best_min = min(best_min, cur_min)

    # All negative: the "wrap" case would carve out everything and leave the
    # empty subarray, which is not allowed — so the straight-line answer wins.
    if best_max < 0:
        return best_max
    return max(best_max, total - best_min)`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different setting, same ring: Brook's night watch rota runs around a circular deck of posts, each post scoring a gain or a loss, and a shift may wrap past the last post onto the first. Which two quantities does he need in order to score the wrapping case?",
        options: [
          'The total of every post, and the smallest-sum contiguous stretch',
          'The total of every post, and the largest-sum contiguous stretch',
          'The largest and the smallest single post',
          'The total, and the number of negative posts'
        ],
        correct: 0,
        explain: 'A wrapping shift is the complement of a contiguous middle stretch, so its value is total minus that stretch — and it is largest when the stretch removed is smallest. Subtracting the LARGEST stretch is the classic sign error: it gives the worst wrap, not the best.',
        hint: 'You are keeping the outside of a middle block. To keep the most, throw away the least.'
      },
      {
        tag: 'TWEAK',
        q: "Brook's circular deck reads [-3, -1, -2]. Every post is a loss and he must stand at least one watch. What does his best shift score?",
        options: [
          '-1',
          '0, by taking the wrap that removes the whole deck',
          '-6, the entire deck',
          '-4, the two least bad posts'
        ],
        correct: 0,
        explain: 'The wrapping formula gives total − minSum = −6 − (−6) = 0, which secretly means "take no posts at all" — not allowed. That is exactly why the all-negative guard exists: when the straight-line best is negative, return it. Here that is the single least bad post, −1.',
        hint: 'What stretch is being carved out when the answer comes back as exactly zero?'
      },
      {
        tag: 'PITFALL',
        q: "A crewmate proposes solving the circular version by laying the posts out twice in a row and running ordinary Kadane over the doubled list. What must be added for it to be correct?",
        options: [
          'A cap so no run is longer than the original number of posts',
          'A check that the total is positive',
          'A second pass in the reverse direction',
          'Nothing — doubling is a complete solution'
        ],
        correct: 0,
        explain: 'Without a length cap, the doubled array lets a run cover the same post twice — on [5, -3, 5] it would happily take 5, -3, 5, 5 and report 12. Bounding the window to n elements turns it into a sliding-window-over-prefix-sums problem, correct but heavier than the two-Kadane trick.',
        hint: 'What stops a run in the doubled list from going all the way round and starting over?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
