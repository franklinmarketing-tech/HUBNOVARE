/**
 * Gera os banners de divulgação da Novare.
 *
 *   node scripts/gerar-banner.mjs
 *
 * Sai em três formatos, porque cada canal corta de um jeito:
 *   • quadrado 1080×1080  — feed do Instagram e status do WhatsApp
 *   • story   1080×1920  — stories e reels (capa)
 *   • largo   1600×900   — grupos de WhatsApp, e-mail, apresentação
 *
 * A arte usa a marca de verdade (logo branca oficial), a paleta do
 * projeto e uma foto do próprio catálogo — nada de banco de imagem
 * genérico. O número de ferramentas é LIDO do catálogo, para o banner
 * nunca prometer 22 quando o site tiver outro tanto.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const PASTA = "../docs/banners";

const b64 = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url)).toString("base64");

const logo = b64("../public/marca/logo-novare-branca.png");
const fundo = b64("../public/cards/card-projeto-vida.webp");

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1080 } });

/* ---------------------------------------- quantas ferramentas mesmo? */

await pagina.goto(`${BASE}/aplicativos`, { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(2000);
const total = await pagina.evaluate(
  () => document.querySelectorAll("a.card-cine").length,
);
if (total < 20) throw new Error(`catálogo veio incompleto: ${total}`);
console.log(`ferramentas no catálogo: ${total}`);

/* ------------------------------------------------------------- arte */

const estilo = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,sans-serif;background:#0d1f33}
  .arte{position:relative;overflow:hidden;color:#fff;display:flex;flex-direction:column;justify-content:space-between}

  /* A foto entra por baixo, escurecida: dá profundidade sem roubar
     a leitura do texto, que é o que precisa ser visto de longe. */
  .fundo{position:absolute;inset:0;overflow:hidden}
  .foto{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.34;filter:blur(3px) saturate(.85);transform:scale(1.06)}
  .veu{position:absolute;inset:0;background:
      linear-gradient(160deg,hsl(215 55% 14% / .93) 0%,hsl(215 50% 20% / .86) 45%,hsl(215 60% 12% / .96) 100%)}
  .brilho{position:absolute;border-radius:50%;background:radial-gradient(circle,hsl(16 80% 55% / .35),transparent 70%)}

  .conteudo{position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;gap:40px}
  .marca{display:flex;align-items:center;justify-content:space-between}
  .marca img{height:var(--logo)}
  .selo-topo{border:2px solid rgba(255,255,255,.28);border-radius:999px;padding:.5em 1.2em;font-size:var(--mini);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.85)}

  h1{font-family:'Playfair Display',serif;font-weight:800;font-size:var(--titulo);line-height:1.02;letter-spacing:-.02em}
  h1 em{font-style:normal;color:hsl(16 85% 62%)}
  .risco{width:var(--risco);height:9px;background:hsl(16 80% 55%);border-radius:99px;margin:var(--riscoM)}
  .apoio{font-size:var(--apoio);line-height:1.5;color:rgba(255,255,255,.78);max-width:20em}

  .itens{display:flex;flex-wrap:wrap;gap:var(--gap)}
  .item{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14);border-radius:.7em;padding:.55em 1em;font-size:var(--item);font-weight:600}

  .pe{display:flex;align-items:flex-end;justify-content:space-between;gap:2em}
  .link{font-size:var(--link);font-weight:700}
  .gratis{text-align:right;font-size:var(--mini);line-height:1.5;color:rgba(255,255,255,.6)}
  .gratis b{display:block;font-size:var(--item);color:hsl(16 85% 62%);letter-spacing:.04em}
`;

const itens = [
  "Salário líquido",
  "Rescisão",
  "Férias e 13º",
  "Aposentadoria",
  "Tesouro Direto",
  "Financiamento",
  "Juros compostos",
  "Reserva de emergência",
];

/** Monta a arte; cada formato só muda medidas e o que cabe. */
function arte({ largura, altura, vars, itensVisiveis, titulo }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${estilo}
    .arte{width:${largura}px;height:${altura}px;padding:${vars.padding}}
    .conteudo{${vars.extra ?? ""}}
    .arte{--logo:${vars.logo};--titulo:${vars.titulo};--apoio:${vars.apoio};--item:${vars.item};--mini:${vars.mini};--link:${vars.link};--gap:${vars.gap};--risco:${vars.risco};--riscoM:${vars.riscoM}}
  </style></head><body>
  <div class="arte">
    <div class="fundo">
      <div class="foto" style="background-image:url(data:image/webp;base64,${fundo})"></div>
      <div class="veu"></div>
      <div class="brilho" style="width:${vars.brilho};height:${vars.brilho};right:-12%;top:-14%"></div>
    </div>
    <div class="conteudo">
      <div class="marca">
        <img src="data:image/png;base64,${logo}" alt="Novare">
        <span class="selo-topo">Sem comissão</span>
      </div>

      <div>
        <h1>${titulo}</h1>
        <div class="risco"></div>
        <p class="apoio">Do salário líquido ao plano de aposentadoria. Nada aqui empurra investimento — o número que aparece é o número real.</p>
        <div class="itens" style="margin-top:${vars.gapTopo}">
          ${itens.slice(0, itensVisiveis).map((i) => `<span class="item">${i}</span>`).join("")}
        </div>
      </div>

      <div class="pe">
        <span class="link">novare-workspace.vercel.app</span>
        <span class="gratis"><b>100% GRÁTIS</b>sem assinatura</span>
      </div>
    </div>
  </div></body></html>`;
}

const FORMATOS = [
  {
    nome: "banner-quadrado-1080",
    largura: 1080,
    altura: 1080,
    // 8 etiquetas estouram 32px na altura: no quadrado cabem 6.
    itensVisiveis: 6,
    titulo: `${total} ferramentas<br>para o seu <em>dinheiro</em>`,
    vars: {
      padding: "72px", logo: "62px", titulo: "82px", apoio: "26px",
      item: "21px", mini: "15px", link: "24px", gap: "12px", risco: "120px",
      riscoM: "20px 0 18px",
      gapTopo: "34px", brilho: "700px",
    },
  },
  {
    nome: "banner-story-1080x1920",
    largura: 1080,
    altura: 1920,
    itensVisiveis: 8,
    titulo: `${total} ferramentas<br>para o seu <em>dinheiro</em>`,
    vars: {
      padding: "230px 76px 260px", logo: "76px", titulo: "118px", apoio: "36px",
      item: "28px", mini: "19px", link: "30px", gap: "16px", risco: "170px",
      riscoM: "40px 0 34px", gapTopo: "60px", brilho: "900px",
    },
  },
  {
    nome: "banner-largo-1600x900",
    largura: 1600,
    altura: 900,
    itensVisiveis: 8,
    titulo: `${total} ferramentas financeiras<br>para o seu <em>dinheiro</em>`,
    vars: {
      padding: "72px 88px", logo: "58px", titulo: "76px", apoio: "25px",
      item: "20px", mini: "15px", link: "24px", gap: "12px", risco: "110px",
      riscoM: "20px 0 18px",
      gapTopo: "34px", brilho: "760px",
    },
  },
];

mkdirSync(PASTA, { recursive: true });

for (const f of FORMATOS) {
  await pagina.setViewportSize({ width: f.largura, height: f.altura });
  await pagina.setContent(arte(f), { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1200);

  // A arte não pode transbordar: banner cortado no meio da frase é pior
  // do que banner nenhum.
  const sobra = await pagina.evaluate(() => {
    const a = document.querySelector(".arte");
    return a.scrollHeight - a.clientHeight;
  });
  if (sobra > 2) throw new Error(`${f.nome}: transbordou ${sobra}px`);

  await pagina.screenshot({ path: `${PASTA}/${f.nome}.png` });
  console.log(`${f.nome}.png  ${f.largura}×${f.altura}`);
}

await navegador.close();
console.log(`\nbanners em ${PASTA}`);
