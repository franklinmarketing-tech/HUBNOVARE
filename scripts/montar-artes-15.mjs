/**
 * As 15 artes de divulgação — Íris, Planejamento, recursos e sócios.
 *
 *   node scripts/montar-artes-15.mjs
 *
 * Mesmo princípio de `montar-mockups.mjs`: monta em HTML e fotografa, para
 * a tela dentro da arte ser o pixel real do produto. Aqui entram também as
 * telas de DENTRO do app (`app-*.png`, capturadas por
 * `fotografar-app-interno.mjs`) e a foto real dos sócios.
 *
 * Nenhuma arte mostra preço: o valor aparece no checkout, depois de a
 * pessoa querer.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const MARCA = new URL("../public/marca/", import.meta.url);
/* Telas e fundos ficam fora de public/: sao insumo de arte, nao asset
   servido pelo site — publicar 20 MB de material de marketing engorda
   todo deploy sem que nenhuma pagina use os arquivos. */
const MAT = new URL("../../marketing/", import.meta.url);
const DESTINO = new URL("../../marketing/artes/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);
mkdirSync(DESTINO, { recursive: true });

const b64 = (c, base = MARCA) => readFileSync(new URL(c, base)).toString("base64");
const png = (c, base) => `data:image/png;base64,${b64(c, base)}`;
const jpg = (c, base) => `data:image/jpeg;base64,${b64(c, base)}`;

const logo = png("logo-novare-branca.png");
const socios = jpg("novare-site/socios-novare-alta.jpg");

const T = {
  iris: png("telas/iris-desktop.png", MAT),
  irisCel: png("telas/iris-celular.png", MAT),
  plan: png("telas/planejamento-desktop.png", MAT),
  planCel: png("telas/planejamento-celular.png", MAT),
  diagnostico: png("telas/app-diagnostico.png", MAT),
  plano: png("telas/app-plano.png", MAT),
  mes: png("telas/app-mes.png", MAT),
  evolucao: png("telas/app-evolucao.png", MAT),
  relatorio: png("telas/app-relatorio.png", MAT),
  dados: png("telas/app-dados.png", MAT),
  inicio: png("telas/app-inicio.png", MAT),
  apps: png("telas/aplicativos-desktop.png", MAT),
};

const F = {
  luz: jpg("gerados/capa-16x9-1.jpg", MAT),
  rede: jpg("gerados/capa-16x9-4.jpg", MAT),
  feixe: jpg("gerados/capa-16x9-2.jpg", MAT),
  grade: jpg("gerados/capa-16x9-3.jpg", MAT),
};

/* ------------------------------------------------------------------ CSS */

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,-apple-system,sans-serif;overflow:hidden}
  .palco{position:relative;overflow:hidden;background:#0B1B2E}
  .palco .fundo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
  .palco .veu{position:absolute;inset:0;
    background:linear-gradient(105deg,rgba(11,27,46,.95) 0%,rgba(11,27,46,.74) 42%,rgba(11,27,46,.26) 100%)}
  .palco.vertical .veu{
    background:linear-gradient(180deg,rgba(11,27,46,.95) 0%,rgba(11,27,46,.55) 45%,rgba(11,27,46,.9) 100%)}

  .conteudo{position:relative;display:flex;align-items:center;gap:var(--vao);
    padding:var(--pad);height:100%;overflow:hidden}
  .coluna{flex:0 0 var(--colTexto);display:flex;flex-direction:column;justify-content:center}
  .marca{width:var(--logo);height:auto;display:block;margin-bottom:var(--gapLogo)}
  .selo{display:inline-block;align-self:flex-start;font-size:var(--fSelo);font-weight:700;
    letter-spacing:.09em;text-transform:uppercase;color:#FFB27A;
    border:1px solid rgba(232,112,58,.45);border-radius:99px;padding:.5em 1.1em;margin-bottom:var(--gapSelo)}
  h1{font-size:var(--fTit);line-height:1.06;font-weight:800;color:#fff;letter-spacing:-.02em}
  h1 em{font-style:normal;color:#FF9A5C}
  .sub{margin-top:var(--gapSub);font-size:var(--fSub);line-height:1.5;color:rgba(255,255,255,.78)}
  .cta{margin-top:var(--gapSub);align-self:flex-start;background:#E8703A;color:#fff;
    font-size:var(--fSelo);font-weight:700;padding:.7em 1.5em;border-radius:99px;letter-spacing:.02em}

  .cena{flex:1;position:relative;height:100%;display:flex;align-items:center;
    justify-content:center;perspective:2200px}
  .halo{position:absolute;width:70%;height:70%;border-radius:50%;
    background:radial-gradient(circle,rgba(56,189,248,.28),transparent 68%);filter:blur(40px)}
  .note{position:relative;transform:rotateY(-18deg) rotateX(6deg) rotateZ(1deg);
    border-radius:14px;overflow:hidden;border:2px solid rgba(255,255,255,.16);
    box-shadow:0 60px 120px rgba(0,0,0,.6),0 0 90px rgba(56,189,248,.16);
    width:var(--note);max-height:100%}
  .note img{width:100%;display:block;object-fit:cover;object-position:top}
  .note::after{content:"";position:absolute;inset:0;
    background:linear-gradient(115deg,rgba(255,255,255,.16) 0%,transparent 38%,transparent 62%,rgba(56,189,248,.10) 100%)}
  .cel{position:absolute;right:var(--celRight);bottom:var(--celBottom);
    transform:rotateY(-14deg) rotateX(4deg) rotateZ(-2deg);width:var(--cel);
    border-radius:26px;overflow:hidden;border:3px solid rgba(255,255,255,.22);
    box-shadow:0 40px 80px rgba(0,0,0,.65),0 0 60px rgba(56,189,248,.2)}
  .cel img{width:100%;display:block}

  /* ---------------------------------------------------- empilhado (4:5) */
  .conteudo.empilhado{flex-direction:column;justify-content:flex-start;
    align-items:center;text-align:center;gap:0}
  .empilhado .coluna{flex:none;align-items:center;text-align:center;width:100%}
  .empilhado .selo,.empilhado .cta{align-self:center}
  .empilhado .cena{flex:1;width:100%;min-height:0;align-items:flex-start}
  .empilhado .note{transform:rotateX(9deg);height:100%}
  .empilhado .note img{height:100%}

  /* -------------------------------------------------------- sócios */
  .retrato{flex:1;height:100%;display:flex;align-items:center;justify-content:center;
    position:relative;perspective:2000px}
  .retrato .moldura{width:var(--foto);border-radius:20px;overflow:hidden;
    border:3px solid rgba(255,255,255,.2);
    box-shadow:0 50px 110px rgba(0,0,0,.65),0 0 80px rgba(56,189,248,.14);
    transform:rotateY(-10deg) rotateX(3deg)}
  .retrato img{width:100%;display:block}
  .retrato .moldura::after{content:"";position:absolute;inset:0;
    background:linear-gradient(120deg,rgba(255,255,255,.12),transparent 45%)}
`;

const medidas = {
  wide: `--pad:70px;--vao:50px;--colTexto:40%;--logo:200px;--gapLogo:34px;
    --gapSelo:20px;--gapSub:22px;--fSelo:13px;--fTit:50px;--fSub:19px;
    --note:118%;--cel:150px;--celRight:2%;--celBottom:6%;--foto:74%;`,
  story: `--pad:58px;--vao:0;--colTexto:auto;--logo:180px;--gapLogo:26px;
    --gapSelo:16px;--gapSub:20px;--fSelo:12px;--fTit:40px;--fSub:17px;
    --note:100%;--cel:0;--celRight:0;--celBottom:0;--foto:88%;`,
  quadrado: `--pad:64px;--vao:0;--colTexto:auto;--logo:190px;--gapLogo:28px;
    --gapSelo:18px;--gapSub:22px;--fSelo:13px;--fTit:44px;--fSub:18px;
    --note:100%;--cel:0;--celRight:0;--celBottom:0;--foto:86%;`,
};

const TAMANHO = {
  wide: [2048, 1152],
  story: [1080, 1350],
  quadrado: [1200, 1200],
};

/* ------------------------------------------------------------- as artes */

const ARTES = [
  /* ------------------------------------------------------------ Íris (5) */
  {
    nome: "iris-extrato",
    formato: "wide",
    fundo: F.feixe,
    selo: "Íris · a IA financeira",
    titulo: "Seu banco não vai<br>te contar <em>isso</em>.",
    sub: "Cole o extrato. A Íris mostra a tarifa repetida, o juro escondido e a assinatura esquecida.",
    cta: "Testar de graça",
    telas: [T.iris, T.irisCel],
  },
  {
    nome: "iris-sem-comissao",
    formato: "wide",
    fundo: F.rede,
    selo: "Íris · a IA financeira",
    titulo: "Ela não ganha nada<br>se você <em>investir errado</em>.",
    sub: "Nenhuma corretora paga a Íris. Por isso ela fala o que os números dizem, não o que vende.",
    telas: [T.iris, null],
  },
  {
    nome: "iris-story",
    formato: "story",
    fundo: F.feixe,
    selo: "Íris · a IA financeira",
    titulo: "Quanto você paga<br>por coisas que<br>nem <em>usa mais</em>?",
    sub: "A Íris acha em segundos o que passa despercebido há meses.",
    cta: "Testar de graça",
    telas: [T.iris, null],
  },
  {
    nome: "iris-privacidade",
    formato: "quadrado",
    fundo: F.grade,
    selo: "Íris · a IA financeira",
    titulo: "Sem senha.<br>Sem conectar<br>o <em>seu banco</em>.",
    sub: "O extrato é lido no seu navegador e não sai de lá.",
    telas: [T.iris, null],
  },
  {
    nome: "iris-conversa",
    formato: "quadrado",
    fundo: F.feixe,
    selo: "Íris · a IA financeira",
    titulo: "Pergunte o que<br>você tem <em>vergonha</em><br>de perguntar.",
    sub: "A Íris responde com a conta na ponta do lápis, sem julgar.",
    telas: [T.irisCel, null],
  },

  /* --------------------------------------------- Planejamento e recursos (7) */
  {
    nome: "plan-aposentadoria",
    formato: "wide",
    fundo: F.rede,
    selo: "Planejamento Financeiro",
    titulo: "Em que ano você<br>vai poder <em>parar</em>?",
    sub: "O app responde em 10 minutos — com valor, prazo e o passo a passo até lá.",
    cta: "Descobrir meu número",
    telas: [T.plan, T.planCel],
  },
  /* Estas quatro usam a tela de PERCURSO do app (`app-inicio`, com as seis
     etapas nomeadas) em vez das telas de resultado. Motivo: as telas de
     resultado só ficam boas com um cadastro completo, e o preenchimento
     automático não consegue lançar despesa — o seletor de categoria é um
     componente customizado. Mostrar "Nenhuma despesa lançada" numa arte de
     venda seria pior que mostrar o mapa do produto. */
  {
    nome: "recurso-diagnostico",
    formato: "wide",
    fundo: F.luz,
    selo: "Recurso · Diagnóstico",
    titulo: "Sua vida financeira<br>ganha uma <em>nota</em>.",
    sub: "Quanto entra, quanto sai, quanto sobra. Calculado na hora, com os seus números.",
    telas: [T.inicio, null],
  },
  {
    nome: "recurso-plano",
    formato: "wide",
    fundo: F.grade,
    selo: "Recurso · Meu plano",
    titulo: "O que fazer primeiro.<br>Com valor e <em>prazo</em>.",
    sub: "Não é lista genérica de dicas. É a ordem certa para o seu caso.",
    telas: [T.inicio, null],
  },
  {
    nome: "recurso-evolucao",
    formato: "wide",
    fundo: F.rede,
    selo: "Recurso · Seis etapas",
    titulo: "Plano que você não<br>acompanha é <em>desejo</em>.",
    sub: "Do retrato de hoje ao acompanhamento de cada mês, tudo dentro do app.",
    telas: [T.inicio, null],
  },
  {
    nome: "recurso-relatorio",
    formato: "quadrado",
    fundo: F.luz,
    selo: "Recurso · Meu relatório",
    titulo: "Tudo num PDF<br>que é <em>seu</em>.",
    sub: "Para levar numa conversa com a família ou com um consultor.",
    telas: [T.inicio, null],
  },
  {
    nome: "plan-story",
    formato: "story",
    fundo: F.rede,
    selo: "Planejamento Financeiro",
    titulo: "Três planilhas<br>abandonadas depois,<br>que tal <em>um plano</em>?",
    sub: "Diagnóstico, plano de ação e acompanhamento. Sem planilha nenhuma.",
    cta: "Começar agora",
    telas: [T.plan, null],
  },
  {
    nome: "recurso-ferramentas",
    formato: "story",
    fundo: F.grade,
    selo: "Ferramentas gratuitas",
    titulo: "Antes de assinar,<br>faça <em>a conta</em>.",
    sub: "Salário líquido, rescisão, financiamento. Sem cadastro, de graça.",
    telas: [T.apps, null],
  },

  /* ------------------------------------------------------------ Sócios (3) */
  {
    nome: "socios-quem-cuida",
    formato: "wide",
    fundo: F.luz,
    selo: "Quem cuida do seu dinheiro",
    titulo: "Por trás do app,<br>tem <em>gente</em>.",
    sub: "A Novare é uma consultoria independente. Nossos sócios conduzem cada atendimento pessoalmente.",
    retrato: socios,
  },
  {
    nome: "socios-consultoria",
    formato: "wide",
    fundo: F.grade,
    selo: "Consultoria particular",
    titulo: "Quando você quiser<br>um <em>consultor</em> do lado.",
    sub: "Consultoria analisada caso a caso, com desconto para quem assina.",
    cta: "Falar com a Novare",
    retrato: socios,
  },
  {
    nome: "socios-story",
    formato: "story",
    fundo: F.luz,
    selo: "Novare Consultoria",
    titulo: "Consultoria<br><em>independente</em>.",
    sub: "Gente de verdade cuidando do seu dinheiro.",
    retrato: socios,
  },
];

/* ------------------------------------------------------------ impressão */

const navegador = await chromium.launch();

for (const arte of ARTES) {
  const [largura, altura] = TAMANHO[arte.formato];
  const empilhado = arte.formato !== "wide";

  const visual = arte.retrato
    ? `<div class="retrato"><div class="halo"></div>
         <div class="moldura"><img src="${arte.retrato}" alt=""></div></div>`
    : `<div class="cena"><div class="halo"></div>
         <div class="note"><img src="${arte.telas[0]}" alt=""></div>
         ${arte.telas[1] ? `<div class="cel"><img src="${arte.telas[1]}" alt=""></div>` : ""}
       </div>`;

  const corpo = `
    <div class="palco${empilhado ? " vertical" : ""}">
      <img class="fundo" src="${arte.fundo}" alt="">
      <div class="veu"></div>
      <div class="conteudo${empilhado ? " empilhado" : ""}">
        <div class="coluna">
          <img class="marca" src="${logo}" alt="Novare">
          <span class="selo">${arte.selo}</span>
          <h1>${arte.titulo}</h1>
          ${arte.sub ? `<p class="sub">${arte.sub}</p>` : ""}
          ${arte.cta ? `<span class="cta">${arte.cta}</span>` : ""}
        </div>
        ${visual}
      </div>
    </div>`;

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}
  .palco{width:${largura}px;height:${altura}px;${medidas[arte.formato]}}
</style></head><body>${corpo}</body></html>`;

  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
  await pagina.setContent(html, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1200);

  const faltando = await pagina.evaluate(
    () => [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
  );
  if (faltando) throw new Error(`${arte.nome}: ${faltando} imagem(ns) não carregou`);

  await pagina.screenshot({
    path: `${DESTINO}novare-${arte.nome}.jpg`,
    quality: 92,
    type: "jpeg",
  });
  await pagina.close();
  console.log(`novare-${arte.nome}.jpg  (${largura}x${altura})`);
}

await navegador.close();
console.log(`\n${ARTES.length} artes em marketing/artes/`);
