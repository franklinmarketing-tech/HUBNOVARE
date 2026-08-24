/**
 * NADA ESTÁ À VENDA.
 *
 * Enquanto o dono não aprovar, nenhuma tela pode anunciar preço, desconto
 * ou plano contratável. Este teste varre o site inteiro procurando sinal
 * de oferta — é o guarda-costas dessa decisão.
 *
 * Cuidado ao ler as regras: valor em reais NÃO é preço. O resultado de uma
 * simulação (R$ 425.302 de taxa, R$ 4.200 de salário) tem de aparecer. O
 * que não pode é oferta: "R$ 149/mês", "30% OFF", "assine agora".
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROTAS = [
  "/", "/aplicativos", "/aplicativos?area=ia", "/profissionais",
  "/profissionais/medicos", "/profissionais/engenheiros-e-arquitetos",
  "/profissionais/advogados", "/profissionais/dentistas",
  "/acompanhamento", "/consultoria", "/assinar", "/iris", "/novare-news",
  "/ferramentas/raio-x-previdencia", "/ferramentas/salario-liquido",
];

const PROIBIDOS = [
  { nome: "preço mensal", re: /R\$\s?[\d.]+\s*\/\s*m(ê|e)s/i },
  { nome: "valor do acompanhamento", re: /R\$\s?149/ },
  { nome: "porcentagem de desconto", re: /\d{1,2}\s?% ?OFF/i },
  { nome: "chamada para assinar", re: /assine j[áa]|assine agora|assinar agora|quero assinar/i },
  { nome: "chamada para comprar", re: /comprar agora|finalizar compra|adicionar ao carrinho|pagar agora/i },
  { nome: "promessa a assinante", re: /para assinantes|assinantes t[êe]m|quem assina/i },
];

const falhas = [];
let oks = 0;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });

for (const rota of ROTAS) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  const t = await p.locator("body").innerText();

  for (const { nome, re } of PROIBIDOS) {
    const achou = t.match(re);
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
