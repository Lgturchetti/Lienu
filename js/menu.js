// Liga os botões com [data-action] às páginas de destino.
// Conforme as próximas páginas forem criadas, é só adicionar a rota aqui.
(function () {
  const rotas = {
    jogar: "jogar.html",
    // regras: "regras.html",
    // sobre: "sobre.html",
    // sair: "index.html",
    // quiz: "quiz.html",
    // cenario: "cenario.html",
  };

  document.querySelectorAll("[data-action]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const destino = rotas[botao.dataset.action];
      if (destino) {
        window.location.href = destino;
      }
    });
  });
})();