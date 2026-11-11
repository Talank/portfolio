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

    if (!window.VoiceEngine || !window.VoiceEngine.isSupported()) {
      btnVoice.textContent = '🗣 Narration: unsupported';
      btnVoice.disabled = true;
    }

    let idx = 0;
    let playing = false;
    let advanceTimer = null;
    let lastLeft = null, lastRight = null;
    let narrationOn = !!(window.VoiceEngine && window.VoiceEngine.isSupported());

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
      if (narrationOn && window.VoiceEngine && window.VoiceEngine.isSupported() && c) {
        if (window.AudioEngine) window.AudioEngine.setDuck(true);
        speakingDot.classList.add('ep-speaking');
        window.VoiceEngine.speak(step.line, c.voice, {
          onend: () => {
            speakingDot.classList.remove('ep-speaking');
            if (window.AudioEngine) window.AudioEngine.setDuck(false);
            onDone();
          }
        });
      } else {
        advanceTimer = setTimeout(onDone, 2600);
      }
    }

    function stopPlayback() {
      playing = false;
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      if (window.VoiceEngine) window.VoiceEngine.stop();
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
