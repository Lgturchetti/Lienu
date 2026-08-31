// Perguntas do Quiz — Lineu
//
// Coloque as perguntas oficiais aqui. Cada pergunta é um objeto:
//
//   {
//     question: "Texto da pergunta",
//     answers: [
//       "Alternativa 1",
//       "Alternativa 2",
//       "Alternativa 3",
//       "Alternativa 4",
//     ],
//     correct: 0,   // índice (0-based) da alternativa correta no array acima
//   }
//
// Observações:
// - As alternativas são embaralhadas automaticamente a cada rodada
//   (js/quiz.js), então a ordem aqui não importa — só o índice em "correct".
// - Pode ter 2, 3 ou 4 alternativas; o layout se ajusta sozinho.
// - As perguntas abaixo são de teste (placeholder) até entrarem as oficiais.

window.LINEU_QUESTIONS = [
  {
    question: "Qual o tamanho mínimo da planta de um banheiro?",
    answers: [
      "2,10 de largura X 1,90 de profundidade",
      "1,50 de largura X 1,70 de profundidade",
      "1,60 de largura X 1,90 de profundidade",
      "1,70 de largura X 2,10 de profundidade",
    ],
    correct: 0,
  },
  {
    question:
      "Qual a medida mínima entre o final do vaso sanitário e a porta do banheiro (fechada)?",
    answers: [
      "85 cm de distância",
      "70 cm de distância",
      "65 cm de distância",
      "60 cm de distância",
    ],
    correct: 1,
  },
  {
    question: "Qual a altura recomendada para instalação do vaso sanitário?",
    answers: ["40 cm", "43 cm", "46 cm", "50 cm"],
    correct: 1,
  },
];
