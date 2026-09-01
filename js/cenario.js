// Modo Cenário — Lineu
// Nível 1: montagem de cabines sanitárias (arrastar e soltar).
// Nível 2: montagem de um banheiro acessível (arrastar + girar as peças).
// Nível 3: montagem de um banheiro público em L com um box acessível
//          (arrastar + girar + alternar a abertura das portas).
// O progresso vem de js/progresso-cenario.js (window.LINEU_CENARIO).
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var nivel = parseInt(params.get("nivel"), 10);
  if (!(nivel >= 1 && nivel <= 3)) nivel = 1;

  var fase1El = document.getElementById("fase1");
  var fase2El = document.getElementById("fase2");
  var fase3El = document.getElementById("fase3");

  if (nivel === 2) {
    fase2El.hidden = false;
    iniciarFase2();
    return;
  }

  if (nivel === 3) {
    fase3El.hidden = false;
    iniciarFase3();
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

  // ================================================================
  // Fase 3 — banheiro público em L com box acessível
  // (arrastar + girar, igual à Fase 2, + alternar abertura das portas)
  // ================================================================
  function iniciarFase3() {
    var TEMPO_MS = 180000; // 180s — é a maior montagem

    var NORMA_TEXTO =
      "Num banheiro público, pelo menos um box precisa ser acessível — a NBR 9050 " +
      "pede o maior. Dentro dele tem que caber um círculo de manobra de 1,50 m e, ao " +
      "lado da bacia, a área de transferência de quem usa cadeira de rodas; por isso " +
      "o vaso fica deslocado para um canto. As barras de apoio formam um L: uma na " +
      "parede do fundo, atrás da bacia, e outra na parede lateral vizinha. O lavatório " +
      "acessível fica dentro do próprio box, sem coluna. E a porta do box acessível " +
      "abre para FORA (ou é de correr): abrindo para dentro, ela engoliria a área de " +
      "manobra. Os boxes comuns podem abrir para dentro, e os lavatórios comuns ficam " +
      "na parede da área de circulação.";

    var tabuleiro = document.getElementById("fase3-tabuleiro");
    var bandeja = document.getElementById("fase3-bandeja");
    var girarBtn = document.getElementById("fase3-girar");
    var aberturaBtn = document.getElementById("fase3-abertura");
    var confirmarBtn = document.getElementById("fase3-confirmar");
    var avisoEl = document.getElementById("fase3-aviso");
    var fillEl = document.getElementById("fase3-tempo-fill");
    var overlay = document.getElementById("fase3-overlay");
    var overlayTitulo = document.getElementById("fase3-overlay-titulo");
    var overlayTexto = document.getElementById("fase3-overlay-texto");
    var overlayNotas = document.getElementById("fase3-overlay-notas");
    var rejogarBtn = document.getElementById("fase3-rejogar");

    var pecas = Array.prototype.slice.call(
      document.querySelectorAll(".fase3__peca")
    );

    // Zonas de encaixe (imantam a peça), em % da planta (571×522).
    var ZONAS = [
      { id: "vaso-esq", x: 29, y: 13 },
      { id: "vaso-meio", x: 57, y: 12 },
      { id: "vaso-dir", x: 85, y: 12 },
      { id: "barra-fundo", x: 24, y: 7 },
      { id: "barra-lateral", x: 40, y: 24 },
      { id: "pia-acess", x: 37, y: 44 },
      { id: "pia-com-a", x: 57, y: 92 },
      { id: "pia-com-b", x: 80, y: 92 },
      { id: "porta-esq", x: 13, y: 62 },
      { id: "porta-meio", x: 60, y: 38 },
      { id: "porta-dir", x: 85, y: 38 },
    ];

    // Largura de encaixe por peça, % da planta — TEM que bater com o CSS.
    var TAMANHOS = {
      vaso: 15,
      "pia-acessivel": 11,
      pia: 17,
      "barra-fundo": 26,
      "barra-lateral": 3.2,
      porta: 22,
    };

    // "Encostada na parede", tanto faz o lado dos suportes.
    var ROT_PAREDE = [0, 180];

    // Requisitos da resposta: cada um precisa ser satisfeito por ALGUMA peça
    // do tipo certo, com o centro (%) dentro da faixa e rotação/abertura ok.
    var REQUISITOS = [
      { tipo: "vaso", x: [4, 42], y: [2, 27], rot: [0],
        falta: "Falta o vaso do box acessível, encostado na parede do fundo." },
      { tipo: "vaso", x: [44, 71], y: [2, 24], rot: [0],
        falta: "Falta o vaso do box do meio, encostado na parede do fundo." },
      { tipo: "vaso", x: [72, 99], y: [2, 24], rot: [0],
        falta: "Falta o vaso do box da direita, encostado na parede do fundo." },
      { tipo: "barra-fundo", x: [6, 44], y: [0, 16], rot: ROT_PAREDE,
        falta: "A barra do fundo vai na parede atrás da bacia do box acessível." },
      { tipo: "barra-lateral", x: [30, 47], y: [6, 40], rot: ROT_PAREDE,
        falta: "A barra em L vai na parede lateral do box acessível, ao lado da bacia." },
      { tipo: "pia-acessivel", x: [22, 47], y: [26, 55], rot: ROT_PAREDE,
        falta: "O lavatório acessível fica DENTRO do box acessível, na lateral." },
      { tipo: "pia", x: [42, 72], y: [76, 100], rot: ROT_PAREDE,
        falta: "Faltam os lavatórios comuns na parede da área comum." },
      { tipo: "pia", x: [70, 100], y: [76, 100], rot: ROT_PAREDE,
        falta: "Faltam os lavatórios comuns na parede da área comum." },
      { tipo: "porta", x: [2, 30], y: [46, 84], abertura: "fora",
        falta: "Falta a porta do box acessível.",
        aberturaMsg: "A porta do box acessível precisa abrir para FORA — abrindo para dentro, ocuparia a área de manobra." },
      { tipo: "porta", x: [45, 74], y: [24, 54], abertura: "dentro",
        falta: "Falta a porta do box do meio.",
        aberturaMsg: "O box comum do meio abre a porta para dentro." },
      { tipo: "porta", x: [72, 100], y: [24, 54], abertura: "dentro",
        falta: "Falta a porta do box da direita.",
        aberturaMsg: "O box comum da direita abre a porta para dentro." },
    ];

    var MSG_ROT = {
      vaso: "Gire o vaso até a caixa de descarga encostar na parede do fundo.",
      "barra-fundo": "A barra do fundo precisa ficar deitada, rente à parede.",
      "barra-lateral": "A barra em L precisa ficar em pé, rente à parede lateral.",
      "pia-acessivel": "Gire o lavatório acessível até ele encostar na parede.",
      pia: "Gire o lavatório até ele encostar na parede.",
    };
    var MSG_FORA =
      "Essa peça não está num lugar previsto — arraste-a para onde ela deve ficar.";

    // Como cada zona de porta desenha a porta conforme a abertura escolhida.
    // Como cada zona de porta desenha a porta conforme a abertura escolhida:
    // { img, rot (graus), flipX/flipY }. A folha da porta (retângulo azul)
    // fica sempre na parede; a abertura muda só o lado do arco (a varredura).
    var PORTA_RENDER = {
      "porta-esq": {
        fora: { img: "fora", rot: 0 },
        dentro: { img: "fora", rot: 0, flipY: true },
      },
      "porta-meio": {
        dentro: { img: "fora", rot: 180 },
        fora: { img: "fora", rot: 180, flipY: true },
      },
      "porta-dir": {
        dentro: { img: "fora", rot: 180 },
        fora: { img: "fora", rot: 180, flipY: true },
      },
    };

    var erros = 0;
    var finalizado = false;
    var venceu = false;
    var selecionada = null;
    var avisoTimer = null;
    var prazoTimer = null;

    // ---------- Zonas ----------
    var zonaEls = ZONAS.map(function (z) {
      var el = document.createElement("div");
      el.className = "fase3__zona";
      if (z.id.indexOf("porta") === 0) el.classList.add("fase3__zona--porta");
      el.dataset.zona = z.id;
      el.style.left = z.x + "%";
      el.style.top = z.y + "%";
      tabuleiro.appendChild(el);
      return el;
    });

    // Legenda "abre p/ dentro / fora" logo abaixo de cada porta encaixada.
    var LEGENDA_POS = {
      "porta-esq": { x: 14, y: 84 },
      "porta-meio": { x: 60, y: 54 },
      "porta-dir": { x: 85, y: 54 },
    };
    var legendaEls = {};
    Object.keys(LEGENDA_POS).forEach(function (id) {
      var el = document.createElement("div");
      el.className = "fase3__porta-legenda";
      el.style.left = LEGENDA_POS[id].x + "%";
      el.style.top = LEGENDA_POS[id].y + "%";
      el.hidden = true;
      tabuleiro.appendChild(el);
      legendaEls[id] = el;
    });

    function atualizarLegendas() {
      Object.keys(legendaEls).forEach(function (id) {
        var porta = ocupanteDaZona(id);
        var el = legendaEls[id];
        if (porta) {
          el.textContent =
            porta.dataset.abertura === "fora" ? "Abre p/ fora" : "Abre p/ dentro";
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
    }

    function centroZona(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function zonaMaisProxima(x, y, exigirDentro) {
      if (exigirDentro) {
        var rt = tabuleiro.getBoundingClientRect();
        var folga = 30;
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
        '.fase3__peca.is-colocada[data-zona="' + id + '"]'
      );
    }

    function larguraArrasto(peca) {
      var bw = tabuleiro.getBoundingClientRect().width;
      return (bw * (TAMANHOS[peca.dataset.peca] || 15)) / 100;
    }

    function ehPorta(peca) {
      return peca.dataset.peca === "porta";
    }

    // ---------- Rotação / render ----------
    function aplicarRotacao(peca, graus) {
      var g = ((graus % 360) + 360) % 360;
      peca.dataset.rot = String(g);
      renderTransform(peca);
    }

    function renderTransform(peca) {
      var rot = "rotate(" + peca.dataset.rot + "deg)";
      var centrado =
        peca.classList.contains("is-colocada") ||
        peca.classList.contains("is-arrastando");
      peca.style.transform = centrado ? "translate(-50%, -50%) " + rot : rot;
    }

    // Porta: a imagem e a rotação vêm da zona + abertura escolhida. Fora de
    // uma zona (bandeja / arrasto) mostra a imagem da abertura atual.
    function renderPorta(peca) {
      var img = peca.querySelector("img");
      var abertura = peca.dataset.abertura || "dentro";
      var zona = peca.dataset.zona;
      if (peca.classList.contains("is-colocada") && PORTA_RENDER[zona]) {
        var cfg = PORTA_RENDER[zona][abertura];
        img.src = "assets/img/f3-porta-" + cfg.img + ".png";
        var g = ((((cfg.rot || 0) % 360) + 360) % 360);
        peca.dataset.rot = String(g);
        var sx = cfg.flipX ? -1 : 1;
        var sy = cfg.flipY ? -1 : 1;
        peca.style.transform =
          "translate(-50%, -50%) rotate(" + g + "deg) scale(" + sx + ", " + sy + ")";
      } else {
        img.src = "assets/img/f3-porta-" + abertura + ".png";
        renderTransform(peca);
      }
    }

    function render(peca) {
      if (ehPorta(peca)) renderPorta(peca);
      else renderTransform(peca);
    }

    // ---------- Seleção / botões contextuais ----------
    function selecionar(peca) {
      if (selecionada && selecionada !== peca) {
        selecionada.classList.remove("is-selecionada");
      }
      selecionada = peca;
      peca.classList.add("is-selecionada");
      var porta = ehPorta(peca);
      girarBtn.disabled = porta;
      aberturaBtn.disabled = !porta;
    }
    function limparSelecao() {
      if (selecionada) selecionada.classList.remove("is-selecionada");
      selecionada = null;
      girarBtn.disabled = true;
      aberturaBtn.disabled = true;
    }
    function girarSelecionada() {
      if (finalizado || !selecionada || ehPorta(selecionada)) return;
      aplicarRotacao(selecionada, parseInt(selecionada.dataset.rot, 10) + 90);
      limparErradas();
      mostrarAviso("");
    }
    function alternarAbertura() {
      if (finalizado || !selecionada || !ehPorta(selecionada)) return;
      selecionada.dataset.abertura =
        selecionada.dataset.abertura === "fora" ? "dentro" : "fora";
      renderPorta(selecionada);
      atualizarLegendas();
      limparErradas();
      mostrarAviso("");
    }

    // ---------- Arrastar ----------
    pecas.forEach(function (peca) {
      // Fase 3: rotação inicial aleatória (pode até já estar certa).
      aplicarRotacao(peca, [0, 90, 180, 270][Math.floor(Math.random() * 4)]);
      if (ehPorta(peca)) renderPorta(peca);
      peca._casa = peca.parentNode;
      ligarPeca(peca);
    });

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
        render(peca);
        try {
          peca.setPointerCapture(estado.id);
        } catch (err) {}
      }

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
      render(peca);
      tabuleiro.appendChild(peca);
      atualizarLegendas();
    }

    function devolver(peca) {
      limparInline(peca);
      peca.classList.remove("is-colocada", "is-arrastando", "is-errada");
      delete peca.dataset.zona;
      render(peca);
      (peca._casa || bandeja).appendChild(peca);
      atualizarLegendas();
    }

    function limparInline(peca) {
      peca.style.position = "";
      peca.style.left = "";
      peca.style.top = "";
      peca.style.width = "";
      peca.style.margin = "";
      peca.style.pointerEvents = "";
    }

    // ---------- Validação (por requisitos) ----------
    function tudoColocado() {
      return pecas.every(function (p) {
        return !!p.dataset.zona;
      });
    }
    function centroPeca(p) {
      return {
        x: parseFloat(p.style.left),
        y: parseFloat(p.style.top),
        rot: ((parseInt(p.dataset.rot, 10) % 360) + 360) % 360,
      };
    }
    function naFaixa(v, faixa) {
      return v >= faixa[0] && v <= faixa[1];
    }

    function confirmar() {
      if (finalizado) return;
      if (!tudoColocado()) {
        mostrarAviso("Encaixe todas as peças dentro da planta.");
        return;
      }

      var usadas = [];
      var problemas = [];

      REQUISITOS.forEach(function (req) {
        var naRegiao = pecas.filter(function (p) {
          if (usadas.indexOf(p) !== -1) return false;
          if (p.dataset.peca !== req.tipo) return false;
          var c = centroPeca(p);
          return naFaixa(c.x, req.x) && naFaixa(c.y, req.y);
        });

        var perfeita = naRegiao.filter(function (p) {
          var c = centroPeca(p);
          if (req.rot && req.rot.indexOf(c.rot) === -1) return false;
          if (req.abertura && p.dataset.abertura !== req.abertura) return false;
          return true;
        })[0];

        if (perfeita) {
          usadas.push(perfeita);
          return;
        }
        if (naRegiao.length) {
          var p = naRegiao[0];
          usadas.push(p);
          if (req.abertura && p.dataset.abertura !== req.abertura) {
            problemas.push({ peca: p, msg: req.aberturaMsg });
          } else {
            problemas.push({ peca: p, msg: MSG_ROT[req.tipo] || req.falta });
          }
          return;
        }
        problemas.push({ peca: null, msg: req.falta });
      });

      pecas.forEach(function (p) {
        if (usadas.indexOf(p) === -1) {
          problemas.push({ peca: p, msg: MSG_FORA });
        }
      });

      if (problemas.length) {
        erros += 1;
        problemas.forEach(function (pr) {
          if (pr.peca) pr.peca.classList.add("is-errada");
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
        window.LINEU_CENARIO.registrarConclusao(3, notas);
      }
      var extra =
        notas >= 3
          ? " Você fechou o modo Cenário com nota máxima!"
          : " Gabarite esta fase (3 notas) para fechar tudo com nota máxima.";
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
      }, 5000);
    }
    function limparErradas() {
      pecas.forEach(function (p) {
        p.classList.remove("is-errada");
      });
    }
    function reiniciarTentativa() {
      pecas.forEach(function (peca) {
        peca.dataset.abertura = "dentro";
        devolver(peca);
        aplicarRotacao(peca, [0, 90, 180, 270][Math.floor(Math.random() * 4)]);
        if (ehPorta(peca)) renderPorta(peca);
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
    aberturaBtn.addEventListener("click", alternarAbertura);
    confirmarBtn.addEventListener("click", confirmar);

    document.addEventListener("keydown", function (e) {
      if (finalizado) return;
      if (e.key === "r" || e.key === "R") girarSelecionada();
    });
    document.addEventListener("pointerdown", function (e) {
      if (finalizado) return;
      if (e.target.closest(".fase3__peca") || e.target.closest(".fase3__acoes")) {
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
