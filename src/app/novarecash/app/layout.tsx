import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/perfil";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";

/**
 * A PORTA DO NOVARECASH. Tudo em /novarecash/app passa por aqui.
 *
 * Sem login → login (e volta para cá). Logado sem assinatura → a página de
 * venda. A regra de quem tem acesso é do banco (`ncash_tem_acesso()`), não
 * deste arquivo: aqui só se pergunta.
 *
 * ⚠️ As ROTAS DE API do NovareCash (IA, banco) perguntam de novo por conta
 * própria — layout não protege route handler.
 */
export const dynamic = "force-dynamic";

export default async function NovareCashAppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/novarecash/app");
  if (!(await temAcessoNovareCash())) redirect("/novarecash?sem-assinatura=1");
  return <>{children}</>;
}
