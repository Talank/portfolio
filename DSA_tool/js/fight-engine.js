/* Grand Line Dojo — the fighting game.
 *
 * A fight is a scene you play. It opens with the job stated in plain words —
 * what you are actually being asked to do, and one worked example — then the
 * crew talk it through, and the conversation stops on a question. Answer it and
 * you land a hit; miss and the enemy lands one. That is the whole loop, and the
 * clock is the interview pressure you actually need to rehearse.
 *
 * The exchanges are deliberately not all the same shape. Five identical
 * multiple-choice cards in a row stop being a fight and turn into a form, so
 * each one has a KIND drawn from a shuffled deck — an ambush that starts with
 * no warning and a short clock, a guard where the enemy swings first, a round
 * played on the real code with one line struck out, a finisher that ends it in
 * a single answer. You cannot learn the running order, which is the point.
 *
 * Everything you hear is synthesized here with the Web Audio API — arcade-style
 * impacts, blocks, combo chimes and a KO, built from oscillators and noise at
 * runtime. No sample packs, nothing to license, zero asset bytes on the wire.
 * Fighters are drawn by js/stickman.js, also at runtime, for the same reason.
 *
 * The last screen is the reason the rest exists: the solution in full, the
 * complexity, the pitfall, and every question you missed with the reasoning.
 *
 * Consumed by dojo.html. Depends on js/stickman.js, and optionally on
 * js/voice-engine.js for the announcer.
 */
(function (root) {
  'use strict';

  /* ==================================================================== */
  /* Sound — arcade impacts synthesized on demand                          */
  /* ==================================================================== */

  var ctx = null, master = null, crowdGain = null, crowdSrc = null;
  var muted = false;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* One oscillator with an envelope. `slideTo` is what gives impacts their
     downward "weight" and risers their lift. */
  function tone(freq, at, dur, o) {
    o = o || {};
    var c = ac(); if (!c) return;
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, at);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), at + dur);
    var peak = o.peak == null ? 0.5 : o.peak;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(o.bus || master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /* Filtered noise — the "slap" half of every impact. Fighting-game hits are
     always a body tone plus a noise transient; either alone sounds wrong. */
  function noise(at, dur, o) {
    o = o || {};
    var c = ac(); if (!c) return;
    var n = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, n, c.sampleRate);
    var d = buf.getChannelData(0);
    var curve = o.curve || 1;
    for (var i = 0; i < n; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, curve);
    }
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = o.filterType || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.freq || 1200, at);
    if (o.slideFreqTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideFreqTo), at + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(o.peak == null ? 0.5 : o.peak, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || master);
    src.start(at); src.stop(at + dur + 0.02);
  }

  var SFX = {
    /* Clean connecting hit: sub thump + midrange slap. */
    hit: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(150, t, 0.18, { type: 'sine', slideTo: 55, peak: 0.85 });
      noise(t, 0.11, { freq: 1500, slideFreqTo: 300, peak: 0.5, q: 0.7 });
      tone(320, t, 0.05, { type: 'square', peak: 0.18 });
    },

    /* Finisher / big damage. The 60 ms second impact is the trick that makes a
       hit read as "heavy" rather than just louder. */
    heavy: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(110, t, 0.4, { type: 'sine', slideTo: 32, peak: 1 });
      noise(t, 0.22, { freq: 2200, slideFreqTo: 180, peak: 0.6, q: 0.6 });
      tone(90, t + 0.06, 0.3, { type: 'triangle', slideTo: 40, peak: 0.55 });
      noise(t + 0.06, 0.14, { freq: 900, slideFreqTo: 150, peak: 0.35 });
    },

    /* Enemy connects on you — same impact, sourer harmonics. */
    taken: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(180, t, 0.26, { type: 'square', slideTo: 60, peak: 0.4 });
      noise(t, 0.16, { freq: 700, slideFreqTo: 160, peak: 0.45 });
      tone(233, t + 0.02, 0.22, { type: 'sawtooth', slideTo: 110, peak: 0.2 });
    },

    /* Guarded — metallic clank, two detuned squares beating against each other. */
    block: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(1480, t, 0.1, { type: 'square', peak: 0.22 });
      tone(1610, t, 0.12, { type: 'square', peak: 0.18 });
      noise(t, 0.09, { freq: 4200, peak: 0.3, filterType: 'highpass' });
    },

    /* Missed swing. */
    whiff: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      noise(t, 0.26, { freq: 380, slideFreqTo: 2900, peak: 0.22, q: 2 });
    },

    /* Combo chime: each link a semitone higher, so a streak audibly climbs. */
    combo: function (n) {
      var c = ac(); if (!c) return; var t = c.currentTime;
      var f = 523.25 * Math.pow(2, Math.min(n, 12) / 12);
      tone(f, t, 0.12, { type: 'triangle', peak: 0.3 });
      tone(f * 2, t + 0.02, 0.1, { type: 'sine', peak: 0.14 });
    },

    /* Round bell. */
    bell: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(660, t, 0.9, { type: 'triangle', peak: 0.4, attack: 0.004 });
      tone(990, t, 0.7, { type: 'sine', peak: 0.22 });
      tone(1320, t + 0.02, 0.5, { type: 'sine', peak: 0.1 });
    },

    /* Enemy shifts phase — a riser, so you hear the fight escalate. */
    phase: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      noise(t, 0.7, { freq: 200, slideFreqTo: 5000, peak: 0.3, q: 3, curve: 0.4 });
      tone(70, t, 0.8, { type: 'sawtooth', slideTo: 210, peak: 0.3 });
    },

    /* An ambush has to be heard before it is read, or it is not an ambush. Two
       stabs a tritone apart — the least reassuring interval there is. */
    ambush: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      noise(t, 0.18, { freq: 3000, slideFreqTo: 600, peak: 0.5, q: 1.2 });
      tone(740, t, 0.16, { type: 'square', peak: 0.3 });
      tone(1046, t + 0.09, 0.2, { type: 'square', slideTo: 520, peak: 0.28 });
    },

    /* The enemy winding up before a guard round. */
    windup: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(140, t, 0.5, { type: 'sawtooth', slideTo: 300, peak: 0.24 });
      noise(t + 0.1, 0.35, { freq: 500, slideFreqTo: 2200, peak: 0.18, q: 2 });
    },

    /* The moment before a finisher. Silence would be better, but this is the
       next best thing: a long rise with nothing under it. */
    charge: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      noise(t, 1.1, { freq: 120, slideFreqTo: 6000, peak: 0.22, q: 4, curve: 0.3 });
      tone(196, t, 1.1, { type: 'triangle', slideTo: 784, peak: 0.2 });
    },

    /* KO — the loudest thing in the game, as it should be. */
    ko: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(140, t, 1.6, { type: 'sine', slideTo: 26, peak: 1 });
      noise(t, 0.5, { freq: 1800, slideFreqTo: 90, peak: 0.7, filterType: 'lowpass', q: 0.5 });
      [392, 349.23, 293.66].forEach(function (f, i) {
        tone(f, t + i * 0.16, 0.7, { type: 'sawtooth', peak: 0.22 });
        tone(f / 2, t + i * 0.16, 0.7, { type: 'square', peak: 0.1 });
      });
      SFX.roar();
    },

    /* Crowd roar on a finish. */
    roar: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      noise(t, 1.8, { freq: 900, peak: 0.28, filterType: 'lowpass', q: 0.4, curve: 0.25 });
    },

    /* Clock running out. */
    tick: function () {
      var c = ac(); if (!c) return;
      tone(1250, c.currentTime, 0.045, { type: 'sine', peak: 0.16 });
    },
    timeout: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      tone(320, t, 0.5, { type: 'square', slideTo: 80, peak: 0.32 });
    },

    /* End-of-fight stings. */
    win: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        tone(f, t + i * 0.11, 0.5, { type: 'sawtooth', peak: 0.22 });
        tone(f, t + i * 0.11, 0.5, { type: 'triangle', peak: 0.16 });
      });
      tone(130.81, t, 1.4, { type: 'sine', peak: 0.3 });
    },
    lose: function () {
      var c = ac(); if (!c) return; var t = c.currentTime;
      [349.23, 311.13, 261.63, 207.65].forEach(function (f, i) {
        tone(f, t + i * 0.22, 0.7, { type: 'sawtooth', peak: 0.2 });
      });
      tone(98, t, 2, { type: 'sine', slideTo: 60, peak: 0.3 });
    },
    select: function () {
      var c = ac(); if (!c) return;
      tone(880, c.currentTime, 0.07, { type: 'square', peak: 0.16 });
    },
    /* One character finishing a line. Quiet enough to sit under reading. */
    talk: function () {
      var c = ac(); if (!c) return;
      tone(392, c.currentTime, 0.05, { type: 'triangle', peak: 0.07 });
    }
  };

  function play(name, arg) {
    if (muted) return;
    try { if (SFX[name]) SFX[name](arg); } catch (e) { /* audio blocked — the fight still plays silently */ }
  }

  /* Low crowd murmur under the whole fight. One looping noise buffer, slowly
     wobbled, is enough to stop the page feeling like a quiz. */
  function crowdStart() {
    var c = ac(); if (!c || crowdSrc || muted) return;
    var n = Math.floor(c.sampleRate * 2);
    var buf = c.createBuffer(1, n, c.sampleRate);
    var d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.08) * 0.96;  // brown-ish, no hiss
      d[i] = last;
    }
    var src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    var f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 700;
    crowdGain = c.createGain(); crowdGain.gain.value = 0;
    src.connect(f); f.connect(crowdGain); crowdGain.connect(master);
    src.start();
    crowdGain.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.5);
    crowdSrc = src;
  }

  function crowdStop() {
    if (!crowdSrc) return;
    try {
      crowdGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      crowdSrc.stop(ctx.currentTime + 0.7);
    } catch (e) { /* already gone */ }
    crowdSrc = null;
  }

  /* Announcer. Speech synthesis reading our own words — same approach as the
     episode narration, and it is what sells "ROUND ONE... FIGHT". */
  var announceOn = true;
  function announce(text) {
    if (!announceOn || muted || !root.VoiceEngine || !root.VoiceEngine.isSupported()) return;
    root.VoiceEngine.speak(text, { pitch: 0.4, rate: 0.95, volume: 1, genderHint: 'male' });
  }

  /* ==================================================================== */
  /* Enemy tiers                                                           */
  /* ==================================================================== */

  /* Difficulty is the whole ladder: an Easy problem is a grunt you flatten in
     one flurry, a Hard one is a Warlord with phases who punishes two mistakes.
     `mistakes` is how many you SURVIVE — the next one after that puts you down —
     and it is tuned against the exchange count so the tier is actually losable.
     A guard or a finisher you fluff counts as one and a half, which is why they
     are announced before the clock starts rather than sprung on you. */
  var TIERS = {
    grunt: {
      label: 'Marine Grunt', banner: 'EASY', hp: 100, mistakes: 3, seconds: 40,
      phases: [], hat: 'cap', eyes: 'dot', mouth: 'flat', hair: 'scruff',
      taunt: 'Halt! Nobody gets past the checkpoint!'
    },
    officer: {
      label: 'Marine Officer', banner: 'MEDIUM', hp: 100, mistakes: 3, seconds: 32,
      phases: [50], hat: 'cap', eyes: 'angry', mouth: 'smirk', hair: 'bob',
      taunt: 'So you know the pattern. Let us see you hold it under pressure.'
    },
    warlord: {
      label: 'Warlord', banner: 'HARD', hp: 100, mistakes: 2, seconds: 26,
      phases: [66, 33], hat: 'horns', eyes: 'shade', mouth: 'fang', hair: 'long',
      taunt: 'You are out of your depth. Three mistakes and this is over.'
    }
  };

  var PHASE_CRY = [
    'Enough playing around.',
    'Now you have my attention.',
    'This is the real fight.'
  ];

  /* ==================================================================== */
  /* Exchange kinds                                                        */
  /* ==================================================================== */

  /* The kinds differ in the three things a player can actually feel: how long
     the clock is, what a hit is worth, and who swings first. Everything else —
     the drama, the banner, the noise — follows from those.

       clash   the baseline exchange
       ambush  no crew talk, 55% of the clock, and it hits half again as hard
       guard   the enemy swings first; a right answer blocks and counters light
       code    the real solution with one line struck out, on a long clock
       finish  offered once the enemy is nearly down: right ends it here

     `dmg` multiplies the hit you land. `taken` multiplies the hit you eat.

     None of them start a clock on a player who has not been told the job. Every
     exchange opens on a call — the tag, this lead, the problem restated, and
     whatever the crew has to say — and the clock starts on the button at the
     bottom of it. What varies is the exchange, never whether you were told what
     you are being asked. An ambush is therefore short and heavy rather than
     unannounced; being blindsided by the *question* was never the fun part. */
  var KINDS = {
    clash: {
      label: 'CLASH', clock: 1, dmg: 1, taken: 1,
      lead: null
    },
    ambush: {
      label: 'AMBUSH', clock: 0.55, dmg: 1.5, taken: 1, sfx: 'ambush',
      lead: 'No talk this time. Short clock, heavy hit — read the job and go.'
    },
    guard: {
      label: 'GUARD', clock: 0.85, dmg: 0.5, taken: 1.5, sfx: 'windup', foeFirst: true,
      lead: 'It is coming at you. Read it before it lands.'
    },
    code: {
      label: 'THE CODE', clock: 1.6, dmg: 1.25, taken: 1,
      lead: 'One line has been struck out of the working solution.'
    },
    finish: {
      label: 'FINISHER', clock: 0.75, dmg: 99, taken: 1.5, sfx: 'charge',
      lead: 'It is nearly over. One answer ends it.'
    }
  };

  /* ==================================================================== */
  /* Markup                                                                */
  /* ==================================================================== */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Fisher-Yates. Questions are shuffled so a repeat run is not muscle memory
     of the option order. */
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Shuffle a question's options while keeping `correct` pointing at the same
     text. Without this, always-C answers become a tell. */
  function shuffleOptions(q) {
    var pairs = q.options.map(function (o, i) { return { o: o, i: i }; });
    pairs = shuffled(pairs);
    return {
      q: q.q,
      options: pairs.map(function (p) { return p.o; }),
      correct: pairs.findIndex(function (p) { return p.i === q.correct; }),
      explain: q.explain,
      hint: q.hint,
      tag: q.tag,
      code: q.code,           // set only by the code round
      html: q.html            // ditto: its explanation is already markup
    };
  }

  /* Question banks are written as plain prose, so an explanation is escaped.
     The code round builds its own explanation out of markup and says so. */
  function explainHtml(q) {
    return q.html ? q.explain : esc(q.explain || '');
  }

  /* ==================================================================== */
  /* Python, lightly coloured                                              */
  /* ==================================================================== */

  var PY_KEYWORDS = 'def|class|return|yield|if|elif|else|for|while|break|continue' +
    '|in|not|and|or|is|None|True|False|import|from|as|with|lambda|pass|global|nonlocal|try|except|raise';

  /* One pass over the escaped source, so a keyword inside a comment cannot be
     re-coloured by a later rule. Alternation order is the precedence. */
  function highlight(code) {
    return esc(code).replace(
      new RegExp('(#[^\\n]*)|(&quot;[^\\n]*?&quot;|\'[^\'\\n]*\')|\\b(' +
                 PY_KEYWORDS + ')\\b|\\b(\\d+)\\b', 'g'),
      function (m, comment, str, kw, num) {
        if (comment) return '<i class="c">' + comment + '</i>';
        if (str) return '<i class="s">' + str + '</i>';
        if (kw) return '<i class="k">' + kw + '</i>';
        return '<i class="n">' + num + '</i>';
      });
  }

  /* ==================================================================== */
  /* The code round                                                        */
  /* ==================================================================== */

  /* Distractors are the real line with exactly one thing changed: a bound moved,
     a comparison flipped, the other pointer advanced. Inventing plausible-looking
     wrong code is hard and usually produces something obviously wrong; mutating
     the right line produces exactly the bugs people actually write, which is the
     only kind worth drilling. */
  var MUTATORS = [
    /* bounds and steps */
    { find: /\+= 1/, put: '-= 1' },
    { find: /-= 1/, put: '+= 1' },
    { find: /\+ 1/, put: '- 1' },
    { find: /- 1/, put: '+ 1' },
    { find: /([\w\])]) [-+] 1\b/, put: '$1' },
    /* comparisons */
    { find: /<=/, put: '<' },
    { find: />=/, put: '>' },
    { find: /<(?![=<])/, put: '<=' },
    { find: />(?![=>])/, put: '>=' },
    { find: /<(?![=<])/, put: '>' },
    { find: />(?![=>])/, put: '<' },
    { find: /==/, put: '!=' },
    { find: /!=/, put: '==' },
    { find: /\bis not\b/, put: 'is' },
    { find: /\bis\b(?! not)/, put: 'is not' },
    /* logic and control */
    { find: /\band\b/, put: 'or' },
    { find: /\bor\b/, put: 'and' },
    { find: /\bnot /, put: '' },
    { find: /\bTrue\b/, put: 'False' },
    { find: /\bFalse\b/, put: 'True' },
    { find: /\bbreak\b/, put: 'continue' },
    { find: /\bcontinue\b/, put: 'break' },
    { find: /\bwhile\b/, put: 'if' },
    { find: /\bif\b/, put: 'while' },
    /* arithmetic and bits, where a whole family of these problems lives */
    { find: /\bmin\b/, put: 'max' },
    { find: /\bmax\b/, put: 'min' },
    { find: /\/\//, put: '/' },
    { find: /%/, put: '//' },
    { find: /<</, put: '>>' },
    { find: />>/, put: '<<' },
    /* Spaced, not bare: `&=` and `|=` must not be mangled into nonsense, and a
       lookbehind here would be a parse error on older Safari — which would take
       the whole file down, not just this rule. */
    { find: / & /, put: ' | ' },
    { find: / \| /, put: ' ^ ' },
    { find: / \^ /, put: ' & ' },
    /* the pairs of names people transpose */
    { find: /\bleft\b/, put: 'right' },
    { find: /\bright\b/, put: 'left' },
    { find: /\blo\b/, put: 'hi' },
    { find: /\bhi\b/, put: 'lo' },
    { find: /\blow\b/, put: 'high' },
    { find: /\bhigh\b/, put: 'low' },
    { find: /\bstart\b/, put: 'end' },
    { find: /\bend\b/, put: 'start' },
    { find: /\bslow\b/, put: 'fast' },
    { find: /\bfast\b/, put: 'slow' },
    { find: /\bprev\b/, put: 'curr' },
    { find: /\bcurr\b/, put: 'prev' },
    { find: /\bhead\b/, put: 'tail' },
    { find: /\bi\b/, put: 'j' },
    { find: /\bj\b/, put: 'i' },
    { find: /\bn\b/, put: 'm' },
    { find: /\bm\b/, put: 'n' },
    /* container moves */
    { find: /\.append\(/, put: '.insert(0, ' },
    { find: /\.pop\(\)/, put: '.pop(0)' },
    { find: /\.pop\(0\)/, put: '.pop()' },
    { find: /\bsorted\(/, put: 'reversed(' },
    { find: /\breversed\(/, put: 'sorted(' },
    { find: /\[0\]/, put: '[-1]' },
    { find: /\[-1\]/, put: '[0]' },
    { find: /\[1\]/, put: '[0]' }
  ];

  /* Everything after a " #" is a comment, and options are built from the code
     alone. An "and" flipped to "or" inside a comment is not a wrong answer, it
     is a typo — and a comment left on an option would hand you the answer. The
     comment still vanishes with the rest of the blanked line. */
  function codeOnly(line) {
    return line.replace(/\s+#.*$/, '').replace(/\s+$/, '');
  }

  /* Only lines that do real work are worth blanking: not the signature, not a
     bare comment, not a blank, and nothing so short that the answer is obvious
     from the indentation alone. */
  function blankable(line) {
    var t = codeOnly(line).trim();
    return t.length >= 8 && t.length <= 78 &&
      t.charAt(0) !== '#' && !/^def /.test(t) && !/^class /.test(t) &&
      !/^(return|pass|break|continue)$/.test(t);
  }

  /* Build a code exchange, or null when the solution has no line that yields
     three distinct plausible mutations. Falling back is better than shipping a
     round whose wrong answers are obviously wrong. */
  function codeRound(solution, seed) {
    if (!solution || typeof solution !== 'string') return null;
    var body = solution.replace(/\t/g, '    ').split('\n')
      .map(function (l) { return l.replace(/\s+$/, ''); });
    var all = body.map(function (l) { return codeOnly(l).trim(); });

    var candidates = [];
    body.forEach(function (line, i) {
      if (!blankable(line)) return;
      var real = all[i];
      var seen = {}, wrong = [];
      MUTATORS.forEach(function (m) {
        if (!m.find.test(real)) return;
        var v = real.replace(m.find, m.put).replace(/\s{2,}/g, ' ').trim();
        /* A mutation that lands on another line of the same function is not a
           wrong answer, it is a different correct one. */
        if (v === real || seen[v] || all.indexOf(v) !== -1) return;
        seen[v] = 1;
        wrong.push(v);
      });
      if (wrong.length >= 3) candidates.push({ i: i, real: real, wrong: wrong });
    });
    if (!candidates.length) return null;

    /* Prefer the line with the most ways to get it wrong — that is the line
       carrying the most decisions, which is the one worth asking about. */
    candidates.sort(function (a, b) { return b.wrong.length - a.wrong.length; });
    var top = candidates.slice(0, Math.min(3, candidates.length));
    var pick = top[Math.abs(seed || 0) % top.length];
    var opts = [pick.real].concat(shuffled(pick.wrong).slice(0, 3));

    var shownLines = body.slice();
    var indent = (body[pick.i].match(/^\s*/) || [''])[0];
    shownLines[pick.i] = indent + '\u2588\u2588\u2588\u2588\u2588\u2588';

    return {
      tag: 'THE CODE',
      q: 'Which line belongs in the gap?',
      options: opts,
      correct: 0,
      code: shownLines.join('\n'),
      html: true,
      explain: 'The line is <code>' + esc(pick.real) + '</code>. Every wrong option ' +
        'is that same line with one thing moved — a bound, a comparison, the other ' +
        'variable. That is the shape almost every real bug in this pattern takes.',
      hint: 'Read the line above and the line below it. What has to be true between them?'
    };
  }

  /* ==================================================================== */
  /* The fight                                                             */
  /* ==================================================================== */

  function Fight(mount, cfg) {
    this.mount = mount;
    this.cfg = cfg;
    this.tier = TIERS[cfg.tier] || TIERS.grunt;
    this.scene = cfg.scene || {};

    this.rounds = shuffled(cfg.rounds || []).map(shuffleOptions);
    if (!this.rounds.length) throw new Error('a fight needs at least one question');

    /* One code exchange per fight, when the solution admits one. It replaces a
       question rather than adding to the count, so the fight length is stable. */
    var cr = codeRound(this.scene.solution, cfg.lc || 0);
    if (cr && this.rounds.length > 2) this.rounds[this.rounds.length - 1] = shuffleOptions(cr);
    this.hasCode = !!cr;

    this.deck = this.buildDeck();
    this.finisherUsed = false;

    this.idx = 0;
    this.heroHp = 100;
    this.foeHp = this.tier.hp;
    this.combo = 0;
    this.bestCombo = 0;
    this.missed = [];
    this.hintsUsed = 0;
    this.hintThisRound = false;
    this.phaseAt = 0;
    this.locked = false;
    this.raf = null;
    this.lastTickSec = null;

    /* The dialogue is rationed across the exchanges, so the scene keeps moving
       forward instead of being dumped in one wall at the start. */
    var steps = (this.scene.steps || []).filter(function (s) { return s && s.line; });
    this.opening = steps.slice(0, 2);
    this.talkQueue = steps.slice(2);
    this.perRound = Math.max(1, Math.ceil(this.talkQueue.length / this.rounds.length));

    /* Damage is set so that clearing the bank cleanly is at least a KO; the
       kind multipliers mean a clean run usually finishes early, which is the
       reward for never being caught out. */
    this.perHit = this.tier.hp / this.rounds.length;
    this.perMiss = 100 / (this.tier.mistakes + 1);

    this.build();
    this.brief();
  }

  /* The first exchange is always a plain clash — the rules have to be legible
     once before they are allowed to bend. After that the order is shuffled, so
     you cannot learn where the ambush sits. */
  Fight.prototype.buildDeck = function () {
    var n = this.rounds.length;
    var rest = [];
    for (var i = 1; i < n; i++) rest.push('clash');
    var specials = ['ambush'];
    if (this.hasCode) specials.push('code');
    if (n >= 5) specials.push('guard');
    if (n >= 6) specials.push('ambush');
    specials.forEach(function (k, i) { if (i < rest.length) rest[i] = k; });
    return ['clash'].concat(shuffled(rest));
  };

  /* A code exchange must land on the code question and nowhere else, so it is
     pinned rather than drawn. Everything else comes off the deck, except that a
     nearly-dead enemy always offers the finisher first. */
  Fight.prototype.kindFor = function (i) {
    var q = this.rounds[i];
    if (q && q.code) return 'code';
    if (!this.finisherUsed && i < this.rounds.length - 1 &&
        this.foeHp > 0 && this.foeHp <= this.tier.hp * 0.3) {
      this.finisherUsed = true;
      return 'finish';
    }
    var k = this.deck[i] || 'clash';
    return k === 'code' ? 'clash' : k;
  };

  Fight.prototype.build = function () {
    var c = this.cfg, t = this.tier;
    this.mount.innerHTML = '';
    var wrap = el('div', 'fx');

    wrap.appendChild(el('div', 'fx-hud',
      '<div class="fx-side fx-l">' +
        '<div class="fx-nm">' + esc(c.hero.name || 'You') + '</div>' +
        '<div class="fx-hp"><i class="fx-hp-fill fx-hero-hp"></i></div>' +
      '</div>' +
      '<div class="fx-center">' +
        '<div class="fx-clock"><i class="fx-clock-fill"></i></div>' +
        '<div class="fx-secs">--</div>' +
      '</div>' +
      '<div class="fx-side fx-r">' +
        '<div class="fx-nm">' + esc(c.foe.name || t.label) + '</div>' +
        '<div class="fx-hp"><i class="fx-hp-fill fx-foe-hp"></i></div>' +
      '</div>'));

    var stage = el('div', 'fx-stage');
    stage.appendChild(el('div', 'fx-bg'));
    this.heroBox = el('div', 'fx-fighter fx-pos-l');
    this.foeBox = el('div', 'fx-fighter fx-pos-r');
    this.shout = el('div', 'fx-shout');
    this.comboBox = el('div', 'fx-combo');
    stage.appendChild(this.heroBox);
    stage.appendChild(this.foeBox);
    stage.appendChild(this.shout);
    stage.appendChild(this.comboBox);
    wrap.appendChild(stage);

    this.panel = el('div', 'fx-panel');
    wrap.appendChild(this.panel);

    this.mount.appendChild(wrap);

    this.heroHpEl = wrap.querySelector('.fx-hero-hp');
    this.foeHpEl = wrap.querySelector('.fx-foe-hp');
    this.clockEl = wrap.querySelector('.fx-clock-fill');
    this.secsEl = wrap.querySelector('.fx-secs');
    this.stage = stage;

    this.pose('hero', 'ready');
    this.pose('foe', 'ready');
    this.keys();
  };

  /* 1-4 answer, Enter or space advance. A fighting game you have to aim a mouse
     at is a fighting game with a delay built into every exchange. */
  Fight.prototype.keys = function () {
    var self = this;
    this._key = function (e) {
      if (self.dead && e.key !== 'Enter') return;
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      var n = '1234'.indexOf(e.key);
      if (n >= 0) {
        var b = self.panel.querySelectorAll('.fx-opt')[n];
        if (b && !b.disabled) { e.preventDefault(); b.click(); }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        var go = self.panel.querySelector('.fx-advance');
        if (go) { e.preventDefault(); go.click(); }
      }
    };
    document.addEventListener('keydown', this._key);
  };

  /* Redrawing a fighter is a fresh Stickman render, cached per pose so a
     100-exchange session is not 100 rebuilds of the same drawing. */
  Fight.prototype.pose = function (who, poseName) {
    var spec = who === 'hero' ? this.cfg.hero : this.cfg.foe;
    var box = who === 'hero' ? this.heroBox : this.foeBox;
    if (!box._cache) box._cache = {};
    if (!box._cache[poseName]) {
      box._cache[poseName] = root.Stickman.draw(spec, {
        pose: root.Stickman.poses[poseName] || root.Stickman.poses.idle,
        facing: who === 'hero' ? 1 : -1,
        w: 200, h: 230
      });
    }
    box.innerHTML = box._cache[poseName];
  };

  Fight.prototype.flash = function (cls, ms) {
    var s = this.stage;
    s.classList.add(cls);
    setTimeout(function () { s.classList.remove(cls); }, ms || 260);
  };

  Fight.prototype.say = function (text, cls, ms) {
    var sh = this.shout;
    sh.className = 'fx-shout show ' + (cls || '');
    sh.textContent = text;
    clearTimeout(sh._t);
    sh._t = setTimeout(function () { sh.className = 'fx-shout'; }, ms || 1200);
  };

  Fight.prototype.bars = function () {
    this.heroHpEl.style.width = Math.max(0, this.heroHp) + '%';
    this.foeHpEl.style.width = Math.max(0, this.foeHp) + '%';
    this.heroHpEl.classList.toggle('low', this.heroHp <= 30);
    this.foeHpEl.classList.toggle('low', this.foeHp <= 30);
  };

  /* ==================================================================== */
  /* The scene                                                             */
  /* ==================================================================== */

  /* Portraits are the same pencil figures as the fighters, drawn small and
     cached across every fight in the session — there are only seven of them. */
  var portraits = {};
  function portrait(speaker, crew) {
    if (portraits[speaker]) return portraits[speaker];
    var spec = (crew && crew[speaker]) || { name: speaker, color: '#718096' };
    var svg = '';
    try {
      svg = root.Stickman.draw(spec, {
        pose: root.Stickman.poses.idle, facing: 1, w: 78, h: 92, still: true
      });
    } catch (e) { /* no art — the name alone still carries the line */ }
    portraits[speaker] = { svg: svg, name: spec.name || speaker };
    return portraits[speaker];
  }

  /* The job as a strip that folds away — what sits under a live question, so the
     problem is still one click away while the clock runs. */
  Fight.prototype.jobHtml = function (open) {
    var s = this.scene;
    if (!s.problem) return '';
    return '<details class="fx-job"' + (open ? ' open' : '') + '>' +
      '<summary>THE JOB</summary>' +
      '<p>' + esc(s.problem) + '</p>' +
      (s.example ? '<pre class="fx-eg">' + esc(s.example) + '</pre>' : '') +
      '</details>';
  };

  /* The job as a block you cannot miss — what the brief and every call screen
     show, with no clock running. Restating it on every call is deliberate: by
     exchange four you have read three questions and a page of crew talk since
     you last saw the problem.

     The worked example is the part that goes stale fastest, so it rides along
     on the calls where the brief is already out of sight — which is all of them
     except the first, plus the code exchange, where the concrete shape of the
     input is the whole question. */
  Fight.prototype.jobCardHtml = function (withExample) {
    var s = this.scene;
    if (!s.problem) return '';
    return '<div class="fx-jobcard"><h3>THE JOB</h3><p>' + esc(s.problem) + '</p>' +
      (withExample && s.example ? '<pre class="fx-eg">' + esc(s.example) + '</pre>' : '') +
      '</div>';
  };

  /* The opening screen. Whatever else changes, this is the screen that has to
     answer "what am I actually being asked to do" before a clock ever starts. */
  Fight.prototype.brief = function () {
    var self = this, s = this.scene;
    crowdStart();
    this.bars();

    var card = el('div', 'fx-card fx-brief');
    card.innerHTML =
      '<div class="fx-briefhead">' +
        '<span class="fx-banner fx-' + this.cfg.tier + '">' + esc(this.tier.banner) + '</span>' +
        (s.arc ? '<span class="fx-arc">' + esc(s.arc) + '</span>' : '') +
      '</div>' +
      '<h2>' + esc(s.epTitle || this.cfg.title) + '</h2>' +
      '<p class="fx-lc">' + (this.cfg.lc ? 'LeetCode #' + this.cfg.lc + ' &middot; ' : '') +
        esc(this.cfg.title) + '</p>' +
      this.jobCardHtml(true);

    var talkBox = el('div', 'fx-talk');
    card.appendChild(talkBox);

    var go = el('button', 'fx-btn fx-advance', s.problem ? 'GOT IT' : 'FIGHT');
    card.appendChild(go);

    this.panel.innerHTML = '';
    this.panel.appendChild(card);
    go.focus();

    go.addEventListener('click', function () {
      play('select');
      self.talk(card, talkBox, self.opening, function () {
        play('bell');
        announce('Round one. Fight!');
        self.say('FIGHT!', 'big', 1100);
        setTimeout(function () { self.next(); }, 700);
      }, 'FIGHT');
    });
  };

  /* Deliver `lines` into `box`, one per click, then call `done`. `card` owns the
     advance button because it has to sit below the whole conversation, not
     inside it. The label on the last line belongs to the caller: the final click
     of a conversation is the one that starts something. */
  Fight.prototype.talk = function (card, box, lines, done, lastLabel) {
    var i = 0;
    var crew = (root.DOJO && root.DOJO.crew) || {};

    function button(label, ghost, onClick) {
      var old = card.querySelector('.fx-advance');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var b = el('button', 'fx-btn fx-advance' + (ghost ? ' fx-ghost' : ''), label);
      b.addEventListener('click', onClick);
      card.appendChild(b);
      b.focus();
      return b;
    }

    function step() {
      if (i >= lines.length) { done(); return; }
      var s = lines[i++];
      var p = portrait(s.speaker, crew);
      var row = el('div', 'fx-line');
      row.innerHTML =
        '<div class="fx-face">' + p.svg + '</div>' +
        '<div class="fx-bub"><b>' + esc(p.name) + '</b>' + esc(s.line) + '</div>';
      box.appendChild(row);
      play('talk');
      requestAnimationFrame(function () { row.classList.add('in'); });

      var last = i >= lines.length;
      button(last ? (lastLabel || 'CONTINUE') : 'NEXT &rsaquo;', !last, function () {
        play('select');
        step();
      });
    }
    step();
  };

  /* ==================================================================== */
  /* The exchange                                                          */
  /* ==================================================================== */

  /* The call. Nothing here is timed: the exchange announces itself, restates the
     job, lets the crew say their piece, and waits. The clock lives entirely on
     the other side of the button at the bottom.

     This used to be two different screens — a conversation screen for the
     exchanges that had dialogue left, and nothing at all for the ones that did
     not, which went straight to a running clock. That is what made an exchange
     four rounds in feel like being asked about a problem you were told about
     five minutes ago. One screen now, always, dialogue or no dialogue. */
  Fight.prototype.next = function () {
    if (this.idx >= this.rounds.length || this.foeHp <= 0 || this.heroHp <= 0) {
      return this.finish();
    }
    var self = this;
    var kind = this.kindFor(this.idx);
    var k = KINDS[kind] || KINDS.clash;
    this.clearClock();

    /* The one round where the enemy swings first is the one place a taunt
       belongs — it is the only exchange they open. There is at most one guard
       per fight, so it never becomes a catchphrase. */
    var lead = (kind === 'guard' && this.cfg.foe && this.cfg.foe.taunt)
      ? this.cfg.foe.taunt : k.lead;

    var card = el('div', 'fx-card fx-call fx-k-' + kind);
    card.innerHTML =
      '<div class="fx-meta">' +
        '<span class="fx-tag fx-tag-' + kind + '">' + esc(k.label) + '</span>' +
        '<span class="fx-count">' + (this.idx + 1) + ' / ' + this.rounds.length + '</span>' +
      '</div>' +
      (lead ? '<p class="fx-lead">' + esc(lead) + '</p>' : '') +
      this.jobCardHtml(this.idx > 0 || kind === 'code');

    var box = el('div', 'fx-talk');
    card.appendChild(box);
    this.panel.innerHTML = '';
    this.panel.appendChild(card);

    /* An ambush brings no crew talk — that is what is short about it now, along
       with the clock. Every other kind gets its slice of the conversation. */
    var lines = kind === 'ambush' ? [] : this.talkQueue.splice(0, this.perRound);
    if (lines.length) {
      this.talk(card, box, lines, function () { self.engage(kind); }, 'READY');
    } else {
      var b = el('button', 'fx-btn fx-advance', 'READY');
      b.addEventListener('click', function () { play('select'); self.engage(kind); });
      card.appendChild(b);
      b.focus();
    }
  };

  /* The exchange proper. Everything loud happens here rather than on the call,
     because this is the moment the clock starts — an "AMBUSH!" over a screen
     with no clock on it is just a caption. */
  Fight.prototype.engage = function (kind) {
    var self = this;
    var k = KINDS[kind] || KINDS.clash;
    var q = this.rounds[this.idx];
    this.kind = kind;
    this.locked = false;
    this.hintThisRound = false;
    this.pose('hero', 'ready');
    this.pose('foe', k.foeFirst ? 'strike' : 'ready');

    if (k.sfx) play(k.sfx);
    if (kind === 'ambush') { this.say('AMBUSH!', 'bad', 1000); this.flash('shake-hard', 380); }
    if (kind === 'finish') this.say('FINISH IT', 'phase', 1600);
    if (k.foeFirst) this.flash('shake', 300);

    var card = el('div', 'fx-card fx-round fx-k-' + kind);
    card.innerHTML =
      this.jobHtml(false) +
      '<div class="fx-meta">' +
        '<span class="fx-tag fx-tag-' + kind + '">' + esc(k.label) + '</span>' +
        '<span class="fx-count">' + (this.idx + 1) + ' / ' + this.rounds.length + '</span>' +
      '</div>' +
      (q.code ? '<pre class="fx-code">' + highlight(q.code) + '</pre>' : '') +
      '<div class="fx-q">' + esc(q.q) + '</div>';

    var opts = el('div', 'fx-opts' + (q.code ? ' fx-opts-code' : ''));
    q.options.forEach(function (text, i) {
      var b = el('button', 'fx-opt',
        '<kbd>' + (i + 1) + '</kbd>' +
        (q.code ? '<code>' + highlight(text) + '</code>' : '<span>' + esc(text) + '</span>'));
      b.addEventListener('click', function () { self.answer(i, b, opts); });
      opts.appendChild(b);
    });
    card.appendChild(opts);

    if (q.hint) {
      var hintRow = el('div', 'fx-hintrow');
      var hb = el('button', 'fx-hintbtn', 'HINT &mdash; half damage');
      hb.addEventListener('click', function () {
        if (self.locked || self.hintThisRound) return;
        self.hintThisRound = true;
        self.hintsUsed++;
        play('select');
        hb.disabled = true;
        hintRow.appendChild(el('div', 'fx-hint', esc(q.hint)));
      });
      hintRow.appendChild(hb);
      card.appendChild(hintRow);
    }

    this.panel.innerHTML = '';
    this.panel.appendChild(card);
    this.startClock(k.clock);
  };

  Fight.prototype.startClock = function (scale) {
    var self = this;
    var total = this.tier.seconds * (scale || 1) * 1000;
    var start = performance.now();
    this.lastTickSec = null;
    cancelAnimationFrame(this.raf);

    function frame(now) {
      if (self.locked || self.dead) return;
      var left = Math.max(0, total - (now - start));
      var frac = left / total;
      self.clockEl.style.width = (frac * 100) + '%';
      self.clockEl.classList.toggle('urgent', frac < 0.25);
      var secs = Math.ceil(left / 1000);
      if (secs !== self.lastTickSec) {
        self.secsEl.textContent = secs;
        /* Only tick over the last five seconds — a metronome for the whole
           exchange would be exhausting rather than tense. */
        if (secs <= 5 && secs > 0) play('tick');
        self.lastTickSec = secs;
      }
      if (left <= 0) { self.timeUp(); return; }
      self.raf = requestAnimationFrame(frame);
    }
    this.raf = requestAnimationFrame(frame);
  };

  Fight.prototype.stopClock = function () {
    cancelAnimationFrame(this.raf);
  };

  /* Put the HUD clock back to rest. Stopping the clock only stops it counting —
     the last number and a half-drained bar stay on screen, which on a call
     screen reads as a clock that is already running against you. The call is
     supposed to be the one place with no time pressure, so it has to look like
     one. */
  Fight.prototype.clearClock = function () {
    this.stopClock();
    this.lastTickSec = null;
    this.secsEl.textContent = '--';
    this.clockEl.style.width = '100%';
    this.clockEl.classList.remove('urgent');
  };

  Fight.prototype.timeUp = function () {
    if (this.locked) return;
    this.locked = true;
    this.stopClock();
    play('timeout');
    var q = this.rounds[this.idx];
    this.missed.push({ q: q, why: 'ran out of time' });
    var btns = this.panel.querySelectorAll('.fx-opt');
    for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
    if (btns[q.correct]) btns[q.correct].classList.add('right');
    this.takeHit('Froze up.');
    this.reveal(q, false);
  };

  Fight.prototype.answer = function (choice, btn, opts) {
    if (this.locked) return;
    this.locked = true;
    this.stopClock();

    var q = this.rounds[this.idx];
    var all = opts.querySelectorAll('.fx-opt');
    for (var i = 0; i < all.length; i++) all[i].disabled = true;
    all[q.correct].classList.add('right');

    if (choice === q.correct) {
      btn.classList.add('right');
      this.land();
    } else {
      btn.classList.add('wrong');
      this.missed.push({ q: q, chose: q.options[choice] });
      this.takeHit();
    }
    this.reveal(q, choice === q.correct);
  };

  Fight.prototype.land = function () {
    var k = KINDS[this.kind] || KINDS.clash;
    this.combo++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;

    /* Streaks pay: +15% per link, capped so a long bank cannot trivialise a
       Warlord. A hint halves the exchange, which is the price of the read. */
    var mult = Math.min(2, 1 + 0.15 * (this.combo - 1));
    var dmg = this.perHit * mult * k.dmg * (this.hintThisRound ? 0.5 : 1);
    var heavy = mult >= 1.45 || k.dmg > 1.2 || dmg >= this.foeHp;

    this.foeHp = Math.max(0, this.foeHp - dmg);
    this.bars();

    this.pose('hero', 'strike');
    this.pose('foe', 'hurt');
    this.flash('shake', 300);
    if (k.foeFirst) play('block');
    play(heavy ? 'heavy' : 'hit');
    if (this.combo > 1) {
      play('combo', this.combo);
      this.comboBox.textContent = this.combo + ' HIT COMBO';
      this.comboBox.classList.add('show');
    }
    this.say(this.kind === 'finish' ? 'FINISHED!'
           : k.foeFirst ? 'BLOCKED!'
           : heavy ? 'CLEAN HIT!' : 'HIT!', 'good');
    this.checkPhase();
  };

  Fight.prototype.takeHit = function (label) {
    var k = KINDS[this.kind] || KINDS.clash;
    this.combo = 0;
    this.comboBox.classList.remove('show');
    this.heroHp = Math.max(0, this.heroHp - this.perMiss * k.taken);
    this.bars();
    this.pose('foe', 'strike');
    this.pose('hero', 'hurt');
    this.flash('shake-hard', 380);
    play('taken');
    this.say(label || (k.taken > 1 ? 'RIGHT THROUGH YOU!' : 'COUNTERED!'), 'bad');
  };

  /* Phase changes are cheap theatre with real teaching value: they mark the
     point where a Hard problem stops being one idea and starts being two. */
  Fight.prototype.checkPhase = function () {
    var thresholds = this.tier.phases;
    if (this.phaseAt >= thresholds.length) return;
    var pct = (this.foeHp / this.tier.hp) * 100;
    if (pct > thresholds[this.phaseAt]) return;
    var cry = PHASE_CRY[Math.min(this.phaseAt, PHASE_CRY.length - 1)];
    this.phaseAt++;
    play('phase');
    this.say(cry, 'phase', 1600);
    this.stage.classList.add('phased');
  };

  Fight.prototype.reveal = function (q, wasRight) {
    var self = this;
    var box = el('div', 'fx-explain ' + (wasRight ? 'ok' : 'no'));
    box.innerHTML = '<b>' + (wasRight ? 'Right.' : 'Not this time.') + '</b> ' + explainHtml(q);
    this.panel.querySelector('.fx-card').appendChild(box);

    var over = this.foeHp <= 0 || this.heroHp <= 0 || this.idx + 1 >= this.rounds.length;
    var b = el('button', 'fx-btn fx-advance', over ? 'RESULT' : 'NEXT');
    b.addEventListener('click', function () {
      play('select');
      self.idx++;
      self.next();
    });
    this.panel.querySelector('.fx-card').appendChild(b);
    b.focus();
  };

  /* ==================================================================== */
  /* Debrief — the reason the fight exists                                 */
  /* ==================================================================== */

  /* A fight is only WON by emptying the enemy's bar. If the exchanges run out
     with both still standing it goes to the judges, scored on health left —
     which is what stops "answer everything wrong on an Easy problem" from
     counting as a win just because you outlasted the question bank. */
  Fight.prototype.verdict = function () {
    if (this.heroHp <= 0) return { won: false, ko: true };
    if (this.foeHp <= 0) return { won: true, ko: true };
    var mine = this.heroHp / 100, theirs = this.foeHp / this.tier.hp;
    return { won: theirs < mine, ko: false };
  };

  Fight.prototype.rank = function (v) {
    if (!v.won) {
      return { g: 'D', t: v.ko ? 'Knocked down — but the lesson stands.'
                               : 'Out-scored on the cards. The debrief below is your rematch.' };
    }
    if (!v.ko) return { g: 'C', t: 'Took it on the judges\' cards. A knockout means answering clean.' };
    if (!this.missed.length && !this.hintsUsed) return { g: 'S', t: 'Flawless knockout. You own this pattern.' };
    if (!this.missed.length) return { g: 'A', t: 'Clean knockout, with a read from the crew.' };
    if (this.missed.length === 1) return { g: 'B', t: 'One slip, then a finish. Look at it and it will not repeat.' };
    return { g: 'C', t: 'You closed it out — but the gaps below are the real fight.' };
  };

  Fight.prototype.finish = function () {
    var self = this, s = this.scene;
    this.dead = true;
    this.stopClock();
    crowdStop();

    var v = this.verdict();
    var won = v.won;

    this.pose('hero', won ? 'win' : 'down');
    this.pose('foe', won ? 'down' : 'win');

    if (v.ko) { play('ko'); this.say('K.O.', 'big', 2200); }
    setTimeout(function () { play(won ? 'win' : 'lose'); }, v.ko ? 900 : 0);
    announce(won ? 'You win. Lesson learned.' : 'You lose. Study the debrief.');

    var r = this.rank(v);
    var card = el('div', 'fx-card fx-result');

    /* r.t explains the grade in a sentence. It is kept on the object because it
       is the honest description of what happened, but it is not printed: after
       a fight the only things worth a glance are the letter, the word, and what
       you got wrong. */
    card.appendChild(el('div', 'fx-verdict ' + (won ? 'w' : 'l'),
      '<div class="fx-grade fx-g-' + r.g + '">' + r.g + '</div>' +
      '<div><h2>' + (won ? 'VICTORY' : 'DEFEAT') + '</h2>' +
      '<p class="fx-how">' + (v.ko ? 'by knockout' : 'on the judges&rsquo; cards') + '</p>' +
      '</div>'));

    card.appendChild(el('div', 'fx-stats',
      '<span><b>' + this.bestCombo + '</b>best combo</span>' +
      '<span><b>' + (this.rounds.length - this.missed.length) + '/' + this.rounds.length + '</b>correct</span>' +
      '<span><b>' + this.hintsUsed + '</b>hints</span>'));

    /* The screen the whole game is built to reach. */
    var lesson = el('div', 'fx-lesson');

    /* complexity and pitfall are authored WITH markup — the episodes write
       <b>Time O(n)</b> and <code>left &lt; right</code> — so unlike a question's
       prose they go in as they are. */
    if (s.solution) {
      lesson.appendChild(el('h3', null, 'THE CODE'));
      lesson.appendChild(el('pre', 'fx-code fx-sol', highlight(s.solution)));
      if (s.complexity) lesson.appendChild(el('p', 'fx-cx', s.complexity));
      if (s.pitfall) lesson.appendChild(el('p', 'fx-pit', '<b>Where it goes wrong.</b> ' + s.pitfall));
    }

    if (this.cfg.lesson) {
      lesson.appendChild(el('h3', null, 'THE PATTERN'));
      lesson.appendChild(el('p', 'fx-core', esc(this.cfg.lesson)));
    }

    if (this.missed.length) {
      lesson.appendChild(el('h4', null, 'Missed'));
      var ul = el('ul', 'fx-missed');
      this.missed.forEach(function (m) {
        ul.appendChild(el('li', null,
          '<div class="fx-mq">' + esc(m.q.q) + '</div>' +
          '<div class="fx-ma"><b>Answer:</b> ' + esc(m.q.options[m.q.correct]) + '</div>' +
          (m.chose ? '<div class="fx-mc"><b>You said:</b> ' + esc(m.chose) + '</div>'
                   : '<div class="fx-mc">You ' + esc(m.why || 'missed it') + '.</div>') +
          '<div class="fx-mw">' + explainHtml(m.q) + '</div>'));
      });
      lesson.appendChild(ul);
    } else {
      lesson.appendChild(el('p', 'fx-clean', 'Nothing landed on you.'));
    }
    card.appendChild(lesson);

    /* The default action is another fight, not a menu. Having to choose a
       problem from a list of 150 is the thing that stops you playing a second
       one, so the page picks and the button just says go. */
    var row = el('div', 'fx-endrow');
    if (this.cfg.onNext) {
      var nx = el('button', 'fx-btn fx-advance', 'NEXT FIGHT &rsaquo;');
      nx.addEventListener('click', function () { play('select'); self.cfg.onNext(won, r.g); });
      row.appendChild(nx);
    }
    var again = el('button', 'fx-btn' + (this.cfg.onNext ? ' fx-ghost' : ' fx-advance'), 'REMATCH');
    again.addEventListener('click', function () {
      play('select');
      root.FightEngine.start(self.mount, self.cfg);
    });
    row.appendChild(again);
    if (this.cfg.onEnd) {
      var out = el('button', 'fx-btn fx-ghost', 'LEAVE');
      out.addEventListener('click', function () { play('select'); self.cfg.onEnd(won, r.g); });
      row.appendChild(out);
    }
    card.appendChild(row);

    this.panel.innerHTML = '';
    this.panel.appendChild(card);
    this.panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    /* Earning a grade is a consequence of finishing, not of which button you
       press afterwards — otherwise a run of rematches would never be recorded. */
    if (this.cfg.onResult) this.cfg.onResult(won, r.g);
  };

  Fight.prototype.destroy = function () {
    this.dead = true;
    this.stopClock();
    crowdStop();
    if (this._key) document.removeEventListener('keydown', this._key);
  };

  /* ==================================================================== */

  root.FightEngine = {
    /* start(mountEl, {
         title, lc, tier: 'grunt'|'officer'|'warlord',
         hero: <stickman spec>, foe: <stickman spec, may add .taunt>,
         lesson: 'the one sentence to leave with',
         scene: { arc, epTitle, problem, example, steps: [{speaker, line}],
                  solution, complexity, pitfall },
         rounds: [{ q, options[], correct, explain, hint?, tag? }],
         onResult(won, grade)  — fired the moment the fight ends; record here
         onNext(won, grade)    — "next fight", the default action
         onEnd(won, grade)     — "leave", back to wherever you came from
       })
       Everything under `scene` is optional; without it the fight is still
       playable, it just opens on the title instead of on the job. */
    start: function (mount, cfg) {
      if (mount._fight) mount._fight.destroy();
      var f = new Fight(mount, cfg);
      mount._fight = f;
      return f;
    },
    tiers: TIERS,
    kinds: KINDS,
    codeRound: codeRound,
    sfx: play,
    setMuted: function (v) { muted = !!v; if (v) crowdStop(); },
    isMuted: function () { return muted; },
    setAnnouncer: function (v) { announceOn = !!v; }
  };
}(typeof window !== 'undefined' ? window : this));
