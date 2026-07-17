window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['binary-search'] = {
  id: 'binary-search',
  title: 'Binary Search & Search Space Reduction',
  titleNe: 'Opening the dictionary from the middle',
  intro: 'halve a sorted (or monotonic) search space every step — O(log n)',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Sorted array — obviously. But the real signal is subtler:',
        'Any <b>monotonic</b> yes/no question: “all False … then all True” — find the boundary.',
        '“Minimize the maximum / maximize the minimum” → binary search <i>on the answer</i>.',
      ],
      narration: "Binary Search — everyone's heard the name, but its real interview form is something else. First the story: when you look up a word in a dictionary, you don't flip from page one, you open it in the middle. If your word comes earlier, you toss the whole back half in one flick. Halving each time, a thousand-page book is done in about ten looks — that's the power of O(log n). But the real signal is this: wherever a question's answer is no-no-no and then, from one point on, yes-yes-yes, binary search can find that boundary — even when the array isn't sorted at all!",
    },
    {
      heading: 'Story: The boundary, not the needle',
      bullets: [
        'Old picture: find a needle equal to target.',
        'Better picture: a row of answers <code>F F F F T T T</code> — find the <b>first T</b>.',
        'First-bad-version, first index ≥ target (bisect_left), min in rotated array — all “first T”.',
      ],
      narration: "It's time to shift how you think. The binary search you learned in school found a number equal to a target. Interview binary search usually finds a boundary. Picture a line of people: everyone on the left says no, everyone on the right says yes. Your job is to find the first person who says yes. Ask the middle person — if they say no, they and everyone to their left are useless, go to the right half. If they say yes, they might be the answer, but someone further left might also say yes. First Bad Version, bisect-left, the minimum of a rotated array — they're all the same game: find the first T.",
    },
    {
      heading: 'Mnemonic',
      big: '“Look at the middle, throw away half.”',
      bullets: [
        'Template: <code>while lo &lt; hi</code>, answer converges to <code>lo</code>.',
        '“T” (condition true) → <code>hi = mid</code> (mid might be the answer, keep it).',
        '“F” → <code>lo = mid + 1</code> (mid is ruled out, skip it).',
      ],
      narration: "The hook: look at the middle, throw away half. And in the boundary-style template remember two rules. If the condition holds — a T — then hi equals mid; don't throw mid away, it could be the answer itself. If the condition fails, lo equals mid plus one; mid is definitely not the answer, step past it. Run while lo is less than hi, and when the loop ends, lo and hi land on the same spot — that's the first T. Memorize this one template and you're free of the off-by-one jungle forever — and no infinite loop either, because hi equals mid genuinely narrows the range.",
    },
    {
      heading: 'Python template (boundary form)',
      code: 'def first_true(lo, hi, ok):\n    # ok(x): F F F F T T T — find the first T\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if ok(mid):\n            hi = mid          # T: mid might be the answer — keep it\n        else:\n            lo = mid + 1      # F: throw mid away\n    return lo\n\n# Classic lookup is just a special case:\n# ok(i) = nums[i] >= target, then check nums[lo] == target',
      narration: "Look at the template — just seven lines, but it eats dozens of problems. You only swap out the ok function per problem. Ordinary lookup is a small case of it: ok of i is nums-of-i greater-than-or-equal to target, then at the end check once whether the found spot really holds the target. One curiosity to clear up — in other languages lo plus hi can overflow, so people write mid equals lo plus hi-minus-lo over two. In Python integers grow as large as needed, so no worry — but mentioning it in an interview looks good.",
    },
    {
      heading: 'Watch out! Binary search on the answer',
      bullets: [
        'Koko Eating Bananas: search over <i>speeds</i> — “can she finish at speed s?” is monotonic.',
        'Split Array / Capacity to Ship Packages: search over the answer value, greedy-check feasibility.',
        'The array was never sorted — the <b>yes/no question</b> was.',
      ],
      narration: "Now the most powerful form — binary search on the answer itself. In Koko Eating Bananas nothing is sorted; the thing being searched is the eating speed. Can she finish at speed s? At slow speeds no, and from some speed onward, yes — again that F F T T! So over the range of possible answers, look at the middle, throw away half. Ship capacity, shrinking the largest chunk when splitting an array — the moment you see minimize the maximum, let this bell ring. The feasibility check is usually just a plain greedy loop. Rise above the habit of reaching for binary search only when you see a sorted array, and this pattern becomes your sharpest weapon.",
    },
  ],
};
