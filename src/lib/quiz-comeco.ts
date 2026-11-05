import { APPS } from "@/lib/apps";
import { buildTrackingUrl, CARTEIRA_PONTUAL_LP } from "@/lib/consultoria";

/**
 * O QUIZ "POR ONDE EU COMEÇO?" (05/11/2026, a partir do benchmark com a Nord).
 *
 * Três perguntas e uma resposta: UMA porta principal do Hub, UMA alternativa e
 * o próximo passo concreto. A tela mora em `components/QuizComeco.tsx`; aqui
 * fica só a regra, sem React, para dar para conferir as 36 combinações sem
 * abrir navegador.
 *
 * ⚠️ CVM: ISTO NÃO É PERFIL DE INVESTIDOR NEM INDICAÇÃO DE ATIVO. O quiz
 * escolhe por onde começar DENTRO DO HUB — uma ferramenta, um app ou a equipe.
 * Nenhum destino aqui é produto financeiro, e nenhuma resposta diz onde pôr o
 * dinheiro. Por isso os simuladores de produto (Tesouro, CDI) ficam de fora de
 * propósito: recomendar o simulador de um papel soaria como recomendar o papel.
 *
 * ⚠️ NOME E ENDEREÇO DAS FERRAMENTAS VÊM DE `APPS`, não daqui: se o catálogo
 * renomear ou mover uma, o quiz acompanha. O texto de "por que" é desta
 * tela, escrito a partir da descrição de cada ferramenta e das matérias do
 * News (reserva antes de investir, poucas categorias no orçamento etc.).
 */

export type Dor = "dividas" | "organizar" | "investir" | "futuro";
export type Tempo = "5min" | "30min" | "ajuda";
export type Situacao = "vermelho" | "zero" | "sobrando";
export type Respostas = { dor: Dor; tempo: Tempo; situacao: Situacao };

type Pergunta<K extends keyof Respostas> = {
  chave: K;
  titulo: string;
  opcoes: { valor: Respostas[K]; rotulo: string }[];
};

export const PERGUNTAS: [Pergunta<"dor">, Pergunta<"tempo">, Pergunta<"situacao">] = [
  {
    chave: "dor",
    titulo: "O que mais te incomoda agora?",
    opcoes: [
      { valor: "dividas", rotulo: "Gastos e dívidas" },
      { valor: "organizar", rotulo: "Organizar o mês" },
      { valor: "investir", rotulo: "Investir melhor" },
      { valor: "futuro", rotulo: "Planejar o futuro" },
    ],
  },
  {
    chave: "tempo",
    titulo: "Quanto tempo você quer dedicar?",
    opcoes: [
      { valor: "5min", rotulo: "5 minutos" },
      { valor: "30min", rotulo: "30 minutos" },
      { valor: "ajuda", rotulo: "Quero ajuda de alguém" },
    ],
  },
  {
    chave: "situacao",
    titulo: "Onde você está hoje?",
    opcoes: [
      { valor: "vermelho", rotulo: "No vermelho" },
      { valor: "zero", rotulo: "No zero a zero" },
      { valor: "sobrando", rotulo: "Sobrando" },
    ],
  },
];

export type DestinoId =
  | "fincash"
  | "exame"
  | "iris"
  | "novarecash"
  | "carteira"
  | "orcamento"
  | "reserva"
  | "juros"
  | "rentabilidade"
  | "aposentadoria"
  | "previdencia";

export type Destino = {
  id: DestinoId;
  nome: string;
  href: string;
  externo?: boolean;
  /** O que a pessoa precisa saber antes de clicar: grátis, com cadastro, pago, com gente. */
  selo: string;
  /** Uma frase: o que ela encontra lá. */
  porque: string;
  /** O primeiro passo concreto, quando esta é a porta principal. */
  passo: string;
};

/** Nome e endereço do catálogo; a reserva só vale se a ferramenta sair de `APPS` (a home não pode quebrar). */
function doCatalogo(slug: string, reserva: { nome: string; href: string }) {
  const app = APPS.find((a) => a.slug === slug);
  return app ? { nome: app.nome, href: app.href, externo: app.externo } : reserva;
}

export const DESTINOS: Record<DestinoId, Destino> = {
  fincash: {
    id: "fincash",
    ...doCatalogo("fincash", { nome: "FINCASH", href: "/fincash" }),
    selo: "Grátis · com cadastro",
    porque: "O app da casa para o dia a dia: contas, contas fixas e orçamento, com o painel dizendo quanto ainda dá para gastar até o fim do mês.",
    passo: "Crie a conta grátis e cadastre as contas fixas uma vez — aluguel, luz, parcelas. O mês seguinte já abre preenchido.",
  },
  exame: {
    id: "exame",
    nome: "Exame de Saúde Financeira",
    href: "/exame-saude-financeira",
    selo: "Grátis · 1 minuto",
    porque: "Uma nota de 0 a 100 olhando sobra do mês, reserva, dívidas e investimentos — e o que melhorar primeiro.",
    passo: "Responda o Exame: em 1 minuto você tem a sua nota e sabe qual ponto atacar primeiro.",
  },
  iris: {
    id: "iris",
    ...doCatalogo("iris", { nome: "Íris", href: "/iris" }),
    selo: "Grátis · IA da casa",
    porque: "Você cola o extrato do banco e ela acha o dinheiro que some: assinatura esquecida, tarifa, juro escondido.",
    passo: "Baixe o extrato do último mês no app do banco (CSV ou OFX) e arraste na Íris. Ela lista o que dá para cortar.",
  },
  novarecash: {
    id: "novarecash",
    nome: "NovareCash",
    href: "/novarecash",
    selo: "App pago da casa",
    porque: "Extrato e orçamento que se organizam, alertas do dinheiro que some e um consultor da Novare pelo WhatsApp, direto do app — gente, não robô.",
    passo: "Veja na página do NovareCash o que já funciona hoje e como falar com o consultor de dentro do app.",
  },
  carteira: {
    id: "carteira",
    nome: "Carteira Pontual",
    href: buildTrackingUrl(CARTEIRA_PONTUAL_LP, "quiz-comeco"),
    externo: true,
    selo: "Com a equipe Novare",
    porque: "A equipe olha produto por produto da sua carteira e mostra o custo real e o que rende menos do que deveria — sem ganhar comissão de nenhum produto.",
    passo: "Peça a análise na página da Carteira Pontual. Quem responde é gente da Novare, que não vende produto.",
  },
  orcamento: {
    id: "orcamento",
    ...doCatalogo("orcamento-inteligente", { nome: "Orçamento Inteligente", href: "/ferramentas/orcamento" }),
    selo: "Grátis · sem cadastro",
    porque: "Informe a renda, distribua as categorias e veja na hora se o plano cabe no salário.",
    passo: "Comece com quatro categorias grandes — moradia, alimentação, transporte e o resto. Detalhe só depois de um mês vendo onde o dinheiro se concentra.",
  },
  reserva: {
    id: "reserva",
    ...doCatalogo("reserva-emergencia", { nome: "Reserva de Emergência", href: "/ferramentas/reserva" }),
    selo: "Grátis · sem cadastro",
    porque: "Mostra de quanto você precisa pelo seu tipo de renda e em quanto tempo consegue chegar lá.",
    passo: "Calcule a reserva pelo seu custo mensal, não pela renda. Ela vem antes de investir em qualquer coisa com risco.",
  },
  juros: {
    id: "juros",
    ...doCatalogo("juros-compostos", { nome: "Juros Compostos", href: "/ferramentas/juros-compostos" }),
    selo: "Grátis · sem cadastro",
    porque: "Separa o que você aportou do que de fato rendeu — e mostra por que o tempo pesa mais que o valor.",
    passo: "Simule dois começos diferentes com o mesmo prazo final e compare onde cada curva termina.",
  },
  rentabilidade: {
    id: "rentabilidade",
    ...doCatalogo("rentabilidade-real", { nome: "Rentabilidade Real", href: "/ferramentas/rentabilidade-real" }),
    selo: "Grátis · sem cadastro",
    porque: "O número do extrato é bruto: aqui você vê o que sobra do rendimento depois do imposto e da inflação.",
    passo: "Pegue a taxa de algo que você já tem e veja o ganho real. É esse número que diz se o patrimônio está crescendo.",
  },
  aposentadoria: {
    id: "aposentadoria",
    ...doCatalogo("simulador-aposentadoria", { nome: "Simulador de Aposentadoria", href: "/ferramentas/aposentadoria" }),
    selo: "Grátis · sem cadastro",
    porque: "Quanto patrimônio você precisa para viver de renda, quanto vai ter no ritmo de hoje e em que idade chega lá.",
    passo: "Simule com o que você guarda hoje e depois com um pouco mais por mês: a diferença na idade de chegada mostra o tamanho do esforço.",
  },
  previdencia: {
    id: "previdencia",
    ...doCatalogo("raio-x-previdencia", { nome: "Raio-X da Previdência", href: "/ferramentas/raio-x-previdencia" }),
    selo: "Grátis · sem cadastro",
    porque: "Tem plano de previdência? Veja, em reais, quanto as taxas dele levam até o dia do resgate.",
    passo: "Ache no extrato do plano a taxa de administração e a de carregamento e preencha as duas.",
  },
};

export type Recomendacao = {
  principal: Destino;
  alternativa: Destino;
  /** O próximo passo: o da porta principal, com uma frase antes quando a ordem importa. */
  passo: string;
};

const ANTES_DE_INVESTIR =
  "Primeiro o mês fechando no azul, depois a reserva, e só então investir — é a ordem que protege o que você já tem.";

/**
 * A regra, em quatro degraus (o primeiro que servir decide):
 *
 *   1. Quer gente → a equipe. Para investir e planejar, a Carteira Pontual;
 *      para gastos, dívidas e organização, o NovareCash, que tem consultor
 *      dentro do app. No vermelho, investir fica para depois, então também
 *      o NovareCash.
 *   2. No vermelho querendo investir ou planejar → primeiro estancar o mês
 *      (Íris em 5 min, FINCASH em 30), com o lembrete da ordem.
 *   3. Investir estando no zero a zero → a reserva vem antes.
 *   4. O resto, pela dor e pelo tempo.
 */
export function recomendar({ dor, tempo, situacao }: Respostas): Recomendacao {
  const r = (principal: DestinoId, alternativa: DestinoId, antes?: string): Recomendacao => ({
    principal: DESTINOS[principal],
    alternativa: DESTINOS[alternativa],
    passo: antes ? `${antes} ${DESTINOS[principal].passo}` : DESTINOS[principal].passo,
  });
  const quer = dor === "investir" || dor === "futuro" ? "patrimonio" : "mes";

  if (tempo === "ajuda") {
    if (quer === "patrimonio" && situacao !== "vermelho") {
      const alt: DestinoId = dor === "futuro" ? "aposentadoria" : situacao === "zero" ? "reserva" : "rentabilidade";
      return r("carteira", alt);
    }
    return r("novarecash", situacao === "vermelho" ? "iris" : "fincash", quer === "patrimonio" ? ANTES_DE_INVESTIR : undefined);
  }

  if (quer === "patrimonio" && situacao === "vermelho") {
    return tempo === "5min" ? r("iris", "exame", ANTES_DE_INVESTIR) : r("fincash", "iris", ANTES_DE_INVESTIR);
  }

  switch (dor) {
    case "dividas":
      return tempo === "5min" ? r("iris", "exame") : r("fincash", "iris");
    case "organizar":
      return tempo === "5min" ? r("orcamento", situacao === "vermelho" ? "iris" : "exame") : r("fincash", "orcamento");
    case "investir":
      if (situacao === "zero") return r("reserva", tempo === "5min" ? "exame" : "fincash");
      return r("rentabilidade", tempo === "5min" ? "juros" : "previdencia");
    case "futuro":
      if (tempo === "5min") return r("juros", "aposentadoria");
      return r("aposentadoria", situacao === "zero" ? "reserva" : "previdencia");
  }
}

/**
 * O que o quiz manda para `medir` (`lib/medir.ts`), sempre anônimo: só ids
 * fixos — a combinação de respostas (de onde a porta sugerida se deduz, já que
 * a regra é determinística) e a porta clicada. Nada digitado, nada da pessoa.
 *
 *   quiz-comeco:home:dividas-5min-vermelho   + "abriu"  → a sugestão apareceu
 *   quiz-comeco:principal:iris               + "clicou" → clicou na porta
 */
export type OrigemQuiz = "home" | "aplicativos";
export type ModuloQuiz =
  | `quiz-comeco:${OrigemQuiz}:${Dor}-${Tempo}-${Situacao}`
  | `quiz-comeco:${"principal" | "alternativa"}:${DestinoId}`;

/** Rótulo de uma resposta, para o resumo "você disse…". */
export function rotuloDe<K extends keyof Respostas>(chave: K, valor: Respostas[K]): string {
  const p = PERGUNTAS.find((x) => x.chave === chave) as Pergunta<K> | undefined;
  return p?.opcoes.find((o) => o.valor === valor)?.rotulo ?? String(valor);
}
