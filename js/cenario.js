// Modo Cenário — Lineu
// Nível 1: montagem de cabines sanitárias (arrastar e soltar).
// Nível 2: montagem de um banheiro acessível (arrastar + girar as peças).
// Nível 3 ainda não existe: mostra um placeholder.
// O progresso vem de js/progresso-cenario.js (window.LINEU_CENARIO).
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var nivel = parseInt(params.get("nivel"), 10);
  if (!(nivel >= 1 && nivel <= 3)) nivel = 1;

  var fase1El = document.getElementById("fase1");
  var fase2El = document.getElementById("fase2");
  var placeholderEl = document.getElementById("cenario-placeholder");

  if (nivel === 2) {
    fase2El.hidden = false;
    iniciarFase2();
    return;
  }

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

  // ================================================================
  // Fase 2 — banheiro acessível (arrastar + girar)
  // ================================================================
  function iniciarFase2() {
    var TEMPO_MS = 120000; // 120s para montar o banheiro inteiro

    var NORMA_TEXTO =
      "Ao lado da bacia sanitária a NBR 9050 exige uma área livre para a " +
      "transferência de quem usa cadeira de rodas (cerca de 0,80 m × 1,20 m). " +
      "Por isso o vaso encosta na parede do fundo e fica deslocado para um " +
      "dos lados — sobra espaço livre ao lado dele. As barras de apoio formam " +
      "um L: a horizontal vai na parede atrás da bacia e a vertical na parede " +
      "lateral vizinha, servindo de apoio para sentar e levantar. O lavatório " +
      "fica afastado da bacia e perto da porta, sem coluna, para não invadir " +
      "essa área de transferência e permitir a aproximação de frente. E a " +
      "porta abre para fora, para preservar a área de manobra de 1,50 m " +
      "dentro do banheiro.";

    // Zonas de encaixe, em % do tabuleiro (a planta é ~604×674). Só servem
    // pra "imantar" a peça num ponto arrumado — a validação é por REGIÃO
    // (ver ACERTO), não pela zona exata. As 4 primeiras são as previstas na
    // resposta; as demais são iscas.
    var ZONAS = [
      { id: "fundo-barra", x: 40, y: 7 },
      { id: "fundo-vaso", x: 40, y: 27 },
      { id: "lateral-esq", x: 8, y: 39 },
      { id: "canto-pia", x: 22, y: 78 },
      { id: "fundo-dir", x: 71, y: 12 },
      { id: "lateral-dir", x: 91, y: 48 },
      { id: "centro", x: 55, y: 55 },
      { id: "canto-dir", x: 80, y: 79 },
    ];

    // Acerto por REGIÃO do centro da peça (faixas em % da planta) + rotações
    // aceitas (graus, sentido horário). Assim não importa em qual zona exata
    // a peça imantou, só se ela está na área certa e numa orientação
    // plausível. As barras e o lavatório aceitam 0° ou 180° (encostados na
    // parede, tanto faz o lado dos suportes); o vaso só 0° (caixa de
    // descarga contra a parede do fundo).
    var ACERTO = {
      vaso: { x: [22, 60], y: [10, 46], rot: [0] },
      "barra-h": { x: [16, 64], y: [0, 20], rot: [0, 180] },
      "barra-v": { x: [0, 24], y: [16, 62], rot: [0, 180] },
      pia: { x: [6, 48], y: [56, 100], rot: [0, 180] },
    };

    var MSG_LOCAL = {
      vaso:
        "O vaso precisa encostar na parede do fundo e ficar deslocado para " +
        "um lado, deixando a área de transferência livre ao lado dele.",
      "barra-h": "A barra horizontal fica na parede do fundo, logo atrás da bacia.",
      "barra-v": "A barra vertical fica na parede lateral, ao lado da bacia.",
      pia:
        "O lavatório fica afastado da bacia e perto da porta, para não " +
        "ocupar a área de transferência.",
    };

    var MSG_ROT = {
      vaso: "Gire o vaso até a caixa de descarga encostar na parede do fundo.",
      "barra-h": "A barra horizontal precisa ficar deitada (na horizontal), rente à parede do fundo.",
      "barra-v": "A barra vertical precisa ficar em pé (na vertical), rente à parede lateral.",
      pia: "Gire o lavatório até ele ficar deitado, encostado na parede.",
    };

    var tabuleiro = document.getElementById("fase2-tabuleiro");
    var bandeja = document.getElementById("fase2-bandeja");
    var girarBtn = document.getElementById("fase2-girar");
    var confirmarBtn = document.getElementById("fase2-confirmar");
    var avisoEl = document.getElementById("fase2-aviso");
    var fillEl = document.getElementById("fase2-tempo-fill");

    var overlay = document.getElementById("fase2-overlay");
    var overlayTitulo = document.getElementById("fase2-overlay-titulo");
    var overlayTexto = document.getElementById("fase2-overlay-texto");
    var overlayNotas = document.getElementById("fase2-overlay-notas");
    var rejogarBtn = document.getElementById("fase2-rejogar");

    var pecas = Array.prototype.slice.call(
      document.querySelectorAll(".fase2__peca")
    );

    var erros = 0;
    var finalizado = false;
    var venceu = false;
    var selecionada = null;
    var avisoTimer = null;
    var prazoTimer = null;

    // ---------- Zonas ----------
    var zonaEls = ZONAS.map(function (z) {
      var el = document.createElement("div");
      el.className = "fase2__zona";
      el.dataset.zona = z.id;
      el.style.left = z.x + "%";
      el.style.top = z.y + "%";
      tabuleiro.appendChild(el);
      return el;
    });

    function centroZona(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: el };
    }

    // Zona cujo centro está mais perto de (x, y). Com exigirDentro, só
    // considera se (x, y) cai na planta (com uma folga além da borda);
    // senão devolve null (a peça volta pra bandeja).
    function zonaMaisProxima(x, y, exigirDentro) {
      if (exigirDentro) {
        var rt = tabuleiro.getBoundingClientRect();
        var folga = 28;
        if (
          x < rt.left - folga ||
          x > rt.right + folga ||
          y < rt.top - folga ||
          y > rt.bottom + folga
        ) {
          return null;
        }
      }
      var melhor = null;
      var melhorD = Infinity;
      zonaEls.forEach(function (el) {
        var c = centroZona(el);
        var d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
        if (d < melhorD) {
          melhorD = d;
          melhor = el;
        }
      });
      return melhor;
    }

    function destacarZona(el) {
      zonaEls.forEach(function (z) {
        z.classList.toggle("is-alvo", z === el);
      });
    }

    function limparZonas() {
      zonaEls.forEach(function (z) {
        z.classList.remove("is-alvo");
      });
    }

    function ocupanteDaZona(id) {
      return tabuleiro.querySelector(
        '.fase2__peca.is-colocada[data-zona="' + id + '"]'
      );
    }

    // ---------- Rotação ----------
    pecas.forEach(function (peca) {
      // Começa numa rotação errada de propósito: o jogador precisa girar.
      var r = [90, 180, 270][Math.floor(Math.random() * 3)];
      aplicarRotacao(peca, r);
      peca._casa = peca.parentNode;
      ligarPeca(peca);
    });

    function aplicarRotacao(peca, graus) {
      var g = ((graus % 360) + 360) % 360;
      peca.dataset.rot = String(g);
      renderTransform(peca);
    }

    // A rotação vai junto com o translate de centralização (peça encaixada
    // OU sendo arrastada) no mesmo `transform`, senão ela sai do lugar ao
    // girar / ao seguir o ponteiro.
    function renderTransform(peca) {
      var rot = "rotate(" + peca.dataset.rot + "deg)";
      var centrado =
        peca.classList.contains("is-colocada") ||
        peca.classList.contains("is-arrastando");
      peca.style.transform = centrado ? "translate(-50%, -50%) " + rot : rot;
    }

    // Largura da peça já encaixada, em % da planta — PRECISA bater com o CSS
    // (.fase2__tabuleiro .fase2__peca--X.is-colocada). É a mesma largura usada
    // durante o arrasto, pra não haver "pulo" de tamanho ao soltar.
    var TAMANHOS = { vaso: 27, pia: 32, "barra-h": 46, "barra-v": 6.5 };

    function larguraArrasto(peca) {
      var bw = tabuleiro.getBoundingClientRect().width;
      return (bw * (TAMANHOS[peca.dataset.peca] || 20)) / 100;
    }

    function girarSelecionada() {
      if (finalizado || !selecionada) return;
      aplicarRotacao(selecionada, parseInt(selecionada.dataset.rot, 10) + 90);
      limparErradas();
      mostrarAviso("");
    }

    function selecionar(peca) {
      if (selecionada && selecionada !== peca) {
        selecionada.classList.remove("is-selecionada");
      }
      selecionada = peca;
      peca.classList.add("is-selecionada");
      girarBtn.disabled = false;
    }

    function limparSelecao() {
      if (selecionada) selecionada.classList.remove("is-selecionada");
      selecionada = null;
      girarBtn.disabled = true;
    }

    // ---------- Arrastar / clicar ----------
    function ligarPeca(peca) {
      var estado = null;
      var arrastando = false;

      peca.addEventListener("pointerdown", function (e) {
        if (finalizado) return;
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        estado = { id: e.pointerId, x0: e.clientX, y0: e.clientY, w: 0 };
        arrastando = false;
        try {
          peca.setPointerCapture(e.pointerId);
        } catch (err) {}
      });

      peca.addEventListener("pointermove", function (e) {
        if (!estado || e.pointerId !== estado.id) return;
        if (!arrastando) {
          if (
            Math.abs(e.clientX - estado.x0) + Math.abs(e.clientY - estado.y0) < 8
          ) {
            return;
          }
          arrastando = true;
          comecarArrasto();
        }
        posicionar(e.clientX, e.clientY);
        destacarZona(zonaMaisProxima(e.clientX, e.clientY, true));
      });

      peca.addEventListener("pointerup", encerrar);
      peca.addEventListener("pointercancel", encerrar);

      // Teclado: focar a peça (Tab) já a seleciona, pra tecla R funcionar.
      peca.addEventListener("focus", function () {
        if (!finalizado) selecionar(peca);
      });

      function comecarArrasto() {
        estado.w = larguraArrasto(peca);
        limparInline(peca);
        peca.classList.remove("is-colocada", "is-errada");
        delete peca.dataset.zona;
        peca.classList.add("is-arrastando");
        document.body.appendChild(peca);
        tabuleiro.classList.add("is-arrastando");
        selecionar(peca);
        renderTransform(peca);
        // Recaptura depois de reparentar (Firefox às vezes solta a captura).
        try {
          peca.setPointerCapture(estado.id);
        } catch (err) {}
      }

      // A peça fica centralizada no ponteiro (transform: translate(-50%,-50%)),
      // então o ponteiro marca exatamente o centro dela — o encaixe usa esse
      // mesmo ponto, sem depender de onde a peça foi pega nem da rotação.
      function posicionar(x, y) {
        peca.style.position = "fixed";
        peca.style.margin = "0";
        peca.style.width = estado.w + "px";
        peca.style.left = x + "px";
        peca.style.top = y + "px";
      }

      function encerrar(e) {
        if (!estado || e.pointerId !== estado.id) return;
        try {
          peca.releasePointerCapture(e.pointerId);
        } catch (err) {}
        var eraArrasto = arrastando;
        var ex = e.clientX;
        var ey = e.clientY;
        estado = null;
        arrastando = false;
        tabuleiro.classList.remove("is-arrastando");
        limparZonas();

        if (!eraArrasto) {
          selecionar(peca);
          return;
        }

        peca.classList.remove("is-arrastando");
        var alvo = zonaMaisProxima(ex, ey, true);
        if (alvo) colocar(peca, alvo);
        else devolver(peca);
        mostrarAviso("");
      }
    }

    function colocar(peca, zonaEl) {
      var id = zonaEl.dataset.zona;
      var ocupante = ocupanteDaZona(id);
      if (ocupante && ocupante !== peca) devolver(ocupante);

      limparInline(peca);
      peca.classList.add("is-colocada");
      peca.classList.remove("is-errada");
      peca.dataset.zona = id;
      peca.style.left = zonaEl.style.left;
      peca.style.top = zonaEl.style.top;
      renderTransform(peca);
      tabuleiro.appendChild(peca);
    }

    function devolver(peca) {
      limparInline(peca);
      peca.classList.remove("is-colocada", "is-arrastando", "is-errada");
      delete peca.dataset.zona;
      renderTransform(peca);
      (peca._casa || bandeja).appendChild(peca);
    }

    function limparInline(peca) {
      peca.style.position = "";
      peca.style.left = "";
      peca.style.top = "";
      peca.style.width = "";
      peca.style.height = "";
      peca.style.margin = "";
      peca.style.pointerEvents = "";
    }

    // ---------- Validação ----------
    function tudoColocado() {
      return pecas.every(function (p) {
        return !!p.dataset.zona;
      });
    }

    function confirmar() {
      if (finalizado) return;

      if (!tudoColocado()) {
        mostrarAviso("Encaixe as quatro peças dentro da planta.");
        return;
      }

      var problemas = [];
      pecas.forEach(function (peca) {
        var a = ACERTO[peca.dataset.peca];
        var cx = parseFloat(peca.style.left); // % (veio da zona em colocar())
        var cy = parseFloat(peca.style.top);
        var rot = ((parseInt(peca.dataset.rot, 10) % 360) + 360) % 360;
        var posOk =
          cx >= a.x[0] && cx <= a.x[1] && cy >= a.y[0] && cy <= a.y[1];
        var rotOk = a.rot.indexOf(rot) !== -1;
        if (!posOk) {
          problemas.push({ peca: peca, msg: MSG_LOCAL[peca.dataset.peca] });
        } else if (!rotOk) {
          problemas.push({ peca: peca, msg: MSG_ROT[peca.dataset.peca] });
        }
      });

      if (problemas.length) {
        erros += 1;
        problemas.forEach(function (p) {
          p.peca.classList.add("is-errada");
        });
        mostrarAviso(problemas[0].msg);
        return;
      }

      sucesso();
    }

    function sucesso() {
      finalizado = true;
      venceu = true;
      pararTimer();
      limparErradas();
      limparSelecao();

      var notas = Math.max(1, 3 - erros);
      if (window.LINEU_CENARIO) {
        window.LINEU_CENARIO.registrarConclusao(2, notas);
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
      void fillEl.offsetWidth;
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
        "O tempo acabou antes de você confirmar a montagem. Isso conta como " +
          "um erro — mas dá para tentar de novo.",
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

    function limparErradas() {
      pecas.forEach(function (p) {
        p.classList.remove("is-errada");
      });
    }

    // Recomeça a tentativa sem recarregar (usado quando o tempo esgota),
    // para não zerar a contagem de erros já acumulada.
    function reiniciarTentativa() {
      pecas.forEach(function (peca) {
        devolver(peca);
        aplicarRotacao(peca, [90, 180, 270][Math.floor(Math.random() * 3)]);
      });
      limparErradas();
      limparSelecao();
      mostrarAviso("");
      overlay.hidden = true;
      finalizado = false;
      iniciarTimer();
    }

    // ---------- Ligações ----------
    girarBtn.addEventListener("click", girarSelecionada);

    confirmarBtn.addEventListener("click", confirmar);

    document.addEventListener("keydown", function (e) {
      if (finalizado) return;
      if (e.key === "r" || e.key === "R") {
        girarSelecionada();
      }
    });

    // Clique fora das peças / do tabuleiro tira a seleção.
    document.addEventListener("pointerdown", function (e) {
      if (finalizado) return;
      if (e.target.closest(".fase2__peca") || e.target.closest("#fase2-girar")) {
        return;
      }
      limparSelecao();
    });

    rejogarBtn.addEventListener("click", function () {
      if (venceu) window.location.reload();
      else reiniciarTentativa();
    });

    iniciarTimer();
  }
})();
