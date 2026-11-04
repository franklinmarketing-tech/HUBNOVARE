import type { SupabaseClient } from "@supabase/supabase-js";

import { checarCartoes, diasEntre, diaNoMes, somarDias } from "./cartoes";
import { ErroDados, arred, hojeNoBrasil, mesVizinho } from "./dados";

/**
 * CONTAS A PAGAR E FIXAS DO NOVARECASH (04/11/2026).
 *
 * Contrato no banco: `supabase/novarecash_cartoes.sql`
 * - `ncash_contas_pagar`: o compromisso (aluguel todo dia 10; IPVA em 15/03).
 * - `ncash_contas_pagas`: um pagamento por conta e COMPETÊNCIA ("2026-11"),
 *   com o lançamento que ele gerou em `ncash_transacoes`. O índice único
 *   (conta, competência) impede pagar duas vezes o mesmo mês — inclusive quando
 *   duas pessoas da conta compartilhada tocam "Paguei" ao mesmo tempo.
 *
 * MENSAL: vence todo mês no `vence_dia` (dia 31 em novembro = dia 30), a
 * partir do mês em que foi cadastrada. ÚNICA: vence em `vence_em`.
 *
 * Mesmo padrão de `dados.ts`: toda função recebe o cliente de quem chama (a
 * tela com a sessão; o lembrete do WhatsApp com a chave de serviço).
 */

export type Recorrencia = "mensal" | "unica";

export type ContaPagar = {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  recorrencia: Recorrencia;
  vence_dia: number | null;
  vence_em: string | null;
  conta_id: string | null;
  ativa: boolean;
  criado_em: string;
};

export type PagamentoConta = {
  id: string;
  user_id: string;
  conta_pagar_id: string;
  competencia: string;
  transacao_id: string | null;
  pago_em: string;
  valor: number;
};

export type SituacaoConta = "atrasada" | "hoje" | "semana" | "depois" | "paga";

export type ItemDoMes = {
  conta: ContaPagar;
  competencia: string;
  vence: string;
  situacao: SituacaoConta;
  pagamento: PagamentoConta | null;
  /** Dias até o vencimento (negativo = atrasada há N dias). */
  dias: number;
};

/** Quantos meses para trás uma conta atrasada continua aparecendo no mês de hoje. */
export const MESES_DE_ATRASO = 3;

// ── Normalização ────────────────────────────────────────────────────────────

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function paraContaPagar(r: Record<string, unknown>): ContaPagar {
  const dia = Number(r.vence_dia);
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    descricao: String(r.descricao ?? ""),
    valor: num(r.valor),
    categoria: String(r.categoria ?? "outros"),
    recorrencia: r.recorrencia === "unica" ? "unica" : "mensal",
    vence_dia: Number.isFinite(dia) && dia >= 1 ? Math.min(31, Math.round(dia)) : null,
    vence_em: r.vence_em ? String(r.vence_em).slice(0, 10) : null,
    conta_id: (r.conta_id as string | null) ?? null,
    ativa: r.ativa !== false,
    criado_em: String(r.criado_em ?? ""),
  };
}

export function paraPagamento(r: Record<string, unknown>): PagamentoConta {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    conta_pagar_id: String(r.conta_pagar_id),
    competencia: String(r.competencia),
    transacao_id: (r.transacao_id as string | null) ?? null,
    pago_em: String(r.pago_em).slice(0, 10),
    valor: num(r.valor),
  };
}

// ── As regras ───────────────────────────────────────────────────────────────

/** Mês (no Brasil) em que a conta foi cadastrada: uma mensal não cobra meses de antes dele. */
function mesDoCadastro(c: ContaPagar): string {
  const t = Date.parse(c.criado_em);
  return Number.isFinite(t) ? hojeNoBrasil(new Date(t)).slice(0, 7) : "0000-00";
}

/** O vencimento da conta na competência `ref`, ou `null` se ela não vence nesse mês. */
export function vencimentoNaCompetencia(c: ContaPagar, ref: string): string | null {
  if (c.recorrencia === "unica") return c.vence_em && c.vence_em.slice(0, 7) === ref ? c.vence_em : null;
  if (!c.vence_dia || ref < mesDoCadastro(c)) return null;
  return diaNoMes(ref, c.vence_dia);
}

function situacaoDe(vence: string, pago: boolean, hoje: string): SituacaoConta {
  if (pago) return "paga";
  const dias = diasEntre(hoje, vence);
  if (dias < 0) return "atrasada";
  if (dias === 0) return "hoje";
  if (dias <= 7) return "semana";
  return "depois";
}

/**
 * A lista do mês `ref`. No mês de HOJE entram também as que ficaram sem pagar
 * nos `MESES_DE_ATRASO` meses anteriores (como "atrasada"): conta vencida no
 * dia 30 não pode sumir da tela no dia 1º.
 */
export function itensDoMes(
  contas: ContaPagar[],
  pagamentos: PagamentoConta[],
  ref: string,
  hoje: string = hojeNoBrasil(),
): ItemDoMes[] {
  const pagoDe = new Map(pagamentos.map((p) => [`${p.conta_pagar_id}|${p.competencia}`, p]));
  const competencias = [ref];
  if (ref === hoje.slice(0, 7)) for (let i = 1; i <= MESES_DE_ATRASO; i++) competencias.push(mesVizinho(ref, -i));

  const itens: ItemDoMes[] = [];
  for (const conta of contas) {
    for (const competencia of competencias) {
      const vence = vencimentoNaCompetencia(conta, competencia);
      if (!vence) continue;
      const pagamento = pagoDe.get(`${conta.id}|${competencia}`) ?? null;
      // Pausada: some daqui para a frente, mas o que já foi pago continua na lista.
      if (!conta.ativa && !pagamento) continue;
      // Mês passado: só entra se ficou sem pagar.
      if (competencia !== ref && pagamento) continue;
      itens.push({ conta, competencia, vence, pagamento, situacao: situacaoDe(vence, Boolean(pagamento), hoje), dias: diasEntre(hoje, vence) });
    }
  }
  return itens.sort((a, b) => a.vence.localeCompare(b.vence) || a.conta.descricao.localeCompare(b.conta.descricao));
}

export function totaisDoMes(itens: ItemDoMes[]) {
  let aPagar = 0;
  let pago = 0;
  let atrasado = 0;
  for (const i of itens) {
    if (i.pagamento) pago += i.pagamento.valor;
    else {
      aPagar += i.conta.valor;
      if (i.situacao === "atrasada") atrasado += i.conta.valor;
    }
  }
  return { aPagar: arred(aPagar), pago: arred(pago), atrasado: arred(atrasado) };
}

/** As que ainda faltam pagar: atrasadas, de hoje e dos próximos `dias` dias. Para o cartão do Início. */
export function proximasContas(itens: ItemDoMes[], dias = 7): ItemDoMes[] {
  return itens.filter((i) => !i.pagamento && i.dias <= dias);
}

/** As contas sem pagar que vencem exatamente em `dia` (o lembrete do WhatsApp, com `dia` = amanhã). */
export function vencemNoDia(contas: ContaPagar[], pagamentos: PagamentoConta[], dia: string): ItemDoMes[] {
  const ref = dia.slice(0, 7);
  return itensDoMes(contas, pagamentos, ref, somarDias(dia, -1)).filter(
    (i) => !i.pagamento && i.vence === dia && i.competencia === ref,
  );
}

// ── Leitura ─────────────────────────────────────────────────────────────────

/** Todas as contas a pagar (ativas e pausadas). Sem o SQL dos cartões: ErroDados "sem-tabela". */
export async function lerContasPagar(sb: SupabaseClient, uid: string): Promise<ContaPagar[]> {
  const { data, error } = await sb
    .from("ncash_contas_pagar")
    .select("*")
    .eq("user_id", uid)
    .order("criado_em")
    .range(0, 999);
  checarCartoes(error);
  return ((data ?? []) as Record<string, unknown>[]).map(paraContaPagar);
}

/** Os pagamentos de `desde` (competência "yyyy-mm") até `ate`. */
export async function lerPagamentos(sb: SupabaseClient, uid: string, desde: string, ate: string): Promise<PagamentoConta[]> {
  const { data, error } = await sb
    .from("ncash_contas_pagas")
    .select("*")
    .eq("user_id", uid)
    .gte("competencia", desde)
    .lte("competencia", ate)
    .range(0, 1999);
  checarCartoes(error);
  return ((data ?? []) as Record<string, unknown>[]).map(paraPagamento);
}

/** O que a tela e o Início precisam para o mês `ref`, numa ida só. */
export async function carregarMesDeContas(sb: SupabaseClient, uid: string, ref: string, hoje = hojeNoBrasil()) {
  const [contas, pagamentos] = await Promise.all([
    lerContasPagar(sb, uid),
    lerPagamentos(sb, uid, mesVizinho(ref, -MESES_DE_ATRASO), ref),
  ]);
  return { contas, pagamentos, itens: itensDoMes(contas, pagamentos, ref, hoje) };
}

// ── Gravação ────────────────────────────────────────────────────────────────

export type DadosContaPagar = {
  descricao: string;
  valor: number;
  categoria: string;
  recorrencia: Recorrencia;
  vence_dia: number | null;
  vence_em: string | null;
  conta_id: string | null;
  ativa: boolean;
};

export async function salvarContaPagar(sb: SupabaseClient, uid: string, id: string | null, d: DadosContaPagar) {
  const campos = {
    ...d,
    vence_dia: d.recorrencia === "mensal" ? d.vence_dia : null,
    vence_em: d.recorrencia === "unica" ? d.vence_em : null,
  };
  const { error } = id
    ? await sb.from("ncash_contas_pagar").update(campos).eq("id", id).eq("user_id", uid)
    : await sb.from("ncash_contas_pagar").insert({ ...campos, user_id: uid });
  checarCartoes(error);
}

/** Apaga a conta e o histórico de pagamentos dela. Os lançamentos que ela gerou continuam no Extrato. */
export async function apagarContaPagar(sb: SupabaseClient, uid: string, id: string) {
  const { error } = await sb.from("ncash_contas_pagar").delete().eq("id", id).eq("user_id", uid);
  checarCartoes(error);
}

export type DadosPagamento = { valor: number; data: string; conta_id: string | null };

/**
 * "Paguei": cria o lançamento no Extrato (origem manual) e registra o
 * pagamento da competência. Se o registro falhar (por exemplo, a outra pessoa
 * da conta acabou de marcar), o lançamento é desfeito — nunca fica um gasto
 * sem o "paga" ao lado, nem um "paga" contado duas vezes.
 */
export async function marcarComoPaga(sb: SupabaseClient, uid: string, item: ItemDoMes, d: DadosPagamento) {
  const { data: t, error: e1 } = await sb
    .from("ncash_transacoes")
    .insert({
      user_id: uid,
      conta_id: d.conta_id,
      data: d.data,
      descricao: item.conta.descricao.slice(0, 120),
      valor: d.valor,
      tipo: "saida",
      categoria: item.conta.categoria,
      origem: "manual",
      observacao: `Conta a pagar · competência ${item.competencia.slice(5, 7)}/${item.competencia.slice(0, 4)}`,
    })
    .select("id")
    .single();
  checarCartoes(e1);
  const transacaoId = String((t as { id: unknown }).id);

  const { error: e2 } = await sb.from("ncash_contas_pagas").insert({
    user_id: uid,
    conta_pagar_id: item.conta.id,
    competencia: item.competencia,
    transacao_id: transacaoId,
    pago_em: d.data,
    valor: d.valor,
  });
  if (e2) {
    await sb.from("ncash_transacoes").delete().eq("id", transacaoId).eq("user_id", uid);
    if ((e2 as { code?: string }).code === "23505") throw new ErroDados("falha", "ja-paga");
    checarCartoes(e2);
  }
}

/**
 * Desfazer: apaga o lançamento e depois o registro. Nessa ordem de propósito:
 * se a segunda parte falhar, a conta fica "paga" sem lançamento (inofensivo) —
 * a ordem inversa poderia deixar um gasto órfão e, no "Paguei" seguinte, o
 * mesmo gasto duas vezes no Extrato.
 */
export async function desfazerPagamento(sb: SupabaseClient, uid: string, p: PagamentoConta) {
  if (p.transacao_id) {
    const { error } = await sb.from("ncash_transacoes").delete().eq("id", p.transacao_id).eq("user_id", uid);
    checarCartoes(error);
  }
  const { error } = await sb.from("ncash_contas_pagas").delete().eq("id", p.id).eq("user_id", uid);
  checarCartoes(error);
}
