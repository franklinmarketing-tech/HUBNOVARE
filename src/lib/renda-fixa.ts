/**
 * SIMULADOR DE RENDA FIXA / CDI (27/10/2026) — o "Simulador CDI" do catálogo apontava para
 * novareapp.com.br/ferramentas/simulador-de-renda-fixa, que dá 404. Refeito no Hub.
 *
 * Diferente do antigo: o CDI vem do Banco Central (não "CDI ≈ Selic"), o IR conta DIAS corridos
 * (Lei 11.033/2004, não meses de 30 dias) e não há taxa "típica" por produto — a comparação é a
 * MESMA taxa com e sem IR, mais a poupança pela regra oficial. Não recomenda produto.
 */

export type TipoTaxa = "cdi" | "prefixado" | "ipca" | "selic";

export type IndicesHoje = {
  /** CDI anualizado, % a.a. */
  cdi: number;
  /** Selic meta, % a.a. */
  selic: number;
  /** IPCA dos últimos 12 meses, %. */
  ipca12: number;
  /** Rendimento da poupança no último mês, % a.m. (BCB série 195). */
  poupancaMes: number;
};

/** Taxa anual efetiva da aplicação, em %, conforme o tipo de rentabilidade. */
export function taxaAnualPct(tipo: TipoTaxa, taxa: number, idx: IndicesHoje): number {
  switch (tipo) {
    case "prefixado":
      return taxa;
    case "cdi":
      return (idx.cdi * taxa) / 100;
    case "ipca":
      // supõe a inflação dos próximos meses igual à dos últimos 12 — a tela avisa
      return ((1 + idx.ipca12 / 100) * (1 + taxa / 100) - 1) * 100;
    case "selic":
      return ((1 + idx.selic / 100) * (1 + taxa / 100) - 1) * 100;
  }
}

/** IR regressivo pelos DIAS corridos do prazo (meses × 365/12). */
export function aliquotaIr(meses: number): number {
  const dias = meses * (365 / 12);
  if (dias <= 180) return 22.5;
  if (dias <= 360) return 20;
  if (dias <= 720) return 17.5;
  return 15;
}

const mensal = (anualPct: number) => (anualPct <= -100 ? 0 : Math.pow(1 + anualPct / 100, 1 / 12) - 1);
const positivo = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function valorFuturo(pv: number, pmt: number, i: number, meses: number): number {
  if (meses <= 0) return pv;
  if (i === 0) return pv + pmt * meses;
  const f = Math.pow(1 + i, meses);
  return pv * f + pmt * ((f - 1) / i);
}

export type ResultadoRendaFixa = {
  meses: number;
  investido: number;
  bruto: number;
  rendimentoBruto: number;
  aliquota: number;
  ir: number;
  liquido: number;
  rendimentoLiquido: number;
};

/**
 * ⚠️ Simplificação conhecida: o IR usa a alíquota do prazo TOTAL para o rendimento inteiro; os
 * aportes dos últimos meses ficaram menos tempo e pagariam alíquota um pouco maior (a tela avisa).
 */
export function simular(inicial: number, aporte: number, meses: number, anualPct: number, isento: boolean): ResultadoRendaFixa {
  const n = Math.max(1, Math.min(600, Math.round(meses) || 1));
  const pv = positivo(inicial);
  const pmt = positivo(aporte);
  const investido = pv + pmt * n;
  const bruto = valorFuturo(pv, pmt, mensal(anualPct), n);
  const rendimentoBruto = bruto - investido;
  const aliquota = isento ? 0 : aliquotaIr(n);
  const ir = Math.max(0, rendimentoBruto) * (aliquota / 100);
  return { meses: n, investido, bruto, rendimentoBruto, aliquota, ir, liquido: bruto - ir, rendimentoLiquido: rendimentoBruto - ir };
}

/** Poupança: o rendimento do último mês repetido no prazo (isenta de IR). */
export function simularPoupanca(inicial: number, aporte: number, meses: number, poupancaMesPct: number): ResultadoRendaFixa {
  const anual = (Math.pow(1 + poupancaMesPct / 100, 12) - 1) * 100;
  return simular(inicial, aporte, meses, anual, true);
}

/** A taxa que um investimento COM IR precisa pagar para empatar com um isento (no mesmo prazo). */
export function equivalenteTributado(taxaIsenta: number, meses: number): number {
  return taxaIsenta / (1 - aliquotaIr(meses) / 100);
}
