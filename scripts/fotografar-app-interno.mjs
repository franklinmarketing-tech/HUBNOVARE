/**
 * Fotografa as telas de DENTRO do Planejamento — as que exigem login.
 *
 *   node scripts/fotografar-app-interno.mjs
 *
 * A conta usada é a de teste interna (`/planejamento/testar`), que cria
 * usuário e entra sozinha. Assim as artes mostram o app funcionando por
 * dentro, não só a página de vendas.
 *
 * As abas vêm da própria navegação do app: o script clica no que existir
 * na tela em vez de adivinhar URLs, porque as etapas do Planejamento são
 * estado interno, não rota.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "https://hub.novareapp.com.br";
const DESTINO = new URL("../../marketing/telas/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);
mkdirSync(DESTINO, { recursive: true });

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

console.log("entrando com a conta de teste...");
// `domcontentloaded`, não `networkidle`: esta rota cria a conta e redireciona
// sozinha, então a rede nunca fica ociosa antes da navegação acontecer.
await pagina.goto(`${BASE}/planejamento/testar`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
// A rota cria a conta e redireciona sozinha para /planejamento/app.
await pagina.waitForURL(/\/planejamento\/app/, { timeout: 45_000 });
await pagina
  .getByRole("button", { name: /entendi/i })
  .click({ timeout: 3000 })
  .catch(() => {});
await pagina.waitForTimeout(2500);

await pagina.screenshot({ path: `${DESTINO}app-inicio.png` });
console.log("app-inicio.png");

/**
 * Preenche o formulário antes de fotografar o resto.
 *
 * Sem isso, diagnóstico, plano e evolução aparecem vazios — a arte
 * mostraria um app que não calculou nada. Os valores são de uma pessoa
 * plausível de classe média, só para as telas terem número de verdade.
 */
console.log("preenchendo os dados...");
await pagina.getByRole("link", { name: /meus dados/i }).first().click();
await pagina.waitForTimeout(2000);

/**
 * O formulário são 11 blocos em sequência ("Bloco N de 11"), cada um com
 * seus campos e um "Salvar e continuar". O laço preenche o que estiver na
 * tela pelo rótulo ao lado do campo e avança, até o último bloco.
 *
 * Os valores descrevem uma família de classe média plausível — existem só
 * para as telas de resultado terem número em vez de estado vazio.
 */
/**
 * Os valores de cada bloco, na ordem dos campos visíveis.
 *
 * A lista foi montada olhando o formulário real (11 blocos, campos
 * diferentes em cada um) — casar por rótulo não funciona aqui porque a
 * maioria dos campos não tem texto próprio, só um prefixo "R$".
 *
 * O retrato é de uma família de classe média: renda de R$ 9.500,
 * despesas de R$ 4.200, um financiamento e R$ 45 mil guardados.
 */
const BLOCOS = {
  2: ["Ana Paula Ribeiro", "12345678909", "1988-04-12", null,
      "Analista de sistemas", "Tecnos Brasil", "12", "2", "Campinas", "SP"],
  3: ["Salário CLT", "9500", null, null],
  /* A categoria da despesa é um seletor customizado (não é <select>), então
     não entra na contagem: os campos aqui são valor, detalhe e vencimento. */
  4: ["2800", "Aluguel, condomínio e contas", "10"],
  5: ["Financiamento do carro", "Banco Itaú", "38000", "1150", "1.4", "36"],
  6: ["45000", "Reserva e investimentos"],
  7: ["Seguro de vida", "Porto Seguro", "300000", "180"],
  8: ["Entrada do apartamento", "120000", "2031-12-01", null],
  9: ["60", "8000", "1200"],
  10: [null, null, null, null, null, null, "Quero parar de me preocupar todo fim de mês"],
};

for (let bloco = 1; bloco <= 13; bloco++) {
  /* Espera o bloco montar de fato. Um timeout fixo não serve: os blocos
     renderizam em tempos diferentes e ler cedo demais devolve zero campos,
     que era o motivo de despesas e patrimônio saírem vazios. */
  await pagina
    .locator("input:visible, select:visible")
    .first()
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {});
  await pagina.waitForTimeout(700);

  // Qual bloco está na tela — o app diz isso em texto.
  const numero = await pagina
    .evaluate(() => Number(document.body.innerText.match(/Bloco (\d+) de/)?.[1] ?? 0))
    .catch(() => 0);
  const valores = BLOCOS[numero] ?? [];

  const campos = pagina.locator("input:visible, select:visible, textarea:visible");
  const quantos = await campos.count();
  console.log(`  bloco ${numero}: ${quantos} campo(s)`);

  /* Conta só os campos que recebem texto: selects, checkbox e range são
     tratados à parte e não podem consumir posição da lista de valores —
     foi o que desalinhou o bloco de despesas, que começa por um select. */
  let posicao = 0;

  for (let i = 0; i < quantos; i++) {
    const campo = campos.nth(i);
    const tipo = await campo.getAttribute("type").catch(() => null);
    if (tipo === "hidden") continue;

    // Checkbox e range já vêm com padrão razoável; marcar checkbox só ajuda.
    if (tipo === "checkbox") {
      await campo.check().catch(() => {});
      continue;
    }
    if (tipo === "range") continue;

    const eSelect = await campo.evaluate((el) => el.tagName === "SELECT").catch(() => false);
    if (eSelect) {
      await campo.selectOption({ index: 1 }).catch(() => {});
      continue;
    }

    const valor = valores[posicao++];
    if (valor == null) continue;

    /* Campos de dinheiro usam máscara de centavos: `fill` entrega a string
       pronta e a máscara a reinterpreta (9500 vira R$ 95,00). Digitar
       tecla a tecla é o único jeito de a máscara montar o valor certo. */
    const ehMoeda = await campo
      .evaluate((el) => (el.closest("div")?.innerText ?? "").includes("R$"))
      .catch(() => false);

    if (ehMoeda) {
      await campo.click().catch(() => {});
      await campo.pressSequentially(`${valor}00`, { delay: 40 }).catch(() => {});
    } else {
      await campo.fill(valor).catch(() => {});
    }
    await pagina.waitForTimeout(140);

    // Conferência: um campo de dinheiro que ficou vazio some do resultado
    // sem erro nenhum — foi assim que despesas e patrimônio saíram zerados.
    const gravado = await campo.inputValue().catch(() => "");
    if (!gravado.trim()) console.log(`  ! campo ${posicao - 1} do bloco ${numero} ficou vazio`);
  }

  if (numero === 2) {
    await pagina.screenshot({ path: `${DESTINO}app-dados.png` });
    console.log("app-dados.png");
  }

  const avancar = pagina
    .getByRole("button", {
      name: /come[çc]ar|salvar e continuar|avan[çc]ar|continuar|pr[óo]ximo|concluir|terminar|ver meu/i,
    })
    .first();
  if (!(await avancar.isVisible().catch(() => false))) break;
  await avancar.click().catch(() => {});
}
await pagina.waitForTimeout(3000);

/** As abas do app, na ordem em que a pessoa percorre. */
const ABAS = [
  { rotulo: /diagn[óo]stico/i, arquivo: "app-diagnostico" },
  { rotulo: /meu plano/i, arquivo: "app-plano" },
  { rotulo: /meu m[êe]s/i, arquivo: "app-mes" },
  { rotulo: /minha evolu/i, arquivo: "app-evolucao" },
  { rotulo: /meu relat/i, arquivo: "app-relatorio" },
];

for (const { rotulo, arquivo } of ABAS) {
  const alvo = pagina.getByRole("link", { name: rotulo }).first();
  const existe = await alvo.isVisible().catch(() => false);
  if (!existe) {
    console.log(`(pulou ${arquivo}: aba não encontrada)`);
    continue;
  }
  await alvo.click();
  await pagina.waitForTimeout(2600);
  await pagina.screenshot({ path: `${DESTINO}${arquivo}.png` });
  console.log(`${arquivo}.png`);
}

await navegador.close();
console.log("\ntelas internas em marketing/telas/");
