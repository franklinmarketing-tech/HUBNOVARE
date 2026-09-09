/**
 * Investimentos — onde o dinheiro guardado está e o que ele já virou.
 *
 * POSIÇÃO, E NÃO OPERAÇÃO. A tabela guarda `valor_aplicado` e `valor_atual`,
 * não cada compra e venda. A Novare não vai virar home broker: preço médio,
 * custódia e cotação ao vivo são três problemas grandes para responder uma
 * pergunta que dois números já respondem. O preço disso é que a atualização é
 * manual — e dado velho mente com convicção, por isso todo rendimento sai daqui
 * acompanhado de `desatualizadoDias`.
 *
 * ⚠️ NÃO IMPORTE `@/lib/mercado` AQUI. Ele usa `cache()` do React e só roda em
 * Server Component; este arquivo é consumido por telas `"use client"`. Quando a
 * conta precisa de taxa (independência financeira), ela chega como PARÂMETRO —
 * o server component busca `getIndicadores()`, calcula `juroReal(selic, ipca)`
 * e passa o número para baixo.
 */

import { createClient } from "@/lib/supabase/client";
import { diasEntre, hojeIso } from "./modelo";

export type ClasseInvestimento =
  | "renda_fixa"
  | "renda_variavel"
  | "fundo"
  | "previdencia"
  | "cripto"
  | "outro";

export type IndexadorInvestimento = "cdi" | "ipca" | "selic" | "prefixado";
export type LiquidezInvestimento = "diaria" | "carencia" | "vencimento";

export type Investimento = {
  id: string;
  nome: string;
  instituicao: string;
  classe: ClasseInvestimento;
  indexador: IndexadorInvestimento | null;
  /** Lido conforme o indexador: 110 = 110% do CDI; 6 com IPCA = IPCA+6% a.a.;
      11.5 prefixado = 11,5% a.a. */
  taxa: number | null;
  valor_aplicado: number;
  valor_atual: number;
  data_aplicacao: string;
  /** Quando alguém conferiu o extrato pela última vez. */
  data_atualizacao: string;
  vencimento: string | null;
  liquidez: LiquidezInvestimento;
  /** Quando preenchido, o investimento MORA nesta conta — e o patrimônio
      ignora o saldo dela para não contar o mesmo dinheiro duas vezes. */
  conta_id: string | null;
  arquivado: boolean;
  observacao: string | null;
};

export const ROTULO_CLASSE: Record<ClasseInvestimento, string> = {
  renda_fixa: "Renda fixa",
  renda_variavel: "Renda variável",
  fundo: "Fundos",
  previdencia: "Previdência",
  cripto: "Cripto",
  outro: "Outros",
};

export const ROTULO_INDEXADOR: Record<IndexadorInvestimento, string> = {
  cdi: "CDI",
  ipca: "IPCA",
  selic: "Selic",
  prefixado: "Prefixado",
};

export const ROTULO_LIQUIDEZ: Record<LiquidezInvestimento, string> = {
  diaria: "Liquidez diária",
  carencia: "Com carência",
  vencimento: "Só no vencimento",
};

/** Cor por classe, para gráfico e legenda falarem a mesma língua em toda tela.
    Sai da paleta da casa (azul-marinho institucional, laranja de destaque). */
export const COR_CLASSE: Record<ClasseInvestimento, string> = {
  renda_fixa: "#1e3a5f",
  renda_variavel: "#e8703a",
  fundo: "#2563eb",
  previdencia: "#0d9488",
  cripto: "#7c3aed",
  outro: "#64748b",
};

/**
 * "110% do CDI", "IPCA + 6,00% a.a.", "11,50% a.a.".
 *
 * A leitura depende do indexador porque é assim que o mercado fala. Guardar
 * três colunas para não precisar desta função obrigaria a tela a decidir qual
 * preencher — e a errar quando o cliente troca o indexador de uma aplicação.
 */
export function descricaoDaTaxa(inv: Investimento): string {
  if (inv.taxa === null || inv.indexador === null) return "—";
  const n = inv.taxa.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (inv.indexador === "cdi" || inv.indexador === "selic") {
    return `${n}% do ${ROTULO_INDEXADOR[inv.indexador]}`;
  }
  if (inv.indexador === "ipca") return `IPCA + ${n}% a.a.`;
  return `${n}% a.a.`;
}

export type RendimentoItem = {
  /** valor_atual − valor_aplicado. */
  bruto: number;
  /** 0..1 sobre o aplicado. */
  percentual: number;
  dias: number;
  /** Equivalente ao ano, em %. NULO abaixo de 30 dias corridos: anualizar uma
      semana de rendimento devolve número de outro planeta e a tela mostraria
      "312% a.a." com cara de verdade. */
  aoAno: number | null;
  /** Há quantos dias ninguém confere este valor. */
  desatualizadoDias: number;
};

/**
 * O rendimento de uma aplicação.
 *
 * O PERÍODO É `data_aplicacao → data_atualizacao`, e não até hoje. O ganho
 * aconteceu até a última vez que alguém olhou o extrato; esticar o
 * denominador até hoje diluiria a taxa por um tempo que ninguém mediu.
 */
export function rendimentoDe(
  inv: Investimento,
  hoje = hojeIso(),
): RendimentoItem {
  const bruto = inv.valor_atual - inv.valor_aplicado;
  const dias = Math.max(0, diasEntre(inv.data_aplicacao, inv.data_atualizacao));
  const percentual = inv.valor_aplicado > 0 ? bruto / inv.valor_aplicado : 0;

  const aoAno =
    dias >= 30 && inv.valor_aplicado > 0 && inv.valor_atual > 0
      ? ((inv.valor_atual / inv.valor_aplicado) ** (365 / dias) - 1) * 100
      : null;

  return {
    bruto,
    percentual,
    dias,
    aoAno,
    desatualizadoDias: Math.max(0, diasEntre(inv.data_atualizacao, hoje)),
  };
}

export type Fatia = {
  chave: string;
  rotulo: string;
  cor: string;
  aplicado: number;
  atual: number;
  rendimento: number;
  /** 0..1 sobre o aplicado da fatia. */
  rendimentoPct: number;
  /** 0..1 da carteira. */
  fatia: number;
  itens: number;
};

function consolidar(
  investimentos: Investimento[],
  chaveDe: (i: Investimento) => string,
  rotuloDe: (chave: string) => string,
  corDe: (chave: string) => string,
): Fatia[] {
  const vivos = investimentos.filter((i) => !i.arquivado);
  const total = vivos.reduce((t, i) => t + i.valor_atual, 0);

  const grupos = new Map<string, Investimento[]>();
  for (const i of vivos) {
    const k = chaveDe(i);
    const g = grupos.get(k);
    if (g) g.push(i);
    else grupos.set(k, [i]);
  }

  return [...grupos.entries()]
    .map(([chave, itens]) => {
      const aplicado = itens.reduce((t, i) => t + i.valor_aplicado, 0);
      const atual = itens.reduce((t, i) => t + i.valor_atual, 0);
      return {
        chave,
        rotulo: rotuloDe(chave),
        cor: corDe(chave),
        aplicado,
        atual,
        rendimento: atual - aplicado,
        rendimentoPct: aplicado > 0 ? (atual - aplicado) / aplicado : 0,
        fatia: total > 0 ? atual / total : 0,
        itens: itens.length,
      };
    })
    .sort((a, b) => b.atual - a.atual);
}

/**
 * A carteira por classe — a leitura que responde "estou concentrado demais?".
 *
 * Arquivados ficam de fora: aplicação resgatada não é alocação atual, e somá-la
 * inflaria a carteira com dinheiro que já foi gasto.
 */
export function consolidarPorClasse(investimentos: Investimento[]): Fatia[] {
  return consolidar(
    investimentos,
    (i) => i.classe,
    (c) => ROTULO_CLASSE[c as ClasseInvestimento] ?? c,
    (c) => COR_CLASSE[c as ClasseInvestimento] ?? "#64748b",
  );
}

/** Por instituição — a leitura de risco que ninguém faz até precisar: quanto
    está num banco só, e quanto disso passa do teto do FGC. */
export function consolidarPorInstituicao(investimentos: Investimento[]): Fatia[] {
  const paleta = Object.values(COR_CLASSE);
  const cores = new Map<string, string>();

  return consolidar(
    investimentos,
    (i) => i.instituicao,
    (n) => n,
    (n) => {
      if (!cores.has(n)) cores.set(n, paleta[cores.size % paleta.length]);
      return cores.get(n) as string;
    },
  );
}

export type Patrimonio = {
  /** Soma de `valor_atual` dos investimentos vivos. */
  investido: number;
  /** Saldo das contas que NÃO são a casa de um investimento cadastrado. */
  emConta: number;
  total: number;
  aplicado: number;
  rendimento: number;
};

/**
 * O patrimônio líquido do FINCASH.
 *
 * A SUBTRAÇÃO QUE EVITA O DOBRO: uma conta do tipo `investimento` com R$ 50 mil
 * e o CDB de R$ 50 mil cadastrado apontando para ela são o MESMO dinheiro. Sem
 * descontar a conta vinculada, o app anunciaria R$ 100 mil de patrimônio — e
 * patrimônio inflado é pior que patrimônio ausente, porque leva a decisão de
 * gasto errada.
 *
 * `saldos` é o mapa de `carregarSaldos()`. Omitir é legítimo: a tela de
 * Investimentos sozinha só quer a carteira.
 */
export function patrimonio(
  investimentos: Investimento[],
  saldos?: Record<string, number>,
): Patrimonio {
  const vivos = investimentos.filter((i) => !i.arquivado);
  const investido = vivos.reduce((t, i) => t + i.valor_atual, 0);
  const aplicado = vivos.reduce((t, i) => t + i.valor_aplicado, 0);

  const jaContadas = new Set(
    vivos.map((i) => i.conta_id).filter((id): id is string => id !== null),
  );

  const emConta = Object.entries(saldos ?? {})
    .filter(([contaId]) => !jaContadas.has(contaId))
    .reduce((t, [, saldo]) => t + saldo, 0);

  return {
    investido,
    emConta,
    total: investido + emConta,
    aplicado,
    rendimento: investido - aplicado,
  };
}

/**
 * Quantos meses de vida a reserva de LIQUIDEZ DIÁRIA banca.
 *
 * Só liquidez diária, e é o ponto: reserva de emergência que não pode ser
 * sacada hoje não é reserva. Um CDB de cinco anos somado aqui daria uma
 * tranquilidade falsa justamente na hora em que ela custa caro.
 */
export function mesesDeReserva(
  investimentos: Investimento[],
  custoVidaMensal: number,
  saldos?: Record<string, number>,
): number | null {
  if (custoVidaMensal <= 0) return null;

  const vivos = investimentos.filter((i) => !i.arquivado);
  const liquido = vivos
    .filter((i) => i.liquidez === "diaria")
    .reduce((t, i) => t + i.valor_atual, 0);

  /* O set vem de TODOS os vivos, e não só dos líquidos: a conta que hospeda um
     CDB de vencimento continua sendo o mesmo dinheiro do CDB. Montá-lo só com
     os líquidos faria essa conta entrar aqui como se fosse reserva — e a
     reserva apareceria maior justamente por causa do que está preso. */
  const jaContadas = new Set(
    vivos.map((i) => i.conta_id).filter((id): id is string => id !== null),
  );

  // Saldo em conta é reserva de liquidez diária por definição.
  const emConta = Object.entries(saldos ?? {})
    .filter(([contaId]) => !jaContadas.has(contaId))
    .reduce((t, [, saldo]) => t + saldo, 0);

  return (liquido + emConta) / custoVidaMensal;
}

export type FaixaIndependencia =
  | "comecando"
  | "construindo"
  | "quase"
  | "independente"
  | "sem_custo";

export type Independencia = {
  patrimonio: number;
  custoVidaMensal: number;
  /** Quantos meses o patrimônio banca sem render nada. A leitura crua. */
  mesesDeVida: number | null;
  /** Anos, para quem prefere. */
  anosDeVida: number | null;
  /** Renda mensal que o patrimônio geraria ao juro REAL informado. */
  rendaPassivaMensal: number;
  /** rendaPassiva ÷ custo de vida. 1 = independente. */
  cobertura: number;
  /** Patrimônio necessário para cobertura = 1. */
  alvo: number;
  faixa: FaixaIndependencia;
  taxaRealAnual: number;
};

/**
 * O grau de independência financeira, em duas leituras.
 *
 * 1. MESES DE VIDA — patrimônio ÷ custo de vida. Cru, sem hipótese nenhuma:
 *    "se eu parar hoje, dá para quantos meses". É o número que a pessoa
 *    entende sem explicação.
 * 2. COBERTURA — quanto do custo de vida a RENDA do patrimônio paga. É a
 *    pergunta de verdade, porque é ela que diz se o dinheiro acaba ou não.
 *
 * JURO REAL, NÃO NOMINAL, e isto é a decisão mais importante da função. Com
 * Selic de 14% parece que R$ 500 mil rendem R$ 5.800 por mês — mas a inflação
 * come parte disso, e quem tira o rendimento nominal inteiro está consumindo o
 * principal sem perceber. O padrão de 4% a.a. é a regra de bolso clássica; para
 * usar o número de hoje, o Server Component chama `juroReal(selic, ipca12)` de
 * `@/lib/mercado` e passa o resultado aqui.
 *
 * O QUE ELA NÃO FAZ: imposto, aporte futuro e inflação do custo de vida. É uma
 * fotografia, não uma simulação de aposentadoria — essa vive no Vida Plan, e
 * fingir que este número a substitui seria vender uma precisão que ele não tem.
 */
export function independenciaFinanceira(
  patrimonioTotal: number,
  custoVidaMensal: number,
  taxaRealAnual = 4,
): Independencia {
  const temCusto = custoVidaMensal > 0;
  const rendaPassivaMensal = (patrimonioTotal * (taxaRealAnual / 100)) / 12;
  const cobertura = temCusto ? rendaPassivaMensal / custoVidaMensal : 0;

  const faixa: FaixaIndependencia = !temCusto
    ? "sem_custo"
    : cobertura >= 1
      ? "independente"
      : cobertura >= 0.5
        ? "quase"
        : cobertura >= 0.1
          ? "construindo"
          : "comecando";

  return {
    patrimonio: patrimonioTotal,
    custoVidaMensal,
    mesesDeVida: temCusto ? patrimonioTotal / custoVidaMensal : null,
    anosDeVida: temCusto ? patrimonioTotal / custoVidaMensal / 12 : null,
    rendaPassivaMensal,
    cobertura,
    alvo:
      taxaRealAnual > 0
        ? (custoVidaMensal * 12) / (taxaRealAnual / 100)
        : Infinity,
    faixa,
    taxaRealAnual,
  };
}

// ── Banco ───────────────────────────────────────────────────────────────────

/** A carteira inteira, arquivados inclusive — o filtro é do motor, não da
    consulta: a tela precisa poder mostrar o histórico de resgates. */
export async function carregarInvestimentos(): Promise<Investimento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fin_investimentos")
    .select("*")
    .order("valor_atual", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Investimento[];
}

export type NovoInvestimento = Omit<Investimento, "id" | "arquivado">;

export async function salvarInvestimento(i: NovoInvestimento) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_investimentos").insert(i);
  if (error) throw error;
}

/**
 * Atualizar quanto vale hoje.
 *
 * A DATA VAI JUNTO, sempre. Trocar o valor sem carimbar a data faria o app
 * mostrar um rendimento calculado sobre um período que nunca existiu — e é o
 * tipo de erro que ninguém percebe, porque o número continua parecendo certo.
 */
export async function atualizarValorAtual(
  id: string,
  valorAtual: number,
  data = hojeIso(),
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_investimentos")
    .update({ valor_atual: valorAtual, data_atualizacao: data })
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarInvestimento(
  id: string,
  campos: Partial<NovoInvestimento>,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_investimentos")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

/** Resgatar é arquivar. Apagar levaria junto a resposta para "quanto eu já
    tive investido" e furaria as metas que apontavam para cá. */
export async function arquivarInvestimento(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_investimentos")
    .update({ arquivado: true })
    .eq("id", id);
  if (error) throw error;
}
