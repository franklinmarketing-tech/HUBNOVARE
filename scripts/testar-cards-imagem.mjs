/**
 * Todo card do catálogo precisa do seu emblema, e a foto de capa não pode
 * cobrir o texto. É o tipo de coisa que só quebra em produção, quando um
 * slug novo entra sem imagem mapeada.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });

const quebradas = [];
p.on("response", (r) => {
  if (r.request().resourceType() === "image" && r.status() >= 400) {
    quebradas.push(`${r.status()} ${r.url().split("/").pop()}`);
  }
});

await p.goto(`${BASE}/aplicativos`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
// Rola até o fim: as imagens carregam sob demanda.
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2500);

const cards = await p.locator("main a.card-cine, main div.card-cine").count();
conferir("o catálogo mostra os cards", cards >= 20, `${cards} cards`);

// Cada card com emblema tem uma imagem dentro.
const comImagem = await p.locator("main .card-cine img").count();
conferir("todo card tem imagem", comImagem >= cards, `${comImagem} imagens para ${cards} cards`);

conferir("nenhuma imagem quebrada", quebradas.length === 0, quebradas.slice(0, 3).join(" | "));

// O texto não pode ficar escondido atrás da foto.
const titulosVisiveis = await p
  .locator("main .card-cine h3")
  .evaluateAll((els) =>
    els.filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 40 && getComputedStyle(e).visibility !== "hidden";
    }).length,
  );
conferir("os nomes continuam legíveis", titulosVisiveis >= cards, `${titulosVisiveis}/${cards}`);

const vazou = await p.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 1,
);
conferir("sem rolagem horizontal", !vazou);

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
