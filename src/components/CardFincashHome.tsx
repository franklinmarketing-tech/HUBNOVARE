import {
  CardProdutoHome,
  SetaRodape,
  doCatalogo,
} from "@/components/CardProdutoHome";
import {
} from "@/lib/assinatura";
import type { EstadoAssinatura } from "@/lib/assinatura-servidor";

/**
 * O PRIMEIRO CARD DA HOME — o produto-âncora da casa.
 *
 * ═══ POR QUE O FINCASH, E NÃO O FINPLAN (12/09/2026) ═══════════════════════
 *
 * Decisão do dono, registrada por extenso em `lib/assinatura.ts`: o que se
 * assina passou a ser o FINCASH. Até esta data quem abria a home encontrava
 * neste lugar o produto que hoje se chama FINPLAN — e ele cobra uma trilha de
 * oito blocos antes de devolver qualquer coisa. Porta de entrada que exige
 * esforço antes de entregar valor é porta estreita; o FINCASH responde "posso
 * gastar?" no primeiro dia de uso.
 *
 * ⚠️ ESTE CARD NÃO SAI DA ORDEM DO `lib/apps.ts`. A home monta os produtos à
 * parte e os cards de área em seguida — reordenar o catálogo não muda nada
 * aqui, e mexer aqui não muda o catálogo. Quem receber "põe o FINCASH na
 * frente" tem de olhar os dois lugares (o array e `src/app/page.tsx`).
 *
 * ⚠️ ESTE É O ÚNICO CARD DA HOME QUE FALA EM PREÇO — e continua sendo, mesmo
 * com o FINPLAN ao lado desde 13/09/2026. Dois cards com valor na mesma dobra
 * leem como dois planos, e a casa tem UMA assinatura (é o que
 * `scripts/testar-nada-a-venda.mjs` guarda). O card do irmão diz que vem na
 * mesma assinatura, e não quanto custa. Ver `CardFinplanHome`.
 *
 * A casca (gradiente, palco, rodapé) mora em `CardProdutoHome`: os dois cards
 * de produto partilham o desenho e divergem só no ícone e no rodapé.
 */

const FINCASH = doCatalogo("fincash");

export function CardFincashHome({
  /**
   * Em que ponto da assinatura a pessoa está.
   *
   * Decide as duas coisas do rodapé: o texto e o destino. Quem já paga não
   * pode ver preço — ler a oferta do que se acabou de comprar faz duvidar se
   * a compra entrou —, e quem já paga também não quer passar pela landing
   * para chegar ao app.
   *
   * O padrão é "sem" porque é o caso do visitante deslogado, que é quem vê
   * esta home sem nenhum dado de conta.
   */
  assinatura = { fase: "sem" },
}: {
  assinatura?: EstadoAssinatura;
}) {
  /* Quem tem acesso entra no APP; quem não tem vê a VENDA.
     Não é atalho de conveniência: `/fincash/app` exige sessão e redireciona
     para o login, então mandar um visitante para lá seria trocar a oferta por
     um formulário — e ninguém cria conta para um produto que ainda não
     entendeu. O teste corrente conta como acesso: são dias que a casa já
     prometeu. */
  const href = assinatura.fase === "sem" ? "/fincash" : "/fincash/app";

  return (
    <CardProdutoHome
      app={FINCASH}
      href={href}
      foto="/home/fincash.webp"
      /* O QUE VEM JUNTO, na própria capa.
         Sem esta linha o card vende um app de gastos por R$ 29,90, que é mais
         caro que o concorrente mais direto pelo mesmo tipo de produto. O
         argumento da casa não é o app: é que a mesma cobrança abre também o
         plano e a IA. Só nomes que existem e estão no ar — o assistente de
         WhatsApp fica de fora enquanto não estiver ligado. */
      linhaExtra="Com a Íris junto"
      rodape={
        assinatura.fase === "ativa" ? (
          /* Nenhum preço, nenhuma oferta: só a porta de entrada. */
          <>
            <span className="text-sm font-bold text-accent-strong">
              Abrir meu FINCASH
            </span>
            <SetaRodape />
          </>
        ) : assinatura.fase === "teste" ? (
          <>
            <span className="text-sm font-bold text-accent-strong">
              Abrir meu FINCASH
            </span>
            <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
              {assinatura.dias === 1
                ? "último dia de teste"
                : `faltam ${assinatura.dias} dias`}
              <SetaRodape />
            </span>
          </>
        ) : (
          <>
            {/* ⚠️ ERA O PREÇO ("R$ 19,90/mês no anual, ou R$ 29,90/mês").
                Saiu em 18/10/2026: o FINCASH passou a ser gratuito, e um
                card que anuncia valor onde não há cobrança é a mentira mais
                cara que uma home pode contar. */}
            {/* Uma frase só: "é só criar a conta" ao lado espremia o botão em
                duas linhas no card de um quarto de largura. O selo "App
                gratuito" na foto já diz o resto. */}
            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-accent-strong">
              Quero experimentar
              <SetaRodape />
            </span>
          </>
        )
      }
    />
  );
}
