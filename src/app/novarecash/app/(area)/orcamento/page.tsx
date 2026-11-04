import { Cabecalho } from "../pecas";
import { TelaOrcamento } from "./TelaOrcamento";

export const dynamic = "force-dynamic";

/** O ORÇAMENTO: um limite mensal por categoria de saída, que vale todo mês até mudar. */
export default function OrcamentoNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="Orçamento"
        resumo="Um limite por mês para cada categoria. O NovareCash compara com o que você já gastou e avisa quando passar de 80% e de 100%."
      />
      <TelaOrcamento />
    </div>
  );
}
