// Placeholder do modo Cenário — Lineu
// Só lê o nível da query string (?nivel=N) e mostra no título. O jogo
// ainda não existe; quando existir, é aqui que ele deve começar.
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var nivel = parseInt(params.get("nivel"), 10);
  if (!(nivel >= 1 && nivel <= 3)) nivel = 1;

  var titulo = document.getElementById("cenario-title");
  if (titulo) titulo.textContent = "Cenário — Nível " + nivel;
})();
