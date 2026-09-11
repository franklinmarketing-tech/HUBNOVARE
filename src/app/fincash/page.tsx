import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  CreditCard,
  FileUp,
  Gauge,
  Gift,
  Layers,
  ListPlus,
  Lock,
  MessageCircle,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Smartphone,
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
 * O que o assistente de WhatsApp entende, tirado do interpretador.
 *
 * ⚠️ Cada frase daqui existe em `src/lib/fincash/whatsapp.ts` e está listada
 * na tela do app (`whatsapp/guia.tsx`). Uma landing que inventa uma frase a
 * mais queima o assistente inteiro: a pessoa manda, recebe "não entendi" e
 * não tenta uma terceira vez.
 */
const CONVERSA: { pessoa: string; efeito: string }[] = [
  { pessoa: "Uber 35", efeito: "Gasto de R$ 35 hoje, na categoria de transporte." },
  { pessoa: "mercado R$ 280 ontem", efeito: "Lançado com a data de ontem." },
  { pessoa: "recebi 5000 de salário", efeito: "Entrada, não gasto." },
  { pessoa: "saldo", efeito: "O saldo de cada conta e o total." },
  { pessoa: "resumo", efeito: "Entrou, saiu, sobrou e o que ainda falta pagar." },
  { pessoa: "desfazer", efeito: "Apaga o último lançamento que ele criou." },
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
          {/* ⚠️ A SEÇÃO MAIS DELICADA DA PÁGINA. O assistente é o item que mais
              separaria a Novare do concorrente mais direto, que cobra a mais
              para ter o mesmo. E é o único que ainda não está de pé inteiro: o
              interpretador, o vínculo do número e a tela existem, a linha
              oficial não.

              Por isso ele aparece com a ressalva ANTES do encanto, e não
              depois: quem lê "em breve" no fim de uma seção entusiasmada já
              comprou a promessa e vai cobrar por ela. E não entra no
              comparativo nem na contagem de telas prontas.

              Foto de nota e áudio ficaram deliberadamente de fora do produto.
              A página diz isso com todas as letras, porque é uma decisão
              defensável e porque calar sobre ela criaria a expectativa.

              ── A IMAGEM QUE MANDA NESTA SEÇÃO ────────────────────────────
              O celular na mão com a conversa na tela é a peça mais persuasiva
              da página, porque é a única que mostra o produto ACONTECENDO no
              lugar onde a pessoa já vive, sem app aberto e sem tela de
              cadastro. Ela ganhou a coluna larga e a conversa remontada em
              HTML saiu: as duas mostravam a mesma coisa, e a remontagem perdia
              no confronto.

              ⚠️ E É JUSTAMENTE POR SER A MAIS PERSUASIVA QUE ELA É A MAIS
              PERIGOSA. A conversa é composição, não print de um número que
              responde hoje. A pastilha de "construído, ainda não ligado" fica
              ao lado dela, e a linha de ressalva vai COLADA na imagem, dentro
              do mesmo bloco: separadas por uma coluna, a imagem viaja em
              print, em story e em anúncio sem a ressalva junto, e aí a página
              passa a prometer o que não entrega. Quando a linha da Meta for
              ligada, sai a pastilha, sai a linha, e não sai nada além disso. */}
          <section className="pt-14 sm:pt-20">
            <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-9 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-12">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5" />
                  Construído, ainda não ligado
                </span>

                <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-primary sm:text-3xl">
                  Lançar o gasto mandando uma mensagem
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Dentro do app já existem o interpretador, a tela do
                  assistente e o vínculo do seu número, que é confirmado por um
                  código de dez minutos que você manda pelo WhatsApp. Falta
                  plugar a linha oficial, e essa parte não depende de código.
                  Enquanto ela não estiver no ar, você não paga nada a mais por
                  isso e não vai encontrar essa promessa marcada como pronta em
                  lugar nenhum desta página. Quando ligar, entra para quem já
                  assina.
                </p>

                <p className="mt-4 rounded-xl border border-border bg-gelo p-4 text-sm leading-relaxed text-muted-foreground">
                  <b className="font-semibold text-foreground">
                    Foto de nota e áudio ficaram de fora, de propósito.
                  </b>{" "}
                  Uma nota fiscal tem subtotal, desconto e troco na mesma
                  folha, e gravar o número errado calado é o pior defeito
                  possível num app de dinheiro. Parcelamento e data solta
                  continuam na tela de lançamentos, onde dá para conferir as
                  parcelas antes de gravar.
                </p>

                {/* O QUE A IMAGEM NÃO CABE MOSTRAR. A foto traz três frases; o
                    interpretador reconhece estas seis, e as três que faltam
                    (saldo, resumo, desfazer) são as que respondem em vez de
                    lançar. Elas continuam escritas aqui porque foram tiradas
                    de `lib/fincash/whatsapp.ts`, uma a uma: inventar uma
                    sétima queimaria o assistente inteiro, já que quem manda e
                    ouve "não entendi" não tenta uma terceira vez. */}
                <dl className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {CONVERSA.map((c) => (
                    <div
                      key={c.pessoa}
                      className="border-t border-border/60 pt-2 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
                    >
                      <dt className="font-mono text-xs font-semibold text-primary">
                        {c.pessoa}
                      </dt>
                      <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {c.efeito}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* COMPOSIÇÃO 5 DE 5: a fotografia É a tela, e não tem moldura
                  de aparelho por cima porque o aparelho já está na foto. É a
                  única imagem da página em que o produto aparece fora do
                  produto, e é esse o argumento: não é preciso abrir o app.

                  A ressalva mora dentro do mesmo bloco, encostada na imagem,
                  pelo motivo escrito no cabeçalho da seção. */}
              <figure className="rounded-3xl border border-border bg-gelo p-3 sm:p-4">
                <div className="overflow-hidden rounded-xl">
                  <Pessoa
                    quem="whatsappNaMao"
                    sizes="(max-width: 1024px) 90vw, 25rem"
                  />
                </div>
                <figcaption className="mt-3 text-[11px] leading-snug text-muted-foreground">
                  Conversa de demonstração, montada com as frases que o
                  interpretador já reconhece e com os números da conta de
                  exemplo. A linha oficial ainda não está ligada.
                </figcaption>
              </figure>
            </div>
          </section>

          {/* ====================================== 12. CREDIBILIDADE === */}
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

          {/* ============================================= 13. PREÇO ==== */}
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

          {/* ============================ 14. PERGUNTAS FREQUENTES ===== */}
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
                    "Ainda não. O interpretador, o vínculo do número e a tela do assistente estão prontos dentro do app, e falta plugar a linha oficial do WhatsApp. Quando ela entrar no ar, vale para quem já assina, sem custo adicional. Foto de nota e áudio não estão nos planos: nota tem subtotal, desconto e troco na mesma folha, e gravar o número errado calado seria pior que não ter o recurso.",
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

          {/* ======================================== 15. CTA FINAL ==== */}
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
