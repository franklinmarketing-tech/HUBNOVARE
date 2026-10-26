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

export type TipoTitulo = "Reserva" | "Selic" | "Prefixado" | "IPCA+" | "Renda+" | "Educa+";
export const ORDEM_TIPOS: TipoTitulo[] = ["Reserva", "Selic", "Prefixado", "IPCA+", "Renda+", "Educa+"];

/** Um título à venda agora no Tesouro Direto, como na página "Rendimento dos Títulos". */
export type TituloTesouro = {
  nome: string;
  tipo: TipoTitulo;
  /** Como o Tesouro escreve: "SELIC + 0,0992%", "IPCA + 8,10%", "13,20%". */
  rendimento: string;
  /** Só no IPCA+, Renda+ e Educa+: o ganho real, % a.a. acima do IPCA. */
  taxaReal: number | null;
  minimo: number;
  preco: number;
  vencimento: string;
  ano: number;
  jurosSemestrais: boolean;
};

/** Compatível com a primeira versão (fita do topo): só os IPCA+. */
export type TituloIpca = TituloTesouro & { taxaReal: number };

const tipoDe = (nome: string): TipoTitulo | null => {
  if (/Reserva/i.test(nome)) return "Reserva";
  if (/Selic/i.test(nome)) return "Selic";
  if (/Prefixado/i.test(nome)) return "Prefixado";
  if (/Renda\+|RendA\+|Aposentadoria/i.test(nome)) return "Renda+";
  if (/Educa\+/i.test(nome)) return "Educa+";
  if (/IPCA\+/i.test(nome)) return "IPCA+";
  return null;
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

/**
 * ⚠️ A LISTA MUDA AO LONGO DO DIA: em dia de muita oscilação o Tesouro suspende a venda e o mesmo
 * endpoint passa de 36 títulos para só Selic e Reserva (visto em 26/10/2026). A tela mostra o que
 * houver e avisa quando faltam tipos — não inventa a taxa de quem saiu.
 */
export const getTesouroTitulos = cache(async (): Promise<{ titulos: TituloTesouro[]; atualizado: string | null }> => {
  try {
    const r = await fetch("https://www.tesourodireto.com.br/o/rentabilidade/investir", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 60 * 30 },
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
      .map((t): TituloTesouro | null => {
        const nome = (t.treasuryBondName ?? "").trim();
        const tipo = tipoDe(nome);
        const rendimento = (t.investmentProfitabilityIndexerName ?? "").trim();
        // Título só para resgate vem sem rendimento de compra e fica de fora.
        if (!tipo || !rendimento || !t.maturityDate) return null;
        if (t.lastMarketPricingDate && (!atualizado || t.lastMarketPricingDate > atualizado)) atualizado = t.lastMarketPricingDate;
        const m = rendimento.match(/IPCA\s*\+\s*([\d.,]+)\s*%/);
        return {
          nome,
          tipo,
          rendimento,
          taxaReal: m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null,
          minimo: t.investmentBondMinimumValue ?? 0,
          preco: t.unitaryInvestmentValue ?? 0,
          vencimento: t.maturityDate.slice(0, 10),
          ano: Number(t.maturityDate.slice(0, 4)),
          jurosSemestrais: /Juros Semestrais/i.test(nome),
        };
      })
      .filter((t): t is TituloTesouro => t !== null)
      .sort((a, b) => ORDEM_TIPOS.indexOf(a.tipo) - ORDEM_TIPOS.indexOf(b.tipo) || a.vencimento.localeCompare(b.vencimento));
    return { titulos, atualizado };
  } catch {
    return { titulos: [], atualizado: null };
  }
});

export const getTesouroIpca = cache(async (): Promise<{ titulos: TituloIpca[]; atualizado: string | null }> => {
  const { titulos, atualizado } = await getTesouroTitulos();
  return {
    titulos: titulos.filter((t): t is TituloIpca => t.tipo === "IPCA+" && t.taxaReal !== null),
    atualizado,
  };
});
