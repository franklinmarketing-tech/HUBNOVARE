/**
 * O Vida Plan servido por dentro do Workspace.
 *
 * Ele é um SPA React publicado no `novareapp`; aqui chega por rewrite, o
 * que mantém o cliente num endereço só. O risco desse arranjo é o app
 * abrir em branco por causa de asset com caminho absoluto — é isso que
 * este teste vigia.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });

const erros = [];
const quebrados = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 120)));
p.on("response", (r) => {
  if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) {
    quebrados.push(`${r.status()} ${new URL(r.url()).pathname}`);
  }
});

const resposta = await p.goto(`${BASE}/vidaplan`, { waitUntil: "domcontentloaded" });
conferir("/vidaplan responde 200", resposta?.status() === 200, String(resposta?.status()));

// SPA precisa de tempo para montar.
await p.waitForTimeout(6000);

// O banner de cookies do novareapp cobre a tela no primeiro acesso.
await p
  .getByRole("button", { name: /aceitar|entendi|concordo|ok/i })
  .first()
  .click({ timeout: 4000 })
  .catch(() => {});
await p.waitForTimeout(1500);

const texto = await p.locator("body").innerText();
conferir("o app montou (a tela não está vazia)", texto.trim().length > 80, `${texto.trim().length} chars`);
conferir(
  "é mesmo o Vida Plan",
  /vida plan|marco horizonte|plano de vida|projeto de vida|entrar/i.test(texto),
  texto.replace(/\s+/g, " ").slice(0, 100),
);

conferir("nenhum asset quebrado", quebrados.length === 0, quebrados.slice(0, 4).join(" | "));
conferir("sem erro de página", erros.length === 0, erros.slice(0, 2).join(" | "));

// O ponto do arranjo: continuar no domínio do Workspace.
conferir(
  "o endereço continua sendo o do Workspace",
  new URL(p.url()).origin === new URL(BASE).origin,
  p.url(),
);

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");
