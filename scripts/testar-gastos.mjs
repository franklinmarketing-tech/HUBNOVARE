import { chromium } from "playwright";

/**
 * Fluxo CRUD do Controle de Gastos: adicionar, persistir após reload,
 * remover. É o que separa as ferramentas de uso diário das calculadoras.
 */
let falhas = 0;
function conferir(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK   " : "FALHA"}  ${rotulo.padEnd(38)} ${obtido}${ok ? "" : `  (esperado: ${esperado})`}`,
  );
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });

await pagina.goto("http://localhost:3000/ferramentas/gastos", {
  waitUntil: "networkidle",
});

// Começa limpo, para o teste ser repetível.
await pagina.evaluate(() => localStorage.removeItem("novare:gastos"));
await pagina.reload({ waitUntil: "networkidle" });
await pagina.waitForTimeout(400);

// 1. Adicionar um lançamento
await pagina
  .getByPlaceholder("Almoço, mercado da semana, gasolina...")
  .fill("Teste automatizado");
await pagina.getByPlaceholder("0,00").fill("123,45");
await pagina.locator("form button, main button").first().click();
await pagina.waitForTimeout(400);

const aparece = await pagina.getByText("Teste automatizado").count();
conferir("lançamento aparece na lista", aparece >= 1, "true");

const salvo = await pagina.evaluate(() => {
  const bruto = localStorage.getItem("novare:gastos");
  return bruto ? JSON.parse(bruto).length : 0;
});
conferir("gravou no localStorage", salvo, 1);

// 2. Persiste após recarregar
await pagina.reload({ waitUntil: "networkidle" });
await pagina.waitForTimeout(600);
conferir(
  "persiste após reload",
  (await pagina.getByText("Teste automatizado").count()) >= 1,
  "true",
);

// 3. Remover pela lixeira (aria-label do item)
await pagina
  .getByLabel("Remover lançamento Teste automatizado")
  .click();
await pagina.waitForTimeout(400);
conferir(
  "remoção limpa a lista",
  await pagina.getByText("Teste automatizado").count(),
  0,
);
conferir(
  "remoção limpa o storage",
  await pagina.evaluate(() => {
    const bruto = localStorage.getItem("novare:gastos");
    return bruto ? JSON.parse(bruto).length : 0;
  }),
  0,
);

await navegador.close();
console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
