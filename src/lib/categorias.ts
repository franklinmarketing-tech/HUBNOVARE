import { APPS, FAMILIAS, ORDEM_FAMILIAS, type Familia, type Role } from "@/lib/apps";
import { CARTEIRA_PONTUAL_LP } from "@/lib/consultoria";

/**
 * As áreas do ecossistema como PORTAIS de entrada.
 *
 * A home não despeja 39 aplicativos: mostra cinco portas grandes, cada uma
 * com a cara da sua área. Quem sabe o que quer usa a busca; quem não sabe
 * escolhe a porta. É a diferença entre um catálogo e um produto.
 */

export type Portal = {
  chave: Familia;
  titulo: string;
  /** Nome curto para o botão de acesso. */
  curto: string;
  descricao: string;
  /** Imagem oficial da Novare usada como fundo. */
  capa: string;
  /** Matiz e saturação da área, para o véu de cor. */
  h: number;
  s: number;
  total: number;
  /** "ferramentas" ou "itens", conforme a área tenha ou não serviço. */
  rotuloTotal: string;
  /** Slugs dos três apps que aparecem como ícones flutuantes. */
  destaques: string[];
  /**
   * Para onde o cartão leva. Normalmente a própria área na /aplicativos.
   *
   * Existe como campo porque uma área pode ter UM destino óbvio: quando ela
   * vende um serviço só, obrigar a passar por uma página de listagem com um
   * item é cobrar um clique por nada.
   */
  destino: string;
  /** true quando `destino` sai do Hub — o cartão abre em aba nova. */
  destinoExterno: boolean;
  /** O selo do canto do cartão ("Grátis", "Sob consulta"...). */
  selo: string;
  /** Lista completa, revelada no painel que abre ao passar o mouse. */
  itens: Array<{
    slug: string;
    nome: string;
    chamada: string;
    href: string;
    aberto: boolean;
    /** true quando o item sai do Hub — o menu abre em aba nova. */
    externo: boolean;
  }>;
};

const CONFIG: Record<
  Familia,
  {
    curto: string;
    descricao: string;
    capa: string;
    h: number;
    s: number;
    /**
     * O slug que a área quer em PRIMEIRO lugar nos destaques.
     *
     * Existe porque "destacar" neste card não é força de expressão: o
     * `destaques[0]` vira o ÍCONE PRINCIPAL do cartão (ver `CardPortal`),
     * ou seja, o rosto da área na home. Sem este campo, o rosto era um
     * efeito colateral da ordem do array em `apps.ts` — quem reordenasse o
     * catálogo por outro motivo trocaria a capa da home sem perceber.
     *
     * Vazio = comportamento antigo, os dois primeiros abertos da área.
     */
    foco?: string;
    /**
     * O selo no canto do cartão. Vazio = "Grátis".
     *
     * ⚠️ O SELO ERA FIXO EM "Grátis" NO COMPONENTE, e passou a mentir no
     * instante em que uma área ganhou destino de VENDA: o cartão de Serviços
     * anunciava grátis e abria uma consultoria cujo preço é sob consulta.
     * Prometer de menos e entregar de mais é o erro certo; este era o
     * contrário, e é o que faz a pessoa desconfiar do resto da página.
     */
    selo?: string;
    /** Destino próprio do cartão. Vazio = a área na /aplicativos. */
    destino?: string;
    /** true quando `destino` sai do Hub. */
    destinoExterno?: boolean;
  }
> = {
  ia: {
    /* ⚠️ ESTE RÓTULO JÁ MUDOU DUAS VEZES, E POR MOTIVOS DIFERENTES.

       Era "IA e Consultoria" até 14/09/2026, quando o dono tirou o "IA":
       prometia IA e entregava formulário de consultoria, que é decepção de
       expectativa no primeiro clique.

       Virou "Serviços" em 21/09, também por pedido dele. "Consultoria"
       nomeava só UM dos cinco trabalhos da área; "Serviços" cabe nos cinco
       sem prometer formato nenhum. ⚠️ O `FAMILIAS.ia` de `apps.ts` precisa
       dizer a mesma coisa — os dois alimentam telas diferentes. */
    curto: "Serviços",
    descricao: "Onde seu dinheiro some",
    /* A Carteira Pontual é o trabalho que a casa está empurrando agora, e
       tem página de venda própria no site da Novare (ver `lpOficial` em
       `consultoria.ts`). Com o foco aqui, é o ícone dela que estampa o
       cartão de Serviços na home. */
    foco: "consultoria-revisao-carteira",
    /* ⚠️ ESTE CARTÃO NÃO LEVA PARA DENTRO DO HUB (21/09/2026).

       Desde que a casa passou a vender um serviço só, o caminho antigo
       (cartão → /aplicativos?area=ia → item → site da Novare) tinha três
       cliques para chegar onde o visitante quer, e a página do meio
       mostrava uma lista de um item. O dono pediu o clique direto.

       A Íris e o FINPLAN, que também moram nesta área, não perdem porta:
       a Íris tem banner próprio logo abaixo na home e o FINPLAN tem o
       cartão grande de assinatura. ⚠️ Se um terceiro produto entrar aqui,
       reveja esta linha — ele nasceria sem entrada na home. */
    selo: "Sob consulta",
    destino: CARTEIRA_PONTUAL_LP,
    destinoExterno: true,
    capa: "/cards/card-novare.webp",
    h: 188,
    s: 62,
  },
  organizacao: {
    curto: "Vida Financeira",
    descricao: "Saia do vermelho, sem planilha",
    capa: "/cards/card-score.webp",
    h: 215,
    s: 55,
  },
  investimentos: {
    curto: "Investimentos",
    descricao: "Renda mais que a poupança",
    capa: "/cards/card-simulador.webp",
    h: 152,
    s: 55,
  },
  trabalho: {
    curto: "Trabalho",
    descricao: "Receba o que é seu",
    // A capa do envelope de pagamento — é a arte do 13º, e a área é
    // Trabalho e Salário. Antes daqui apontava para a capa do produto
    // FINPLAN, por uma troca minha na rodada das capas: o campo não
    // era usado por ninguém, então o erro passou despercebido.
    capa: "/cards/card-decimo-terceiro.webp",
    h: 40,
    s: 65,
  },

};

export function portais(role: Role): Portal[] {
  const visiveis = APPS.filter((a) => a.roles.includes(role));

  return ORDEM_FAMILIAS.map((familia) => {
    const daArea = visiveis.filter((a) => a.familia === familia);
    /**
     * O CARD CONTA SÓ O QUE ESTÁ ABERTO — e a razão está estampada nele
     * mesmo: o canto do cartão diz "Grátis".
     *
     * Enquanto isto contava a área inteira, "Vida Financeira · Grátis ·
     * 14 ferramentas" somava o FINCASH e as cinco exclusivas de assinante.
     * Seis dos catorze pediam pagamento, e a pessoa só descobria depois de
     * entrar. Número e selo agora dizem a mesma coisa, e quem chegar lá
     * encontra MAIS do que o card prometeu — que é o erro certo de cometer.
     *
     * ⚠️ `itens` continua com a área INTEIRA, de propósito: o menu de áreas
     * (`MenuAreas`) mostra os pagos com cadeado, e esconder deles o que a
     * assinatura abre seria esconder a oferta de quem está procurando.
     */
    const abertos = daArea.filter((a) => a.plano !== "pago");
    return {
      chave: familia,
      titulo: FAMILIAS[familia],
      /* O padrão continua sendo a área na /aplicativos; o espalhamento
         abaixo sobrescreve quando a área declara destino próprio. */
      destino: `/aplicativos?area=${familia}`,
      destinoExterno: false,
      selo: "Grátis",
      ...CONFIG[familia],
      total: abertos.length,
      /**
       * Como chamar o que está dentro desta área.
       *
       * "IA e Consultoria" tem cinco produtos de consultoria — gente
       * atendendo — e o card dizia "7 ferramentas". Onde há serviço na
       * conta, o rótulo passa a ser "itens": é honesto sem precisar de dois
       * números num card que só tem espaço para um.
       */
      rotuloTotal: abertos.some((a) => a.tipo === "servico")
        ? "itens"
        : "ferramentas",
      /* Dois, não três: o terceiro ícone só poluía a capa do card.
         Saem dos ABERTOS pelo mesmo motivo do total — o ícone é a cara de um
         cartão que se anuncia grátis, e a cara não pode ser a de um produto
         pago.

         ⚠️ O `foco` FURA A FILA, mas só se o item estiver entre os abertos:
         um slug com erro de digitação, ou apontando para um produto pago,
         não quebra nada nem some com o card — apenas não fura a fila, e os
         dois primeiros continuam valendo. */
      destaques: (() => {
        const slugs = abertos.map((a) => a.slug);
        const foco = CONFIG[familia].foco;
        const fila = foco && slugs.includes(foco)
          ? [foco, ...slugs.filter((s) => s !== foco)]
          : slugs;
        return fila.slice(0, 2);
      })(),
      itens: daArea.map((a) => ({
        slug: a.slug,
        nome: a.nome,
        chamada: a.chamada,
        href: a.href,
        aberto: a.status !== "em-breve" && a.plano !== "pago",
        /* ⚠️ SEM ISTO O MENU MANDAVA PARA FORA NA MESMA ABA. O item já
           carregava um href de outro domínio (a Carteira Pontual aponta
           para a página de venda da Novare), mas o `Portal` não repassava
           o campo — então o menu não tinha como saber, e o visitante saía
           do Hub sem volta e sem rel=noopener. */
        externo: a.externo === true,
      })),
    };
  }).filter((p) => p.total > 0);
}
