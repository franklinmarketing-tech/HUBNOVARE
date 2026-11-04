import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * A pessoa logada pode usar o NovareCash?
 *
 * Quem decide é o banco (`ncash_tem_acesso()` em `supabase/novarecash.sql`):
 * assinatura ativa — ou cancelada, ainda dentro do período pago — pelo e-mail
 * da conta, ou ser da equipe. Nenhuma tela reimplementa essa regra.
 *
 * Falha de leitura (função ainda não criada, banco fora) devolve `false`: no
 * pior caso um assinante vê a página de venda por um instante, mas nunca um
 * não assinante entra de graça.
 */
export const temAcessoNovareCash = cache(async function temAcessoNovareCash(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("ncash_tem_acesso");
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
});

export type MinhaAssinatura = {
  status: string;
  plano: string | null;
  expira_em: string | null;
} | null;

/**
 * A linha da própria assinatura. ⚠️ Filtra pelo e-mail mesmo com RLS: para a
 * equipe a RLS devolve TODAS as linhas, e sem o filtro o admin veria a
 * assinatura de um cliente qualquer como se fosse a dele.
 */
export async function minhaAssinatura(): Promise<MinhaAssinatura> {
  try {
    const supabase = await createClient();
    const { data: sessao } = await supabase.auth.getUser();
    const email = sessao.user?.email?.toLowerCase();
    if (!email) return null;
    const { data } = await supabase
      .from("ncash_assinantes")
      .select("status, plano, expira_em")
      .eq("email", email)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}
