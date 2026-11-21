import { createClient } from "@/lib/supabase/server";
import {
  COLUNAS_NOTIFICACAO,
  LIMITE_NOTIFICACOES,
  lerNotificacao,
  type Notificacao,
  type TipoNotificacao,
} from "@/lib/perfil-regras";

export type { Notificacao, TipoNotificacao };

/**
 * As notificações do usuário logado, das mais novas para as mais velhas.
 *
 * Devolve lista vazia sem sessão e também quando a tabela ainda não existe
 * (supabase/hub_notificacoes.sql não foi rodado): o sino some em vez de
 * quebrar a home inteira por causa de um recurso que ainda não foi ligado.
 *
 * As páginas que saem prontas leem o mesmo pelo navegador (`lib/quem-sou.ts`).
 */
export async function getNotificacoes(): Promise<Notificacao[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("hub_notificacoes")
    .select(COLUNAS_NOTIFICACAO)
    .order("criado_em", { ascending: false })
    .limit(LIMITE_NOTIFICACOES);

  if (error || !data) return [];

  return data.map((n) => lerNotificacao(n as Record<string, unknown>));
}
