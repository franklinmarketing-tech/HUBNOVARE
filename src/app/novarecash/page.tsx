import type { Metadata } from "next";
import { PaginaVenda, metadataVenda } from "./_venda/PaginaVenda";

/**
 * /novarecash — a página de venda. O corpo mora em `_venda/PaginaVenda.tsx`.
 *
 * ⚠️ SAI PRONTA e é remontada no máximo a cada 60 s (21/11/2026): a fase e o
 * preço da Black dependem da data, por isso o prazo curto — e, para a virada
 * de dia, `ConferirFaseBlack` recarrega quem pegou o HTML da fase anterior.
 *
 * ⚠️ NÃO HÁ `layout.tsx` EM /novarecash, e não deve haver: ele ficaria por
 * cima de `/novarecash/app` e desenharia dentro do app logado.
 */
export const revalidate = 60;

export const metadata: Metadata = metadataVenda;

export default function NovareCashVendaPage() {
  return <PaginaVenda />;
}
