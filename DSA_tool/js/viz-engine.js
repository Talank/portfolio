/*
Array/pointer step-through visualizer.
Consumes: { initialArray: [...], labelArray: optional [...] display labels,
            steps: [ { highlights: {idx:number -> 'a'|'b'|'c'|'bad'|'dim'},
                       pointers: {name:string -> idx:number},
                       vars: {name:string -> value},
                       message: string,
                       arrayOverride: optional [...] to redraw array (for DP tables / mutations) } ] }
Renders play/step/reset controls into a container element.

Animation notes: cell DOM nodes persist across steps so CSS transitions on
background/border actually fire (rather than re-creating nodes each step,
which would make transitions invisible). Pointer labels are separate
absolutely-positioned elements whose `left` is transitioned via CSS, so a
pointer visibly slides from one index to the next instead of teleporting.
*/
function renderArrayViz(containerEl, viz) {
  const steps = viz.steps || [];
  let cur = 0;
  let playing = null;
  let intervalMs = 1100;

  const stage = document.createElement('div');
  stage.className = 'viz-stage';
  const controls = document.createElement('div');
  controls.className = 'viz-controls';
  const varsRow = document.createElement('div');
  varsRow.className = 'viz-vars';

  const btnReset = mkBtn('↺ Reset');
  const btnPrev = mkBtn('← Prev');
  const btnPlay = mkBtn('▶ Play');
  const btnNext = mkBtn('Next →');
  const msg = document.createElement('div');
  msg.className = 'step-msg';
  const count = document.createElement('div');
  count.className = 'step-count';

  const speedRow = document.createElement('label');
  speedRow.className = 'speed-row';
  const speedInput = document.createElement('input');
  speedInput.type = 'range';
  speedInput.min = '400';
  speedInput.max = '2200';
  speedInput.step = '100';
  speedInput.value = String(2600 - intervalMs);
  speedRow.append('Speed ', speedInput);

  controls.append(btnReset, btnPrev, btnPlay, btnNext, speedRow, msg, count);
  containerEl.append(stage, controls, varsRow);

  // Persistent cell elements, rebuilt only when the underlying array shape/values change.
  let cellEls = [];
  let lastArrKey = null;
  let prevHighlights = {};

  // Discover every pointer name used across all steps up front so each name
  // keeps a stable color the whole time, even across steps where it's absent.
  const allPointerNames = [];
  steps.forEach(s => Object.keys(s.pointers || {}).forEach(n => {
    if (!allPointerNames.includes(n)) allPointerNames.push(n);
  }));
  const ptrEls = {};
  allPointerNames.forEach((name, i) => {
    const el = document.createElement('div');
    el.className = 'viz-ptr-float p' + ((i % 3) + 1);
    el.innerHTML = `<span class="arrow">▲</span>${name}`;
    el.style.opacity = '0';
    stage.appendChild(el);
    ptrEls[name] = el;
  });

  function mkBtn(label) {
    const b = document.createElement('button');
    b.textContent = label;
    return b;
  }

  function buildCells(arr, labels) {
    stage.querySelectorAll('.viz-cell').forEach(n => n.remove());
    cellEls = arr.map((val, idx) => {
      const cell = document.createElement('div');
      cell.className = 'viz-cell';
      const idxTag = document.createElement('span');
      idxTag.className = 'idx';
      idxTag.textContent = idx;
      cell.appendChild(idxTag);
      cell.appendChild(document.createTextNode(labels[idx]));
      stage.appendChild(cell);
      return cell;
    });
    // Pointer floats must stay after the cells in DOM order (harmless either way
    // since they're position:absolute, but keeps things predictable).
    allPointerNames.forEach(name => stage.appendChild(ptrEls[name]));
    prevHighlights = {};
  }

  function render() {
    const arr = (steps[cur] && steps[cur].arrayOverride) || viz.initialArray;
    const labels = viz.labelArray || arr;
    const step = steps[cur] || {};
    const highlights = step.highlights || {};
    const pointers = step.pointers || {};

    const arrKey = arr.map((v, i) => labels[i] + '|' + v).join(',');
    if (arrKey !== lastArrKey) {
      buildCells(arr, labels);
      lastArrKey = arrKey;
    }

    cellEls.forEach((cell, idx) => {
      const h = highlights[idx];
      const prevH = prevHighlights[idx];
      cell.className = 'viz-cell' + (h ? ' hl-' + h : '');
      if (h && h !== prevH) {
        // restart the pop animation even if the class name is unchanged
        cell.classList.remove('pop');
        void cell.offsetWidth; // force reflow
        cell.classList.add('pop');
      }
    });
    prevHighlights = highlights;

    // Group pointer names sharing an index so their labels don't overlap.
    const namesByIdx = {};
    Object.keys(pointers).forEach(name => {
      const idx = pointers[name];
      if (idx === null || idx === undefined || idx < 0) return;
      (namesByIdx[idx] = namesByIdx[idx] || []).push(name);
    });

    allPointerNames.forEach(name => {
      const el = ptrEls[name];
      const idx = pointers[name];
      if (idx === null || idx === undefined || idx < 0 || !cellEls[idx]) {
        el.style.opacity = '0';
        return;
      }
      const cell = cellEls[idx];
      const stack = namesByIdx[idx] || [name];
      const stackPos = stack.indexOf(name);
      el.style.opacity = '1';
      el.style.left = (cell.offsetLeft + cell.offsetWidth / 2) + 'px';
      el.style.top = (cell.offsetTop + cell.offsetHeight + stackPos * 22) + 'px';
    });

    msg.textContent = step.message || '';
    count.textContent = `Step ${steps.length ? cur + 1 : 0} / ${steps.length}`;
    varsRow.innerHTML = '';
    const vars = step.vars || {};
    Object.keys(vars).forEach(k => {
      const span = document.createElement('span');
      span.innerHTML = `<b>${k}</b> = ${vars[k]}`;
      varsRow.appendChild(span);
    });
    btnPrev.disabled = cur === 0;
    btnNext.disabled = cur >= steps.length - 1;
  }

  function stopPlay() {
    if (playing) { clearInterval(playing); playing = null; btnPlay.textContent = '▶ Play'; }
  }

  function startPlay() {
    if (cur >= steps.length - 1) cur = 0;
    btnPlay.textContent = '⏸ Pause';
    playing = setInterval(() => {
      if (cur >= steps.length - 1) { stopPlay(); return; }
      cur++;
      render();
    }, intervalMs);
  }

  btnPrev.addEventListener('click', () => { stopPlay(); if (cur > 0) { cur--; render(); } });
  btnNext.addEventListener('click', () => { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  btnReset.addEventListener('click', () => { stopPlay(); cur = 0; render(); });
  btnPlay.addEventListener('click', () => {
    if (playing) { stopPlay(); return; }
    startPlay();
  });
  speedInput.addEventListener('input', () => {
    intervalMs = 2600 - Number(speedInput.value);
    if (playing) { stopPlay(); startPlay(); }
  });

  render();
  // Recompute pointer pixel positions after layout/fonts settle and on resize.
  window.addEventListener('resize', render);
  requestAnimationFrame(render);
}
