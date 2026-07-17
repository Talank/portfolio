window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['two-pointers'] = {
  id: 'two-pointers',
  title: 'Two Pointers',
  titleNe: 'Two friends walking in from opposite ends',
  intro: 'find a pair in a sorted array in O(n) by walking in from both ends',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Array is <b>sorted</b> (or you may sort it) and you need a <b>pair/triplet</b> matching a target.',
        'An O(1) extra-space constraint rules out the hash-map approach.',
        'Not sliding window: these pointers start at <i>opposite ends</i> and converge.',
      ],
      narration: "Right, our first pattern — Two Pointers. When do you reach for it? When the array is sorted, or you're allowed to sort it, and you need to find a pair whose sum matches some target. Let's start with a story. Say a road has to be dug between two villages. If a single team digs from one end, it takes years. But two teams, digging from opposite ends toward each other? They meet somewhere in the middle, and the work finishes in half the time. Two pointers is exactly that — L starts at the left end, R at the right end, and both move toward the middle. Notice the difference from sliding window: there, both pointers move in the same direction; here, they come at each other head-on. Interviewers love to test that distinction.",
    },
    {
      heading: 'Story: The sorted shelf',
      bullets: [
        'A sorted shelf of items, weakest → strongest.',
        'One hand on the weakest, one on the strongest; shout out the combined total.',
        'Too small? only the left hand moving right can help. Too big? only the right hand moving left can help.',
      ],
      narration: "Now the heart of it — why is this method correct? Imagine sacks on a shop shelf, arranged by weight, from the lightest to the heaviest. You want two sacks that add up to exactly five kilos. Put your left hand on the lightest, your right hand on the heaviest. If the total is too small — well, the right hand is already on the heaviest sack, it has given all it can — so the only hope is to move the left hand rightward to something heavier. If the total is too big, the opposite: the left hand is already on the lightest, so only the right hand can move inward. At every step there's a proof of why exactly one hand moves — it's never a guess. That's why you never re-check any pair, and an O(n squared) job finishes in O(n).",
    },
    {
      heading: 'Mnemonic',
      big: '“Too small? Left steps up. Too big? Right steps down.”',
      bullets: [
        'sum &lt; target → <code>L += 1</code> (need more)',
        'sum &gt; target → <code>R -= 1</code> (need less)',
        'sum == target → found; pointers cross → no answer exists',
      ],
      narration: "The memory hook is just this: too small, left steps up; too big, right steps down. If the sum is too small, the one way to make it bigger is to slide L to the right. If the sum is too big, drop R to the left. If it matches exactly, you've found your answer. And if the two pointers cross past each other? No pair exists — and you know that with a solid proof, not a hunch. Recall this one-line hook when your mind goes blank, and the whole algorithm comes right back to you.",
    },
    {
      heading: 'Python template',
      code: 'def two_sum_sorted(nums, target):\n    left, right = 0, len(nums) - 1\n    while left < right:\n        s = nums[left] + nums[right]\n        if s == target:\n            return [left, right]\n        if s < target:\n            left += 1      # too small → left steps up\n        else:\n            right -= 1     # too big → right steps down\n    return []',
      narration: "Look at the code — about ten lines. The while loop runs as long as left is less than right. Inside, just three cases: matched, return; too small, bump left up; too big, drop right down. The thing to notice: every iteration definitely moves one pointer, so the loop runs at most n times. Time O(n), space O(1). But if the input isn't sorted and you have to sort it yourself, the total cost becomes O(n log n) — and mentioning that yourself in an interview leaves a good impression.",
    },
    {
      heading: 'Watch out! Pitfalls + variants',
      bullets: [
        'Sorting destroys original indices — carry <code>(value, index)</code> pairs through the sort if indices are asked.',
        '3Sum = fix one index, two-pointer the rest — dedupe at <b>all three</b> positions.',
        'Container With Most Water: no target — always move the <b>shorter</b> wall.',
      ],
      narration: "Finally, three warnings. One: sorting destroys the original indices. If the problem asks for the original positions, sort pairs of value-and-index together, or your answer points at the wrong spot — this is the single most repeated mistake in this pattern. Two: the famous 3Sum problem is this pattern's big brother — fix one number, then two-pointer the rest, but you must skip duplicates at all three positions to avoid repeated triplets. Three: in Container With Most Water there's no target at all, and the rule changes — always move the pointer at the shorter wall, because the water level is set by the shorter wall. Moving the taller one just wastes a step.",
    },
  ],
};
