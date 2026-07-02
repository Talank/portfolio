/* Shared header, progress tracking (localStorage), and dashboard rendering. */

const PROGRESS_KEY = 'dsa-progress-v1';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function setComplete(id, done) {
  const p = getProgress();
  if (done) p[id] = true; else delete p[id];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function isComplete(id) {
  return !!getProgress()[id];
}

function progressStats() {
  const p = getProgress();
  const total = window.SCHEDULE.length;
  const done = window.SCHEDULE.filter(m => p[m.id]).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function buildHeader(active) {
  const el = document.getElementById('site-header');
  if (!el) return;
  const links = [
    ['index.html', 'Dashboard'],
    ['cheat-sheet.html', 'Cheat Sheet'],
    ['pythonic-idioms.html', 'Pythonic Idioms'],
    ['mock-interview.html', 'Mock Interview'],
  ];
  const nav = links.map(([href, label]) =>
    `<a href="${href}" class="${active === href ? 'active' : ''}">${label}</a>`
  ).join('');
  el.innerHTML = `
    <header class="site">
      <div class="bar">
        <a class="brand" href="index.html">DSA Crash <span>Course</span></a>
        <nav>${nav}</nav>
      </div>
    </header>`;
}

function timeLeftLabel(doneIds) {
  const remaining = window.SCHEDULE.filter(m => !doneIds.has(m.id)).reduce((s, m) => s + m.timeMin, 0);
  const h = Math.floor(remaining / 60);
  const m = remaining % 60;
  return remaining === 0 ? 'All modules complete' : `~${h ? h + 'h ' : ''}${m}m of study left`;
}

function renderDashboard() {
  const p = getProgress();
  const doneIds = new Set(Object.keys(p));
  const stats = progressStats();

  const barOuter = document.getElementById('overall-progress');
  if (barOuter) {
    barOuter.querySelector('.progress-inner').style.width = stats.pct + '%';
    document.getElementById('progress-label').textContent =
      `${stats.done} / ${stats.total} modules complete (${stats.pct}%) — ${timeLeftLabel(doneIds)}`;
  }

  const grouped = {};
  window.SCHEDULE.forEach(m => {
    (grouped[m.category] = grouped[m.category] || []).push(m);
  });

  const container = document.getElementById('module-groups');
  if (!container) return;
  container.innerHTML = '';
  Object.keys(grouped).forEach(cat => {
    const h = document.createElement('h2');
    h.textContent = cat;
    container.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'grid';
    grouped[cat].forEach(m => {
      const a = document.createElement('a');
      const href = m.href || `pattern.html?id=${m.id}`;
      a.href = href;
      a.className = 'module-card' + (doneIds.has(m.id) ? ' complete' : '');
      a.innerHTML = `<span class="mc-title">${m.title}</span><span class="mc-meta">${m.timeMin} min</span>`;
      grid.appendChild(a);
    });
    container.appendChild(grid);
  });
}
