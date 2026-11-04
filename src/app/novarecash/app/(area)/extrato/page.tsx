import { Cabecalho } from "../pecas";
import { TelaExtrato } from "./TelaExtrato";

export const dynamic = "force-dynamic";

/**
 * O EXTRATO do NovareCash: tudo o que entrou e saiu, venha do banco, do
 * WhatsApp ou da mão da pessoa. As contas manuais moram aqui também, em
 * "Minhas contas".
 *
 * `?novo=1` abre direto o lançamento e `?contas=1` abre "Minhas contas" (são
 * os atalhos do primeiro passo, no Início).
 *
 * `?mes=yyyy-mm&busca=…&categoria=…` abre o mês já filtrado (o "Abrir o
 * Extrato" dos Alertas). Valor fora do formato é ignorado.
 */
export default async function ExtratoNovareCash({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const abrir = p.novo ? "novo" : p.contas ? "contas" : null;
  const um = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");
  const mes = um(p.mes);
  const categoria = um(p.categoria);
  const filtroInicial = {
    mes: /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : undefined,
    busca: um(p.busca).slice(0, 120) || undefined,
    categoria: /^[a-z0-9_]{1,45}$/.test(categoria) ? categoria : undefined,
  };

  return (
    <div className="surgir">
      <Cabecalho
        titulo="Extrato"
        resumo="Tudo o que entrou e saiu no mês. Toque num lançamento para editar, ou troque a categoria direto na lista."
      />
      <TelaExtrato abrir={abrir} filtroInicial={filtroInicial} />
    </div>
  );
}
