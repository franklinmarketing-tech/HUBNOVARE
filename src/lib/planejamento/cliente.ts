"use client";

/**
 * A ponte entre o usuário logado e a ficha dele no banco.
 *
 * Todas as policies das tabelas financeiras dependem de um EXISTS que liga
 * `clients.user_id` ao `auth.uid()`. Ou seja: sem o `client_id` correto na mão,
 * nenhum insert passa. É por aqui que tudo começa.
 */

import { createClient } from "@/lib/supabase/client";
import { mesAtual } from "./catalogos";
import type {
  LinhaDespesa,
  LinhaDivida,
  LinhaPatrimonio,
  LinhaRenda,
} from "./diagnostico";

export type EstadoCliente =
  | { tipo: "ok"; clientId: string; status: string }
  | { tipo: "sem-sessao" }
  /**
   * Existe usuário, mas não existe ficha. Acontece de verdade: quem aceita
   * convite de admin tem a linha de `clients` APAGADA
   * (`accept-admin-invite/index.ts:87`). A tela precisa dizer isso em vez de
   * quebrar num insert que a RLS recusa.
   */
  | { tipo: "sem-ficha" };

export async function resolverCliente(): Promise<EstadoCliente> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tipo: "sem-sessao" };

  const { data } = await supabase
    .from("clients")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { tipo: "sem-ficha" };
  return { tipo: "ok", clientId: data.id, status: data.status };
}

export interface Retrato {
  rendas: (LinhaRenda & { id: string; is_primary: boolean; stability: string })[];
  despesas: (LinhaDespesa & { id: string; description: string; is_fixed: boolean; due_day: number | null })[];
  dividas: (LinhaDivida & { id: string; remaining_months: number | null })[];
  patrimonio: (LinhaPatrimonio & { id: string })[];
  seguros: {
    id: string;
    type: string;
    provider: string | null;
    monthly_premium: number | null;
    coverage_amount: number | null;
  }[];
  objetivos: {
    id: string;
    description: string;
    target_amount: number | null;
    deadline: string | null;
    priority: string | null;
    amount_applied: number | null;
    completed_at: string | null;
  }[];
}

const VAZIO: Retrato = {
  rendas: [],
  despesas: [],
  dividas: [],
  patrimonio: [],
  seguros: [],
  objetivos: [],
};

/**
 * Carrega o retrato do mês pedido.
 *
 * Uma linha só aparece se o `month_ref` bater. Quem grava sempre preenche o mês
 * (ver `mesAtual`), então não há o fallback para NULL que o app legado
 * precisava manter.
 */
export async function carregarRetrato(
  clientId: string,
  monthRef = mesAtual(),
): Promise<Retrato> {
  const supabase = createClient();

  const [rendas, despesas, dividas, patrimonio, seguros, objetivos] =
    await Promise.all([
      supabase.from("income").select("*").eq("client_id", clientId).eq("month_ref", monthRef),
      supabase.from("expenses").select("*").eq("client_id", clientId).eq("month_ref", monthRef),
      supabase.from("debts").select("*").eq("client_id", clientId).eq("month_ref", monthRef),
      supabase.from("assets").select("*").eq("client_id", clientId).eq("month_ref", monthRef),
      supabase.from("insurance").select("*").eq("client_id", clientId).eq("month_ref", monthRef),
      supabase.from("goals").select("*").eq("client_id", clientId).eq("month_ref", monthRef),
    ]);

  return {
    ...VAZIO,
    rendas: rendas.data ?? [],
    despesas: despesas.data ?? [],
    dividas: dividas.data ?? [],
    patrimonio: patrimonio.data ?? [],
    seguros: seguros.data ?? [],
    objetivos: objetivos.data ?? [],
  } as Retrato;
}

/**
 * Substitui uma seção inteira do retrato: apaga as linhas do mês e grava as
 * novas.
 *
 * Trocar tudo em vez de casar item a item evita o problema clássico da lista
 * editável — item removido na tela que continua vivo no banco. As linhas são do
 * mês corrente e são poucas; o custo é irrelevante perto da confusão que a
 * alternativa gera.
 */
export async function salvarSecao<T extends Record<string, unknown>>(
  tabela: "income" | "expenses" | "debts" | "assets" | "insurance" | "goals",
  clientId: string,
  linhas: T[],
  monthRef = mesAtual(),
): Promise<{ erro: string | null }> {
  const supabase = createClient();

  const { error: erroApagar } = await supabase
    .from(tabela)
    .delete()
    .eq("client_id", clientId)
    .eq("month_ref", monthRef);
  if (erroApagar) return { erro: erroApagar.message };

  if (linhas.length === 0) return { erro: null };

  const comChaves = linhas.map((linha) => ({
    ...linha,
    client_id: clientId,
    month_ref: monthRef,
  }));

  const { error } = await supabase.from(tabela).insert(comChaves);
  return { erro: error?.message ?? null };
}

/**
 * Liga o lançamento mensal para o próprio usuário.
 *
 * No app do consultor essa flag nasce `false` e só um admin a virava — era o
 * que prendia o cliente numa tela de "modo visualização" para sempre. A policy
 * `Clients can update own data` é UPDATE sem WITH CHECK, então o dono pode
 * ligá-la sozinho. Num produto sem consultor, isso não é brecha: é o
 * comportamento correto.
 */
export async function liberarLancamento(clientId: string) {
  const supabase = createClient();
  await supabase
    .from("clients")
    .update({ client_can_log_acompanhamento: true })
    .eq("id", clientId);
}
