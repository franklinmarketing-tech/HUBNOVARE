import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ErroMcp, type Qualquer } from "./bancomcp-servidor";

/**
 * CONNECT SESSION DO BANCO MCP (21/11/2026) — o banco nasce DE QUEM conectou.
 *
 * Antes, o link de conexão era o mesmo para todo mundo (o do Claude) e o NovareCash ADIVINHAVA de
 * quem era cada conexão nova pela hora e pelo banco escolhido (`claim`, com disputa e confirmação
 * pelo final da conta). E aquele link, sem `add_only`, mostrava a tela de DONO da mcp.ai: a lista
 * das conexões da conta (que é uma só, com os bancos de todos os clientes) e o "Desconectar".
 *
 * Agora cada toque em "Conectar" cria uma SESSÃO só daquela pessoa:
 *   1. `POST /api/connect-sessions` com um `client_ref` NOSSO, aleatório (nunca o id ou o e-mail da
 *      pessoa: a mcp.ai não precisa saber quem ela é). A sessão fica em `ncash_of_sessoes`.
 *   2. O `connect_url` que volta é de uso único, já em modo embarcado (só escolher o banco e
 *      autorizar) e, no fim, devolve a pessoa para `ROTA_RETORNO` em vez de ir para o claude.ai.
 *   3. QUEM CONFIRMA É O SERVIDOR, NUNCA A URL: os `cs`/`client_ref`/`status` da volta passam pelo
 *      navegador e podem ser editados. A conexão só é ligada depois de `GET /api/connect-sessions/{id}`
 *      dizer `connected` (ou do webhook `connection.created`, que vem assinado).
 *
 * As três portas de entrada (a conferência do app, a página de volta e o webhook) caem em
 * `concluirSessao`, que é idempotente: a segunda a chegar só confirma o que a primeira gravou.
 *
 * Doc: painel da mcp.ai, manifesto `app.mcp.ai/api/_endpoints`, grupo "Connect Sessions".
 */

/** O Banco MCP instalado na conta da Novare (aparece na URL do painel). Não é segredo. */
export const INSTALL_BANCO_MCP = process.env.BANCO_MCP_INSTALL_ID || "mi_p670e93epygy";
export const ROTA_RETORNO = "/novarecash/banco-conectado";

export type LinhaSessao = {
  cs: string;
  ref: string;
  user_id: string;
  connector_id: string | null;
  banco: string | null;
  status: string;
  item_id: string | null;
};

/** Uma chamada à API de sessões (base api.mcp.ai, a mesma chave do Open Finance). */
async function api(metodo: "GET" | "POST", caminho: string, corpo?: Record<string, unknown>): Promise<Qualquer> {
  const r = await fetch(`https://api.mcp.ai/api/${caminho}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${process.env.BANCO_MCP_KEY}`,
      ...(corpo ? { "Content-Type": "application/json" } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const payload: Qualquer = await r.json().catch(() => null);
  if (r.ok) return payload ?? {};
  const texto = JSON.stringify(payload ?? {}).slice(0, 300);
  console.warn(`[open-finance] sessão ${metodo} ${caminho.split("/").slice(0, 2).join("/")} HTTP ${r.status}`, texto);
  if (r.status === 401 || r.status === 403) throw new ErroMcp(503, "banco_mcp_key", "chave do Banco MCP recusada para sessões");
  if (r.status === 429) throw new ErroMcp(429, "limite", "muitas chamadas ao Banco MCP");
  throw new ErroMcp(502, "falha", `Banco MCP respondeu ${r.status}`);
}

const texto = (...v: Qualquer[]) => {
  for (const x of v) if (typeof x === "string" && x.trim()) return x.trim();
  return "";
};

/**
 * O objeto da sessão dentro da resposta, onde quer que ele venha (`result`, `session`, `data` ou
 * solto). 21/11/2026: no 1º teste real a sessão veio com `id`, `status`, `expires_at`… mas o
 * `connect_url` NÃO estava junto dela — por isso o link é procurado na resposta inteira (`acharLink`).
 */
function acharSessao(p: Qualquer): Qualquer {
  for (const c of [p?.session, p?.result?.session, p?.data?.session, p?.result, p?.data, p]) {
    if (c && typeof c === "object" && (c.id || c.cs || c.client_ref)) return c;
  }
  return p ?? {};
}

/** O link de conexão: o primeiro campo de link https da mcp.ai, em qualquer nível da resposta. */
function acharLink(x: Qualquer, nivel = 0): string {
  if (!x || typeof x !== "object" || nivel > 4) return "";
  for (const k of ["connect_url", "connectUrl", "url", "link", "href"]) {
    const v = x[k];
    if (typeof v === "string" && /^https:\/\/app\.mcp\.ai\//.test(v)) return v;
  }
  for (const v of Object.values(x)) {
    const achou = acharLink(v, nivel + 1);
    if (achou) return achou;
  }
  return "";
}

/**
 * Cria a sessão e guarda de quem ela é. Devolve o link de uso único.
 * `origem`: o endereço do próprio Hub (a volta precisa ser https; http só em localhost).
 */
export async function criarSessao(
  db: SupabaseClient,
  opcoes: { userId: string; origem: string; connectorId?: string; banco?: string },
): Promise<{ cs: string; url: string }> {
  const ref = `ncs_${randomUUID().replace(/-/g, "")}`;
  const conector = (opcoes.connectorId ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  const r = await api("POST", "connect-sessions", {
    install_id: INSTALL_BANCO_MCP,
    client_ref: ref,
    redirect_uri: `${opcoes.origem}${ROTA_RETORNO}`,
    flow: "quick",
    lang: "pt-BR",
    expires_in: 3600,
    ...(conector ? { bank_id: conector } : {}),
  });
  const s = acharSessao(r);
  const url = acharLink(r);
  const cs = texto(s?.id, s?.cs, s?.session_id, s?.connect_session_id);
  if (!url || !cs) {
    // Só os NOMES dos campos (nunca os valores): para ajustar a leitura se a mcp.ai mudar o formato.
    const chaves = (o: Qualquer) => (o && typeof o === "object" ? Object.keys(o).join(",") : typeof o);
    console.warn("[open-finance] sessão sem connect_url/id", `raiz: ${chaves(r)}`, `sessão: ${chaves(s)}`, `result: ${chaves(r?.result)}`);
    throw new ErroMcp(502, "falha", "sessão sem link");
  }
  const { error } = await db.from("ncash_of_sessoes").insert({
    cs,
    ref,
    user_id: opcoes.userId,
    connector_id: conector || null,
    banco: (opcoes.banco ?? "").slice(0, 80) || null,
  });
  // Sem a tabela (SQL ainda não rodado), a sessão não teria dono: quem chamou volta ao fluxo antigo.
  if (error) throw new ErroMcp(503, "sem_tabela_sessao", error.message);
  return { cs, url };
}

/** O que a mcp.ai diz da sessão agora: `pending | connected (+ connection_id) | expired | canceled`. */
export async function statusNaMcp(cs: string): Promise<{ status: string; itemId: string }> {
  const r = await api("GET", `connect-sessions/${encodeURIComponent(cs)}`);
  const s = acharSessao(r);
  return {
    status: texto(s?.status).toLowerCase() || "pending",
    itemId: texto(s?.connection_id, s?.connectionId, s?.connection?.id, s?.item_id),
  };
}

export type Conclusao =
  | { ok: true; itemId: string; banco: string | null }
  | { ok: false; status: string; mensagem?: string };

/**
 * LIGA O BANCO À PESSOA DONA DA SESSÃO. Idempotente.
 * `itemId` só vem de fonte confiável: o GET da sessão ou o webhook assinado.
 */
export async function concluirSessao(db: SupabaseClient, linha: LinhaSessao, itemId: string): Promise<Conclusao> {
  if (linha.status === "connected" && linha.item_id) return { ok: true, itemId: linha.item_id, banco: linha.banco };
  if (!itemId) return { ok: false, status: linha.status };

  const { error } = await db
    .from("vidaplan_open_finance")
    .insert({ user_id: linha.user_id, item_id: itemId, connector_name: linha.banco, status: null });
  if (error && (error as Qualquer).code !== "23505") throw new ErroMcp(500, "falha", error.message);

  // A conexão nasceu com o client_ref DESTA sessão: ninguém mais pode ser dono dela. Se alguém
  // aparecer (só se o claim antigo a tivesse pegado), não se mexe no outro: marca e avisa.
  const { data: donos } = await db.from("vidaplan_open_finance").select("user_id").eq("item_id", itemId);
  const outros = (donos ?? []).filter((d: Qualquer) => d.user_id !== linha.user_id);
  if (outros.length) {
    console.error("[open-finance] sessão com item de outro dono", linha.cs);
    await db.from("ncash_of_sessoes").update({ status: "conflito", item_id: itemId }).eq("cs", linha.cs);
    return { ok: false, status: "conflito", mensagem: "Essa conexão ficou presa a outra conta. Fale com a gente." };
  }

  await db
    .from("ncash_of_sessoes")
    .update({ status: "connected", item_id: itemId, concluido_em: new Date().toISOString() })
    .eq("cs", linha.cs);
  await db.from("ncash_of_pedidos").delete().eq("user_id", linha.user_id).then(() => undefined);
  return { ok: true, itemId, banco: linha.banco };
}

/**
 * Confere uma sessão (pela conferência do app ou pela página de volta): se a mcp.ai diz
 * `connected`, conclui. Sessão expirada ou cancelada fica marcada para o app parar de esperar.
 */
export async function conferirSessao(db: SupabaseClient, linha: LinhaSessao): Promise<Conclusao> {
  if (linha.status === "connected" && linha.item_id) return { ok: true, itemId: linha.item_id, banco: linha.banco };
  if (linha.status !== "pending") return { ok: false, status: linha.status };
  const { status, itemId } = await statusNaMcp(linha.cs);
  if (status === "connected" && itemId) return concluirSessao(db, linha, itemId);
  if (status === "expired" || status === "canceled") {
    await db.from("ncash_of_sessoes").update({ status }).eq("cs", linha.cs).eq("status", "pending");
    return { ok: false, status };
  }
  return { ok: false, status: "pending" };
}

export async function sessaoPorCs(db: SupabaseClient, cs: string): Promise<LinhaSessao | null> {
  if (!/^[A-Za-z0-9_-]{4,120}$/.test(cs)) return null;
  const { data } = await db.from("ncash_of_sessoes").select("cs, ref, user_id, connector_id, banco, status, item_id").eq("cs", cs).maybeSingle();
  return (data as LinhaSessao | null) ?? null;
}

export async function sessaoPorRef(db: SupabaseClient, ref: string): Promise<LinhaSessao | null> {
  if (!/^ncs_[a-f0-9]{32}$/.test(ref)) return null;
  const { data } = await db.from("ncash_of_sessoes").select("cs, ref, user_id, connector_id, banco, status, item_id").eq("ref", ref).maybeSingle();
  return (data as LinhaSessao | null) ?? null;
}
