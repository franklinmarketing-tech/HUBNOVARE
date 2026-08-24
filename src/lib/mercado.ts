import { cache } from "react";

/**
 * Dados de mercado ao vivo.
 *
 * Fonte: séries do SGS do Banco Central — pública, sem chave de API.
 * Buscado no servidor (Server Component) e cacheado por 6h: o BCB atualiza
 * no máximo uma vez por dia, então não há motivo para bater a cada request.
 *
 * Se o BCB estiver fora do ar, cai no último valor conhecido em vez de
 * quebrar a página — indicador errado é pior que indicador ausente, por isso
 * o fallback vem marcado com `aoVivo: false`.
 */

const SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

type SerieBcb = { data: string; valor: string };

export type Indicador = {
  chave: string;
  rotulo: string;
  valor: number;
  /** Como formatar: percentual ao ano, percentual, ou moeda. */
  formato: "aa" | "pct" | "brl";
  nota: string;
  aoVivo: boolean;
};

/** Últimos valores conhecidos — usados só quando a API falha. */
const FALLBACK: Record<string, number> = {
  selic: 14.0,
  cdi: 14.15,
  ipca12: 4.64,
  poupanca: 0.67,
  dolar: 5.1,
};

async function serie(id: number, n = 1): Promise<number | null> {
  try {
    const res = await fetch(`${SGS}.${id}/dados/ultimos/${n}?formato=json`, {
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!res.ok) return null;

    const dados = (await res.json()) as SerieBcb[];
    const ultimo = dados.at(-1);
    if (!ultimo) return null;

    const valor = Number(ultimo.valor.replace(",", "."));
    return Number.isFinite(valor) ? valor : null;
  } catch {
    return null;
  }
}

function montar(
  chave: string,
  rotulo: string,
  valor: number | null,
  formato: Indicador["formato"],
  nota: string,
): Indicador {
  return {
    chave,
    rotulo,
    valor: valor ?? FALLBACK[chave],
    formato,
    nota,
    aoVivo: valor !== null,
  };
}

/**
 * Os indicadores da requisição atual.
 *
 * Envolvido em `cache()` de propósito. O Next renderiza a página mais de
 * uma vez por requisição (o HTML e o payload que hidrata), e `serie()`
 * devolve `null` quando a chamada ao Banco Central falha. Bastava uma das
 * duas renderizações pegar a falha para o cabeçalho mostrar o indicador
 * num lado e omitir no outro — e o React acusava erro de hidratação
 * (#418) de forma intermitente em /iris e /consultoria.
 *
 * Com o cache por requisição, as duas renderizações enxergam exatamente o
 * mesmo número, com falha ou sem falha.
 */
export const getIndicadores = cache(async function getIndicadores(): Promise<
  Indicador[]
> {
  // Em paralelo: são 5 chamadas independentes, não faz sentido enfileirar.
  const [selic, cdi, ipca12, poupanca, dolar] = await Promise.all([
    serie(432),
    // 4389 = CDI já anualizado (base 252). NÃO usar a 4391: ela é o acumulado
    // do mês e no começo do mês devolve um valor parcial, que anualizado dá
    // uma taxa absurdamente baixa.
    serie(4389),
    serie(13522),
    serie(25),
    serie(10813),
  ]);

  return [
    montar("selic", "Selic", selic, "aa", "meta do Copom"),
    montar("cdi", "CDI", cdi, "aa", "taxa ao ano"),
    montar("ipca12", "IPCA", ipca12, "pct", "acumulado 12 meses"),
    montar("poupanca", "Poupança", poupanca, "pct", "no mês"),
    montar("dolar", "Dólar", dolar, "brl", "compra, PTAX"),
  ];
});

/** Juro real pela fórmula de Fisher — o que sobra depois da inflação. */
export function juroReal(selic: number, ipca12: number): number {
  return ((1 + selic / 100) / (1 + ipca12 / 100) - 1) * 100;
}

export function formatarIndicador(ind: Indicador): string {
  if (ind.formato === "brl") {
    return ind.valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  const num = ind.valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return ind.formato === "aa" ? `${num}% a.a.` : `${num}%`;
}
