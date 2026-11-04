import { Cabecalho } from "../pecas";
import { TelaRelatorios } from "./TelaRelatorios";

export const dynamic = "force-dynamic";

/** OS RELATÓRIOS: 6 meses lado a lado, as categorias, os maiores gastos, CSV e PDF. */
export default function RelatoriosNovareCash() {
  return (
    <div className="surgir">
      <div className="print:hidden">
        <Cabecalho
          titulo="Relatórios"
          resumo="Como o dinheiro entrou e saiu nos últimos 6 meses, onde foi parar e quais foram os maiores gastos. Dá para baixar em planilha ou imprimir em PDF."
        />
      </div>
      <TelaRelatorios />
    </div>
  );
}
