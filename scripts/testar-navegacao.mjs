/**
 * A navegação de saída: dá para voltar ao Workspace de dentro de uma
 * ferramenta, o perfil abre numa aba ao lado (sem derrubar o que estava
 * aberto) e a home sempre começa do topo, sem filtro pendurado.
 */
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

/* ---- botão voltar dentro das ferramentas ---- */
for (const rota of ["/ferramentas/salario-liquido", "/ferramentas/juros-compostos", "/ferramentas/rescisao", "/ferramentas/amortizacao"]) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  const botao = p.locator('a:has-text("Voltar ao Workspace")').first();
  const tem = (await botao.count()) > 0;
  conferir(`${rota}: tem botão de voltar`, tem);
  if (!tem) continue;
  conferir(`${rota}: o botão está visível`, await botao.isVisible());
  await botao.click();
  await p.waitForURL((u) => u.pathname === "/", { timeout: 10000 }).catch(() => {});
  conferir(`${rota}: o botão leva para a home`, new URL(p.url()).pathname === "/", p.url());
}

/* ---- o perfil abre numa aba ao lado ---- */
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
const perfil = p.locator('a[aria-label*="perfil"]').first();
conferir("a barra tem o atalho do perfil", (await perfil.count()) > 0);
conferir("o perfil abre em nova aba", (await perfil.getAttribute("target")) === "_blank");

const antes = ctx.pages().length;
const [nova] = await Promise.all([ctx.waitForEvent("page"), perfil.click()]);
await nova.waitForLoadState("domcontentloaded");
conferir("abriu uma aba nova", ctx.pages().length === antes + 1);
// Visitante sem sessão é mandado para o login com destino guardado —
// isso é o certo; o que não pode é a aba principal sair do lugar.
const destino = new URL(nova.url());
conferir(
  "a aba nova é o perfil (ou o login que leva a ele)",
  destino.pathname === "/perfil" ||
    (destino.pathname === "/login" && destino.search.includes("perfil")),
  nova.url(),
);
conferir("a home continua aberta", new URL(p.url()).pathname === "/", p.url());
await nova.close();

/* ---- a home começa do topo, sem filtro ---- */
await p.goto(BASE + "/aplicativos?area=trabalho", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);
await p.evaluate(() => window.scrollTo(0, 600));
await p.waitForTimeout(300);
await p.locator('a[aria-label="Novare, início"]').first().click();
await p.waitForURL((u) => u.pathname === "/", { timeout: 10000 }).catch(() => {});
await p.waitForTimeout(900);
conferir("volta para a home limpa", p.url().endsWith("/") && !p.url().includes("area="), p.url());
conferir("a home começa no topo", (await p.evaluate(() => window.scrollY)) < 5);

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
