/**
 * AS CONTAS DO FINCASH FECHAM?
 *
 * Os outros testes provam que as telas abrem e que o app responde. Este
 * prova a única coisa que um app de dinheiro não pode errar: **a
 * aritmética**.
 *
 * ⚠️ A CONFERÊNCIA É POR DIFERENÇA, e não por total. A conta de
 * demonstração nasce com sete meses de histórico, então não há número
 * absoluto para comparar. O que dá para exigir é que, ao lançar R$ 100 de
 * despesa, a sobra do mês caia EXATAMENTE R$ 100 — nem 99,99 por
 * arredondamento, nem 200 por gravar duas vezes.
 *
 * ⚠️ ERRO DE CONTA NÃO GERA ERRO DE JAVASCRIPT. Um saldo errado abre a tela
 * normalmente, sem console vermelho e sem 404. É por isso que precisa de um
 * teste próprio: nenhum dos outros guardiões veria.
 *
 * ⚠️ O QUE ELE LANÇA, ELE APAGA. Cada valor de teste é removido no fim —
 * teste que deixa lixo na conta faz a execução seguinte comparar com um
 * estado que ele mesmo sujou.
 *
 *   node scripts/testar-fincash-contas.cjs
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000";

/** "R$ 1.598" ou "−R$ 318,50" → 1598 / -318.5 */
function emNumero(texto) {
  const m = texto.match(/(−|-)?\s*R\$\s?([\d.]+(?:,\d{2})?)/);
  if (!m) return null;
  const v = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
  return m[1] ? -v : v;
}

/** O número grande do painel: a sobra prevista do mês. */
async function lerSobra(p) {
  await p.goto(BASE + "/fincash/app", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(3200);
  const t = (await p.locator("main").innerText()).replace(/\s+/g, " ");
  const m = t.match(/fecha o mês com\s*(−|-)?\s*R\$\s?([\d.]+(?:,\d{2})?)/i);
  if (!m) return null;
  const v = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
  return m[1] ? -v : v;
}

/** Lê "Entrou X + Y previsto" e "Saiu X + Y previsto". */
async function lerExtremos(p) {
  const t = (await p.locator("main").innerText()).replace(/\s+/g, " ");
  const pegar = (rotulo) => {
    const re = new RegExp(rotulo + "\\s*R\\$\\s?([\\d.]+(?:,\\d{2})?)\\s*\\+\\s*R\\$\\s?([\\d.]+(?:,\\d{2})?)", "i");
    const m = t.match(re);
    if (!m) return null;
    const n = (s) => parseFloat(s.replace(/\./g, "").replace(",", "."));
    return { realizado: n(m[1]), previsto: n(m[2]) };
  };
  return { entrou: pegar("Entrou"), saiu: pegar("Saiu") };
}

async function lancar(p, { valor, descricao, receita = false }) {
  await p.goto(BASE + "/fincash/app/lancamentos", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);
  await p.locator("button").filter({ hasText: /novo|adicionar|lançar|\+/i }).first().click();
  await p.waitForTimeout(1400);

  const d = p.locator('[role="dialog"]');
  await d.locator('input[inputmode="decimal"]').first().fill(valor);
  await d.locator('input[placeholder*="Mercado" i]').first().fill(descricao);

  if (receita) {
    const alvo = d.locator("button").filter({ hasText: /^(receita|entrou|recebi)$/i }).first();
    if (await alvo.count()) await alvo.click();
  }
  await p.waitForTimeout(600);

  const botao = d.locator("button").filter({ hasText: /^(Lançar|Salvar)$/ }).first();
  if (!(await botao.isEnabled())) return false;
  await botao.click();
  await p.waitForTimeout(3200);
  return true;
}

/**
 * Apagar um lançamento.
 *
 * ⚠️ TEM MODO DE APAGAR, e isso é decisão de desenho, não falta de botão:
 * clicar na linha marca como paga (o gesto mais repetido do app), então a
 * lixeira só aparece depois de ligar o modo pelo botão "Apagar". O código
 * da tela explica a escolha. Meu primeiro teste procurava um diálogo ao
 * clicar na linha e concluiu que apagar estava quebrado — não estava.
 */
async function apagar(p, descricao) {
  await p.goto(BASE + "/fincash/app/lancamentos", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);

  const modo = p.locator("main button").filter({ hasText: /^Apagar$/ }).first();
  if (!(await modo.count())) return false;
  await modo.click();
  await p.waitForTimeout(1200);

  const linha = p.locator("main li").filter({ hasText: descricao }).first();
  if (!(await linha.count())) return false;

  const lixeira = linha.locator("button").last();
  if (!(await lixeira.count())) return false;
  p.once("dialog", (dlg) => dlg.accept());
  await lixeira.click();
  await p.waitForTimeout(3200);

  /* Sobrou na lista? Então não apagou. */
  const aindaTem = await p.locator("main li").filter({ hasText: descricao }).count();
  return aindaTem === 0;
}

/** O valor de um lançamento, lido da LISTA — onde os centavos aparecem. */
async function valorNaLista(p, descricao) {
  await p.goto(BASE + "/fincash/app/lancamentos", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);
  const linha = p.locator("main li").filter({ hasText: descricao }).first();
  if (!(await linha.count())) return null;
  return (await linha.innerText()).replace(/\s+/g, " ");
}

(async () => {
  const nav = await chromium.launch();
  const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  const passos = [];
  const marcar = (o, certo, det = "") => {
    passos.push({ o, certo });
    console.log(`  ${certo ? "ok  " : "FALHA"}  ${o}${det ? "   " + det : ""}`);
  };

  console.log("\nentrando…");
  await p.goto(BASE + "/fincash/testar", { waitUntil: "domcontentloaded" });
  await p.waitForURL("**/fincash/app", { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(3000);

  /* ═══ 1. O PAINEL FECHA COM ELE MESMO ═══════════════════════════════ */
  console.log("\n1. O PAINEL CONFERE COM OS PRÓPRIOS NÚMEROS");
  const sobra0 = await lerSobra(p);
  const ext = await lerExtremos(p);
  marcar("o painel mostra a sobra do mês", sobra0 !== null, `R$ ${sobra0}`);

  if (ext.entrou && ext.saiu) {
    const esperado = ext.entrou.realizado + ext.entrou.previsto
                   - ext.saiu.realizado - ext.saiu.previsto;
    /* 1 real de folga: a tela arredonda centavos em cada parcela. */
    const bate = Math.abs(esperado - sobra0) <= 1;
    marcar("sobra = (entrou + a receber) − (saiu + a pagar)", bate,
           `conta à mão: ${esperado}  ·  tela: ${sobra0}`);
  } else {
    marcar("achar as linhas de entrou/saiu", false);
  }

  /* ═══ 2. UMA DESPESA DERRUBA A SOBRA NO VALOR EXATO ═════════════════ */
  console.log("\n2. LANÇAR DESPESA DE R$ 100 DERRUBA A SOBRA EM 100");
  const marcaD = "ZZ teste despesa";
  const lancou = await lancar(p, { valor: "100,00", descricao: marcaD });
  marcar("a despesa foi lançada", lancou);

  if (lancou) {
    const sobra1 = await lerSobra(p);
    const caiu = sobra0 - sobra1;
    marcar("a sobra caiu exatamente 100", Math.abs(caiu - 100) < 0.5,
           `antes ${sobra0} → depois ${sobra1}  (caiu ${caiu})`);

    /* ═══ 3. APAGAR DEVOLVE O VALOR ══════════════════════════════════ */
    console.log("\n3. APAGAR DEVOLVE A SOBRA AO QUE ERA");
    const apagou = await apagar(p, marcaD);
    marcar("a despesa foi apagada", apagou);
    if (apagou) {
      const sobra2 = await lerSobra(p);
      marcar("a sobra voltou ao valor original", Math.abs(sobra2 - sobra0) < 0.5,
             `original ${sobra0} → agora ${sobra2}`);
    }
  }

  /* ═══ 4. CENTAVOS NÃO SOMEM ════════════════════════════════════════
     ⚠️ CONFERIDO NA LISTA, NÃO NO PAINEL. O número grande do painel é
     arredondado para real inteiro de propósito ("R$ 372", sem centavos), e
     medir centavo ali acusaria um erro que não existe: 272 − 33,33 vira
     238,67 e aparece como 238. Os centavos têm de estar onde são
     mostrados — na linha do lançamento. */
  console.log("\n4. OS CENTAVOS SOBREVIVEM");
  const marcaC = "ZZ teste centavos";
  if (await lancar(p, { valor: "33,33", descricao: marcaC })) {
    const linha = await valorNaLista(p, marcaC);
    marcar("a linha mostra 33,33, com os centavos", !!linha && /33,33/.test(linha),
           linha ?? "não achei a linha");
    const limpou = await apagar(p, marcaC);
    marcar("o lançamento de centavos foi apagado", limpou);
  }

  await nav.close();
  const falhas = passos.filter((x) => !x.certo).length;
  console.log("");
  console.log(falhas ? `${falhas} falha(s) de ${passos.length}. Conta errada é o defeito mais caro deste app.`
                     : `as contas fecham: ${passos.length} conferências.`);
  process.exit(falhas ? 1 : 0);
})();
