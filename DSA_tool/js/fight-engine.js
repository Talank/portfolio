/* Grand Line Dojo — the fighting game.
 *
 * A fight is a drill wearing a health bar. Every exchange is one question about
 * the pattern you are training; a right answer lands a hit, a wrong one lets the
 * enemy in, and the clock is the interview pressure you actually need to
 * rehearse. Difficulty picks the enemy tier, so a Hard problem *feels* like a
 * Warlord rather than just wearing a red label.
 *
 * Everything you hear is synthesized here with the Web Audio API — arcade-style
 * impacts, blocks, combo chimes and a KO, built from oscillators and noise at
 * runtime. No sample packs, nothing to license, zero asset bytes on the wire.
 * Fighters are drawn by js/stickman.js, also at runtime, for the same reason.
 *
 * The point of the whole thing is the last screen: LESSON LEARNED replays every
 * question you missed with the reasoning, because the fight is the hook and the
 * debrief is the teaching.
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
     and it is tuned against the exchange count so the tier is actually losable. */
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
  /* Markup                                                                */
  /* ==================================================================== */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
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
      tag: q.tag
    };
  }

  /* ==================================================================== */
  /* The fight                                                             */
  /* ==================================================================== */

  function Fight(mount, cfg) {
    this.mount = mount;
    this.cfg = cfg;
    this.tier = TIERS[cfg.tier] || TIERS.grunt;

    this.rounds = shuffled(cfg.rounds || []).map(shuffleOptions);
    if (!this.rounds.length) throw new Error('a fight needs at least one question');

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

    /* Damage is set so that clearing the bank cleanly is exactly a KO. Combos
       finish it early, which is the reward for a streak. */
    this.perHit = this.tier.hp / this.rounds.length;
    this.perMiss = 100 / (this.tier.mistakes + 1);

    this.build();
    this.intro();
  }

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

  Fight.prototype.intro = function () {
    var self = this;
    crowdStart();
    this.bars();
    /* Deliberately almost wordless. The rules are already legible from the HUD
       — two health bars and a clock — and a card explaining them is a card you
       read once and skip forever after. */
    this.panel.innerHTML =
      '<div class="fx-card fx-intro">' +
        '<div class="fx-banner fx-' + this.cfg.tier + '">' + esc(this.tier.banner) + '</div>' +
        '<h2>' + esc(this.cfg.title) + '</h2>' +
        '<button class="fx-btn fx-go">FIGHT</button>' +
      '</div>';
    this.panel.querySelector('.fx-go').addEventListener('click', function () {
      play('bell');
      announce('Round one. Fight!');
      self.say('FIGHT!', 'big', 1100);
      setTimeout(function () { self.next(); }, 700);
    });
  };

  Fight.prototype.next = function () {
    if (this.idx >= this.rounds.length || this.foeHp <= 0 || this.heroHp <= 0) {
      return this.finish();
    }
    var self = this;
    var q = this.rounds[this.idx];
    this.locked = false;
    this.hintThisRound = false;
    this.pose('hero', 'ready');
    this.pose('foe', 'ready');

    var card = el('div', 'fx-card');
    card.appendChild(el('div', 'fx-meta',
      '<span class="fx-tag">' + esc(q.tag || 'EXCHANGE') + '</span>' +
      '<span class="fx-count">' + (this.idx + 1) + ' / ' + this.rounds.length + '</span>'));
    card.appendChild(el('div', 'fx-q', esc(q.q)));

    var opts = el('div', 'fx-opts');
    q.options.forEach(function (text, i) {
      var b = el('button', 'fx-opt', esc(text));
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
    this.startClock();
  };

  Fight.prototype.startClock = function () {
    var self = this;
    var total = this.tier.seconds * 1000;
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
    this.combo++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;

    /* Streaks pay: +15% per link, capped so a long bank cannot trivialise a
       Warlord. A hint halves the exchange, which is the price of the read. */
    var mult = Math.min(2, 1 + 0.15 * (this.combo - 1));
    var dmg = this.perHit * mult * (this.hintThisRound ? 0.5 : 1);
    var heavy = mult >= 1.45 || dmg >= this.foeHp;

    this.foeHp = Math.max(0, this.foeHp - dmg);
    this.bars();

    this.pose('hero', 'strike');
    this.pose('foe', 'hurt');
    this.flash('shake', 300);
    play(heavy ? 'heavy' : 'hit');
    if (this.combo > 1) {
      play('combo', this.combo);
      this.comboBox.textContent = this.combo + ' HIT COMBO';
      this.comboBox.classList.add('show');
    }
    this.say(heavy ? 'CLEAN HIT!' : 'HIT!', 'good');
    this.checkPhase();
  };

  Fight.prototype.takeHit = function (label) {
    this.combo = 0;
    this.comboBox.classList.remove('show');
    this.heroHp = Math.max(0, this.heroHp - this.perMiss);
    this.bars();
    this.pose('foe', 'strike');
    this.pose('hero', 'hurt');
    this.flash('shake-hard', 380);
    play('taken');
    this.say(label || 'COUNTERED!', 'bad');
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
    box.innerHTML = '<b>' + (wasRight ? 'Right.' : 'Not this time.') + '</b> ' + esc(q.explain || '');
    this.panel.querySelector('.fx-card').appendChild(box);

    var over = this.foeHp <= 0 || this.heroHp <= 0 || this.idx + 1 >= this.rounds.length;
    var b = el('button', 'fx-btn fx-nextbtn', over ? 'RESULT' : 'NEXT');
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
    var self = this;
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
    lesson.appendChild(el('h3', null, 'LESSON LEARNED'));
    if (this.cfg.lesson) lesson.appendChild(el('p', 'fx-core', esc(this.cfg.lesson)));

    if (this.missed.length) {
      lesson.appendChild(el('h4', null, 'Missed'));
      var ul = el('ul', 'fx-missed');
      this.missed.forEach(function (m) {
        ul.appendChild(el('li', null,
          '<div class="fx-mq">' + esc(m.q.q) + '</div>' +
          '<div class="fx-ma"><b>Answer:</b> ' + esc(m.q.options[m.q.correct]) + '</div>' +
          (m.chose ? '<div class="fx-mc"><b>You said:</b> ' + esc(m.chose) + '</div>'
                   : '<div class="fx-mc">You ' + esc(m.why || 'missed it') + '.</div>') +
          '<div class="fx-mw">' + esc(m.q.explain || '') + '</div>'));
      });
      lesson.appendChild(ul);
    } else {
      lesson.appendChild(el('p', 'fx-clean', 'Nothing landed on you.'));
    }
    card.appendChild(lesson);

    var row = el('div', 'fx-endrow');
    var again = el('button', 'fx-btn', 'AGAIN');
    again.addEventListener('click', function () {
      play('select');
      root.FightEngine.start(self.mount, self.cfg);
    });
    row.appendChild(again);
    if (this.cfg.onEnd) {
      var out = el('button', 'fx-btn fx-ghost', 'BACK');
      out.addEventListener('click', function () { play('select'); self.cfg.onEnd(won, r.g); });
      row.appendChild(out);
    }
    card.appendChild(row);

    this.panel.innerHTML = '';
    this.panel.appendChild(card);
    this.panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  Fight.prototype.destroy = function () {
    this.dead = true;
    this.stopClock();
    crowdStop();
  };

  /* ==================================================================== */

  root.FightEngine = {
    /* start(mountEl, {
         title, lc, tier: 'grunt'|'officer'|'warlord',
         hero: <stickman spec>, foe: <stickman spec, may add .taunt>,
         lesson: 'the one sentence to leave with',
         rounds: [{ q, options[], correct, explain, hint?, tag? }],
         onEnd(won, grade)
       }) */
    start: function (mount, cfg) {
      if (mount._fight) mount._fight.destroy();
      var f = new Fight(mount, cfg);
      mount._fight = f;
      return f;
    },
    tiers: TIERS,
    sfx: play,
    setMuted: function (v) { muted = !!v; if (v) crowdStop(); },
    isMuted: function () { return muted; },
    setAnnouncer: function (v) { announceOn = !!v; }
  };
}(typeof window !== 'undefined' ? window : this));
