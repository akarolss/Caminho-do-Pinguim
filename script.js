/* ============================================================
   CAMINHO DO PINGUIM: Fuga ao Gelo Derretido
   script.js  —  Lógica principal do jogo
   ============================================================

   Estrutura do ficheiro:
   1.  Configuração global e constantes
   2.  Gestão de áudio
   3.  Classe Pinguim (jogador)
   4.  Classe Plataforma
   5.  Classe Coletável (floco de neve)
   6.  Classe ParticleFeedback (efeitos visuais)
   7.  Classe EstadoJogo (gestor central)
   8.  Geração de nível
   9.  Ciclo de jogo (loop)
   10. Tratamento de eventos (teclado)
   11. Interface HTML (HUD, ecrãs)
   12. Inicialização
   ============================================================ */

'use strict';

/* ============================================================
   1. CONFIGURAÇÃO GLOBAL E CONSTANTES
   ============================================================ */

/** Dimensões lógicas do canvas (a câmara escala para estas medidas) */
const LARGURA_CANVAS  = 900;
const ALTURA_CANVAS   = 500;

/** Gravidade aplicada ao pinguim por frame (pixéis/frame²) */
const GRAVIDADE       = 0.45;

/** Velocidade horizontal do pinguim */
const VEL_MOVIMENTO   = 3.8;

/** Força de impulso no salto (negativa porque Y cresce para baixo) */
const FORCA_SALTO     = -11;

/** Temperatura inicial e máxima (em graus arbitrários) */
const TEMP_INICIAL    = 0;
const TEMP_MAXIMA     = 100;

/** Ritmo de subida de temperatura por segundo */
const TAXA_AQUECIMENTO = 1.8;

/** Quanto um floco de neve reduz a temperatura */
const REDUCAO_TEMP_FLOCO = 8;

/** Pontos ganhos por floco de neve apanhado */
const PONTOS_FLOCO    = 10;

/** Pontos bónus por completar o nível */
const PONTOS_BONUS_NIVEL = 100;

/** Largura e altura de uma plataforma padrão */
const PLAT_LARGURA    = 120;
const PLAT_ALTURA     = 18;

/** Distância total do nível (em pixéis de mundo) */
const COMPRIMENTO_NIVEL = 6000;

/** Posição X da colónia (fim do nível) */
const X_COLONIA       = COMPRIMENTO_NIVEL - 150;

/* ============================================================
   2. GESTÃO DE ÁUDIO
   ============================================================ */

/**
 * Tenta carregar e reproduzir ficheiros de áudio.
 * Se os ficheiros não existirem, a função falha silenciosamente
 * para não interromper o jogo.
 */
const Audio = (() => {
  // Dicionário de sons: nome → elemento HTMLAudioElement
  const sons = {};
  let somAtivo = true;

  /** Inicializa todos os sons com os ficheiros provisórios */
  function inicializar() {
    const ficheirosSom = {
      salto:    'assets/salto.mp3',
      recolha:  'assets/recolha.mp3',
      vitoria:  'assets/vitoria.mp3',
      derrota:  'assets/derrota.mp3',
      musica:   'assets/musica.mp3',
    };

    for (const [nome, caminho] of Object.entries(ficheirosSom)) {
      const audio = new window.Audio();
      audio.src = caminho;
      audio.preload = 'auto';
      if (nome === 'musica') {
        audio.loop = true;
        audio.volume = 0.35;
      } else if (nome === 'salto') {
        audio.volume = 0.35;
      }
      // Ignora erros de carregamento (ficheiro inexistente)
      audio.onerror = () => {};
      sons[nome] = audio;
    }
  }

  /**
   * Reproduz um som pelo nome.
   * @param {string} nome - 'salto' | 'recolha' | 'vitoria' | 'derrota'
   */
  function reproduzir(nome) {
    if (!somAtivo) return;
    const audio = sons[nome];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {}); // ignora erros de permissão do browser
    } catch (e) {}
  }

  /** Inicia a musica de fundo em loop. */
  function iniciarMusica() {
    if (!somAtivo) return;
    const musica = sons.musica;
    if (!musica) return;
    try {
      musica.play().catch(() => {});
    } catch (e) {}
  }

  /** Pausa a musica de fundo sem reiniciar a posicao. */
  function pausarMusica() {
    const musica = sons.musica;
    if (!musica) return;
    try { musica.pause(); } catch (e) {}
  }

  /** Liga ou desliga o som globalmente */
  function toggleSom() {
    somAtivo = !somAtivo;
    if (somAtivo) iniciarMusica();
    else pausarMusica();
    return somAtivo;
  }

  function isSomAtivo() { return somAtivo; }

  return { inicializar, reproduzir, iniciarMusica, pausarMusica, toggleSom, isSomAtivo };
})();

/* ============================================================
   3. CLASSE PINGUIM (JOGADOR)
   ============================================================ */

/**
 * Representa o pinguim controlado pelo jogador.
 * Tem física simples: gravidade, salto único, movimento horizontal.
 */
class Pinguim {
  /**
   * @param {number} x - Posição X inicial no mundo
   * @param {number} y - Posição Y inicial no mundo
   */
  constructor(x, y) {
    this.x        = x;
    this.y        = y;
    this.largura  = 30;
    this.altura   = 40;
    this.velX     = 0;   // velocidade horizontal
    this.velY     = 0;   // velocidade vertical
    this.noChao   = false; // true quando está em cima de uma plataforma
    this.vivo     = true;
    this.animacao = 0;   // contador para animação de andar
    this.olhandoEsq = false; // direção que o pinguim olha
  }

  /**
   * Atualiza a física do pinguim:
   * - Aplica gravidade
   * - Move horizontalmente
   * - Verifica colisão com plataformas
   * - Verifica se caiu na água
   * @param {Plataforma[]} plataformas - lista de plataformas do nível
   */
  atualizar(plataformas) {
    if (!this.vivo) return;

    // Aplica gravidade (acelera para baixo)
    this.velY += GRAVIDADE;

    // Move verticalmente
    this.y += this.velY;
    // Move horizontalmente
    this.x += this.velX;

    // Impede o pinguim de sair pelo lado esquerdo do mundo
    if (this.x < 0) this.x = 0;

    // Deteta colisão com plataformas
    this.noChao = false;
    for (const plat of plataformas) {
      if (plat.derretida) continue; // ignora plataformas já desaparecidas
      this._colidirComPlataforma(plat);
    }

    // Anima o pinguim enquanto se move
    if (this.velX !== 0 && this.noChao) {
      this.animacao += Math.abs(this.velX) * 0.15;
    }

    // Determina a direção para animar corretamente
    if (this.velX < 0) this.olhandoEsq = true;
    if (this.velX > 0) this.olhandoEsq = false;
  }

  /**
   * Deteção de colisão AABB (caixa alinhada com os eixos) entre o pinguim e uma plataforma.
   * Apenas deteta colisão por cima (o pinguim só pousa em cima das plataformas).
   * @param {Plataforma} plat
   */
  _colidirComPlataforma(plat) {
    // Verifica sobreposição nos dois eixos
    const dentroX = this.x + this.largura  > plat.x &&
                    this.x                 < plat.x + plat.largura;
    const dentroY = this.y + this.altura   > plat.y &&
                    this.y                 < plat.y + plat.altura;

    if (!dentroX || !dentroY) return;

    // Verifica se estava acima da plataforma no frame anterior
    // (colisão vinda de cima, não de baixo nem dos lados)
    const eraCimaPrev = (this.y + this.altura - this.velY) <= plat.y + 2;

    if (eraCimaPrev && this.velY >= 0) {
      // Pousa em cima da plataforma
      this.y      = plat.y - this.altura;
      this.velY   = 0;
      this.noChao = true;
    }
  }

  /**
   * Faz o pinguim saltar, se estiver no chão.
   */
  saltar() {
    if (this.noChao) {
      this.velY   = FORCA_SALTO;
      this.noChao = false;
      Audio.reproduzir('salto');
    }
  }

  /**
   * Desenha o pinguim no canvas usando formas simples.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} camX - deslocamento horizontal da câmara
   */
  desenhar(ctx, camX) {
    if (!this.vivo) return;

    // Posição no ecrã (relativa à câmara)
    const sx = this.x - camX;
    const sy = this.y;

    ctx.save();

    // Espelha horizontalmente se o pinguim olha para a esquerda
    if (this.olhandoEsq) {
      ctx.translate(sx + this.largura / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(sx + this.largura / 2), 0);
    }

    // Balanceio suave quando anda (rotação ligeira)
    const balanco = this.noChao ? Math.sin(this.animacao) * 0.08 : 0;
    ctx.translate(sx + this.largura / 2, sy + this.altura);
    ctx.rotate(balanco);
    ctx.translate(-(sx + this.largura / 2), -(sy + this.altura));

    const cx = sx + this.largura / 2; // centro horizontal
    const cy = sy;

    /* Corpo principal (preto) */
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + this.altura * 0.55, this.largura / 2, this.altura * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Barriga (branco) */
    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.ellipse(cx, cy + this.altura * 0.58, this.largura * 0.28, this.altura * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Cabeça (preta) */
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx, cy + this.altura * 0.2, this.largura * 0.38, 0, Math.PI * 2);
    ctx.fill();

    /* Rosto branco */
    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + this.altura * 0.22, this.largura * 0.22, this.altura * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Olho */
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + 7, cy + this.altura * 0.17, 3, 0, Math.PI * 2);
    ctx.fill();

    /* Brilho do olho */
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + this.altura * 0.16, 1, 0, Math.PI * 2);
    ctx.fill();

    /* Bico laranja */
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(cx + 11, cy + this.altura * 0.23);
    ctx.lineTo(cx + 18, cy + this.altura * 0.26);
    ctx.lineTo(cx + 11, cy + this.altura * 0.3);
    ctx.closePath();
    ctx.fill();

    /* Pés laranjas */
    ctx.fillStyle = '#e67e22';
    const saltoPe = this.noChao ? 0 : -2;
    // Pé esquerdo
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy + this.altura + saltoPe, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Pé direito
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + this.altura + saltoPe, 7, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    /* Asas */
    ctx.fillStyle = '#1a1a2e';
    // Asa direita
    ctx.beginPath();
    ctx.ellipse(cx + this.largura / 2 - 2, cy + this.altura * 0.5, 5, this.altura * 0.22, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ============================================================
   4. CLASSE PLATAFORMA
   ============================================================ */

/**
 * Representa uma plataforma de gelo sobre a qual o pinguim pode andar.
 * Derrete lentamente com o tempo, dependendo da temperatura atual.
 */
class Plataforma {
  /**
   * @param {number} x - Posição X no mundo
   * @param {number} y - Posição Y no mundo
   * @param {number} largura - Largura inicial
   * @param {boolean} fixa   - Se true, não derrete (plataforma de início/fim)
   */
  constructor(x, y, largura = PLAT_LARGURA, fixa = false) {
    this.x           = x;
    this.y           = y;
    this.largura     = largura;
    this.larguraOrig = largura; // guarda largura original para barra de saúde visual
    this.altura      = PLAT_ALTURA;
    this.fixa        = fixa;    // plataformas fixas não derretem
    this.vida        = 100;     // percentagem de "saúde" da plataforma (100% → 0%)
    this.derretida   = false;   // true quando a plataforma desapareceu
    this.cor         = this._gerarCor();
  }

  /** Gera uma cor ligeiramente aleatória de gelo para variedade visual */
  _gerarCor() {
    const tons = ['#a8d8ea', '#b8e4f4', '#c2eaf8', '#d0f0ff', '#7ec8e3'];
    return tons[Math.floor(Math.random() * tons.length)];
  }

  /**
   * Atualiza o estado de derretimento da plataforma.
   * @param {number} temperatura - Temperatura atual do jogo (0–100)
   * @param {number} dt - Delta de tempo em segundos
   */
  atualizar(temperatura, dt) {
    if (this.fixa || this.derretida) return;

    // A velocidade de derretimento aumenta com a temperatura
    // Quando a temperatura é máxima, derrete 3× mais depressa
    const multiplicador = 1 + (temperatura / TEMP_MAXIMA) * 2;
    const taxaDerretimento = 3.5 * multiplicador * dt; // % por segundo

    this.vida -= taxaDerretimento;

    if (this.vida <= 0) {
      this.vida     = 0;
      this.derretida = true;
      this.largura  = 0;
    } else {
      // A largura visual encolhe proporcionalmente à vida
      this.largura = (this.vida / 100) * this.larguraOrig;
    }
  }

  /**
   * Desenha a plataforma no canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} camX - deslocamento da câmara
   */
  desenhar(ctx, camX) {
    if (this.derretida || this.largura < 2) return;

    const sx = this.x - camX;

    // Não desenha se fora do ecrã
    if (sx + this.largura < 0 || sx > LARGURA_CANVAS) return;

    /* Sombra suave */
    ctx.shadowColor   = 'rgba(0,100,200,0.4)';
    ctx.shadowBlur    = 8;

    /* Corpo principal da plataforma */
    ctx.fillStyle = this.cor;
    ctx.beginPath();
    ctx.roundRect(sx, this.y, this.largura, this.altura, 6);
    ctx.fill();

    ctx.shadowBlur = 0;

    /* Gradiente de brilho no topo (efeito de gelo) */
    const gradBrilho = ctx.createLinearGradient(sx, this.y, sx, this.y + this.altura);
    gradBrilho.addColorStop(0,   'rgba(255,255,255,0.55)');
    gradBrilho.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    gradBrilho.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = gradBrilho;
    ctx.beginPath();
    ctx.roundRect(sx, this.y, this.largura, this.altura, 6);
    ctx.fill();

    /* Contorno azulado */
    ctx.strokeStyle = 'rgba(100,180,255,0.6)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(sx, this.y, this.largura, this.altura, 6);
    ctx.stroke();

    /* Barra de "saúde" da plataforma — mostra quanto falta para derreter */
    if (!this.fixa && this.vida < 80) {
      const largBarra = this.largura * 0.8;
      const xBarra    = sx + this.largura * 0.1;
      const yBarra    = this.y - 7;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(xBarra, yBarra, largBarra, 4);

      // Cor da barra: verde → amarelo → vermelho conforme a vida diminui
      const pct     = this.vida / 100;
      const r       = Math.floor(255 * (1 - pct));
      const g       = Math.floor(255 * pct);
      ctx.fillStyle = `rgb(${r},${g},60)`;
      ctx.fillRect(xBarra, yBarra, largBarra * pct, 4);
    }

    /* Rachas no gelo quando a vida está muito baixa */
    if (!this.fixa && this.vida < 30) {
      ctx.strokeStyle = 'rgba(0,100,200,0.5)';
      ctx.lineWidth   = 0.8;
      const cx = sx + this.largura / 2;
      const cy = this.y + this.altura / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 4);
      ctx.lineTo(cx + 5,  cy + 5);
      ctx.lineTo(cx - 3,  cy + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 3);
      ctx.lineTo(cx - 2,  cy + 6);
      ctx.stroke();
    }
  }
}

/* ============================================================
   5. CLASSE COLETÁVEL (FLOCO DE NEVE)
   ============================================================ */

/**
 * Floco de neve flutuante que o jogador pode apanhar.
 * Dá pontos e reduz a temperatura quando recolhido.
 */
class Coletavel {
  /**
   * @param {number} x - Posição X no mundo
   * @param {number} y - Posição Y no mundo
   */
  constructor(x, y) {
    this.x         = x;
    this.y         = y;
    this.raio      = 10;
    this.recolhido = false;
    this.angulo    = Math.random() * Math.PI * 2; // para animação de rotação
    this.yOrig     = y; // posição Y original (para animação de flutuar)
    this.t         = Math.random() * Math.PI * 2; // desfasamento na animação
  }

  /**
   * Atualiza a animação do floco (flutua para cima e para baixo).
   * @param {number} dt - delta tempo em segundos
   */
  atualizar(dt) {
    if (this.recolhido) return;
    this.t      += dt * 2;
    this.angulo += dt * 1.5;
    this.y       = this.yOrig + Math.sin(this.t) * 5; // flutua ±5px
  }

  /**
   * Verifica se o pinguim está a colidir com este floco.
   * Usa distância entre centros (colisão circular vs retângulo).
   * @param {Pinguim} pinguim
   * @returns {boolean}
   */
  verificarColisao(pinguim) {
    if (this.recolhido) return false;

    const cx = pinguim.x + pinguim.largura / 2;
    const cy = pinguim.y + pinguim.altura / 2;
    const dx = cx - this.x;
    const dy = cy - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.raio + 20;
  }

  /**
   * Desenha o floco de neve.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} camX - deslocamento da câmara
   */
  desenhar(ctx, camX) {
    if (this.recolhido) return;

    const sx = this.x - camX;
    if (sx < -20 || sx > LARGURA_CANVAS + 20) return;

    ctx.save();
    ctx.translate(sx, this.y);
    ctx.rotate(this.angulo);

    /* Brilho de fundo */
    ctx.shadowColor = 'rgba(180,230,255,0.8)';
    ctx.shadowBlur  = 12;

    /* Braços do floco de neve (6 braços) */
    ctx.strokeStyle = '#a8d8ff';
    ctx.lineWidth   = 2;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, this.raio);
      // Ramificações
      ctx.moveTo(0, this.raio * 0.6);
      ctx.lineTo(this.raio * 0.25, this.raio * 0.4);
      ctx.moveTo(0, this.raio * 0.6);
      ctx.lineTo(-this.raio * 0.25, this.raio * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    /* Centro do floco */
    ctx.fillStyle  = '#d0eeff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/* ============================================================
   6. CLASSE PARTÍCULA DE FEEDBACK
   ============================================================ */

/**
 * Cria efeitos visuais de partículas para feedback ao jogador
 * (quando apanha um floco, quando morre, etc.)
 */
class Particula {
  /**
   * @param {number} x  - Posição X no ecrã
   * @param {number} y  - Posição Y no ecrã
   * @param {string} texto - Texto a mostrar (ex: "+10")
   * @param {string} cor   - Cor do texto
   */
  constructor(x, y, texto, cor = '#ffffff') {
    this.x       = x;
    this.y       = y;
    this.texto   = texto;
    this.cor     = cor;
    this.alfa    = 1;         // transparência (começa cheia, vai a zero)
    this.velY    = -1.8;      // sobe lentamente
    this.tamanho = 18;
  }

  /** Atualiza a posição e transparência da partícula */
  atualizar() {
    this.y    += this.velY;
    this.alfa -= 0.022;
  }

  /** @returns {boolean} true se a partícula deve ser removida */
  morta() { return this.alfa <= 0; }

  /**
   * Desenha a partícula no canvas.
   * @param {CanvasRenderingContext2D} ctx
   */
  desenhar(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alfa);
    ctx.font        = `bold ${this.tamanho}px Arial`;
    ctx.fillStyle   = this.cor;
    ctx.textAlign   = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur  = 4;
    ctx.fillText(this.texto, this.x, this.y);
    ctx.restore();
  }
}

/* ============================================================
   7. CLASSE ESTADO DO JOGO (GESTOR CENTRAL)
   ============================================================ */

/**
 * Gere o estado global do jogo:
 * - Cria e atualiza todos os objetos do jogo
 * - Gere a câmara, pontuação, temperatura e progressão
 * - Detecta condições de vitória e derrota
 */
class EstadoJogo {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');

    // Objetos do jogo
    this.pinguim    = null;
    this.plataformas = [];
    this.coletaveis  = [];
    this.particulas  = [];

    // Estado de controlo
    this.teclas = {};         // estado das teclas premidas
    this.pausado = false;
    this.terminado = false;
    this.vitoria  = false;

    // Pontuação e progressão
    this.pontos     = 0;
    this.recorde    = parseInt(localStorage.getItem('recorde_pinguim') || '0');
    this.nivel      = 1;

    // Temperatura
    this.temperatura = TEMP_INICIAL;

    // Câmara (deslocamento horizontal do mundo)
    this.camX    = 0;

    // Tempo
    this.ultimoTempo = performance.now();

    // Posição X e Y da colónia (objetivo)
    this.coloniaX = X_COLONIA;
    this.coloniaY = 0; // definido na geração do nível

    this._inicializarNivel();
  }

  /* ----------------------------------------------------------
     Inicialização e reinício
     ---------------------------------------------------------- */

  /** Gera um novo nível e coloca o pinguim na posição inicial */
  _inicializarNivel() {
    this.plataformas = gerarPlataformas();
    this.coletaveis  = gerarColetaveis(this.plataformas);
    this.particulas  = [];
    this.terminado   = false;
    this.vitoria     = false;
    this.temperatura = TEMP_INICIAL;
    this.camX        = 0;

    // Coloca o pinguim em cima da primeira plataforma
    const primPlat = this.plataformas[0];
    this.coloniaY  = this.plataformas[this.plataformas.length - 1].y - 60;
    this.pinguim   = new Pinguim(
      primPlat.x + primPlat.largura / 2 - 15,
      primPlat.y - 45
    );
  }

  /** Reinicia o jogo mantendo o nível e recorde */
  reiniciar() {
    this.pontos  = 0;
    this._inicializarNivel();
  }

  /* ----------------------------------------------------------
     Ciclo principal: atualizar
     ---------------------------------------------------------- */

  /**
   * Atualiza todos os objetos do jogo para o frame atual.
   * Chamado pelo loop de animação com o delta de tempo.
   * @param {number} dt - Tempo decorrido desde o último frame (em segundos)
   */
  atualizar(dt) {
    if (this.pausado || this.terminado) return;

    // Processa o input do teclado
    this._processarInput();

    // Atualiza a temperatura (sobe com o tempo)
    this.temperatura = Math.min(
      TEMP_MAXIMA,
      this.temperatura + TAXA_AQUECIMENTO * dt
    );

    // Verifica derrota por temperatura máxima
    if (this.temperatura >= TEMP_MAXIMA) {
      this._terminarJogo(false, 'A temperatura atingiu o máximo! O gelo derreteu completamente.');
      return;
    }

    // Atualiza o pinguim
    this.pinguim.atualizar(this.plataformas);

    // Verifica se o pinguim caiu na água
    if (this.pinguim.y > ALTURA_CANVAS + 50) {
      this._terminarJogo(false, 'O Polo caiu na água gelada! As alterações climáticas tornaram o percurso demasiado perigoso.');
      return;
    }

    // Atualiza as plataformas (derretimento)
    for (const plat of this.plataformas) {
      plat.atualizar(this.temperatura, dt);
    }

    // Atualiza os coletáveis e verifica recolha
    for (const col of this.coletaveis) {
      col.atualizar(dt);
      if (!col.recolhido && col.verificarColisao(this.pinguim)) {
        this._recolherFloco(col);
      }
    }

    // Atualiza partículas de feedback
    this.particulas = this.particulas.filter(p => !p.morta());
    for (const p of this.particulas) p.atualizar();

    // Atualiza a câmara (segue o pinguim suavemente)
    this._atualizarCamera();

    // Verifica vitória (chegar à colónia)
    this._verificarVitoria();
  }

  /* ----------------------------------------------------------
     Input do teclado
     ---------------------------------------------------------- */

  /**
   * Aplica os comandos do teclado ao pinguim.
   * Chamado em cada frame para movimento suave.
   */
  _processarInput() {
    const p = this.pinguim;
    if (!p || !p.vivo) return;

    const esq = this.teclas['ArrowLeft']  || this.teclas['a'] || this.teclas['A'];
    const dir = this.teclas['ArrowRight'] || this.teclas['d'] || this.teclas['D'];

    if (esq) {
      p.velX = -VEL_MOVIMENTO;
    } else if (dir) {
      p.velX = VEL_MOVIMENTO;
    } else {
      // Desacelera quando não há input
      p.velX *= 0.7;
      if (Math.abs(p.velX) < 0.1) p.velX = 0;
    }
  }

  /* ----------------------------------------------------------
     Câmara
     ---------------------------------------------------------- */

  /**
   * Mantém a câmara centrada no pinguim (com limites do nível).
   * A câmara segue o pinguim quando ele passa a metade do ecrã.
   */
  _atualizarCamera() {
    const alvo = this.pinguim.x - LARGURA_CANVAS / 3;
    // Suaviza o movimento da câmara
    this.camX += (alvo - this.camX) * 0.12;
    // Não deixa a câmara ir além dos limites do nível
    this.camX = Math.max(0, Math.min(this.camX, COMPRIMENTO_NIVEL - LARGURA_CANVAS));
  }

  /* ----------------------------------------------------------
     Recolha de flocos
     ---------------------------------------------------------- */

  /**
   * Processa a recolha de um floco de neve:
   * - Marca como recolhido
   * - Adiciona pontos
   * - Reduz temperatura
   * - Cria feedback visual
   */
  _recolherFloco(col) {
    col.recolhido   = true;
    this.pontos    += PONTOS_FLOCO;
    this.temperatura = Math.max(0, this.temperatura - REDUCAO_TEMP_FLOCO);

    Audio.reproduzir('recolha');

    // Cria partícula de texto "+10" na posição do ecrã
    const sx = col.x - this.camX;
    this.particulas.push(new Particula(sx, col.y - 10, `+${PONTOS_FLOCO}`, '#00d4ff'));
    this.particulas.push(new Particula(sx, col.y + 5,  '❄️ -8°C', '#a8d8ff'));
  }

  /* ----------------------------------------------------------
     Vitória e derrota
     ---------------------------------------------------------- */

  /**
   * Verifica se o pinguim chegou à colónia.
   */
  _verificarVitoria() {
    const p = this.pinguim;
    // Considera vitória quando o pinguim está perto da colónia
    if (p.x + p.largura > this.coloniaX - 10 &&
        p.x < this.coloniaX + 100) {
      this._terminarJogo(true, 'O Polo chegou à colónia! A biodiversidade do Ártico está protegida por enquanto.');
    }
  }

  /**
   * Termina o jogo com vitória ou derrota.
   * @param {boolean} ganhou
   * @param {string} mensagem
   */
  _terminarJogo(ganhou, mensagem) {
    this.terminado = true;
    this.vitoria   = ganhou;
    this.pinguim.vivo = ganhou;

    if (ganhou) {
      this.pontos += PONTOS_BONUS_NIVEL;
      Audio.reproduzir('vitoria');
    } else {
      Audio.reproduzir('derrota');
    }

    // Atualiza o recorde se necessário
    if (this.pontos > this.recorde) {
      this.recorde = this.pontos;
      localStorage.setItem('recorde_pinguim', this.recorde.toString());
    }

    // Mostra o ecrã de fim de jogo após um breve atraso
    setTimeout(() => mostrarEcraFim(ganhou, mensagem, this.pontos, this.recorde), 1200);
  }

  /* ----------------------------------------------------------
     Renderização
     ---------------------------------------------------------- */

  /**
   * Desenha todos os elementos do jogo no canvas.
   * Chamado em cada frame do loop de animação.
   */
  desenhar() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS);

    // Fundo: céu ártico
    this._desenharFundo(ctx);

    // Água/oceano em baixo
    this._desenharAgua(ctx);

    // Colónia (objetivo)
    this._desenharColonia(ctx);

    // Plataformas
    for (const plat of this.plataformas) {
      plat.desenhar(ctx, this.camX);
    }

    // Coletáveis
    for (const col of this.coletaveis) {
      col.desenhar(ctx, this.camX);
    }

    // Pinguim
    this.pinguim.desenhar(ctx, this.camX);

    // Partículas de feedback
    for (const p of this.particulas) p.desenhar(ctx);

    // Mensagem de alerta de temperatura alta
    if (this.temperatura > 75 && !this.terminado) {
      this._desenharAvisoTemp(ctx);
    }

    // Atualiza o HUD HTML
    atualizarHUD(this);
  }

  /* ----------------------------------------------------------
     Elementos visuais do fundo
     ---------------------------------------------------------- */

  /** Desenha o céu ártico com aurora boreal e estrelas */
  _desenharFundo(ctx) {
    // Gradiente de céu
    const gradCeu = ctx.createLinearGradient(0, 0, 0, ALTURA_CANVAS * 0.65);
    gradCeu.addColorStop(0,   '#050e20');
    gradCeu.addColorStop(0.4, '#0a1f3f');
    gradCeu.addColorStop(1,   '#0d3060');
    ctx.fillStyle = gradCeu;
    ctx.fillRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS * 0.65);

    // Aurora boreal (efeito estético)
    const gradAurora = ctx.createLinearGradient(0, 30, LARGURA_CANVAS, 120);
    gradAurora.addColorStop(0,   'rgba(0,255,180,0)');
    gradAurora.addColorStop(0.3, 'rgba(0,200,150,0.06)');
    gradAurora.addColorStop(0.6, 'rgba(0,150,255,0.08)');
    gradAurora.addColorStop(1,   'rgba(0,255,180,0)');
    ctx.fillStyle = gradAurora;
    ctx.fillRect(0, 20, LARGURA_CANVAS, 130);

    // Estrelas (posição fixa no ecrã, não se movem com a câmara)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const estrelas = [
      [50,30],[120,15],[200,45],[320,20],[440,35],
      [560,18],[670,42],[780,25],[860,38],[900*0.15,55],
      [900*0.45,12],[900*0.72,50],[900*0.9,22]
    ];
    for (const [ex, ey] of estrelas) {
      ctx.beginPath();
      ctx.arc(ex, ey, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Montanhas de gelo ao fundo (decorativas, movem-se a metade da velocidade da câmara — paralaxe)
    this._desenharMontanhas(ctx);
  }

  /** Efeito de paralaxe: montanhas ao fundo movem-se mais devagar que o cenário */
  _desenharMontanhas(ctx) {
    const paralaxe = this.camX * 0.3;
    ctx.fillStyle = 'rgba(100,160,210,0.18)';

    const monts = [
      [100, 200, 160], [320, 180, 200], [520, 210, 140],
      [700, 190, 180], [880, 200, 160], [1060, 175, 200]
    ];

    for (const [mx, my, ml] of monts) {
      const sx = mx - paralaxe % (LARGURA_CANVAS + 400);
      ctx.beginPath();
      ctx.moveTo(sx, ALTURA_CANVAS * 0.65);
      ctx.lineTo(sx + ml / 2, my);
      ctx.lineTo(sx + ml, ALTURA_CANVAS * 0.65);
      ctx.closePath();
      ctx.fill();
    }
  }

  /** Desenha a água/oceano na parte inferior do ecrã */
  _desenharAgua(ctx) {
    const yAgua = ALTURA_CANVAS * 0.65;

    // Gradiente de profundidade da água
    const gradAgua = ctx.createLinearGradient(0, yAgua, 0, ALTURA_CANVAS);
    gradAgua.addColorStop(0,   '#0d5fa0');
    gradAgua.addColorStop(0.3, '#0a4a80');
    gradAgua.addColorStop(1,   '#051a35');
    ctx.fillStyle = gradAgua;
    ctx.fillRect(0, yAgua, LARGURA_CANVAS, ALTURA_CANVAS - yAgua);

    // Ondas animadas na superfície
    const t = performance.now() / 1000;
    ctx.strokeStyle = 'rgba(100,180,255,0.3)';
    ctx.lineWidth   = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const y = yAgua + 8 + i * 12;
      for (let x = 0; x <= LARGURA_CANVAS; x += 4) {
        const onda = Math.sin((x / 60) + t + i * 0.8) * 3;
        if (x === 0) ctx.moveTo(x, y + onda);
        else ctx.lineTo(x, y + onda);
      }
      ctx.stroke();
    }
  }

  /** Desenha a colónia segura (iglu) no fim do nível */
  _desenharColonia(ctx) {
    const sx = this.coloniaX - this.camX;
    if (sx < -150 || sx > LARGURA_CANVAS + 150) return;

    const plataformaBase = this.plataformas[this.plataformas.length - 1];
    const sy = plataformaBase.y - 55;

    // Iglu (semicírculo branco)
    ctx.fillStyle = '#e8f4ff';
    ctx.beginPath();
    ctx.arc(sx + 40, sy + 40, 40, Math.PI, 0);
    ctx.fill();

    // Blocos de neve no iglu
    ctx.strokeStyle = 'rgba(100,160,220,0.5)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + 40, sy + 40, 40 - i * 13, Math.PI, 0);
      ctx.stroke();
    }

    // Entrada do iglu
    ctx.fillStyle = '#1a3a5c';
    ctx.beginPath();
    ctx.arc(sx + 40, sy + 80, 12, Math.PI, 0);
    ctx.fill();

    // Bandeira no topo
    ctx.fillStyle  = '#2ecc71';
    ctx.strokeStyle = '#1a8a4a';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 40, sy);
    ctx.lineTo(sx + 40, sy - 30);
    ctx.stroke();
    ctx.fillRect(sx + 40, sy - 30, 18, 12);

    // Etiqueta "COLÓNIA SEGURA"
    ctx.font      = 'bold 11px Arial';
    ctx.fillStyle = '#2ecc71';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur  = 4;

    // Pisca para chamar atenção
    const brilho = Math.abs(Math.sin(performance.now() / 400));
    ctx.globalAlpha = 0.7 + brilho * 0.3;
    ctx.fillText('🏠 COLÓNIA SEGURA', sx + 40, sy - 35);
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  /** Mostra uma mensagem de aviso quando a temperatura está alta */
  _desenharAvisoTemp(ctx) {
    const t      = performance.now() / 300;
    const alfa   = 0.6 + Math.sin(t) * 0.4;
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.font        = 'bold 16px Arial';
    ctx.fillStyle   = '#ff4444';
    ctx.textAlign   = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur  = 6;
    ctx.fillText('⚠️ TEMPERATURA CRÍTICA! O GELO DERRETE MUITO DEPRESSA!', LARGURA_CANVAS / 2, 35);
    ctx.restore();
  }

  /* ----------------------------------------------------------
     Propriedades calculadas (para o HUD)
     ---------------------------------------------------------- */

  /** Calcula a percentagem de progresso (0–100) para a barra de progressão */
  get progresso() {
    const dist = Math.max(0, this.pinguim.x);
    return Math.min(100, (dist / this.coloniaX) * 100);
  }
}

/* ============================================================
   8. GERAÇÃO DO NÍVEL
   ============================================================ */

/**
 * Gera a lista de plataformas para o nível.
 * A distância entre plataformas aumenta progressivamente,
 * tornando o jogo mais difícil à medida que o pinguim avança.
 * @returns {Plataforma[]}
 */
function gerarPlataformas() {
  const plataformas = [];
  const yBase = ALTURA_CANVAS * 0.65 - PLAT_ALTURA - 5; // Y da linha de água

  // Plataforma inicial (fixa, grande, onde o jogador começa)
  plataformas.push(new Plataforma(0, yBase, 200, true));

  let x = 220;
  let segmento = 0;

  // Gera plataformas ao longo do nível
  while (x < X_COLONIA - 150) {
    segmento++;

    // Dificuldade cresce: espaçamento e variação de altura aumentam
    const progresso   = x / COMPRIMENTO_NIVEL;
    const espacamento = 60 + progresso * 80 + Math.random() * 50;
    const largura     = Math.max(60, PLAT_LARGURA - progresso * 40 + Math.random() * 30);
    const varY        = progresso * 120; // variação vertical cresce com o progresso
    const y           = yBase - Math.sin(segmento * 0.7) * varY;

    plataformas.push(new Plataforma(x, Math.max(180, y), largura));
    x += largura + espacamento;
  }

  // Plataforma final (fixa, grande, onde fica a colónia)
  plataformas.push(new Plataforma(X_COLONIA - 10, yBase, 200, true));

  return plataformas;
}

/**
 * Gera flocos de neve colocados em cima das plataformas intermédias.
 * @param {Plataforma[]} plataformas
 * @returns {Coletavel[]}
 */
function gerarColetaveis(plataformas) {
  const coletaveis = [];
  // Ignora a primeira e a última plataforma (início e fim)
  for (let i = 1; i < plataformas.length - 1; i++) {
    // Coloca um floco em ~60% das plataformas
    if (Math.random() > 0.4) {
      const plat = plataformas[i];
      const cx   = plat.x + plat.larguraOrig / 2;
      const cy   = plat.y - 25;
      coletaveis.push(new Coletavel(cx, cy));
    }
  }
  return coletaveis;
}

/* ============================================================
   9. LOOP PRINCIPAL DO JOGO
   ============================================================ */

/** Instância global do estado do jogo */
let estadoJogo = null;
/** ID do requestAnimationFrame (para poder cancelar) */
let rafID = null;

/**
 * Função principal do loop de animação.
 * Chamada pelo requestAnimationFrame a cada frame.
 * @param {number} agora - timestamp em milissegundos
 */
function loopJogo(agora) {
  if (!estadoJogo) return;

  // Calcula o delta de tempo em segundos (com limite de 0.05s para evitar saltos grandes)
  const dt = Math.min((agora - estadoJogo.ultimoTempo) / 1000, 0.05);
  estadoJogo.ultimoTempo = agora;

  estadoJogo.atualizar(dt);
  estadoJogo.desenhar();

  // Agenda o próximo frame
  rafID = requestAnimationFrame(loopJogo);
}

/** Inicia o loop do jogo */
function iniciarLoop() {
  if (rafID) cancelAnimationFrame(rafID);
  estadoJogo.ultimoTempo = performance.now();
  rafID = requestAnimationFrame(loopJogo);
}

/* ============================================================
   10. EVENTOS DE TECLADO
   ============================================================ */

/**
 * Regista os listeners de teclado para controlar o pinguim
 * e aceder às funções do jogo.
 */
function registarEventosTeclado() {
  document.addEventListener('keydown', (e) => {
    if (!estadoJogo) return;

    // Regista a tecla como premida (para verificação contínua no loop)
    estadoJogo.teclas[e.key] = true;

    switch (e.key) {
      case ' ':
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault(); // evita scroll da página
        estadoJogo.pinguim?.saltar();
        break;

      case 'h':
      case 'H':
        toggleAjuda();
        break;

      case 'm':
      case 'M':
        toggleSom();
        break;

      case 'r':
      case 'R':
        if (!estadoJogo.pausado) reiniciarJogo();
        break;

      case 'Escape':
        if (document.getElementById('painel-ajuda').classList.contains('oculto') === false) {
          fecharAjuda();
        }
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (estadoJogo) estadoJogo.teclas[e.key] = false;
  });
}

/* ============================================================
   11. INTERFACE HTML (HUD E ECRÃS)
   ============================================================ */

/**
 * Atualiza os elementos HTML do HUD com os valores atuais do jogo.
 * @param {EstadoJogo} estado
 */
function atualizarHUD(estado) {
  document.getElementById('hud-pontos').textContent  = estado.pontos;
  document.getElementById('hud-recorde').textContent = estado.recorde;
  document.getElementById('hud-nivel').textContent   = `Nível ${estado.nivel}`;

  // Barra de temperatura
  const pctTemp = (estado.temperatura / TEMP_MAXIMA) * 100;
  const barraTemp = document.getElementById('barra-temp');
  barraTemp.style.width = pctTemp + '%';
  document.getElementById('valor-temp').textContent =
    Math.round(estado.temperatura) + '°C';

  // Cor da barra muda com a temperatura
  if (pctTemp > 75) barraTemp.style.background = '#e74c3c';
  else if (pctTemp > 50) barraTemp.style.background = 'linear-gradient(90deg,#f39c12,#e74c3c)';
  else barraTemp.style.background = 'linear-gradient(90deg,#2ecc71,#f39c12,#e74c3c)';

  // Barra de progresso
  document.getElementById('barra-prog').style.width = estado.progresso + '%';
}

/** Mostra o ecrã de fim de jogo */
function mostrarEcraFim(ganhou, mensagem, pontos, recorde) {
  const ecra = document.getElementById('ecra-fim');
  ecra.classList.remove('oculto');

  document.getElementById('fim-icone').textContent  = ganhou ? '🎉' : '💧';
  const titulo = document.getElementById('fim-titulo');
  titulo.textContent  = ganhou ? 'Chegaste à Colónia!' : 'Fim de Jogo';
  titulo.className    = ganhou ? 'vitoria' : 'derrota';
  document.getElementById('fim-mensagem').textContent = mensagem;
  document.getElementById('fim-pontos').textContent   = pontos;
  document.getElementById('fim-recorde').textContent  = recorde;

  // Mostra mensagem de novo recorde se aplicável
  const novoRecorde = document.getElementById('fim-novo-recorde');
  if (pontos >= recorde && pontos > 0) {
    novoRecorde.classList.remove('oculto');
  } else {
    novoRecorde.classList.add('oculto');
  }
}

/** Reinicia o jogo do início */
function reiniciarJogo() {
  document.getElementById('ecra-fim').classList.add('oculto');
  document.getElementById('painel-ajuda').classList.add('oculto');

  if (estadoJogo) {
    estadoJogo.reiniciar();
  }

  if (!rafID) iniciarLoop();
}

/** Mostra/oculta o painel de ajuda e pausa o jogo */
function toggleAjuda() {
  const painel = document.getElementById('painel-ajuda');
  if (painel.classList.contains('oculto')) {
    abrirAjuda();
  } else {
    fecharAjuda();
  }
}

function abrirAjuda() {
  document.getElementById('painel-ajuda').classList.remove('oculto');
  if (estadoJogo) estadoJogo.pausado = true;
}

function fecharAjuda() {
  document.getElementById('painel-ajuda').classList.add('oculto');
  if (estadoJogo) {
    estadoJogo.pausado   = false;
    estadoJogo.ultimoTempo = performance.now(); // evita salto de tempo ao retomar
  }
}

/** Liga ou desliga o som */
function toggleSom() {
  const ativo = Audio.toggleSom();
  const btn1  = document.getElementById('btn-som-hud');
  const btn2  = document.getElementById('btn-toggle-som');
  btn1.textContent = ativo ? '🔊' : '🔇';
  btn2.textContent = ativo ? '🔊 Som: Ligado' : '🔇 Som: Desligado';
}

/** Transição do ecrã de introdução para o jogo */
function comecarJogo() {
  document.getElementById('ecra-intro').classList.remove('ativo');
  document.getElementById('ecra-jogo').classList.add('ativo');

  // Para o vídeo se estiver a reproduzir
  const video = document.getElementById('video-intro');
  try { video.pause(); } catch (e) {}

  // Inicia o jogo
  if (!estadoJogo) {
    const canvas = document.getElementById('canvas-jogo');
    estadoJogo = new EstadoJogo(canvas);
  } else {
    estadoJogo.reiniciar();
  }

  Audio.iniciarMusica();
  iniciarLoop();
}

/** Volta ao ecrã de introdução */
function irParaMenu() {
  document.getElementById('ecra-fim').classList.add('oculto');
  document.getElementById('ecra-jogo').classList.remove('ativo');
  document.getElementById('ecra-intro').classList.add('ativo');

  if (rafID) {
    cancelAnimationFrame(rafID);
    rafID = null;
  }

  Audio.pausarMusica();

  // Atualiza o recorde no menu inicial
  const rec = localStorage.getItem('recorde_pinguim') || '0';
  document.getElementById('recorde-intro').textContent = rec;
}

/* ============================================================
   12. INICIALIZAÇÃO
   ============================================================ */

/**
 * Configura o canvas com as dimensões corretas e regista
 * todos os eventos de interface.
 */
function inicializar() {
  Audio.inicializar();

  // Configura o canvas
  const canvas  = document.getElementById('canvas-jogo');
  canvas.width  = LARGURA_CANVAS;
  canvas.height = ALTURA_CANVAS;

  // Mostra o recorde guardado no ecrã inicial
  const recorde = localStorage.getItem('recorde_pinguim') || '0';
  document.getElementById('recorde-intro').textContent = recorde;
  document.getElementById('hud-recorde').textContent   = recorde;

  // --- Botões do ecrã inicial ---
  document.getElementById('btn-jogar').addEventListener('click', comecarJogo);

  // --- Botões do HUD ---
  document.getElementById('btn-ajuda-hud').addEventListener('click', toggleAjuda);
  document.getElementById('btn-som-hud').addEventListener('click', toggleSom);

  // --- Botões do painel de ajuda ---
  document.getElementById('btn-fechar-ajuda').addEventListener('click', fecharAjuda);
  document.getElementById('btn-toggle-som').addEventListener('click', toggleSom);

  // --- Botões do ecrã de fim de jogo ---
  document.getElementById('btn-reiniciar-fim').addEventListener('click', reiniciarJogo);
  document.getElementById('btn-menu-fim').addEventListener('click', irParaMenu);

  // Regista eventos de teclado
  registarEventosTeclado();
}

// Aguarda o DOM estar pronto antes de inicializar
document.addEventListener('DOMContentLoaded', inicializar);
