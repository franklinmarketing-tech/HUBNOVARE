/**
 * Auditoria de previdência privada: quanto as taxas custam, em reais.
 *
 * É o motor do Raio-X — o produto que só uma casa sem comissão pode
 * oferecer. A conta não julga o produto nem indica substituto: ela apenas
 * mostra o dinheiro que sai do bolso do titular por causa das taxas, e o
 * que esse mesmo dinheiro seria se tivesse ficado rendendo.
 *
 * Convenções (documentadas porque mudam o resultado):
 *
 * • **Taxa de administração** incide sobre o PATRIMÔNIO, provisionada dia
 *   a dia. O efeito sobre a rentabilidade é multiplicativo, não uma
 *   subtração: líquida = (1 + bruta) / (1 + adm) − 1. Subtrair dá um
 *   número parecido, mas errado — e para 30 anos a diferença é grande.
 *
 * • **Taxa de carregamento** incide sobre CADA APORTE, na entrada. Um
 *   carregamento de 3% significa que de R$ 1.000 aportados só R$ 970
 *   passam a render.
 *
 * • A simulação é MÊS A MÊS, com aporte no fim de cada mês. É como o
 *   extrato do plano se comporta, e evita o erro de tratar aporte mensal
 *   como se fosse anual.
 *
 * O cenário de comparação NÃO é "taxa zero" — isso seria desonesto,
 * porque nenhum produto é de graça. É um plano de custo baixo, com os
 * parâmetros em `REFERENCIA`.
 */

/**
 * O plano de custo baixo usado como régua.
 *
 * 0,4% a.a. de administração e nada de carregamento é o patamar que
 * planos sem intermediário praticam hoje. Não é o menor do mercado nem
 * uma promessa: é uma régua conservadora para medir o excesso.
 */
export const REFERENCIA = { taxaAdmPct: 0.4, carregamentoPct: 0 };

export type EntradaPrevidencia = {
  /** Quanto já existe acumulado no plano, em reais. */
  saldo: number;
  /** Aporte mensal, em reais. Zero é válido (plano parado). */
  aporteMensal: number;
  /** Anos que faltam até começar a usar o dinheiro. */
  anos: number;
  /** Rentabilidade BRUTA anual esperada, em % (antes das taxas). */
  rentabilidadeAnualPct: number;
  /** Taxa de administração anual do plano, em %. */
  taxaAdmPct: number;
  /** Taxa de carregamento sobre cada aporte, em %. */
  carregamentoPct: number;
};

export type SaidaPrevidencia = {
  /** Patrimônio final com as taxas que a pessoa paga hoje. */
  patrimonioReal: number;
  /** Patrimônio final no plano de referência, mesmos aportes. */
  patrimonioReferencia: number;
  /** A diferença — o custo do excesso de taxa, em reais. */
  custoTotal: number;
  /** Quanto o excesso representa do patrimônio de referência, em %. */
  custoPct: number;
  /** Só o carregamento: dinheiro que nunca chegou a render. */
  custoCarregamento: number;
  /** Total efetivamente aportado no período (sem contar o saldo inicial). */
  totalAportado: number;
  /** Rentabilidade líquida anual do plano de hoje, em %. */
  rentabilidadeLiquidaPct: number;
  /** Rentabilidade líquida anual do plano de referência, em %. */
  rentabilidadeLiquidaReferenciaPct: number;
  /**
   * Quantos meses de aposentadoria o excesso de taxa custa, considerando
   * uma retirada mensal de 0,4% do patrimônio (regra dos 4% ao ano).
   * Traduz o número abstrato em tempo de vida.
   */
  mesesDeAposentadoriaPerdidos: number;
};

/** Converte taxa anual em mensal equivalente (juro composto, não divisão por 12). */
export function mensalEquivalente(anualPct: number): number {
  return Math.pow(1 + anualPct / 100, 1 / 12) - 1;
}

/**
 * Rentabilidade que sobra depois da taxa de administração.
 * Multiplicativa: a taxa come uma fatia do patrimônio já valorizado.
 */
export function rentabilidadeLiquida(brutaPct: number, admPct: number): number {
  return ((1 + brutaPct / 100) / (1 + admPct / 100) - 1) * 100;
}

/** Evolução mês a mês de um plano, devolvendo o patrimônio final. */
function simular(
  saldo: number,
  aporteMensal: number,
  meses: number,
  rentLiquidaAnualPct: number,
  carregamentoPct: number,
): { patrimonio: number; aportadoLiquido: number } {
  const i = mensalEquivalente(rentLiquidaAnualPct);
  const aporteLiquido = aporteMensal * (1 - carregamentoPct / 100);

  let patrimonio = saldo;
  for (let m = 0; m < meses; m++) {
    // Rende primeiro sobre o que já havia, depois entra o aporte do mês.
    patrimonio = patrimonio * (1 + i) + aporteLiquido;
  }
  return { patrimonio, aportadoLiquido: aporteLiquido * meses };
}

/** Roda a auditoria completa. */
export function auditarPrevidencia(e: EntradaPrevidencia): SaidaPrevidencia {
  const meses = Math.round(e.anos * 12);

  const liquidaReal = rentabilidadeLiquida(e.rentabilidadeAnualPct, e.taxaAdmPct);
  const liquidaRef = rentabilidadeLiquida(
    e.rentabilidadeAnualPct,
    REFERENCIA.taxaAdmPct,
  );

  const real = simular(
    e.saldo,
    e.aporteMensal,
    meses,
    liquidaReal,
    e.carregamentoPct,
  );
  const referencia = simular(
    e.saldo,
    e.aporteMensal,
    meses,
    liquidaRef,
    REFERENCIA.carregamentoPct,
  );

  const custoTotal = referencia.patrimonio - real.patrimonio;
  const totalAportado = e.aporteMensal * meses;

  // Regra dos 4% ao ano: 0,3333% ao mês de retirada sustentável.
  const retiradaMensal = (referencia.patrimonio * 0.04) / 12;

  return {
    patrimonioReal: real.patrimonio,
    patrimonioReferencia: referencia.patrimonio,
    custoTotal,
    custoPct: referencia.patrimonio > 0 ? (custoTotal / referencia.patrimonio) * 100 : 0,
    custoCarregamento: (totalAportado * e.carregamentoPct) / 100,
    totalAportado,
    rentabilidadeLiquidaPct: liquidaReal,
    rentabilidadeLiquidaReferenciaPct: liquidaRef,
    mesesDeAposentadoriaPerdidos: retiradaMensal > 0 ? custoTotal / retiradaMensal : 0,
  };
}

/* -------------------------------------------------------------------------- */

/**
 * Faixas de taxa de administração, para dizer em uma palavra onde o
 * plano está. Os cortes vêm do que se pratica: abaixo de 1% é o que
 * planos sem intermediário cobram; acima de 2% é o padrão de balcão de
 * agência bancária.
 */
export type Veredito = "baixa" | "media" | "alta" | "abusiva";

export function classificarTaxa(taxaAdmPct: number): {
  veredito: Veredito;
  rotulo: string;
  explicacao: string;
} {
  if (taxaAdmPct <= 0.8)
    return {
      veredito: "baixa",
      rotulo: "Taxa baixa",
      explicacao:
        "Está no patamar dos planos sem intermediário. Aqui a taxa não é o seu problema — vale olhar a carteira e o regime de tributação.",
    };
  if (taxaAdmPct <= 1.5)
    return {
      veredito: "media",
      rotulo: "Taxa mediana",
      explicacao:
        "Dá para melhorar. Em prazos longos, cada 0,5% a mais de taxa vira um pedaço grande do patrimônio final.",
    };
  if (taxaAdmPct <= 2.2)
    return {
      veredito: "alta",
      rotulo: "Taxa alta",
      explicacao:
        "É o patamar típico de plano vendido em agência. A conta acima mostra o que isso custa até o resgate.",
    };
  return {
    veredito: "abusiva",
    rotulo: "Taxa muito alta",
    explicacao:
      "Acima de 2,2% ao ano a taxa consome boa parte do ganho real. Vale entender o que esse plano entrega em troca.",
  };
}
