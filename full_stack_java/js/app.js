/* Shared header, progress tracking (localStorage), and dashboard rendering
   for the Full-Stack Java Course. Same local-first design as DSA_tool: localStorage
   is the always-available source of truth; Supabase sync is optional and
   additive for signed-in users (tables java_progress / java_notes). */

const PROGRESS_KEY = 'java-progress-v1';

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
    await sb.from('java_progress').upsert({
      user_id: session.user.id,
      module_id: id,
      completed: !!done,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('java_progress sync failed (offline or table missing?)', e);
  }
}

async function pullAndMergeProgress() {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  const { data, error } = await sb.from('java_progress').select('module_id, completed').eq('completed', true);
  if (error) {
    console.warn('java_progress pull failed (offline or table missing?)', error);
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
  window.dispatchEvent(new CustomEvent('java:progress-synced'));
}

/* Per-lesson free-text notes — newer updated_at wins on merge. */
const NOTES_KEY = 'java-notes-v1';

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
    await sb.from('java_notes').upsert({
      user_id: session.user.id,
      module_id: id,
      note: text,
      updated_at,
    });
  } catch (e) {
    console.warn('java_notes sync failed (offline or table missing?)', e);
  }
}

async function pullAndMergeNotes() {
  if (!window.AuthUI) return;
  const session = await AuthUI.getSession();
  if (!session) return;
  const { data, error } = await sb.from('java_notes').select('module_id, note, updated_at');
  if (error) {
    console.warn('java_notes pull failed (offline or table missing?)', error);
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
  window.dispatchEvent(new CustomEvent('java:notes-synced'));
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
    ['interview.html', 'Interview Drill'],
  ];
  const nav = links.map(([href, label]) =>
    `<a href="${href}" class="${active === href ? 'active' : ''}">${label}</a>`
  ).join('');
  el.innerHTML = `
    <header class="site">
      <div class="bar">
        <a class="brand" href="index.html">Full-Stack Java <span>Course</span></a>
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
  return remaining === 0 ? 'All modules complete — go get that job' : `~${h ? h + 'h ' : ''}${m}m of study left`;
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
      const href = m.href || `lesson.html?id=${m.id}`;
      a.href = href;
      a.className = 'module-card' + (doneIds.has(m.id) ? ' complete' : '');
      a.innerHTML = `<span class="mc-title">${m.title}</span><span class="mc-meta">${m.timeMin} min</span>`;
      grid.appendChild(a);
    });
    container.appendChild(grid);
  });
}
