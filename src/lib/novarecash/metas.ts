import type { SupabaseClient } from "@supabase/supabase-js";

import { ErroDados, arred, faltaTabela, hojeNoBrasil } from "./dados";

/**
 * AS METAS DO NOVARECASH (04/11/2026) — "quero juntar R$ X até tal data".
 *
 * Tabela `ncash_metas` (supabase/novarecash_insights.sql), com a RLS única
 * `ncash_pode(user_id)`; `user_id` é SEMPRE o de `usuarioDaSessao(sb)`.
 *
 * "Guardei mais R$ X" só soma em `guardado` (RPC `ncash_meta_guardar`, de uma
 * vez no banco): NÃO cria lançamento no extrato. A meta é um cofrinho de
 * intenção, não uma conta.
 *
 * ⚠️ CVM: a meta diz QUANTO guardar por mês, nunca ONDE pôr o dinheiro.
 */

export const ICONES_META = {
  reserva: "Reserva de emergência",
  viagem: "Viagem",
  casa: "Casa",
  carro: "Carro",
  estudo: "Estudo",
  presente: "Presente",
  saude: "Saúde",
  outro: "Outro sonho",
} as const;

export type IconeMeta = keyof typeof ICONES_META;

export type Meta = {
  id: string;
  nome: string;
  valorAlvo: number;
  /** yyyy-mm-dd ou null. */
  prazo: string | null;
  guardado: number;
  icone: IconeMeta;
  categoria: string | null;
  concluida: boolean;
  criadoEm: string;
};

export type DadosMeta = {
  nome: string;
  valorAlvo: number;
  prazo: string | null;
  icone: IconeMeta;
  concluida?: boolean;
  /** Só na edição: corrigir o total guardado. */
  guardado?: number;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function paraMeta(r: Record<string, unknown>): Meta {
  const icone = String(r.icone ?? "reserva");
  return {
    id: String(r.id),
    nome: String(r.nome ?? "Meta"),
    valorAlvo: num(r.valor_alvo),
    prazo: r.prazo ? String(r.prazo).slice(0, 10) : null,
    guardado: num(r.guardado),
    icone: (icone in ICONES_META ? icone : "outro") as IconeMeta,
    categoria: (r.categoria as string | null) ?? null,
    concluida: Boolean(r.concluida),
    criadoEm: String(r.criado_em ?? ""),
  };
}

/** Falta de tabela OU da função (PGRST202) = o `novarecash_insights.sql` não rodou. */
function checar(error: unknown) {
  if (!error) return;
  const e = error as { code?: unknown; message?: unknown };
  const msg = String(e.message ?? "");
  const semFuncao = e.code === "PGRST202" || e.code === "42883" || msg.includes("ncash_meta_guardar");
  throw new ErroDados(faltaTabela(error) || semFuncao ? "sem-tabela" : "falha", msg);
}

// ── Leitura e gravação ──────────────────────────────────────────────────────

/** Abertas primeiro (as mais antigas no topo), concluídas no fim. */
export async function lerMetas(sb: SupabaseClient, uid: string): Promise<Meta[]> {
  const { data, error } = await sb
    .from("ncash_metas")
    .select("*")
    .eq("user_id", uid)
    .order("concluida")
    .order("criado_em");
  checar(error);
  return (data ?? []).map(paraMeta);
}

export async function criarMeta(sb: SupabaseClient, uid: string, d: DadosMeta) {
  const { error } = await sb.from("ncash_metas").insert({
    user_id: uid,
    nome: d.nome,
    valor_alvo: d.valorAlvo,
    prazo: d.prazo,
    icone: d.icone,
    guardado: d.guardado ?? 0,
  });
  checar(error);
}

export async function editarMeta(sb: SupabaseClient, uid: string, id: string, d: DadosMeta) {
  const campos: Record<string, unknown> = {
    nome: d.nome,
    valor_alvo: d.valorAlvo,
    prazo: d.prazo,
    icone: d.icone,
    atualizado_em: new Date().toISOString(),
  };
  if (d.concluida !== undefined) campos.concluida = d.concluida;
  if (d.guardado !== undefined) campos.guardado = d.guardado;
  const { error } = await sb.from("ncash_metas").update(campos).eq("id", id).eq("user_id", uid);
  checar(error);
}

export async function apagarMeta(sb: SupabaseClient, uid: string, id: string) {
  const { error } = await sb.from("ncash_metas").delete().eq("id", id).eq("user_id", uid);
  checar(error);
}

/** "Guardei mais R$ X". Devolve o novo total guardado. Não mexe no extrato. */
export async function guardarNaMeta(sb: SupabaseClient, id: string, valor: number): Promise<number> {
  const { data, error } = await sb.rpc("ncash_meta_guardar", { p_meta: id, p_valor: valor });
  checar(error);
  return num(data);
}

// ── As contas da meta ───────────────────────────────────────────────────────

export type ProgressoMeta = {
  /** guardado / alvo (0..∞). */
  fracao: number;
  falta: number;
  /** Meses até o prazo (mínimo 1), ou null sem prazo. */
  meses: number | null;
  /** Quanto guardar por mês para chegar no prazo; null sem prazo ou se já chegou. */
  porMes: number | null;
  situacao: "concluida" | "chegou" | "atrasada" | "no-prazo" | "sem-prazo";
};

/**
 * Meses até o prazo = dias até lá ÷ 30,44, arredondado para cima, no mínimo 1
 * (prazo neste mês = guardar o que falta agora). Por mês = o que falta ÷ meses.
 */
export function progressoDaMeta(m: Pick<Meta, "valorAlvo" | "guardado" | "prazo" | "concluida">, hoje = hojeNoBrasil()): ProgressoMeta {
  const fracao = m.valorAlvo > 0 ? m.guardado / m.valorAlvo : 0;
  const falta = arred(Math.max(0, m.valorAlvo - m.guardado));
  if (m.concluida) return { fracao, falta, meses: null, porMes: null, situacao: "concluida" };
  if (falta <= 0) return { fracao, falta: 0, meses: null, porMes: null, situacao: "chegou" };
  if (!m.prazo) return { fracao, falta, meses: null, porMes: null, situacao: "sem-prazo" };
  const dias = (Date.parse(`${m.prazo}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86_400_000;
  if (dias < 0) return { fracao, falta, meses: null, porMes: null, situacao: "atrasada" };
  const meses = Math.max(1, Math.ceil(dias / 30.44));
  return { fracao, falta, meses, porMes: arred(falta / meses), situacao: "no-prazo" };
}

// ── Carregar (tela, Início e IA) ────────────────────────────────────────────

export type ResultadoMetas = { estado: "ok"; metas: Meta[] } | { estado: "sem-tabela" } | { estado: "erro" };

/** Nunca lança. `uid` = `usuarioDaSessao(sb)`. */
export async function carregarMetas(sb: SupabaseClient, uid: string): Promise<ResultadoMetas> {
  try {
    return { estado: "ok", metas: await lerMetas(sb, uid) };
  } catch (e) {
    if (e instanceof ErroDados && e.motivo === "sem-tabela") return { estado: "sem-tabela" };
    console.warn("[novarecash] metas falharam:", e instanceof Error ? e.message : e);
    return { estado: "erro" };
  }
}

// ── As frases (tela, Início e IA dizem igual) ───────────────────────────────

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "2027-06-30" → "30/06/2027". */
export const dataBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** O "quanto guardar por mês" em uma frase. */
export function fraseDaMeta(m: Pick<Meta, "valorAlvo" | "guardado" | "prazo" | "concluida">, hoje = hojeNoBrasil()): string {
  const p = progressoDaMeta(m, hoje);
  switch (p.situacao) {
    case "concluida":
      return "Meta concluída.";
    case "chegou":
      return "Você chegou no valor da meta.";
    case "atrasada":
      return `O prazo (${dataBR(m.prazo!)}) passou e faltam ${reais(p.falta)}. Que tal um prazo novo?`;
    case "sem-prazo":
      return `Faltam ${reais(p.falta)}. Com um prazo, o NovareCash calcula quanto guardar por mês.`;
    default:
      return `Guarde ${reais(p.porMes!)} por mês${p.meses === 1 ? " (prazo neste mês)" : ` durante ${p.meses} meses`} para chegar até ${dataBR(m.prazo!)}.`;
  }
}
