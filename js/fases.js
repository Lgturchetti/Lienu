// Seleção de fase do modo Cenário — Lineu
// Desenha o estado de cada nível (cadeado, notas de 0 a 3 e se o botão
// navega) a partir do progresso salvo em localStorage. A lógica de
// progresso vem de js/progresso-cenario.js (window.LINEU_CENARIO),
// carregado antes deste arquivo.
(function () {
  "use strict";

  var API = window.LINEU_CENARIO;
  if (!API) return;

  var lista = document.querySelector(".fases__lista");
  if (!lista) return;

  var MAX_NOTAS = API.MAX_NOTAS;

  function render() {
    var estado = API.getEstado();

    API.NIVEIS.forEach(function (nivel) {
      var item = document.querySelector('.fases__item[data-nivel="' + nivel + '"]');
      if (!item) return;

      var cadeado = item.querySelector(".fases__cadeado");
      var botao = item.querySelector(".fases__btn");
      var notas = item.querySelector(".fases__notas");

      var liberado = API.nivelLiberado(nivel);
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
  lista.addEventListener("click", function (e) {
    var botao = e.target.closest(".fases__btn");
    if (botao && botao.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
    }
  });

  render();
})();
