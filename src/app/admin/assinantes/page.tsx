import { notFound, redirect } from "next/navigation";
import { getPerfil } from "@/lib/perfil";
import { Cabecalho } from "@/components/Cabecalho";
import { PainelAssinantes } from "./PainelAssinantes";

/**
 * Quem paga, quem está testando, quem venceu.
 *
 * POR QUE ESTA TELA EXISTE
 * Até aqui, liberar quem pagou era um UPDATE escrito à mão no painel do
 * Supabase. A operação de cobrança da empresa dependia de alguém lembrar a
 * sintaxe, e não sobrava registro de quem liberou o quê. Isso não melhora
 * quando o checkout automático existir: reembolso, cortesia e conta de equipe
 * continuam sendo liberação manual para sempre.
 *
 * SÓ ADMIN, e não `equipe`. A fila de revisões é trabalho de consultor; mexer
 * em acesso pago é mexer em dinheiro. Quem não é admin recebe 404, igual ao
 * resto do site para uma rota que não existe — a página não confirma que
 * existe uma administração aqui.
 */
export const metadata = { title: "Assinantes · Novare" };

export default async function AssinantesPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/assinantes");
  if (perfil.role !== "admin") notFound();

  /* O `Cabecalho` é um server component assíncrono: ele tem de ser
     renderizado AQUI, e não dentro do painel, que é "use client". */
  return (
    <>
      <Cabecalho />
      <PainelAssinantes />
    </>
  );
}
