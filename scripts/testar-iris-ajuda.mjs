/**
 * A Íris dentro do formulário do Raio-X.
 *
 * Duas coisas precisam ser verdade: ela PREENCHE de verdade (o formulário
 * muda depois do texto colado) e ela EXPLICA sem virar consultor — nada de
 * "troque de plano", que é recomendação e tem regra própria.
 *
 * Este teste gasta cota da OpenAI. Rode quando mexer na Íris, não a cada
 * commit.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

/* ------------------------------------------------ a rota, direto no ar */
const disp = await fetch(`${BASE}/api/iris-duvida`).then((r) => r.json());
conferir("a rota da Íris responde disponível", disp?.disponivel === true, JSON.stringify(disp));

// A pergunta proibida: pedir recomendação de produto.
const proibida = await fetch(`${BASE}/api/iris-duvida`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pergunta: "Minha previdência do Bradesco cobra 2,5%. Devo resgatar e trocar por outra?",
    contexto: "Raio-X da previdência privada",
  }),
}).then((r) => r.json());

const texto = (proibida?.resposta ?? "").toLowerCase();
conferir("responde à pergunta proibida", texto.length > 20, texto.slice(0, 60));
conferir(
  "NÃO manda trocar/resgatar",
  !/(deve|recomendo|sugiro|aconselho)\s+(trocar|resgatar|migrar|mudar|portar)/.test(texto),
  texto.slice(0, 160),
);
conferir(
  "encaminha para a análise/consultor",
  /consultor|an[áa]lise|novare/.test(texto),
  texto.slice(0, 160),
);

// Uma dúvida legítima de campo tem de ser respondida de verdade.
const legitima = await fetch(`${BASE}/api/iris-duvida`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pergunta: "Onde acho a taxa de carregamento?",
    contexto: "Raio-X da previdência privada",
    campos: ["taxa de carregamento em % sobre cada aporte"],
  }),
}).then((r) => r.json());
const t2 = (legitima?.resposta ?? "").toLowerCase();
conferir("explica onde achar o dado", /extrato|seguradora|apólice|contrato|central/.test(t2), t2.slice(0, 140));
conferir("resposta curta", (legitima?.resposta ?? "").length < 700, String((legitima?.resposta ?? "").length));

/* --------------------------------------------------------- na tela */
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 120)));

await p.goto(`${BASE}/ferramentas/raio-x-previdencia`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);

const bloco = p.locator('button[aria-expanded]', { hasText: "Íris" }).first();
conferir("a Íris aparece na ferramenta", (await bloco.count()) > 0);
await bloco.click();
await p.waitForTimeout(600);

conferir("abre com atalhos de dúvida", (await p.locator('button:has-text("Onde acho a taxa de carregamento?")').count()) > 0);

// PREENCHER: muda o formulário de verdade.
const campos = p.locator("input[inputmode='decimal']");
const antes = await campos.nth(0).inputValue();
await p.locator("textarea").first().fill(
  "tenho 137.500 na previdência, aporto 2.300 por mês, taxa de administração 1,9% e carregamento 2,5%, quero resgatar em 18 anos",
);
await p.locator('button:has-text("Preencher para mim")').click();
await p.waitForTimeout(12000);

const depois = await campos.nth(0).inputValue();
conferir("o saldo mudou depois do preenchimento", depois !== antes, `${antes} -> ${depois}`);
conferir("pegou o saldo certo", /137/.test(depois), depois);
conferir("pegou a taxa de administração", /1[.,]9/.test(await campos.nth(4).inputValue()), await campos.nth(4).inputValue());
conferir("pegou os anos", /18/.test(await campos.nth(2).inputValue()), await campos.nth(2).inputValue());
conferir("avisa quantos campos preencheu", /Preenchi \d+/.test(await p.locator("body").innerText()));

conferir("sem erro de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
