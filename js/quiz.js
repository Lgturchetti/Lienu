// Lógica do Quiz — Lineu
// As perguntas ficam em js/questions.js (carregado antes deste arquivo) e
// chegam aqui pela global window.LINEU_QUESTIONS.
(function () {
  "use strict";

  const QUESTION_TIME_MS = 45000; // 45s por pergunta
  const FEEDBACK_DELAY_MS = 1500; // tempo mostrando acerto/erro antes de avançar
  const GRID_MAX_WIDTH_PX_AT_1920 = 660; // acima disso, vira layout "longa" (1 coluna)

  const QUESTIONS = Array.isArray(window.LINEU_QUESTIONS)
    ? window.LINEU_QUESTIONS
    : [];

  if (QUESTIONS.length === 0) {
    console.error(
      "Nenhuma pergunta encontrada. Verifique se js/questions.js foi carregado antes de js/quiz.js."
    );
    return;
  }

  const stageEl = document.getElementById("quiz-stage");
  const questionEl = document.getElementById("quiz-question");
  const answersEl = document.getElementById("quiz-answers");
  const timerEl = document.getElementById("quiz-timer");
  const timerFillEl = document.getElementById("quiz-timer-fill");
  const backEl = document.querySelector(".quiz__back");
  const resultsEl = document.getElementById("quiz-results");
  const resultsListEl = document.getElementById("quiz-results-list");

  let currentIndex = 0;
  let answered = false;
  let activeTimer = null;
  const results = []; // { correct: bool }

  const LETTERS = ["a", "b", "c", "d"];

  // Embaralha uma cópia do array (Fisher–Yates), sem alterar o original.
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function renderQuestion() {
    const data = QUESTIONS[currentIndex];
    answered = false;

    questionEl.textContent = data.question;

    // Monta os botões de resposta (ainda invisíveis, pra medir o texto)
    answersEl.innerHTML = "";
    answersEl.className = "quiz__answers";
    answersEl.style.visibility = "hidden";

    // Ordem embaralhada dos índices originais — assim as respostas não
    // ficam sempre na mesma posição, mas handleAnswer continua sabendo
    // qual é a correta de verdade (guardada em data-original-index).
    const order = shuffle(data.answers.map(function (_, i) { return i; }));

    const buttons = order.map(function (originalIndex, position) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz__answer";
      btn.dataset.originalIndex = String(originalIndex);

      const letter = document.createElement("span");
      letter.className = "quiz__answer-letter";
      letter.textContent = LETTERS[position];

      const label = document.createElement("span");
      label.className = "quiz__answer-label";
      label.textContent = data.answers[originalIndex];

      btn.appendChild(letter);
      btn.appendChild(label);
      btn.addEventListener("click", function () {
        handleAnswer(originalIndex, btn);
      });

      answersEl.appendChild(btn);
      return btn;
    });

    // Depois de inseridos no DOM, mede a largura natural de cada um pra
    // decidir entre grade 2×2 (respostas curtas) ou coluna única (longas).
    // A largura de cada pílula fica livre (auto) — cada uma se ajusta ao
    // próprio texto; no modo grade, as duas pílulas de uma mesma coluna
    // acompanham a mais larga da coluna (comportamento nativo do grid).
    requestAnimationFrame(function () {
      let maxWidth = 0;
      buttons.forEach(function (btn) {
        const w = btn.getBoundingClientRect().width;
        if (w > maxWidth) maxWidth = w;
      });

      const isGrid = maxWidth <= GRID_MAX_WIDTH_PX_AT_1920 * (window.innerWidth / 1920);
      answersEl.classList.add(isGrid ? "quiz__answers--grid" : "quiz__answers--stack");

      answersEl.style.visibility = "visible";
    });

    startTimer();
  }

  function startTimer() {
    timerFillEl.style.transition = "none";
    timerFillEl.style.width = "0%";
    void timerFillEl.offsetWidth; // força reflow antes de reativar a transição

    timerFillEl.style.transition = "width " + QUESTION_TIME_MS + "ms linear";
    requestAnimationFrame(function () {
      timerFillEl.style.width = "100%";
    });

    const timeoutId = setTimeout(function () {
      handleAnswer(null, null);
    }, QUESTION_TIME_MS);

    activeTimer = {
      stop: function () {
        clearTimeout(timeoutId);
        const computedWidth = getComputedStyle(timerFillEl).width;
        timerFillEl.style.transition = "none";
        timerFillEl.style.width = computedWidth;
      },
    };
  }

  function handleAnswer(selectedIndex, selectedBtn) {
    if (answered) return;
    answered = true;
    if (activeTimer) activeTimer.stop();

    const data = QUESTIONS[currentIndex];
    const isCorrect = selectedIndex === data.correct;

    const buttons = answersEl.querySelectorAll(".quiz__answer");
    buttons.forEach(function (btn) {
      btn.disabled = true;
      const originalIndex = Number(btn.dataset.originalIndex);
      if (originalIndex === data.correct) {
        btn.classList.add("quiz__answer--correct");
      } else if (originalIndex === selectedIndex) {
        btn.classList.add("quiz__answer--wrong");
      }
    });

    results.push({ correct: isCorrect });

    setTimeout(function () {
      currentIndex += 1;
      if (currentIndex < QUESTIONS.length) {
        renderQuestion();
      } else {
        showResults();
      }
    }, FEEDBACK_DELAY_MS);
  }

  function showResults() {
    stageEl.hidden = true;
    timerEl.hidden = true;
    backEl.hidden = true;

    resultsListEl.innerHTML = "";
    results.forEach(function (result, i) {
      const item = document.createElement("div");
      item.className =
        "quiz__result-item " +
        (result.correct ? "quiz__result-item--correct" : "quiz__result-item--wrong");

      const icon = document.createElement("span");
      icon.className = "quiz__result-icon";
      icon.textContent = result.correct ? "✓" : "✗";

      const label = document.createElement("span");
      label.textContent = "Pergunta " + (i + 1) + ": " + QUESTIONS[i].question;

      item.appendChild(icon);
      item.appendChild(label);
      resultsListEl.appendChild(item);
    });

    resultsEl.hidden = false;
  }

  renderQuestion();
})();