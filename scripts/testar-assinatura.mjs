/**
 * A ARITMÉTICA DA ASSINATURA — os dois planos, a economia e os rótulos.
 *
 * Por que este teste existe: a partir do dia em que a casa passou a ter dois
 * prazos de pagamento, a oferta deixou de ser um número e virou uma CONTA. E
 * conta de preço erra calada — ninguém abre um chamado dizendo "a landing
 * anunciou R$ 119 de economia e o certo era R$ 120". O cliente só desconfia.
 *
 * O QUE ELE PROTEGE, em ordem de estrago:
 *
 *  1. O mensal equivalente do anual precisa ser EXATO. R$ 238,80 ÷ 12 dá
 *     R$ 19,90 na bala; um anual de R$ 239 daria R$ 19,9166..., e a tela
 *     arredondaria por conta própria — anunciando um preço que a fatura não
 *     confirma.
 *  2. A economia tem DUAS leituras verdadeiras (R$ 120,00 e ~4 mensalidades)
 *     e uma terceira que circula na conversa e é falsa ("dois meses de
 *     graça"). O teste crava as duas verdadeiras e prova que a terceira não
 *     sai desta aritmética.
 *  3. Nenhum texto exportado pode voltar a prometer teste grátis ou "sem
 *     cartão". A oferta é o contrário disso: cobra-se e devolve-se.
 *
 * Roda com: node scripts/testar-assinatura.mjs
 * (O aviso MODULE_TYPELESS_PACKAGE_JSON do Node é ruído: ele aparece porque o
 *  teste importa o .ts direto, que é justamente o ponto — ler a fonte única em
 *  vez de reescrever a conta aqui e conferir cópia com cópia.)
 */
import * as A from "../src/lib/assinatura.ts";

const falhas = [];
let oks = 0;

function conferir(nome, condicao, detalhe) {
  if (condicao) oks++;
  else falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

/** Compara dinheiro em CENTAVOS: 29.9 * 12 em float dá 358.79999999999995. */
const cent = (v) => Math.round(v * 100);

/* ══════════════════════════════════════════ 1. os valores dos dois planos */

conferir("mensal é R$ 29,90", cent(A.ASSINATURA_PRECO) === 2990, `veio ${A.ASSINATURA_PRECO}`);
conferir(
  "anual é R$ 238,80 cobrados de uma vez",
  cent(A.ASSINATURA_PRECO_ANUAL) === 23880,
  `veio ${A.ASSINATURA_PRECO_ANUAL}`,
);
conferir(
  "o anual dividido por 12 dá o mensal equivalente",
  cent(A.ASSINATURA_PRECO_ANUAL_MENSAL) * 12 === cent(A.ASSINATURA_PRECO_ANUAL),
  `${A.ASSINATURA_PRECO_ANUAL_MENSAL} × 12 ≠ ${A.ASSINATURA_PRECO_ANUAL}`,
);
conferir(
  "o mensal equivalente é R$ 19,90 EXATO (sem arredondar centavo)",
  cent(A.ASSINATURA_PRECO_ANUAL_MENSAL) === 1990,
  `veio ${A.ASSINATURA_PRECO_ANUAL_MENSAL}`,
);
conferir(
  "o anual é mais barato que o mensal por mês",
  cent(A.ASSINATURA_PRECO_ANUAL_MENSAL) < cent(A.ASSINATURA_PRECO),
);
conferir(
  "a referência do anual é 12 mensalidades (R$ 358,80)",
  cent(A.ASSINATURA_ANUAL_REFERENCIA) === cent(A.ASSINATURA_PRECO) * 12,
  `veio ${A.ASSINATURA_ANUAL_REFERENCIA}`,
);

/* ══════════════════════════════════ 2. a economia, nas duas leituras certas */

conferir(
  "LEITURA 1 (dinheiro): a economia é R$ 120,00",
  cent(A.ASSINATURA_ANUAL_ECONOMIA) === 12000,
  `veio ${A.ASSINATURA_ANUAL_ECONOMIA}`,
);
conferir(
  "a economia é mesmo referência menos anual",
  cent(A.ASSINATURA_ANUAL_ECONOMIA) ===
    cent(A.ASSINATURA_ANUAL_REFERENCIA) - cent(A.ASSINATURA_PRECO_ANUAL),
);
conferir(
  "LEITURA 2 (mensalidades): a economia equivale a 4",
  A.ASSINATURA_ANUAL_ECONOMIA_MESES === 4,
  `veio ${A.ASSINATURA_ANUAL_ECONOMIA_MESES}`,
);

/* As duas leituras NÃO batem no centavo, e é isso que este bloco documenta:
   4 × R$ 29,90 = R$ 119,60, contra R$ 120,00 de economia real. Sobram R$ 0,40
   a favor do cliente — por isso o rótulo diz "cerca de". Se alguém um dia
   escrever "4 × a mensalidade" como se fosse a economia, erra por 40 centavos
   para MENOS, o que é feio mas honesto; escrever o contrário seria promessa
   que a fatura desmente. */
const sobra =
  cent(A.ASSINATURA_ANUAL_ECONOMIA) -
  A.ASSINATURA_ANUAL_ECONOMIA_MESES * cent(A.ASSINATURA_PRECO);
conferir(
  "as duas leituras diferem em R$ 0,40 (e o rótulo avisa com 'cerca de')",
  sobra === 40 && A.ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO.includes("cerca de"),
  `sobra ${sobra} centavos · rótulo "${A.ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO}"`,
);

/* A TERCEIRA leitura, a que circula na conversa e não sai da conta: "dois
   meses de graça". Duas provas de que ela não fecha, para ninguém digitar
   isso numa tela achando que é sinônimo. */
conferir(
  '"dois meses de graça" NÃO é a economia (2 mensalidades ≠ R$ 120,00)',
  2 * cent(A.ASSINATURA_PRECO) !== cent(A.ASSINATURA_ANUAL_ECONOMIA),
  "a frase do dono coincidiria com a conta — reveja o comentário de assinatura.ts",
);
conferir(
  '"dois meses de graça" custaria R$ 299,00 no ano, não R$ 238,80',
  cent(A.ASSINATURA_PRECO) * 10 !== cent(A.ASSINATURA_PRECO_ANUAL),
);
const textosExportados = Object.values(A)
  .flatMap((v) =>
    typeof v === "string"
      ? [v]
      : Array.isArray(v)
        ? v.flatMap((i) => (typeof i === "string" ? [i] : Object.values(i).filter((x) => typeof x === "string")))
        : [],
  )
  .join(" | ");
conferir(
  'nenhum rótulo exportado escreve "dois meses" / "2 meses"',
  !/\b(dois|2)\s+meses\b/i.test(textosExportados),
);

/* ══════════════════════════════════════════ 3. o desconto em porcentagem */

conferir(
  "o desconto do anual é 33% (arredondado para BAIXO, de 33,44%)",
  A.ASSINATURA_ANUAL_DESCONTO_PERCENTUAL === 33,
  `veio ${A.ASSINATURA_ANUAL_DESCONTO_PERCENTUAL}`,
);
conferir(
  "o desconto anunciado nunca é maior que o praticado",
  A.ASSINATURA_ANUAL_DESCONTO_PERCENTUAL <=
    (cent(A.ASSINATURA_ANUAL_ECONOMIA) / cent(A.ASSINATURA_ANUAL_REFERENCIA)) * 100,
);

/* ═══════════════════════════════════════ 4. os rótulos, em português certo */

/* O `toLocaleString` do pt-BR separa "R$" do número com espaço NÃO-QUEBRÁVEL
   (U+00A0), e não com espaço comum. É de propósito — impede o valor de
   quebrar linha entre a moeda e o número —, mas quem for comparar string na
   mão precisa saber. Normalizamos aqui para conferir o resto. */
const normal = (s) => s.replace(/ /g, " ");

for (const [nome, rotulo, esperado] of [
  ["mensal", A.ASSINATURA_PRECO_ROTULO, "R$ 29,90"],
  ["anual (total)", A.ASSINATURA_PRECO_ANUAL_ROTULO, "R$ 238,80"],
  ["anual (por mês)", A.ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO, "R$ 19,90"],
  ["economia", A.ASSINATURA_ANUAL_ECONOMIA_ROTULO, "R$ 120,00"],
  ["referência", A.ASSINATURA_ANUAL_REFERENCIA_ROTULO, "R$ 358,80"],
]) {
  conferir(`rótulo ${nome} é "${esperado}"`, normal(rotulo) === esperado, `veio "${normal(rotulo)}"`);
  conferir(`rótulo ${nome} usa vírgula decimal`, /,\d{2}$/.test(rotulo));
  conferir(`rótulo ${nome} tem "R$ " com espaço`, /^R\$\s/.test(rotulo));
  conferir(`rótulo ${nome} não usa ponto decimal`, !/\.\d{2}$/.test(rotulo));
}

conferir(
  "o espaço do rótulo é o não-quebrável do pt-BR (U+00A0)",
  A.ASSINATURA_PRECO_ROTULO.includes(" "),
  "se isto falhar, a regra de escape de `testar-nada-a-venda.mjs` perdeu o motivo de existir",
);
/* Os dois "por dia" saem prontos da fonte. O do anual é o único que sustenta
   a frase de bolso ("menos que um café"): o mensal, dividido por 30, arredonda
   para R$ 1,00 — que não é comparação, é o preço outra vez. */
conferir(
  "o por-dia do mensal sai pronto e é de um dígito",
  /^R\$\s\d,\d{2}$/.test(A.ASSINATURA_PRECO_DIA_ROTULO),
  `veio "${A.ASSINATURA_PRECO_DIA_ROTULO}"`,
);
conferir(
  "o por-dia do anual é menos de R$ 1,00",
  /^R\$\s0,\d{2}$/.test(A.ASSINATURA_PRECO_DIA_ANUAL_ROTULO),
  `veio "${A.ASSINATURA_PRECO_DIA_ANUAL_ROTULO}"`,
);
conferir(
  "a receita recorrente é calculada na fonte, não na tela",
  normal(A.assinaturaReceitaMensal(10)) === "R$ 299,00",
  `veio "${normal(A.assinaturaReceitaMensal(10))}"`,
);
conferir(
  "a oferta em uma linha cita os dois planos",
  A.ASSINATURA_OFERTA.includes(A.ASSINATURA_PRECO_ROTULO) &&
    A.ASSINATURA_OFERTA.includes(A.ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO) &&
    A.ASSINATURA_OFERTA.includes(A.ASSINATURA_PRECO_ANUAL_ROTULO),
  A.ASSINATURA_OFERTA,
);

/* ═════════════════════════════════════ 5. garantia no lugar do teste grátis */

conferir("a garantia é de 7 dias", A.ASSINATURA_GARANTIA_DIAS === 7);
conferir(
  "a frase curta da garantia diz o prazo e a palavra",
  /7 dias/.test(A.ASSINATURA_GARANTIA) && /garantia/i.test(A.ASSINATURA_GARANTIA),
  A.ASSINATURA_GARANTIA,
);
conferir(
  "a frase longa promete devolução, não teste",
  /devolv/i.test(A.ASSINATURA_GARANTIA_FRASE) &&
    !/gr[áa]tis/i.test(A.ASSINATURA_GARANTIA_FRASE),
  A.ASSINATURA_GARANTIA_FRASE,
);
conferir(
  'nenhum texto exportado promete "grátis", "sem cartão" ou "teste"',
  !/gr[áa]tis|sem cart[ãa]o|dias de teste|teste gr/i.test(textosExportados),
  textosExportados.slice(0, 200),
);
conferir(
  "a lista do que inclui cita a garantia",
  A.ASSINATURA_INCLUI.some((i) => /garantia/i.test(i)),
);

/* ════════════════════════════════════════════ 6. os planos prontos de render */

conferir("existem exatamente dois planos", A.ASSINATURA_PLANOS.length === 2);
conferir(
  "as chaves são mensal e anual, nessa ordem",
  A.ASSINATURA_PLANOS.map((p) => p.chave).join(",") === "mensal,anual",
);
conferir(
  "o número grande dos DOIS planos é um valor por mês",
  A.ASSINATURA_PLANOS.every((p) => p.periodo === "/mês"),
);
conferir(
  "o cartão do anual mostra o total cobrado de uma vez",
  A.ASSINATURA_PLANOS[1].detalhe.includes(A.ASSINATURA_PRECO_ANUAL_ROTULO),
  A.ASSINATURA_PLANOS[1].detalhe,
);
conferir(
  "só o anual tem selo, e ele traz a economia em reais",
  A.ASSINATURA_PLANOS[0].selo === null &&
    A.ASSINATURA_PLANOS[1].selo.includes(A.ASSINATURA_ANUAL_ECONOMIA_ROTULO),
);

/* ══════════════════════════════════════════════ 7. o destino do botão */

/* Sem as variáveis de ambiente da Hotmart (o caso de hoje, e o de qualquer
   máquina de desenvolvimento), todo botão precisa cair na tela de "em breve"
   — nunca em string vazia, que recarrega a página e parece defeito. */
const semHotmart =
  A.ASSINATURA_CHECKOUT_URL === "" && A.ASSINATURA_CHECKOUT_URL_ANUAL === "";

conferir(
  "o checkout nunca devolve destino vazio",
  A.assinaturaCheckout("mensal").length > 0 &&
    A.assinaturaCheckout("anual").length > 0,
);
if (semHotmart) {
  conferir(
    "sem oferta cadastrada, os dois planos caem em /assinar/em-breve",
    A.assinaturaCheckout("mensal") === A.ROTA_ASSINAR_EM_BREVE &&
      A.assinaturaCheckout("anual") === A.ROTA_ASSINAR_EM_BREVE,
  );
  conferir(
    "e a tela de 'em breve' continua de pé (checkout incompleto)",
    A.ASSINATURA_CHECKOUT_COMPLETO === false && A.ASSINATURA_CHECKOUT_ABERTO === false,
  );
} else {
  conferir(
    "com oferta cadastrada, o botão aponta para fora (Hotmart)",
    A.assinaturaCheckout("mensal").startsWith("http") ||
      A.assinaturaCheckout("anual").startsWith("http"),
  );
}

/* -------------------------------------------------------------------------- */

console.log(`\n${oks} conferências passaram`);
console.log(
  `preços: ${normal(A.ASSINATURA_PRECO_ROTULO)}/mês · ` +
    `${normal(A.ASSINATURA_PRECO_ANUAL_ROTULO)}/ano ` +
    `(${normal(A.ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO)}/mês) · ` +
    `economia ${normal(A.ASSINATURA_ANUAL_ECONOMIA_ROTULO)} ` +
    `(${A.ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO}, ${A.ASSINATURA_ANUAL_DESCONTO_ROTULO})`,
);

if (falhas.length) {
  console.log(`\n${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("a aritmética da assinatura bate.");
