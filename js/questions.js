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
// - A cada rodada o quiz sorteia 8 perguntas deste banco (js/quiz.js,
//   QUESTION_COUNT).

window.LINEU_QUESTIONS = [
  {
    question: "Qual o tamanho mínimo da planta de um banheiro?",
    answers: [
      "1,50 de largura X 1,70 de profundidade",
      "2,10 de largura X 1,90 de profundidade",
      "1,60 de largura X 1,90 de profundidade",
      "1,70 de largura X 2,10 de profundidade",
    ],
    correct: 0,
  },
  {
    question:
      "Em lavatórios do tipo calha, quantos cm são considerados uma unidade?",
    answers: [
      "30 cm corresponde a uma unidade",
      "40 cm corresponde a uma unidade",
      "50 cm corresponde a uma unidade",
      "60 cm corresponde a uma unidade",
    ],
    correct: 3,
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
    correct: 3,
  },
  {
    question:
      "Em mictórios tipo calha, sem anteparo, quantos cm serão considerados uma unidade?",
    answers: ["a cada 50 cm", "a cada 60 cm", "a cada 70 cm", "a cada 80 cm"],
    correct: 3,
  },
  {
    question:
      "Em mictórios tipo calha, com anteparo, qual a medida mínima para cada unidade?",
    answers: [
      "50 cm cada unidade",
      "60 cm cada unidade",
      "70 cm cada unidade",
      "80 cm cada unidade",
    ],
    correct: 1,
  },
  {
    question:
      "Segundo a NR 24, qual a proporção mínima de lavatórios em sanitários coletivos em condições normais de trabalho?",
    answers: [
      "1 lavatório para cada 30 trabalhadores",
      "1 lavatório para cada 20 trabalhadores",
      "1 lavatório para cada 10 trabalhadores",
      "1 lavatório para cada 50 trabalhadores",
    ],
    correct: 1,
  },
  {
    question:
      "Qual a proporção mínima de lavatórios em sanitários coletivos em atividades com manipulação de materiais infectantes, tóxicos, irritantes ou que gerem poeiras?",
    answers: [
      "1 lavatório para cada 30 trabalhadores",
      "1 lavatório para cada 20 trabalhadores",
      "1 lavatório para cada 10 trabalhadores",
      "1 lavatório para cada 50 trabalhadores",
    ],
    correct: 2,
  },
  {
    question:
      "Qual é a exigência mínima de mictórios em sanitários masculinos coletivos?",
    answers: [
      "1 mictório para cada 50 trabalhadores",
      "1 mictório para cada 20 trabalhadores",
      "1 mictório para cada 10 trabalhadores",
      "1 mictório para cada 30 trabalhadores",
    ],
    correct: 1,
  },
  {
    question:
      "A NBR 9050 estabelece áreas de manobra para cadeira de rodas. Qual é o diâmetro mínimo exigido para giro de 180° em frente à bacia sanitária?",
    answers: ["1,20 m", "1,50 m", "1,80 m", "2,00 m"],
    correct: 1,
  },
  {
    question:
      "Qual é a largura mínima de porta para entrada em sanitário acessível?",
    answers: ["70 cm", "80 cm", "90 cm", "100 cm"],
    correct: 1,
  },
  {
    question: "A NR 24 define que os sanitários devem ter ventilação:",
    answers: [
      "Apenas natural, obrigatoriamente",
      "Apenas mecânica, obrigatoriamente",
      "Natural e/ou mecânica, de forma eficiente",
      "Não há exigência de ventilação específica",
    ],
    correct: 2,
  },
  {
    question: "Segundo a NR 24, os pisos dos sanitários devem ser:",
    answers: [
      "De material rugoso, absorvente e antiderrapante",
      "De material liso, absorvente e lavável",
      "De material impermeável, lavável e antiderrapante",
      "De qualquer material, desde que nivelado",
    ],
    correct: 2,
  },
  {
    question:
      "De acordo com a NBR 9050, a largura mínima de boxe acessível (sanitário PCD) deve ser:",
    answers: ["1,20 m", "1,50 m", "1,80 m", "2,00 m"],
    correct: 1,
  },
  {
    question: "Conforme a NR 24, os sanitários devem ser providos de:",
    answers: [
      "Espelhos, suportes para toalhas e bebedouros",
      "Papel higiênico, sabonete e toalhas (ou secagem adequada)",
      "Armários individuais para trabalhadores",
      "Iluminação de emergência obrigatória",
    ],
    correct: 1,
  },
  {
    question:
      "O acionamento das descargas acessíveis deve ser instalado a uma altura entre:",
    answers: [
      "60 cm e 80 cm do piso",
      "80 cm e 100 cm do piso",
      "100 cm e 120 cm do piso",
      "120 cm e 140 cm do piso",
    ],
    correct: 1,
  },
  {
    question:
      "De acordo com a NR 24, sanitários de uso coletivo devem ser separados por:",
    answers: [
      "Setores de atividade",
      "Função do trabalhador",
      "Sexo",
      "Tipo de vestimenta utilizada",
    ],
    correct: 2,
  },
  {
    question: "As portas de boxes acessíveis devem abrir:",
    answers: [
      "Sempre para dentro, para otimizar espaço",
      "Sempre para fora, para facilitar o resgate",
      "Livre escolha do projetista",
      "Com sistema de correr obrigatoriamente",
    ],
    correct: 1,
  },
  {
    question:
      "Em banheiros acessíveis, a área de aproximação lateral para transferência da cadeira de rodas à bacia sanitária deve ter largura mínima de:",
    answers: ["0,70 m", "0,80 m", "0,90 m", "1,00 m"],
    correct: 1,
  },
];
