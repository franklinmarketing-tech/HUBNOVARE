"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marca as notificações do usuário como lidas.
 *
 * Sem `ids`, marca todas as não lidas. A policy de update já limita a
 * escrita às linhas do próprio usuário, então o aviso geral da casa
 * (usuario_id nulo) nunca é marcado por ninguém — ele vale para todos.
 */
export async function marcarLidas(ids?: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  let consulta = supabase
    .from("hub_notificacoes")
    .update({ lida_em: new Date().toISOString() })
    .eq("usuario_id", user.id)
    .is("lida_em", null);

  if (ids?.length) consulta = consulta.in("id", ids);

  await consulta;

  revalidatePath("/");
}
