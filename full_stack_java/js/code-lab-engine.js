/* Code Lab engine (Java edition) — an in-browser coding exercise checked with
   instant, offline static checks: regex-based structural checks on your code
   ("did you actually override equals AND hashCode?", "no ArrayList allowed
   here — the point is LinkedHashMap") plus a Java-aware bracket-balance lint.

   Java can't (practically) run inside the browser the way Pyodide runs Python,
   and that's deliberate here: real reps happen in jshell / your editor / Maven.
   Every lab therefore includes a `run` recipe — the exact local command
   (jshell, javac+java, or mvn test) to execute what you wrote for real.

   Lab spec (lesson.lab):
     title      : string
     prompt     : HTML string — the task
     starter    : starter code shown in the editor
     checks     : [{re, flags, must, hint, pass}]  — must:true = pattern required,
                  must:false = pattern forbidden
     run        : HTML string — how to execute this for real locally
                  (e.g. "Paste into <code>jshell</code>" or "<code>mvn -q test</code>")
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

  function bracketLint(code) {
    // Strip Java strings, chars, and comments crudely, then check bracket balance.
    const stripped = code
      .replace(/\/\*[\s\S]*?\*\//g, '')                       // block comments
      .replace(/\/\/.*$/gm, '')                               // line comments
      .replace(/"""[\s\S]*?"""/g, '')                         // text blocks
      .replace(/"(?:\\.|[^"\\])*"/g, '')                      // strings
      .replace(/'(?:\\.|[^'\\])*'/g, '');                     // chars
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

  function semicolonHint(code) {
    // Gentle heuristic, not a compiler: flag lines that look like statements
    // missing a ';' (assignment or call not ending in ; { } ( , or ->).
    const suspects = [];
    code.split('\n').forEach((line, i) => {
      const t = line.trim().replace(/\/\/.*$/, '').trim();
      if (!t || t.startsWith('*') || t.startsWith('/*') || t.startsWith('@')) return;
      const looksStatement = /(=[^=>]|\)\s*$)/.test(t) && !/[;{}(,]$|->$|\)\s*\{$/.test(t);
      const isControl = /^(if|else|for|while|switch|do|try|catch|finally|case|default|public|private|protected|static|class|interface|enum|record|import|package)\b/.test(t);
      if (looksStatement && !isControl && !t.endsWith(';')) suspects.push(i + 1);
    });
    return suspects.length ? `Possible missing ";" on line${suspects.length > 1 ? 's' : ''} ${suspects.slice(0, 4).join(', ')} (heuristic — ignore if it's a lambda/builder chain).` : null;
  }

  function runStaticChecks(code, checks) {
    const results = [];
    if (!code.trim()) {
      return [{ ok: false, msg: 'The editor is empty — write some code first.' }];
    }
    const lint = bracketLint(code);
    results.push(lint ? { ok: false, msg: lint } : { ok: true, msg: 'Brackets balanced.' });
    const semi = semicolonHint(code);
    if (semi) results.push({ ok: false, msg: semi });
    (checks || []).forEach(c => {
      const re = new RegExp(c.re, c.flags || '');
      const hit = re.test(code);
      const ok = c.must ? hit : !hit;
      results.push({ ok, msg: ok ? (c.pass || c.hint) : c.hint });
    });
    return results;
  }

  function renderCodeLab(container, lessonId, lab) {
    const storeKey = 'java-lab-' + lessonId;
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
    const btnCheck = el('button', 'btn', '🔎 Check my code');
    const btnSolution = el('button', 'btn secondary', '👀 Show solution');
    const btnReset = el('button', 'btn secondary', '↺ Reset to starter');
    actions.appendChild(btnCheck);
    actions.appendChild(btnSolution);
    actions.appendChild(btnReset);
    card.appendChild(actions);

    card.appendChild(el('p', 'lab-local-note',
      '☕ Java runs on the JVM, not in the browser — the check above verifies the <i>structure</i> of your code instantly. ' +
      'For the real rep, run it locally: ' +
      (lab.run || 'paste it into <code>jshell</code> (ships with the JDK — just type <code>jshell</code> in a terminal).')));

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
        '</ul>' + (allOk ? '<p>Now run it for real locally (see the ☕ note under the buttons) — the compiler is the final judge.</p>' : ''),
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
