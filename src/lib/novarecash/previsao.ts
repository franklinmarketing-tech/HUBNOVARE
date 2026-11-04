import type { SupabaseClient } from "@supabase/supabase-js";

import { NAO_E_GASTO } from "./categorias";
import { lerCartoes, lerMovimentosDosCartoes, resumoDoCartao, type ResumoCartao } from "./cartoes";
import { carregarMesDeContas, type ItemDoMes } from "./contas-pagar";
import {
  arred,
  comSaldos,
  hojeNoBrasil,
  lerContas,
  lerTransacoesDoMes,
  mesVizinho,
  type ContaComSaldo,
  type Transacao,
} from "./dados";

/**
 * A PREVISÃO DO MÊS: quanto vai sobrar no fim do mês (04/11/2026).
 *
 *   sobra = saldo das contas
 *         + entradas previstas
 *         − contas a pagar que faltam
 *         − fatura de cartão que vence no mês (o que falta pagar dela)
 *
 * DE ONDE SAI CADA PARTE — e como cada uma evita contar duas vezes:
 *
 * - SALDO DAS CONTAS: só contas do tipo "conta" (corrente, carteira), com o
 *   saldo de hoje de `comSaldos`. Investimento fica de fora: não é dinheiro
 *   para pagar o mês. Conta manual já anda com TODOS os lançamentos dela,
 *   inclusive os com data futura — por isso eles não entram de novo abaixo.
 * - ENTRADAS PREVISTAS:
 *     · salário esperado = salário do mês passado − salário já lançado neste
 *       mês (nunca negativo). Lançou o salário adiantado? A estimativa zera.
 *     · entradas com data FUTURA neste mês que ainda não estão em saldo
 *       nenhum: sem conta, ou em conta do banco (o banco só manda o passado).
 * - CONTAS A PAGAR: as que faltam pagar no mês (e as atrasadas que a tela de
 *   contas mostra). As que saem pelo CARTÃO ficam de fora: viram compra e
 *   entram numa fatura.
 * - FATURA: para cada cartão, a fatura que VENCE neste mês, menos o que já
 *   foi pago dela pelo "Pagar fatura".
 *
 * Nada de `NAO_E_GASTO` (pagamento de fatura, transferência, aplicação) conta
 * como entrada prevista.
 */

export type LinhaFatura = { cartao: string; vence: string; restante: number };

export type Previsao = {
  ref: string;
  hoje: string;
  saldoContas: number;
  /** Contas do tipo "conta" sem saldo conhecido (a previsão sai sem elas). */
  contasSemSaldo: number;
  salarioEsperado: number;
  entradasAgendadas: number;
  entradasPrevistas: number;
  contasAPagar: number;
  qtdContasAPagar: number;
  faturas: number;
  faturasDetalhe: LinhaFatura[];
  sobra: number;
  /** Nada para prever: sem conta com saldo, sem contas a pagar e sem cartão. */
  vazia: boolean;
};

export function calcularPrevisao(args: {
  hoje: string;
  contas: ContaComSaldo[];
  transacoesMes: Transacao[];
  transacoesMesPassado: Transacao[];
  itensContas: ItemDoMes[];
  cartoes: ResumoCartao[];
}): Previsao {
  const { hoje, contas, transacoesMes, transacoesMesPassado, itensContas, cartoes } = args;
  const ref = hoje.slice(0, 7);
  const contaDe = new Map(contas.map((c) => [c.id, c]));

  // Saldo
  let saldoContas = 0;
  let contasSemSaldo = 0;
  for (const c of contas) {
    if (c.tipo !== "conta") continue;
    if (c.saldoAtual === null) contasSemSaldo++;
    else saldoContas += c.saldoAtual;
  }

  // Entradas
  const ehReceita = (t: Transacao) =>
    t.tipo === "entrada" && !NAO_E_GASTO.has(t.categoria) && contaDe.get(t.conta_id ?? "")?.tipo !== "cartao";
  const salario = (ts: Transacao[]) => ts.filter((t) => ehReceita(t) && t.categoria === "salario").reduce((s, t) => s + t.valor, 0);
  const salarioEsperado = Math.max(0, salario(transacoesMesPassado) - salario(transacoesMes));

  let entradasAgendadas = 0;
  for (const t of transacoesMes) {
    if (!ehReceita(t) || t.data <= hoje) continue;
    const conta = t.conta_id ? contaDe.get(t.conta_id) : null;
    // Em conta manual já está no saldo; em conta do banco, ainda não.
    if (!conta || conta.origem === "openfinance") entradasAgendadas += t.valor;
  }
  const entradasPrevistas = salarioEsperado + entradasAgendadas;

  // Contas a pagar
  const faltam = itensContas.filter(
    (i) => !i.pagamento && contaDe.get(i.conta.conta_id ?? "")?.tipo !== "cartao",
  );
  const contasAPagar = faltam.reduce((s, i) => s + i.conta.valor, 0);

  // Faturas que vencem no mês
  const faturasDetalhe: LinhaFatura[] = [];
  for (const r of cartoes) {
    for (const f of [r.fechada, r.aberta, ...r.futuras]) {
      if (f && f.ref === ref && f.restante > 0) {
        faturasDetalhe.push({ cartao: r.cartao.nome, vence: f.vence, restante: f.restante });
      }
    }
  }
  const faturas = faturasDetalhe.reduce((s, f) => s + f.restante, 0);

  const temConta = contas.some((c) => c.tipo === "conta" && c.saldoAtual !== null);
  return {
    ref,
    hoje,
    saldoContas: arred(saldoContas),
    contasSemSaldo,
    salarioEsperado: arred(salarioEsperado),
    entradasAgendadas: arred(entradasAgendadas),
    entradasPrevistas: arred(entradasPrevistas),
    contasAPagar: arred(contasAPagar),
    qtdContasAPagar: faltam.length,
    faturas: arred(faturas),
    faturasDetalhe: faturasDetalhe.sort((a, b) => a.vence.localeCompare(b.vence)),
    sobra: arred(saldoContas + entradasPrevistas - contasAPagar - faturas),
    vazia: !temConta && faltam.length === 0 && faturasDetalhe.length === 0 && entradasPrevistas === 0,
  };
}

/**
 * Lê tudo e calcula. Erros vêm como `ErroDados`; "sem-tabela" pode ser do
 * `novarecash_dados.sql` ou do `novarecash_cartoes.sql` (a tela diz os dois).
 */
export async function carregarPrevisao(sb: SupabaseClient, uid: string, hoje = hojeNoBrasil()): Promise<Previsao> {
  const ref = hoje.slice(0, 7);
  const [contas, transacoesMes, transacoesMesPassado, mesDeContas, cartoes] = await Promise.all([
    lerContas(sb, uid),
    lerTransacoesDoMes(sb, uid, ref),
    lerTransacoesDoMes(sb, uid, mesVizinho(ref, -1)),
    carregarMesDeContas(sb, uid, ref, hoje),
    lerCartoes(sb, uid),
  ]);
  const [comSaldo, movimentos] = await Promise.all([
    comSaldos(sb, uid, contas),
    lerMovimentosDosCartoes(sb, uid, cartoes.map((c) => c.id), `${mesVizinho(ref, -3)}-01`),
  ]);
  const saldoDe = new Map(comSaldo.map((c) => [c.id, c.saldoAtual]));
  const resumos = cartoes.map((c) => resumoDoCartao(c, movimentos, hoje, saldoDe.get(c.id) ?? null));

  return calcularPrevisao({
    hoje,
    contas: comSaldo,
    transacoesMes,
    transacoesMesPassado,
    itensContas: mesDeContas.itens,
    cartoes: resumos,
  });
}
