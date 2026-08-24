/**
 * Os cards de área precisam entregar a lista de ferramentas em QUALQUER
 * aparelho: com mouse ela abre no hover, sem mouse abre no botão. E em
 * nenhum tamanho de tela o conteúdo pode vazar para fora do card.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
const oks = [];

function conferir(nome, condicao, detalhe = "") {
  if (condicao) oks.push(nome);
  else falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

const navegador = await chromium.launch();

/* ------------------------------------------------------ com mouse (hover) */
const telas = [
  { nome: "notebook 1440", width: 1440, height: 900 },
  { nome: "tablet paisagem 1024", width: 1024, height: 768 },
  { nome: "desktop largo 1920", width: 1920, height: 1080 },
];

for (const tela of telas) {
  const ctx = await navegador.newContext({
    viewport: { width: tela.width, height: tela.height },
  });
  const pagina = await ctx.newPage();
  await pagina.goto(BASE, { waitUntil: "networkidle" });

  const card = pagina.locator(".card-cine").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await pagina.waitForTimeout(500);

  const painel = card.locator("div.absolute.inset-0.flex.flex-col");
  const links = painel.locator("a");
  const qtd = await links.count();

  conferir(`${tela.nome}: painel abre no hover`, await painel.isVisible());
  conferir(`${tela.nome}: lista tem ferramentas`, qtd >= 2, `${qtd} links`);

  // Uma seta por linha — é o alvo que o usuário pediu para abrir por ela.
  const setas = await painel.locator("a svg.lucide-arrow-up-right").count();
  conferir(`${tela.nome}: seta em cada ferramenta`, setas === qtd, `${setas} setas para ${qtd} itens`);

  // O botão "ver a área completa" saiu de cena.
  conferir(
    `${tela.nome}: sem o botão "Ver a área completa"`,
    !(await pagina.getByText("Ver a área completa").count()),
  );

  // Nada pode transbordar do card nem da página.
  const vazamento = await pagina.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  conferir(`${tela.nome}: sem rolagem horizontal`, !vazamento);

  const cabe = await painel.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
  conferir(
    `${tela.nome}: lista inteira cabe sem cortar`,
    cabe || (await painel.evaluate((el) => getComputedStyle(el.querySelector("div.grid")).overflowY)) === "auto",
  );

  await ctx.close();
}

/* ----------------------------------------------------- sem mouse (toque) */
for (const aparelho of ["iPhone 13", "Pixel 7", "iPad (gen 7)"]) {
  const ctx = await navegador.newContext({ ...devices[aparelho] });
  const pagina = await ctx.newPage();
  await pagina.goto(BASE, { waitUntil: "networkidle" });

  const card = pagina.locator(".card-cine").first();
  await card.scrollIntoViewIfNeeded();

  const botao = card.getByRole("button", { name: /ferramentas/ });
  conferir(`${aparelho}: botão de abrir a lista aparece`, await botao.isVisible());

  await botao.tap();
  await pagina.waitForTimeout(500);

  const painel = card.locator("div.absolute.inset-0.flex.flex-col");
  const qtd = await painel.locator("a").count();
  conferir(`${aparelho}: painel abre no toque`, await painel.isVisible());
  conferir(`${aparelho}: lista tem ferramentas`, qtd >= 2, `${qtd} links`);

  const fechar = card.getByRole("button", { name: "Fechar a lista" });
  conferir(`${aparelho}: dá para fechar`, await fechar.isVisible());
  await fechar.tap();
  await pagina.waitForTimeout(500);
  conferir(
    `${aparelho}: fecha e volta a capa`,
    await card.getByRole("button", { name: /ferramentas/ }).isVisible(),
  );

  const vazamento = await pagina.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  conferir(`${aparelho}: sem rolagem horizontal`, !vazamento);

  await ctx.close();
}

await navegador.close();

console.log(`\n${oks.length} passaram`);
if (falhas.length) {
  console.log(`\n${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
