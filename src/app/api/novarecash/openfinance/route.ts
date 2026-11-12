import { NextResponse } from "next/server";
import { excedeuLimitePorIp } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { servico } from "@/lib/novarecash/assinantes";

/**
 * OPEN FINANCE DO NOVARECASH, NO PRÓPRIO HUB (12/11/2026).
 *
 * Substitui a Edge Function `rapid-responder` do app antigo (novareapp, que não é mais usado): o
 * Hub fala com o Banco MCP daqui, com a chave `BANCO_MCP_KEY` na Vercel (nunca no navegador).
 *
 * A CONTA DO BANCO MCP É UMA SÓ (a da Novare, plano PF Ilimitado) e guarda os bancos de TODOS os
 * clientes. Por isso cada pessoa só enxerga as conexões que REIVINDICOU (tabela
 * `vidaplan_open_finance`, por `user_id`) — inclusive a equipe, que só não tem limite de plano.
 *
 * As regras de segurança (todas pensando em vários clientes na mesma conta):
 *   1. CLAIM: só conexão sem dono; com `desde` (a hora do toque em "Conectar"), só a que nasceu depois;
 *      várias candidatas → a pessoa escolhe (`escolher`); limite do plano conferido AQUI.
 *   2. NUNCA chamar o Banco MCP sem `item` quando a conta tem mais de uma conexão (sem item, ele
 *      responde com a conexão padrão DA CONTA — que pode ser de outro cliente).
 *   3. FORGET revoga no Banco MCP e guarda a linha como "revogada": sumida, a conexão voltaria a ficar
 *      "sem dono" e outro cliente poderia reivindicá-la.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERMITIDOS = new Set([
  "connections/list", "accounts/list", "accounts/balance", "transactions/list",
  "investments/list", "investments/transactions/list", "credit-card-bills/list", "loans/list",
  "connectors/search", "categories/list",
]);
const SEM_ITEM = new Set(["connectors/search", "categories/list"]);
const LIMITE_PLANO: Record<string, number> = { essencial: 1, plus: 3, premium: 10 };

const erro = (mensagem: string, status: number, code?: string) => NextResponse.json({ error: { message: mensagem, code } }, { status });
const ok = (result: unknown) => NextResponse.json({ result });

/* eslint-disable @typescript-eslint/no-explicit-any */
type Qualquer = any;
const lista = (x: Qualquer, ...chaves: string[]): Qualquer[] => {
  if (Array.isArray(x)) return x;
  for (const k of chaves) if (Array.isArray(x?.[k])) return x[k];
  return [];
};

async function mcp(endpoint: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.mcp.ai/api/openfinance/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BANCO_MCP_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(45_000),
  });
  const payload: Qualquer = await r.json().catch(() => ({ error: "resposta inválida do Banco MCP" }));
  return { status: r.status, payload, box: payload?.result ?? payload };
}

const itemDe = (c: Qualquer) => String(c?.item_id || c?.id || c?.itemId || c?.connection_id || "");
const bancoDe = (c: Qualquer) => c?.connector_name || c?.connector?.name || c?.connector_id || c?.name || null;
const criadoDe = (c: Qualquer) => {
  const t = Date.parse(String(c?.created_at || c?.createdAt || c?.connected_at || c?.connectedAt || c?.created || ""));
  return Number.isFinite(t) ? t : null;
};

export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "novarecash-openfinance", 90)) return erro("Muitas chamadas seguidas. Espere um minuto.", 429);
  if (!process.env.BANCO_MCP_KEY) return erro("BANCO_MCP_KEY não configurada", 503, "banco_mcp_key");

  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getUser();
  const usuario = sessao.user;
  if (!usuario) return erro("Sessão expirada", 401);
  if (!(await temAcessoNovareCash())) return erro("O Open Finance faz parte do NovareCash.", 403);

  const db = servico();
  if (!db) return erro("serviço indisponível", 503);

  const pedido = (await req.json().catch(() => null)) as { endpoint?: string; body?: Record<string, unknown> } | null;
  const endpoint = String(pedido?.endpoint ?? "");
  const corpo = (pedido?.body ?? {}) as Record<string, Qualquer>;

  const { data: perfil } = await db.from("hub_profiles").select("role").eq("id", usuario.id).maybeSingle();
  const equipe = ["admin", "equipe"].includes(String(perfil?.role ?? ""));

  // As conexões da pessoa (as revogadas não contam).
  const { data: linhas } = await db.from("vidaplan_open_finance").select("item_id, connector_name, status").eq("user_id", usuario.id);
  const minhas = (linhas ?? []).filter((l: Qualquer) => String(l.status ?? "").toLowerCase() !== "revogada");

  // ── Link para conectar um banco ──
  if (endpoint === "connect-url") {
    const { box } = await mcp("connections/list", {});
    return ok({ url: box?.add_connection_url || box?.connect_url || null });
  }

  // ── Reivindicar o banco que a pessoa acabou de conectar ──
  if (endpoint === "claim") {
    const email = String(usuario.email ?? "").toLowerCase();
    if (!equipe) {
      const { data: assin } = await db.from("ncash_assinantes").select("plano").eq("email", email).maybeSingle();
      const limite = LIMITE_PLANO[String(assin?.plano ?? "").toLowerCase()] ?? 1;
      if (minhas.length >= limite) {
        return ok({ claimed: false, limite: true, message: `O seu plano conecta até ${limite} banco${limite > 1 ? "s" : ""}.` });
      }
    }

    const { status, box } = await mcp("connections/list", {});
    if (status === 409) return erro("not_connected", 409, "not_connected");
    const conexoes = lista(box, "connections", "results", "items", "data");

    const [{ data: todas }, { data: doAppAntigo }] = await Promise.all([
      db.from("vidaplan_open_finance").select("item_id"),
      db.from("client_connections").select("item_id"),
    ]);
    // Com dono = já reivindicada por alguém (inclusive revogadas: nunca voltam a outra pessoa).
    const comDono = new Set([...(todas ?? []), ...(doAppAntigo ?? [])].map((l: Qualquer) => String(l.item_id)));
    let candidatas = conexoes.filter((c) => itemDe(c) && !comDono.has(itemDe(c)));

    const escolha = String(corpo.item_id ?? "");
    if (escolha) {
      candidatas = candidatas.filter((c) => itemDe(c) === escolha);
      if (!candidatas.length) return ok({ claimed: false, message: "Essa conexão não está mais disponível. Conecte de novo." });
    } else {
      const desde = Date.parse(String(corpo.desde ?? ""));
      if (Number.isFinite(desde)) {
        const recentes = candidatas.filter((c) => {
          const t = criadoDe(c);
          return t === null || t >= desde - 120_000;
        });
        if (recentes.length) candidatas = recentes;
      }
      if (candidatas.length > 1) {
        return ok({ claimed: false, escolher: candidatas.map((c) => ({ item_id: itemDe(c), connector_name: bancoDe(c), criado: criadoDe(c) })) });
      }
    }
    if (!candidatas.length) return ok({ claimed: false, message: "Ainda não encontramos a sua conexão." });

    const c = candidatas[0];
    const { error } = await db
      .from("vidaplan_open_finance")
      .insert({ user_id: usuario.id, item_id: itemDe(c), connector_name: bancoDe(c), status: c.status ?? null });
    if (error && (error as Qualquer).code !== "23505") return erro(`Não consegui salvar a conexão: ${error.message}`, 500);
    return ok({ claimed: true, count: 1, connector_name: bancoDe(c) });
  }

  // ── Desligar: revoga no Banco MCP e guarda como revogada ──
  if (endpoint === "forget") {
    const itemId = String(corpo.item_id ?? "");
    if (!itemId || !minhas.some((m: Qualquer) => m.item_id === itemId)) return erro("Conexão não encontrada.", 404);
    const rev = await mcp("connections/revoke", { item_id: itemId, item: itemId });
    if (rev.status >= 400) console.warn("[open-finance] revoke falhou", rev.status, JSON.stringify(rev.payload).slice(0, 300));
    const { error } = await db.from("vidaplan_open_finance").update({ status: "revogada" }).eq("user_id", usuario.id).eq("item_id", itemId);
    if (error) return erro(error.message, 500);
    return ok({ ok: true, revogadoNoBanco: rev.status < 400 });
  }

  if (!PERMITIDOS.has(endpoint)) return erro(`Endpoint não permitido: ${endpoint}`, 400);

  if (SEM_ITEM.has(endpoint)) {
    const { status, payload } = await mcp(endpoint, corpo);
    return NextResponse.json(payload, { status });
  }

  if (endpoint === "connections/list") {
    return ok({
      connections: minhas.map((m: Qualquer) => ({ item_id: m.item_id, connector_name: m.connector_name, status: m.status })),
      count: minhas.length,
    });
  }

  if (!minhas.length) return ok({ results: [] });

  // Regra 2: sem item SÓ quando a conta inteira tem uma conexão.
  const { status: stConta, box: boxConta } = await mcp("connections/list", {});
  if (stConta === 409) return erro("not_connected", 409, "not_connected");
  const totalNaConta = lista(boxConta, "connections", "results", "items", "data").length;
  const semItem = minhas.length === 1 && totalNaConta <= 1;

  const precisaConta = endpoint === "transactions/list" || endpoint === "credit-card-bills/list";
  const juntos: Qualquer[] = [];
  const empurra = (x: Qualquer) => {
    if (x && typeof x === "object" && Array.isArray(x.results)) x.results.forEach((y: Qualquer) => juntos.push(y));
    else juntos.push(x);
  };
  // `account_id` vindo do navegador só vale se a conta for de uma conexão desta pessoa (conferido abaixo).
  const contaPedida = corpo.account_id ? String(corpo.account_id) : null;
  let contaConferida = false;

  for (const m of minhas) {
    const base: Record<string, unknown> = semItem ? {} : { item_id: m.item_id, item: m.item_id };
    const extra: Record<string, unknown> = { ...corpo };
    delete extra.debug;

    if (precisaConta || contaPedida) {
      const { box: boxContas } = await mcp("accounts/list", { ...base });
      const contas = lista(boxContas, "results", "accounts", "items", "data");
      for (const a of contas) {
        const id = String(a.account_id || a.id || "");
        if (!id) continue;
        if (contaPedida && id !== contaPedida) continue;
        if (endpoint === "credit-card-bills/list" && String(a.type || "").toUpperCase() !== "CREDIT") continue;
        if (contaPedida) contaConferida = true;
        if (!precisaConta && endpoint !== "accounts/balance") continue;
        const { box } = await mcp(endpoint, { ...base, ...extra, account_id: id });
        lista(box, "transactions", "bills", "balances", "results", "items", "data").forEach(empurra);
        if (endpoint === "accounts/balance" && box && !Array.isArray(box) && !lista(box, "balances", "results").length) juntos.push(box);
      }
    } else {
      const { box } = await mcp(endpoint, { ...base, ...extra });
      lista(box, "accounts", "investments", "transactions", "bills", "loans", "results", "items", "data").forEach(empurra);
    }
  }
  if (contaPedida && !contaConferida) return erro("Conta não encontrada.", 404);
  return ok({ results: juntos });
}
