/**
 * Acessibilidade medida pelo próprio navegador.
 *
 * Não basta olhar o JSX: o que vale é o NOME ACESSÍVEL que o Chrome
 * calcula — é ele que o leitor de tela lê. Por isso aqui se usa a árvore
 * de acessibilidade (CDP), e não `querySelector`.
 *
 * Verifica também o que a auditoria flagrou: clicar no rótulo tem de
 * focar o campo, e o foco tem de ficar preso dentro da janela modal.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROTAS = [
  "/ferramentas/juros-compostos",
  "/ferramentas/salario-liquido",
  "/ferramentas/rescisao",
  "/ferramentas/raio-x-previdencia",
  "/ferramentas/reserva",
  "/ferramentas/comprar-ou-alugar",
  "/ferramentas/financiamento",
  "/ferramentas/tesouro-direto",
  "/ferramentas/previdencia",
];

const falhas = [];
let oks = 0;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const cdp = await p.context().newCDPSession(p);
await cdp.send("Accessibility.enable");

let semNome = 0;
let total = 0;

for (const rota of ROTAS) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);

  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const campos = nodes.filter((n) =>
    ["textbox", "combobox", "spinbutton"].includes(n.role?.value),
  );
  const anonimos = campos.filter((n) => !n.name?.value?.trim());
  total += campos.length;
  semNome += anonimos.length;

  if (anonimos.length > 0) {
    falhas.push(`${rota}: ${anonimos.length} de ${campos.length} campos sem nome acessível`);
  } else if (campos.length > 0) {
    oks++;
  }
}

console.log(`campos medidos: ${total} · sem nome: ${semNome}`);

// Clicar no rótulo tem de focar o campo.
await p.goto(`${BASE}/ferramentas/juros-compostos`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);
const rotulo = p.locator("label").first();
await rotulo.click();
const focado = await p.evaluate(() => document.activeElement?.tagName);
if (focado === "INPUT" || focado === "SELECT") oks++;
else falhas.push(`clique no rótulo não foca o campo (foco em ${focado})`);

// O foco fica preso dentro da janela do card.
await p.goto(`${BASE}/aplicativos?area=ia`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1600);
await p.locator("button[aria-label*='Saber mais']").first().click();
await p.waitForTimeout(600);
let escapou = 0;
for (let i = 0; i < 12; i++) {
  await p.keyboard.press("Tab");
  const dentro = await p.evaluate(() =>
    Boolean(document.querySelector("[role='dialog']")?.contains(document.activeElement)),
  );
  if (!dentro) escapou++;
}
if (escapou === 0) oks++;
else falhas.push(`o foco escapou da janela ${escapou} de 12 vezes`);

await b.close();
console.log(`\n${oks} conferências passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("acessibilidade em ordem");
