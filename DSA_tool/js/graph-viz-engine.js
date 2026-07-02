/*
Node-link (tree/graph/trie) step-through visualizer.
Consumes: { nodes: [{id, x, y, label}], edges: [{from, to}],
            steps: [ { visited: [ids], current: id, activeEdge: [from,to] or null,
                       vars: {name:value}, message: string } ] }
Coordinate space is a 400x300 viewBox; x/y are 0-400 / 0-300.
*/
function renderGraphViz(containerEl, viz) {
  const steps = viz.steps || [];
  let cur = 0;
  let playing = null;
  const NS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 300');
  svg.classList.add('graph-svg');

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

  containerEl.append(svg, controls, varsRow);

  function mkBtn(label) {
    const b = document.createElement('button');
    b.textContent = label;
    return b;
  }

  function nodeById(id) { return viz.nodes.find(n => n.id === id); }

  function render() {
    svg.innerHTML = '';
    const step = steps[cur] || {};
    const visited = new Set(step.visited || []);
    const active = step.activeEdge || null;

    (viz.edges || []).forEach(e => {
      const a = nodeById(e.from), b = nodeById(e.to);
      if (!a || !b) return;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.classList.add('edge');
      if (active && ((active[0] === e.from && active[1] === e.to) || (active[0] === e.to && active[1] === e.from))) {
        line.classList.add('active');
      }
      svg.appendChild(line);
    });

    (viz.nodes || []).forEach(n => {
      const g = document.createElementNS(NS, 'g');
      g.classList.add('node');
      if (visited.has(n.id)) g.classList.add('visited');
      if (step.current === n.id) g.classList.add('current');
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y); circle.setAttribute('r', 16);
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', n.x); text.setAttribute('y', n.y);
      text.textContent = n.label !== undefined ? n.label : n.id;
      g.append(circle, text);
      svg.appendChild(g);
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
