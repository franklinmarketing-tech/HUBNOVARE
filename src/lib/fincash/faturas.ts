/**
 * Faturas de cartão — o ciclo, o total e o que já está comprometido.
 *
 * POR QUE ISTO É UM ARQUIVO, e não uma soma dentro da tela
 * Porque a fatura não é "o que gastei no mês". É o que caiu entre um
 * fechamento e o seguinte, e essa janela quase nunca coincide com o mês do
 * calendário. Quem soma por mês erra em todo cartão que não fecha no dia 1º —
 * ou seja, em todos.
 *
 * A CONVENÇÃO DESTE ARQUIVO: a fatura é nomeada pelo mês do VENCIMENTO, porque
 * é assim que a pessoa fala ("a fatura de março é a que eu pago em março").
 * Guardar pelo mês do fechamento seria mais fácil de calcular e obrigaria a
 * tela a traduzir em todo lugar.
 *
 * A REGRA DO SINAL vale aqui também: `valor` é positivo e o sentido vem de
 * `tipo`. Numa fatura, `receita` é estorno ou cashback — por isso o total é
 * despesas MENOS receitas, e não a soma de tudo.
 */

import { createClient } from "@/lib/supabase/client";
import {
  diaNoMes,
  hojeIso,
  mesVizinho,
  refDaData,
  somarDias,
  type Cartao,
  type Lancamento,
} from "./modelo";

export type CicloFatura = {
  /** O mês do VENCIMENTO — "2026-03". É por ele que a fatura é chamada. */
  ref: string;
  /** Primeiro dia de competência (o dia seguinte ao fechamento anterior). */
  inicio: string;
  /** Dia do fechamento, INCLUSIVE. */
  fim: string;
  vencimento: string;
  /** Já fechou: nada mais entra nela. */
  fechada: boolean;
  /** Já venceu e (se ainda houver saldo em aberto) está atrasada. */
  vencida: boolean;
};

/**
 * O ciclo da fatura que vence em `ref`.
 *
 * ONDE FICA O FECHAMENTO. Se o cartão vence DEPOIS do dia em que fecha (fecha
 * dia 1, vence dia 10), o fechamento é no mesmo mês do vencimento. Se vence
 * antes (fecha dia 25, vence dia 5 — o caso comum), o fechamento foi no mês
 * anterior. É a única regra que dá conta dos dois arranjos sem um campo extra
 * na tabela pedindo à pessoa uma informação que ela não sabe responder.
 *
 * DIA 31 EM FEVEREIRO: os dois extremos do ciclo passam pelo mesmo `diaNoMes`,
 * que prende o dia no último do mês. Isso é o que garante que o fim de um ciclo
 * e o início do seguinte se encostem sem buraco nem sobreposição — um cartão
 * que fecha dia 31 tem ciclo 01/03–31/03 depois de 29/01–28/02, e nenhuma
 * compra fica órfã entre os dois.
 */
export function cicloDaFatura(
  cartao: Pick<Cartao, "dia_fechamento" | "dia_vencimento">,
  ref: string,
  hoje = hojeIso(),
): CicloFatura {
  const refFechamento =
    cartao.dia_vencimento > cartao.dia_fechamento ? ref : mesVizinho(ref, -1);

  const fim = diaNoMes(refFechamento, cartao.dia_fechamento);
  const fechamentoAnterior = diaNoMes(
    mesVizinho(refFechamento, -1),
    cartao.dia_fechamento,
  );
  const vencimento = diaNoMes(ref, cartao.dia_vencimento);

  return {
    ref,
    inicio: somarDias(fechamentoAnterior, 1),
    fim,
    vencimento,
    fechada: hoje > fim,
    vencida: hoje > vencimento,
  };
}

/**
 * Em qual fatura uma compra cai.
 *
 * Procurando, e não calculando de cabeça: a conta direta ("se passou do
 * fechamento, joga para o mês seguinte") erra na virada do ano e nos cartões
 * que fecham perto do vencimento. Testar os quatro ciclos vizinhos custa
 * microssegundos e não tem caso de borda.
 */
export function cicloQueContem(
  cartao: Pick<Cartao, "dia_fechamento" | "dia_vencimento">,
  data: string,
  hoje = hojeIso(),
): CicloFatura {
  const base = refDaData(data);
  for (let i = 0; i <= 3; i++) {
    const c = cicloDaFatura(cartao, mesVizinho(base, i), hoje);
    if (data >= c.inicio && data <= c.fim) return c;
  }
  // Inalcançável com dados válidos; devolver o mais provável é melhor que
  // lançar e derrubar a tela por causa de um lançamento estranho.
  return cicloDaFatura(cartao, mesVizinho(base, 1), hoje);
}

export type Fatura = {
  cartaoId: string;
  ciclo: CicloFatura;
  /** Tudo que caiu no ciclo, do mais recente para o mais antigo. */
  itens: Lancamento[];
  /** Compras − estornos. */
  total: number;
  /** A parte já marcada como paga. */
  pago: number;
  aberto: number;
  /** Só o que é parcela, para a tela mostrar "3 de 12". */
  parcelas: Lancamento[];
  /** Quanto da PRÓXIMA fatura já está comprometido — parcelas e previstos que
      já existem como lançamento. Não é estimativa: são linhas reais. */
  proxima: number;
  /** O mesmo, somando TODAS as faturas seguintes já comprometidas. É o número
      que responde "quanto do meu futuro eu já gastei". */
  comprometidoFuturo: number;
  /** 0..1 do limite consumido (aberto + futuro). Nulo quando não há limite. */
  usoDoLimite: number | null;
};

/** Compras menos estornos de uma lista já filtrada. */
function somar(itens: Lancamento[]) {
  return itens.reduce(
    (t, l) => t + (l.tipo === "despesa" ? l.valor : -l.valor),
    0,
  );
}

function doCiclo(cartaoId: string, lancamentos: Lancamento[], c: CicloFatura) {
  return lancamentos.filter(
    (l) => l.cartao_id === cartaoId && l.data >= c.inicio && l.data <= c.fim,
  );
}

/**
 * A fatura de um ciclo.
 *
 * `lancamentos` pode conter de tudo (outros cartões, contas, outros meses) —
 * a função filtra. É de propósito: a tela carrega uma janela larga uma vez e
 * chama esta função doze vezes, em vez de doze consultas ao banco.
 *
 * O COMPROMETIDO FUTURO só enxerga o que já está gravado. Como
 * `salvarLancamento` cria as N parcelas na hora da compra, isso cobre todo
 * parcelamento — e é honesto: o app não adivinha compra que ainda não houve.
 */
export function calcularFatura(
  cartao: Cartao,
  lancamentos: Lancamento[],
  ref: string,
  hoje = hojeIso(),
): Fatura {
  const ciclo = cicloDaFatura(cartao, ref, hoje);
  const itens = doCiclo(cartao.id, lancamentos, ciclo)
    .slice()
    .sort((a, b) => b.data.localeCompare(a.data));

  const total = somar(itens);
  const pago = somar(itens.filter((l) => l.pago));

  const proximaCiclo = cicloDaFatura(cartao, mesVizinho(ref, 1), hoje);
  const proxima = somar(doCiclo(cartao.id, lancamentos, proximaCiclo));

  // Tudo que cai depois do fechamento deste ciclo, sem teto de meses: um 24x
  // some da conta se a janela for de 12.
  const comprometidoFuturo = somar(
    lancamentos.filter((l) => l.cartao_id === cartao.id && l.data > ciclo.fim),
  );

  const aberto = total - pago;
  const usoDoLimite =
    cartao.limite && cartao.limite > 0
      ? (aberto + comprometidoFuturo) / cartao.limite
      : null;

  return {
    cartaoId: cartao.id,
    ciclo,
    itens,
    total,
    pago,
    aberto,
    parcelas: itens.filter((l) => l.parcela_total !== null),
    proxima,
    comprometidoFuturo,
    usoDoLimite,
  };
}

/** A fatura de cada um dos próximos `meses` ciclos deste cartão. */
export function faturasDoCartao(
  cartao: Cartao,
  lancamentos: Lancamento[],
  refInicial: string,
  meses = 12,
  hoje = hojeIso(),
): Fatura[] {
  return Array.from({ length: meses }, (_, i) =>
    calcularFatura(cartao, lancamentos, mesVizinho(refInicial, i), hoje),
  );
}

/**
 * O mapa que a projeção de 12 meses consome: ref do vencimento → quanto sai da
 * conta naquele mês por causa de cartão.
 *
 * SÓ O QUE ESTÁ EM ABERTO. A parte já paga da fatura virou um lançamento de
 * despesa na CONTA (é o que `marcarFaturaPaga` faz), e esse lançamento já entra
 * na projeção pelo caminho normal. Somar o aberto e o pago contaria a mesma
 * fatura duas vezes — o erro mais caro que uma projeção de fluxo de caixa pode
 * cometer, porque some justamente com a folga do mês.
 *
 * Valores negativos (mês em que os estornos superaram as compras) viram zero:
 * fatura não devolve dinheiro para o caixa, ela abate a próxima.
 */
export function faturasPorMes(
  cartoes: Cartao[],
  lancamentos: Lancamento[],
  refInicial: string,
  meses = 12,
  hoje = hojeIso(),
): Record<string, number> {
  const mapa: Record<string, number> = {};

  for (let i = 0; i < meses; i++) {
    const ref = mesVizinho(refInicial, i);
    let total = 0;
    for (const c of cartoes) {
      const f = calcularFatura(c, lancamentos, ref, hoje);
      total += Math.max(0, f.aberto);
    }
    mapa[ref] = total;
  }

  return mapa;
}

// ── Banco ───────────────────────────────────────────────────────────────────

/**
 * Os lançamentos de cartão de uma janela.
 *
 * SEM TETO SUPERIOR quando `ate` é omitido, de propósito: as parcelas futuras
 * são o dado mais importante da tela ("você já comprometeu R$ 4.200 dos
 * próximos meses"), e um filtro de 12 meses cortaria justamente o 24x que a
 * pessoa precisa ver.
 */
export async function carregarLancamentosDeCartao(
  de: string,
  ate?: string,
): Promise<Lancamento[]> {
  const supabase = createClient();
  let q = supabase
    .from("fin_lancamentos")
    .select("*")
    .not("cartao_id", "is", null)
    .gte("data", de);
  if (ate) q = q.lte("data", ate);

  const { data, error } = await q.order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lancamento[];
}

/**
 * Pagar a fatura: um lançamento na conta e os itens marcados.
 *
 * DUAS ESCRITAS, e as duas são necessárias — não é redundância:
 *   1. A DESPESA NA CONTA é o que tira o dinheiro do saldo. Compra no cartão
 *      nunca mexe em saldo de conta (a view `fin_saldos` só olha `conta_id`),
 *      então sem esta linha o saldo do cliente nunca cairia.
 *   2. MARCAR OS ITENS como pagos é o que fecha a fatura e a tira da projeção
 *      dos meses seguintes.
 * Fazer só a primeira deixaria a fatura eternamente em aberto; só a segunda
 * faria o saldo mentir para cima.
 *
 * A data padrão é o VENCIMENTO, e não hoje: pagar adiantado no dia 28 uma
 * fatura que vence dia 5 não muda o mês de competência do gasto.
 */
export async function marcarFaturaPaga(
  cartao: Cartao,
  fatura: Fatura,
  contaId: string,
  data?: string,
) {
  const supabase = createClient();
  const emAberto = fatura.itens.filter((l) => !l.pago).map((l) => l.id);
  if (fatura.aberto <= 0 && emAberto.length === 0) return;

  const { error: erroDespesa } = await supabase.from("fin_lancamentos").insert({
    tipo: "despesa",
    descricao: `Fatura ${cartao.nome}`,
    valor: fatura.aberto,
    data: data ?? fatura.ciclo.vencimento,
    conta_id: contaId,
    cartao_id: null,
    categoria_id: null,
    pago: true,
  });
  if (erroDespesa) throw erroDespesa;

  if (emAberto.length > 0) {
    const { error } = await supabase
      .from("fin_lancamentos")
      .update({ pago: true })
      .in("id", emAberto);
    if (error) throw error;
  }
}

export async function salvarCartao(c: Omit<Cartao, "id" | "arquivado">) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_cartoes").insert(c);
  if (error) throw error;
}

/**
 * Editar o cartão que já existe.
 *
 * Vive aqui, e não na tela, porque é escrita — e escrita espalhada pelas telas
 * é como duas telas passam a gravar a mesma coluna de jeitos diferentes. O
 * cartão precisa ser editável: sem isto, corrigir um dia de vencimento digitado
 * errado obrigaria a arquivar o cartão e criar outro, e todo o histórico de
 * compras ficaria pendurado no cartão morto.
 */
export async function atualizarCartao(
  id: string,
  c: Partial<Omit<Cartao, "id">>,
) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_cartoes").update(c).eq("id", id);
  if (error) throw error;
}

/** Arquivar, e não apagar: `on delete cascade` levaria junto todo o histórico
    de compras do cliente naquele cartão. */
export async function arquivarCartao(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fin_cartoes")
    .update({ arquivado: true })
    .eq("id", id);
  if (error) throw error;
}
