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
  syncModuleToCloud(id, done);
}

function isComplete(id) {
  return !!getProgress()[id];
}

/* Cloud sync is purely additive: localStorage above is the instant, always-
   available source of truth (works fully signed-out, forever). These
   functions are no-ops whenever there's no signed-in session, so nothing
   here ever gates using the site — it only adds cross-device persistence
   for users who opt into signing in. */
async function syncModuleToCloud(id, done) {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  try {
    await sb.from('dsa_progress').upsert({
      user_id: session.user.id,
      module_id: id,
      completed: !!done,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('dsa_progress sync failed (offline?)', e);
  }
}

async function pullAndMergeProgress() {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  const { data, error } = await sb.from('dsa_progress').select('module_id, completed').eq('completed', true);
  if (error) {
    console.warn('dsa_progress pull failed (offline?)', error);
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
  // Push local-only completions up too, so both sides converge to the union.
  Object.keys(local).forEach(id => {
    if (!cloud.find(row => row.module_id === id)) syncModuleToCloud(id, true);
  });
  window.dispatchEvent(new CustomEvent('dsa:progress-synced'));
}

/* Per-module free-text notes. Same local-first shape as progress above:
   localStorage is authoritative and works fully signed-out; cloud sync is
   opt-in and additive. Unlike progress (a boolean union), a note can be
   edited on two devices, so merging picks whichever side has the newer
   updated_at timestamp instead of unioning. */
const NOTES_KEY = 'dsa-notes-v1';

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
    await sb.from('dsa_notes').upsert({
      user_id: session.user.id,
      module_id: id,
      note: text,
      updated_at,
    });
  } catch (e) {
    console.warn('dsa_notes sync failed (offline?)', e);
  }
}

async function pullAndMergeNotes() {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  const { data, error } = await sb.from('dsa_notes').select('module_id, note, updated_at');
  if (error) {
    console.warn('dsa_notes pull failed (offline?)', error);
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
  // Push local notes that are newer than (or missing from) the cloud copy.
  Object.keys(local).forEach(id => {
    const cloudRow = cloud.find(row => row.module_id === id);
    if (!cloudRow || new Date(local[id].updated_at) > new Date(cloudRow.updated_at)) {
      syncNoteToCloud(id, local[id].text, local[id].updated_at);
    }
  });
  window.dispatchEvent(new CustomEvent('dsa:notes-synced'));
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
    ['episodes.html', 'One Piece Episodes'],
    ['presentation.html', 'Presentation'],
  ];
  const nav = links.map(([href, label]) =>
    `<a href="${href}" class="${active === href ? 'active' : ''}">${label}</a>`
  ).join('');
  el.innerHTML = `
    <header class="site">
      <div class="bar">
        <a class="brand" href="index.html">DSA Crash <span>Course</span></a>
        <nav>${nav}</nav>
        <div id="auth-widget" class="header-auth"></div>
      </div>
    </header>`;

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
