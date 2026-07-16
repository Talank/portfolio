/* Shared header, progress tracking (localStorage), depth-mode toggle, and
   dashboard rendering for the Linux Course. Same local-first design as
   full_stack_java: localStorage is the always-available source of truth;
   Supabase sync is optional and additive for signed-in users (tables
   linux_progress / linux_notes). */

const PROGRESS_KEY = 'linux-progress-v1';

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
  syncModuleToCloud(id, done);
}

function isComplete(id) {
  return !!getProgress()[id];
}

async function syncModuleToCloud(id, done) {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  try {
    await sb.from('linux_progress').upsert({
      user_id: session.user.id,
      module_id: id,
      completed: !!done,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('linux_progress sync failed (offline or table missing?)', e);
  }
}

async function pullAndMergeProgress() {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  const { data, error } = await sb.from('linux_progress').select('module_id, completed').eq('completed', true);
  if (error) {
    console.warn('linux_progress pull failed (offline or table missing?)', error);
    return;
  }
  const cloud = data || [];
  const local = getProgress();
  let changed = false;
  cloud.forEach(row => {
    if (!local[row.module_id]) {
      local[row.module_id] = true;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(PROGRESS_KEY, JSON.stringify(local));
  Object.keys(local).forEach(id => {
    if (!cloud.find(row => row.module_id === id)) syncModuleToCloud(id, true);
  });
  window.dispatchEvent(new CustomEvent('linux:progress-synced'));
}

/* Per-lesson free-text notes — newer updated_at wins on merge. */
const NOTES_KEY = 'linux-notes-v1';

function getNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function getNote(id) {
  const n = getNotes()[id];
  return n ? n.text : '';
}

function setNote(id, text) {
  const notes = getNotes();
  const updated_at = new Date().toISOString();
  if (text) notes[id] = { text, updated_at }; else delete notes[id];
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  syncNoteToCloud(id, text, updated_at);
}

async function syncNoteToCloud(id, text, updated_at) {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  try {
    await sb.from('linux_notes').upsert({
      user_id: session.user.id,
      module_id: id,
      note: text,
      updated_at,
    });
  } catch (e) {
    console.warn('linux_notes sync failed (offline or table missing?)', e);
  }
}

async function pullAndMergeNotes() {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  const { data, error } = await sb.from('linux_notes').select('module_id, note, updated_at');
  if (error) {
    console.warn('linux_notes pull failed (offline or table missing?)', error);
    return;
  }
  const cloud = data || [];
  const local = getNotes();
  let changed = false;
  cloud.forEach(row => {
    const existing = local[row.module_id];
    if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
      local[row.module_id] = { text: row.note, updated_at: row.updated_at };
      changed = true;
    }
  });
  if (changed) localStorage.setItem(NOTES_KEY, JSON.stringify(local));
  Object.keys(local).forEach(id => {
    const cloudRow = cloud.find(row => row.module_id === id);
    if (!cloudRow || new Date(local[id].updated_at) > new Date(cloudRow.updated_at)) {
      syncNoteToCloud(id, local[id].text, local[id].updated_at);
    }
  });
  window.dispatchEvent(new CustomEvent('linux:notes-synced'));
}

/* ── Depth mode ─────────────────────────────────────────────────────────
   Every lesson teaches essentials by default. Lessons that have an optional
   `deepDive` section can be expanded into full depth via one site-wide
   switch, persisted locally, so "how deep do I want to go" is a single
   decision instead of a per-lesson click every time. */
const DEPTH_KEY = 'linux-depth-v1';

function getDepthMode() {
  return localStorage.getItem(DEPTH_KEY) === 'full' ? 'full' : 'essentials';
}

function setDepthMode(mode) {
  localStorage.setItem(DEPTH_KEY, mode === 'full' ? 'full' : 'essentials');
  window.dispatchEvent(new CustomEvent('linux:depth-changed', { detail: { mode: getDepthMode() } }));
}

function mountDepthToggle(container) {
  if (!container) return;
  const mode = getDepthMode();
  container.innerHTML = `
    <button type="button" class="depth-toggle ${mode}" id="depth-toggle-btn"
      title="Essentials teaches exactly what you need. Full Depth adds the deeper 'why' and edge cases to every lesson that has one.">
      <span class="depth-opt ${mode === 'essentials' ? 'active' : ''}" data-mode="essentials">Essentials</span>
      <span class="depth-opt ${mode === 'full' ? 'active' : ''}" data-mode="full">Full Depth</span>
    </button>`;
  container.querySelector('#depth-toggle-btn').addEventListener('click', () => {
    setDepthMode(getDepthMode() === 'full' ? 'essentials' : 'full');
    mountDepthToggle(container);
  });
}

function buildHeader(active) {
  const el = document.getElementById('site-header');
  if (!el) return;
  const links = [
    ['index.html', 'Dashboard'],
    ['cheat-sheet.html', 'Cheat Sheet'],
    ['interview.html', 'Interview Drill'],
  ];
  const nav = links.map(([href, label]) =>
    `<a href="${href}" class="${active === href ? 'active' : ''}">${label}</a>`
  ).join('');
  el.innerHTML = `
    <header class="site">
      <div class="bar">
        <a class="brand" href="index.html">Linux <span>Course</span></a>
        <nav>${nav}</nav>
        <div id="depth-toggle-mount"></div>
        <div id="auth-widget" class="header-auth"></div>
      </div>
    </header>`;

  mountDepthToggle(document.getElementById('depth-toggle-mount'));

  if (window.AuthUI) {
    AuthUI.mount('auth-widget');
    AuthUI.onChange(session => {
      if (session) {
        pullAndMergeProgress();
        pullAndMergeNotes();
      }
    });
  }
}

function timeLeftLabel(doneIds) {
  const remaining = window.SCHEDULE.filter(m => !doneIds.has(m.id)).reduce((s, m) => s + m.timeMin, 0);
  const h = Math.floor(remaining / 60);
  const m = remaining % 60;
  return remaining === 0 ? 'All modules complete — you can SSH into anything now' : `~${h ? h + 'h ' : ''}${m}m of study left`;
}

function renderDashboard() {
  const p = getProgress();
  const doneIds = new Set(Object.keys(p));
  const total = window.SCHEDULE.length;
  const done = window.SCHEDULE.filter(m => p[m.id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const barOuter = document.getElementById('overall-progress');
  if (barOuter) {
    barOuter.querySelector('.progress-inner').style.width = pct + '%';
    document.getElementById('progress-label').textContent =
      `${done} / ${total} modules complete (${pct}%) — ${timeLeftLabel(doneIds)}`;
  }

  const grouped = {};
  window.SCHEDULE.forEach(m => {
    (grouped[m.category] = grouped[m.category] || []).push(m);
  });

  const container = document.getElementById('module-groups');
  if (!container) return;
  container.innerHTML = '';
  const colors = window.CATEGORY_COLORS || {};
  Object.keys(grouped).forEach(cat => {
    const h = document.createElement('h2');
    h.textContent = cat;
    if (colors[cat]) h.style.color = colors[cat];
    container.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'grid';
    grouped[cat].forEach(m => {
      const a = document.createElement('a');
      const href = m.href || `lesson.html?id=${m.id}`;
      a.href = href;
      a.className = 'module-card' + (doneIds.has(m.id) ? ' complete' : '');
      if (colors[cat]) a.style.setProperty('--cat-color', colors[cat]);
      a.innerHTML = `<span class="mc-title">${m.title}</span><span class="mc-meta">${m.timeMin} min</span>`;
      grid.appendChild(a);
    });
    container.appendChild(grid);
  });
}
