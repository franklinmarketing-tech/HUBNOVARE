import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Camera,
  Check,
  CreditCard,
  FileUp,
  Gauge,
  Gift,
  Layers,
  ListPlus,
  Lock,
  MessageCircle,
  Mic,
  PenLine,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tags,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Foto } from "./Molduras";
import { Pessoa } from "./Pessoas";
import {
  MedidorRenda,
  OrcamentoPorCategoria,
  ProjecaoDozeMeses,
} from "./Graficos";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import {
  Chapeu,
  Comparativo,
  ContaAberta,
  Etapa,
  TituloSecao,
  type LinhaComparativo,
} from "@/components/SecoesVenda";
import {
  ASSINATURA_INCLUI,
  ASSINATURA_OFERTA,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import { CONTAGEM } from "@/lib/apps";
import { falarNoWhatsApp } from "@/lib/contato";
import estilos from "./whatsapp.module.css";

/**
 * A landing do FINCASH.
 *
 * MESMA CASCA DA /planejamento, de propósito: são dois produtos da mesma
 * assinatura, e trocar de linguagem visual entre as duas páginas faria o
 * visitante achar que saiu da Novare no meio da compra.
 *
 * ⚠️ O QUE ESTA PÁGINA É OBRIGADA A DIZER: assinar o FINCASH É assinar o
 * Workspace. A casa tem uma mensalidade só, e ela libera este app, o
 * Planejamento, a Íris e as ferramentas. Se esta página vendesse "o FINCASH"
 * como produto isolado, duas páginas vizinhas prometeriam coisas diferentes
 * pelo mesmo preço, e a primeira pessoa que comparasse as duas deixaria de
 * confiar em ambas.
 *
 * O que ela NÃO promete, e a lista é curta de propósito: Open Finance (o app
 * não conecta banco nenhum, e dizer "em breve" é prometer roadmap alheio),
 * número de usuários (a Novare não tem base para citar) e depoimento (não há
 * nenhum coletado). Onde o concorrente põe prova social, aqui vai o que é
 * verdade sobre a casa: independência e nenhuma comissão.
 *
 * ── O QUE MUDOU NESTA VERSÃO, e por quê ────────────────────────────────
 *
 * 1. O NOME. Era "Organizador Financeiro", que descrevia a categoria e não o
 *    produto. FINCASH é o nome, e ele aparece inteiro em maiúscula porque é
 *    assim que vive no catálogo (`lib/apps.ts`) e no menu do app.
 *
 * 2. O RÓTULO DE OBRA SAIU. A versão anterior marcava faturas, metas,
 *    investimentos e projeção como "em construção". As quatro foram
 *    construídas e estão no ar; manter o aviso seria a mentira invertida,
 *    tão cara quanto a outra. O único item que ainda tem ressalva é o
 *    assistente de WhatsApp, e ele ganhou seção própria em vez de virar
 *    uma pastilha cinza no rodapé de uma lista.
 *
 * 3. O RITMO. Eram oito seções com o mesmo esqueleto (título centrado, grade
 *    de cards) e cinco blocos de tela idênticos em sequência. Uma página que
 *    repete a mesma forma sete vezes ensina o olho a pular. Aqui cada seção
 *    tem uma FAMÍLIA de layout própria: conta aberta, tabela, trilha, mosaico
 *    de produto, conversa, linhas de declaração, oferta.
 *
 * 4. UM ACENTO SÓ. O ciano saiu da página (fitas, chapéus, linhas de
 *    exemplo). Navy é a estrutura, laranja é o acento, e ponto. Verde e âmbar
 *    sobrevivem apenas DENTRO das prévias de dado, onde a cor não decora:
 *    ela é o dado (entrou, estourou o limite, ficou negativo).
 *
 * 5. AS FOTOS DO PRODUTO. A página inteira era desenho: prévias remontadas em
 *    HTML dentro de uma moldura. Elas provavam a linguagem visual do app e não
 *    provavam o APP, porque uma remontagem honesta nunca traz a barra lateral
 *    com as doze telas, o menu do rodapé no celular, o velocímetro de renda
 *    comprometida nem o resumo automático apontando as contas vencidas. Agora
 *    oito capturas reais entram, cada uma colada na frase que ela prova. As
 *    prévias em HTML que sobreviveram estão explicadas em `Molduras.tsx`: a
 *    conta aberta é aritmética e não tela, Dívidas não tem captura entre as
 *    disponíveis, e a conversa do WhatsApp descreve o que ainda não foi ligado.
 *
 * 6. DÍVIDAS GANHOU SEÇÃO PRÓPRIA, com peso de argumento e não de item de
 *    lista. É o que a casa tem e o concorrente não: lá dívida é um indicador
 *    solto num painel; aqui é amortização Price e SAC, ordem de pagamento
 *    comparada entre avalanche e bola de neve, e a simulação do aporte extra.
 *
 * 7. UM SISTEMA DE RAIO SÓ: `rounded-3xl` para contêiner, `rounded-xl` para
 *    peça interna e botão, `rounded-full` para pílula. Nada de `2xl`/`lg`
 *    soltos (os que aparecem vêm de dentro de `SecoesVenda`, que é
 *    compartilhado com as outras landings e não se reescreve por aqui).
 */

/**
 * O navy da marca com as duas luzes do Hub, o mesmo palco da /planejamento.
 * Vive nas duas páginas porque é a moldura dos produtos pagos: o navy separa
 * "isto é o produto" de "isto é conteúdo" sem precisar escrever PRO em nada.
 */
const PALCO_NAVY: React.CSSProperties = {
  background: [
    "radial-gradient(42rem 24rem at 84% -14%, hsl(16 85% 55% / 0.32), transparent 62%)",
    "radial-gradient(34rem 22rem at 2% 106%, hsl(215 60% 40% / 0.30), transparent 60%)",
    "linear-gradient(155deg, hsl(215 50% 17%) 0%, hsl(215 55% 10%) 100%)",
  ].join(","),
};

/**
 * Onde a pessoa cria a conta e cai DENTRO do FINCASH.
 *
 * Não é a rota do `BotaoAssinarPlano`, que leva à trilha do Planejamento:
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
const SELOS: { icone: LucideIcon; texto: string }[] = [
  { icone: Lock, texto: "Nada para conectar no banco" },
  { icone: BadgeCheck, texto: "Sem comissão de corretora" },
  { icone: Gift, texto: "Uma assinatura libera tudo" },
  { icone: ShieldCheck, texto: "Cancele quando quiser" },
];

/**
 * As situações em que a pessoa se reconhece.
 *
 * Vêm antes do argumento contra as outras ferramentas porque ninguém aceita
 * ouvir a solução antes de admitir o problema. Deixaram de ser três cards
 * lado a lado: viraram três linhas empilhadas ao lado da conta aberta, para
 * a dor e a matemática da dor ficarem na mesma dobra.
 */
const SITUACOES: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Wallet,
    titulo: "O salário entra e evapora",
    texto:
      "Você ganha bem, não se considera gastador e mesmo assim chega no dia 25 sem saber o que aconteceu.",
  },
  {
    icone: CreditCard,
    titulo: "A fatura é sempre uma surpresa",
    texto:
      "As parcelas de três meses atrás continuam chegando, e ninguém soma tudo antes de você decidir gastar.",
  },
  {
    icone: CalendarClock,
    titulo: "A planilha durou até fevereiro",
    texto:
      "Em fevereiro teria de digitar o aluguel de novo. A planilha nunca mais foi aberta.",
  },
];

/**
 * A CONTA ABERTA, e ela é a tese da página em quatro linhas.
 *
 * ⚠️ OS NÚMEROS SÃO OS DA FOTO DO HERÓI, linha por linha: 7.184 que entraram
 * menos 4.793 que saíram dão os R$ 2.392 do extrato; menos as contas que ainda
 * vencem (1.926), mais a entrada que ainda cai (600), dão os R$ 1.066 que o
 * painel mostra na captura logo acima. Antes eles vinham de uma prévia
 * desenhada, e podiam ser qualquer coisa. Agora existe uma imagem do produto
 * na mesma dobra: um visitante atento confere, e se não bater, a foto passa a
 * desmentir o texto.
 */
const CONTA_LINHAS = [
  {
    rotulo: "O que sobrou do que já entrou e saiu",
    valor: "R$ 2.392",
    obs: "Entraram R$ 7.184, saíram R$ 4.793",
  },
  {
    rotulo: "Contas e faturas que ainda vencem",
    valor: "- R$ 1.926",
    obs: "Duas delas já venceram sem pagamento, R$ 533",
  },
  {
    rotulo: "A entrada que ainda cai até o dia 30",
    valor: "+ R$ 600",
    obs: "Prevista, e por isso não está no saldo",
  },
];

/**
 * O comparativo, critério a critério.
 *
 * Uma coluna só do outro lado ("app do banco ou planilha") porque é o que a
 * pessoa realmente usa hoje: inventar uma coluna por concorrente citaria nome
 * alheio dentro da nossa página e entregaria a régua deles.
 *
 * Toda linha aqui é verificável no produto. O assistente de WhatsApp NÃO
 * entra nesta tabela, mesmo sendo o item que mais separaria a Novare do
 * concorrente: enquanto a linha não estiver ligada, um tique aqui seria
 * promessa. Ele tem seção própria, com a ressalva escrita.
 */
const COMPARATIVO: LinhaComparativo[] = [
  { criterio: "Mostra o que já saiu da conta", sem: "Sim", com: true },
  { criterio: "Conta o que ainda vai sair no mês", sem: false, com: true },
  { criterio: "Responde “posso gastar hoje?”", sem: false, com: true },
  { criterio: "As contas fixas se repetem sozinhas", sem: false, com: true },
  {
    criterio: "Parcelamento entra com todas as parcelas",
    sem: false,
    com: true,
  },
  {
    criterio: "Avisa em que mês o saldo fica negativo",
    sem: false,
    com: "12 meses à frente",
  },
  {
    criterio: "Sugere o limite pelo seu histórico",
    sem: false,
    com: "Mín, média, máx",
  },
  {
    criterio: "Soma quanto as suas metas pedem por mês",
    sem: false,
    com: true,
  },
  { criterio: "Tem um método para seguir", sem: false, com: "Ciclo Novare" },
  { criterio: "Funciona com qualquer banco", sem: "Um por vez", com: true },
  { criterio: "Quem cuida não ganha comissão", sem: false, com: true },
];

/**
 * O CICLO NOVARE, o método da casa, em cinco passos.
 *
 * A ORDEM É O MÉTODO. Quase todo mundo começa pelo passo 3 (registrar), e é
 * por isso que abandona: sem estruturar antes, o segundo mês pede que se
 * digite tudo de novo. E sem reservar antes de gastar, o que sobra no fim do
 * mês é o resto, que nunca é o bastante.
 */
const CICLO: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Layers,
    titulo: "Estruture",
    texto:
      "Diga onde o dinheiro está e o que se repete todo mês: as contas com o saldo de hoje, o salário, o aluguel, a escola, a assinatura de streaming. Cadastrado uma vez, o mês que vem já abre preenchido.",
  },
  {
    icone: PiggyBank,
    titulo: "Reserve",
    texto:
      "Decida antes de gastar. O que já tem dono sai na frente: contas fixas, o limite de cada categoria e o aporte de cada meta. E o limite não é chute, porque o app mostra o mínimo, a média e o máximo que você já gastou ali.",
  },
  {
    icone: ListPlus,
    titulo: "Registre",
    texto:
      "Lance no dia, não no fim do mês. Marcar a conta de luz como paga é um toque, e um parcelamento em 12x já nasce com as doze parcelas na linha do tempo. Sobra que ignora a parcela de novembro é sobra falsa.",
  },
  {
    icone: Gauge,
    titulo: "Confira",
    texto:
      "Uma vez por semana, um número só: quanto ainda dá para gastar até o fim do mês, contando o que falta sair. É o aviso que chega enquanto ainda dá para mudar de ideia, e não no dia da fatura.",
  },
  {
    icone: RefreshCw,
    titulo: "Ajuste",
    texto:
      "No fim do mês, compare o que planejou com o que aconteceu. Corrija o limite que não coube, corte a assinatura que ninguém usa e comece o mês seguinte com números que já provaram funcionar na sua vida.",
  },
];

/**
 * As telas que trabalham no bastidor.
 *
 * A lista encolheu de seis para quatro, e não porque o app diminuiu: quatro
 * das antigas (lançamentos, orçamento, metas e investimentos) agora aparecem
 * FOTOGRAFADAS mais acima, e repetir por escrito o que a imagem já mostrou é
 * cobrar duas vezes a atenção da mesma pessoa. O que sobrou aqui é o trabalho
 * que ninguém fotografa com orgulho e que decide se o segundo mês acontece:
 * o que se repete sozinho, onde o dinheiro está parado, de onde ele é
 * importado e como ele é classificado.
 */
const TELAS_LISTA: { icone: LucideIcon; nome: string; texto: string }[] = [
  {
    icone: CalendarClock,
    nome: "Contas fixas",
    texto:
      "Aluguel, escola, internet e salário cadastrados uma vez. O mês seguinte já abre preenchido, e sempre como previsto: o app não afirma que a conta foi paga sem alguém ter pagado.",
  },
  {
    icone: Banknote,
    nome: "Contas",
    texto:
      "Com o saldo inicial de cada conta, o app deixa de responder “quanto gastei” e passa a responder “quanto eu tenho”. Na captura do painel são R$ 16.106 divididos em duas contas.",
  },
  {
    icone: FileUp,
    nome: "Importar extrato",
    texto:
      "O arquivo OFX que o seu banco exporta entra aqui, e você confere linha por linha antes de gravar. O que já foi lançado uma vez não entra de novo: a deduplicação compara data, valor e identificador do banco.",
  },
  {
    icone: Tags,
    nome: "Categorias e subcategorias",
    texto:
      "Mercado é uma categoria; feira, açougue e delivery são subcategorias dela. Serve para descobrir onde o limite estoura sem transformar a lista de categorias numa lista de trinta itens.",
  },
];

/**
 * O QUE O ASSISTENTE DE WHATSAPP FAZ, item a item.
 *
 * ⚠️ TUDO AQUI ESTÁ SOB A MESMA RESSALVA, e ela não é um detalhe de rodapé: a
 * linha oficial da Meta não está ligada, então NENHUMA destas linhas responde
 * hoje, nem as mais antigas nem as mais novas. A tentação de escrever a lista
 * em dois tons ("isto já vai, isto vem depois") existe e foi recusada: dois
 * tons na mesma lista ensinam a pessoa a ler a ressalva como enfeite do item
 * fraco, e ela passa a acreditar que o resto atende. Ou a pastilha vale para a
 * lista inteira, ou ela não vale para nada.
 *
 * DE ONDE VEM CADA LINHA. As sete primeiras saem do interpretador que já
 * existe (`src/lib/fincash/whatsapp.ts`, e a mesma lista está na tela do app
 * em `whatsapp/guia.tsx`); o alerta de estouro sai de
 * `respostaDeConsultaCategoria`, que compara o total da categoria com o
 * orçamento e devolve quanto passou. Áudio e foto entram agora porque
 * deixaram de ser recusa de produto e viraram obra em andamento: a estrutura
 * de mídia já está em `whatsapp-midia.ts` e o motor está sendo escrito.
 *
 * ⚠️ E O TAMANHO DA PROMESSA DE MÍDIA É O DE UM ASSISTENTE DE GASTO, não o de
 * um leitor de documento. Áudio é você dizendo o gasto em voz alta; foto é o
 * valor do comprovante. "Lê qualquer documento" e "entende qualquer imagem"
 * são a promessa que transforma uma boa entrega em reclamação, porque a
 * primeira folha que ele não lê vira a prova de que a página mentiu.
 */
const CAPACIDADES: { icone: LucideIcon; titulo: string; exemplo: string }[] = [
  {
    icone: ListPlus,
    titulo: "Lançar um gasto escrevendo",
    exemplo: "“Uber 35”, “mercado R$ 280 ontem”, “farmácia 47,90 no nubank”",
  },
  {
    icone: Banknote,
    titulo: "Lançar o que entrou",
    exemplo: "“recebi 5000 de salário”, e ele grava como receita, não como gasto",
  },
  {
    icone: Mic,
    titulo: "Falar o gasto em vez de digitar",
    exemplo: "Um áudio dizendo o gasto, e ele registra o que você falou",
  },
  {
    icone: Camera,
    titulo: "Mandar a foto do comprovante",
    exemplo: "Ele lê o valor da foto e lança, com você confirmando antes",
  },
  {
    icone: Tags,
    titulo: "Perguntar quanto foi numa categoria",
    exemplo: "“quanto gastei com alimentação esse mês?”, e também no mês passado",
  },
  {
    icone: Wallet,
    titulo: "Consultar o saldo das contas",
    exemplo: "“saldo”, e vem cada conta separada mais o total",
  },
  {
    icone: Gauge,
    titulo: "Pedir o resumo do mês",
    exemplo: "“resumo”: entrou, saiu, sobrou e o que ainda falta pagar",
  },
  {
    icone: RefreshCw,
    titulo: "Desfazer o último lançamento",
    exemplo: "“desfazer” apaga o que ele acabou de criar, e só o que foi dele",
  },
  {
    icone: TrendingDown,
    titulo: "Ser avisado quando a categoria estoura",
    exemplo: "O aviso vem junto da confirmação do gasto que cruzou o limite",
  },
];

/**
 * O QUE ELE NÃO FAZ, e esta lista é metade do argumento.
 *
 * A seção do concorrente mais direto termina prometendo; esta termina
 * mostrando a borda. O motivo é o mesmo que vale dentro do app
 * (`whatsapp/guia.tsx` reserva uma caixa inteira para isso): num app de
 * dinheiro, o limite descoberto no mês em que a conta não fecha custa a
 * assinatura, e o limite escrito na página de venda custa nada.
 *
 * ⚠️ TRÊS DELAS SÃO RECUSA DELIBERADA DO INTERPRETADOR, não buraco: número
 * por extenso, data vaga e parcelamento ele devolve como pergunta em vez de
 * chutar. Escrever isso como defeito seria mentir ao contrário.
 */
const NAO_FAZ: { frase: string; porque: string }[] = [
  {
    frase: "“mil e duzentos”",
    porque:
      "Número por extenso ele pergunta em vez de gravar. Chutar entre 1.200 e 1.000 é o erro que ninguém revisa.",
  },
  {
    frase: "“300 em 3x”",
    porque:
      "Parcelamento se faz na tela de lançamentos, onde dá para conferir as três parcelas antes de gravar.",
  },
  {
    frase: "“na terça retrasada”",
    porque:
      "De data ele entende hoje, ontem, anteontem, “dia 12” e “12/03”. Adivinhar joga o gasto no mês errado.",
  },
];

/**
 * OS BALÕES QUE FLUTUAM POR CIMA DA FOTOGRAFIA.
 *
 * ⚠️ CADA FRASE DAQUI TEM DE EXISTIR NO INTERPRETADOR. Este é o texto mais
 * copiado da página inteira: é o que a pessoa lê antes de decidir testar, e é
 * literalmente o que ela vai digitar na primeira mensagem. Uma frase inventada
 * aqui não erra uma promessa de marketing, erra a PRIMEIRA tentativa de uso, e
 * quem manda e ouve “não entendi” não tenta uma terceira vez.
 *
 * As três foram escolhidas para mostrar as três naturezas do assistente em
 * três linhas curtas: uma que GRAVA, uma que RESPONDE e uma que CORRIGE. Um
 * balão de cada tipo prova que ele é um assistente; três balões de gasto
 * provariam só que ele tem um campo de texto.
 */
const BALOES: { frase: string; efeito: string; lado: "esq" | "dir" }[] = [
  { frase: "Uber 35", efeito: "Gasto de R$ 35, hoje", lado: "esq" },
  { frase: "saldo", efeito: "Cada conta e o total", lado: "dir" },
  { frase: "desfazer", efeito: "Apaga o último lançamento", lado: "esq" },
];

/**
 * Por que confiar na casa, sem inventar número de usuário nem depoimento.
 *
 * Deixaram de ser três cards lado a lado e viraram três DECLARAÇÕES em linha,
 * separadas por régua. Card é para o que a pessoa compara; aqui não há o que
 * comparar, há o que afirmar, e afirmação em linha larga se lê como parágrafo
 * de contrato em vez de item de catálogo.
 */
const PROVAS: { destaque: string; titulo: string; texto: string }[] = [
  {
    destaque: "Zero",
    titulo: "comissão de banco ou corretora",
    texto:
      "A Novare é consultoria independente: não vende produto de banco e não recebe nada por onde o seu dinheiro é alocado. A única receita nessa relação é a sua assinatura, à vista de todos.",
  },
  {
    destaque: "Nenhuma",
    titulo: "conta bancária conectada",
    texto:
      "O app não pede a senha do seu banco nem acesso ao Open Finance. Você lança, ele calcula. Por isso funciona com qualquer banco brasileiro, inclusive com a conta que nenhum agregador lê.",
  },
  {
    destaque: "Uma",
    titulo: "mensalidade para a casa inteira",
    texto:
      "Não há versão básica nem versão turbinada. Quem assina leva este app, o Planejamento Financeiro, a Íris e todas as calculadoras, pelo mesmo valor, do primeiro dia ao último.",
  },
];

/**
 * O CTA da página.
 *
 * Vive aqui, e não no `BotaoAssinarPlano`, por causa do destino: aquele
 * componente leva à trilha do Planejamento (ver o comentário em
 * `ROTA_COMECAR`). Como é um link, a página inteira continua sendo server
 * component: nenhum JavaScript sai daqui para o navegador.
 *
 * O RÓTULO É UM SÓ EM TODA A PÁGINA, e curto o bastante para nunca quebrar em
 * duas linhas. "Começar grátis" no herói e "Criar minha conta" no preço
 * seriam a mesma intenção com palavras diferentes, e é assim que uma página
 * de venda passa a parecer duas.
 */
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
      Começar grátis
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
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
 * escolhidos aqui dentro; a captura mostra a barra lateral com as doze telas,
 * o velocímetro de renda comprometida, o resumo automático apontando as contas
 * vencidas e o gráfico de saldo mês a mês com a legenda inteira. Onde a foto
 * entrega mais argumento que o desenho, o desenho sai, mesmo tendo sido
 * defendido por escrito na versão anterior desta página.
 */

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
        {/* ============================================== 1. HERÓI ====== */}
        {/* QUATRO ELEMENTOS DE TEXTO, e não mais: título, uma linha de apoio,
            o botão e a microcópia da oferta. A versão anterior tinha pílula de
            categoria, parágrafo de três linhas, preço em display, um segundo
            selo, dois botões e uma lista de três tiques. Nada disso cabia na
            primeira tela do celular, e o CTA ficava abaixo da dobra bem na
            página em que ele é a única coisa a fazer. O que a pessoa precisa
            ver aqui é a pergunta, a resposta e o produto. */}
        <section
          className="relative isolate overflow-hidden text-white"
          style={PALCO_NAVY}
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="grid gap-9 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-14">
              <div className="surgir">
                <h1 className="font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.6rem] lg:text-[3rem]">
                  Quanto ainda dá para gastar{" "}
                  <span className="text-accent-claro">até o fim do mês</span>?
                </h1>

                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                  O FINCASH soma o que ainda vai sair e mostra a sobra real,
                  sem conectar banco nenhum.
                </p>

                <div className="mt-7">
                  <BotaoComecar variante="clara" />
                </div>

                <p className="mt-4 text-xs text-white/65">
                  {ASSINATURA_OFERTA}. Sem cartão para testar e sem
                  fidelidade.
                </p>
              </div>

              {/* O PRODUTO NA PRIMEIRA DOBRA, e agora ele é foto.
                  Celular, e não desktop, por dois motivos: é onde a pessoa vai
                  usar o app, e uma tela de 1440 encolhida para 22rem viraria
                  uma mancha cinza com um borrão laranja no canto. A legenda
                  que dizia "a interface de verdade, com números de exemplo"
                  saiu junto: era o quinto elemento de texto de um herói que só
                  pode ter quatro, e uma captura não precisa jurar que é
                  captura.

                  É A ÚNICA IMAGEM PRIORITÁRIA DA PÁGINA. As outras sete são
                  lazy, porque nenhuma delas está na primeira tela. */}
              <div className="surgir mx-auto w-full max-w-[15rem] lg:max-w-none">
                <Foto
                  tela="painelCelular"
                  aparelho="telefone"
                  prioridade
                  inclinar
                  sizes="(max-width: 1024px) 240px, 320px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================= 2. FAIXA DE CREDIBILIDADE ====== */}
        <section className="border-b border-border bg-card/70">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-4 sm:px-6">
            {SELOS.map((selo) => (
              <div key={selo.texto} className="flex items-center gap-2">
                <selo.icone className="h-4 w-4 shrink-0 text-accent-strong" />
                <span className="text-xs font-semibold leading-snug text-foreground">
                  {selo.texto}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          {/* =================== 3. A CONTA QUE O EXTRATO NÃO FAZ ======= */}
          {/* Duas metades que se explicam uma à outra: à esquerda a dor em três
              linhas, à direita a matemática da mesma dor. Separadas, a dor
              vira lamento e a conta vira planilha. */}
          <section className="pt-14 sm:pt-20">
            <div className="grid gap-9 lg:grid-cols-[1fr_minmax(0,23rem)] lg:items-start lg:gap-12">
              <div>
                <TituloSecao
                  centro={false}
                  titulo="O saldo do banco mente por omissão"
                  apoio="Ele mostra o que já saiu. Não mostra o aluguel do dia 5, a parcela do notebook que vai até dezembro nem a fatura que fecha semana que vem. A diferença entre esses dois números é o que estoura o mês."
                />

                <ul className="mt-8 divide-y divide-border border-y border-border">
                  {SITUACOES.map((s) => (
                    <li key={s.titulo} className="flex gap-4 py-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                        <s.icone className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold leading-snug text-primary">
                          {s.titulo}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {s.texto}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* COMPOSIÇÃO 1 DE 4: a foto é o FUNDO e a conta flutua por cima.
                  A cena (a mesa da cozinha com as contas espalhadas) é o mesmo
                  momento que as três linhas da esquerda descrevem, e pousar a
                  aritmética por cima dela é dizer, sem escrever, que o número
                  frio nasce daquela mesa. O degradê navy existe para o cartão
                  branco ter contraste onde encosta, e não para escurecer a
                  foto por gosto.

                  ⚠️ Sem legenda, aqui e nas outras três. Ver `Pessoas.tsx`. */}
              <div className="lg:sticky lg:top-24">
                <div className="relative overflow-hidden rounded-3xl">
                  <Pessoa
                    quem="casalPreocupado"
                    qualidade={62}
                    sizes="(max-width: 1024px) 100vw, 23rem"
                    className="aspect-[4/3]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent"
                  />
                </div>

                <div className="relative -mt-14 px-3 sm:px-4">
                  <ContaAberta
                    linhas={CONTA_LINHAS}
                    resultado={{
                      rotulo: "Sobra de verdade até o dia 30",
                      valor: "R$ 1.066",
                    }}
                  />
                </div>

                <p className="mt-3 px-3 text-xs leading-relaxed text-muted-foreground sm:px-4">
                  O extrato mostraria R$ 2.392 e você decidiria em cima desse
                  número. O FINCASH mostra R$ 1.066, que é o mesmo valor da
                  captura ali em cima, e é o que realmente está livre.
                </p>
              </div>
            </div>
          </section>

          {/* ================================ 4. O COMPARATIVO ========== */}
          <section className="pt-14 sm:pt-20">
            <TituloSecao
              titulo="A culpa não é da sua disciplina"
              apoio="O extrato é um retrovisor: conta o que já aconteceu, quando não dá mais para decidir nada. A planilha faz a conta certa, mas cobra que você lembre de abrir, de repetir o aluguel todo mês e de inventar sozinho um método."
            />

            <div className="mt-8">
              <Comparativo
                linhas={COMPARATIVO}
                rotuloSem="App do banco ou planilha"
                rotuloCom="FINCASH"
              />
            </div>
          </section>

          {/* ============================== 5. O MÉTODO: CICLO NOVARE ==== */}
          {/* Encaixotado em creme, e é o único bloco da página com fundo
              próprio no meio do branco: o método é o que a Novare tem e um app
              de banco não tem, e um respiro de cor faz esse ponto sem precisar
              de um selo escrito "exclusivo". */}
          <section id="ciclo" className="scroll-mt-20 pt-14 sm:pt-20">
            <div className="rounded-3xl border border-creme-forte bg-creme p-6 sm:p-10">
              <TituloSecao
                sobre="Metodologia"
                titulo="O Ciclo Novare"
                apoio="Cinco passos que se repetem todo mês. A ordem é o método: quase todo mundo começa a registrar antes de estruturar, e por isso desiste no segundo mês, quando percebe que teria de digitar o aluguel de novo."
              />

              <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CICLO.map((passo, i) => (
                  <Etapa
                    key={passo.titulo}
                    numero={i + 1}
                    total={CICLO.length}
                    titulo={passo.titulo}
                    texto={passo.texto}
                    icone={passo.icone}
                    tom={i % 2 === 0 ? "navy" : "laranja"}
                  />
                ))}

                {/* O ciclo fecha: sem esta peça a lista pareceria uma escada
                    que termina no quinto degrau, e o argumento é justamente
                    que o mês seguinte começa melhor que o anterior. */}
                <li className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-accent-soft bg-accent-tint p-6">
                  <RefreshCw
                    className="h-6 w-6 text-accent-strong"
                    strokeWidth={1.75}
                  />
                  <p className="mt-4 font-display text-lg font-semibold leading-snug text-primary">
                    E recomeça
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Todo mês o ciclo roda de novo, com menos esforço: o que
                    você estruturou uma vez continua valendo, e o orçamento
                    fica mais perto da sua vida a cada volta.
                  </p>
                </li>
              </ol>
            </div>
          </section>

          {/* ============================ 6. O PAINEL, FOTOGRAFADO ====== */}
          {/* FAMÍLIA: foto larga com as leituras embaixo. A captura ocupa a
              largura inteira porque é o único lugar da página em que o produto
              aparece por completo: barra lateral, mês, velocímetro e resumo na
              mesma imagem. Espremê-la numa coluna de 20rem, como a prévia
              desenhada ficava, seria mostrar o app pelo buraco da fechadura. */}
          <section className="pt-14 sm:pt-20">
            <TituloSecao
              sobre="Por dentro"
              titulo="Doze telas, e a que você abre amanhã é esta"
              apoio="O número grande do topo não é quanto você gastou, porque isso é passado e passado não muda comportamento. É como o mês termina se nada mudar, já descontando o que ainda vai sair."
            />

            <div className="mt-9">
              <Foto
                tela="painelDesktop"
                aparelho="janela"
                barra="FINCASH · Painel de setembro"
                sizes="(max-width: 1024px) 100vw, 62rem"
              />
            </div>

            {/* As leituras da mesma imagem, na ordem em que o olho bate nela.
                Sem isto a foto vira enfeite: quem não usa o app não sabe que
                86% é renda comprometida e não porcentagem do mês.

                GRÁFICO VIVO 1 DE 3, e ele ocupa o lugar do card do meio. O
                velocímetro que estava chapado na captura passa a andar de zero
                até 86 quando entra na tela, com o entalhe dos 85% marcado na
                escala. É a mesma peça do app (`app/pecas.tsx`), não uma
                imitação: quem assinar vai reencontrar este desenho no painel,
                com o número dele no lugar do número da demonstração. */}
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              <li className="rounded-3xl border border-border bg-card p-5 shadow-subtle">
                <p className="font-display text-base font-semibold tabular-nums text-primary">
                  R$ 1.066
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  O que resta em setembro depois de tudo o que já saiu e do que
                  ainda está previsto sair. É o número da decisão de hoje.
                </p>
              </li>

              <li className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-5 shadow-subtle">
                <MedidorRenda />
              </li>

              <li className="rounded-3xl border border-border bg-card p-5 shadow-subtle">
                <p className="font-display text-base font-semibold tabular-nums text-primary">
                  2 contas atrasadas
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  O resumo do mês aponta o que venceu sem pagamento, com o valor
                  somado e o atalho para resolver, em vez de esperar você
                  procurar.
                </p>
              </li>
            </ul>
          </section>

          {/* ====================== 7. DECIDIR ANTES DE GASTAR ========== */}
          {/* FAMÍLIA: texto de um lado, foto do outro, DUAS VEZES E PONTO.
              Com 21 capturas na pasta, esta é a armadilha fácil da página: dá
              para encher dez seções assim sem escrever uma frase nova, e a
              partir da terceira o olho já sabe o que vem e pula. Duas, com o
              lado invertido entre elas, e o resto da página muda de forma. */}
          <section className="space-y-4 pt-14 sm:pt-20">
            <article className="grid items-center gap-7 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-8 lg:grid-cols-[1fr_minmax(0,21rem)] lg:gap-12">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                  <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-primary sm:text-2xl">
                  A fatura deixa de ser surpresa
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  O susto não vem de esquecer uma compra, vem de as parcelas de
                  três compras diferentes caírem todas no mesmo mês. A tela abre
                  com quanto ainda falta pagar, quantas faturas já venceram e
                  quanto do mês que vem já está comprometido antes de você
                  comprar qualquer coisa. O ciclo aparece por extenso, porque a
                  fatura é a única coisa do app cujo período não é o mês do
                  calendário.
                </p>
              </div>
              {/* COMPOSIÇÃO 2 DE 4: foto e tela LADO A LADO, alinhadas pela
                  base. A cena é alguém conferindo o celular no meio da rotina,
                  que é exatamente quando a pergunta "posso comprar isto?"
                  aparece; ao lado dela, a tela que responde. Separadas por uma
                  calha e não sobrepostas, porque aqui as duas imagens têm o
                  mesmo peso de argumento: uma é a hora, a outra é a resposta.

                  A foto é a coluna estreita e alta (3:4): recorte de retrato
                  ao lado de um telefone dá duas peças verticais irmãs, e a
                  faixa larga brigaria com o formato do aparelho. */}
              <div className="grid grid-cols-2 items-end gap-3 sm:gap-5">
                <div className="overflow-hidden rounded-xl">
                  <Pessoa
                    quem="cozinhaCelular"
                    sizes="(max-width: 1024px) 45vw, 10rem"
                    className="aspect-[3/4]"
                  />
                </div>
                <Foto
                  tela="cartoesCelular"
                  aparelho="telefone"
                  sizes="(max-width: 1024px) 45vw, 10rem"
                />
              </div>
            </article>

            <article className="grid items-center gap-7 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
              {/* No desktop a foto vem primeiro; no celular ela cai para baixo
                  do texto, porque na tela pequena quem chega precisa da frase
                  antes da imagem, sempre. */}
              <div className="order-2 lg:order-1">
                <Foto
                  tela="orcamentoDesktop"
                  aparelho="janela"
                  barra="Orçamento de setembro"
                  sizes="(max-width: 1024px) 100vw, 26rem"
                />
              </div>
              <div className="order-1 lg:order-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                  <Wallet className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-primary sm:text-2xl">
                  O limite não é chute, e não é digitado duas vezes
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Antes de você escrever qualquer número, cada categoria mostra
                  o mínimo, a média e o máximo que você já gastou ali nos
                  últimos seis meses. O que é sempre igual você marca como fixo
                  e não digita de novo; o que muda todo mês você ajusta. Quem
                  passou do limite aparece no vermelho com o quanto passou, e o
                  topo diz quantas linhas estouraram antes de você caçá-las na
                  lista.
                </p>
              </div>

              {/* GRÁFICO VIVO 2 DE 3, atravessando as duas colunas por baixo da
                  captura e do texto. Ele responde a pergunta que a captura ao
                  lado não responde: para onde o dinheiro foi, em proporção. O
                  furo da rosca traz o mesmo total da imagem, e esse total sobre
                  a renda é o 86% do velocímetro da seção anterior. É aí que as
                  três peças de desenho da página deixam de ser três enfeites e
                  viram uma conta só. */}
              <figure className="order-3 rounded-3xl border border-border bg-gelo p-5 sm:p-6 lg:col-span-2">
                <figcaption className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  <b className="font-semibold text-foreground">
                    Para onde foram os R$ 6.718 de setembro.
                  </b>{" "}
                  É o mesmo total da captura desta seção, e ele sobre os R$ 7.784
                  de renda prevista dá os 86% do velocímetro da seção anterior.
                </figcaption>
                <OrcamentoPorCategoria />
              </figure>
            </article>
          </section>

          {/* ================================= 8. DÍVIDAS =============== */}
          {/* O DIFERENCIAL DECLARADO DO PRODUTO, e por isso a única seção com
              forma exclusiva. No concorrente, dívida é um indicador solto no
              painel: quanto você deve. Aqui é um módulo com amortização Price e
              SAC, ordem de pagamento comparada e simulação de aporte extra.

              ⚠️ ESTA É A SEÇÃO SEM CAPTURA, e é decisão, não esquecimento:
              entre as capturas disponíveis não há nenhuma de Dívidas. Ilustrar
              o diferencial da casa com o print de outra tela seria pior que
              descrevê-lo, e desenhar uma tela que ninguém fotografou seria
              inventar. O que entra aqui é o que o motor faz, escrito.

              COMPOSIÇÃO 3 DE 4, e ela é a única que NÃO tem tela junto, pelo
              motivo acima: é uma faixa larga de fotografia encimando o cartão,
              de borda a borda. Dívida é a conversa que duas pessoas têm com os
              papéis na mão, e é essa cena que a foto traz para uma seção que,
              sem ela, seria a maior mancha de texto corrido da página. Faixa e
              não retrato: 21:9 dá o corte de cabeçalho e deixa claro que a
              imagem é ambiente, não conteúdo.

              As duas estratégias são o argumento inteiro em duas colunas, e as
              frases são as mesmas do produto (`EXPLICACAO_ESTRATEGIA`, em
              lib/fincash/dividas.ts): a landing não pode ser mais otimista que
              a tela que a pessoa vai abrir depois de assinar. */}
          <section className="pt-14 sm:pt-20">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-subtle">
              <Pessoa
                quem="casalContas"
                qualidade={62}
                sizes="(max-width: 1024px) 100vw, 62rem"
                className="aspect-[16/9] sm:aspect-[21/9]"
              />

              <div className="p-6 sm:p-9">
              <div className="max-w-2xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                  <TrendingDown className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-primary sm:text-[2rem]">
                  Dívida aqui não é um número no painel, é um plano de saída
                </h2>
                <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                  Saber quanto você deve não muda nada. O que muda é saber em
                  que ordem pagar, quanto de juro cada ordem custa e em que mês
                  cai a última parcela. O FINCASH amortiza cada dívida parcela a
                  parcela, em Price ou SAC, e põe lado a lado as duas
                  estratégias que funcionam, com o preço de cada uma.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-primary/20 bg-gelo p-5">
                  <p className="font-display text-lg font-semibold text-primary">
                    Avalanche
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Ataca primeiro a dívida de maior juro. É a que custa menos
                    dinheiro, e pode demorar a dar a primeira vitória.
                  </p>
                  <p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-primary">
                    Sai mais barato
                  </p>
                </div>

                <div className="rounded-3xl border border-accent-soft bg-accent-tint p-5">
                  <p className="font-display text-lg font-semibold text-primary">
                    Bola de neve
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Ataca primeiro o menor saldo. Custa um pouco mais de juro,
                    mas elimina uma dívida cedo, e é isso que sustenta o hábito
                    de quem já desistiu antes.
                  </p>
                  <p className="mt-4 border-t border-accent-soft pt-3 text-xs font-semibold text-accent-strong">
                    Termina uma dívida antes
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A tela diz, em reais, quanto a avalanche economiza de juro e
                quantos meses ela adianta, e também em quanto tempo cada uma
                derruba a primeira dívida. Escolher a mais cara continua sendo
                uma escolha legítima: o app mostra o preço e deixa a decisão com
                você.
              </p>

              <dl className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
                {[
                  {
                    t: "Price ou SAC",
                    d: "Parcela fixa ou amortização fixa com a parcela caindo mês a mês. A tabela sai parcela a parcela, com juro e amortização separados.",
                  },
                  {
                    t: "Aporte extra",
                    d: "Quanto um valor a mais por mês corta de juro e antecipa a última parcela. É simulação, e não grava nada.",
                  },
                  {
                    t: "Renda comprometida",
                    d: "Quanto do que entra já vai para dívida hoje, e quanto de juro você ainda vai pagar até a última parcela se nada mudar.",
                  },
                ].map((i) => (
                  <div key={i.t}>
                    <dt className="font-display text-base font-semibold text-primary">
                      {i.t}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {i.d}
                    </dd>
                  </div>
                ))}
              </dl>
              </div>
            </div>
          </section>

          {/* ================================= 9. PROJEÇÃO ============== */}
          {/* Volta a foto larga, agora com a leitura só em texto: repetir o
              trio de cartões da seção 6 embaixo da imagem faria as duas seções
              virarem a mesma seção duas vezes. */}
          <section className="pt-14 sm:pt-20">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.6rem]">
                Ver em setembro como o ano termina
              </h2>
              <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                Todo app de finanças mostra o que já aconteceu. Esta tela mostra
                os doze meses seguintes com o que você já cadastrou: as contas
                fixas, as parcelas em aberto e os aportes das metas. Saldo
                positivo o ano inteiro não é o mesmo que folga, e por isso o
                destaque é o menor saldo do período, o mês em que um imprevisto
                doeria mais.
              </p>
            </div>

            {/* COMPOSIÇÃO 4 DE 4: a foto vira PALCO e a tela pousa em cima
                dela. É a composição mais cara da página, e por isso está na
                seção que vale mais: planejar doze meses é a promessa grande, e
                aqui a cena de alguém sentado com o notebook em casa e a tela do
                produto aparecem no mesmo enquadramento, que é o que as outras
                três não fazem.

                O navy por cima da foto é obrigatório, não estético: a captura é
                clara e cheia de números miúdos, e sem escurecer o fundo a
                textura da fotografia atravessaria a borda da moldura e comeria
                a legibilidade do gráfico que a página está pedindo para a
                pessoa ler. */}
            <div className="relative mt-8 overflow-hidden rounded-3xl">
              <Pessoa
                quem="mesaNotebook"
                qualidade={50}
                sizes="(max-width: 1024px) 100vw, 62rem"
                className="absolute inset-0 h-full"
              />
              {/* O véu é o ajuste fino desta composição: opaco esconde a
                  fotografia e não sobra palco nenhum, transparente demais e a
                  textura da cena atravessa a borda da moldura e come os
                  números da captura. 55% é onde a cena ainda se lê e a tela
                  continua sendo a coisa mais nítida do bloco. */}
              <span aria-hidden className="absolute inset-0 bg-primary/55" />
              {/* A respiração generosa é o que faz a composição existir: com
                  quatro pixels de margem a fotografia vira uma borda e a peça
                  lê como moldura escura qualquer. O ar em volta é onde a cena
                  aparece. */}
              <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
                <Foto
                  tela="projecaoDesktop"
                  aparelho="janela"
                  barra="Projeção · próximos 12 meses"
                  sizes="(max-width: 1024px) 88vw, 48rem"
                />
              </div>
            </div>

            {/* GRÁFICO VIVO 3 DE 3. A captura acima mostra a curva do saldo;
                este desenho mostra o que a curva esconde, que é a sobra de cada
                mês, coluna por coluna.

                ⚠️ AS COLUNAS SÃO BAIXAS, E ISSO NÃO É DEFEITO. Elas dividem a
                régua com um saldo de quarenta e oito mil, então três mil de
                sobra viram um filete. A tentação seria dar um segundo eixo às
                colunas para elas ficarem bonitas, e é exatamente o gráfico mais
                desonesto que existe: quem desenha passa a escolher onde a curva
                cruza a barra. A peça se recusa a fazer isso, e a legenda abaixo
                assume a proporção em vez de disfarçá-la. */}
            <figure className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-subtle sm:p-6">
              <figcaption className="mb-4 text-sm leading-relaxed text-muted-foreground">
                <b className="font-semibold text-foreground">
                  Os doze meses da mesma projeção.
                </b>{" "}
                A coluna é o que sobra em cada mês e a curva é o saldo
                acumulado, os dois na mesma régua. Cada mês empurra pouco, e é a
                repetição que leva o saldo de R$ 14.991 a R$ 48.847. Dezembro é
                o único que tira em vez de pôr, e por isso vira para baixo, em
                vermelho.
              </figcaption>
              <ProjecaoDozeMeses />
            </figure>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Quando algum mês fecha no vermelho, ele é marcado como o primeiro
              mês negativo, e esse é o aviso que chega enquanto ainda dá para
              cancelar uma assinatura ou adiar uma compra. Tocar num mês abre a
              conta dele, linha por linha, e o simulador de hipóteses não grava
              nada.
            </p>
          </section>

          {/* ======================== 10. O RESTO NA MÃO ================ */}
          {/* FAMÍLIA: trio de telefones. Três telas que se abre uma vez por
              semana, e não por dia, entram como vitrine: uma frase cada, porque
              quem chegou até aqui já entendeu o método e agora quer medir a
              extensão do produto. */}
          <section className="pt-14 sm:pt-20">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  tela: "lancamentosCelular" as const,
                  titulo: "Lançamentos",
                  texto:
                    "O gasto de hoje em segundos e um toque para marcar como pago. Previsto e realizado na mesma lista, com o que venceu sem pagamento escrito por extenso.",
                },
                {
                  tela: "metasCelular" as const,
                  titulo: "Metas",
                  texto:
                    "Quanto separar por mês para chegar na data, meta a meta, e a soma de todas contra a sua renda. Metas razoáveis demais somam meio salário e nenhuma acontece.",
                },
                {
                  tela: "investimentosCelular" as const,
                  titulo: "Investimentos",
                  texto:
                    "A carteira por classe e por instituição, com meses de reserva. Selic, CDI e IPCA vêm do Banco Central, e a tela diz de onde vieram.",
                },
              ].map((v) => (
                <div key={v.titulo}>
                  <div className="mx-auto w-full max-w-[13rem] sm:max-w-none">
                    <Foto
                      tela={v.tela}
                      aparelho="telefone"
                      sizes="(max-width: 640px) 208px, 20vw"
                    />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-primary">
                    {v.titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {v.texto}
                  </p>
                </div>
              ))}
            </div>

            {/* As telas de bastidor, em linha. Lista curta e conferível vale
                mais que quatro capturas a mais de tela sem número grande. */}
            <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-subtle">
              {TELAS_LISTA.map((t) => (
                <div
                  key={t.nome}
                  className="flex gap-4 border-b border-border/60 p-5 last:border-0 sm:gap-5 sm:p-6"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06] text-primary">
                    <t.icone className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-primary">
                      {t.nome}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================== 11. O ASSISTENTE DE WHATSAPP === */}
          {/* ⚠️ A SEÇÃO MAIS DELICADA DA PÁGINA, e agora também a mais alta.

              O assistente é o item que mais separa a Novare do concorrente
              mais direto, que cobra a mais para ter o mesmo. E é o único que
              ainda não está de pé inteiro: o interpretador, o vínculo do
              número e a tela existem, a linha oficial da Meta não.

              ── POR QUE ELA VIROU UM BLOCO NAVY ───────────────────────────
              Ela estava do mesmo tamanho visual que "Contas fixas": card
              branco, título de 2xl, uma foto ao lado. O argumento mais forte
              da página tinha o peso de um item de lista, e o olho, que já
              tinha visto seis cards brancos, passava por ela como passa pelos
              outros. O navy não é um segundo tema nem uma inversão de página:
              é a mesma moldura do herói e do CTA final, que a página já usa
              duas vezes para dizer "isto aqui é o produto". A terceira vez é
              para dizer "isto aqui é o produto onde você já vive".

              ⚠️ ISSO NÃO AUTORIZA UM SEGUNDO ACENTO. Dentro do navy o laranja
              continua sendo o único destaque, e branco continua sendo texto
              sobre navy, nunca sobre laranja.

              ── A IMAGEM QUE MANDA NESTA SEÇÃO ────────────────────────────
              O celular na mão é a única peça da página que mostra o produto
              ACONTECENDO no lugar onde a pessoa já vive, sem app aberto e sem
              tela de cadastro. Os balões em HTML por cima dela são o que
              transforma uma fotografia de celular em uma CONVERSA: eles saem
              da moldura do aparelho, e é justamente o que sai da moldura que
              o olho lê como vivo. Custam zero quilobyte, porque são texto.

              ⚠️ E É POR SER A MAIS PERSUASIVA QUE ELA É A MAIS PERIGOSA. A
              conversa é composição, não print de um número que responde hoje.
              A pastilha "Construído, ainda não ligado" e a linha de ressalva
              ficam COLADAS na imagem, dentro do mesmo bloco: separadas por uma
              coluna, a imagem viaja em print, em story e em anúncio sem a
              ressalva junto, e aí a página passa a prometer o que não entrega.

              ⚠️ E A RESSALVA VALE PARA A LISTA INTEIRA, incluindo áudio e
              foto, que entraram agora. A tentação era marcar as duas como "em
              breve" e deixar o resto parecendo pronto; a verdade é que nada
              responde hoje, porque falta credencial da Meta, e uma lista em
              dois tons ensina a ler a ressalva como enfeite do item fraco.
              Quando a linha for ligada, sai a pastilha, sai a linha de
              ressalva, e não sai mais nada. */}
          <section className="pt-14 sm:pt-20">
            <div
              className="relative isolate overflow-hidden rounded-3xl p-6 text-white sm:p-10"
              style={PALCO_NAVY}
            >
              {/* O CABEÇALHO DA SEÇÃO, e ele é o único lugar da página em que
                  dois ícones aparecem somados.

                  Os dois selos com o "+" no meio não são enfeite: eles contam
                  a peça inteira antes da primeira frase ser lida, que é o que
                  um título de duas linhas sozinho não consegue. O interpretador
                  fica de um lado, o aplicativo onde ele mora fica do outro, e a
                  soma é o produto. Quem só passa o olho já entendeu. */}
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Sparkles className="h-5 w-5 text-accent-claro" strokeWidth={1.75} />
                </span>
                <span aria-hidden className="font-display text-xl font-medium text-white/40">
                  +
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <MessageCircle className="h-5 w-5 text-accent-claro" strokeWidth={1.75} />
                </span>
              </div>

              {/* ESCALA, e é onde esta seção ganha presença sem trocar de
                  fonte. Sora em 500 e `tracking-tight` num tamanho que chega a
                  3,25rem no desktop: o título de seção mais alto da página
                  depois do herói, e pela mesma razão do herói. Peso 500, não
                  800, porque em corpo grande o negrito fecha a contraforma das
                  letras e vira anúncio; leve e grande lê como publicação. */}
              <h2 className="mt-6 max-w-2xl font-display text-[1.9rem] font-medium leading-[1.08] tracking-tight sm:text-[2.6rem] lg:text-[3.25rem]">
                O gasto de hoje cabe
                <br className="hidden sm:block" />{" "}
                <span className="font-semibold text-accent-claro">
                  numa mensagem
                </span>
                .
              </h2>

              {/* A DOR EM TEXTO CORRIDO, e não em bullet.

                  A frase descreve um momento contínuo (sair do restaurante,
                  não abrir o app, esquecer), e momento contínuo picado em três
                  tiques deixa de ser cena e vira especificação. É a única
                  caixa de texto puro da seção, e ela existe para a lista de
                  capacidades logo abaixo chegar depois do problema, e não
                  antes. */}
              <p className="mt-6 max-w-2xl rounded-2xl bg-white/[0.06] p-5 text-sm leading-relaxed text-white/75 ring-1 ring-white/10 sm:text-base">
                O gasto que some é sempre o mesmo: o do almoço de terça, o da
                farmácia na volta para casa, o do Uber que você pegou com
                pressa. Ninguém abre um aplicativo de finanças na fila do caixa.
                O WhatsApp, esse você já abriu quatro vezes hoje.
              </p>

              <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-start lg:gap-14">
                {/* ── A COMPOSIÇÃO: FOTOGRAFIA + BALÕES FLUTUANDO ─────────
                    A fotografia É a tela, e não leva moldura de aparelho por
                    cima porque o aparelho já está na foto.

                    ⚠️ COMO ISTO NÃO QUEBRA EM 390px, que é onde composição de
                    celular com balão flutuante costuma morrer: os balões são
                    UM ÚNICO bloco de marcação que troca de comportamento na
                    largura. Abaixo de `lg` eles são uma lista empilhada NO
                    FLUXO, embaixo da foto, onde cabem inteiros e continuam
                    legíveis; de `lg` para cima a mesma lista vira camada
                    absoluta por cima da imagem. Duplicar a marcação (uma
                    versão para cada largura) resolveria igual e custaria o
                    dobro de HTML, além de garantir que uma das duas cópias
                    envelhecesse sozinha na primeira edição de texto.

                    A folga lateral de `lg:px-12` no contêiner é o que permite
                    ao balão sair da moldura do aparelho sem sair do bloco
                    navy: ele flutua sobre a foto e sobre o respiro, nunca
                    sobre a borda, e por isso o `overflow-hidden` da seção
                    nunca corta um pedaço de frase. */}
                <figure className="relative lg:px-12">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                    <Smartphone className="h-3.5 w-3.5" />
                    Construído, ainda não ligado
                  </span>

                  <div className="relative mt-4">
                    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                      <Pessoa
                        quem="whatsappNaMao"
                        sizes="(max-width: 1024px) 92vw, 24rem"
                      />
                    </div>

                    {/* `aria-hidden` na camada inteira: cada frase daqui já
                        está escrita na lista de capacidades ao lado, com o
                        efeito por extenso, e o `alt` da fotografia já carrega
                        a conversa completa. Sem isto, quem navega por leitor
                        de tela ouviria a mesma conversa três vezes seguidas. */}
                    <ul
                      aria-hidden
                      className="mt-4 grid gap-2 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:block"
                    >
                      {BALOES.map((b, i) => (
                        <li
                          key={b.frase}
                          className={`${estilos.balao} ${
                            i === 1 ? estilos.balaoB : i === 2 ? estilos.balaoC : ""
                          } rounded-2xl bg-white px-3.5 py-2 shadow-[0_16px_36px_-16px_hsl(215_50%_6%_/_0.75)] lg:absolute lg:w-[12rem] ${
                            b.lado === "esq"
                              ? "lg:left-[-3rem]"
                              : "lg:right-[-3rem]"
                          } ${
                            i === 0
                              ? "lg:top-[14%]"
                              : i === 1
                                ? "lg:top-[44%]"
                                : "lg:top-[72%]"
                          }`}
                        >
                          <p className="font-mono text-xs font-semibold text-primary">
                            {b.frase}
                          </p>
                          <p className="mt-0.5 text-2xs leading-snug tabular-nums text-muted-foreground">
                            {b.efeito}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <figcaption className="mt-5 text-2xs leading-snug text-white/60">
                    Conversa de demonstração, montada com as frases que o
                    interpretador já reconhece e com os números da conta de
                    exemplo. A linha oficial do WhatsApp ainda não está ligada,
                    e nada nesta seção responde hoje.
                  </figcaption>
                </figure>

                {/* A LISTA DE CAPACIDADES, com o ícone à esquerda.

                    Duas colunas a partir de `sm` porque são nove linhas, e
                    nove linhas empilhadas numa coluna só viram um rolar longo
                    que a pessoa abandona no sexto item. O exemplo vem embaixo
                    do título em mono: é o que ela vai digitar, e texto que se
                    digita tem de parecer texto que se digita. */}
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                    O que dá para fazer por lá
                  </h3>

                  <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {CAPACIDADES.map((c) => (
                      <div key={c.titulo} className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-claro ring-1 ring-white/10">
                          <c.icone className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div>
                          <dt className="font-display text-sm font-semibold leading-snug text-white">
                            {c.titulo}
                          </dt>
                          <dd className="mt-1 text-xs leading-relaxed tabular-nums text-white/60">
                            {c.exemplo}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>

                  {/* O BLOCO DE FECHAMENTO, e ele fecha pelo avesso.

                      É o único lugar da seção com fundo de acento, e o que
                      está escrito nele é o que o assistente NÃO faz. A escolha
                      é deliberada: o espaço mais destacado de uma seção de
                      venda normalmente carrega a promessa maior, e aqui ele
                      carrega a borda. Quem lê isto antes de assinar não é
                      surpreendido depois, e num app de dinheiro a surpresa
                      custa a assinatura inteira. */}
                  <div className="mt-8 rounded-2xl bg-accent-btn/15 p-5 ring-1 ring-accent-claro/25">
                    <p className="font-display text-sm font-semibold text-accent-claro">
                      E o que ele devolve como pergunta, em vez de gravar
                    </p>
                    <dl className="mt-3 space-y-2.5">
                      {NAO_FAZ.map((n) => (
                        <div key={n.frase} className="sm:flex sm:gap-3">
                          <dt className="font-mono text-xs font-semibold text-white/80 sm:w-40 sm:shrink-0">
                            {n.frase}
                          </dt>
                          <dd className="mt-0.5 text-xs leading-relaxed text-white/60 sm:mt-0">
                            {n.porque}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3.5 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/60">
                      É a regra da casa, e vale também para a foto e para o
                      áudio: quando ele não tem certeza do valor, ele pergunta.
                      Registro errado gravado calado custa mais caro que uma
                      mensagem a mais.
                    </p>
                  </div>

                  {/* A LINHA DE ESTADO, escrita por extenso e sem "em breve".
                      "Em breve" é uma data que ninguém assina; o que está aqui
                      é o que falta, de quem depende e o que a pessoa paga por
                      isso, que é nada. */}
                  <p className="mt-6 text-xs leading-relaxed text-white/55">
                    Dentro do app já existem o interpretador, a tela do
                    assistente e o vínculo do seu número, confirmado por um
                    código de dez minutos que você manda pelo WhatsApp. Falta
                    plugar a linha oficial, e essa parte não depende de código.
                    Enquanto ela não estiver no ar, você não paga nada a mais
                    por isso, e não vai encontrar esta promessa marcada como
                    pronta em lugar nenhum desta página. Quando ligar, entra
                    para quem já assina.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================== 12. A PROVA HUMANA (SÓCIOS) ===== */}
          {/* POR QUE ESTA SEÇÃO EXISTE, e por que ela vem logo depois do
              assistente.

              A seção anterior é a mais tecnológica da página: interpretador,
              mensagem, transcrição, leitura de comprovante. É exatamente o
              ponto em que alguém pensa "isso um chatbot de graça também faz".
              A resposta não é software, e por isso ela não podia ser mais uma
              lista de recurso: do outro lado desta assinatura existe gente que
              abre o seu plano e escreve sobre ele.

              ⚠️ O QUE ESTÁ ESCRITO AQUI É SÓ O QUE O REPOSITÓRIO SUSTENTA. A
              revisão trimestral é o primeiro item de `ASSINATURA_INCLUI`, e o
              comentário ao lado dela em `lib/assinatura.ts` diz, com todas as
              letras, que é o único item que não é software e que é ele que
              responde "por que não uso um chatbot de graça". O escopo estreito
              (organizar, projetar, priorizar, e NÃO indicar ativo) sai do
              mesmo arquivo. A independência e a ausência de comissão já são
              afirmadas na seção de credibilidade logo abaixo.

              ⚠️ O QUE NÃO ESTÁ ESCRITO, e não está de propósito: nome de
              sócio, ano de fundação, quantidade de consultores, tempo de casa
              e número de clientes atendidos. Nenhum desses fatos existe no
              repositório, e esta é a página que se recusa a inventar prova
              social a duas seções daqui. Inventar aqui derrubaria lá.

              A FOTO É A MESMA DO RODAPÉ e das outras landings da casa: são os
              sócios de verdade, e o arquivo `-alta` é o ampliado por upscaler
              de precisão (a história está em `/assinar`). Ela não é `priority`
              e não precisa ser: mora depois da décima primeira seção. */}
          <section className="pt-14 sm:pt-20">
            <div className="grid items-center gap-8 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-9 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl lg:aspect-square">
                <Image
                  src="/marca/novare-site/socios-novare-alta.jpg"
                  alt="Dois sócios da Novare sentados lado a lado à mesa de reunião, de terno, olhando para a câmera."
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 20rem"
                  quality={62}
                  className="object-cover"
                />
              </div>

              <div>
                <h2 className="font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                  Do outro lado do app tem gente.
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  A Novare é uma consultoria financeira independente, e o
                  FINCASH é a ferramenta que ela abriu para quem quer se
                  organizar sozinho. A diferença é o que vem junto: a
                  assinatura inclui uma revisão a cada trimestre, escrita por um
                  consultor da casa, com o seu nome em cima. Não é um relatório
                  que o sistema gera às três da manhã.
                </p>

                {/* A LINHA CITADA DA FONTE, e ela é citação mesmo: o texto sai
                    de `ASSINATURA_INCLUI[0]`, o mesmo que a lista de preço
                    logo abaixo imprime. Escrever à mão aqui criaria duas
                    promessas com palavras diferentes na mesma página, que é o
                    jeito mais barato de perder quem está comparando. */}
                <p className="mt-5 flex items-start gap-3 rounded-2xl border border-accent-soft bg-accent-tint p-4">
                  <PenLine
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                    strokeWidth={1.75}
                  />
                  <span className="font-display text-sm font-semibold leading-snug text-primary">
                    {ASSINATURA_INCLUI[0]}
                  </span>
                </p>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  O escopo é estreito, e é assim de propósito: a revisão
                  organiza, projeta e prioriza. Ela comenta o seu plano e não
                  indica ativo, produto, fundo nem corretora, porque a Novare
                  não recebe comissão de nenhum deles. É o único item desta
                  assinatura que nenhum software entrega, e é o que responde por
                  que não basta um chatbot de graça.
                </p>
              </div>
            </div>
          </section>

          {/* ====================================== 13. CREDIBILIDADE === */}
          <section className="pt-14 sm:pt-20">
            <TituloSecao
              titulo="Sem número inflado, sem depoimento de encomenda"
              apoio="Não vamos dizer quantos milhares de pessoas usam o app: seria fácil de escrever e impossível de conferir. O que dá para provar é como a casa ganha dinheiro."
            />

            <dl className="mt-8 divide-y divide-border border-y border-border">
              {PROVAS.map((p) => (
                <div
                  key={p.titulo}
                  className="grid gap-2 py-6 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8"
                >
                  <dt>
                    <span className="font-display text-3xl font-bold leading-none tracking-tight text-accent-strong">
                      {p.destaque}
                    </span>
                    <span className="mt-1.5 block font-display text-base font-semibold leading-snug text-primary">
                      {p.titulo}
                    </span>
                  </dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">
                    {p.texto}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ============================================= 14. PREÇO ==== */}
          <section className="pt-14 sm:pt-20">
            <div className="relative overflow-hidden rounded-3xl border border-accent-soft bg-accent-tint p-6 sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(30rem 16rem at 92% -22%, hsl(16 85% 55% / 0.20), transparent 65%)",
                }}
              />

              <div className="relative">
                <Chapeu tom="navy">Uma assinatura para a casa inteira</Chapeu>

                <h2 className="mt-4 max-w-2xl font-display text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
                  <span className="whitespace-nowrap tabular-nums text-accent-strong">
                    {ASSINATURA_TRIAL_DIAS} dias grátis
                  </span>
                  . Depois,{" "}
                  <span className="whitespace-nowrap tabular-nums">
                    {ASSINATURA_PRECO_ROTULO}
                  </span>{" "}
                  ao mês.
                </h2>

                {/* A frase que esta página não pode omitir: assinar o FINCASH
                    é assinar o Workspace. */}
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Não existe plano do FINCASH. Existe a assinatura da Novare, e
                  ela libera este app junto com todo o resto: o Planejamento
                  Financeiro, a Íris e as calculadoras da casa. Sem taxa de
                  entrada, sem fidelidade e sem comissão embutida em produto
                  nenhum.
                </p>

                <div className="mt-7 grid gap-5 md:grid-cols-[1.15fr_minmax(0,16rem)] md:items-start">
                  <ul className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
                    {inclui.map((linha) => (
                      <li
                        key={linha}
                        className="flex items-start gap-2.5 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{linha}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-2.5">
                    <BotaoComecar />
                    <a
                      href={falarNoWhatsApp(
                        "Olá! Tenho dúvidas sobre o FINCASH da Novare antes de assinar.",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-accent-soft bg-card px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent-tint"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Falar com um consultor
                    </a>
                    <p className="flex items-center justify-center gap-1.5 text-center text-2xs text-muted-foreground">
                      <Lock className="h-3 w-3 shrink-0" />
                      Sem cobrança e sem cartão nos primeiros{" "}
                      {ASSINATURA_TRIAL_DIAS} dias.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================ 15. PERGUNTAS FREQUENTES ===== */}
          <section className="pt-14 sm:pt-20">
            <OQueSignifica
              titulo="Perguntas frequentes"
              itens={[
                {
                  pergunta: "Preciso conectar a minha conta do banco?",
                  resposta:
                    "Não, e não é uma etapa que ficou para depois: o app não pede a senha do seu banco nem usa Open Finance. Você lança, ele calcula. Em troca disso, funciona com qualquer banco brasileiro, inclusive com a conta que nenhum agregador consegue ler.",
                },
                {
                  pergunta: "O que já está pronto?",
                  /* A lista antiga dizia que faturas, metas, investimentos e
                     projeção estavam em obra. As quatro subiram, e a resposta
                     precisa acompanhar: uma landing que subestima o produto
                     custa venda tanto quanto uma que o superestima. */
                  resposta:
                    "As doze telas estão no ar: Painel, Lançamentos, Cartões e faturas, Contas fixas, Contas, Importar extrato, Orçamento, Dívidas, Metas, Investimentos, Projeção de 12 meses e Categorias. As capturas desta página saíram todas do app, de uma conta de demonstração. A peça que ainda falta é o assistente de WhatsApp, construído dentro do app e à espera da linha oficial.",
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
                    "Já assino o Planejamento Financeiro. Preciso pagar de novo?",
                  resposta:
                    "Não. A casa tem uma mensalidade só, e ela libera tudo. Se você já assina, o FINCASH já está liberado na sua conta: é só entrar.",
                },
                {
                  pergunta: `Como funcionam os ${ASSINATURA_TRIAL_DIAS} dias grátis?`,
                  resposta: `Você cria a conta e usa o produto completo por ${ASSINATURA_TRIAL_DIAS} dias sem cadastrar cartão. A primeira cobrança de ${ASSINATURA_PRECO_ROTULO} só existe quando você decide continuar, e se não decidir, ela não acontece.`,
                },
                {
                  pergunta: "Como faço para cancelar?",
                  resposta:
                    "É só avisar a gente: a cobrança para, sem multa e sem fidelidade. Cancelando dentro do teste, você não paga nada.",
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
              ]}
            />
          </section>

          {/* ======================================== 16. CTA FINAL ==== */}
          <section className="pt-14 sm:pt-20">
            <div
              className="palco-cta relative isolate overflow-hidden rounded-3xl p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-10"
              style={PALCO_NAVY}
            >
              <div className="space-y-3">
                <h2 className="max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  Comece pelo mês que já está correndo.
                </h2>
                <p className="max-w-lg text-sm leading-relaxed text-white/75">
                  Cadastre as contas, jogue o que se repete todo mês e veja, em
                  poucos minutos, quanto ainda dá para gastar até o dia 30. São{" "}
                  {ASSINATURA_TRIAL_DIAS} dias sem pagar nada e sem cartão.
                  Depois, {ASSINATURA_PRECO_ROTULO} ao mês com o Workspace
                  inteiro liberado.
                </p>
              </div>

              <div className="mt-6 flex shrink-0 flex-col gap-2.5 sm:mt-0 sm:w-64">
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
