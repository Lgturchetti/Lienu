// Progresso do modo Cenário — Lineu
// Lógica pura (sem DOM) de leitura/gravação do progresso em localStorage.
// Carregado por fases.html (antes de js/fases.js) e por cenario.html
// (antes de js/cenario.js). Expõe window.LINEU_CENARIO.
//
// Progressão: o Nível 1 começa liberado; o Nível N (2, 3) só desbloqueia
// quando o nível anterior foi GABARITADO (as 3 notas). Terminar a fase
// com 1 ou 2 notas conclui, mas não libera a seguinte.
(function () {
  "use strict";

  var STORAGE_KEY = "lineu:cenario";
  var NIVEIS = [1, 2, 3];
  var MAX_NOTAS = 3;

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
    nivel = Number(nivel);
    if (nivel <= 1) return true;
    return estado.notas[nivel - 1] >= MAX_NOTAS;
  }

  window.LINEU_CENARIO = {
    MAX_NOTAS: MAX_NOTAS,
    NIVEIS: NIVEIS.slice(),

    getEstado: function () {
      return lerEstado();
    },

    nivelLiberado: function (nivel) {
      return nivelLiberado(lerEstado(), nivel);
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
})();
