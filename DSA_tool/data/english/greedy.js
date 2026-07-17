window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['greedy'] = {
  id: 'greedy',
  title: 'Greedy',
  titleNe: 'Grab the best now, and never look back',
  intro: 'take the locally-best choice at every step and trust it adds up to the global best — when that trust is provable',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'At each step, take the choice that looks best <b>right now</b> — never reconsider it later.',
        'Works only when the problem has the <b>greedy-choice property</b>: local best ⇒ part of some global best.',
        'Interval scheduling, coin change (canonical systems), Huffman coding, gas station.',
      ],
      narration: "Now Greedy — the pattern that looks the simplest but deceives the most. The story — you're buying vegetables at the bazaar, and the rule is: at every stall, pick whatever looks freshest right there, and never turn back to look again. That's greedy — at each step, grab whatever looks best right now, don't sit thinking about the past. But this move doesn't always win — sometimes today's best forces a costlier compromise later. Greedy is only trustworthy when the problem has the greedy-choice property — meaning it's mathematically provable that the local best choice does lead to the final optimal answer. Interval scheduling, gas station, Huffman coding — these are classic greedy problems.",
    },
    {
      heading: 'Story: Why greedy needs proof, not just intuition',
      bullets: [
        'Classic trap: <b>coin change with arbitrary denominations</b> — greedy (biggest coin first) can fail!',
        'Example: coins {1, 3, 4}, target 6 — greedy picks 4+1+1 (3 coins), but 3+3 (2 coins) is better.',
        'The exchange argument: prove that swapping any optimal solution toward the greedy choice never makes it worse.',
      ],
      narration: "Greedy's most dangerous spot is right here — the intent feels right, but it isn't always correct. Look at the famous coin-change example — the coins are one, three, and four rupees, and you must give six rupees change. Greedy thinks — pick the biggest coin first — four — then the remaining two rupees — one and one — three coins in total. But common sense sees three plus three — done in two coins, better! Here greedy failed, because this set of coins doesn't satisfy the greedy-choice property. Everywhere you use greedy, hunt in your head for a proof argument (an exchange argument) — you should be able to show that nudging any optimal answer toward your greedy choice never makes it worse — if you can't, it isn't greedy, look for DP.",
    },
    {
      heading: 'Mnemonic',
      big: '“Grab the best now, never look back — but prove it first.”',
      bullets: [
        'Interval problems: sort by <b>end time</b> — the interval that finishes soonest frees up room for the most future choices.',
        'Once sorted correctly, the greedy loop is almost always a single linear pass.',
        'If a counter-example comes to mind in 30 seconds, greedy is wrong — don’t force it.',
      ],
      narration: "The hook: grab the best now, never look back — but prove it first. Many greedy problems are about intervals — like how many meetings you can attend at once. There the magic move is one — sort by end time, not by start time. Why? The task that finishes soonest leaves the most room for the future — that's the greedy choice, and it can be proven. Once you sort correctly, the rest is usually a single straight for loop. And a practical check — if a counter-example where greedy fails comes to mind within the first thirty seconds, it isn't greedy — don't force it, reach for another tool.",
    },
    {
      heading: 'Python template',
      code: 'def max_meetings(intervals):\n    # intervals: list of (start, end)\n    intervals.sort(key=lambda iv: iv[1])   # sort by end time — the magic key\n    count, last_end = 0, float("-inf")\n    for start, end in intervals:\n        if start >= last_end:              # no clash with the previous one\n            count += 1\n            last_end = end                  # grab it, don\'t look back\n    return count\n\ndef can_reach_end(gas):\n    # Gas Station flavour: can you complete a jump/gas-station loop?\n    total, tank, start = 0, 0, 0\n    for i, g in enumerate(gas):\n        total += g\n        tank += g\n        if tank < 0:                       # can\'t start from here\n            start = i + 1\n            tank = 0\n    return start if total >= 0 else -1',
      narration: "The first function — Interval Scheduling — a three-line heart — sort by end time, and in the for loop grab a meeting only if the last one you grabbed hasn't finished before this one starts. Simple as it looks, this gives a proven-optimal answer. The second — a Gas Station flavour — whenever the tank goes negative at some point, it means you can't reach here from the current start, so greedy immediately guesses to restart from the next station — and this guess is also proven, that starting from any earlier failed point only makes things worse. Both share one core spirit — once you find the right sort or the right guess, the rest is done in a single pass.",
    },
    {
      heading: 'Watch out! When greedy fails, and how to double-check',
      bullets: [
        '0/1 Knapsack: greedy (best value/weight ratio) fails — that needs DP, not greedy.',
        'Fractional Knapsack (can take partial items): greedy <i>does</i> work — same name, different problem!',
        'Dijkstra is “greedy that works” because edge weights are non-negative — Bellman-Ford is the DP fallback when they aren’t.',
        'When in doubt: code the DP solution first (correct, maybe slow), then look for the greedy shortcut.',
      ],
      narration: "The final, and most important, warning — when greedy fails. In Zero-one Knapsack (each item taken whole or left whole), greedy picking by the value-to-weight ratio fails — there you need the previous module's DP. But in Fractional Knapsack, which shares the same name (where you can take a half or a quarter of an item), the same greedy move truly works — a famously confusing pair because the names match, so stay alert. Dijkstra is called greedy that actually works, because there's a guarantee the road weights are never negative — if weights can be negative, you need a DP-based method like Bellman-Ford. And a last practical tip — when in doubt, write the DP solution first — it may be slow but it's correct — and only then look for the greedy shortcut, not the other way around.",
    },
  ],
};
