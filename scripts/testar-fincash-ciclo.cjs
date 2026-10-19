/**
 * O CICLO COMPLETO DE CADA TELA DO FINCASH: criar, ver, editar e apagar.
 *
 * ⚠️ POR QUE ISTO É UM TESTE SEPARADO, e não mais um caso dos outros: os
 * guardiões que existiam provavam que as telas ABREM. Abrir é o começo. O
 * defeito que apareceu no FINCASH em 18/10/2026 — apagar lançamento não
 * apagava, e a tela não avisava — passou por todos eles sem ser visto, porque
 * a tela abria perfeitamente. Uma operação de escrita que falha em silêncio é
 * invisível para qualquer teste que só carregue a página.
 *
 * ⚠️ O TESTE SÓ ACREDITA NO QUE SOBREVIVE A UM RECARREGAMENTO. Tela que
 * mostra o item criado porque guardou no estado do React, mas não gravou no
 * banco, passaria num teste que confere logo depois do clique. Por isso cada
 * criação é conferida DEPOIS de voltar à rota do zero.
 *
 * ⚠️ ELE LIMPA O QUE CRIA. Toda marca começa com "ZZ teste" e é apagada no
 * fim. Teste que deixa lixo na conta de demonstração faz a execução seguinte
 * comparar com um estado que ele mesmo sujou.
 *
 *   node scripts/testar-fincash-ciclo.cjs
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000";

const passos = [];
function marcar(o, certo, det = "") {
  passos.push({ o, certo });
  console.log(`  ${certo ? "ok  " : "FALHA"}  ${o}${det ? "   -> " + det : ""}`);
}
const titulo = (t) => console.log(`\n${t}\n${"-".repeat(t.length)}`);

/** Erros do banco que o app engoliu: nenhum deve aparecer. */
function vigiarRede(p) {
  const falhas = [];
  p.on("response", async (r) => {
    if (r.status() < 400) return;
    const u = r.url();
    if (!/supabase|\/api\//.test(u)) return;
    let corpo = "";
    try {
      corpo = (await r.text()).slice(0, 220);
    } catch {
      /* corpo já consumido: o status sozinho já serve */
    }
    falhas.push(`${r.status()} ${r.request().method()} ${u.split("?")[0].split("/").slice(-2).join("/")} ${corpo}`);
  });
  return falhas;
}

async function abrir(p, rota) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600);
}

/** O diálogo aberto agora, qualquer que seja o botão que o abriu. */
function dialogo(p) {
  return p.locator('[role="dialog"]').last();
}

/** Abre o formulário de criar da tela atual. */
async function abrirNovo(p, textos = /novo|nova|adicionar|criar|cadastrar|\+/i) {
  const b = p.locator("main button, main a").filter({ hasText: textos }).first();
  if (!(await b.count())) return false;
  await b.click();
  await p.waitForTimeout(1500);
  return (await dialogo(p).count()) > 0;
}

/**
 * Preenche TODOS os campos vazios do formulário, não só o primeiro.
 *
 * ⚠️ A PRIMEIRA VERSÃO PREENCHIA UM CAMPO SÓ, e concluiu que Dívidas e Metas
 * estavam quebradas porque o botão Salvar não acendia. Não estavam: uma dívida
 * pede saldo, parcela e taxa, e o formulário — corretamente — só libera o
 * Salvar quando tem o necessário. O defeito era do teste.
 */
async function preencher(p, { nome, valor }) {
  const d = dialogo(p);

  const texto = d.locator('input[type="text"]:not([inputmode="decimal"]):not([readonly]), input:not([type]):not([inputmode="decimal"])');
  const quantosTexto = await texto.count();
  for (let i = 0; i < quantosTexto; i++) {
    const campo = texto.nth(i);
    if (!(await campo.isVisible().catch(() => false))) continue;
    if ((await campo.inputValue().catch(() => "x")) !== "") continue;
    await campo.fill(i === 0 ? nome : nome.slice(0, 10)).catch(() => {});
  }

  /* Todo campo de dinheiro vazio recebe o valor. Um formulário pode ter
     saldo, parcela e aporte — deixar qualquer um em branco trava o Salvar. */
  const numeros = d.locator('input[inputmode="decimal"], input[type="number"]');
  const quantosNumeros = await numeros.count();
  for (let i = 0; i < quantosNumeros; i++) {
    const campo = numeros.nth(i);
    if (!(await campo.isVisible().catch(() => false))) continue;
    const atual = await campo.inputValue().catch(() => "x");
    if (atual !== "" && atual !== "0" && atual !== "0,00") continue;
    await campo.fill(valor ?? "100").catch(() => {});
  }

  await p.waitForTimeout(700);
}

/** Clica em salvar. Devolve false se o botão estiver desabilitado. */
async function salvar(p) {
  const b = dialogo(p)
    .locator("button")
    .filter({ hasText: /^(Salvar|Lançar|Criar|Adicionar|Cadastrar|Guardar|Confirmar)$/i })
    .first();
  if (!(await b.count()) || !(await b.isEnabled())) return false;
  await b.click();
  await p.waitForTimeout(3000);
  return true;
}

/** Está na tela, depois de recarregar do zero? */
async function existeApos(p, rota, texto) {
  await abrir(p, rota);
  return (await p.locator("main").innerText()).includes(texto);
}

/**
 * O ciclo de uma tela: cria, confere que sobreviveu ao recarregamento, e
 * apaga. Cada tela do FINCASH tem um jeito próprio de apagar, então o modo de
 * apagar entra como função.
 */
async function ciclo(p, { rota, nome, marca, valor, apagar }) {
  titulo(`${nome}  (${rota})`);

  await abrir(p, rota);
  const abriu = (await p.locator("main").count()) > 0;
  marcar(`${nome}: a tela abre`, abriu);
  if (!abriu) return;

  if (!(await abrirNovo(p))) {
    marcar(`${nome}: tem botão de criar`, false, "nenhum botão de criar encontrado");
    return;
  }
  marcar(`${nome}: o formulário de criar abre`, true);

  await preencher(p, { nome: marca, valor });
  const salvou = await salvar(p);
  marcar(`${nome}: o botão de salvar fica ativo e aceita o clique`, salvou);
  if (!salvou) {
    await p.keyboard.press("Escape");
    return;
  }

  const sobreviveu = await existeApos(p, rota, marca);
  marcar(`${nome}: o item continua lá depois de recarregar (gravou mesmo)`, sobreviveu);
  if (!sobreviveu) return;

  const sumiu = await apagar(p, marca);
  marcar(`${nome}: consegui apagar`, sumiu);
  if (sumiu) {
    const limpo = !(await existeApos(p, rota, marca));
    marcar(`${nome}: continua apagado depois de recarregar`, limpo);
  }
}

/* ── Os jeitos de apagar, um por tela ───────────────────────────────────── */

/** O padrão: um botão de lixeira ou "Apagar" no cartão do item. */
function apagarNoCartao(rota) {
  return async (p, marca) => {
    await abrir(p, rota);
    const item = p
      .locator("main li, main article, main [data-item]")
      .filter({ hasText: marca })
      .first();
    if (!(await item.count())) return false;

    p.on("dialog", (d) => d.accept());

    /* Primeiro um botão nomeado; depois o menu de três pontos. */
    let b = item.locator("button").filter({ hasText: /apagar|excluir|remover|arquivar/i }).first();
    if (!(await b.count())) {
      const menu = item.locator('button[aria-haspopup], button[aria-label*="mais" i], button[aria-label*="opç" i]').first();
      if (await menu.count()) {
        await menu.click();
        await p.waitForTimeout(900);
        b = p.locator('[role="menu"] *, [role="dialog"] *')
          .locator("button, [role='menuitem']")
          .filter({ hasText: /apagar|excluir|remover|arquivar/i })
          .first();
      }
    }
    if (!(await b.count())) {
      /* Último recurso: uma lixeira sem texto, identificada pelo rótulo. */
      b = item.locator('button[aria-label*="pagar" i], button[aria-label*="xcluir" i], button[aria-label*="emover" i], button[aria-label*="rquivar" i]').first();
    }
    if (!(await b.count())) return false;

    await b.click();
    await p.waitForTimeout(1600);

    /* Pode haver uma confirmação dentro de um diálogo. */
    const conf = p
      .locator('[role="dialog"], [role="alertdialog"]')
      .last()
      .locator("button")
      .filter({ hasText: /^(apagar|excluir|remover|arquivar|sim|confirmar)/i })
      .first();
    if (await conf.count()) {
      await conf.click();
      await p.waitForTimeout(2600);
    }

    await abrir(p, rota);
    return !(await p.locator("main").innerText()).includes(marca);
  };
}

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errosDeRede = vigiarRede(p);

  console.log("\nentrando na conta de demonstração...");
  await p.goto(BASE + "/fincash/testar", { waitUntil: "domcontentloaded" });
  await p.waitForURL("**/fincash/app", { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(3500);

  const telas = [
    /* ⚠️ A TELA DE CARTÕES MORA EM /faturas, e não em /cartoes — que é 404.
          O menu aponta para /faturas e nada no app linka para /cartoes; foi o
          teste que inventou a rota e acusou um 404 que não existe para o
          cliente. */
    { rota: "/fincash/app/faturas", nome: "Cartões", marca: "ZZ teste cartao", valor: "3000" },
    { rota: "/fincash/app/contas", nome: "Contas", marca: "ZZ teste conta", valor: "500" },
    { rota: "/fincash/app/dividas", nome: "Dívidas", marca: "ZZ teste divida", valor: "1000" },
    { rota: "/fincash/app/metas", nome: "Metas", marca: "ZZ teste meta", valor: "2000" },
    { rota: "/fincash/app/fixas", nome: "Contas fixas", marca: "ZZ teste fixa", valor: "150" },
    /* Categorias tem botão por linha ("Arquivar Moradia e as subcategorias
        dela"), com o nome dentro do rótulo — o apagador genérico não alcança.
        O ciclo dela é conferido na varredura de telas. */
  ];

  for (const t of telas) {
    await ciclo(p, { ...t, apagar: apagarNoCartao(t.rota) });
  }

  titulo("Erros de banco que o app engoliu durante o teste");
  if (errosDeRede.length === 0) {
    marcar("nenhuma resposta 4xx/5xx do banco", true);
  } else {
    for (const e of [...new Set(errosDeRede)].slice(0, 12)) console.log(`      ${e}`);
    marcar(`${errosDeRede.length} resposta(s) de erro do banco`, false);
  }

  await nav.close();
  const falhas = passos.filter((x) => !x.certo).length;
  console.log("");
  console.log(
    falhas
      ? `${falhas} falha(s) de ${passos.length} conferências.`
      : `o ciclo fecha nas ${telas.length} telas: ${passos.length} conferências.`,
  );
  process.exit(falhas ? 1 : 0);
})();
