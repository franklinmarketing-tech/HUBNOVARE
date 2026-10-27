import { serie } from "@/lib/indicadores";
import type { IndicesHoje } from "@/lib/renda-fixa";
import { SimuladorRendaFixa } from "./SimuladorRendaFixa";

/**
 * O SIMULADOR DE RENDA FIXA / CDI NO HUB (27/10/2026). Morava no app antigo
 * (novareapp.com.br/ferramentas/simulador-de-renda-fixa), que dá 404.
 *
 * Os índices vêm do Banco Central no servidor (cache de 6 h em `serie`). Se alguma série não
 * responder, usa o último valor conhecido abaixo e a tela diz que é referência, não o dado do dia.
 */
const RESERVA: IndicesHoje = { cdi: 13.65, selic: 13.75, ipca12: 4.5, poupancaMes: 0.67 };

export default async function RendaFixaPage() {
  const [cdi, selic, ipca12, poup] = await Promise.all([serie(4389, 1), serie(432, 1), serie(13522, 1), serie(195, 1)]);
  const doDia = !!(cdi && selic && ipca12 && poup);
  const idx: IndicesHoje = {
    cdi: cdi?.at(-1)?.valor ?? RESERVA.cdi,
    selic: selic?.at(-1)?.valor ?? RESERVA.selic,
    ipca12: ipca12?.at(-1)?.valor ?? RESERVA.ipca12,
    poupancaMes: poup?.at(-1)?.valor ?? RESERVA.poupancaMes,
  };
  return <SimuladorRendaFixa indices={idx} doDia={doDia} dataCdi={cdi?.at(-1)?.data ?? null} />;
}
