import { formatarIndicador, getIndicadores, juroReal } from "@/lib/mercado";
import { TelaInvestimentos, type IndicadorNaTela } from "./TelaInvestimentos";

/**
 * A porta da tela de Investimentos — e a única metade dela que roda no servidor.
 *
 * POR QUE ESTA CASCA EXISTE
 * `@/lib/mercado` usa `cache()` do React: só funciona em Server Component, e
 * importá-lo de um arquivo `"use client"` quebra o build. Ao mesmo tempo, a
 * carteira é toda interativa (formulário, alternador de leitura, atualização de
 * valor) e precisa ser cliente. A fronteira, então, é esta página: ela busca o
 * Banco Central UMA vez por requisição, com o cache de 6h que o `mercado.ts`
 * já resolve, e passa NÚMEROS PRONTOS para baixo.
 *
 * Passar dado serializável, e não o componente `<BarraMercado />` inteiro, é
 * decisão consciente: a barra da home é uma fita rolante infinita, feita para
 * chamar atenção de quem chega. Num app de uso diário, movimento perpétuo no
 * topo da tela é ruído — aqui os mesmos números viram um quadro parado, que se
 * lê junto com a carteira em vez de disputar com ela.
 *
 * O JURO REAL VEM CALCULADO DAQUI porque é conta de mercado, não de tela: a
 * fórmula de Fisher mora no `mercado.ts` e a tela só recebe o resultado. Se um
 * dia a Novare trocar a fonte da taxa, nenhum componente de cliente muda.
 */
export default async function InvestimentosPage() {
  const indicadores = await getIndicadores();

  const selic = indicadores.find((i) => i.chave === "selic");
  const ipca = indicadores.find((i) => i.chave === "ipca12");

  /* Só os três que conversam com uma carteira. Dólar e poupança são da home:
     aqui eles ocupariam espaço sem responder nenhuma pergunta que a tela faz. */
  const naTela: IndicadorNaTela[] = indicadores
    .filter((i) => ["selic", "cdi", "ipca12"].includes(i.chave))
    .map((i) => ({
      chave: i.chave,
      rotulo: i.rotulo,
      valor: formatarIndicador(i),
      nota: i.nota,
      aoVivo: i.aoVivo,
    }));

  return (
    <TelaInvestimentos
      indicadores={naTela}
      juroRealAnual={
        selic && ipca ? juroReal(selic.valor, ipca.valor) : null
      }
    />
  );
}
