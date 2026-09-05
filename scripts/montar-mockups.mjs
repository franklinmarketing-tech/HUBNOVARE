/**
 * Artes de divulgação com as telas REAIS do produto.
 *
 *   node scripts/montar-mockups.mjs
 *
 * Monta em HTML (perspectiva CSS 3D, sombra, reflexo, brilho) e fotografa
 * com o Playwright. Cada arte junta três coisas que já existem e não são
 * inventadas aqui: a tela real (marketing/telas/), a logo original
 * (public/marca/) e o fundo da marca (marketing/gerados/).
 *
 * Por que HTML em vez de gerar por IA: mockup feito por IA borra a tela e
 * inventa interface. Aqui o pixel da tela é o do produto — dá para ler o
 * texto, e o que a pessoa vê na arte é o que ela encontra ao entrar.
 *
 * Formatos: 16:9 (site, YouTube, Hotmart), 1:1 (feed), 4:5 (Instagram),
 * 1200x630 (prévia de link no WhatsApp/LinkedIn) e 2560x1440 (banner do
 * YouTube).
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

const b64 = (caminho, base = MARCA) =>
  readFileSync(new URL(caminho, base)).toString("base64");

const png = (c, base) => `data:image/png;base64,${b64(c, base)}`;
const jpg = (c, base) => `data:image/jpeg;base64,${b64(c, base)}`;

const logo = png("logo-novare-branca.png");

const TELA = {
  home: png("telas/home-desktop.png", MAT),
  homeCel: png("telas/home-celular.png", MAT),
  planejamento: png("telas/planejamento-desktop.png", MAT),
  planejamentoCel: png("telas/planejamento-celular.png", MAT),
  iris: png("telas/iris-desktop.png", MAT),
  irisCel: png("telas/iris-celular.png", MAT),
  aplicativos: png("telas/aplicativos-desktop.png", MAT),
  assinar: png("telas/assinar-desktop.png", MAT),
};

const FUNDO = {
  luz: jpg("gerados/capa-16x9-1.jpg", MAT),
  rede: jpg("gerados/capa-16x9-4.jpg", MAT),
  feixe: jpg("gerados/capa-16x9-2.jpg", MAT),
  grade: jpg("gerados/capa-16x9-3.jpg", MAT),
};

/* ------------------------------------------------------------------ CSS */

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,-apple-system,sans-serif;overflow:hidden}

  .palco{position:relative;overflow:hidden;display:flex;flex-direction:column;
    justify-content:center;background:#0B1B2E}
  .palco .fundo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
  /* Escurece o fundo sob o texto: a tela do produto é clara e rouba atenção. */
  .palco .veu{position:absolute;inset:0;
    background:linear-gradient(105deg,rgba(11,27,46,.94) 0%,rgba(11,27,46,.72) 42%,rgba(11,27,46,.25) 100%)}

  .conteudo{position:relative;display:flex;align-items:center;gap:var(--vao);
    padding:var(--pad);height:100%;overflow:hidden}
  .coluna{flex:0 0 var(--colTexto);display:flex;flex-direction:column;justify-content:center}
  .marca{width:var(--logo);height:auto;display:block;margin-bottom:var(--gapLogo)}
  .selo{display:inline-block;align-self:flex-start;font-size:var(--fSelo);font-weight:700;
    letter-spacing:.09em;text-transform:uppercase;color:#FFB27A;
    border:1px solid rgba(232,112,58,.45);border-radius:99px;padding:.5em 1.1em;margin-bottom:var(--gapSelo)}
  h1{font-size:var(--fTit);line-height:1.05;font-weight:800;color:#fff;letter-spacing:-.02em}
  h1 em{font-style:normal;color:#FF9A5C}
  .sub{margin-top:var(--gapSub);font-size:var(--fSub);line-height:1.5;color:rgba(255,255,255,.76)}
  .preco{margin-top:var(--gapSub);display:flex;align-items:baseline;gap:.5em;flex-wrap:wrap}
  .preco b{font-size:var(--fPreco);color:#fff;font-weight:800;letter-spacing:-.02em}
  .preco span{font-size:var(--fSub);color:rgba(255,255,255,.7)}
  .preco .gratis{background:#E8703A;color:#fff;font-size:var(--fSelo);font-weight:700;
    padding:.45em 1em;border-radius:99px;letter-spacing:.03em}

  /* --------------------------------------------------------- mockups 3D */
  .cena{flex:1;position:relative;height:100%;display:flex;align-items:center;
    justify-content:center;perspective:2200px}

  .note{position:relative;transform:rotateY(-18deg) rotateX(6deg) rotateZ(1deg);
    transform-style:preserve-3d;border-radius:14px;overflow:hidden;
    border:2px solid rgba(255,255,255,.16);
    box-shadow:0 60px 120px rgba(0,0,0,.6),0 0 90px rgba(56,189,248,.16);
    width:var(--note);max-height:100%}
  /* A tela é alta; recortar pelo topo mostra o começo da página, que é o
     que interessa, em vez de encolher tudo até virar borrão. */
  .note img{width:100%;display:block;object-fit:cover;object-position:top}
  /* Brilho diagonal de vidro por cima da tela. */
  .note::after{content:"";position:absolute;inset:0;
    background:linear-gradient(115deg,rgba(255,255,255,.16) 0%,transparent 38%,transparent 62%,rgba(56,189,248,.10) 100%)}

  .cel{position:absolute;right:var(--celRight);bottom:var(--celBottom);
    transform:rotateY(-14deg) rotateX(4deg) rotateZ(-2deg);
    width:var(--cel);border-radius:26px;overflow:hidden;
    border:3px solid rgba(255,255,255,.22);
    box-shadow:0 40px 80px rgba(0,0,0,.65),0 0 60px rgba(56,189,248,.2)}
  .cel img{width:100%;display:block}
  .cel::after{content:"";position:absolute;inset:0;
    background:linear-gradient(120deg,rgba(255,255,255,.18) 0%,transparent 40%)}

  /* Halo atrás dos aparelhos, para descolarem do fundo. */
  .halo{position:absolute;width:70%;height:70%;border-radius:50%;
    background:radial-gradient(circle,rgba(56,189,248,.28),transparent 68%);filter:blur(40px)}

  /* ------------------------------------------------- variante empilhada */
  /* flex-start + gap: o conteúdo começa no topo (a logo precisa aparecer
     inteira) e a cena ocupa o resto, em vez de tudo centralizar e deixar
     um vão morto no meio. */
  .conteudo.empilhado{flex-direction:column;justify-content:flex-start;
    align-items:center;text-align:center;gap:0}
  .empilhado .coluna{flex:none;align-items:center;text-align:center;width:100%}
  .empilhado .selo{align-self:center}
  .empilhado .cena{flex:1;width:100%;min-height:0;align-items:flex-start}
  .empilhado .note{transform:rotateX(9deg) rotateZ(0deg);height:100%}
  .empilhado .note img{height:100%}
`;

/* ------------------------------------------------------- as artes */

/** Uma arte = medidas + conteúdo. As medidas mudam por formato. */
function paginaHtml({ largura, altura, medidas, corpo }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}
  .palco{width:${largura}px;height:${altura}px;${medidas}}
</style></head><body>${corpo}</body></html>`;
}

const cenaDupla = (desktop, celular) => `
  <div class="cena">
    <div class="halo"></div>
    <div class="note"><img src="${desktop}" alt=""></div>
    ${celular ? `<div class="cel"><img src="${celular}" alt=""></div>` : ""}
  </div>`;

/**
 * `cta` substituiu o antigo bloco de preço: a arte convida, o valor a
 * pessoa descobre na página. Quem quiser voltar a mostrar número muda só
 * aqui — nenhuma arte repete texto de oferta à mão.
 */
const colunaTexto = ({ selo, titulo, sub, cta }) => `
  <div class="coluna">
    <img class="marca" src="${logo}" alt="Novare">
    ${selo ? `<span class="selo">${selo}</span>` : ""}
    <h1>${titulo}</h1>
    ${sub ? `<p class="sub">${sub}</p>` : ""}
    ${cta ? `<div class="preco"><span class="gratis">${cta}</span></div>` : ""}
  </div>`;

/* Medidas por formato — a mesma arte em telas muito diferentes. */
const MEDIDAS = {
  "16:9": `--pad:70px;--vao:50px;--colTexto:40%;--logo:200px;--gapLogo:34px;
    --gapSelo:20px;--gapSub:22px;--fSelo:13px;--fTit:52px;--fSub:19px;--fPreco:44px;
    --note:118%;--cel:150px;--celRight:2%;--celBottom:6%;`,
  "1:1": `--pad:64px;--vao:0;--colTexto:auto;--logo:190px;--gapLogo:28px;
    --gapSelo:18px;--gapSub:22px;--fSelo:13px;--fTit:46px;--fSub:18px;--fPreco:40px;
    --note:100%;--cel:0;--celRight:0;--celBottom:0;`,
  "4:5": `--pad:58px;--vao:0;--colTexto:auto;--logo:180px;--gapLogo:26px;
    --gapSelo:16px;--gapSub:20px;--fSelo:12px;--fTit:42px;--fSub:17px;--fPreco:38px;
    --note:100%;--cel:0;--celRight:0;--celBottom:0;`,
  link: `--pad:52px;--vao:34px;--colTexto:44%;--logo:150px;--gapLogo:22px;
    --gapSelo:14px;--gapSub:16px;--fSelo:11px;--fTit:38px;--fSub:15px;--fPreco:32px;
    --note:116%;--cel:106px;--celRight:1%;--celBottom:6%;`,
  youtube: `--pad:150px;--vao:70px;--colTexto:40%;--logo:250px;--gapLogo:40px;
    --gapSelo:24px;--gapSub:28px;--fSelo:16px;--fTit:64px;--fSub:24px;--fPreco:54px;
    --note:112%;--cel:186px;--celRight:2%;--celBottom:10%;`,
};

/**
 * A copy fala do problema antes do produto, e nenhuma arte mostra preço:
 * o número aparece no checkout, depois de a pessoa querer. Anunciar
 * "R$ 19,90" numa imagem que ela vê antes de entender o que ganha só
 * transforma a decisão numa comparação de preço.
 */
const ARTES = [
  {
    saida: "workspace-16x9",
    largura: 2048,
    altura: 1152,
    formato: "16:9",
    fundo: FUNDO.luz,
    texto: {
      selo: "Ecossistema Novare",
      titulo: "Você trabalha o mês inteiro.<br>Sabe para onde <em>foi</em>?",
      sub: "Plano, IA e ferramentas no mesmo lugar. Pare de adivinhar o próprio dinheiro.",
      cta: "7 dias grátis, sem cartão",
    },
    telas: [TELA.home, TELA.homeCel],
  },
  {
    saida: "planejamento-16x9",
    largura: 2048,
    altura: 1152,
    formato: "16:9",
    fundo: FUNDO.rede,
    texto: {
      selo: "Planejamento Financeiro",
      titulo: "Sua aposentadoria<br>tem <em>um número</em>.<br>Você sabe qual é?",
      sub: "Em 10 minutos você descobre quanto falta, quanto guardar por mês e em quanto tempo chega.",
      cta: "Descubra o seu, grátis",
    },
    telas: [TELA.planejamento, TELA.planejamentoCel],
  },
  {
    saida: "iris-16x9",
    largura: 2048,
    altura: 1152,
    formato: "16:9",
    fundo: FUNDO.feixe,
    texto: {
      selo: "Íris · a IA financeira",
      titulo: "Tem dinheiro saindo<br>da sua conta <em>agora</em>.",
      sub: "Assinatura que você esqueceu. Tarifa que ninguém explicou. Cole o extrato e a Íris mostra.",
      cta: "Teste a Íris de graça",
    },
    telas: [TELA.iris, TELA.irisCel],
  },
  {
    saida: "ferramentas-16x9",
    largura: 2048,
    altura: 1152,
    formato: "16:9",
    fundo: FUNDO.grade,
    texto: {
      selo: "Ferramentas gratuitas",
      titulo: "Antes de assinar,<br>faça <em>a conta</em>.",
      sub: "Salário líquido, rescisão, financiamento. Tabelas oficiais de 2026, sem cadastro, de graça.",
    },
    telas: [TELA.aplicativos, null],
  },
  /* ------------------------------------------------ formatos alternativos */
  {
    saida: "workspace-quadrado",
    largura: 1200,
    altura: 1200,
    formato: "1:1",
    empilhado: true,
    fundo: FUNDO.luz,
    texto: {
      selo: "Ecossistema Novare",
      titulo: "Você sabe para onde<br>foi <em>seu salário</em>?",
      sub: "Plano, IA e ferramentas no mesmo lugar.",
    },
    telas: [TELA.home, null],
  },
  {
    saida: "workspace-story",
    largura: 1080,
    altura: 1350,
    formato: "4:5",
    empilhado: true,
    fundo: FUNDO.luz,
    texto: {
      selo: "Ecossistema Novare",
      titulo: "Três planilhas<br>abandonadas depois,<br>que tal <em>um plano</em>?",
      sub: "Diagnóstico, plano de ação e acompanhamento. Sem planilha nenhuma.",
    },
    telas: [TELA.home, null],
  },
  {
    saida: "iris-story",
    largura: 1080,
    altura: 1350,
    formato: "4:5",
    empilhado: true,
    fundo: FUNDO.feixe,
    texto: {
      selo: "Íris · a IA financeira",
      titulo: "Quanto você paga<br>por coisas que nem<br><em>usa mais</em>?",
      sub: "Cole o extrato. A Íris acha em segundos o que passa despercebido há meses.",
    },
    telas: [TELA.iris, null],
  },
  {
    saida: "planejamento-story",
    largura: 1080,
    altura: 1350,
    formato: "4:5",
    empilhado: true,
    fundo: FUNDO.rede,
    texto: {
      selo: "Planejamento Financeiro",
      titulo: "Em que ano você<br>vai poder <em>parar</em>?",
      sub: "O app responde em 10 minutos — com valor, prazo e o passo a passo até lá.",
    },
    telas: [TELA.planejamento, null],
  },
  {
    saida: "link-preview",
    largura: 1200,
    altura: 630,
    formato: "link",
    fundo: FUNDO.luz,
    texto: {
      selo: "Ecossistema Novare",
      titulo: "Você sabe para onde<br>foi <em>seu salário</em>?",
      sub: "Plano, IA e ferramentas no mesmo lugar.",
    },
    telas: [TELA.home, TELA.homeCel],
  },
  {
    saida: "youtube-banner",
    largura: 2560,
    altura: 1440,
    formato: "youtube",
    fundo: FUNDO.rede,
    texto: {
      selo: "Novare Consultoria",
      titulo: "Seu dinheiro merece<br>mais que <em>um palpite</em>.",
      sub: "Planejamento, inteligência artificial e consultoria de verdade.",
    },
    telas: [TELA.home, TELA.homeCel],
  },
];

/* ------------------------------------------------------------ impressão */

const navegador = await chromium.launch();

for (const arte of ARTES) {
  const { saida, largura, altura, formato, fundo, texto, telas, empilhado } = arte;

  const corpo = `
    <div class="palco${empilhado ? " empilhado" : ""}">
      <img class="fundo" src="${fundo}" alt="">
      <div class="veu"></div>
      <div class="conteudo${empilhado ? " empilhado" : ""}">
        ${colunaTexto(texto)}
        ${cenaDupla(telas[0], telas[1])}
      </div>
    </div>`;

  const pagina = await navegador.newPage({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 1,
  });
  await pagina.setContent(
    paginaHtml({ largura, altura, medidas: MEDIDAS[formato], corpo }),
    { waitUntil: "networkidle" },
  );
  await pagina.waitForTimeout(1200);

  // Nenhuma imagem pode faltar: uma tela quebrada estraga a arte em silêncio.
  const faltando = await pagina.evaluate(
    () => [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
  );
  if (faltando) throw new Error(`${saida}: ${faltando} imagem(ns) não carregou`);

  await pagina.screenshot({ path: `${DESTINO}novare-${saida}.jpg`, quality: 92, type: "jpeg" });
  await pagina.close();
  console.log(`novare-${saida}.jpg  (${largura}x${altura})`);
}

await navegador.close();
console.log(`\n${ARTES.length} artes em marketing/artes/`);
