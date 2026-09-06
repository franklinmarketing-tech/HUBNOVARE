import { createClient } from "@/lib/supabase/server";

/**
 * Em que ponto da assinatura a pessoa está — lido no SERVIDOR.
 *
 * Existe porque `lib/trial.ts` é `"use client"` e a home é server component:
 * ela sabia apenas `assinante` (sim/não) e por isso o card do Planejamento
 * anunciava "7 dias grátis, depois R$ 19,90/mês" para TODO mundo — inclusive
 * para quem já pagava, na mesma tela em que outro bloco dizia que a
 * assinatura estava ativa. Vender o produto para quem já comprou é o tipo de
 * erro que faz a pessoa duvidar se a compra foi registrada.
 *
 * Este módulo só LÊ. Quem cria o teste continua sendo `garantirTeste()`, no
 * cliente, na primeira vez que a pessoa abre o produto — começar o relógio a
 * partir de uma visita à home queimaria dias de quem só passou pela porta.
 */
export type EstadoAssinatura =
  /** Nunca teve nada: vê a oferta. */
  | { fase: "sem" }
  /** Está no teste grátis. `dias` é quanto falta (mínimo 1). */
  | { fase: "teste"; dias: number }
  /** Pagante, admin ou equipe: nenhum preço aparece. */
  | { fase: "ativa" };

const DIA_MS = 24 * 60 * 60 * 1000;

export async function estadoDaAssinatura(): Promise<EstadoAssinatura> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fase: "sem" };

  // Mesma ordem de `trial.ts`: o Hub manda, o teste é o segundo critério.
  const { data: perfil } = await supabase
    .from("hub_profiles")
    .select("role, plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil) {
    const expirou =
      !!perfil.plano_expira_em && new Date(perfil.plano_expira_em) < new Date();
    const proValido = perfil.plano === "pro" && !expirou;
    const equipe = perfil.role === "admin" || perfil.role === "equipe";
    if (proValido || equipe) return { fase: "ativa" };
  }

  const { data: assinatura } = await supabase
    .from("vidaplan_subscriptions")
    .select("status, trial_until")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!assinatura) return { fase: "sem" };
  if (assinatura.status === "active") return { fase: "ativa" };

  if (assinatura.status === "trial" && assinatura.trial_until) {
    const dias = Math.ceil(
      (new Date(assinatura.trial_until).getTime() - Date.now()) / DIA_MS,
    );
    // Zero ou negativo é teste vencido, e vencido volta a ver a oferta.
    if (dias > 0) return { fase: "teste", dias };
  }

  return { fase: "sem" };
}
