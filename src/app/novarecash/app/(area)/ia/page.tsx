import { getPerfil } from "@/lib/perfil";
import { ehEquipe, estadoDoRecurso } from "@/lib/novarecash/recursos";
import { COTA_DIARIA_IA, iaConfigurada } from "@/lib/novarecash/ia";
import { minhaAssinatura } from "@/lib/novarecash/acesso";
import { AGENTES, AGENTES_DO_PLANO, planoMinimoDoAgente } from "@/lib/novarecash/agentes";
import { planoPorChave } from "@/lib/novarecash/config";
import { AvisoModoEquipe, EmAtivacao } from "../EmAtivacao";
import { Cabecalho } from "../pecas";
import { ChatIA, type AgenteNaTela } from "./ChatIA";

export const dynamic = "force-dynamic";

export default async function IaNovareCash() {
  const [perfil, assinatura] = await Promise.all([getPerfil(), minhaAssinatura()]);
  const estado = estadoDoRecurso("ia", perfil?.role);

  /* 06/11/2026: os AGENTES. Quais estão liberados vem do plano (a equipe vê todos); a rota
     confere de novo — o cadeado aqui é só para a pessoa saber, não é a trava. */
  const equipe = ehEquipe(perfil?.role);
  const plano = planoPorChave(assinatura?.plano);
  const agentes: AgenteNaTela[] = AGENTES.map((a) => ({
    chave: a.chave,
    nome: a.nome,
    resumo: a.resumo,
    sugestoes: a.sugestoes,
    liberado: equipe || AGENTES_DO_PLANO[plano.chave].includes(a.chave),
    planoMinimo: planoPorChave(planoMinimoDoAgente(a.chave)).nome,
  }));

  return (
    <div className="surgir">
      <Cabecalho
        titulo="Agentes de IA"
        resumo="Escolha um agente e pergunte sobre o seu dinheiro. Cada um tem um foco; todos usam as suas contas, o extrato e o orçamento."
      />
      {!estado.liberado ? (
        <EmAtivacao titulo="IA" liberaEm={estado.recurso.liberaEm} />
      ) : !iaConfigurada() ? (
        <EmAtivacao titulo="IA" liberaEm={estado.recurso.liberaEm ?? "breve"}>
          Estamos ligando a IA. Enquanto isso, o seu extrato e o orçamento continuam funcionando normalmente.
        </EmAtivacao>
      ) : (
        <>
          {estado.modoEquipe && <AvisoModoEquipe liberaEm={estado.recurso.liberaEm} />}
          <ChatIA cota={COTA_DIARIA_IA} agentes={agentes} />
        </>
      )}
    </div>
  );
}
