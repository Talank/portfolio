/* Little Garden — grids and index arithmetic.
   These have no single pattern page on this site, so they carry no patternId;
   the grid IS the pattern, and the skill is getting the index formula right.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['valid-sudoku'] = {
    id: 'valid-sudoku',
    epNumber: 91,
    title: 'The Giants\' Drinking Grid',
    arc: 'Little Garden',
    scene: 'forest',
    leetcode: { name: 'Valid Sudoku', number: 36, difficulty: 'Medium', url: 'https://leetcode.com/problems/valid-sudoku/' },
    problem: 'Determine whether a 9 x 9 Sudoku board is valid. Only the filled cells need checking: each row, each column and each of the nine 3 x 3 boxes must contain no repeated digit.',
    example: 'A board is valid if no row, column or box repeats a digit — it need not be solvable.',

    h: 210,
    props: [
      { id: 'row', emoji: '➡️', label: '9 rows', x: 22, y: 32 },
      { id: 'col', emoji: '⬇️', label: '9 columns', x: 50, y: 32 },
      { id: 'box', emoji: '🔲', label: '9 boxes', x: 78, y: 32 },
      { id: 'idx', emoji: '🧮', label: '(r/3)*3 + c/3', x: 50, y: 66 }
    ],
    ledger: [
      { id: 'V', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Dorry and Brogy have carved a duelling grid into the rock — nine by nine, split into nine blocks. A digit may not repeat in any row, any column, or any block.",
        p: { row: 'lit', col: 'lit', box: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Three separate checks, then? Scan all the rows, then all the columns, then all the blocks. Three passes over eighty-one cells.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Or one pass with three sets of records. Every cell belongs to exactly one row, one column and one block, so as you visit it you can file it in all three at once.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Row and column are easy — they're the coordinates. But which block is a cell in?",
        p: { idx: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Integer division collapses a coordinate to its band: rows zero, one and two all divide to zero. Multiply the row band by three and add the column band, and the nine blocks number themselves in reading order.",
        p: { idx: 'good' }, l: { V: 'block = (r//3)*3 + c//3' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So cell at row four, column seven: four over three is one, seven over three is two. One times three plus two is five. Block five.",
        p: { box: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then it is just three arrays of nine sets. Visit a filled cell, and if the digit is already recorded in any of its three sets, the grid is invalid. Otherwise record it in all three and move on.",
        p: { row: 'good', col: 'good' }, l: { V: 'one pass, 3 sets ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Empty cells are simply skipped. We're asked whether the board is valid, not whether it can be finished.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "That distinction matters. A board can be perfectly valid and still have no solution at all. Nobody asked us to solve it.",
        sfx: 'gong'
      }
    ],

    insight: 'Get the index formula right on paper first — integer division gives the band, so (r/3)*3 + (c/3) numbers the boxes in reading order and all three constraints collapse into a single pass.',
    complexity: '<b>Time O(81)</b>, i.e. constant for a fixed 9 x 9 board — one visit per cell. <b>Space O(81)</b> for the 27 sets. Three separate passes are the same complexity but three times the traversal.',
    pitfall: 'Using modulo instead of division for the box index, which gives the offset within a band rather than the band itself. Also, checking solvability rather than validity — the problem only asks about the filled cells.',
    solution: `def is_valid_sudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]

    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == '.':
                continue                      # only filled cells matter
            b = (r // 3) * 3 + (c // 3)       # division gives the band
            if v in rows[r] or v in cols[c] or v in boxes[b]:
                return False
            rows[r].add(v); cols[c].add(v); boxes[b].add(v)
    return True`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami writes the box index as <code>(r % 3) * 3 + (c % 3)</code>. Which cells does she wrongly place in the same box?",
        options: [
          'Cells three apart, like (0,0) and (3,3) — modulo gives the position inside a band, not which band',
          'Only cells in the same row',
          'None; the two formulas are equivalent',
          'Only the cells on the diagonal'
        ],
        correct: 0,
        explain: 'r % 3 cycles 0,1,2,0,1,2 down the whole grid, so rows 0, 3 and 6 all map to band 0 — cells from three different boxes get pooled together. Division is what collapses a coordinate to its band; modulo is what locates it inside one.',
        hint: 'Write out r // 3 and r % 3 for r = 0 through 8 and compare the two sequences.'
      },
      {
        tag: 'TRANSFER',
        q: "Different grid: Franky checks a 16 x 16 panel layout split into 4 x 4 blocks. What is the block index for a panel at (r, c)?",
        options: [
          '(r // 4) * 4 + (c // 4)',
          '(r // 4) * 16 + (c // 4)',
          '(r % 4) * 4 + (c % 4)',
          '(r + c) // 4'
        ],
        correct: 0,
        explain: 'The formula generalises to any k x k blocking: divide each coordinate by the block size to get its band, then lay the bands out in reading order by multiplying the row band by the number of blocks per row — which is also k here, since the grid is k² wide.',
        hint: 'How many blocks are there per row on a 16-wide grid with 4-wide blocks?'
      },
      {
        tag: 'TWEAK',
        q: "The task changes to: is this board SOLVABLE? Is the one-pass check enough?",
        options: [
          'No — validity is necessary but not sufficient; solvability needs a backtracking search',
          'Yes, a valid board is always solvable',
          'Yes, provided at least 17 cells are filled',
          'No, but it can be decided by counting digits'
        ],
        correct: 0,
        explain: 'Validity says nothing contradicts yet; solvability says a completion exists. A board can be valid and still be a dead end, and deciding it means actually searching — Sudoku Solver, LeetCode 37. Noticing that these are different questions is exactly what this problem is checking.',
        hint: 'Can a board with no current repeats still have no legal completion?'
      }
    ]
  };

  E['spiral-matrix'] = {
    id: 'spiral-matrix',
    epNumber: 92,
    title: 'The Path Around the Dinosaur',
    arc: 'Little Garden',
    scene: 'forest',
    leetcode: { name: 'Spiral Matrix', number: 54, difficulty: 'Medium', url: 'https://leetcode.com/problems/spiral-matrix/' },
    problem: 'Given an m x n matrix, return all its elements in spiral order — right along the top, down the right side, left along the bottom, up the left side, then inward.',
    example: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]  →  [1,2,3,6,9,8,7,4,5]',

    h: 210,
    props: [
      { id: 'top', emoji: '⬆️', label: 'top', x: 50, y: 20 },
      { id: 'rgt', emoji: '➡️', label: 'right', x: 82, y: 46 },
      { id: 'bot', emoji: '⬇️', label: 'bottom', x: 50, y: 70 },
      { id: 'lft', emoji: '⬅️', label: 'left', x: 18, y: 46 }
    ],
    ledger: [
      { id: 'G', x: 50, y: 90 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Circling the sleeping dinosaur — all the way along one side, then turn, then along the next, tightening the loop each time round until there's nothing left in the middle.",
        p: { top: 'lit', rgt: 'lit', bot: 'lit', lft: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So track four walls — top, bottom, left, right — and pull each one inward after you walk it.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Walk the top row left to right, then lower the top wall. Walk the right column downward, then pull the right wall in. Walk the bottom row backwards, raise the bottom wall. Walk the left column upward, push the left wall in. Repeat.",
        p: { top: 'good', rgt: 'good' }, l: { G: 'top → right → bottom → left' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Nine cells for a three by three. One two three, then six nine, then eight seven, then four, then five in the middle.",
        p: { bot: 'good', lft: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "But what about a matrix that's one row tall? You'd walk the top row, then try to walk the bottom row backwards — which is the same row again.",
        p: { bot: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the whole difficulty of this problem. After the top row and the right column are consumed, the walls may already have crossed. So before the bottom pass, re-check that top is still at or above bottom; before the left pass, that left is still at or before right.",
        p: { bot: 'dim' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two extra checks, and only on the second two passes. The first two are always safe because the loop condition just proved it.",
        p: { bot: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Test it on a single row and a single column before you submit. Those two shapes catch this bug immediately, and a square matrix never will.",
        p: { top: 'good', rgt: 'good', bot: 'good', lft: 'good' }, l: { G: '9 cells, none twice ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "The alternative is counting: stop as soon as you've emitted as many cells as the matrix holds. Same effect, and some people find it easier to argue about.",
        sfx: 'gong'
      }
    ],

    insight: 'Four shrinking walls, walked in order — and the second two passes each need a re-check, because the walls can cross partway through a lap on a non-square matrix.',
    complexity: '<b>Time O(m · n)</b> — every cell emitted exactly once. <b>Space O(1)</b> beyond the output.',
    pitfall: 'Emitting the middle row or column twice on a matrix that is not square. The guard is a re-check of <code>top &lt;= bottom</code> before the bottom pass and <code>left &lt;= right</code> before the left pass — a 1 x 5 or 3 x 4 input exposes it instantly.',
    solution: `def spiral_order(matrix):
    if not matrix or not matrix[0]:
        return []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    out = []

    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            out.append(matrix[r][right])
        right -= 1

        # The walls may have crossed during the two passes above.
        if top <= bottom:
            for c in range(right, left - 1, -1):
                out.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                out.append(matrix[r][left])
            left += 1
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp omits both re-checks. On the 1 x 4 matrix [[1,2,3,4]], what does his code emit?",
        options: [
          '1,2,3,4 and then 3,2,1 again — the bottom pass re-walks the only row backwards',
          '1,2,3,4, correctly',
          '1,2,3,4,4',
          'Nothing, because the loop never starts'
        ],
        correct: 0,
        explain: 'The top pass emits the whole row and lifts top to 1, past bottom. The right pass emits nothing since its range is empty. The bottom pass then walks row 0 backwards, duplicating everything but the last cell. Single-row and single-column inputs are the free test cases here.',
        hint: 'Trace top and bottom after the first pass on a matrix with one row.'
      },
      {
        tag: 'TRANSFER',
        q: "Different task, same walls: Nami must FILL an n x n matrix with 1 to n² in spiral order. What changes?",
        options: [
          'Nothing structural — the same four shrinking walls, writing a counter instead of reading a cell',
          'The walls must shrink in the opposite order',
          'It requires a visited matrix',
          'It must be built from the centre outward'
        ],
        correct: 0,
        explain: 'Reading and writing along the same path are the same traversal. That is Spiral Matrix II, and because it is always square, the re-checks are less critical — though leaving them in costs nothing and keeps one implementation for both.',
        hint: 'Is the order of cells visited any different when you are writing rather than reading?'
      },
      {
        tag: 'TWEAK',
        q: "Robin prefers to bound the loop by a count of emitted cells instead of by the wall conditions. Is that correct?",
        options: [
          'Yes — stopping once m·n cells are emitted prevents any duplicate, provided each inner pass also respects the count',
          'No, it cannot handle non-square matrices',
          'No, the count is unknown until the end',
          'Yes, and it removes the need for walls entirely'
        ],
        correct: 0,
        explain: 'A count is a legitimate alternative formulation of the same guard, and some find it easier to reason about. It does not remove the walls — you still need them to know where to turn — and the check must be inside each pass, not merely at the top of the loop.',
        hint: 'You know exactly how many cells exist. Can that number bound the traversal?'
      }
    ]
  };

  E['rotate-image'] = {
    id: 'rotate-image',
    epNumber: 93,
    title: 'Turning the Map a Quarter Turn',
    arc: 'Little Garden',
    scene: 'forest',
    leetcode: { name: 'Rotate Image', number: 48, difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-image/' },
    problem: 'Rotate an n x n matrix 90 degrees clockwise, in place, without allocating another matrix.',
    example: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]  →  [[7,4,1],[8,5,2],[9,6,3]]',

    h: 210,
    props: [
      { id: 'orig', emoji: '🗺️', label: 'original', x: 20, y: 34 },
      { id: 'tran', emoji: '↘️', label: 'transposed', x: 50, y: 34 },
      { id: 'fin', emoji: '🔄', label: 'rows reversed', x: 80, y: 34 }
    ],
    ledger: [
      { id: 'R', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The Log Pose reading means the chart has to be turned a quarter turn clockwise. And we only have the one sheet of paper — no copying it out.",
        p: { orig: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Move each cell to where it ends up? Cell at row zero column zero goes to row zero column two, which pushes that one to row two column two...",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the four-cycle version, and it is correct but fiddly — you rotate four cells at a time, layer by layer, and the loop bounds are easy to get wrong. There is a much easier route.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "First flip the chart about its main diagonal — swap the cell at row r column c with the one at row c column r. That turns every row into a column.",
        p: { tran: 'good' }, l: { R: 'transpose' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And then simply reverse each row left to right. Two easy operations instead of one hard one.",
        p: { fin: 'good' }, l: { R: 'transpose, then reverse rows ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "How would I ever remember which order those go in?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Do not remember it — derive it. Write a two by two with four distinct values, do it both ways, and see which lands on the answer. It takes ten seconds and it settles the question permanently.",
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And if the Log Pose swings the other way — what turns the chart anti-clockwise?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Transpose, then reverse each COLUMN instead. Or equivalently, reverse the rows first and then transpose. Same two moves, different pairing.",
        p: { orig: 'dim', tran: 'good', fin: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "One trap in the transpose itself: if I loop over every pair of coordinates, I swap each pair twice and end up exactly where I started.",
        p: { tran: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So the inner loop starts at the outer index, touching only one side of the diagonal. That is the difference between a transpose and an expensive way of doing nothing.",
        p: { tran: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'A quarter turn is two simple whole-matrix operations rather than one intricate one: transpose, then reverse each row — and the order is worth deriving on a 2 x 2 rather than memorising.',
    complexity: '<b>Time O(n²)</b> — every cell touched a constant number of times. <b>Space O(1)</b>, genuinely in place. The layer-by-layer four-cycle rotation is the same complexity with far more index arithmetic.',
    pitfall: 'Transposing with a full double loop, which swaps every pair twice and leaves the matrix unchanged — the inner loop must start at the outer index. And applying the two steps in the wrong order, which produces a counter-clockwise turn.',
    solution: `def rotate(matrix):
    n = len(matrix)

    # Transpose: only one side of the diagonal, or every swap happens twice.
    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]

    # Then mirror each row left-to-right.
    for row in matrix:
        row.reverse()`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp writes the transpose as <code>for r in range(n): for c in range(n):</code> with the swap inside. What does the matrix look like afterwards?",
        options: [
          'Exactly as it started — every pair is swapped once from each side, undoing itself',
          'Correctly transposed',
          'Transposed but with the diagonal wrong',
          'Reversed rather than transposed'
        ],
        correct: 0,
        explain: 'The pair (1,2) and (2,1) each trigger the swap, so the second undoes the first. Starting the inner loop at r+1 visits each off-diagonal pair exactly once and skips the diagonal, which never needs swapping anyway.',
        hint: 'How many times does the loop reach the pair {(1,2), (2,1)}?'
      },
      {
        tag: 'TWEAK',
        q: "Nami needs the chart turned 90 degrees ANTI-clockwise instead. What is the smallest change?",
        options: [
          'Transpose, then reverse each column instead of each row',
          'Transpose twice',
          'Reverse each row, then reverse each column',
          'Run the clockwise rotation three times'
        ],
        correct: 0,
        explain: 'Mirroring the other axis after the transpose gives the other direction. Running the clockwise version three times also works and is a fine thing to say out loud, but it costs three passes for what one mirror achieves. Transposing twice is the identity.',
        hint: 'The transpose is shared. Which mirror comes after it?'
      },
      {
        tag: 'TRANSFER',
        q: "Different sheet: Franky must flip a blueprint upside down (180 degrees) in place. What is the cheapest pair of moves?",
        options: [
          'Reverse the order of the rows, then reverse each row',
          'Transpose, then reverse each row',
          'Transpose twice',
          'Reverse each column only'
        ],
        correct: 0,
        explain: 'A 180-degree turn is a horizontal mirror composed with a vertical one, and neither needs a transpose since the shape does not change. It also works on non-square matrices, which the 90-degree in-place rotation does not — a nice illustration that the transpose is what forces squareness.',
        hint: 'A half turn is two mirrors. Does either of them change the matrix\'s dimensions?'
      }
    ]
  };

  E['set-matrix-zeroes'] = {
    id: 'set-matrix-zeroes',
    epNumber: 94,
    title: 'The Rows and Columns That Burned',
    arc: 'Little Garden',
    scene: 'forest',
    leetcode: { name: 'Set Matrix Zeroes', number: 73, difficulty: 'Medium', url: 'https://leetcode.com/problems/set-matrix-zeroes/' },
    problem: 'Given an m x n matrix, if an element is 0, set its entire row and column to 0. Do it in place, ideally with O(1) extra space.',
    example: 'matrix = [[1,1,1],[1,0,1],[1,1,1]]  →  [[1,0,1],[0,0,0],[1,0,1]]',

    h: 210,
    props: [
      { id: 'z', emoji: '🔥', label: 'a zero here', x: 50, y: 30 },
      { id: 'r0', emoji: '📏', label: 'first row = markers', x: 30, y: 60 },
      { id: 'c0', emoji: '📏', label: 'first col = markers', x: 72, y: 60 }
    ],
    ledger: [
      { id: 'F', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Wherever a fire has started on the map, the whole row and the whole column burn. Mark them all — but we can't afford a second map to work on.",
        p: { z: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Easy — walk the map, and whenever I find a fire, zero out its row and column right away.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And then you meet one of the zeroes you just wrote, and treat it as a new fire. The burning spreads until the entire map is black. Zeroing as you go is the trap here.",
        p: { z: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So record first, act second. Two sets — which rows burn, which columns burn — then a second pass to apply them.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is correct and costs O(m + n) space, which is a perfectly good answer. But the follow-up asks for constant, and the map can hold its own notes: use the first row and first column as the marker strips.",
        p: { r0: 'lit', c0: 'lit' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So a fire at row three column five writes a zero into row zero column five, and row three column zero. The marks live inside the map.",
        p: { r0: 'good', c0: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "With one complication: the first row and first column are both markers AND data. So before anything else, record separately whether each of them originally contained a zero.",
        p: { F: 'lit' }, l: { F: 'two flags first' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Then apply the marks to the interior, and only at the very end use the two saved flags to burn the first row and first column themselves.",
        p: { z: 'good', F: 'good' }, l: { F: 'apply them last ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Order matters twice over — record before acting, and do the marker strips last so we don't destroy the notes while reading them.",
        sfx: 'gong'
      }
    ],

    insight: 'Record first, act second — and when constant space is demanded, the structure itself can hold the bookkeeping, provided you separately preserve whatever the bookkeeping overwrites.',
    complexity: '<b>Time O(m · n)</b> — a constant number of passes. <b>Space O(1)</b> using the first row and column as markers, or O(m + n) with two explicit sets. Copying the matrix is O(m · n) space.',
    pitfall: 'Zeroing rows and columns during the first pass, which makes written zeroes indistinguishable from original ones and blackens the whole matrix. And forgetting the two flags for the marker strips, so the first row and column are wrong.',
    solution: `def set_zeroes(matrix):
    rows, cols = len(matrix), len(matrix[0])
    # The marker strips are also data — remember their original state first.
    first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_zero = any(matrix[r][0] == 0 for r in range(rows))

    # Record: a zero at (r, c) marks row r and column c in the strips.
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0

    # Act on the interior, reading the marks.
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    # Finally the strips themselves, using the saved flags.
    if first_row_zero:
        for c in range(cols):
            matrix[0][c] = 0
    if first_col_zero:
        for r in range(rows):
            matrix[r][0] = 0`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "On a fresh chart [[0,4,5],[6,7,8],[9,1,2]], Nami zeroes each row and column the moment she finds a zero, scanning left to right and top to bottom. What does she end up with?",
        options: [
          'An all-zero matrix — the zeroes she writes are then read as new fires',
          'The correct answer: only row 0 and column 0 zeroed',
          'Only the first row zeroed',
          'The original matrix, unchanged'
        ],
        correct: 0,
        explain: 'The corner zero clears row 0 and column 0, so the scan immediately meets the zero it just wrote at (0,1), clears column 1 too, then (0,2) clears column 2 — and every row is wiped by the time it reaches the bottom. Writing into the structure you are still reading destroys the distinction between input and output; separating the record pass from the act pass is the fix.',
        hint: 'After clearing the first row, what does the scan read at position (0,1)?'
      },
      {
        tag: 'TRANSFER',
        q: "Different board, same discipline: the Game of Life must update every cell simultaneously from the previous generation, in place. What is the analogous trick?",
        options: [
          'Store both states in each cell — for instance a second bit for the next state — then shift everything down in a final pass',
          'Update row by row from the top',
          'Update the border cells first',
          'It cannot be done in place'
        ],
        correct: 0,
        explain: 'Same underlying problem: a cell must answer "what was I?" and "what will I be?" at once. Two bits per cell keeps both readable, exactly as the marker strips keep the fire notes separate from the burning. Row-by-row updating corrupts the neighbour counts of the rows below.',
        hint: 'What does a neighbour need to read from a cell that has already been updated?'
      },
      {
        tag: 'TWEAK',
        q: "The matrix is 1 x n — a single row. Does the marker-strip method still work?",
        options: [
          'Yes, but the first row is the entire matrix, so the whole job is done by the first-row flag',
          'No, it needs at least two rows',
          'Yes, unchanged',
          'No, it will zero the matrix incorrectly'
        ],
        correct: 0,
        explain: 'The interior loops never execute, so everything hinges on the flags computed up front — and the first-row flag correctly zeroes the entire row if any zero was present. Degenerate shapes are exactly where marker-strip solutions tend to break, so it is worth checking rather than assuming.',
        hint: 'How many iterations do the loops starting at index 1 perform when there is only one row?'
      }
    ]
  };

  E['game-of-life'] = {
    id: 'game-of-life',
    epNumber: 95,
    title: 'The Island That Changes All at Once',
    arc: 'Little Garden',
    scene: 'forest',
    leetcode: { name: 'Game of Life', number: 289, difficulty: 'Medium', url: 'https://leetcode.com/problems/game-of-life/' },
    problem: 'Given an m x n board of live (1) and dead (0) cells, compute the next state, where every cell updates simultaneously according to its eight neighbours. Solve it in place.',
    example: 'A live cell with 2 or 3 live neighbours survives; a dead cell with exactly 3 becomes live; everything else dies or stays dead.',

    h: 210,
    props: [
      { id: 'cell', emoji: '🌱', label: 'a cell', x: 50, y: 28 },
      { id: 'nb', emoji: '🔟', label: '8 neighbours', x: 22, y: 56 },
      { id: 'bit', emoji: '🔢', label: 'bit 0 = now', x: 60, y: 56 },
      { id: 'bit2', emoji: '🔢', label: 'bit 1 = next', x: 86, y: 56 }
    ],
    ledger: [
      { id: 'P', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Little Garden's undergrowth advances by its own rules, and every patch changes at the same instant — not one after another. Two or three neighbours and you live; exactly three and a bare patch sprouts.",
        p: { cell: 'lit', nb: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So I walk the board and update each patch. ...No, wait. If I update the first patch, the second patch counts its neighbours against a board that's already changed.",
        p: { cell: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the whole difficulty. 'Simultaneous' means every cell must read the OLD board while the NEW one is being written. Copying the board solves it instantly and costs O(m·n) space.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And the follow-up asks for in place. So each cell has to hold both answers at once.",
        p: { bit: 'lit', bit2: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Use two bits. The low bit stays the current state, untouched, so every neighbour count still reads the old board. The second bit records what the cell becomes.",
        p: { bit: 'good', bit2: 'good' }, l: { P: 'value = next<<1 | now' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So a cell that is alive now and alive next holds three. Alive now, dead next holds one. Dead now, alive next holds two.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And counting neighbours means reading their low bit only — masking with one. Then a second pass shifts every cell right by one, and the next state becomes the current one.",
        p: { P: 'good' }, l: { P: 'then shift >> 1 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two passes, no copy, and the simultaneity is preserved exactly.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "What about the edges? A patch on the border has fewer than eight neighbours.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Bounds-check each of the eight offsets and simply skip the ones off the board — an absent neighbour is not a dead neighbour, it is no neighbour. Keeping the eight directions in a list rather than writing them out is what keeps that loop readable.",
        p: { nb: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Simultaneous update means old and new state must coexist — encode both in each cell (low bit now, high bit next) so every neighbour count still reads the previous generation.',
    complexity: '<b>Time O(m · n)</b> — two passes, eight neighbour checks each. <b>Space O(1)</b> with the two-bit encoding, or O(m · n) if you copy the board.',
    pitfall: 'Updating cells one at a time against a mutating board, which makes the result depend on scan order. Also, after encoding, neighbour counts must mask the low bit — reading the raw value counts cells that have merely been marked.',
    solution: `def game_of_life(board):
    rows, cols = len(board), len(board[0])
    DIRS = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]

    for r in range(rows):
        for c in range(cols):
            live = 0
            for dr, dc in DIRS:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    live += board[nr][nc] & 1      # low bit = the OLD state
            # Bit 1 holds the next state; bit 0 is left untouched.
            if board[r][c] & 1:
                if live in (2, 3):
                    board[r][c] |= 2
            elif live == 3:
                board[r][c] |= 2

    for r in range(rows):
        for c in range(cols):
            board[r][c] >>= 1                      # next becomes current`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper counts neighbours with <code>live += board[nr][nc]</code> after starting to write the second bit. What goes wrong?",
        options: [
          'A neighbour already marked as "next = alive" contributes 2 or 3 instead of its true old state of 0 or 1',
          'Nothing; the encoding is transparent',
          'The board is zeroed',
          'It counts each neighbour twice'
        ],
        correct: 0,
        explain: 'The encoding only preserves the old state if you read it back masked. Without <code>& 1</code>, a cell holding 3 adds three to the count and the rules fire wrongly. The mask is what makes the two-bit trick a trick rather than a corruption.',
        hint: 'What integer does a cell hold once its "next state" bit has been set?'
      },
      {
        tag: 'TRANSFER',
        q: "Different simulation, same constraint: Franky updates a heat grid where each cell becomes the average of its four neighbours, all at once. What is the analogous in-place approach?",
        options: [
          'It is much harder — averages are not two-valued, so you cannot pack old and new into one integer; use a row buffer instead',
          'The same two-bit trick works',
          'Update in place; averaging is order-independent',
          'Use eight bits per cell instead of two'
        ],
        correct: 0,
        explain: 'A useful limit to know. Bit-packing works because the state is boolean and the value range is tiny. With continuous values there is nowhere to hide the second state, so the standard trick is to keep one previous row (and the single cell just overwritten) in a buffer — O(cols) space rather than O(rows·cols).',
        hint: 'How many distinct values can a cell take, and does a second one still fit in the same number?'
      },
      {
        tag: 'TWEAK',
        q: "The board is described as infinite, and you are given only the live cells. What changes?",
        options: [
          'Store live cells in a set of coordinates and count neighbours from that — only cells adjacent to a live cell can change',
          'Nothing; use a very large array',
          'Only the border handling changes',
          'It becomes impossible'
        ],
        correct: 0,
        explain: 'That is the stated follow-up. A sparse representation makes the work proportional to the number of live cells rather than to the board area, and the key observation is that a dead cell with no live neighbours cannot come alive, so only the neighbourhood of the live set needs examining.',
        hint: 'Which dead cells could possibly become alive in the next generation?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
