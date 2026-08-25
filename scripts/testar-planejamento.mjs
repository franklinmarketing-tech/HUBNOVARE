/**
 * O App Novare Planejamento Financeiro, ponta a ponta na web.
 *
 * O que este teste protege:
 *  1. A área logada está TRANCADA. É a ficha financeira inteira de uma pessoa;
 *     um dia em que o middleware esqueça essa rota é um vazamento.
 *  2. As rotas antigas do Vida Plan não morreram — viraram redirect.
 *  3. Nenhuma tela pede consultor. O produto inteiro existe para não depender
 *     de um, e cada frase de "fale com seu consultor" marcava uma trava real no
 *     app de origem.
 *  4. A landing page continua prometendo exatamente o que o produto entrega.
 *
 * A trilha em si (preencher os 8 blocos, fechar o mês) exige conta real e
 * escreve no Supabase de produção — não é coisa de teste automático. A
 * aritmética dela está coberta, sem banco, em testar-planejamento-motores.mjs.
 *
 * Roda com: BASE=http://localhost:3100 node scripts/testar-planejamento.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";

const falhas = [];
let oks = 0;

function conferir(nome, condicao, detalhe) {
  if (condicao) oks++;
  else falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: 1280, height: 1000 } });

/* -------------------------------------------------------------------------- */
/* 1. A área logada está trancada                                             */
/* -------------------------------------------------------------------------- */

const TRANCADAS = [
  "/planejamento/app",
  "/planejamento/app/meus-dados",
  "/planejamento/app/diagnostico",
  "/planejamento/app/plano",
  "/planejamento/app/mes",
  "/planejamento/app/evolucao",
  "/planejamento/app/relatorio",
];

for (const rota of TRANCADAS) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  const url = new URL(p.url());
  conferir(
    `${rota} exige login`,
    url.pathname === "/login",
    `parou em ${url.pathname}`,
  );
  conferir(
    `${rota} volta para onde estava depois do login`,
    url.searchParams.get("proximo") === rota,
    url.searchParams.get("proximo") ?? "sem ?proximo",
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Os endereços antigos continuam valendo                                  */
/* -------------------------------------------------------------------------- */

for (const antiga of ["/vidaplan", "/vida-plan", "/vidaplan/app/painel"]) {
  const resposta = await p.goto(BASE + antiga, { waitUntil: "domcontentloaded" });
  conferir(
    `${antiga} redireciona para a landing nova`,
    new URL(p.url()).pathname === "/planejamento",
    p.url(),
  );
  conferir(`${antiga} responde 200 no destino`, resposta?.status() === 200, String(resposta?.status()));
}

/* -------------------------------------------------------------------------- */
/* 3. A landing page                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Espera o CONTEÚDO, não o relógio.
 *
 * A LP é longa e aparece atrás de um "Carregando…" até o React terminar.
 * Cronômetro fixo dá falso negativo: depois de uma sequência de redirects a
 * mesma página leva vários segundos a mais para pintar, e o teste reprovava a
 * página por engano. Esperar o <h1> nascer é determinístico.
 */
async function abrir(rota) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("h1", { timeout: 20000 });
  return p.locator("body").innerText();
}

const lp = await abrir("/planejamento");

conferir("a LP não chama mais o produto de Vida Plan", !/vida plan/i.test(lp));
conferir("a LP anuncia o teste grátis", /7 dias grátis/i.test(lp));
conferir("a LP mostra o preço aprovado", /R\$\s?19,90/.test(lp));
conferir("a LP explica o Marco Horizonte", /marco horizonte/i.test(lp));
conferir(
  "a LP mantém a premissa de 5% real",
  /5%/.test(lp) && /inflação/i.test(lp),
);
conferir("a LP é pública (não redirecionou para login)", new URL(p.url()).pathname === "/planejamento");

const titulo = await p.title();
conferir("o título da aba fala de planejamento", /planejamento/i.test(titulo), titulo);

/* -------------------------------------------------------------------------- */
/* 4. Nenhuma tela pública pede consultor para funcionar                      */
/* -------------------------------------------------------------------------- */

// "Fale com um consultor" como OFERTA é legítimo — a Novare vende consultoria.
// O que não pode voltar é o consultor como PRÉ-REQUISITO: a espera por
// liberação, a permissão, o "peça ao seu consultor".
const TRAVAS = [
  /seu consultor (vai|irá|precisa|libera|ajusta)/i,
  /aguardando (o |a )?(seu |sua )?consultor/i,
  /peça ao seu consultor/i,
  /fale com seu consultor.{0,40}(liberar|ajustar|reabrir|destravar)/i,
  /modo visualização/i,
  /aguardando liberação/i,
];

for (const rota of ["/", "/planejamento"]) {
  const texto = await abrir(rota);
  for (const trava of TRAVAS) {
    const achou = texto.match(trava);
    conferir(`${rota} não trata consultor como pré-requisito`, !achou, achou?.[0]);
  }
}

/* -------------------------------------------------------------------------- */
/* 5. A home leva ao produto                                                  */
/* -------------------------------------------------------------------------- */

await abrir("/");

const cartao = p.locator('a[href="/planejamento"]').first();
conferir("a home tem o card do produto", (await cartao.count()) > 0);

if ((await cartao.count()) > 0) {
  const textoCartao = await cartao.innerText();
  conferir("o card carrega o selo PRO", /PRO/.test(textoCartao), textoCartao.replace(/\n/g, " "));
  conferir("o card anuncia o teste grátis", /dias grátis/i.test(textoCartao));
}

await navegador.close();

/* -------------------------------------------------------------------------- */

console.log(`\n${oks} conferências passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("planejamento financeiro OK");
