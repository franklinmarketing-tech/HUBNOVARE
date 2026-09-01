/**
 * Gera a capa de cada eBook em public/ebooks/.
 *
 * Os guias vivem em /public como PDF e nunca tiveram arte: a estante e o
 * banner da home ficavam com emoji no lugar da capa, e emoji não parece
 * produto. Aqui a capa é desenhada em HTML — mesma marca, mesmas fontes — e
 * vira PNG de verdade, que o next/image serve como qualquer outra foto.
 *
 * Publicar um eBook novo é adicionar uma linha em EBOOKS (aqui e em
 * src/lib/ebooks.ts) e rodar de novo.
 *
 * Uso: node scripts/gerar-capas-ebooks.mjs   (não precisa do servidor de pé)
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PASTA = new URL("../public/ebooks/", import.meta.url);
mkdirSync(PASTA, { recursive: true });

const logo = readFileSync(
  new URL("../public/marca/logo-novare-branca.png", import.meta.url),
).toString("base64");

/** Capa 600x800 (3:4), o formato de livro que o card espera. */
const LARGURA = 600;
const ALTURA = 800;

const EBOOKS = [
  {
    arquivo: "ecossistema",
    chapeu: "Guia da casa",
    titulo: "Ecossistema\nNovare",
    linha: "O mapa completo: o que existe, o que é grátis e o que é PRO.",
    // Navy institucional.
    fundo: "linear-gradient(160deg, hsl(215 55% 26%) 0%, hsl(219 56% 12%) 100%)",
  },
  {
    arquivo: "vida-plan",
    chapeu: "Planejamento",
    titulo: "Vida\nPlan",
    linha: "Do sonho ao número: seus objetivos viram um plano com prazo.",
    fundo: "linear-gradient(160deg, hsl(215 50% 22%) 0%, hsl(215 58% 11%) 100%)",
  },
  {
    arquivo: "iris",
    chapeu: "Inteligência",
    titulo: "Íris, a IA\nfinanceira",
    linha: "Como uma IA lê seu extrato e acha o dinheiro que some todo mês.",
    // O verde da família success — é o eBook que fala de ganho.
    fundo: "linear-gradient(160deg, hsl(160 42% 24%) 0%, hsl(162 50% 11%) 100%)",
  },
  {
    arquivo: "profissoes",
    chapeu: "Por profissão",
    titulo: "Finanças por\nProfissão",
    linha: "O que trava o dinheiro de médicos, dentistas, engenheiros e advogados.",
    fundo: "linear-gradient(160deg, hsl(215 48% 24%) 0%, hsl(16 45% 18%) 100%)",
  },
];

function html({ chapeu, titulo, linha, fundo }) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${LARGURA}px; height: ${ALTURA}px; overflow: hidden; position: relative;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: ${fundo};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 54px 48px;
  }
  /* Luz laranja no alto: é o que impede a capa de virar retângulo chapado. */
  .luz { position: absolute; width: 460px; height: 460px; border-radius: 50%;
         top: -230px; right: -160px; filter: blur(90px);
         background: hsl(16 85% 55% / .28); }
  /* Filete da marca, deitado na base. */
  .filete { position: absolute; left: 0; bottom: 0; height: 10px; width: 100%;
            background: linear-gradient(90deg, hsl(16 80% 55%), hsl(197 68% 45%)); }

  .topo { position: relative; }
  .logo { height: 34px; }
  /* block, não inline-block: em linha ele encostava na logo e a margem
     de cima era ignorada. */
  .chapeu { margin-top: 38px; display: block;
            font-size: 16px; font-weight: 800; letter-spacing: .16em;
            text-transform: uppercase; color: hsl(16 88% 68%); }

  .meio { position: relative; }
  h1 { font-size: 62px; font-weight: 800; line-height: 1.04;
       letter-spacing: -.03em; color: #fff; white-space: pre-line; }
  p { margin-top: 22px; max-width: 400px; font-size: 19px; line-height: 1.5;
      font-weight: 500; color: rgba(255,255,255,.72); }

  .base { position: relative; display: flex; align-items: center; gap: 12px;
          font-size: 15px; font-weight: 700; color: rgba(255,255,255,.62); }
  .selo { border: 1px solid rgba(255,255,255,.28); border-radius: 999px;
          padding: 7px 16px; color: #fff; }
</style></head>
<body>
  <div class="luz"></div>

  <div class="topo">
    <img class="logo" src="data:image/png;base64,${logo}" alt="">
    <span class="chapeu">${chapeu}</span>
  </div>

  <div class="meio">
    <h1>${titulo}</h1>
    <p>${linha}</p>
  </div>

  <div class="base">
    <span class="selo">eBook gratuito</span>
    <span>PDF · sem cadastro</span>
  </div>

  <div class="filete"></div>
</body></html>`;
}

const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  viewport: { width: LARGURA, height: ALTURA },
  deviceScaleFactor: 2,
});

for (const ebook of EBOOKS) {
  const pagina = await ctx.newPage();
  await pagina.setContent(html(ebook), { waitUntil: "networkidle" });
  await pagina.waitForTimeout(900); // a fonte precisa carregar antes do clique
  // JPEG, não PNG: a capa é um degradê de ponta a ponta, e em PNG cada uma
  // passava de 600 KB — peso demais para uma miniatura na home.
  const jpg = await pagina.screenshot({ type: "jpeg", quality: 90 });
  await pagina.close();

  writeFileSync(new URL(`${ebook.arquivo}.jpg`, PASTA), jpg);
  console.log(`capa ${ebook.arquivo}.jpg — ${(jpg.length / 1024).toFixed(0)} KB`);
}

await ctx.close();
await navegador.close();
console.log(`\n${EBOOKS.length} capas em public/ebooks/`);
