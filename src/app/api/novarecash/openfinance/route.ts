import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { excedeuLimitePorIp } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { servico } from "@/lib/novarecash/assinantes";

/**
 * OPEN FINANCE DO NOVARECASH, NO PRÓPRIO HUB (12/11/2026; revisado na varredura do mesmo dia).
 *
 * Substitui a Edge Function `rapid-responder` do app antigo: o Hub fala com o Banco MCP daqui, com a
 * chave `BANCO_MCP_KEY` na Vercel (nunca no navegador).
 *
 * A CONTA DO BANCO MCP É UMA SÓ (a da Novare, plano PF Ilimitado) e guarda os bancos de TODOS os
 * clientes. Cada pessoa só enxerga as conexões que REIVINDICOU (`vidaplan_open_finance`, por
 * `user_id`) — inclusive a equipe.
 *
 * AS REGRAS (todas pensando em vários clientes numa conta só):
 *   1. O NAVEGADOR NUNCA ESCOLHE O BANCO DE QUEM LER: o corpo passa por uma lista branca de campos
 *      (`CAMPOS_LIVRES`) e o `item` vem sempre do servidor, por último.
 *   2. RESPOSTA CONFERIDA: conta/transação/investimento que diga ser de outro `item` é descartada.
 *   3. CLAIM AMARRADO AO SERVIDOR: o "Conectar" grava um cookie ASSINADO com a hora (`PEDIDO`); o
 *      claim só aceita conexão criada DEPOIS dela (`createdAt`), e conexão sem data não entra.
 *      Várias candidatas → a pessoa escolhe entre ELAS (nunca entre todas as sem dono).
 *   4. CORRIDA: depois de gravar, confere se outro usuário também ficou com o item; se sim, desfaz.
 *   5. NUNCA SEM ITEM quando a conta tem mais de uma conexão.
 *   6. ERRO DO BANCO MCP NÃO VIRA "LISTA VAZIA": 401/403 = chave; 409 = desconectado; 429 = calma.
 *   7. ECONOMIA: a lista de conexões da conta e as contas de cada item ficam em cache curto.
 *   8. FORGET revoga no Banco MCP e guarda a linha como "revogada" (nunca volta a ficar sem dono).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERMITIDOS = new Set([
  "connections/list", "accounts/list", "accounts/balance", "transactions/list",
  "investments/list", "credit-card-bills/list", "loans/list", "categories/list",
]);
/** Os únicos campos que o navegador pode mandar (filtros), nunca `item`/`item_id`/`items`. */
const CAMPOS_LIVRES = ["from", "to", "startDate", "endDate", "account_id", "type", "search_queries"] as const;
const LIMITE_PLANO: Record<string, number> = { essencial: 1, plus: 3, premium: 10 };
const PEDIDO = "ncash_of_pedido";
const PAGINAS_MAX = 20;
/** Os bancos que aparecem de cara na escolha (sem digitar). */
const POPULARES = ["nubank", "itau", "bradesco", "banco do brasil", "caixa", "santander", "inter", "mercado pago", "c6", "picpay", "btg", "sicoob", "sicredi"];

/* eslint-disable @typescript-eslint/no-explicit-any */
type Qualquer = any;

class ErroMcp extends Error {
  constructor(public http: number, public code: string, msg: string) {
    super(msg);
  }
}
const resposta = (e: unknown) => {
  if (e instanceof ErroMcp) return NextResponse.json({ error: { message: e.message, code: e.code } }, { status: e.http });
  console.error("[open-finance] erro inesperado", e);
  return NextResponse.json({ error: { message: "falha" } }, { status: 502 });
};
const erro = (mensagem: string, status: number, code?: string) => NextResponse.json({ error: { message: mensagem, code } }, { status });
const ok = (result: unknown) => NextResponse.json({ result });

const lista = (x: Qualquer, ...chaves: string[]): Qualquer[] => {
  if (Array.isArray(x)) return x;
  for (const k of chaves) if (Array.isArray(x?.[k])) return x[k];
  return [];
};

/** Uma chamada ao Banco MCP. Erro vira `ErroMcp` (regra 6); 429 tenta mais uma vez depois de 2 s. */
async function mcp(endpoint: string, body: Record<string, unknown>, tentativa = 0): Promise<Qualquer> {
  const r = await fetch(`https://api.mcp.ai/api/openfinance/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BANCO_MCP_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(45_000),
  });
  const payload: Qualquer = await r.json().catch(() => null);
  if (r.ok) return payload?.result ?? payload ?? {};
  if (r.status === 429 && tentativa === 0) {
    await new Promise((ok) => setTimeout(ok, 2000));
    return mcp(endpoint, body, 1);
  }
  const texto = JSON.stringify(payload ?? {}).slice(0, 300);
  if (r.status === 409 || /not_connected/i.test(texto)) throw new ErroMcp(409, "not_connected", "not_connected");
  if (r.status === 401 || r.status === 403) throw new ErroMcp(503, "banco_mcp_key", "chave do Banco MCP recusada");
  if (r.status === 429) throw new ErroMcp(429, "limite", "muitas chamadas ao Banco MCP");
  console.warn(`[open-finance] ${endpoint} HTTP ${r.status}`, texto);
  throw new ErroMcp(502, "falha", `Banco MCP respondeu ${r.status}`);
}

// ── cache curto (por instância): regra 7 ─────────────────────────────────────
const cache = new Map<string, { ate: number; valor: unknown }>();
async function emCache<T>(chave: string, segundos: number, buscar: () => Promise<T>): Promise<T> {
  const c = cache.get(chave);
  if (c && c.ate > Date.now()) return c.valor as T;
  const valor = await buscar();
  cache.set(chave, { ate: Date.now() + segundos * 1000, valor });
  return valor;
}
const conexoesDaConta = () =>
  emCache("conexoes", 60, async () => {
    const box = await mcp("connections/list", {});
    return { conexoes: lista(box, "connections", "results", "items", "data"), url: box?.add_connection_url || box?.connect_url || null };
  });

const itemDe = (c: Qualquer) => String(c?.item_id || c?.itemId || c?.id || c?.connection_id || "");
const bancoDe = (c: Qualquer) => c?.connector_name || c?.connector?.name || c?.connector_id || c?.name || null;
const criadoDe = (c: Qualquer) => {
  const t = Date.parse(String(c?.createdAt || c?.created_at || c?.connected_at || c?.connectedAt || ""));
  return Number.isFinite(t) ? t : null;
};
/** O `item` que a PRÓPRIA resposta diz ter (quando diz). Regra 2. */
const itemDaResposta = (x: Qualquer) => String(x?.item_id || x?.itemId || x?.item?.id || "");

// ── o pedido de conexão assinado (regra 3) ───────────────────────────────────
const assinar = (texto: string) => createHmac("sha256", `ncash-of:${process.env.BANCO_MCP_KEY}`).update(texto).digest("hex");
function lerPedido(valor: string | undefined, userId: string): number | null {
  if (!valor) return null;
  const [uid, quando, sig] = valor.split(".");
  if (uid !== userId || !quando || !sig) return null;
  const esperada = assinar(`${uid}.${quando}`);
  if (sig.length !== esperada.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(esperada))) return null;
  const t = Number(quando);
  return Number.isFinite(t) && Date.now() - t < 60 * 60_000 ? t : null; // vale 1 hora
}

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

  try {
    const { data: perfil } = await db.from("hub_profiles").select("role").eq("id", usuario.id).maybeSingle();
    const equipe = ["admin", "equipe"].includes(String(perfil?.role ?? ""));

    const { data: linhas } = await db.from("vidaplan_open_finance").select("item_id, connector_name, status").eq("user_id", usuario.id);
    const minhas = (linhas ?? []).filter((l: Qualquer) => String(l.status ?? "").toLowerCase() !== "revogada");

    // ── Os bancos para escolher DENTRO do NovareCash (13/11/2026) ──
    /* Antes a pessoa caía na página da mcp.ai: "Sign in", oferta de plano PJ e o mesmo banco duas vezes
       ("Credenciais", que pede CPF e senha, e "Open Finance"). Agora ela escolhe aqui, e o link já vai
       com o banco certo e o fluxo rápido. Só `open_finance` e pessoa física. */
    if (endpoint === "bancos") {
      const busca = String(corpo.busca ?? "").trim().slice(0, 40);
      const palavras = busca.length >= 2 ? [busca] : POPULARES;
      const bancos = await emCache(`bancos:${palavras.join("|").toLowerCase()}`, 1800, async () => {
        const box = await mcp("connectors/search", { keywords: palavras });
        const vistos = new Set<string>();
        return lista(box, "banks", "results", "connectors", "items", "data")
          .filter((b) => String(b.access ?? "open_finance").toLowerCase() === "open_finance")
          .filter((b) => !b.audience || String(b.audience).toLowerCase() === "pf")
          .map((b) => ({ id: String(b.id ?? ""), nome: String(b.name ?? b.connector_name ?? ""), url: String(b.connect_url ?? ""), logo: b.imageUrl ?? b.image_url ?? b.logo ?? null }))
          .filter((b) => b.url && b.nome && !vistos.has(b.nome.toLowerCase()) && vistos.add(b.nome.toLowerCase()));
      });
      const quando = String(Date.now());
      const r = ok({ bancos });
      r.cookies.set(PEDIDO, `${usuario.id}.${quando}.${assinar(`${usuario.id}.${quando}`)}`, {
        httpOnly: true, secure: true, sameSite: "lax", path: "/api/novarecash/openfinance", maxAge: 3600,
      });
      return r;
    }

    // ── Link para conectar um banco (e o pedido assinado) ──
    if (endpoint === "connect-url") {
      const { url } = await conexoesDaConta();
      const quando = String(Date.now());
      const r = ok({ url });
      r.cookies.set(PEDIDO, `${usuario.id}.${quando}.${assinar(`${usuario.id}.${quando}`)}`, {
        httpOnly: true, secure: true, sameSite: "lax", path: "/api/novarecash/openfinance", maxAge: 3600,
      });
      return r;
    }

    // ── Reivindicar o banco que a pessoa acabou de conectar ──
    if (endpoint === "claim") {
      if (!equipe) {
        const { data: assin } = await db.from("ncash_assinantes").select("plano").eq("email", String(usuario.email ?? "").toLowerCase()).maybeSingle();
        const limite = LIMITE_PLANO[String(assin?.plano ?? "").toLowerCase()] ?? 1;
        if (minhas.length >= limite) {
          return ok({ claimed: false, limite: true, message: `O seu plano conecta até ${limite} banco${limite > 1 ? "s" : ""}.` });
        }
      }
      const desde = lerPedido((await cookies()).get(PEDIDO)?.value, usuario.id);
      // Sem o pedido assinado do "Conectar", ninguém reivindica — nem a equipe (pegaria por engano o banco de um cliente).
      if (desde === null) {
        return ok({ claimed: false, message: "Toque em “Conectar banco” e conecte de novo — o pedido expirou." });
      }

      cache.delete("conexoes"); // a conexão acabou de nascer: lê a lista fresca
      const { conexoes } = await conexoesDaConta();
      const [{ data: todas }, { data: doAppAntigo }] = await Promise.all([
        db.from("vidaplan_open_finance").select("item_id"),
        db.from("client_connections").select("item_id"),
      ]);
      const comDono = new Set([...(todas ?? []), ...(doAppAntigo ?? [])].map((l: Qualquer) => String(l.item_id)));
      let candidatas = conexoes.filter((c) => itemDe(c) && !comDono.has(itemDe(c)));
      candidatas = candidatas.filter((c) => {
        const t = criadoDe(c);
        return t !== null && t >= desde - 60_000; // sem data não entra: não dá para provar de quem é
      });

      const escolha = String(corpo.item_id ?? "");
      if (escolha) candidatas = candidatas.filter((c) => itemDe(c) === escolha);
      else if (candidatas.length > 1) {
        return ok({ claimed: false, escolher: candidatas.map((c) => ({ item_id: itemDe(c), connector_name: bancoDe(c), criado: criadoDe(c) })) });
      }
      if (candidatas.length !== 1) return ok({ claimed: false, message: "Ainda não encontramos a sua conexão." });

      const c = candidatas[0];
      const { error } = await db
        .from("vidaplan_open_finance")
        .insert({ user_id: usuario.id, item_id: itemDe(c), connector_name: bancoDe(c), status: c.status ?? null });
      // Regra 4: alguém mais ficou com o mesmo item (agora ou num toque simultâneo)?
      const { data: donos } = await db.from("vidaplan_open_finance").select("user_id").eq("item_id", itemDe(c));
      const outros = (donos ?? []).filter((d: Qualquer) => d.user_id !== usuario.id);
      if (outros.length) {
        if (!error) await db.from("vidaplan_open_finance").delete().eq("user_id", usuario.id).eq("item_id", itemDe(c));
        return ok({ claimed: false, message: "Essa conexão já está ligada a outra conta. Conecte o seu banco de novo." });
      }
      if (error && (error as Qualquer).code !== "23505") throw new ErroMcp(500, "falha", error.message);
      const r = ok({ claimed: true, count: 1, connector_name: bancoDe(c) });
      r.cookies.delete({ name: PEDIDO, path: "/api/novarecash/openfinance" });
      return r;
    }

    // ── Desligar: revoga no Banco MCP e guarda como revogada ──
    if (endpoint === "forget") {
      const itemId = String(corpo.item_id ?? "");
      if (!itemId || !minhas.some((m: Qualquer) => m.item_id === itemId)) return erro("Conexão não encontrada.", 404);
      let revogado = false;
      for (const caminho of ["connections/revoke", "connections/disconnect"]) {
        try {
          await mcp(caminho, { item: itemId, item_id: itemId });
          revogado = true;
          break;
        } catch (e) {
          console.warn(`[open-finance] ${caminho} falhou`, e instanceof Error ? e.message : e);
        }
      }
      const { error } = await db.from("vidaplan_open_finance").update({ status: "revogada" }).eq("user_id", usuario.id).eq("item_id", itemId);
      if (error) throw new ErroMcp(500, "falha", error.message);
      cache.delete("conexoes");
      return ok({ ok: true, revogadoNoBanco: revogado });
    }

    if (!PERMITIDOS.has(endpoint)) return erro(`Endpoint não permitido: ${endpoint}`, 400);
    if (endpoint === "categories/list") return ok(await mcp(endpoint, {}));

    if (endpoint === "connections/list") {
      // O status de agora vem do Banco MCP (UPDATED, LOGIN_ERROR, OUTDATED…), não do que foi gravado no claim.
      const { conexoes } = await conexoesDaConta();
      const statusDe = new Map(conexoes.map((c) => [itemDe(c), c.status ?? null]));
      return ok({
        connections: minhas.map((m: Qualquer) => ({ item_id: m.item_id, connector_name: m.connector_name, status: statusDe.get(m.item_id) ?? m.status })),
        count: minhas.length,
      });
    }

    if (!minhas.length) return ok({ results: [] });

    // Regra 1: só os filtros da lista branca.
    const filtros: Record<string, unknown> = {};
    for (const k of CAMPOS_LIVRES) if (corpo[k] !== undefined) filtros[k] = corpo[k];

    // Regra 5.
    const { conexoes } = await conexoesDaConta();
    const semItem = minhas.length === 1 && conexoes.length <= 1;
    const baseDe = (itemId: string): Record<string, unknown> => (semItem ? {} : { item: itemId, item_id: itemId });

    const contasDo = (itemId: string) =>
      emCache(`contas:${itemId}`, 120, async () => {
        const box = await mcp("accounts/list", { ...baseDe(itemId) });
        return lista(box, "results", "accounts", "items", "data").filter((a) => {
          const dono = itemDaResposta(a);
          return !dono || dono === itemId; // regra 2
        });
      });

    const juntos: Qualquer[] = [];
    const contaPedida = filtros.account_id ? String(filtros.account_id) : null;
    let contaConferida = false;

    for (const m of minhas) {
      const itemId = String(m.item_id);
      const base = baseDe(itemId);

      if (endpoint === "accounts/list") {
        (await contasDo(itemId)).forEach((a) => juntos.push({ ...a, item_id: itemId }));
        continue;
      }

      if (endpoint === "transactions/list" || endpoint === "credit-card-bills/list" || endpoint === "accounts/balance") {
        for (const a of await contasDo(itemId)) {
          const id = String(a.account_id || a.id || "");
          if (!id || (contaPedida && id !== contaPedida)) continue;
          if (endpoint === "credit-card-bills/list" && String(a.type || "").toUpperCase() !== "CREDIT") continue;
          if (contaPedida) contaConferida = true;

          if (endpoint === "accounts/balance") {
            const box = await mcp(endpoint, { ...filtros, account_id: id, account_ids: [id], ...base });
            const itens = lista(box, "balances", "results", "items", "data");
            (itens.length ? itens : [box]).forEach((b) => juntos.push({ ...b, account_id: b.account_id ?? id, item_id: itemId }));
            continue;
          }

          // Transações e faturas: TODAS as páginas (antes vinha só a primeira e o resto sumia).
          for (let pagina = 1; pagina <= PAGINAS_MAX; pagina++) {
            const box = await mcp(endpoint, { ...filtros, page: pagina, page_size: endpoint === "transactions/list" ? 500 : 100, account_id: id, ...base });
            lista(box, "transactions", "bills", "results", "items", "data").forEach((x) => juntos.push({ ...x, account_id: x.account_id ?? id, item_id: itemId }));
            const total = Number(box?.totalPages ?? box?.total_pages ?? box?.pagination?.totalPages ?? 1);
            if (!Number.isFinite(total) || pagina >= total) break;
          }
        }
        continue;
      }

      // investments/list e loans/list: por item, resposta conferida.
      const box = await mcp(endpoint, { ...filtros, ...base, items: [itemId] });
      lista(box, "investments", "loans", "results", "items", "data")
        .flatMap((x) => (x && Array.isArray(x.results) ? x.results : [x]))
        .filter((x) => {
          const dono = itemDaResposta(x);
          return !dono || dono === itemId;
        })
        .forEach((x) => juntos.push({ ...x, item_id: itemId }));
    }
    if (contaPedida && !contaConferida) return erro("Conta não encontrada.", 404);
    return ok({ results: juntos });
  } catch (e) {
    return resposta(e);
  }
}
