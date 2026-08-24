/**
 * Índices oficiais do Banco Central (séries do SGS), para corrigir valores
 * no tempo. É a mesma fonte da Calculadora do Cidadão do BC, buscada por
 * período e acumulada mês a mês.
 *
 * REGRA DE OURO: índices mensais se acumulam por PRODUTO, nunca por soma.
 * Somar 12 meses de IPCA dá um número diferente (e menor) do que o país
 * de fato sentiu no bolso.
 */

const SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

export type ChaveIndice = "ipca" | "igpm" | "inpc" | "poupanca" | "tr";

export const INDICES: Record<
  ChaveIndice,
  { serie: number; nome: string; usoTipico: string }
> = {
  ipca: {
    serie: 433,
    nome: "IPCA",
    usoTipico: "A inflação oficial do Brasil. Padrão para corrigir salários e contratos.",
  },
  igpm: {
    serie: 189,
    nome: "IGP-M",
    usoTipico: "O índice do aluguel. A maioria dos contratos de locação usa ele.",
  },
  inpc: {
    serie: 188,
    nome: "INPC",
    usoTipico: "Inflação das famílias de renda mais baixa. Comum em acordos trabalhistas.",
  },
  // Séries 196 e 7811, não 25 e 226: estas últimas são DIÁRIAS (uma linha
  // por data de aniversário) e trariam milhares de registros por consulta,
  // além de exigir filtrar o dia certo. As mensais dizem a mesma coisa.
  // A da poupança só começa em maio/2012, quando a regra nova entrou.
  poupanca: {
    serie: 196,
    nome: "Poupança",
    usoTipico: "Quanto renderia se o dinheiro tivesse ficado na poupança.",
  },
  tr: {
    serie: 7811,
    nome: "TR",
    usoTipico: "Taxa Referencial. Corrige FGTS e alguns contratos antigos.",
  },
};

export type Ponto = { data: string; valor: number };

export type ResultadoCorrecao = {
  /** Fator acumulado do período (1,25 = 25% de correção). */
  fator: number;
  /** Variação acumulada em %. */
  variacaoPct: number;
  /** Meses efetivamente usados no cálculo. */
  meses: number;
  /** Série mês a mês, para o gráfico. */
  pontos: Ponto[];
  /** Primeiro e último mês encontrados, no formato mm/aaaa. */
  de: string | null;
  ate: string | null;
};

function paraBr(dataIso: string): string {
  const [ano, mes] = dataIso.split("-");
  return `01/${mes}/${ano}`;
}

/**
 * Busca a série no BCB e acumula o período.
 * Cache de 12h: índice mensal não muda durante o dia.
 */
export async function acumularIndice(
  chave: ChaveIndice,
  inicioIso: string,
  fimIso: string,
): Promise<ResultadoCorrecao> {
  const vazio: ResultadoCorrecao = {
    fator: 1,
    variacaoPct: 0,
    meses: 0,
    pontos: [],
    de: null,
    ate: null,
  };

  const { serie } = INDICES[chave];
  const url =
    `${SGS}.${serie}/dados?formato=json` +
    `&dataInicial=${paraBr(inicioIso)}&dataFinal=${paraBr(fimIso)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });
    // Período fora da série devolve 404: não é falha, é ausência de dado.
    if (!res.ok) return vazio;

    const dados = await res.json();
    if (!Array.isArray(dados) || dados.length === 0) return vazio;

    let fator = 1;
    const pontos: Ponto[] = [];

    for (const linha of dados as Array<{ data: string; valor: string }>) {
      const valor = Number(String(linha.valor).replace(",", "."));
      if (!Number.isFinite(valor)) continue;
      // Produto dos fatores mensais: (1 + i1)(1 + i2)...
      fator *= 1 + valor / 100;
      pontos.push({ data: linha.data.slice(3), valor });
    }

    if (pontos.length === 0) return vazio;

    return {
      fator,
      variacaoPct: (fator - 1) * 100,
      meses: pontos.length,
      pontos,
      de: pontos[0].data,
      ate: pontos[pontos.length - 1].data,
    };
  } catch {
    // BCB fora do ar: a página avisa em vez de mostrar número errado.
    return vazio;
  }
}

