/**
 * EXISTE UMA ASSINATURA SÓ, E UM PREÇO SÓ.
 *
 * A regra do negócio: o Hub é livre e sem login, e a única coisa que se compra
 * é o Workspace Novare, a R$ 19,90/mês — que libera o Planejamento Financeiro,
 * a Íris e as ferramentas, e dá desconto na consultoria. Este teste é o
 * guarda-costas dessa decisão: garante que nenhuma tela invente um segundo
 * preço, um plano superior ou um desconto que a casa não pratica.
 *
 * Cuidado ao ler as regras: valor em reais NÃO é preço. O resultado de uma
 * simulação (R$ 425.302 de patrimônio, R$ 4.200 de salário) tem de aparecer.
 * O que não pode é oferta indevida: "R$ 149/mês", "30% OFF", "assine agora"
 * fora das telas que vendem.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROTAS = [
  "/", "/aplicativos", "/aplicativos?area=ia", "/profissionais",
  "/profissionais/medicos", "/profissionais/engenheiros-e-arquitetos",
  "/profissionais/advogados", "/profissionais/dentistas",
  "/acompanhamento", "/consultoria", "/iris", "/novare-news",
  "/ferramentas/raio-x-previdencia", "/ferramentas/salario-liquido",
  "/planejamento", "/exame-saude-financeira",
];

/**
 * Onde a oferta PODE aparecer: a home (card do produto), a landing do
 * Planejamento e a landing da assinatura. Em qualquer outra rota, preço
 * continua proibido.
 */
const ROTAS_COM_OFERTA = new Set(["/", "/planejamento", "/assinar"]);

/** O preço aprovado. Qualquer outro valor mensal segue sendo erro. */
const PRECO_APROVADO = /R\$\s?19,90/;

const PROIBIDOS = [
  // A BARRA é o que separa preço de valor simulado: "R$ 19,90/mês" é oferta,
  // "R$ 8.000 por mês" é a renda que o usuário digitou na calculadora.
  { nome: "preço mensal", re: /R\$\s?[\d.,]+\s*\/\s*m(ê|e)s/i, podeTerOferta: true },
  { nome: "valor do acompanhamento", re: /R\$\s?149/ },
  // Qualquer preço mensal que não seja o aprovado é um segundo plano nascendo.
  { nome: "plano superior inventado", re: /plano (premium|avan[çc]ado|completo|plus|gold)/i },
  // O desconto do assinante é real e vale 30% (DESCONTO_ASSINANTE), então
  // pode aparecer onde faz sentido. O que este teste caça é OUTRO número:
  // desconto inventado numa campanha, cupom de parceiro vazando para tela
  // pública, promoção que a casa não pratica.
  { nome: "desconto diferente do praticado", re: /\d{1,2}\s?% ?OFF/i, so: /^30\s?% ?OFF$/i },
  { nome: "chamada para assinar", re: /assine j[áa]|assine agora|assinar agora|quero assinar|assinar por/i, podeTerOferta: true },
  { nome: "chamada para comprar", re: /comprar agora|finalizar compra|adicionar ao carrinho|pagar agora/i },
  // A regra "promessa a assinante" foi REMOVIDA de propósito.
  //
  // Ela nasceu quando ASSINATURA_ATIVA era false: prometer benefício de
  // assinante era prometer o que não existia. Hoje a assinatura existe, tem
  // preço e tem checkout — dizer "quem assina leva a Íris" na página da Íris
  // é informação verdadeira, não promessa vazia. Manter a regra obrigaria a
  // liberar rota por rota até ela não significar mais nada.
  //
  // O que continua guardado é o essencial: PREÇO só onde se vende, e desconto
  // só no valor que a casa pratica.
];

const falhas = [];
let oks = 0;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });

for (const rota of ROTAS) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  const t = await p.locator("body").innerText();

  for (const { nome, re, podeTerOferta, so } of PROIBIDOS) {
    const achou = t.match(re);

    // `so` marca o único valor que a casa pratica: encontrá-lo não é falha,
    // em rota nenhuma. Qualquer OUTRO valor com a mesma forma é.
    if (achou && so && so.test(achou[0].trim())) {
      oks++;
      continue;
    }

    // Nas telas que vendem a oferta é legítima — desde que seja o preço
    // aprovado. Um valor mensal diferente ali continua sendo falha.
    if (achou && podeTerOferta && ROTAS_COM_OFERTA.has(rota)) {
      if (nome !== "preço mensal" || PRECO_APROVADO.test(achou[0])) continue;
    }
    if (achou) falhas.push(`${rota}: ${nome} — "${achou[0]}"`);
    else oks++;
  }
}

// E o contrário: a página de assinatura precisa dizer o preço e a promessa
// central. Uma landing de venda sem preço visível é pior do que não existir.
await p.goto(BASE + "/assinar", { waitUntil: "domcontentloaded" });
await p.waitForSelector("h1", { timeout: 20000 });
const tAssinar = await p.locator("body").innerText();

for (const [nome, re] of [
  ["mostra o preço", PRECO_APROVADO],
  ["anuncia o teste grátis", /7 dias grátis/i],
  ["promete uma assinatura só", /uma assinatura/i],
  ["explica o desconto na consultoria", /consultoria/i],
]) {
  if (re.test(tAssinar)) oks++;
  else falhas.push(`/assinar: não ${nome}`);
}

// O desconto anunciado tem de ser o que o código pratica (DESCONTO_ASSINANTE).
// Um número solto na página é a forma mais fácil de prometer o que não se dá.
if (/30\s?% ?OFF/i.test(tAssinar)) oks++;
else falhas.push("/assinar: não mostra o desconto de 30% do assinante");

await b.close();
console.log(`\n${oks} conferências passaram em ${ROTAS.length} rotas`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("nada à venda em lugar nenhum");
