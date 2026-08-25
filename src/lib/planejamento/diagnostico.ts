/**
 * O diagnóstico — os números que saem do retrato financeiro.
 *
 * Extraído de `novareapp/src/pages/admin/ClientDiagnosis.tsx:280-341`, onde a
 * conta vivia dentro de um `useEffect` de uma página ADMIN. Era o motivo pelo
 * qual o diagnóstico "só existia depois que o consultor abria a aba": a linha
 * em `diagnosis` nascia como efeito colateral de alguém navegar até lá.
 *
 * Aqui é uma função pura. Quem chama e quando é decisão da tela.
 */

/**
 * Só aritmética: nada de rótulo, nada de emoji. O nome bonito de cada categoria
 * é decoração, e decoração é da tela — deixá-la aqui obrigaria o motor a
 * conhecer a UI.
 *
 * O único import é de TIPO, e isso é intencional: `import type` some na
 * compilação, então este arquivo roda sem resolver dependência nenhuma — é o
 * que permite testá-lo direto no Node, sem bundler.
 */
import type { ClassificacaoRisco } from "./catalogos";

export type { ClassificacaoRisco };

export interface LinhaRenda {
  description: string;
  amount: number | null;
  frequency: string;
}
export interface LinhaDespesa {
  category: string;
  amount: number | null;
}
export interface LinhaDivida {
  type: string;
  creditor?: string | null;
  total_amount: number | null;
  monthly_payment: number | null;
  interest_rate?: number | null;
}
export interface LinhaPatrimonio {
  type: string;
  description?: string | null;
  estimated_value: number | null;
}

export interface Diagnostico {
  rendaMensal: number;
  despesaMensal: number;
  dividaTotal: number;
  parcelasMensais: number;
  patrimonioTotal: number;
  /** Quanto sobra por mês depois de tudo. Pode ser negativo. */
  sobraMensal: number;
  /** Sobra em % da renda. */
  taxaPoupanca: number;
  /** Parcelas de dívida em % da renda. */
  comprometimentoDividas: number;
  /** Despesas em % da renda. */
  comprometimentoDespesas: number;
  risco: ClassificacaoRisco;
  patrimonioLiquido: number;
  /** Ordenadas da maior para a menor. `categoria` é o slug gravado no banco. */
  despesasPorCategoria: { categoria: string; valor: number; fatia: number }[];
}

/**
 * Renda anual é dividida por 12 para virar comparável com a despesa mensal.
 * Renda "eventual" entra pelo valor cheio — é a regra do app original, mantida
 * para os dois produtos darem o mesmo número sobre os mesmos dados.
 */
const mensalizar = (valor: number, frequencia: string) =>
  frequencia === "anual" ? valor / 12 : valor;

/**
 * A nota de risco sai da taxa de poupança, e só dela.
 * A ≥30% · B ≥10% · C ≥0% · D ≥-10% · E abaixo disso.
 */
export function classificarRisco(taxaPoupanca: number): ClassificacaoRisco {
  if (taxaPoupanca >= 30) return "A";
  if (taxaPoupanca >= 10) return "B";
  if (taxaPoupanca >= 0) return "C";
  if (taxaPoupanca >= -10) return "D";
  return "E";
}

export function calcularDiagnostico(dados: {
  rendas: LinhaRenda[];
  despesas: LinhaDespesa[];
  dividas: LinhaDivida[];
  patrimonio: LinhaPatrimonio[];
}): Diagnostico {
  const { rendas, despesas, dividas, patrimonio } = dados;

  const rendaMensal = rendas.reduce(
    (soma, r) => soma + mensalizar(r.amount ?? 0, r.frequency),
    0,
  );
  const despesaMensal = despesas.reduce((soma, d) => soma + (d.amount ?? 0), 0);
  const dividaTotal = dividas.reduce((soma, d) => soma + (d.total_amount ?? 0), 0);
  const parcelasMensais = dividas.reduce(
    (soma, d) => soma + (d.monthly_payment ?? 0),
    0,
  );
  const patrimonioTotal = patrimonio.reduce(
    (soma, p) => soma + (p.estimated_value ?? 0),
    0,
  );

  const sobraMensal = rendaMensal - despesaMensal - parcelasMensais;
  const pctDaRenda = (v: number) => (rendaMensal > 0 ? (v / rendaMensal) * 100 : 0);

  const porCategoria = new Map<string, number>();
  for (const d of despesas) {
    porCategoria.set(d.category, (porCategoria.get(d.category) ?? 0) + (d.amount ?? 0));
  }

  const despesasPorCategoria = [...porCategoria.entries()]
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      fatia: despesaMensal > 0 ? Math.round((valor / despesaMensal) * 100) : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  const taxaPoupanca = pctDaRenda(sobraMensal);

  return {
    rendaMensal,
    despesaMensal,
    dividaTotal,
    parcelasMensais,
    patrimonioTotal,
    sobraMensal,
    taxaPoupanca,
    comprometimentoDividas: pctDaRenda(parcelasMensais),
    comprometimentoDespesas: pctDaRenda(despesaMensal),
    risco: classificarRisco(taxaPoupanca),
    patrimonioLiquido: patrimonioTotal - dividaTotal,
    despesasPorCategoria,
  };
}

/** O payload exato que a tabela `diagnosis` espera. */
export function paraTabelaDiagnosis(
  clientId: string,
  monthRef: string,
  d: Diagnostico,
) {
  return {
    client_id: clientId,
    month_ref: monthRef,
    total_income: d.rendaMensal,
    total_expenses: d.despesaMensal,
    total_debts: d.dividaTotal,
    total_assets: d.patrimonioTotal,
    savings_capacity: d.taxaPoupanca,
    debt_ratio: d.comprometimentoDividas,
    risk_classification: d.risco,
  };
}

export const NOTA_RISCO: Record<
  ClassificacaoRisco,
  { rotulo: string; recado: string; tom: "bom" | "atencao" | "ruim" }
> = {
  A: {
    rotulo: "Excelente",
    recado: "Você guarda mais de 30% do que ganha. É posição de quem escolhe, não de quem corre atrás.",
    tom: "bom",
  },
  B: {
    rotulo: "Boa",
    recado: "Sobra dinheiro todo mês. Dá para acelerar aumentando um pouco o aporte.",
    tom: "bom",
  },
  C: {
    rotulo: "Apertada",
    recado: "Fecha no zero a zero. Qualquer imprevisto vira dívida — a reserva é a prioridade.",
    tom: "atencao",
  },
  D: {
    rotulo: "Negativa",
    recado: "Sai mais do que entra. Antes de investir, é preciso fechar essa torneira.",
    tom: "ruim",
  },
  E: {
    rotulo: "Crítica",
    recado: "O rombo mensal é grande. O plano começa por cortar despesa e renegociar dívida.",
    tom: "ruim",
  },
};
