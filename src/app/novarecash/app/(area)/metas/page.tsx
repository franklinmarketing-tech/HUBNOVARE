import { Cabecalho } from "../pecas";
import { TelaMetas } from "./TelaMetas";

export const dynamic = "force-dynamic";

/** AS METAS: quanto juntar, até quando, e quanto guardar por mês para chegar lá. */
export default function MetasNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="Metas"
        resumo="Diga quanto quer juntar e até quando. O NovareCash mostra o progresso e quanto guardar por mês para chegar no prazo."
      />
      <TelaMetas />
    </div>
  );
}
