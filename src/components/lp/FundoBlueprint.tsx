"use client";

import { useEffect, useRef } from "react";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CENA: "marco-horizonte"  ·  placa esquemática  ·  16 s em laço      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Uma cena procedural no rodapé, no motor do `procedural-film`
 * (github.com/kuhnhomeuk-cell/procedural-film). Nada de imagem: cada pixel
 * é desenhado em canvas, quadro a quadro.
 *
 * ┌── CAMADAS, DE TRÁS PARA A FRENTE ─────────────────────────────────────┐
 * │ 1  a placa: navy, vinheta, poeira fina                                │
 * │ 2  geometria de construção: dois círculos-guia e duas diagonais       │
 * │ 3  a régua: eixo de base e escala de ticks, entra em 16 avos          │
 * │ 4  os aportes: barras iguais, uma por beat, com pop de 3 desenhos     │
 * │ 5  a curva do patrimônio, desenhando-se da esquerda para a direita    │
 * │ 6  a hachura sob a curva, revelada junto com ela                      │
 * │ 7  o cabeçote: ponto de luz que corre na ponta da curva               │
 * │ 8  a medida: colchete de altura com ticks nas pontas                  │
 * │ 9  o Marco: ponto grande e o anel laranja do momento de mudança       │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── AS QUATRO REGRAS QUE VÊM DO REPO, E O QUE CADA UMA FAZ ─────────────┐
 * │ DRAW-ON POR COMPRIMENTO. `cumLen` mede a polilinha e `fatiar` corta   │
 * │   uma fração dela. É isso, e só isso, que faz a linha PARECER sendo   │
 * │   desenhada em vez de aparecer pronta com opacidade.                  │
 * │                                                                        │
 * │ BOIL. Toda linha treme sobre um relógio de 12 fps, metade da taxa do  │
 * │   quadro. Um desenho parado shimmer como animação feita à mão.        │
 * │                                                                        │
 * │ TUDO NO BEAT. O beat é 0,5 s. Pops usam `outBack` em 3 desenhos com   │
 * │   overshoot (0.72 → 1.08 → 1). Draw-ons usam `outExpo`. Nada easa por │
 * │   mais de um beat, então o movimento é seco, nunca flutuante.         │
 * │                                                                        │
 * │ DETERMINISMO. Todo acaso sai de `h3(...)` semeado no id da cena.      │
 * │   Nenhum `Math.random()`, nenhum `Date`. O mesmo quadro sempre.        │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O QUE A CENA CONTA: aportes iguais, mês após mês (as barras, todas do
 * mesmo tamanho), e uma curva que acelera sozinha (o patrimônio). No fim, o
 * colchete mede a distância percorrida e o Marco acende. É o Marco
 * Horizonte do produto, desenhado como esquema, e é por isso que ele fecha
 * uma página que passou inteira dizendo que objetivo vira número e data.
 */

const ID = 3172; /* semente da cena */
const TAU = Math.PI * 2;
const BEAT = 0.5; /* 120 bpm */
const FR = 1 / 24;
const DUR = 16; /* 32 beats em laço */

/* Espaço virtual da cena. Tudo abaixo é escrito nestes pixels e o desenho
   inteiro é escalado para a largura real do rodapé. */
const VW = 1240;
const VH = 520;

/* ---------------------------------------------------------------- base -- */

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function h3(a: number, b: number, c: number) {
  let h = (a | 0) * 374761393 + (b | 0) * 668265263 + (c | 0) * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise1(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * f * (f * (f * 6 - 15) + 10);
  const g0 = h3(i, 71, seed) * 2 - 1;
  const g1 = h3(i + 1, 71, seed) * 2 - 1;
  return g0 + (g1 - g0) * s;
}

const outExpo = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const outCubic = (u: number) => 1 - Math.pow(1 - u, 3);

type Pt = [number, number];

/** Comprimento acumulado de uma polilinha. */
function cumLen(pts: Pt[]) {
  const c = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) {
    c[i] = c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return c;
}

/** Corta a polilinha numa fração do comprimento: o coração do draw-on. */
function fatiar(pts: Pt[], cum: Float64Array, frac: number): Pt[] {
  if (frac >= 1) return pts;
  if (frac <= 0) return [];
  const alvo = cum[cum.length - 1] * frac;
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (cum[i] <= alvo) out.push(pts[i]);
    else {
      const a = pts[i - 1];
      const u = (alvo - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      out.push([lerp(a[0], pts[i][0], u), lerp(a[1], pts[i][1], u)]);
      break;
    }
  }
  return out;
}

/* ------------------------------------------------------- a geometria --- */

/* A régua: base, topo e as marcas do eixo. */
const X0 = 120;
const X1 = 1120;
const YB = 462; /* linha de base, no pé da faixa */
const YT = 250; /* topo da escala, abaixo do bloco de texto */

/** A curva do patrimônio: aportes iguais, crescimento que acelera. */
function curvaPts(): Pt[] {
  const out: Pt[] = [];
  const n = 160;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // acelera: parte quase reta e abre no fim. É a forma real de juro sobre
    // juro, e é ela que faz o desenho valer alguma coisa.
    const v = Math.pow(u, 1.9) * 0.86 + u * 0.14;
    out.push([lerp(X0, X1, u), lerp(YB, YT, v)]);
  }
  return out;
}

const CURVA = curvaPts();
const CURVA_CUM = cumLen(CURVA);

/** Altura da curva num x qualquer, para pendurar a hachura e o cabeçote. */
function curvaY(x: number) {
  const u = clamp((x - X0) / (X1 - X0));
  const i = Math.min(CURVA.length - 2, Math.floor(u * (CURVA.length - 1)));
  const f = u * (CURVA.length - 1) - i;
  return lerp(CURVA[i][1], CURVA[i + 1][1], f);
}

/** As barras de aporte: uma por beat, todas do mesmo tamanho. */
const N_BARRAS = 22;
const BARRAS = Array.from({ length: N_BARRAS }, (_, i) => {
  const u = (i + 0.5) / N_BARRAS;
  return { x: lerp(X0 + 8, X1 - 8, u), h: 26 + h3(i, 5, ID) * 7 };
});

/** A hachura sob a curva: linhas a 45 graus, cortadas pela curva.
    Pré-calculada uma vez porque não depende do tempo. */
const HACHURA: Array<{ a: Pt; b: Pt; x: number }> = (() => {
  const out: Array<{ a: Pt; b: Pt; x: number }> = [];
  const passo = 13;
  for (let d = -VH; d < VW + VH; d += passo) {
    // reta a 45 graus: y = x - d
    const seg: Pt[] = [];
    for (let x = X0; x <= X1; x += 4) {
      const y = x - d;
      if (y >= curvaY(x) && y <= YB) seg.push([x, y]);
      else if (seg.length) break;
    }
    if (seg.length < 2) continue;
    const a = seg[0];
    const b = seg[seg.length - 1];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 8) continue;
    out.push({ a, b, x: (a[0] + b[0]) / 2 });
  }
  return out;
})();

/* -------------------------------------------------------- o componente -- */

export function FundoBlueprint({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = 0;
    let h = 0;
    let escala = 1;
    let offX = 0;
    let offY = 0;
    let t0 = 0;
    let ligado = !semMovimento;

    const medir = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A escala segue a LARGURA. A altura virtual já é a da faixa, então a
      // composição inteira cabe: cortar um esquema pela metade seria perder
      // justamente a leitura que ele existe para dar.
      escala = w / VW;
      offX = (w - VW * escala) / 2;
      offY = (h - VH * escala) / 2;
    };

    /* ------------------------------------------------------- pincéis -- */

    /** Polilinha com tremor de boil na normal. */
    const tracoTremido = (
      pts: Pt[],
      cor: string,
      largura: number,
      alfa: number,
      semente: number,
      bi: number,
      amp = 1.5,
    ) => {
      if (pts.length < 2) return;
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.strokeStyle = cor;
      ctx.lineWidth = largura;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      let s = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const ant = pts[i > 0 ? i - 1 : 0];
        s += Math.hypot(p[0] - ant[0], p[1] - ant[1]);
        const prox = pts[Math.min(i + 1, pts.length - 1)];
        const dx = prox[0] - ant[0];
        const dy = prox[1] - ant[1];
        const L = Math.hypot(dx, dy) || 1;
        const n = noise1(s / 70 + bi * 0.61, semente) * amp;
        const x = p[0] + (-dy / L) * n;
        const y = p[1] + (dx / L) * n;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    /** Núcleo + halo + raios alternando comprimento. */
    const pontoDeLuz = (
      x: number,
      y: number,
      r: number,
      cor: string,
      nucleo: string,
      bi: number,
      semente: number,
      k: number,
    ) => {
      if (k <= 0.001) return;
      const cintila = 0.84 + 0.16 * h3(bi, semente, 23);
      const i = k * cintila;
      const hr = r * 5.4;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const g = ctx.createRadialGradient(x, y, 0, x, y, hr);
      g.addColorStop(0, `${cor}66`);
      g.addColorStop(0.2, `${cor}33`);
      g.addColorStop(0.55, `${cor}0f`);
      g.addColorStop(1, `${cor}00`);
      ctx.globalAlpha = i;
      ctx.fillStyle = g;
      ctx.fillRect(x - hr, y - hr, hr * 2, hr * 2);

      ctx.strokeStyle = nucleo;
      ctx.lineWidth = Math.max(0.9, r * 0.17);
      ctx.lineCap = "round";
      ctx.globalAlpha = i * 0.8;
      ctx.beginPath();
      for (let j = 0; j < 12; j++) {
        const a = (j / 12) * TAU + bi * 0.03;
        const c = (j % 2 ? 0.48 : 1) * r * 3.4 * (0.88 + 0.24 * h3(j, bi, semente));
        ctx.moveTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95);
        ctx.lineTo(x + Math.cos(a) * c, y + Math.sin(a) * c);
      }
      ctx.stroke();

      ctx.globalAlpha = i;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, r);
      cg.addColorStop(0, nucleo);
      cg.addColorStop(0.55, `${cor}e6`);
      cg.addColorStop(1, `${cor}00`);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    /** Colchete de medida com barras e ticks nas pontas. */
    const colchete = (
      x: number,
      y1: number,
      y2: number,
      p: number,
      cor: string,
      bi: number,
    ) => {
      if (p <= 0) return;
      const my = (y1 + y2) / 2;
      const meia = (Math.abs(y2 - y1) / 2) * p;
      const cap = 13;
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, my - meia);
      ctx.lineTo(x, my + meia);
      if (p > 0.85) {
        for (const yy of [my - meia, my + meia]) {
          ctx.moveTo(x - cap / 2, yy);
          ctx.lineTo(x + cap / 2, yy);
        }
        // as setas
        for (const [yy, s] of [
          [my - meia, 1],
          [my + meia, -1],
        ] as Array<[number, number]>) {
          ctx.moveTo(x - 4, yy + 9 * s);
          ctx.lineTo(x, yy);
          ctx.lineTo(x + 4, yy + 9 * s);
        }
      }
      ctx.stroke();
      ctx.restore();
      void bi;
    };

    /* -------------------------------------------------------- o quadro -- */

    const desenhar = (tempo: number) => {
      const t = semMovimento ? 11.6 : ((tempo - t0) / 1000) % DUR;
      const bi = Math.floor(t * 12); /* relógio do boil */

      /** Progresso de um evento que nasce no beat `a`. */
      const hit = (a: number, frames: number, e = outExpo, lead = 1) =>
        t < a ? 0 : e(clamp((t - a) / (frames * FR) + lead / frames));

      /** Pop de 3 desenhos com overshoot, no compasso de 12 fps. */
      const pop = (a: number) => {
        if (t < a) return 0;
        const d = Math.floor((t - a) * 12 + 1e-6);
        return [0.72, 1.08, 1][Math.min(2, d)];
      };

      ctx.clearRect(0, 0, w, h);

      /* ---------------------------------------- 1. a placa ------------- */
      const fundo = ctx.createRadialGradient(
        w * 0.5,
        h * 0.3,
        0,
        w * 0.5,
        h * 0.3,
        Math.max(w, h) * 0.8,
      );
      fundo.addColorStop(0, "#12243c");
      fundo.addColorStop(0.55, "#0b1727");
      fundo.addColorStop(1, "#070e19");
      ctx.fillStyle = fundo;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(offX, offY);
      // câmera: um push lento de 1,00 a 1,035 ao longo do laço, no fps cheio
      const z = escala * (1 + 0.035 * outCubic(clamp(t / DUR)));
      ctx.translate((VW * escala) / 2, (VH * escala) / 2);
      ctx.scale(z / escala, z / escala);
      ctx.translate(-(VW * escala) / 2, -(VH * escala) / 2);
      ctx.scale(escala, escala);

      /* ------------------------- 2. geometria de construção ------------ */
      const pGuia = hit(0.0, 18);
      for (let i = 0; i < 2; i++) {
        const r = 260 + i * 200;
        const cx = 620;
        const cy = 300;
        const n = 110;
        const pts: Pt[] = [];
        for (let k = 0; k <= n; k++) {
          const a = -Math.PI / 2 + (k / n) * TAU;
          pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]);
        }
        const cum = cumLen(pts);
        tracoTremido(
          fatiar(pts, cum, pGuia),
          "#6dc6e6",
          1.2,
          0.13 - i * 0.03,
          31 + i,
          bi,
          2.4,
        );
      }
      for (let i = 0; i < 2; i++) {
        const a = i ? -0.42 : 0.42;
        const pts: Pt[] = [
          [620 - Math.cos(a) * 950, 300 - Math.sin(a) * 950],
          [620 + Math.cos(a) * 950, 300 + Math.sin(a) * 950],
        ];
        tracoTremido(fatiar(pts, cumLen(pts), pGuia), "#6dc6e6", 1, 0.1, 57 + i, bi, 2.6);
      }

      /* ------------------------------- 3. a régua e o eixo ------------- */
      const pEixo = hit(0.5, 10);
      const base: Pt[] = [
        [X0 - 26, YB],
        [X1 + 26, YB],
      ];
      tracoTremido(fatiar(base, cumLen(base), pEixo), "#6dc6e6", 1.6, 0.5, 71, bi, 1.2);

      // escala de ticks à esquerda, entrando em 16 avos
      ctx.save();
      ctx.strokeStyle = "#6dc6e6";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      for (let k = 0; k < 9; k++) {
        const p = pop(0.75 + k * (BEAT / 4));
        if (!p) continue;
        const y = lerp(YB, YT - 10, k / 8);
        const comp = (k % 2 ? 11 : 22) * p;
        ctx.globalAlpha = 0.45 * Math.min(1, p);
        ctx.beginPath();
        ctx.moveTo(X0 - 26, y);
        ctx.lineTo(X0 - 26 - comp, y);
        ctx.stroke();
      }
      ctx.restore();

      /* --------------------------------- 4. os aportes ----------------- */
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 0; i < N_BARRAS; i++) {
        const b = BARRAS[i];
        const p = pop(2.0 + i * (BEAT / 2));
        if (!p) continue;
        const alt = b.h * p;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#2596be";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(b.x, YB - 1);
        ctx.lineTo(b.x, YB - alt);
        ctx.stroke();
        // a tampa clara: o detalhe que faz a barra parecer desenhada
        ctx.globalAlpha = 0.85 * Math.min(1, p);
        ctx.strokeStyle = "#bfeff5";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(b.x - 4.5, YB - alt);
        ctx.lineTo(b.x + 4.5, YB - alt);
        ctx.stroke();
      }
      ctx.restore();

      /* --------------------------- 5+6. a curva e a hachura ------------ */
      // a curva se desenha do beat 4 ao beat 23 (9,5 s), em outExpo brando
      const pCurva = clamp((t - 2.0) / 9.5);
      const xFrente = lerp(X0, X1, pCurva);

      // a hachura aparece atrás da frente de desenho, nunca à frente dela
      ctx.save();
      ctx.strokeStyle = "#2596be";
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      for (let i = 0; i < HACHURA.length; i++) {
        const s = HACHURA[i];
        if (s.x > xFrente - 6) continue;
        const j = noise1(i * 0.7 + bi * 0.5, 909) * 0.9;
        ctx.moveTo(s.a[0] + j, s.a[1]);
        ctx.lineTo(s.b[0] + j, s.b[1]);
      }
      ctx.stroke();
      ctx.restore();

      // a curva: dupla, como o contorno primário do blueprint
      const pts = fatiar(CURVA, CURVA_CUM, pCurva);
      tracoTremido(pts, "#6dc6e6", 3, 0.95, 131, bi, 1.1);
      tracoTremido(
        pts.map((p) => [p[0], p[1] + 8] as Pt),
        "#6dc6e6",
        1.4,
        0.35,
        137,
        bi,
        1.1,
      );

      /* ------------------------------------ 7. o cabeçote -------------- */
      if (pCurva > 0 && pCurva < 1) {
        // move on twos: a ponta é objeto, e objeto anda a 12 fps
        const xt = lerp(X0, X1, Math.floor(pCurva * 12 * 9.5) / (12 * 9.5));
        pontoDeLuz(xt, curvaY(xt), 7, "#2596be", "#ffffff", bi, 41, 1);
      }

      /* ------------------------------------ 8. a medida ---------------- */
      const pMed = hit(12.0, 8);
      colchete(X1 + 54, YB, curvaY(X1), pMed, "#6dc6e6", bi);

      /* --------------------------------- 9. o Marco -------------------- */
      const yFim = curvaY(X1);
      if (pCurva >= 1) {
        const desde = t - 11.5;
        pontoDeLuz(X1, yFim, 13, "#2596be", "#ffffff", bi, 11, 1);

        // o anel laranja: o único momento em que a placa muda de cor, e ele
        // dura pouco. É o "magenta" do filme, na cor da casa.
        for (const atraso of [0, 0.5]) {
          const u = clamp((desde - atraso) / 1.6);
          if (u <= 0 || u >= 1) continue;
          const r = 18 + outExpo(u) * 230;
          const n = 72;
          const anel: Pt[] = [];
          for (let k = 0; k <= n; k++) {
            const a = (k / n) * TAU;
            anel.push([X1 + Math.cos(a) * r, yFim + Math.sin(a) * r * 0.92]);
          }
          tracoTremido(anel, "#f08a5f", 2.2, (1 - u) * 0.65, 777 + atraso * 10, bi, 1.8);
        }
      }

      /* ------------------------------ poeira e estrelas ---------------- */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 80; i++) {
        const sx = h3(i, 1, ID) * VW;
        const sy = h3(i, 2, ID) * VH;
        ctx.globalAlpha = (0.1 + 0.42 * h3(i, bi, 3)) * 0.55;
        ctx.fillStyle = "#cfe9f5";
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.restore();

      ctx.restore();

      /* ---------------------- a vinheta, por cima de tudo -------------- */
      const vin = ctx.createRadialGradient(
        w * 0.5,
        h * 0.42,
        Math.min(w, h) * 0.2,
        w * 0.5,
        h * 0.42,
        Math.max(w, h) * 0.75,
      );
      vin.addColorStop(0, "rgba(7,14,25,0)");
      vin.addColorStop(1, "rgba(7,14,25,0.6)");
      ctx.fillStyle = vin;
      ctx.fillRect(0, 0, w, h);
    };

    /* ----------------------------------------------------------- laço -- */

    let raf = 0;
    const laco = (tempo: number) => {
      if (!t0) t0 = tempo;
      if (ligado) desenhar(tempo);
      raf = requestAnimationFrame(laco);
    };

    medir();
    desenhar(0);

    if (semMovimento) return;

    // Fora da tela, a cena não gasta um quadro. Um canvas animado no pé de
    // uma página longa é bateria queimada em silêncio.
    const obs = new IntersectionObserver(
      (es) => {
        ligado = es.some((e) => e.isIntersecting);
      },
      { threshold: 0 },
    );
    obs.observe(cv);

    const ro = new ResizeObserver(() => {
      medir();
    });
    ro.observe(cv);

    raf = requestAnimationFrame(laco);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
