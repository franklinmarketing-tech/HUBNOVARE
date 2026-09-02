import { chromium } from "playwright";
import { createRequire } from "node:module";

/**
 * GUARDA DA LANDING DO DIAGNÓSTICO PATRIMONIAL (`/assinar`).
 *
 * Três coisas que, se quebrarem, quebram em silêncio — a página continua
 * "funcionando" e só o funil morre:
 *
 * 1. **A promessa da página é o diagnóstico, não uma venda.** Preço, promessa
 *    de rentabilidade, escassez fabricada ou contagem regressiva não podem
 *    aparecer aqui. Numa casa que vende confiança, o truque de conversão
 *    custa mais caro do que rende — e o aviso legal precisa estar na tela.
 *
 * 2. **O formulário chega ao fim.** Ele tem três passos; se o passo 2 parar
 *    de avançar, o lead some sem erro nenhum no console.
 *
 * 3. **Contraste e teclado.** A página é escura em metade das seções e a
 *    tentação de usar branco a 30% é permanente. O axe roda com as seções
 *    já reveladas, senão ele audita elementos invisíveis.
 *
 * Uso:  BASE=http://localhost:3000 node scripts/testar-diagnostico.mjs
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

/* ------------------------------------------------ 1. nada está à venda --- */

const p = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/assinar`, { waitUntil: "domcontentloaded" });
await p.waitForSelector("main h1", { state: "visible", timeout: 25000 });
await p.waitForTimeout(800);
const texto = await p.locator("body").innerText();

for (const [rotulo, re] of [
  ["não mostra preço em R$", /R\$\s?\d/],
  ["não promete rentabilidade", /rentabilidade garantid|% ao (m[êe]s|ano) garantid|lucro garantid/i],
  ["não fabrica escassez", /[úu]ltimas vagas|restam \d+ vagas|s[óo] hoje|expira em/i],
  ["não tem contagem regressiva", /\d{2}:\d{2}:\d{2}/],
]) {
  ok(!re.test(texto), rotulo);
}
ok(/não constitui oferta/i.test(texto), "traz o aviso legal");
ok(/sem trocar de banco/i.test(texto), "diz que nada é movimentado");

/* ------------------------------------------- 2. o formulário caminha ---- */

await p.locator("#solicitar").scrollIntoViewIfNeeded();
// A rolagem é suave e o cartão entra com transição de 0,7s: clicar antes
// disso faz o Playwright reclamar de "element is not stable" — que aqui não
// é defeito da página, é pressa do teste.
await p.waitForTimeout(1500);
await p.getByRole("button", { name: "Em corretora" }).click();
await p.getByRole("button", { name: /^Continuar/ }).click();
await p.waitForTimeout(500);
ok(await p.getByText("O que mais te incomoda hoje?").isVisible(), "form: passo 1 → 2");

await p.getByRole("button", { name: /Acho que estou concentrado/ }).click();
await p.getByRole("button", { name: /^Continuar/ }).click();
await p.waitForTimeout(500);
ok(await p.getByText("Para onde enviamos a resposta?").isVisible(), "form: passo 2 → 3");

const enviar = p.getByRole("button", { name: /Solicitar meu diagn/ });
ok(await enviar.isDisabled(), "form: envio bloqueado sem dados");
await p.getByPlaceholder("Como podemos te chamar").fill("Maria Andrade");
await p.getByPlaceholder("(19) 98340-2827").fill("19983402827");
await p.getByPlaceholder("voce@email.com").fill("maria@exemplo.com.br");
await p.waitForTimeout(200);
ok(!(await enviar.isDisabled()), "form: envio liberado com dados válidos");

/* --------------------------------------------- 3. contraste e teclado --- */

for (const [nome, largura, altura] of [
  ["desktop", 1440, 900],
  ["celular", 390, 844],
]) {
  const a = await navegador.newPage({ viewport: { width: largura, height: altura } });
  await a.goto(`${BASE}/assinar`, { waitUntil: "domcontentloaded" });
  await a.waitForSelector("main h1", { state: "visible", timeout: 25000 });
  // Revela tudo: elemento em opacity 0 escapa da auditoria e volta reprovado
  // depois, na tela de quem está lendo.
  await a.evaluate(() =>
    document
      .querySelectorAll(".revelar, .revelar-escada, .cine, .cortina")
      .forEach((e) => e.classList.add("visivel")),
  );
  await a.waitForTimeout(600);
  await a.addScriptTag({ path: axePath });
  const violacoes = await a.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    });
    return r.violations
      // A palavra gigante de fundo da seção da Nord é ornamento puro: já está
      // `aria-hidden` e existe justamente para ser quase invisível. O axe mede
      // a cor dela mesmo assim, então esse nó sai da conta.
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
console.log("\nLanding do diagnóstico: tudo certo.");
