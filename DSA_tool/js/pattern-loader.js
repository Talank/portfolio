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
  const storyHtml = renderStorySection(data.story);
  const tricksHtml = renderTricksSection(data.tricks);

  root.innerHTML = `
    <div class="pill">${data.category}</div>
    <div class="pill time">${data.timeMin} min</div>
    <h1>${data.title}</h1>
    <p class="lede">${data.summary}</p>

    <h2>Concept</h2>
    ${conceptHtml}

    ${storyHtml}

    <h2>How to recognize it</h2>
    <ul class="signals">${signalsHtml}</ul>

    <div class="card"><b>Complexity:</b> ${data.complexity}</div>

    <h2>Canonical problem: ${data.canonical.name}</h2>
    <p>${data.canonical.statement}</p>

    <div class="viz-box" id="viz-container"></div>

    ${tricksHtml}

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

/*
Story Mode: a One Piece anecdote and a history anecdote, each hand-picked to
mirror the pattern's actual mechanism (not just a vibe), plus a one-line note
on why anchoring an algorithm to a story/character helps it stick (elaborative
encoding — the more retrieval cues an idea is wired to, the easier it is to
pull back out under interview pressure). Rendered as collapsible <details> so
they're there when useful and out of the way during a fast review pass.
*/
function renderStorySection(story) {
  if (!story) return '';
  const asParas = t => (Array.isArray(t) ? t : [t]).map(p => `<p>${p}</p>`).join('');
  const blocks = [];
  if (story.onePiece) {
    blocks.push(`
      <details class="story story-onepiece">
        <summary><span class="caret">▸</span> One Piece anecdote: ${story.onePiece.title} <span class="badge">Story</span></summary>
        <div class="story-body">${asParas(story.onePiece.text)}</div>
      </details>`);
  }
  if (story.history) {
    blocks.push(`
      <details class="story story-history">
        <summary><span class="caret">▸</span> History anecdote: ${story.history.title} <span class="badge">Story</span></summary>
        <div class="story-body">${asParas(story.history.text)}</div>
      </details>`);
  }
  if (!blocks.length) return '';
  const why = story.why ? `<div class="story-why"><b>Why this sticks:</b> ${story.why}</div>` : '';
  return `<h2>Story Mode</h2>${blocks.join('')}${why}`;
}

/*
Tricks & worked examples: the pythonic-idioms.html treatment (a concrete
before/after code pair, not just prose) applied to each pattern's own
technique-level tricks, distinct from the higher-level company variants.
*/
function renderTricksSection(tricks) {
  if (!tricks || !tricks.length) return '';
  const items = tricks.map(t => {
    const codeRow = t.before
      ? `<div class="trick-code-row">
          <div class="code-col before"><div class="label">✗ Naive / buggy</div><pre><code>${escapeHtml(t.before)}</code></pre></div>
          <div class="code-col after"><div class="label">✓ Idiomatic</div><pre><code>${escapeHtml(t.after)}</code></pre></div>
        </div>`
      : `<pre><code>${escapeHtml(t.after)}</code></pre>`;
    return `
      <div class="trick">
        <h4>${t.name}</h4>
        <p class="trick-idea">${t.idea}</p>
        ${codeRow}
        <p class="trick-explain">${t.explain}</p>
      </div>`;
  }).join('');
  return `<h2>Tricks &amp; worked examples</h2>${items}`;
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
