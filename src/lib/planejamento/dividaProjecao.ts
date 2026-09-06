import { taxaMensalParaAnualPct, simularAntecipacao } from "@/lib/calculos";

/**
 * Quanto uma dívida DEVERIA estar valendo no fim do mês.
 *
 * Existe porque o fechamento mensal perguntava do zero "Quanto você ainda
 * deve hoje?" para uma dívida cujo saldo, parcela e juros já estão
 * cadastrados. O app tinha os três números que determinam a resposta e
 * mesmo assim pedia para a pessoa fazer a conta de cabeça.
 *
 * O QUE ESTE MÓDULO NÃO FAZ: inventar premissa. Sem juros informados, a
 * projeção é amortização linear e o texto na tela diz isso; sem parcela,
 * não há projeção nenhuma e a tela volta a perguntar como antes. Um número
 * chutado com cara de exato é pior do que campo em branco — a pessoa
 * confirma sem conferir e o erro entra no histórico dela.
 *
 * PREMISSA: parcela fixa (PRICE). É o certo para empréstimo pessoal,
 * consignado e financiamento. Para rotativo de cartão e cheque especial o
 * número é aproximado — ver `projecaoConfiavelPara`.
 */

/** Como a conta foi feita — é o que decide o texto que a tela mostra. */
export type QualidadeProjecao =
  /** Saldo, parcela e juros informados: a conta fecha. */
  | "completa"
  /** Sem juros cadastrados: amortização linear, e a tela avisa. */
  | "sem-juros"
  /** A parcela não cobre nem o juro do mês: a dívida CRESCE. */
  | "parcela-insuficiente"
  /** Sem parcela cadastrada: não dá para projetar nada. */
  | "impossivel";

export type ProjecaoDivida = {
  /** O saldo esperado no fim do período. Zero quando quitada. */
  saldo: number;
  /** Juros que correram no período. Zero quando não há taxa informada. */
  juros: number;
  /** Quanto do principal foi abatido. Negativo se a dívida cresceu. */
  amortizado: number;
  /** Em quantos meses zera no ritmo atual. `null` quando nunca zera. */
  prazoEstimado: number | null;
  qualidade: QualidadeProjecao;
};

/**
 * Tipos de dívida em que a projeção por parcela fixa NÃO se aplica.
 *
 * Rotativo de cartão e cheque especial não têm parcela fixa: o saldo anda
 * conforme o uso, e projetar como PRICE daria um número com cara de certo
 * que a pessoa confirmaria sem pensar. Para estes, a tela mostra a
 * referência ao lado mas não pré-preenche o campo.
 *
 * Comparação sem acento e em minúsculas porque `debts.type` guarda o rótulo
 * do catálogo por extenso ("Cartão de crédito", "Cheque especial").
 */
const SEM_PARCELA_FIXA = ["cartao de credito", "cheque especial", "rotativo"];

export function projecaoConfiavelPara(tipo: string | null | undefined): boolean {
  // NFD separa a letra do acento; o range U+0300–U+036F são as marcas
  // soltas que sobram. Escrito por código para o arquivo não depender de
  // combining chars invisíveis no meio de uma regex.
  const marcas = new RegExp("[\u0300-\u036f]", "g");
  const limpo = (tipo ?? "").toLowerCase().normalize("NFD").replace(marcas, "");
  return !SEM_PARCELA_FIXA.some((t) => limpo.includes(t));
}

/**
 * `debts.interest_rate` é percentual ao MÊS; as funções de `calculos.ts`
 * recebem percentual ao ANO. A conversão é composta, não vezes doze: 2% ao
 * mês são 26,8% ao ano, não 24%.
 */
export function jurosMensalPctParaAnualPct(jurosMensalPct: number): number {
  const mensal = (Number(jurosMensalPct) || 0) / 100;
  if (mensal <= 0) return 0;
  return taxaMensalParaAnualPct(mensal);
}

export type EntradaProjecao = {
  /** Saldo devedor de onde a projeção parte. */
  saldoAtual: number;
  /** Parcela paga por mês. Sem ela não há projeção. */
  parcela: number;
  /** Juros ao mês em %, como vem de `debts.interest_rate`. */
  jurosMensalPct?: number | null;
  /** Quantos meses projetar. O fechamento mensal usa 1. */
  meses?: number;
};

export function saldoEsperado({
  saldoAtual,
  parcela,
  jurosMensalPct,
  meses = 1,
}: EntradaProjecao): ProjecaoDivida {
  const saldo = Math.max(0, Number(saldoAtual) || 0);
  const pmt = Math.max(0, Number(parcela) || 0);
  const jurosPct = Number(jurosMensalPct) || 0;
  const n = Math.max(1, Math.round(meses) || 1);

  // Dívida já quitada: nada a projetar, e é uma resposta boa.
  if (saldo <= 0) {
    return {
      saldo: 0,
      juros: 0,
      amortizado: 0,
      prazoEstimado: 0,
      qualidade: "completa",
    };
  }

  // Sem parcela cadastrada não há como saber para onde o saldo anda.
  if (pmt <= 0) {
    return {
      saldo,
      juros: 0,
      amortizado: 0,
      prazoEstimado: null,
      qualidade: "impossivel",
    };
  }

  const i = jurosPct / 100;

  // Roda mês a mês. É a mesma mecânica de `simularAntecipacao`, mas aqui
  // interessa o SALDO ao fim de N meses, e aquela função devolve só a
  // contagem de meses e o total de juros.
  let corrente = saldo;
  let jurosAcumulado = 0;
  let insuficiente = false;

  for (let mes = 1; mes <= n; mes++) {
    const j = corrente * i;
    // O caso que mais importa avisar: a parcela não cobre o juro, e a
    // dívida sobe mesmo com a pessoa pagando em dia.
    //
    // `<` e não `<=`: com a parcela EXATAMENTE igual ao juro o saldo fica
    // parado, não sobe — e é um caso real (parcela mínima de cartão sai
    // calibrada assim). Dizer "sobe para R$ X" ali seria mentira.
    if (i > 0 && pmt < j) insuficiente = true;
    jurosAcumulado += j;
    corrente = Math.max(0, corrente + j - pmt);
    if (corrente <= 0) break;
  }

  // O prazo sai de `simularAntecipacao`, que já trata "nunca zera" com null.
  const { mesesSem } = simularAntecipacao({
    saldoDevedor: saldo,
    taxaAnualPct: jurosMensalPctParaAnualPct(jurosPct),
    parcela: pmt,
    extraMensal: 0,
  });

  return {
    saldo: corrente,
    juros: jurosAcumulado,
    amortizado: saldo - corrente,
    prazoEstimado: mesesSem,
    qualidade: insuficiente
      ? "parcela-insuficiente"
      : jurosPct > 0
        ? "completa"
        : "sem-juros",
  };
}

/**
 * O saldo se a pessoa NÃO pagar nada no mês.
 *
 * Alimenta o botão "Não paguei": sem taxa, o saldo fica onde estava; com
 * taxa, sobe o juro do mês. Ninguém deveria ter de calcular isso de cabeça
 * para lançar um mês em que não conseguiu pagar.
 */
export function saldoSemPagar(
  saldoAtual: number,
  jurosMensalPct?: number | null,
): number {
  const saldo = Math.max(0, Number(saldoAtual) || 0);
  const i = (Number(jurosMensalPct) || 0) / 100;
  return saldo + saldo * Math.max(0, i);
}

/* -------------------------------------------------------------------------
   O tipo de evento do mês, guardado dentro de `estado_atual`
   ------------------------------------------------------------------------- */

/**
 * O que aconteceu com a dívida no mês.
 *
 * Hoje a tela só oferece um campo de texto livre ("+ anotar o que
 * aconteceu") que nenhum cálculo lê. Com o tipo, "paguei em dia" e "não
 * consegui pagar" deixam de ser a mesma coisa aos olhos do app.
 */
export type TipoEvento =
  | "pago_em_dia"
  | "adiantei"
  | "nao_paguei"
  /** Digitou o valor à mão: renegociação, erro no cadastro, o que for. */
  | "ajuste_manual";

const PREFIXOS: TipoEvento[] = [
  "pago_em_dia",
  "adiantei",
  "nao_paguei",
  "ajuste_manual",
];

/**
 * Codifica tipo + nota numa string só, para caber na coluna `estado_atual`
 * que já existe.
 *
 * É um arranjo deliberado, não descuido: uma coluna dedicada exigiria
 * migration no Supabase, e migration se pede depois de o recurso provar
 * valor — não antes. Uma nota antiga, sem prefixo, lê como `ajuste_manual`,
 * então nada do que já está gravado quebra. Quando a coluna existir, um
 * UPDATE simples migra tudo.
 */
export function escreverEstado(tipo: TipoEvento, nota?: string): string {
  const limpa = (nota ?? "").trim();
  return limpa ? `${tipo}|${limpa}` : tipo;
}

export function lerEstado(bruto?: string | null): {
  tipo: TipoEvento;
  nota: string;
} {
  const texto = (bruto ?? "").trim();
  if (!texto) return { tipo: "ajuste_manual", nota: "" };

  const corte = texto.indexOf("|");
  const cabeca = corte >= 0 ? texto.slice(0, corte) : texto;

  if ((PREFIXOS as string[]).includes(cabeca)) {
    return {
      tipo: cabeca as TipoEvento,
      nota: corte >= 0 ? texto.slice(corte + 1) : "",
    };
  }

  // Texto sem prefixo: é nota escrita antes desta versão.
  return { tipo: "ajuste_manual", nota: texto };
}
