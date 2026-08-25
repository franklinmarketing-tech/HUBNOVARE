/**
 * A home tem de caber numa tela só, como o Workspace do D7 — em qualquer
 * notebook do mercado. Sem isso o ecossistema não se mostra inteiro no
 * primeiro segundo, que é o ponto do desenho.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

// Alturas reais de tela, já descontadas as barras do navegador.
const TELAS = [
  { nome: "notebook 1366x768", width: 1366, height: 625 },
  { nome: "notebook 1440x900", width: 1440, height: 757 },
  { nome: "full HD 1920x1080", width: 1920, height: 937 },
  { nome: "macbook 1512x945", width: 1512, height: 800 },
];

const b = await chromium.launch();

for (const tela of TELAS) {
  const ctx = await b.newContext({ viewport: { width: tela.width, height: tela.height } });
  const p = await ctx.newPage();
  // Espera o conteúdo, não o relógio: em tela baixa a home usa media queries
  // de ALTURA para se compactar, e medir antes do layout assentar dá leitura
  // de página vazia — foi assim que este teste acusou "portais invisíveis"
  // numa home que estava perfeita.
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".glass-card", { state: "visible", timeout: 20000 });
  await p.waitForTimeout(700);

  const m = await p.evaluate(() => ({
    altura: document.documentElement.scrollHeight,
    janela: window.innerHeight,
    largura: document.documentElement.scrollWidth,
    janelaL: window.innerWidth,
  }));

  const sobra = m.altura - m.janela;
  conferir(
    `${tela.nome}: cabe sem rolagem vertical`,
    sobra <= 2,
    `sobra ${sobra}px (pagina ${m.altura}, tela ${m.janela})`,
  );
  conferir(`${tela.nome}: sem rolagem horizontal`, m.largura <= m.janelaL + 1);

  // Tudo o que precisa estar visível de cara.
  for (const [oque, loc] of [
    ["os portais", p.locator(".glass-card")],
    // O Robô só aparece acima de 820px de ALTURA ÚTIL: em notebook baixo o
    // layout o esconde de propósito, para a home caber numa tela. Exigir que
    // ele apareça sempre é cobrar o contrário do que o design decidiu.
    ...(tela.height > 820
      ? [["o Robô IA Novare", p.getByText(/Robô IA Novare/).first()]]
      : []),
    ["o rodapé", p.locator("footer")],
  ]) {
    const visivel = await loc.first().isVisible().catch(() => false);
    conferir(`${tela.nome}: ${oque} aparece`, visivel);
  }

  // O que precisa caber numa tela só, nomeado em vez de contado: contar cards
  // deixa o teste refém de qualquer card novo, e foi assim que ele apodreceu.
  for (const [oque, seletor] of [
    ["o card do produto pago", 'a[href="/planejamento"]'],
    ["as quatro áreas de ferramenta", 'a[href^="/aplicativos?area"]'],
    ["o card do Novare News", 'a[href="/novare-news"]'],
  ]) {
    const quantos = await p.locator(seletor).count();
    conferir(`${tela.nome}: ${oque} na tela`, quantos > 0, `${quantos}`);
  }
  const areas = await p.locator('a[href^="/aplicativos?area"]').count();
  conferir(`${tela.nome}: são 4 áreas`, areas === 4, `${areas}`);

  await ctx.close();
}

/* ------------------------------------------------- o menu das áreas */
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForTimeout(600);

// Quatro áreas desde que os Simuladores foram absorvidos por Vida Financeira.
const botoes = p.locator("header nav button");
conferir("menu tem uma entrada por área", (await botoes.count()) === 4, `${await botoes.count()}`);

await botoes.first().hover();
await p.waitForTimeout(400);
const painel = p.locator("header nav a");
const itens = await painel.count();
conferir("dropdown abre com a lista da área", itens >= 3, `${itens} links`);
conferir("dropdown leva à página da área",
  (await p.getByText("Ver todos na página de aplicativos").isVisible()));

await p.screenshot({ path: "C:/tmp/novare-shots/home-d7.png" });
await ctx.close();
await b.close();

console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
