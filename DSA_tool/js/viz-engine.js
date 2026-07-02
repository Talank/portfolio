/*
Array/pointer step-through visualizer.
Consumes: { initialArray: [...], labelArray: optional [...] display labels,
            steps: [ { highlights: {idx:number -> 'a'|'b'|'c'|'bad'|'dim'},
                       pointers: {name:string -> idx:number},
                       vars: {name:string -> value},
                       message: string,
                       arrayOverride: optional [...] to redraw array (for DP tables / mutations) } ] }
Renders play/step/reset controls into a container element.
*/
function renderArrayViz(containerEl, viz) {
  const steps = viz.steps || [];
  let cur = 0;
  let playing = null;

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

  controls.append(btnReset, btnPrev, btnPlay, btnNext, msg, count);
  containerEl.append(stage, controls, varsRow);

  function mkBtn(label) {
    const b = document.createElement('button');
    b.textContent = label;
    return b;
  }

  function render() {
    const arr = (steps[cur] && steps[cur].arrayOverride) || viz.initialArray;
    const labels = viz.labelArray || arr;
    const step = steps[cur] || {};
    const highlights = step.highlights || {};
    const pointers = step.pointers || {};
    stage.innerHTML = '';
    const ptrsByIdx = {};
    Object.keys(pointers).forEach((name, i) => {
      const idx = pointers[name];
      if (idx === null || idx === undefined || idx < 0) return;
      (ptrsByIdx[idx] = ptrsByIdx[idx] || []).push({ name, i });
    });
    arr.forEach((val, idx) => {
      const cell = document.createElement('div');
      cell.className = 'viz-cell';
      const h = highlights[idx];
      if (h) cell.classList.add('hl-' + h);
      const idxTag = document.createElement('span');
      idxTag.className = 'idx';
      idxTag.textContent = idx;
      cell.appendChild(idxTag);
      cell.appendChild(document.createTextNode(labels[idx]));
      if (ptrsByIdx[idx]) {
        ptrsByIdx[idx].forEach((p, k) => {
          const tag = document.createElement('span');
          tag.className = 'ptr p' + ((p.i % 3) + 1);
          tag.style.bottom = (-1.6 - k * 1.15) + 'rem';
          tag.textContent = p.name;
          cell.appendChild(tag);
        });
      }
      stage.appendChild(cell);
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

  btnPrev.addEventListener('click', () => { stopPlay(); if (cur > 0) { cur--; render(); } });
  btnNext.addEventListener('click', () => { stopPlay(); if (cur < steps.length - 1) { cur++; render(); } });
  btnReset.addEventListener('click', () => { stopPlay(); cur = 0; render(); });
  btnPlay.addEventListener('click', () => {
    if (playing) { stopPlay(); return; }
    if (cur >= steps.length - 1) cur = 0;
    btnPlay.textContent = '⏸ Pause';
    playing = setInterval(() => {
      if (cur >= steps.length - 1) { stopPlay(); return; }
      cur++;
      render();
    }, 1100);
  });

  render();
}
