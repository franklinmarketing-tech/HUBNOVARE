/**
 * A lâmpada do card e o modal que ela abre.
 *
 * O contrato tem duas metades, e a segunda é a que quebra fácil: clicar
 * na lâmpada EXPLICA (abre o modal, não navega); clicar no resto do card
 * ABRE o app. Se o clique na lâmpada vazar para o link do card, a
 * explicação some no meio da navegação.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 120)));

await p.goto(`${BASE}/aplicativos?area=ia`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);

const card = p.locator("a.glass-card", { hasText: "Planejamento" }).first();
conferir("o card existe", (await card.count()) > 0);

const lampada = card.locator("button[aria-label*='Saber mais']").first();
conferir("o card tem lâmpada", (await lampada.count()) > 0);

// Apagada em repouso (opacity 0), acesa no hover.
const opacidadeParada = await lampada.evaluate((el) => getComputedStyle(el).opacity);
await card.hover();
await p.waitForTimeout(400);
const opacidadeHover = await lampada.evaluate((el) => getComputedStyle(el).opacity);
conferir(
  "a lâmpada acende quando o mouse passa",
  Number(opacidadeHover) > Number(opacidadeParada),
  `${opacidadeParada} -> ${opacidadeHover}`,
);

// O clique abre o modal E NÃO navega.
const urlAntes = p.url();
await lampada.click();
await p.waitForTimeout(600);

const modal = p.locator("[role='dialog']");
conferir("clicar na lâmpada abre o modal", await modal.isVisible());
conferir("clicar na lâmpada NÃO navega", p.url() === urlAntes, p.url());

const texto = await modal.innerText();
conferir("o modal explica o app", /marco horizonte/i.test(texto), texto.slice(0, 80));
conferir("o modal lista os pontos fortes", /projeção ano a ano/i.test(texto));
conferir("o modal cita o padrão de referência", /monarch money/i.test(texto));
conferir("o modal oferece abrir o app", /abrir vida plan/i.test(texto));

// A JANELA: cabeçalho e ações não podem sair da tela quando o texto rola.
// Era esse o defeito — o painel inteiro rolava e o nome do app subia.
const painel = modal.locator("> div").first();
const caixa = await painel.boundingBox();
conferir("a janela é larga o bastante para o texto respirar", caixa.width >= 620, `${Math.round(caixa.width)}px`);

const miolo = painel.locator("div.overflow-y-auto").first();
conferir("existe um miolo rolável separado", (await miolo.count()) === 1);

// O painel em si não rola: quem rola é o miolo.
const painelRola = await painel.evaluate((el) => el.scrollHeight - el.clientHeight);
conferir("o painel inteiro NÃO rola", painelRola <= 1, `sobra ${painelRola}px`);

// Rola o miolo até o fim e confere que título e botão continuam na tela.
await miolo.evaluate((el) => el.scrollTo(0, el.scrollHeight));
await p.waitForTimeout(400);
const tituloVisivel = await painel.locator("h2").first().isVisible();
const botaoAbrir = painel.locator("a,button", { hasText: /^Abrir / }).first();
conferir("o título continua visível depois de rolar", tituloVisivel);
conferir("o botão de abrir continua visível depois de rolar", await botaoAbrir.isVisible());

const cxTitulo = await painel.locator("h2").first().boundingBox();
const cxBotao = await botaoAbrir.boundingBox();
conferir("título acima do botão, ambos dentro da janela",
  cxTitulo.y >= caixa.y - 1 && cxBotao.y + cxBotao.height <= caixa.y + caixa.height + 1,
  `titulo ${Math.round(cxTitulo.y)} / janela ${Math.round(caixa.y)}-${Math.round(caixa.y + caixa.height)}`);

// Esc fecha.
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
conferir("Esc fecha o modal", (await p.locator("[role='dialog']").count()) === 0);

// Clicar no corpo do card (longe da lâmpada) navega para o app.
await card.click({ position: { x: 40, y: 30 } });
await p.waitForURL((u) => u.pathname.startsWith("/planejamento"), { timeout: 15000 }).catch(() => {});
conferir("clicar no card abre o app", p.url().includes("/planejamento"), p.url());

conferir("sem erro de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
