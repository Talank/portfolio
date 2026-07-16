/* Terminal Lab engine (shell edition) — an in-browser exercise checked with
   instant, offline static checks: regex-based structural checks on what you
   typed ("did you actually quote the variable?", "no `grep | grep` allowed
   here — the point is one grep with the right flag") plus a shell-aware
   quote/bracket-balance lint.

   A real shell can't run inside the browser, and that's deliberate here:
   real reps happen in YOUR actual terminal — locally, or over the SSH
   connection this whole course is ultimately in service of. Every lab
   therefore includes a `run` recipe — exactly how to run what you wrote for
   real, in a terminal.

   Lab spec (lesson.lab):
     title      : string
     prompt     : HTML string — the task
     starter    : starter code shown in the editor
     checks     : [{re, flags, must, hint, pass}]  — must:true = pattern required,
                  must:false = pattern forbidden
     run        : HTML string — how to execute this for real locally
                  (e.g. "Paste into your terminal" or "Run over SSH on the box")
     solution   : reference solution (revealed on demand)
     notes      : [string] shown under the solution
   Editor content persists per-lesson in localStorage. */

(function () {
  'use strict';

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  function quoteBracketLint(code) {
    // Strip shell comments and quoted strings crudely, then check bracket/paren balance.
    const stripped = code
      .replace(/#.*$/gm, '')                                  // comments
      .replace(/"(?:\\.|[^"\\])*"/g, '')                      // double-quoted strings
      .replace(/'[^']*'/g, '');                                // single-quoted strings (no escapes in sh)
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    for (const ch of stripped) {
      if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
      else if (pairs[ch]) {
        if (stack.pop() !== pairs[ch]) return `Unbalanced bracket: found "${ch}" with no matching "${pairs[ch]}".`;
      }
    }
    if (stack.length) return `Unclosed "${stack[stack.length - 1]}" somewhere in your code.`;
    const dq = (code.match(/(?<!\\)"/g) || []).length;
    if (dq % 2 !== 0) return 'Unbalanced double quote (") — you have an odd number of them.';
    return null;
  }

  function runStaticChecks(code, checks) {
    const results = [];
    if (!code.trim()) {
      return [{ ok: false, msg: 'The editor is empty — write something first.' }];
    }
    const lint = quoteBracketLint(code);
    results.push(lint ? { ok: false, msg: lint } : { ok: true, msg: 'Quotes and brackets balanced.' });
    (checks || []).forEach(c => {
      const re = new RegExp(c.re, c.flags || '');
      const hit = re.test(code);
      const ok = c.must ? hit : !hit;
      results.push({ ok, msg: ok ? (c.pass || c.hint) : c.hint });
    });
    return results;
  }

  function renderCodeLab(container, lessonId, lab) {
    const storeKey = 'linux-lab-' + lessonId;
    container.innerHTML = '';
    const card = el('div', 'card lab-card');

    card.appendChild(el('h3', 'lab-title', lab.title || 'Exercise'));
    card.appendChild(el('div', 'lab-prompt', lab.prompt || ''));

    const editorWrap = el('div', 'lab-editor-wrap');
    const editor = document.createElement('textarea');
    editor.className = 'lab-editor';
    editor.spellcheck = false;
    editor.rows = Math.max(8, (lab.starter || '').split('\n').length + 3);
    editor.value = localStorage.getItem(storeKey) || lab.starter || '';
    editorWrap.appendChild(editor);
    card.appendChild(editorWrap);

    editor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart, epos = editor.selectionEnd;
        editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(epos);
        editor.selectionStart = editor.selectionEnd = s + 2;
      }
    });
    let saveTimer;
    editor.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => localStorage.setItem(storeKey, editor.value), 400);
    });

    const actions = el('div', 'actions lab-actions');
    const btnCheck = el('button', 'btn', '🔎 Check my code');
    const btnSolution = el('button', 'btn secondary', '👀 Show solution');
    const btnReset = el('button', 'btn secondary', '↺ Reset to starter');
    actions.appendChild(btnCheck);
    actions.appendChild(btnSolution);
    actions.appendChild(btnReset);
    card.appendChild(actions);

    card.appendChild(el('p', 'lab-local-note',
      '🖥️ A real shell doesn\'t run in the browser — the check above verifies the <i>structure</i> of what you typed instantly. ' +
      'For the real rep, run it for real: ' +
      (lab.run || 'paste it into your terminal.')));

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
        '</ul>' + (allOk ? '<p>Now run it for real in a terminal (see the 🖥️ note under the buttons) — the shell is the final judge.</p>' : ''),
        allOk ? 'lab-pass' : 'lab-fail'
      );
    });

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
