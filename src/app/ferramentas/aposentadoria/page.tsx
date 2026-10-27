import { getTesouroIpca } from "@/lib/juros-tesouro";
import { CalculadoraAposentadoria } from "./CalculadoraAposentadoria";

/**
 * A CALCULADORA DE APOSENTADORIA NO HUB (27/10/2026, pedido do Jefferson). Morava no app antigo
 * (novareapp.com.br/ferramentas/calculadora-de-aposentadoria), que hoje dá 404.
 *
 * O servidor só traz a referência de juro real de hoje (Tesouro IPCA+ mais longo à venda), para a
 * pessoa saber que taxa digitar. Sem Tesouro no ar, a dica some — a conta funciona igual.
 */
export default async function AposentadoriaPage() {
  const { titulos } = await getTesouroIpca();
  const longo = [...titulos].filter((t) => !t.jurosSemestrais).pop() ?? titulos[titulos.length - 1];
  return <CalculadoraAposentadoria jurosRealHoje={longo ? { taxa: longo.taxaReal, ano: longo.ano } : null} />;
}
