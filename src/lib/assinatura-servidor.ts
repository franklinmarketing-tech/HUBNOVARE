import { createClient } from "@/lib/supabase/server";
import {
  faseDaAssinatura,
  perfilJaAtiva,
  type EstadoAssinatura,
} from "@/lib/perfil-regras";

/**
 * Em que ponto da assinatura a pessoa está — lido no SERVIDOR.
 *
 * Existe porque `lib/trial.ts` é `"use client"` e a home é server component:
 * ela sabia apenas `assinante` (sim/não) e por isso o card do FINPLAN
 * anunciava "7 dias grátis, depois R$ 19,90/mês" para TODO mundo — inclusive
 * para quem já pagava, na mesma tela em que outro bloco dizia que a
 * assinatura estava ativa. Vender o produto para quem já comprou é o tipo de
 * erro que faz a pessoa duvidar se a compra foi registrada.
 *
 * Este módulo só LÊ. Quem cria o teste continua sendo `garantirTeste()`, no
 * cliente, na primeira vez que a pessoa abre o produto — começar o relógio a
 * partir de uma visita à home queimaria dias de quem só passou pela porta.
 *
 * ⚠️ 21/11/2026: a home saiu pronta e passou a ler isto NO NAVEGADOR
 * (`lib/quem-sou.ts`). As regras são as mesmas, em `lib/perfil-regras.ts`.
 */
export type { EstadoAssinatura };

export async function estadoDaAssinatura(): Promise<EstadoAssinatura> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fase: "sem" };

  const { data: perfil } = await supabase
    .from("hub_profiles")
    .select("role, plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilJaAtiva(perfil)) return { fase: "ativa" };

  const { data: assinatura } = await supabase
    .from("vidaplan_subscriptions")
    .select("status, trial_until")
    .eq("user_id", user.id)
    .maybeSingle();

  return faseDaAssinatura(assinatura);
}
