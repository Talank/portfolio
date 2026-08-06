/* The valley's voice, and the noises it makes.
 *
 * Two unrelated jobs live here because they are the same job to the person
 * playing: sound that is not the game engine's business.
 *
 * SPEECH is pre-rendered. Every line is an .opus clip built by
 * data/adventure/audio/build_adventure_audio.py and named after a hash of what
 * is said, so the manifest is the only thing that knows which file is which.
 * The manifest is about thirty kilobytes and is not loaded until you actually
 * start playing — somebody who opens the page and leaves should not pay for it.
 *
 * A browser that cannot decode opus falls through to its own speech
 * synthesizer, which sounds like a robot reading a form. That is worse than
 * the clips and much better than silence, and shipping a second copy of nine
 * hundred files to avoid it is not a trade worth making.
 *
 * SOUND EFFECTS are generated with the Web Audio API at the moment they play.
 * There is no audio file behind any of them, so they cost nothing to download
 * and there is nothing to license — the same policy the rest of the course
 * uses for its music.
 */
(function (root) {
  'use strict';

  var BASE = 'data/adventure/audio/';
  var KEY = 'ai-adventure-sound';

  var state = 'idle';        // idle | loading | ready | failed
  var waiting = [];
  var el = null;             // the single <audio> everything plays through
  var onEnd = null;
  var current = null;

  var enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* private mode */ }

  function manifest() { return root.MOOMIN_AUDIO || null; }

  function load(cb) {
    if (state === 'ready' || state === 'failed') { cb(state === 'ready'); return; }
    waiting.push(cb);
    if (state === 'loading') return;
    state = 'loading';
    var s = document.createElement('script');
    s.src = BASE + 'manifest.js';
    s.onload = function () { settle(manifest() ? 'ready' : 'failed'); };
    s.onerror = function () { settle('failed'); };
    document.head.appendChild(s);
  }

  function settle(st) {
    state = st;
    var q = waiting; waiting = [];
    q.forEach(function (fn) { fn(st === 'ready'); });
  }

  function ensureEl() {
    if (el) return el;
    el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', function () {
      var fn = onEnd; onEnd = null; current = null;
      if (fn) fn();
    });
    /* A missing or undecodable clip must not stop the conversation dead. */
    el.addEventListener('error', function () {
      var fn = onEnd; onEnd = null; current = null;
      if (fn) fn();
    });
    return el;
  }

  var canOpus = null;
  function opusOk() {
    if (canOpus === null) {
      var a = document.createElement('audio');
      canOpus = !!(a.canPlayType && a.canPlayType('audio/ogg; codecs=opus'));
    }
    return canOpus;
  }

  /* Speak clip `name`, then call `done`. Falls back to the browser's own voice
     when there is no clip to play, so the caller never has to care which
     happened — it always gets its callback. */
  function say(name, text, done) {
    stop();
    if (!enabled || !name) { if (done) setTimeout(done, 40); return; }

    if (!opusOk()) {
      speakRobot(text, done);
      return;
    }
    onEnd = done || null;
    current = name;
    var a = ensureEl();
    a.src = BASE + name + '.opus';
    var p = a.play();
    if (p && p.catch) {
      p.catch(function () {
        /* Autoplay refused until the first gesture — the game always has one
           before this can happen, so this is only ever a decode failure. */
        var fn = onEnd; onEnd = null;
        if (fn) fn();
      });
    }
  }

  function speakRobot(text, done) {
    if (!root.speechSynthesis || !text) { if (done) setTimeout(done, 600); return; }
    try {
      root.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.onend = function () { if (done) done(); };
      u.onerror = function () { if (done) done(); };
      root.speechSynthesis.speak(u);
    } catch (e) {
      if (done) setTimeout(done, 600);
    }
  }

  function stop() {
    onEnd = null; current = null;
    if (el) { try { el.pause(); el.removeAttribute('src'); } catch (e) { /* ignore */ } }
    if (root.speechSynthesis) { try { root.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  }

  function speaking() { return !!current || (el && !el.paused && !el.ended); }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (!enabled) { stop(); stopBed(); }
    else if (lastRegion) bed(lastRegion);
  }

  /* --- noises ----------------------------------------------------------
     Short, quiet, and built from one oscillator each. Anything longer than a
     third of a second becomes irritating on the four hundredth footstep. */
  var ac = null;
  function audio() {
    if (ac === null) {
      var C = root.AudioContext || root.webkitAudioContext;
      ac = C ? new C() : false;
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }

  function blip(freq, dur, type, gain) {
    if (!enabled) return;
    var a = audio();
    if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, a.currentTime);
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(gain || 0.05, a.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }

  var sfx = {
    step: function () { blip(90 + Math.random() * 30, 0.07, 'triangle', 0.022); },
    pick: function () { blip(880, 0.12, 'sine', 0.05); blip(1320, 0.16, 'sine', 0.03); },
    right: function () { blip(660, 0.12, 'sine', 0.05); setTimeout(function () { blip(990, 0.22, 'sine', 0.05); }, 110); },
    wrong: function () { blip(220, 0.2, 'triangle', 0.045); },
    pearl: function () {
      [784, 988, 1319].forEach(function (f, i) {
        setTimeout(function () { blip(f, 0.35, 'sine', 0.045); }, i * 130);
      });
    },
    move: function () { blip(520, 0.05, 'square', 0.018); },
    door: function () { blip(160, 0.18, 'sawtooth', 0.03); },
  };

  /* --- the bed ---------------------------------------------------------
     Each region gets a piece of music that is composed while you listen: a
     scale, a speed, and a note chosen at random from the scale every few
     seconds over a slow drone. That is a few hundred bytes of code instead of
     nine looping audio files, it never repeats itself audibly, and there is
     nothing in it that belongs to anybody.

     It is mixed very quiet on purpose. Somebody is usually talking over it,
     and a game score you notice is a game score you turn off. */
  var BEDS = {
    valley:     { root: 261.63, scale: [0, 2, 4, 7, 9], gap: 2600, wave: 'sine', drone: 1, cut: 700 },
    mountains:  { root: 174.61, scale: [0, 3, 5, 7, 10], gap: 4200, wave: 'sine', drone: 1, cut: 400 },
    meadow:     { root: 293.66, scale: [0, 2, 4, 7, 9], gap: 2200, wave: 'triangle', drone: 0.7, cut: 900 },
    river:      { root: 220.00, scale: [0, 2, 3, 5, 7, 10], gap: 1700, wave: 'sine', drone: 0.8, cut: 1200 },
    harbour:    { root: 196.00, scale: [0, 2, 5, 7, 9], gap: 3000, wave: 'triangle', drone: 1, cut: 600 },
    lighthouse: { root: 164.81, scale: [0, 5, 7, 12], gap: 4600, wave: 'sine', drone: 1.2, cut: 350 },
    yard:       { root: 233.08, scale: [0, 2, 4, 5, 7, 11], gap: 2000, wave: 'square', drone: 0.5, cut: 800 },
    island:     { root: 155.56, scale: [0, 2, 4, 6, 8, 10], gap: 3400, wave: 'sine', drone: 1.1, cut: 300 },
    winter:     { root: 392.00, scale: [0, 2, 3, 7, 10], gap: 5200, wave: 'sine', drone: 1.4, cut: 250 },
  };

  var bedTimer = null, bedNodes = [], bedRegion = null, lastRegion = null;

  function stopBed() {
    if (bedTimer) { clearInterval(bedTimer); bedTimer = null; }
    bedNodes.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* already gone */ } });
    bedNodes = [];
    bedRegion = null;
  }

  function bed(regionId) {
    lastRegion = regionId;
    if (bedRegion === regionId && bedTimer) return;
    stopBed();
    if (!enabled) return;
    var cfg = BEDS[regionId];
    var a = audio();
    if (!cfg || !a) return;
    bedRegion = regionId;

    /* The drone: two detuned oscillators a fifth apart, filtered right down. */
    var out = a.createGain();
    out.gain.value = 0.045;
    var lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cfg.cut;
    lp.connect(out); out.connect(a.destination);
    bedNodes.push(out, lp);

    [cfg.root / 2, (cfg.root / 2) * 1.4983].forEach(function (f, i) {
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = 'sine';
      o.frequency.value = f * (i ? 1.003 : 1);
      g.gain.value = 0.10 * cfg.drone;
      o.connect(g); g.connect(lp);
      o.start();
      bedNodes.push(o, g);
    });

    function note() {
      if (!enabled || !bedTimer) return;
      var semis = cfg.scale[(Math.random() * cfg.scale.length) | 0];
      var oct = Math.random() < 0.3 ? 2 : 1;
      var f = cfg.root * Math.pow(2, semis / 12) * oct;
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = cfg.wave;
      o.frequency.value = f;
      var now = a.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
      o.connect(g); g.connect(lp);
      o.start(now); o.stop(now + 2.8);
    }
    bedTimer = setInterval(function () {
      /* Leave gaps. Music that never stops is noise. */
      if (Math.random() < 0.75) note();
    }, cfg.gap);
    note();
  }

  root.MoominVoice = {
    load: load,
    bed: bed,
    stopBed: stopBed,
    say: say,
    stop: stop,
    speaking: speaking,
    manifest: manifest,
    enabled: function () { return enabled; },
    setEnabled: setEnabled,
    sfx: sfx,
  };
})(window);
