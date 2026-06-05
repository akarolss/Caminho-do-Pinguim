




'use strict';






const LARGURA_CANVAS  = 900;
const ALTURA_CANVAS   = 500;


const GRAVIDADE       = 0.45;


const VEL_MOVIMENTO   = 3.8;


const FORCA_SALTO     = -11;


const TEMP_INICIAL    = 0;
const TEMP_MAXIMA     = 100;


const TAXA_AQUECIMENTO = 1.8;


const REDUCAO_TEMP_FLOCO = 8;


const PONTOS_FLOCO    = 10;


const PONTOS_BONUS_NIVEL = 100;


const PLAT_LARGURA    = 120;
const PLAT_ALTURA     = 18;


const COMPRIMENTO_NIVEL = 6000;


const X_COLONIA       = COMPRIMENTO_NIVEL - 150;








const Audio = (() => {

  const sons = {};
  let somAtivo = true;


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

      audio.onerror = () => {};
      sons[nome] = audio;
    }
  }




  function reproduzir(nome) {
    if (!somAtivo) return;
    const audio = sons[nome];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (e) {}
  }


  function iniciarMusica() {
    if (!somAtivo) return;
    const musica = sons.musica;
    if (!musica) return;
    try {
      musica.play().catch(() => {});
    } catch (e) {}
  }


  function pausarMusica() {
    const musica = sons.musica;
    if (!musica) return;
    try { musica.pause(); } catch (e) {}
  }


  function toggleSom() {
    somAtivo = !somAtivo;
    if (somAtivo) iniciarMusica();
    else pausarMusica();
    return somAtivo;
  }

  function isSomAtivo() { return somAtivo; }

  return { inicializar, reproduzir, iniciarMusica, pausarMusica, toggleSom, isSomAtivo };
})();








class Pinguim {



  constructor(x, y) {
    this.x        = x;
    this.y        = y;
    this.largura  = 30;
    this.altura   = 40;
    this.velX     = 0;
    this.velY     = 0;
    this.noChao   = false;
    this.vivo     = true;
    this.animacao = 0;
    this.olhandoEsq = false;
  }




  atualizar(plataformas) {
    if (!this.vivo) return;


    this.velY += GRAVIDADE;


    this.y += this.velY;

    this.x += this.velX;


    if (this.x < 0) this.x = 0;


    this.noChao = false;
    for (const plat of plataformas) {
      if (plat.derretida) continue;
      this._colidirComPlataforma(plat);
    }


    if (this.velX !== 0 && this.noChao) {
      this.animacao += Math.abs(this.velX) * 0.15;
    }


    if (this.velX < 0) this.olhandoEsq = true;
    if (this.velX > 0) this.olhandoEsq = false;
  }




  _colidirComPlataforma(plat) {

    const dentroX = this.x + this.largura  > plat.x &&
                    this.x                 < plat.x + plat.largura;
    const dentroY = this.y + this.altura   > plat.y &&
                    this.y                 < plat.y + plat.altura;

    if (!dentroX || !dentroY) return;



    const eraCimaPrev = (this.y + this.altura - this.velY) <= plat.y + 2;

    if (eraCimaPrev && this.velY >= 0) {

      this.y      = plat.y - this.altura;
      this.velY   = 0;
      this.noChao = true;
    }
  }




  saltar() {
    if (this.noChao) {
      this.velY   = FORCA_SALTO;
      this.noChao = false;
      Audio.reproduzir('salto');
    }
  }




  desenhar(ctx, camX) {
    if (!this.vivo) return;


    const sx = this.x - camX;
    const sy = this.y;

    ctx.save();


    if (this.olhandoEsq) {
      ctx.translate(sx + this.largura / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(sx + this.largura / 2), 0);
    }


    const balanco = this.noChao ? Math.sin(this.animacao) * 0.08 : 0;
    ctx.translate(sx + this.largura / 2, sy + this.altura);
    ctx.rotate(balanco);
    ctx.translate(-(sx + this.largura / 2), -(sy + this.altura));

    const cx = sx + this.largura / 2;
    const cy = sy;


    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + this.altura * 0.55, this.largura / 2, this.altura * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.ellipse(cx, cy + this.altura * 0.58, this.largura * 0.28, this.altura * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx, cy + this.altura * 0.2, this.largura * 0.38, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + this.altura * 0.22, this.largura * 0.22, this.altura * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + 7, cy + this.altura * 0.17, 3, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + this.altura * 0.16, 1, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(cx + 11, cy + this.altura * 0.23);
    ctx.lineTo(cx + 18, cy + this.altura * 0.26);
    ctx.lineTo(cx + 11, cy + this.altura * 0.3);
    ctx.closePath();
    ctx.fill();


    ctx.fillStyle = '#e67e22';
    const saltoPe = this.noChao ? 0 : -2;

    ctx.beginPath();
    ctx.ellipse(cx - 6, cy + this.altura + saltoPe, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + this.altura + saltoPe, 7, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = '#1a1a2e';

    ctx.beginPath();
    ctx.ellipse(cx + this.largura / 2 - 2, cy + this.altura * 0.5, 5, this.altura * 0.22, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}








class Plataforma {



  constructor(x, y, largura = PLAT_LARGURA, fixa = false) {
    this.x           = x;
    this.y           = y;
    this.largura     = largura;
    this.larguraOrig = largura;
    this.altura      = PLAT_ALTURA;
    this.fixa        = fixa;
    this.vida        = 100;
    this.derretida   = false;
    this.cor         = this._gerarCor();
  }


  _gerarCor() {
    const tons = ['#a8d8ea', '#b8e4f4', '#c2eaf8', '#d0f0ff', '#7ec8e3'];
    return tons[Math.floor(Math.random() * tons.length)];
  }




  atualizar(temperatura, dt) {
    if (this.fixa || this.derretida) return;



    const multiplicador = 1 + (temperatura / TEMP_MAXIMA) * 1.4;
    const taxaDerretimento = 1.6 * multiplicador * dt;

    this.vida -= taxaDerretimento;

    if (this.vida <= 0) {
      this.vida     = 0;
      this.derretida = true;
      this.largura  = 0;
    } else {

      this.largura = (this.vida / 100) * this.larguraOrig;
    }
  }




  desenhar(ctx, camX) {
    if (this.derretida || this.largura < 2) return;

    const sx = this.x - camX;


    if (sx + this.largura < 0 || sx > LARGURA_CANVAS) return;


    ctx.shadowColor   = 'rgba(0,100,200,0.4)';
    ctx.shadowBlur    = 8;


    ctx.fillStyle = this.cor;
    ctx.beginPath();
    ctx.roundRect(sx, this.y, this.largura, this.altura, 6);
    ctx.fill();

    ctx.shadowBlur = 0;


    const gradBrilho = ctx.createLinearGradient(sx, this.y, sx, this.y + this.altura);
    gradBrilho.addColorStop(0,   'rgba(255,255,255,0.55)');
    gradBrilho.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    gradBrilho.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = gradBrilho;
    ctx.beginPath();
    ctx.roundRect(sx, this.y, this.largura, this.altura, 6);
    ctx.fill();


    ctx.strokeStyle = 'rgba(100,180,255,0.6)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(sx, this.y, this.largura, this.altura, 6);
    ctx.stroke();


    if (!this.fixa && this.vida < 80) {
      const largBarra = this.largura * 0.8;
      const xBarra    = sx + this.largura * 0.1;
      const yBarra    = this.y - 7;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(xBarra, yBarra, largBarra, 4);


      const pct     = this.vida / 100;
      const r       = Math.floor(255 * (1 - pct));
      const g       = Math.floor(255 * pct);
      ctx.fillStyle = `rgb(${r},${g},60)`;
      ctx.fillRect(xBarra, yBarra, largBarra * pct, 4);
    }


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








class Coletavel {



  constructor(x, y) {
    this.x         = x;
    this.y         = y;
    this.raio      = 10;
    this.recolhido = false;
    this.angulo    = Math.random() * Math.PI * 2;
    this.yOrig     = y;
    this.t         = Math.random() * Math.PI * 2;
  }




  atualizar(dt) {
    if (this.recolhido) return;
    this.t      += dt * 2;
    this.angulo += dt * 1.5;
    this.y       = this.yOrig + Math.sin(this.t) * 5;
  }




  verificarColisao(pinguim) {
    if (this.recolhido) return false;

    const cx = pinguim.x + pinguim.largura / 2;
    const cy = pinguim.y + pinguim.altura / 2;
    const dx = cx - this.x;
    const dy = cy - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.raio + 20;
  }




  desenhar(ctx, camX) {
    if (this.recolhido) return;

    const sx = this.x - camX;
    if (sx < -20 || sx > LARGURA_CANVAS + 20) return;

    ctx.save();
    ctx.translate(sx, this.y);
    ctx.rotate(this.angulo);


    ctx.shadowColor = 'rgba(180,230,255,0.8)';
    ctx.shadowBlur  = 12;


    ctx.strokeStyle = '#a8d8ff';
    ctx.lineWidth   = 2;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, this.raio);

      ctx.moveTo(0, this.raio * 0.6);
      ctx.lineTo(this.raio * 0.25, this.raio * 0.4);
      ctx.moveTo(0, this.raio * 0.6);
      ctx.lineTo(-this.raio * 0.25, this.raio * 0.4);
      ctx.stroke();
      ctx.restore();
    }


    ctx.fillStyle  = '#d0eeff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}








class Particula {



  constructor(x, y, texto, cor = '#ffffff') {
    this.x       = x;
    this.y       = y;
    this.texto   = texto;
    this.cor     = cor;
    this.alfa    = 1;
    this.velY    = -1.8;
    this.tamanho = 18;
  }


  atualizar() {
    this.y    += this.velY;
    this.alfa -= 0.022;
  }


  morta() { return this.alfa <= 0; }




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








class EstadoJogo {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');


    this.pinguim    = null;
    this.plataformas = [];
    this.coletaveis  = [];
    this.particulas  = [];


    this.teclas = {};
    this.pausado = false;
    this.terminado = false;
    this.vitoria  = false;


    this.pontos     = 0;
    this.recorde    = parseInt(localStorage.getItem('recorde_pinguim') || '0');
    this.nivel      = 1;


    this.temperatura = TEMP_INICIAL;


    this.camX    = 0;


    this.ultimoTempo = performance.now();


    this.coloniaX = X_COLONIA;
    this.coloniaY = 0;

    this._inicializarNivel();
  }






  _inicializarNivel() {
    this.plataformas = gerarPlataformas();
    this.coletaveis  = gerarColetaveis(this.plataformas);
    this.particulas  = [];
    this.terminado   = false;
    this.vitoria     = false;
    this.temperatura = TEMP_INICIAL;
    this.camX        = 0;


    const primPlat = this.plataformas[0];
    this.coloniaY  = this.plataformas[this.plataformas.length - 1].y - 60;
    this.pinguim   = new Pinguim(
      primPlat.x + primPlat.largura / 2 - 15,
      primPlat.y - 45
    );
  }


  reiniciar() {
    this.pontos  = 0;
    this._inicializarNivel();
  }








  atualizar(dt) {
    if (this.pausado || this.terminado) return;


    this._processarInput();


    this.temperatura = Math.min(
      TEMP_MAXIMA,
      this.temperatura + TAXA_AQUECIMENTO * dt
    );


    if (this.temperatura >= TEMP_MAXIMA) {
      this._terminarJogo(false, 'A temperatura atingiu o máximo! O gelo derreteu completamente.');
      return;
    }


    this.pinguim.atualizar(this.plataformas);


    if (this.pinguim.y > ALTURA_CANVAS + 50) {
      this._terminarJogo(false, 'O Polo caiu na água gelada! As alterações climáticas tornaram o percurso demasiado perigoso.');
      return;
    }


    for (const plat of this.plataformas) {
      plat.atualizar(this.temperatura, dt);
    }


    for (const col of this.coletaveis) {
      col.atualizar(dt);
      if (!col.recolhido && col.verificarColisao(this.pinguim)) {
        this._recolherFloco(col);
      }
    }


    this.particulas = this.particulas.filter(p => !p.morta());
    for (const p of this.particulas) p.atualizar();


    this._atualizarCamera();


    this._verificarVitoria();
  }








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

      p.velX *= 0.7;
      if (Math.abs(p.velX) < 0.1) p.velX = 0;
    }
  }








  _atualizarCamera() {
    const alvo = this.pinguim.x - LARGURA_CANVAS / 3;

    this.camX += (alvo - this.camX) * 0.12;

    this.camX = Math.max(0, Math.min(this.camX, COMPRIMENTO_NIVEL - LARGURA_CANVAS));
  }








  _recolherFloco(col) {
    col.recolhido   = true;
    this.pontos    += PONTOS_FLOCO;
    this.temperatura = Math.max(0, this.temperatura - REDUCAO_TEMP_FLOCO);

    Audio.reproduzir('recolha');


    const sx = col.x - this.camX;
    this.particulas.push(new Particula(sx, col.y - 10, `+${PONTOS_FLOCO}`, '#00d4ff'));
    this.particulas.push(new Particula(sx, col.y + 5,  '❄️ -8°C', '#a8d8ff'));
  }








  _verificarVitoria() {
    const p = this.pinguim;

    if (p.x + p.largura > this.coloniaX - 10 &&
        p.x < this.coloniaX + 100) {
      this._terminarJogo(true, 'O Polo chegou à colónia! A biodiversidade do Ártico está protegida por enquanto.');
    }
  }




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


    if (this.pontos > this.recorde) {
      this.recorde = this.pontos;
      localStorage.setItem('recorde_pinguim', this.recorde.toString());
    }


    setTimeout(() => mostrarEcraFim(ganhou, mensagem, this.pontos, this.recorde), 1200);
  }








  desenhar() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS);


    this._desenharFundo(ctx);


    this._desenharAgua(ctx);


    this._desenharColonia(ctx);


    for (const plat of this.plataformas) {
      plat.desenhar(ctx, this.camX);
    }


    for (const col of this.coletaveis) {
      col.desenhar(ctx, this.camX);
    }


    this.pinguim.desenhar(ctx, this.camX);


    for (const p of this.particulas) p.desenhar(ctx);


    if (this.temperatura > 75 && !this.terminado) {
      this._desenharAvisoTemp(ctx);
    }


    atualizarHUD(this);
  }






  _desenharFundo(ctx) {

    const gradCeu = ctx.createLinearGradient(0, 0, 0, ALTURA_CANVAS * 0.65);
    gradCeu.addColorStop(0,   '#050e20');
    gradCeu.addColorStop(0.4, '#0a1f3f');
    gradCeu.addColorStop(1,   '#0d3060');
    ctx.fillStyle = gradCeu;
    ctx.fillRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS * 0.65);


    const gradAurora = ctx.createLinearGradient(0, 30, LARGURA_CANVAS, 120);
    gradAurora.addColorStop(0,   'rgba(0,255,180,0)');
    gradAurora.addColorStop(0.3, 'rgba(0,200,150,0.06)');
    gradAurora.addColorStop(0.6, 'rgba(0,150,255,0.08)');
    gradAurora.addColorStop(1,   'rgba(0,255,180,0)');
    ctx.fillStyle = gradAurora;
    ctx.fillRect(0, 20, LARGURA_CANVAS, 130);


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


    this._desenharMontanhas(ctx);
  }


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


  _desenharAgua(ctx) {
    const yAgua = ALTURA_CANVAS * 0.65;


    const gradAgua = ctx.createLinearGradient(0, yAgua, 0, ALTURA_CANVAS);
    gradAgua.addColorStop(0,   '#0d5fa0');
    gradAgua.addColorStop(0.3, '#0a4a80');
    gradAgua.addColorStop(1,   '#051a35');
    ctx.fillStyle = gradAgua;
    ctx.fillRect(0, yAgua, LARGURA_CANVAS, ALTURA_CANVAS - yAgua);


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


  _desenharColonia(ctx) {
    const sx = this.coloniaX - this.camX;
    if (sx < -150 || sx > LARGURA_CANVAS + 150) return;

    const plataformaBase = this.plataformas[this.plataformas.length - 1];
    const sy = plataformaBase.y - 55;


    ctx.fillStyle = '#e8f4ff';
    ctx.beginPath();
    ctx.arc(sx + 40, sy + 40, 40, Math.PI, 0);
    ctx.fill();


    ctx.strokeStyle = 'rgba(100,160,220,0.5)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + 40, sy + 40, 40 - i * 13, Math.PI, 0);
      ctx.stroke();
    }


    ctx.fillStyle = '#1a3a5c';
    ctx.beginPath();
    ctx.arc(sx + 40, sy + 80, 12, Math.PI, 0);
    ctx.fill();


    ctx.fillStyle  = '#2ecc71';
    ctx.strokeStyle = '#1a8a4a';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 40, sy);
    ctx.lineTo(sx + 40, sy - 30);
    ctx.stroke();
    ctx.fillRect(sx + 40, sy - 30, 18, 12);


    ctx.font      = 'bold 11px Arial';
    ctx.fillStyle = '#2ecc71';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur  = 4;


    const brilho = Math.abs(Math.sin(performance.now() / 400));
    ctx.globalAlpha = 0.7 + brilho * 0.3;
    ctx.fillText('🏠 COLÓNIA SEGURA', sx + 40, sy - 35);
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }


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






  get progresso() {
    const dist = Math.max(0, this.pinguim.x);
    return Math.min(100, (dist / this.coloniaX) * 100);
  }
}








function gerarPlataformas() {
  const plataformas = [];
  const yBase = ALTURA_CANVAS * 0.65 - PLAT_ALTURA - 5;


  plataformas.push(new Plataforma(0, yBase, 200, true));

  let x = 220;
  let segmento = 0;


  while (x < X_COLONIA - 150) {
    segmento++;


    const progresso   = x / COMPRIMENTO_NIVEL;
    const espacamento = 60 + progresso * 80 + Math.random() * 50;
    const largura     = Math.max(60, PLAT_LARGURA - progresso * 40 + Math.random() * 30);
    const varY        = progresso * 120;
    const y           = yBase - Math.sin(segmento * 0.7) * varY;

    plataformas.push(new Plataforma(x, Math.max(180, y), largura));
    x += largura + espacamento;
  }


  plataformas.push(new Plataforma(X_COLONIA - 10, yBase, 200, true));

  return plataformas;
}




function gerarColetaveis(plataformas) {
  const coletaveis = [];

  for (let i = 1; i < plataformas.length - 1; i++) {

    if (Math.random() > 0.4) {
      const plat = plataformas[i];
      const cx   = plat.x + plat.larguraOrig / 2;
      const cy   = plat.y - 25;
      coletaveis.push(new Coletavel(cx, cy));
    }
  }
  return coletaveis;
}






let estadoJogo = null;

let rafID = null;




function loopJogo(agora) {
  if (!estadoJogo) return;


  const dt = Math.min((agora - estadoJogo.ultimoTempo) / 1000, 0.05);
  estadoJogo.ultimoTempo = agora;

  estadoJogo.atualizar(dt);
  estadoJogo.desenhar();


  rafID = requestAnimationFrame(loopJogo);
}


function iniciarLoop() {
  if (rafID) cancelAnimationFrame(rafID);
  estadoJogo.ultimoTempo = performance.now();
  rafID = requestAnimationFrame(loopJogo);
}








function registarEventosTeclado() {
  document.addEventListener('keydown', (e) => {
    if (!estadoJogo) return;


    estadoJogo.teclas[e.key] = true;

    switch (e.key) {
      case ' ':
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
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








function atualizarHUD(estado) {
  document.getElementById('hud-pontos').textContent  = estado.pontos;
  document.getElementById('hud-recorde').textContent = estado.recorde;
  document.getElementById('hud-nivel').textContent   = `Nível ${estado.nivel}`;


  const pctTemp = (estado.temperatura / TEMP_MAXIMA) * 100;
  const barraTemp = document.getElementById('barra-temp');
  barraTemp.style.width = pctTemp + '%';
  document.getElementById('valor-temp').textContent =
    Math.round(estado.temperatura) + '°C';


  if (pctTemp > 75) barraTemp.style.background = '#e74c3c';
  else if (pctTemp > 50) barraTemp.style.background = 'linear-gradient(90deg,#f39c12,#e74c3c)';
  else barraTemp.style.background = 'linear-gradient(90deg,#2ecc71,#f39c12,#e74c3c)';


  document.getElementById('barra-prog').style.width = estado.progresso + '%';
}


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


  const novoRecorde = document.getElementById('fim-novo-recorde');
  if (pontos >= recorde && pontos > 0) {
    novoRecorde.classList.remove('oculto');
  } else {
    novoRecorde.classList.add('oculto');
  }
}


function reiniciarJogo() {
  document.getElementById('ecra-fim').classList.add('oculto');
  document.getElementById('painel-ajuda').classList.add('oculto');

  if (estadoJogo) {
    estadoJogo.reiniciar();
  }

  if (!rafID) iniciarLoop();
}


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
    estadoJogo.ultimoTempo = performance.now();
  }
}


function toggleSom() {
  const ativo = Audio.toggleSom();
  const btn1  = document.getElementById('btn-som-hud');
  const btn2  = document.getElementById('btn-toggle-som');
  btn1.textContent = ativo ? '🔊' : '🔇';
  btn2.textContent = ativo ? '🔊 Som: Ligado' : '🔇 Som: Desligado';
}


function comecarJogo() {
  document.getElementById('ecra-intro').classList.remove('ativo');
  document.getElementById('ecra-jogo').classList.add('ativo');


  if (!estadoJogo) {
    const canvas = document.getElementById('canvas-jogo');
    estadoJogo = new EstadoJogo(canvas);
  } else {
    estadoJogo.reiniciar();
  }

  Audio.iniciarMusica();
  iniciarLoop();
}


function irParaMenu() {
  document.getElementById('ecra-fim').classList.add('oculto');
  document.getElementById('ecra-jogo').classList.remove('ativo');
  document.getElementById('ecra-intro').classList.add('ativo');

  if (rafID) {
    cancelAnimationFrame(rafID);
    rafID = null;
  }

  Audio.pausarMusica();


  const rec = localStorage.getItem('recorde_pinguim') || '0';
  document.getElementById('recorde-intro').textContent = rec;
}








function inicializar() {
  Audio.inicializar();


  const canvas  = document.getElementById('canvas-jogo');
  canvas.width  = LARGURA_CANVAS;
  canvas.height = ALTURA_CANVAS;


  const recorde = localStorage.getItem('recorde_pinguim') || '0';
  document.getElementById('recorde-intro').textContent = recorde;
  document.getElementById('hud-recorde').textContent   = recorde;


  document.getElementById('btn-jogar').addEventListener('click', comecarJogo);


  document.getElementById('btn-ajuda-hud').addEventListener('click', toggleAjuda);
  document.getElementById('btn-som-hud').addEventListener('click', toggleSom);


  document.getElementById('btn-fechar-ajuda').addEventListener('click', fecharAjuda);
  document.getElementById('btn-toggle-som').addEventListener('click', toggleSom);


  document.getElementById('btn-reiniciar-fim').addEventListener('click', reiniciarJogo);
  document.getElementById('btn-menu-fim').addEventListener('click', irParaMenu);


  registarEventosTeclado();
}


document.addEventListener('DOMContentLoaded', inicializar);
