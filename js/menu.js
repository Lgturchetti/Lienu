// Menu principal — Lineu
// Controla os pop-ups do menu ("Regras" e "Sobre"): cada um abre pelo seu
// botão e fecha de três jeitos — no X, clicando fora da caixa ou apertando Esc.
(function () {
  "use strict";

  // Cada item liga um botão que abre a um overlay de pop-up.
  var popups = [
    { botao: "btn-regras", overlay: "regras", fechar: "regras-fechar" },
    { botao: "btn-sobre", overlay: "sobre", fechar: "sobre-fechar" }
  ];

  function ligar(config) {
    var botaoAbrir = document.getElementById(config.botao);
    var overlay = document.getElementById(config.overlay);
    if (!botaoAbrir || !overlay) return;

    var botaoFechar = document.getElementById(config.fechar);
    var caixa = overlay.querySelector(".regras__caixa");

    function onKeydown(e) {
      if (e.key === "Escape" || e.key === "Esc") fechar();
    }

    function abrir() {
      overlay.hidden = false;
      document.addEventListener("keydown", onKeydown);
      botaoFechar.focus();
    }

    function fechar() {
      overlay.hidden = true;
      document.removeEventListener("keydown", onKeydown);
      botaoAbrir.focus();
    }

    botaoAbrir.addEventListener("click", abrir);
    botaoFechar.addEventListener("click", fechar);

    // Clique no overlay (fora da caixa) fecha; clique dentro da caixa, não.
    overlay.addEventListener("click", function (e) {
      if (!caixa.contains(e.target)) fechar();
    });
  }

  for (var i = 0; i < popups.length; i++) ligar(popups[i]);
})();
