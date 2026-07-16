window.LESSONS = window.LESSONS || {};
window.LESSONS['buffers-windows-frames'] = {
  id: 'buffers-windows-frames',
  title: 'Buffers, Windows & Frames: Emacs\'s Own Vocabulary',
  category: 'Part 2 — Buffers, Windows & Files',
  timeMin: 35,
  summary: 'Three words you already think you know — buffer, window, frame — mean something genuinely different, and genuinely more precise, in Emacs than in almost any other software. Getting this vocabulary straight now saves real confusion later: nearly every editing and navigation lesson ahead assumes you already know exactly which of these three things a given command actually operates on.',
  goals: [
    'Define buffer, window, and frame precisely, and distinguish each from the others',
    'Switch to a different buffer with C-x b, and list every open buffer with C-x C-b',
    'Split the current window with C-x 2 (below) and C-x 3 (side by side), and move focus between windows with C-x o',
    'Close extra windows back down to one with C-x 1, and close just the current window with C-x 0',
    'Explain why closing a window is not the same as closing (killing) a buffer'
  ],
  concept: [
    {
      h: 'A buffer is content — it exists whether or not anything is showing it',
      p: [
        'A <b>buffer</b> is Emacs\'s unit of actual TEXT CONTENT — when you open a file, Emacs loads its contents into a buffer, but the buffer is not the same thing as the file itself: it is an in-memory copy you are editing, only written back to disk when you explicitly save. Not every buffer even corresponds to a file at all — <code>*scratch*</code> (the Lisp REPL from Part 0), <code>*Messages*</code> (a running log of status messages Emacs has shown you), and even the minibuffer itself are all buffers, using the same underlying mechanism as any file you open.',
        'Critically, a buffer can exist perfectly well without being VISIBLE anywhere on screen at all — opening ten files creates ten buffers, but you might only be looking at one or two of them at any given moment. "The buffer is open" and "the buffer is currently visible" are genuinely different, independent facts.'
      ]
    },
    {
      h: 'A window is a viewport — it shows a buffer, but is not the buffer itself',
      p: [
        'A <b>window</b> in Emacs is a rectangular region of the screen that displays SOME buffer\'s content — a viewport, not the content itself. This is the single most common point of confusion for anyone coming from other software, where "window" usually means what Emacs calls a frame (covered next). In Emacs specifically, "window" refers to one of possibly SEVERAL such viewports that can exist simultaneously, side by side or stacked, all within one single outer application window.',
        'Because a window is just a viewport, the SAME buffer can be shown in TWO DIFFERENT windows at once, each independently scrolled — genuinely useful for viewing the top and bottom of one long file simultaneously, without any special "split view" feature; it is simply two windows pointed at the same buffer.'
      ]
    },
    {
      h: 'A frame is what most other software calls a "window" — Emacs\'s own OS-level window',
      p: [
        'A <b>frame</b> is what nearly every other piece of software calls a "window": an actual, OS-level application window, the kind you can move around your screen, resize, or minimize. Most people only ever use ONE frame at a time — Emacs supports multiple (<code>C-x 5 2</code> creates a new one), but that is a genuinely advanced, optional feature this course will not dwell on.',
        'The naming collision between Emacs\'s "window" and everyone else\'s "window" is a real, historical artifact — Emacs\'s terminology predates the graphical desktop conventions most people are familiar with today, and changing decades of established terminology (and documentation, and muscle memory) at this point would cause far more confusion than it would solve. The practical fix is simply learning the vocabulary once, here, rather than expecting it to match assumptions carried over from other software.'
      ]
    },
    {
      h: 'Switching, splitting, and the crucial distinction: closing a window never touches buffer content',
      p: [
        '<code>C-x b</code> switches the current window to show a DIFFERENT buffer (with completion — start typing a buffer name and Tab-complete it). <code>C-x C-b</code> lists every currently open buffer in its own buffer, genuinely useful for seeing everything you have open at once. <code>C-x 2</code> splits the current window into two, stacked vertically (one above the other); <code>C-x 3</code> splits it side by side instead. <code>C-x o</code> ("other window") moves your focus to the next window when more than one is visible.',
        '<code>C-x 1</code> closes every OTHER window, keeping only the current one (genuinely common after a split you no longer need). <code>C-x 0</code> closes just the CURRENT window specifically, keeping the others. Here is the point worth internalizing precisely: none of these four commands touch any buffer\'s actual CONTENT at all — they only change what is currently VISIBLE. Closing every window showing a buffer does not delete that buffer or its content; the buffer still exists, just not currently displayed anywhere, and switching back to it with C-x b brings it right back exactly as it was. Actually removing a buffer entirely — the real equivalent of "closing a file" — is a separate action (<code>C-x k</code>, kill-buffer), not something splitting or closing windows ever does.'
      ]
    }
  ],
  conceptFlow: {
    title: 'One frame, two windows, three buffers — who is showing what',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The frame (your one OS-level Emacs window)',
        nodes: [
          { id: 'frame', text: 'ONE frame\n(what your OS calls "the Emacs window")' }
        ]
      },
      {
        label: 'Windows inside it, after C-x 3',
        nodes: [
          { id: 'win1', text: 'Window 1 (left)\ncurrently showing: notes.txt' },
          { id: 'win2', text: 'Window 2 (right)\ncurrently showing: *scratch*' }
        ]
      },
      {
        label: 'Buffers that exist right now',
        nodes: [
          { id: 'bufnotes', text: 'Buffer: notes.txt\n(visible, in Window 1)' },
          { id: 'bufscratch', text: 'Buffer: *scratch*\n(visible, in Window 2)' },
          { id: 'bufhidden', text: 'Buffer: README.md\n(open, but NOT currently\nvisible in any window)' }
        ]
      }
    ],
    steps: [
      { active: ['frame'], note: 'Start with one frame — the single OS-level application window most people use, containing everything else.' },
      { active: ['win1'], note: 'After C-x 3 (split side by side), the frame now contains two separate windows — Window 1 is currently displaying the notes.txt buffer.' },
      { active: ['win2'], note: 'Window 2, right next to it, is currently displaying an entirely different buffer, *scratch*.' },
      { active: ['bufnotes'], note: 'notes.txt exists as a buffer, and right now it happens to be visible, specifically in Window 1.' },
      { active: ['bufscratch'], note: '*scratch* also exists as a buffer, visible right now in Window 2 — two windows, two different buffers, both visible simultaneously.' },
      { active: ['bufhidden'], note: 'README.md was opened earlier and is STILL a perfectly real, existing buffer — it simply is not currently shown in either visible window. C-x b and typing "README" would bring it right back into whichever window is currently focused, exactly as it was left.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Sunny\'s Log Books, Its Portholes, and the Ship Itself',
      text: 'Franky designed the Sunny with a genuinely useful distinction most other ships never bother making. The ship keeps several separate LOG BOOKS at all times — the navigation log, the repair log, the supply inventory — each one existing, being written into, and holding real information, entirely independent of whether anyone currently has it open on a table reading it. A log book does not stop existing or lose its entries just because nobody happens to be looking at it at this exact moment. Separately, the deck has several PORTHOLES built specifically as viewing stations — each one can be aimed at whichever log book someone currently wants to consult, and crucially, TWO different portholes can be aimed at the SAME log book simultaneously, one showing an earlier page, one showing a later page, without any conflict at all. Closing a porthole\'s shutter — stopping that particular view — does absolutely nothing to the log book sitting on the shelf behind it; the book is completely unaffected, just no longer being actively viewed through that specific porthole. And the SUNNY ITSELF, the actual outer hull containing all of this, is the one thing there is only ever one of — you do not get "a second ship" just because you opened a second porthole. Chopper, new to the system, once worriedly asks Franky whether shutting a porthole "loses" whatever log book was showing through it. Franky\'s answer is immediate: "The book\'s still on the shelf. You just stopped looking at it through that one particular hole. Completely different things."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The Building\'s Security Feeds, the Monitor Screens, and the Control Room',
      text: 'The building\'s security setup, which Sheldon insists on explaining to anyone who will listen, has exactly the same three-part structure. Multiple CAMERA FEEDS run continuously — the lobby feed, the parking garage feed, the hallway feed — each one genuinely existing and recording, entirely independent of whether anyone in the control room currently has it pulled up on a screen. A feed does not stop existing just because nobody happens to be watching it at this particular moment. Separately, the control room has several MONITOR SCREENS, each independently switchable to display whichever feed someone currently wants to check — and, notably, two different monitors can display the SAME feed simultaneously, one zoomed on one section, one on another, with no conflict whatsoever. Turning off one monitor — no longer displaying anything through it — does absolutely nothing to the actual camera feed behind it; the feed keeps running exactly as before, simply not being actively viewed on that particular screen anymore. And the CONTROL ROOM ITSELF, the physical room containing every monitor and connected to every feed, is the one thing there is genuinely only one of in this setup — Sheldon does not get "a second control room" by simply turning on a second monitor. Penny, watching Sheldon fumble through overly precise terminology about all this, eventually just asks the practical question: "So turning off a screen doesn\'t actually delete anything?" Sheldon, visibly relieved someone finally asked the right question: "Correct. Finally. The feed is completely unaffected — you have only changed what is currently being displayed, not what exists."'
    },
    why: 'The Sunny\'s log books, and the building\'s camera feeds, are Emacs buffers — real content, existing independent of whether anything is currently showing them. The portholes, and the monitor screens, are Emacs windows — viewports that can be closed, split, or redirected without ever touching the actual content behind them. And the ship itself, or the control room itself, is the frame — the one outer container everything else lives inside. Closing a window (or a porthole, or a monitor) never deletes what it was showing — that is the single most important idea this lesson is built around.'
  },
  tech: [
    {
      q: 'Why would you ever want the SAME buffer visible in two different windows at once, rather than just scrolling one window back and forth?',
      a: 'Because each window maintains its OWN independent scroll position (and even, sometimes, independent cursor position, depending on configuration) into the same underlying buffer content — showing the same buffer in two windows lets you view two DIFFERENT parts of one file simultaneously, like keeping a function\'s definition visible in one window while scrolling through its many call sites in another, or comparing an early section of a long document against a later one without repeatedly scrolling back and forth and losing your place each time. Since both windows point at the exact same underlying buffer, an edit made in either window is immediately reflected in both — there is only ever one actual copy of the content, just two independent views into it.'
    },
    {
      q: 'Why does closing a window (C-x 0) never delete the buffer it was showing, and what command actually WOULD get rid of a buffer entirely?',
      a: 'A window is purely a viewport — a rectangular region currently DISPLAYING some buffer\'s content — and closing it only removes that particular viewport from the screen; it has no relationship at all to the buffer\'s own lifecycle, which is managed entirely separately. The buffer continues existing in memory, fully intact, regardless of how many (including zero) windows are currently showing it — C-x b and typing its name brings it right back, unchanged, in whichever window you switch it into. Actually removing a buffer — the genuine equivalent of "closing this file" in most other software — requires C-x k (kill-buffer), a completely separate command operating on buffers directly, not on windows at all.'
    },
    {
      q: 'Why does Emacs call an OS-level application window a "frame" instead of just "window," given how confusing that is for newcomers?',
      a: 'This is a genuinely historical naming artifact: Emacs\'s "window" terminology (meaning a viewport within the application, as covered in this lesson) was established decades ago, before the graphical desktop conventions most people know today — where "window" universally means an OS-level application window — had become the dominant, near-universal usage. By the time desktop GUIs standardized "window" to mean what Emacs calls a "frame," Emacs\'s own terminology was already deeply embedded across decades of documentation, tutorials, and every long-time user\'s existing muscle memory — changing it retroactively would have caused far more disruption and confusion than simply keeping the (admittedly confusing, to a newcomer) existing terms. The practical resolution is exactly what this lesson does: learn Emacs\'s specific vocabulary deliberately, rather than assuming it matches whatever "window" already means from other software.'
    }
  ],
  code: {
    title: 'Buffers, windows, and switching between them',
    intro: 'Try each of these in a real Emacs session — none of them touch any file\'s actual saved content.',
    code: `;; Open a couple of files first, so there's something to switch between:
C-x C-f notes.txt <RET>
C-x C-f README.md <RET>

;; See every buffer currently open:
C-x C-b
;; Shows a *Buffer List* buffer — notice notes.txt, README.md, *scratch*,
;; *Messages*, and *Buffer List* itself are ALL buffers.

;; Switch back to notes.txt, with completion:
C-x b notes<TAB><RET>

;; Split the window side by side:
C-x 3
;; Now two windows are visible, both currently showing notes.txt.

;; Move focus to the other window, then switch IT to a different buffer:
C-x o
C-x b README<TAB><RET>
;; Now: left window shows notes.txt, right window shows README.md —
;; same frame, two windows, two different buffers.

;; Close the other window, keeping just the current one:
C-x 1
;; The README.md BUFFER still exists — only its WINDOW closed.
;; C-x b README<TAB><RET> would bring it right back.

;; Actually remove a buffer entirely (different from closing its window):
C-x k README.md <RET>
;; NOW README.md is genuinely gone from the buffer list.`,
    notes: [
      'C-x 1 and C-x 0 are easy to mix up at first: C-x 1 keeps the CURRENT window and closes every other one; C-x 0 closes the CURRENT window and keeps every other one — opposite targets.',
      'The *Buffer List* buffer (opened by C-x C-b) is itself just another buffer — you can even switch away from it and back with C-x b like any other, which is a nice small confirmation of how uniformly the buffer concept applies.'
    ]
  },
  lab: {
    title: 'Write the right buffer/window commands',
    prompt: 'Write exactly one key sequence per task below.',
    starter: `# Task: switch the current window to show a buffer named "todo.txt"


# Task: list every currently open buffer


# Task: split the current window side by side (left/right)


# Task: move focus to the other window after a split


# Task: close every window except the current one

`,
    checks: [
      { re: 'C-x\\s+b.*todo', flags: 'i', must: true, hint: 'C-x b, then type todo.txt (or enough to complete it), then RET.', pass: 'C-x b todo.txt ✓' },
      { re: 'C-x\\s+C-b', flags: 'i', must: true, hint: 'C-x C-b lists every open buffer.', pass: 'C-x C-b ✓' },
      { re: 'C-x\\s+3', flags: '', must: true, hint: 'C-x 3 splits side by side.', pass: 'C-x 3 ✓' },
      { re: 'C-x\\s+o', flags: '', must: true, hint: 'C-x o moves focus to the other window.', pass: 'C-x o ✓' },
      { re: 'C-x\\s+1', flags: '', must: true, hint: 'C-x 1 closes every OTHER window, keeping the current one.', pass: 'C-x 1 ✓' }
    ],
    run: 'Try it for real: open two files, C-x 3 to split, C-x o to switch focus, then C-x 1 to go back to one window — confirm the buffer you closed the window on is still reachable via C-x b.',
    solution: `# Task: switch the current window to show a buffer named "todo.txt"
C-x b todo.txt <RET>

# Task: list every currently open buffer
C-x C-b

# Task: split the current window side by side (left/right)
C-x 3

# Task: move focus to the other window after a split
C-x o

# Task: close every window except the current one
C-x 1`,
    notes: [
      'C-x b supports Tab-completion — you rarely need to type a buffer\'s full name, just enough to disambiguate it.',
      'None of these five commands ever delete or modify a buffer\'s actual content — that is exactly the point this lesson is making.'
    ]
  },
  quiz: [
    {
      q: 'What is a buffer, precisely?',
      options: ['An OS-level application window', 'A viewport that displays some content on screen', 'Emacs\'s unit of actual text content, which can exist whether or not it is currently visible anywhere', 'A temporary clipboard for copied text'],
      correct: 2,
      explain: 'A buffer holds actual content — a file\'s text, or non-file content like *scratch* — and continues existing regardless of whether any window is currently displaying it.'
    },
    {
      q: 'What does Emacs call an actual OS-level application window (the kind you can move or resize on your desktop)?',
      options: ['A buffer', 'A window', 'A frame', 'A viewport'],
      correct: 2,
      explain: 'Confusingly to newcomers, Emacs calls an OS-level window a "frame" — "window," in Emacs, means something narrower: a viewport within a frame.'
    },
    {
      q: 'Can the same buffer be shown in two different windows at the same time?',
      options: ['No, each buffer can only ever be shown in one window at a time', 'Yes — each window maintains its own independent scroll position into the same underlying buffer content', 'Only if the buffer is read-only', 'Only across two different frames, never within the same frame'],
      correct: 1,
      explain: 'A window is just a viewport, and multiple windows can point at the exact same buffer simultaneously, each independently scrolled — an edit in one is immediately reflected in the other, since there is only one actual buffer.'
    },
    {
      q: 'What happens to a buffer\'s content when you close the window that was displaying it (C-x 0)?',
      options: ['The buffer and its content are permanently deleted', 'Nothing — the buffer continues to exist unchanged; only its visibility in that particular window ends', 'The content is automatically saved and the buffer is closed', 'The buffer becomes read-only until reopened'],
      correct: 1,
      explain: 'Closing a window only removes that viewport — it has no effect on the underlying buffer, which continues existing exactly as it was and can be brought back into view with C-x b.'
    },
    {
      q: 'What is the difference between C-x 1 and C-x 0?',
      options: ['They are identical commands', 'C-x 1 keeps the current window and closes every other one; C-x 0 closes the current window and keeps every other one', 'C-x 1 closes a buffer; C-x 0 closes a window', 'C-x 1 only works with two windows; C-x 0 works with any number'],
      correct: 1,
      explain: 'C-x 1 ("just this one") keeps only the current window; C-x 0 ("zero of this one") closes specifically the current window, leaving the rest — opposite targets, easy to mix up at first.'
    }
  ],
  pitfalls: [
    'Assuming closing a window deletes the buffer it was showing — it does not; the buffer persists until explicitly killed with C-x k, a completely separate action.',
    'Confusing Emacs\'s "window" (a viewport within the application) with what other software calls a window (an OS-level application window, which Emacs calls a "frame") — this mismatch causes real confusion reading Emacs documentation until the vocabulary is deliberately learned.',
    'Mixing up C-x 1 and C-x 0 — one keeps the current window and closes the rest, the other closes the current window and keeps the rest; genuinely easy to reverse under time pressure until it becomes automatic.'
  ],
  interview: [
    {
      q: 'Explain the distinction between a buffer, a window, and a frame in Emacs, and why this three-way distinction matters practically.',
      a: 'A buffer is actual text content, existing in memory independent of whether it is currently displayed anywhere — a file\'s loaded contents, or non-file content like *scratch*. A window is a viewport, a rectangular region of the screen currently displaying SOME buffer\'s content — multiple windows can exist simultaneously, and multiple windows can even display the same buffer at once, each independently scrolled. A frame is what most other software calls a "window" — an actual OS-level application window, which can itself contain multiple Emacs windows arranged within it. This matters practically because commands that operate on windows (splitting, closing) never affect buffer content at all, and understanding that distinction precisely is what prevents genuine confusion — like worrying that closing a window has "lost" unsaved work, when in fact the buffer (and any unsaved changes within it) is completely unaffected by a window closing.'
    },
    {
      q: 'A colleague closes a window in Emacs and panics, thinking they have lost the file they were editing. What would you tell them, and why is your explanation actually correct rather than just reassuring?',
      a: 'Closing a window never deletes or affects the underlying buffer\'s content — a window is purely a viewport, and closing it only removes that specific viewport from the screen; the buffer it was displaying continues existing in memory, completely unchanged, including any unsaved edits. Pressing C-x b and typing the buffer\'s name (with Tab-completion) will bring it right back into view, exactly as it was left, in whichever window is currently focused. This is not merely reassuring — it reflects the actual, deliberate architectural separation between "what content exists" (buffers) and "what is currently visible" (windows), which is precisely the distinction this course spends real time establishing before any real editing work, because assuming the two are the same thing (as most other software\'s single "close this document" action encourages) leads to exactly this kind of unfounded panic.'
    },
    {
      q: 'Why might showing the same buffer in two different windows be genuinely more useful than simply scrolling one window back and forth?',
      a: 'Each window maintains its own independent scroll position into the shared underlying buffer, so two windows on the same buffer let you view two entirely different parts of that buffer\'s content SIMULTANEOUSLY — comparing an early section against a later one, or keeping a reference point (like a function definition) continuously visible in one window while scrolling freely through the rest of the file in another, without ever losing your place in either. Since both windows point at the exact same actual buffer (not separate copies), any edit made in either window is immediately reflected in both — there is no synchronization concern, because there was only ever one underlying copy of the content to begin with.'
    },
    {
      q: 'Why does Emacs\'s terminology for "window" and "frame" diverge from nearly every other application\'s conventions, and is this worth "fixing"?',
      a: 'Emacs established its own "window" terminology (meaning a viewport within the application) decades before the now-nearly-universal desktop convention of "window" meaning an OS-level application window became standard. By the time that convention solidified across the broader software world, Emacs\'s own terminology was already deeply embedded in decades of documentation, community knowledge, and every existing user\'s ingrained muscle memory. "Fixing" it retroactively — renaming Emacs\'s "window" to something else, or renaming "frame" to "window" — would break an enormous amount of existing documentation, tutorials, and reflexive terminology use across the entire Emacs ecosystem, for the sole benefit of matching an external convention Emacs itself predates. The practical, and genuinely reasonable, resolution is what this lesson does instead: teach the actual, specific vocabulary deliberately, rather than assuming it will match unrelated software\'s conventions.'
    }
  ]
};
