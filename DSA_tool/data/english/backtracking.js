window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['backtracking'] = {
  id: 'backtracking',
  title: 'Backtracking',
  titleNe: 'Step forward; if you get stuck, step back',
  intro: 'choose → explore → un-choose — the three-step dance behind every subset, permutation, and puzzle solver',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“Generate all subsets / permutations / combinations” — anything that wants <b>every</b> valid arrangement.',
        'Puzzle solvers: N-Queens, Sudoku, word search — try a choice, and undo it if it leads nowhere.',
        'Exponential by nature — the art is <b>pruning</b> early, not avoiding the exponential.',
      ],
      narration: "Now Backtracking — the name sounds hard, but it's something we've done since childhood. Imagine you're in a maze with no map. What do you do? You pick a path and move forward. Hit a wall, or a place you've already been? You step back and pick another path. That's backtracking — choose, step forward, and if you get stuck, erase that choice and go back, then choose again. Subsets, permutations, N-Queens, Sudoku — at the heart of all of them is this three-step dance. It's exponential by nature — because you must consider all possibilities — so the art isn't removing the exponential, it's spotting and cutting the useless paths early, which is called pruning.",
    },
    {
      heading: 'Story: The three-step dance',
      bullets: [
        '<b>Choose</b>: add a candidate to the current path.',
        '<b>Explore</b>: recurse — go deeper as if this choice was final.',
        '<b>Un-choose (backtrack)</b>: remove it before trying the next candidate — the path must be clean for siblings.',
      ],
      narration: "Let's look at the three-step dance up close. First — choose — add a new spot to the current path. Second — explore — recurse deeper as if this choice were final. Third, and the most-forgotten step — un-choose — put things back exactly as they were before you added, before trying the next sibling choice. Why is this third step essential? Think of arranging your friends in an order for a group photo. You try one order, the photo is taken (the recursion ends) — now, before you try another order, if the earlier person is still standing in line, the next combination won't come out right. So when you step back, always remove that one addition — keep the path clean for the siblings. That single discipline is what makes backtracking correct.",
    },
    {
      heading: 'Mnemonic',
      big: '“Choose, step forward, and if stuck step back — keep the path clean.”',
      bullets: [
        'The path/current state is <b>mutated in place</b> — append then pop, not new lists every call.',
        'A base case saves (a copy of) the path when it is complete or valid.',
        'Pruning = check the constraint <i>before</i> recursing deeper, not after.',
      ],
      narration: "The hook: choose, step forward, and if you get stuck step back — keep the path clean. In practice remember one technical point — you usually append and pop the same path list over and over, rather than building a new list each call — this saves memory. When you reach a base case — the path is complete or the condition is met — add a copy of the path to the answer; if you store it directly without copying, that same reference later shows up emptied. And what is pruning? Checking whether a constraint breaks before you go deeper, not regretting it after. Like in Sudoku — before placing a digit, check whether it fits the row, column, and box; checking after placing wastes a lot of time.",
    },
    {
      heading: 'Python template',
      code: '# Subsets — the cleanest skeleton\ndef subsets(nums):\n    res, path = [], []\n    def backtrack(start):\n        res.append(path[:])              # save a snapshot (copy)\n        for i in range(start, len(nums)):\n            path.append(nums[i])          # choose\n            backtrack(i + 1)               # step forward\n            path.pop()                     # step back\n    backtrack(0)\n    return res\n\n# Permutations — the "used" set variant\ndef permutations(nums):\n    res, path, used = [], [], [False] * len(nums)\n    def backtrack():\n        if len(path) == len(nums):\n            res.append(path[:])\n            return\n        for i in range(len(nums)):\n            if used[i]:\n                continue\n            used[i] = True\n            path.append(nums[i])\n            backtrack()\n            path.pop()\n            used[i] = False\n    backtrack()\n    return res',
      narration: "Two templates — both have the same shape, differing only in what to leave out and how much. In Subsets, every node is itself a valid answer — so res-dot-append happens at the very start of each call — then the for loop chooses only forward, from start onward, to avoid repeating earlier ones. In Permutations, a different order counts as a new answer, so a used array tracks whether each number is currently in the path, and the base case comes only when the path is completely filled. Both repeat the same shape — append, recurse, pop — those three lines are the entire grammar of backtracking.",
    },
    {
      heading: 'Watch out! Pitfalls and where it shows up',
      bullets: [
        'Forgetting to pop/undo → the path leaks into sibling branches → silently wrong answers.',
        'Duplicates in input (e.g. Subsets II): sort first, then skip <code>nums[i] == nums[i-1]</code> at the same recursion depth.',
        'N-Queens / Sudoku: track constraints (columns, diagonals) with sets for O(1) checks, not re-scanning the board.',
        'If overlapping subproblems appear (same state reached multiple ways), you may actually want DP, not backtracking.',
      ],
      narration: "Final warnings. The most common mistake — forgetting to pop — the path leaks into another branch and the answer comes out quietly wrong, with no error at all — which makes it hard to debug, so always check. When the input has duplicates — like Subsets Two — sort first, then at the same depth skip a value equal to the previous one, or the same subset repeats again and again. In puzzles like N-Queens and Sudoku, build the habit of tracking constraints like columns and diagonals in sets for O(1) checks, instead of re-scanning the whole board each time. And a deeper insight — if you notice the same state being reached over and over by different paths, that may be a sign for dynamic programming rather than backtracking — which you'll meet in the next module.",
    },
  ],
};
