import { getPerfil } from "@/lib/perfil";
import { estadoDoRecurso } from "@/lib/novarecash/recursos";
import { Cabecalho } from "../pecas";
import { TelaPatrimonio } from "./TelaPatrimonio";

export const dynamic = "force-dynamic";

/**
 * PATRIMÔNIO: contas + investimentos − dívidas, e a divisão por classe.
 *
 * Os investimentos do BANCO seguem a regra de `recursos.ts` para o Open
 * Finance: enquanto `RECURSOS.banco.noAr` for false, o cliente vê "em ativação"
 * nessa parte e a equipe vê funcionando. Os lançados à mão valem para todos.
 *
 * CVM: a tela mostra e soma. Não recomenda ativo, nem compra, nem venda.
 */
export default async function PatrimonioNovareCash() {
  const perfil = await getPerfil();
  const banco = estadoDoRecurso("banco", perfil?.role);

  return (
    <div className="surgir">
      <Cabecalho
        titulo="Patrimônio"
        resumo="Tudo o que você tem, menos o que deve: o saldo das contas, os investimentos e as faturas em aberto, separados por classe."
      />
      <TelaPatrimonio bancoLiberado={banco.liberado} modoEquipe={banco.modoEquipe} liberaEm={banco.recurso.liberaEm ?? null} />
    </div>
  );
}
