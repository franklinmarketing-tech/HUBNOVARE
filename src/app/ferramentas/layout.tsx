import type { Metadata } from "next";
import { AssistenteFerramentas } from "@/components/AssistenteFerramentas";
import { AvaliarFerramenta } from "@/components/AvaliarFerramenta";
import { CapturaLead } from "@/components/CapturaLead";
import { GuiaFerramenta } from "@/components/GuiaFerramenta";
import { RegistrarVisita } from "@/components/RegistrarVisita";
import { RodapeNovare } from "@/components/RodapeNovare";
import { VoltarAoWorkspace } from "@/components/VoltarAoWorkspace";
import { appsParaBusca } from "@/lib/navegacao";
import { getPerfil } from "@/lib/perfil";

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
export default async function LayoutFerramentas({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();
  const apps = appsParaBusca(perfil?.role ?? "cliente", perfil?.plano ?? "free", !!perfil);

  return (
    <>
      {children}
      {/* Fica aqui, com o rodapé e a captura, pelo mesmo motivo que eles:
          ferramenta nova já nasce medida, sem ninguém lembrar de colar. */}
      <RegistrarVisita />
      {/* O passo a passo de cada ferramenta (`lib/guias-ferramentas.ts`). */}
      <GuiaFerramenta />
      {/* `comRelatorio`: aqui o PDF do resultado vem primeiro e o
          especialista é opcional (ver a nota em `CapturaLead`). */}
      <CapturaLead comRelatorio />
      {/* "Esta ferramenta te ajudou?" — a nota de 1 a 5 (21/10/2026). */}
      <AvaliarFerramenta />
      <VoltarAoWorkspace />
      <RodapeNovare />
      <AssistenteFerramentas apps={apps} />
    </>
  );
}
