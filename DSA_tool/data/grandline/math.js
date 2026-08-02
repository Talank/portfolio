/* Onigashima — number handling: overflow, digits, and cycles.
   No single pattern page covers these, so they carry no patternId.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['palindrome-number'] = {
    id: 'palindrome-number',
    epNumber: 117,
    title: 'The Drum Beat That Mirrors Itself',
    arc: 'Onigashima',
    scene: 'night',
    leetcode: { name: 'Palindrome Number', number: 9, difficulty: 'Easy', url: 'https://leetcode.com/problems/palindrome-number/' },
    problem: 'Determine whether an integer reads the same forwards and backwards, without converting it to a string.',
    example: 'x = 121  →  true;    x = -121  →  false;    x = 10  →  false',

    h: 200,
    props: [
      { id: 'a', emoji: '🥁', label: '121', x: 26, y: 32 },
      { id: 'b', emoji: '🥁', label: '-121', x: 54, y: 32 },
      { id: 'c', emoji: '🥁', label: '10', x: 80, y: 32 }
    ],
    ledger: [
      { id: 'H', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Kaido's war drums beat a number, and the signal only counts if it mirrors itself. No writing it down as text — we have to work with the number as a number.",
        p: { a: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Reverse the whole thing and compare? But reversing a large number can overflow before you get to compare it.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So reverse only HALF of it. Peel digits off the back and build them up until the built half is at least as large as what remains at the front — that is the midpoint.",
        p: { H: 'lit' }, l: { H: 'reverse half only' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "121: peel the 1, leaving 12 against 1. Peel the 2, leaving 1 against 12. Now the built half is larger, so we've passed the middle.",
        p: { a: 'good' }, l: { H: '1 vs 12' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "For an odd number of digits the middle digit sits alone in the built half, so drop it with a division by ten before comparing. Both cases handled with one extra comparison.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "What about negatives? Minus one two one reversed reads one two one minus.",
        p: { b: 'bad' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Never a palindrome — the sign only ever sits at the front. Reject anything negative immediately.",
        p: { b: 'dim' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And ten? Reversed that's one, which isn't ten. The trailing zero is the problem — nothing but zero itself may end in zero.",
        p: { c: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Both of those are cheap guards at the top, and both are cases a lazy test set will miss. Half-reversal never overflows, and the whole thing runs in half the digits.",
        p: { c: 'dim', a: 'good' }, l: { H: 'no overflow ✓' },
        sfx: 'victory'
      }
    ],

    insight: 'Reversing only half the digits sidesteps overflow entirely — and the loop\'s own stopping condition, "the built half has caught up", is what locates the midpoint without counting digits first.',
    complexity: '<b>Time O(d)</b> where d is the digit count — actually d/2 iterations. <b>Space O(1)</b>. Converting to a string is O(d) too but is explicitly ruled out by the follow-up.',
    pitfall: 'Reversing the whole number, which can overflow in a fixed-width language before the comparison happens. And missing the two guards: negatives are never palindromes, and any non-zero number ending in 0 cannot be one.',
    solution: `def is_palindrome(x):
    # Negative: the sign is only ever at the front.
    # Trailing zero: only 0 itself can end in 0 and still mirror.
    if x < 0 or (x % 10 == 0 and x != 0):
        return False

    reversed_half = 0
    while x > reversed_half:
        x, d = divmod(x, 10)
        reversed_half = reversed_half * 10 + d

    # Even digits: halves match. Odd digits: drop the middle one.
    return x == reversed_half or x == reversed_half // 10`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami skips the trailing-zero guard and runs the half-reversal on x = 10. What happens?",
        options: [
          'The loop peels the 0, leaving 1 against a built half of 0, and 1 == 0 // 10 is... 1 == 0, false — it happens to be right, but only by luck of the odd-digit branch',
          'It returns true, which is wrong',
          'It loops forever',
          'It crashes'
        ],
        correct: 0,
        explain: 'Worth tracing rather than assuming: on 10 the guard is not strictly needed. It matters for the general argument — a number like 100 would leave a built half whose leading zeros were lost, and the guard states the rule plainly instead of relying on the arithmetic happening to work out. Being able to say which it is separates understanding from pattern-matching.',
        hint: 'Trace the loop by hand rather than guessing; then ask whether the guard is about correctness or about clarity.'
      },
      {
        tag: 'TRANSFER',
        q: "Different drum, same peeling: Franky must sum the digits of a very large number repeatedly until one digit remains. What is the core operation?",
        options: [
          'divmod by 10 in a loop to peel digits, repeated until the value is below 10',
          'Convert to a string and index',
          'Divide by 9 and take the remainder',
          'Binary search the digit count'
        ],
        correct: 0,
        explain: 'Peeling with divmod is the standard way to walk digits without string conversion, and it is the same loop as the half-reversal. (The digital root does have a closed form involving 9, which is a lovely follow-up — but the peeling loop is the honest starting point.)',
        hint: 'How do you get the last digit and the remaining number in one step?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer allows string conversion after all. Is the two-pointer string check now the better answer?",
        options: [
          'It is simpler and equally O(d) in time, but costs O(d) space for the string — say both and let them choose',
          'Yes, strictly better in every way',
          'No, string conversion is always slower',
          'No, because strings cannot represent large numbers'
        ],
        correct: 0,
        explain: 'The honest comparison is time-equal, space-different, and clarity-favouring-the-string. Offering both with the trade-off stated is a better answer than insisting on the clever one — the follow-up in this problem exists precisely to see whether you can do it without the string.',
        hint: 'Compare the two on time, on space, and on how long they take to read.'
      }
    ]
  };

  E['plus-one'] = {
    id: 'plus-one',
    epNumber: 118,
    title: 'One More Round of Sake',
    arc: 'Onigashima',
    scene: 'night',
    leetcode: { name: 'Plus One', number: 66, difficulty: 'Easy', url: 'https://leetcode.com/problems/plus-one/' },
    problem: 'Given a large integer represented as an array of its digits, most significant first, increment it by one and return the resulting digits.',
    example: 'digits = [1, 2, 3]  →  [1, 2, 4];    digits = [9, 9]  →  [1, 0, 0]',

    h: 200,
    props: [
      { id: 'd1', emoji: '9️⃣', label: '9', x: 34, y: 34 },
      { id: 'd2', emoji: '9️⃣', label: '9', x: 58, y: 34 },
      { id: 'nw', emoji: '1️⃣', label: 'new digit', x: 14, y: 34 }
    ],
    ledger: [
      { id: 'C', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The tally of sake cups is written one digit per plank, and Kaido has called for one more. Add one to the tally.",
        p: { d1: 'lit', d2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Read the planks as a number, add one, write it back? That number can be hundreds of digits long — no integer type holds it.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So work on the planks directly, from the right. If the last digit is below nine, add one to it and you are finished — no carry, nothing else to touch.",
        p: { C: 'lit' }, l: { C: 'below 9 → done' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if it's a nine, it becomes zero and the carry moves left.",
        p: { d2: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Both planks are nines here, so both become zero and the carry runs off the front of the board entirely.",
        p: { d1: 'good' }, l: { C: 'all nines → carry out' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the only case that changes the LENGTH of the tally. And it happens exactly when every digit was a nine — so the answer is a one followed by that many zeros.",
        p: { nw: 'good' }, l: { C: '[1, 0, 0] ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So there's no need to track the carry through a loop at all. Walk backwards, and the first digit below nine ends it.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Adding one is the simplest possible carry — it either stops at the first non-nine or it propagates all the way out. That is what makes this a two-line problem once you see it.",
        sfx: 'gong'
      }
    ],

    insight: 'Adding one propagates a carry only through a run of nines, so the loop can return the moment it finds a digit below nine — and the array grows only when every digit was a nine.',
    complexity: '<b>Time O(n)</b> worst case, when every digit is a nine; O(1) in the common case. <b>Space O(1)</b> in place, or O(n) for the all-nines case that needs a longer array.',
    pitfall: 'Converting the digits to an integer, which overflows for the large inputs this problem is built around. And forgetting the all-nines case, which is the only one that changes the array length.',
    solution: `def plus_one(digits):
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits            # no carry: done immediately
        digits[i] = 0                # a nine becomes zero, carry moves left

    # Fell off the front: every digit was a nine.
    return [1] + digits`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami converts the digit array to an integer, adds one, and splits it back. On a 400-digit input in a fixed-width language, what happens?",
        options: [
          'Overflow — the value does not fit, so the result is meaningless',
          'It works but is slower',
          'It loses the leading digit only',
          'Nothing; integers are unbounded'
        ],
        correct: 0,
        explain: 'The digits-as-array representation exists precisely because the number is too large for a native type. Python would survive it, which is exactly why it is worth naming the assumption out loud rather than relying on the language to rescue you.',
        hint: 'Why would a problem hand you a number as an array of digits in the first place?'
      },
      {
        tag: 'TWEAK',
        q: "The task changes to adding an arbitrary integer k, not just one. What must change?",
        options: [
          'A real carry loop is needed — the carry can exceed one and can persist past a non-nine digit',
          'Nothing; run the same function k times',
          'Only the initial digit change',
          'It becomes impossible without big integers'
        ],
        correct: 0,
        explain: 'The early return works because adding one produces a carry of at most one, which any digit below nine absorbs. With a larger addend the carry can be several and can survive many columns, so you are back to the general column-addition loop. Running the function k times is correct but O(k · n).',
        hint: 'Add 7 to [1, 5] and ask whether the digit below nine really ends the propagation.'
      },
      {
        tag: 'TRANSFER',
        q: "Different tally, same carry: Franky increments a counter written in base 7. What changes in the loop?",
        options: [
          'The digit ceiling: a digit rolls over at 6 instead of 9, so the test becomes < 6',
          'The direction of the walk',
          'Nothing at all',
          'The carry becomes 7'
        ],
        correct: 0,
        explain: 'The base appears in exactly one place — where a digit is considered full. Recognising that the algorithm is base-agnostic apart from that constant is what makes binary, decimal and base-7 increments the same piece of code.',
        hint: 'What is the largest digit in base 7, and where does the code mention the largest digit?'
      }
    ]
  };

  E['factorial-trailing-zeroes'] = {
    id: 'factorial-trailing-zeroes',
    epNumber: 119,
    title: 'Counting the Zeros Without Counting the Cups',
    arc: 'Onigashima',
    scene: 'night',
    leetcode: { name: 'Factorial Trailing Zeroes', number: 172, difficulty: 'Medium', url: 'https://leetcode.com/problems/factorial-trailing-zeroes/' },
    problem: 'Given an integer n, return the number of trailing zeroes in n factorial.',
    example: 'n = 5  →  1  (5! = 120);    n = 25  →  6',

    h: 200,
    props: [
      { id: 'f2', emoji: '2️⃣', label: 'factors of 2', x: 28, y: 32 },
      { id: 'f5', emoji: '5️⃣', label: 'factors of 5', x: 72, y: 32 },
      { id: 'te', emoji: '🔟', label: 'each pair = one zero', x: 50, y: 64 }
    ],
    ledger: [
      { id: 'S', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The feast tally is a factorial — every number up to n multiplied together. We need only the count of trailing zeros, and n runs into the tens of thousands.",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Compute the factorial and count the zeros at the end. ...Which overflows before we reach twenty-one.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So never compute it. A trailing zero is a factor of ten, and a ten is a two paired with a five. Count the pairs.",
        p: { f2: 'lit', f5: 'lit', te: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And twos are far more plentiful than fives — every second number contributes a two, but only every fifth contributes a five.",
        p: { f2: 'good' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So the fives are the scarce resource, and the answer is simply how many factors of five appear across all the numbers up to n.",
        p: { f5: 'good' }, l: { S: 'count the fives' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "n over five, then. For twenty-five that's five fives — but twenty-five is five times five, so it contributes two on its own.",
        p: { te: 'bad' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why you also add n over twenty-five, and n over a hundred and twenty-five, and so on. Each higher power counts the extra fives its multiples carry.",
        p: { te: 'good' }, l: { S: 'n/5 + n/25 + n/125 …' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Twenty-five over five is five, plus twenty-five over twenty-five is one. Six zeros. And the loop ends as soon as the divisor exceeds n.",
        p: { f5: 'good' }, l: { S: '5 + 1 = 6 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Logarithmic in n, and nothing ever overflows because we never build the number at all. Counting a property instead of computing the object is a move worth remembering.",
        sfx: 'gong'
      }
    ],

    insight: 'Count the property rather than computing the object — a trailing zero is a 2-5 pair, fives are the scarce factor, and higher powers of five must be counted again for the extra factors they carry.',
    complexity: '<b>Time O(log₅ n)</b> — one iteration per power of five. <b>Space O(1)</b>. Computing the factorial is O(n) multiplications and overflows almost immediately.',
    pitfall: 'Returning just <code>n // 5</code>, which misses that 25 contributes two fives, 125 contributes three, and so on. Also, counting twos instead of fives gives an answer that is far too large.',
    solution: `def trailing_zeroes(n):
    count = 0
    power = 5
    # Each power of five contributes an extra factor for its multiples.
    while power <= n:
        count += n // power
        power *= 5
    return count`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp returns <code>n // 5</code>. For n = 30, what does he get and what is right?",
        options: [
          '6, but the answer is 7 — 25 contributes a second factor of five',
          '6, correctly',
          '7, correctly',
          '5, which is too low by two'
        ],
        correct: 0,
        explain: '30 // 5 = 6 counts one five each from 5, 10, 15, 20, 25 and 30. But 25 is 5 × 5 and carries a second. Adding 30 // 25 = 1 gives 7. The bug only appears once n reaches 25, which is why small hand-checks miss it.',
        hint: 'Write out the multiples of 5 up to 30 and factorise each one fully.'
      },
      {
        tag: 'TRANSFER',
        q: "Different feast: Nami wants the number of trailing zeros of n! written in BASE 12. What changes?",
        options: [
          'Twelve is 2² × 3, so count pairs of two twos with one three — the binding constraint is now the twos, not a single prime',
          'Nothing; count the fives as before',
          'Count the twelves directly',
          'Count the threes only'
        ],
        correct: 0,
        explain: 'A trailing zero in base b means a factor of b, so factorise b into primes and find which requirement binds first. Base 12 needs two 2s per zero, and although 2s are individually plentiful, needing two of them can make them the scarce side — a nice check on whether you understood why fives mattered in base 10.',
        hint: 'Factorise 12 and ask how many of each prime a single trailing zero consumes.'
      },
      {
        tag: 'TWEAK',
        q: "The loop is written as <code>while n: count += n // 5; n //= 5</code>. Is that equivalent?",
        options: [
          'Yes — dividing n itself by 5 each round accumulates the same sum of n/5 + n/25 + n/125',
          'No, it counts each factor twice',
          'No, it misses the higher powers',
          'Yes, but it overflows for large n'
        ],
        correct: 0,
        explain: 'Both forms compute the same series; one grows the divisor, the other shrinks the number. The shrinking version avoids any risk of the divisor overflowing on very large n, which is a small point in its favour in fixed-width languages.',
        hint: 'Expand both loops for n = 125 and compare the terms they add.'
      }
    ]
  };

  E['sqrtx'] = {
    id: 'sqrtx',
    epNumber: 120,
    title: 'Guessing the Height of the Skull Dome',
    arc: 'Onigashima',
    patternId: 'binary-search',
    scene: 'night',
    leetcode: { name: 'Sqrt(x)', number: 69, difficulty: 'Easy', url: 'https://leetcode.com/problems/sqrtx/' },
    problem: 'Given a non-negative integer x, return the square root of x rounded down to the nearest integer, without using any built-in exponent function.',
    example: 'x = 8  →  2  (the true root is about 2.83, rounded down)',

    h: 200,
    props: [
      { id: 'lo', emoji: '⬇️', label: 'too small', x: 24, y: 34 },
      { id: 'mid', emoji: '❓', label: 'guess', x: 50, y: 34 },
      { id: 'hi', emoji: '⬆️', label: 'too big', x: 76, y: 34 }
    ],
    ledger: [
      { id: 'A', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The Skull Dome's height squared is written on the gate, and we need the height itself — rounded down, and without any convenient root button.",
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Squaring is monotone: bigger guesses give bigger squares, always. So 'is this guess squared at most x' is false-then-true reversed — true, true, true, then false. That is a boundary, and boundaries are binary searched.",
        p: { lo: 'lit', mid: 'lit', hi: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So guess the middle, square it, and throw away half the range depending on whether it overshoots.",
        p: { mid: 'good' }, l: { A: 'largest g with g² ≤ x' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "We want the LARGEST guess whose square does not exceed x. So when a guess fits, keep it as the best so far and search higher; when it overshoots, search lower.",
        p: { lo: 'good', hi: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "For eight: guess four, sixteen is too big. Guess two, four fits — remember it. Guess three, nine is too big. Answer two.",
        p: { mid: 'good' }, l: { A: 'answer 2 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One trap in fixed-width languages: squaring a guess near the top of the range overflows. Compare with division instead — is the guess at most x divided by the guess — and nothing ever grows.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And zero and one? The range has to include them, and the loop mustn't divide by zero.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Start the search at one and answer zero separately, or start at zero and guard the division. Either is fine, so long as you have decided which — that is the sort of thing worth saying out loud rather than discovering in a failing test.",
        sfx: 'gong'
      }
    ],

    insight: 'Binary search over the answer, not over an array — squaring is monotone, so "does this guess overshoot?" is a monotone predicate and the range of candidate roots can be halved.',
    complexity: '<b>Time O(log x)</b>. <b>Space O(1)</b>. Newton\'s method converges faster in practice and is a good thing to mention, but binary search is easier to argue correct.',
    pitfall: 'Computing <code>mid * mid</code>, which can overflow near the top of the range in a fixed-width language — compare <code>mid &lt;= x // mid</code> instead. And remembering that the answer is rounded <b>down</b>, so 8 gives 2, not 3.',
    solution: `def my_sqrt(x):
    if x < 2:
        return x                    # 0 and 1 are their own roots

    lo, hi, best = 1, x // 2, 1     # the root of x >= 2 is at most x // 2
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if mid <= x // mid:         # division, not mid*mid: no overflow
            best = mid              # fits — remember it and try larger
            lo = mid + 1
        else:
            hi = mid - 1
    return best`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different gate, same search: Nami must find the largest number of crates per stack such that stacking them takes at most 9 rows, given a total. Why is binary search applicable?",
        options: [
          '"Does this stack size fit in 9 rows?" is monotone — bigger stacks never need more rows — so the answer space is false-then-true',
          'Because the crates are sorted',
          'Because the total is a perfect square',
          'It is not; this needs a linear scan'
        ],
        correct: 0,
        explain: 'The licence is monotonicity of the feasibility test, not sortedness of any array. This is the "binary search the answer" family — Koko eating bananas, ship capacity in D days, and Sqrt(x) are all the same shape with different feasibility checks.',
        hint: 'If a stack size of 7 works, does 6 also work? That answer is the licence.'
      },
      {
        tag: 'PITFALL',
        q: "Usopp writes <code>if mid * mid &lt;= x</code> in a 32-bit signed language, with x near 2³¹. What can happen?",
        options: [
          'mid * mid overflows and wraps to a negative value, so the comparison passes when it should fail',
          'It is slower but correct',
          'It rounds up instead of down',
          'Nothing; the product always fits'
        ],
        correct: 0,
        explain: 'A mid near 46,000 already squares past 2³¹. The wrapped value can compare as smaller than x, sending the search the wrong way. Rewriting the comparison as a division keeps every intermediate value bounded by x — the same defensive move as computing mid with lo + (hi − lo) / 2.',
        hint: 'How large can mid get, and does its square still fit in the same type?'
      },
      {
        tag: 'TWEAK',
        q: "The answer must now be rounded to the NEAREST integer rather than down. What is the smallest change?",
        options: [
          'Compute the floor as before, then compare x against the midpoint of best² and (best+1)² to decide whether to round up',
          'Change the comparison to >=',
          'Search over doubles instead',
          'Add one to the result unconditionally'
        ],
        correct: 0,
        explain: 'The search itself is unchanged — it finds the floor — and the rounding is a single comparison afterwards. Separating "find the boundary" from "interpret the boundary" is what keeps binary-search code from becoming a nest of off-by-ones.',
        hint: 'Once you know the floor, how many candidates could the nearest integer be?'
      }
    ]
  };

  E['powxn'] = {
    id: 'powxn',
    epNumber: 121,
    title: 'Doubling the Blow',
    arc: 'Onigashima',
    patternId: 'binary-search',
    scene: 'night',
    leetcode: { name: 'Pow(x, n)', number: 50, difficulty: 'Medium', url: 'https://leetcode.com/problems/powx-n/' },
    problem: 'Implement pow(x, n), raising x to the integer power n, where n may be negative.',
    example: 'x = 2.0, n = 10  →  1024.0;    x = 2.0, n = -2  →  0.25',

    h: 200,
    props: [
      { id: 'x1', emoji: '👊', label: 'x', x: 20, y: 32 },
      { id: 'x2', emoji: '👊', label: 'x²', x: 40, y: 32 },
      { id: 'x4', emoji: '👊', label: 'x⁴', x: 60, y: 32 },
      { id: 'x8', emoji: '👊', label: 'x⁸', x: 80, y: 32 }
    ],
    ledger: [
      { id: 'B', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Each blow doubles the force of the last. To reach the tenth blow, do we really have to throw all ten?",
        p: { x1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "No — square as you go. x squared is x times x. x to the fourth is that squared. x to the eighth is that squared again. Each step doubles the exponent rather than adding one to it.",
        p: { x2: 'good', x4: 'good', x8: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So ten is eight plus two. Multiply the eighth-power blow by the second-power blow.",
        p: { B: 'lit' }, l: { B: '10 = 1010 in binary' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is exactly the binary form of the exponent. Every one-bit says 'include this squaring in the product'. Ten in binary is one-zero-one-zero, so the eighth and the second are taken.",
        p: { B: 'good' }, l: { B: 'x⁸ · x² = x¹⁰ ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Four multiplications instead of ten. And for a thousand, ten instead of a thousand.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Logarithmic in the exponent, because each round consumes one of its bits.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "What if the exponent is negative?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Invert the base and make the exponent positive. But in a fixed-width language, negating the most negative integer overflows — its positive counterpart does not exist. Convert to a wider type first, or handle that one value specially.",
        p: { x1: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One value out of four billion, and it's the one they'll test.",
        p: { x1: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Squaring consumes one bit of the exponent per round, so the exponent\'s binary form tells you exactly which squarings to multiply together — logarithmic instead of linear.',
    complexity: '<b>Time O(log n)</b> — one round per bit of the exponent. <b>Space O(1)</b> iteratively, or O(log n) for the recursive form\'s call stack.',
    pitfall: 'Negating <code>n</code> when it is the most negative representable integer, which overflows. Also, repeated multiplication of floats accumulates rounding error — worth acknowledging, though the problem tolerates it.',
    solution: `def my_pow(x, n):
    if n < 0:
        x = 1 / x
        n = -n              # careful: in fixed-width langs, INT_MIN overflows here

    result = 1.0
    while n:
        if n & 1:           # this bit of the exponent is set
            result *= x
        x *= x              # square for the next bit
        n >>= 1
    return result`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different blow, same doubling: Franky must compute a huge Fibonacci number modulo a prime, far beyond what iteration allows. What technique carries over?",
        options: [
          'Matrix exponentiation by squaring — the same halve-the-exponent trick applied to a 2x2 matrix',
          'Binary search over the index',
          'Memoised recursion',
          'A closed-form formula with floating point'
        ],
        correct: 0,
        explain: 'Fast exponentiation works for any associative operation, not just numbers — matrices, permutations, modular arithmetic. Seeing "squaring halves the exponent" as a general technique rather than a numeric trick is what unlocks that whole family.',
        hint: 'What property of multiplication does the squaring trick actually rely on?'
      },
      {
        tag: 'PITFALL',
        q: "In a 32-bit signed language, what breaks at n = −2147483648?",
        options: [
          '<code>n = -n</code> overflows, because +2147483648 is not representable',
          'The result is off by one',
          'The loop runs forever',
          'Nothing; negation is always safe'
        ],
        correct: 0,
        explain: 'The signed range is asymmetric: there is one more negative value than positive. Widening to a 64-bit type before negating is the standard fix. It is the same INT_MIN trap that catches abs() and division by −1, and mentioning it unprompted is a strong signal.',
        hint: 'How many negative 32-bit integers are there compared with positive ones?'
      },
      {
        tag: 'TWEAK',
        q: "The exponent is now given in binary as a 10,000-bit string. Does the method still apply?",
        options: [
          'Yes — walk the bits directly, squaring each round and multiplying in where the bit is set',
          'No, the exponent must be converted to an integer first',
          'No, it becomes linear in the value of the exponent',
          'Yes, but only for integer bases'
        ],
        correct: 0,
        explain: 'The algorithm consumes the exponent bit by bit, so a bit string is if anything the more natural input — no conversion needed, and no risk of the exponent exceeding a native type. This is exactly how modular exponentiation is done in cryptography, where exponents are thousands of bits.',
        hint: 'What does the loop actually read from n on each iteration?'
      }
    ]
  };

  E['max-points-on-a-line'] = {
    id: 'max-points-on-a-line',
    epNumber: 122,
    title: 'The Arrows That Share One Flight',
    arc: 'Onigashima',
    patternId: 'hashing-patterns',
    scene: 'night',
    leetcode: { name: 'Max Points on a Line', number: 149, difficulty: 'Hard', url: 'https://leetcode.com/problems/max-points-on-a-line/' },
    problem: 'Given an array of points on a plane, return the maximum number of points that lie on the same straight line.',
    example: 'points = [[1,1],[2,2],[3,3]]  →  3',

    h: 200,
    props: [
      { id: 'pa', emoji: '🎯', label: '(1,1)', x: 24, y: 60 },
      { id: 'pb', emoji: '🎯', label: '(2,2)', x: 50, y: 42 },
      { id: 'pc', emoji: '🎯', label: '(3,3)', x: 76, y: 24 },
      { id: 'sl', emoji: '📐', label: 'slope key', x: 50, y: 78 }
    ],
    ledger: [
      { id: 'M', x: 50, y: 92 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Every arrow that landed is marked on the map. How many of them were loosed along the same line of flight?",
        p: { pa: 'lit', pb: 'lit', pc: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A line is fixed by two points, so fix one arrow and look at the direction to every other. Arrows sharing a direction from that one all lie on one line through it.",
        p: { sl: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So for each arrow, tally the directions to all the others and take the biggest tally. That's n times n — fine, n is small here.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The difficulty is the KEY. Using the slope as a decimal invites floating-point error — two genuinely collinear arrows can hash to different values because one division rounded differently.",
        p: { sl: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So keep it as a fraction. The rise and the run, as a pair of whole numbers.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Reduced by their greatest common divisor, and with the sign normalised — otherwise two over four, one over two, and minus one over minus two all name the same direction under three different keys.",
        p: { sl: 'good' }, l: { M: 'key = (dy/g, dx/g), sign fixed' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Three arrows on the diagonal all give a reduced direction of one over one. Tally three.",
        p: { pa: 'good', pb: 'good', pc: 'good' }, l: { M: 'answer 3 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Vertical lines have zero run, which as a fraction would divide by zero — but as a reduced PAIR it is simply one over zero, and needs no special case at all.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Choosing the key so the awkward cases disappear, rather than branching around them. That keeps coming up.",
        sfx: 'gong'
      }
    ],

    insight: 'Choose a hash key that is exact and canonical — a reduced integer fraction with a normalised sign identifies a direction without floating-point error and makes the vertical case ordinary.',
    complexity: '<b>Time O(n²)</b> — every point against every other, with constant-time map work. <b>Space O(n)</b> for the per-anchor map.',
    pitfall: 'Using a floating-point slope, where rounding makes collinear points disagree. And forgetting to normalise the sign of the reduced fraction, which splits one direction across several keys.',
    solution: `from collections import defaultdict
from math import gcd

def max_points(points):
    n = len(points)
    if n <= 2:
        return n

    best = 0
    for i in range(n):
        directions = defaultdict(int)
        x1, y1 = points[i]
        for j in range(i + 1, n):
            x2, y2 = points[j]
            dy, dx = y2 - y1, x2 - x1
            g = gcd(dy, dx) or 1          # reduce to lowest terms
            dy, dx = dy // g, dx // g
            if dx < 0 or (dx == 0 and dy < 0):
                dy, dx = -dy, -dx          # normalise the sign
            directions[(dy, dx)] += 1
            best = max(best, directions[(dy, dx)])
    return best + 1                        # plus the anchor point itself`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp keys the map on the floating-point slope <code>(y2-y1)/(x2-x1)</code>. Which collinear points can end up under different keys?",
        options: [
          'Any where the division rounds differently — such as points far apart on a line with an irrational-looking slope',
          'Only points with a vertical slope',
          'Only points with a negative slope',
          'None; floating point is exact for this'
        ],
        correct: 0,
        explain: 'Division introduces rounding, and two mathematically equal slopes computed from different point pairs can differ in the last bit — enough for a hash map to treat them as distinct. Exact integer keys remove the failure mode rather than reducing its probability.',
        hint: 'Are two floating-point divisions of mathematically equal ratios guaranteed to produce identical bits?'
      },
      {
        tag: 'TWEAK',
        q: "Robin reduces the fraction but skips the sign normalisation. What goes wrong?",
        options: [
          'The direction (1, 2) and its opposite (−1, −2) become different keys, so points on opposite sides of the anchor are not counted together',
          'Vertical lines break',
          'Nothing; sign is preserved by gcd',
          'The count is doubled'
        ],
        correct: 0,
        explain: 'A line through the anchor extends both ways, so points before and after it give opposite direction vectors that name the same line. Fixing the sign — say, always making dx positive, and dy positive when dx is zero — merges them. Canonicalisation means one representation per concept, and the sign is part of that.',
        hint: 'Take an anchor with one point to its upper right and one to its lower left. What two direction vectors result?'
      },
      {
        tag: 'TRANSFER',
        q: "Different map, same canonical key: Nami groups fractions like 2/4, 1/2 and 3/6 as equal. What key does it?",
        options: [
          'The pair (numerator/g, denominator/g) with the sign on the numerator, where g is their gcd',
          'The floating-point value of the division',
          'The numerator alone',
          'The string form of the fraction'
        ],
        correct: 0,
        explain: 'Exactly the slope key, in its own right. Any time equality is "equal after some normalisation", the fix is to compute that normal form and use it as the key — sorted letters for anagrams, reduced fractions for ratios, lowercase for case-insensitive matching.',
        hint: 'What makes 2/4 and 3/6 "the same", and can you compute that sameness directly?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
