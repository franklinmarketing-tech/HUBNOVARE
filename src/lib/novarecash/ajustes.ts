import type { SupabaseClient } from "@supabase/supabase-js";

import { chaveCustomDe, type CategoriaCustom } from "./categorias";
import { ErroDados, faltaTabela } from "./dados";

/**
 * AJUSTES DO NOVARECASH — categorias personalizadas e conta compartilhada
 * (04/11/2026). Contrato em `supabase/novarecash_extras.sql` e
 * `supabase/novarecash_compartilhar.sql`.
 *
 * Toda função recebe o cliente do Supabase de quem chama (navegador). As
 * categorias são do DONO do NovareCash aberto (`usuarioDaSessao`); os convites
 * são sempre do usuário LOGADO (só o dono de verdade convida).
 */

// ── Erros ───────────────────────────────────────────────────────────────────

/**
 * A estrutura ainda não existe: tabela (42P01/PGRST205), função (PGRST202/42883)
 * ou coluna (42703/PGRST204) — o SQL extra não foi rodado. Não é defeito.
 */
export function faltaEstrutura(erro: unknown): boolean {
  if (faltaTabela(erro)) return true;
  if (!erro || typeof erro !== "object") return false;
  const e = erro as { code?: unknown; message?: unknown };
  if (["PGRST202", "42883", "42703", "PGRST204"].includes(String(e.code))) return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("could not find the function") || msg.includes("schema cache");
}

export function checarExtras(error: unknown) {
  if (!error) return;
  throw new ErroDados(faltaEstrutura(error) ? "sem-tabela" : "falha", String((error as { message?: unknown }).message ?? ""));
}

const codigo = (error: unknown) => String((error as { code?: unknown } | null)?.code ?? "");

// ── Categorias personalizadas ───────────────────────────────────────────────

export async function lerCategoriasCustom(sb: SupabaseClient, uid: string): Promise<CategoriaCustom[]> {
  const { data, error } = await sb
    .from("ncash_categorias_custom")
    .select("chave, rotulo, tipo, arquivada")
    .eq("user_id", uid)
    .order("rotulo");
  checarExtras(error);
  return (data ?? []).map((c) => ({
    chave: String(c.chave),
    rotulo: String(c.rotulo),
    tipo: c.tipo === "entrada" ? "entrada" : "saida",
    arquivada: c.arquivada === true,
  }));
}

/**
 * Para as telas que só MOSTRAM categoria (Extrato, Importar): sem a tabela, ou
 * com falha, segue com a lista fixa em vez de derrubar a tela inteira.
 */
export async function lerCategoriasCustomOuNada(sb: SupabaseClient, uid: string): Promise<CategoriaCustom[]> {
  try {
    return await lerCategoriasCustom(sb, uid);
  } catch {
    return [];
  }
}

export type ResultadoCategoria = { ok: true; chave: string } | { ok: false; mensagem: string };

/** Cria. A chave vem do rótulo (`c_<slug>`); se já existir, ganha um número no fim. */
export async function criarCategoriaCustom(
  sb: SupabaseClient,
  uid: string,
  rotulo: string,
  tipo: "entrada" | "saida",
  existentes: CategoriaCustom[],
): Promise<ResultadoCategoria> {
  const nome = rotulo.trim().replace(/\s+/g, " ");
  if (!nome) return { ok: false, mensagem: "Dê um nome à categoria." };
  if (nome.length > 40) return { ok: false, mensagem: "Use até 40 letras no nome." };
  const base = chaveCustomDe(nome);
  if (!base) return { ok: false, mensagem: "Use pelo menos uma letra ou número no nome." };
  if (existentes.some((c) => c.rotulo.toLowerCase() === nome.toLowerCase() && c.tipo === tipo && !c.arquivada)) {
    return { ok: false, mensagem: "Você já tem uma categoria com esse nome." };
  }

  const usadas = new Set(existentes.map((c) => c.chave));
  let chave = base;
  for (let n = 2; usadas.has(chave); n++) chave = `${base.slice(0, 37)}_${n}`;

  const { error } = await sb.from("ncash_categorias_custom").insert({ user_id: uid, chave, rotulo: nome, tipo });
  if (error && codigo(error) === "23505") return { ok: false, mensagem: "Essa categoria acabou de ser criada. Recarregue a lista." };
  checarExtras(error);
  return { ok: true, chave };
}

export async function renomearCategoriaCustom(sb: SupabaseClient, uid: string, chave: string, rotulo: string) {
  const nome = rotulo.trim().replace(/\s+/g, " ").slice(0, 40);
  const { error } = await sb.from("ncash_categorias_custom").update({ rotulo: nome }).eq("user_id", uid).eq("chave", chave);
  checarExtras(error);
}

/** Arquivar = sumir dos seletores. O que já foi lançado nela continua com ela (e com o nome). */
export async function arquivarCategoriaCustom(sb: SupabaseClient, uid: string, chave: string, arquivada: boolean) {
  const { error } = await sb.from("ncash_categorias_custom").update({ arquivada }).eq("user_id", uid).eq("chave", chave);
  checarExtras(error);
}

// ── Conta compartilhada ─────────────────────────────────────────────────────

export type Membro = {
  email: string;
  status: "convidado" | "aceito";
  convidado_em: string;
  aceito_em: string | null;
};

export type ConviteParaMim = {
  dono_id: string;
  /** Nome em `hub_profiles` ou, sem nome, o e-mail do dono. */
  dono_nome: string;
  status: "convidado" | "aceito";
  aceito_em: string | null;
};

export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

/** Os convites que EU (logado) fiz, como dono. */
export async function lerMembros(sb: SupabaseClient, eu: string): Promise<Membro[]> {
  const { data, error } = await sb
    .from("ncash_membros")
    .select("email, status, convidado_em, aceito_em")
    .eq("dono_id", eu)
    .order("convidado_em");
  checarExtras(error);
  return (data ?? []).map((m) => ({
    email: String(m.email),
    status: m.status === "aceito" ? "aceito" : "convidado",
    convidado_em: String(m.convidado_em ?? ""),
    aceito_em: (m.aceito_em as string | null) ?? null,
  }));
}

export async function convidar(sb: SupabaseClient, eu: string, meuEmail: string, email: string): Promise<string | null> {
  const alvo = email.trim().toLowerCase();
  if (!emailValido(alvo)) return "Confira o e-mail: ele parece incompleto.";
  if (alvo === meuEmail.trim().toLowerCase()) return "Esse é o seu próprio e-mail. Convide a outra pessoa.";
  const { error } = await sb.from("ncash_membros").insert({ dono_id: eu, email: alvo });
  if (error && codigo(error) === "23505") return "Esse e-mail já foi convidado.";
  checarExtras(error);
  return null;
}

/** O dono tira alguém (convite pendente ou já aceito). A pessoa volta ao NovareCash dela. */
export async function removerMembro(sb: SupabaseClient, eu: string, email: string) {
  const { error } = await sb.from("ncash_membros").delete().eq("dono_id", eu).eq("email", email);
  checarExtras(error);
}

/**
 * Os convites para o MEU e-mail, com o nome do dono. Pela função
 * `ncash_convites_para_mim()`; sem ela (SQL extra não rodado), lê direto da
 * tabela — a RLS deixa o convidado ver o convite, mas não o nome: vira "o titular".
 */
export async function convitesParaMim(sb: SupabaseClient, meuEmail: string): Promise<ConviteParaMim[]> {
  const { data, error } = await sb.rpc("ncash_convites_para_mim");
  if (!error) {
    return ((data ?? []) as Record<string, unknown>[]).map((c) => ({
      dono_id: String(c.dono_id),
      dono_nome: String(c.dono_nome ?? "o titular"),
      status: c.status === "aceito" ? "aceito" : "convidado",
      aceito_em: (c.aceito_em as string | null) ?? null,
    }));
  }
  if (!faltaEstrutura(error)) checarExtras(error);

  const r = await sb.from("ncash_membros").select("dono_id, status, aceito_em").eq("email", meuEmail.trim().toLowerCase());
  checarExtras(r.error);
  return (r.data ?? []).map((c) => ({
    dono_id: String(c.dono_id),
    dono_nome: "o titular",
    status: c.status === "aceito" ? "aceito" : "convidado",
    aceito_em: (c.aceito_em as string | null) ?? null,
  }));
}

export async function aceitarConvite(sb: SupabaseClient, dono: string): Promise<boolean> {
  const { data, error } = await sb.rpc("ncash_aceitar_convite", { p_dono: dono });
  checarExtras(error);
  return data === true;
}

/** Sair do grupo (aceito) ou recusar (pendente). Precisa de `ncash_sair_do_grupo()` (SQL extra). */
export async function sairDoGrupo(sb: SupabaseClient, dono: string): Promise<boolean> {
  const { data, error } = await sb.rpc("ncash_sair_do_grupo", { p_dono: dono });
  checarExtras(error);
  return data === true;
}
