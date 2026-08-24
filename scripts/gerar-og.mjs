/**
 * Gera a imagem de compartilhamento (o preview que aparece ao colar o link
 * no WhatsApp, LinkedIn ou Telegram).
 *
 * Em vez de um banner genérico, mostra a HOME DE VERDADE numa moldura de
 * navegador: quem recebe o link vê na hora que do outro lado tem um
 * sistema, não uma página de captura. O screenshot é tirado na hora, então
 * a imagem nunca fica desatualizada em relação ao produto.
 *
 * Uso: node scripts/gerar-og.mjs   (com o servidor de pé)
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SAIDA = new URL("../public/og.png", import.meta.url);

const navegador = await chromium.launch();

/* -------------------------------------------- 1. a home, como ela é hoje */
const ctx = await navegador.newContext({
  viewport: { width: 1440, height: 820 },
  deviceScaleFactor: 2,
});
const pagina = await ctx.newPage();
await pagina.goto(BASE, { waitUntil: "networkidle" });
// Deixa as animações de entrada terminarem, senão o card sai meio apagado.
await pagina.waitForTimeout(2000);
const captura = await pagina.screenshot();
await ctx.close();

const embutido = `data:image/png;base64,${captura.toString("base64")}`;
const logo = readFileSync(
  new URL("../public/marca/logo-novare-branca.png", import.meta.url),
).toString("base64");

/* ------------------------------------------------- 2. a arte do card */
const marca = { h: 215, s: 50 };

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: linear-gradient(150deg,
      hsl(${marca.h} ${marca.s}% 20%) 0%,
      hsl(${marca.h} ${marca.s + 6}% 12%) 60%,
      hsl(${marca.h} ${marca.s + 10}% 9%) 100%);
    position: relative; display: flex; align-items: center;
  }
  /* Duas luzes: a laranja da marca e um azul frio de contraponto. */
  .aurora-a, .aurora-b { position: absolute; border-radius: 50%; filter: blur(90px); }
  .aurora-a { width: 620px; height: 620px; top: -260px; right: -120px;
              background: hsl(16 85% 55% / .30); }
  .aurora-b { width: 520px; height: 520px; bottom: -280px; left: -140px;
              background: hsl(200 80% 55% / .18); }

  .texto { position: relative; width: 560px; padding: 0 0 0 68px; }
  .logo { height: 40px; margin-bottom: 30px; }
  h1 { font-size: 60px; font-weight: 800; line-height: 1.02;
       letter-spacing: -.028em; color: #fff; }
  h1 em { font-style: normal; color: hsl(16 90% 66%); }
  p.sub { margin-top: 18px; font-size: 21px; line-height: 1.45;
          color: rgba(255,255,255,.72); font-weight: 500; max-width: 460px; }
  ul { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 9px; max-width: 490px; }
  li { list-style: none; font-size: 15px; font-weight: 700; color: rgba(255,255,255,.92);
       background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.16);
       padding: 8px 15px; border-radius: 999px; }

  /* A home numa moldura de navegador, sangrando para fora da direita:
     dá profundidade e sugere que tem mais coisa além da borda. */
  .janela { position: absolute; right: -110px; top: 84px; width: 720px;
            border-radius: 16px; overflow: hidden;
            border: 1px solid rgba(255,255,255,.16);
            box-shadow: 0 50px 100px -30px rgba(0,0,0,.75);
            transform: perspective(1700px) rotateY(-13deg) rotateX(3deg); }
  .barra { height: 30px; background: #f1f5f9; display: flex; align-items: center;
           gap: 6px; padding-left: 12px; }
  .barra i { width: 9px; height: 9px; border-radius: 50%; display: block; }
  .janela img { width: 100%; display: block; }
</style></head>
<body>
  <div class="aurora-a"></div><div class="aurora-b"></div>

  <div class="texto">
    <img class="logo" src="data:image/png;base64,${logo}" alt="">
    <h1>Suas contas,<br>com a <em>conta certa</em>.</h1>
    <p class="sub">
      Calculadoras financeiras gratuitas, sem cadastro, com as tabelas
      oficiais de 2026.
    </p>
    <ul>
      <li>Salário líquido</li>
      <li>Rescisão</li>
      <li>Financiamento</li>
      <li>Juros compostos</li>
      <li>Reajuste de aluguel</li>
    </ul>
  </div>

  <div class="janela">
    <div class="barra">
      <i style="background:#ff5f57"></i>
      <i style="background:#febc2e"></i>
      <i style="background:#28c840"></i>
    </div>
    <img src="${embutido}" alt="">
  </div>
</body></html>`;

const ctx2 = await navegador.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
const arte = await ctx2.newPage();
await arte.setContent(html, { waitUntil: "networkidle" });
await arte.waitForTimeout(1200); // a fonte precisa carregar antes do clique
const png = await arte.screenshot({ type: "png" });
await ctx2.close();
await navegador.close();

writeFileSync(SAIDA, png);
console.log(`og.png gerado: ${(png.length / 1024).toFixed(0)} KB, 1200x630`);
