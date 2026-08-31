# Lineu

> Jogue com quem segue as normas!

Jogo educativo em navegador sobre normas técnicas de arquitetura e projeto.
O jogador responde perguntas sobre medidas, dimensionamentos e boas práticas
previstas em norma e recebe feedback imediato a cada resposta.

## Tecnologia

Site 100% estático — HTML, CSS e JavaScript puro. Sem build, sem dependências,
sem framework.

## Como rodar

Servir a pasta com qualquer servidor estático e abrir `index.html`:

```bash
python3 -m http.server
# abra http://localhost:8000
```

Abrir o arquivo direto pelo `file://` quase funciona, mas a transição
animada entre páginas (View Transitions API) só é ativada via HTTP.

## Fluxo

`index.html` (abertura) → `menu.html` (menu) → `jogar.html` (escolha de modo)
→ `quiz.html` (quiz) → volta ao menu.

Modos "Cenário" e as opções "Regras", "Sair" e "Sobre" ainda não foram
implementados.

## Estrutura

```
index.html      splash / abertura
menu.html       menu principal
jogar.html      escolha de modo (Quiz / Cenário)
quiz.html       tela do quiz
css/style.css   todo o estilo do projeto
js/
  main.js       lógica da splash
  questions.js  banco de perguntas do quiz
  quiz.js       lógica do quiz (timer, embaralhamento, resultado)
assets/
  img/          fundos, logo, moldura do timer
  fonts/        Garet Book / Garet Heavy
```

## Editar as perguntas

Todas as perguntas do quiz ficam em [`js/questions.js`](js/questions.js).
Cada pergunta é um objeto com o texto, a lista de alternativas e o índice
da correta. As alternativas são embaralhadas automaticamente a cada partida.
