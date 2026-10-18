"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Sair da conta.
 *
 * ⚠️ MOROU DENTRO DO FINPLAN até 18/10/2026 (`app/finplan/app/actions.ts`),
 * e o FINCASH a importava de lá — um app dependendo do outro por uma função
 * de quatro linhas que não é de nenhum dos dois. Quando o FINPLAN foi
 * excluído, essa dependência apareceu como erro de build no FINCASH.
 *
 * Fica aqui, em `lib`, porque sair da conta é da casa, não de um app.
 */
export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
