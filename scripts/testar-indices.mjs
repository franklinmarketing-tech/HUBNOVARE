/**
 * Garantia das duas ferramentas de índice.
 *
 * Não basta a página abrir: o número na tela precisa ser o mesmo que o Banco
 * Central publica. Aqui cada valor exibido é conferido contra a série crua
 * do SGS, buscada em paralelo por este script.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
const oks = [];

function conferir(nome, condicao, detalhe = "") {
  if (condicao) oks.push(nome);
  else falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

/** Acumula a série direto do BCB, sem passar pelo nosso código. */
async function fatorOficial(serie, de, ate) {
  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json` +
    `&dataInicial=${de}&dataFinal=${ate}`;
  const dados = await (await fetch(url)).json();
  return dados.reduce((f, x) => f * (1 + Number(x.valor) / 100), 1);
}

const moeda = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Espera a tela refletir o período pedido em vez de dormir um tempo fixo.
 * Cada mexida num select dispara uma busca; olhar cedo demais lê o resultado
 * da busca anterior e o teste vira loteria.
 */
async function esperarPeriodo(pagina, ...trechos) {
  await pagina.waitForFunction(
    (t) => {
      const el = document.querySelector("section.bg-primary");
      const txt = el ? el.textContent ?? "" : "";
      return t.every((x) => txt.includes(x));
    },
    trechos,
    { timeout: 20000 },
  );
}

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const pagina = await ctx.newPage();

const erros = [];
pagina.on("console", (m) => m.type() === "error" && erros.push(m.text()));
pagina.on("pageerror", (e) => erros.push(String(e)));

/* ------------------------------------------------ 1. Correção pela inflação */
await pagina.goto(`${BASE}/ferramentas/correcao`, { waitUntil: "networkidle" });

// Período padrão da tela é longo; fixo um período fechado e conhecido.
await pagina.locator("select").nth(0).selectOption("01"); // mês inicial
await pagina.locator("select").nth(1).selectOption("2015");
await pagina.locator("select").nth(2).selectOption("12"); // mês final
await pagina.locator("select").nth(3).selectOption("2024");
await esperarPeriodo(pagina, "01/2015", "12/2024");

const esperadoIpca = 1000 * (await fatorOficial(433, "01/01/2015", "01/12/2024"));
const destaque = await pagina.locator("section.bg-primary p.text-4xl").first().innerText();
conferir(
  "correção: IPCA jan/2015→dez/2024 sobre R$ 1.000",
  destaque.replace(/\s/g, " ").includes(moeda(esperadoIpca).replace(/\s/g, " ")),
  `tela="${destaque}" esperado="${moeda(esperadoIpca)}"`,
);

// A tabela dos cinco índices precisa estar toda preenchida (nada de "—").
const linhas = await pagina.locator("table tbody tr").allInnerTexts();
conferir("correção: cinco índices na tabela", linhas.length === 5, `${linhas.length} linhas`);
conferir(
  "correção: nenhum índice sem dado no período",
  !linhas.some((l) => l.includes("—")),
  linhas.filter((l) => l.includes("—")).join(" | "),
);

// Trocar de índice tem de mudar o destaque.
await pagina.getByRole("button", { name: "IGP-M", exact: true }).click();
await pagina.waitForTimeout(400);
const depois = await pagina.locator("section.bg-primary p.text-4xl").first().innerText();
const esperadoIgpm = 1000 * (await fatorOficial(189, "01/01/2015", "01/12/2024"));
conferir(
  "correção: botão IGP-M troca o resultado",
  depois !== destaque &&
    depois.replace(/\s/g, " ").includes(moeda(esperadoIgpm).replace(/\s/g, " ")),
  `tela="${depois}" esperado="${moeda(esperadoIgpm)}"`,
);

// Digitar outro valor precisa reprecificar sem nova ida ao BCB.
await pagina.locator('input[inputmode="decimal"]').first().fill("2500");
await pagina.waitForTimeout(400);
const dobrado = await pagina.locator("section.bg-primary p.text-4xl").first().innerText();
conferir(
  "correção: valor reage ao que se digita",
  dobrado
    .replace(/\s/g, " ")
    .includes(moeda(2500 * (esperadoIgpm / 1000)).replace(/\s/g, " ")),
  `tela="${dobrado}"`,
);

/* ------------------------------------------------------ 2. Reajuste aluguel */
await pagina.goto(`${BASE}/ferramentas/reajuste-aluguel`, { waitUntil: "networkidle" });
await pagina.locator("select").nth(0).selectOption("01");
await pagina.locator("select").nth(1).selectOption("2025");
await pagina.waitForFunction(
  () => document.body.textContent.includes("Usa o acumulado de 01/2024 a 12/2024"),
  null,
  { timeout: 20000 },
);
// A janela do rótulo já mudou; falta o número do BCB chegar.
await pagina.waitForFunction(
  () =>
    !(document.querySelector("section.bg-primary p.text-4xl")?.textContent ?? "").includes("—"),
  null,
  { timeout: 20000 },
);

// Aniversário jan/2025 usa a janela jan/2024 a dez/2024.
const fatorIgpm = await fatorOficial(189, "01/01/2024", "01/12/2024");
const novoAluguel = 2000 * fatorIgpm;
const alvo = await pagina.locator("section.bg-primary p.text-4xl").first().innerText();
conferir(
  "aluguel: IGP-M de 2024 sobre R$ 2.000 (aniversário jan/2025)",
  alvo.replace(/\s/g, " ").includes(moeda(novoAluguel).replace(/\s/g, " ")),
  `tela="${alvo}" esperado="${moeda(novoAluguel)}"`,
);

const janela = await pagina.getByText(/Usa o acumulado de/).innerText();
conferir(
  "aluguel: janela de 12 meses anterior ao aniversário",
  janela.includes("01/2024") && janela.includes("12/2024"),
  janela,
);

const linhasAluguel = await pagina.locator("table tbody tr").allInnerTexts();
conferir(
  "aluguel: três índices comparados, todos com valor",
  linhasAluguel.length === 3 && !linhasAluguel.some((l) => l.includes("—")),
  linhasAluguel.join(" | "),
);

// Período ainda aberto (aniversário no futuro) tem de avisar, não inventar.
await pagina.locator("select").nth(1).selectOption(String(new Date().getFullYear() + 1));
await pagina
  .getByText(/ainda não publicou os doze meses/)
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});
conferir(
  "aluguel: avisa quando o período ainda não fechou",
  await pagina.getByText(/ainda não publicou os doze meses/).isVisible(),
);

conferir("sem erros de console", erros.length === 0, erros.slice(0, 3).join(" | "));

await navegador.close();

console.log(`\n${oks.length} passaram:`);
for (const o of oks) console.log("  ok  " + o);
if (falhas.length) {
  console.log(`\n${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("\ntudo certo");
