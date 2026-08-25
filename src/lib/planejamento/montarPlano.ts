/**
 * O adaptador entre a ficha do cliente e o motor de plano de vida.
 *
 * As tabelas guardam o retrato financeiro em linhas soltas (uma por renda, uma
 * por despesa, uma por dívida). O `lifeplan.ts` espera um objeto único, com
 * outros nomes e outras unidades. Esta é a única peça que conhece os dois lados
 * — e por isso é onde as premissas do produto ficam explícitas.
 */

import { emergencyReserveBase } from "./finance";
import type { Debt, Goal, LifePlanInput, Seguro } from "./lifeplan";
import type { Retrato } from "./cliente";

/**
 * Rentabilidade real esperada, já descontada a inflação.
 *
 * 5% é o mesmo número que a página de venda promete e que a Novare defende
 * publicamente: prometer 12% acima da inflação seria vender ilusão. Mexer aqui
 * sem mexer lá cria duas verdades sobre o mesmo produto.
 */
export const RENT_REAL_ANUAL_PCT = 5;

/** Meta de inflação do Banco Central — o IR incide sobre o ganho nominal. */
export const INFLACAO_PCT = 3;

/** Idade final da projeção. */
export const IDADE_FIM = 90;

/** Quantos meses de custo a reserva de emergência precisa cobrir. */
export const RESERVA_MESES = 6;

const anos = (nascimento: string | null | undefined, hoje = new Date()): number => {
  if (!nascimento) return 35; // padrão neutro quando a data ainda não foi informada
  const d = new Date(nascimento);
  if (Number.isNaN(d.getTime())) return 35;
  let idade = hoje.getFullYear() - d.getFullYear();
  const passouAniversario =
    hoje.getMonth() > d.getMonth() ||
    (hoje.getMonth() === d.getMonth() && hoje.getDate() >= d.getDate());
  if (!passouAniversario) idade -= 1;
  return Math.min(90, Math.max(18, idade));
};

/** Um objetivo do banco vira uma meta do motor. */
function objetivoParaGoal(
  o: Retrato["objetivos"][number],
  indice: number,
  anoAtual: number,
): Goal {
  const ano = o.deadline ? new Date(o.deadline).getFullYear() : undefined;
  return {
    id: indice + 1,
    tipo: "outro",
    nome: o.description,
    valor: o.target_amount ?? 0,
    ano: ano && ano >= anoAtual ? ano : undefined,
    recorrente: false,
  };
}

/**
 * Uma dívida do banco vira uma dívida do motor.
 *
 * O banco guarda juros ao MÊS (é como o brasileiro vê a parcela); o motor pede
 * ao ANO. A conversão é composta, não multiplicada por 12 — a diferença entre
 * as duas, em 2% ao mês, é de 24% para 27% ao ano.
 */
function dividaParaDebt(d: Retrato["dividas"][number], indice: number): Debt {
  const jurosMes = (d.interest_rate ?? 0) / 100;
  const jurosAa = jurosMes > 0 ? (Math.pow(1 + jurosMes, 12) - 1) * 100 : 0;
  return {
    id: indice + 1,
    nome: d.type,
    saldo: d.total_amount ?? 0,
    parcelas: d.remaining_months ?? 0,
    jurosAa,
  };
}

function seguroParaSeguro(s: Retrato["seguros"][number], indice: number): Seguro {
  return {
    id: indice + 1,
    nome: s.type,
    valor: s.monthly_premium ?? 0,
    periodicidade: "mensal",
  };
}

export interface Premissas {
  /** Com quantos anos a pessoa quer parar de depender do trabalho. */
  idadeAposentadoria: number;
  /** Quanto quer receber por mês, em valores de hoje. */
  rendaDesejada: number;
  /** Quanto já está garantido pelo INSS/previdência. */
  rendaINSS: number;
}

/**
 * Premissas de partida quando o cliente ainda não escolheu as dele.
 *
 * A renda desejada nasce igual ao custo de vida atual: manter o padrão é o que
 * quase todo mundo responde quando perguntado, e é um ponto de partida honesto.
 */
export function premissasPadrao(
  idadeAtual: number,
  custoMensal: number,
): Premissas {
  return {
    idadeAposentadoria: Math.max(idadeAtual + 5, 60),
    rendaDesejada: Math.round(custoMensal) || 5000,
    rendaINSS: 0,
  };
}

export function montarEntrada(
  retrato: Retrato,
  dadosPessoais: { nascimento: string | null },
  premissas?: Partial<Premissas>,
  hoje = new Date(),
): LifePlanInput {
  const anoAtual = hoje.getFullYear();
  const idadeAtual = anos(dadosPessoais.nascimento, hoje);

  const rendaMensal = retrato.rendas.reduce(
    (soma, r) => soma + (r.frequency === "anual" ? (r.amount ?? 0) / 12 : r.amount ?? 0),
    0,
  );
  const custoFixoMensal = retrato.despesas.reduce((soma, d) => soma + (d.amount ?? 0), 0);

  // Patrimônio investido: o que rende. Imóvel próprio e carro entram como
  // imobilizado — contam no patrimônio líquido, mas não financiam aposentadoria.
  const liquidos = new Set(["Reserva de emergência", "Conta corrente", "Investimento"]);
  const patrimonioAtual = retrato.patrimonio
    .filter((p) => liquidos.has(p.type))
    .reduce((soma, p) => soma + (p.estimated_value ?? 0), 0);
  const ativosImobilizados = retrato.patrimonio
    .filter((p) => !liquidos.has(p.type))
    .reduce((soma, p) => soma + (p.estimated_value ?? 0), 0);

  const padrao = premissasPadrao(idadeAtual, custoFixoMensal);

  return {
    anoAtual,
    idadeAtual,
    idadeAposentadoria: premissas?.idadeAposentadoria ?? padrao.idadeAposentadoria,
    idadeFim: IDADE_FIM,
    rendaMensal,
    custoFixoMensal,
    patrimonioAtual,
    ativosImobilizados,
    rentRealPct: RENT_REAL_ANUAL_PCT,
    inflacaoPct: INFLACAO_PCT,
    rendaAposDesejada: premissas?.rendaDesejada ?? padrao.rendaDesejada,
    rendaINSS: premissas?.rendaINSS ?? padrao.rendaINSS,
    goals: retrato.objetivos.map((o, i) => objetivoParaGoal(o, i, anoAtual)),
    custoCategorias: retrato.despesas.map((d) => ({
      nome: d.category,
      valor: d.amount ?? 0,
    })),
    dividas: retrato.dividas.map(dividaParaDebt),
    seguros: retrato.seguros.map(seguroParaSeguro),
    reservaMeses: RESERVA_MESES,
    reservaAtual: emergencyReserveBase(
      retrato.patrimonio.map((p) => ({
        type: p.type,
        description: p.description,
        estimated_value: p.estimated_value,
      })),
    ),
  };
}
