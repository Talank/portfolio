/* Loads data/lessons/<id>.js based on ?id=... and populates lesson.html.

Lesson schema (window.LESSONS[id]):
  id, title, category, timeMin, summary
  goals      : [string]                          — "after this you can…" bullets
  concept    : [{h, p: [htmlString], code}]      — ESSENTIALS sections, always shown;
               a p entry starting with '<div'/'<pre'/'<ul'/'<ol'/'<table' is inserted raw
  deepDive   : { timeMin, intro, sections: [{h, p, code}] }  — OPTIONAL. Same shape as
               concept, but gated behind the site-wide Essentials/Full-Depth switch
               (js/app.js getDepthMode/mountDepthToggle). Essentials mode shows a locked
               teaser card instead of the content; Full Depth renders it in place.
  story      : { onePiece: {title, text[]}, sitcom: {show, title, text[]}, why }
  storyAnim  : story-anim-engine scene           — optional, mounted inside the One Piece story
  conceptFlow: concept-flow-engine scene         — optional, an interactive click-through
               pipeline diagram teaching the technical mechanism (distinct from storyAnim's
               narrative scene); see js/concept-flow-engine.js for the schema
  episode    : episode-engine scene (props/ledger/steps with speaker dialogue)
               — optional, a full voiced + scored scene, mounted in its own section
  tech       : [{q, a}]                          — "Technicality corner": why this command/
               keybinding/mechanism exists, what's under the hood
  code       : {title, intro, code, notes[]}     — worked example to read (usually an
               *scratch* buffer / init.el transcript or a keybinding sequence)
  lab        : code-lab-engine spec              — in-browser editor + checkers (see engine)
  quiz       : [{q, options[], correct, explain}]
  testFlow   : test-flow-engine scene            — optional, an interactive branching
               "test yourself" decision tree, distinct from the quiz above; see
               js/test-flow-engine.js for the schema
  pitfalls   : [string]
  interview  : [{q, a}]                          — real interview questions + strong answers
*/

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const RAW_PREFIXES = ['<div', '<pre', '<ul', '<ol', '<table', '<blockquote'];
function para(entry) {
  const t = entry.trimStart();
  return RAW_PREFIXES.some(p => t.startsWith(p)) ? entry : `<p>${entry}</p>`;
}

function renderSections(sections) {
  return (sections || []).map(sec => `
    ${sec.h ? `<h3>${sec.h}</h3>` : ''}
    ${(sec.p || []).map(para).join('')}
    ${sec.code ? `<pre><code>${escapeHtml(sec.code)}</code></pre>` : ''}
  `).join('');
}

function loadLesson() {
  const id = qs('id');
  const root = document.getElementById('lesson-root');
  if (!id) {
    root.innerHTML = '<p>No lesson id given. <a href="index.html">Back to dashboard</a>.</p>';
    return;
  }
  const script = document.createElement('script');
  script.src = `data/lessons/${id}.js`;
  script.onload = () => renderLesson(id);
  script.onerror = () => {
    root.innerHTML = `<p>Could not load lesson "${id}". <a href="index.html">Back to dashboard</a>.</p>`;
  };
  document.body.appendChild(script);
}

function renderLesson(id) {
  const data = (window.LESSONS || {})[id];
  const root = document.getElementById('lesson-root');
  if (!data) {
    root.innerHTML = `<p>Lesson "${id}" not found. <a href="index.html">Back to dashboard</a>.</p>`;
    return;
  }

  document.title = `${data.title} — Emacs Course`;

  const catColor = (window.CATEGORY_COLORS || {})[data.category];

  const goalsHtml = (data.goals || []).length ? `
    <div class="card goals-card">
      <b>After this lesson you can:</b>
      <ul class="signals">${data.goals.map(g => `<li>${g}</li>`).join('')}</ul>
    </div>` : '';

  const conceptHtml = (data.concept || []).map(sec => `
    ${sec.h ? `<h2>${sec.h}</h2>` : ''}
    ${(sec.p || []).map(para).join('')}
    ${sec.code ? `<pre><code>${escapeHtml(sec.code)}</code></pre>` : ''}
  `).join('');

  const storyHtml = renderStorySection(data, id);
  const conceptFlowHtml = data.conceptFlow ? `
    <h2>How it actually works — interactive walkthrough</h2>
    <p class="lede" style="font-size:0.92rem;">Click any box to jump straight to it, or hit Play and listen — the mechanism, not another paragraph to read.</p>
    <div id="concept-flow-container"></div>` : '';
  const episodeHtml = data.episode ? `
    <h2>Animated Episode</h2>
    <details class="story story-onepiece" id="episode-details" open>
      <summary><span class="caret">▸</span> 🏴‍☠️ ${data.episode.title || 'Watch the crew act it out'} <span class="badge">Voiced episode</span></summary>
      <div class="story-body">
        <div id="episode-scene"></div>
        <p style="color:var(--text-dim); font-size:0.8rem; margin-top:0.4rem;">
          Music and sound effects are generated live in your browser (Web Audio API) — original
          compositions, nothing sourced from any show. Click "Play episode" to start (browsers
          require a click before audio can play).
        </p>
      </div>
    </details>` : '';

  const techHtml = (data.tech || []).length ? `
    <h2>Technicality corner — what's actually going on</h2>
    <p class="lede" style="font-size:0.92rem;">The questions you'd be embarrassed to ask out loud, answered properly: why the keybinding/command exists, what it really does, where the mechanism comes from.</p>
    ${data.tech.map(t => `
      <details class="tech">
        <summary><span class="caret">▸</span> ${t.q}</summary>
        <div class="tech-body">${(Array.isArray(t.a) ? t.a : [t.a]).map(para).join('')}</div>
      </details>`).join('')}` : '';

  const codeHtml = data.code ? `
    <h2>${data.code.title || 'Worked example'}</h2>
    ${data.code.intro ? `<p>${data.code.intro}</p>` : ''}
    <pre><code>${escapeHtml(data.code.code)}</code></pre>
    ${(data.code.notes || []).length ? `<ul>${data.code.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}` : '';

  const pitfallsHtml = (data.pitfalls || []).length ? `
    <h2>Pitfalls</h2>
    ${data.pitfalls.map(p => `<div class="callout pitfall">${p}</div>`).join('')}` : '';

  const interviewHtml = (data.interview || []).length ? `
    <h2>Interview questions on this topic</h2>
    <p class="lede" style="font-size:0.92rem;">Try answering out loud before opening each one — that's the rep that matters. These also feed the <a href="interview.html">timed drill</a>.</p>
    ${data.interview.map(iv => `
      <details class="tech interview-q">
        <summary><span class="caret">▸</span> ${iv.q}</summary>
        <div class="tech-body"><b>Strong answer:</b> ${(Array.isArray(iv.a) ? iv.a : [iv.a]).map(para).join('')}</div>
      </details>`).join('')}` : '';

  const testFlowHtml = data.testFlow ? `
    <h2>Test yourself — interactive</h2>
    <p class="lede" style="font-size:0.92rem;">A branching version of the quiz above: pick an answer, get real feedback, and if you're wrong you try that exact question again rather than just seeing the right answer.</p>
    <div id="test-flow-container"></div>` : '';

  const deepDiveHtml = data.deepDive ? `
    <h2>Go Deeper <span class="pill depth-pill">optional, +${data.deepDive.timeMin || 15} min</span></h2>
    <div id="deepdive-container"></div>` : '';

  root.innerHTML = `
    <div class="pill" ${catColor ? `style="color:${catColor}; border-color:${catColor}44;"` : ''}>${data.category}</div>
    <div class="pill time">${data.timeMin} min</div>
    <h1>${data.title}</h1>
    <p class="lede">${data.summary}</p>
    ${goalsHtml}
    ${conceptHtml}
    ${deepDiveHtml}
    ${storyHtml}
    ${conceptFlowHtml}
    ${episodeHtml}
    ${techHtml}
    ${codeHtml}
    ${data.lab ? '<h2>Manifest Lab — write the real config</h2><div id="lab-container"></div>' : ''}
    ${(data.quiz || []).length ? '<h2>Quiz</h2><div id="quiz-container"></div>' : ''}
    ${testFlowHtml}
    ${pitfallsHtml}
    ${interviewHtml}
    <label class="checkbox-row">
      <input type="checkbox" id="complete-check">
      Mark "${data.title}" as complete
    </label>
    <h2>My Notes</h2>
    <div class="card">
      <textarea id="module-notes" rows="5" style="width:100%; resize:vertical;" placeholder="Jot down anything worth remembering — saved automatically, synced across devices if you're signed in."></textarea>
    </div>
  `;

  // Mount the inline story animation inside the One Piece story details.
  if (data.storyAnim && window.renderStoryAnim) {
    const mount = root.querySelector('[data-lesson-anim]');
    if (mount) window.renderStoryAnim(mount, data.storyAnim);
  }

  if (data.conceptFlow && window.renderConceptFlow) {
    renderConceptFlow(document.getElementById('concept-flow-container'), data.conceptFlow);
  }

  if (data.testFlow && window.renderTestFlow) {
    renderTestFlow(document.getElementById('test-flow-container'), data.testFlow);
  }

  if (data.episode && window.renderEpisode) {
    renderEpisode(document.getElementById('episode-scene'), data.episode);
  }

  if (data.lab && window.renderCodeLab) {
    renderCodeLab(document.getElementById('lab-container'), id, data.lab);
  }

  if ((data.quiz || []).length) {
    renderQuiz(document.getElementById('quiz-container'), data.quiz);
  }

  if (data.deepDive) {
    renderDeepDive(document.getElementById('deepdive-container'), data.deepDive);
    window.addEventListener('cicd:depth-changed', () => {
      renderDeepDive(document.getElementById('deepdive-container'), data.deepDive);
    });
  }

  const check = document.getElementById('complete-check');
  check.checked = isComplete(id);
  check.addEventListener('change', () => setComplete(id, check.checked));
  window.addEventListener('cicd:progress-synced', () => { check.checked = isComplete(id); });

  const notes = document.getElementById('module-notes');
  notes.value = getNote(id);
  let notesTimer;
  notes.addEventListener('input', () => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => setNote(id, notes.value), 500);
  });
  window.addEventListener('cicd:notes-synced', () => {
    if (document.activeElement !== notes) notes.value = getNote(id);
  });

  renderLessonNav(id);
}

function renderDeepDive(container, deepDive) {
  if (!container) return;
  const mode = (typeof getDepthMode === 'function') ? getDepthMode() : 'essentials';
  if (mode === 'full') {
    container.innerHTML = `
      <div class="card deepdive-card open">
        ${deepDive.intro ? `<p class="lede">${deepDive.intro}</p>` : ''}
        ${renderSections(deepDive.sections)}
      </div>`;
  } else {
    container.innerHTML = `
      <div class="card deepdive-card locked">
        <p><b>🔒 Full Depth is off.</b> You've got everything you need to use this topic day to day. Flip the
        <b>Essentials / Full Depth</b> switch in the header if you want the deeper mechanism, edge cases, and
        "why it's actually built that way" behind this lesson.</p>
        <button type="button" class="btn secondary" id="deepdive-unlock-btn">Switch to Full Depth</button>
      </div>`;
    const btn = container.querySelector('#deepdive-unlock-btn');
    if (btn) btn.addEventListener('click', () => setDepthMode('full'));
  }
}

function renderStorySection(data, id) {
  const story = data.story;
  if (!story) return '';
  const asParas = t => (Array.isArray(t) ? t : [t]).map(p => `<p>${p}</p>`).join('');
  const blocks = [];
  if (story.onePiece) {
    blocks.push(`
      <details class="story story-onepiece" open>
        <summary><span class="caret">▸</span> One Piece anecdote: ${story.onePiece.title} <span class="badge">${data.storyAnim ? 'Animated story' : 'Story'}</span></summary>
        <div class="story-body">
          ${asParas(story.onePiece.text)}
          ${data.storyAnim ? '<div data-lesson-anim></div>' : ''}
        </div>
      </details>`);
  }
  if (story.sitcom) {
    blocks.push(`
      <details class="story story-history">
        <summary><span class="caret">▸</span> ${story.sitcom.show} anecdote: ${story.sitcom.title} <span class="badge">Story</span></summary>
        <div class="story-body">${asParas(story.sitcom.text)}</div>
      </details>`);
  }
  if (!blocks.length) return '';
  const why = story.why ? `<div class="story-why"><b>Why this sticks:</b> ${story.why}</div>` : '';
  return `<h2>Story Mode</h2>${blocks.join('')}${why}`;
}

function renderLessonNav(id) {
  const lessons = window.SCHEDULE.filter(m => m.type === 'lesson');
  const idx = lessons.findIndex(m => m.id === id);
  const nav = document.getElementById('lesson-footer-nav');
  if (!nav || idx === -1) return;
  const prev = idx === 0 ? { title: '← Dashboard', href: 'index.html' }
    : { title: `← ${lessons[idx - 1].title}`, href: `lesson.html?id=${lessons[idx - 1].id}` };
  const next = idx === lessons.length - 1 ? { title: 'Interview Drill →', href: 'interview.html' }
    : { title: `${lessons[idx + 1].title} →`, href: `lesson.html?id=${lessons[idx + 1].id}` };
  nav.innerHTML = `<a href="${prev.href}">${prev.title}</a><a href="${next.href}">${next.title}</a>`;
}

document.addEventListener('DOMContentLoaded', loadLesson);
