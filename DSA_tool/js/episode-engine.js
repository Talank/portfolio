/* Episode engine — renders a One Piece-style "episode" scene: a prop board
   (reusing the sa-prop visual language) plus two character portraits that
   trade dialogue in speech bubbles. Every character line is read aloud by
   the browser's speech synthesizer, tuned per character (js/voice-engine.js
   + data/characters.js voice profiles), over a procedural soundtrack that
   ducks under dialogue and swells at key beats (js/audio-engine.js).
   Consumed by episode.html. */

(function () {
  'use strict';

  function el(tag, cls) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  // ---- Animated themed backdrops -----------------------------------------
  // Every episode's prop board sits on a living One Piece scene (drifting
  // clouds, rolling waves, flickering torches, swaying trees…) so the stage
  // feels like a place, not a blank panel. Scenes are decorative SVG behind
  // the props; each pattern picks a fitting one. Animation is pure SMIL so
  // nothing needs extra CSS or scripting.
  function drift(dur, from, to) {
    return '<animateTransform attributeName="transform" type="translate" ' +
      'values="' + from + ';' + to + ';' + from + '" dur="' + dur + 's" ' +
      'repeatCount="indefinite"/>';
  }
  function twinkle(dur, begin) {
    return '<animate attributeName="opacity" values="0.2;1;0.2" dur="' + dur +
      's" begin="' + begin + 's" repeatCount="indefinite"/>';
  }
  function sway(dur, deg, cx, cy) {
    return '<animateTransform attributeName="transform" type="rotate" ' +
      'values="' + (-deg) + ' ' + cx + ' ' + cy + ';' + deg + ' ' + cx + ' ' + cy +
      ';' + (-deg) + ' ' + cx + ' ' + cy + '" dur="' + dur + 's" repeatCount="indefinite"/>';
  }

  const SCENES = {
    sea() {
      let waves = '';
      for (let i = 0; i < 3; i++) {
        const y = 150 + i * 22, o = 0.5 - i * 0.12;
        waves += '<path d="M0 ' + y + ' q 50 -14 100 0 t 100 0 t 100 0 t 100 0 t 100 0" ' +
          'fill="none" stroke="#3b82f6" stroke-width="3" opacity="' + o + '">' +
          drift((7 + i * 2), '0 0', '-100 0') + '</path>';
      }
      return '<g opacity="0.85"><circle cx="330" cy="46" r="26" fill="#fcd34d" opacity="0.8"/>' +
        '<g fill="#e5edf5" opacity="0.85">' +
        '<g>' + drift(26, '0 0', '60 0') + '<ellipse cx="70" cy="40" rx="34" ry="14"/><ellipse cx="105" cy="34" rx="26" ry="12"/></g>' +
        '<g>' + drift(34, '0 0', '-70 0') + '<ellipse cx="250" cy="60" rx="30" ry="12"/><ellipse cx="285" cy="52" rx="22" ry="10"/></g>' +
        '</g>' + waves + '</g>';
    },
    islands() {
      return '<g opacity="0.85"><rect x="0" y="150" width="400" height="80" fill="#3b82f6" opacity="0.16"/>' +
        '<g fill="#4ea36b" opacity="0.55">' +
        '<path d="M40 170 q40 -34 80 0 z"/><path d="M170 176 q52 -44 104 0 z"/><path d="M300 168 q34 -26 68 0 z"/>' +
        '</g>' +
        '<g fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.4">' +
        '<path d="M0 158 q 50 -10 100 0 t 100 0 t 100 0 t 100 0">' + drift(9, '0 0', '-100 0') + '</path></g>' +
        '<path d="M60 26 l0 44 M60 70 l160 -4 M220 66 l0 -40" stroke="#94a3b8" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="4 4"/></g>';
    },
    colosseum() {
      let arches = '';
      for (let i = 0; i < 8; i++) {
        const x = 14 + i * 48;
        arches += '<path d="M' + x + ' 90 v-34 a16 16 0 0 1 32 0 v34 z" fill="#b08968" opacity="0.4"/>';
      }
      let crowd = '';
      for (let i = 0; i < 26; i++) {
        const x = 12 + (i % 13) * 30, y = 22 + Math.floor(i / 13) * 16;
        crowd += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#f59e0b">' + twinkle(2 + (i % 5) * 0.4, i * 0.2) + '</circle>';
      }
      return '<g opacity="0.8"><rect x="0" y="150" width="400" height="80" fill="#e6c98f" opacity="0.28"/>' +
        crowd + arches + '</g>';
    },
    forest() {
      let trees = '';
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 84, s = 0.8 + (i % 2) * 0.3;
        trees += '<g transform="translate(' + x + ' 150) scale(' + s + ')">' +
          '<rect x="-5" y="-30" width="10" height="34" fill="#8a5a2b" opacity="0.5"/>' +
          '<g>' + sway(4 + i, 3, 0, -30) + '<path d="M0 -78 l30 44 h-60 z" fill="#3f8f5a" opacity="0.5"/>' +
          '<path d="M0 -58 l24 34 h-48 z" fill="#4ea36b" opacity="0.5"/></g></g>';
      }
      let flies = '';
      for (let i = 0; i < 7; i++) {
        flies += '<circle cx="' + (40 + i * 50) + '" cy="' + (60 + (i % 3) * 24) + '" r="2.6" fill="#fde68a">' +
          twinkle(2 + (i % 4) * 0.5, i * 0.5) + '</circle>';
      }
      return '<g opacity="0.85">' + trees + flies + '</g>';
    },
    night() {
      let stars = '';
      for (let i = 0; i < 22; i++) {
        stars += '<circle cx="' + ((i * 53) % 400) + '" cy="' + (10 + (i * 37) % 120) + '" r="' + (1.2 + (i % 3) * 0.7) + '" fill="#e2e8f0">' +
          twinkle(2 + (i % 5) * 0.6, i * 0.3) + '</circle>';
      }
      const moon = '<circle cx="340" cy="42" r="22" fill="#f1f5f9" opacity="0.85"/><circle cx="330" cy="38" r="20" fill="#0b1220" opacity="0.5"/>';
      return '<g opacity="0.8"><rect x="0" y="0" width="400" height="230" fill="#1e293b" opacity="0.14"/>' + stars + moon + '</g>';
    },
    vault() {
      let bricks = '';
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          const x = (r % 2 ? 0 : -26) + c * 52, y = 150 + r * 18;
          bricks += '<rect x="' + x + '" y="' + y + '" width="50" height="16" rx="2" fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.3"/>';
        }
      }
      function torch(x) {
        return '<g><rect x="' + (x - 2) + '" y="40" width="4" height="26" fill="#8a5a2b" opacity="0.6"/>' +
          '<path d="M' + x + ' 40 q-9 -12 0 -24 q9 12 0 24 z" fill="#f59e0b">' +
          '<animate attributeName="opacity" values="0.55;1;0.7;1;0.55" dur="1.4s" repeatCount="indefinite"/></path></g>';
      }
      return '<g opacity="0.8">' + bricks + torch(40) + torch(360) + '</g>';
    },
    sky() {
      let steps = '';
      for (let i = 0; i < 6; i++) {
        steps += '<rect x="' + (20 + i * 58) + '" y="' + (170 - i * 22) + '" width="52" height="16" rx="3" fill="#cbd5e1" opacity="0.4"/>';
      }
      return '<g opacity="0.85"><circle cx="60" cy="46" r="22" fill="#fcd34d" opacity="0.75"/>' +
        '<g fill="#e5edf5" opacity="0.85"><g>' + drift(30, '0 0', '80 0') +
        '<ellipse cx="200" cy="40" rx="34" ry="14"/><ellipse cx="240" cy="34" rx="24" ry="11"/></g></g>' + steps + '</g>';
    }
  };

  const SCENE_BY_PATTERN = {
    'monotonic-stack': 'colosseum',
    'tree-dfs-bfs': 'forest', 'backtracking': 'forest', 'trie': 'forest',
    'graphs-bfs-dfs-topo-union': 'islands',
    'bit-manipulation': 'night',
    'hashing-patterns': 'vault', 'prefix-sum': 'vault',
    'linked-list-reversal': 'vault', 'binary-search-trees': 'vault',
    'dynamic-programming': 'sky', 'greedy': 'sky'
  };

  function backdropSvg(ep) {
    const name = ep.scene || SCENE_BY_PATTERN[ep.patternId] || 'sea';
    const scene = SCENES[name] || SCENES.sea;
    return '<svg class="ep-backdrop-svg" viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + scene() + '</svg>';
  }

  function computeState(ep, upto) {
    const props = {}, labels = {};
    (ep.props || []).forEach(p => { props[p.id] = p.cls || ''; labels[p.id] = p.label; });
    (ep.ledger || []).forEach(p => { props[p.id] = 'off'; labels[p.id] = ''; });
    for (let i = 0; i <= upto; i++) {
      const s = ep.steps[i];
      if (s.p) Object.assign(props, s.p);
      if (s.l) Object.assign(labels, s.l);
    }
    return { props, labels };
  }

  // Steps that mark a scene's turning point get a music swell, regardless of pacing.
  const CLIMAX_SFX = { gong: true, victory: true };

  function renderEpisode(container, ep) {
    container.classList.add('episode');
    container.innerHTML = '';

    // ---- Stage: prop board (chests + ledger slots) ----
    const stage = el('div', 'ep-stage');
    stage.style.height = (ep.h || 210) + 'px';
    const backdrop = el('div', 'ep-backdrop');
    backdrop.innerHTML = backdropSvg(ep);
    stage.appendChild(backdrop);
    const propEls = {}, propTagEls = {};

    function mountProp(p, extraCls) {
      const d = el('div', 'sa-prop' + (extraCls ? ' ' + extraCls : ''));
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      const e = el('span', 'sa-emoji');
      e.textContent = p.emoji || '📝';
      d.appendChild(e);
      const t = el('span', 'sa-tag');
      t.textContent = p.label || '';
      d.appendChild(t);
      propTagEls[p.id] = t;
      propEls[p.id] = d;
      stage.appendChild(d);
    }
    (ep.props || []).forEach(p => mountProp(p));
    (ep.ledger || []).forEach(p => mountProp(p, 'ep-ledger-slot'));

    container.appendChild(stage);

    // ---- Dialogue rail: two portraits (left / right) + active speech bubble ----
    const rail = el('div', 'ep-rail');
    const leftSlot = el('div', 'ep-portrait-slot ep-left');
    const rightSlot = el('div', 'ep-portrait-slot ep-right');
    const bubble = el('div', 'ep-bubble');
    const bubbleName = el('div', 'ep-bubble-name');
    const bubbleText = el('div', 'ep-bubble-text');
    const speakingDot = el('span', 'ep-speaking-dot');
    bubbleName.appendChild(speakingDot);
    const bubbleNameText = document.createTextNode('');
    bubbleName.appendChild(bubbleNameText);
    bubble.appendChild(bubbleName);
    bubble.appendChild(bubbleText);
    rail.appendChild(leftSlot);
    rail.appendChild(bubble);
    rail.appendChild(rightSlot);
    container.appendChild(rail);

    const chars = window.CHARACTERS || {};
    function setPortrait(slot, charId, active) {
      slot.innerHTML = '';
      const c = chars[charId];
      if (!c) return;
      const wrap = el('div', 'ep-portrait' + (active ? ' ep-active' : ''));
      wrap.innerHTML = c.portrait;
      const label = el('div', 'ep-portrait-name');
      label.textContent = c.name;
      label.style.color = c.color;
      slot.appendChild(wrap);
      slot.appendChild(label);
    }

    // ---- Controls ----
    const controls = el('div', 'sa-controls ep-controls');
    const btnPrev = el('button'); btnPrev.textContent = '⏮ Back';
    const btnPlay = el('button'); btnPlay.textContent = '▶ Play episode';
    const btnNext = el('button'); btnNext.textContent = 'Next ⏭';
    const btnMusic = el('button'); btnMusic.textContent = '🎵 Music: off';
    const btnVoice = el('button'); btnVoice.textContent = '🗣 Narration: on';
    const counter = el('span', 'step-count');
    [btnPrev, btnPlay, btnNext, btnMusic, btnVoice].forEach(b => controls.appendChild(b));
    controls.appendChild(counter);
    container.appendChild(controls);

    // Pre-rendered, character-voiced narration (js/../data/episodes/audio).
    // Each dialogue step has its own MP3, cast to a neural voice that matches
    // the speaker (see generate_audio.py). We play those clips through a single
    // <audio> element; only if a clip is missing do we fall back to the robotic
    // browser speech synthesizer (VoiceEngine).
    const AUDIO = (window.EPISODE_AUDIO && window.EPISODE_AUDIO.decks &&
      window.EPISODE_AUDIO.decks[ep.id]) || null;
    const audioEl = new Audio();
    audioEl.preload = 'auto';
    const audioBase = 'data/episodes/audio/';
    function clipFor(i) {
      const c = AUDIO && AUDIO[i];
      return c && c.file ? audioBase + c.file : null;
    }
    const haveClips = !!AUDIO && AUDIO.some(c => c && c.file);
    const browserTTS = !!(window.VoiceEngine && window.VoiceEngine.isSupported());

    if (!haveClips && !browserTTS) {
      btnVoice.textContent = '🗣 Narration: unsupported';
      btnVoice.disabled = true;
    }

    let idx = 0;
    let playing = false;
    let advanceTimer = null;
    let lastLeft = null, lastRight = null;
    let narrationOn = haveClips || browserTTS;

    function updateMusicLabel() {
      const on = window.AudioEngine && window.AudioEngine.isMusicOn();
      btnMusic.textContent = on ? '🎵 Music: on' : '🎵 Music: off';
      btnMusic.classList.toggle('ep-music-on', !!on);
    }

    // Pure visual update for step i: props, portraits, bubble text, sfx. No narration.
    function render(i) {
      idx = i;
      const st = computeState(ep, i);
      Object.keys(st.props).forEach(k => {
        const cls = 'sa-prop' + (propEls[k].classList.contains('ep-ledger-slot') ? ' ep-ledger-slot' : '') +
          (st.props[k] ? ' sa-' + st.props[k] : '');
        propEls[k].className = cls;
        if (propTagEls[k] && propTagEls[k].textContent !== String(st.labels[k] || '')) {
          propTagEls[k].textContent = st.labels[k] || '';
        }
      });

      const step = ep.steps[i];
      const speakerId = step.speaker;
      const speakerRight = step.pos !== 'left';
      if (speakerRight) {
        setPortrait(rightSlot, speakerId, true);
        lastRight = speakerId;
        if (lastLeft) setPortrait(leftSlot, lastLeft, false);
      } else {
        setPortrait(leftSlot, speakerId, true);
        lastLeft = speakerId;
        if (lastRight) setPortrait(rightSlot, lastRight, false);
      }

      bubble.className = 'ep-bubble ' + (speakerRight ? 'ep-from-right' : 'ep-from-left');
      const c = chars[speakerId];
      bubbleNameText.textContent = c ? ' ' + c.name : '';
      bubbleName.style.color = c ? c.color : '';
      bubbleText.textContent = step.line;

      counter.textContent = (i + 1) + ' / ' + ep.steps.length;

      if (window.AudioEngine) {
        const progress = ep.steps.length > 1 ? i / (ep.steps.length - 1) : 0;
        window.AudioEngine.setIntensity(CLIMAX_SFX[step.sfx] ? 1 : progress * 0.7);
        if (step.sfx) window.AudioEngine.playSfx(step.sfx);
      }
    }

    // Speaks the current step's line (if narration is on) and calls onDone when it's
    // safe to move to the next beat — either when speech finishes, or after a fixed
    // reading pause if narration is off/unsupported.
    function narrateCurrent(onDone) {
      const step = ep.steps[idx];
      const c = chars[step.speaker];
      speakingDot.classList.remove('ep-speaking');

      const finish = () => {
        speakingDot.classList.remove('ep-speaking');
        if (window.AudioEngine) window.AudioEngine.setDuck(false);
        onDone();
      };

      const clip = narrationOn ? clipFor(idx) : null;
      if (clip) {
        // Pre-rendered character voice.
        if (window.AudioEngine) window.AudioEngine.setDuck(true);
        speakingDot.classList.add('ep-speaking');
        let done = false;
        const once = () => { if (done) return; done = true; finish(); };
        audioEl.onended = once;
        audioEl.onerror = once;
        audioEl.src = clip;
        audioEl.currentTime = 0;
        const p = audioEl.play();
        if (p && p.catch) p.catch(() => once());
        return;
      }

      if (narrationOn && browserTTS && c) {
        // Fallback: browser speech synthesizer.
        if (window.AudioEngine) window.AudioEngine.setDuck(true);
        speakingDot.classList.add('ep-speaking');
        window.VoiceEngine.speak(step.line, c.voice, { onend: finish });
      } else {
        advanceTimer = setTimeout(onDone, 2600);
      }
    }

    function stopPlayback() {
      playing = false;
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      if (window.VoiceEngine) window.VoiceEngine.stop();
      audioEl.onended = null;
      audioEl.onerror = null;
      try { audioEl.pause(); } catch (e) { /* ignore */ }
      if (window.AudioEngine) window.AudioEngine.setDuck(false);
      speakingDot.classList.remove('ep-speaking');
      btnPlay.textContent = '▶ Play episode';
    }

    function stepLoop() {
      if (!playing) return;
      render(idx);
      narrateCurrent(() => {
        if (!playing) return;
        if (idx >= ep.steps.length - 1) { stopPlayback(); return; }
        advanceTimer = setTimeout(() => { idx += 1; stepLoop(); }, 450);
      });
    }

    function play() {
      if (idx >= ep.steps.length - 1) idx = 0;
      playing = true;
      btnPlay.textContent = '⏸ Pause';
      if (window.AudioEngine && !window.AudioEngine.isMusicOn()) {
        window.AudioEngine.startMusic(); // the Play click is the user gesture browsers require
        updateMusicLabel();
      }
      stepLoop();
    }

    function goTo(i) {
      stopPlayback();
      render(Math.max(0, Math.min(ep.steps.length - 1, i)));
    }

    btnPrev.addEventListener('click', () => goTo(idx - 1));
    btnNext.addEventListener('click', () => goTo(idx + 1));
    btnPlay.addEventListener('click', () => { playing ? stopPlayback() : play(); });
    btnMusic.addEventListener('click', () => {
      if (!window.AudioEngine) return;
      window.AudioEngine.toggleMusic();
      updateMusicLabel();
    });
    btnVoice.addEventListener('click', () => {
      narrationOn = !narrationOn;
      if (window.VoiceEngine) window.VoiceEngine.setEnabled(narrationOn);
      btnVoice.textContent = narrationOn ? '🗣 Narration: on' : '🗣 Narration: off';
      btnVoice.classList.toggle('ep-music-on', narrationOn);
    });

    render(0);
    updateMusicLabel();
  }

  window.renderEpisode = renderEpisode;
})();
