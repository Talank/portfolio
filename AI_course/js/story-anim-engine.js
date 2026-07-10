/* Story animation engine — acts out One Piece anecdotes as small animated scenes.
   Scene schema (window.STORY_ANIMS[patternId]):
     h      : stage height in px (default 230)
     props  : [{id, emoji, label, x, y, cls}]      — fixed scenery, % coordinates
     actors : [{id, emoji, label, x, y}]            — characters that slide around
     steps  : [{c, a: {actorId:[x,y]}, p: {propId: ''|'lit'|'good'|'bad'|'dim'|'off'}, l: {propId:'newLabel'}}]
   Step changes are cumulative; jumping to step i replays steps 0..i from the base state.

   Layout: props/actors live inside .sa-stage-content, an absolutely-positioned
   inner layer inset from .sa-stage's edges (the "margin" fix) that gets measured
   after every render and scaled down with a CSS transform if its content would
   otherwise overflow the stage (the "doesn't fit" fix) — a cheap camera auto-zoom,
   plus a wide-shot zoom bookend on entering step 0 and reaching the final step so
   replaying a scene reads like a small presentation rather than a static diagram.

   Narration: each step's caption is read aloud with the browser's speech
   synthesizer (js/voice-engine.js) using a calm narrator voice profile. During
   Play, the scene auto-advances only once narration for the current step ends
   (falling back to a fixed pause if narration is off/unsupported), mirroring
   js/episode-engine.js's narrateCurrent pattern. */

(function () {
  'use strict';

  const NARRATOR_VOICE = { pitch: 0.94, rate: 0.9, volume: 0.95, genderHint: 'female' };
  const READ_PAUSE_MS = 2600;   // fallback pacing when narration is off/unsupported
  const STEP_GAP_MS = 380;      // beat between narration ending and the next step appearing

  function el(tag, cls) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  function computeState(scene, upto) {
    const actors = {}, props = {}, labels = {};
    (scene.actors || []).forEach(a => { actors[a.id] = [a.x, a.y]; });
    (scene.props || []).forEach(p => { props[p.id] = p.cls || ''; labels[p.id] = p.label; });
    for (let i = 0; i <= upto; i++) {
      const s = scene.steps[i];
      if (s.a) Object.keys(s.a).forEach(k => { actors[k] = s.a[k]; });
      if (s.p) Object.assign(props, s.p);
      if (s.l) Object.assign(labels, s.l);
    }
    return { actors, props, labels };
  }

  // Measures the current (unscaled) bounding box of every visible child inside
  // `content`, relative to `stage`, and returns the largest scale <= 1 that lets
  // it all fit inside the stage without clipping. 1 means "no shrink needed."
  function fitScale(stageEl, contentEl) {
    const prevTransform = contentEl.style.transform;
    contentEl.style.transform = 'none';
    const stageRect = stageEl.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, any = false;
    Array.prototype.forEach.call(contentEl.children, child => {
      if (child.classList.contains('sa-off')) return;
      const r = child.getBoundingClientRect();
      if (!r.width && !r.height) return;
      any = true;
      if (r.left < minX) minX = r.left;
      if (r.top < minY) minY = r.top;
      if (r.right > maxX) maxX = r.right;
      if (r.bottom > maxY) maxY = r.bottom;
    });
    contentEl.style.transform = prevTransform;
    if (!any || stageRect.width === 0) return 1;
    const scaleW = stageRect.width / Math.max(maxX - minX, 1);
    const scaleH = stageRect.height / Math.max(maxY - minY, 1);
    return Math.max(Math.min(scaleW, scaleH, 1), 0.6);
  }

  function renderStoryAnim(container, scene) {
    container.classList.add('story-anim');
    container.innerHTML = '';

    const stage = el('div', 'sa-stage');
    stage.style.height = (scene.h || 230) + 'px';
    const content = el('div', 'sa-stage-content');
    stage.appendChild(content);

    const propEls = {}, propTagEls = {}, actorEls = {}, lastPropCls = {};

    (scene.props || []).forEach(p => {
      const d = el('div', 'sa-prop');
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      if (p.emoji) {
        const e = el('span', 'sa-emoji');
        e.textContent = p.emoji;
        d.appendChild(e);
      }
      if (p.label != null) {
        const t = el('span', 'sa-tag');
        t.textContent = p.label;
        d.appendChild(t);
        propTagEls[p.id] = t;
      }
      propEls[p.id] = d;
      content.appendChild(d);
    });

    (scene.actors || []).forEach(a => {
      const d = el('div', 'sa-actor');
      const e = el('span', 'sa-emoji');
      e.textContent = a.emoji;
      d.appendChild(e);
      if (a.label) {
        const n = el('span', 'sa-name');
        n.textContent = a.label;
        d.appendChild(n);
      }
      d.style.left = a.x + '%';
      d.style.top = a.y + '%';
      actorEls[a.id] = d;
      content.appendChild(d);
    });

    const caption = el('div', 'sa-caption');
    const controls = el('div', 'sa-controls');
    const btnPrev = el('button');  btnPrev.textContent = '⏮ Back';
    const btnPlay = el('button');  btnPlay.textContent = '▶ Play';
    const btnNext = el('button');  btnNext.textContent = 'Next ⏭';
    const btnVoice = el('button'); btnVoice.textContent = '🗣 Narration: on';
    const counter = el('span', 'step-count');
    controls.appendChild(btnPrev);
    controls.appendChild(btnPlay);
    controls.appendChild(btnNext);
    controls.appendChild(btnVoice);
    controls.appendChild(counter);

    container.appendChild(stage);
    container.appendChild(caption);
    container.appendChild(controls);

    const voiceOk = !!(window.VoiceEngine && window.VoiceEngine.isSupported());
    if (!voiceOk) {
      btnVoice.textContent = '🗣 Narration: unsupported';
      btnVoice.disabled = true;
    }
    let narrationOn = voiceOk;
    if (narrationOn) btnVoice.classList.add('sa-voice-on');

    let idx = 0, playing = false, advanceTimer = null, everRendered = false;

    // Pure visual update for step i — positions, labels, prop states, caption text,
    // camera scale. No speech, so this is safe to call from manual nav too.
    function render(i, opts) {
      idx = i;
      const st = computeState(scene, i);
      Object.keys(st.actors).forEach(k => {
        const pos = st.actors[k];
        actorEls[k].style.left = pos[0] + '%';
        actorEls[k].style.top = pos[1] + '%';
      });
      Object.keys(st.props).forEach(k => {
        const cls = 'sa-prop' + (st.props[k] ? ' sa-' + st.props[k] : '');
        if (lastPropCls[k] !== cls) {
          propEls[k].className = cls;
          lastPropCls[k] = cls;
        }
        if (propTagEls[k] && propTagEls[k].textContent !== String(st.labels[k])) {
          propTagEls[k].textContent = st.labels[k];
        }
      });
      caption.classList.remove('sa-cap-in');
      void caption.offsetWidth;
      caption.textContent = scene.steps[i].c;
      caption.classList.add('sa-cap-in');
      counter.textContent = (i + 1) + ' / ' + scene.steps.length;

      const target = fitScale(stage, content);
      const atStart = i === 0;
      const atEnd = i === scene.steps.length - 1;
      const fresh = !everRendered || (opts && opts.fresh);

      if (fresh && atStart) {
        // Wide establishing shot: start pulled back further than needed, settle in.
        content.style.transition = 'none';
        content.style.opacity = '0';
        content.style.transform = 'scale(' + Math.max(target * 0.86, 0.55).toFixed(3) + ')';
        void content.offsetWidth;
        content.style.transition = '';
        requestAnimationFrame(() => {
          content.style.opacity = '1';
          content.style.transform = 'scale(' + target.toFixed(3) + ')';
        });
      } else {
        content.style.transform = 'scale(' + target.toFixed(3) + ')';
        if (atEnd) {
          // Pull back at the close, like a camera revealing the whole board.
          clearTimeout(render._outroT1);
          render._outroT1 = setTimeout(() => {
            content.style.transform = 'scale(' + (target * 0.9).toFixed(3) + ')';
          }, 520);
        }
      }
      everRendered = true;
    }

    function narrate(text, onDone) {
      if (window.VoiceEngine) window.VoiceEngine.stop();
      if (narrationOn && voiceOk) {
        window.VoiceEngine.speak(text, NARRATOR_VOICE, { onend: onDone });
      } else {
        advanceTimer = setTimeout(onDone, READ_PAUSE_MS);
      }
    }

    function stop() {
      playing = false;
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      if (window.VoiceEngine) window.VoiceEngine.stop();
      btnPlay.textContent = '▶ Play';
    }

    function stepLoop() {
      if (!playing) return;
      narrate(scene.steps[idx].c, () => {
        if (!playing) return;
        if (idx >= scene.steps.length - 1) { stop(); return; }
        advanceTimer = setTimeout(() => { render(idx + 1); stepLoop(); }, STEP_GAP_MS);
      });
    }

    function play() {
      stop();
      playing = true;
      btnPlay.textContent = '⏸ Pause';
      if (idx >= scene.steps.length - 1) render(0, { fresh: true });
      stepLoop();
    }

    function goTo(i, opts) {
      stop();
      render(Math.max(0, Math.min(scene.steps.length - 1, i)), opts);
      if (narrationOn && voiceOk) window.VoiceEngine.speak(scene.steps[idx].c, NARRATOR_VOICE);
    }

    btnPrev.addEventListener('click', () => goTo(idx - 1));
    btnNext.addEventListener('click', () => goTo(idx + 1));
    btnPlay.addEventListener('click', () => { playing ? stop() : play(); });
    btnVoice.addEventListener('click', () => {
      narrationOn = !narrationOn;
      if (window.VoiceEngine) window.VoiceEngine.setEnabled(narrationOn);
      btnVoice.textContent = narrationOn ? '🗣 Narration: on' : '🗣 Narration: off';
      btnVoice.classList.toggle('sa-voice-on', narrationOn);
      if (!narrationOn && window.VoiceEngine) window.VoiceEngine.stop();
    });

    // Never auto-play (with narration) purely because the <details> box happens to
    // start open on page load — speech should only ever start from an explicit click,
    // never surprise a user with audio the moment a lesson page renders. Closing the
    // box mid-scene does stop any playback/narration in progress.
    const det = container.closest('details');
    if (det) {
      det.addEventListener('toggle', () => { if (!det.open) stop(); });
    }

    render(0, { fresh: true });
  }

  function mountStoryAnims(root) {
    const scenes = window.STORY_ANIMS || {};
    Array.prototype.forEach.call(
      (root || document).querySelectorAll('[data-story-anim]'),
      node => {
        if (node.dataset.saMounted) return;
        const scene = scenes[node.dataset.storyAnim];
        if (!scene) return;
        node.dataset.saMounted = '1';
        renderStoryAnim(node, scene);
      }
    );
  }

  window.renderStoryAnim = renderStoryAnim;
  window.mountStoryAnims = mountStoryAnims;
  document.addEventListener('DOMContentLoaded', () => mountStoryAnims());
})();
