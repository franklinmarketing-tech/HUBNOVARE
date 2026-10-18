/**
 * A copy da landing de venda (`/assinar`).
 *
 * ┌── REGRA DESTE ARQUIVO ────────────────────────────────────────────────┐
 * │ NADA AQUI É INVENTADO.                                                 │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Preço, garantia e desconto NÃO são escritos à mão: vêm de `assinatura.ts`,
 * que é fonte única e deriva um número do outro. A contagem de ferramentas
 * vem de `apps.ts`, que conta o catálogo, porque o site já disse "22" numa
 * tela e "23" em outra quando o número morava em cinco arquivos.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A ARQUITETURA, E DE ONDE ELA VEM                                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * A ordem das seções segue o framework de diagnóstico de LP do
 * `RICHARD.TXT`:
 *
 *   problema → consequência → oportunidade → mecanismo → solução →
 *   prova → oferta → redução de risco → CTA
 *
 * ┌── O QUEM ─────────────────────────────────────────────────────────────┐
 * │ Não é demografia. É critério de compra: alguém que ganha bem, já      │
 * │ tentou planilha, tem parcela caindo por vários meses e não sabe       │
 * │ quanto ainda pode gastar até o dia 30.                                 │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── O QUANDO ───────────────────────────────────────────────────────────┐
 * │ Consciência do PROBLEMA. A pessoa sabe que o dinheiro some; não sabe  │
 * │ que existe categoria para resolver isso. Para esse estágio a regra do │
 * │ Richard é: a headline fala com o estágio atual (ângulo de CUSTO e     │
 * │ URGÊNCIA) e a prova empurra um estágio à frente (o MECANISMO).        │
 * │                                                                        │
 * │ É por isso que o herói não diz "plataforma de gestão financeira" e    │
 * │ sim faz a pergunta que a pessoa já se faz sozinha, e a seção seguinte │
 * │ mostra a conta de quatro linhas que produz a resposta.                 │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── COMO A PÁGINA ABRANGE TUDO SEM CONFUNDIR ───────────────────────────┐
 * │ A assinatura tem quatro produtos e um humano dentro. Vender os cinco  │
 * │ de uma vez é o erro que o Richard chama de "plataforma all-in-one":   │
 * │ não diz nada.                                                          │
 * │                                                                        │
 * │ Então a página tem UMA promessa, o número do Fin Cash, e a amplitude  │
 * │ entra depois, como o que JUSTIFICA o preço, não como o que o explica. │
 * │ Primeiro a pessoa quer a resposta; só depois ela pergunta "e o que    │
 * │ mais vem junto?".                                                      │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── O QUE ESTA PÁGINA NÃO FAZ ──────────────────────────────────────────┐
 * │ Não inventa depoimento (ver `PROVA_RESSALVA`), não tem contador       │
 * │ regressivo, não promete rentabilidade e não esconde onde o produto    │
 * │ PERDE (ver as três últimas linhas de `COMPARATIVO`).                  │
 * │                                                                        │
 * │ O "de R$ 358,80 por R$ 238,80" é a única coisa parecida com preço     │
 * │ de/por na página, e ele é real: 358,80 é a soma das doze mensalidades │
 * │ que a pessoa deixaria de pagar, derivada em `assinatura.ts`.          │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { CONTAGEM } from "@/lib/apps";
import {
  ASSINATURA_ECONOMIA_MESES,
  ASSINATURA_ECONOMIA_ROTULO,
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_PROVEDOR,
} from "@/lib/lp-precos";
import { ROTULO_DESCONTO } from "@/lib/lp-precos";

export const N_FERRAMENTAS = CONTAGEM.ferramentas;

/** O nome do app de fluxo de caixa. Uma grafia só, em um lugar só. */
export const FIN_CASH = "Fin Cash";
export const FIN_PLAN = "FinPlan";

/* ========================================================== 1. O HERÓI == */

/**
 * A promessa.
 *
 * É uma PERGUNTA, e de propósito: é exatamente a frase que a pessoa já diz
 * para si mesma na frente da maquininha. O Richard chama isso de continuar
 * a conversa que começou antes do clique.
 *
 * E a resposta do produto é um número só, o que faz a promessa ser
 * verificável em vez de adjetiva.
 */
export const HEROI = {
  selo: "Consultoria CFP® · Parceria Nord Research",
  titulo1: "Quanto você pode gastar hoje",
  titulo2: "sem estourar o mês?",
  lead:
    `O saldo mostra o que você tem. O ${FIN_CASH} desconta o que ainda vai ` +
    `sair, o aluguel do dia 5, a parcela que vai até dezembro, a fatura que ` +
    `fecha semana que vem, e devolve um número só: o que sobra de verdade.`,
  reforco: "Sem conectar banco. Sem senha. Sem Open Finance.",
  cta: "Começar agora",
  ctaSecundario: "Ver o que vem junto",
  microcopia: "De graça · sem cartão · sem pegadinha",
} as const;

/**
 * Os objetivos pregados em volta do herói.
 *
 * Não são features: são as coisas pelas quais alguém organiza dinheiro. A
 * página mostra o DESTINO antes da ferramenta, porque ninguém acorda
 * querendo uma calculadora de financiamento.
 */
export const OBJETIVOS_HEROI = [
  { rotulo: "Casa própria", icone: "/icones-3d/goal-imovel.png" },
  { rotulo: "Aposentadoria", icone: "/icones-3d/goal-aposentadoria.png" },
  { rotulo: "Reserva", icone: "/icones-3d/goal-reserva.png" },
  { rotulo: "Viagem", icone: "/icones-3d/goal-viagem.png" },
  { rotulo: "Educação", icone: "/icones-3d/goal-educacao.png" },
  { rotulo: "Sair das dívidas", icone: "/icones-3d/goal-dividas.png" },
] as const;

/* =========================================================== 2. OS FATOS */

/** Só o que a casa comprova. Nada aqui é estimativa de marketing. */
export const FATOS = [
  { valor: "0", rotulo: "comissão de banco ou corretora" },
  { valor: String(N_FERRAMENTAS), rotulo: "ferramentas e calculadoras" },
  {
    /* ⚠️ ERA "7 dias de garantia incondicional". Garantia é promessa de
       devolver dinheiro, e não há dinheiro desde 18/10/2026 — manter o
       número faria a página prometer reembolso do que ninguém pagou. */
    valor: "R$ 0",
    rotulo: "para usar tudo o que tem aqui",
  },
  { valor: "3 em 3", rotulo: "meses, um consultor escreve a sua revisão" },
] as const;

/* ======================================================= 3. O MANIFESTO = */

/**
 * A faixa escura logo depois do herói: uma frase única, e os verbos do
 * método embaixo.
 *
 * Os cinco verbos são o Ciclo Novare, método da casa e não invenção de
 * página. A ORDEM é o argumento: quem registra antes de estruturar desiste
 * no segundo mês, e é exatamente por isso que a planilha morre.
 */
export const MANIFESTO = {
  frase1: "O saldo mostra o que você tem.",
  frase2: `O ${FIN_CASH} mostra o que sobra.`,
  verbos: [
    { rotulo: "Estruture", icone: "Layers" },
    { rotulo: "Reserve", icone: "Target" },
    { rotulo: "Registre", icone: "PenLine" },
    { rotulo: "Confira", icone: "Eye" },
    { rotulo: "Ajuste", icone: "SlidersHorizontal" },
  ],
} as const;

/* ========================================================= 4. O PROBLEMA */

/**
 * A dor, em quatro painéis.
 *
 * Cada um tem DOIS textos: o `resumo`, que cabe numa coluna estreita, e o
 * `detalhe`, que só é lido quando a pessoa abriu aquele painel. Quem clica
 * já se reconheceu, e é esse o trabalho da peça.
 */
export const SINTOMAS = [
  {
    chave: "saldo",
    icone: "Wallet",
    rotulo: "O saldo mente por omissão",
    resumo: "Ele mostra o que já saiu. Não o que ainda vai sair.",
    detalhe:
      "O extrato é um retrovisor. Ele não conta o aluguel do dia 5, a parcela que vai até dezembro nem a fatura que fecha semana que vem, e é justamente esse dinheiro que já tem dono.",
    itens: [
      { icone: "Receipt", texto: "O aluguel do dia 5 não está no saldo" },
      { icone: "CalendarClock", texto: "A parcela de dezembro também não" },
      { icone: "TrendingDown", texto: "O mês fecha no vermelho sem aviso" },
    ],
    aurora: "nv-aurora-1",
  },
  {
    chave: "fatura",
    icone: "CreditCard",
    rotulo: "A fatura que ainda não fechou",
    resumo: "Cada cartão tem o ciclo dele, e nenhum é o dia 1º.",
    detalhe:
      "Um fecha dia 20 e vence dia 28, o outro fecha dia 3. Entre uma fatura e outra você gasta sem saber em qual mês aquilo vai cair, e a conta só aparece quando já não dá para mudar de ideia.",
    itens: [
      { icone: "CreditCard", texto: "Cartões com fechamentos diferentes" },
      { icone: "Repeat", texto: "Compra em 12x vira doze meses de conta" },
      { icone: "HelpCircle", texto: "Você não sabe em qual mês aquilo cai" },
    ],
    aurora: "nv-aurora-3",
  },
  {
    chave: "planilha",
    icone: "Table2",
    rotulo: "A planilha que morre",
    resumo: "Você já começou três. Nenhuma chegou ao terceiro mês.",
    detalhe:
      "A planilha faz a conta certa. O problema é que ela cobra que você lembre de abrir, todo dia, para sempre. A de janeiro morre em fevereiro, e a culpa não é da sua disciplina.",
    itens: [
      { icone: "Table2", texto: "Cobra meia hora sua, todo dia" },
      { icone: "PenLine", texto: "Uma linha por parcela, digitada à mão" },
      { icone: "TrendingDown", texto: "Você abandona, e volta à estaca zero" },
    ],
    aurora: "nv-aurora-2",
  },
  {
    chave: "conselho",
    icone: "Handshake",
    rotulo: "O conselho vendido",
    resumo: "Quem te orienta hoje é pago por quem te vende.",
    detalhe:
      "O gerente tem meta. O assessor tem comissão. Nenhum dos dois é pago para dizer que o melhor pra você, agora, é não comprar nada, e essa é a resposta certa na maior parte das vezes.",
    itens: [
      { icone: "Target", texto: "O gerente do banco tem meta a bater" },
      { icone: "Percent", texto: "O assessor ganha pelo produto que coloca" },
      { icone: "EyeOff", texto: "Ninguém é pago para dizer “não compre”" },
    ],
    aurora: "nv-aurora-4",
  },
] as const;

/* =============================================== 5. A CONTA (o exemplo) = */

/**
 * O EXEMPLO TRABALHADO.
 *
 * ┌── POR QUE ESTA SEÇÃO EXISTE ──────────────────────────────────────────┐
 * │ Porque é a prova que o estágio de consciência desta página pede. O    │
 * │ Richard é literal: para quem está consciente do problema, o ângulo é  │
 * │ custo e urgência e a prova são "números, antes e depois, cálculo".    │
 * │                                                                        │
 * │ Quatro linhas e uma subtração. É o produto inteiro numa conta que a   │
 * │ pessoa refaz de cabeça, e é o que separa esta página de uma que só    │
 * │ promete clareza.                                                       │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Os quatro números são os da conta de demonstração do app, os mesmos que
 * aparecem nas telas. Nenhum foi escolhido para impressionar.
 */
export const CONTA = {
  chapeu: "A conta que falta",
  titulo: "O seu saldo não é o seu dinheiro",
  lead: `Setembro, na conta de demonstração do ${FIN_CASH}.`,
  extrato: {
    titulo: "O que o extrato te mostra",
    valor: "R$ 2.392",
    rotulo: "já na sua conta",
    nota: "é este o número que o app do banco te dá",
  },
  linhas: [
    {
      sinal: "+",
      valor: "R$ 600",
      rotulo: "ainda entra até o dia 30",
      nota: "e o extrato não conta",
      tom: "verde",
    },
    {
      sinal: "−",
      valor: "R$ 1.926",
      rotulo: "já tem dono",
      nota: "contas e faturas que ainda vencem no mês",
      tom: "laranja",
    },
  ],
  resultado: {
    titulo: `O que o ${FIN_CASH} te mostra`,
    valor: "R$ 1.066",
    rotulo: "livre de verdade",
    nota: "é o que você realmente pode gastar até o dia 30",
  },
  rodape:
    "Conta de demonstração. Os quatro números são os das telas do app, e a subtração é a mesma que ele faz com os seus.",
} as const;

/* ====================================================== 6. É PARA VOCÊ SE */

/**
 * A lista de auto-seleção.
 *
 * O Richard separa ICP de persona: persona é biografia, ICP é critério de
 * compra. Esta lista é o critério, escrito na primeira pessoa, para a
 * pessoa se reconhecer em vez de ser descrita.
 */
export const PARA_VOCE_SE = [
  "Ganha bem e mesmo assim não sabe para onde o dinheiro vai",
  "Tem parcela caindo por vários meses e perde a conta",
  "Perde o controle do cartão entre uma fatura e outra",
  "Quer sair das dívidas com um plano, não com força de vontade",
  "Quer saber como os próximos meses fecham, antes de eles fecharem",
  "Quer um número só: quanto ainda dá para gastar",
] as const;

/* ============================================ 7. OS MÓDULOS (a pilha) === */

/**
 * O que a assinatura abre.
 *
 * A ORDEM É ARGUMENTO, não catálogo:
 *   1. o que resolve o mês que já está correndo (Fin Cash);
 *   2. o que resolve os próximos anos (FinPlan);
 *   3. o que ela não sabia que queria (a Íris);
 *   4. o tamanho da casa (as ferramentas);
 *   5. e a única linha que software nenhum entrega (o consultor).
 *
 * O quinto fecha a pilha de propósito: depois de quatro softwares, a
 * lembrança de que existe gente do outro lado é o que muda o preço de
 * "assinatura de app" para "acesso a uma casa".
 */
export const MODULOS = [
  {
    chave: "fincash",
    aurora: "nv-aurora-1",
    etiqueta: FIN_CASH,
    selo: "O mês",
    icone: "Wallet",
    titulo: "Quanto ainda dá para gastar até o dia 30",
    texto:
      "Contas, cartões, parcelas e metas num lugar só. Um parcelamento em 12x já nasce com as doze parcelas na linha do tempo, e o limite por categoria sai do seu histórico, não de um chute.",
    href: "/fincash",
    linkRotulo: `Conhecer o ${FIN_CASH}`,
  },
  {
    chave: "finplan",
    aurora: "nv-aurora-2",
    etiqueta: FIN_PLAN,
    selo: "Os anos",
    icone: "Target",
    titulo: "Onde você precisa chegar, e quando",
    texto:
      "Oito perguntas e o app devolve na hora: nota de saúde financeira, Marco Horizonte com prazo e plano de ação com valor por mês. O que o Fin Cash faz com setembro, o FinPlan faz com 2041.",
    href: "/finplan",
    linkRotulo: `Conhecer o ${FIN_PLAN}`,
  },
  {
    chave: "iris",
    aurora: "nv-aurora-3",
    etiqueta: "Íris",
    selo: "IA",
    icone: "Bot",
    titulo: "A IA que lê o seu extrato, sem teto de leituras",
    texto:
      "Cole o texto do extrato e ela encontra assinatura esquecida, tarifa repetida e juro escondido. Quantos extratos você quiser, todo mês, e sem conectar nada ao banco.",
    href: "/iris",
    linkRotulo: "Conhecer a Íris",
  },
  {
    chave: "ferramentas",
    aurora: "nv-aurora-4",
    etiqueta: "Ferramentas",
    selo: String(N_FERRAMENTAS),
    icone: "Wrench",
    titulo: `As ${N_FERRAMENTAS} calculadoras da casa, todas liberadas`,
    texto:
      "Salário líquido, rescisão, férias, financiamento e CET, aposentadoria, comparador de bancos. Sem limite de uso e com as tabelas de 2026.",
    href: "/aplicativos",
    linkRotulo: "Ver o catálogo",
  },
  {
    chave: "consultor",
    aurora: "nv-aurora-1",
    etiqueta: "Consultor",
    selo: "Gente",
    icone: "Users",
    titulo: "E, de três em três meses, um humano lê o seu plano",
    texto:
      "Um consultor da Novare abre o que você montou e escreve o que mudou, o que está travando e qual é o próximo movimento. É a única coisa aqui que não é software — e é onde a conversa com a gente começa.",
    href: "/consultoria",
    linkRotulo: "Ver as consultorias",
  },
] as const;

/* ================================================ 8. O MECANISMO ======== */

/**
 * O zigue-zague: como o app faz o que promete.
 *
 * Para quem está consciente do problema, a prova que converte é o
 * MECANISMO, não o benefício repetido com outras palavras. Aqui a página
 * para de dizer O QUE faz e mostra COMO faz.
 */
export const MECANISMOS = [
  {
    etiqueta: "Você lança, ele projeta",
    tom: "ciano",
    icone: "PenLine",
    titulo: "A conta do mês inteiro, não só a de hoje",
    itens: [
      "Parcelamento em 12x nasce com as doze parcelas",
      "Conta fixa cadastrada uma vez volta sozinha todo mês",
      "Cada cartão no ciclo dele: fecha 20, vence 28",
    ],
    nota: "O OFX do banco entra pela importação, conferido linha por linha antes de gravar. O que já entrou não entra de novo.",
  },
  {
    etiqueta: "A dívida ganha data",
    tom: "laranja",
    icone: "Flag",
    titulo: "Em que ordem pagar, e em que mês você fica livre",
    itens: [
      "Avalanche e bola de neve lado a lado, em reais",
      "Sem pagar um real a mais por mês: o que muda é a ordem",
      "Doze meses à frente, com o mês negativo apontado antes",
    ],
    nota: "Quando uma dívida quita, a parcela dela não volta para o bolso: rola para a próxima. É isso que antecipa a data de saída.",
  },
] as const;

/* ============================================ 9. ANTES E DEPOIS ========= */

export const VIRADA = [
  {
    antes: "Você olha o saldo e não sabe quanto pode gastar.",
    depois: "Um número só: o que sobra até o dia 30.",
    imagem: "/lp/entrega-2.webp",
    marca: FIN_CASH,
  },
  {
    antes: "A dívida não tem data de saída.",
    depois: "Tem mês e ano, sem pagar um real a mais.",
    imagem: "/lp/entrega-1.webp",
    marca: "Dívidas",
  },
  {
    antes: "Fechar o mês é uma planilha que você abandona.",
    depois: "Cadastrou uma vez, o mês seguinte já abre preenchido.",
    imagem: "/lp/entrega-4.webp",
    marca: "Rotina",
  },
  {
    antes: "Quem te orienta ganha comissão do que te vende.",
    depois: "Um consultor CFP® escreve a sua revisão a cada 3 meses.",
    imagem: "/lp/entrega-5.webp",
    marca: "Consultoria",
  },
] as const;

/* ========================================================= 10. O CAMINHO */

/**
 * O esforço, dito na ordem honesta.
 *
 * O medo real nunca foi o preço: é o trabalho. A resposta mais forte que
 * esta página tem é que o trabalho é TODO no primeiro dia e não volta. Por
 * isso os passos são nomeados por FREQUÊNCIA, não por sequência.
 */
export const ETAPAS = [
  {
    numero: "01",
    titulo: "No primeiro dia, você cadastra o que se repete",
    texto:
      "As contas com o saldo de hoje, o salário, o aluguel, a escola, o streaming. É o único trabalho de verdade aqui, e ele não volta: feito uma vez, vale para todos os meses.",
    icone: "Layers",
  },
  {
    numero: "02",
    titulo: "No dia a dia, lançar leva segundos",
    texto:
      "O gasto entra em poucos toques e marcar uma conta como paga é um clique. No caixa, no ponto de ônibus, onde acontecer. Um parcelamento em 12x já nasce inteiro.",
    icone: "PenLine",
  },
  {
    numero: "03",
    titulo: "Uma vez por semana, você olha um número só",
    texto:
      "Quanto ainda dá para gastar até o fim do mês, já contando o que falta sair. Não é relatório, é uma linha, e ela chega enquanto ainda dá para mudar de ideia.",
    icone: "Eye",
  },
  {
    numero: "04",
    titulo: "A cada três meses, você não faz nada",
    texto:
      "Um consultor da Novare abre o seu plano e escreve o que mudou, o que está travando e qual é o próximo movimento. Você só lê.",
    icone: "Users",
  },
] as const;

/* ========================================================== 11. A PROVA */

export const PROVA = [
  {
    destaque: "Nord",
    titulo: "Parceria com a Nord Research",
    texto:
      "A consultoria de investimentos da casa une o método da Novare à análise independente da Nord, uma das maiores casas de research do Brasil.",
    marca: "/lp/nord-logo.png",
  },
  {
    destaque: "CFP®",
    titulo: "Consultores certificados",
    texto:
      "O padrão internacional de planejamento financeiro pessoal do outro lado da mesa. Não é um atendente com script de venda.",
  },
  {
    destaque: "0%",
    titulo: "Nenhuma comissão, de ninguém",
    texto:
      "A Novare não recebe de banco, corretora ou seguradora. As ferramentas são de graça; a casa vive da consultoria que faz com quem procura. Por isso ninguém aqui tem motivo para empurrar produto nenhum.",
  },
  {
    destaque: "LGPD",
    titulo: "Nada se conecta ao seu banco",
    texto:
      "Não existe campo para a senha do banco e nunca vai existir. É essa recusa que faz o app funcionar com qualquer banco brasileiro.",
  },
] as const;

/**
 * NÃO HÁ SEÇÃO DE DEPOIMENTOS NESTA PÁGINA, E A AUSÊNCIA É A DECISÃO.
 *
 * ┌── POR QUE ELA SAIU, PARA NINGUÉM RECOLOCAR ──────────────────────────┐
 * │ As únicas falas que a casa tem publicadas são de clientes da          │
 * │ CONSULTORIA. Nenhuma dessas pessoas usou o Fin Cash.                  │
 * │                                                                        │
 * │ Colocá-las aqui exige uma ressalva do tamanho dos próprios            │
 * │ depoimentos ("isto não prova que o app funciona"), e uma prova que     │
 * │ precisa se desmentir na linha seguinte não é prova: é ruído no meio   │
 * │ da página, logo antes do preço.                                        │
 * │                                                                        │
 * │ O que esses clientes provavam — que existe consultor de verdade do    │
 * │ outro lado e que ele não vive de comissão — a página continua         │
 * │ provando, e melhor: em `PROVA` (CFP®, comissão zero, parceria Nord) e │
 * │ no quinto módulo, que é o consultor escrevendo a revisão trimestral.  │
 * │                                                                        │
 * │ Também não citamos número de usuários do app, pelo mesmo motivo: não  │
 * │ teríamos como conferir.                                                │
 * │                                                                        │
 * │ Quando existir depoimento de quem USA o Fin Cash, com o texto exato   │
 * │ que a pessoa escreveu, aí a seção volta — sem ressalva, porque não    │
 * │ vai precisar de uma.                                                   │
 * └────────────────────────────────────────────────────────────────────────┘
 */

/* ==================================================== 12. O COMPARATIVO */

/**
 * A matriz de comparação.
 *
 * ┌── A TABELA BRASIL × PARAGUAI ─────────────────────────────────────────┐
 * │ O Richard mostra duas tabelas factualmente verdadeiras que levam a    │
 * │ conclusões opostas, porque o que muda é QUAIS atributos entram. Se a  │
 * │ página não constrói a comparação, a pessoa compara o produto com NADA.│
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── AS TRÊS ÚLTIMAS LINHAS SÃO DERROTAS, E ELAS FICAM ──────────────────┐
 * │ Uma tabela em que a marca ganha doze de doze não é comparação, é      │
 * │ folheto, e o leitor sabe disso antes da terceira linha.               │
 * │                                                                        │
 * │ A planilha é infinitamente flexível e é de graça; o app do banco vê o │
 * │ que saiu da conta sem ninguém digitar. São vantagens reais, e admitir │
 * │ as três é o que torna as outras nove críveis.                          │
 * │                                                                        │
 * │ `vence` marca quem ganha a linha. Sem ele, a coluna da casa recebe o  │
 * │ visto por padrão.                                                      │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Nenhum concorrente é nomeado: "o app do banco" é o de qualquer banco,
 * porque a comparação é com o que a tela faz, não com quem a fez.
 */
export const COMPARATIVO: ReadonlyArray<{
  criterio: string;
  novare: string;
  planilha: string;
  banco: string;
  /** Quem ganha a linha. Ausente = a casa. */
  vence?: "planilha" | "banco" | "ambos";
}> = [
  {
    criterio: "Somar o que ainda vai sair até o fim do mês",
    novare: "É o número que o painel abre",
    planilha: "Se você montar a fórmula",
    banco: "Não. O extrato é o passado",
  },
  {
    criterio: "Funcionar com qualquer banco, sem senha",
    novare: "Não pede senha nem conecta conta nenhuma",
    planilha: "Você digita o que quiser, de onde quiser",
    banco: "Só a conta que é dele",
  },
  {
    criterio: "Todos os cartões juntos, cada um no ciclo dele",
    novare: "Fecha 20, vence 28, e soma os cartões mês a mês",
    planilha: "Fechamento e vencimento na mão",
    banco: "Só o cartão daquele banco",
  },
  {
    criterio: "Doze meses à frente, com o mês no vermelho apontado",
    novare: "Tela de projeção, com o menor saldo do período",
    planilha: "Se você montar a projeção inteira",
    banco: "Não projeta o que ainda não caiu",
  },
  {
    criterio: "Um parcelamento que já nasce com todas as parcelas",
    novare: "12x vira doze parcelas na linha do tempo",
    planilha: "Uma linha por parcela, digitada",
    banco: "Aparece uma por vez, quando cai",
  },
  {
    criterio: "As contas fixas voltarem sozinhas todo mês",
    novare: "Cadastrou uma vez; o mês seguinte já abre preenchido",
    planilha: "Copiando o mês anterior",
    banco: "Não",
  },
  {
    criterio: "Um limite por categoria tirado do seu histórico",
    novare: "Mínimo, média e máximo dos últimos seis meses",
    planilha: "O número é chute seu",
    banco: "Categoriza o que já passou",
  },
  {
    criterio: "Uma revisão trimestral escrita por um consultor",
    novare: "Vem na assinatura, e é a única linha que não é software",
    planilha: "Não tem",
    banco: "Não tem",
  },
  {
    criterio: "Quem tem interesse no seu dinheiro",
    novare: "Ninguém. A casa não recebe comissão de banco nem corretora",
    planilha: "Ninguém, mas ninguém te orienta também",
    banco: "Quem te atende ganha pelo que te vende",
  },
  /* ------- daqui para baixo, quem ganha não é a gente ------- */
  {
    criterio: "Ver o que já saiu da conta sem digitar",
    novare: "Lançando, ou pelo OFX: o que já entrou não entra de novo",
    planilha: "Você digita, ou cola e arruma",
    banco: "O dado nasce lá. É a casa dele",
    vence: "banco",
  },
  {
    criterio: "Do seu jeito, com as colunas que você inventar",
    novare: "As telas são as que são",
    planilha: "É a força dela, e não tem limite",
    banco: "Não",
    vence: "planilha",
  },
  {
    criterio: "Não custar nada",
    novare: "Uma assinatura, a mesma que libera a casa inteira",
    planilha: "De graça, para sempre",
    banco: "Vem junto com a conta",
    vence: "ambos",
  },
];

export const COMPARATIVO_COLUNAS = {
  novare: { titulo: FIN_CASH, legenda: "Novare" },
  planilha: { titulo: "A planilha", legenda: "que você já tentou" },
  banco: { titulo: "O app", legenda: "do seu banco" },
} as const;

export const COMPARATIVO_RODAPE =
  `"O app do banco" é o aplicativo de qualquer banco, sem citar marca: a ` +
  `comparação é com o que a tela faz, não com quem a fez. As três últimas ` +
  `linhas são as que a gente perde, e elas ficam aqui porque uma comparação ` +
  `que só ganha não é comparação.`;

/* =========================================================== 13. A OFERTA */

/** O que entra, e entra nos dois planos. */
export const INCLUI = [
  `${FIN_CASH}: quanto ainda dá para gastar até o fim do mês`,
  `${FIN_PLAN}: o seu plano com prazo, e o que fazer primeiro`,
  "Íris: IA financeira ilimitada, sem comissão",
  `As ${N_FERRAMENTAS} ferramentas da casa`,
  "Um consultor revisando o seu plano a cada 3 meses",
  `${ASSINATURA_GARANTIA_DIAS} dias de garantia e cancelamento sem multa`,
] as const;

/**
 * O MESMO CONTEÚDO, AGRUPADO POR PRODUTO.
 *
 * ┌── POR QUE AGRUPADO, E POR QUE UMA VEZ SÓ ────────────────────────────┐
 * │ Uma lista corrida de quinze bullets não se lê: vira parede. Agrupada │
 * │ por produto, com um cabeçalho por grupo, a pessoa varre os títulos e │
 * │ só desce nos que interessam a ela.                                    │
 * │                                                                        │
 * │ E ela aparece UMA vez, embaixo dos dois cartões de plano, não uma por │
 * │ cartão: os dois planos liberam exatamente a mesma coisa, e repetir a  │
 * │ lista lado a lado faz a pessoa procurar a diferença que não existe —  │
 * │ e desconfiar quando não acha.                                          │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * `icone` casa com o mapa de ícones do componente de preço.
 */
export const INCLUI_GRUPOS = [
  {
    icone: "Wallet",
    tom: "bg-[#dcecf8] text-[#17789c]",
    nome: FIN_CASH,
    resumo: "O mês que já está correndo",
    itens: [
      "Quanto ainda dá para gastar até o dia 30",
      "Contas, cartões e parcelas, cada cartão no ciclo dele",
      "Dívidas com data de saída, em avalanche ou bola de neve",
      "Doze meses à frente, com o mês no vermelho apontado",
      "Limite por categoria tirado dos seus últimos seis meses",
      "Importação de OFX, conferida linha por linha",
    ],
  },
  {
    icone: "Target",
    tom: "bg-[#dbe7fb] text-[#2b5fa8]",
    nome: FIN_PLAN,
    resumo: "Os próximos anos",
    itens: [
      "Diagnóstico com nota de 0 a 100",
      "Marco Horizonte: onde chegar, e quando",
      "Plano de ação com valor por mês e prazo",
      "Relatório em PDF que é seu",
    ],
  },
  {
    icone: "Bot",
    tom: "bg-[#d9f0e8] text-[#1f7a4d]",
    nome: "Íris",
    resumo: "A IA financeira da casa",
    itens: [
      "Lê o extrato sem conectar o seu banco",
      "Acha tarifa repetida, juro escondido e assinatura esquecida",
      "Sem teto de leituras, todo mês",
    ],
  },
  {
    icone: "Wrench",
    tom: "bg-[#f7e5d6] text-[#a53a12]",
    nome: `As ${N_FERRAMENTAS} ferramentas`,
    resumo: "O resto da casa",
    itens: [
      "Salário líquido, rescisão e férias",
      "Financiamento, CET e comparador de bancos",
      "Aposentadoria e raio-X da previdência",
      "Todas com as tabelas de 2026, sem limite de uso",
    ],
  },
  {
    icone: "Users",
    tom: "bg-[#e3ddf5] text-[#4c3d8f]",
    nome: "Um consultor da Novare",
    resumo: "A única linha que não é software",
    itens: [
      "Revisão do seu plano a cada 3 meses, escrita por gente",
      `${ROTULO_DESCONTO} particular, em qualquer formato`,
      "Consultores CFP®, sem comissão de banco ou corretora",
    ],
  },
] as const;

/**
 * A ÂNCORA.
 *
 * ┌── POR QUE ELA EXISTE ─────────────────────────────────────────────────┐
 * │ O cérebro não calcula valor absoluto, só compara. Sem régua na tela a │
 * │ pessoa compara o preço com ZERO, e zero sempre ganha.                 │
 * │                                                                        │
 * │ A saída de manual seria inventar um plano caro para o real parecer    │
 * │ barato. Aqui a régua é o que essas mesmas coisas custam POR FORA, e   │
 * │ ela vem à ESQUERDA, porque em leitura ocidental a âncora precisa ser  │
 * │ lida ANTES do número que ela deve fazer parecer pequeno.               │
 * │                                                                        │
 * │ Nenhum valor abaixo é inventado: são os modelos de cobrança que       │
 * │ existem, ditos sem número onde número seria chute.                     │
 * └────────────────────────────────────────────────────────────────────────┘
 */
export const ANCORA = {
  titulo: "O que isso custa por fora",
  linhas: [
    {
      item: "Um planejamento financeiro escrito por consultor",
      custo: "centenas de reais, por vez",
    },
    {
      item: "Alguém revisando o seu plano de três em três meses",
      custo: "hora de consultoria, quatro vezes por ano",
    },
    {
      item: "Fechar o mês na planilha, todo mês",
      custo: "um fim de semana seu",
    },
    {
      item: "A orientação do gerente do banco",
      custo: "a comissão do que ele te vende",
    },
  ],
  fecho: "Aqui é uma assinatura só, e ela cabe nos dois prazos acima.",
} as const;

/** A garantia, dita com o terceiro no meio. */
export const GARANTIA = {
  titulo: `Risco zero: ${ASSINATURA_GARANTIA_DIAS} dias de garantia incondicional`,
  texto:
    `Você tem ${ASSINATURA_GARANTIA_DIAS} dias para usar tudo. Se não for para ` +
    `você, peça o reembolso e o valor volta integral, sem perguntar o motivo. ` +
    `Quem devolve é a própria ${ASSINATURA_PROVEDOR}, automaticamente. Depois ` +
    `disso, cancelar continua sendo um clique, e a cobrança para na hora.`,
} as const;

/** A economia do anual, dita em mensalidades, que é como a pessoa sente. */
export const ECONOMIA_FRASE =
  `${ASSINATURA_ECONOMIA_ROTULO} de diferença, ou cerca de ` +
  `${ASSINATURA_ECONOMIA_MESES} mensalidades que você deixa de pagar.`;

/* ========================================================== 14. AS DÚVIDAS */

/**
 * As objeções na ordem em que aparecem na cabeça de quem chegou até aqui:
 * primeiro o medo de dar os dados do banco, depois o do trabalho, depois o
 * do dinheiro, e só no fim as perguntas sobre o produto.
 *
 * Todas já foram respondidas antes na página. Isto é a rede de segurança
 * para quem rolou direto até o preço.
 */
export const DUVIDAS = [
  {
    p: "Preciso conectar a minha conta do banco?",
    r: `Não, e o app nem oferece isso. Não existe campo para a senha do seu banco e nunca vai existir. É essa recusa que faz o ${FIN_CASH} funcionar com qualquer banco brasileiro, sem depender de Open Finance.`,
  },
  {
    p: "Preciso digitar tudo à mão?",
    r: "Não. O que se repete você cadastra uma vez e volta sozinho todo mês. E o arquivo OFX do seu banco entra pela importação, conferido linha por linha antes de gravar: o que já entrou não entra de novo.",
  },
  {
    p: "Quanto tempo isso vai me tomar por semana?",
    r: "O trabalho de verdade é no primeiro dia, quando você cadastra o que se repete. Depois, lançar um gasto leva segundos e a conferência é um número por semana. Não é relatório, é uma linha.",
  },
  {
    p: `E se eu não gostar? Como funciona a garantia de ${ASSINATURA_GARANTIA_DIAS} dias?`,
    r: `Você tem ${ASSINATURA_GARANTIA_DIAS} dias para usar tudo. Se não for para você, peça o reembolso e o valor volta integral, sem perguntar o motivo. Quem devolve é a própria ${ASSINATURA_PROVEDOR}, automaticamente.`,
  },
  {
    p: "Tenho dívida. O app ajuda ou só mostra o rombo?",
    r: "Ajuda. Ele coloca avalanche e bola de neve lado a lado, em reais, e mostra em que mês você fica livre sem pagar um real a mais por mês. O que muda é a ordem: quando uma dívida quita, a parcela dela rola para a próxima.",
  },
  {
    p: "Qual a diferença para o aplicativo do meu banco?",
    r: `O app do banco mostra o que já aconteceu e sugere produto. O ${FIN_CASH} soma o que ainda vai sair até o fim do mês, junta todos os cartões com os ciclos deles e não tem nada para te vender, porque a casa não recebe comissão de ninguém.`,
  },
  {
    p: "Qual a diferença entre o mensal e o anual?",
    r: `Nenhuma no produto: os dois liberam tudo. A diferença é o prazo e o preço. O anual sai por ${ASSINATURA_PRECO_ROTULO} por mês, cobrado uma vez, e economiza ${ASSINATURA_ECONOMIA_ROTULO} no ano.`,
  },
  {
    p: `Já assino o ${FIN_PLAN}. Preciso pagar de novo?`,
    r: `Não. É uma assinatura só para a casa inteira: o ${FIN_CASH}, o ${FIN_PLAN}, a Íris, as ferramentas e a revisão trimestral entram no mesmo valor.`,
  },
  {
    p: "Como faço para cancelar?",
    r: "Num clique, e a cobrança para na hora. Não há fidelidade nem multa, e você não precisa falar com ninguém para isso.",
  },
  {
    p: "Os meus dados ficam seguros?",
    r: "Seus dados são tratados conforme a LGPD e não são compartilhados com bancos, corretoras ou terceiros. E como nada se conecta à sua conta bancária, não existe credencial sua guardada em lugar nenhum.",
  },
] as const;

/* ======================================================== 15. O LETREIRO */

export const DIMENSOES = [
  "Quanto ainda dá para gastar",
  "Contas e faturas do mês",
  "Cartões, cada um no seu ciclo",
  "Parcelas até dezembro",
  "Dívidas com data de saída",
  "Doze meses à frente",
  "Marco Horizonte",
  "Íris lendo o extrato",
  "Salário líquido",
  "Rescisão e férias",
  "Financiamento e CET",
  "Revisão trimestral por consultor",
] as const;

/* ============================================================ 16. O FECHO */

export const FECHO = {
  chapeu: "A decisão é sua",
  titulo1: "Comece pelo mês que já está correndo.",
  titulo2: "Ele ainda dá para salvar.",
  lead:
    `Cadastre as contas, jogue o que se repete e veja quanto ainda dá para ` +
    `gastar até o dia 30. A partir de ${ASSINATURA_PRECO_ROTULO}/mês no anual, ` +
    `com ${ASSINATURA_GARANTIA_DIAS} dias de garantia incondicional.`,
} as const;

/**
 * A tela do fecho, antes do rodapé.
 *
 * É gente de verdade da casa, não banco de imagem. Uma landing que vende
 * confiança financeira fechando com foto de catálogo é a definição de sinal
 * trocado.
 *
 * ⚠️ ERAM TRÊS CENAS até 17/10/2026 — Leonardo, a dupla, e o Jefferson. O
 * Leonardo saiu da empresa, e com ele saíram duas das três imagens (a dele e
 * a dos dois juntos). Sobrou uma, e em vez de preencher o grid com imagem de
 * enfeite, o fecho passou a ser um retrato só, grande.
 *
 * O ganho não é só de honestidade: no desenho de três colunas o mobile
 * escondia as laterais (`hidden sm:block`), então o celular via UMA cena de
 * qualquer jeito. Agora vê a mesma coisa que o desktop.
 */
export const FECHO_CENAS: ReadonlyArray<{
  imagem: string;
  fundo: string;
  fita?: readonly [string, string];
}> = [
  {
    imagem: "/lp/recorte-jefferson-v2.png",
    fundo:
      "radial-gradient(60% 60% at 80% 15%, #8fd0f0 0%, transparent 60%), radial-gradient(60% 60% at 20% 95%, #2f8fb0 0%, transparent 60%), linear-gradient(160deg,#a9d6ee 0%,#5aa8d6 55%,#1f6f9c 100%)",
    fita: ["Mês", "Fechado"],
  },
];

/** O desconto da consultoria particular continua valendo para assinante. */
export const DESCONTO_CONSULTORIA = ROTULO_DESCONTO;
