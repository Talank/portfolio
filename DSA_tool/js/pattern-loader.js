/* Loads data/patterns/<id>.js based on ?id=... and populates pattern.html. */

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function loadPattern() {
  const id = qs('id');
  const root = document.getElementById('pattern-root');
  if (!id) {
    root.innerHTML = '<p>No pattern id given. <a href="index.html">Back to dashboard</a>.</p>';
    return;
  }
  const script = document.createElement('script');
  script.src = `data/patterns/${id}.js`;
  script.onload = () => renderPattern(id);
  script.onerror = () => {
    root.innerHTML = `<p>Could not load pattern "${id}". <a href="index.html">Back to dashboard</a>.</p>`;
  };
  document.body.appendChild(script);
}

function renderPattern(id) {
  const data = (window.PATTERNS || {})[id];
  const root = document.getElementById('pattern-root');
  if (!data) {
    root.innerHTML = `<p>Pattern "${id}" not found. <a href="index.html">Back to dashboard</a>.</p>`;
    return;
  }

  document.title = `${data.title} — DSA Crash Course`;

  const conceptHtml = data.concept.map(p => `<p>${p}</p>`).join('');
  const signalsHtml = data.recognitionSignals.map(s => `<li>${s}</li>`).join('');
  const pitfallsHtml = (data.pitfalls || []).map(p => `<div class="callout pitfall">${p}</div>`).join('');
  const variantsHtml = (data.variants || []).map(v => `
    <div class="callout variant">
      <div class="company">${v.company}</div>
      <div><b>${v.title}</b></div>
      <p style="margin:0.4rem 0 0;">${v.twist}</p>
    </div>`).join('');
  const notesHtml = (data.pythonSolution.notes || []).map(n => `<li>${n}</li>`).join('');

  root.innerHTML = `
    <div class="pill">${data.category}</div>
    <div class="pill time">${data.timeMin} min</div>
    <h1>${data.title}</h1>
    <p class="lede">${data.summary}</p>

    <h2>Concept</h2>
    ${conceptHtml}

    <h2>How to recognize it</h2>
    <ul class="signals">${signalsHtml}</ul>

    <div class="card"><b>Complexity:</b> ${data.complexity}</div>

    <h2>Canonical problem: ${data.canonical.name}</h2>
    <p>${data.canonical.statement}</p>

    <div class="viz-box" id="viz-container"></div>

    <h2>Interview variants — how companies twist this</h2>
    ${variantsHtml}

    <h2>Pythonic solution</h2>
    <pre><code>${escapeHtml(data.pythonSolution.code)}</code></pre>
    <ul>${notesHtml}</ul>

    <h2>Pitfalls</h2>
    ${pitfallsHtml}

    <h2>Quiz</h2>
    <div id="quiz-container"></div>

    <label class="checkbox-row">
      <input type="checkbox" id="complete-check">
      Mark "${data.title}" as complete
    </label>
  `;

  if (data.viz.type === 'graph') {
    renderGraphViz(document.getElementById('viz-container'), data.viz);
  } else {
    renderArrayViz(document.getElementById('viz-container'), data.viz);
  }

  renderQuiz(document.getElementById('quiz-container'), data.quiz);

  const check = document.getElementById('complete-check');
  check.checked = isComplete(id);
  check.addEventListener('change', () => setComplete(id, check.checked));

  renderPatternNav(id);
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function renderPatternNav(id) {
  const patterns = window.SCHEDULE.filter(m => m.type === 'pattern');
  const idx = patterns.findIndex(m => m.id === id);
  const nav = document.getElementById('pattern-footer-nav');
  if (!nav || idx === -1) return;
  const prev = idx === 0 ? { title: '← Pythonic Idioms Warm-up', href: 'pythonic-idioms.html' }
    : { title: `← ${patterns[idx - 1].title}`, href: `pattern.html?id=${patterns[idx - 1].id}` };
  const next = idx === patterns.length - 1 ? { title: 'Mock Interview →', href: 'mock-interview.html' }
    : { title: `${patterns[idx + 1].title} →`, href: `pattern.html?id=${patterns[idx + 1].id}` };
  nav.innerHTML = `<a href="${prev.href}">${prev.title}</a><a href="${next.href}">${next.title}</a>`;
}

document.addEventListener('DOMContentLoaded', loadPattern);
