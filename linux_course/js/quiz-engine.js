/*
Renders a multiple-choice quiz.
Consumes: quiz = [ { q: string, options: [string], correct: number, explain: string } ]
Calls onComplete(scoreFraction) once every question has been answered (optional).
*/
function renderQuiz(containerEl, quiz, onComplete) {
  containerEl.innerHTML = '';
  let answered = 0;
  let correctCount = 0;

  const scoreEl = document.createElement('div');
  scoreEl.className = 'quiz-score';
  scoreEl.style.marginBottom = '0.6rem';
  updateScore();
  containerEl.appendChild(scoreEl);

  quiz.forEach((item, qi) => {
    const box = document.createElement('div');
    box.className = 'quiz-q';
    const qtext = document.createElement('div');
    qtext.className = 'qtext';
    qtext.textContent = `${qi + 1}. ${item.q}`;
    box.appendChild(qtext);

    const explain = document.createElement('div');
    explain.className = 'quiz-explain';
    explain.textContent = item.explain || '';

    item.options.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (btn.dataset.locked) return;
        const buttons = box.querySelectorAll('.quiz-opt');
        buttons.forEach(b => { b.dataset.locked = '1'; b.disabled = true; });
        buttons[item.correct].classList.add('correct');
        if (oi !== item.correct) btn.classList.add('wrong');
        explain.classList.add('show');
        answered++;
        if (oi === item.correct) correctCount++;
        updateScore();
        if (answered === quiz.length && typeof onComplete === 'function') {
          onComplete(correctCount / quiz.length);
        }
      });
      box.appendChild(btn);
    });

    box.appendChild(explain);
    containerEl.appendChild(box);
  });

  function updateScore() {
    scoreEl.textContent = `Score: ${correctCount} / ${quiz.length}`;
  }
}
