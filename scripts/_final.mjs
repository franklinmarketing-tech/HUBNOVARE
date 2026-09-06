import { chromium } from "playwright";
const B = "https://hub.novareapp.com.br";
const FERRAMENTAS = ["salario-liquido","rescisao","ferias","decimo-terceiro","fgts","ir","consignado",
  "financiamento","sac-price","amortizacao","cet","emprestimos","juros-compostos","tesouro-direto",
  "rentabilidade-real","previdencia","reserva","orcamento","gastos","calendario","seguros",
  "comprar-ou-alugar","potencial-compra","pix-parcelado","dividendos","rebalanceador","correcao"];
const n = await chromium.launch();
const quebradas = [];
for (const f of FERRAMENTAS) {
  const p = await n.newPage({ viewport: { width: 1000, height: 800 } });
  const erros = [];
  p.on("pageerror", e => erros.push(e.message.slice(0,80)));
  try {
    const r = await p.goto(`${B}/ferramentas/${f}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await p.waitForTimeout(1800);
    const txt = await p.evaluate(() => document.body.innerText);
    const problemas = [];
    if (r.status() !== 200) problemas.push(`HTTP ${r.status()}`);
    if (txt.includes("NaN")) problemas.push("mostra NaN");
    if (txt.includes("Infinity")) problemas.push("mostra Infinity");
    if (txt.includes("undefined")) problemas.push("mostra undefined");
    if (erros.length) problemas.push(`js: ${erros[0]}`);
    if (problemas.length) quebradas.push(`${f}: ${problemas.join(", ")}`);
  } catch (e) {
    quebradas.push(`${f}: ${String(e.message).slice(0,60)}`);
  }
  await p.close();
}
console.log(`Testadas ${FERRAMENTAS.length} ferramentas.`);
console.log(quebradas.length ? "\nPROBLEMAS:\n" + quebradas.join("\n") : "\nNenhum NaN, Infinity, undefined ou erro de JS.");
await n.close();
