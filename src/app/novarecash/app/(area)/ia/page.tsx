import { getPerfil } from "@/lib/perfil";
import { estadoDoRecurso } from "@/lib/novarecash/recursos";
import { COTA_DIARIA_IA, iaConfigurada } from "@/lib/novarecash/ia";
import { AvisoModoEquipe, EmAtivacao } from "../EmAtivacao";
import { Cabecalho } from "../pecas";
import { ChatIA } from "./ChatIA";

export const dynamic = "force-dynamic";

export default async function IaNovareCash() {
  const perfil = await getPerfil();
  const estado = estadoDoRecurso("ia", perfil?.role);

  return (
    <div className="surgir">
      <Cabecalho
        titulo="IA"
        resumo="Pergunte sobre o seu dinheiro. A resposta usa as suas contas, o extrato do mês e o seu orçamento."
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
          <ChatIA cota={COTA_DIARIA_IA} />
        </>
      )}
    </div>
  );
}
