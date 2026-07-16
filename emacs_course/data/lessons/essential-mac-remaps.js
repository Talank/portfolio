window.LESSONS = window.LESSONS || {};
window.LESSONS['essential-mac-remaps'] = {
  id: 'essential-mac-remaps',
  title: 'Fixing It Properly: Terminal.app, iTerm2 & GUI Emacs Settings',
  category: 'Part 1 — The Mac Keybinding Model',
  timeMin: 30,
  summary: 'The last lesson explained the Option/Meta conflict and the three ways to resolve it. This one is the actual how-to: the specific settings in Terminal.app, the more capable settings in iTerm2, and the elisp variables in GUI Emacs — plus how to verify, using the C-h k help command from Part 0, that whichever fix you apply is genuinely working before you build any real muscle memory on top of it.',
  goals: [
    'Enable "Use Option as Meta key" in Terminal.app',
    'Configure iTerm2\'s independent left/right Option key settings for the split-Option resolution',
    'Set mac-option-modifier, mac-right-option-modifier, and mac-command-modifier in a GUI Emacs init.el',
    'Verify a Meta-key fix is actually working using C-h k',
    'Explain why picking ONE consistent setup across however you run Emacs matters more than which specific resolution you pick'
  ],
  concept: [
    {
      h: 'Terminal.app: one blunt, all-or-nothing switch',
      p: [
        'macOS\'s built-in Terminal.app offers the simplest possible fix, and it only implements Resolution 1 from the last lesson (full commit) — there is no left/right split available here. Open <b>Terminal → Settings → Profiles → [your profile] → Keyboard</b>, and check <b>"Use Option as Meta key."</b> That is the entire configuration — both Option keys now send Meta, uniformly, with no per-side distinction possible in Terminal.app itself.',
        'This is genuinely fine if you have decided Resolution 1 (full Option-to-Meta commit) is right for you. If you specifically want the split-Option approach (Resolution 3, right Option only), Terminal.app cannot do it — you would need to switch to a more capable terminal emulator, which is exactly why the next section covers iTerm2.'
      ]
    },
    {
      h: 'iTerm2: independent left and right Option settings',
      p: [
        'iTerm2 (a free, extremely popular Terminal.app replacement, genuinely worth installing specifically for this reason among others) exposes LEFT and RIGHT Option as two independently configurable settings: <b>iTerm2 → Settings → Profiles → [your profile] → Keys → Left Option Key</b> and <b>Right Option Key</b>, each settable to <code>Normal</code> (macOS\'s default accent-composition behavior) or <code>Esc+</code> (send an Escape-prefix sequence for that key instead).',
        'To implement Resolution 3 (the split approach recommended for anyone who types accented characters with any regularity): set <b>Left Option Key</b> to <code>Normal</code> (preserving accent composition) and <b>Right Option Key</b> to <code>Esc+</code>. That <code>Esc+</code> label is worth reading literally — it means iTerm2 itself, on seeing that specific key pressed, sends an actual Escape character followed by whatever key you pressed next, leveraging the EXACT SAME "Escape-as-Meta" convention from the previous lesson, rather than sending some genuinely different, more exotic signal. Right Option effectively BECOMES a fast way to trigger that same fallback mechanism, automatically, on every keypress.'
      ]
    },
    {
      h: 'GUI Emacs: elisp variables, set once, in your init.el',
      p: [
        'GUI Emacs (Emacs.app) needs none of the above — it talks to macOS directly, with no terminal emulator\'s settings sitting in between, so the fix lives entirely in Emacs\'s own configuration instead. The variables previewed last lesson go into your <code>init.el</code> (Part 4 covers this file properly; for now, just know it is the one place this kind of setting belongs):',
        '<div class="math">;; Resolution 1 (full commit):<br>(setq mac-option-modifier \'meta)<br><br>;; Resolution 3 (split — right Option only):<br>(setq mac-option-modifier nil<br>&nbsp;&nbsp;&nbsp;&nbsp;mac-right-option-modifier \'meta)<br><br>;; Command -&gt; Super, either way, for your own custom bindings:<br>(setq mac-command-modifier \'super)<span class="mnote">These take effect the next time Emacs (or the daemon, from the previous lesson) starts — restart, or use M-x eval-buffer on your init.el to apply changes without restarting.</span></div>'
      ]
    },
    {
      h: 'Verify it actually worked — and then pick one setup and stick with it',
      p: [
        'Do not just assume a setting change worked — verify it, using the exact tool Part 0 introduced for exactly this purpose: press <code>C-h k</code>, then press whatever key combination you just configured as Meta (your chosen Option key, plus any letter). If the fix worked, the <code>*Help*</code> buffer should describe it as an <code>M-</code> binding — confirming Emacs genuinely received it as Meta, not as some other key or nothing at all.',
        'The single most important practical advice in this entire lesson: whichever resolution you choose, apply it CONSISTENTLY everywhere you run Emacs — same terminal emulator settings, same GUI Emacs variables, so your fingers build ONE consistent muscle memory rather than a different half-remembered fix depending on which specific way you happen to be running Emacs that day. A setup that is "pretty good but inconsistent across contexts" causes more day-to-day friction than a setup that is merely "good, but always the same."'
      ]
    }
  ],
  conceptFlow: {
    title: 'Which fix do you actually need? A quick decision path',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Start here',
        nodes: [
          { id: 'start', text: 'Which Emacs are you running?' }
        ]
      },
      {
        label: 'Branch by context',
        nodes: [
          { id: 'termapp', text: 'Terminal.app' },
          { id: 'iterm', text: 'iTerm2' },
          { id: 'gui', text: 'GUI Emacs.app' }
        ]
      },
      {
        label: 'Where the fix actually lives',
        nodes: [
          { id: 'termfix', text: 'Settings → Profiles → Keyboard\n"Use Option as Meta key" (on/off only)' },
          { id: 'itermfix', text: 'Settings → Profiles → Keys\nLeft/Right Option, independently' },
          { id: 'guifix', text: 'init.el\nmac-option-modifier / mac-right-option-modifier' }
        ]
      },
      {
        label: 'Always available regardless',
        nodes: [
          { id: 'escfallback', text: 'Esc then key\nworks everywhere, no setup, always' }
        ]
      }
    ],
    steps: [
      { active: ['start'], note: 'The very first question is always "which Emacs, running where" — the fix genuinely lives in a different place depending on the answer.' },
      { active: ['termapp'], note: 'If you are using macOS\'s built-in Terminal.app...' },
      { active: ['termfix'], note: '...the fix is a single on/off checkbox, offering only the full-commit resolution — no left/right split available here.' },
      { active: ['iterm'], note: 'If you are using iTerm2 instead...' },
      { active: ['itermfix'], note: '...you get independent Left/Right Option settings, making the split-Option resolution genuinely achievable.' },
      { active: ['gui'], note: 'If you are running the standalone GUI Emacs.app...' },
      { active: ['guifix'], note: '...none of the above terminal settings apply at all — the fix lives entirely in elisp variables inside your own init.el instead.' },
      { active: ['escfallback'], note: 'And regardless of which path applies to you, or whether you have configured anything at all yet: Escape then a key always works, on every one of these, with zero setup — the one universal constant underneath all three paths.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami Actually Rolls Out the Fix — Different Instructions for Different Posts',
      text: 'Having settled on the plan, Nami does not just announce one universal rule and assume it covers everything — she issues genuinely different, specific instructions to different posts on the ship, because the posts themselves have different capabilities. To the galley specifically, staffed by Sanji, who can only manage one simple modification to his existing signal at a time, she gives the blunt version: from now on, that gesture means ONLY the navigation meaning, full stop, no exceptions, everywhere he uses it — the equivalent of Terminal.app\'s single on/off switch. To the crow\'s nest lookout post, staffed by someone genuinely capable of tracking a more nuanced distinction moment to moment, she gives the more precise version instead: the LEFT-hand version of the gesture keeps its old kitchen meaning, the RIGHT-hand version means navigation — a split most posts on the ship could not reliably execute under pressure, but one this specific post can. And separately, for the ship\'s main deck itself — which has direct line of sight to Nami and does not route through either the galley\'s or the crow\'s nest\'s own local conventions at all — she simply gives her instructions directly, with no intermediary post\'s own rules to work around, since there is no separate "local dialect" sitting in between her and the deck crew. Before trusting any of this in a real emergency, she runs an actual drill: everyone performs their newly-assigned signal, and she personally confirms each one lands correctly — not assuming the new rule took, actually checking it did.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Group Actually Implements the Fix — and Tests It Before Trusting It',
      text: 'Having agreed there needed to be a real fix, the group does not settle for one vague, "everyone just figure it out" announcement — they implement genuinely different specific arrangements depending on context, because the contexts themselves have different capabilities. For anyone visiting who genuinely cannot be expected to track Sheldon\'s specific ritual (a delivery person, someone\'s parent), the group settles on the simplest possible fix: a plain sign taped to the door, one blunt instruction, no nuance — Chandler\'s contribution, and it works precisely because it demands nothing sophisticated from whoever reads it, mirroring Terminal.app\'s single on/off switch. For the core group itself, who ARE capable of tracking something more precise, they keep a more nuanced two-part system instead — Sheldon\'s specific ritual for a casual visit, versus a completely different, unambiguous name-call specifically reserved for anything urgent — a split the plain-sign crowd could never be expected to reliably execute, but the core group manages fine. And for anything happening directly over the phone, with no door-knock convention involved at all, they simply talk normally, with no intermediary ritual or sign to work around, since a phone call was never routed through the knock-convention in the first place. Before actually trusting any of this the next time something urgent comes up, Monica insists on one genuine test run — everyone tries their assigned version once, deliberately, and she confirms out loud that each one landed correctly, rather than just hoping the new arrangement happened to stick.'
    },
    why: 'Nami\'s and Monica\'s rollouts both make the same point this lesson is built around: the SAME underlying fix requires genuinely different specific steps depending on which context (which post, which terminal emulator) is actually receiving it — Terminal.app gets the blunt version, iTerm2 gets the precise split version, GUI Emacs skips the terminal layer\'s rules entirely. And neither Nami nor Monica trusts the fix until they have actually verified it working — exactly the C-h k check this lesson insists on before you build real muscle memory on top of an unverified setting.'
  },
  tech: [
    {
      q: 'Why does Terminal.app only offer a single on/off Option-as-Meta toggle, while iTerm2 offers independent left/right settings?',
      a: 'Terminal.app is Apple\'s own deliberately minimal, general-purpose terminal emulator, aimed at broad compatibility and simplicity rather than power-user configurability — a single blunt toggle covers the common case adequately without adding complexity most users will never touch. iTerm2 is a third-party terminal emulator built specifically FOR power users, with an explicit design goal of exposing far more granular control over exactly this kind of keyboard behavior, among many other things Terminal.app does not attempt. Neither is a bug or an oversight in the other — they are different tools built to different scopes, which is exactly why anyone wanting the split-Option resolution specifically needs to reach for iTerm2 (or a similarly capable alternative) rather than expecting Terminal.app to eventually grow that same granularity.'
    },
    {
      q: 'Mechanically, what does iTerm2\'s "Esc+" setting for a given Option key actually do, and how does it relate to the Escape-as-Meta convention from the previous lesson?',
      a: '"Esc+" tells iTerm2 that, when this specific Option key is pressed in combination with another key, iTerm2 itself should send an actual Escape character followed immediately by that other key — rather than sending some more exotic, genuinely-held-modifier signal. This is not a novel mechanism invented for Mac keyboards; it is iTerm2 automatically generating, on every keypress, the exact same "Escape then key" sequence the previous lesson described as Emacs\'s longstanding, configuration-free Meta fallback. In effect, setting an Option key to "Esc+" is automating that manual fallback so it fires on every relevant keypress, rather than requiring you to consciously press and release Escape separately each time.'
    },
    {
      q: 'Why does GUI Emacs require none of the terminal-emulator-level settings this lesson spends most of its time on?',
      a: 'Terminal.app and iTerm2\'s settings exist specifically to solve a problem unique to running a program INSIDE a terminal emulator: that program only ever receives whatever key events the terminal emulator itself decides to forward, encoded through the terminal emulator\'s own interpretation of the keyboard. GUI Emacs is not running inside any terminal emulator at all — it receives key events directly from macOS\'s own windowing system, with no intermediary terminal-emulator layer making its own decisions about how to encode or forward a keypress. There is consequently no terminal-emulator setting to configure at all for GUI Emacs; the entire fix lives on the Emacs side, in the mac-option-modifier family of variables, because that is the only place in the chain where any translation decision is actually being made.'
    }
  ],
  code: {
    title: 'The three concrete fixes, side by side',
    intro: 'Apply whichever matches how you actually run Emacs, then verify with C-h k before moving on.',
    code: `# Terminal.app (Resolution 1 only — full commit, no split available)
Terminal → Settings → Profiles → [your profile] → Keyboard
  [x] Use Option as Meta key

# iTerm2 (Resolution 3 — the recommended split, if you type accents often)
iTerm2 → Settings → Profiles → [your profile] → Keys
  Left Option Key:  Normal      (preserves macOS accent composition)
  Right Option Key: Esc+        (behaves as Meta)

# GUI Emacs.app — in ~/.emacs.d/init.el (Part 4 covers this file properly)
(setq mac-option-modifier nil
      mac-right-option-modifier 'meta
      mac-command-modifier 'super)

# ── Verifying the fix, in Emacs itself ──
# Press C-h k, then press your configured Meta key + n (say, right-Option-n)
C-h k [right-Option] n
;; *Help* buffer should show something like:
;; M-n runs the command next-line-and-scroll ...
;; If it instead shows nothing bound, or a completely different key name,
;; the configuration hasn't taken effect yet — restart Emacs and retry.`,
    notes: [
      'If you change a GUI Emacs init.el variable, either fully restart Emacs (or the daemon, per the previous lesson) or run M-x eval-buffer while viewing the init.el file to apply the change without a full restart.',
      'If Terminal.app/iTerm2 settings do not seem to take effect, confirm you are editing the PROFILE you actually launch (both apps support multiple named profiles) — a common, easy-to-miss mistake.'
    ]
  },
  lab: {
    title: 'Match each scenario to the correct fix',
    prompt: 'Write the correct setting/value for each scenario below.',
    starter: `# Scenario: You use plain Terminal.app and want full commit (Option always = Meta).
# What do you check, and where?


# Scenario: You use iTerm2 and want the split (left Option = accents, right Option = Meta).
# What do you set the Left Option Key to? What about Right Option Key?


# Scenario: You use GUI Emacs.app and want the split resolution, plus Cmd bound to Super.
# Write the setq form for your init.el.


# Task: write the key sequence to VERIFY your fix worked, assuming your Meta key is now bound
# and you want to check what "Meta-n" resolves to

`,
    checks: [
      { re: 'use\\s+option\\s+as\\s+meta\\s+key', flags: 'i', must: true, hint: '"Use Option as Meta key" in Terminal.app\'s Keyboard preferences.', pass: 'Use Option as Meta key ✓' },
      { re: 'left\\s+option[^\\n]*normal[\\s\\S]*right\\s+option[^\\n]*esc\\+|right\\s+option[^\\n]*esc\\+[\\s\\S]*left\\s+option[^\\n]*normal', flags: 'i', must: true, hint: 'Left Option Key: Normal, Right Option Key: Esc+', pass: 'Left=Normal, Right=Esc+ ✓' },
      { re: "mac-option-modifier\\s+nil[\\s\\S]*mac-right-option-modifier\\s+'meta[\\s\\S]*mac-command-modifier\\s+'super", flags: 'i', must: true, hint: "(setq mac-option-modifier nil mac-right-option-modifier 'meta mac-command-modifier 'super)", pass: 'setq form correct ✓' },
      { re: 'C-h\\s+k', flags: 'i', must: true, hint: 'C-h k, then the key combination you want to check.', pass: 'C-h k ✓' }
    ],
    run: 'Try it for real: apply whichever fix matches your actual setup, then C-h k your new Meta key to confirm it reports as an M- binding.',
    solution: `# Scenario: You use plain Terminal.app and want full commit (Option always = Meta).
# What do you check, and where?
# Terminal → Settings → Profiles → [profile] → Keyboard → "Use Option as Meta key"

# Scenario: You use iTerm2 and want the split (left Option = accents, right Option = Meta).
# What do you set the Left Option Key to? What about Right Option Key?
# Left Option Key: Normal
# Right Option Key: Esc+

# Scenario: You use GUI Emacs.app and want the split resolution, plus Cmd bound to Super.
# Write the setq form for your init.el.
(setq mac-option-modifier nil
      mac-right-option-modifier 'meta
      mac-command-modifier 'super)

# Task: write the key sequence to VERIFY your fix worked, assuming your Meta key is now bound
# and you want to check what "Meta-n" resolves to
C-h k, then press your Meta key + n`,
    notes: [
      'Terminal.app genuinely has no equivalent to iTerm2\'s Left/Right Option split — if the split resolution matters to you and you are on Terminal.app, switching to iTerm2 (or an equivalent capable terminal) is the real fix, not a Terminal.app setting you have simply not found yet.',
      'The elisp setq form only applies to GUI Emacs — running it in a Terminal Emacs session has no effect on the terminal emulator\'s own key handling.'
    ]
  },
  quiz: [
    {
      q: 'What is the one Option/Meta resolution Terminal.app CANNOT configure, no matter how you look for it?',
      options: ['Full-commit Option-as-Meta', 'Escape-as-Meta', 'The split resolution (left Option normal, right Option as Meta) — Terminal.app only offers one blunt on/off toggle', 'Terminal.app can configure all three equally well'],
      correct: 2,
      explain: 'Terminal.app\'s "Use Option as Meta key" is a single on/off switch with no left/right distinction — the split resolution requires a more capable terminal emulator like iTerm2.'
    },
    {
      q: 'In iTerm2, what does setting Right Option Key to "Esc+" actually make iTerm2 do?',
      options: ['Disable the right Option key entirely', 'Automatically send an actual Escape character followed by the next key, whenever that Option key is pressed with another key', 'Rename the key to "Escape" in macOS system settings', 'Nothing; "Esc+" is a placeholder with no real effect'],
      correct: 1,
      explain: '"Esc+" makes iTerm2 synthesize the Escape-then-key sequence automatically — the exact same mechanism as manually pressing Escape then a key, just triggered by that specific Option key instead.'
    },
    {
      q: 'Why does GUI Emacs.app need none of Terminal.app or iTerm2\'s settings?',
      options: ['GUI Emacs does not support Meta key bindings at all', 'GUI Emacs receives key events directly from macOS, with no terminal emulator translating or intercepting them first', 'GUI Emacs automatically inherits whatever Terminal.app is configured to do', 'This is a bug that will eventually be fixed'],
      correct: 1,
      explain: 'There is no terminal emulator sitting between GUI Emacs and macOS, so there is no terminal-level translation setting to configure — the fix lives entirely in Emacs\'s own elisp variables instead.'
    },
    {
      q: 'What is the recommended way to verify a Meta-key fix actually took effect, rather than just assuming it did?',
      options: ['Restart the whole computer and hope', 'Press C-h k, then the configured key combination, and confirm the *Help* buffer reports it as an M- binding', 'There is no reliable way to verify this', 'Check the macOS System Settings app, which always reflects Emacs-specific bindings'],
      correct: 1,
      explain: 'C-h k directly reports what function a key sequence actually runs right now — pressing your newly-configured Meta key and confirming it shows up as an M- binding is a direct, reliable verification.'
    },
    {
      q: 'Why does this lesson emphasize picking ONE consistent setup rather than "whichever resolution is technically best"?',
      options: ['Because all three resolutions are functionally identical anyway', 'Because inconsistent configuration across different contexts (terminal vs GUI, different terminal emulators) causes more day-to-day friction than a merely-good but consistent setup', 'Because Emacs only allows one global setting shared across every possible context automatically', 'Consistency does not actually matter for muscle memory'],
      correct: 1,
      explain: 'Muscle memory built around one consistent configuration is more valuable day to day than technically optimizing for the "best" resolution but having it differ depending on which specific Emacs/terminal you happen to be using.'
    }
  ],
  pitfalls: [
    'Expecting Terminal.app to offer a left/right Option split — it genuinely does not; that specific capability requires switching to a more configurable terminal emulator like iTerm2.',
    'Setting mac-option-modifier (or similar) in init.el and expecting it to affect Terminal Emacs — these variables only apply to GUI Emacs.app, since Terminal Emacs\'s key handling is controlled entirely by the terminal emulator instead.',
    'Assuming a settings change took effect without actually verifying it with C-h k — a setting applied to the wrong profile, or requiring a restart you have not done yet, can silently leave the old behavior in place.'
  ],
  interview: [
    {
      q: 'Walk through the three different places the Option/Meta fix can live, and explain why the correct one depends entirely on which Emacs/terminal setup someone is using.',
      a: 'For Terminal.app: a single checkbox ("Use Option as Meta key") in its Keyboard preferences, offering only the full-commit resolution. For iTerm2: independent Left/Right Option Key settings under its Keys preferences, each settable to Normal or Esc+, enabling the split resolution Terminal.app cannot offer. For GUI Emacs.app: elisp variables (mac-option-modifier, mac-right-option-modifier, mac-command-modifier) set directly in the user\'s init.el, since GUI Emacs receives key events directly from macOS with no terminal emulator translating them first. The correct location depends entirely on WHERE the actual key-to-signal translation is happening in a given setup — inside the terminal emulator for terminal-based Emacs, or inside Emacs itself for the GUI version — and applying a fix in the wrong location (like an elisp setq while running Terminal Emacs) has simply no effect at all.'
    },
    {
      q: 'Explain what iTerm2\'s "Esc+" option setting mechanically does, and connect it explicitly to a concept from an earlier lesson.',
      a: '"Esc+," applied to a specific Option key in iTerm2, makes iTerm2 automatically synthesize an Escape character immediately followed by whatever key was pressed alongside that Option key — rather than attempting to send some more exotic, genuinely-held-modifier signal. This is not a new or Mac-specific mechanism; it is iTerm2 automating the exact "Escape-as-Meta" fallback convention covered in the previous lesson, which has always been Emacs\'s configuration-free way of receiving an equivalent-to-Meta keypress. Setting an Option key to "Esc+" essentially wires that manual fallback to fire automatically on every relevant keypress from that specific key, rather than requiring a conscious, separate press-and-release of Escape each time.'
    },
    {
      q: 'A new team member sets mac-right-option-modifier in their init.el but reports it "does not do anything." What would you ask them, and why?',
      a: 'First: are you running GUI Emacs.app, or Emacs inside a terminal? This variable only has any effect in GUI Emacs, since it configures how Emacs itself interprets key events received directly from macOS — Terminal Emacs\'s key handling is governed entirely by the terminal emulator\'s own settings (Terminal.app\'s single toggle, or iTerm2\'s Left/Right Option settings), and an elisp variable like this has no way to affect a terminal emulator\'s behavior at all. If they confirm they ARE running GUI Emacs, the next question is whether they restarted Emacs (or re-evaluated their init.el) after making the change — since these variables are typically read once at startup, a change made but not yet applied would also look like "nothing happened" even though the configuration is technically correct.'
    },
    {
      q: 'Why does this lesson insist on verifying a keybinding fix with C-h k rather than just trusting that a settings change worked?',
      a: 'A settings change can silently fail to take effect for several genuinely common reasons: it was applied to the wrong profile (both Terminal.app and iTerm2 support multiple named profiles), it requires a restart that has not happened yet, or — for GUI Emacs specifically — the init.el change was saved but never actually re-evaluated in the running session. C-h k provides a direct, immediate, ground-truth check: it reports exactly what function a key sequence ACTUALLY runs right now, in the current session, rather than relying on an assumption that a settings screen\'s checkbox or a config file\'s saved state has actually propagated into live behavior. Building real muscle memory on top of an unverified assumption, only to discover days later the fix never actually applied, wastes far more time than the ten seconds a C-h k check costs upfront.'
    }
  ],
  deepDive: {
    timeMin: 10,
    intro: 'The essentials cover Terminal.app, iTerm2, and GUI Emacs specifically. This is what is underneath: Karabiner-Elements, for when you want a remap that applies system-wide, not just inside Emacs.',
    sections: [
      {
        h: 'Karabiner-Elements: remapping at the OS level, for every application',
        p: [
          '<b>Karabiner-Elements</b> is a free, popular macOS utility that remaps keys at a much lower level than any single application (Terminal.app, iTerm2, or Emacs itself) can reach — it intercepts and rewrites keyboard events system-wide, before ANY application, terminal or otherwise, ever sees them. This matters for a specific edge case the rest of this lesson does not solve: someone who wants right Option to behave as Escape (which, combined with Emacs\'s native Escape-as-Meta convention, effectively becomes Meta) consistently across EVERY application on their Mac, not just inside a terminal or Emacs specifically — useful if the same muscle memory should apply while using other, non-Emacs tools too.',
          'The tradeoff is scope and complexity: Karabiner-Elements remaps are genuinely global, affecting every application system-wide, which is powerful but also means a misconfigured rule can have far-reaching, occasionally confusing effects outside of Emacs entirely — a real cost worth weighing against the narrower, safer, Emacs/terminal-specific settings this lesson otherwise covers. For most people, the terminal-emulator or GUI-Emacs-specific fixes are sufficient and simpler to reason about; Karabiner-Elements is worth reaching for specifically when the same key behavior is genuinely wanted everywhere, not just inside Emacs.'
        ]
      }
    ]
  }
};
