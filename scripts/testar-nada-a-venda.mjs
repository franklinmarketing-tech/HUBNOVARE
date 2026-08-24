/**
 * SÓ O VIDA PLAN ESTÁ À VENDA.
 *
 * A regra do negócio: o Hub inteiro é livre e sem login, e o único produto
 * pago é o Vida Plan, a R$ 19,90/mês. Este teste é o guarda-costas dessa
 * decisão — garante que nenhuma OUTRA tela comece a anunciar preço, desconto
 * ou assinatura por engano, e que a assinatura do Workspace (que não existe)
 * não volte a ser prometida.
 *
 * Cuidado ao ler as regras: valor em reais NÃO é preço. O resultado de uma
 * simulação (R$ 425.302 de patrimônio, R$ 4.200 de salário) tem de aparecer.
 * O que não pode é oferta indevida: "R$ 149/mês", "30% OFF", "assine agora"
 * fora das telas do Vida Plan.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROTAS = [
  "/", "/aplicativos", "/aplicativos?area=ia", "/profissionais",
  "/profissionais/medicos", "/profissionais/engenheiros-e-arquitetos",
  "/profissionais/advogados", "/profissionais/dentistas",
  "/acompanhamento", "/consultoria", "/assinar", "/iris", "/novare-news",
  "/ferramentas/raio-x-previdencia", "/ferramentas/salario-liquido",
  "/vida-plan", "/exame-saude-financeira",
];

/**
 * Onde a oferta do Vida Plan PODE aparecer: a home (card do produto) e a
 * própria landing page. Em qualquer outra rota, preço continua proibido.
 */
const ROTAS_COM_VIDA_PLAN = new Set(["/", "/vida-plan"]);

/** O preço aprovado. Qualquer outro valor mensal segue sendo erro. */
const PRECO_VIDA_PLAN = /R\$\s?19,90/;

const PROIBIDOS = [
  // A BARRA é o que separa preço de valor simulado: "R$ 19,90/mês" é oferta,
  // "R$ 8.000 por mês" é a renda que o usuário digitou na calculadora.
  { nome: "preço mensal", re: /R\$\s?[\d.,]+\s*\/\s*m(ê|e)s/i, vidaPlanPodeter: true },
  { nome: "valor do acompanhamento", re: /R\$\s?149/ },
  { nome: "porcentagem de desconto", re: /\d{1,2}\s?% ?OFF/i },
  { nome: "chamada para assinar", re: /assine j[áa]|assine agora|assinar agora|quero assinar|assinar por/i, vidaPlanPodeter: true },
  { nome: "chamada para comprar", re: /comprar agora|finalizar compra|adicionar ao carrinho|pagar agora/i },
  // Prometer benefício a assinante só faz sentido onde existe assinatura —
  // hoje, só o Vida Plan. Em qualquer outra tela continua sendo promessa vazia.
  { nome: "promessa a assinante", re: /para assinantes|assinantes t[êe]m|quem assina/i, vidaPlanPodeter: true },
];

const falhas = [];
let oks = 0;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });

for (const rota of ROTAS) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  const t = await p.locator("body").innerText();

  for (const { nome, re, vidaPlanPodeter } of PROIBIDOS) {
    const achou = t.match(re);
    // Nas telas do Vida Plan a oferta é legítima — desde que seja o preço
    // aprovado. Um valor mensal diferente ali continua sendo falha.
    if (achou && vidaPlanPodeter && ROTAS_COM_VIDA_PLAN.has(rota)) {
      if (nome !== "preço mensal" || PRECO_VIDA_PLAN.test(achou[0])) continue;
    }
    if (achou) falhas.push(`${rota}: ${nome} — "${achou[0]}"`);
    else oks++;
  }
}

// E o contrário: a promessa de que está tudo liberado precisa estar visível
// onde a pessoa procuraria o preço.
await p.goto(BASE + "/assinar", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);
const tAssinar = await p.locator("body").innerText();
if (/liberado|não está à venda|sem assinatura/i.test(tAssinar)) oks++;
else falhas.push("/assinar: não diz que está tudo liberado");

await b.close();
console.log(`\n${oks} conferências passaram em ${ROTAS.length} rotas`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("nada à venda em lugar nenhum");
