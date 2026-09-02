"use client";

/**
 * As premissas de aposentadoria que a PESSOA escolhe.
 *
 * Até esta versão, todo cliente rodava com os padrões automáticos de
 * `montarPlano.ts` — aposentar em max(idade+5, 60), renda desejada igual ao
 * custo de vida atual e INSS zero — sem nunca ter sido perguntado. A landing
 * promete o contrário ("a renda que quer receber, a idade em que quer
 * parar"), e essas duas respostas são o coração da conta do Marco Horizonte.
 *
 * ONDE VIVE: em `tool_states` (user_id + chave), a mesma tabela que guarda o
 * estado das ferramentas. É deliberado: criar colunas em `clients` exigiria
 * migração no SQL Editor, e o schema do planejamento não é versionado no
 * repositório. `tool_states` já existe, já tem RLS por dono e aceita JSON.
 */

import { createClient } from "@/lib/supabase/client";

export const CHAVE_PREMISSAS = "planejamento-premissas";

export type PremissasEscolhidas = {
  /** Com quantos anos quer parar de depender do trabalho. */
  idadeAposentadoria: number | null;
  /** Renda mensal desejada na aposentadoria, em R$ de hoje. */
  rendaDesejadaMes: number | null;
  /** Quanto espera de INSS/pensão por mês. Zero é uma resposta válida. */
  rendaINSSMes: number | null;
};

export const PREMISSAS_VAZIAS: PremissasEscolhidas = {
  idadeAposentadoria: null,
  rendaDesejadaMes: null,
  rendaINSSMes: null,
};

function sanear(bruto: unknown): PremissasEscolhidas {
  if (!bruto || typeof bruto !== "object") return PREMISSAS_VAZIAS;
  const b = bruto as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number): number | null => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  return {
    idadeAposentadoria: num(b.idadeAposentadoria, 30, 90),
    rendaDesejadaMes: num(b.rendaDesejadaMes, 0, 10_000_000),
    rendaINSSMes: num(b.rendaINSSMes, 0, 1_000_000),
  };
}

/** Lê as premissas escolhidas. Sem linha (ou erro) → vazias, e o motor usa
 *  os padrões de sempre — nunca inventa resposta pela pessoa. */
export async function lerPremissas(): Promise<PremissasEscolhidas> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return PREMISSAS_VAZIAS;

  const { data } = await supabase
    .from("tool_states")
    .select("dados")
    .eq("user_id", user.id)
    .eq("chave", CHAVE_PREMISSAS)
    .maybeSingle();

  return sanear(data?.dados);
}

export async function gravarPremissas(
  premissas: PremissasEscolhidas,
): Promise<{ erro: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const { error } = await supabase.from("tool_states").upsert(
    { user_id: user.id, chave: CHAVE_PREMISSAS, dados: sanear(premissas) },
    { onConflict: "user_id,chave" },
  );
  return { erro: error?.message ?? null };
}
