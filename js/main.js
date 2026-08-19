// Splash screen: clique/toque já navegam sozinhos, porque são um <a href>
// real cobrindo a tela (necessário pra "view transition" disparar — o
// navegador só anima navegações que reconhece como reais, não as feitas
// via JS/location.href). Pra tecla, simulamos um clique nesse mesmo link.
(function () {
  const link = document.querySelector(".splash__link");
  if (!link) return;
 
  window.addEventListener(
    "keydown",
    function () {
      link.click();
    },
    { once: true }
  );
})();
 