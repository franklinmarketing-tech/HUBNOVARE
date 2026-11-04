import { getPerfil } from "@/lib/perfil";
import { estadoDoRecurso, whatsappEnvioConfigurado } from "@/lib/novarecash/recursos";
import { AvisoModoEquipe, EmAtivacao } from "../EmAtivacao";
import { Cabecalho } from "../pecas";
import { Exemplos } from "./Exemplos";
import { TelaWhatsApp } from "./TelaWhatsApp";

export const dynamic = "force-dynamic";

/**
 * O assistente de WhatsApp do NovareCash: o vínculo do número, os exemplos e
 * o que ele registrou por último (de `ncash_transacoes`, origem 'whatsapp').
 *
 * A tela fala com o vínculo só pela rota `/api/whatsapp/vincular` (GET estado,
 * POST código, PATCH conta padrão, DELETE desligar). Ela é do servidor do
 * WhatsApp, que confere a assinatura a cada mensagem antes de gravar.
 *
 * Enquanto `RECURSOS.whatsapp.noAr` for false, o cliente vê "em ativação" (com
 * os exemplos, para saber o que vem) e a equipe vê a tela funcionando.
 */
export default async function WhatsAppNovareCash() {
  const perfil = await getPerfil();
  const estado = estadoDoRecurso("whatsapp", perfil?.role);

  return (
    <div className="surgir space-y-5">
      <Cabecalho
        titulo="WhatsApp"
        resumo="Lance um gasto mandando uma mensagem: texto, áudio ou a foto da nota. Ele entende, registra no seu extrato e confirma."
      />
      {estado.liberado ? (
        <>
          {estado.modoEquipe && <AvisoModoEquipe liberaEm={estado.recurso.liberaEm} />}
          <TelaWhatsApp envioLigado={whatsappEnvioConfigurado()} />
        </>
      ) : (
        <EmAtivacao titulo="Assistente no WhatsApp" liberaEm={estado.recurso.liberaEm}>
          Quando liberar, você liga o seu número aqui com um código de seis dígitos e passa a lançar gastos pelo
          WhatsApp. Veja abaixo o que ele vai entender.
        </EmAtivacao>
      )}
      <Exemplos />
    </div>
  );
}
