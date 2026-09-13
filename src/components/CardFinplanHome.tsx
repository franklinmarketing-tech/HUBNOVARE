import { Target } from "lucide-react";
import {
  CardProdutoHome,
  SetaRodape,
  doCatalogo,
} from "@/components/CardProdutoHome";
import type { EstadoAssinatura } from "@/lib/assinatura-servidor";

/**
 * O CARD DO FINPLAN NA HOME — o segundo produto, ao lado do FINCASH.
 *
 * ═══ POR QUE ELE VOLTOU (13/09/2026) ═══════════════════════════════════════
 *
 * Problema de produto, conferido em produção: a home tinha ZERO links para o
 * FINPLAN. Nenhum. Ele saiu daqui em 12/09, quando o FINCASH virou o âncora,
 * e o que sobrou foi um produto pago, com landing própria e vaga no sitemap,
 * sem nenhuma porta na página mais visitada do site. Quem não soubesse o
 * endereço de cor não chegava nele.
 *
 * ⚠️ E ELE NÃO É UM MÓDULO DO FINCASH — é o irmão. Uma assinatura abre os
 * dois: o FINCASH mede o mês, o FINPLAN planeja o ano, e a ponte
 * (`/fincash/app/finplan`) leva o mês medido para o plano. Dois produtos
 * com papéis diferentes precisam de duas portas; uma porta só ensina que um
 * mora dentro do outro.
 *
 * ═══ ⚠️ ESTE CARD NÃO FALA EM PREÇO, E ISSO É A REGRA DA CASA ══════════════
 *
 * O motivo de ele ter ficado fora da home estava escrito, e continua valendo:
 * dois cards com valor na mesma dobra leem como dois planos, e a casa tem UMA
 * assinatura e UM preço (é o que `scripts/testar-nada-a-venda.mjs` guarda).
 *
 * A saída não foi tirar o card, foi tirar o PREÇO dele. O rodapé diz a que a
 * pessoa tem direito — "vem na mesma assinatura" —, que é a informação certa
 * e é o argumento da casa inteira. Quem quiser o número clica no FINCASH, ao
 * lado, que é onde a oferta mora.
 *
 * ⚠️ NÃO DEVOLVA UM VALOR A ESTE RODAPÉ. A versão antiga deste card
 * (`CardPlanejamentoHome`, apagada nesta mesma passagem) lia preço de
 * `lib/planejamento/oferta.ts` — que só reexporta `lib/assinatura.ts`. Eram
 * dois cards imprimindo a MESMA mensalidade lado a lado, como se fossem duas
 * compras.
 */

const FINPLAN = doCatalogo("planejamento");

export function CardFinplanHome({
  /**
   * Em que ponto da assinatura a pessoa está — só decide o DESTINO e o texto
   * do rodapé, nunca preço. Ver o aviso acima.
   *
   * O padrão é "sem" porque é o caso do visitante deslogado, que é quem vê
   * esta home sem nenhum dado de conta.
   */
  assinatura = { fase: "sem" },
}: {
  assinatura?: EstadoAssinatura;
}) {
  /* Mesma regra do irmão: quem tem acesso entra no app, quem não tem vê a
     venda. `/finplan/app` exige sessão (é o que a lista `PROTEGIDAS` do
     middleware diz), então mandar visitante para lá troca a oferta por um
     formulário de login. */
  const href = assinatura.fase === "sem" ? "/finplan" : "/finplan/app";
  const jaTem = assinatura.fase !== "sem";

  return (
    <CardProdutoHome
      app={FINPLAN}
      href={href}
      Icone={Target}
      /* A divisão de trabalho, em cinco palavras. É o que impede a leitura
         de "dois apps que fazem a mesma coisa" — o erro que mata a segunda
         porta antes de ela ser clicada. */
      linhaExtra="O FINCASH mede o mês; este planeja o ano"
      /* ⚠️ UMA LINHA SÓ, E ISSO É LAYOUT, NÃO ECONOMIA DE TEXTO. O rodapé do
         irmão tem duas colunas (valor + letra miúda) porque precisa de duas;
         aqui, na fileira de cinco cards, o mesmo desenho com duas frases
         quebrava em três linhas e empurrava o palco para cima. Sem preço a
         dizer, há uma informação só — e ela cabe inteira. */
      rodape={
        <>
          <span className="text-sm font-bold text-accent-strong">
            {/* Sem número, de propósito — ver o aviso no topo do arquivo. */}
            {jaTem ? "Abrir meu FINPLAN" : "Vem na sua assinatura"}
          </span>
          <SetaRodape />
        </>
      }
    />
  );
}
