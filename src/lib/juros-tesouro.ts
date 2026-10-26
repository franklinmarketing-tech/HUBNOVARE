import { cache } from "react";

/**
 * JUROS FUTUROS (DI) E TESOURO IPCA+ (pedido do Jefferson, 26/10/2026 — as referências eram a
 * página de DI do InfoMoney e a de rendimento dos títulos do Tesouro Direto). Não copiamos de
 * terceiros: as duas vêm da fonte.
 *
 *   • DI1 — cotação pública da B3 (cotacao.b3.com.br), sem chave, com ~15 min de atraso. Usa os
 *     contratos de JANEIRO (DI1F27, DI1F28…), que são os que o mercado lê como "a curva".
 *   • Tesouro — o JSON que a própria página do Tesouro Direto usa (/o/rentabilidade/investir).
 *     O endpoint antigo (treasurybondsinfo.json) foi desligado; o CSV do Tesouro Transparente
 *     limita acessos seguidos (429), então fica de fora.
 *
 * Fonte que não responder devolve lista vazia e a seção some — nunca número inventado.
 */

export type ContratoDI = {
  codigo: string;
  /** "jan/27" */
  rotulo: string;
  vencimento: string;
  /** Taxa da última negociação do dia (ou o ajuste anterior, antes de o pregão abrir). */
  taxa: number;
};

export type TituloIpca = {
  nome: string;
  vencimento: string;
  ano: number;
  /** Taxa real de compra, % a.a. acima do IPCA. */
  taxaReal: number;
  preco: number;
  minimo: number;
  jurosSemestrais: boolean;
};

const ANO_ATUAL = () => new Date().getFullYear();

/**
 * ⚠️ SEM "VARIAÇÃO DO DIA" (26/10/2026): o `prvsDayAdjstmntPric` da B3 veio incoerente com a curva
 * (+2,9 p.p. num dia; o jan/36 sem negócio a 12,7% entre vizinhos a 15%). Mostramos só a taxa
 * negociada hoje; antes da abertura, o ajuste anterior — e a tela diz qual dos dois é.
 */
export const getJurosFuturos = cache(async (): Promise<{ contratos: ContratoDI[]; atualizado: string | null; doPregaoAnterior: boolean }> => {
  try {
    const r = await fetch("https://cotacao.b3.com.br/mds/api/v1/DerivativeQuotation/DI1", {
      headers: { "User-Agent": "Mozilla/5.0 (Novare Hub)" },
      next: { revalidate: 60 * 10 },
    });
    if (!r.ok) return { contratos: [], atualizado: null, doPregaoAnterior: false };
    const d = (await r.json()) as {
      Msg?: { dtTm?: string };
      Scty?: {
        symb: string;
        SctyQtn?: { curPrc?: number; prvsDayAdjstmntPric?: number };
        asset?: { AsstSummry?: { mtrtyCode?: string } };
      }[];
    };
    const anoMin = ANO_ATUAL() + 1;
    const janeiro = (d.Scty ?? [])
      .filter((s) => /^DI1F\d{2}$/.test(s.symb))
      .map((s) => ({
        s,
        ano: 2000 + Number(s.symb.slice(4)),
        atual: s.SctyQtn?.curPrc,
        ajuste: s.SctyQtn?.prvsDayAdjstmntPric,
      }))
      .filter((x) => x.ano >= anoMin && x.ano <= anoMin + 10);
    const negociados = janeiro.filter((x) => x.atual != null && Number.isFinite(x.atual));
    const doPregaoAnterior = negociados.length < 3;
    const base = doPregaoAnterior ? janeiro.filter((x) => x.ajuste != null && Number.isFinite(x.ajuste)) : negociados;
    const contratos = base
      .map((x): ContratoDI => ({
        codigo: x.s.symb,
        rotulo: `jan/${String(x.ano).slice(2)}`,
        vencimento: x.s.asset?.AsstSummry?.mtrtyCode ?? `${x.ano}-01-01`,
        taxa: (doPregaoAnterior ? x.ajuste : x.atual) as number,
      }))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    return { contratos, atualizado: d.Msg?.dtTm ?? null, doPregaoAnterior };
  } catch {
    return { contratos: [], atualizado: null, doPregaoAnterior: false };
  }
});

export const getTesouroIpca = cache(async (): Promise<{ titulos: TituloIpca[]; atualizado: string | null }> => {
  try {
    const r = await fetch("https://www.tesourodireto.com.br/o/rentabilidade/investir", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 },
    });
    if (!r.ok) return { titulos: [], atualizado: null };
    const d = (await r.json()) as Record<string, unknown>;
    const lista = Object.values(d).flatMap((v) => (Array.isArray(v) ? v : [])) as {
      treasuryBondName?: string;
      investmentProfitabilityIndexerName?: string;
      unitaryInvestmentValue?: number;
      investmentBondMinimumValue?: number;
      maturityDate?: string;
      lastMarketPricingDate?: string;
    }[];
    let atualizado: string | null = null;
    const titulos = lista
      .filter((t) => /^Tesouro IPCA\+/.test(t.treasuryBondName ?? ""))
      .map((t): TituloIpca | null => {
        // "IPCA + 6,72%" → 6.72. Título só para resgate vem sem taxa de compra e fica de fora.
        const m = (t.investmentProfitabilityIndexerName ?? "").match(/IPCA\s*\+\s*([\d.,]+)\s*%/);
        if (!m || !t.maturityDate) return null;
        if (t.lastMarketPricingDate && (!atualizado || t.lastMarketPricingDate > atualizado)) atualizado = t.lastMarketPricingDate;
        return {
          nome: t.treasuryBondName!.trim(),
          vencimento: t.maturityDate.slice(0, 10),
          ano: Number(t.maturityDate.slice(0, 4)),
          taxaReal: Number(m[1].replace(/\./g, "").replace(",", ".")),
          preco: t.unitaryInvestmentValue ?? 0,
          minimo: t.investmentBondMinimumValue ?? 0,
          jurosSemestrais: /Juros Semestrais/i.test(t.treasuryBondName ?? ""),
        };
      })
      .filter((t): t is TituloIpca => t !== null && Number.isFinite(t.taxaReal))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    return { titulos, atualizado };
  } catch {
    return { titulos: [], atualizado: null };
  }
});
