/**
 * OPEN FINANCE (Banco MCP) — o lado do NAVEGADOR.
 *
 * A chave do Banco MCP não chega aqui: quem fala com ele é a Edge Function
 * `rapid-responder` do MESMO Supabase (a do Novare App; contrato em
 * `Desktop\NOVARE\novareapp\supabase\functions\openfinance\index.ts` — só
 * leitura, é outro projeto). Ela confere o token da pessoa e ESCOPA cada
 * consulta às conexões que essa pessoa reivindicou (`claim`).
 *
 * Endpoints usados: `connect-url`, `claim`, `forget`, `connections/list`,
 * `accounts/list`, `accounts/balance`, `transactions/list`. Os dados vêm em
 * `payload.result.*`.
 *
 * A SINCRONIZAÇÃO grava nas tabelas PRÓPRIAS do NovareCash:
 *   - cada conta do banco vira uma linha em `ncash_contas` (origem
 *     'openfinance', `externo_id` = id da conta no banco), com o saldo de agora;
 *   - cada transação vira uma linha em `ncash_transacoes` (origem
 *     'openfinance', `externo_id` = id da transação), com a categoria do
 *     primeiro palpite (`categoriaDoBanco`: `adivinharCategoria`, com o
 *     pagamento de fatura classificado como `pagamento_fatura`).
 * SEM DUPLICAR: o que já entrou é pulado ANTES de gravar, e o índice único
 * `(user_id, origem, externo_id)` recusa o que escapar (duas abas, toque
 * duplo). E o que já entrou NÃO é reescrito: a categoria que a pessoa corrigiu
 * no Extrato sobrevive a qualquer sincronização.
 *
 * REGRA DO SINAL: `valor` SEMPRE positivo; o sinal vira `tipo`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { adivinharCategoria, categoria } from "./categorias";
import { ErroDados, faltaTabela, usuarioDaSessao } from "./dados";

const FUNCAO = "rapid-responder";

export type MotivoErroBanco = "reativando" | "nao-configurado" | "sessao" | "falha";

/** Erro já com a frase que a tela mostra. Nunca detalhe técnico para o cliente. */
export class ErroBanco extends Error {
  constructor(
    public motivo: MotivoErroBanco,
    mensagem: string,
    /** Só para decidir no código e para o console — nunca vai para a tela. */
    public detalhe = "",
    public status: number | null = null,
  ) {
    super(mensagem);
  }
}

const FRASE: Record<MotivoErroBanco, string> = {
  reativando: "A integração com os bancos está sendo reativada. Tente de novo mais tarde — nada do que você já importou se perde.",
  "nao-configurado": "A conexão com os bancos ainda está sendo configurada. Volte em breve.",
  sessao: "Sua sessão expirou. Entre de novo para continuar.",
  falha: "Não consegui falar com o banco agora. Tente de novo em instantes.",
};

function classificar(status: number | null, texto: string, codigo: string): MotivoErroBanco {
  const t = `${texto} ${codigo}`.toLowerCase();
  if (status === 409 || t.includes("not_connected")) return "reativando";
  if (t.includes("banco_mcp_key")) return "nao-configurado";
  if (status === 401) return "sessao";
  return "falha";
}

type Resultado = Record<string, unknown>;

async function chamar(endpoint: string, body: Record<string, unknown> = {}): Promise<Resultado> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ErroBanco("sessao", FRASE.sessao);

  const { data, error } = await supabase.functions.invoke(FUNCAO, {
    body: { endpoint, body },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    // O corpo real do erro está em `error.context` (a Response da função).
    const ctx = (error as { context?: Response }).context;
    let texto = error.message ?? "";
    let codigo = "";
    let status: number | null = null;
    if (ctx && typeof ctx === "object" && "status" in ctx) {
      status = ctx.status;
      try {
        const j = (await ctx.json()) as Record<string, unknown>;
        const r = (j?.result ?? {}) as Record<string, unknown>;
        const e = j?.error;
        texto = String((typeof e === "string" ? e : (e as { message?: string })?.message) ?? r.message ?? j?.message ?? texto);
        codigo = String(j?.code ?? r.code ?? (e as { code?: string })?.code ?? "");
      } catch {
        /* corpo não é JSON */
      }
    }
    const motivo = classificar(status, texto, codigo);
    if (motivo === "falha") console.warn(`[open-finance] ${endpoint}:`, status, texto);
    throw new ErroBanco(motivo, FRASE[motivo], texto, status);
  }

  const d = (data ?? {}) as Record<string, unknown>;
  if (d.error) {
    const e = d.error as { code?: string; message?: string } | string;
    const motivo = classificar(null, typeof e === "string" ? e : e.message ?? "", typeof e === "string" ? "" : e.code ?? "");
    throw new ErroBanco(motivo, FRASE[motivo]);
  }
  return ((d.result ?? d) as Resultado) ?? {};
}

const lista = (x: unknown, ...chaves: string[]): Record<string, unknown>[] => {
  if (Array.isArray(x)) return x as Record<string, unknown>[];
  const o = x as Record<string, unknown> | null;
  for (const k of chaves) if (Array.isArray(o?.[k])) return o![k] as Record<string, unknown>[];
  return [];
};

const texto = (...v: unknown[]) => {
  for (const x of v) if (typeof x === "string" && x.trim()) return x.trim();
  return "";
};

const numero = (...v: unknown[]): number | null => {
  for (const x of v) {
    if (x === null || x === undefined || x === "") continue;
    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

// ── Conexões ────────────────────────────────────────────────────────────────

export type Conexao = { itemId: string; banco: string; status: string | null };

export async function urlParaConectar(): Promise<string | null> {
  const r = await chamar("connect-url");
  return texto(r.url) || null;
}

/** Associa à conta da pessoa o banco que ela acabou de conectar no Banco MCP. */
export async function reivindicar(): Promise<{ ok: boolean; mensagem: string }> {
  try {
    const r = await chamar("claim");
    if (r.claimed === true) {
      const n = numero(r.count) ?? 1;
      return { ok: true, mensagem: n === 1 ? "Banco conectado." : `${n} conexões ligadas à sua conta.` };
    }
    if (/outro usu/i.test(texto(r.message))) {
      return { ok: false, mensagem: "Essa conexão já está ligada a outra conta. Conecte o banco de novo pelo botão “Conectar banco”." };
    }
    return {
      ok: false,
      mensagem: "Ainda não encontramos a sua conexão. Termine a autorização no seu banco e toque em “Já conectei” de novo.",
    };
  } catch (e) {
    // Conta administradora do Banco MCP (equipe da Novare): a função responde 400
    // "Admin não precisa reivindicar." — ela já enxerga as conexões da casa.
    if (e instanceof ErroBanco && e.status === 400 && /admin/i.test(e.detalhe)) {
      return { ok: true, mensagem: "Conta da equipe: as conexões da Novare já aparecem sem reivindicar." };
    }
    throw e;
  }
}

export async function esquecer(itemId: string): Promise<void> {
  await chamar("forget", { item_id: itemId });
}

export async function listarConexoes(): Promise<Conexao[]> {
  const r = await chamar("connections/list");
  return lista(r, "connections", "results", "items", "data")
    .map((c) => ({
      itemId: texto(c.item_id, c.id, c.itemId, c.connection_id),
      banco: texto(c.connector_name, (c.connector as Record<string, unknown> | undefined)?.name, c.name, c.connector_id) || "Banco",
      status: texto(c.status) || null,
    }))
    .filter((c) => c.itemId);
}

// ── Contas e saldos ─────────────────────────────────────────────────────────

export type ContaBanco = {
  id: string;
  /** A conexão (banco) de onde a conta veio, quando o Banco MCP informa. */
  itemId: string | null;
  nome: string;
  /** "BANK", "CREDIT"… (como o Banco MCP manda). */
  tipo: string;
  cartao: boolean;
  numero: string | null;
  saldo: number | null;
};

export async function listarContas(): Promise<ContaBanco[]> {
  const r = await chamar("accounts/list");
  return lista(r, "results", "accounts", "items", "data")
    .map((a) => {
      const tipo = texto(a.type, a.subtype).toUpperCase();
      return {
        id: texto(a.account_id, a.id),
        itemId: texto(a.item_id, a.itemId, a.connection_id) || null,
        nome: texto(a.marketing_name, a.marketingName, a.name, a.owner) || (tipo === "CREDIT" ? "Cartão" : "Conta"),
        tipo,
        cartao: tipo.includes("CREDIT"),
        numero: texto(a.number) || null,
        saldo: numero(a.balance, a.current_balance, a.available_balance),
      };
    })
    .filter((a) => a.id);
}

/** Saldo de uma conta, quando a lista não trouxe. `null` = o banco não informou. */
export async function saldoDaConta(accountId: string): Promise<number | null> {
  const r = await chamar("accounts/balance", { account_id: accountId });
  const primeiro = lista(r, "results", "balances", "items", "data")[0] ?? r;
  return numero(primeiro.balance, primeiro.current_balance, primeiro.available_balance, primeiro.current, primeiro.available, primeiro.amount);
}

// ── Transações → NovareCash ─────────────────────────────────────────────────

const p2 = (n: number) => String(n).padStart(2, "0");
const isoLocal = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

export type TransacaoBanco = {
  externo_id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
};

/**
 * Uma transação do banco → uma linha do extrato.
 *
 * O SINAL: o campo `type` (DEBIT/CREDIT) manda quando vem. Sem ele, vale o sinal
 * do valor — e no CARTÃO o sentido é o contrário do da conta (compra vem
 * positiva, pagamento/estorno negativo).
 *
 * PENDENTES FICAM DE FORA: a transação pendente costuma ganhar outro id quando é
 * confirmada, e gravá-la agora duplicaria o gasto amanhã.
 *
 * SEM ID DO BANCO (raro): a chave vira data + valor + tipo + descrição, que é
 * estável entre uma sincronização e outra.
 */
export function paraTransacaoBanco(t: Record<string, unknown>, cartao: boolean): TransacaoBanco | null {
  const status = texto(t.status).toUpperCase();
  if (status === "PENDING") return null;

  const bruto = numero(t.amount, t.value, t.valor);
  const data = texto(t.date, t.transactionDate, t.bookingDate, t.data).slice(0, 10);
  if (bruto === null || bruto === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  const tipoBanco = texto(t.type, t.creditDebitType, t.credit_debit_type).toUpperCase();
  let tipo: "entrada" | "saida";
  if (tipoBanco === "DEBIT" || tipoBanco === "DEBITO") tipo = "saida";
  else if (tipoBanco === "CREDIT" || tipoBanco === "CREDITO") tipo = "entrada";
  else if (cartao) tipo = bruto > 0 ? "saida" : "entrada";
  else tipo = bruto < 0 ? "saida" : "entrada";

  const valor = Math.round(Math.abs(bruto) * 100) / 100;
  const descricao = (texto(t.description, t.descriptionRaw, t.merchant, t.name, t.descricao) || "Transação do banco").slice(0, 120);
  const id = texto(t.id, t.transaction_id, t.transactionId);

  return {
    externo_id: (id || `h:${data}|${valor.toFixed(2)}|${tipo}|${descricao.toLowerCase()}`).slice(0, 200),
    data,
    valor,
    tipo,
    descricao,
  };
}

export async function transacoesDaConta(conta: ContaBanco, dias = 90): Promise<TransacaoBanco[]> {
  const ate = new Date();
  const de = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate() - dias);
  const r = await chamar("transactions/list", {
    account_id: conta.id,
    from: isoLocal(de),
    to: isoLocal(ate),
    startDate: isoLocal(de),
    endDate: isoLocal(ate),
  });
  return lista(r, "results", "transactions", "items", "data")
    .map((t) => paraTransacaoBanco(t, conta.cartao))
    .filter((t): t is TransacaoBanco => t !== null);
}

const codigoDe = (error: unknown) => (error as { code?: string } | null)?.code;

/** Erro do Supabase → `ErroDados` (a tela distingue "tabela ainda não criada" de falha). */
function falhou(error: unknown): never {
  throw new ErroDados(faltaTabela(error) ? "sem-tabela" : "falha", String((error as { message?: unknown })?.message ?? ""));
}

/**
 * A conta do banco em `ncash_contas`: atualiza a que já existe (nome, tipo,
 * saldo de agora) ou cria. Devolve o id local.
 */
async function gravarConta(sb: SupabaseClient, uid: string, conta: ContaBanco, instituicao: string | null): Promise<string> {
  const campos = {
    nome: conta.nome,
    tipo: conta.cartao ? "cartao" : "conta",
    instituicao,
    ...(conta.saldo !== null ? { saldo: conta.saldo, saldo_em: new Date().toISOString() } : {}),
  };

  const achar = async () => {
    const { data, error } = await sb
      .from("ncash_contas")
      .select("id")
      .eq("user_id", uid)
      .eq("origem", "openfinance")
      .eq("externo_id", conta.id)
      .maybeSingle();
    if (error) falhou(error);
    return (data?.id as string | undefined) ?? null;
  };

  const existente = await achar();
  if (existente) {
    const { error } = await sb.from("ncash_contas").update({ ...campos, ativa: true }).eq("id", existente).eq("user_id", uid);
    if (error) falhou(error);
    return existente;
  }

  const { data, error } = await sb
    .from("ncash_contas")
    .insert({ ...campos, user_id: uid, origem: "openfinance", externo_id: conta.id })
    .select("id")
    .single();
  if (error || !data) {
    // Outra aba criou no mesmo instante: o índice único recusou; usa a dela.
    if (codigoDe(error) === "23505") {
      const outra = await achar();
      if (outra) return outra;
    }
    falhou(error);
  }
  return String(data.id);
}

const PALAVRAS_FATURA = categoria("pagamento_fatura").palavras;

/**
 * A categoria do primeiro palpite (`adivinharCategoria`), com o PAGAMENTO DE
 * FATURA na frente (04/11/2026) — `pagamento_fatura` não é gasto nem receita:
 *   - "PAG FATURA …" vira `pagamento_fatura` nos dois tipos, antes das outras
 *     palavras ("pag fatura mercado pago" não pode cair em Mercado);
 *   - no CARTÃO, o banco manda o pagamento como ENTRADA ("Pagamento recebido"),
 *     que `adivinharCategoria` não procura (só olha `pagamento_fatura` nas
 *     saídas) — sem isto, ele viraria receita.
 */
export function categoriaDoBanco(t: Pick<TransacaoBanco, "descricao" | "tipo">, cartao: boolean): string {
  const d = ` ${t.descricao.toLowerCase()} `;
  if (PALAVRAS_FATURA.some((p) => d.includes(p))) return "pagamento_fatura";
  const semAcento = d.normalize("NFD").replace(/\p{M}/gu, "");
  if (cartao && t.tipo === "entrada" && /\b(pagamento|pagto|pgto|pag)\b/.test(semAcento) && !/estorno|reembolso|cashback/.test(semAcento)) {
    return "pagamento_fatura";
  }
  return adivinharCategoria(t.descricao, t.tipo);
}

/** Grava só as transações que ainda não estão lá. Devolve quantas entraram. */
async function gravarTransacoes(
  sb: SupabaseClient,
  uid: string,
  contaId: string,
  transacoes: TransacaoBanco[],
  cartao: boolean,
): Promise<number> {
  const unicas = [...new Map(transacoes.map((t) => [t.externo_id, t])).values()];

  const ja = new Set<string>();
  for (let i = 0; i < unicas.length; i += 200) {
    const { data, error } = await sb
      .from("ncash_transacoes")
      .select("externo_id")
      .eq("user_id", uid)
      .eq("origem", "openfinance")
      .in("externo_id", unicas.slice(i, i + 200).map((t) => t.externo_id));
    if (error) falhou(error);
    for (const l of data ?? []) ja.add(String(l.externo_id));
  }

  const novas = unicas
    .filter((t) => !ja.has(t.externo_id))
    .map((t) => ({
      user_id: uid,
      conta_id: contaId,
      data: t.data,
      descricao: t.descricao,
      valor: t.valor,
      tipo: t.tipo,
      categoria: categoriaDoBanco(t, cartao),
      origem: "openfinance",
      externo_id: t.externo_id,
    }));

  let gravadas = 0;
  for (let i = 0; i < novas.length; i += 300) {
    const lote = novas.slice(i, i + 300);
    const { error } = await sb.from("ncash_transacoes").insert(lote);
    if (!error) {
      gravadas += lote.length;
      continue;
    }
    if (codigoDe(error) !== "23505") falhou(error);
    // Alguma entrou por outro caminho entre a leitura e a gravação: uma a uma, pulando as repetidas.
    for (const linha of lote) {
      const r = await sb.from("ncash_transacoes").insert(linha);
      if (!r.error) gravadas++;
      else if (codigoDe(r.error) !== "23505") falhou(r.error);
    }
  }
  return gravadas;
}

export type ResultadoSincronizacao = {
  contas: number;
  /** Transações que o banco mandou (sem as pendentes). */
  lidas: number;
  novas: number;
  jaEstavam: number;
  /** Contas que falharam (nome), sem derrubar as outras. */
  falhas: string[];
};

/**
 * "Sincronizar agora": para cada conta do banco, grava a conta com o saldo e
 * traz as transações dos últimos `dias`. Rodar de novo não duplica nada.
 * Lança `ErroDados("sem-tabela")` se o SQL do app ainda não foi rodado.
 */
export async function sincronizar(args: {
  contas: ContaBanco[];
  conexoes: Conexao[];
  dias?: number;
}): Promise<ResultadoSincronizacao> {
  const sb = createClient();
  const uid = await usuarioDaSessao(sb).catch(() => {
    throw new ErroBanco("sessao", FRASE.sessao);
  });
  const bancoDe = new Map(args.conexoes.map((c) => [c.itemId, c.banco]));
  const unicoBanco = args.conexoes.length === 1 ? args.conexoes[0].banco : null;

  const r: ResultadoSincronizacao = { contas: 0, lidas: 0, novas: 0, jaEstavam: 0, falhas: [] };
  for (const conta of args.contas) {
    try {
      const instituicao = (conta.itemId && bancoDe.get(conta.itemId)) || unicoBanco;
      const contaId = await gravarConta(sb, uid, conta, instituicao);
      const transacoes = await transacoesDaConta(conta, args.dias ?? 90);
      const novas = await gravarTransacoes(sb, uid, contaId, transacoes, conta.cartao);
      r.contas++;
      r.lidas += transacoes.length;
      r.novas += novas;
      r.jaEstavam += transacoes.length - novas;
    } catch (e) {
      // Tabela que não existe vale para todas: não adianta tentar a próxima.
      if (e instanceof ErroDados && e.motivo === "sem-tabela") throw e;
      console.warn("[open-finance] sincronizar", conta.nome, e instanceof Error ? e.message : e);
      r.falhas.push(conta.nome);
    }
  }
  return r;
}

// ── Investimentos (Patrimônio, 04/11/2026) ──────────────────────────────────

export type InvestimentoBanco = {
  id: string;
  nome: string;
  /** `type` do Banco MCP: FIXED_INCOME, EQUITY, ETF, MUTUAL_FUND, SECURITY, COE, OTHER. */
  tipo: string;
  /** `subtype` quando vem (CDB, LCI, TREASURY, RETIREMENT, PGBL, VGBL…). */
  subtipo: string;
  valor: number;
};

/** O saldo pode vir como número ou como objeto (`{ current, amount… }`). */
const valorDe = (...v: unknown[]): number | null => {
  for (const x of v) {
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      const n = numero(o.current, o.amount, o.value, o.balance, o.available);
      if (n !== null) return n;
    } else {
      const n = numero(x);
      if (n !== null) return n;
    }
  }
  return null;
};

/**
 * Os investimentos que o banco informa (`investments/list`, já escopado às
 * conexões da pessoa pela `rapid-responder`). SÓ LEITURA: nada é gravado — o
 * Patrimônio mostra o que veio agora, sem guardar cópia que envelhece.
 */
export async function listarInvestimentos(): Promise<InvestimentoBanco[]> {
  const r = await chamar("investments/list");
  return lista(r, "results", "investments", "items", "data")
    .map((i) => ({
      id: texto(i.id, i.investment_id, i.code, i.isin),
      nome: texto(i.name, i.marketing_name, i.product_name, i.code) || "Investimento",
      tipo: texto(i.type).toUpperCase(),
      subtipo: texto(i.subtype, i.sub_type).toUpperCase(),
      valor: valorDe(i.balance, i.netWorth, i.value, i.amount, i.grossValue, i.marketValue) ?? 0,
    }))
    .filter((i) => i.valor > 0);
}
