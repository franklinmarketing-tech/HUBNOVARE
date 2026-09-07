import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { getPerfil } from "@/lib/perfil";
import { trimestreDe } from "@/lib/planejamento/trimestre";
import { EditorRevisao } from "./EditorRevisao";

export const metadata: Metadata = {
  title: "Escrever revisão",
  robots: { index: false, follow: false },
};

/**
 * A tela onde o parecer é escrito.
 *
 * O gate de papel fica AQUI, no servidor, e não no componente de cliente: a
 * verificação tem de acontecer antes de qualquer coisa chegar ao navegador. O
 * RLS do banco é a segunda tranca — mesmo que alguém contorne esta, as
 * policies de `revisoes` só aceitam escrita de quem tem papel de equipe.
 */
export default async function EscreverRevisaoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const perfil = await getPerfil();
  if (!perfil) redirect(`/login?proximo=/equipe/revisoes/${clientId}`);
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  return (
    <div className="aurora-clara min-h-dvh">
      <Cabecalho />
      <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-8">
        <EditorRevisao clientId={clientId} trimestre={trimestreDe()} />
      </main>
    </div>
  );
}
