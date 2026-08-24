/**
 * O card do Novare News na home substituiu o banner "Vida Plan e Íris
 * liberados" — o canal agora é um produto gratuito da casa, com porta
 * fixa na home e no topo de qualquer página.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);

const corpo = await p.locator("body").innerText();
conferir("o banner antigo saiu", !/liberados/i.test(corpo), corpo.match(/.{0,20}liberados.{0,20}/i)?.[0]);
conferir("o card do News aparece", /novare news/i.test(corpo));
conferir("mostra o selo Grátis", /grátis/i.test(corpo));
// Três links legítimos levam ao canal: trilho lateral, botão do topo e o
// card da home. É o card grande que precisa ter a manchete.
const cardHome = p.locator("main a[href='/novare-news']").first();
conferir("mostra a manchete mais recente", (await cardHome.innerText()).length > 40);
conferir("o card na home leva para /novare-news", await cardHome.isVisible());

const botaoTopo = p.locator("header a[href='/novare-news']");
conferir("o botão News está no topo", (await botaoTopo.count()) > 0);

conferir(
  "a home continua cabendo numa tela",
  await p.evaluate(() => document.documentElement.scrollHeight - window.innerHeight <= 2),
);

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
