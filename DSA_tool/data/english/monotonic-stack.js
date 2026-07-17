window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['monotonic-stack'] = {
  id: 'monotonic-stack',
  title: 'Monotonic Stack',
  titleNe: 'Taller arrives — pop the shorter!',
  intro: 'next-greater / next-smaller for every element in one pass',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“For each element, find the <b>next greater</b> (or smaller) element.”',
        'Daily Temperatures: “how many days until a warmer day?”',
        'Largest Rectangle in Histogram, stock spans, remove-digits problems.',
        'Naive answer is O(n²) look-ahead — the stack makes it O(n).',
      ],
      narration: "Now Monotonic Stack — scary name, simple idea. When do you need it? When the problem says: for each element, what's the first bigger element that comes after it? Daily Temperatures is the famous example — how many days until a warmer day? Looking ahead from each day naively costs O(n squared). Here's the story — people are lining up into a hall, and each one wants to know: who's the first taller person that blocks my view? The moment a new taller person walks in, they answer everyone shorter in one stroke — I'm the one blocking all of you! That one-stroke settling is what makes it O(n).",
    },
    {
      heading: 'Story: Why the stack stays sorted',
      bullets: [
        'Stack holds indices still <b>waiting</b> for their answer.',
        'New element arrives: pop everyone shorter — <i>you are their answer</i>.',
        'What survives is always in decreasing order — monotonic, by construction.',
      ],
      narration: "Look at the inner machinery. Who sits in the stack? The indices of those who haven't got their answer yet. When a new element arrives the rule is one thing — pop everyone on top of the stack who is shorter, telling each: I'm your answer. Then climb onto the stack yourself and wait your turn. Now think — after the popping, who's left in the stack? Only those taller than the newcomer. So the stack is always in decreasing order — nobody forced it, the rule arranged it by itself. And the complexity argument is beautiful — each element climbs on once and gets popped off at most once — total O(n), even though there's a while loop inside.",
    },
    {
      heading: 'Mnemonic',
      big: '“Taller arrives — pop the shorter, hand them their answer, climb on.”',
      bullets: [
        'Next <b>greater</b> → pop while top is <b>smaller</b> (decreasing stack).',
        'Next <b>smaller</b> → pop while top is <b>bigger</b> (increasing stack).',
        'Store <b>indices</b>, not values — distances and originals need them.',
      ],
      narration: "The hook: taller arrives — pop the shorter, hand them their answer, climb on. If the direction confuses you, remember this — the stack piles up with the opposite of what you're searching for. If you're finding the next greater, the stack holds a decreasing line; for the next smaller, an increasing line. And a practical rule — store indices in the stack, not values. Daily Temperatures asks how many days, so you need indices to compute the distance. If you need the value, nums-of-index always gives it back, but a discarded index never returns.",
    },
    {
      heading: 'Python template',
      code: 'def daily_temperatures(temps):\n    ans = [0] * len(temps)\n    stack = []                        # indices, temps decreasing\n    for i, t in enumerate(temps):\n        while stack and temps[stack[-1]] < t:\n            j = stack.pop()           # pop the shorter\n            ans[j] = i - j            # hand them the answer (days waited)\n        stack.append(i)               # climb on\n    return ans',
      narration: "The template is about ten lines. The for loop visits each day, the while pops the colder days and fills their answer — i minus j, the number of days they waited. Then push your own index onto the stack. When the loop ends, whoever remains in the stack got no answer — no warmer day came for them, so ans keeps its zero, which is what the problem wants. Some problems instead want minus one or the array length for the leftovers — read the problem to tell them apart. And when equal values arrive — pop or not, strictly-less versus less-than-or-equal — that's another edge that shifts per problem, so stay alert.",
    },
    {
      heading: 'Watch out! The famous applications',
      bullets: [
        '<b>Largest Rectangle in Histogram</b>: increasing stack; a pop means “your rectangle just closed”.',
        '<b>Remove K Digits</b>: build the smallest number by popping bigger digits while you still may.',
        '<b>Stock Span / Online</b>: same trick arriving one element at a time.',
        'Circular arrays (Next Greater II): loop the array twice with <code>i % n</code>.',
      ],
      narration: "Meet the celebrities of this pattern. Largest Rectangle in Histogram — one of the hard interview problems — runs an increasing stack, and a bar being popped means the right wall of the rectangle at that bar's height has been found — the area is computed at the pop. In Remove K Digits, to make the number smaller you pop bigger digits from the front as long as your quota lasts. And if the array is circular — Next Greater Element Two — loop the array twice, using index modulo n — just a two-character change in code. Wherever you hear the phrase first bigger, or first smaller, that comes after, roll this taller-shorter rule around in your head for a moment — half the time it's the door to the answer.",
    },
  ],
};
