/*
Reference pattern data file — this is the schema template every other
data/patterns/<id>.js must follow exactly.

Shape:
{
  id, title, category, timeMin,
  summary: string,
  concept: [ paragraph strings ],
  recognitionSignals: [ strings ],
  complexity: string,
  canonical: { name, statement },
  variants: [ { company, title, twist } ],
  pythonSolution: { title, code, notes: [ pythonic idiom call-outs ] },
  pitfalls: [ strings ],
  viz: { type: 'array', initialArray: [...], labelArray?: [...], steps: [
    { highlights: {idx:'a'|'b'|'c'|'bad'|'dim'}, pointers: {name:idx}, vars: {name:value}, message } ] }
       | { type: 'graph', nodes: [{id,x,y,label}], edges:[{from,to}], steps:[
    { visited:[ids], current:id, activeEdge:[from,to], vars:{}, message } ] }
  quiz: [ { q, options:[...], correct: idx, explain } ]
}
*/
window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['sliding-window'] = {
  id: 'sliding-window',
  title: 'Sliding Window',
  category: 'Arrays & Two-Pointer Family',
  timeMin: 15,
  summary: 'Track a contiguous, elastic window over an array/string and slide it in O(n) instead of re-scanning every subarray.',
  concept: [
    'A sliding window keeps two pointers, <code>left</code> and <code>right</code>, that both only ever move forward, defining a contiguous range. You grow the window by advancing <code>right</code>, and shrink it by advancing <code>left</code> whenever the window violates some condition (too many distinct characters, sum too large, a duplicate appeared, etc).',
    'Because each pointer visits every index at most once, the whole scan is O(n) total even though it looks like nested iteration — this is the "amortized" argument you should say out loud in an interview to justify the complexity.',
    'There are two flavors: <b>fixed-size</b> (window size k is given up front — you add one, remove one, every step) and <b>variable-size</b> (the window grows/shrinks based on a validity condition, and you track the best window seen).',
    'Formally, the pattern is correct only when validity is monotonic in a precise sense: for a fixed <code>right</code>, define <code>L(right)</code> as the smallest <code>left</code> such that <code>[left, right]</code> is valid. The entire "never move left backward" argument depends on <code>L</code> being non-decreasing as <code>right</code> grows — extending the window can only ever force <code>left</code> to catch up, never fall behind where it already was. If that fails (a window can become valid again after growing past some point, then invalid again), the amortized O(n) argument doesn\'t just get slower, it becomes unsound — which is exactly why the monotonicity called out in recognitionSignals above is a precondition, not a nice-to-have.',
  ],
  recognitionSignals: [
    'Problem mentions a "contiguous subarray" or "substring" and asks for the longest / shortest / count that satisfies some condition.',
    'The condition is monotonic: once a window is invalid, making it bigger stays invalid, and shrinking from the left can restore validity (this monotonicity is *why* a window works — if it doesn’t hold, sliding window is the wrong tool).',
    'A fixed window size k is explicitly given ("subarray of size k").',
    'Brute force is an O(n²) or O(n³) double/triple loop over start/end indices — that’s almost always your cue a window collapses it to O(n).',
  ],
  complexity: 'Time: O(n) amortized (each pointer traverses the input once). Space: O(1) for fixed window, O(k) or O(min(n, alphabet size)) for variable window with a hash map/set.',
  canonical: {
    name: 'Longest Substring Without Repeating Characters (LeetCode 3)',
    statement: 'Given a string s, find the length of the longest substring without repeating characters.',
  },
  story: {
    onePiece: {
      title: 'Sanji rationing the buffet for Luffy',
      text: [
        'Sanji has agreed to let Luffy eat his way down an endless buffet line, on one condition: the moment the food currently within Luffy\'s reach adds up to more than his stomach can hold, Sanji intervenes. Sanji isn\'t insane enough to re-tally every plate from the start of the line each time Luffy grabs something new — he just keeps a running total in his head and updates it one plate at a time.',
        'Luffy keeps reaching for the next plate down the line — that\'s the window\'s right edge sliding forward, and each new plate\'s weight gets added straight onto the running total. As long as the total stays under his limit, Sanji lets it ride and just watches the total grow.',
        'The instant the total tips over the limit, Sanji doesn\'t start over — he snatches the single oldest plate off the other end of Luffy\'s pile, the one that\'s been sitting there longest, subtracts its weight from the running total, and checks again. He keeps peeling plates off that end, one at a time, until the total is back under the limit — then Luffy is free to reach for more. Expand right while accumulating; the moment the running total violates the constraint, shrink from the left until it\'s valid again — nothing about the plates in the middle ever needs to be re-examined.',
      ],
    },
    history: {
      title: 'Bletchley Park and the crib-drag',
      text: [
        'WWII codebreakers at Bletchley Park often had a "crib" — a fragment of plaintext they strongly suspected appeared somewhere in an intercepted Enigma message, like a routine weather report that always opened with the same German phrase. They didn\'t know where in the ciphertext it started, only that it was in there somewhere.',
        'So they slid the crib one position at a time along the length of the ciphertext, and at each offset checked a fixed, simple condition: Enigma\'s wiring guaranteed a letter could never encipher to itself, so any offset where a crib letter lined up with the same ciphertext letter was an immediate contradiction, ruling that position out on the spot. That\'s a fixed-size window walking across a longer sequence, testing one condition per position — not searching by content, but by position, exactly like checking a window of fixed length k for a property as it slides.',
      ],
    },
    why: 'A window\'s "expand right, shrink left" rule is a clean invariant on paper but easy to fumble under interview pressure about which side moves first. Anchoring it to Sanji\'s plate-yanking (why shrink triggers, and from which end) and to a wartime crib sliding past ciphertext (why a fixed window tests one position at a time instead of searching for content) gives two independent images to fall back on if the algebra slips your mind.',
  },
  tricks: [
    {
      name: 'Guard against a stale duplicate index',
      idea: 'The last-seen-index map can hold a position that is no longer inside the current window. Jumping left to it anyway moves left backward, which breaks the entire "left only advances" argument the O(n) bound depends on.',
      before:
`def length_of_longest_substring(s: str) -> int:
    last_seen = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen:   # BUG: doesn't check whether last_seen[ch] is still in-window
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best`,
      after:
`def length_of_longest_substring(s: str) -> int:
    last_seen = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1   # only jump if the duplicate is still inside the window
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best`,
      explain: 'Trace "abba": at right=2 (\'b\'), left correctly jumps to 2. At right=3 (\'a\'), the buggy version sees \'a\' at stale index 0 (already outside the window) and yanks left back to 1 — reporting best=3 for "bba", which contains a repeated \'b\' and is not a valid answer. The guarded version ignores the stale index and correctly keeps best=2.',
    },
    {
      name: 'Off-by-one on window length',
      idea: 'The width of an inclusive index range [left, right] is right - left + 1, not right - left. Dropping the +1 silently undercounts every window by exactly one character.',
      before:
`def length_of_longest_substring(s: str) -> int:
    last_seen = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left)   # BUG: missing +1, undercounts window width
    return best`,
      after:
`def length_of_longest_substring(s: str) -> int:
    last_seen = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)   # width of an inclusive [left, right] range
    return best`,
      explain: 'On a string with no repeats at all, like "abc", the buggy version reports best=2 instead of 3 — right - left at the final step is 2 - 0 = 2, but the window actually spans three characters, indices 0 through 2 inclusive. This kind of bug is dangerous precisely because it never crashes and often survives a quick manual check.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Longest substring with at most K distinct characters',
      twist: 'Instead of "no repeats," the constraint becomes "at most K distinct characters." Swap the last-seen-index map for a <code>Counter</code> of in-window character counts, and shrink while <code>len(counts) > K</code>. Same expand/shrink skeleton, different validity check — recognizing that the *shape* of the algorithm doesn’t change is the real skill being tested. Common follow-up: "what if K changes across many queries on the same string?" (precompute nothing reusable — each query is still a fresh O(n) scan, so discuss whether K is bounded/small).',
    },
    {
      company: 'Meta-style',
      title: 'Streaming input, no fixed string',
      twist: 'Characters arrive one at a time from a stream/generator instead of a full string in memory. You must maintain "longest window without repeats seen so far" incrementally with O(1) amortized work per new character and O(min(n, alphabet)) memory — forces you to argue why the hash map approach still works without random access to look backward, since you only ever move <code>left</code> forward from where it already is.',
    },
    {
      company: 'Amazon/Microsoft-style',
      title: 'Minimum Window Substring (return the substring, not just the length)',
      twist: 'A harder combined variant (LeetCode 76): given s and t, find the smallest window in s containing every character of t (with multiplicity). This adds a second counter (needed vs. have) and flips the pattern’s goal from "longest valid window" to "shortest valid window" — the shrink loop runs *while the window is valid* instead of *while it’s invalid*. Interviewers use this to check you don’t just have the code memorized but understand which loop condition flips and why.',
    },
  ],
  pythonSolution: {
    title: 'Longest Substring Without Repeating Characters',
    code:
`def length_of_longest_substring(s: str) -> int:
    last_seen = {}          # char -> most recent index
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1   # jump past the stale duplicate
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best`,
    notes: [
      '<code>enumerate(s)</code> gives you the index and character together — avoids a manual <code>for i in range(len(s))</code> counter, the idiomatic Python default.',
      'The guard <code>last_seen[ch] >= left</code> (not just <code>ch in last_seen</code>) is the whole trick: a character seen earlier might already be outside the current window, and blindly jumping to it would move <code>left</code> backwards.',
      '<code>best = max(best, ...)</code> inline is more idiomatic than an <code>if ... : best = ...</code> block for a running maximum.',
      'For the "at most K distinct" variant, swap the dict for <code>collections.Counter()</code> and shrink with <code>counts[s[left]] -= 1; if counts[s[left]] == 0: del counts[s[left]]</code>.',
    ],
  },
  pitfalls: [
    'Forgetting the <code>>= left</code> check and letting <code>left</code> jump backward on a stale duplicate — silently produces wrong (too-large) answers instead of crashing, which makes it dangerous in an interview because your test cases might not catch it.',
    'Off-by-one on window length: it’s <code>right - left + 1</code>, not <code>right - left</code>.',
    'Using a <code>set</code> and popping from the left in a while-loop works but is O(n) worst case per shrink in the naive version (removing one element at a time is fine — the bug is re-scanning the set instead of just discarding <code>s[left]</code>); prefer the last-seen-index trick when possible since it jumps directly.',
    'Assuming ASCII-only input; if the alphabet is large/unicode, space complexity for the map should be described as O(min(n, alphabet size)), not O(1).',
  ],
  viz: {
    type: 'array',
    initialArray: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'],
    steps: [
      { highlights: { 0: 'a' }, pointers: { L: 0, R: 0 }, vars: { window: "'a'", best: 1 }, message: "right=0, ch='a' is new to the window → expand. window='a', best=1" },
      { highlights: { 0: 'a', 1: 'a' }, pointers: { L: 0, R: 1 }, vars: { window: "'ab'", best: 2 }, message: "right=1, ch='b' is new → expand. window='ab', best=2" },
      { highlights: { 0: 'a', 1: 'a', 2: 'a' }, pointers: { L: 0, R: 2 }, vars: { window: "'abc'", best: 3 }, message: "right=2, ch='c' is new → expand. window='abc', best=3" },
      { highlights: { 0: 'bad', 1: 'a', 2: 'a', 3: 'a' }, pointers: { L: 1, R: 3 }, vars: { window: "'bca'", best: 3 }, message: "right=3, ch='a' duplicates idx0 (≥ left) → jump left to 1. window='bca', best stays 3" },
      { highlights: { 1: 'bad', 2: 'a', 3: 'a', 4: 'a' }, pointers: { L: 2, R: 4 }, vars: { window: "'cab'", best: 3 }, message: "right=4, ch='b' duplicates idx1 (≥ left) → jump left to 2. window='cab', best stays 3" },
      { highlights: { 2: 'bad', 3: 'a', 4: 'a', 5: 'a' }, pointers: { L: 3, R: 5 }, vars: { window: "'abc'", best: 3 }, message: "right=5, ch='c' duplicates idx2 (≥ left) → jump left to 3. window='abc', best stays 3" },
      { highlights: { 4: 'bad', 5: 'a', 6: 'a' }, pointers: { L: 5, R: 6 }, vars: { window: "'cb'", best: 3 }, message: "right=6, ch='b' duplicates idx4 (≥ left) → jump left to 5. window='cb', best stays 3" },
      { highlights: { 6: 'bad', 7: 'a' }, pointers: { L: 7, R: 7 }, vars: { window: "'b'", best: 3 }, message: "right=7, ch='b' duplicates idx6 → jump left to 7. window='b'. Done — answer best=3 (\"abc\")" },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing in a problem statement most strongly signals a sliding-window approach?',
      options: [
        'The array is sorted and you need a pair summing to a target',
        'Find the longest/shortest/count of contiguous subarrays or substrings satisfying some condition',
        'Detect whether a linked list has a cycle',
        'Find the k-th largest element in an unsorted array',
      ],
      correct: 1,
      explain: 'Sorted-array pair-sum points to two pointers on sorted data; cycle detection points to fast/slow pointers; k-th largest points to a heap. "Contiguous subarray/substring, longest/shortest/count" is the sliding window signature.',
    },
    {
      q: 'What is the time complexity of the variable-size sliding window solution for "longest substring without repeating characters"?',
      options: ['O(n²)', 'O(n log n)', 'O(n) amortized', 'O(2ⁿ)'],
      correct: 2,
      explain: 'left and right each advance forward at most n times total across the whole run, so total work is O(n) even though there’s a loop inside a loop.',
    },
    {
      q: 'In the reference solution, why check `last_seen[ch] >= left` instead of just `ch in last_seen`?',
      options: [
        'It’s purely a style preference with no functional difference',
        'A previously-seen character might already be outside the current window; jumping to its stale index would move left backwards',
        'It makes the dictionary lookup itself faster',
        'It’s required to bring the complexity down to O(n log n)',
      ],
      correct: 1,
      explain: 'left must only ever move forward. Without the >= left guard, a character seen long ago (now outside the window) would incorrectly yank left backward, corrupting the window.',
    },
    {
      q: 'A company variant asks for "at most K distinct characters" instead of "no repeats." What typically changes in your implementation?',
      options: [
        'Nothing — the exact same code works unchanged',
        'You swap what you track (e.g. a Counter of in-window counts vs. a last-seen-index map) and adjust the shrink condition, but keep the same expand/shrink skeleton',
        'You must abandon two pointers and use binary search instead',
        'You must switch from iteration to recursion',
      ],
      correct: 1,
      explain: 'This is the core interview skill: recognizing that sliding window is a skeleton (expand right, shrink left while invalid) where only the validity check and the bookkeeping structure change between variants.',
    },
    {
      q: 'How does a fixed-size window ("max sum of any subarray of size k") differ from a variable-size window?',
      options: [
        'It doesn’t use two pointers at all',
        'Once the window reaches size k, you add the new right element and remove the leftmost element on every single step — the window never grows or shrinks, it just slides',
        'It always requires a hash map to work correctly',
        'It cannot be solved in O(n) time',
      ],
      correct: 1,
      explain: 'Fixed windows slide as a constant-size block: add s[right], subtract s[left], move both pointers together once size k is reached — no validity check needed, which is why it’s simpler than the variable-size case.',
    },
  ],
};
