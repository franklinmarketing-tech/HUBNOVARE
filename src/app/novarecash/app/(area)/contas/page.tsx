import { Cabecalho } from "../pecas";
import { TelaContas } from "./TelaContas";

export const dynamic = "force-dynamic";

/**
 * CONTAS A PAGAR do NovareCash: as fixas do mês (aluguel, luz, escola) e as
 * únicas (IPVA). "Paguei" cria o lançamento no Extrato; desfazer apaga os dois.
 * Regras em `src/lib/novarecash/contas-pagar.ts`.
 */
export default function ContasAPagarNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="Contas a pagar"
        resumo="O que vence no mês, o que atrasou e o que já foi pago. Ao marcar como paga, o gasto entra sozinho no Extrato."
      />
      <TelaContas />
    </div>
  );
}
