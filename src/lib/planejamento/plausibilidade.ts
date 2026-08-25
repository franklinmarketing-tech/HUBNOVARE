/**
 * A conferência que o consultor fazia com o olho.
 *
 * Num produto assistido, alguém olhava a ficha e dizia "renda de R$ 3.000 com
 * despesa de R$ 42.000? você digitou errado". Sem consultor, ninguém percebe —
 * e o plano inteiro sai errado a partir de um zero a mais.
 *
 * Estes avisos NÃO bloqueiam. Perguntam. O número esquisito às vezes é o número
 * certo (quem recebeu rescisão, quem está entre empregos), e travar a pessoa
 * seria pior do que confiar nela.
 */

export type Aviso = {
  campo: "renda" | "despesas" | "dividas" | "patrimonio";
  texto: string;
  gravidade: "erro-provavel" | "confira";
};

export function conferir(dados: {
  rendaMensal: number;
  despesaMensal: number;
  parcelasMensais: number;
  patrimonioTotal: number;
  dividaTotal: number;
}): Aviso[] {
  const { rendaMensal, despesaMensal, parcelasMensais, patrimonioTotal, dividaTotal } =
    dados;
  const avisos: Aviso[] = [];

  if (rendaMensal <= 0) {
    avisos.push({
      campo: "renda",
      texto: "Você ainda não lançou nenhuma renda. Sem ela não dá para calcular quase nada.",
      gravidade: "erro-provavel",
    });
  }

  // Um zero a mais é o erro de digitação mais comum, e some no meio de uma
  // lista longa. 10x a renda é o limiar em que deixa de ser plausível.
  if (rendaMensal > 0 && despesaMensal > rendaMensal * 10) {
    avisos.push({
      campo: "despesas",
      texto:
        "Suas despesas somam mais de dez vezes a renda. Costuma ser um zero a mais em algum lançamento — vale conferir.",
      gravidade: "erro-provavel",
    });
  } else if (rendaMensal > 0 && despesaMensal > rendaMensal * 3) {
    avisos.push({
      campo: "despesas",
      texto:
        "As despesas passam de três vezes a renda. Se estiver certo, é o ponto mais urgente do seu plano.",
      gravidade: "confira",
    });
  }

  if (rendaMensal > 0 && parcelasMensais > rendaMensal * 0.6) {
    avisos.push({
      campo: "dividas",
      texto:
        "As parcelas de dívida comprometem mais de 60% da sua renda. Renegociar vem antes de investir.",
      gravidade: "confira",
    });
  }

  if (rendaMensal > 0 && despesaMensal === 0) {
    avisos.push({
      campo: "despesas",
      texto: "Nenhuma despesa lançada. Mesmo quem gasta pouco tem moradia e alimentação.",
      gravidade: "confira",
    });
  }

  if (dividaTotal > 0 && patrimonioTotal === 0) {
    avisos.push({
      campo: "patrimonio",
      texto:
        "Você lançou dívidas mas nenhum bem. Se financiou um imóvel ou carro, ele também entra no patrimônio.",
      gravidade: "confira",
    });
  }

  return avisos;
}
