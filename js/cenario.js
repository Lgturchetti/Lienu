// Modo Cenário — Lineu
// Nível 1: quebra-cabeça de montagem de cabines sanitárias (arrastar e
// soltar). Níveis 2 e 3 ainda não existem: mostram um placeholder.
// O progresso vem de js/progresso-cenario.js (window.LINEU_CENARIO).
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var nivel = parseInt(params.get("nivel"), 10);
  if (!(nivel >= 1 && nivel <= 3)) nivel = 1;

  var fase1El = document.getElementById("fase1");
  var placeholderEl = document.getElementById("cenario-placeholder");

  if (nivel !== 1) {
    placeholderEl.hidden = false;
    var titulo = document.getElementById("cenario-title");
    if (titulo) titulo.textContent = "Cenário — Nível " + nivel;
    return;
  }

  fase1El.hidden = false;
  iniciarFase1();

  // ================================================================
  function iniciarFase1() {
    var TEMPO_MS = 90000; // 90s para montar as duas cabines

    var NORMA_TEXTO =
      "Dentro da cabine é preciso ter uma área de manobra de 60 cm de " +
      "diâmetro. A porta que abre para dentro é considerada perda dessa " +
      "área livre. Por isso a cabine mais profunda comporta uma porta com " +
      "abertura para dentro; já a cabine mais rasa precisa da porta abrindo " +
      "para fora, para sobrar área de manobra para o usuário entrar e sair. " +
      "O vaso fica sempre encostado na parede do fundo, longe da porta.";

    var bandeja = document.getElementById("fase1-bandeja");
    var confirmarBtn = document.getElementById("fase1-confirmar");
    var avisoEl = document.getElementById("fase1-aviso");
    var fillEl = document.getElementById("fase1-tempo-fill");

    var overlay = document.getElementById("fase1-overlay");
    var overlayTitulo = document.getElementById("fase1-overlay-titulo");
    var overlayTexto = document.getElementById("fase1-overlay-texto");
    var overlayNotas = document.getElementById("fase1-overlay-notas");
    var rejogarBtn = document.getElementById("fase1-rejogar");

    var pecas = Array.prototype.slice.call(document.querySelectorAll(".fase1__peca"));
    var cabines = Array.prototype.slice.call(document.querySelectorAll(".fase1__cabine"));

    var erros = 0;
    var finalizado = false;
    var venceu = false;
    var avisoTimer = null;
    var prazoTimer = null;

    // ---------- Arrastar e soltar ----------
    pecas.forEach(function (peca, i) {
      peca.style.order = String(i); // mantém a ordem visual na bandeja
      peca._casa = peca.parentNode; // coluna de origem, pra onde a peça volta
      ligarArrasto(peca);
    });

    function ligarArrasto(peca) {
      var drag = null;

      peca.addEventListener("pointerdown", function (e) {
        if (finalizado) return;
        e.preventDefault();
        var r = peca.getBoundingClientRect();
        drag = {
          id: e.pointerId,
          dx: e.clientX - r.left,
          dy: e.clientY - r.top,
          w: r.width,
        };
        try { peca.setPointerCapture(e.pointerId); } catch (err) {}
        limparDestaques();
        limparInline(peca);
        peca.classList.remove("is-colocada", "is-vaso-topo", "is-vaso-porta");
        delete peca.dataset.local;
        delete peca.dataset.pos;
        peca.classList.add("is-arrastando");
        document.body.appendChild(peca);
        mover(e.clientX, e.clientY);
      });

      peca.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        mover(e.clientX, e.clientY);
      });

      peca.addEventListener("pointerup", soltar);
      peca.addEventListener("pointercancel", soltar);

      function mover(x, y) {
        peca.style.position = "fixed";
        peca.style.margin = "0";
        peca.style.width = drag.w + "px";
        peca.style.left = x - drag.dx + "px";
        peca.style.top = y - drag.dy + "px";
      }

      function soltar(e) {
        if (!drag || e.pointerId !== drag.id) return;
        try { peca.releasePointerCapture(e.pointerId); } catch (err) {}
        peca.classList.remove("is-arrastando");
        var alvo = cabineSob(peca, e.clientX, e.clientY);
        drag = null;
        if (alvo) {
          colocar(peca, alvo.cabine, alvo.metadeInferior);
        } else {
          devolver(peca);
        }
        mostrarAviso("");
      }
    }

    function cabineSob(peca, x, y) {
      peca.style.pointerEvents = "none";
      var el = document.elementFromPoint(x, y);
      peca.style.pointerEvents = "";
      var cab = el && el.closest ? el.closest(".fase1__cabine") : null;
      if (!cab) return null;
      var r = cab.getBoundingClientRect();
      return { cabine: cab, metadeInferior: y > r.top + r.height / 2 };
    }

    function colocar(peca, cab, inferior) {
      var tipo = peca.dataset.tipo;

      // Só cabe uma peça de cada tipo por cabine: a que estava lá volta.
      var ocupada = cab.querySelector('.fase1__peca[data-tipo="' + tipo + '"]');
      if (ocupada && ocupada !== peca) devolver(ocupada);

      limparInline(peca);
      peca.classList.add("is-colocada");
      peca.dataset.local = cab.dataset.cabine;

      if (tipo === "vaso") {
        peca.dataset.pos = inferior ? "porta" : "topo";
        peca.classList.toggle("is-vaso-porta", inferior);
        peca.classList.toggle("is-vaso-topo", !inferior);
      }

      cab.appendChild(peca);
    }

    function devolver(peca) {
      limparInline(peca);
      peca.classList.remove("is-colocada", "is-vaso-topo", "is-vaso-porta", "is-arrastando");
      delete peca.dataset.local;
      delete peca.dataset.pos;
      (peca._casa || bandeja).appendChild(peca);
    }

    function limparInline(peca) {
      peca.style.position = "";
      peca.style.left = "";
      peca.style.top = "";
      peca.style.width = "";
      peca.style.margin = "";
      peca.style.pointerEvents = "";
    }

    // ---------- Validação ----------
    function leituraCabine(nome) {
      var cab = document.querySelector('.fase1__cabine[data-cabine="' + nome + '"]');
      var vaso = cab.querySelector(".fase1__peca--vaso");
      var porta = cab.querySelector(".fase1__peca--porta");
      return {
        cabine: cab,
        vaso: vaso ? vaso.dataset.pos || "topo" : null,
        porta: porta ? porta.dataset.abertura : null,
      };
    }

    function tudoColocado() {
      return document.querySelectorAll(".fase1__cabine .fase1__peca").length === 4;
    }

    function confirmar() {
      if (finalizado) return;

      if (!tudoColocado()) {
        mostrarAviso("Arraste todas as peças para dentro das cabines.");
        return;
      }

      var maior = leituraCabine("maior");
      var menor = leituraCabine("menor");
      var problemas = [];

      if (maior.porta !== "dentro") {
        problemas.push({ cabine: maior.cabine, msg: "A cabine mais profunda tem folga de sobra: a porta pode abrir para dentro." });
      }
      if (menor.porta !== "fora") {
        problemas.push({ cabine: menor.cabine, msg: "A cabine mais rasa é curta demais: a porta precisa abrir para fora." });
      }
      if (maior.vaso !== "topo") {
        problemas.push({ cabine: maior.cabine, msg: "O vaso deve encostar na parede do fundo, longe da porta." });
      }
      if (menor.vaso !== "topo") {
        problemas.push({ cabine: menor.cabine, msg: "O vaso deve encostar na parede do fundo, longe da porta." });
      }

      if (problemas.length) {
        erros += 1;
        problemas.forEach(function (p) { p.cabine.classList.add("is-errada"); });
        mostrarAviso(problemas[0].msg);
        return;
      }

      sucesso();
    }

    function sucesso() {
      finalizado = true;
      venceu = true;
      pararTimer();
      limparDestaques();

      var notas = Math.max(1, 3 - erros);
      if (window.LINEU_CENARIO) {
        window.LINEU_CENARIO.registrarConclusao(1, notas);
      }

      var extra =
        notas >= 3
          ? " A próxima fase foi desbloqueada!"
          : " Gabarite esta fase (3 notas) para desbloquear a próxima.";

      abrirOverlay(
        "Compreenda as normas",
        NORMA_TEXTO,
        "Você conquistou " + notas + " de 3 notas." + extra
      );
    }

    // ---------- Cronômetro ----------
    function iniciarTimer() {
      fillEl.style.transition = "none";
      fillEl.style.width = "0%";
      void fillEl.offsetWidth; // reflow antes de reativar a transição
      fillEl.style.transition = "width " + TEMPO_MS + "ms linear";
      requestAnimationFrame(function () {
        fillEl.style.width = "100%";
      });
      clearTimeout(prazoTimer);
      prazoTimer = setTimeout(aoZerar, TEMPO_MS);
    }

    function pararTimer() {
      clearTimeout(prazoTimer);
      var largura = getComputedStyle(fillEl).width;
      fillEl.style.transition = "none";
      fillEl.style.width = largura;
    }

    function aoZerar() {
      if (finalizado) return;
      finalizado = true;
      erros += 1;
      pararTimer();
      abrirOverlay(
        "Tempo esgotado!",
        "O tempo acabou antes de você confirmar a montagem. Isso conta como um erro — mas dá para tentar de novo.",
        null
      );
    }

    // ---------- Overlay / avisos ----------
    function abrirOverlay(titulo, texto, notasTexto) {
      overlayTitulo.textContent = titulo;
      overlayTexto.textContent = texto;
      if (notasTexto) {
        overlayNotas.textContent = notasTexto;
        overlayNotas.hidden = false;
      } else {
        overlayNotas.hidden = true;
      }
      overlay.hidden = false;
      rejogarBtn.focus();
    }

    function mostrarAviso(msg) {
      clearTimeout(avisoTimer);
      if (!msg) {
        avisoEl.hidden = true;
        avisoEl.textContent = "";
        return;
      }
      avisoEl.textContent = msg;
      avisoEl.hidden = false;
      avisoTimer = setTimeout(function () {
        avisoEl.hidden = true;
      }, 4500);
    }

    function limparDestaques() {
      cabines.forEach(function (c) { c.classList.remove("is-errada"); });
    }

    // Recomeça a tentativa sem recarregar a página (usado quando o tempo
    // esgota), para não zerar a contagem de erros já acumulada.
    function reiniciarTentativa() {
      pecas.forEach(devolver);
      limparDestaques();
      mostrarAviso("");
      overlay.hidden = true;
      finalizado = false;
      iniciarTimer();
    }

    // ---------- Ligações ----------
    confirmarBtn.addEventListener("click", confirmar);
    rejogarBtn.addEventListener("click", function () {
      if (venceu) window.location.reload();
      else reiniciarTentativa();
    });

    iniciarTimer();
  }
})();
