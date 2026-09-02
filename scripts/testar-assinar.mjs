import { chromium } from "playwright";
import { createRequire } from "node:module";

/**
 * GUARDA DA LANDING DE VENDA DO WORKSPACE (`/assinar`).
 *
 * Quatro coisas que, se quebrarem, quebram em silêncio — a página continua
 * "funcionando" e só a venda morre:
 *
 * 1. **O preço está na tela.** A página existe para vender a assinatura. Se
 *    o valor sumir (por um erro em `assinatura.ts`, por exemplo), sobra uma
 *    página bonita que não vende nada.
 *
 * 2. **A oferta não mente.** Sem preço "de/por", sem promessa de
 *    rentabilidade, sem escassez fabricada e sem contagem regressiva. Numa
 *    casa que vende confiança financeira, o truque de conversão custa mais
 *    caro do que rende.
 *
 * 3. **Os CTAs levam para a criação de conta.** É o único caminho que
 *    converte; um botão que rola para lugar nenhum é o defeito mais caro e
 *    mais silencioso de uma landing.
 *
 * 4. **Contraste e teclado.** Metade das seções é escura e a tentação de usar
 *    branco a 30% é permanente. O axe roda com as seções já reveladas, senão
 *    audita elementos invisíveis e passa por engano.
 *
 * Uso:  BASE=http://localhost:3000 node scripts/testar-assinar.mjs
 */

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BASE ?? "http://localhost:3000";

const falhas = [];
const ok = (cond, rotulo) => {
  console.log(`${cond ? "OK   " : "FALHA"}  ${rotulo}`);
  if (!cond) falhas.push(rotulo);
};

const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/assinar`, { waitUntil: "domcontentloaded" });
await p.waitForSelector("main h1", { state: "visible", timeout: 30000 });
await p.waitForTimeout(900);
const texto = await p.locator("body").innerText();

/* ------------------------------------------------- 1. a oferta aparece --- */

ok(/R\$\s?19,90/.test(texto), "mostra o preço da assinatura");
ok(/7 dias/.test(texto), "mostra o período de teste");
ok(/sem (pedir )?cartão/i.test(texto), "diz que não pede cartão");
ok(/30%\s?OFF/.test(texto), "mostra o desconto da consultoria");

/* --------------------------------------------------- 2. e não mente ----- */

for (const [rotulo, re] of [
  ["não promete rentabilidade", /rentabilidade garantid|% ao (m[êe]s|ano) garantid|lucro garantid/i],
  ["não fabrica escassez", /[úu]ltimas vagas|restam \d+ vagas|s[óo] hoje|expira em/i],
  ["não tem contagem regressiva", /\d{2}:\d{2}:\d{2}/],
  ["não usa preço de/por", /de\s+R\$\s?\d+[,.]\d{2}\s+por/i],
]) {
  ok(!re.test(texto), rotulo);
}
ok(/não constitui oferta/i.test(texto), "traz o aviso legal");

/* ------------------------------------------------------ 3. os caminhos -- */

const destinos = await p.$$eval("main a[href]", (as) =>
  [...new Set(as.map((a) => a.getAttribute("href")))],
);
const paraConta = destinos.filter((h) => h && !h.startsWith("#") && !h.startsWith("mailto:"));
ok(paraConta.length > 0, `há CTA que sai da página: ${paraConta.join(", ")}`);
ok(destinos.includes("#preco"), "há atalho para a seção de preço");

const ancoras = destinos.filter((h) => h?.startsWith("#") && h !== "#");
const orfas = [];
for (const a of ancoras) {
  const existe = await p.$(a);
  if (!existe) orfas.push(a);
}
ok(orfas.length === 0, `nenhuma âncora órfã (${orfas.join(", ") || "ok"})`);

/* ---------------------------------------------------- 4. as interações -- */

await p.locator("#duvidas").scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
const primeira = await p.locator("#duvidas h3").innerText();
await p.getByRole("button", { name: "Próxima pergunta" }).click();
await p.waitForTimeout(500);
const segunda = await p.locator("#duvidas h3").innerText();
ok(primeira !== segunda, "as dúvidas avançam");

/* ---------------------------------------- 5. contraste, teclado, largura */

for (const [nome, largura, altura] of [
  ["desktop", 1440, 900],
  ["celular", 390, 844],
]) {
  const a = await navegador.newPage({ viewport: { width: largura, height: altura } });
  await a.goto(`${BASE}/assinar`, { waitUntil: "domcontentloaded" });
  await a.waitForSelector("main h1", { state: "visible", timeout: 30000 });
  await a.evaluate(() =>
    document
      .querySelectorAll(".revelar, .revelar-escada, .cine, .cortina")
      .forEach((e) => e.classList.add("visivel")),
  );
  await a.waitForTimeout(700);

  const estoura = await a.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  ok(!estoura, `${nome}: sem rolagem horizontal`);

  await a.addScriptTag({ path: axePath });
  const violacoes = await a.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    });
    return r.violations
      // A palavra gigante do fundo das dúvidas é ornamento puro: já está
      // `aria-hidden` e existe para ser quase invisível. O axe mede a cor dela
      // mesmo assim, então esse nó sai da conta.
      .map((v) => ({
        id: v.id,
        alvos: v.nodes
          .map((n) => n.target.join(" "))
          .filter((t) => !t.includes("nv-palavra-fundo")),
      }))
      .filter((v) => v.alvos.length);
  });
  ok(violacoes.length === 0, `axe ${nome}: ${JSON.stringify(violacoes)}`);
  await a.close();
}

await navegador.close();

if (falhas.length) {
  console.log(`\n${falhas.length} falha(s).`);
  process.exit(1);
}
console.log("\nLanding de assinatura: tudo certo.");
