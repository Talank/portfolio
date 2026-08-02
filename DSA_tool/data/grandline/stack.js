/* Jaya — stacks, including the monotonic kind.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['valid-parentheses'] = {
    id: 'valid-parentheses',
    epNumber: 96,
    title: 'The Seals of the Golden Bell',
    arc: 'Jaya',
    patternId: 'monotonic-stack',
    scene: 'colosseum',
    leetcode: { name: 'Valid Parentheses', number: 20, difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/' },
    problem: 'Given a string of brackets — (), [] and {} — determine whether every bracket is closed by the correct type, in the correct order.',
    example: '"([{}])"  →  true       "([)]"  →  false',

    h: 200,
    props: [
      { id: 's1', emoji: '🔓', label: '(', x: 16, y: 34 },
      { id: 's2', emoji: '🔓', label: '[', x: 38, y: 34 },
      { id: 's3', emoji: '🔓', label: '{', x: 60, y: 34 },
      { id: 's4', emoji: '🔒', label: '}', x: 82, y: 34 }
    ],
    ledger: [
      { id: 'K', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The bell tower's seals are nested inside one another, three different kinds. Every seal has to be closed by its own kind, and the innermost one has to close first.",
        p: { s1: 'lit', s2: 'lit', s3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So count them? Three round seals opened, three closed. Three square, three closed. Balanced.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Counting proves the numbers match, not that the nesting is right. Take an open round, an open square, a close round, a close square — perfectly balanced counts, and completely invalid.",
        p: { s4: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Because you can't close the outer one while the inner one is still open. It's about ORDER, not quantity.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And 'the most recent thing that is still unresolved' is precisely what a stack holds. Push every opening seal. On a closing seal, the top of the stack must be its partner.",
        p: { K: 'lit' }, l: { K: 'stack of open seals' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Round, square, curly go on. Then close curly — top is curly, they match, pop it. Close square — matches, pop. Close round — matches, pop. Empty at the end.",
        p: { s1: 'good', s2: 'good', s3: 'good', s4: 'good' }, l: { K: 'empty ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two failure modes beyond a mismatch. A closing seal arriving when the stack is empty — nothing was open. And the string ending with the stack not empty — something was never closed.",
        p: { K: 'bad' }, l: { K: 'must end empty' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So the final check isn't optional. Half the wrong answers to this return true for an unclosed seal.",
        p: { K: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Any problem phrased as 'the most recent unresolved thing' is a stack. That's the sentence I'm keeping.",
        sfx: 'gong'
      }
    ],

    insight: 'Nesting is last-in-first-out by definition, so any requirement about "the most recent unresolved thing" is a stack — counters can only prove quantities match, never that the order is legal.',
    complexity: '<b>Time O(n)</b> — one pass, each character pushed or popped once. <b>Space O(n)</b> for the stack in the worst case, a string of all opening brackets.',
    pitfall: 'Forgetting the final emptiness check, so <code>"((("</code> returns true. And popping an empty stack when a closing bracket arrives first, which crashes rather than returning false.',
    solution: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:                      # a closing bracket
            if not stack or stack.pop() != pairs[ch]:
                return False                 # nothing open, or wrong type
        else:
            stack.append(ch)
    return not stack                         # anything left was never closed`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different seal, same rule: Franky validates XML-style tags like <code>&lt;a&gt;&lt;b&gt;&lt;/b&gt;&lt;/a&gt;</code>. Why is a stack still the tool, and what changes?",
        options: [
          'Closing tags must match the most recent unclosed one — the stack now holds tag names rather than single characters',
          'A set of open tag names is sufficient',
          'A counter per tag name is sufficient',
          'Tags cannot be validated with a stack'
        ],
        correct: 0,
        explain: 'Identical structure with a richer alphabet. A set loses order and a per-name counter loses it too, so both would accept <code>&lt;a&gt;&lt;b&gt;&lt;/a&gt;&lt;/b&gt;</code> — the exact interleaving failure the bracket problem is built around.',
        hint: 'What is the one thing a counter cannot tell you about interleaved tags?'
      },
      {
        tag: 'PITFALL',
        q: "Nami's implementation pushes openers, matches closers, and returns True at the end of the loop with no final check. What does it say about \"{[(\"?",
        options: [
          'True — three seals were opened and never closed, and nothing ever noticed',
          'False, correctly',
          'It crashes',
          'True, and that is the right answer'
        ],
        correct: 0,
        explain: 'Every character takes the push branch, no mismatch ever occurs, and the function returns True with three items still on the stack. The end-of-loop state is part of the answer here — a leftover stack means unresolved work, which is exactly what "invalid" means.',
        hint: 'What is on the stack when that loop finishes?'
      },
      {
        tag: 'TWEAK',
        q: "The rule relaxes: only round brackets exist, and the string is valid if it CAN be made valid by inserting brackets anywhere. What is the minimal check?",
        options: [
          'A single counter — never let it go negative, and it need not end at zero',
          'The same stack, unchanged',
          'Count openers and closers and compare',
          'It is impossible to check in one pass'
        ],
        correct: 0,
        explain: 'With one bracket type there is nothing to interleave wrongly, so the stack degenerates to a depth counter — and allowing insertions means only the "never close what was never opened" rule survives. Knowing when a stack collapses into a counter is as useful as knowing when a counter is not enough.',
        hint: 'With only one bracket type, what information does the stack hold beyond its own height?'
      }
    ]
  };

  E['simplify-path'] = {
    id: 'simplify-path',
    epNumber: 97,
    title: 'The Map With Doubled-Back Trails',
    arc: 'Jaya',
    patternId: 'monotonic-stack',
    scene: 'colosseum',
    leetcode: { name: 'Simplify Path', number: 71, difficulty: 'Medium', url: 'https://leetcode.com/problems/simplify-path/' },
    problem: 'Given an absolute Unix-style path, return its simplified canonical form: a single leading slash, no trailing slash, no "." or ".." segments, and no repeated slashes.',
    example: '"/a/./b/../../c/"  →  "/c"',

    h: 200,
    props: [
      { id: 'pa', emoji: '📁', label: 'a', x: 20, y: 32 },
      { id: 'pd', emoji: '⏺️', label: '.', x: 40, y: 32 },
      { id: 'pb', emoji: '📁', label: 'b', x: 60, y: 32 },
      { id: 'pu', emoji: '⏪', label: '..', x: 80, y: 32 }
    ],
    ledger: [
      { id: 'S', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Cricket's map of Jaya is written as a trail, but it doubles back on itself. Some steps say 'stay put' and some say 'go back one'. We need the trail it actually describes.",
        p: { pa: 'lit', pd: 'lit', pb: 'lit', pu: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Cut the trail at every slash and treat each piece as a token. Then the meaning of each token is simple: a real name moves you forward, '..' moves you back, and '.' or an empty piece does nothing.",
        p: { S: 'lit' }, l: { S: 'stack of directories' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Go back one — that's undoing the most recent step. Which is a stack again.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Push 'a'. Then a dot, which is ignored. Push 'b'. Then '..', which pops 'b'. Then another '..', which pops 'a'.",
        p: { pa: 'good', pb: 'good', pu: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And now the stack is empty and there's ANOTHER '..'. Do we go back past the beginning?",
        p: { S: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is nowhere to go. The root is its own parent, so a pop on an empty stack is simply ignored. That guard is the single most missed line in this problem.",
        p: { S: 'good' }, l: { S: 'pop only if non-empty' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Then push 'c'. And the answer is a slash joined between everything left on the stack, with a slash at the front.",
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Splitting on the slash handles the repeated and trailing slashes for free — they simply produce empty tokens, which we already ignore. No separate cleaning pass needed.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if everything pops away, the answer is just a single slash — not an empty string.",
        sfx: 'gong'
      }
    ],

    insight: 'Split on the separator and let each token be an instruction: names push, ".." pops, "." and empties are noise — with the root as its own parent, so popping an empty stack is a no-op rather than an error.',
    complexity: '<b>Time O(n)</b> — one pass over the tokens, each pushed and popped at most once. <b>Space O(n)</b> for the stack and the split.',
    pitfall: 'Popping an empty stack on <code>"/.."</code>, which either crashes or produces nonsense — the root is its own parent. Also, a name like <code>"..."</code> is an ordinary directory, not a special token.',
    solution: `def simplify_path(path):
    stack = []
    for token in path.split('/'):
        if token == '' or token == '.':
            continue                 # repeated slashes and "stay put"
        if token == '..':
            if stack:                # the root is its own parent
                stack.pop()
        else:
            stack.append(token)      # note: "..." is an ordinary name
    return '/' + '/'.join(stack)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami's code pops unconditionally on \"..\". What does it do with the path \"/../\"?",
        options: [
          'It crashes (or silently corrupts state) — the root has no parent, so the pop must be guarded',
          'It correctly returns "/"',
          'It returns ".."',
          'It returns an empty string'
        ],
        correct: 0,
        explain: 'Going above the root is not an error in Unix, it is a no-op — <code>/..</code> is <code>/</code>. The guard encodes that rule. It is the same class of bug as popping an empty stack on a stray closing bracket, and both are caught by the same habit: never pop without checking.',
        hint: 'What is the parent directory of the root?'
      },
      {
        tag: 'TRANSFER',
        q: "Different trail, same tokens: Franky processes a sequence of build steps where \"undo\" reverses the last completed step and \"noop\" does nothing. What structure?",
        options: [
          'A stack of completed steps — undo pops if non-empty, noop is skipped, a real step pushes',
          'A queue of steps',
          'A counter of completed steps',
          'A set of step names'
        ],
        correct: 0,
        explain: 'Identical shape. A counter would tell you how many steps remain but not which, and a queue would undo the OLDEST step rather than the most recent — the wrong end entirely. "Undo the last one" is the signature of a stack.',
        hint: 'Which step does "undo" affect — the first or the most recent?'
      },
      {
        tag: 'TWEAK',
        q: "The path is now RELATIVE, so leading \"..\" segments must be preserved: \"a/../../b\" simplifies to \"../b\". What changes?",
        options: [
          'A ".." with nothing poppable must be pushed instead of ignored, since it can no longer be absorbed by a root',
          'Nothing; the same code works',
          'The stack must become a queue',
          'The path must be reversed first'
        ],
        correct: 0,
        explain: 'The no-op guard is a consequence of the path being absolute — the root absorbs any excess. Relative paths have no such floor, so an unmatched ".." is meaningful output. It is a good reminder that an edge-case rule usually encodes a fact about the domain, not just a defensive check.',
        hint: 'What absorbed the extra ".." in the absolute case, and does it exist here?'
      }
    ]
  };

  E['min-stack'] = {
    id: 'min-stack',
    epNumber: 98,
    title: 'The Scale That Remembers Its Lightest',
    arc: 'Jaya',
    patternId: 'monotonic-stack',
    scene: 'colosseum',
    leetcode: { name: 'Min Stack', number: 155, difficulty: 'Medium', url: 'https://leetcode.com/problems/min-stack/' },
    problem: 'Design a stack supporting push, pop, top and retrieving the minimum element, all in constant time.',
    example: 'push 3, push 1, push 4 → getMin is 1;  pop → getMin is still 1;  pop → getMin is 3',

    h: 200,
    props: [
      { id: 'v3', emoji: '⚖️', label: '3', x: 25, y: 30 },
      { id: 'v1', emoji: '⚖️', label: '1', x: 50, y: 30 },
      { id: 'v4', emoji: '⚖️', label: '4', x: 75, y: 30 }
    ],
    ledger: [
      { id: 'M1', x: 25, y: 72 },
      { id: 'M2', x: 50, y: 72 },
      { id: 'M3', x: 75, y: 72 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The treasure scale stacks weights, and at any moment we need the LIGHTEST one currently on it — instantly, not by looking through the pile.",
        p: { v3: 'lit', v1: 'lit', v4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Keep a variable holding the smallest. Update it on every push. Easy.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Until the smallest is popped off. Then what does that variable become? You would have to scan the whole pile to find out — and that is linear, not constant.",
        p: { v1: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So one variable can't survive a pop, because it holds no history.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then store the minimum AS OF each push, alongside the value. Push three: the minimum so far is three. Push one: the minimum so far is one. Push four: still one.",
        p: { M1: 'lit', M2: 'lit', M3: 'lit' }, l: { M1: 'min 3', M2: 'min 1', M3: 'min 1' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Now popping restores the previous minimum for free — it's sitting right there under the one we removed.",
        p: { v4: 'good', M3: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Every operation is constant time, and the price is one extra number per element — O(n) space rather than O(1). That trade is the answer, and stating it is part of the answer.",
        p: { M1: 'good', M2: 'good' }, l: { M2: 'pop → min 3' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "You could keep a second stack that only grows when a new minimum arrives, which saves space when the values mostly increase.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "You can — but then pop must compare before removing from it, and equal values need care or you drop a minimum that is still on the scale. The paired version is harder to get wrong.",
        sfx: 'gong'
      }
    ],

    insight: 'A single running extremum cannot survive a removal, because it stores no history — record the minimum as of each push so a pop restores the previous one for free.',
    complexity: '<b>Time O(1)</b> for every operation. <b>Space O(n)</b> — one extra number per element. The "only push on a new minimum" variant saves space on average but needs care with duplicates.',
    pitfall: 'Keeping one <code>min</code> variable and trying to repair it on pop, which is O(n). In the two-stack variant, using a strict <code>&lt;</code> when pushing minima drops a duplicate minimum that is still in the stack.',
    solution: `class MinStack:
    def __init__(self):
        # Each entry carries the minimum as of its own push, so popping
        # restores the previous minimum with no scanning.
        self.stack = []

    def push(self, val):
        cur_min = val if not self.stack else min(val, self.stack[-1][1])
        self.stack.append((val, cur_min))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def getMin(self):
        return self.stack[-1][1]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp keeps a single <code>self.min</code> updated on push. After push 5, push 2, push 8, pop, pop — what does getMin return, and what should it?",
        options: [
          'It returns 2 but should return 5 — the variable was never repaired when 2 left the stack',
          'It returns 5, correctly',
          'It returns 8',
          'It crashes'
        ],
        correct: 0,
        explain: 'Popping 8 leaves min untouched at 2, and popping 2 has no way to know what the previous minimum was. Repairing it means rescanning, which breaks the O(1) requirement — the history has to be stored, not recomputed.',
        hint: 'When the minimum itself is popped, where would the previous minimum come from?'
      },
      {
        tag: 'TRANSFER',
        q: "Different scale, same trick: Chopper needs a queue that reports its minimum in O(1), with values entering at one end and leaving at the other. Does the paired-value trick work?",
        options: [
          'No — the paired minimum assumes removals happen at the same end as insertions; a queue needs a monotonic deque instead',
          'Yes, identically',
          'Yes, if the pairs are stored in reverse',
          'No, and it is impossible in O(1)'
        ],
        correct: 0,
        explain: 'The pairing works because "the minimum as of my push" is exactly "the minimum of everything below me", which for a stack is everything that outlives me. In a queue, removals come from the far end, so that relationship breaks. The right tool is a monotonic deque — the same structure as sliding-window maximum.',
        hint: 'For a stack, which elements outlive a given element? Is that still true for a queue?'
      },
      {
        tag: 'TWEAK',
        q: "The two-stack variant pushes onto the min-stack only when the new value is strictly less than its current top. What breaks on push 2, push 2, pop, getMin?",
        options: [
          'The second 2 was never recorded, so the pop removes the only recorded 2 and getMin loses a minimum still on the stack',
          'Nothing; strict comparison is correct',
          'getMin returns 2 when it should return nothing',
          'The main stack and min stack fall out of sync in length, which is always a bug'
        ],
        correct: 0,
        explain: 'With duplicates of the minimum, either push on <code>&lt;=</code>, or pop from the min-stack only when the popped value equals its top. Note that unequal lengths are the whole point of this variant, so that alone is not the bug — the duplicate handling is.',
        hint: 'How many times is the value 2 recorded, and how many times is it removed?'
      }
    ]
  };

  E['evaluate-rpn'] = {
    id: 'evaluate-rpn',
    epNumber: 99,
    title: 'The Battle Log Written Backwards',
    arc: 'Jaya',
    patternId: 'monotonic-stack',
    scene: 'colosseum',
    leetcode: { name: 'Evaluate Reverse Polish Notation', number: 150, difficulty: 'Medium', url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/' },
    problem: 'Evaluate an arithmetic expression in Reverse Polish Notation, where each operator follows its two operands.',
    example: 'tokens = ["2","1","+","3","*"]  →  9      ((2 + 1) * 3)',

    h: 200,
    props: [
      { id: 't2', emoji: '2️⃣', label: '2', x: 16, y: 32 },
      { id: 't1', emoji: '1️⃣', label: '1', x: 36, y: 32 },
      { id: 'tp', emoji: '➕', label: '+', x: 56, y: 32 },
      { id: 't3', emoji: '3️⃣', label: '3', x: 76, y: 32 },
      { id: 'tm', emoji: '✖️', label: '*', x: 94, y: 32 }
    ],
    ledger: [
      { id: 'ST', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The old battle log writes the operation AFTER the two things it acts on. Two, one, add. Then three, multiply. No brackets anywhere.",
        p: { t2: 'lit', t1: 'lit', tp: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why there are no brackets — the order is unambiguous without them. Read left to right: a number goes onto a stack, and an operator takes the top two, combines them, and pushes the result back.",
        p: { ST: 'lit' }, l: { ST: 'stack of values' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Push two. Push one. Then add — pop both, push three. Then push three. Then multiply — pop both, push nine.",
        p: { t2: 'good', t1: 'good', tp: 'good', t3: 'good', tm: 'good' }, l: { ST: '9 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One value left at the end, and that's the answer. Neat.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is one trap and it is entirely about order. The SECOND value you pop is the LEFT operand. Addition and multiplication hide the mistake completely; subtraction and division expose it at once.",
        p: { tp: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Because the left operand went on first, so it's underneath. Pop b, then pop a, then compute a minus b.",
        p: { tp: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And division here truncates toward zero, which is not the same as flooring. Minus seven divided by two is minus three, not minus four — a distinction Python's own operator gets 'wrong' for this problem.",
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So I have to write the truncation myself rather than reach for the built-in.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "In Python, yes — <code>int(a / b)</code> truncates, while <code>a // b</code> floors. Two characters apart, and only wrong on negative results, which is exactly the kind of test a judge includes.",
        sfx: 'gong'
      }
    ],

    insight: 'Postfix notation needs no brackets because the stack encodes the grouping — but the operand order is reversed on the way out, so the second value popped is always the left one.',
    complexity: '<b>Time O(n)</b> — one pass, each token pushed or popped once. <b>Space O(n)</b> for the stack.',
    pitfall: 'Computing <code>b - a</code> instead of <code>a - b</code>, which is invisible under addition and multiplication. And using floor division for negative results when the problem specifies truncation toward zero.',
    solution: `def eval_rpn(tokens):
    stack = []
    for tok in tokens:
        if tok in ('+', '-', '*', '/'):
            b = stack.pop()          # second operand — popped FIRST
            a = stack.pop()          # first operand
            if tok == '+':
                stack.append(a + b)
            elif tok == '-':
                stack.append(a - b)
            elif tok == '*':
                stack.append(a * b)
            else:
                stack.append(int(a / b))   # truncate toward zero, not floor
        else:
            stack.append(int(tok))
    return stack[0]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp writes <code>a = stack.pop(); b = stack.pop()</code> then computes <code>a - b</code>. On [\"5\",\"2\",\"-\"] what does he get?",
        options: [
          '-3, when the answer is 3 — he has the operands the wrong way round',
          '3, correctly',
          '7',
          'It crashes'
        ],
        correct: 0,
        explain: '5 goes on first, then 2, so 2 is on top. Popping into <code>a</code> gets 2 and into <code>b</code> gets 5, giving 2 − 5. The bug is invisible on <code>+</code> and <code>*</code>, so it survives casual testing and fails on the first subtraction in the test suite.',
        hint: 'Which operand was pushed first, and where does that leave it in the stack?'
      },
      {
        tag: 'TWEAK',
        q: "The division \"-7\" \"2\" \"/\" must truncate toward zero. In Python, which expression is right?",
        options: [
          'int(-7 / 2), which gives -3',
          '-7 // 2, which gives -3',
          '-7 // 2, which gives -4 and is correct',
          'round(-7 / 2), which gives -4'
        ],
        correct: 0,
        explain: '<code>//</code> floors, so −7 // 2 is −4; <code>int()</code> on the float truncates toward zero, giving −3. They agree on positives, which is why this only ever fails on negative results. Being able to name the difference between flooring and truncation is worth a mark on its own.',
        hint: 'Floor moves toward negative infinity. Truncate moves toward zero. Where do they disagree?'
      },
      {
        tag: 'TRANSFER',
        q: "Different log, same stack: Chopper must convert an ordinary infix expression with brackets into this postfix form. What does the stack hold now?",
        options: [
          'Operators and brackets, popped to the output when a lower-precedence operator arrives — the shunting-yard algorithm',
          'Operands, exactly as in evaluation',
          'Nothing; conversion needs no stack',
          'The characters of the input in reverse'
        ],
        correct: 0,
        explain: 'Evaluation stacks values; conversion stacks operators. Both are stacks because both are about deferring work until its partner arrives — a closing bracket or a lower-precedence operator is what resolves the deferral. Recognising that shared shape is the point.',
        hint: 'In infix, what has to WAIT before it can be emitted?'
      }
    ]
  };

  E['basic-calculator'] = {
    id: 'basic-calculator',
    epNumber: 100,
    title: 'The Ledger of Nested Debts',
    arc: 'Jaya',
    patternId: 'monotonic-stack',
    scene: 'colosseum',
    leetcode: { name: 'Basic Calculator', number: 224, difficulty: 'Hard', url: 'https://leetcode.com/problems/basic-calculator/' },
    problem: 'Evaluate a string expression containing non-negative integers, +, -, brackets and spaces, without using any built-in expression evaluator.',
    example: '"(1+(4+5+2)-3)+(6+8)"  →  23',

    h: 200,
    props: [
      { id: 'op', emoji: '(', label: 'open', x: 20, y: 30 },
      { id: 'ac', emoji: '🧮', label: 'running total', x: 50, y: 30 },
      { id: 'sg', emoji: '±', label: 'current sign', x: 80, y: 30 },
      { id: 'cl', emoji: ')', label: 'close', x: 50, y: 62 }
    ],
    ledger: [
      { id: 'SK', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Cricket's debts are written in nested brackets, with plus and minus only — but a minus in front of a bracket flips everything inside it.",
        p: { op: 'lit', cl: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So we need to remember, when we go into a bracket, what was outside it. That's a stack again — but of what, exactly?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Of two things: the total accumulated so far, and the sign that applies to the bracket we are about to enter. Push both, then start fresh inside.",
        p: { ac: 'lit', sg: 'lit', SK: 'lit' }, l: { SK: 'push (total, sign)' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And on the closing bracket, the inner total is finished — multiply it by the saved sign and add it back to the saved total.",
        p: { cl: 'good' }, l: { SK: 'total = inner*sign + outer' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Everything else is a single left-to-right sweep. A digit extends the number being read. A plus sets the sign to one, a minus to minus one. A number, once complete, is added with that sign.",
        p: { ac: 'good', sg: 'good' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Numbers can be more than one digit, so I have to keep building until the digits stop rather than reading one character as one number.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the last number has no operator after it, so it must be added once the sweep ends — the same 'flush what is left' step as every other one-pass parser.",
        p: { ac: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "There's no multiplication here at all, which is why a sign and a running total are enough. Precedence would change everything.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "With multiplication and division you would need to hold the previous operand back so it can be combined before adding — that is Basic Calculator II, and it is a genuinely different shape.",
        p: { SK: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'With only + and − a running total and a sign suffice; brackets are handled by pushing the outside context and starting fresh, then folding the inner result back with its saved sign.',
    complexity: '<b>Time O(n)</b> — one pass over the characters. <b>Space O(n)</b> for the stack, proportional to the bracket nesting depth.',
    pitfall: 'Reading multi-digit numbers one character at a time. And forgetting to add the final number after the loop, since nothing follows it to trigger the add.',
    solution: `def calculate(s):
    total = 0
    sign = 1
    num = 0
    stack = []

    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)       # multi-digit numbers
        elif ch in '+-':
            total += sign * num            # the previous number is complete
            num = 0
            sign = 1 if ch == '+' else -1
        elif ch == '(':
            stack.append((total, sign))    # save the outside context
            total, sign = 0, 1             # start fresh inside
        elif ch == ')':
            total += sign * num
            num = 0
            prev_total, prev_sign = stack.pop()
            total = prev_total + prev_sign * total
    return total + sign * num              # flush the final number`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami's loop adds each number when it meets the next operator, and returns <code>total</code> at the end. What does she get for \"1+2\"?",
        options: [
          '1 — the final 2 was never added, because nothing followed it',
          '3, correctly',
          '0',
          'It crashes'
        ],
        correct: 0,
        explain: 'Every number is added when its successor operator arrives, so the last one has no trigger. The fix is the same flush-after-the-loop step as emitting the final range in a sweep or the final carry in an addition — leftover state at loop exit is part of the answer.',
        hint: 'What triggers the addition of a number, and does that ever happen for the last one?'
      },
      {
        tag: 'TWEAK',
        q: "The expression now includes * and / with normal precedence, but no brackets. Is a sign and a running total still enough?",
        options: [
          'No — you must hold the previous operand back so * and / can combine with it before it is added to the total',
          'Yes, unchanged',
          'Yes, with a second sign variable',
          'No, and it requires a full parser'
        ],
        correct: 0,
        explain: 'Higher precedence means the previous operand is not yet final when you meet it — it might be about to be multiplied. Keeping a "pending" value and only committing it to the total when a + or − arrives handles it in one pass. That is Basic Calculator II, and it is why this problem restricts itself to + and −.',
        hint: 'In "2+3*4", is the 3 ready to be added to the total when you read it?'
      },
      {
        tag: 'TRANSFER',
        q: "Different ledger, same nesting: Franky decodes strings like \"3[a2[c]]\" into \"accaccacc\". What goes on the stack at each open bracket?",
        options: [
          'The string built so far and the repeat count for the bracket about to open',
          'Only the repeat count',
          'Only the string built so far',
          'Each character of the input'
        ],
        correct: 0,
        explain: 'Exactly the same manoeuvre as the calculator: save the outside context, start fresh inside, and fold the inner result back on the closing bracket using the saved multiplier. That is Decode String, LeetCode 394 — different domain, identical skeleton.',
        hint: 'What two things does the closing bracket need in order to fold the inner result back?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
