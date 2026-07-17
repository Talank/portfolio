/* Narration engine — reads each character's original dialogue line aloud with
   the browser's built-in speech synthesizer (SpeechSynthesisUtterance), tuned
   per character (pitch/rate/volume/voice) from data/characters.js. This is
   synthesized speech reading our own writing — not a recording of anyone's
   voice — so there is nothing here that needs licensing. Consumed by
   js/episode-engine.js. */

(function () {
  'use strict';

  let enabled = true;
  let cachedVoices = null;

  function supported() {
    return typeof window.speechSynthesis !== 'undefined';
  }

  function loadVoices(cb) {
    if (!supported()) { cb([]); return; }
    const synth = window.speechSynthesis;
    const have = synth.getVoices();
    if (have && have.length) { cachedVoices = have; cb(have); return; }
    if (cachedVoices) { cb(cachedVoices); return; }
    let done = false;
    synth.onvoiceschanged = () => {
      if (done) return;
      done = true;
      cachedVoices = synth.getVoices();
      cb(cachedVoices);
    };
    // Some browsers never fire onvoiceschanged if voices were already ready.
    setTimeout(() => {
      if (done) return;
      done = true;
      cachedVoices = synth.getVoices();
      cb(cachedVoices);
    }, 250);
  }

  const FEMALE_HINTS = /female|samantha|victoria|karen|moira|tessa|zira|susan|fiona|kate|serena|ava/i;
  const MALE_HINTS = /male|daniel|alex|fred|george|david|mark|tom|aaron|oliver|arthur|gordon/i;

  function pickVoice(genderHint, voices) {
    if (!voices || !voices.length) return null;
    const english = voices.filter(v => /^en/i.test(v.lang));
    const pool = english.length ? english : voices;
    let match = null;
    if (genderHint === 'female') match = pool.find(v => FEMALE_HINTS.test(v.name));
    else if (genderHint === 'male') match = pool.find(v => MALE_HINTS.test(v.name));
    return match || pool[0];
  }

  function stop() {
    if (supported()) window.speechSynthesis.cancel();
  }

  // speak(text, voiceProfile, {onend}) — voiceProfile: {pitch, rate, volume, genderHint}
  function speak(text, profile, opts) {
    opts = opts || {};
    if (!enabled || !supported()) {
      setTimeout(() => { if (opts.onend) opts.onend(); }, 900); // keep pacing consistent even without audio
      return;
    }
    stop();
    loadVoices(voices => {
      const synth = window.speechSynthesis;
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = (profile && profile.pitch != null) ? profile.pitch : 1;
      u.rate = (profile && profile.rate != null) ? profile.rate : 1;
      u.volume = (profile && profile.volume != null) ? profile.volume : 1;
      const v = pickVoice(profile && profile.genderHint, voices);
      if (v) u.voice = v;
      let finished = false;
      const finish = () => { if (finished) return; finished = true; if (opts.onend) opts.onend(); };
      u.onend = finish;
      u.onerror = finish;
      // Safety net: some mobile browsers silently drop utterances.
      setTimeout(finish, Math.max(4000, text.length * 90));
      try { synth.speak(u); } catch (e) { finish(); }
    });
  }

  function setEnabled(v) {
    enabled = v;
    if (!v) stop();
  }

  window.VoiceEngine = { speak, stop, setEnabled, isEnabled: () => enabled, isSupported: supported };
})();
