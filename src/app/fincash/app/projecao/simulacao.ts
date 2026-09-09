/**
 * As hipóteses da tela de projeção — o "e se" que não toca no banco.
 *
 * POR QUE ISTO NÃO ENTRA NO MOTOR
 * `projetarMeses` responde uma pergunta só: como o dinheiro anda se nada
 * mudar. A hipótese é o contrário disso — é a pessoa mexendo em algo que ainda
 * não existe. Enfiá-la lá dentro obrigaria o motor a aceitar lançamento
 * inventado, e a partir daí nenhuma outra tela poderia mais confiar que o que
 * sai dele é o que está gravado.
 *
 * POR QUE A CASCATA DO SALDO É REFEITA AQUI
 * Porque a alternativa era pior. Dava para injetar a hipótese como recorrência
 * ou lançamento sintético e deixar o motor recalcular — mas aí "cortar R$ 400
 * de delivery" teria de virar uma RECEITA de R$ 400 (o motor só soma), e a
 * auditoria do mês passaria a mostrar uma entrada que não existe. Projeção que
 * não se explica não é confiável, e o preço de manter a explicação honesta são
 * as quatro linhas de `saldo += resultado` repetidas no fim deste arquivo.
 * A fórmula é a mesma do motor de propósito; se ela mudar lá, muda aqui.
 *
 * NADA AQUI É GRAVADO. Não há `createClient` neste arquivo, e isso é a
 * garantia — não uma promessa na tela.
 */

import type { PontoProjecao } from "@/lib/fincash/modelo";

export type TipoHipotese = "corte" | "receita" | "gasto";

export type Hipotese = {
  id: string;
  tipo: TipoHipotese;
  descricao: string;
  /** Sempre positivo — a regra do sinal da casa vale aqui também. Por mês. */
  valor: number;
  /** ref do primeiro mês em que vale. */
  de: string;
  /** ref do último mês, ou null para "até o fim da janela". */
  ate: string | null;
  ativa: boolean;
};

export const TIPOS: {
  chave: TipoHipotese;
  rotulo: string;
  ajuda: string;
  sinal: string;
}[] = [
  {
    chave: "corte",
    rotulo: "Cortar um gasto",
    ajuda: "Sai menos todo mês — delivery, assinatura, um hábito.",
    sinal: "−",
  },
  {
    chave: "receita",
    rotulo: "Entrar uma renda",
    ajuda: "Um freela fixo, um aluguel, um aumento.",
    sinal: "+",
  },
  {
    chave: "gasto",
    rotulo: "Assumir um gasto",
    ajuda: "Uma parcela nova, uma escola, um plano.",
    sinal: "+",
  },
];

/** Um mês está dentro da vigência da hipótese? */
export function vigente(h: Hipotese, ref: string) {
  return h.ativa && ref >= h.de && (h.ate === null || ref <= h.ate);
}

export type PontoSimulado = PontoProjecao & {
  /** O mesmo mês SEM hipótese nenhuma. É por ele que a auditoria explica o
      número real, e é dele que sai a comparação "com × sem a simulação". */
  base: PontoProjecao;
  /** Receita simulada que entrou no mês. */
  simEntradas: number;
  /** Gasto simulado menos corte aplicado. Negativo = a simulação fez sair menos. */
  simSaidas: number;
  /** Corte que não coube: o mês não tinha tanto para cortar. */
  cortePerdido: number;
};

/** Nenhuma hipótese: o ponto simulado É o ponto real. Existe para a tela ter
    um caminho de render só, em vez de dois. */
const semSimulacao = (p: PontoProjecao): PontoSimulado => ({
  ...p,
  base: p,
  simEntradas: 0,
  simSaidas: 0,
  cortePerdido: 0,
});

/**
 * A projeção com as hipóteses aplicadas por cima.
 *
 * ONDE O CORTE MORDE, e a ordem não é arbitrária: primeiro nas despesas da
 * conta, depois na fatura do cartão, e só então no aporte de meta. É a ordem em
 * que a vida real corta — ninguém deixa de guardar para a reserva antes de
 * parar de pedir comida. Cortar do aporte primeiro faria a simulação parecer
 * boa às custas do futuro da pessoa, que é o oposto do que este app serve.
 *
 * O QUE NÃO CABE, NÃO CORTA: pedir para cortar R$ 800 de um mês que só gasta
 * R$ 300 devolveria saldo inventado. O excedente vira `cortePerdido` e a tela
 * avisa — preferir o silêncio à falsa precisão vale aqui como vale no orçamento.
 */
export function aplicarHipoteses(
  base: PontoProjecao[],
  hipoteses: Hipotese[],
  saldoInicial: number,
): PontoSimulado[] {
  const ativas = hipoteses.filter((h) => h.ativa && h.valor > 0);
  if (ativas.length === 0) return base.map(semSimulacao);

  let saldo = saldoInicial;

  return base.map((p) => {
    let receita = 0;
    let gasto = 0;
    let corte = 0;

    for (const h of ativas) {
      if (!vigente(h, p.ref)) continue;
      if (h.tipo === "receita") receita += h.valor;
      else if (h.tipo === "gasto") gasto += h.valor;
      else corte += h.valor;
    }

    const corteSaidas = Math.min(corte, p.saidas);
    const restoApos1 = corte - corteSaidas;
    const corteFaturas = Math.min(restoApos1, p.faturas);
    const restoApos2 = restoApos1 - corteFaturas;
    const corteAportes = Math.min(restoApos2, p.aportes);
    const cortePerdido = restoApos2 - corteAportes;
    const corteAplicado = corteSaidas + corteFaturas + corteAportes;

    const entradas = p.entradas + receita;
    const saidas = p.saidas - corteSaidas + gasto;
    const faturas = p.faturas - corteFaturas;
    const aportes = p.aportes - corteAportes;

    const resultado = entradas - saidas - faturas - aportes;
    const saldoInicio = saldo;
    saldo += resultado;

    return {
      ref: p.ref,
      entradas,
      saidas,
      faturas,
      aportes,
      resultado,
      saldoInicio,
      saldoFim: saldo,
      /* A ORIGEM É A DO BASE, sempre: ela conta quantos lançamentos e quantas
         ocorrências de conta fixa existem DE VERDADE naquele mês. Somar a
         hipótese aqui faria a tela dizer que a pessoa tem uma conta fixa que
         ela acabou de imaginar. */
      origem: p.origem,
      base: p,
      simEntradas: receita,
      simSaidas: gasto - corteAplicado,
      cortePerdido,
    };
  });
}

/** Um id de sessão. Não vai para o banco — só distingue as linhas da lista. */
export const novoId = () =>
  `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
