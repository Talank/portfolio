window.LESSONS = window.LESSONS || {};
window.LESSONS['the-minibuffer-and-mx'] = {
  id: 'the-minibuffer-and-mx',
  title: 'The Minibuffer & M-x: How Every Command Actually Runs',
  category: 'Part 2 — Buffers, Windows & Files',
  timeMin: 30,
  summary: 'You have already used M-x constantly without it being fully explained — this lesson closes that gap. The minibuffer is where Emacs asks you for input, and M-x is the single most important key sequence in all of Emacs: the universal fallback that can run absolutely anything, whether or not it happens to have a keybinding. Understanding this now means you are never truly stuck for the rest of this course — if you know a command exists, you can always reach it.',
  goals: [
    'Explain what the minibuffer is, and recognize when Emacs is asking you for input through it',
    'Use M-x to run any command by name, with Tab completion',
    'Navigate minibuffer history with M-p/M-n, and cancel out of any prompt with C-g',
    'Explain why every keybinding is secretly just a shortcut for an M-x command underneath',
    'Use M-x apropos to discover a command\'s name when you only know roughly what it should do'
  ],
  concept: [
    {
      h: 'The minibuffer: where Emacs asks you for input',
      p: [
        'The <b>minibuffer</b> is the single line at the bottom of the frame that lights up whenever Emacs needs input from you — a filename for C-x C-f, a buffer name for C-x b, a search string, or a command name for M-x itself. You have already been using it in every previous lesson\'s lab without it being named directly.',
        'It is worth knowing, per Part 0\'s deep dive, that the minibuffer genuinely IS a buffer — the same underlying mechanism as everything else in Emacs, just small, temporary, and dedicated to one prompt at a time. This is not just a trivia fact: it means ordinary editing commands (moving the cursor, killing text — covered properly in Part 3) work INSIDE the minibuffer too, exactly as they would in any other buffer, rather than the minibuffer being some special, locked-down input field with its own separate rules.'
      ]
    },
    {
      h: 'M-x: the universal fallback that can run absolutely anything',
      p: [
        '<code>M-x</code> prompts, in the minibuffer, for the NAME of any command, then runs it — <code>M-x find-file <RET></code> does exactly what <code>C-x C-f</code> does; they are not two different features that happen to overlap, they are the SAME command, reached two different ways. This is the single most important fact to internalize about M-x: it is not a "menu of some things Emacs can do" — it is capable of running LITERALLY ANY command that exists in your current Emacs session, regardless of whether that command happens to have a keybinding at all.',
        'This matters enormously for a beginner specifically: you do not need to have memorized a keybinding to use a feature. If you know (or can guess, or discover via the apropos search covered below) a command\'s name, M-x can always reach it — which is exactly why M-x is the one keystroke worth having as an absolute reflex before any other keybinding in this entire course.'
      ]
    },
    {
      h: 'Completion and history: Tab, M-p, M-n, and C-g',
      p: [
        '<code>Tab</code> completes partial input in the minibuffer — start typing a command name, buffer name, or file path, and Tab either completes it (if unambiguous) or shows a list of matching possibilities (if not) — the exact same completion mechanism, reused identically everywhere the minibuffer is used, not a separate feature per prompt type.',
        'The minibuffer also remembers a HISTORY of what you have previously typed into it — <code>M-p</code> cycles backward through recent entries (of the same TYPE of prompt — command-name history is separate from file-path history), <code>M-n</code> cycles forward again. Genuinely useful for quickly re-running something you typed a moment ago without retyping it from scratch. <code>C-g</code>, exactly as in Part 0, cancels out of the minibuffer entirely — nothing happens, no command runs, safe to press whenever you have changed your mind mid-prompt.'
      ]
    },
    {
      h: 'Every keybinding is secretly just M-x under the hood',
      p: [
        'Here is the fact that ties this whole lesson (and Part 0\'s C-h k) together: a keybinding like <code>C-x C-f</code> is not a separate mechanism from M-x at all — it is a lookup table entry mapping that specific key sequence to a FUNCTION NAME (<code>find-file</code>, in this case), and pressing the key sequence simply runs that function, the exact same way M-x running that same function name by hand would. There is no functional difference whatsoever between the two paths — only speed of typing.',
        'This is exactly why <code>C-h k</code> (describe-key, from Part 0) reporting "C-n runs the command next-line" is directly actionable: <code>next-line</code> is a real function name you could type after M-x yourself, or look up fully with <code>C-h f</code>, or — as Part 4 covers — bind to your OWN preferred key later. And it is exactly why many genuinely useful Emacs commands have NO default keybinding at all — they are reachable only via M-x, which is perfectly fine, since M-x can reach absolutely anything regardless of whether a shortcut exists for it yet.'
      ]
    }
  ],
  conceptFlow: {
    title: 'C-x C-f and "M-x find-file" — the exact same destination',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Two different starting points',
        nodes: [
          { id: 'keypress', text: 'You press C-x C-f' },
          { id: 'mxtyped', text: 'You type M-x find-file <RET>' }
        ]
      },
      {
        label: 'What each actually does',
        nodes: [
          { id: 'lookup', text: 'C-x C-f is looked up\nin a keybinding table' },
          { id: 'mxlookup', text: 'M-x reads the typed name\ndirectly, no table lookup needed' }
        ]
      },
      {
        label: 'Both resolve to the same function',
        nodes: [
          { id: 'samefunc', text: 'Both paths arrive at exactly\nthe SAME function: find-file' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'Identical outcome:\nthe minibuffer prompts for a filename' }
        ]
      }
    ],
    steps: [
      { active: ['keypress'], note: 'One path: you use the fast, memorized keybinding for opening a file.' },
      { active: ['mxtyped'], note: 'The other path: you type the command\'s actual name directly into M-x, spelling it out in full.' },
      { active: ['lookup'], note: 'The keybinding path works by looking up "C-x C-f" in a table that maps key sequences to function names — that lookup resolves to the function find-file.' },
      { active: ['mxlookup'], note: 'The M-x path skips the table lookup entirely — you already gave it the function name directly.' },
      { active: ['samefunc'], note: 'Both paths converge on the exact same underlying function — find-file — being called. There is no version of find-file reached via keybinding that behaves any differently from the version reached via M-x.' },
      { active: ['result'], note: 'The outcome is completely identical either way — Emacs prompts for a filename. The ONLY difference between the two paths was how many keystrokes it took to get there, nothing about the actual behavior.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Baratie\'s Hand Signals, and Simply Saying the Dish\'s Name Instead',
      text: 'Baratie\'s kitchen runs on a small set of fast hand signals between waitstaff and cooks for the handful of most commonly ordered dishes — a specific gesture instantly means "one seafood special," another instantly means "the day\'s soup," genuinely faster than saying anything out loud during a packed dinner rush. But here is the part new waitstaff always find reassuring once someone actually explains it: those signals are not a SEPARATE ordering system running alongside the real one — each signal is quite literally nothing more than fast shorthand for calling out that exact dish\'s full name to the kitchen. And critically, for the enormous remainder of the menu that has no dedicated fast signal at all, nothing is lost or unreachable — a waiter can simply SAY any dish\'s name out loud, in full, and the kitchen will make it exactly the same way, with exactly the same result, as if a hand signal existed for it. Sanji is characteristically blunt with a nervous new hire worried about not having memorized every signal yet: "You do not need the shortcut for something to be possible. You can always just say the name. The signals only exist because saying some things fast, over and over, gets annoying — they were never the ONLY way in, just the QUICKEST way in for the handful of dishes worth memorizing a shortcut for."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The Regulars\' Diner Signals, and Just Saying the Order Instead',
      text: 'The group\'s regular diner has a small set of quick signals between the most frequent customers and their favorite server — a specific two-finger tap on the counter instantly means Sheldon\'s exact usual order, a particular nod instantly means Leonard\'s standard coffee — genuinely faster than reciting the full order out loud every single visit. But the server is careful to explain something to a new regular confused by all of it: these signals are not some separate, exclusive ordering system only available to insiders — each one is quite literally just shorthand for saying that exact order\'s full name out loud. And for absolutely anything else on the menu that has no dedicated quick signal at all, nothing is unreachable — any customer can simply SAY the item\'s exact name, and the kitchen makes it exactly the same way, with exactly the same result, as if a quick signal existed for it. Penny, watching Sheldon get oddly proprietary about "his" specific tap-signal as though it were some exclusive privilege, points out the obvious: "It is not magic, Sheldon. It is just a fast way to say what you always order. Anyone can get the exact same sandwich by literally just saying its name. Your special tap does not do anything the words themselves could not already do — it is just quicker for you specifically, because you order the exact same thing every single day."'
    },
    why: 'Baratie\'s hand signals and the diner\'s quick taps are exactly Emacs keybindings — fast, memorized shortcuts for the handful of things worth optimizing. And "just saying the dish\'s name" or "just saying the order" is exactly M-x — always available, reaches absolutely anything on the menu (or in Emacs), and is in fact the SAME underlying mechanism the shortcuts are secretly built on top of, not a separate, more limited fallback.'
  },
  tech: [
    {
      q: 'Why does it genuinely matter, practically, that the minibuffer is "just another buffer" rather than a special, separate kind of input field?',
      a: 'Because it means the exact same editing commands you use everywhere else in Emacs — moving the cursor, deleting a word, and (as Part 3 covers) killing and yanking text — work IDENTICALLY inside the minibuffer, with no separate, special-cased set of rules to learn just for typing into a prompt. Concretely: if you mistype a long file path into C-x C-f, you can use ordinary word-deletion commands to fix just the wrong part, rather than being forced to clear the entire prompt and start over, the way a more restrictive, purpose-built input field in other software often requires. This is a direct, practical payoff of Emacs\'s "everything is a buffer" architecture from Part 0\'s deep dive, not just an abstract design detail.'
    },
    {
      q: 'Why is M-x described as strictly more powerful than any individual keybinding, rather than just "another way to do the same set of things"?',
      a: 'Because keybindings only exist for a curated SUBSET of Emacs\'s full command set — the ones someone (Emacs\'s own authors, or a package author, or you yourself in Part 4) decided were common enough to deserve a fast shortcut. M-x has no such limitation at all: it can invoke ANY interactively-callable function currently loaded in your Emacs session, whether or not anyone ever bothered assigning it a keybinding. This means the actual CEILING of what M-x can reach is the entire set of everything Emacs (and every package you have installed) can do — strictly a superset of what any collection of keybindings, no matter how extensive, could ever cover on its own.'
    },
    {
      q: 'Why does M-x apropos exist, and what problem does it solve that plain M-x completion does not?',
      a: 'Plain M-x completion requires you to already know, or closely guess, the exact command NAME you want — genuinely fine once you know Emacs\'s naming conventions well, but a real obstacle for a beginner who knows roughly what they want to accomplish ("something about counting words in this buffer") without knowing the precise function name Emacs happens to use for it. M-x apropos instead takes a rough keyword or regex and searches across EVERY loaded command\'s name and documentation for anything matching, surfacing candidates you would never have found by guessing a name and hoping Tab-completion would confirm it. It is specifically the tool for "I know what I want to do, I do not know what Emacs calls it" — a genuinely different, complementary use case from M-x\'s own name-based completion.'
    }
  ],
  code: {
    title: 'M-x, completion, history, and discovering an unknown command',
    intro: 'Try each of these for real — none of them are destructive.',
    code: `M-x find-file <RET>
;; Prompts for a filename — behaves IDENTICALLY to pressing C-x C-f directly.

M-x forw<TAB>
;; Tab-completes toward matching commands. If ambiguous, shows a list:
;; forward-char  forward-line  forward-page  forward-paragraph  forward-sentence  forward-word
;; Keep typing to narrow it down, then Tab/RET.

;; Minibuffer history — after running a few M-x commands:
M-x <M-p>
;; Cycles back to the PREVIOUS command you ran via M-x — re-run it with RET,
;; or keep pressing M-p to go further back through your recent history.

;; Cancel out of any prompt at any point:
M-x find-fi<C-g>
;; Nothing happens — you're back to normal editing, no command ran.

;; Discovering a command by rough description instead of exact name:
M-x apropos <RET> count words <RET>
;; Shows every loaded command whose name OR documentation mentions
;; "count" and "words" — surfacing count-words, count-words-region, etc.,
;; even though you never had to know those exact function names upfront.

;; Confirming the "same function either way" idea directly:
C-h k C-x C-f
;; *Help* buffer shows: "C-x C-f runs the command find-file"
;; — the exact same name you'd type after M-x yourself.`,
    notes: [
      'M-p and M-n cycle through history separately PER PROMPT TYPE — your M-x command history is tracked separately from your C-x C-f file-path history, even though both use M-p/M-n the same way.',
      'apropos\'s search covers documentation text too, not just command names — searching for a rough description often works even when you have no idea what Emacs actually calls the feature.'
    ]
  },
  lab: {
    title: 'Write the M-x sequences and explain the underlying mechanism',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: run the command "list-buffers" via M-x (not via any keybinding)


# Task: cancel out of an M-x prompt you've started typing into, without running anything


# Task: search for a command related to "replace" without knowing its exact name


# Q: Explain, in one or two sentences, why "C-x C-s" and "M-x save-buffer" produce
# the exact same result.

`,
    checks: [
      { re: 'M-x\\s+list-buffers', flags: 'i', must: true, hint: 'M-x list-buffers <RET>', pass: 'M-x list-buffers ✓' },
      { re: 'C-g', flags: '', must: true, hint: 'C-g cancels out of any in-progress minibuffer prompt.', pass: 'C-g ✓' },
      { re: 'M-x\\s+apropos.*replace|apropos[\\s\\S]*replace', flags: 'i', must: true, hint: 'M-x apropos <RET> replace <RET>', pass: 'M-x apropos replace ✓' },
      { re: 'same\\s+function|identical|underlying\\s+function|both.*find-file|both.*save-buffer', flags: 'i', must: true, hint: 'A keybinding is just a shortcut mapped to a function name — M-x running that same function name directly produces identical behavior.', pass: 'Explained the shared-function mechanism ✓' }
    ],
    run: 'Try it for real: M-x apropos <RET> and search for something vague you want to do — see what turns up.',
    solution: `# Task: run the command "list-buffers" via M-x (not via any keybinding)
M-x list-buffers <RET>

# Task: cancel out of an M-x prompt you've started typing into, without running anything
C-g

# Task: search for a command related to "replace" without knowing its exact name
M-x apropos <RET> replace <RET>

# Q: Explain, in one or two sentences, why "C-x C-s" and "M-x save-buffer" produce
# the exact same result.
# C-x C-s is a keybinding that is looked up in a table mapping key sequences to
# function names, resolving to the function save-buffer — M-x save-buffer calls
# that exact same function directly by name. Both paths run the identical
# underlying function, so the result is identical either way.`,
    notes: [
      'C-h k on C-x C-s (from Part 0) would directly confirm this — it reports the exact function name the keybinding resolves to.',
      'This underlying mechanism — keybindings as shortcuts to function names — is exactly what makes Part 4\'s custom keybinding lesson possible: binding your own key just means adding your own entry to that same lookup table.'
    ]
  },
  quiz: [
    {
      q: 'What is the minibuffer?',
      options: ['A special, separate input field unrelated to Emacs\'s normal buffers', 'A genuine buffer at the bottom of the frame, used for prompts (filenames, command names, search strings)', 'A permanent status display that never changes', 'A separate application window'],
      correct: 1,
      explain: 'The minibuffer is a real buffer, using the same underlying mechanism as any other buffer — which is exactly why ordinary editing commands work inside it too.'
    },
    {
      q: 'What is the key difference between M-x and any individual keybinding, in terms of what each can reach?',
      options: ['They can reach exactly the same set of commands, no difference at all', 'M-x can run ANY interactively-callable command currently loaded, whether or not it has a keybinding; a keybinding only reaches whatever specific command it happens to be bound to', 'Keybindings can reach more commands than M-x can', 'M-x only works for file-related commands'],
      correct: 1,
      explain: 'M-x has no restriction to a curated set — it can invoke absolutely any loaded command by name, while a keybinding only ever reaches the one specific function it has been mapped to.'
    },
    {
      q: 'What do "C-x C-f" and "M-x find-file" actually have in common?',
      options: ['Nothing; they are two unrelated features that happen to look similar', 'They are two different paths to calling the exact same underlying function — identical result, just different amounts of typing', 'C-x C-f is faster but does something subtly different from M-x find-file', 'M-x find-file only works if C-x C-f has already been used once'],
      correct: 1,
      explain: 'A keybinding is a shortcut mapped to a function name in a lookup table — pressing it runs that exact function, the same one M-x would call if you typed its name directly. No behavioral difference exists between the two paths.'
    },
    {
      q: 'What does M-x apropos let you do that plain M-x completion does not?',
      options: ['Run a command faster than M-x normally allows', 'Search for a command by rough keyword/description across names AND documentation, useful when you do not know a command\'s exact name', 'Automatically fix typos in file paths', 'Bind a new keybinding to a command'],
      correct: 1,
      explain: 'apropos searches loaded commands\' names and documentation for a rough keyword match — solving the "I know what I want to do, not what it\'s called" problem plain name-based completion cannot address.'
    },
    {
      q: 'What does M-p do while typing into the minibuffer?',
      options: ['Pastes the system clipboard', 'Cycles backward through the history of previous entries typed into that SAME TYPE of prompt', 'Permanently deletes the current input', 'Opens a new minibuffer prompt'],
      correct: 1,
      explain: 'M-p cycles backward through minibuffer history for that specific prompt type (command names, file paths, etc., tracked separately) — a fast way to reuse something typed recently without retyping it.'
    }
  ],
  pitfalls: [
    'Memorizing keybindings while never getting comfortable with M-x, then feeling genuinely stuck the moment a needed command has no keybinding you happen to know.',
    'Not realizing C-g safely cancels an in-progress M-x prompt — hesitating or fumbling through an unwanted command instead of just cancelling and starting over.',
    'Assuming a command must not exist just because no keybinding for it is known — M-x apropos with a rough description very often turns up exactly the right command, unbound or not.'
  ],
  interview: [
    {
      q: 'Explain why M-x is described as "the universal fallback" in Emacs, and why that framing matters for how someone should approach learning the editor.',
      a: 'M-x can invoke ANY interactively-callable command currently loaded in an Emacs session — not a curated subset, the entire set, including commands with no assigned keybinding at all. This means a user never needs to have memorized a shortcut for something to actually be able to use it: if a feature exists and its name is known (or discoverable via apropos), M-x can always reach it. This reframes how learning Emacs should actually proceed — rather than treating "I do not know the keybinding" as a genuine blocker, M-x means it is only ever a minor inconvenience (a few more keystrokes than the eventual shortcut), which is exactly why building comfort with M-x early is more valuable than front-loading keybinding memorization.'
    },
    {
      q: 'Walk through, precisely, why a keybinding and its equivalent M-x invocation produce identical behavior rather than just similar behavior.',
      a: 'A keybinding is implemented as an entry in a lookup table (a keymap) mapping a specific key sequence to a FUNCTION NAME — pressing that key sequence is Emacs looking up the corresponding function and calling it. M-x, when given a command name directly, calls that exact same function by name, through the identical calling mechanism. There is no separate "keybinding version" of a function\'s behavior distinct from its "M-x version" — both paths invoke the literal same underlying function, with the literal same code executing either way. The only difference between the two paths is how many keystrokes were required to arrive at calling that function — a speed difference, not a behavioral one.'
    },
    {
      q: 'How would you help a beginner who knows roughly what they want Emacs to do but has no idea what the relevant command is called?',
      a: 'Point them at M-x apropos specifically — it takes a rough keyword or short description and searches across every currently-loaded command\'s NAME and DOCUMENTATION for a match, surfacing plausible candidates without requiring the user to already know Emacs\'s naming conventions or guess correctly at a function name. This is a genuinely different tool from M-x\'s own name-based Tab completion, which only helps once you already roughly know what the command is called — apropos is specifically the tool for "I know what I want to accomplish, not what Emacs calls it," which is exactly the situation most beginners are actually in most of the time.'
    },
    {
      q: 'Why does it matter that the minibuffer is implemented as a genuine buffer rather than a specialized, separate input widget?',
      a: 'Because it means the SAME editing commands and mechanisms that work throughout the rest of Emacs also work while typing into a minibuffer prompt — cursor movement, text deletion, and (once Part 3 covers it) killing and yanking all behave identically inside the minibuffer as they do in any ordinary buffer, with no separate, specialized rules to learn just for prompts. This is a direct, practical consequence of the "everything is a buffer" architecture introduced in Part 0\'s deep dive — rather than being a curiosity, it means skills learned for editing text generally transfer immediately and fully to editing minibuffer input, with zero additional learning required.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover M-x, completion, and history well enough for daily use. This is what is underneath: persisting history across sessions, prefix arguments, and modern completion frameworks that meaningfully improve on the defaults.',
    sections: [
      {
        h: 'Making minibuffer history survive a restart: savehist-mode',
        p: [
          'By default, minibuffer history (the M-p/M-n entries from this lesson) only persists for the CURRENT Emacs session — restart Emacs, and that history is gone. <code>(savehist-mode 1)</code> in your init.el (Part 4\'s subject) changes this: it periodically saves minibuffer history to a file on disk and reloads it automatically on startup, so your recently-used commands, file paths, and search terms remain available via M-p even after quitting and restarting Emacs — genuinely worth enabling immediately, since there is essentially no downside and a real, constant, everyday convenience gain.'
        ]
      },
      {
        h: 'Prefix arguments: C-u, a preview of a genuinely useful pattern',
        p: [
          'Many commands change behavior when given a <b>prefix argument</b> via <code>C-u</code> before invoking them — <code>C-u M-x some-command</code> often runs that command in some alternate, extended mode, or with a specific numeric argument if you type <code>C-u 4 M-x some-command</code> (meaning "with argument 4"). A concrete, genuinely common example: plain <code>C-k</code> (covered properly in Part 3\'s kill-ring lesson) kills to the end of the current line, while <code>C-u C-k</code> kills multiple lines at once. This is a general-purpose mechanism, not specific to any one command — worth knowing exists now, even before Part 3 makes full practical use of it.'
        ]
      },
      {
        h: 'Beyond default completion: Vertico, Consult, and friends',
        p: [
          'Emacs\'s BUILT-IN minibuffer completion (what this lesson covers) is functional but genuinely minimal by modern standards — a flat, sometimes hard-to-scan list of matches. Popular third-party packages (covered properly in Part 4\'s package-management lesson) like <b>Vertico</b> (a vertical, more readable completion UI), <b>Marginalia</b> (adds helpful annotations next to completion candidates, like a command\'s brief description right there in the list), and <b>Consult</b> (a large collection of enhanced, apropos-like search commands) meaningfully upgrade this everyday experience without changing any of the underlying concepts this lesson teaches — the mental model of "minibuffer, completion, history" stays exactly the same, these packages simply make the visual and search experience considerably nicer. Worth knowing they exist now, even though installing them is a Part 4 concern.'
        ]
      }
    ]
  }
};
