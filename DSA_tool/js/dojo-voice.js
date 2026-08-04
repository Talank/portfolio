/* The Dojo's voice — pre-rendered, cast-voiced clips for every line a fight
 * speaks, plus the announcer bank.
 *
 * The Dojo used to put its dialogue on screen and make you click through it.
 * That asks for the one thing this course is built around not asking: sitting
 * and reading. Spoken, the same scene plays like a cut-scene — you watch the
 * crew argue their way to the pattern instead of reading them argue.
 *
 * Clips are built by data/dojo/audio/build_dojo_audio.py and named by a hash of
 * their spoken text, so a line that appears in two scenes is one file. The
 * manifest is the only thing that knows which clip belongs to which line, and
 * at ~100 KB it is not something to ship to someone who opens the picker and
 * leaves — so nothing here loads until a fight actually starts.
 *
 * Same fallback ladder as the episodes: .opus is all that ships, and a browser
 * that cannot play it falls through to the robotic browser synthesizer rather
 * than to silence. Shipping a second copy of every clip costs more than that
 * handful of listeners is worth.
 *
 * Consumed by js/fight-engine.js.
 */
(function (root) {
  'use strict';

  var BASE = 'data/dojo/audio/';
  var KEY = 'dsa-dojo-voice';

  var state = 'idle';      // idle | loading | ready | failed
  var waiting = [];

  /* Muting is a preference, not a session setting: someone on a train turns it
     off once and should not have to turn it off again on the next fight. */
  var enabled = true;
  try {
    enabled = localStorage.getItem(KEY) !== 'off';
  } catch (e) { /* private mode — the default stands */ }

  function manifest() { return root.DOJO_AUDIO || null; }

  function load(cb) {
    if (state === 'ready' || state === 'failed') { cb(state === 'ready'); return; }
    waiting.push(cb);
    if (state === 'loading') return;
    state = 'loading';

    var s = document.createElement('script');
    s.src = BASE + 'manifest.js';
    s.onload = function () {
      state = manifest() ? 'ready' : 'failed';
      var q = waiting; waiting = [];
      q.forEach(function (fn) { fn(state === 'ready'); });
    };
    s.onerror = function () {
      /* Not an error worth shouting about: the fight still plays, it just
         plays silently, exactly as it did before any of this existed. */
      state = 'failed';
      var q = waiting; waiting = [];
      q.forEach(function (fn) { fn(false); });
    };
    document.head.appendChild(s);
  }

  /* Every clip for one problem, split by the role it plays in the fight. The
     `talk` clips are in the order the scene's steps are, which is the order
     fight-engine filters them into — see the constructor. */
  function clipsFor(lc) {
    var m = manifest();
    var list = (m && m.problems && m.problems[String(lc)]) || [];
    var out = { brief: null, talk: [], pitfall: null };
    list.forEach(function (c) {
      if (c.r === 'brief') out.brief = c;
      else if (c.r === 'pitfall') out.pitfall = c;
      else out.talk.push(c);
    });
    return out;
  }

  function announcer(key) {
    var m = manifest();
    return (m && m.announcer && m.announcer[key]) || null;
  }

  function url(entry) {
    return entry && entry.f ? BASE + entry.f + '.opus' : null;
  }

  /* One element for the line being spoken, one for the line after it. Warming
     the next clip is what keeps a conversation from pausing on the network
     between every two sentences. */
  var el = null, warm = null;

  function element() {
    if (!el) { el = new Audio(); el.preload = 'auto'; }
    return el;
  }

  function prefetch(entry) {
    var u = url(entry);
    if (!u || !enabled) return;
    if (!warm) { warm = new Audio(); warm.preload = 'auto'; }
    warm.src = u;
  }

  function stop() {
    if (!el) return;
    el.onended = el.onerror = null;
    try { el.pause(); } catch (e) { /* already stopped */ }
    el.removeAttribute('src');
  }

  /* Browser-TTS fallback, for a clip that is missing or will not decode. The
     profiles only have to be different enough to tell the crew apart; the real
     casting lives in the rendered clips. */
  var FALLBACK = {
    luffy:   { pitch: 1.25, rate: 1.12, genderHint: 'male' },
    zoro:    { pitch: 0.65, rate: 0.92, genderHint: 'male' },
    nami:    { pitch: 1.35, rate: 1.05, genderHint: 'female' },
    usopp:   { pitch: 1.45, rate: 1.10, genderHint: 'male' },
    sanji:   { pitch: 0.95, rate: 1.00, genderHint: 'male' },
    chopper: { pitch: 1.70, rate: 1.05, genderHint: 'female' },
    robin:   { pitch: 0.85, rate: 0.92, genderHint: 'female' },
    franky:  { pitch: 0.60, rate: 1.02, genderHint: 'male' },
    brook:   { pitch: 1.15, rate: 0.95, genderHint: 'male' },
    _narrator:  { pitch: 0.55, rate: 0.98, genderHint: 'male' },
    _announcer: { pitch: 0.50, rate: 1.05, genderHint: 'male' }
  };

  function speakFallback(text, speaker, done) {
    var V = root.VoiceEngine;
    if (!text || !V || !V.isSupported()) { done(); return; }
    V.speak(text, FALLBACK[speaker] || FALLBACK._narrator, { onend: done });
  }

  /* play(entry, opts) -> cancel()
     opts: { text, speaker, onend }
     `onend` fires exactly once, however the line ended — finished, failed, or
     was cancelled — because the caller uses it to advance the scene and a
     conversation that stops advancing is a dead screen. */
  function play(entry, opts) {
    opts = opts || {};
    var fired = false;
    function done() {
      if (fired) return;
      fired = true;
      if (opts.onend) opts.onend();
    }

    if (!enabled) { done(); return function () { fired = true; }; }

    var u = url(entry);
    if (!u) {
      speakFallback(opts.text, opts.speaker, done);
      return function () {
        fired = true;
        if (root.VoiceEngine) root.VoiceEngine.stop();
      };
    }

    var a = element();
    stop();
    a.src = u;
    a.onended = done;
    a.onerror = function () {
      /* Almost always "this browser cannot play Ogg Opus". Hand the line to
         the synthesizer rather than dropping it. */
      speakFallback(opts.text, opts.speaker, done);
    };
    var p = a.play();
    if (p && p.catch) {
      p.catch(function () {
        /* Autoplay refused, or a decode failure the error event did not
           report. Either way the scene must not stall here. */
        speakFallback(opts.text, opts.speaker, done);
      });
    }

    return function cancel() {
      fired = true;
      stop();
      if (root.VoiceEngine) root.VoiceEngine.stop();
    };
  }

  function setEnabled(v) {
    enabled = !!v;
    if (!enabled) { stop(); if (root.VoiceEngine) root.VoiceEngine.stop(); }
    try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) { /* fine */ }
  }

  root.DojoVoice = {
    load: load,
    isReady: function () { return state === 'ready'; },
    clipsFor: clipsFor,
    announcer: announcer,
    play: play,
    prefetch: prefetch,
    stop: stop,
    setEnabled: setEnabled,
    isEnabled: function () { return enabled; }
  };
}(typeof window !== 'undefined' ? window : this));
