import { Cabecalho } from "../pecas";
import { TelaReceber } from "./TelaReceber";

export const dynamic = "force-dynamic";

/**
 * A RECEBER / FIADO do NovareCash (15/11/2026): vendas fiado, serviços a
 * receber, dinheiro emprestado. "Recebi" (total ou parcial) cria a entrada no
 * Extrato; "Cobrar" abre o WhatsApp com a mensagem pronta.
 * Regras em `src/lib/novarecash/receber.ts`.
 */
export default function AReceberNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="A receber"
        resumo="Quem te deve, quanto e quando cobrar. No dia, o NovareCash lembra — com a mensagem de cobrança pronta. Quando pagarem, o valor entra no Extrato."
      />
      <TelaReceber />
    </div>
  );
}
