/** Taxa anual efetiva → mensal equivalente (a mesma de `calculos.ts`, sem import: o teste roda em node puro). */
const taxaAnualParaMensal = (anualPct: number) => (anualPct <= -100 ? 0 : Math.pow(1 + anualPct / 100, 1 / 12) - 1);

/**
 * QUANDO VOCÊ PODE VIVER DE RENDA (27/10/2026) — a calculadora de aposentadoria que morava no app
 * antigo (novareapp.com.br/ferramentas/calculadora-de-aposentadoria, fora do ar) trazida para o Hub.
 *
 * Tudo em VALORES DE HOJE: a rentabilidade é REAL (acima da inflação), então a renda desejada e o
 * patrimônio ficam no mesmo poder de compra. O patrimônio necessário sai da regra dos 4% (taxa de
 * retirada segura): renda anual ÷ 4%. Não conta INSS, previdência pública nem imposto.
 */
export const RETIRADA_SEGURA_PCT = 4;

export type EntradaAposentadoria = {
  idadeAtual: number;
  idadeAposentar: number;
  /** Renda mensal desejada, em reais de hoje. */
  rendaDesejada: number;
  patrimonioAtual: number;
  aporteMensal: number;
  /** Rentabilidade real esperada, % ao ano acima da inflação. */
  rentabilidadeRealPct: number;
};

export type PontoSerie = { idade: number; patrimonio: number };

export type ResultadoAposentadoria = {
  idadeAtual: number;
  idadeAposentar: number;
  anos: number;
  /** Patrimônio necessário para viver de renda (regra dos 4%). */
  necessario: number;
  /** Patrimônio projetado na idade de aposentar. */
  projetado: number;
  /** Renda mensal que o patrimônio projetado sustenta. */
  rendaProjetada: number;
  totalAportado: number;
  /** % da meta atingida na idade de aposentar (até 100). */
  percentualMeta: number;
  atingiu: boolean;
  /** Idade em que o patrimônio cruza o necessário, no ritmo atual (até 95 anos); null = não cruza. */
  idadeIndependencia: number | null;
  /** Aporte mensal que chega exatamente ao necessário no prazo. */
  aporteNecessario: number;
  aporteFaltante: number;
  serie: PontoSerie[];
};

const positivo = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Valor futuro com aporte no fim de cada mês (o mesmo critério dos juros compostos do Hub). */
export function valorFuturo(pv: number, pmt: number, i: number, meses: number): number {
  if (meses <= 0) return pv;
  if (i === 0) return pv + pmt * meses;
  const f = Math.pow(1 + i, meses);
  return pv * f + pmt * ((f - 1) / i);
}

export function simularAposentadoria(e: EntradaAposentadoria): ResultadoAposentadoria {
  const idadeAtual = Math.min(90, Math.max(18, Math.round(e.idadeAtual) || 18));
  const idadeAposentar = Math.min(95, Math.max(idadeAtual + 1, Math.round(e.idadeAposentar) || idadeAtual + 1));
  const renda = positivo(e.rendaDesejada);
  const pv = positivo(e.patrimonioAtual);
  const pmt = positivo(e.aporteMensal);
  const i = taxaAnualParaMensal(Number.isFinite(e.rentabilidadeRealPct) ? e.rentabilidadeRealPct : 0);

  const anos = idadeAposentar - idadeAtual;
  const n = anos * 12;
  const necessario = renda > 0 ? (renda * 12) / (RETIRADA_SEGURA_PCT / 100) : 0;
  const projetado = valorFuturo(pv, pmt, i, n);
  const rendaProjetada = (projetado * (RETIRADA_SEGURA_PCT / 100)) / 12;
  const atingiu = necessario > 0 && projetado >= necessario;

  let idadeIndependencia: number | null = null;
  if (necessario > 0) {
    if (pv >= necessario) idadeIndependencia = idadeAtual;
    else
      for (let m = 1; m <= (95 - idadeAtual) * 12; m++) {
        if (valorFuturo(pv, pmt, i, m) >= necessario) {
          idadeIndependencia = Math.ceil(idadeAtual + m / 12);
          break;
        }
      }
  }

  const f = Math.pow(1 + i, n);
  const aporteBruto = i === 0 ? (necessario - pv) / n : ((necessario - pv * f) * i) / (f - 1);
  const aporteNecessario = Math.max(0, aporteBruto);

  return {
    idadeAtual,
    idadeAposentar,
    anos,
    necessario,
    projetado,
    rendaProjetada,
    totalAportado: pv + pmt * n,
    percentualMeta: necessario > 0 ? Math.min(100, (projetado / necessario) * 100) : 0,
    atingiu,
    idadeIndependencia,
    aporteNecessario,
    aporteFaltante: Math.max(0, aporteNecessario - pmt),
    serie: Array.from({ length: anos + 1 }, (_, a) => ({ idade: idadeAtual + a, patrimonio: valorFuturo(pv, pmt, i, a * 12) })),
  };
}
