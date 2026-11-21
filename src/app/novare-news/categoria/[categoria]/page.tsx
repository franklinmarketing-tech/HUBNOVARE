import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FAMILIAS, ORDEM_FAMILIAS, type Familia } from "@/lib/apps";
import { PaginaNews } from "../../PaginaNews";

/**
 * /novare-news/categoria/<chave> — O NEWS FILTRADO POR ÁREA (21/11/2026).
 *
 * Até aqui era `/novare-news?categoria=<chave>`, e ler o endereço obrigava a
 * página a ser montada a cada visita. Agora cada área sai PRONTA. O endereço
 * antigo continua valendo: o next.config redireciona para cá.
 *
 * ⚠️ O CANÔNICO É /novare-news, de propósito — como era com o `?categoria=`:
 * a lista filtrada é a mesma vitrine recortada, e o Google segue lendo uma
 * página só em vez de seis quase iguais.
 */

export function generateStaticParams() {
  return ORDEM_FAMILIAS.map((categoria) => ({ categoria }));
}

export const dynamicParams = false;

const ehFamilia = (c: string): c is Familia => (ORDEM_FAMILIAS as string[]).includes(c);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  const nome = ehFamilia(categoria) ? FAMILIAS[categoria] : "Publicações";
  return {
    title: `${nome} — Novare News`,
    alternates: { canonical: "/novare-news" },
  };
}

export default async function NovareNewsCategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  if (!ehFamilia(categoria)) notFound();
  return <PaginaNews categoriaAtiva={categoria} />;
}
