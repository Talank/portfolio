/* Code Lab engine — an in-browser coding exercise with two levels of checking:

   1. Static checks (always available, instant, offline): regex-based structural
      checks on your code ("did you actually use a dot product?", "no sklearn
      allowed here") plus bracket-balance linting.
   2. Real execution (optional, needs internet once): loads Pyodide — CPython
      compiled to WebAssembly, served from the jsDelivr CDN (~10 MB, cached by
      the browser after the first load) — and runs your code plus the lesson's
      hidden asserts in a real Python interpreter, in your browser. No server,
      nothing leaves your machine. numpy is auto-loaded when your code imports it.

   Lab spec (lesson.lab):
     title      : string
     prompt     : HTML string — the task
     starter    : starter code shown in the editor
     checks     : [{re, flags, must, hint}]  — must:true = pattern required,
                  must:false = pattern forbidden
     tests      : python source appended after the user's code; use plain
                  `assert cond, "message"` lines. Omit for read/static-only labs.
     runnable   : set false for labs that need torch/sklearn/network — the Run
                  button is replaced by a "run this locally" note.
     solution   : reference solution (revealed on demand)
     notes      : [string] shown under the solution
   Editor content persists per-lesson in localStorage. */

(function () {
  'use strict';

  const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
  let pyodidePromise = null;

  function loadPyodideOnce(statusCb) {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = new Promise((resolve, reject) => {
      statusCb('Loading Python (Pyodide, ~10 MB, first time only)…');
      const s = document.createElement('script');
      s.src = PYODIDE_URL;
      s.onload = async () => {
        try {
          const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
          resolve(py);
        } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error('Could not fetch Pyodide — are you online? Static checks still work offline.'));
      document.body.appendChild(s);
    }).catch(e => { pyodidePromise = null; throw e; });
    return pyodidePromise;
  }

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  function bracketLint(code) {
    // Strip strings/comments crudely, then check bracket balance.
    const stripped = code
      .replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, '')
      .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '')
      .replace(/#.*$/gm, '');
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    for (const ch of stripped) {
      if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
      else if (pairs[ch]) {
        if (stack.pop() !== pairs[ch]) return `Unbalanced bracket: found "${ch}" with no matching "${pairs[ch]}".`;
      }
    }
    if (stack.length) return `Unclosed "${stack[stack.length - 1]}" somewhere in your code.`;
    return null;
  }

  function runStaticChecks(code, checks) {
    const results = [];
    if (!code.trim()) {
      return [{ ok: false, msg: 'The editor is empty — write some code first.' }];
    }
    const lint = bracketLint(code);
    results.push(lint ? { ok: false, msg: lint } : { ok: true, msg: 'Brackets balanced.' });
    (checks || []).forEach(c => {
      const re = new RegExp(c.re, c.flags || '');
      const hit = re.test(code);
      const ok = c.must ? hit : !hit;
      results.push({ ok, msg: ok ? (c.pass || c.hint) : c.hint });
    });
    return results;
  }

  function renderCodeLab(container, lessonId, lab) {
    const storeKey = 'ai-lab-' + lessonId;
    container.innerHTML = '';
    const card = el('div', 'card lab-card');

    card.appendChild(el('h3', 'lab-title', lab.title || 'Exercise'));
    card.appendChild(el('div', 'lab-prompt', lab.prompt || ''));

    const editorWrap = el('div', 'lab-editor-wrap');
    const editor = document.createElement('textarea');
    editor.className = 'lab-editor';
    editor.spellcheck = false;
    editor.rows = Math.max(10, (lab.starter || '').split('\n').length + 3);
    editor.value = localStorage.getItem(storeKey) || lab.starter || '';
    editorWrap.appendChild(editor);
    card.appendChild(editorWrap);

    editor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart, epos = editor.selectionEnd;
        editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(epos);
        editor.selectionStart = editor.selectionEnd = s + 4;
      }
    });
    let saveTimer;
    editor.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => localStorage.setItem(storeKey, editor.value), 400);
    });

    const actions = el('div', 'actions lab-actions');
    const btnCheck = el('button', 'btn', '🔎 Static check');
    const btnRun = el('button', 'btn', '▶ Run tests (Python in your browser)');
    const btnSolution = el('button', 'btn secondary', '👀 Show solution');
    const btnReset = el('button', 'btn secondary', '↺ Reset to starter');
    actions.appendChild(btnCheck);
    const runnable = lab.runnable !== false && !!lab.tests;
    if (runnable) actions.appendChild(btnRun);
    actions.appendChild(btnSolution);
    actions.appendChild(btnReset);
    card.appendChild(actions);

    if (!runnable && lab.tests !== undefined) {
      card.appendChild(el('p', 'lab-local-note',
        '⚠ This lab needs packages that can\'t run inside a browser (e.g. torch / sklearn / network access). Use the static check here, then run it for real in your own terminal: <code>python3 lab.py</code>.'));
    } else if (!lab.tests) {
      card.appendChild(el('p', 'lab-local-note',
        'This lab is checked statically (structure of your code). For full reps, also run it in your own terminal.'));
    }

    const out = el('div', 'lab-output');
    out.style.display = 'none';
    card.appendChild(out);

    const solutionBox = el('div', 'lab-solution');
    solutionBox.style.display = 'none';
    solutionBox.innerHTML = `<div class="label">Reference solution</div><pre><code>${(lab.solution || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</code></pre>` +
      ((lab.notes || []).length ? `<ul>${lab.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : '');
    card.appendChild(solutionBox);

    function show(html, cls) {
      out.style.display = 'block';
      out.className = 'lab-output' + (cls ? ' ' + cls : '');
      out.innerHTML = html;
    }

    btnCheck.addEventListener('click', () => {
      const results = runStaticChecks(editor.value, lab.checks);
      const allOk = results.every(r => r.ok);
      show(
        `<b>${allOk ? '✓ All structural checks pass.' : '✗ Some checks failed:'}</b><ul>` +
        results.map(r => `<li class="${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'} ${r.msg}</li>`).join('') +
        '</ul>' + (allOk && runnable ? '<p>Now hit <b>Run tests</b> to execute it for real.</p>' : ''),
        allOk ? 'lab-pass' : 'lab-fail'
      );
    });

    if (runnable) {
      btnRun.addEventListener('click', async () => {
        btnRun.disabled = true;
        try {
          const py = await loadPyodideOnce(msg => show(msg));
          show('Running…');
          let stdout = '';
          py.setStdout({ batched: s => { stdout += s + '\n'; } });
          py.setStderr({ batched: s => { stdout += s + '\n'; } });
          const full = editor.value + '\n\n# ---- lesson tests ----\n' + lab.tests +
            '\nprint("__ALL_TESTS_PASSED__")';
          try {
            await py.loadPackagesFromImports(full);
            const ns = py.globals.get('dict')();
            await py.runPythonAsync(full, { globals: ns });
            ns.destroy();
            const clean = stdout.replace('__ALL_TESTS_PASSED__', '').trim();
            show(`<b>✓ All tests passed!</b>${clean ? `<pre>${clean.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>` : ''}<p>Nice — mark the lesson complete when the concept feels solid, not just the tests green.</p>`, 'lab-pass');
          } catch (err) {
            const msg = String(err.message || err);
            // Surface the assert message / traceback tail, not pyodide internals.
            const tail = msg.split('\n').filter(l => l.trim()).slice(-3).join('\n');
            show(`<b>✗ Not yet:</b><pre>${tail.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>${stdout.trim() ? `<div class="label">Your output</div><pre>${stdout.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>` : ''}`, 'lab-fail');
          }
        } catch (e) {
          show(`<b>Could not start Python:</b> ${e.message}`, 'lab-fail');
        } finally {
          btnRun.disabled = false;
        }
      });
    }

    btnSolution.addEventListener('click', () => {
      const showing = solutionBox.style.display !== 'none';
      solutionBox.style.display = showing ? 'none' : 'block';
      btnSolution.innerHTML = showing ? '👀 Show solution' : '🙈 Hide solution';
    });

    btnReset.addEventListener('click', () => {
      if (editor.value !== (lab.starter || '') && !confirm('Replace your code with the starter code?')) return;
      editor.value = lab.starter || '';
      localStorage.setItem(storeKey, editor.value);
    });

    container.appendChild(card);
  }

  window.renderCodeLab = renderCodeLab;
})();
