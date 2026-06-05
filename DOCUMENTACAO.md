# Caminho do Pinguim: Fuga ao Gelo Derretido
## Documentação do Projeto

---

# MANUAL DO UTILIZADOR

## Como Jogar

### Objetivo
Controlas o pinguim **Polo**, que precisa de atravessar plataformas de gelo instáveis para chegar à **colónia segura** (o iglu verde) no fim de cada nível. O percurso torna-se mais perigoso à medida que a temperatura sobe e o gelo derrete.

---

### Ecrã Inicial
Quando abres o jogo, aparece o **ecrã de introdução** com:
- Um vídeo explicativo sobre alterações climáticas (se o ficheiro `assets/intro.mp4` estiver disponível).
- A história do pinguim Polo.
- O objetivo e os controlos.
- O teu recorde pessoal guardado.

Clica em **"Começar a Jogar"** para iniciar.

---

### Controlos

| Tecla | Ação |
|---|---|
| `A` ou `←` | Mover para a esquerda |
| `D` ou `→` | Mover para a direita |
| `Espaço` ou `↑` | Saltar |
| `H` | Abrir/fechar ajuda (pausa o jogo) |
| `M` | Ligar/desligar o som |
| `R` | Reiniciar o nível atual |
| `Escape` | Fechar o painel de ajuda |

---

### Como Avançar
1. **Salta** de plataforma em plataforma usando `Espaço` ou `↑`.
2. **Move-te** para a esquerda ou direita com `A/D` ou as setas.
3. Recolhe os **flocos de neve** (❄️) que flutuam sobre as plataformas — cada um vale **+10 pontos** e reduz a temperatura em **8°C**.
4. Chega ao **iglu verde** no fim do nível para ganhar **+100 pontos bónus**.

---

### O que Deves Evitar
- **Cair na água** — o pinguim perde o jogo.
- Deixar a **temperatura atingir 100°C** — o gelo derrete completamente e perdes.
- Ficar demasiado tempo numa plataforma que está a derreter — ela encolhe e desaparece.

---

### Painel de Informações (HUD)
No topo do ecrã podes ver:

- **Nível** — o nível atual.
- **Pontos** (⭐) — a tua pontuação atual.
- **Recorde** (🏆) — o teu melhor resultado guardado.
- **Temperatura** (🌡️) — barra que vai do verde ao vermelho. Quanto mais alta, mais depressa o gelo derrete.
- **Progresso** (📍) — barra que mostra quão perto estás da colónia.
- **Botão de Ajuda** (❓) — abre o painel de ajuda e pausa o jogo.
- **Botão de Som** (🔊/🔇) — liga ou desliga todos os sons.

---

### Sistema de Temperatura
- A temperatura **sobe automaticamente** com o tempo.
- Quando a barra de temperatura está na **zona vermelha** (acima de 75%), aparece um aviso e as plataformas derretem **muito mais depressa**.
- Cada floco de neve recolhido **baixa a temperatura em 8°C**.
- Se a temperatura atingir **100°C**, o jogo termina em derrota.

---

### Plataformas de Gelo
- Cada plataforma tem uma **barra de saúde** que aparece quando está prestes a derreter (abaixo de 80% de vida).
  - **Verde** → plataforma sólida.
  - **Amarelo** → a derreter.
  - **Vermelho** → prestes a desaparecer.
- Quando a vida chega a zero, a plataforma **desaparece**.
- As plataformas no início e no fim do nível são **fixas** e nunca derretem.
- Quando uma plataforma está muito danificada, aparecem **rachas no gelo**.

---

### Fim de Jogo
- **Vitória** 🎉 — chegaste à colónia! Recebes os pontos bónus.
- **Derrota** 💧 — caíste na água ou a temperatura chegou ao máximo.

No ecrã de fim de jogo podes:
- Ver a tua pontuação e o recorde atual.
- Clicar em **"Jogar Novamente"** para reiniciar.
- Clicar em **"Menu Principal"** para voltar ao início.

---

### Dicas Estratégicas
- Mantém-te sempre em **movimento** — ficar parado numa plataforma acelera o seu derretimento.
- Recolhe **flocos de neve** sempre que possível para controlar a temperatura.
- Planeia os saltos com antecedência — as plataformas ficam cada vez mais pequenas e afastadas à medida que avanças.
- Usa a **barra de progresso** para saber quanto falta para a colónia.
- Se a temperatura estiver alta, prioriza os flocos antes de avançar.

---

---

# EXPLICAÇÃO PARA RELATÓRIO

## Visão Geral do Projeto

**Caminho do Pinguim: Fuga ao Gelo Derretido** é um jogo 2D de plataformas implementado com tecnologias web nativas: HTML5, CSS3 e JavaScript puro, sem bibliotecas externas. O elemento central é o `<canvas>` HTML5, sobre o qual todos os gráficos do jogo são desenhados em cada frame usando a API Canvas 2D.

O tema do jogo — as alterações climáticas e o impacto no Ártico — está integrado na mecânica: a temperatura sobe progressivamente e as plataformas de gelo derretem, obrigando o jogador a agir rapidamente.

---

## Componentes Principais do Jogo

O jogo é composto por três ficheiros:

| Ficheiro | Responsabilidade |
|---|---|
| `index.html` | Estrutura da página, ecrãs e elementos de interface |
| `style.css` | Aparência visual de todos os elementos HTML |
| `script.js` | Toda a lógica do jogo, física, desenho e gestão de estado |

---

## Classes Usadas

O jogo usa **Programação Orientada a Objetos** com as seguintes classes principais:

### `Pinguim`
Representa o jogador. Contém:
- Propriedades de estado: posição (`x`, `y`), velocidade (`velX`, `velY`), estado (`noChao`, `vivo`).
- Método `atualizar(plataformas)` — aplica gravidade, move o pinguim e deteta colisões.
- Método `saltar()` — aplica força de impulso vertical se estiver no chão.
- Método `_colidirComPlataforma(plat)` — deteção AABB de colisão com cada plataforma.
- Método `desenhar(ctx, camX)` — desenha o pinguim com formas geométricas simples (elipses, arcos, triângulos).

### `Plataforma`
Representa uma plataforma de gelo. Contém:
- Propriedades: posição, dimensões, `vida` (percentagem de 0 a 100), `derretida`, `fixa`.
- Método `atualizar(temperatura, dt)` — reduz a vida da plataforma em função da temperatura e do tempo, encolhendo a largura proporcionalmente.
- Método `desenhar(ctx, camX)` — desenha a plataforma com gradientes, brilho de gelo, barra de saúde e rachas visuais.

### `Coletavel`
Representa um floco de neve apanhável. Contém:
- Animação de flutuação vertical com função seno.
- Rotação contínua para efeito visual.
- Método `verificarColisao(pinguim)` — usa distância euclidiana entre centros.
- Método `desenhar(ctx, camX)` — desenha um floco de neve com 6 braços usando rotações do canvas.

### `Particula`
Representa texto flutuante de feedback (ex: "+10", "❄️ -8°C"). Contém:
- Posição, velocidade vertical, transparência e texto.
- Desaparece gradualmente subindo pelo ecrã.

### `EstadoJogo`
É o **gestor central** do jogo. Agrega todos os objetos e gere:
- O ciclo de atualização (temperatura, objetos, câmara, vitória/derrota).
- O input do teclado.
- A câmara com suavização.
- A pontuação e o recorde.
- A comunicação com a interface HTML (HUD).

### Módulo `Audio` (padrão IIFE)
Implementado como um módulo auto-executável (IIFE — Immediately Invoked Function Expression) para encapsular a gestão de áudio:
- Carrega todos os sons no arranque.
- Método `reproduzir(nome)` — toca um som com reset do tempo para permitir sobreposição.
- Método `toggleSom()` — liga/desliga globalmente.
- Falha silenciosamente se os ficheiros de áudio não existirem.

---

## Funções Principais

| Função | Descrição |
|---|---|
| `inicializar()` | Configura o canvas, lê o recorde do `localStorage`, regista todos os eventos de botões e teclado. |
| `loopJogo(agora)` | Função chamada pelo `requestAnimationFrame`. Calcula o delta de tempo, chama `atualizar()` e `desenhar()`. |
| `iniciarLoop()` | Inicia o ciclo de animação com `requestAnimationFrame`. |
| `gerarPlataformas()` | Gera as plataformas do nível com dificuldade progressiva (espaçamento e variação de altura crescem com a distância). |
| `gerarColetaveis(plataformas)` | Coloca flocos de neve em cima de plataformas selecionadas aleatoriamente. |
| `atualizarHUD(estado)` | Sincroniza os elementos HTML do painel de informações com o estado atual do jogo. |
| `mostrarEcraFim(...)` | Preenche e exibe o ecrã de fim de jogo com o resultado. |
| `reiniciarJogo()` | Repõe o estado do jogo e reinicia o loop. |
| `toggleAjuda()` | Abre/fecha o painel de ajuda e pausa/retoma o jogo. |
| `toggleSom()` | Liga/desliga o som e atualiza os botões da interface. |
| `comecarJogo()` | Faz a transição do ecrã inicial para o jogo. |
| `irParaMenu()` | Cancela o loop e regressa ao ecrã inicial. |

---

## Sistema de Colisões

O jogo usa **deteção de colisão AABB** (Axis-Aligned Bounding Box — Caixa Alinhada com os Eixos), uma técnica simples e eficiente para objetos retangulares.

### Colisão Pinguim–Plataforma
O método `_colidirComPlataforma(plat)` na classe `Pinguim` verifica:
1. Se há sobreposição no eixo X: `pinguim.x + largura > plat.x` E `pinguim.x < plat.x + plat.largura`.
2. Se há sobreposição no eixo Y: `pinguim.y + altura > plat.y` E `pinguim.y < plat.y + plat.altura`.
3. Se o pinguim estava **acima** da plataforma no frame anterior (`posição anterior ≤ plat.y + margem`), para garantir que a colisão só acontece por cima (o pinguim não atravessa plataformas pelo lado nem por baixo).

Quando as três condições são verdadeiras, o pinguim é recolocado no topo da plataforma e a velocidade vertical é zerada.

### Colisão Pinguim–Floco de Neve
O método `verificarColisao(pinguim)` no `Coletavel` usa **distância euclidiana** entre o centro do pinguim e o centro do floco. Se a distância for menor que a soma dos raios de colisão, o floco é recolhido. Esta abordagem é mais adequada para objetos redondos como flocos de neve.

### Deteção de Queda
A condição de derrota por queda é verificada em `EstadoJogo.atualizar()`: se `pinguim.y > ALTURA_CANVAS + 50`, o jogo termina.

---

## Sistema de Pontuação

| Evento | Pontos |
|---|---|
| Recolher um floco de neve | +10 |
| Chegar à colónia (bónus de nível) | +100 |

A pontuação acumula-se ao longo do nível. No ecrã de fim de jogo, a pontuação atual é comparada com o recorde guardado no `localStorage`.

---

## Sistema de Progressão

A **barra de progresso** no HUD indica a proximidade do pinguim à colónia. É calculada na propriedade `progresso` da classe `EstadoJogo`:

```
progresso (%) = (pinguim.x / coloniaX) × 100
```

O nível é gerado pela função `gerarPlataformas()` com **dificuldade progressiva**: quanto mais longe do início, maior o espaçamento entre plataformas e maior a variação de altura, obrigando o jogador a saltos mais arriscados.

---

## Sistema de Temperatura

A temperatura é um valor numérico entre 0 e 100 que sobe automaticamente ao longo do tempo:

```
temperatura += TAXA_AQUECIMENTO × dt
```

Onde `dt` é o delta de tempo em segundos e `TAXA_AQUECIMENTO = 1.8` graus por segundo.

A temperatura afeta o **multiplicador de derretimento** das plataformas:

```
multiplicador = 1 + (temperatura / TEMP_MAXIMA) × 2
taxaDerretimento = 3.5 × multiplicador × dt
```

Isto significa que com temperatura máxima (100), as plataformas derretem **3× mais depressa** do que com temperatura zero.

Recolher um floco de neve reduz a temperatura em 8°C imediatamente. Se a temperatura atingir 100, o jogo termina em derrota.

A barra de temperatura no HUD muda de cor progressivamente: verde → amarelo → vermelho.

---

## Uso de localStorage

O `localStorage` do browser é usado para **guardar o recorde** do jogador entre sessões. Não é necessário servidor — os dados ficam guardados no próprio browser.

```javascript
// Guardar o recorde:
localStorage.setItem('recorde_pinguim', recorde.toString());

// Ler o recorde:
const recorde = parseInt(localStorage.getItem('recorde_pinguim') || '0');
```

O recorde é lido na inicialização e mostrado no ecrã inicial e no HUD. É atualizado automaticamente quando o jogador supera a pontuação anterior.

---

## Uso de Áudio

Os sons são geridos pelo módulo `Audio` (implementado como IIFE). Usa a API nativa `HTMLAudioElement` do browser.

Os ficheiros de áudio esperados são:

| Identificador | Ficheiro | Quando é reproduzido |
|---|---|---|
| `salto` | `assets/salto.mp3` | Quando o pinguim salta |
| `recolha` | `assets/recolha.mp3` | Quando apanha um floco de neve |
| `vitoria` | `assets/vitoria.mp3` | Quando chega à colónia |
| `derrota` | `assets/derrota.mp3` | Quando cai na água ou temperatura máxima |

O código é **tolerante a falhas**: se os ficheiros não existirem, os erros são capturados com `.catch(() => {})` e o jogo continua sem som. O utilizador pode ligar/desligar o som com a tecla `M` ou o botão no HUD.

---

## Uso de Vídeo

O elemento `<video>` HTML5 está presente no ecrã de introdução e aponta para `assets/intro.mp4`. O vídeo é **controlado pela interface do browser** (controlos nativos do `<video>`) e não depende de serviços externos. Se o ficheiro não existir, é mostrada uma mensagem informativa.

Quando o jogador clica em "Começar a Jogar", o vídeo é pausado automaticamente via JavaScript:
```javascript
document.getElementById('video-intro').pause();
```

---

## Ciclo de Jogo (Game Loop)

O ciclo de jogo usa `requestAnimationFrame`, que é a forma recomendada para animações no browser — sincroniza com a taxa de atualização do ecrã (geralmente 60fps) e pausa automaticamente quando o separador não está visível, poupando recursos.

```
requestAnimationFrame
        ↓
loopJogo(timestamp)
  ├── Calcula dt (delta de tempo)
  ├── EstadoJogo.atualizar(dt)
  │     ├── Processa input do teclado
  │     ├── Atualiza temperatura
  │     ├── Atualiza pinguim (física + colisões)
  │     ├── Atualiza plataformas (derretimento)
  │     ├── Atualiza coletáveis (animação + colisão)
  │     ├── Atualiza partículas de feedback
  │     ├── Atualiza câmara
  │     └── Verifica condições de vitória/derrota
  ├── EstadoJogo.desenhar()
  │     ├── Fundo (céu, estrelas, montanhas)
  │     ├── Água com ondas
  │     ├── Colónia (iglu)
  │     ├── Plataformas
  │     ├── Coletáveis
  │     ├── Pinguim
  │     ├── Partículas
  │     └── Atualiza HUD HTML
  └── requestAnimationFrame (próximo frame)
```

---

## Sistema de Câmara

A câmara é implementada como um **deslocamento horizontal** (`camX`) que é subtraído às coordenadas de mundo de todos os objetos no momento do desenho. Isto cria o efeito de deslocamento lateral sem mover fisicamente os objetos.

A câmara segue o pinguim com **suavização exponencial**:
```javascript
camX += (alvo - camX) * 0.12;
```
Este fator (0.12) faz com que a câmara se mova 12% da distância restante por frame, criando um efeito suave de seguimento.

O efeito de **paralaxe** nas montanhas de fundo é conseguido multiplicando o `camX` por um fator menor (0.3), fazendo com que o fundo se mova mais devagar que o cenário principal — reforçando a sensação de profundidade.

---

---

# LISTA DE RECURSOS PROVISÓRIOS

Para o jogo funcionar na sua totalidade, deves criar a pasta `assets/` na mesma diretoria que os ficheiros do jogo e disponibilizar os seguintes ficheiros:

## Ficheiros de Áudio

| Ficheiro | Descrição | Duração sugerida |
|---|---|---|
| `assets/salto.mp3` | Som curto ao saltar (ex: um "woosh" ou um "plop") | < 1 segundo |
| `assets/recolha.mp3` | Som de recolha de item (ex: um "ding" ou "chime") | < 1 segundo |
| `assets/vitoria.mp3` | Melodia curta de vitória | 2–4 segundos |
| `assets/derrota.mp3` | Som de derrota/splash na água | 1–3 segundos |

**Onde encontrar sons gratuitos:**
- [freesound.org](https://freesound.org) — sons com licença Creative Commons
- [pixabay.com/sound-effects](https://pixabay.com/sound-effects/) — sons sem direitos de autor
- [opengameart.org](https://opengameart.org) — recursos para jogos open-source

> **Nota:** O jogo funciona normalmente sem estes ficheiros — simplesmente não terá som.

---

## Ficheiro de Vídeo

| Ficheiro | Descrição | Formato |
|---|---|---|
| `assets/intro.mp4` | Vídeo introdutório sobre alterações climáticas e biodiversidade do Ártico | MP4 (H.264) |

**Sugestões para o vídeo:**
- Podes usar um vídeo educativo de domínio público ou com licença Creative Commons sobre o derretimento do Ártico.
- Podes gravar um vídeo explicativo próprio sobre o tema.
- Fontes sugeridas: [NASA Climate Change](https://climate.nasa.gov), [Wikimedia Commons](https://commons.wikimedia.org).

> **Nota:** Se o ficheiro não existir, o jogo mostra uma mensagem informativa e continua a funcionar normalmente.

---

## Estrutura de Pastas Final

```
CaminhoDoPinguim/
├── index.html
├── style.css
├── script.js
└── assets/
    ├── salto.mp3
    ├── recolha.mp3
    ├── vitoria.mp3
    ├── derrota.mp3
    ├── musica.mp3
    └── intro.mp4
```

---

## Compatibilidade

O jogo foi desenvolvido para funcionar nos browsers modernos que suportam:
- HTML5 Canvas API
- CSS3 (variáveis, gradientes, animações)
- JavaScript ES6+ (classes, arrow functions, template literals, `const`/`let`)
- `requestAnimationFrame`
- `localStorage`
- `HTMLAudioElement`

**Browsers compatíveis:** Google Chrome 80+, Mozilla Firefox 75+, Microsoft Edge 80+, Safari 13+.

> Para melhores resultados, abre o ficheiro `index.html` através de um servidor local (ex: extensão "Live Server" do VS Code) em vez de diretamente pelo sistema de ficheiros, para evitar restrições de segurança do browser com ficheiros locais (CORS).
