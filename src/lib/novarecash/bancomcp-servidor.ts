import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * BANCO MCP NO SERVIDOR (13/11/2026): a chamada à API (`mcp`) e o DESLIGAR de um banco, usados pela
 * rota do Open Finance (`/api/novarecash/openfinance`), pelo corte da assinatura (webhook da Kiwify) e
 * pela limpeza diária. Só roda no servidor: usa `BANCO_MCP_KEY`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Qualquer = any;

export class ErroMcp extends Error {
  constructor(
    public http: number,
    public code: string,
    msg: string,
  ) {
    super(msg);
  }
}

export const lista = (x: Qualquer, ...chaves: string[]): Qualquer[] => {
  if (Array.isArray(x)) return x;
  for (const k of chaves) if (Array.isArray(x?.[k])) return x[k];
  return [];
};

/**
 * Espera antes de cada nova tentativa num 429. A conta da mcp.ai aceita 60 chamadas por minuto, e
 * importar 12 meses de dois bancos passa disso (21/11/2026: o 1º teste real perdeu os lançamentos
 * dos dois bancos por desistir depois de UMA espera de 2 s). Até ~17 s no total, dentro dos 300 s.
 */
const ESPERAS_429 = [2000, 5000, 10_000];

/** Uma chamada ao Banco MCP. Erro vira `ErroMcp`; 429 tenta de novo, esperando cada vez mais. */
export async function mcp(endpoint: string, body: Record<string, unknown>, tentativa = 0): Promise<Qualquer> {
  const r = await fetch(`https://api.mcp.ai/api/openfinance/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BANCO_MCP_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(45_000),
  });
  const payload: Qualquer = await r.json().catch(() => null);
  if (r.ok) return payload?.result ?? payload ?? {};
  if (r.status === 429 && tentativa < ESPERAS_429.length) {
    // Se a mcp.ai disser quanto esperar (Retry-After, em segundos), respeita — até 20 s.
    const pedido = Number(r.headers.get("retry-after"));
    const espera = Number.isFinite(pedido) && pedido > 0 ? Math.min(pedido * 1000, 20_000) : ESPERAS_429[tentativa];
    await new Promise((ok) => setTimeout(ok, espera));
    return mcp(endpoint, body, tentativa + 1);
  }
  const texto = JSON.stringify(payload ?? {}).slice(0, 300);
  if (r.status === 409 || /not_connected/i.test(texto)) throw new ErroMcp(409, "not_connected", "not_connected");
  if (r.status === 401 || r.status === 403) throw new ErroMcp(503, "banco_mcp_key", "chave do Banco MCP recusada");
  if (r.status === 429) throw new ErroMcp(429, "limite", "muitas chamadas ao Banco MCP");
  console.warn(`[open-finance] ${endpoint} HTTP ${r.status}`, texto);
  throw new ErroMcp(502, "falha", `Banco MCP respondeu ${r.status}`);
}

const itemDaResposta = (x: Qualquer) => String(x?.item_id || x?.itemId || x?.item?.id || "");
const idDaConta = (a: Qualquer) => String(a?.account_id || a?.id || "");

/**
 * DESLIGA UM BANCO de uma pessoa:
 *   1. lê as contas dele no Banco MCP (antes de revogar, depois ele não lista mais);
 *   2. revoga o consentimento (`connections/disconnect`);
 *   3. no NovareCash, DESATIVA as contas daquele banco (o saldo some do Início, Contas e Cartões) —
 *      ou, com `apagar`, apaga as contas e os lançamentos importados;
 *   4. guarda a conexão como "revogada" (nunca volta a ficar sem dono).
 * `db` é o cliente de serviço (passa por cima do RLS).
 */
export async function desligarItem(
  db: SupabaseClient,
  userId: string,
  itemId: string,
  apagar = false,
): Promise<{ revogado: boolean; contas: number; apagadas: number }> {
  let contasDoBanco: string[] = [];
  try {
    const box = await mcp("accounts/list", { item: itemId, item_id: itemId });
    contasDoBanco = lista(box, "results", "accounts", "items", "data")
      .filter((a) => !itemDaResposta(a) || itemDaResposta(a) === itemId)
      .map(idDaConta)
      .filter(Boolean);
  } catch (e) {
    console.warn("[open-finance] desligar: contas do banco", e instanceof Error ? e.message : e);
  }

  let revogado = false;
  try {
    await mcp("connections/disconnect", { item: itemId });
    revogado = true;
  } catch (e) {
    console.warn("[open-finance] connections/disconnect falhou", e instanceof Error ? e.message : e);
  }

  // As contas no NovareCash: por item_id (SQL v2) e/ou pelo id da conta no banco.
  const locais = new Set<string>();
  const porItem = await db.from("ncash_contas").select("id").eq("user_id", userId).eq("origem", "openfinance").eq("item_id", itemId);
  if (!porItem.error) (porItem.data ?? []).forEach((l: Qualquer) => locais.add(String(l.id)));
  if (contasDoBanco.length) {
    const { data } = await db.from("ncash_contas").select("id").eq("user_id", userId).eq("origem", "openfinance").in("externo_id", contasDoBanco);
    (data ?? []).forEach((l: Qualquer) => locais.add(String(l.id)));
  }
  const ids = [...locais];
  let apagadas = 0;
  if (ids.length) {
    if (apagar) {
      const { count } = await db.from("ncash_transacoes").delete({ count: "exact" }).eq("user_id", userId).eq("origem", "openfinance").in("conta_id", ids);
      apagadas = count ?? 0;
      await db.from("ncash_contas").delete().eq("user_id", userId).eq("origem", "openfinance").in("id", ids);
    } else {
      // O saldo some (conta inativa); o histórico fica. 'desligado' deixa a conta voltar se reconectar.
      const r = await db.from("ncash_contas").update({ ativa: false, item_id: "desligado" }).eq("user_id", userId).in("id", ids);
      if (r.error) await db.from("ncash_contas").update({ ativa: false }).eq("user_id", userId).in("id", ids);
    }
  }

  const { error } = await db.from("vidaplan_open_finance").update({ status: "revogada" }).eq("user_id", userId).eq("item_id", itemId);
  if (error) throw new ErroMcp(500, "falha", error.message);
  return { revogado, contas: ids.length, apagadas };
}

/** Desliga TODOS os bancos de uma pessoa (assinatura cortada ou vencida — LGPD). */
export async function desligarTodos(db: SupabaseClient, userId: string): Promise<number> {
  const { data } = await db.from("vidaplan_open_finance").select("item_id, status").eq("user_id", userId);
  const ativos = (data ?? []).filter((l: Qualquer) => String(l.status ?? "").toLowerCase() !== "revogada");
  for (const l of ativos) {
    try {
      await desligarItem(db, userId, String(l.item_id));
    } catch (e) {
      console.warn("[open-finance] desligarTodos", userId, e instanceof Error ? e.message : e);
    }
  }
  return ativos.length;
}

/** O id do usuário pelo e-mail (a tabela de assinantes guarda só o e-mail). */
export async function usuarioPorEmail(db: SupabaseClient, email: string): Promise<string | null> {
  const alvo = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const achou = data.users.find((u) => (u.email ?? "").toLowerCase() === alvo);
    if (achou) return achou.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
