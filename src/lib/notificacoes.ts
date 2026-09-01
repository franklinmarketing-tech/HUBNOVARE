import { createClient } from "@/lib/supabase/server";

export type TipoNotificacao = "aviso" | "novidade" | "conta" | "alerta";

export type Notificacao = {
  id: string;
  titulo: string;
  texto: string | null;
  href: string | null;
  tipo: TipoNotificacao;
  lida: boolean;
  criadoEm: string;
};

/** Quantas o sino mostra. Passou disso, a pessoa vai para /notificacoes. */
const LIMITE = 8;

/**
 * As notificações do usuário logado, das mais novas para as mais velhas.
 *
 * Devolve lista vazia sem sessão e também quando a tabela ainda não existe
 * (supabase/hub_notificacoes.sql não foi rodado): o sino some em vez de
 * quebrar a home inteira por causa de um recurso que ainda não foi ligado.
 */
export async function getNotificacoes(): Promise<Notificacao[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("hub_notificacoes")
    .select("id, titulo, texto, href, tipo, lida_em, criado_em")
    .order("criado_em", { ascending: false })
    .limit(LIMITE);

  if (error || !data) return [];

  return data.map((n) => ({
    id: n.id as string,
    titulo: n.titulo as string,
    texto: (n.texto as string | null) ?? null,
    href: (n.href as string | null) ?? null,
    tipo: (n.tipo as TipoNotificacao) ?? "aviso",
    lida: !!n.lida_em,
    criadoEm: n.criado_em as string,
  }));
}
