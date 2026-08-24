/**
 * A explicação dos produtos PRO e das consultorias no catálogo.
 *
 * O popup de hover foi aposentado: agora quem explica é a lâmpada do card,
 * que abre a janela do `ModalApp`. Este teste cobre a ponta que o
 * `testar-lampada.mjs` não cobre — as CONSULTORIAS, que têm conteúdo
 * próprio (a análise gratuita) — e garante que clicar no card continua
 * abrindo o produto direto, sem passo a mais.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));

await p.goto(`${BASE}/aplicativos?area=ia`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);

/* --------------------------------------------------- as 4 consultorias */
const consultoria = p
  .locator("a.card-cine", { hasText: "Diagnóstico Financeiro" })
  .first();
conferir("card da consultoria existe", (await consultoria.count()) > 0);

await consultoria.locator("button[aria-label*='Saber mais']").first().click();
await p.waitForTimeout(600);

const janela = p.locator("[role='dialog']");
conferir("a lâmpada da consultoria abre a janela", await janela.isVisible());

const texto = await janela.innerText();
conferir("explica o serviço", /raio-x completo/i.test(texto), texto.slice(0, 90));
conferir("menciona a análise gratuita", /gratuita/i.test(texto));
conferir("oferece contratar/abrir", /abrir /i.test(texto));

await p.keyboard.press("Escape");
await p.waitForTimeout(400);
conferir("Esc fecha", (await p.locator("[role='dialog']").count()) === 0);

/* ------------------------------------- o clique no card continua direto */
const vidaPlan = p.locator("a.card-cine", { hasText: "Vida Plan" }).first();
await vidaPlan.click({ position: { x: 40, y: 30 } });
await p.waitForURL((u) => u.pathname.startsWith("/vidaplan"), { timeout: 15000 }).catch(() => {});
conferir("clicar no card abre o app direto", p.url().includes("/vidaplan"), p.url());

conferir("sem erros de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
