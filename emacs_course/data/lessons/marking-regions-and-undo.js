window.LESSONS = window.LESSONS || {};
window.LESSONS['marking-regions-and-undo'] = {
  id: 'marking-regions-and-undo',
  title: 'Marking a Region & Undo: Point, Mark, and a Tree You Can\'t Lose',
  category: 'Part 3 — Core Editing',
  timeMin: 30,
  summary: 'The last lesson used "the region" without fully explaining where it comes from — this lesson closes that gap: mark is simply a second remembered position, and the region is just the span between it and point. Then it covers Emacs\'s undo system, which works genuinely differently from the linear undo/redo stack you already know from everywhere else — and once you understand why, you will never lose an edit to a mistimed undo again.',
  goals: [
    'Set the mark at point with C-SPC, and explain that "the region" is simply the span between mark and point',
    'Use C-x C-x to swap point and mark, and explain a real use for doing so',
    'Select a region and act on it with C-w (kill) or M-w (copy), completing the workflow from the previous lesson',
    'Undo with C-/ (or C-x u), repeatedly, to step back through recent changes',
    'Explain why Emacs has no traditional "redo" key, and how to redo by undoing the undo instead'
  ],
  concept: [
    {
      h: 'Mark: a second remembered position, just like point',
      p: [
        'The previous lesson established that <b>point</b> is a precise number — a buffer offset. <b>Mark</b> is exactly the same kind of thing: another remembered buffer position, set explicitly with <code>C-SPC</code> (Control-Spacebar) at wherever point currently is. Once set, mark stays put even as you move point elsewhere with any of the previous lesson\'s motion commands.',
        'The <b>region</b> — what most other software would call "the selection" — is simply defined as the span between mark and point, whichever order they happen to be in. There is no separate "selection object" being created or tracked; it is just the distance between two already-familiar numbers. This is why extending or shrinking a region in Emacs is nothing special at all — you set mark once, then just keep moving point with ordinary motion commands, and the region automatically grows or shrinks to match, with no dedicated "extend selection" mode required.'
      ]
    },
    {
      h: 'C-x C-x: swapping point and mark',
      p: [
        '<code>C-x C-x</code> (exchange-point-and-mark) swaps which of the two positions is currently "point" and which is "mark." This is genuinely useful for two common situations: first, since only point is visually shown as the cursor (mark has no visual indicator of its own by default), C-x C-x lets you actually SEE where the other end of your current region is, by momentarily jumping the cursor there. Second, it is a fast way to reactivate and reselect your MOST RECENT region if you moved point away from it and want it back, without having to set mark all over again from scratch.'
      ]
    },
    {
      h: 'Putting it together: selecting a region, then acting on it',
      p: [
        'This is the workflow the previous lesson\'s C-w and M-w were building toward: <code>C-SPC</code> to set mark at your starting point, move point (with any motion command from two lessons ago) to wherever you want the region to end, and THEN <code>C-w</code> kills that exact span, or <code>M-w</code> copies it. The region is genuinely just "wherever point ends up relative to mark" — no separate selecting gesture, no special mode, just ordinary movement combined with one command that acts on the resulting span.'
      ]
    },
    {
      h: 'Undo (C-/ or C-x u), and why there is no separate "redo" key',
      p: [
        '<code>C-/</code> (or the equivalent <code>C-x u</code>) undoes the most recent change, and pressing it repeatedly keeps undoing further back through recent edits, one step at a time — genuinely similar to undo in most other software, so far. The part that is different, and worth understanding precisely rather than guessing at: Emacs has NO separate "redo" command in vanilla configuration. Instead, <b>undoing an undo IS how you redo</b> — because every undo action is itself recorded as a normal change in the buffer\'s own undo history, exactly like any ordinary edit would be.',
        'Concretely: if you undo three times and then decide you actually wanted the second of those three undos back, running ANY other command first (even just moving point) "breaks" the current undo chain — and the VERY NEXT time you press undo after that, instead of continuing to undo further back, it undoes the LAST UNDO ITSELF, which is exactly equivalent to redoing that one change. Continuing to press undo from there keeps undoing further BACK through your undo history — which, since undos are themselves in that history, means you are now effectively redoing forward through your original edits. This genuinely takes some getting used to, but it has one real advantage over a traditional separate undo/redo stack: making a brand new edit after undoing never permanently destroys the "future" you undid away from, the way it typically does elsewhere — that history is still sitting there in the undo chain, just requiring the break-then-undo pattern to actually reach it again.'
      ]
    }
  ],
  conceptFlow: {
    title: 'How to "redo" in Emacs: undoing the undo itself',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Three edits happen',
        nodes: [
          { id: 'edits', text: 'Edit A, then Edit B, then Edit C\n(in that order)' }
        ]
      },
      {
        label: 'You undo twice',
        nodes: [
          { id: 'undo1', text: 'C-/ : undoes Edit C' },
          { id: 'undo2', text: 'C-/ again: undoes Edit B\n(only Edit A remains)' }
        ]
      },
      {
        label: 'You realize you want Edit B back',
        nodes: [
          { id: 'break', text: 'Run ANY other command\n(even just moving point) —\nthis breaks the undo chain' }
        ]
      },
      {
        label: 'Undo now means something different',
        nodes: [
          { id: 'redo', text: 'C-/ NOW undoes the\nPREVIOUS UNDO itself\n— Edit B comes back' }
        ]
      }
    ],
    steps: [
      { active: ['edits'], note: 'Three ordinary edits happen in sequence — nothing unusual yet.' },
      { active: ['undo1'], note: 'The first undo removes the most recent change, Edit C — so far, identical to how undo works everywhere.' },
      { active: ['undo2'], note: 'A second undo removes Edit B too — now only Edit A remains applied.' },
      { active: ['break'], note: 'Here is the key step: running ANY other command — even a completely harmless one, like just pressing an arrow key — breaks the continuous "keep undoing further back" chain. Emacs is not currently keeping a separate, protected redo stack; it needs this deliberate break to know you are switching intent.' },
      { active: ['redo'], note: 'With that chain broken, the VERY NEXT undo does something different: since undoing is itself recorded in the buffer\'s undo history, this new undo actually undoes your MOST RECENT UNDO — which is exactly equivalent to redoing Edit B. Continue pressing undo from here and you keep moving forward again through what you had undone, effectively redoing your way back up.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s Chart Pin, and Franky\'s Repair Log That Remembers Its Own Reversals',
      text: 'Nami works long charts with a simple, deliberate habit: she places a single fixed PIN at a specific reference point on the map, then keeps working — moving her actual pen freely around, tracing routes, marking notes — with the DISTANCE between that fixed pin and wherever her pen currently sits always being exactly the span she is actively working on. She never needs a separate "start a selection" ritual — she just drops the pin once, then moves normally, and whatever span currently exists between pin and pen is simply, automatically, the region she can act on. Franky, completely separately, maintains a repair log with a property that trips up every new dockhand the first time they encounter it: when he UNDOES a repair entry (reverting a change back to how it was before), that undo itself gets written into the log as ITS OWN new entry — not silently erased, not tracked in some separate hidden "future" list. So if Franky reverts three repairs in a row and then genuinely wants the second-to-last one back, he cannot just press "redo" — there is no such button. Instead, he does something specific and now second-nature to him: he does ANY other small task first, breaking the current stretch of undoing, and then reverts AGAIN — and because his most recent log entry was itself an undo, reverting IT is exactly what brings the repair back. Chopper, watching Franky do this smoothly the first time, asks why there is not just a simpler "redo" lever. Franky\'s answer: "There does not need to be a separate lever. Undoing an undo already gets you there — the log remembers everything, including its own reversals."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Recipe Pin, and Her Wedding Binder That Logs Its Own Reversals',
      text: 'Monica reads and edits a long recipe card using a habit nearly identical to Nami\'s: she places a small physical bookmark PIN at one specific reference spot on the card, then keeps reading and marking freely from there — and whatever span currently exists between that pin and wherever she is actively reading is simply, automatically, the section she is working on, no separate "start selecting" step needed at all. Separately, during her infamously detailed wedding-planning binder phase, she keeps a revision journal with a property that genuinely confuses Chandler the first time he tries to help: when Monica UNDOES a decision (reverting a choice back to an earlier one), that reversal itself gets written into the journal as its OWN new entry, not silently discarded and not tracked in some separate hidden "redo" list off to the side. So when Monica reverts three decisions in a row and then realizes she actually wants the second-to-last one back, there is no simple "redo" tab to flip to. Instead, she does something specific: she makes any other small unrelated journal entry first, deliberately breaking the current run of reversals, and then reverts AGAIN — and because her most recent journal entry was itself a reversal, reverting THAT is exactly what brings the earlier decision back. Chandler, watching this whole process unfold and clearly still confused, asks why she does not just keep a separate "redo" list like every other planning app he has ever used. Monica, not even looking up from the binder: "I do not need a separate list. Undoing my own undo already gets me there — the journal remembers everything, including every time I reversed something."'
    },
    why: 'Nami\'s and Monica\'s fixed pin, with the region simply being the distance to wherever they currently are, is exactly mark and point — no separate "selection object," just the span between two remembered positions. And Franky\'s and Monica\'s reversal-logging systems, where undoing an undo is how you get something back rather than a separate redo button, are exactly Emacs\'s actual undo mechanism — genuinely different from ordinary undo/redo, and precisely why nothing is ever truly lost, just requiring the deliberate "break the chain, then undo again" pattern to reach it.'
  },
  tech: [
    {
      q: 'Beyond just "seeing where mark is," what is a genuinely practical use for C-x C-x (exchange-point-and-mark)?',
      a: 'A very common real scenario: you set mark, move point to select a region, then realize you actually need to adjust the OTHER end of the region instead — the end you originally set mark at, not wherever point currently is. C-x C-x swaps them, putting point at what was previously the mark position, letting you now move and adjust that end using ordinary motion commands, while mark takes over tracking the other end. Without this, you would have to abandon the region entirely and start over from scratch with a fresh C-SPC — C-x C-x instead lets you adjust either end of an already-established region, not just the end you happened to set second.'
    },
    {
      q: 'Walk through, precisely, why "undo an undo" is the correct mental model for Emacs\'s redo, rather than thinking of it as a coincidental side effect.',
      a: 'Emacs records changes to a buffer in an undo history, and — deliberately, by design — an undo ACTION is itself recorded as an entry in that same history, exactly like any ordinary edit would be. This means the undo history is not a simple, protected linear stack that a separate "redo" pointer walks back and forth across; it is one continuous, ever-growing record where undos and ordinary edits are both just entries. Breaking the current undo chain (by running any other command) and then undoing again does not invoke some separate redo mechanism — it genuinely just undoes the most recent entry in that history, which happens to be your previous undo, and undoing an undo is mathematically, definitionally, exactly a redo. This is not a side effect or a clever trick layered on top of undo — it is the direct, natural consequence of Emacs treating undo actions as first-class entries in the same history as everything else.'
    },
    {
      q: 'Why is defining "region" as simply the span between two buffer positions (mark and point) a cleaner design than treating a selection as its own special kind of object?',
      a: 'Because it means selecting, extending, and shrinking a region require NO special mode or dedicated set of "selection-only" commands at all — you set mark once with C-SPC, and then every single motion command already covered in the previous lesson (C-f, M-f, C-n, C-e, and so on) automatically extends or shrinks the region as point moves, since the region is, by definition, always just "however far point currently is from mark." A more typical "selection object" design would need a genuinely separate set of "extend selection" commands mirroring the ordinary motion commands, effectively duplicating the whole motion vocabulary for selection purposes. Emacs\'s point/mark model instead gets this entirely for free, precisely because it never introduces a new kind of thing — it reuses the exact same "buffer position" concept twice.'
    }
  ],
  code: {
    title: 'Setting mark, using the region, and navigating undo history',
    intro: 'Try this on a genuinely disposable scratch buffer — the undo portion especially benefits from real practice.',
    code: `;; Point is at the start of "the quick brown fox"

C-SPC
;; Mark is now set right here. Nothing visible changes yet.

M-f M-f
;; Move point forward two words — to just after "brown".
;; The REGION is now: "the quick brown" (from mark to point).

C-w
;; Kills that region. Buffer now reads " fox" — the region is gone,
;; and (per the previous lesson) it's sitting on the kill ring.

C-y
;; Yanks it right back — "the quick brown fox" restored.

;; Checking the other end of a region:
C-SPC             ; set mark here
C-n C-n            ; move point down two lines
C-x C-x             ; swap point and mark — cursor jumps to where mark was
C-x C-x             ; swap back — cursor returns to where point was

;; ── Undo, and "redo" by undoing the undo ──

;; Buffer: "one two three" (three separate edits, typed one at a time)
C-/                 ; undoes the most recent edit -> "one two"
C-/                 ; undoes again -> "one"

;; Realize you wanted "one two" back:
C-f                 ; ANY other command — breaks the undo chain
C-/                 ; undoes the PREVIOUS UNDO -> "one two" is back!
C-/                 ; keep going -> "one two three" is back too`,
    notes: [
      'C-SPC pressed twice in a row (without moving point in between) is a shortcut for "reactivate the mark at its current position" — useful, but distinct from the exchange behavior of C-x C-x.',
      'The "break the chain" step really can be almost anything — even a motion command that does not modify the buffer at all is enough to flip the next undo into a redo.'
    ]
  },
  lab: {
    title: 'Write the mark, region, and undo commands for each scenario',
    prompt: 'Write exactly the key sequence for each task below.',
    starter: `# Task: set the mark at the current position


# Task: swap which position is currently point and which is mark


# Task: with a region already selected, kill it


# Task: undo the most recent change


# Task: you undid twice, then realize you want the more recent of those two
# undos back — write the TWO steps needed to get it back (as one line)

`,
    checks: [
      { re: 'C-SPC|C-@', flags: 'i', must: true, hint: 'C-SPC (Control-Spacebar) sets the mark at point.', pass: 'C-SPC ✓' },
      { re: 'C-x\\s+C-x', flags: '', must: true, hint: 'C-x C-x exchanges point and mark.', pass: 'C-x C-x ✓' },
      { re: 'C-w', flags: '', must: true, hint: 'C-w kills the current region.', pass: 'C-w ✓' },
      { re: 'C-/|C-x\\s+u', flags: '', must: true, hint: 'C-/ (or C-x u) undoes the most recent change.', pass: 'C-/ ✓' },
      { re: '(C-f|C-n|C-p|C-b|any).*C-/|C-/.*(C-f|C-n|C-p|C-b|any)', flags: 'i', must: true, hint: 'Run any other command first (breaking the undo chain), THEN undo again.', pass: 'break chain, then undo again ✓' }
    ],
    run: 'Try it for real: make three edits, undo twice, run any other command, then undo again and watch the "redo" happen.',
    solution: `# Task: set the mark at the current position
C-SPC

# Task: swap which position is currently point and which is mark
C-x C-x

# Task: with a region already selected, kill it
C-w

# Task: undo the most recent change
C-/

# Task: you undid twice, then realize you want the more recent of those two
# undos back — write the TWO steps needed to get it back (as one line)
C-f (or any other command to break the chain), then C-/ again`,
    notes: [
      'The last task is the one genuinely worth practicing for real in Emacs rather than just reading about — the "break the chain, then undo" pattern feels unintuitive the first few times and clicks quickly once actually tried.',
      'C-SPC and C-w together are exactly the "set mark, move point, kill" workflow this lesson (and the previous one) is building toward as a complete, practical sequence.'
    ]
  },
  quiz: [
    {
      q: 'What is "the region" in Emacs, precisely?',
      options: ['A special selection object tracked separately from point and mark', 'Simply the span between mark and point — wherever point currently is relative to wherever mark was set', 'Always the entire current line', 'A fixed-size area around the cursor'],
      correct: 1,
      explain: 'The region is defined purely as the distance between two ordinary buffer positions — mark (set explicitly) and point (wherever it currently is) — nothing more.'
    },
    {
      q: 'Why can you extend or shrink a region just by using ordinary motion commands, with no special "extend selection" mode?',
      options: ['Emacs secretly does have a hidden extend-selection mode running', 'Because the region is defined as the span to point, any motion command that moves point automatically changes the region too', 'Region extension requires a completely separate set of commands not covered in this lesson', 'Regions cannot actually be extended once set'],
      correct: 1,
      explain: 'Since region = distance between mark and point, and ordinary motion commands move point, using them after setting mark automatically grows or shrinks the region — no dedicated selection-extension commands needed.'
    },
    {
      q: 'What does C-x C-x do?',
      options: ['Kills the current region', 'Swaps which position is currently point and which is mark', 'Sets a new mark at point', 'Cancels the current region entirely'],
      correct: 1,
      explain: 'C-x C-x (exchange-point-and-mark) swaps the two positions — useful for seeing (or adjusting) the other end of the current region.'
    },
    {
      q: 'Why does Emacs not have a separate, dedicated "redo" key in its vanilla configuration?',
      options: ['Emacs genuinely cannot redo anything once undone', 'Because undo actions are themselves recorded in the same undo history as ordinary edits — undoing a previous undo IS how you redo', 'Redo exists but is simply undocumented', 'Redo only works for the very first undo, never subsequent ones'],
      correct: 1,
      explain: 'Since undos are recorded as regular entries in the buffer\'s own undo history, undoing THAT entry (a previous undo) is mechanically identical to redoing — no separate redo mechanism is needed.'
    },
    {
      q: 'You undo twice, then run an unrelated command, then press undo again. What happens?',
      options: ['It undoes a third, even older change', 'It undoes your most recent undo — effectively redoing the second undo you just did', 'Nothing happens; undo is disabled after running another command', 'It immediately reverts to the very first state the buffer ever had'],
      correct: 1,
      explain: 'Running another command breaks the undo chain — the next undo after that undoes the most recent HISTORY ENTRY, which is your previous undo, effectively redoing it.'
    }
  ],
  pitfalls: [
    'Expecting a dedicated "redo" keybinding to exist and being confused when pressing undo repeatedly just keeps undoing further back instead — the actual mechanism (break the chain, then undo again) needs to be learned explicitly.',
    'Forgetting that mark has no default visual indicator the way point (the cursor) does — losing track of where mark currently is and being surprised by an unexpectedly large or small region.',
    'Assuming a region must be "actively displayed/highlighted" to exist — the region exists as soon as mark is set, whether or not it happens to be visually highlighted in your current configuration.'
  ],
  interview: [
    {
      q: 'Explain precisely what the "region" is in Emacs, and why this definition makes region manipulation simpler than in editors with a dedicated selection object.',
      a: 'The region is defined purely as the span between two ordinary buffer positions: mark (set explicitly via C-SPC) and point (the current cursor position). Because this reuses the exact same underlying concept — a buffer position — for both point and mark, no separate "selection" data type or dedicated set of selection-extension commands is needed at all: any of Emacs\'s existing motion commands, once mark is set, automatically grows or shrinks the region as a direct side effect of moving point. Editors that model selection as its own distinct object typically need to duplicate their entire motion vocabulary into a parallel "extend selection" version of each command — Emacs\'s point/mark model gets equivalent capability for free, simply because region was never designed as a separate kind of thing to begin with.'
    },
    {
      q: 'Explain exactly how "redo" works in Emacs, given that there is no dedicated redo command, using a concrete step-by-step example.',
      a: 'Emacs records every buffer change, including undo actions themselves, in one continuous undo history — an undo is not treated specially or kept in some separate, protected redo stack; it is just another entry. Concretely: after three edits (A, B, C), pressing undo twice removes C then B, leaving only A applied. To get B back, you first run ANY other command (even one that does not modify the buffer) — this deliberately "breaks" the continuous chain of undoing. The VERY NEXT undo after that break now undoes the most recent history entry, which is your PREVIOUS UNDO (the one that removed B) — undoing that undo restores B, which is mechanically, precisely what redoing means. Continuing to press undo from there keeps moving further "back" through the history, which — since undos are interleaved with the original edits in that same history — means continuing to redo forward through the original edit sequence.'
    },
    {
      q: 'A new Emacs user is frustrated that they cannot find a Ctrl+Y-style "redo" keybinding. How would you address both their immediate need and their underlying misunderstanding?',
      a: 'Immediately: undo (C-/ or C-x u) IS the redo mechanism too — running any other command first to break the current undo chain, then pressing undo again, undoes their most recent undo, which is exactly a redo. This gets them unblocked right away. The underlying misunderstanding worth correcting: they are assuming Emacs maintains a separate, protected redo stack the way most other software does, when in fact Emacs records undo actions as ordinary entries in the SAME undo history as regular edits — there is no structurally separate "future" that gets destroyed by a new edit the way a traditional undo/redo stack\'s redo history typically is. This is actually a genuine advantage once understood: making a new edit after undoing never permanently discards what was undone away from, it just requires the specific break-then-undo pattern to reach it again later.'
    },
    {
      q: 'Why might Emacs\'s undo model be considered more resilient against accidental data loss than a traditional linear undo/redo stack, despite feeling less intuitive at first?',
      a: 'In a traditional undo/redo stack, making any NEW edit after undoing typically and permanently discards the entire "redo" history that existed at that point — there is no way back to those undone-away-from states once a new edit has been made, since the redo stack is simply cleared. Emacs\'s model has no equivalent moment of permanent, irreversible loss: because undo actions are recorded as ordinary entries in the same continuous undo history as everything else, even after making new edits following an undo, the earlier undone states remain reachable in that history — genuinely harder to navigate back to precisely (it takes deliberate chain-breaking and careful undoing), but never structurally destroyed the way a traditional redo stack\'s contents are the instant a new edit occurs. The tradeoff is real: harder to reason about at first, but a strictly more forgiving safety net against genuinely losing work.'
    }
  ]
};
