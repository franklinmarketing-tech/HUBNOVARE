import { createClient } from "@/lib/supabase/server";
import type { Role, PlanoCliente } from "@/lib/apps";

export type Perfil = {
  id: string;
  email: string;
  nome: string;
  role: Role;
  plano: PlanoCliente;
};

const ROLES_VALIDAS: Role[] = ["admin", "equipe", "cliente"];
const PLANOS_VALIDOS: PlanoCliente[] = ["free", "pro"];

/**
 * Perfil do usuário logado, ou null se não houver sessão.
 *
 * Se a linha em `hub_profiles` ainda não existir (ou a tabela não tiver sido
 * criada), o usuário cai em `cliente` — menor privilégio por padrão.
 */
export async function getPerfil(): Promise<Perfil | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("hub_profiles")
    .select("nome, role, plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  const role: Role =
    data?.role && ROLES_VALIDAS.includes(data.role as Role)
      ? (data.role as Role)
      : "cliente";

  // Plano expirado vale o mesmo que free — a data manda sobre o campo.
  const expirou =
    !!data?.plano_expira_em && new Date(data.plano_expira_em) < new Date();

  const plano: PlanoCliente =
    !expirou && data?.plano && PLANOS_VALIDOS.includes(data.plano as PlanoCliente)
      ? (data.plano as PlanoCliente)
      : "free";

  return {
    id: user.id,
    email: user.email ?? "",
    nome: data?.nome || user.user_metadata?.nome || user.email?.split("@")[0] || "",
    role,
    plano,
  };
}

/**
 * A pessoa já preencheu a trilha do Planejamento?
 *
 * A home precisava disto para parar de tratar igual quem respondeu as oito
 * perguntas inteiras e quem nunca abriu o app: os dois viam o mesmo convite,
 * escrito para quem não deu nada.
 *
 * O sinal é o `status` da ficha, que vai de `onboarding_pendente` para
 * `em_diagnostico` quando a trilha termina (ver `finalizar()` em
 * meus-dados/page.tsx). É uma consulta de uma coluna — barata o bastante para
 * rodar na home, e é por isso que não carrego o retrato inteiro aqui.
 *
 * Falha de leitura devolve `false`: no pior caso a pessoa vê o convite de
 * quem não preencheu, que é chato mas não mente sobre o que ela tem.
 */
export async function temFichaPreenchida(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  return !!data?.status && data.status !== "onboarding_pendente";
}
