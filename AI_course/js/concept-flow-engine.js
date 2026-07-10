/* Concept flowchart engine — an interactive, click-through pipeline diagram that
   teaches a technical concept (distinct from story-anim-engine's narrative scenes).
   Deliberately laid out as STAGE COLUMNS (flexbox, wraps responsively) rather than
   free x/y coordinates, so it can never overflow its box the way a coordinate-based
   layout can on a narrow screen.

   Schema (window.LESSONS[id].conceptFlow):
     title  : string
     intro  : string (optional short lede)
     stages : [{ label, nodes: [{id, text}] }]     — text may contain \n for a two-line node
     steps  : [{ active: [nodeId,...], note }]      — cumulative highlighting, like storyAnim

   Clicking any node jumps straight to the first step that activates it — real
   non-linear exploration, not just Play/Back/Next. */

(function () {
  'use strict';

  const NARRATOR_VOICE = { pitch: 0.94, rate: 0.9, volume: 0.95, genderHint: 'female' };
  const READ_PAUSE_MS = 2400;
  const STEP_GAP_MS = 320;

  function el(tag, cls) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  function renderConceptFlow(container, flow) {
    container.classList.add('cf-wrap');
    container.innerHTML = '';

    if (flow.title) {
      const h = el('div', 'cf-title');
      h.textContent = flow.title;
      container.appendChild(h);
    }
    if (flow.intro) {
      const lede = el('p', 'cf-intro');
      lede.textContent = flow.intro;
      container.appendChild(lede);
    }

    const board = el('div', 'cf-board');
    const nodeEls = {};
    const firstStepFor = {};
    flow.steps.forEach((s, i) => (s.active || []).forEach(id => {
      if (!(id in firstStepFor)) firstStepFor[id] = i;
    }));

    flow.stages.forEach((stage, si) => {
      const col = el('div', 'cf-col');
      const label = el('div', 'cf-col-label');
      label.textContent = stage.label;
      col.appendChild(label);
      const nodesWrap = el('div', 'cf-col-nodes');
      stage.nodes.forEach(n => {
        const node = el('button', 'cf-node');
        node.type = 'button';
        String(n.text).split('\n').forEach((line, li) => {
          const ln = el('span', li === 0 ? 'cf-node-title' : 'cf-node-sub');
          ln.textContent = line;
          node.appendChild(ln);
        });
        node.addEventListener('click', () => { if (firstStepFor[n.id] != null) goTo(firstStepFor[n.id]); });
        nodeEls[n.id] = node;
        nodesWrap.appendChild(node);
      });
      col.appendChild(nodesWrap);
      board.appendChild(col);
      if (si < flow.stages.length - 1) {
        const arrow = el('div', 'cf-arrow');
        arrow.textContent = '→';
        board.appendChild(arrow);
      }
    });
    container.appendChild(board);

    const caption = el('div', 'sa-caption');
    const controls = el('div', 'sa-controls');
    const btnPrev = el('button');  btnPrev.textContent = '⏮ Back';
    const btnPlay = el('button');  btnPlay.textContent = '▶ Play';
    const btnNext = el('button');  btnNext.textContent = 'Next ⏭';
    const btnVoice = el('button'); btnVoice.textContent = '🗣 Narration: on';
    const counter = el('span', 'step-count');
    [btnPrev, btnPlay, btnNext, btnVoice, counter].forEach(x => controls.appendChild(x));
    container.appendChild(caption);
    container.appendChild(controls);

    const voiceOk = !!(window.VoiceEngine && window.VoiceEngine.isSupported());
    if (!voiceOk) {
      btnVoice.textContent = '🗣 Narration: unsupported';
      btnVoice.disabled = true;
    }
    let narrationOn = voiceOk;
    if (narrationOn) btnVoice.classList.add('sa-voice-on');

    let idx = 0, playing = false, advanceTimer = null;
    const activeSoFar = new Set();

    function render(i) {
      idx = i;
      activeSoFar.clear();
      for (let k = 0; k <= i; k++) (flow.steps[k].active || []).forEach(id => activeSoFar.add(id));
      Object.keys(nodeEls).forEach(id => {
        nodeEls[id].classList.toggle('cf-active', activeSoFar.has(id));
        nodeEls[id].classList.toggle('cf-dim', !activeSoFar.has(id));
      });
      caption.classList.remove('sa-cap-in');
      void caption.offsetWidth;
      caption.textContent = flow.steps[i].note;
      caption.classList.add('sa-cap-in');
      counter.textContent = (i + 1) + ' / ' + flow.steps.length;
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
      narrate(flow.steps[idx].note, () => {
        if (!playing) return;
        if (idx >= flow.steps.length - 1) { stop(); return; }
        advanceTimer = setTimeout(() => { render(idx + 1); stepLoop(); }, STEP_GAP_MS);
      });
    }

    function play() {
      stop();
      playing = true;
      btnPlay.textContent = '⏸ Pause';
      if (idx >= flow.steps.length - 1) render(0);
      stepLoop();
    }

    function goTo(i) {
      stop();
      render(Math.max(0, Math.min(flow.steps.length - 1, i)));
      if (narrationOn && voiceOk) window.VoiceEngine.speak(flow.steps[idx].note, NARRATOR_VOICE);
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

    render(0);
  }

  window.renderConceptFlow = renderConceptFlow;
})();
