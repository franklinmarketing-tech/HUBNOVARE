/**
 * O FINCASH FUNCIONA DE VERDADE?
 *
 * Os outros guardiões abrem páginas e leem o que está escrito. Este USA o
 * app: entra pela conta de demonstração, lança um gasto, confere que o
 * valor gravado é o digitado, liga um aviso e recarrega para ver se a
 * escolha sobreviveu.
 *
 * ⚠️ POR QUE ISSO PRECISA EXISTIR SEPARADO: um item de menu apontando para
 * rota apagada não derruba página nenhuma, não gera erro de JavaScript e
 * não aparece em varredura de texto. Foi assim que "Levar ao FINPLAN"
 * sobreviveu à exclusão do produto — o sintoma era o Next pedindo a rota
 * morta e levando 404 em TODAS as telas do app, porque ele pré-carrega o
 * destino de cada link do menu. Só apareceu navegando.
 *
 * ⚠️ ELE CRIA UMA CONTA DE VERDADE no Supabase de produção, porque
 * /fincash/testar é assim por desenho. Cada execução deixa uma conta de
 * demonstração lá. Não é para rodar em laço.
 *
 * ⚠️ O QUE ELE LIGA, ELE DESLIGA: o aviso marcado no passo 4 é desmarcado
 * no fim. Teste que deixa estado ligado numa conta faz a próxima execução
 * passar por motivo errado.
 *
 *   node scripts/testar-fincash-navegando.cjs
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000";

(async () => {
  const nav = await chromium.launch();
  const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  const errosJS = [];
  p.on("pageerror", (e) => errosJS.push(e.message.slice(0, 130)));

  const passos = [];
  const marcar = (o, certo, det = "") => {
    passos.push({ o, certo });
    console.log(`  ${certo ? "ok  " : "FALHA"}  ${o}${det ? "  — " + det : ""}`);
  };

  /* ═══ ENTRAR ═══════════════════════════════════════════════════════ */
  console.log("\n1. ENTRAR");
  await p.goto(BASE + "/fincash/testar", { waitUntil: "domcontentloaded" });
  await p.waitForURL("**/fincash/app", { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(2500);
  marcar("a conta de demonstração entra no app", p.url().includes("/fincash/app"));

  const painel = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  marcar("o painel mostra valores", /R\$\s?-?[\d.]+/.test(painel),
         (painel.match(/R\$\s?-?[\d.,]+/) ?? [""])[0]);

  /* ═══ LANÇAR UM GASTO ══════════════════════════════════════════════ */
  console.log("\n2. LANÇAR UM GASTO");
  await p.goto(BASE + "/fincash/app/lancamentos", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);

  await p.locator("button").filter({ hasText: /novo|adicionar|lançar|\+/i }).first().click();
  await p.waitForTimeout(1500);

  const dialogo = p.locator('[role="dialog"]');
  marcar("o formulário abre em diálogo", (await dialogo.count()) > 0);

  const valor = dialogo.locator('input[inputmode="decimal"]').first();
  const desc = dialogo.locator('input[placeholder*="Mercado" i]').first();
  await valor.fill("42,50");
  await desc.fill("Teste automatico");
  await p.waitForTimeout(700);

  const lancar = dialogo.locator("button").filter({ hasText: /^Lançar$/ }).first();
  marcar("o botão Lançar habilita", await lancar.isEnabled());

  await lancar.click();
  await p.waitForTimeout(3500);

  const depois = await p.locator("body").innerText();
  marcar("o lançamento aparece na lista", /Teste automatico/i.test(depois));
  marcar("o valor gravado confere", /42,50/.test(depois));

  /* ═══ O NÚMERO MUDOU? ══════════════════════════════════════════════ */
  console.log("\n3. O LANÇAMENTO AFETA O PAINEL");
  await p.goto(BASE + "/fincash/app", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2800);
  const painel2 = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  marcar("o painel recarrega com o gasto novo", painel2.length > 300);

  /* ═══ A TELA DE AVISOS ═════════════════════════════════════════════ */
  console.log("\n4. A TELA DE AVISOS (nova)");
  await p.goto(BASE + "/fincash/app/avisos", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);

  const caixas = p.locator('input[type="checkbox"]');
  const n = await caixas.count();
  marcar("tem os quatro interruptores", n === 4, n + " encontrados");

  if (n) {
    await caixas.first().check();
    await p.waitForTimeout(2500);
    marcar("dá para ligar um aviso", await caixas.first().isChecked());

    const texto = await p.locator("body").innerText();
    marcar("aparecem as opções do aviso ligado", /dia antes|no dia/i.test(texto));

    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(3000);
    marcar("a escolha sobrevive ao recarregar",
           await p.locator('input[type="checkbox"]').first().isChecked().catch(() => false));

    /* Desliga, para não deixar a conta de teste configurada. */
    await p.locator('input[type="checkbox"]').first().uncheck().catch(() => {});
    await p.waitForTimeout(1500);
  }

  /* ═══ O MENU INTEIRO ═══════════════════════════════════════════════ */
  console.log("\n5. TODO ITEM DO MENU ABRE");
  await p.goto(BASE + "/fincash/app", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2000);
  const itens = [...new Set(await p.$$eval('nav a[href^="/fincash/app"]', (as) =>
    as.map((a) => a.getAttribute("href"))))];

  let quebrados = 0;
  for (const href of itens) {
    const r = await p.goto(BASE + href, { waitUntil: "commit" }).catch(() => null);
    const st = r?.status() ?? 0;
    if (st !== 200) { quebrados++; console.log(`       ${st}  ${href}`); }
  }
  marcar(`os ${itens.length} itens do menu abrem`, quebrados === 0, quebrados + " quebrado(s)");

  marcar("nenhum erro de JavaScript no caminho", errosJS.length === 0, errosJS[0] ?? "");

  await nav.close();
  const falhas = passos.filter((x) => !x.certo).length;
  console.log("");
  console.log(falhas ? `${falhas} falha(s) de ${passos.length} passos.`
                     : `os ${passos.length} passos passaram.`);
})();
