/* Procedural audio engine — all music and sound effects are synthesized in the
   browser with the Web Audio API. No external audio files, no third-party
   recordings: everything here is generated from oscillators/noise at runtime,
   so there is nothing to license and nothing that can go stale or 404. */

(function () {
  'use strict';

  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicOn = false;
  let musicVolume = 0.25;
  let duckActive = false;   // true while a character is "speaking" — music dips under narration
  let intensity = 0;        // 0..1, rises toward a scene's climax — thickens the arrangement
  const SFX_VOLUME = 0.35;

  // D minor pentatonic, low bass + mid melody register — reads as "adventure on the open sea"
  // without imitating any specific existing composition.
  const SCALE = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23]; // D3 F3 G3 A3 C4 D4 F4
  const BASS = [73.42, 87.31, 98.00, 110.00]; // D2 F2 G2 A2

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      musicGain = ctx.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = SFX_VOLUME;
      sfxGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startAt, dur, opts) {
    opts = opts || {};
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, startAt);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, startAt + dur);
    const peak = opts.peak != null ? opts.peak : 1;
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(peak, startAt + (opts.attack || 0.015));
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
    osc.connect(g);
    g.connect(opts.bus || sfxGain);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.05);
    return osc;
  }

  function noiseBurst(startAt, dur, opts) {
    opts = opts || {};
    const c = getCtx();
    const bufSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = opts.filterType || 'bandpass';
    filt.frequency.value = opts.freq || 1200;
    if (opts.slideFreqTo) {
      filt.frequency.setValueAtTime(opts.freq || 1200, startAt);
      filt.frequency.exponentialRampToValueAtTime(opts.slideFreqTo, startAt + dur);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(opts.peak || 0.5, startAt);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(opts.bus || sfxGain);
    src.start(startAt);
    src.stop(startAt + dur + 0.02);
  }

  const SFX = {
    // page turn / dash — quick filtered noise sweep
    whoosh() {
      const c = getCtx();
      const t = c.currentTime;
      noiseBurst(t, 0.35, { freq: 300, slideFreqTo: 2600, peak: 0.4 });
    },
    // ledger entry / "logged it" — short bright bell
    chime() {
      const c = getCtx();
      const t = c.currentTime;
      tone(880, t, 0.22, { type: 'triangle', peak: 0.5 });
      tone(1318.5, t + 0.03, 0.25, { type: 'sine', peak: 0.35 });
    },
    // big reveal — low struck gong
    gong() {
      const c = getCtx();
      const t = c.currentTime;
      tone(110, t, 1.4, { type: 'sine', peak: 0.5, attack: 0.01 });
      tone(220, t, 1.0, { type: 'triangle', peak: 0.25 });
      noiseBurst(t, 0.3, { freq: 500, peak: 0.3, filterType: 'lowpass' });
    },
    // match found — short rising arpeggio
    victory() {
      const c = getCtx();
      const t = c.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.1, 0.3, { type: 'triangle', peak: 0.4 }));
    },
    // wrong guess / bad path — low buzzy thud
    error() {
      const c = getCtx();
      const t = c.currentTime;
      tone(120, t, 0.28, { type: 'square', peak: 0.28, slideTo: 70 });
    },
    // light footstep / step forward
    pop() {
      const c = getCtx();
      const t = c.currentTime;
      tone(440, t, 0.1, { type: 'sine', peak: 0.3 });
    }
  };

  function playSfx(name) {
    try {
      if (SFX[name]) SFX[name]();
    } catch (e) { /* audio not available (e.g. autoplay-restricted) — silently no-op */ }
  }

  // Simple lookahead scheduler for a loopable background theme.
  let nextNoteTime = 0;
  let beat = 0;
  const LOOP_LEN = 16; // 16 beats per pattern

  function scheduleBeat(time) {
    const step = beat % LOOP_LEN;
    const velocity = 0.7 + intensity * 0.6; // scene climax plays a little louder/fuller
    // bass pulse on beats 0,4,8,12
    if (step % 4 === 0) {
      tone(BASS[(step / 4) % BASS.length], time, 0.9, { type: 'sine', peak: 0.22 * velocity, bus: musicGain, attack: 0.05 });
    }
    // melody: sparse pentatonic notes, skip some beats for breathing room
    const melodyPattern = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1];
    if (melodyPattern[step]) {
      const note = SCALE[(step * 3 + Math.floor(step / 4)) % SCALE.length];
      tone(note, time, 0.5, { type: 'triangle', peak: 0.14 * velocity, bus: musicGain, attack: 0.02 });
      // high harmony line only kicks in as the scene builds toward its climax
      if (intensity > 0.55) {
        tone(note * 2, time, 0.35, { type: 'sine', peak: 0.06 * intensity, bus: musicGain, attack: 0.02 });
      }
    }
    // soft brush on off-beats
    if (step % 2 === 1) {
      noiseBurst(time, 0.12, { freq: 4000, peak: 0.05, filterType: 'highpass', bus: musicGain });
    }
  }

  function musicScheduler() {
    const c = getCtx();
    const beatDur = 0.4; // ~150bpm eighth-notes
    while (nextNoteTime < c.currentTime + 0.2) {
      scheduleBeat(nextNoteTime);
      nextNoteTime += beatDur;
      beat++;
    }
  }

  function currentTarget() {
    if (!musicOn) return 0;
    return musicVolume * (duckActive ? 0.28 : 1);
  }

  function rampMusicGain(dur) {
    if (!ctx) return;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(Math.max(currentTarget(), 0.0001), ctx.currentTime + (dur || 0.5));
  }

  function startMusic() {
    if (musicOn) return;
    const c = getCtx();
    musicOn = true;
    nextNoteTime = c.currentTime + 0.05;
    beat = 0;
    rampMusicGain(0.8);
    musicTimer = setInterval(musicScheduler, 100);
  }

  function stopMusic() {
    if (!musicOn) return;
    musicOn = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    rampMusicGain(0.5);
  }

  function toggleMusic() {
    if (musicOn) stopMusic(); else startMusic();
    return musicOn;
  }

  // Dips the music under a speaking line, then swells back up — the "soundtrack" feel.
  function setDuck(active) {
    if (duckActive === active) return;
    duckActive = active;
    rampMusicGain(active ? 0.25 : 0.6);
  }

  // 0..1: nudges the arrangement fuller/louder as a scene builds toward its climax.
  function setIntensity(v) {
    intensity = Math.max(0, Math.min(1, v));
  }

  window.AudioEngine = {
    playSfx, startMusic, stopMusic, toggleMusic, setDuck, setIntensity,
    isMusicOn: () => musicOn
  };
})();
