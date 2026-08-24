/**
 * As telas trabalhistas mostrando o valor certo. O motor já é testado à
 * parte; aqui o que se prova é que o número não se perde no caminho até o
 * olho do usuário.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const erros = [];

function conferir(nome, ok, detalhe = "") {
  if (ok) oks++;
  else falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
p.on("pageerror", (e) => erros.push(String(e)));

const destaque = () => p.locator("section.bg-primary p.text-4xl").first().innerText();
const limpo = (t) => t.replace(/\s/g, " ");

/* salário líquido: o caso que prova a regra nova de 2026 */
await p.goto(`${BASE}/ferramentas/salario-liquido`, { waitUntil: "networkidle" });
await p.locator('input[inputmode="decimal"]').first().fill("5000");
await p.waitForTimeout(400);
conferir(
  "salário 5.000 → líquido 4.498,49 (isento de IR)",
  limpo(await destaque()).includes("4.498,49"),
  await destaque(),
);
conferir(
  "avisa que está na faixa isenta",
  await p.getByText(/faixa isenta de imposto de renda/).isVisible(),
);

await p.locator('input[inputmode="decimal"]').first().fill("10000");
await p.waitForTimeout(400);
conferir(
  "salário 10.000 → líquido 7.442,36",
  limpo(await destaque()).includes("7.442,36"),
  await destaque(),
);

await p.locator('input[inputmode="decimal"]').first().fill("2000");
await p.waitForTimeout(400);
conferir(
  // 2.000 cai na faixa de 9%: 180 menos a parcela de 24,32 = 155,68 de INSS.
  "salário 2.000 → só desconta INSS (1.844,32)",
  limpo(await destaque()).includes("1.844,32"),
  await destaque(),
);

/* férias: o insight de vender dez dias */
await p.goto(`${BASE}/ferramentas/ferias`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
conferir(
  "férias de 3.000 → bruto 4.000 com o terço",
  (await p.locator("body").innerText()).includes("4.000,00"),
);
conferir(
  "compara tirar 30 dias com vender 10",
  await p.getByText(/Tirar 30 dias ou vender 10/).isVisible(),
);

/* 13º: as duas parcelas */
await p.goto(`${BASE}/ferramentas/decimo-terceiro`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
const texto13 = await p.locator("body").innerText();
conferir("13º mostra 1ª parcela de 1.500,00", texto13.includes("1.500,00"));
conferir("13º explica por que a 2ª vem menor", texto13.includes("segunda parcela vem tão menor"));

/* FGTS */
await p.goto(`${BASE}/ferramentas/fgts`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
conferir(
  "FGTS 3.000 x 24 meses → 5.760,00",
  limpo(await destaque()).includes("5.760,00"),
  await destaque(),
);

/* rescisão */
await p.goto(`${BASE}/ferramentas/rescisao`, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
conferir("rescisão abre com direito a seguro", await p.getByText(/tem direito ao seguro-desemprego/).isVisible());
await p.getByRole("button", { name: "Pedi demissão" }).click();
await p.waitForTimeout(400);
conferir(
  "pedido de demissão tira o seguro",
  await p.getByText(/Sem seguro-desemprego nesse caso/).isVisible(),
);

/* seguro-desemprego */
await p.goto(`${BASE}/ferramentas/seguro-desemprego`, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
conferir(
  "média 2.500 → parcela 1.916,66",
  limpo(await destaque()).includes("1.916,6"),
  await destaque(),
);
await p.locator('input[inputmode="decimal"]').nth(3).fill("3");
await p.waitForTimeout(400);
conferir(
  "3 meses trabalhados: avisa que não tem direito",
  await p.getByText(/Ainda sem direito/).isVisible(),
);

conferir("sem erros de console", erros.length === 0, erros.slice(0, 3).join(" | "));

await b.close();

console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
