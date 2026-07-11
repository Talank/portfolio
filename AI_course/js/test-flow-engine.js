/* Self-test flowchart engine — a branching "test your understanding" decision
   tree, distinct from the plain multiple-choice quiz (js/quiz-engine.js). The
   user clicks through a chain of questions; each choice is an edge to either
   another question or a feedback node, and every visited node is appended to a
   growing vertical trail of connected boxes — the flowchart reveals itself as
   you go, rather than showing every branch upfront (which would spoil answers).

   Schema (window.LESSONS[id].testFlow):
     title : string
     start : nodeId
     nodes : {
       [id]: { q, choices: [{text, to}] }                         — a question node
            | { end:true, correct, text, next? , retry? }          — a feedback node
     }
   A correct end node should have `next` (the following question, if any).
   An incorrect end node should have `retry` (send the user back to re-answer). */

(function () {
  'use strict';

  const NARRATOR_VOICE = { pitch: 0.94, rate: 0.9, volume: 0.95, genderHint: 'female' };

  function el(tag, cls) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  function trim(s, n) {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function renderTestFlow(container, flow) {
    container.classList.add('tf-wrap');
    container.innerHTML = '';

    const header = el('div', 'tf-header');
    const title = el('div', 'tf-title');
    title.textContent = flow.title || 'Test yourself';
    const btnVoice = el('button', 'tf-voice');
    header.appendChild(title);
    header.appendChild(btnVoice);
    container.appendChild(header);

    const voiceOk = !!(window.VoiceEngine && window.VoiceEngine.isSupported());
    let narrationOn = false;
    if (!voiceOk) {
      btnVoice.textContent = '🗣 unsupported';
      btnVoice.disabled = true;
    } else {
      btnVoice.textContent = '🗣 Narration: off';
    }
    btnVoice.addEventListener('click', () => {
      narrationOn = !narrationOn;
      if (window.VoiceEngine) window.VoiceEngine.setEnabled(narrationOn);
      btnVoice.textContent = narrationOn ? '🗣 Narration: on' : '🗣 Narration: off';
      btnVoice.classList.toggle('sa-voice-on', narrationOn);
      if (!narrationOn && window.VoiceEngine) window.VoiceEngine.stop();
    });

    const trail = el('div', 'tf-trail');
    const current = el('div', 'tf-current');
    container.appendChild(trail);
    container.appendChild(current);

    const firstAttempt = {};    // qid -> true/false, set only the FIRST time that question resolves
    let lastQuestionId = null;

    function addTrailNode(label, cls) {
      if (trail.children.length) {
        const arrow = el('div', 'tf-trail-arrow');
        arrow.textContent = '↓';
        trail.appendChild(arrow);
      }
      const box = el('div', 'tf-trail-node' + (cls ? ' ' + cls : ''));
      box.textContent = label;
      trail.appendChild(box);
      trail.scrollTop = trail.scrollHeight;
    }

    function speak(text) {
      if (window.VoiceEngine) window.VoiceEngine.stop();
      if (narrationOn && voiceOk) window.VoiceEngine.speak(text, NARRATOR_VOICE);
    }

    function show(id) {
      const node = flow.nodes[id];
      current.innerHTML = '';
      current.classList.remove('tf-cap-in');
      void current.offsetWidth;
      current.classList.add('tf-cap-in');

      if (!node.end) {
        lastQuestionId = node.qid || id;
        addTrailNode('Q: ' + trim(node.q, 42), 'tf-trail-q');
        const qEl = el('div', 'tf-q-text');
        qEl.textContent = node.q;
        current.appendChild(qEl);
        const choicesEl = el('div', 'tf-choices');
        node.choices.forEach(c => {
          const b = el('button', 'tf-choice');
          b.type = 'button';
          b.textContent = c.text;
          b.addEventListener('click', () => show(c.to));
          choicesEl.appendChild(b);
        });
        current.appendChild(choicesEl);
        speak(node.q);
      } else {
        if (lastQuestionId && !(lastQuestionId in firstAttempt)) firstAttempt[lastQuestionId] = node.correct;
        addTrailNode(node.correct ? '✓ Correct' : '✗ Not quite', node.correct ? 'tf-trail-good' : 'tf-trail-bad');
        const fb = el('div', 'tf-feedback ' + (node.correct ? 'tf-good' : 'tf-bad'));
        fb.textContent = node.text;
        current.appendChild(fb);
        const btn = el('button', 'tf-continue');
        if (node.correct && node.next) {
          btn.textContent = 'Continue →';
          btn.addEventListener('click', () => show(node.next));
        } else if (!node.correct && node.retry) {
          btn.textContent = 'Try again ↺';
          btn.addEventListener('click', () => show(node.retry));
        } else {
          const asked = Object.keys(firstAttempt).length;
          const gotRight = Object.values(firstAttempt).filter(Boolean).length;
          btn.textContent = 'Done — ' + gotRight + '/' + asked + ' correct on the first try';
          btn.disabled = true;
          btn.classList.add('tf-done');
        }
        current.appendChild(btn);
        speak(node.text);
      }
    }

    show(flow.start);
  }

  window.renderTestFlow = renderTestFlow;
})();
