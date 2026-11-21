/**
 * OPEN FINANCE (Banco MCP) — o lado do NAVEGADOR.
 *
 * A chave do Banco MCP não chega aqui: quem fala com ele é a rota do próprio Hub,
 * `/api/novarecash/openfinance` (12/11/2026). Antes era a Edge Function
 * `rapid-responder` do app antigo, que não é mais usado (contrato antigo em
 * `Desktop\NOVARE\novareapp\supabase\functions\openfinance\index.ts` — só
 * leitura, é outro projeto). Ela confere o token da pessoa e ESCOPA cada
 * consulta às conexões que essa pessoa reivindicou (`claim`).
 *
 * Endpoints usados: `sessao` e `sessao-status` (connect session, 21/11/2026), `connect-url`, `claim`, `forget`, `connections/list`,
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
import { adivinharCategoria, categoria, semAcento, type ChaveCategoria } from "./categorias";
import { ErroDados, faltaTabela, usuarioDaSessao } from "./dados";


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

/**
 * 12/11/2026: fala com a rota do PRÓPRIO Hub (`/api/novarecash/openfinance`), que guarda a chave do
 * Banco MCP e escopa tudo à pessoa logada. Antes era a Edge Function `rapid-responder` do app antigo.
 */
async function chamar(endpoint: string, body: Record<string, unknown> = {}): Promise<Resultado> {
  let r: Response;
  try {
    r = await fetch("/api/novarecash/openfinance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, body }),
    });
  } catch {
    throw new ErroBanco("falha", FRASE.falha);
  }
  const d = ((await r.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const e = d.error as { code?: string; message?: string } | string | undefined;
  if (!r.ok || e) {
    const texto = typeof e === "string" ? e : e?.message ?? "";
    const codigo = typeof e === "string" ? "" : e?.code ?? "";
    const motivo = classificar(r.ok ? null : r.status, texto, codigo);
    if (motivo === "falha") console.warn(`[open-finance] ${endpoint}:`, r.status, texto);
    throw new ErroBanco(motivo, FRASE[motivo], texto, r.ok ? null : r.status);
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

export type Conexao = {
  itemId: string;
  banco: string;
  status: string | null;
  /** Quando o banco mandou dados pela última vez (ms), se o Banco MCP informa. */
  atualizadoEm: number | null;
};

export type BancoParaConectar = { id: string; nome: string; url: string; logo: string | null };

/** Os bancos (só Open Finance, pessoa física) para escolher dentro do app. Sem `busca`: os mais usados. */
export async function listarBancos(busca = ""): Promise<BancoParaConectar[]> {
  const r = await chamar("bancos", busca ? { busca } : {});
  return lista(r, "bancos").map((b) => ({ id: texto(b.id), nome: texto(b.nome), url: texto(b.url), logo: texto(b.logo) || null })).filter((b) => b.url);
}

export async function urlParaConectar(): Promise<string | null> {
  const r = await chamar("connect-url");
  return texto(r.url) || null;
}

export type CandidataBanco = { itemId: string; banco: string; criado: number | null; final?: string | null };

/**
 * CONNECT SESSION (21/11/2026): o link de conexão SÓ desta pessoa, de uso único, que no fim volta
 * para o NovareCash (e não para o claude.ai). O banco nasce ligado a ela: nada de `claim`.
 * `null` = o servidor não conseguiu criar a sessão (SQL ainda não rodado, mcp.ai fora): quem chamou
 * usa o caminho antigo. `limite` = o plano não deixa conectar mais um.
 */
export async function criarSessaoBanco(
  conectorId: string,
  banco: string,
): Promise<{ cs: string; url: string } | { limite: string } | null> {
  try {
    const r = await chamar("sessao", { connector_id: conectorId, banco });
    if (r.limite === true) return { limite: `${texto(r.message)} Para conectar mais, mude de plano.` };
    const cs = texto(r.cs);
    const url = texto(r.url);
    return cs && url ? { cs, url } : null;
  } catch (e) {
    if (e instanceof ErroBanco && e.motivo === "sessao") throw e;
    return null;
  }
}

/** A sessão já virou conexão? `status`: pending | connected | expired | canceled | conflito. */
export async function statusDaSessao(cs: string): Promise<{ conectado: boolean; itemId?: string; banco?: string; status: string; mensagem?: string }> {
  const r = await chamar("sessao-status", { cs });
  if (r.conectado === true) {
    return { conectado: true, itemId: texto(r.item_id) || undefined, banco: texto(r.connector_name) || undefined, status: "connected" };
  }
  return { conectado: false, status: texto(r.status) || "pending", mensagem: texto(r.message) || undefined };
}

/**
 * A pessoa tocou num banco: grava o PEDIDO no servidor (hora + banco escolhido, cookie assinado).
 * O claim só aceita conexão daquele banco, criada depois disso. Chamar logo depois de abrir a janelinha.
 */
export async function iniciarConexao(conectorId: string, banco: string): Promise<void> {
  await chamar("iniciar", { connector_id: conectorId, banco });
}

/**
 * Associa à conta da pessoa o banco que ela acabou de conectar no Banco MCP.
 *
 * 12/11/2026 (vários clientes na mesma conta do Banco MCP): manda `desde` (a hora em que ela
 * tocou "Conectar") e, quando aparece mais de um banco novo nesse intervalo, o servidor devolve a
 * lista (`escolher`) para ela apontar o dela — e essa escolha volta aqui em `itemId`.
 */
export async function reivindicar(opcoes: { desde?: string | null; itemId?: string } = {}): Promise<{
  ok: boolean;
  mensagem: string;
  /** O banco que acabou de ser ligado (para a importação automática acompanhar só ele). */
  itemId?: string;
  banco?: string;
  escolher?: CandidataBanco[];
  /** Outro cliente conectou o mesmo banco ao mesmo tempo: a pessoa confirma pelo final da conta. */
  confirmar?: CandidataBanco;
}> {
  try {
    const r = await chamar("claim", {
      ...(opcoes.desde ? { desde: opcoes.desde } : {}),
      ...(opcoes.itemId ? { item_id: opcoes.itemId } : {}),
    });
    if (r.claimed === true) {
      const banco = texto(r.connector_name);
      return { ok: true, mensagem: banco ? `${banco} conectado.` : "Banco conectado.", itemId: texto(r.item_id) || undefined, banco: banco || undefined };
    }
    const escolher = lista(r, "escolher")
      .map((c) => ({ itemId: texto(c.item_id), banco: texto(c.connector_name) || "Banco", criado: numero(c.criado) }))
      .filter((c) => c.itemId);
    const disputa = lista(r, "confirmar")[0];
    if (disputa && texto(disputa.item_id)) {
      const final = texto(disputa.final) || null;
      return {
        ok: false,
        confirmar: { itemId: texto(disputa.item_id), banco: texto(disputa.connector_name) || "Banco", criado: numero(disputa.criado), final },
        mensagem: final ? `Encontramos uma conta terminada em ${final}. É a sua?` : "Encontramos uma conexão nova. É a sua?",
      };
    }
    if (escolher.length > 1) {
      return { ok: false, escolher, mensagem: "Encontramos mais de um banco conectado agora há pouco. Qual é o seu?" };
    }
    if (r.limite === true) return { ok: false, mensagem: `${texto(r.message)} Para conectar mais, mude de plano.` };
    const msg = texto(r.message);
    if (msg && !/ainda não encontramos/i.test(msg)) return { ok: false, mensagem: msg };
    return {
      ok: false,
      mensagem: "Ainda não encontramos a sua conexão. Termine a autorização no seu banco e toque em “Já conectei” de novo.",
    };
  } catch (e) {
    throw e;
  }
}

/**
 * DESLIGA O BANCO: revoga no Banco MCP, desativa as contas dele no NovareCash (o saldo some do
 * Início, das Contas e dos Cartões) e, com `apagar`, apaga também os lançamentos importados.
 */
export async function esquecer(itemId: string, apagar = false): Promise<{ revogado: boolean; apagadas: number }> {
  const r = await chamar("forget", { item_id: itemId, apagar });
  return { revogado: r.revogadoNoBanco !== false, apagadas: numero(r.apagadas) ?? 0 };
}

/** O link para RECONECTAR o mesmo banco (renova a autorização sem criar outra conexão: nada duplica). */
export async function urlParaReconectar(itemId: string): Promise<string | null> {
  const r = await chamar("reconectar", { item_id: itemId });
  return texto(r.url) || null;
}

/** Pede ao banco dados novos AGORA (sem isso, o provedor atualiza uma vez por dia). */
export async function atualizarNoBanco(itemId?: string): Promise<void> {
  await chamar("atualizar", itemId ? { item_id: itemId } : {});
}

/** Incidente aberto no Open Finance (instabilidade de banco). `null` = tudo normal ou sem informação. */
export async function avisoDoProvedor(): Promise<string | null> {
  try {
    const r = await chamar("provedor");
    const incidentes = lista(r, "incidents", "open_incidents", "results", "items");
    if (!incidentes.length) return null;
    const nomes = incidentes
      .map((i) => texto(i.connector_name, i.name, i.title, (i.connector as Record<string, unknown> | undefined)?.name))
      .filter(Boolean)
      .slice(0, 3);
    return nomes.length
      ? `Instabilidade no Open Finance agora: ${nomes.join(", ")}. A atualização desses bancos pode atrasar.`
      : "Há instabilidade no Open Finance agora. A atualização de alguns bancos pode atrasar.";
  } catch {
    return null;
  }
}

/** `fresco`: sem o cache de 60 s do servidor (para acompanhar o banco recém-conectado). */
export async function listarConexoes(fresco = false): Promise<Conexao[]> {
  const r = await chamar("connections/list", fresco ? { fresco: true } : {});
  return lista(r, "connections", "results", "items", "data")
    .map((c) => ({
      itemId: texto(c.item_id, c.id, c.itemId, c.connection_id),
      banco: texto(c.connector_name, (c.connector as Record<string, unknown> | undefined)?.name, c.name, c.connector_id) || "Banco",
      status: texto(c.status) || null,
      atualizadoEm: numero(c.atualizado_em),
    }))
    .filter((c) => c.itemId);
}

/** Banco com erro na última leitura (um banco com erro não derruba os outros: vem em `falhas`). */
let falhasRecentes: string[] = [];
export const bancosComFalha = () => falhasRecentes;

/** O banco ainda está mandando os dados (logo depois de conectar). Status do provedor (Pluggy). */
const EM_ANDAMENTO = /UPDATING|CREATING|PENDING|SYNC|WAITING(?!_USER)/i;
const COM_PROBLEMA = /LOGIN_ERROR|OUTDATED|ERROR|SEM_CONEXAO/i;
const PEDE_ACAO = /WAITING_USER_INPUT|WAITING_USER_ACTION/i;
/** Precisa de "Reconectar" (autorização vencida, senha trocada, banco pedindo confirmação). */
export const precisaReconectar = (status: string | null) => !!status && (COM_PROBLEMA.test(status) || PEDE_ACAO.test(status));

/** O status do provedor em português, para a pessoa (13/11/2026: antes aparecia "UPDATED"). */
export function statusLegivel(status: string | null): string | null {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s === "UPDATED" || s === "CONNECTED" || s === "ACTIVE") return "Em dia";
  if (PEDE_ACAO.test(s)) return "O banco pede confirmação";
  if (s === "SEM_CONEXAO") return "Conexão perdida: conecte de novo";
  if (EM_ANDAMENTO.test(s)) return "Atualizando…";
  if (s.includes("LOGIN_ERROR")) return "Precisa conectar de novo";
  if (s.includes("OUTDATED")) return "Desatualizado: conecte de novo";
  if (COM_PROBLEMA.test(s)) return "Com problema: conecte de novo";
  return null;
}

// ── A janela do banco (13/11/2026) ──────────────────────────────────────────

/**
 * A JANELINHA DO BANCO (13/11/2026): a autorização abre por cima do NovareCash (no celular, o
 * navegador abre uma aba) e o app a FECHA sozinho assim que a conexão aparece.
 *
 * Quem abre a janelinha é um QUADRO INVISÍVEL do próprio app (`#ncash-abridor`), não a aba. Motivo:
 * a página da mcp.ai, 10 s depois de "Connected", faz `window.opener.location.href = claude.ai`.
 * Com a aba como opener, o NovareCash ia parar no Claude. Com o quadro, o navegador barra
 * ("does not have permission to navigate the target frame") e a aba fica intacta — e o quadro, por
 * ser o opener, ainda pode fechar a janelinha. Testado no Chromium com o bloqueador de pop-up ligado.
 * Sem o quadro (reserva), a janelinha sai da aba e a ponte `/novarecash/conectar-banco` corta o opener.
 *
 * Chamar DENTRO do toque (sem `await` antes), senão o navegador bloqueia. `null` = bloqueada.
 * Sem `url` ainda (vai buscar depois de um `await`): abre em branco e depois `irPara`.
 */
export const ponteDoBanco = (url: string) => `/novarecash/conectar-banco?u=${encodeURIComponent(url)}`;

export type JanelaDoBanco = { fechada: () => boolean; fechar: () => void; irPara: (url: string) => void };

type Abridor = Window & {
  abrir?: (u: string, alvo: string, recursos: string) => boolean;
  fechar?: () => void;
  fechou?: () => boolean;
  ir?: (u: string) => void;
};

function abridor(): Abridor | null {
  try {
    let quadro = document.getElementById("ncash-abridor") as HTMLIFrameElement | null;
    if (!quadro) {
      quadro = document.createElement("iframe");
      quadro.id = "ncash-abridor";
      quadro.title = "Apoio da conexão com o banco";
      quadro.tabIndex = -1;
      quadro.setAttribute("aria-hidden", "true");
      quadro.style.display = "none";
      document.body.appendChild(quadro);
    }
    const w = quadro.contentWindow as Abridor | null;
    if (w && !w.abrir) {
      // As funções moram NO quadro: é ele que abre (vira o opener) e que pode fechar.
      const doc = w.document;
      const s = doc.createElement("script");
      s.textContent =
        "var j=null;" +
        "window.abrir=function(u,a,r){j=window.open(u,a,r);return !!j};" +
        "window.fechar=function(){try{if(j&&!j.closed)j.close()}catch(e){}};" +
        "window.fechou=function(){try{return !j||j.closed}catch(e){return true}};" +
        "window.ir=function(u){try{if(j)j.location.href=u}catch(e){}};";
      (doc.body ?? doc.documentElement).appendChild(s);
    }
    return w?.abrir ? w : null;
  } catch {
    return null;
  }
}

export function abrirJanelaDoBanco(url: string | null): JanelaDoBanco | null {
  // Sem o link ainda: a tela "preparando" da ponte (21/11/2026: era about:blank, uma janela em branco).
  const destino = url ? ponteDoBanco(url) : "/novarecash/conectar-banco";
  const celular = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  const [w, h] = [480, 720];
  const esquerda = Math.round(window.screenX + Math.max(0, (window.outerWidth - w) / 2));
  const topo = Math.round(window.screenY + Math.max(0, (window.outerHeight - h) / 2));
  // Sempre a MESMA janela nomeada e sempre como pop-up (13/11/2026): no computador, uma janelinha por cima
  // do app; no celular com o app instalado (Android), abre sobreposta ao app e, ao fechar, volta para ele;
  // e reabrir não empilha abas. A aba do app nunca sai do lugar.
  const alvo = "ncash-banco";
  const recursos = celular ? "popup=yes" : `popup=yes,width=${w},height=${h},left=${esquerda},top=${topo}`;

  const a = abridor();
  if (a?.abrir) {
    if (!a.abrir(destino, alvo, recursos)) return null;
    return { fechada: () => a.fechou?.() ?? true, fechar: () => a.fechar?.(), irPara: (u) => a.ir?.(ponteDoBanco(u)) };
  }
  const j = window.open(destino, alvo, recursos);
  if (!j) return null;
  return {
    fechada: () => j.closed,
    fechar: () => {
      try {
        j.close();
      } catch {}
    },
    irPara: (u) => {
      j.location.href = ponteDoBanco(u);
    },
  };
}

// ── Atualização automática ──────────────────────────────────────────────────

const CHAVE_ULTIMA_SYNC = "ncash:open-finance:ultima-sync";
/** De quanto em quanto tempo o NovareCash atualiza sozinho ao abrir o app. */
export const INTERVALO_SYNC = 6 * 60 * 60_000;

export function marcarSincronizado() {
  try {
    localStorage.setItem(CHAVE_ULTIMA_SYNC, String(Date.now()));
  } catch {}
}

export function precisaSincronizar(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(CHAVE_ULTIMA_SYNC) || 0) > INTERVALO_SYNC;
  } catch {
    return false;
  }
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
  falhasRecentes = lista(r, "falhas").map((f) => texto(f.banco) || "um dos bancos");
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

/**
 * O NOME QUE A PESSOA ENTENDE (06/11/2026). Alguns bancos mandam um código no lugar
 * do nome ("DIGITAL_PRASAUDE", no Mercado Pago). Código = só maiúsculas, números e
 * `_`: vira "Mercado Pago · Conta 4676…". Nome de verdade ("Conta Corrente",
 * "Nubank Ultravioleta") passa como veio.
 */
export function nomeDaConta(conta: Pick<ContaBanco, "nome" | "numero" | "cartao">, banco: string | null): string {
  const codigo = /^[A-Z0-9_]+$/.test(conta.nome) && conta.nome.includes("_");
  if (!codigo) return conta.nome;
  const tipo = conta.cartao ? "Cartão" : "Conta";
  return `${banco || tipo}${conta.numero ? ` · ${tipo} ${conta.numero}` : banco ? ` · ${tipo}` : ""}`;
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
  /** A categoria que o PROVEDOR do Open Finance já deu (ex.: "Shopping"), quando vem. */
  categoriaBanco?: string;
  /** Pix/TED entre contas do MESMO dono (o provedor diz, ou a descrição: bolso, cofrinho…). */
  mesmoDono?: boolean;
};

/** Texto de um objeto aninhado (`paymentData.receiver.name`…), sem quebrar se faltar um nível. */
function aninhado(o: unknown, ...caminho: string[]): string {
  let v: unknown = o;
  for (const k of caminho) v = v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined;
  return typeof v === "string" ? v.trim() : "";
}

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

  const original = numero(t.amount, t.value, t.valor);
  // 13/11/2026: compra em dólar vem com `amount` em US$; o que pesa no bolso é o valor na moeda da conta.
  const emReal = numero(t.amountInAccountCurrency, t.amount_in_account_currency);
  const bruto = original !== null && emReal !== null && emReal !== 0 ? Math.sign(original) * Math.abs(emReal) : original;
  /* 12/11/2026: a data vem em UTC ("2026-11-05T01:30:00Z" é dia 4 às 22h30 em Brasília). Com hora, converte
     para America/Sao_Paulo; só a data, usa como veio. */
  const cru = texto(t.date, t.transactionDate, t.bookingDate, t.data);
  /* 13/11/2026: hora EXATAMENTE 00:00:00Z é "só a data" (vários bancos mandam assim). Converter para
     Brasília jogava para o dia anterior: o salário do dia 1º caía no mês passado. */
  const soData = /T00:00(:00(\.0+)?)?(Z|\+00:?00)?$/.test(cru);
  const data = !soData && /T\d{2}:\d{2}/.test(cru) && Number.isFinite(Date.parse(cru))
    ? new Date(cru).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
    : cru.slice(0, 10);
  if (bruto === null || bruto === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  const tipoBanco = texto(t.type, t.creditDebitType, t.credit_debit_type).toUpperCase();
  let tipo: "entrada" | "saida";
  if (tipoBanco === "DEBIT" || tipoBanco === "DEBITO") tipo = "saida";
  else if (tipoBanco === "CREDIT" || tipoBanco === "CREDITO") tipo = "entrada";
  else if (cartao) tipo = bruto > 0 ? "saida" : "entrada";
  else tipo = bruto < 0 ? "saida" : "entrada";

  const valor = Math.round(Math.abs(bruto) * 100) / 100;
  /* QUEM RECEBEU / QUEM PAGOU (06/11/2026). O Mercado Pago descreve quase tudo como
     "Transferência enviada", sem dizer para quem — o extrato virava uma lista igual. Quando o
     provedor manda o nome (loja ou pessoa), ele entra na descrição. */
  const loja = aninhado(t, "merchant", "businessName") || aninhado(t, "merchant", "name") || texto(t.merchant_name);
  const outro =
    tipo === "saida"
      ? aninhado(t, "paymentData", "receiver", "name") || aninhado(t, "payment_data", "receiver", "name") || texto(t.receiver_name)
      : aninhado(t, "paymentData", "payer", "name") || aninhado(t, "payment_data", "payer", "name") || texto(t.payer_name);
  const base = texto(t.description, t.descriptionRaw, t.name, t.descricao) || "Transação do banco";
  const generica = /^(transfer[eê]ncia|pix|ted|doc)( pix)?( enviad[ao]| recebid[ao])?(:.*)?$/i.test(base.trim());
  const contraparte = loja || outro;
  const descricao = (
    contraparte && generica
      ? `${tipo === "saida" ? "Pix para" : "Pix de"} ${contraparte}`
      : contraparte && !semAcento(base).includes(semAcento(contraparte))
        ? `${base} · ${contraparte}`
        : base
  ).slice(0, 120);

  // Parcela do cartão (13/11/2026): "(3/10)" na descrição, quando o banco informa e ela ainda não tem.
  const meta = (t.creditCardMetadata ?? t.credit_card_metadata ?? t.card) as Record<string, unknown> | undefined;
  const parcela = numero(meta?.installmentNumber, meta?.installment_number);
  const parcelas = numero(meta?.totalInstallments, meta?.total_installments);
  const comParcela =
    cartao && parcela && parcelas && parcelas > 1 && !/\d+\s*\/\s*\d+/.test(descricao) ? `${descricao} (${parcela}/${parcelas})`.slice(0, 120) : descricao;

  const categoriaBanco = texto(t.category, t.categoryName, t.category_name);
  const mesmoDono =
    /same ?(person|owner)|mesma titularidade|entre contas/i.test(`${categoriaBanco} ${texto(t.categoryId, t.category_id)}`) ||
    /\b(do|para o|ao) bolso\b|cofrinho|caixinha|reserva de emerg/i.test(semAcento(base));
  const id = texto(t.id, t.transaction_id, t.transactionId);

  return {
    // Chave reserva com a descrição CRUA (12/11/2026): com o nome do recebedor dentro, mudaria se o provedor passasse a mandá-lo.
    externo_id: (id || `h:${data}|${valor.toFixed(2)}|${tipo}|${base.toLowerCase()}`).slice(0, 200),
    data,
    valor,
    tipo,
    descricao: comParcela,
    ...(categoriaBanco ? { categoriaBanco } : {}),
    ...(mesmoDono ? { mesmoDono } : {}),
  };
}

/** `desde`: data inicial (AAAA-MM-DD) ou quantos dias para trás. */
export async function transacoesDaConta(conta: ContaBanco, desde: number | string = 90): Promise<TransacaoBanco[]> {
  const ate = new Date();
  const de = typeof desde === "string" ? desde : isoLocal(new Date(ate.getFullYear(), ate.getMonth(), ate.getDate() - desde));
  const r = await chamar("transactions/list", {
    account_id: conta.id,
    from: de,
    to: isoLocal(ate),
    startDate: de,
    endDate: isoLocal(ate),
    // Cartão: o "rich" traz parcelas e o valor em real das compras em dólar.
    ...(conta.cartao ? { detail: "rich" } : {}),
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

/** A coluna `item_id` só existe depois do SQL v2 (`supabase/novarecash_openfinance_v2.sql`). */
const semColunaItem = (error: unknown) => {
  const e = error as { code?: string; message?: string } | null;
  return !!e && (e.code === "42703" || e.code === "PGRST204" || /item_id/.test(String(e.message ?? "")));
};

type ContaGravada = {
  id: string;
  /** Conta religada de uma conexão antiga do mesmo banco: só entra o que for DEPOIS desta data. */
  depoisDe: string | null;
};

/**
 * A conta do banco em `ncash_contas` (revisto em 13/11/2026):
 *   - JÁ EXISTE (mesmo id do banco): atualiza nome, tipo, saldo e o `item_id`. NÃO reativa conta que a
 *     pessoa escondeu — só a que foi desativada pelo "Desligar" (`item_id = 'desligado'`).
 *   - RECONEXÃO com outra conexão do mesmo banco (ids novos no provedor): acha a conta antiga
 *     desligada (mesma instituição, tipo e nome), troca o id e importa só o que veio DEPOIS do último
 *     lançamento dela. Sem isso, reconectar duplicava 12 meses.
 *   - NOVA: cria.
 * SALDO ZERO só é ignorado em CONTA (o "bolso" das contas digitais); no CARTÃO, zero é fatura quitada.
 */
async function gravarConta(
  sb: SupabaseClient,
  uid: string,
  conta: ContaBanco,
  instituicao: string | null,
  itemId: string | null,
): Promise<ContaGravada> {
  const tipo = conta.cartao ? "cartao" : "conta";
  const campos: Record<string, unknown> = {
    nome: conta.nome,
    tipo,
    instituicao,
    ...(conta.saldo !== null ? { saldo: conta.saldo, saldo_em: new Date().toISOString() } : {}),
  };
  const camposAoAtualizar: Record<string, unknown> =
    conta.saldo === 0 && !conta.cartao ? { nome: campos.nome, tipo, instituicao } : { ...campos };
  let comItem = !!itemId;

  const escrever = async (q: (extra: Record<string, unknown>) => PromiseLike<{ error: unknown; data?: unknown }>, extra: Record<string, unknown>) => {
    let r = await q(comItem ? { ...extra, item_id: itemId } : extra);
    if (r.error && comItem && semColunaItem(r.error)) {
      comItem = false;
      r = await q(extra);
    }
    return r;
  };

  const achar = async () => {
    let r = await sb.from("ncash_contas").select("id, ativa, item_id").eq("user_id", uid).eq("origem", "openfinance").eq("externo_id", conta.id).maybeSingle();
    if (r.error && semColunaItem(r.error)) {
      r = (await sb.from("ncash_contas").select("id, ativa").eq("user_id", uid).eq("origem", "openfinance").eq("externo_id", conta.id).maybeSingle()) as typeof r;
    }
    if (r.error) falhou(r.error);
    return (r.data as { id: string; ativa: boolean; item_id?: string | null } | null) ?? null;
  };

  const existente = await achar();
  if (existente) {
    const reativar = existente.item_id === "desligado";
    const { error } = await escrever(
      (x) => sb.from("ncash_contas").update({ ...camposAoAtualizar, ...x }).eq("id", existente.id).eq("user_id", uid),
      reativar ? { ativa: true } : {},
    );
    if (error) falhou(error);
    return { id: existente.id, depoisDe: null };
  }

  // Reconexão: a mesma conta, desligada, de uma conexão antiga deste banco.
  if (instituicao) {
    const { data: antigas, error } = await sb
      .from("ncash_contas")
      .select("id")
      .eq("user_id", uid)
      .eq("origem", "openfinance")
      .eq("instituicao", instituicao)
      .eq("tipo", tipo)
      .eq("nome", conta.nome)
      .eq("item_id", "desligado")
      .limit(1);
    const antiga = !error ? (antigas ?? [])[0] : undefined;
    if (antiga) {
      const { data: ultima } = await sb
        .from("ncash_transacoes")
        .select("data")
        .eq("user_id", uid)
        .eq("conta_id", antiga.id)
        .order("data", { ascending: false })
        .limit(1);
      const r = await escrever(
        (x) => sb.from("ncash_contas").update({ ...campos, ...x }).eq("id", antiga.id).eq("user_id", uid),
        { externo_id: conta.id, ativa: true },
      );
      if (r.error) falhou(r.error);
      return { id: String(antiga.id), depoisDe: (ultima ?? [])[0]?.data ? String(ultima![0].data) : null };
    }
  }

  const r = await escrever(
    (x) => sb.from("ncash_contas").insert({ ...campos, ...x, user_id: uid, origem: "openfinance", externo_id: conta.id }).select("id").single(),
    {},
  );
  if (r.error || !r.data) {
    // Outra aba criou no mesmo instante: o índice único recusou; usa a dela.
    if (codigoDe(r.error) === "23505") {
      const outra = await achar();
      if (outra) return { id: outra.id, depoisDe: null };
    }
    falhou(r.error);
  }
  return { id: String((r.data as { id: string }).id), depoisDe: null };
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
export function categoriaDoBanco(
  t: Pick<TransacaoBanco, "descricao" | "tipo" | "categoriaBanco" | "mesmoDono">,
  cartao: boolean,
): string {
  const d = ` ${semAcento(t.descricao)} `;
  if (PALAVRAS_FATURA.some((p) => d.includes(semAcento(p)))) return "pagamento_fatura";
  if (cartao && t.tipo === "entrada" && /\b(pagamento|pagto|pgto|pag)\b/.test(d) && !/estorno|reembolso|cashback/.test(d)) {
    return "pagamento_fatura";
  }
  // Entrada no CARTÃO que não é pagamento: estorno/devolução (13/11/2026). Não é renda.
  if (cartao && t.tipo === "entrada") return "estorno";
  // Dinheiro que só muda de bolso (06/11/2026): não é gasto nem renda.
  if (t.mesmoDono) return t.tipo === "entrada" ? "entre_contas" : "investimentos";

  const doProvedor = t.categoriaBanco ? categoriaDoProvedor(t.categoriaBanco, t.tipo) : null;
  if (doProvedor) return doProvedor;
  if (t.tipo === "saida" && /^\s*compra\b/.test(d)) return "compras";

  const palpite = adivinharCategoria(t.descricao, t.tipo);
  /* PIX PARA OUTRA PESSOA É GASTO (06/11/2026). `transferencias` fica FORA das somas de gasto
     (`NAO_E_GASTO`), e no Mercado Pago quase toda compra sai como "Transferência enviada": tirá-las
     zeraria o mês. Só o Pix entre contas do MESMO dono (acima) sai das somas; o resto conta como
     gasto, em "Outros gastos", até a pessoa corrigir. */
  return palpite === "transferencias" ? "outros" : palpite;
}

/**
 * A CATEGORIA QUE O PROVEDOR JÁ DEU → a nossa (06/11/2026). O provedor do Open Finance
 * (Pluggy) classifica muitas transações em inglês ("Shopping", "Groceries"…). Só entra o que
 * tem equivalente claro; transferência genérica ("Transfer - PIX") não decide nada.
 */
export function categoriaDoProvedor(nome: string, tipo: "entrada" | "saida"): ChaveCategoria | null {
  const c = semAcento(nome);
  if (tipo === "entrada") {
    if (/salary|salario/.test(c)) return "salario";
    if (/interest|dividend|yield|rendimento/.test(c)) return "rendimentos";
    return null;
  }
  const regras: [RegExp, ChaveCategoria][] = [
    [/credit card payment|pagamento de fatura/, "pagamento_fatura"],
    [/groceries|supermarket|supermercado/, "mercado"],
    [/eating out|restaurant|food delivery|delivery|restaurante/, "restaurantes"],
    [/taxi|\bride\b|gas station|fuel|parking|toll|transport|mobilidade/, "transporte"],
    [/pharmac|health|hospital|dentist|clinic|saude|farmacia/, "saude"],
    [/education|school|course|educacao/, "educacao"],
    [/streaming|subscription|digital services|assinatura/, "assinaturas"],
    [/\brent\b|housing|electricity|water|utilities|internet|telecom|moradia/, "moradia"],
    [/bank fee|interests charged|late payment|tarifa/, "tarifas"],
    [/\btax|imposto/, "impostos"],
    [/travel|hotel|leisure|entertainment|tickets|lazer/, "lazer"],
    [/shopping|clothing|electronics|compras/, "compras"],
    [/investment|investimento|aplicacao/, "investimentos"],
  ];
  for (const [re, chave] of regras) if (re.test(c)) return chave;
  return null;
}

type LinhaNova = { id: string; conta_id: string; data: string; valor: number; tipo: "entrada" | "saida"; categoria: string };

/**
 * Grava as transações (revisto em 13/11/2026):
 *   - NOVA: entra, com a categoria do primeiro palpite.
 *   - JÁ ESTAVA: se o banco CORRIGIU valor, data ou sentido, corrige aqui — a CATEGORIA nunca é
 *     tocada (a que a pessoa corrigiu no Extrato sobrevive).
 *   - `depoisDe`: conta religada de uma conexão antiga; só entra o que veio depois.
 * Devolve as linhas que entraram (para casar transferências entre as próprias contas).
 */
async function gravarTransacoes(
  sb: SupabaseClient,
  uid: string,
  contaId: string,
  transacoes: TransacaoBanco[],
  cartao: boolean,
  depoisDe: string | null,
): Promise<{ novas: LinhaNova[]; corrigidas: number }> {
  const unicas = [...new Map(transacoes.filter((t) => !depoisDe || t.data > depoisDe).map((t) => [t.externo_id, t])).values()];

  // Lotes de 100: com 200 chaves longas, a URL do `.in()` estourava.
  const ja = new Map<string, { id: string; valor: number; data: string; tipo: string }>();
  for (let i = 0; i < unicas.length; i += 100) {
    const { data, error } = await sb
      .from("ncash_transacoes")
      .select("id, externo_id, valor, data, tipo")
      .eq("user_id", uid)
      .eq("origem", "openfinance")
      .in("externo_id", unicas.slice(i, i + 100).map((t) => t.externo_id));
    if (error) falhou(error);
    for (const l of data ?? []) ja.set(String(l.externo_id), { id: String(l.id), valor: Number(l.valor), data: String(l.data).slice(0, 10), tipo: String(l.tipo) });
  }

  let corrigidas = 0;
  for (const t of unicas) {
    const v = ja.get(t.externo_id);
    if (!v || (Math.abs(v.valor - t.valor) < 0.005 && v.data === t.data && v.tipo === t.tipo)) continue;
    const { error } = await sb.from("ncash_transacoes").update({ valor: t.valor, data: t.data, tipo: t.tipo }).eq("id", v.id).eq("user_id", uid);
    if (!error) corrigidas++;
  }

  /* SEM DUPLICAR O QUE A PESSOA JÁ LANÇOU (13/11/2026): lançamento à mão, pelo WhatsApp ou por
     importação de extrato com o MESMO valor e sentido, até 1 dia de diferença, conta como o mesmo —
     o do banco não entra (cada lançamento dela "casa" com um só do banco). */
  const faltam = unicas.filter((t) => !ja.has(t.externo_id));
  const jaLancado = new Set<string>();
  if (faltam.length) {
    const datas = faltam.map((t) => t.data).sort();
    const umDia = (d: string, n: number) => {
      const x = new Date(`${d}T12:00:00`);
      x.setDate(x.getDate() + n);
      return isoLocal(x);
    };
    const { data: proprios } = await sb
      .from("ncash_transacoes")
      .select("id, data, valor, tipo")
      .eq("user_id", uid)
      .neq("origem", "openfinance")
      .gte("data", umDia(datas[0], -1))
      .lte("data", umDia(datas[datas.length - 1], 1))
      .limit(5000);
    const livres = (proprios ?? []).map((l) => ({ id: String(l.id), data: String(l.data).slice(0, 10), valor: Number(l.valor), tipo: String(l.tipo) }));
    const usados = new Set<string>();

    /* RELIGOU O BANCO (13/11/2026): uma conexão nova manda as MESMAS transações com ids NOVOS — elas
       entravam de novo e o extrato dobrava. Lançamento do Open Finance já gravado com outro id (de uma
       conexão antiga), com mesma data, valor, sentido e descrição, é o mesmo: o novo não entra.
       Cada antigo casa com um só novo (dois cafés iguais no mesmo dia continuam dois). */
    const idsDoLote = new Set(unicas.map((t) => t.externo_id));
    const { data: doBanco } = await sb
      .from("ncash_transacoes")
      .select("id, externo_id, data, valor, tipo, descricao")
      .eq("user_id", uid)
      .eq("origem", "openfinance")
      .gte("data", datas[0])
      .lte("data", datas[datas.length - 1])
      .limit(10000);
    const antigos = (doBanco ?? [])
      .filter((l) => !idsDoLote.has(String(l.externo_id)))
      .map((l) => ({ id: String(l.id), data: String(l.data).slice(0, 10), valor: Number(l.valor), tipo: String(l.tipo), desc: semAcento(String(l.descricao ?? "")).trim() }));
    for (const t of faltam) {
      const desc = semAcento(t.descricao).trim();
      const par = antigos.find((l) => !usados.has(l.id) && l.tipo === t.tipo && l.data === t.data && Math.abs(l.valor - t.valor) < 0.005 && l.desc === desc);
      if (par) {
        usados.add(par.id);
        jaLancado.add(t.externo_id);
      }
    }

    for (const t of faltam) {
      if (jaLancado.has(t.externo_id)) continue;
      const par = livres.find(
        (l) => !usados.has(l.id) && l.tipo === t.tipo && Math.abs(l.valor - t.valor) < 0.005 && (l.data === t.data || l.data === umDia(t.data, -1) || l.data === umDia(t.data, 1)),
      );
      if (par) {
        usados.add(par.id);
        jaLancado.add(t.externo_id);
      }
    }
  }

  const paraGravar = unicas
    .filter((t) => !ja.has(t.externo_id) && !jaLancado.has(t.externo_id))
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

  const COLUNAS = "id, conta_id, data, valor, tipo, categoria";
  const novas: LinhaNova[] = [];
  for (let i = 0; i < paraGravar.length; i += 300) {
    let lote = paraGravar.slice(i, i + 300);
    let r = await sb.from("ncash_transacoes").insert(lote).select(COLUNAS);
    if (r.error && codigoDe(r.error) === "23505") {
      // Algumas entraram por outro caminho (outra aba) entre a leitura e a gravação: tira essas e grava o resto de uma vez.
      const { data } = await sb
        .from("ncash_transacoes")
        .select("externo_id")
        .eq("user_id", uid)
        .eq("origem", "openfinance")
        .in("externo_id", lote.map((l) => l.externo_id).slice(0, 100));
      const entrou = new Set((data ?? []).map((l) => String(l.externo_id)));
      lote = lote.filter((l) => !entrou.has(l.externo_id));
      r = lote.length ? await sb.from("ncash_transacoes").insert(lote).select(COLUNAS) : { data: [], error: null } as unknown as typeof r;
      // Ainda repetida (lote > 100): uma a uma, só nesse caso raro.
      if (r.error && codigoDe(r.error) === "23505") {
        const uma: LinhaNova[] = [];
        for (const linha of lote) {
          const x = await sb.from("ncash_transacoes").insert(linha).select(COLUNAS).single();
          if (!x.error && x.data) uma.push(x.data as LinhaNova);
          else if (x.error && codigoDe(x.error) !== "23505") falhou(x.error);
        }
        novas.push(...uma);
        continue;
      }
    }
    if (r.error) falhou(r.error);
    novas.push(...((r.data ?? []) as LinhaNova[]));
  }
  return { novas, corrigidas };
}

/**
 * DINHEIRO QUE SÓ MUDOU DE CONTA (13/11/2026). Saída numa conta + entrada de MESMO valor noutra conta
 * da pessoa, com até 1 dia de diferença, ainda nas categorias genéricas:
 *   - entrada num CARTÃO → as duas são `pagamento_fatura` (pagar a fatura não é gasto);
 *   - entrada noutra CONTA → saída `transferencias` e entrada `entre_contas`.
 * Sem isto, a TED Itaú → Nubank virava gasto E renda, e o pagamento da fatura somava em dobro.
 */
async function casarTransferencias(sb: SupabaseClient, uid: string, novas: LinhaNova[], cartoes: Set<string>) {
  const GENERICA_SAIDA = new Set(["outros", "transferencias"]);
  const GENERICA_ENTRADA = new Set(["outras_entradas", "estorno"]);
  const dia = (d: string) => Date.parse(`${d}T12:00:00Z`) / 86_400_000;
  const saidas = novas.filter((l) => l.tipo === "saida" && GENERICA_SAIDA.has(l.categoria));
  const entradas = novas.filter((l) => l.tipo === "entrada" && GENERICA_ENTRADA.has(l.categoria));
  const usadas = new Set<string>();
  const mudar = new Map<string, string[]>();
  const anotar = (cat: string, id: string) => mudar.set(cat, [...(mudar.get(cat) ?? []), id]);

  for (const s of saidas) {
    const par = entradas.find(
      (e) => !usadas.has(e.id) && e.conta_id !== s.conta_id && Math.abs(Number(e.valor) - Number(s.valor)) < 0.005 && Math.abs(dia(e.data) - dia(s.data)) <= 1,
    );
    if (!par) continue;
    usadas.add(par.id);
    if (cartoes.has(par.conta_id)) {
      anotar("pagamento_fatura", s.id);
      anotar("pagamento_fatura", par.id);
    } else if (!cartoes.has(s.conta_id)) {
      anotar("transferencias", s.id);
      anotar("entre_contas", par.id);
    }
  }
  for (const [cat, ids] of mudar) {
    for (let i = 0; i < ids.length; i += 100) {
      await sb.from("ncash_transacoes").update({ categoria: cat }).eq("user_id", uid).in("id", ids.slice(i, i + 100));
    }
  }
}

export type ResultadoSincronizacao = {
  contas: number;
  /** Transações que o banco mandou (sem as pendentes). */
  lidas: number;
  novas: number;
  jaEstavam: number;
  /** Lançamentos que o banco corrigiu (valor/data) e foram atualizados aqui. */
  corrigidas: number;
  /** Contas (ou bancos) que falharam, sem derrubar as outras. */
  falhas: string[];
};

/**
 * Sincroniza: para cada conta do banco, grava a conta com o saldo e traz as transações.
 *   - `dias` informado: essa janela (12 meses na primeira importação, 90 no "Sincronizar agora").
 *   - SEM `dias` (a atualização automática): DESDE O ÚLTIMO LANÇAMENTO DA CONTA, com 7 dias de folga
 *     — quem fica 45 dias sem abrir o app não perde nada; conta sem nada importado busca 12 meses.
 * Duas contas por vez (cabe no limite do Banco MCP). Rodar de novo não duplica nada.
 */
export async function sincronizar(args: { contas: ContaBanco[]; conexoes: Conexao[]; dias?: number }): Promise<ResultadoSincronizacao> {
  const sb = createClient();
  const uid = await usuarioDaSessao(sb).catch(() => {
    throw new ErroBanco("sessao", FRASE.sessao);
  });
  const bancoDe = new Map(args.conexoes.map((c) => [c.itemId, c.banco]));
  const unicoBanco = args.conexoes.length === 1 ? args.conexoes[0].banco : null;
  const unicoItem = args.conexoes.length === 1 ? args.conexoes[0].itemId : null;

  const r: ResultadoSincronizacao = { contas: 0, lidas: 0, novas: 0, jaEstavam: 0, corrigidas: 0, falhas: [...bancosComFalha()] };
  const todasNovas: LinhaNova[] = [];
  const cartoes = new Set<string>();
  let semTabela: ErroDados | null = null;

  const uma = async (conta: ContaBanco) => {
    try {
      const instituicao = (conta.itemId && bancoDe.get(conta.itemId)) || unicoBanco;
      const gravada = await gravarConta(sb, uid, { ...conta, nome: nomeDaConta(conta, instituicao) }, instituicao, conta.itemId || unicoItem);
      if (conta.cartao) cartoes.add(gravada.id);

      let desde: number | string = args.dias ?? 365;
      if (args.dias === undefined) {
        const { data: ultima } = await sb
          .from("ncash_transacoes")
          .select("data")
          .eq("user_id", uid)
          .eq("conta_id", gravada.id)
          .eq("origem", "openfinance")
          .order("data", { ascending: false })
          .limit(1);
        const d = (ultima ?? [])[0]?.data;
        if (d) {
          const base = new Date(`${String(d).slice(0, 10)}T12:00:00`);
          base.setDate(base.getDate() - 7);
          desde = isoLocal(base);
        }
      }
      const transacoes = await transacoesDaConta(conta, desde);
      const { novas, corrigidas } = await gravarTransacoes(sb, uid, gravada.id, transacoes, conta.cartao, gravada.depoisDe);
      r.contas++;
      r.lidas += transacoes.length;
      r.novas += novas.length;
      r.corrigidas += corrigidas;
      r.jaEstavam += Math.max(0, transacoes.length - novas.length);
      todasNovas.push(...novas);
    } catch (e) {
      // Tabela que não existe vale para todas: não adianta tentar a próxima.
      if (e instanceof ErroDados && e.motivo === "sem-tabela") semTabela = e;
      console.warn("[open-finance] sincronizar", conta.nome, e instanceof Error ? e.message : e);
      r.falhas.push(conta.nome);
    }
  };

  const fila = [...args.contas];
  await Promise.all(
    Array.from({ length: Math.min(2, fila.length) }, async () => {
      while (fila.length && !semTabela) await uma(fila.shift()!);
    }),
  );
  if (semTabela) throw semTabela;
  if (todasNovas.length) await casarTransferencias(sb, uid, todasNovas, cartoes).catch(() => undefined);
  // Cartão se configura sozinho (limite, fechamento, vencimento), só onde a pessoa não preencheu.
  if (cartoes.size) await listarCartoesDoBanco().then(configurarCartoes).catch(() => undefined);
  return r;
}

/**
 * As contas com saldo. O saldo que a lista não trouxe vem de UMA chamada em lote (`accounts/balance`
 * com várias contas); se o lote não responder, conta por conta.
 */
export async function contasComSaldo(): Promise<ContaBanco[]> {
  const cs = await listarContas();
  const faltam = cs.filter((c) => c.saldo === null);
  if (!faltam.length) return cs;
  const saldos = new Map<string, number>();
  try {
    const r = await chamar("accounts/balance");
    for (const b of lista(r, "results", "balances", "items", "data")) {
      const id = texto(b.account_id, b.accountId, b.id);
      const v = numero(b.balance, b.current_balance, b.available_balance, b.current, b.available, b.amount);
      if (id && v !== null) saldos.set(id, v);
    }
  } catch {}
  const comSaldo: ContaBanco[] = [];
  for (const c of cs) {
    if (c.saldo !== null) comSaldo.push(c);
    else if (saldos.has(c.id)) comSaldo.push({ ...c, saldo: saldos.get(c.id)! });
    else comSaldo.push({ ...c, saldo: saldos.size ? null : await saldoDaConta(c.id).catch(() => null) });
  }
  return comSaldo;
}

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// ── Refazer os 12 meses quando o banco terminar (13/11/2026) ────────────────
const CHAVE_REFAZER = "ncash:open-finance:refazer";
/** Bancos cuja primeira importação pegou o banco ainda "atualizando": a próxima atualização refaz 12 meses. */
export function itensParaRefazer(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_REFAZER) || "[]") as string[];
  } catch {
    return [];
  }
}
function marcarRefazer(itemId: string, sim: boolean) {
  try {
    const atual = new Set(itensParaRefazer());
    if (sim) atual.add(itemId);
    else atual.delete(itemId);
    localStorage.setItem(CHAVE_REFAZER, JSON.stringify([...atual]));
  } catch {}
}
export const refeito = (itemId: string) => marcarRefazer(itemId, false);

/**
 * TRAZ TUDO SOZINHO depois de conectar (ou reconectar, ou "Atualizar agora"):
 *   1. espera o banco terminar de mandar os dados (UPDATING → UPDATED, até ~2 min);
 *   2. lê contas e cartões com o saldo (de novo, se o banco ainda não listou);
 *   3. grava os lançamentos dos últimos `dias` (12 meses na primeira vez), sem duplicar.
 * Se o banco AINDA estava atualizando no fim da espera, marca para refazer os 12 meses depois.
 * `aoAvancar` recebe a frase do passo, para a tela mostrar.
 */
export async function trazerTudo(opcoes: {
  itemId?: string | null;
  dias?: number;
  aoAvancar?: (frase: string) => void;
}): Promise<{ resultado: ResultadoSincronizacao; conexoes: Conexao[]; contas: ContaBanco[] }> {
  const avisar = opcoes.aoAvancar ?? (() => {});

  avisar("Conferindo a conexão com o banco…");
  let conexoes = await listarConexoes(true);
  let aindaAtualizando = false;
  for (let i = 0; opcoes.itemId && i < 24; i++) {
    const status = conexoes.find((c) => c.itemId === opcoes.itemId)?.status ?? "";
    if (precisaReconectar(status)) {
      throw new ErroBanco(
        "falha",
        PEDE_ACAO.test(status)
          ? "O banco está pedindo uma confirmação. Toque em Reconectar e confirme no app do banco."
          : "O banco não liberou o acesso. Toque em Reconectar para autorizar de novo.",
        status,
      );
    }
    aindaAtualizando = EM_ANDAMENTO.test(status);
    if (!aindaAtualizando) break;
    avisar("O banco está enviando os seus dados. Pode levar até 2 minutos…");
    await esperar(5000);
    conexoes = await listarConexoes(true);
  }

  avisar("Lendo as suas contas e cartões…");
  let contas: ContaBanco[] = [];
  for (let i = 0; i < 6; i++) {
    contas = await contasComSaldo();
    if (contas.length) break;
    await esperar(5000);
  }

  const n = contas.length;
  avisar(n ? `Trazendo os lançamentos de ${n} ${n === 1 ? "conta" : "contas e cartões"}…` : "O banco ainda não mandou as contas…");
  const resultado = await sincronizar({ contas, conexoes, dias: opcoes.dias });
  if (opcoes.itemId) marcarRefazer(opcoes.itemId, aindaAtualizando || n === 0);
  // Só marca como "em dia" se veio algo: senão a próxima abertura do app tenta de novo.
  if (resultado.lidas > 0 || resultado.contas > 0) marcarSincronizado();
  return { resultado, conexoes, contas };
}

/**
 * ZERAR O BANCO (13/11/2026): apaga TODOS os lançamentos que vieram do Open Finance (os lançados à mão,
 * pelo WhatsApp ou por importação ficam) e traz de novo os 12 meses das conexões ativas, limpos.
 * Conserta extrato duplicado. A categoria corrigida à mão nesses lançamentos volta ao palpite.
 */
export async function zerarEImportar(aoAvancar?: (frase: string) => void): Promise<{ apagadas: number; resultado: ResultadoSincronizacao }> {
  const sb = createClient();
  const uid = await usuarioDaSessao(sb);
  aoAvancar?.("Apagando os lançamentos que vieram do banco…");
  const { count, error } = await sb.from("ncash_transacoes").delete({ count: "exact" }).eq("user_id", uid).eq("origem", "openfinance");
  if (error) falhou(error);
  const r = await trazerTudo({ dias: 365, aoAvancar });
  return { apagadas: count ?? 0, resultado: r.resultado };
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

// ── Cartões: faturas reais e detalhe (fase 2, 13/11/2026) ──────────────────

export type FaturaBanco = {
  id: string;
  /** Vencimento (AAAA-MM-DD). */
  vence: string | null;
  total: number | null;
  minimo: number | null;
  /** "paga" | "aberta" | "atrasada" | "futura" | null (derivado pelo Banco MCP: `payment_status`). */
  situacao: "paga" | "aberta" | "atrasada" | "futura" | null;
};

export type CartaoBanco = {
  accountId: string;
  itemId: string | null;
  limite: number | null;
  disponivel: number | null;
  /** Dia do mês em que a fatura fecha / vence (do próprio banco). */
  fechaDia: number | null;
  venceDia: number | null;
  faturas: FaturaBanco[];
};

const dataIso = (...v: unknown[]) => {
  const t = texto(...v);
  return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : null;
};
const diaDe = (iso: string | null) => (iso ? Number(iso.slice(8, 10)) || null : null);

function situacaoDa(f: Record<string, unknown>, vence: string | null): FaturaBanco["situacao"] {
  const s = semAcento(texto(f.payment_status, f.paymentStatus, f.status)).toLowerCase();
  if (/paid|paga|quitad/.test(s)) return "paga";
  if (/overdue|late|atras|vencid/.test(s)) return "atrasada";
  if (/future|futur|next|proxim/.test(s)) return "futura";
  if (/open|aberta|pending|unpaid|partial/.test(s)) return "aberta";
  if (!vence) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  return vence < hoje ? "atrasada" : "aberta";
}

/** Por cartão do banco: limite, disponível, dias de fechamento/vencimento e as últimas faturas. */
export async function listarCartoesDoBanco(): Promise<CartaoBanco[]> {
  const r = await chamar("cartoes");
  return lista(r, "results").map((c) => {
    const d = (c.detalhe ?? {}) as Record<string, unknown>;
    const cred = ((d.creditData ?? d.credit_data ?? d.credit ?? {}) as Record<string, unknown>) || {};
    const faturas = lista(c, "faturas")
      .map((f) => {
        const vence = dataIso(f.dueDate, f.due_date, f.vencimento);
        return {
          id: texto(f.id, f.bill_id),
          vence,
          total: valorDe(f.totalAmount, f.total_amount, f.amount, f.total),
          minimo: valorDe(f.minimumPaymentAmount, f.minimum_payment_amount, f.minimumPayment),
          situacao: situacaoDa(f, vence),
        } satisfies FaturaBanco;
      })
      .filter((f) => f.id || f.vence)
      .sort((a, b) => String(b.vence ?? "").localeCompare(String(a.vence ?? "")));
    const fecha = dataIso(cred.balanceCloseDate, cred.balance_close_date, d.balanceCloseDate);
    const vence = dataIso(cred.balanceDueDate, cred.balance_due_date, d.balanceDueDate) ?? faturas[0]?.vence ?? null;
    return {
      accountId: texto(c.account_id),
      itemId: texto(c.item_id) || null,
      limite: valorDe(cred.creditLimit, cred.credit_limit, d.creditLimit),
      disponivel: valorDe(cred.availableCreditLimit, cred.available_credit_limit, d.availableCreditLimit),
      fechaDia: diaDe(fecha),
      venceDia: diaDe(vence),
      faturas,
    };
  });
}

/** A fatura que importa agora: a aberta/atrasada mais próxima; senão a mais recente. */
export function faturaAtual(c: CartaoBanco): FaturaBanco | null {
  const pendentes = c.faturas.filter((f) => f.situacao === "aberta" || f.situacao === "atrasada");
  return pendentes.sort((a, b) => String(a.vence ?? "").localeCompare(String(b.vence ?? "")))[0] ?? c.faturas[0] ?? null;
}

/**
 * O CARTÃO SE CONFIGURA SOZINHO: grava limite e dias de fechamento/vencimento que o banco informa
 * nos cartões do NovareCash — só onde a pessoa ainda não preencheu (o que ela digitou manda).
 */
export async function configurarCartoes(cartoes: CartaoBanco[]): Promise<void> {
  if (!cartoes.length) return;
  const sb = createClient();
  const uid = await usuarioDaSessao(sb).catch(() => null);
  if (!uid) return;
  const { data, error } = await sb
    .from("ncash_contas")
    .select("id, externo_id, fecha_dia, vence_dia, limite")
    .eq("user_id", uid)
    .eq("origem", "openfinance")
    .eq("tipo", "cartao")
    .in("externo_id", cartoes.map((c) => c.accountId));
  if (error) return; // SQL dos cartões ainda não rodado: segue sem.
  for (const linha of data ?? []) {
    const c = cartoes.find((x) => x.accountId === linha.externo_id);
    if (!c) continue;
    const campos: Record<string, number> = {};
    if (linha.fecha_dia == null && c.fechaDia) campos.fecha_dia = c.fechaDia;
    if (linha.vence_dia == null && c.venceDia) campos.vence_dia = c.venceDia;
    if (linha.limite == null && c.limite) campos.limite = c.limite;
    if (Object.keys(campos).length) await sb.from("ncash_contas").update(campos).eq("id", linha.id).eq("user_id", uid);
  }
}

// ── Empréstimos e financiamentos (fase 2) ───────────────────────────────────

export type EmprestimoBanco = { id: string; nome: string; saldoDevedor: number; parcelasRestantes: number | null };

/** Contratos de empréstimo/financiamento do banco, com o SALDO DEVEDOR (vai para as Dívidas do Patrimônio). */
export async function listarEmprestimos(): Promise<EmprestimoBanco[]> {
  const r = await chamar("loans/list");
  return lista(r, "results", "loans", "items", "data")
    .map((l) => {
      const parc = (l.installments ?? {}) as Record<string, unknown>;
      return {
        id: texto(l.id, l.loan_id, l.contractNumber),
        nome: texto(l.productName, l.product_name, l.name, l.type) || "Empréstimo",
        saldoDevedor:
          valorDe(l.outstandingBalance, l.outstanding_balance, l.contractOutstandingBalance, l.saldo_devedor, l.balance) ?? 0,
        parcelasRestantes: numero(parc.dueInstallments, parc.due_installments, l.remainingInstallments),
      };
    })
    .filter((l) => l.saldoDevedor > 0);
}
