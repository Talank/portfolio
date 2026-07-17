window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['warmup'] = {
  id: 'warmup',
  title: 'Big-O Refresher + Pythonic Idioms',
  titleNe: 'What Big-O really means, plus five Python power-moves',
  intro: 'Big-O without fear, plus the five Python idioms every later pattern leans on',
  slides: [
    {
      heading: 'What Big-O actually asks',
      bullets: [
        'Big-O answers one question: <b>if the input gets bigger, how much more work do I do?</b>',
        'It ignores constants and small inputs — it is about the <i>shape</i> of growth, not exact seconds.',
        'Interviewers ask it on every single problem; it is the vocabulary of the whole course.',
      ],
      narration: "Namaste, let's begin. The moment people hear Big-O, they picture scary maths — but it really asks just one thing: as the input grows, how much more work do I do? Picture this. You're looking for a friend in the crowd at Asan bazaar. If ten people are there, easy. But ten thousand? Your method of searching hasn't changed, yet the pain has exploded — and that growth in pain is exactly what Big-O measures. So keep one question in your head: oho, what happens if n doubles? Hold on to that single question, and you're already halfway home.",
    },
    {
      heading: 'The growth ladder',
      bullets: [
        '<code>O(1)</code> — same work no matter the size (dict lookup)',
        '<code>O(log n)</code> — halve the problem each step (binary search)',
        '<code>O(n)</code> — touch everything once (a single loop)',
        '<code>O(n log n)</code> — sorting',
        '<code>O(n²)</code> — every pair (nested loops)',
        '<code>O(2ⁿ)</code> — every subset (danger zone)',
      ],
      narration: "Now let's climb the ladder. O(1) is like asking the kirana shopkeeper for sugar — he just hands it over, same time no matter how busy the shop is. O(log n) is the habit of opening a dictionary from the middle, throwing away half the pages each time. O(n) is walking down the whole line asking one person at a time. O(n log n) is the cost of sorting — usually considered perfectly acceptable. O(n squared) is the warning bell: a nested loop checking every pair, so when the crowd doubles, the work quadruples. And O(two to the n) is like a wildfire — checking every subset, it brings even a fast computer to its knees at small n. In interviews, your job is usually to drag an O(n squared) solution down to O(n) or O(n log n).",
    },
    {
      heading: 'Mnemonic',
      big: '“O is for Oho! — what if n doubles?”',
      bullets: [
        'O(1): same — the shopkeeper just hands it over',
        'O(log n): halve — dictionary, split in two',
        'O(n): once each — one at a time down the line',
        'O(n²): every pair — everyone shakes hands with everyone',
      ],
      narration: "Here's the memory hook: O is for oho — what if n doubles? With O(1), nothing changes. With O(log n), you pay just one extra step, because doubling the crowd only adds a single cut to reach the middle. With O(n), the work doubles too. With O(n squared), the work quadruples — think of a feast where everyone shakes hands with everyone; double the guests and the handshakes go up four times. Once that picture is in your head, complexity questions never trip you up again.",
    },
    {
      heading: 'The five Python idioms this course leans on',
      code: 'for i, x in enumerate(nums):      # index + value together\nfor a, b in zip(xs, ys):          # walk two lists in step\ncount[x] = count.get(x, 0) + 1    # dict with a default\nsquares = [x*x for x in nums]     # build a list in one line\npairs.sort(key=lambda p: p[0])    # sort by a chosen field',
      narration: "Now the five Python idioms that show up again and again in every later pattern. enumerate hands you the index and the value together, so no more juggling your own counter. zip walks two lists side by side, like two friends holding hands as they stroll. dict-dot-get returns a default instead of throwing a tantrum when a key is missing — you can't count things without it. A list comprehension squeezes a four-line loop into a single line. And sort's key argument lets you decide exactly what to order by. Get these five into your fingertips, and your hands write the code almost on their own.",
    },
    {
      heading: 'Watch out! Common Big-O traps in Python',
      bullets: [
        '<code>x in my_list</code> is O(n); <code>x in my_set</code> is O(1) — build a set first!',
        'String concatenation in a loop (<code>s += ch</code>) is O(n²) — collect in a list, <code>"".join()</code> once.',
        '<code>list.pop(0)</code> is O(n) — use <code>collections.deque</code> for front-removal.',
        'Sorting inside a loop turns O(n log n) into O(n² log n).',
      ],
      narration: "Finally, four hidden potholes — where Python code looks clean but is quietly slow. First: the in operator is O(n) on a list but O(1) on a set, so if you'll search many times, build a set first. Second: gluing strings together inside a loop copies the whole string every time, which is O(n squared) — instead, collect the pieces in a list and join once at the end. Third: popping from the front of a list shifts every element, so use the deque container for that. Fourth: never sort inside a loop. Remember these, and the warm-up is done — now let's head for the first real pattern.",
    },
  ],
};
