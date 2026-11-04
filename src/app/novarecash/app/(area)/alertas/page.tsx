import { Cabecalho } from "../pecas";
import { TelaAlertas } from "./TelaAlertas";

export const dynamic = "force-dynamic";

/**
 * OS ALERTAS do NovareCash — "o dinheiro que some": assinaturas, tarifas,
 * cobranças repetidas, gasto fora do padrão e orçamento. Calculados na hora a
 * partir do extrato (`src/lib/novarecash/insights.ts`), sem modelo de IA.
 */
export default function AlertasNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="Alertas"
        resumo="O NovareCash lê o seu extrato e aponta o dinheiro que pode estar saindo sem você perceber. Cada alerta mostra os números e os lançamentos que levaram a ele."
      />
      <TelaAlertas />
    </div>
  );
}
