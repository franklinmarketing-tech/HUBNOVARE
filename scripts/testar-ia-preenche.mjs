/**
 * O preenchimento por IA de ponta a ponta: a pessoa escreve do jeito dela,
 * os campos se preenchem e o RESULTADO recalcula.
 *
 * Sem OPENAI_API_KEY o recurso não deve aparecer — isso também é
 * comportamento correto e está coberto aqui.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));

const { disponivel } = await (await fetch(`${BASE}/api/preencher`)).json();

if (!disponivel) {
  await p.goto(`${BASE}/ferramentas/salario-liquido`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  conferir(
    "sem chave, o recurso não aparece",
    (await p.getByRole("button", { name: /Deixa comigo/ }).count()) === 0,
  );
} else {
  /**
   * Escreve na caixa e espera o resultado. As pausas não são frescura: o
   * componente valida o tamanho do texto no clique, então clicar antes do
   * React registrar o que foi digitado faz o envio ser barrado em silêncio.
   */
  async function pedirParaPreencher(rota, texto) {
    // No modo de desenvolvimento a rota compila na primeira visita; essa
    // espera sozinha já estoura o tempo do teste.
    await p.goto(`${BASE}${rota}`, { waitUntil: "networkidle" }).catch(() => {});
    await p.waitForTimeout(400);
    await p.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(900);

    await p.getByRole("button", { name: /Deixa comigo/ }).click();
    await p.waitForTimeout(300);
    await p.locator("textarea").fill(texto);
    await p.waitForTimeout(300);
    await p.getByRole("button", { name: /Preencher para mim/ }).click();

    await p
      .waitForFunction(() => document.body.innerText.includes("Preenchi"), null, {
        timeout: 45000,
      })
      .catch(() => {});
  }

  /* --------------------------------------------- salário líquido */
  await pedirParaPreencher(
    "/ferramentas/salario-liquido",
    "ganho 4200 de carteira, tenho 2 filhos e descontam 180 do plano",
  );

  const campos = p.locator('input[inputmode="decimal"]');
  const bruto = await campos.nth(0).inputValue();
  const deps = await campos.nth(1).inputValue();
  const outros = await campos.nth(3).inputValue();

  conferir("preencheu o salário bruto", bruto === "4200", bruto);
  conferir("preencheu os dependentes", deps === "2", deps);
  conferir("preencheu os outros descontos", outros === "180", outros);

  // O que importa de verdade: o resultado reflete o que foi preenchido.
  // 4.200 cai na faixa de 12% do INSS (392,60) e é isento de IR.
  // 4.200 − 392,60 − 180 = 3.627,40.
  const resultado = await p
    .locator("section.bg-primary p.text-4xl")
    .first()
    .innerText();
  conferir("o resultado recalculou sozinho", resultado.includes("3.627,40"), resultado);

  conferir(
    "convida para o Workspace depois de preencher",
    await p.getByText(/todas as suas contas/).isVisible().catch(() => false),
  );

  /* ---------------------------------------------------- rescisão */
  await pedirParaPreencher(
    "/ferramentas/rescisao",
    "fui demitido dia 15, ganhava 3200 e trabalhei 3 anos la. FGTS tem uns 9 mil",
  );

  const cr = p.locator('input[inputmode="decimal"]');
  const salario = await cr.nth(0).inputValue();
  const meses = await cr.nth(1).inputValue();
  const dias = await cr.nth(2).inputValue();
  const fgts = await cr.nth(3).inputValue();

  conferir("rescisão: salário", salario === "3200", salario);
  conferir("rescisão: 3 anos viraram 36 meses", meses === "36", meses);
  conferir("rescisão: dias trabalhados", dias === "15", dias);
  conferir("rescisão: saldo do FGTS", fgts === "9000", fgts);
}

conferir("sem erros de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();

console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
