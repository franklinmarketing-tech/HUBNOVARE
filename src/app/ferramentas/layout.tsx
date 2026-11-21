import type { Metadata } from "next";
import { AssistenteFerramentasSessao } from "@/components/SessaoNoNavegador";
import { AvaliarFerramenta } from "@/components/AvaliarFerramenta";
import { CapturaLead } from "@/components/CapturaLead";
import { BotaoManual } from "@/components/BotaoManual";
import { MedirUsoFerramenta } from "@/components/MedirUsoFerramenta";
import { TourTela } from "@/components/TourTela";
import { DicasCampos } from "@/components/DicasCampos";
import { RegistrarVisita } from "@/components/RegistrarVisita";
import { RodapeNovare } from "@/components/RodapeNovare";
import { VoltarAoWorkspace } from "@/components/VoltarAoWorkspace";

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
/* ⚠️ SEM `getPerfil` AQUI (21/11/2026): esta moldura lia a sessão no servidor
   só para a busca — e isso obrigava as 23 ferramentas a serem montadas a cada
   visita. A busca agora descobre quem está logado no navegador
   (`AssistenteFerramentasSessao`) e as ferramentas saem prontas. */
export default function LayoutFerramentas({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <>
      {children}
      {/* Fica aqui, com o rodapé e a captura, pelo mesmo motivo que eles:
          ferramenta nova já nasce medida, sem ninguém lembrar de colar. */}
      <RegistrarVisita />
      {/* "usou" no primeiro campo mexido: o meio do funil abriu → mexeu → baixou. */}
      <MedirUsoFerramenta />
      {/* Ajuda da tela (25/10/2026): o tour guiado (só por clique) e o "?" nos termos. */}
      <TourTela modo="ferramenta" />
      <DicasCampos modo="ferramenta" />
      {/* O passo a passo de cada ferramenta (`lib/guias-ferramentas.ts`). */}
      {/* "Voltar" e "Como usar" lado a lado num grupo só, no canto de baixo
          à esquerda (24/10/2026): antes eram dois botões empilhados e o guia
          abria sozinho por cima da tela. */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2 print:hidden">
        <VoltarAoWorkspace />
        {/* O "Manual" (24/10/2026) substitui o "Como usar": mesmos passos e
            mais campos, resultado, dúvidas e o vídeo curto. */}
        <BotaoManual modo="ferramenta" />
      </div>
      {/* `comRelatorio`: aqui o PDF do resultado vem primeiro e o
          especialista é opcional (ver a nota em `CapturaLead`). */}
      <CapturaLead comRelatorio />
      {/* "Esta ferramenta te ajudou?" — a nota de 1 a 5 (21/10/2026). */}
      <AvaliarFerramenta />
      <RodapeNovare />
      <AssistenteFerramentasSessao />
    </>
  );
}
