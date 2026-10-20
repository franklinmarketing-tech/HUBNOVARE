import { cache } from "react";

/**
 * A PÁGINA DE INDICADORES (/indicadores), inspirada na de índices da Nord
 * (pedido do Jefferson, 20/10/2026).
 *
 * Fonte única: o SGS do Banco Central, público e sem chave — o mesmo de
 * `lib/mercado.ts`. Cada código abaixo foi conferido direto na API nesta
 * data. Cache de 6 h: o BCB atualiza no máximo uma vez por dia.
 *
 * ⚠️ SEM VALOR DE RESERVA AQUI, ao contrário de `mercado.ts`. Lá o número
 * entra numa frase da home e um valor antigo marcado serve; aqui a página
 * inteira É o número. Se a série falhar, o cartão diz "indisponível agora"
 * — índice velho com cara de atual é pior do que índice ausente.
 *
 * ⚠️ SÓ FATO, NUNCA CONSELHO. O "para você" explica o que o índice mexe na
 * vida da pessoa; dizer o que fazer com isso seria recomendação, e isso a
 * casa só faz na consultoria.
 */

const SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
type Ponto = { data: string; valor: number };

async function serie(id: number, n: number): Promise<Ponto[] | null> {
  try {
    const r = await fetch(`${SGS}.${id}/dados/ultimos/${n}?formato=json`, {
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!r.ok) return null;
    const bruto = (await r.json()) as { data: string; valor: string }[];
    const pontos = bruto
      .map((p) => ({ data: p.data, valor: Number(String(p.valor).replace(",", ".")) }))
      .filter((p) => Number.isFinite(p.valor));
    return pontos.length ? pontos : null;
  } catch {
    return null;
  }
}

/**
 * O último ano de uma série DIÁRIA, pedido por intervalo de datas.
 *
 * ⚠️ O `/ultimos/N` DO SGS ACEITA NO MÁXIMO 20 VALORES: pedir 260 dá HTTP
 * 400 ("quantidade máxima de valores"), e o cartão do dólar e do euro
 * aparecia "indisponível". O intervalo não tem esse teto.
 */
async function ultimoAno(id: number): Promise<Ponto[] | null> {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const hoje = new Date();
  const inicio = new Date(hoje.getTime() - 365 * 24 * 3600 * 1000);
  try {
    const r = await fetch(
      `${SGS}.${id}/dados?formato=json&dataInicial=${fmt(inicio)}&dataFinal=${fmt(hoje)}`,
      { next: { revalidate: 60 * 60 * 6 } },
    );
    if (!r.ok) return null;
    const bruto = (await r.json()) as { data: string; valor: string }[];
    const pontos = bruto
      .map((p) => ({ data: p.data, valor: Number(String(p.valor).replace(",", ".")) }))
      .filter((p) => Number.isFinite(p.valor));
    return pontos.length ? pontos : null;
  } catch {
    return null;
  }
}

export type Grupo = "Juros" | "Inflação" | "Câmbio" | "Atividade e emprego";

export type CartaoIndicador = {
  chave: string;
  nome: string;
  grupo: Grupo;
  /** Valor já formatado, ou null se a série não respondeu. */
  valor: string | null;
  /** "setembro de 2026", "20/10/2026"… */
  referencia: string | null;
  /** A segunda leitura do mesmo índice ("12 meses: 4,58%"). */
  extra?: string;
  /** Pontos do minigráfico, do mais antigo ao mais novo. */
  historico: number[];
  oQueE: string;
  paraVoce: string;
  link?: { href: string; rotulo: string };
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const mesAno = (d: string) => {
  const [, m, a] = d.split("/");
  return `${MESES[Number(m) - 1]} de ${a}`;
};
const num = (v: number, casas = 2) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const pct = (v: number) => `${num(v)}%`;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 4 });
/** Acumulado de uma série mensal: produto de (1 + v) menos 1. */
const acumulado = (pts: Ponto[]) => (pts.reduce((a, p) => a * (1 + p.valor / 100), 1) - 1) * 100;
/** Série diária vira ~12 pontos para o gráfico (um a cada ~mês útil). */
const amostrar = (pts: Ponto[], n = 12) => {
  if (pts.length <= n) return pts.map((p) => p.valor);
  const passo = (pts.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => pts[Math.round(i * passo)].valor);
};

export const getCartoesIndicadores = cache(async (): Promise<CartaoIndicador[]> => {
  const [selic, selicMes, cdi, cdiMes, poupanca, ipca, ipca12, ipca15, igpm, incc, dolar, euro, ibc, desemprego] =
    await Promise.all([
      serie(432, 1), // Selic meta (Copom)
      serie(4189, 12), // Selic acumulada no mês, anualizada — o histórico
      serie(4389, 1), // CDI anualizado base 252
      serie(4392, 12), // CDI acumulado no mês, anualizado — o histórico
      serie(195, 1), // poupança: rendimento no último aniversário
      serie(433, 12), // IPCA mensal
      serie(13522, 1), // IPCA 12 meses
      serie(7478, 12), // IPCA-15 mensal
      serie(189, 12), // IGP-M mensal
      serie(192, 12), // INCC mensal
      ultimoAno(10813), // dólar PTAX compra, diário
      ultimoAno(21619), // euro PTAX compra, diário
      serie(24364, 13), // IBC-Br com ajuste sazonal (índice)
      serie(24369, 12), // desocupação PNAD Contínua
    ]);

  const ultimo = (s: Ponto[] | null) => s?.at(-1) ?? null;

  const cartoes: CartaoIndicador[] = [
    {
      chave: "selic",
      nome: "Selic",
      grupo: "Juros",
      valor: ultimo(selic) ? `${num(ultimo(selic)!.valor)}% a.a.` : null,
      referencia: ultimo(selic) ? "meta definida pelo Copom" : null,
      historico: selicMes?.map((p) => p.valor) ?? [],
      oQueE: "A taxa básica de juros do país, definida pelo Copom do Banco Central a cada 45 dias.",
      paraVoce: "Puxa o rendimento da renda fixa e o custo de empréstimos, cartão e financiamentos.",
      link: { href: "/ferramentas/tesouro-direto", rotulo: "Simular no Tesouro Direto" },
    },
    {
      chave: "cdi",
      nome: "CDI",
      grupo: "Juros",
      valor: ultimo(cdi) ? `${num(ultimo(cdi)!.valor)}% a.a.` : null,
      referencia: ultimo(cdi) ? `em ${ultimo(cdi)!.data}` : null,
      historico: cdiMes?.map((p) => p.valor) ?? [],
      oQueE: "A taxa dos empréstimos de um dia entre bancos. Anda colada na Selic.",
      paraVoce: "É a régua do CDB, da LCI e dos fundos de renda fixa: “100% do CDI” rende igual a ela.",
      link: { href: "/ferramentas/rentabilidade-real", rotulo: "Ver o ganho real" },
    },
    {
      chave: "poupanca",
      nome: "Poupança",
      grupo: "Juros",
      valor: ultimo(poupanca) ? pct(ultimo(poupanca)!.valor) : null,
      referencia: ultimo(poupanca) ? `no mês, aniversário em ${ultimo(poupanca)!.data}` : null,
      historico: [],
      oQueE: "Quanto a poupança rendeu no último período de 30 dias.",
      paraVoce: "Com a Selic acima de 8,5% ao ano, ela rende 0,5% ao mês mais a TR.",
      link: { href: "/ferramentas/juros-compostos", rotulo: "Simular juros compostos" },
    },
    {
      chave: "ipca",
      nome: "IPCA",
      grupo: "Inflação",
      valor: ultimo(ipca) ? pct(ultimo(ipca)!.valor) : null,
      referencia: ultimo(ipca) ? mesAno(ultimo(ipca)!.data) : null,
      extra: ultimo(ipca12) ? `12 meses: ${pct(ultimo(ipca12)!.valor)}` : undefined,
      historico: ipca?.map((p) => p.valor) ?? [],
      oQueE: "A inflação oficial do Brasil, medida pelo IBGE todo mês.",
      paraVoce: "É ela que diz se o seu dinheiro ganhou ou perdeu poder de compra.",
      link: { href: "/ferramentas/correcao", rotulo: "Corrigir um valor pela inflação" },
    },
    {
      chave: "ipca15",
      nome: "IPCA-15",
      grupo: "Inflação",
      valor: ultimo(ipca15) ? pct(ultimo(ipca15)!.valor) : null,
      referencia: ultimo(ipca15) ? mesAno(ultimo(ipca15)!.data) : null,
      extra: ipca15 && ipca15.length >= 12 ? `12 meses: ${pct(acumulado(ipca15.slice(-12)))}` : undefined,
      historico: ipca15?.map((p) => p.valor) ?? [],
      oQueE: "A prévia do IPCA, com a coleta de preços até a metade do mês.",
      paraVoce: "Antecipa para onde a inflação do mês está indo, antes do número oficial.",
    },
    {
      chave: "igpm",
      nome: "IGP-M",
      grupo: "Inflação",
      valor: ultimo(igpm) ? pct(ultimo(igpm)!.valor) : null,
      referencia: ultimo(igpm) ? mesAno(ultimo(igpm)!.data) : null,
      extra: igpm && igpm.length >= 12 ? `12 meses: ${pct(acumulado(igpm.slice(-12)))}` : undefined,
      historico: igpm?.map((p) => p.valor) ?? [],
      oQueE: "O índice de preços da FGV, conhecido como a “inflação do aluguel”.",
      paraVoce: "É o que costuma reajustar o aluguel no aniversário do contrato.",
      link: { href: "/ferramentas/reajuste-aluguel", rotulo: "Calcular o reajuste do aluguel" },
    },
    {
      chave: "incc",
      nome: "INCC",
      grupo: "Inflação",
      valor: ultimo(incc) ? pct(ultimo(incc)!.valor) : null,
      referencia: ultimo(incc) ? mesAno(ultimo(incc)!.data) : null,
      extra: incc && incc.length >= 12 ? `12 meses: ${pct(acumulado(incc.slice(-12)))}` : undefined,
      historico: incc?.map((p) => p.valor) ?? [],
      oQueE: "O custo da construção civil, medido pela FGV: material e mão de obra.",
      paraVoce: "Corrige as parcelas de imóvel comprado na planta até a entrega das chaves.",
      link: { href: "/ferramentas/financiamento", rotulo: "Simular um financiamento" },
    },
    {
      chave: "dolar",
      nome: "Dólar",
      grupo: "Câmbio",
      valor: ultimo(dolar) ? brl(ultimo(dolar)!.valor) : null,
      referencia: ultimo(dolar) ? `PTAX de compra, ${ultimo(dolar)!.data}` : null,
      historico: dolar ? amostrar(dolar) : [],
      oQueE: "A cotação oficial do dólar, calculada pelo Banco Central (PTAX).",
      paraVoce: "Mexe no preço de viagens, eletrônicos, combustível e produtos importados.",
    },
    {
      chave: "euro",
      nome: "Euro",
      grupo: "Câmbio",
      valor: ultimo(euro) ? brl(ultimo(euro)!.valor) : null,
      referencia: ultimo(euro) ? `PTAX de compra, ${ultimo(euro)!.data}` : null,
      historico: euro ? amostrar(euro) : [],
      oQueE: "A cotação oficial do euro, calculada pelo Banco Central (PTAX).",
      paraVoce: "Pesa em viagens à Europa e em produtos importados de lá.",
    },
    {
      chave: "ibcbr",
      nome: "IBC-Br",
      grupo: "Atividade e emprego",
      valor:
        ibc && ibc.length >= 2
          ? `${ibc.at(-1)!.valor >= ibc.at(-2)!.valor ? "+" : ""}${pct((ibc.at(-1)!.valor / ibc.at(-2)!.valor - 1) * 100)}`
          : null,
      referencia: ultimo(ibc) ? `${mesAno(ultimo(ibc)!.data)}, sobre o mês anterior` : null,
      historico: ibc?.map((p) => p.valor) ?? [],
      oQueE: "A prévia do PIB feita pelo Banco Central, mês a mês, com ajuste sazonal.",
      paraVoce: "Mostra se a economia acelerou ou esfriou — e isso pesa na decisão dos juros.",
    },
    {
      chave: "desemprego",
      nome: "Desemprego",
      grupo: "Atividade e emprego",
      valor: ultimo(desemprego) ? pct(ultimo(desemprego)!.valor) : null,
      referencia: ultimo(desemprego) ? `trimestre até ${mesAno(ultimo(desemprego)!.data)}` : null,
      historico: desemprego?.map((p) => p.valor) ?? [],
      oQueE: "A taxa de desocupação da PNAD Contínua, do IBGE, em trimestres móveis.",
      paraVoce: "Mercado de trabalho aquecido sustenta a renda e o consumo das famílias.",
      link: { href: "/ferramentas/seguro-desemprego", rotulo: "Calcular o seguro-desemprego" },
    },
  ];

  return cartoes;
});

export const GRUPOS: Grupo[] = ["Juros", "Inflação", "Câmbio", "Atividade e emprego"];
