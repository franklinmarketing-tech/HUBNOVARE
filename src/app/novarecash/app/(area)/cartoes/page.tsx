import { Cabecalho } from "../pecas";
import { TelaCartoes } from "./TelaCartoes";

export const dynamic = "force-dynamic";

/**
 * CARTÕES do NovareCash: a fatura aberta, a fechada a pagar, as próximas com
 * as parcelas que já caíram, e o limite usado e livre. Regras em
 * `src/lib/novarecash/cartoes.ts`.
 */
export default function CartoesNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="Cartões"
        resumo="A fatura de cada cartão, as parcelas que vêm por aí e quanto do limite ainda está livre. Pagar a fatura não conta como gasto: os gastos são as compras."
      />
      <TelaCartoes />
    </div>
  );
}
