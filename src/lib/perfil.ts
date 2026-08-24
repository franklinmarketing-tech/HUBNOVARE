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
