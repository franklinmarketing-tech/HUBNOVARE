import type { Metadata } from "next";
import { AssistenteFerramentas } from "@/components/AssistenteFerramentas";
import { CapturaLead } from "@/components/CapturaLead";
import { RodapeNovare } from "@/components/RodapeNovare";
import { VoltarAoWorkspace } from "@/components/VoltarAoWorkspace";
import { appsParaBusca } from "@/lib/navegacao";

export const metadata: Metadata = {
  title: { default: "Ferramentas", template: "%s · Novare Workspace" },
  description:
    "As ferramentas financeiras gratuitas do Novare Workspace: organização, investimentos, crédito e patrimônio.",
};

/**
 * Toda ferramenta ganha a camada de workspace: busca Cmd+K em qualquer
 * tela, registro de recentes e o fecho institucional da Novare.
 *
 * O rodapé e o botão de voltar moram aqui, e não em cada página, porque
 * assim ferramenta nova já nasce com o convite da consultoria e com a
 * saída para a home — sem ninguém lembrar de colar.
 */
export default function LayoutFerramentas({
  children,
}: {
  children: React.ReactNode;
}) {
  const apps = appsParaBusca("cliente", "free");

  return (
    <>
      {children}
      <CapturaLead />
      <VoltarAoWorkspace />
      <RodapeNovare />
      <AssistenteFerramentas apps={apps} />
    </>
  );
}
