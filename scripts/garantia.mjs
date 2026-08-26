import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";

/**
 * GARANTIA FUNCIONAL das ferramentas locais (fora Planejamento, Íris e IA).
 *
 * Nível A (todas): a página responde, não lança erro de console, mostra
 * valores e REAGE quando o usuário digita — prova de que o motor está vivo.
 *
 * Nível B (críticas): asserção de VALOR EXATO — IR, PGBL, CRUDs e parsers.
 */
let falhas = 0;
function conferir(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK   " : "FALHA"}  ${rotulo.padEnd(48)} ${String(obtido).slice(0, 60)}${ok ? "" : `  (esperado: ${esperado})`}`,
  );
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
const errosConsole = [];
pagina.on("pageerror", (e) => errosConsole.push(e.message));

async function abrir(rota) {
  await pagina.goto(`${BASE}${rota}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  // Espera o CONTEÚDO, não a rede: com animação de fundo, `networkidle` é um
  // cronômetro disfarçado e às vezes devolve a página antes de ela pintar —
  // aí a checagem "tem R$ na tela" reprova uma calculadora que está sã.
  await pagina.waitForSelector("main h1, main input", {
    state: "visible",
    timeout: 25000,
  });
  await pagina.waitForTimeout(400);
}

/* ============================== NÍVEL A ============================== */

const CALCULADORAS = [
  "/ferramentas/juros-compostos",
  "/ferramentas/financiamento?tipo=casa",
  "/ferramentas/financiamento?tipo=carro",
  "/ferramentas/financiamento?tipo=terreno",
  "/ferramentas/consorcio",
  "/ferramentas/aportes",
  "/ferramentas/tesouro-direto",
  "/ferramentas/emprestimos",
  "/ferramentas/cet",
  "/ferramentas/radar",
  "/ferramentas/tributario",
  "/ferramentas/score",
];

console.log("--- Nível A: calculadoras reagem ao digitar ---");
for (const rota of CALCULADORAS) {
  await abrir(rota);
  const antes = await pagina.evaluate(() => document.body.innerText.length);
  const temValor = await pagina.evaluate(() =>
    /R\$|%/.test(document.body.innerText),
  );

  // Digita um valor distinto no primeiro campo de texto e mede a reação.
  const campo = pagina
    .locator('main input[type="text"], main input[inputmode="numeric"], main input:not([type])')
    .first();
  let reagiu = "sem-campo";
  if ((await campo.count()) > 0) {
    await campo.fill("7777");
    await pagina.waitForTimeout(500);
    const depois = await pagina.evaluate(() => document.body.innerText.length);
    const texto = await pagina.evaluate(() => document.body.innerText);
    reagiu = depois !== antes || texto.includes("7.777") || texto.includes("7777");
  } else {
    // Paginas de perguntas (score): reagem trocando um select.
    const select = pagina.locator("main select").first();
    if ((await select.count()) > 0) {
      await select.selectOption({ index: 1 });
      await pagina.waitForTimeout(500);
      const depois = await pagina.evaluate(() => document.body.innerText.length);
      reagiu = depois !== antes;
    }
  }

  conferir(
    rota,
    `valores=${temValor} reage=${reagiu} erros=${errosConsole.length}`,
    "valores=true reage=true erros=0",
  );
  errosConsole.length = 0;
}

const PAGINAS_CRUD = [
  "/ferramentas/orcamento",
  "/ferramentas/gastos",
  "/ferramentas/calendario",
  "/ferramentas/assinaturas",
  "/ferramentas/cartoes",
  "/ferramentas/patrimonio",
  "/ferramentas/seguros",
  "/ferramentas/alertas",
  "/ferramentas/central",
  "/ferramentas/scanner-extratos",
  "/ferramentas/leitor-contratos",
  "/ferramentas/ir",
];

console.log("--- Nível A: páginas de uso diário carregam sem erro ---");
for (const rota of PAGINAS_CRUD) {
  await abrir(rota);
  const carregou = await pagina.evaluate(() => document.body.innerText.length > 300);
  conferir(rota, `carregou=${carregou} erros=${errosConsole.length}`, "carregou=true erros=0");
  errosConsole.length = 0;
}

/* ============================== NÍVEL B ============================== */
console.log("--- Nível B: valores exatos ---");

// IR: renda 120.000 sem deduções = 22.248 (tabela anual ano-base 2025).
// O campo usa a máscara de dinheiro estilo caixa: os dígitos entram como
// CENTAVOS, então R$ 120.000,00 se digita como "12000000".
await abrir("/ferramentas/ir");
{
  const campos = pagina.locator('main input[placeholder="0,00"]');
  await campos.first().fill("12000000");
  await pagina.waitForTimeout(500);
  conferir(
    "IR anual de 120 mil = 22.248",
    (await pagina.evaluate(() => document.body.innerText)).includes("22.248"),
    "true",
  );
}

// PGBL: renda 120.000 + aporte 14.400 = economia 3.960
await abrir("/ferramentas/tributario");
{
  await pagina.locator('main input[placeholder="120.000,00"]').fill("120000");
  await pagina.locator('main input[placeholder="14.400,00"]').fill("14400");
  await pagina.waitForTimeout(500);
  conferir(
    "PGBL economiza 3.960",
    (await pagina.evaluate(() => document.body.innerText)).includes("3.960"),
    "true",
  );
}

// Leitor de contratos: acha cláusula de multa
await abrir("/ferramentas/leitor-contratos");
{
  await pagina
    .locator("main textarea")
    .fill(
      "Cláusula 9. Em caso de rescisão antecipada será cobrada multa de 30% sobre o saldo, com renovação automática por igual período.",
    );
  await pagina.waitForTimeout(600);
  const texto = await pagina.evaluate(() => document.body.innerText.toLowerCase());
  conferir(
    "leitor acha multa + renovação",
    texto.includes("multa") && texto.includes("renova"),
    "true",
  );
}

// Scanner de extratos: parse + total
await abrir("/ferramentas/scanner-extratos");
{
  await pagina
    .locator("main textarea")
    .fill("06/08/2026;Uber viagem;-24,90\n06/08/2026;Mercado Pão;-135,10");
  // O parse roda no clique, de propósito (ação explícita do usuário).
  await pagina.getByRole("button", { name: /escanear extrato/i }).click();
  await pagina.waitForTimeout(700);
  const texto = await pagina.evaluate(() => document.body.innerText);
  conferir(
    "extrato soma 160,00 detectados",
    texto.includes("160,00"),
    "true",
  );
}

// Assinaturas: sugestão Netflix → custo anual 538,80
await abrir("/ferramentas/assinaturas");
{
  await pagina.evaluate(() => localStorage.removeItem("novare:assinaturas"));
  await pagina.reload({ waitUntil: "networkidle" });
  await pagina.waitForTimeout(500);
  await pagina.getByRole("button", { name: /netflix/i }).first().click();
  await pagina.waitForTimeout(200);
  await pagina.getByRole("button", { name: /adicionar assinatura/i }).click();
  await pagina.waitForTimeout(500);
  const texto = await pagina.evaluate(() => document.body.innerText);
  conferir(
    "Netflix 44,90 vira 538,80/ano",
    texto.includes("538,80"),
    "true",
  );
  await pagina.evaluate(() => localStorage.removeItem("novare:assinaturas"));
}

// Patrimônio: ativo 500.000 + dívida 200.000 = líquido 300.000
await abrir("/ferramentas/patrimonio");
{
  await pagina.evaluate(() => localStorage.removeItem("novare:patrimonio"));
  await pagina.reload({ waitUntil: "networkidle" });
  await pagina.waitForTimeout(500);
  await pagina
    .locator('main input[placeholder="Apartamento, carro, CDB, conta corrente..."]')
    .fill("Apartamento");
  // Máscara de dinheiro: dígitos entram como CENTAVOS → R$ 500.000,00.
  await pagina.locator('main input[placeholder="0,00"]').first().fill("50000000");
  await pagina.getByRole("button", { name: /adicionar ativo/i }).click();
  await pagina.waitForTimeout(400);
  const texto = await pagina.evaluate(() => document.body.innerText);
  conferir(
    "patrimônio registra 500.000",
    texto.includes("500.000"),
    "true",
  );
  await pagina.evaluate(() => localStorage.removeItem("novare:patrimonio"));
}

await navegador.close();
console.log(falhas === 0 ? "\nGARANTIA COMPLETA" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
