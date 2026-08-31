// Seleção de fase do modo Cenário — Lineu
// Desenha o estado de cada nível (cadeado, notas de 0 a 3 e se o botão
// navega) a partir do progresso salvo em localStorage, e expõe uma API
// simples pro jogo do cenário registrar a conclusão de um nível.
//
// Progressão: o Nível 1 começa liberado; o Nível N (2, 3) só desbloqueia
// quando o nível anterior foi concluído com pelo menos 1 nota.
(function () {
  "use strict";

  var STORAGE_KEY = "lineu:cenario";
  var NIVEIS = [1, 2, 3];
  var MAX_NOTAS = 3;

  // ---------- Persistência ----------

  // Estado no localStorage: { "notas": { "1": 0..3, "2": 0..3, "3": 0..3 } }
  // notas[n] === 0 significa "ainda não concluído".
  function lerEstado() {
    var vazio = { notas: { 1: 0, 2: 0, 3: 0 } };
    try {
      var bruto = window.localStorage.getItem(STORAGE_KEY);
      if (!bruto) return vazio;
      var dados = JSON.parse(bruto);
      if (!dados || typeof dados !== "object" || !dados.notas) return vazio;
      for (var i = 0; i < NIVEIS.length; i++) {
        var n = NIVEIS[i];
        var v = Number(dados.notas[n]);
        vazio.notas[n] = isFinite(v) ? Math.max(0, Math.min(MAX_NOTAS, v)) : 0;
      }
      return vazio;
    } catch (e) {
      return vazio;
    }
  }

  function salvarEstado(estado) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
      /* localStorage indisponível (aba privada, etc.) — segue sem salvar */
    }
  }

  function nivelLiberado(estado, nivel) {
    if (nivel <= 1) return true;
    return estado.notas[nivel - 1] >= 1;
  }

  // ---------- Render ----------

  function render() {
    var estado = lerEstado();

    NIVEIS.forEach(function (nivel) {
      var item = document.querySelector('.fases__item[data-nivel="' + nivel + '"]');
      if (!item) return;

      var cadeado = item.querySelector(".fases__cadeado");
      var botao = item.querySelector(".fases__btn");
      var notas = item.querySelector(".fases__notas");

      var liberado = nivelLiberado(estado, nivel);
      var qtdNotas = estado.notas[nivel] || 0;

      item.classList.toggle("fases__item--bloqueado", !liberado);

      cadeado.src = liberado
        ? "assets/img/cadeado-desbloqueado.png"
        : "assets/img/cadeado-bloqueado.png";

      notas.src = "assets/img/nota-" + qtdNotas + ".png";
      notas.alt =
        qtdNotas === 0
          ? "Nenhuma nota conquistada"
          : qtdNotas + " de " + MAX_NOTAS + " notas conquistadas";

      if (liberado) {
        botao.setAttribute("href", "cenario.html?nivel=" + nivel);
        botao.removeAttribute("aria-disabled");
        botao.removeAttribute("tabindex");
      } else {
        // Sem href: continua sendo <a> (não dispara a View Transition, mas
        // também não navega). aria-disabled + tabindex tiram do fluxo.
        botao.removeAttribute("href");
        botao.setAttribute("aria-disabled", "true");
        botao.setAttribute("tabindex", "-1");
      }
    });
  }

  // Bloqueia clique/Enter em nível travado, mesmo que algo devolva o href.
  document.querySelector(".fases__lista").addEventListener("click", function (e) {
    var botao = e.target.closest(".fases__btn");
    if (botao && botao.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
    }
  });

  // ---------- API pro jogo do cenário ----------
  // Ex.: window.LINEU_CENARIO.registrarConclusao(1, 3)
  window.LINEU_CENARIO = {
    MAX_NOTAS: MAX_NOTAS,

    getEstado: function () {
      return lerEstado();
    },

    // Registra a conclusão de um nível guardando a melhor nota já feita.
    registrarConclusao: function (nivel, notas) {
      nivel = Number(nivel);
      if (NIVEIS.indexOf(nivel) === -1) return;
      var qtd = Math.max(1, Math.min(MAX_NOTAS, Number(notas) || 1));
      var estado = lerEstado();
      if (qtd > estado.notas[nivel]) {
        estado.notas[nivel] = qtd;
        salvarEstado(estado);
      }
    },

    // Zera todo o progresso do modo cenário.
    resetar: function () {
      salvarEstado({ notas: { 1: 0, 2: 0, 3: 0 } });
    },
  };

  render();
})();
