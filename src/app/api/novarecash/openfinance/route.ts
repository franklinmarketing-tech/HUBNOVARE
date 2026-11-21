import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { excedeuLimitePorIp } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { servico } from "@/lib/novarecash/assinantes";
import { ErroMcp, desligarItem, desligarTodos, lista, mcp, type Qualquer } from "@/lib/novarecash/bancomcp-servidor";
import { conferirSessao, criarSessao, sessaoPorCs } from "@/lib/novarecash/sessao-banco";

/**
 * OPEN FINANCE DO NOVARECASH, NO PRÓPRIO HUB (12/11/2026; v2 em 13/11/2026, depois da varredura).
 *
 * O Hub fala com o Banco MCP daqui, com a chave `BANCO_MCP_KEY` na Vercel (nunca no navegador).
 * API: https://app.mcp.ai/mcps/openfinance → aba API (19 endpoints).
 *
 * A CONTA DO BANCO MCP É UMA SÓ (a da Novare) e guarda os bancos de TODOS os clientes. Cada pessoa
 * só enxerga as conexões que REIVINDICOU (`vidaplan_open_finance`, por `user_id`) — inclusive a equipe.
 *
 * AS REGRAS:
 *   1. O NAVEGADOR NUNCA ESCOLHE O BANCO DE QUEM LER: o corpo passa por uma lista branca de campos
 *      (`CAMPOS_LIVRES`) e o `item` vem sempre do servidor, por último.
 *   2. RESPOSTA CONFERIDA: conta/transação/investimento que diga ser de outro `item` é descartada.
 *   3. CLAIM AMARRADO AO PEDIDO: tocar no banco grava um cookie ASSINADO com a hora E o banco
 *      escolhido (`iniciar`). O claim só aceita conexão DAQUELE banco, criada depois do toque.
 *      Se OUTRO cliente pediu o mesmo banco na mesma janela (`ncash_of_pedidos`), ninguém pega
 *      sozinho: a pessoa confirma pelo final da conta (`confirmar`).
 *   4. CORRIDA: depois de gravar, confere se outro usuário também ficou com o item; se sim, desfaz.
 *   5. SEM ITEM só quando a conta do Banco MCP tem UMA conexão e ela é a da pessoa.
 *   6. ERRO DO BANCO MCP NÃO VIRA "LISTA VAZIA". E UM BANCO COM ERRO NÃO DERRUBA OS OUTROS: cada
 *      item tem seu try/catch e volta em `falhas`.
 *   7. ECONOMIA: cache curto e UMA chamada em andamento por chave (10 clientes conferindo juntos
 *      não viram 10 `connections/list`).
 *   8. DESLIGAR revoga no Banco MCP (`connections/disconnect`), desativa as contas daquele banco no
 *      NovareCash (o saldo some) e, se a pessoa pedir, apaga os lançamentos importados.
 *   9. RECONECTAR renova o MESMO item (`update_item` na página de conexão): ids iguais, nada duplica.
 *  10. CONNECT SESSION (21/11/2026): conectar um banco novo cria uma sessão SÓ da pessoa (`sessao`),
 *      e a conexão nasce com o `client_ref` dela — sem adivinhar (`lib/novarecash/sessao-banco.ts`).
 *      O `claim` (regras 3–5) ficou só de reserva, e ignora conexão que nasceu de sessão.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Cartão com milhares de lançamentos e 12 meses: a leitura paginada precisa de folga.
export const maxDuration = 300;

const PERMITIDOS = new Set([
  "connections/list", "accounts/list", "accounts/balance", "transactions/list",
  "investments/list", "credit-card-bills/list", "loans/list", "categories/list",
  // 13/11/2026 (fase 2): por cartão, o detalhe (limite, fechamento, vencimento) + as últimas faturas.
  "cartoes",
]);
/** Os únicos campos que o navegador pode mandar (filtros), nunca `item`/`item_id`/`items`. */
const CAMPOS_LIVRES = ["from", "to", "startDate", "endDate", "account_id", "type", "search_queries", "detail"] as const;
const LIMITE_PLANO: Record<string, number> = { essencial: 1, plus: 3, premium: 10 };
const PEDIDO = "ncash_of_pedido";
const PAGINAS_MAX = 40;
/** Prazo total de uma leitura paginada (a função tem 300 s). */
const PRAZO_MS = 240_000;
/** Os bancos que aparecem de cara na escolha (sem digitar). */
const POPULARES = ["nubank", "itau", "bradesco", "banco do brasil", "caixa", "santander", "inter", "mercado pago", "c6", "picpay", "btg", "sicoob", "sicredi"];

const resposta = (e: unknown) => {
  if (e instanceof ErroMcp) return NextResponse.json({ error: { message: e.message, code: e.code } }, { status: e.http });
  console.error("[open-finance] erro inesperado", e);
  return NextResponse.json({ error: { message: "falha" } }, { status: 502 });
};
const erro = (mensagem: string, status: number, code?: string) => NextResponse.json({ error: { message: mensagem, code } }, { status });
const ok = (result: unknown) => NextResponse.json({ result });

// ── cache curto (por instância), com UMA busca em andamento por chave: regra 7 ──
type Guardado = { em: number; ate: number; valor: unknown };
const cache = new Map<string, Guardado>();
const andamento = new Map<string, Promise<unknown>>();
/**
 * `aceitaIdade` (ms): aceita o guardado se for mais novo que isso, mesmo vencido o prazo normal —
 * é o "fresco" da conferência a cada 3 s: vários clientes juntos dividem a mesma leitura de 4 s.
 */
async function emCache<T>(
  chave: string,
  segundos: number,
  buscar: () => Promise<T>,
  opcoes: { guardar?: (v: T) => boolean; aceitaIdade?: number } = {},
): Promise<T> {
  const c = cache.get(chave);
  const agora = Date.now();
  if (c && (opcoes.aceitaIdade !== undefined ? agora - c.em < opcoes.aceitaIdade : c.ate > agora)) return c.valor as T;
  const ja = andamento.get(chave);
  if (ja) return ja as Promise<T>;
  const p = (async () => {
    try {
      const valor = await buscar();
      if (!opcoes.guardar || opcoes.guardar(valor)) cache.set(chave, { em: Date.now(), ate: Date.now() + segundos * 1000, valor });
      return valor;
    } finally {
      andamento.delete(chave);
    }
  })();
  andamento.set(chave, p);
  return p;
}
const esquecerCache = (prefixo: string) => {
  for (const k of [...cache.keys()]) if (k.startsWith(prefixo)) cache.delete(k);
};
const conexoesDaConta = (aceitaIdade?: number) =>
  emCache(
    "conexoes",
    60,
    async () => {
      const box = await mcp("connections/list", {});
      return { conexoes: lista(box, "connections", "results", "items", "data"), url: box?.add_connection_url || box?.connect_url || null };
    },
    { aceitaIdade },
  );

const itemDe = (c: Qualquer) => String(c?.item_id || c?.itemId || c?.id || c?.connection_id || "");
const bancoDe = (c: Qualquer) => c?.connector_name || c?.connector?.name || c?.connector_id || c?.name || null;
const conectorDe = (c: Qualquer) => String(c?.connector_id ?? c?.connectorId ?? c?.connector?.id ?? "");
const dataDe = (...v: Qualquer[]) => {
  for (const x of v) {
    const t = Date.parse(String(x ?? ""));
    if (Number.isFinite(t)) return t;
  }
  return null;
};
const criadoDe = (c: Qualquer) => dataDe(c?.createdAt, c?.created_at, c?.connected_at, c?.connectedAt);
const atualizadoDe = (c: Qualquer) =>
  dataDe(c?.lastUpdatedAt, c?.last_updated_at, c?.updatedAt, c?.updated_at, c?.statusDetail?.updatedAt, c?.last_sync_at);
/** O `item` que a PRÓPRIA resposta diz ter (quando diz). Regra 2. */
const itemDaResposta = (x: Qualquer) => String(x?.item_id || x?.itemId || x?.item?.id || "");
const idDaConta = (a: Qualquer) => String(a?.account_id || a?.id || "");

// ── o pedido de conexão assinado (regra 3) ───────────────────────────────────
const assinar = (texto: string) => createHmac("sha256", `ncash-of:${process.env.BANCO_MCP_KEY}`).update(texto).digest("hex");
/** Cookie: `uid.quando.conector.assinatura` (conector vazio = pedido sem banco escolhido). */
function cookiePedido(uid: string, conector = "") {
  const quando = String(Date.now());
  const limpo = conector.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  return `${uid}.${quando}.${limpo}.${assinar(`${uid}.${quando}.${limpo}`)}`;
}
function lerPedido(valor: string | undefined, userId: string): { quando: number; conector: string } | null {
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length !== 4) return null;
  const [uid, quando, conector, sig] = partes;
  if (uid !== userId || !quando || !sig) return null;
  const esperada = assinar(`${uid}.${quando}.${conector}`);
  if (sig.length !== esperada.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(esperada))) return null;
  const t = Number(quando);
  return Number.isFinite(t) && Date.now() - t < 60 * 60_000 ? { quando: t, conector } : null; // vale 1 hora
}
const OPCOES_COOKIE = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/novarecash/openfinance", maxAge: 3600 };

export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "novarecash-openfinance", 90)) return erro("Muitas chamadas seguidas. Espere um minuto.", 429);
  if (!process.env.BANCO_MCP_KEY) return erro("BANCO_MCP_KEY não configurada", 503, "banco_mcp_key");

  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getUser();
  const usuario = sessao.user;
  if (!usuario) return erro("Sessão expirada", 401);
  const db = servico();
  if (!db) return erro("serviço indisponível", 503);
  if (!(await temAcessoNovareCash())) {
    // Ex-assinante com banco ainda ligado na conta da Novare: desliga (LGPD). SÓ com prova definitiva
    // (a checagem de acesso também diz "não" num erro passageiro): assinatura dele, vencida ou
    // devolvida, e não é da equipe. Sem linha de assinatura (conta compartilhada, equipe): não mexe.
    try {
      const [{ data: assin }, { data: perfilEx }] = await Promise.all([
        db.from("ncash_assinantes").select("status, expira_em").eq("email", String(usuario.email ?? "").toLowerCase()).maybeSingle(),
        db.from("hub_profiles").select("role").eq("id", usuario.id).maybeSingle(),
      ]);
      const daEquipe = ["admin", "equipe"].includes(String(perfilEx?.role ?? ""));
      // 3 dias de folga: renovação que atrasa algumas horas não pode desligar o banco de quem paga.
      const venceu = assin?.expira_em ? Date.parse(String(assin.expira_em)) < Date.now() - 3 * 24 * 60 * 60_000 : false;
      const devolvida = ["reembolsada", "chargeback"].includes(String(assin?.status ?? ""));
      if (assin && !daEquipe && (venceu || devolvida)) await desligarTodos(db, usuario.id);
    } catch {}
    return erro("O Open Finance faz parte do NovareCash.", 403);
  }

  const pedido = (await req.json().catch(() => null)) as { endpoint?: string; body?: Record<string, unknown> } | null;
  const endpoint = String(pedido?.endpoint ?? "");
  const corpo = (pedido?.body ?? {}) as Record<string, Qualquer>;

  try {
    const { data: perfil } = await db.from("hub_profiles").select("role").eq("id", usuario.id).maybeSingle();
    const equipe = ["admin", "equipe"].includes(String(perfil?.role ?? ""));

    const { data: linhas } = await db.from("vidaplan_open_finance").select("item_id, connector_name, status").eq("user_id", usuario.id);
    const minhas = (linhas ?? []).filter((l: Qualquer) => String(l.status ?? "").toLowerCase() !== "revogada");
    const ehMinha = (itemId: string) => !!itemId && minhas.some((m: Qualquer) => String(m.item_id) === itemId);

    // ── Os bancos para escolher DENTRO do NovareCash ──
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
      return ok({ bancos });
    }

    // ── Conectar um banco novo: a sessão SÓ desta pessoa (regra 10) ──
    if (endpoint === "sessao") {
      if (!equipe) {
        const { data: assin } = await db.from("ncash_assinantes").select("plano").eq("email", String(usuario.email ?? "").toLowerCase()).maybeSingle();
        const limite = LIMITE_PLANO[String(assin?.plano ?? "").toLowerCase()] ?? 1;
        if (minhas.length >= limite) {
          return ok({ limite: true, message: `O seu plano conecta até ${limite} banco${limite > 1 ? "s" : ""}.` });
        }
      }
      const s = await criarSessao(db, {
        userId: usuario.id,
        origem: new URL(req.url).origin,
        connectorId: String(corpo.connector_id ?? ""),
        banco: String(corpo.banco ?? ""),
      });
      return ok({ cs: s.cs, url: s.url });
    }

    // ── A sessão já virou conexão? (a conferência a cada 3 s do app) ──
    if (endpoint === "sessao-status") {
      const linha = await sessaoPorCs(db, String(corpo.cs ?? ""));
      if (!linha || linha.user_id !== usuario.id) return erro("Conexão não encontrada.", 404);
      // Já resolvida (pela página de volta, pelo webhook ou por uma conferência anterior): só o banco.
      // Pendente: no máximo UMA pergunta à mcp.ai a cada 8 s por sessão (o limite da conta é 60/min).
      const r =
        linha.status === "pending"
          ? await emCache(`sessao:${linha.cs}`, 8, () => conferirSessao(db, linha))
          : await conferirSessao(db, linha);
      if (r.ok) {
        esquecerCache("conexoes");
        return ok({ conectado: true, item_id: r.itemId, connector_name: r.banco });
      }
      return ok({ conectado: false, status: r.status, message: r.mensagem ?? null });
    }

    // ── A pessoa tocou num banco: o pedido assinado, com o banco escolhido (regra 3) ──
    if (endpoint === "iniciar") {
      const conector = String(corpo.connector_id ?? "").slice(0, 40);
      const r = ok({ ok: true });
      r.cookies.set(PEDIDO, cookiePedido(usuario.id, conector), OPCOES_COOKIE);
      // Sem o SQL v2 a tabela não existe: segue sem a checagem de disputa.
      await db
        .from("ncash_of_pedidos")
        .upsert({ user_id: usuario.id, connector_id: conector || null, banco: String(corpo.banco ?? "").slice(0, 80) || null, criado_em: new Date().toISOString() })
        .then(({ error }) => error && console.warn("[open-finance] ncash_of_pedidos", error.message));
      return r;
    }

    // ── Link geral de conexão (reserva, quando a busca de bancos falha) ──
    if (endpoint === "connect-url") {
      const { url } = await conexoesDaConta();
      const r = ok({ url });
      r.cookies.set(PEDIDO, cookiePedido(usuario.id), OPCOES_COOKIE);
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
      const ped = lerPedido((await cookies()).get(PEDIDO)?.value, usuario.id);
      // Sem o pedido assinado, ninguém reivindica — nem a equipe (pegaria por engano o banco de um cliente).
      if (!ped) return ok({ claimed: false, message: "Toque no seu banco e conecte de novo — o pedido expirou." });

      const { conexoes } = await conexoesDaConta(4000); // conexão recém-nascida: no máximo 4 s de idade
      let candidatas = conexoes.filter((c) => {
        const t = criadoDe(c);
        // Conexão que nasceu de uma connect session já tem dono (o `client_ref`): nunca entra aqui.
        if (c?.client_ref || c?.clientRef) return false;
        return itemDe(c) && t !== null && t >= ped.quando - 60_000; // sem data não entra: não dá para provar de quem é
      });
      // Só o banco que a pessoa escolheu (quando a conexão diz o conector).
      if (ped.conector) candidatas = candidatas.filter((c) => !conectorDe(c) || conectorDe(c) === ped.conector);

      // Quem já tem dono sai — lendo SÓ as candidatas (antes lia as tabelas inteiras, e o corte de 1.000 linhas mentia).
      const ids = candidatas.map(itemDe);
      if (ids.length) {
        const [{ data: a }, { data: b }, { data: s }] = await Promise.all([
          db.from("vidaplan_open_finance").select("item_id").in("item_id", ids),
          db.from("client_connections").select("item_id").in("item_id", ids),
          db.from("ncash_of_sessoes").select("item_id").in("item_id", ids),
        ]);
        const comDono = new Set([...(a ?? []), ...(b ?? []), ...(s ?? [])].map((l: Qualquer) => String(l.item_id)));
        candidatas = candidatas.filter((c) => !comDono.has(itemDe(c)));
      }

      const escolha = String(corpo.item_id ?? "");
      if (escolha) candidatas = candidatas.filter((c) => itemDe(c) === escolha);
      else if (candidatas.length > 1) {
        return ok({ claimed: false, escolher: candidatas.map((c) => ({ item_id: itemDe(c), connector_name: bancoDe(c), criado: criadoDe(c) })) });
      }
      if (candidatas.length !== 1) return ok({ claimed: false, message: "Ainda não encontramos a sua conexão." });
      const c = candidatas[0];

      // Disputa: OUTRO cliente tocou no mesmo banco nessa janela? Então ninguém pega sozinho.
      if (!escolha && ped.conector) {
        const t = criadoDe(c) ?? Date.now();
        const { data: outros, error: eOutros } = await db
          .from("ncash_of_pedidos")
          .select("user_id")
          .eq("connector_id", ped.conector)
          .neq("user_id", usuario.id)
          .gte("criado_em", new Date(t - 30 * 60_000).toISOString())
          .lte("criado_em", new Date(t + 60_000).toISOString());
        if (!eOutros && outros?.length) {
          let final: string | null = null;
          try {
            const box = await mcp("accounts/list", { item: itemDe(c), item_id: itemDe(c) });
            const num = lista(box, "results", "accounts", "items", "data").map((x) => String(x?.number ?? "")).find((n) => n.replace(/\D/g, "").length >= 3);
            final = num ? num.replace(/\D/g, "").slice(-4) : null;
          } catch {}
          return ok({ claimed: false, confirmar: [{ item_id: itemDe(c), connector_name: bancoDe(c), criado: criadoDe(c), final }] });
        }
      }

      const { error } = await db
        .from("vidaplan_open_finance")
        .insert({ user_id: usuario.id, item_id: itemDe(c), connector_name: bancoDe(c), status: c.status ?? null });
      // Regra 4: alguém mais ficou com o mesmo item (agora ou num toque simultâneo)?
      const { data: donos } = await db.from("vidaplan_open_finance").select("user_id").eq("item_id", itemDe(c));
      const outrosDonos = (donos ?? []).filter((d: Qualquer) => d.user_id !== usuario.id);
      if (outrosDonos.length) {
        if (!error) await db.from("vidaplan_open_finance").delete().eq("user_id", usuario.id).eq("item_id", itemDe(c));
        return ok({ claimed: false, message: "Essa conexão já está ligada a outra conta. Conecte o seu banco de novo." });
      }
      if (error && (error as Qualquer).code !== "23505") throw new ErroMcp(500, "falha", error.message);
      await db.from("ncash_of_pedidos").delete().eq("user_id", usuario.id).then(() => undefined);
      const r = ok({ claimed: true, count: 1, connector_name: bancoDe(c), item_id: itemDe(c) });
      r.cookies.delete({ name: PEDIDO, path: "/api/novarecash/openfinance" });
      return r;
    }

    // ── Desligar (regra 8) ──
    if (endpoint === "forget") {
      const itemId = String(corpo.item_id ?? "");
      if (!ehMinha(itemId)) return erro("Conexão não encontrada.", 404);
      const apagar = corpo.apagar === true;

      const r = await desligarItem(db, usuario.id, itemId, apagar);
      esquecerCache("conexoes");
      esquecerCache(`contas:${itemId}`);
      return ok({ ok: true, revogadoNoBanco: r.revogado, contas: r.contas, apagadas: r.apagadas });
    }

    // ── Reconectar o MESMO banco (regra 9) ──
    if (endpoint === "reconectar") {
      const itemId = String(corpo.item_id ?? "");
      if (!ehMinha(itemId)) return erro("Conexão não encontrada.", 404);
      const { url } = await conexoesDaConta();
      if (!url) return erro("Página de conexão indisponível.", 502);
      const u = new URL(url);
      u.searchParams.set("update_item", itemId);
      u.searchParams.set("flow", "quick");
      return ok({ url: u.toString() });
    }

    // ── Forçar o banco a buscar dados novos agora ──
    if (endpoint === "atualizar") {
      const pedidoItem = String(corpo.item_id ?? "");
      const itens = pedidoItem ? (ehMinha(pedidoItem) ? [pedidoItem] : []) : minhas.map((m: Qualquer) => String(m.item_id));
      if (!itens.length) return erro("Conexão não encontrada.", 404);
      await mcp("connections/sync", { items: itens });
      esquecerCache("conexoes");
      itens.forEach((i) => esquecerCache(`contas:${i}`));
      return ok({ ok: true, itens });
    }

    // ── O Open Finance do provedor está com incidente? (aviso de instabilidade) ──
    if (endpoint === "provedor") {
      return ok(await emCache("provedor", 300, () => mcp("provider/status", {})));
    }

    if (!PERMITIDOS.has(endpoint)) return erro(`Endpoint não permitido: ${endpoint}`, 400);
    if (endpoint === "categories/list") return ok(await emCache("categorias", 3600, () => mcp(endpoint, {})));

    if (endpoint === "connections/list") {
      // O status de agora vem do Banco MCP (UPDATED, LOGIN_ERROR, OUTDATED…), não do que foi gravado no claim.
      // `fresco`: logo depois de conectar/atualizar, o app acompanha o UPDATING → UPDATED (até 4 s de idade).
      const { conexoes } = await conexoesDaConta(corpo.fresco === true && minhas.length ? 4000 : undefined);
      const porItem = new Map(conexoes.map((c) => [itemDe(c), c]));
      return ok({
        connections: minhas.map((m: Qualquer) => {
          const c = porItem.get(String(m.item_id));
          return {
            item_id: m.item_id,
            connector_name: m.connector_name,
            status: c?.status ?? (c ? null : "SEM_CONEXAO"),
            atualizado_em: c ? atualizadoDe(c) : null,
            detalhe: c?.error?.message ?? c?.statusDetail?.message ?? null,
          };
        }),
        count: minhas.length,
      });
    }

    if (!minhas.length) return ok({ results: [] });

    // Regra 1: só os filtros da lista branca.
    const filtros: Record<string, unknown> = {};
    for (const k of CAMPOS_LIVRES) if (corpo[k] !== undefined) filtros[k] = corpo[k];
    if (filtros.detail !== undefined && !["compact", "rich"].includes(String(filtros.detail))) delete filtros.detail;

    // Regra 5: sem item só quando a ÚNICA conexão da conta do Banco MCP é a desta pessoa.
    const { conexoes } = await conexoesDaConta();
    const semItem = minhas.length === 1 && conexoes.length === 1 && itemDe(conexoes[0]) === String(minhas[0].item_id);
    const baseDe = (itemId: string): Record<string, unknown> => (semItem ? {} : { item: itemId, item_id: itemId });

    const contasDo = (itemId: string) =>
      emCache(
        `contas:${itemId}`,
        120,
        async () => {
          const box = await mcp("accounts/list", { ...baseDe(itemId) });
          return lista(box, "results", "accounts", "items", "data").filter((a) => {
            const dono = itemDaResposta(a);
            return !dono || dono === itemId; // regra 2
          });
        },
        // Banco recém-conectado ainda sem contas: não guarda o vazio.
        { guardar: (contas) => contas.length > 0 },
      );

    const juntos: Qualquer[] = [];
    const falhas: { item_id: string; banco: string | null; codigo: string }[] = [];
    const contaPedida = filtros.account_id ? String(filtros.account_id) : null;
    let contaConferida = false;
    let truncado = false;
    const inicio = Date.now();

    for (const m of minhas) {
      const itemId = String(m.item_id);
      const base = baseDe(itemId);
      // Regra 6: um banco com erro não derruba os outros.
      try {
        if (endpoint === "accounts/list") {
          (await contasDo(itemId)).forEach((a) => juntos.push({ ...a, item_id: itemId }));
          continue;
        }

        if (endpoint === "transactions/list" || endpoint === "credit-card-bills/list" || endpoint === "accounts/balance") {
          const contas = (await contasDo(itemId)).filter((a) => {
            const id = idDaConta(a);
            if (!id || (contaPedida && id !== contaPedida)) return false;
            if (endpoint === "credit-card-bills/list" && String(a.type || "").toUpperCase() !== "CREDIT") return false;
            return true;
          });
          if (contaPedida && contas.length) contaConferida = true;

          if (endpoint === "accounts/balance") {
            // Em LOTE (1-50 por chamada): antes era uma chamada por conta.
            const ids = contas.map(idDaConta);
            for (let i = 0; i < ids.length; i += 50) {
              const lote = ids.slice(i, i + 50);
              const box = await mcp(endpoint, { account_ids: lote, ...base });
              const itens = lista(box, "balances", "results", "items", "data");
              (itens.length ? itens : lote.length === 1 ? [{ ...box, account_id: lote[0] }] : []).forEach((b) =>
                juntos.push({ ...b, account_id: b.account_id ?? b.id ?? lote[0], item_id: itemId }),
              );
            }
            continue;
          }

          // Transações e faturas: TODAS as páginas, com prazo total.
          const tamanho = endpoint === "transactions/list" ? 500 : 100;
          for (const a of contas) {
            const id = idDaConta(a);
            for (let pagina = 1; pagina <= PAGINAS_MAX; pagina++) {
              if (Date.now() - inicio > PRAZO_MS) {
                truncado = true;
                break;
              }
              const box = await mcp(endpoint, { ...filtros, page: pagina, page_size: tamanho, account_id: id, ...base });
              const itens = lista(box, "transactions", "bills", "results", "items", "data");
              itens.forEach((x) => juntos.push({ ...x, account_id: x.account_id ?? id, item_id: itemId }));
              const total = Number(box?.totalPages ?? box?.total_pages ?? box?.pagination?.totalPages ?? NaN);
              // Sem `totalPages`: continua enquanto a página vier cheia.
              if (Number.isFinite(total) && total > 0 ? pagina >= total : itens.length < tamanho) break;
              if (pagina === PAGINAS_MAX) truncado = true;
            }
          }
          continue;
        }

        // CARTÕES (fase 2): detalhe em lote (accounts/detail) + as 6 últimas faturas de cada um.
        if (endpoint === "cartoes") {
          const cartoes = (await contasDo(itemId)).filter((a) => String(a.type || "").toUpperCase() === "CREDIT");
          const ids = cartoes.map(idDaConta).filter(Boolean);
          if (!ids.length) continue;
          let detalhes: Qualquer[] = [];
          try {
            const box = await mcp("accounts/detail", { account_ids: ids.slice(0, 50), ...base });
            detalhes = lista(box, "accounts", "results", "items", "data");
          } catch (e) {
            console.warn("[open-finance] accounts/detail", e instanceof Error ? e.message : e);
          }
          for (const id of ids) {
            let faturas: Qualquer[] = [];
            try {
              const box = await mcp("credit-card-bills/list", { account_id: id, page: 1, page_size: 6, ...base });
              faturas = lista(box, "bills", "results", "items", "data");
            } catch (e) {
              console.warn("[open-finance] credit-card-bills/list", e instanceof Error ? e.message : e);
            }
            const detalhe = detalhes.find((d) => idDaConta(d) === id) ?? cartoes.find((c) => idDaConta(c) === id) ?? null;
            juntos.push({ account_id: id, item_id: itemId, detalhe, faturas });
          }
          continue;
        }

        // investments/list e loans/list: por item, resposta conferida.
        const box =
          endpoint === "loans/list"
            ? await mcp(endpoint, { items: [itemId] })
            : await mcp(endpoint, { ...filtros, ...base, items: [itemId] });
        lista(box, "investments", "loans", "results", "items", "data")
          .flatMap((x) => (x && Array.isArray(x.results) ? x.results : [x]))
          .filter((x) => {
            const dono = itemDaResposta(x);
            return !dono || dono === itemId;
          })
          .forEach((x) => juntos.push({ ...x, item_id: itemId }));
      } catch (e) {
        const codigo = e instanceof ErroMcp ? e.code : "falha";
        console.warn(`[open-finance] ${endpoint} item ${itemId}:`, e instanceof Error ? e.message : e);
        falhas.push({ item_id: itemId, banco: m.connector_name ?? null, codigo });
      }
    }
    if (contaPedida && !contaConferida && !falhas.length) return erro("Conta não encontrada.", 404);
    // Tudo falhou: devolve o erro do primeiro (a tela mostra a frase certa).
    if (falhas.length && falhas.length === minhas.length && !juntos.length) {
      const c = falhas[0].codigo;
      throw new ErroMcp(c === "not_connected" ? 409 : c === "banco_mcp_key" ? 503 : c === "limite" ? 429 : 502, c, c);
    }
    return ok({ results: juntos, falhas, truncado });
  } catch (e) {
    return resposta(e);
  }
}
