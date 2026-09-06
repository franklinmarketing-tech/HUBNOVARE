import { notFound, redirect } from "next/navigation";
import { getPerfil } from "@/lib/perfil";

/**
 * A raiz da administração.
 *
 * Verifica antes de redirecionar: sem isto, `/admin` mandava qualquer
 * visitante para `/admin/leads` e o próprio redirecionamento já
 * confirmava que existe uma área de administração aqui. Quem não é da
 * equipe recebe 404, igual ao resto do site para uma rota inexistente.
 */
export default async function AdminPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  redirect("/admin/leads");
}
