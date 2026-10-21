import { cache } from "react";

/**
 * OS ÍNDICES DE BOLSA da faixa de indicadores (pedido do dono, 21/10/2026, no
 * molde do TradeMap): Ibovespa, IBrX 50, Dow Jones, S&P 500, Nasdaq,
 * Russell 2000, VIX, S&P/TSX, IPC México e DAX.
 *
 * Fonte: o gráfico público do Yahoo Finance (sem chave). Pede os últimos 5
 * pregões e calcula a variação pelos DOIS ÚLTIMOS FECHAMENTOS — o
 * `chartPreviousClose` da resposta é o fechamento de antes do intervalo
 * inteiro, não do dia anterior, e daria variação de 5 dias.
 *
 * Cache de 15 min. Índice que não responder some da faixa em vez de mostrar
 * número velho.
 */
export type IndiceBolsa = {
  simbolo: string;
  nome: string;
  /** Sigla do país (emoji de bandeira não aparece no Windows). */
  pais: string;
  ultimo: number;
  variacao: number;
  variacaoPct: number;
  maxima: number | null;
  minima: number | null;
  /** dd/mm do último pregão */
  data: string;
};

const LISTA: { simbolo: string; nome: string; pais: string }[] = [
  { simbolo: "^BVSP", nome: "Ibovespa", pais: "BR" },
  { simbolo: "^IBX50", nome: "IBrX 50", pais: "BR" },
  { simbolo: "^DJI", nome: "Dow Jones", pais: "EUA" },
  { simbolo: "^GSPC", nome: "S&P 500", pais: "EUA" },
  { simbolo: "^IXIC", nome: "Nasdaq", pais: "EUA" },
  { simbolo: "^RUT", nome: "Russell 2000", pais: "EUA" },
  { simbolo: "^VIX", nome: "S&P 500 VIX", pais: "EUA" },
  { simbolo: "^GSPTSE", nome: "S&P/TSX", pais: "CAN" },
  { simbolo: "^MXX", nome: "S&P/BMV IPC", pais: "MÉX" },
  { simbolo: "^GDAXI", nome: "DAX", pais: "ALE" },
];

type Resposta = {
  chart?: {
    result?: {
      meta: { regularMarketPrice?: number; regularMarketTime?: number };
      indicators: { quote: { close: (number | null)[]; high: (number | null)[]; low: (number | null)[] }[] };
    }[];
  };
};

async function um(item: (typeof LISTA)[number]): Promise<IndiceBolsa | null> {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.simbolo)}?range=5d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 * 15 } },
    );
    if (!r.ok) return null;
    const res = ((await r.json()) as Resposta).chart?.result?.[0];
    if (!res) return null;
    const q = res.indicators.quote[0];
    const fech = q.close.filter((v): v is number => typeof v === "number" && v > 0);
    if (fech.length < 2) return null;
    const ultimo = res.meta.regularMarketPrice ?? fech[fech.length - 1];
    const anterior = fech[fech.length - 2];
    // Máxima/mínima do ÚLTIMO pregão com fechamento (o dia em curso pode vir nulo).
    let k = q.close.length - 1;
    while (k > 0 && !(typeof q.close[k] === "number" && (q.close[k] as number) > 0)) k--;
    const alta = q.high[k];
    const baixa = q.low[k];
    const quando = new Date((res.meta.regularMarketTime ?? Date.now() / 1000) * 1000);
    return {
      ...item,
      ultimo,
      variacao: ultimo - anterior,
      variacaoPct: (ultimo / anterior - 1) * 100,
      // O Yahoo devolve 0 em alguns índices (Ibovespa, IPC) — vira "sem dado".
      maxima: alta && alta > 0 ? alta : null,
      minima: baixa && baixa > 0 ? baixa : null,
      data: quando.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }),
    };
  } catch {
    return null;
  }
}

export const getIndicesBolsa = cache(async (): Promise<IndiceBolsa[]> => {
  const todos = await Promise.all(LISTA.map(um));
  return todos.filter((x): x is IndiceBolsa => x !== null);
});

/** Pontos no padrão brasileiro, com 2 casas até 10 mil (o IBrX tem centavos, o Ibovespa não). */
export function formatarPontos(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: v >= 100000 ? 0 : 2, maximumFractionDigits: v >= 100000 ? 0 : 2 });
}
