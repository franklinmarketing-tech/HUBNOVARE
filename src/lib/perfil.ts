import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { montarPerfil, type Perfil } from "@/lib/perfil-regras";

export type { Perfil };

/**
 * Perfil do usuário logado, ou null se não houver sessão.
 *
 * Se a linha em `hub_profiles` ainda não existir (ou a tabela não tiver sido
 * criada), o usuário cai em `cliente` — menor privilégio por padrão. A regra
 * mora em `lib/perfil-regras.ts`, a mesma que o navegador usa
 * (`lib/quem-sou.ts`) nas páginas que saem prontas.
 */
/* ⚠️ `cache` (21/10/2026): o layout do admin e a página chamam getPerfil na
   MESMA requisição — eram duas idas ao Supabase por clique de aba. */
export const getPerfil = cache(async function getPerfil(): Promise<Perfil | null> {
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

  return montarPerfil(user, data);
});

/**
 * A pessoa já preencheu a trilha do FINPLAN?
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
