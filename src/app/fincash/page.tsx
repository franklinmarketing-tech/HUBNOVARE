import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Camera,
  Check,
  ChevronDown,
  FileUp,
  Gauge,
  Gift,
  Layers,
  ListPlus,
  Lock,
  MessageCircle,
  Mic,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tags,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Foto, type NomeTela } from "./Molduras";
import Vitrine from "./Vitrine";
import Conversa from "./Conversa";
import SequenciaProduto from "./SequenciaProduto";
import QuadroOferta from "./QuadroOferta";
import FaixaNumeros from "./FaixaNumeros";
import Calculo from "./Calculo";
import Comparativo from "./Comparativo";
import { DividaAteZerar, ProjecaoDozeMeses } from "./Graficos";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import { Chapeu, TituloSecao } from "@/components/SecoesVenda";
import { Icone3D as Icone3DHalo } from "@/components/Icone3D";
import {
  ASSINATURA_ANUAL_DESCONTO_ROTULO,
  ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO,
  ASSINATURA_ANUAL_ECONOMIA_ROTULO,
  ASSINATURA_ANUAL_REFERENCIA_ROTULO,
  ASSINATURA_GARANTIA,
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_GARANTIA_FRASE,
  ASSINATURA_INCLUI,
  ASSINATURA_PLANOS,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ANUAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";
import { CONTAGEM } from "@/lib/apps";

/**
 * A landing do FINCASH.
 *
 * ══ A REESCRITA DE 12/09/2026: O CORTE DE TEXTO ═══════════════════════════
 *
 * O PEDIDO, do dono: "muito texto, tá muito grande e repetidas as
 * informações". A medida que provou o pedido, tirada do DOM da página
 * anterior: 5.991 PALAVRAS em 10 seções, com 32 parágrafos de mais de 35
 * palavras. A referência que ele trouxe (visorfinance.app) faz o mesmo
 * trabalho com ~1.250. A página não tinha seções demais — tinha texto demais
 * DENTRO de cada seção.
 *
 * ⚠️ O QUE MUDOU É DENSIDADE, NUNCA HONESTIDADE. Nenhuma promessa nova
 * entrou, e as quatro ressalvas que a casa se obriga a fazer continuam
 * palavra por palavra, porque elas são o argumento e não o rodapé:
 *   • o assistente de WhatsApp está CONSTRUÍDO E NÃO LIGADO, e nada responde
 *     hoje (seção 6);
 *   • não há Open Finance, e isso é escolha e não etapa pendente (seção 7);
 *   • os depoimentos são de clientes da CONSULTORIA, não do app, e a frase
 *     que diz isso vem ANTES da primeira aspa (seção 8);
 *   • a casa não cita número de usuários, porque não tem base para citar.
 *
 * ── A REGRA DE ESCRITA QUE PASSOU A VALER ─────────────────────────────────
 * Cada bloco de recurso é TÍTULO + UMA LINHA. Quem prova é a captura de tela
 * ao lado, não o terceiro parágrafo explicando a captura. Onde a versão
 * anterior escrevia "a tela abre com quanto falta pagar, quantas faturas
 * venceram e quanto do mês que vem já está comprometido", agora se lê "Todos
 * os cartões, cada um no ciclo dele" — e a foto mostra o resto.
 *
 * ⚠️ QUEM FOR ACRESCENTAR TEXTO AQUI: o teto é ~1.500 palavras na página
 * inteira. Ele não é estética, é a razão de a página existir em 2026 — e a
 * primeira versão a estourar esse teto volta a ser a página que o dono pediu
 * para consertar. Antes de somar um parágrafo, pergunte se uma captura de
 * tela não diria o mesmo.
 *
 * O QUE SAIU DE PEÇA, e por quê:
 *   • `<AntesDepois />` (extrato × painel): contava pela TERCEIRA vez o mesmo
 *     argumento do herói e da `<Calculo />` — o banco só sabe do passado. O
 *     componente continua no repositório, intacto, e volta com um import.
 *   • `<ParaQuem />` e `<Pacote />`: viraram, respectivamente, a faixa de seis
 *     pílulas da seção 2 e as três colunas da seção 8. Mesma informação, sem
 *     o cabeçalho e os sete parágrafos que vinham junto.
 *   • O Ciclo Novare de cinco cartões com parágrafo virou cinco passos de uma
 *     linha: a ordem é o método, e a ordem se lê numa linha.
 *
 * ⚠️ OS HELPERS DE PREÇO (`CartaoPlano`, `LinhaInclui`) VIERAM INTACTOS da
 * versão anterior, sem uma vírgula mudada. Eles falam com o checkout da
 * Hotmart por `assinaturaCheckout(plano)`, e reescrever a seção de dinheiro
 * junto com a de texto seria misturar um risco de venda num trabalho de
 * redação.
 */
const PALCO_NAVY: React.CSSProperties = {
  background: [
    "radial-gradient(42rem 24rem at 84% -14%, hsl(16 85% 55% / 0.32), transparent 62%)",
    "radial-gradient(34rem 22rem at 2% 106%, hsl(215 60% 40% / 0.30), transparent 60%)",
    "linear-gradient(155deg, hsl(215 50% 17%) 0%, hsl(215 55% 10%) 100%)",
  ].join(","),
};

/**
 * O MESMO NAVY, EM OUTRA ESCALA — para o cartão do plano em destaque.
 *
 * Não é um segundo tema nem uma segunda cor: são as mesmas paradas do
 * `PALCO_NAVY`, com o raio das luzes medido para uma peça de 26rem em vez de
 * um bloco de 62rem. Reaproveitar o palco aqui não daria "o mesmo fundo
 * menor": um brilho de 42rem sobre um cartão de 26rem cobre o cartão inteiro,
 * e o navy que separa o destacado do comum some dentro do próprio destaque.
 *
 * A luz vem do alto à direita, como no palco, para os dois lerem como a mesma
 * fonte de luz na mesma página.
 */
const CARTAO_NAVY: React.CSSProperties = {
  background: [
    "radial-gradient(17rem 11rem at 88% -12%, hsl(16 85% 55% / 0.34), transparent 64%)",
    "linear-gradient(155deg, hsl(215 50% 17%) 0%, hsl(215 55% 10%) 100%)",
  ].join(","),
};

/**
 * Onde a pessoa cria a conta e cai DENTRO do FINCASH.
 *
 * Não é a rota do `BotaoAssinarPlano`, que leva à trilha do FINPLAN:
 * quem clicou aqui quer lançar o gasto de hoje, e receber um questionário de
 * oito blocos no lugar disso é perder a pessoa na porta. O pop-up de oferta
 * também não entra: a oferta INTEIRA já está nesta página, e nesse caso ele
 * só cobraria um clique a mais (é o mesmo motivo do modo `direto` na landing
 * /assinar).
 *
 * ⚠️ Apontava para `/organizador/app`, rota que deixou de existir na
 * renomeação. O destino errado só aparece DEPOIS do login, que é o pior
 * momento possível para um 404.
 */
const ROTA_COMECAR = "/login?modo=criar&proximo=%2Ffincash%2Fapp";

/** Os selos da faixa de credibilidade: só o que é verdade sobre a Novare. */

/** Os quatro selos do pé do herói. Quatro frases, quatro palavras cada. */
const SELOS: { icone: LucideIcon; texto: string }[] = [
  { icone: Lock, texto: "Nada para conectar no banco" },
  { icone: BadgeCheck, texto: "Sem comissão de corretora" },
  { icone: Gift, texto: "Uma assinatura libera tudo" },
  { icone: ShieldCheck, texto: "Cancele quando quiser" },
];

/**
 * As seis situações do "isso é comigo?".
 *
 * Eram sete cartões com um parágrafo cada — 250 palavras para dizer o que a
 * pessoa reconhece em si mesma numa linha. Viraram pílulas: quem se reconhece
 * não precisa da explicação, e quem não se reconhece não ia ler o parágrafo.
 */
const PARA_QUEM: string[] = [
  "Ganha bem e não sabe para onde o dinheiro vai",
  "Tem parcelas caindo por vários meses",
  "Quer sair das dívidas com um plano, não com força de vontade",
  "Perde o controle do cartão entre uma fatura e outra",
  "Quer saber como os próximos meses fecham",
  "Quer um número só: quanto ainda dá para gastar",
];

/**
 * O BENTO DE RECURSOS — a peça que a referência do dono faz melhor que a
 * página anterior, e a razão de ela existir: TÍTULO + UMA LINHA, com a prova
 * na imagem. A versão anterior gastava de 40 a 90 palavras por recurso.
 *
 * `destaque` é o card grande da grade. `tela` é a captura real da conta de
 * demonstração; onde não há captura, o card vive de texto e ícone.
 */
const RECURSOS: {
  icone: LucideIcon;
  titulo: string;
  linha: string;
}[] = [
  {
    icone: Wallet,
    titulo: "Um número, não um extrato",
    linha: "Quanto sobra até o dia 30, já descontando o que ainda vai sair.",
  },
  {
    icone: CalendarClock,
    titulo: "Parcelas que já nascem inteiras",
    linha: "Uma compra em 12x entra com as doze parcelas na linha do tempo.",
  },
  {
    icone: Gauge,
    titulo: "Limite tirado do seu histórico",
    linha: "Mínimo, média e máximo dos últimos seis meses. Nada de chute.",
  },
  {
    icone: RefreshCw,
    titulo: "Contas fixas que voltam sozinhas",
    linha: "Cadastrou uma vez: o mês seguinte já abre preenchido.",
  },
  {
    icone: FileUp,
    titulo: "Importa o extrato em OFX",
    linha: "Você confere linha por linha, e o que já entrou não entra de novo.",
  },
  {
    icone: Tags,
    titulo: "Categorias do seu jeito",
    linha: "Mercado é a categoria; feira, açougue e delivery são as suas.",
  },
];

/**
 * O ESFORCO EM TRES MOMENTOS — a materia-prima da secao 6.
 *
 * ⚠️ SEM MINUTAGEM INVENTADA. A casa nunca cronometrou o cadastro inicial, e
 * "leva 10 minutos" e o tipo de precisao que o primeiro assinante desmente
 * sozinho. O que esta escrito aqui e o que a FAQ desta pagina ja afirmava:
 * segundos para lancar, um clique para marcar como paga, um numero so na
 * conferida semanal.
 */
const ESFORCO: { quando: string; titulo: string; texto: string }[] = [
  {
    quando: "No primeiro dia",
    titulo: "Você cadastra o que se repete",
    texto:
      "As contas com o saldo de hoje, o salário, o aluguel, a escola, o streaming. É o único trabalho de verdade, e ele não volta.",
  },
  {
    quando: "No dia a dia",
    titulo: "Lançar é questão de segundos",
    texto:
      "O gasto entra em poucos toques e marcar uma conta como paga é um clique. Um parcelamento em 12x já nasce com as doze parcelas.",
  },
  {
    quando: "Uma vez por semana",
    titulo: "Você olha um número só",
    texto:
      "Quanto ainda dá para gastar até o fim do mês, já contando o que falta sair. Não é relatório, é uma linha.",
  },
];

/** As quatro declarações de segurança. Vieram da versão anterior, intactas. */
const SEGURANCA: { titulo: string; texto: string }[] = [
  {
    titulo: "Sem senha bancária",
    texto: "Não existe campo para a senha do seu banco. Nunca vai existir.",
  },
  {
    titulo: "Sem conexão automática",
    texto: "Nada busca movimentação na sua conta. Quem decide o que entra é você.",
  },
  {
    titulo: "Sem Open Finance",
    texto: "Não é etapa pendente: é o que faz o app servir a qualquer banco.",
  },
  {
    titulo: "E sem digitar tudo",
    texto: "O OFX do seu banco entra pela importação, conferido antes de gravar.",
  },
];

/**
 * O que o assistente de WhatsApp faz — seis linhas onde havia nove capacidades
 * com exemplo e mais cinco recusas com justificativa (590 palavras).
 *
 * ⚠️ A RECUSA SOBREVIVEU EM UMA LINHA, e ela não é decoração: "quando não tem
 * certeza do valor, ele pergunta" é a regra que separa este assistente de um
 * que grava R$ 1.000 quando você disse "mil e duzentos".
 */
const WHATSAPP: string[] = [
  "“Uber 35” — e o gasto está lançado",
  "Áudio: fale o gasto em vez de digitar",
  "Foto do comprovante: ele lê o valor e confirma com você",
  "“quanto gastei com mercado esse mês?”",
  "“saldo”, “resumo” e “desfazer”",
  "Aviso na hora em que a categoria estoura",
];

/**
 * O Ciclo Novare, o método da casa, em cinco linhas.
 *
 * A ORDEM É O MÉTODO — quase todo mundo começa a registrar antes de
 * estruturar, e desiste no segundo mês ao ter de digitar o aluguel de novo. É
 * a única coisa que os cinco passos precisam comunicar, e uma linha basta.
 */
const CICLO: { icone: LucideIcon; titulo: string; linha: string }[] = [
  { icone: Layers, titulo: "Estruture", linha: "Cadastre uma vez o que se repete todo mês." },
  { icone: PiggyBank, titulo: "Reserve", linha: "Contas, limites e metas saem na frente." },
  { icone: ListPlus, titulo: "Registre", linha: "Lance no dia, não no fim do mês." },
  { icone: Gauge, titulo: "Confira", linha: "Uma vez por semana, um número só." },
  { icone: RefreshCw, titulo: "Ajuste", linha: "No fim do mês, corrija o que não coube." },
];

/**
 * ⚠️ DOIS DEPOIMENTOS, E ELES NÃO SÃO DO APP. São clientes da CONSULTORIA da
 * Novare, copiados do site oficial da casa. A frase que diz isso vem ANTES da
 * primeira aspa, na própria seção — sem ela, viram prova social enganosa e a
 * página perde o argumento inteiro. Eram quatro; o corte é de repetição, não
 * de ressalva.
 */
const DEPOIMENTOS: { texto: string; nome: string }[] = [
  {
    texto: "O melhor: não teve produto sendo empurrado. Foi análise honesta.",
    nome: "João P., engenheiro, MG",
  },
  {
    texto:
      "Pela primeira vez alguém sentou comigo explicando meu patrimônio inteiro, sem pressa e sem vender nada.",
    nome: "Felipe A., executivo, SP",
  },
];

/**
 * As doze perguntas, INTACTAS da versao anterior.
 *
 * Elas nao entraram no corte de texto, e a razao e de leitura: um acordeao
 * fechado nao ocupa tela. O que pesava na pagina era paragrafo aberto, nao
 * resposta guardada atras de um clique — e e aqui que moram a letra miuda e
 * as ressalvas (Open Finance, a linha do WhatsApp, a garantia, os dados).
 */
const FAQ = [
                {
                  pergunta: "Preciso conectar a minha conta do banco?",
                  resposta:
                    "Não, e não é uma etapa que ficou para depois: o app não pede a senha do seu banco nem usa Open Finance. Você lança, ele calcula. Em troca disso, funciona com qualquer banco brasileiro, inclusive com a conta que nenhum agregador consegue ler.",
                },
                {
                  pergunta: "O que já está pronto?",
                  /* ⚠️ ERA "AS DOZE TELAS", E ERAM QUINZE. A conta foi refeita
                     à mão em 12/09/2026: catorze subpastas com `page.tsx` em
                     `src/app/fincash/app/` mais o painel da raiz. A lista velha
                     esquecia três telas que existem e funcionam — Meus dados, a
                     ponte com o FINPLAN e a do assistente —, e uma landing
                     que subestima o produto custa venda tanto quanto uma que o
                     superestima.

                     ⚠️ A TELA DO WHATSAPP ESTÁ NA CONTA, E A RESSALVA CONTINUA
                     INTEIRA, porque as duas coisas são verdade ao mesmo tempo:
                     a tela existe dentro do app (é onde se vincula o número), e
                     o assistente não responde porque falta a linha oficial da
                     Meta. Contar a tela e omitir a ressalva seria prometer o
                     que não entrega; omitir a tela seria mentir ao contrário. A
                     frase diz as duas em orações separadas, de propósito. */
                  resposta:
                    "As quinze telas estão no ar: Painel, Lançamentos, Cartões e faturas, Contas fixas, Contas, Importar extrato, Orçamento, Dívidas, Metas, Investimentos, Projeção de 12 meses, Categorias, Meus dados, a ponte que leva o seu mês ao FINPLAN e a do assistente de WhatsApp, onde você vincula o seu número. As capturas desta página saíram todas do app, de uma conta de demonstração. O que ainda falta não é tela: é a linha oficial do WhatsApp, e enquanto ela não estiver plugada o assistente não responde.",
                },
                {
                  pergunta: "Preciso digitar tudo à mão?",
                  /* A pergunta existe porque a resposta anterior ("não
                     conectamos banco") deixava a impressão de que só havia o
                     teclado. O OFX é o meio-termo honesto: sem senha de banco,
                     sem Open Finance, e sem digitar o extrato inteiro. */
                  resposta:
                    "Não precisa. O extrato em OFX que o seu banco exporta entra pela tela de importação, e você confere linha por linha antes de gravar: o que já foi lançado uma vez não entra de novo. Continua sem conectar conta nenhuma e sem pedir a senha do banco, porque quem traz o arquivo é você.",
                },
                {
                  pergunta: "Tenho dívida. O app ajuda ou só mostra o rombo?",
                  resposta:
                    "Ajuda, e é o módulo em que o FINCASH vai mais longe que os concorrentes: cada dívida é amortizada parcela a parcela, em Price ou SAC, com juro e amortização separados. O app compara as duas ordens de pagamento que funcionam, a avalanche e a bola de neve, diz quanto de juro cada uma custa e quantos meses ela adianta, e simula o que acontece se você conseguir pagar um pouco a mais por mês.",
                },
                {
                  pergunta: "O assistente de WhatsApp funciona hoje?",
                  resposta:
                    "Ainda não, e isso vale para tudo o que a seção dele lista, inclusive o áudio e a foto do comprovante: nada responde enquanto a linha oficial do WhatsApp não estiver plugada. O interpretador, o vínculo do número e a tela do assistente já estão prontos dentro do app. Quando a linha entrar no ar, vale para quem já assina, sem custo adicional.",
                },
                {
                  pergunta: "Funciona no celular?",
                  resposta:
                    "Sim. É uma página web feita para a tela pequena primeiro, com o menu no rodapé, onde o polegar alcança. Dá para salvar o atalho na tela inicial e usar como qualquer outro aplicativo. Não existe app nas lojas, e quando existir estará escrito aqui.",
                },
                {
                  pergunta: "Quanto tempo isso vai me tomar por semana?",
                  resposta:
                    "O registro do dia é questão de segundos, e marcar uma conta como paga é um clique. A conferida semanal é olhar um número só. O trabalho de verdade é o do começo: cadastrar as contas e o que se repete todo mês, e é o único que você faz uma vez.",
                },
                {
                  pergunta: "Preciso entender de finanças para usar?",
                  resposta:
                    "Não. Se você sabe quanto ganha e quer saber quanto pode gastar, é o bastante. As categorias já vêm criadas na primeira visita e são todas editáveis: o app começa funcionando e você ajusta ao seu jeito depois.",
                },
                {
                  pergunta:
                    "Já assino o FINPLAN (antes Planejamento Financeiro). Preciso pagar de novo?",
                  resposta:
                    "Não. A casa tem uma mensalidade só, e ela libera tudo. Se você já assina, o FINCASH já está liberado na sua conta: é só entrar.",
                },
                {
                  /* ⚠️ ERA "COMO FUNCIONAM OS 7 DIAS GRÁTIS?". Não é a mesma
                     pergunta com outro nome: lá a pessoa usava antes de pagar,
                     aqui ela paga e recebe de volta se desistir. A resposta diz
                     quem executa o estorno, porque garantia sem responsável é
                     promessa, e promessa de dinheiro de volta que depende de
                     alguém responder um e-mail não tranquiliza ninguém. */
                  pergunta: `E se eu não gostar? Como funciona a garantia de ${ASSINATURA_GARANTIA_DIAS} dias?`,
                  resposta: `Você assina, usa o produto completo e tem ${ASSINATURA_GARANTIA_DIAS} dias para pedir o dinheiro de volta. O estorno é automático, feito pela própria Hotmart, e ninguém pergunta o motivo nem cobra taxa. No mensal são ${ASSINATURA_PRECO_ROTULO} por mês; no anual, ${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO} por mês cobrados de uma vez, o que economiza ${ASSINATURA_ANUAL_ECONOMIA_ROTULO} no ano.`,
                },
                {
                  pergunta: "Como faço para cancelar?",
                  resposta: `Pela Hotmart, onde a assinatura é cobrada, ou avisando a gente: a cobrança para, sem multa e sem fidelidade. Dentro dos ${ASSINATURA_GARANTIA_DIAS} dias de garantia, o valor ainda volta integral.`,
                },
                {
                  pergunta: "E os meus dados?",
                  /* A resposta honesta inclui o que a maioria dos concorrentes
                     omite: a equipe LÊ os lançamentos (é a regra do banco de
                     dados, `org: equipe le`), porque é com eles que a revisão
                     do consultor é escrita. Esconder isso aqui e a pessoa
                     descobrir depois vale menos que a assinatura. */
                  resposta:
                    "Ficam na sua conta do Workspace, com regra de banco de dados que amarra cada linha ao seu usuário. A equipe da Novare pode abrir os seus lançamentos para escrever a revisão do seu plano: é para isso, e para mais nada. A Novare não vende dado e não recebe comissão de banco nenhum.",
                },
];
function BotaoComecar({
  variante = "principal",
}: {
  /** `clara` é para usar sobre os blocos navy. */
  variante?: "principal" | "clara";
}) {
  const estilo =
    variante === "clara"
      ? "bg-white text-primary hover:bg-white/90"
      : "bg-accent-btn text-white hover:bg-accent-strong";

  return (
    <Link
      href={ROTA_COMECAR}
      className={`cta-varredura group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${estilo}`}
    >
      Quero começar agora
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * A ÂNCORA DE PREÇO DO HERÓI — a caixa que o Jefferson pediu por escrito e que
 * a reescrita de 12/09/2026 levou junto com o texto que ela cortou.
 *
 * O QUE ELA SUBSTITUIU: uma linha de microcópia cinza embaixo do botão, com a
 * oferta curta e a garantia. Era exatamente o formato que ele apontou como o
 * que ninguém lê — preço em corpo 12, na mesma cor do resto, sem hierarquia
 * nenhuma. Âncora de preço não é informação de rodapé: é o argumento que faz o
 * visitante comparar R$ 238,80 com R$ 358,80 antes de rolar a página inteira.
 *
 * ⚠️ NENHUM NÚMERO É DIGITADO AQUI. Os quatro valores (anual, referência
 * riscada, economia e mensal) saem de `lib/assinatura`, que por sua vez deriva
 * tudo de dois inteiros em centavos. Escrever "R$ 238,80" nesta marcação é o
 * jeito conhecido de a página continuar anunciando o preço velho no dia
 * seguinte ao aumento — e é o que `testar-nada-a-venda.mjs` guarda.
 *
 * ⚠️ E SÃO TRÊS LINHAS, NÃO CINCO, e isso é medida e não estética. A primeira
 * versão desta caixa (selo, preço, referência, economia e garantia, uma por
 * linha) levou o herói a 809px num 1366×768 e estourou a dobra. Selo e
 * economia dividem a primeira linha; garantia e mensal dividem a terceira. A
 * regra para quem for mexer: o que cresce aqui tem de sair de outro lugar do
 * herói que não seja o `h1` nem o botão — os dois são o que faz a pessoa ficar.
 *
 * ⚠️ SEM PERCENTUAL. `ASSINATURA_ANUAL_DESCONTO_ROTULO` existe e é verdade,
 * mas desconto anunciado em porcentagem numa tela pública é o que o guardião
 * reprova. O que convence aqui é a subtração, e ela está escrita em reais.
 */
function CaixaOferta() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/15">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* ⚠️ O VERSALETE DESTA PÍLULA É CURTO (`0.06em`) E NÃO É DESCUIDO.
            Com os `0.14em` dos outros selos da página, "PLANO MAIS RECOMENDADO"
            passa de 230px e a economia ao lado cai para a linha de baixo — a
            caixa vira quatro linhas e o herói cresce 20px, que é dinheiro que
            não existe aqui. O texto do Jefferson fica inteiro; o que aperta é
            o espaçamento entre letras, e o "Economize" ao lado perdeu o
            versalete pelo mesmo motivo: a caixa inteira tem 342px úteis dentro
            desta coluna, e a primeira linha precisa caber neles. */}
        <span className="rounded-full bg-accent-btn px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.02em] text-white">
          Plano mais recomendado
        </span>
        <span className="text-2xs font-bold text-accent-claro">
          Economize {ASSINATURA_ANUAL_ECONOMIA_ROTULO}
        </span>
      </div>

      <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
        <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-white sm:text-[1.7rem]">
          {ASSINATURA_PRECO_ANUAL_ROTULO}
        </span>
        <span className="text-sm font-semibold text-white/70">por ano</span>
        <span className="text-sm text-white/55 line-through decoration-white/40">
          {ASSINATURA_ANUAL_REFERENCIA_ROTULO}
        </span>
      </p>

      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-2xs leading-relaxed text-white/70">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
        {ASSINATURA_GARANTIA} · ou {ASSINATURA_PRECO_ROTULO}/mês
      </p>
    </div>
  );
}

/**
 * A CHAMADA DO MEIO DA PÁGINA, e ela existe porque a página é alta.
 *
 * O CTA vivia em dois lugares: o herói e o fecho. Entre um e outro havia onze
 * seções, e quem se convence na quinta não tem o que clicar — rola até o fim
 * procurando, ou fecha a aba. Uma landing desta altura precisa de uma chamada
 * a cada duas ou três seções, e são três faixas: depois da dor, depois dos
 * recursos e depois da prova humana.
 *
 * ⚠️ O BOTÃO É O MESMO `BotaoComecar`, e isso não é reuso por economia: dois
 * rótulos para a mesma intenção é como uma página de venda passa a parecer
 * duas. O que muda de faixa para faixa é a FRASE, e ela é sempre o que a seção
 * imediatamente acima acabou de provar — nunca uma promessa nova. Quem for
 * escrever uma quarta: se a frase não estiver escrita em alguma seção acima
 * dela, ela não pode entrar aqui.
 *
 * ── POR QUE CLARA, E NÃO NAVY ─────────────────────────────────────────────
 * A página já tem três blocos navy (herói, assistente e fecho), e eles dizem
 * "isto aqui é o produto". Uma quarta, quinta e sexta superfície escura
 * gastariam esse significado até ele não valer nada. O que marca a faixa como
 * ação é o anel aceso do `fin-anel` e o laranja cheio do botão, não a cor do
 * fundo.
 *
 * ⚠️ E É GELO, NÃO CREME, por uma razão medida na tela e não escolhida no
 * papel: a primeira faixa cai imediatamente antes do bloco do Ciclo Novare,
 * que é creme. Em creme, as duas peças encostavam e liam como um bloco só de
 * quatrocentos pixels no celular — a chamada desaparecia dentro da seção
 * seguinte, que é exatamente o oposto do que ela existe para fazer. O creme
 * continua reservado ao que é da CASA (o Ciclo e as duas molduras de textura).
 */
/* ⚠️ A GARANTIA ENTROU AQUI, E É FIXA — não é prop, e não deve virar uma.
   Pedido do Jefferson em 11/09/2026: a reversão de risco era uma linha
   discreta perdida no cartão de preço, no fim da página. O lugar dela é
   colado em CADA convite a clicar, porque é ali que a pessoa hesita — e a
   frase só é curta o bastante para caber embaixo do botão porque ela vem
   pronta da fonte (`ASSINATURA_GARANTIA`), em vez de ser reescrita a cada
   ocorrência. Três faixas, três vezes a mesma frase, palavra por palavra:
   quem lê duas vezes reconhece, quem lê duas versões desconfia. */
function FaixaComecar({ frase }: { frase: string }) {
  return (
    <div className="pt-12 sm:pt-16">
      {/* `bg-card` E NÃO `bg-gelo`, desde que a página passou a alternar
          faixas: a fita mora dentro de uma delas agora, e gelo sobre gelo
          some. Branco com sombra funciona sobre as duas superfícies claras
          — sobre o gelo ela salta, sobre o branco a sombra é o que a
          levanta. Nenhuma faixa clara da página é escura o bastante para
          exigir a versão navy. */}
      <div className="fin-anel flex flex-col items-start gap-5 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
        <p className="max-w-xl font-display text-base font-semibold leading-snug text-primary sm:text-lg">
          {frase}
        </p>
        <div className="shrink-0">
          <BotaoComecar />
          <p className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent-strong" />
            {ASSINATURA_GARANTIA}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * A TEXTURA DA CASA — a mesma linguagem do quadro que aparece atrás dos sócios
 * na fotografia e do fundo do site oficial (diagnostico.novareapp.com.br).
 *
 * ⚠️ ELA É PONTE VISUAL, NÃO ENFEITE, e por isso aparece DUAS vezes e só nos
 * dois lugares em que a página fala da casa e não do app: a seção dos sócios e
 * o bloco de preço. Espalhada por seis seções, ela deixa de dizer "isto é da
 * Novare" e passa a dizer "isto é um papel de parede".
 *
 * ⚠️ E NUNCA SOB TEXTO CORRIDO SEM ANTEPARO. Ela é clara e tem ondas de
 * contraste médio: o texto das duas seções mora em cartão branco ou creme POR
 * CIMA dela, nunca direto na textura. Onde ela aparece sozinha é margem.
 * A opacidade baixa não é timidez — é o que impede a onda de competir com a
 * linha de base do texto.
 */
const TEXTURA_CASA: React.CSSProperties = {
  backgroundImage: "url(/fincash/textura-novare.webp)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

/**
 * Quantos itens da lista o cartão mostra abertos.
 *
 * São onze ao todo. Onze abertos dão um cartão de quase mil pixels a 390px, e
 * dois cartões assim viram cinco telas de rolagem entre o primeiro preço e o
 * segundo botão: a pessoa desiste antes de comparar, que é o oposto do que uma
 * seção de planos existe para fazer. Seis é o que cabe sem o cartão deixar de
 * ser cartão.
 *
 * E são os seis PRIMEIROS porque `ASSINATURA_INCLUI` já vem ordenado por força
 * de argumento: a revisão do consultor na frente (o item que não é software), o
 * que apenas confirma a compra no fim. Recolher pelo fim é recolher o que menos
 * convence.
 *
 * O resto não some: vai para um `<details>` nativo, que abre no Enter, entra na
 * ordem de tabulação sozinho e é anunciado como expansível por leitor de tela.
 * Escrever isso à mão com estado em React custaria JavaScript numa página que
 * hoje não manda nenhum, e ainda teria de reimplementar o que o navegador já
 * acerta.
 */
/**
 * O QUE O CLIENTE GANHA — a lista de dentro do cartão de preço.
 *
 * ⚠️ ELA LISTA OS PRODUTOS, NÃO AS CONDIÇÕES. Já esteve errada duas vezes e as
 * duas versões erradas ensinam o porquê:
 *
 *   1ª — os onze itens de `ASSINATURA_INCLUI` inteiros, iguais ao quadro logo
 *        acima. A mesma seção dizia tudo três vezes.
 *   2ª — só as três condições (garantia, cancelamento, planos iguais). Ficou
 *        limpo e vendeu NADA: quem lê o preço quer ver o que leva por ele, e
 *        garantia não é o que se leva, é o que protege.
 *
 * A versão certa é uma linha por PRODUTO, com o nome em negrito e a promessa
 * dele em seguida. Seis linhas, que é exatamente `ITENS_ABERTOS` — nada fica
 * escondido atrás de "e mais N itens" no momento do pagamento.
 *
 * ⚠️ O CONTADOR VEM DE `CONTAGEM.calculadoras`, nunca à mão.
 */
const GANHA = [
  "FINCASH: quanto ainda dá para gastar até o fim do mês",
  "FINPLAN: seu plano com prazo, e o que fazer primeiro",
  "Íris: IA financeira ilimitada, sem comissão",
  `Workspace completo: ${CONTAGEM.calculadoras} ferramentas da casa`,
  "Um consultor da Novare revisando seu plano a cada 3 meses",
  `${ASSINATURA_GARANTIA} e cancelamento sem multa`,
];

const ITENS_ABERTOS = 6;

/**
 * Quantos itens o cartão abre NO CELULAR — e por que o número é outro.
 *
 * A 390px os dois cartões custavam 1.579px empilhados, quase dois telefones de
 * rolagem entre o primeiro preço e o segundo botão. E há uma circunstância que
 * só existe no celular: o `<QuadroOferta />` acabou de listar os mesmos quatro
 * produtos, um bloco por produto, a um dedo de distância daqui — no desktop
 * ele é uma faixa que o olho lê de uma vez, no celular são cinco blocos que a
 * pessoa acabou de rolar. Repetir seis linhas logo abaixo é cobrar duas vezes
 * pela mesma leitura.
 *
 * ⚠️ O QUE NUNCA ENTRA NO RECOLHIDO: o preço, o valor riscado, a economia, a
 * garantia e o botão. Eles não passam nem perto do `<details>` — só a lista do
 * que vem junto é que encolhe, e ela continua inteira a um toque, no HTML, em
 * qualquer largura.
 */
const ITENS_ABERTOS_CELULAR = 3;

/**
 * Uma linha da lista do que entra, nos dois tons de superfície.
 *
 * O TIQUE É LARANJA, e não verde como era quando a lista morava fora do
 * cartão. Dois motivos: o verde era a única cor fora do sistema num arquivo
 * que declara "um acento só" no cabeçalho, e agora a lista aparece sobre as
 * duas superfícies, onde um verde só não serve para as duas.
 *
 * MEDIDO EM PIXEL, e não estimado sobre a cor de fundo declarada: o cartão
 * navy é degradê com uma luz laranja no alto à direita, então "o fundo" é uma
 * faixa de cores e não uma. O método foi esconder a lista, fotografar a área
 * que ela ocupava, varrer um pixel a cada quatro e guardar o PIOR caso:
 *   • texto `white/85` sobre o navy: 11,96:1 no pior pixel, 12,82:1 no melhor;
 *   • tique `accent-claro` sobre o mesmo navy: 6,80:1 no pior, contra os 3:1
 *     que a WCAG pede de gráfico que carrega significado;
 *   • no cartão branco, texto `foreground` dá 16,92:1 e tique `accent-strong`
 *     dá 6,49:1.
 *
 * O `white/70` que o resto do cartão usa daria 8,51:1 e também passaria. A
 * lista subiu para 85% mesmo assim porque ela é o texto que a pessoa varre
 * item a item com o dedo, e não o rodapé de uma caixa lido uma vez: aprovado
 * na régua não é o mesmo que confortável no polegar.
 */
function LinhaInclui({
  texto,
  destaque,
}: {
  texto: string;
  /** Cartão navy. */
  destaque: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-2.5 text-sm leading-snug ${
        destaque ? "text-white/85" : "text-foreground"
      }`}
    >
      <Check
        className={`mt-[0.15rem] h-4 w-4 shrink-0 ${
          destaque ? "text-accent-claro" : "text-accent-strong"
        }`}
        strokeWidth={2.5}
      />
      <span>{texto}</span>
    </li>
  );
}

/**
 * O CARTÃO DE UM PLANO — e os dois saem desta mesma função.
 *
 * ⚠️ NADA AQUI ESCREVE PREÇO, NOME NEM PERÍODO. Tudo vem de
 * `ASSINATURA_PLANOS`, que por sua vez deriva dos dois únicos números do
 * `lib/assinatura`. Uma landing que digita "R$ 19,90" no meio da marcação é
 * uma landing que continua anunciando o preço velho no dia seguinte ao
 * aumento, e é para isso que existe o guardião `testar-nada-a-venda.mjs`.
 *
 * O QUE DISTINGUE O DESTACADO É SUPERFÍCIE, NUNCA CONTEÚDO. Os dois planos
 * entregam o produto inteiro, então o cartão do anual não pode ganhar um
 * tique a mais nem uma linha de recurso que o outro não tenha: a diferença é
 * navy contra branco, laranja cheio contra contorno, e o selo. Inventar
 * diferença de funcionalidade aqui seria construir na página a escada de
 * planos que a casa decidiu não ter.
 *
 * ⚠️ E É POR ISSO QUE A LISTA ENTROU AQUI DENTRO, idêntica nos dois cartões.
 * Ela vivia num bloco separado abaixo, com o título "o que vem junto nos
 * dois" — informação certa no lugar errado, porque quem compara preço compara
 * dentro do cartão e ninguém rola para baixo para descobrir o que o número de
 * cima compra. Stripe, Notion e Linear põem a lista entre o preço e o botão, e
 * o concorrente também.
 *
 * A repetição não é desperdício, é o argumento virando imagem: duas colunas de
 * tiques rigorosamente iguais provam num olhar o que o parágrafo abaixo levava
 * cinco linhas para afirmar. Por isso a declaração encolheu para uma linha, e
 * a lista ganhou um título que diz a mesma coisa em quatro palavras. No dia em
 * que alguém quiser tirar um item de um dos cartões, é esta a linha a ler
 * antes.
 *
 * POR QUE O NÚMERO GRANDE DOS DOIS É UM "POR MÊS": é a única comparação que a
 * pessoa faz sozinha. Pôr R$ 238,80 no lugar do número grande do anual faria
 * o plano mais barato parecer oito vezes o outro. O total cobrado de uma vez
 * vem logo abaixo, inteiro e sem letra miúda — escondê-lo seria a pegadinha
 * que esta página passou dez seções dizendo que não pratica.
 *
 * ⚠️ É UM `<a>`, e não um botão com `onClick`: o destino já vem resolvido de
 * `assinaturaCheckout(plano)` (Hotmart quando a oferta existe, `/assinar/em-breve`
 * quando ainda não), então o `href` sai pronto do servidor. A página inteira
 * segue sem mandar um byte de JavaScript próprio para o navegador, que é o que
 * mantém esta landing leve mesmo com nove capturas dentro dela.
 */
function CartaoPlano({
  plano,
  itens,
}: {
  plano: (typeof ASSINATURA_PLANOS)[number];
  /**
   * A lista chega pronta de fora, e não importada aqui, porque um dos itens
   * carrega o contador de ferramentas exclusivas: `lib/assinatura` é fonte de
   * preço e não pode depender do catálogo de apps para não virar um nó de
   * importação entre os dois. Quem faz a troca é a página, uma vez só.
   */
  itens: string[];
}) {
  const destaque = plano.destaque;
  const abertos = itens.slice(0, ITENS_ABERTOS);
  const guardados = itens.slice(ITENS_ABERTOS);

  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl p-6 sm:p-7 ${
        /* ⚠️ O DESTACADO VEM PRIMEIRO NO CELULAR, e só no celular.
           Empilhados, os cartões ficam com quase setecentos pixels cada: quem
           rola encontra o mensal inteiro, lê R$ 29,90 e decide ali, sem nunca
           ter visto que existe metade disso logo abaixo. No desktop a ordem da
           fonte volta a valer, porque lado a lado a comparação acontece da
           esquerda para a direita e o caro antes do barato é o que faz o
           desconto aparecer.

           A ordem do DOM não muda (mensal, anual): são dois elementos, e a
           tabulação continua percorrendo a seção na ordem em que ela foi
           escrita. */
        destaque ? "order-first lg:order-none " : ""
      }${
        /* ⚠️ `border-transparent` NO DESTACADO, pelo mesmo motivo do botão:
           o cartão claro tem contorno de 1px e o navy só tem `ring`, que
           desenha por fora e não entra no cálculo da caixa. Sem esta borda os
           dois cartões têm a mesma altura mas conteúdos deslocados em 1px, e
           os dois botões do pé nascem em linhas diferentes. */
        destaque
          ? "border border-transparent text-white ring-1 ring-accent-claro/25"
          : "border border-border bg-card shadow-subtle"
      }`}
      style={destaque ? CARTAO_NAVY : undefined}
    >
      {/* O LED, e SÓ no cartão destacado.

          É o único efeito caro da página, e é caro de propósito: este é o
          único lugar onde a página toma partido sobre qual plano comprar, e a
          luz correndo diz isso antes de a primeira palavra ser lida. Um
          segundo LED em qualquer outro lugar e este aqui deixa de significar
          alguma coisa — está escrito na documentação da classe, em
          `cinema.css`.

          ⚠️ ELE SUBSTITUIU A `borda-viva`, não se soma a ela: a `borda-viva`
          do `globals.css` só acende no `:hover`, que num cartão de preço visto
          por quem rola com o dedo nunca acontece, e as duas desenhando 1px no
          mesmo lugar viram uma borda de 2px mal registrada. */}
      {destaque ? <span aria-hidden className="fin-led" /> : null}

      {/* O selo de recomendado pousa NA BORDA, meio dentro e meio fora: é o
          que faz o cartão parecer levantado em relação ao vizinho sem precisar
          de escala nem de sombra colorida. O anel que pulsa em volta é o mesmo
          `selo-pulsa` do resto da casa, e ele já desliga sozinho em
          `prefers-reduced-motion`.

          ⚠️ `w-fit` NÃO É ENFEITE. Filho absoluto de um contêiner flex herda o
          `align-self: stretch` do pai no eixo transversal, e num flex em
          coluna o eixo transversal é a horizontal: sem isto, a pílula deixa de
          ter o tamanho do texto e atravessa o cartão de ponta a ponta. */}
      {destaque && (
        <span className="selo-pulsa absolute -top-3 left-6 w-fit rounded-full bg-accent-btn px-3 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-white">
          Recomendado
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <p
          className={`font-display text-base font-semibold ${
            destaque ? "text-white" : "text-primary"
          }`}
        >
          {plano.nome}
        </p>
        {/* O selo da economia vem da fonte, com o valor já formatado. */}
        {plano.selo && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-accent-claro ring-1 ring-accent-claro/30">
            {plano.selo}
          </span>
        )}
      </div>

      {/* A HIERARQUIA DE PREÇO: o número manda, e manda por tamanho, não por
          cor. Quase três vezes o corpo do texto, `tabular-nums` para os dois
          cartões alinharem a vírgula na mesma coluna, e o "/mês" preso à base
          do número em peso menor — é sufixo, não segunda informação. */}
      <p className="mt-4 flex items-end gap-1.5">
        <span
          className={`font-display text-[2.9rem] font-extrabold leading-none tracking-tight tabular-nums sm:text-[3.25rem] ${
            destaque ? "text-white" : "text-primary"
          }`}
        >
          {plano.valorRotulo}
        </span>
        <span
          className={`pb-1.5 text-base font-semibold ${
            destaque ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          {plano.periodo}
        </span>
      </p>

      <p
        className={`mt-2.5 text-sm leading-relaxed ${
          destaque ? "text-white/70" : "text-muted-foreground"
        }`}
      >
        {plano.detalhe}
      </p>

      {/* A CAIXA DO MEIO existe nos DOIS cartões, e é o que os deixa da mesma
          altura sem esticar um deles com espaço vazio. No anual ela carrega o
          tamanho do desconto; no mensal, o motivo de ele existir. */}
      {destaque ? (
        <div className="mt-5 rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
          <p className="text-sm leading-relaxed tabular-nums text-white/70">
            De{" "}
            <span className="line-through decoration-white/40">
              {ASSINATURA_ANUAL_REFERENCIA_ROTULO}
            </span>{" "}
            por{" "}
            <span className="font-display font-bold text-white">
              {ASSINATURA_PRECO_ANUAL_ROTULO}
            </span>
            .
          </p>
          {/* ⚠️ AS DUAS LEITURAS DA MESMA ECONOMIA, e as duas saem da fonte: o
              selo acima diz em reais, esta linha diz em porcentagem e em
              mensalidades. "Cerca de" está embutido na constante, e não é
              modéstia: a conta exata dá quatro mensalidades e mais quarenta
              centavos a favor de quem assina. */}
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            {ASSINATURA_ANUAL_DESCONTO_ROTULO} de desconto, ou{" "}
            {ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO} que você deixa de pagar.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-gelo p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sem compromisso de prazo: o mês que você paga é o mês que você usa,
            e no mês seguinte a decisão volta a ser sua.
          </p>
        </div>
      )}

      {/* ═══ O QUE ENTRA, DENTRO DO CARTÃO E ENTRE O PREÇO E O BOTÃO ═══
          O lugar não é gosto: é onde a lista responde a pergunta que o número
          grande acabou de abrir ("o que isso compra?") e onde ela ainda está
          na frente quando a mão vai para o botão.

          O TÍTULO DIZ "NOS DOIS PLANOS" nos DOIS cartões. Lido no de cima,
          promete; lido no de baixo, confirma. É a frase que substituiu o
          parágrafo de cinco linhas que ficava embaixo da seção explicando que
          nada fica trancado no plano barato.

          Ele NÃO é caixa alta de propósito. Os rótulos em versalete desta
          página vivem todos acima de um título de seção, e um aqui, no meio de
          um cartão, os transformaria em decoração de lista. */}
      <div
        className={`mt-6 border-t pt-5 ${
          destaque ? "border-white/10" : "border-border"
        }`}
      >
        <p
          className={`font-display text-sm font-semibold ${
            destaque ? "text-white" : "text-primary"
          }`}
        >
          Tudo isto, nos dois planos
        </p>

        <ul className="mt-3.5 space-y-2.5">
          {abertos.slice(0, ITENS_ABERTOS_CELULAR).map((linha) => (
            <LinhaInclui key={linha} texto={linha} destaque={destaque} />
          ))}
        </ul>

        {/* ⚠️ OS TRÊS ÚLTIMOS ABERTOS VIVEM ATRÁS DE UM `<details>` QUE SÓ
            EXISTE NO CELULAR, e a mecânica é a mesma do comparativo: o
            `<details>` é o próprio `peer` (aqui ele é irmão da lista, e não
            o avô dela como no comparativo — por isso `peer-open:` e não
            `peer-has-[details[open]]:`; trocar um pelo outro faz o botão abrir
            e NADA aparecer, em silêncio). Ele precisa vir ANTES da lista que
            comanda: o seletor de irmão do CSS não olha para trás.

            `peer-open:block` e `lg:block` mandam a MESMA coisa, então não há
            disputa possível entre as duas regras — que é o motivo de aqui não
            ser preciso o `max-md` que o comparativo usa.

            No desktop o `<details>` é `lg:hidden` e a segunda lista é
            `lg:block`: os seis itens continuam abertos lá, exatamente como
            estavam. Nada foi duplicado no HTML — cada item aparece uma vez só,
            o que muda é quem o revela.

            A CONTAGEM É CALCULADA, como no "e mais N itens" logo abaixo. */}
        {abertos.length > ITENS_ABERTOS_CELULAR && (
          <details className="peer group mt-3 lg:hidden">
            <summary
              className={`flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold outline-none [&::-webkit-details-marker]:hidden ${
                destaque
                  ? "text-accent-claro focus-visible:ring-2 focus-visible:ring-accent-claro focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                  : "text-accent-strong focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              }`}
            >
              <ChevronDown
                aria-hidden
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
              e mais {abertos.length - ITENS_ABERTOS_CELULAR} no pacote
            </summary>
          </details>
        )}

        <ul className="mt-2.5 hidden space-y-2.5 peer-open:block lg:mt-2.5 lg:block">
          {abertos.slice(ITENS_ABERTOS_CELULAR).map((linha) => (
            <LinhaInclui key={linha} texto={linha} destaque={destaque} />
          ))}
        </ul>

        {guardados.length > 0 && (
          /* O `<details>` NATIVO, e não um acordeão de biblioteca: ele já
             chega focável, já responde a Enter e a barra de espaço, e o leitor
             de tela já anuncia recolhido/expandido sem uma linha de ARIA. O
             que a marcação precisa fazer é só tirar o triângulo padrão do
             navegador (que é diferente em cada um) e pôr uma seta que gira.

             A CONTAGEM É CALCULADA. Cravar "e mais 5" aqui é o mesmo erro que
             cravar o preço: no dia em que `ASSINATURA_INCLUI` ganhar um item,
             o cartão passaria a mentir um número pequeno, que é o tipo de
             mentira que ninguém revisa. */
          <details className="group mt-3">
            <summary
              className={`flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold outline-none [&::-webkit-details-marker]:hidden ${
                destaque
                  ? "text-accent-claro focus-visible:ring-2 focus-visible:ring-accent-claro focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                  : "text-accent-strong focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              }`}
            >
              <ChevronDown
                aria-hidden
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
              e mais {guardados.length} itens
            </summary>

            <ul className="mt-3 space-y-2.5">
              {guardados.map((linha) => (
                <LinhaInclui key={linha} texto={linha} destaque={destaque} />
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* `mt-auto` no INVÓLUCRO, e o respiro no `pt-6` dele: o automático
          empurra o botão para o pé dos dois cartões (para o olho comparar
          preço com preço e ação com ação), e a margem de cima continua
          existindo no cartão que não sobrou espaço nenhum — que é o que
          acontece no celular, onde cada cartão tem a altura do próprio
          conteúdo. */}
      <div className="mt-auto pt-6">
        <a
          href={plano.checkout}
          /* A BORDA TRANSPARENTE NO DESTACADO não é sobra de copiar e colar: o
             botão do mensal tem contorno de 1px e o do anual não tinha,
             então um media 50px de altura e o outro 48. Lado a lado, com os
             dois presos no pé do cartão pelo `mt-auto`, a diferença aparecia
             como dois pixels de desalinho no topo dos botões, que é
             exatamente o defeito que esta seção não pode ter. Reservar a
             mesma caixa nos dois é mais barato do que cravar altura. */
          className={`flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
            destaque
              ? "cta-varredura border-transparent bg-accent-btn text-white hover:-translate-y-0.5 hover:bg-accent-strong"
              : "border-border bg-card text-primary hover:border-primary/25 hover:bg-muted"
          }`}
        >
          Assinar o {plano.nome.toLowerCase()}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

/*
 * ONDE FORAM PARAR AS PEÇAS DE PRÉVIA.
 *
 * A `Moldura`, o `Telefone` e a `Foto` vivem em `./Molduras`, junto com o
 * catálogo das capturas e o texto alternativo de cada uma: a moldura deixou de
 * vestir uma peça só e ficou grande demais para morar no meio do argumento de
 * venda.
 *
 * A `PreviaPainel`, a `CurvaProjecao` e a `LinhaValor` foram embora, e é a
 * mudança mais cara desta versão. Elas remontavam em HTML o painel, a curva de
 * doze meses e as linhas de fatura, e faziam isso bem: nítidas em qualquer
 * tela, legíveis a 390px, sempre em dia com os tokens. O que nunca
 * conseguiram foi provar que o app existe. A remontagem mostrava cinco números
 * escolhidos aqui dentro; a captura mostra a barra lateral com as telas todas,
 * o velocímetro de renda comprometida, o resumo automático apontando as contas
 * vencidas e o gráfico de saldo mês a mês com a legenda inteira. Onde a foto
 * entrega mais argumento que o desenho, o desenho sai, mesmo tendo sido
 * defendido por escrito na versão anterior desta página.
 */

/**
 * UM DOS SEIS ÍCONES 3D, no tamanho em que eles foram desenhados para viver.
 *
 * ⚠️ A RESTRIÇÃO QUE MANDA NESTA PEÇA É DE COR, e ela foi medida na tela: o
 * CORPO dos seis é navy, então sobre os blocos navy da página eles somem e
 * sobra só o detalhe laranja — o desenho vira um rabisco. Por isso `chip`
 * existe: onde o fundo é escuro, o ícone entra dentro de um quadrado branco,
 * que é o que devolve a silhueta. Em fundo claro o chip é desperdício de
 * caixa, e o ícone entra solto.
 *
 * ⚠️ NADA DE `unoptimized`. São webp de 256×256 e uns dez quilobytes cada: o
 * otimizador do Next serve exatamente a densidade que a tela pede, e desligá-lo
 * aqui faria o celular baixar 256px para desenhar 44. (O `unoptimized` que
 * aparece duas vezes nesta página é dos SVG, e o motivo está escrito lá.)
 *
 * O `alt` é SEMPRE vazio, sem exceção: cada um deles fica a dois centímetros
 * de um título que diz a mesma coisa em palavras. Descrever "uma carteira
 * tridimensional" faria o leitor de tela anunciar o assunto duas vezes antes
 * de chegar na frase que importa.
 */
/* O tom do halo de cada emblema. É `Record<NomeIcone, ...>` e não um mapa
   parcial de propósito: o `chat` sai hoje em `chip`, e o caminho do chip nunca
   lê esta tabela — mas o dia em que alguém tirar o chip dele, o tom já está
   escolhido em vez de o emblema cair num laranja padrão por omissão. */
const TOM_DO_ICONE: Record<NomeIcone, "ciano" | "accent"> = {
  carteira: "accent",
  cartao: "ciano",
  projecao: "accent",
  divida: "ciano",
  escudo: "accent",
  chat: "ciano",
};

type NomeIcone =
  | "carteira"
  | "cartao"
  | "projecao"
  | "divida"
  | "escudo"
  | "chat";

function Icone3D({
  nome,
  tamanho = 48,
  chip = false,
  className = "",
}: {
  nome: NomeIcone;
  tamanho?: number;
  /** Obrigatório sobre navy. Ver a nota de cor acima. */
  chip?: boolean;
  /** Para a respiração (`fin-flutua`) e ajustes de posição. */
  className?: string;
}) {
  const src = `/fincash/icones/${nome}.webp`;

  /* SOBRE FUNDO CLARO quem desenha é o `Icone3D` da casa, o mesmo que a
     `/assinar` usa nas `Etapa` e nas `Persona`. Ele acrescenta uma coisa só
     ao que havia aqui — um halo desfocado ATRÁS do PNG —, e é essa coisa que
     assenta um recorte transparente na superfície. Sem ele o emblema parece
     colado por cima da página; com ele parece apoiado nela. É o acabamento
     que separava visualmente as duas landings, e não custa arte nova.

     ⚠️ E ELE NÃO RESOLVE O PROBLEMA DO NAVY, ao contrário do que o halo
     sugere: o corpo destes desenhos é navy, e um brilho por trás não devolve
     contraste ao miolo da figura. Sobre escuro continua valendo o `chip` —
     o quadrado branco abaixo —, que é o único jeito de o desenho existir ali.
     Por isso os dois caminhos, e não um só. */
  if (!chip) {
    /* O TOM DO HALO ALTERNA, e é a mesma regra do `tomPor` da casa: o laranja
       só tem força enquanto é exceção. Cinco emblemas com halo laranja seriam
       uma página laranja — aqui cada um pega o tom do argumento em que está,
       e os dois se revezam pela ordem de leitura. */
    return (
      <Icone3DHalo
        src={src}
        tamanho={tamanho}
        tom={TOM_DO_ICONE[nome]}
        className={className}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-white/25 ${className}`}
    >
      <Image
        src={src}
        alt=""
        width={256}
        height={256}
        style={{ width: tamanho, height: tamanho }}
        className="shrink-0"
      />
    </span>
  );
}


export default function FincashPage() {
  const inclui = ASSINATURA_INCLUI.map((i) =>
    i.replace("{EXCLUSIVAS}", String(CONTAGEM.exclusivasAssinante)),
  );

  return (
    <div className="aurora-clara min-h-[100dvh] bg-gradient-to-b from-muted/50 via-background to-background">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar ao Hub
          </Link>
        }
      />

      <main>
        {/* ═══ 1. HERÓI ═══════════════════════════════════════════════════
            A marca identifica, o título vende: o lockup é deliberadamente
            menor que o h1. Uma captura prova que existe UMA tela; as três da
            Vitrine provam que existe um app. */}
        <section
          className="cine-grade fin-palco relative isolate overflow-hidden text-white"
          style={PALCO_NAVY}
        >
          <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.16em] text-white/85 ring-1 ring-white/15">
                Novare
                <span aria-hidden className="text-white/30">
                  ·
                </span>
                FINCASH
              </div>

              <h1 className="mt-4 font-display text-[1.9rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.7rem] lg:text-[3.1rem]">
                Quanto você <span className="text-accent">realmente</span> pode
                gastar este mês?
              </h1>

              <p className="mt-3.5 max-w-xl text-base leading-relaxed text-white/80">
                O saldo mostra o que você tem. O FINCASH desconta o que ainda
                vai sair e mostra o que sobra de verdade — sem conectar banco
                nenhum.
              </p>

              {/* ⚠️ `shrink-0` NO BOTAO, E ELE NAO E ENFEITE. Sem ele o Link
                  vira item flexivel encolhivel ao lado do paragrafo de preco,
                  e como `.cta-varredura` tem recorte para a animacao, o rotulo
                  era CORTADO no meio: a primeira dobra exibia "uero comecar
                  agor". Encontrado na revisao visual da captura de pagina
                  inteira, e nao na leitura do JSX.

                  O preco foi para BAIXO do botao, e nao ao lado: ao lado ele
                  quebrava em tres linhas e empurrava o botao. */}
              <div className="mt-5 flex flex-col items-start gap-2.5">
                <div className="shrink-0">
                  <BotaoComecar variante="clara" />
                </div>
                <CaixaOferta />
              </div>

              <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {SELOS.map((s) => (
                  <li
                    key={s.texto}
                    className="flex items-center gap-2 text-xs text-white/75"
                  >
                    <s.icone className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {s.texto}
                  </li>
                ))}
              </ul>
            </div>

            <Vitrine />
          </div>
        </section>

        <div className="fin-faixas">
          {/* ═══ 2. A CONTA QUE FALTA ══════════════════════════════════════
              O argumento inteiro da página numa peça só: as duas barras da
              mesma régua. O texto é curto porque a Calculo é a prova — quatro
              números da conta de demonstração, conferíveis nas telas abaixo. */}
          <div className="fin-revela fin-faixa fin-faixa-clara mx-auto max-w-5xl px-4 pt-14 sm:px-6 sm:pt-16">
            <FaixaNumeros />
          </div>

          <section id="a-conta" className="fin-revela fin-faixa fin-faixa-gelo mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-5 flex justify-center">
              <Icone3D nome="carteira" tamanho={64} className="fin-flutua" />
            </div>
            <TituloSecao
              sobre="A conta que falta"
              titulo="O saldo do banco mente por omissão"
              apoio="Ele mostra o que já saiu. Não mostra o aluguel do dia 5, a parcela que vai até dezembro nem a fatura que fecha semana que vem."
            />

            <Calculo className="mt-10" />

            <div className="mt-12">
              <p className="text-center text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
                O FINCASH é para você se
              </p>
              <ul className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
                {PARA_QUEM.map((p) => (
                  <li
                    key={p}
                    className="rounded-full bg-card px-3.5 py-2 text-xs font-medium text-primary ring-1 ring-primary/10"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ═══ 3. O PRODUTO, EM TELAS ════════════════════════════════════
              A peça que a referência do dono faz melhor: cada recurso é
              título + uma linha, e quem prova é a captura. As fotos são todas
              da mesma conta de demonstração das seções 2 e 5. */}
          <section id="telas" className="fin-revela fin-faixa fin-faixa-clara mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-5 flex justify-center">
              <Icone3D nome="cartao" tamanho={64} className="fin-flutua" />
            </div>
            <TituloSecao
              sobre="Por dentro"
              titulo="Quinze telas. A que você abre amanhã é esta."
              apoio="O número do topo não é quanto você gastou — é como o mês termina se nada mudar."
            />

            <div className="mt-10 grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <Foto
                  tela="painelDesktop"
                  aparelho="janela"
                  barra="FINCASH · Painel de setembro"
                  sizes="(min-width: 1024px) 36rem, 100vw"
                  prioridade
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
                <div className="fin-carta rounded-3xl bg-gelo p-6 ring-1 ring-primary/10">
                  <p className="font-display text-3xl font-extrabold text-primary">
                    R$ 1.066
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    O que resta em setembro depois de tudo o que já saiu e do
                    que ainda vai sair.
                  </p>
                </div>
                <div className="fin-carta rounded-3xl bg-gelo p-6 ring-1 ring-primary/10">
                  <p className="font-display text-3xl font-extrabold text-primary">
                    86%
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Da renda já comprometida. Acima de 85% o app acende o
                    alerta.
                  </p>
                </div>
              </div>
            </div>

            {/* ⚠️ DUAS COLUNAS JÁ NO CELULAR, e `grid-cols-2` está declarado:
                em CSS Grid a coluna implícita nasce `auto` e não encolhe abaixo
                do conteúdo — foi assim que um card desta página já nasceu com
                537px num viewport de 390. Empilhados em uma coluna, estes seis
                cards custavam 973px (1,2 tela) para dizer seis frases de uma
                linha. Em duas colunas custam cerca de 500px e continuam com as
                seis frases inteiras: nada foi recolhido nem encurtado aqui, só
                repartido. O `p-4`/`text-xs` do celular volta a `p-5`/`text-sm`
                a partir de `sm`, onde há largura para isso. */}
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {RECURSOS.map((r) => (
                <li
                  key={r.titulo}
                  className="fin-carta rounded-2xl bg-gelo p-4 ring-1 ring-primary/10 sm:rounded-3xl sm:p-5"
                >
                  <r.icone className="h-5 w-5 text-accent-strong" />
                  <h3 className="mt-2.5 font-display text-sm font-semibold leading-snug text-primary sm:mt-3 sm:text-base">
                    {r.titulo}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {r.linha}
                  </p>
                </li>
              ))}
            </ul>

            {/* ⚠️ AS TRÊS CAPTURAS DE CELULAR ROLAM DE LADO — e a rolagem vive
                DENTRO desta caixa, nunca na página. Empilhadas, elas custavam
                2.314px: uma foto de aparelho em `w-full` num viewport de 390
                nasce com quase 770px de altura, e três delas eram 2,7 telas de
                rolagem para mostrar três capturas.

                Nada foi escondido: as três continuam no HTML, na mesma ordem,
                com o mesmo `alt`. O que mudou é o eixo. Cada cartão ocupa 62%
                da largura de propósito — o pedaço do segundo aparecendo na
                borda é o que diz "tem mais aqui do lado" sem precisar de seta,
                de ponto nem de uma linha de JavaScript.

                A partir de `sm` volta a ser a grade de três colunas de sempre:
                `flex` e `snap` só existem abaixo dela, e `overflow-visible`
                devolve o estouro para o navegador quando não há mais rolagem.

                `-mx-4 px-4` (e o par em `sm`) sangra a faixa até a borda da
                tela sem tirar o respiro do primeiro cartão: sem isso a última
                foto encosta no limite do `px-4` da seção e parece cortada. */}
            <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
              {(
                [
                  "cartoesCelular",
                  "lancamentosCelular",
                  "metasCelular",
                ] as NomeTela[]
              ).map((tela) => (
                <div
                  key={tela}
                  className="w-[62%] shrink-0 snap-center sm:w-auto sm:shrink"
                >
                  <Foto
                    tela={tela}
                    aparelho="telefone"
                    sizes="(min-width: 640px) 16rem, 62vw"
                  />
                </div>
              ))}
            </div>

            <p className="mt-2 text-2xs text-muted-foreground sm:hidden">
              Arraste para o lado para ver as três telas.
            </p>
          </section>

          <SequenciaProduto />

          <FaixaComecar frase="Quinze telas, e as capturas desta página saíram todas do app rodando." />

          {/* ═══ 4. BANCO × PLANILHA × FINCASH ═════════════════════════════
              A tabela fica INTACTA: densidade em tabela é leitura de coluna,
              não parágrafo. Cortar linha aqui seria cortar fato. */}
          <section id="comparativo" className="fin-revela fin-faixa fin-faixa-gelo mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <TituloSecao
              sobre="Comparando"
              titulo="A culpa não é da sua disciplina"
              apoio="O extrato é um retrovisor. A planilha faz a conta certa, mas cobra que você lembre de abrir."
            />
            <Comparativo className="mt-10" />
          </section>

          {/* ═══ 5. O FUTURO DO DINHEIRO ═══════════════════════════════════ */}
          <section id="futuro" className="fin-revela fin-faixa fin-faixa-clara mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <TituloSecao
              sobre="Dívidas e projeção"
              titulo="Veja o futuro do dinheiro antes que ele aconteça"
              apoio="Em que ordem pagar, quanto isso economiza e em que mês você fica livre."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="fin-carta rounded-3xl bg-gelo p-6 ring-1 ring-primary/10">
                <Icone3D nome="divida" tamanho={52} />
                <h3 className="mt-4 font-display text-xl font-semibold text-primary">
                  Saia das dívidas mais rápido
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Avalanche e bola de neve lado a lado, em reais.
                </p>
                <div className="mt-8">
                  <DividaAteZerar />
                </div>
              </div>

              <div className="fin-carta rounded-3xl bg-gelo p-6 ring-1 ring-primary/10">
                <Icone3D nome="projecao" tamanho={52} />
                <h3 className="mt-4 font-display text-xl font-semibold text-primary">
                  Doze meses à frente
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  O mês em que um imprevisto doeria mais, apontado antes.
                </p>
                <div className="mt-8">
                  <ProjecaoDozeMeses />
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Conta de demonstração. Amortização parcela a parcela, em Price ou SAC.
            </p>
          </section>

          <FaixaComecar frase="Dívida com data de fim e doze meses à frente: o app calcula os dois com o que você já cadastrou." />

          {/* ═══ 6. O ESFORÇO, RESPONDIDO ANTES DE VIRAR OBJEÇÃO ════════════
              A SEÇÃO NOVA de 13/09/2026, e ela existe porque a página vendia o
              que o produto FAZ sem nunca responder o que ele CUSTA de esforço.
              Quem já abandonou uma planilha não desiste por achar o app ruim;
              desiste porque acredita que vai ter de alimentar a coisa todo dia.
              Essa crença estava sendo respondida uma vez só, escondida na
              décima pergunta da FAQ.

              ⚠️ NENHUM NÚMERO NOVO FOI INVENTADO AQUI. "Segundos", "um clique",
              "um número só" e "o trabalho do começo, que você faz uma vez" são
              as palavras da resposta que a FAQ desta página já dava. Se alguém
              quiser pôr "10 minutos" ou "2 minutos por semana", precisa primeiro
              de alguém que tenha cronometrado. Precisão inventada é a mentira
              mais fácil de conferir.

              A FAMÍLIA DE LAYOUT é linha do tempo, e não se repete na página: o
              Ciclo Novare da seção 9 é metodologia em cinco verbos, este é
              esforço em três momentos. */}
          <section id="esforco" className="fin-revela fin-faixa fin-faixa-gelo mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <TituloSecao
              titulo="O trabalho é no primeiro dia. Depois é um número por semana."
              apoio="A planilha de janeiro morre em fevereiro porque cobra que você lembre de abrir. O FINCASH cobra uma vez."
            />

            <ol className="mt-12 grid gap-8 border-t border-primary/10 pt-8 sm:grid-cols-3 sm:gap-6">
              {ESFORCO.map((e, i) => (
                <li key={e.quando} className="relative">
                  <span
                    aria-hidden
                    className="absolute -top-[2.15rem] left-0 h-3 w-3 rounded-full bg-accent ring-4 ring-gelo"
                  />
                  <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
                    {e.quando}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-primary">
                    {e.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {e.texto}
                  </p>
                  <p className="mt-3 text-xs font-medium text-primary/70">
                    {i === 0
                      ? "Feito uma vez, vale para todos os meses."
                      : i === 1
                        ? "No caixa, no ponto de ônibus, onde acontecer."
                        : "É o aviso que chega enquanto ainda dá para mudar de ideia."}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-10 rounded-3xl bg-primary p-6 text-sm leading-relaxed text-white sm:p-7">
              <strong className="font-semibold">
                E a cada três meses você não faz nada:
              </strong>{" "}
              um consultor da Novare abre o seu plano e escreve o que mudou, o
              que está travando e qual é o próximo movimento. É a única linha
              desta assinatura que software nenhum entrega.
            </p>
          </section>

          {/* ═══ 6. WHATSAPP ═══════════════════════════════════════════════
              ⚠️ A PASTILHA "CONSTRUIDO, AINDA NAO LIGADO" E A FRASE DE QUE NADA
              RESPONDE HOJE SAO OBRIGATORIAS. Esta e a unica secao da pagina
              sobre algo que ainda nao esta no ar.

              ── POR QUE A IMAGEM E UM RECORTE, E NAO A PECA INTEIRA ───────────
              `whatsapp-peca.webp` e um infografico de divulgacao fechado: traz
              o proprio logo, o proprio titulo ("Seu financeiro, direto no
              WhatsApp") e os cinco recursos escritos dentro da arte. Posta na
              secao inteira, ela entregava DOIS titulos e DUAS listas de
              recursos na mesma tela, um dentro da imagem e outro em HTML logo
              abaixo. Era o que deixava a secao poluida.

              `whatsapp-conversa.webp` e o recorte da metade que PROVA: a mao, o
              aparelho com a conversa e os cinco baloes. Zero texto duplicado, e
              de quebra sai o azul do material de divulgacao, que nao e cor
              desta casa (navy e laranja).

              ⚠️ A PECA ORIGINAL CONTINUA EM `public/fincash/`, intacta. Ela
              serve para story, post e apresentacao, onde viaja sozinha e
              PRECISA do proprio titulo. Quem apagar o arquivo por achar que
              virou sobra tira a arte de divulgacao da casa.

              ⚠️ E A LISTA EM HTML DEIXOU DE SER REPETICAO. Com os recursos fora
              da arte, ela passou a ser a UNICA versao dos cinco recursos que o
              Google indexa e o leitor de tela le. Antes era redundante; agora
              e a fonte. */}
          <section id="whatsapp" className="fin-revela fin-faixa fin-faixa-navy mx-auto max-w-5xl px-4 py-14 text-white sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.02fr] lg:items-center lg:gap-12">
              <div>
                <Icone3D nome="chat" tamanho={40} chip />
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                  <Smartphone className="h-3.5 w-3.5" />
                  Construído, ainda não ligado
                </span>

                <h2 className="mt-5 font-display text-[1.9rem] font-medium leading-[1.08] tracking-tight sm:text-[2.4rem] lg:text-[2.75rem]">
                  O gasto de hoje cabe{" "}
                  <span className="font-semibold text-accent-claro">
                    numa mensagem
                  </span>
                  .
                </h2>

                <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
                  Ninguém abre um app de finanças na fila do caixa. O WhatsApp,
                  esse você já abriu quatro vezes hoje.
                </p>

                <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-3.5">
                  {WHATSAPP.map((w) => (
                    <li
                      key={w}
                      className="flex items-start gap-2.5 text-sm leading-snug text-white/85"
                    >
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {w}
                    </li>
                  ))}
                </ul>

                <p className="mt-7 max-w-md border-l-2 border-white/20 pl-4 text-xs leading-relaxed text-white/70">
                  A linha oficial do WhatsApp ainda não está ligada, e nada nesta
                  seção responde hoje. Você não paga nada a mais por isso: quando
                  ligar, entra para quem já assina. Quando ele não tem certeza do
                  valor, ele pergunta em vez de gravar, e isso vale para o texto,
                  o áudio e a foto.
                </p>
              </div>

              {/* ⚠️ AQUI MORAVA UMA IMAGEM, E ANTES DELA UM INFOGRAFICO
                  INTEIRO. A troca de 13/09/2026 atende ao pedido de "um video
                  usando o WhatsApp" pelo unico caminho que nao mente: video
                  real nao existe, porque a linha oficial nao esta ligada e nao
                  ha uso para filmar. `<Conversa />` faz a conversa acontecer em
                  CSS, com as frases que o interpretador reconhece de verdade e
                  os numeros da conta de demonstracao.

                  O que se ganhou alem da honestidade: zero byte de midia (um
                  webm de 20s custa megabytes no celular de quem so queria ler a
                  pagina), nitidez em qualquer tela, e texto que leitor de tela
                  le e busca indexa. Video nenhum faz isso.

                  A foto `whatsapp-conversa.webp` continua em `public/fincash/`
                  e serve para quando a conversa precisar viajar como imagem
                  (story, post, apresentacao). */}
              <figure className="lg:justify-self-end">
                <Conversa />
                <figcaption className="mt-3 text-2xs leading-relaxed text-white/60">
                  Demonstração: as frases são as que o interpretador já
                  reconhece e os valores são os da conta de exemplo. A última
                  resposta é a regra da casa, e ela vale para todo valor por
                  extenso.
                </figcaption>
              </figure>
            </div>
          </section>

          {/* ═══ 7. SEGURANÇA ══════════════════════════════════════════════ */}
          <section className="fin-revela fin-faixa fin-faixa-gelo mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <Icone3D nome="escudo" tamanho={56} />
                <div className="mt-4">
                  <Chapeu>Segurança</Chapeu>
                </div>
                <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                  Seus dados continuam sob o seu controle
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  O FINCASH não se conecta ao seu banco. Você lança, ele calcula
                  — e é essa recusa que faz o app funcionar com qualquer banco
                  brasileiro.
                </p>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {SEGURANCA.map((s) => (
                  <li
                    key={s.titulo}
                    className="fin-carta rounded-3xl bg-card p-5 ring-1 ring-primary/10"
                  >
                    <h3 className="font-display text-sm font-semibold text-primary">
                      {s.titulo}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {s.texto}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ═══ 8. NÃO É SÓ UM APP ════════════════════════════════════════
              A frase do Jefferson, sócio da casa, abre a seção e está aqui
              literal. ⚠️ E a frase que enquadra os depoimentos vem ANTES da
              primeira aspa: eles são de clientes da CONSULTORIA, não do app. */}
          <section id="a-casa" className="fin-revela fin-faixa fin-faixa-clara mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <TituloSecao
              sobre="O que a assinatura abre"
              titulo="Você não está comprando um app"
              apoio="Está tendo acesso a uma estrutura para organizar sua vida financeira, projetar decisões e contar com acompanhamento da Novare."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-primary p-6 text-white">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-white/60">
                  Não é software
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold">
                  Um consultor olha o seu plano
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  A cada três meses, escrita por gente. A primeira vem já no
                  primeiro mês.
                </p>
              </div>
              <div className="fin-carta rounded-3xl bg-gelo p-6 ring-1 ring-primary/10">
                <p className="font-display text-2xl font-extrabold text-primary">
                  Zero
                </p>
                <h3 className="mt-1 font-display text-sm font-semibold text-primary">
                  comissão de banco ou corretora
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  A única receita nessa relação é a sua assinatura.
                </p>
              </div>
              <div className="fin-carta rounded-3xl bg-gelo p-6 ring-1 ring-primary/10">
                <p className="font-display text-2xl font-extrabold text-primary">
                  Uma
                </p>
                <h3 className="mt-1 font-display text-sm font-semibold text-primary">
                  mensalidade para a casa inteira
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Este app, o FINPLAN, a Íris e as calculadoras.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-3xl bg-gelo p-6 ring-1 ring-primary/10 sm:p-8">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
                Metodologia · O Ciclo Novare
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
A ordem é o método: quem registra antes de estruturar desiste no segundo mês.
              </p>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {CICLO.map((c, i) => (
                  <li key={c.titulo}>
                    <div className="flex items-center gap-2">
                      <c.icone className="h-4 w-4 text-accent-strong" />
                      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-sm font-semibold text-primary">
                      {c.titulo}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {c.linha}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-10">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-primary">
                  Quem fala aqui é cliente da consultoria, não do app.
                </strong>{" "}
                As falas abaixo estão publicadas no site da Novare e são de
                gente que contratou a consultoria. Nenhuma dessas pessoas usou o
                FINCASH — elas provam que existe consultor de verdade do outro
                lado, e que ele não vive de comissão. Não citamos número de
                usuários do app, porque não teríamos como conferir.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {DEPOIMENTOS.map((d) => (
                  <figure
                    key={d.nome}
                    className="fin-carta rounded-3xl bg-card p-6 ring-1 ring-primary/10"
                  >
                    <blockquote className="font-display text-base leading-relaxed text-primary">
                      “{d.texto}”
                    </blockquote>
                    <figcaption className="mt-3 text-xs text-muted-foreground">
                      {d.nome}. Cliente da consultoria da Novare.
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <FaixaComecar frase="Um consultor de verdade escreve a revisão do seu plano a cada três meses. Nenhum software faz isso." />

          {/* ═══ 9. PLANOS ═════════════════════════════════════════════════
              ⚠️ OS CARTÕES VÊM DE ASSINATURA_PLANOS e falam com o checkout.
              Nada aqui é escrito à mão: preço, desconto e garantia saem de
              lib/assinatura, e por isso não envelhecem sozinhos. */}
          <section id="oferta" className="fin-revela fin-faixa fin-faixa-gelo mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <TituloSecao
              sobre="Uma assinatura para a casa inteira"
              titulo="Dois prazos. O mesmo produto inteiro."
              apoio={`Sem taxa de entrada, sem fidelidade e sem comissão embutida. ${ASSINATURA_ANUAL_DESCONTO_ROTULO} no anual — ${ASSINATURA_ANUAL_ECONOMIA_ROTULO}, ou ${ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO} que você deixa de pagar.`}
            />

            {/* ⚠️ O QUE SE LEVA VEM ANTES DO QUANTO CUSTA. A secao abria nos
                dois cartoes de preco, e a lista do que a assinatura abre morava
                DENTRO deles, com seis dos onze itens atras de um "e mais 6
                itens" fechado. Quem chega aqui decidindo precisa ver os quatro
                produtos e a gente de verdade ANTES do numero. */}
            <div className="mt-10">
              <QuadroOferta Emblema={Icone3D} />
            </div>

            <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
              {ASSINATURA_PLANOS.map((plano) => (
                <CartaoPlano
                  key={plano.chave}
                  plano={plano}
                  itens={GANHA}
                />
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-card p-6 ring-1 ring-primary/10">
              <h3 className="font-display text-lg font-semibold text-primary">
                Risco zero: {ASSINATURA_GARANTIA}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {ASSINATURA_GARANTIA_FRASE} Quem devolve é a própria Hotmart,
                automaticamente. Depois dos {ASSINATURA_GARANTIA_DIAS} dias,
                cancelar continua sendo um clique, e a cobrança para na hora.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                De {ASSINATURA_ANUAL_REFERENCIA_ROTULO} por{" "}
                {ASSINATURA_PRECO_ANUAL_ROTULO} no plano anual, ou{" "}
                {ASSINATURA_PRECO_ROTULO}/mês no mensal — o equivalente a{" "}
                {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês.
              </p>
            </div>
          </section>

          {/* ═══ 10. DÚVIDAS E FECHO ═══════════════════════════════════════ */}
          <section className="fin-revela fin-faixa fin-faixa-clara mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <OQueSignifica titulo="Perguntas frequentes" itens={FAQ} />
          </section>

          <section
            className="fin-revela fin-faixa fin-faixa-navy mx-auto max-w-5xl px-4 py-14 text-white sm:px-6 sm:py-20"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  Comece pelo mês que já está correndo.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                  Cadastre as contas, jogue o que se repete todo mês e veja
                  quanto ainda dá para gastar até o dia 30. A partir de{" "}
                  {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no anual, com{" "}
                  {ASSINATURA_GARANTIA}.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2.5 sm:w-64">
                <BotaoComecar variante="clara" />
                <Link
                  href="/assinar"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Ver tudo o que vem junto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-center text-2xs text-white/70">
                  Cancele quando quiser, sem multa.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <RodapeNovare aviso="servico" />
    </div>
  );
}
