/**
 * As carreiras que o Workspace atende de forma dedicada.
 *
 * A tese: ferramenta financeira genérica virou commodity — tem
 * calculadora de salário líquido em todo portal de notícias. O que não
 * existe é alguém que entenda que o médico vive de pró-labore mais
 * distribuição de lucros, que o engenheiro recebe por medição de obra e
 * que o dentista tem meio patrimônio parado dentro do consultório.
 *
 * Texto CURTO de propósito: a versão anterior desta página era um muro de
 * parágrafos, e ninguém lê muro. Cada dor cabe em uma linha; quem quiser
 * o detalhe pede na conversa.
 *
 * Nada aqui é estatística inventada — não há um número neste arquivo que
 * a Novare não possa defender numa conversa.
 *
 * FOTOS: Pexels License (uso comercial livre, sem atribuição obrigatória).
 * Os créditos ficam registrados em `docs/creditos-imagens.txt`, por
 * educação e para rastrear a origem se um dia precisar.
 */

export type Profissao = {
  slug: string;
  /** Como aparece no título: "Médicos", "Engenheiros e arquitetos". */
  nome: string;
  /** Frase de capa, sobre a foto. */
  chamada: string;
  /** Uma frase de contexto. Uma só. */
  abertura: string;
  /** O que trava o dinheiro dessa carreira — título + uma linha. */
  dores: { titulo: string; texto: string }[];
  /** Perguntas que a análise responde. */
  perguntas: string[];
  /** Enquadramento da foto no recorte do herói (object-position). */
  foco: string;
  /** Matiz do véu sobre a foto, dentro da paleta da casa. */
  matiz: number;
  /** Quem fotografou, para o arquivo de créditos. */
  credito: string;
};

export const PROFISSOES: Profissao[] = [
  {
    slug: "medicos",
    nome: "Médicos",
    chamada: "Você cuida de todo mundo. Quem cuida do seu dinheiro?",
    abertura:
      "Renda alta e nenhuma rede embaixo: sem CLT não existe FGTS, 13º nem férias — e o INSS calculado só sobre o pró-labore não sustenta ninguém.",
    dores: [
      {
        titulo: "Pró-labore mínimo, aposentadoria mínima",
        texto:
          "A conta que reduz seu imposto é a mesma que reduz sua contribuição. Ninguém te mostra isso até ser tarde.",
      },
      {
        titulo: "Plantão não é salário",
        texto:
          "A renda muda todo mês e vem de PJ, RPA e cooperativa. Sem uma régua, o padrão de vida segue o melhor mês.",
      },
      {
        titulo: "Alvo preferido de quem vende previdência",
        texto:
          "Renda alta e pouco tempo formam o cliente perfeito para um plano de taxa alta. É a venda mais fácil do mercado.",
      },
      {
        titulo: "A residência ainda cobra juros",
        texto:
          "Começar a acumular aos 32 em vez de 26 muda o número final mais do que qualquer escolha de investimento depois.",
      },
    ],
    perguntas: [
      "Quanto a taxa da sua previdência leva até você parar?",
      "Qual é a sua renda real por hora, somando plantão, PJ e RPA?",
      "Quanto falta para não depender de plantão aos 55?",
      "O que sustenta a casa se você ficar seis meses sem atender?",
    ],
    foco: "center 30%",
    matiz: 202,
    credito: "Gustavo Fring / Pexels",
  },
  {
    slug: "engenheiros-e-arquitetos",
    nome: "Engenheiros e arquitetos",
    chamada: "A obra fecha no prazo. E o seu dinheiro, fecha?",
    abertura:
      "Você calcula carga e cronograma no milímetro, mas a renda entra por medição — em lote, com meses secos no meio. Planilha feita para salário fixo não serve.",
    dores: [
      {
        titulo: "Renda em lote, despesa mensal",
        texto:
          "O recebimento por medição precisa durar até o próximo. É o que faz engenheiro com boa renda anual passar aperto em março.",
      },
      {
        titulo: "CLT com PJ do lado",
        texto:
          "Carteira assinada de dia, projeto próprio de noite: dois regimes de tributação e, quase sempre, um caixa só.",
      },
      {
        titulo: "Responsabilidade técnica é risco financeiro",
        texto:
          "ART e RRT assinadas seguem você por anos. Isso pede reserva pensada, não um seguro do pacote da conta.",
      },
      {
        titulo: "Capital preso na obra",
        texto:
          "Virou sócio do empreendimento? Seu patrimônio deixou de ser líquido e passou a depender de uma obra dar certo.",
      },
    ],
    perguntas: [
      "Quanto da renda irregular precisa virar reserva para os meses secos?",
      "Quanto a taxa da sua previdência custa até você parar de projetar?",
      "Seu patrimônio está concentrado demais em obra e imóvel?",
      "Qual é a sua renda média real, distribuída pelos doze meses?",
    ],
    foco: "center 40%",
    matiz: 215,
    credito: "ThisIsEngineering / Pexels",
  },
  {
    slug: "advogados",
    nome: "Advogados",
    chamada: "O êxito entra de uma vez. E depois?",
    abertura:
      "Honorário de êxito é a renda mais traiçoeira que existe: chega grande, chega tarde e não chega de novo tão cedo.",
    dores: [
      {
        titulo: "O êxito que vira padrão de vida",
        texto:
          "Um honorário grande num mês vira despesa fixa no seguinte. O processo ganho financia o aperto do ano seguinte.",
      },
      {
        titulo: "Sócio, mas sem CLT",
        texto:
          "Pró-labore de sociedade não gera FGTS nem férias. A proteção precisa ser construída por você, com o seu dinheiro.",
      },
      {
        titulo: "Caixa do escritório, caixa de casa",
        texto:
          "Quando o mesmo dinheiro paga o funcionário e o supermercado, ninguém sabe se o escritório dá lucro.",
      },
      {
        titulo: "Previdência vendida na conta PJ",
        texto:
          "A conta jurídica é a porta de entrada da oferta de plano com taxa alta — a mesma que ninguém audita depois.",
      },
    ],
    perguntas: [
      "Quanto do honorário de êxito deveria virar capital, e não consumo?",
      "Quanto a taxa da sua previdência leva até a aposentadoria?",
      "O escritório dá lucro depois de pagar o seu trabalho a preço de mercado?",
      "Quanto de reserva a sua renda irregular exige?",
    ],
    foco: "center 45%",
    matiz: 25,
    credito: "Pavel Danilyuk / Pexels",
  },
  {
    slug: "dentistas",
    nome: "Dentistas",
    chamada: "Metade do seu patrimônio está dentro do consultório",
    abertura:
      "Cadeira, raio-x, autoclave, escâner: patrimônio caro, que deprecia e não se vende rápido. E quando o caixa da clínica é o de casa, não dá para saber se o negócio dá lucro.",
    dores: [
      {
        titulo: "Equipamento é patrimônio que encolhe",
        texto:
          "Diferente de imóvel, equipamento perde valor todo ano e exige manutenção. Contar com ele como reserva é ilusão.",
      },
      {
        titulo: "O financiamento do equipamento raramente é barato",
        texto:
          "O crédito que vem junto com a venda costuma ter a taxa mais alta da negociação — e ninguém compara antes.",
      },
      {
        titulo: "Convênio paga pouco e paga depois",
        texto:
          "Comprime a margem e alonga o recebimento. Sem separar convênio de particular, a conta da clínica engana.",
      },
      {
        titulo: "Dois caixas, uma conta",
        texto:
          "Enquanto clínica e casa dividem a conta, não existe pró-labore de verdade nem como saber quanto você ganha.",
      },
    ],
    perguntas: [
      "Quanto a clínica realmente dá de lucro depois de te pagar?",
      "Qual a taxa real do financiamento do seu equipamento?",
      "Quanto a taxa da sua previdência custa até você parar de atender?",
      "Se você parar de atender por três meses, o que sustenta a casa?",
    ],
    foco: "center 40%",
    matiz: 160,
    credito: "Tima Miroshnichenko / Pexels",
  },
];

export function acharProfissao(slug: string): Profissao | undefined {
  return PROFISSOES.find((p) => p.slug === slug);
}

/** Foto real da carreira (herói e miniaturas). */
export const fotoDe = (slug: string) => `/profissoes/fotos/${slug}.jpg`;

/**
 * Arte com marca e título, usada como imagem de compartilhamento.
 * A foto vende na página; a arte vende no WhatsApp, onde é preciso ter
 * logo e texto dentro da própria imagem.
 */
export const arteDe = (slug: string) => `/profissoes/${slug}.jpg`;
