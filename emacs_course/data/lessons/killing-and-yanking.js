window.LESSONS = window.LESSONS || {};
window.LESSONS['killing-and-yanking'] = {
  id: 'killing-and-yanking',
  title: 'The Kill Ring: Why Emacs "Cut/Paste" Isn\'t What You Think',
  category: 'Part 3 — Core Editing',
  timeMin: 35,
  summary: 'Nearly every piece of software has one clipboard slot: cut something, it overwrites whatever was there before, paste gets back only the most recent thing. Emacs has never worked that way — it keeps a RING of your recent kills, several deep, and lets you cycle backward through them to retrieve something you cut a few steps ago, not just the very last thing. This lesson covers killing, yanking, and the genuinely different mental model underneath both.',
  goals: [
    'Explain why Emacs\'s kill ring holds multiple entries instead of one single clipboard slot',
    'Kill to the end of a line with C-k, and kill a selected region with C-w',
    'Copy text without deleting it using M-w (kill-ring-save)',
    'Yank (paste) the most recent kill with C-y, and cycle to older kills with M-y immediately after',
    'Explain the difference between "kill" (retrievable) and "delete" (not retrievable) commands'
  ],
  concept: [
    {
      h: 'The kill ring is a RING, not one clipboard slot',
      p: [
        'Almost every other editor has exactly ONE clipboard slot: cut something, it overwrites whatever was cut before, and paste only ever gets back the single most recent thing. Emacs\'s <b>kill ring</b> instead holds SEVERAL recent kills at once, arranged in a circular list — kill four different things in a row, and all four remain available, not just the last one.',
        'This is a genuinely different mental model worth sitting with before the specific keys below: in most software, cutting something new means the previous clipboard contents are simply gone, unrecoverable, the moment you cut again. In Emacs, cutting something new pushes a NEW entry onto the ring — older kills are still sitting there, reachable, until enough newer kills eventually push them out of the ring\'s limited size.'
      ]
    },
    {
      h: 'Kill vs delete: a genuinely important distinction',
      p: [
        'Emacs deliberately distinguishes two different categories of "removing text," and knowing which category a given command falls into matters. <b>Kill</b> commands (C-k, C-w, and several others) save whatever they remove onto the kill ring — genuinely retrievable later via yank, covered below. <b>Delete</b> commands (plain Backspace/Delete for single characters, most commonly) simply remove text with NO safety net at all — once deleted this way, it is gone, not retrievable via yank or anything else.',
        'The reasoning behind the split: removing a MEANINGFUL chunk of text (a whole line, a selected region) is treated as something worth a retrievable safety net, since it is exactly the kind of action someone might want to undo or move elsewhere a moment later. Removing one stray, individually-typed character via Backspace is treated differently — cluttering the kill ring with every single backspaced character would make it far less useful for its actual purpose.'
      ]
    },
    {
      h: 'Killing: C-k, C-w, and the confusingly-named M-w',
      p: [
        '<code>C-k</code> (kill-line) kills from point to the end of the current line, saving it onto the kill ring. <code>C-w</code> (kill-region) kills whatever is currently selected as the REGION (the next lesson covers exactly how a region gets selected via mark) — the direct equivalent of "cut" in most other software, but landing on the ring rather than overwriting a single slot.',
        '<code>M-w</code> (kill-ring-save) is worth calling out specifically because its name is genuinely confusing on first encounter: despite having "kill" right in the name, it does NOT delete anything at all — it copies the current region onto the kill ring while leaving the original text completely untouched, the direct equivalent of "copy" rather than "cut." The naming is a historical artifact (it reuses the kill-ring MECHANISM without performing an actual kill), worth just accepting rather than fighting.'
      ]
    },
    {
      h: 'Yanking, and cycling backward through recent kills with M-y',
      p: [
        '<code>C-y</code> (yank) inserts the MOST RECENT kill-ring entry at point — the direct equivalent of "paste." This alone would just be an ordinary clipboard if it stopped there. The genuinely unique capability: pressing <code>M-y</code> IMMEDIATELY after a C-y (with no other command run in between) does not yank yet another copy of the same thing — it REPLACES what was just yanked with the NEXT-OLDER entry in the ring instead.',
        'Repeated M-y presses keep cycling backward, one ring entry at a time, letting you scan through your recent kills right at point until you find the specific one you actually wanted — genuinely useful the moment you realize the thing you meant to paste was not the very last thing you killed, but something from a few steps earlier, without ever having to separately re-select and re-kill it.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Four kills in a row, then C-y, then M-y M-y — tracing the ring',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Four kills happen, in order',
        nodes: [
          { id: 'kill1', text: 'Kill "alpha"\n(oldest, will be pushed out first)' },
          { id: 'kill2', text: 'Kill "bravo"' },
          { id: 'kill3', text: 'Kill "charlie"' },
          { id: 'kill4', text: 'Kill "delta"\n(most recent)' }
        ]
      },
      {
        label: 'C-y: yank the most recent',
        nodes: [
          { id: 'yank', text: 'C-y inserts "delta"\n(the newest entry)' }
        ]
      },
      {
        label: 'M-y cycles backward, one step at a time',
        nodes: [
          { id: 'yankpop1', text: 'M-y: replaces "delta"\nwith "charlie" instead' },
          { id: 'yankpop2', text: 'M-y again: replaces "charlie"\nwith "bravo" instead' }
        ]
      }
    ],
    steps: [
      { active: ['kill1'], note: 'Four separate kill actions, one after another — each one pushes a NEW entry onto the kill ring rather than overwriting the previous one.' },
      { active: ['kill2'], note: 'The ring now holds two entries: alpha (older) and bravo (newer).' },
      { active: ['kill3'], note: 'Three entries now — alpha, bravo, charlie — each still fully intact and retrievable.' },
      { active: ['kill4'], note: 'Four entries — delta is now the MOST RECENT, at the "front" of the ring.' },
      { active: ['yank'], note: 'C-y always yanks the single most recent entry first — here, that is "delta."' },
      { active: ['yankpop1'], note: 'Pressing M-y immediately after that C-y does not add a second copy — it REPLACES the just-yanked "delta" with the next-older entry, "charlie," right at the same spot.' },
      { active: ['yankpop2'], note: 'Pressing M-y again continues cycling backward — "charlie" is replaced by "bravo." Each M-y press moves one step further back through the ring, letting you scan for the specific kill you actually meant to retrieve.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s Salvage Pile: More Than Just the Last Thing Stripped',
      text: 'When Nami strips a part off during a mid-repair salvage, she does not toss it into a single shared bin that just gets emptied and refilled with whatever was pulled most recently — she has a deliberate, ordered SALVAGE PILE that keeps the last several stripped items, stacked in the order they came off, each one still genuinely retrievable. Strip four different parts in a row during one busy repair session, and all four sit there, recoverable, not just the very last one — a genuinely different setup from the single "current spare part" tray most crews use, where pulling a new part off automatically discards whatever was there before. There is also a firm, separate rule Nami enforces about what actually GOES on that pile in the first place: a genuinely useful stripped part goes on the salvage pile, retrievable later — but a stray, damaged scrap not worth keeping at all gets thrown straight overboard instead, with no pretense of it being recoverable. Franky, needing a specific bracket he vaguely remembers Nami stripping off two repairs ago (not the most recent one), does not panic or assume it is long gone — he works backward through the salvage pile, one item at a time, until he finds exactly the one he actually needed, still sitting there waiting, several items back from the top.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Cleared-Desk Pile: Retrievable, in Order — Unlike the Actual Trash',
      text: 'When Sheldon clears something meaningful off his desk during a reorganization, he does not just toss it into one shared "removed stuff" tray that gets overwritten every time something new gets cleared — he maintains a genuinely ordered pile of recently-removed items, several deep, each one still fully retrievable exactly as it was. Clear four different things off his desk during one long organizing session, and all four remain sitting in that ordered pile, not just the very last thing removed — a real, deliberate departure from how most people\'s desks work, where clearing something new means whatever was cleared moments before is essentially gone from immediate reach. Sheldon is also characteristically strict about a separate, related rule: something genuinely worth keeping goes onto that retrievable pile when cleared — but a stray piece of actual trash, a used napkin, something with no conceivable future value, goes straight into the actual garbage instead, with zero pretense that it could ever be retrieved from there. Leonard, needing a specific reference sheet he vaguely recalls Sheldon clearing off the desk two organizing sessions ago (not the most recent clear), does not assume it is hopelessly gone — he works backward through Sheldon\'s ordered pile, item by item, until he finds exactly the one he was actually looking for, still sitting there, several items back.'
    },
    why: 'Nami\'s salvage pile and Sheldon\'s cleared-desk pile are exactly Emacs\'s kill ring: several recent removals, kept in order, genuinely retrievable — not a single slot overwritten by whatever was removed most recently. And their separate "this goes to actual trash, not the retrievable pile" rule is exactly kill vs delete: a meaningful removal (kill) earns a safety net; a stray scrap (delete) does not, and is not meant to.'
  },
  tech: [
    {
      q: 'Give a concrete, realistic scenario where the kill ring\'s multi-entry design is genuinely more useful than a single clipboard slot.',
      a: 'You kill a line of code to move it elsewhere, then realize you also need to remove a second, unrelated line before actually pasting the first one back — with a single-slot clipboard, killing that second line would irretrievably overwrite the first one, forcing you to undo, redo the whole sequence more carefully, or manually retype something you had already correctly removed. With Emacs\'s kill ring, both kills sit on the ring simultaneously — C-y yanks the second (most recent) one, and a single M-y immediately after cycles back to yank the FIRST one instead, without ever needing to re-select or re-kill it. This exact "I need to do one more thing before I paste" scenario is genuinely common during real editing, which is precisely why a multi-entry ring, rather than a single overwritable slot, is a meaningfully more forgiving design.'
    },
    {
      q: 'Why does M-w (copy, not cut) have "kill" in its name at all, given that it does not actually remove anything?',
      a: 'M-w\'s full function name is "kill-ring-save" — and the naming reflects that it reuses the exact same underlying MECHANISM as an actual kill (pushing an entry onto the kill ring) without performing the actual deletion half of what a kill command does. It is not that Emacs is calling a copy operation "kill" arbitrarily — it genuinely does use the kill ring data structure to save the copied text, making it retrievable via the same C-y/M-y yanking commands as any real kill, which is exactly why it needed to share that name\'s "kill-ring" portion despite the text never actually being removed from the buffer. The naming is a real historical artifact worth simply accepting once explained, rather than a design flaw.'
    },
    {
      q: 'Why does Emacs treat killing a whole line (C-k) differently from deleting a single stray character (Backspace), rather than routing everything through one unified "removal" mechanism?',
      a: 'The distinction reflects a genuine, deliberate judgment about what is actually worth a retrievable safety net: removing a meaningful chunk of text — a whole line, a selected region — is exactly the kind of action someone plausibly wants to undo, move elsewhere, or otherwise retrieve moments later, and the kill ring exists specifically to support that. Routing every single individually-backspaced character through the same mechanism would flood the kill ring with an enormous number of essentially meaningless one-character entries, making it far less useful for its actual purpose — by the time you wanted to retrieve a genuine, meaningful kill from a few steps back, it could easily have been pushed out of the ring entirely by dozens of individually-deleted stray characters typed in between.'
    }
  ],
  code: {
    title: 'Killing, yanking, and cycling through the ring',
    intro: 'Try this on a scratch buffer with a few lines of throwaway text.',
    code: `;; Starting buffer:
;; line one
;; line two
;; line three

;; Point at the start of "line one":
C-k
;; Kills "line one" (the whole line's text) onto the kill ring.
;; Buffer now starts with an empty line, then line two, line three.

;; Point still there — kill again:
C-k
;; Kills the now-empty line itself. Kill ring now has TWO entries.

;; Move down, kill another line:
C-n C-k
;; A third entry now sits on the kill ring.

C-y
;; Yanks the MOST RECENT kill (the third one) at point.

M-y
;; Immediately after that C-y: replaces it with the SECOND-most-recent
;; kill instead — NOT a fresh paste, a substitution of what was just yanked.

M-y
;; Press again: cycles back one more, to the OLDEST of the three kills.

;; Copying without deleting anything:
;; (select a region first — Part 3's next lesson covers this properly)
M-w
;; The region is copied onto the kill ring — original text untouched.
C-y
;; Yanks that copy at point.`,
    notes: [
      'M-y only does its "cycle backward" behavior immediately after a C-y (or another M-y) — running any other command in between resets that context, and the next M-y would behave differently.',
      'The kill ring has a configurable maximum size — old entries eventually get pushed out once enough newer kills accumulate, exactly like Nami\'s and Sheldon\'s piles eventually running out of room for the oldest items.'
    ]
  },
  lab: {
    title: 'Write the right kill/yank commands for each scenario',
    prompt: 'Write exactly the key sequence for each task below.',
    starter: `# Task: kill from point to the end of the current line


# Task: copy the currently selected region WITHOUT deleting it


# Task: yank (paste) the most recently killed text at point


# Task: you just yanked something with C-y, but realize you wanted the
# SECOND-most-recent kill instead — write the key to fix this, right now

`,
    checks: [
      { re: 'C-k', flags: '', must: true, hint: 'C-k kills from point to the end of the current line.', pass: 'C-k ✓' },
      { re: 'M-w', flags: '', must: true, hint: 'M-w (kill-ring-save) copies the region without deleting it.', pass: 'M-w ✓' },
      { re: 'C-y', flags: '', must: true, hint: 'C-y yanks the most recent kill-ring entry.', pass: 'C-y ✓' },
      { re: 'M-y', flags: '', must: true, hint: 'M-y, immediately after C-y, cycles to the next-older entry.', pass: 'M-y ✓' }
    ],
    run: 'Try it for real: kill three different lines in a row, then C-y followed by M-y a couple of times to watch the ring cycle.',
    solution: `# Task: kill from point to the end of the current line
C-k

# Task: copy the currently selected region WITHOUT deleting it
M-w

# Task: yank (paste) the most recently killed text at point
C-y

# Task: you just yanked something with C-y, but realize you wanted the
# SECOND-most-recent kill instead — write the key to fix this, right now
M-y`,
    notes: [
      'M-w is genuinely the trickiest one to remember precisely because of its name — "kill-ring-save" does not delete anything, despite "kill" appearing right in the name.',
      'M-y only works as a "cycle back" action immediately after a yank — it is not a general-purpose "show me the kill ring" command usable at any arbitrary moment.'
    ]
  },
  quiz: [
    {
      q: 'What is the key structural difference between Emacs\'s kill ring and a typical single-slot clipboard?',
      options: ['There is no real difference; they work identically', 'The kill ring holds SEVERAL recent kills simultaneously, all retrievable, rather than one slot that gets overwritten each time', 'The kill ring only holds one entry, same as a typical clipboard, but with a different name', 'The kill ring can only store single characters, not larger chunks of text'],
      correct: 1,
      explain: 'Unlike a typical clipboard\'s single overwritable slot, the kill ring holds multiple recent kills at once, all individually retrievable — not just the most recent one.'
    },
    {
      q: 'What is the difference between a "kill" command (like C-k) and a "delete" command (like plain Backspace)?',
      options: ['They are functionally identical; the names are just historical', 'Kill commands save what they remove onto the kill ring (retrievable via yank); delete commands remove text with no retrievable safety net at all', 'Delete commands are retrievable; kill commands are not', 'Kill only works on whole lines; delete only works on whole files'],
      correct: 1,
      explain: 'Kill commands push removed text onto the kill ring, genuinely retrievable via C-y/M-y later. Delete commands (like a single Backspace) simply remove text with no such safety net.'
    },
    {
      q: 'Why does M-w (kill-ring-save) have "kill" in its name despite not deleting anything?',
      options: ['It is a naming mistake that was never fixed', 'It reuses the exact same underlying kill-ring mechanism to save a copy, without performing the deletion half of an actual kill', 'M-w does actually delete text; the description is inaccurate', 'The name has nothing to do with the kill ring at all'],
      correct: 1,
      explain: 'M-w genuinely writes onto the kill ring (making the copy retrievable via yank), just without deleting the original — hence "kill-ring-save": it saves TO the kill ring, without actually killing.'
    },
    {
      q: 'What does pressing M-y immediately after C-y do?',
      options: ['Yanks a second copy of the exact same text, right after the first', 'Replaces what was just yanked with the next-older entry from the kill ring instead', 'Deletes whatever was just yanked with no replacement', 'Saves the yanked text permanently, unable to be cycled further'],
      correct: 1,
      explain: 'M-y, run immediately after a yank, substitutes the just-yanked text with the next entry back in the kill ring — letting you cycle through recent kills at the same spot until you find the one you want.'
    },
    {
      q: 'Why does Emacs NOT save every single Backspace-deleted character onto the kill ring?',
      options: ['Backspace is technically incapable of interacting with the kill ring at all', 'Saving every individually-deleted character would flood the kill ring with low-value entries, pushing out genuinely meaningful kills much faster', 'It actually does save every character; this is a common misconception', 'The kill ring has no size limit, so this would not matter either way'],
      correct: 1,
      explain: 'Treating every stray deleted character as a retrievable kill would clutter the ring with mostly-useless entries, crowding out the meaningful, intentional kills the ring is actually designed to preserve.'
    }
  ],
  pitfalls: [
    'Expecting Backspace-deleted text to be retrievable via C-y the same way a real kill is — delete commands have no kill-ring safety net at all.',
    'Forgetting that M-y only cycles backward immediately after a yank — running any other command first resets that context, and a later M-y will not behave as expected.',
    'Assuming M-w deletes the region because of the word "kill" in its name — it is purely a copy operation, leaving the original text completely untouched.'
  ],
  interview: [
    {
      q: 'Explain the kill ring\'s design, and why a ring of multiple entries is a meaningfully better model than a single-slot clipboard for real editing work.',
      a: 'The kill ring holds several recent kills simultaneously, arranged as a ring, rather than one slot that gets overwritten every time something new is cut. This matters practically because real editing often involves killing several unrelated things in sequence before pasting any of them back — with a single-slot clipboard, each new cut irretrievably destroys the previous one, forcing awkward workarounds (undo, re-selecting, retyping) the moment you need something you cut a few steps ago rather than the very last thing. The kill ring, combined with C-y (yank the most recent) and M-y (cycle backward through older entries immediately after a yank), lets you retrieve ANY sufficiently recent kill directly, without ever needing to have preserved it more carefully in the first place.'
    },
    {
      q: 'Walk through exactly what happens, mechanically, when you press C-y followed by M-y twice.',
      a: 'C-y inserts the single most recent entry from the kill ring at point — call it entry A. Pressing M-y immediately afterward does not insert a new, separate copy of anything; it specifically REPLACES the just-yanked text (entry A) with the next-older entry in the ring, entry B, at that same location. Pressing M-y a second time, still within that same yank context (no other command run in between), replaces entry B with the next-older entry still, entry C. This mechanism only works as a "cycle backward" operation immediately following a yank — the moment any other command runs in between, that specific context resets, and a subsequent M-y would behave differently (or not apply meaningfully at all) since it is no longer immediately following a yank.'
    },
    {
      q: 'Why does the distinction between "kill" and "delete" commands matter enough to be worth learning explicitly, rather than treating all text removal as functionally equivalent?',
      a: 'The practical stakes are real: assuming ALL removed text is retrievable via yank (because some of it genuinely is, via kill commands) leads directly to a nasty surprise the moment someone Backspaces away something meaningful and then tries to C-y it back, only to discover it was never on the kill ring at all, since delete commands provide no such safety net. Understanding the distinction precisely — kill commands (C-k, C-w, M-w, and others) go onto the retrievable kill ring; delete commands (individual Backspace/Delete presses, most commonly) do not — lets you correctly predict, before an editing action, whether something will be recoverable afterward, rather than discovering the answer only after already needing that recovery and finding it unavailable.'
    },
    {
      q: 'A user says they killed several lines in a row, but C-y only ever gives them back the very last one — they want an earlier one instead. What would you tell them?',
      a: 'C-y always yanks specifically the MOST RECENT kill-ring entry — that behavior is correct and expected, not a bug. To reach an earlier kill, they need M-y, pressed immediately after that C-y (with no other command run in between): each M-y press replaces whatever was just yanked with the next-older entry in the ring, letting them cycle backward, one step at a time, until they land on the specific earlier kill they actually wanted. It is worth emphasizing the "immediately after, no other command in between" condition specifically, since running anything else between the C-y and the M-y resets that cycling context and would not produce the expected substitution behavior.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover everyday killing and yanking well enough for daily use. This is what is underneath: the kill ring\'s actual size limit, how consecutive kills merge into one entry instead of many, and the system clipboard interaction.',
    sections: [
      {
        h: 'The kill ring has a configurable maximum size',
        p: [
          'The kill ring is not unbounded — it holds a fixed maximum number of entries (controlled by the variable <code>kill-ring-max</code>, defaulting to 120 in modern Emacs), after which the OLDEST entry is discarded to make room for each new one. In everyday practice this limit is rarely actually hit — 120 sufficiently distinct kills is a lot to accumulate before wanting to retrieve an old one — but it is worth knowing the ring is finite, not an infinite history of everything ever killed in a session.'
        ]
      },
      {
        h: 'Consecutive kills merge into ONE entry, not several',
        p: [
          'If you kill several times in a row with NO other command run in between (like repeated C-k presses killing several consecutive lines back to back), Emacs is smart enough to merge those into a SINGLE kill-ring entry, appended together in order, rather than creating a separate ring entry for each individual kill. This is deliberate and genuinely useful: killing five consecutive lines and then yanking gives you back all five together, in their original order, as one paste — not five separate yanks needed to reconstruct them. The moment any OTHER command runs in between two kills, though, this merging stops, and the next kill starts a fresh, separate entry instead.'
        ]
      },
      {
        h: 'Interaction with the macOS system clipboard',
        p: [
          'By default, GUI Emacs on macOS keeps the kill ring and the system-wide clipboard (the one Cmd-C/Cmd-V use in every other Mac application) synchronized — killing something in Emacs also puts it on the system clipboard, and yanking pulls from whichever was more recently updated. This is controlled by the variable <code>select-enable-clipboard</code> (t by default), and it is precisely why text killed in Emacs can typically be pasted directly into another Mac application with an ordinary Cmd-V, and vice versa — the two systems are not fully separate silos by default, even though Emacs\'s own kill ring has meaningfully more capability (the ring, M-y cycling) than the single-slot system clipboard it stays synchronized with.'
        ]
      }
    ]
  }
};
