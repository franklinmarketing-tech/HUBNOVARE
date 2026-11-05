import { artigoPorSlug } from "@/lib/news";

/**
 * OS "STORIES" DA HOME (05/11/2026, a partir do benchmark com a Nord): uma
 * faixa de círculos no topo, cada um abrindo 5 ou 6 telas curtas de pergunta e
 * resposta sobre uma matéria do Novare News, e uma última tela que leva à
 * matéria e à ferramenta dela. Componente nativo (`components/Stories.tsx`),
 * sem AMP nem serviço de fora.
 *
 * ⚠️ O TEXTO DAS TELAS É RESUMO FIEL DA MATÉRIA, NADA ALÉM. Cada número que
 * aparece aqui está escrito na matéria de origem (`lib/news.ts`): nenhum foi
 * calculado, arredondado ou trazido de fora. Quem mudar a matéria confere o
 * story junto — e quem quiser story novo escreve a partir do texto publicado,
 * não da memória.
 *
 * ⚠️ TÍTULO, CAPA E FERRAMENTA SAEM DA MATÉRIA, não daqui: o story aponta para
 * o slug e lê o resto do News. Matéria que sair do ar leva o story junto, em
 * vez de deixar um círculo apontando para um 404.
 *
 * ⚠️ SÓ NO SERVIDOR. Este arquivo importa o News inteiro (todas as matérias,
 * com o corpo); a home monta a lista e passa ao componente só o que ele
 * desenha. Importar isto num componente "use client" mandaria o acervo todo
 * para o navegador.
 */

export type TelaStory = { pergunta: string; resposta: string };

export type Story = {
  /** O slug da matéria. */
  id: string;
  /** O nome curto embaixo do círculo. */
  rotulo: string;
  titulo: string;
  capa: string;
  telas: TelaStory[];
  artigo: { href: string };
  ferramenta: { href: string; nome: string; externo?: boolean };
};

type Roteiro = {
  slug: string;
  rotulo: string;
  /** O texto do botão da ferramenta, quando o nome dela sozinho não diz o que fazer. */
  chamada?: string;
  telas: TelaStory[];
};

/**
 * A ordem é a da faixa. O 13º abre porque a primeira parcela cai até 30 de
 * novembro — é a pergunta da época. Troque quando a época passar.
 */
const ROTEIROS: Roteiro[] = [
  {
    slug: "13o-salario-por-que-a-segunda-parcela-vem-menor",
    rotulo: "13º salário",
    chamada: "Calcular as duas parcelas",
    telas: [
      { pergunta: "As duas parcelas do 13º são iguais?", resposta: "No bruto, sim: é o mesmo valor dividido ao meio. No bolso, não." },
      { pergunta: "O que vem na primeira?", resposta: "Um adiantamento limpo, pago até 30 de novembro: sem desconto de INSS e sem imposto de renda." },
      { pergunta: "E na segunda?", resposta: "Paga até 20 de dezembro, ela carrega o desconto do 13º inteiro — calculado sobre o valor cheio e separado do salário do mês." },
      { pergunta: "Onde o orçamento fura?", resposta: "Em quem conta com metade em novembro e metade igual em dezembro. A conta certa é o bruto menos todo o desconto, concentrado na segunda parcela." },
      { pergunta: "E quem tem dependentes?", resposta: "O abatimento de R$ 189,59 por dependente também entra na conta do 13º. Vale conferir se o RH aplicou." },
    ],
  },
  {
    slug: "reserva-de-emergencia-os-tres-criterios",
    rotulo: "Reserva",
    telas: [
      { pergunta: "Onde deixar a reserva de emergência?", resposta: "É a pergunta errada. Antes, vale saber o que a reserva precisa entregar: são três exigências." },
      { pergunta: "Qual é a primeira?", resposta: "Liquidez imediata. Dinheiro que demora três dias para cair na conta não serve para o pneu que estourou hoje." },
      { pergunta: "E a segunda?", resposta: "Previsibilidade: o valor não pode oscilar. Reserva que caiu justo no mês da demissão deixou de ser reserva." },
      { pergunta: "E o rendimento?", resposta: "Vem por último. A função da reserva não é enriquecer você: é impedir que um imprevisto vire dívida de cartão." },
      { pergunta: "De que tamanho?", resposta: "A régua clássica é de três a seis meses do seu custo mensal — do custo, não da renda. Renda que varia pede a ponta de cima, ou mais." },
      { pergunta: "Dá para investir antes de completar?", resposta: "A reserva vem antes de qualquer investimento com risco. Sem ela, é construir o segundo andar sem a fundação." },
    ],
  },
  {
    slug: "orcamento-que-sobrevive-ao-mes",
    rotulo: "Orçamento",
    chamada: "Montar o meu orçamento",
    telas: [
      { pergunta: "Por que o orçamento morre na segunda semana?", resposta: "Porque nasce com categorias demais. Vinte delas pedem esforço demais desde o primeiro dia." },
      { pergunta: "É falta de disciplina?", resposta: "Não. É o método complicado demais para a rotina de quem vai usar." },
      { pergunta: "Como começar, então?", resposta: "Com poucas categorias grandes: moradia, alimentação, transporte e o resto." },
      { pergunta: "Quando detalhar?", resposta: "Depois de ver, por um ou dois meses, onde o dinheiro realmente se concentra." },
      { pergunta: "E se nunca sobra nada no fim do mês?", resposta: "Inverta a ordem: separe a reserva ou o investimento assim que a renda entra. Esperar sobrar quase nunca funciona." },
    ],
  },
  {
    slug: "juros-compostos-o-aporte-pequeno-que-vence",
    rotulo: "Juros compostos",
    chamada: "Comparar dois começos",
    telas: [
      { pergunta: "Aporte pequeno vence aporte grande?", resposta: "No juro composto, costuma vencer: o tempo pesa mais do que o valor." },
      { pergunta: "Como funciona?", resposta: "O rendimento de cada período passa a render também. É essa bola de neve que faz o patrimônio decolar." },
      { pergunta: "Por que começar cedo?", resposta: "Os primeiros anos de aporte são os que mais compõem lá no fim. Cada ano de atraso corta o pedaço da curva que mais engorda." },
      { pergunta: "“Esse valor não faz diferença”?", resposta: "Faz, desde que entre logo e fique rendendo. Esperar sobrar mais troca o tempo por um aporte maior que raramente compensa." },
      { pergunta: "Taxa anual dividida por doze dá a mensal?", resposta: "Não. A conversão certa usa raiz e potência composta; dividir por doze superestima o rendimento e infla a projeção inteira." },
    ],
  },
  {
    slug: "o-calote-silencioso-inflacao-e-imposto",
    rotulo: "Inflação e IR",
    telas: [
      { pergunta: "O rendimento do extrato é o que você ganhou?", resposta: "Não. Entre a taxa anunciada e o dinheiro que sobra existem dois pedágios." },
      { pergunta: "Qual é o primeiro?", resposta: "O imposto. Na renda fixa, ele vai de 22,5% sobre o rendimento, até 180 dias, a 15%, acima de 720 dias." },
      { pergunta: "Tem pegadinha?", resposta: "Tem: o imposto incide sobre o ganho nominal. Você paga também sobre a parte que só repôs a inflação." },
      { pergunta: "E o segundo pedágio?", resposta: "A inflação, que não aparece em lugar nenhum. Rendeu 10% com inflação de 5%? Você ficou 4,76% mais rico, não 5%." },
      { pergunta: "Por que 4,76%?", resposta: "Porque a conta certa divide em vez de subtrair: (1,10 ÷ 1,05) − 1." },
      { pergunta: "E os dois juntos?", resposta: "10% nominais, inflação de 5% e IR de 15% entregam cerca de 3,3% de ganho real. É esse número que faz o patrimônio crescer." },
    ],
  },
  {
    slug: "amortizar-prazo-ou-parcela",
    rotulo: "Amortizar",
    chamada: "Simular prazo e parcela",
    telas: [
      { pergunta: "Sobrou um dinheiro: abater prazo ou parcela?", resposta: "Reduzir o prazo quase sempre economiza muito mais juros." },
      { pergunta: "Por quê?", resposta: "Juros são cobrados sobre saldo e sobre tempo. Cortar meses do fim apaga as parcelas mais carregadas de juros que ainda viriam." },
      { pergunta: "E reduzir a parcela?", resposta: "O alívio aparece no mês seguinte, mas o contrato continua rodando pelo mesmo tempo, com juros correndo sobre o saldo." },
      { pergunta: "Então reduzir a parcela é erro?", resposta: "Não. Faz sentido quando o orçamento do mês está apertado: é uma escolha de fôlego, não de matemática." },
      { pergunta: "Dá para usar o FGTS?", resposta: "No financiamento imobiliário, sim: o FGTS pode ser usado para amortizar." },
      { pergunta: "Como decidir?", resposta: "Simule os dois caminhos com o valor exato que você tem e veja quanto cada um economiza até o fim do contrato." },
    ],
  },
];

/** Os stories prontos para a tela, com título, capa e ferramenta lidos da matéria. */
export function getStories(): Story[] {
  return ROTEIROS.flatMap((r): Story[] => {
    const a = artigoPorSlug(r.slug);
    if (!a) return [];
    return [
      {
        id: a.slug,
        rotulo: r.rotulo,
        titulo: a.titulo,
        capa: a.capa,
        telas: r.telas,
        artigo: { href: `/novare-news/${a.slug}` },
        ferramenta: { href: a.ferramenta.href, nome: r.chamada ?? a.ferramenta.nome, externo: a.ferramenta.externo },
      },
    ];
  });
}
