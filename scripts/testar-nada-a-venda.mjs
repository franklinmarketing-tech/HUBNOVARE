/**
 * EXISTE UMA ASSINATURA SÓ, E UM PREÇO SÓ.
 *
 * A regra do negócio: o Hub é livre e sem login, e a única coisa que se compra
 * é o Workspace Novare — que libera o Planejamento Financeiro, a Íris e as
 * ferramentas, e dá desconto na consultoria. Este teste é o guarda-costas
 * dessa decisão: garante que nenhuma tela invente um segundo preço, um plano
 * superior ou um desconto que a casa não pratica.
 *
 * ⚠️ NENHUM VALOR ESTÁ ESCRITO AQUI, de propósito. Os preços são importados de
 * `src/lib/assinatura.ts` — inclusive os DOIS "por mês" legítimos, já que o
 * plano anual mostra o próprio mensal equivalente. Guardião que precisa ser
 * atualizado à mão junto com o preço não guarda nada: da última vez ele passou
 * a reprovar a página certa.
 *
 * Cuidado ao ler as regras: valor em reais NÃO é preço. O resultado de uma
 * simulação (R$ 425.302 de patrimônio, R$ 4.200 de salário) tem de aparecer.
 * O que não pode é oferta indevida: "R$ 149/mês", "30% OFF", "assine agora"
 * fora das telas que vendem.
 */
import { chromium } from "playwright";
import {
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ANUAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "../src/lib/assinatura.ts";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROTAS = [
  "/", "/aplicativos", "/aplicativos?area=ia", "/profissionais",
  "/profissionais/medicos", "/profissionais/engenheiros-e-arquitetos",
  "/profissionais/advogados", "/profissionais/dentistas",
  "/consultoria", "/assinar", "/iris", "/novare-news",
  "/ferramentas/raio-x-previdencia", "/ferramentas/salario-liquido",
  "/planejamento", "/fincash", "/exame-saude-financeira",
  // A tela que recebe quem clicou em assinar antes de a oferta da Hotmart
  // existir. Mostra preço, então precisa ser vigiada como as outras que
  // vendem — e some sozinha (307 para /assinar) quando os dois links forem
  // cadastrados, sem quebrar este teste.
  "/assinar/em-breve",
];

/**
 * Onde a oferta PODE aparecer: a home (card do produto), as landings dos dois
 * produtos pagos (Planejamento e Organizador) e a landing da assinatura. Em
 * qualquer outra rota, preço continua proibido.
 */
const ROTAS_COM_OFERTA = new Set([
  "/",
  "/planejamento",
  "/fincash",
  "/assinar",
  "/assinar/em-breve",
]);

/* Escapa um rótulo de preço para regex e tolera o espaço: o
   `toLocaleString` do pt-BR separa "R$" do número com espaço NÃO-QUEBRÁVEL
   (U+00A0), e a página pode renderizar um espaço comum. */
const paraRegex = (rotulo) =>
  rotulo
    .replace(/[.*+?^${}()|[\]\\]/g, (c) => "\\" + c)
    .replace(/\s/g, "\\s?");

/**
 * Os "por mês" aprovados — SÃO DOIS desde que existe plano anual.
 *
 * O mensal avulso (R$ 29,90) e o mensal equivalente do anual (R$ 19,90) são
 * os dois valores que uma tela pode legitimamente escrever seguidos de "/mês".
 * Qualquer terceiro valor com essa forma é um segundo plano nascendo — que é
 * exatamente o que este arquivo existe para impedir.
 */
const PRECO_APROVADO = new RegExp(
  `(${[ASSINATURA_PRECO_ROTULO, ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO]
    .map(paraRegex)
    .join("|")})`,
);

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
  /* A oferta virou GARANTIA de 7 dias: paga-se e devolve-se. Teste grátis e
     "sem cartão" são a promessa CONTRÁRIA, e cada tela que sobreviver com o
     texto velho vende uma coisa que o checkout não faz.

     ⚠️ ESTA REGRA JÁ TEVE UMA EXCEÇÃO, e ela morreu com prazo cumprido:
     /fincash ficava de fora enquanto a landing era refeita com o preço novo.
     A landing entrou, a linha saiu e o próprio campo `exceto` foi embora do
     laço — a regra passou a valer para o site inteiro, que é o único estado
     em que um guardião de promessa guarda alguma coisa. Se uma rota reprovar
     aqui, é a rota que está prometendo o que o checkout não faz. */
  {
    nome: "promessa de teste grátis (a oferta é garantia)",
    re: /\d+\s*dias?\s*gr[áa]tis|sem cart[ãa]o|teste gr[áa]tis|sem cadastrar cart[ãa]o/i,
  },
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

  /* ⚠️ NÃO EXISTE MAIS "PULAR ESTA ROTA", e a ausência é a regra: havia um
     campo `exceto` que liberava uma rota de uma regra enquanto ela era
     reescrita, e ele saiu junto com a última exceção (a landing do FINCASH,
     que já está com o preço novo). Guardião com porta dos fundos é guardião
     que um dia protege só as telas que ninguém ia quebrar mesmo. */
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
  ["mostra o preço mensal", new RegExp(paraRegex(ASSINATURA_PRECO_ROTULO))],
  [
    "mostra o preço do plano anual",
    new RegExp(paraRegex(ASSINATURA_PRECO_ANUAL_ROTULO)),
  ],
  [
    "mostra o mensal equivalente do anual",
    new RegExp(paraRegex(ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO)),
  ],
  // Substituiu "anuncia o teste grátis". A reversão de risco continua sendo
  // obrigatória na landing — o que mudou foi QUAL é ela.
  ["anuncia a garantia", new RegExp(`${ASSINATURA_GARANTIA_DIAS} dias de garantia`, "i")],
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
