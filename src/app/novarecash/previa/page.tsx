import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/perfil";
import { dataSimulada } from "@/lib/novarecash/config";
import { PaginaVenda } from "../_venda/PaginaVenda";

/**
 * /novarecash/previa?simular=AAAA-MM-DD — A PRÉVIA DA EQUIPE (21/11/2026).
 *
 * Era `/novarecash?simular=…`, dentro da página de venda — e isso obrigava a
 * página pública a ser montada a cada visita só para conferir se quem abria
 * era da equipe. A prévia ganhou endereço próprio (este, montado na hora) e
 * a página pública saiu pronta. O `?simular=` antigo redireciona para cá
 * (next.config).
 *
 * Só admin/equipe. Qualquer outra pessoa — ou data inválida — vai para a
 * página de verdade.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prévia da página de venda",
  robots: { index: false, follow: false },
};

export default async function PreviaVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ simular?: string }>;
}) {
  const { simular } = await searchParams;
  const perfil = await getPerfil();
  const podeSimular = perfil?.role === "admin" || perfil?.role === "equipe";
  if (!podeSimular || !dataSimulada(simular)) redirect("/novarecash");
  return <PaginaVenda simular={simular} />;
}
