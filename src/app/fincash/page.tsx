import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  CreditCard,
  Gauge,
  Gift,
  Layers,
  LineChart,
  ListPlus,
  Lock,
  MessageCircle,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
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
 * 5. UM SISTEMA DE RAIO SÓ: `rounded-3xl` para contêiner, `rounded-xl` para
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
 * Os números batem com o painel do herói de propósito: 7.400 que entraram
 * menos 4.180 que saíram dão os R$ 3.220 que o app do banco mostra; as contas
 * que ainda vencem (1.230) mais as parcelas e a fatura (750) dão os R$ 1.980
 * que ainda vão sair; e a diferença é a sobra de R$ 1.240. Um visitante
 * atento confere, e quem confere e vê que bate confia no resto da página.
 */
const CONTA_LINHAS = [
  {
    rotulo: "Saldo que o app do banco mostra hoje",
    valor: "R$ 3.220",
    obs: "Entraram R$ 7.400, saíram R$ 4.180",
  },
  {
    rotulo: "Contas fixas que ainda vencem este mês",
    valor: "- R$ 1.230",
    obs: "Energia, internet, escola",
  },
  {
    rotulo: "Parcelas e fatura que ainda caem",
    valor: "- R$ 750",
    obs: "Três compras parceladas fechando no mesmo mês",
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
 * As telas que não ganharam prévia desenhada.
 *
 * Três telas têm mosaico com prévia (painel, projeção e fatura) porque são as
 * que provam a tese: olhar para a frente. As outras seis viram LINHAS, e a
 * lista é curta e conferível. Desenhar seis prévias a mais transformaria a
 * seção numa escada de nove blocos iguais, que é exatamente o defeito que
 * esta versão veio corrigir.
 */
const TELAS_LISTA: { icone: LucideIcon; nome: string; texto: string }[] = [
  {
    icone: ListPlus,
    nome: "Lançamentos",
    texto:
      "O gasto de hoje em segundos, com um clique para marcar como pago. Previsto e realizado convivem na mesma lista, e o que venceu sem pagamento aparece como atrasado, escrito por extenso.",
  },
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
      "Com o saldo inicial de cada conta, o app deixa de responder “quanto gastei” e passa a responder “quanto eu tenho”. O total vem com a fita de composição, mostrando quanto está em cada lugar.",
  },
  {
    icone: Wallet,
    nome: "Orçamento",
    texto:
      "Antes de você digitar o limite, ele mostra o mínimo, a média e o máximo que você já gastou na categoria, e de quantos meses vem essa média. Com menos de dois meses, avisa que ainda não dá para sugerir.",
  },
  {
    icone: Target,
    nome: "Metas",
    texto:
      "Quanto separar por mês para chegar na data, meta a meta. E a soma de todas elas contra a sua renda, porque cinco metas razoáveis somam 60% do salário e nenhuma acontece.",
  },
  {
    icone: TrendingUp,
    nome: "Investimentos",
    texto:
      "A carteira por classe e por instituição, com meses de reserva e a idade do dado em dias. Valor de três meses atrás é ficção com cara de fato, e a tela diz isso antes dos números grandes.",
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

/**
 * A moldura de aparelho: o que dá MATERIALIDADE à prévia.
 *
 * POR QUE NÃO É UM PRINT (e é a mesma decisão do `PainelExemplo` da
 * /assinar): print de tela envelhece calado. Muda um rótulo no produto e a
 * imagem da landing passa a mentir sem ninguém perceber, some no celular e
 * borra em tela retina. Isto é a interface de verdade, com os mesmos tokens e
 * a mesma tipografia, e continua legível a 390px.
 *
 * A MOLDURA existe porque uma prévia sem borda de aparelho lê como "mais um
 * card da página" em vez de "isto é o produto". As três camadas (anel escuro,
 * respiro branco, tela) são o que faz a peça parecer objeto pousado sobre a
 * seção, e não desenho impresso nela. A inclinação vem de `.moldura-produto`,
 * que já se desliga sozinha em `prefers-reduced-motion`.
 */
function Moldura({
  barra,
  children,
  inclinar = false,
}: {
  /** O que aparece na barra de topo do aparelho, no lugar da URL. */
  barra: string;
  children: React.ReactNode;
  inclinar?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl bg-primary/90 p-1.5 shadow-[0_24px_60px_-24px_hsl(215_50%_12%_/_0.55)] ring-1 ring-white/10 ${
        inclinar ? "moldura-produto" : ""
      }`}
    >
      <div className="overflow-hidden rounded-3xl bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-border" />
          <span aria-hidden className="h-2 w-2 rounded-full bg-border" />
          <p className="ml-1 truncate text-[11px] font-semibold text-muted-foreground">
            {barra}
          </p>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

/** Uma linha de dado dentro da prévia: rótulo à esquerda, número à direita. */
function LinhaValor({
  titulo,
  detalhe,
  valor,
  cor = "bg-primary/25",
  previsto = false,
  selo,
}: {
  titulo: string;
  detalhe?: string;
  valor: string;
  cor?: string;
  /** O que ainda não aconteceu aparece apagado, como no app. */
  previsto?: boolean;
  selo?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b border-border/60 py-2 last:border-0 ${
        previsto ? "opacity-55" : ""
      }`}
    >
      <span className={`h-6 w-1 shrink-0 rounded-full ${cor}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">
          {titulo}
          {selo && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              {selo}
            </span>
          )}
        </p>
        {detalhe && (
          <p className="truncate text-[11px] leading-snug text-muted-foreground">
            {detalhe}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs font-bold tabular-nums text-slate-600">
        {valor}
      </span>
    </div>
  );
}

/**
 * A prévia do painel: o número grande, o quanto do mês já saiu e as duas
 * leituras. É a tela que a pessoa abre todo dia, então é a que aparece na
 * primeira dobra.
 */
function PreviaPainel() {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sobra prevista até o fim do mês
      </p>
      <p className="font-display text-3xl font-extrabold leading-none tabular-nums text-primary sm:text-4xl">
        R$ 1.240
      </p>

      {/* A barra tem uma leitura, não é enfeite: quanto do que sai no mês já
          saiu (4.180 de 6.160). Barra sem significado num painel financeiro
          ensina a ignorar as outras. */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full w-[68%] rounded-full bg-accent" />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        68% do que sai neste mês já saiu
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Já entrou", "R$ 7.400"],
          ["Já saiu", "R$ 4.180"],
          ["Ainda vai sair", "R$ 1.980"],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl bg-gelo p-2.5">
            <p className="text-[10px] leading-tight text-muted-foreground">
              {rotulo}
            </p>
            <p className="mt-0.5 text-xs font-bold tabular-nums text-primary">
              {valor}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-0">
        <LinhaValor
          titulo="Energia"
          detalhe="25/09 · ainda vai sair"
          valor="R$ 268"
          previsto
        />
        <LinhaValor
          titulo="Notebook"
          detalhe="15/09 · pago"
          valor="R$ 300"
          cor="bg-accent"
          selo="3/12"
        />
      </div>
    </>
  );
}

/**
 * A curva da projeção, em SVG.
 *
 * Doze pontos e uma linha de zero. O que a peça precisa mostrar não é a
 * beleza da curva: é o CRUZAMENTO, o mês em que o saldo passa para baixo do
 * zero. Por isso o ponto do cruzamento é o único marcado, e a área negativa
 * é a única pintada. Gráfico de landing que mostra tudo subindo não descreve
 * a tela, descreve o desejo.
 */
function CurvaProjecao() {
  const pontos =
    "10,20.9 30,15.5 50,22.3 70,31.8 90,29.1 110,44.1 130,52.3 150,70 170,79.5 190,72.7 210,61.8 230,52.3";

  return (
    <svg
      viewBox="0 0 240 92"
      className="h-24 w-full"
      role="img"
      aria-label="Saldo projetado por doze meses, ficando negativo no oitavo mês"
    >
      {/* A faixa abaixo do zero, marcando o período no vermelho. */}
      <rect
        x="0"
        y="64.5"
        width="240"
        height="27.5"
        fill="hsl(0 72% 51% / 0.07)"
      />
      <line
        x1="0"
        y1="64.5"
        x2="240"
        y2="64.5"
        stroke="hsl(220 13% 84%)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <polyline
        points={pontos}
        fill="none"
        stroke="hsl(215 50% 23%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="150" cy="70" r="4" fill="hsl(0 72% 51%)" />
      <circle cx="150" cy="70" r="8" fill="hsl(0 72% 51% / 0.16)" />
    </svg>
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

              {/* O produto na primeira dobra. A tese da página é um número, e
                  mostrá-lo dentro da moldura do app vale mais que descrevê-lo
                  em três parágrafos. */}
              <div
                className="surgir"
                style={{ animationDelay: "120ms" }}
              >
                <Moldura barra="FINCASH · Painel de setembro" inclinar>
                  <PreviaPainel />
                </Moldura>
                <p className="mt-3 text-center text-[11px] text-white/55">
                  A interface de verdade, com números de exemplo.
                </p>
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

              <div className="lg:sticky lg:top-24">
                <ContaAberta
                  linhas={CONTA_LINHAS}
                  resultado={{
                    rotulo: "Sobra de verdade até o dia 30",
                    valor: "R$ 1.240",
                  }}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  O app do banco mostraria R$ 3.220 e você decidiria em cima
                  desse número. O FINCASH mostra R$ 1.240, que é o que
                  realmente está livre.
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

          {/* ================================= 6. O PRODUTO, POR DENTRO == */}
          {/* MOSAICO, não escada. Três telas ganham prévia porque são as que
              provam a tese de olhar para a frente; as outras seis viram lista.
              A versão anterior tinha cinco blocos "texto de um lado, exemplo
              do outro" em sequência, e a partir do terceiro o olho já sabia o
              que vinha e pulava. */}
          <section className="pt-14 sm:pt-20">
            <TituloSecao
              sobre="Por dentro"
              titulo="Nove telas, e cada uma responde uma pergunta"
              apoio="Todas no ar hoje, inclusive as que apareciam como obra na versão anterior desta página. Nenhuma existe para ficar bonita no print: cada uma resolve um momento do ciclo."
            />

            <div className="mt-9 grid gap-4 lg:grid-cols-2">
              {/* A tela de todo dia ocupa a largura inteira: é a única que a
                  pessoa vai abrir amanhã de manhã. */}
              <article className="rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-8 lg:col-span-2">
                <div className="grid items-center gap-7 lg:grid-cols-[1fr_minmax(0,20rem)]">
                  <div>
                    <h3 className="font-display text-xl font-semibold leading-snug text-primary sm:text-2xl">
                      Painel: posso gastar?
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      O número grande do topo não é quanto você gastou, porque
                      isso é passado e passado não muda comportamento. É quanto
                      sobra até o fim do mês, já descontando o que ainda vai
                      sair. Ao lado dele ficam as duas leituras que importam:
                      como o mês está agora e como ele termina se nada mudar.
                      Embaixo, seis meses de barras, porque um mês isolado não
                      diz se a vida está melhorando ou piorando.
                    </p>
                  </div>
                  <Moldura barra="Painel de setembro">
                    <PreviaPainel />
                  </Moldura>
                </div>
              </article>

              <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                  <LineChart className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-primary">
                  Projeção de 12 meses: em que mês a conta não fecha?
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Ver em setembro que abril fecha no vermelho é o único aviso
                  que chega enquanto ainda dá para cancelar uma assinatura ou
                  adiar uma compra. A tela mostra o primeiro mês negativo, o
                  menor saldo do período e a conta aberta de cada mês, linha
                  por linha. Tem simulador de hipóteses, e ele não grava nada.
                </p>

                <div className="mt-5 rounded-xl border border-border bg-gelo p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Saldo projetado
                    </p>
                    <p className="text-[11px] font-semibold text-red-700">
                      Negativo em abril
                    </p>
                  </div>
                  <CurvaProjecao />
                </div>
              </article>

              <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                  <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-primary">
                  Cartões e faturas: quanto vem, e quando?
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  O susto da fatura não vem de esquecer uma compra, vem de não
                  saber que as parcelas de três compras diferentes caem todas
                  no mesmo mês. A tela abre com o valor, o dia do vencimento e
                  o quanto da próxima já está comprometido. O ciclo aparece por
                  extenso, porque fatura é a única coisa do app cujo período
                  não é o mês do calendário.
                </p>

                <div className="mt-5 rounded-xl border border-border bg-gelo p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-primary">
                        Cartão principal
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        De 26/08 a 25/09, vence 05/10
                      </p>
                    </div>
                    <p className="font-display text-lg font-extrabold tabular-nums text-primary">
                      R$ 1.870
                    </p>
                  </div>
                  <div className="mt-3 space-y-0">
                    <LinhaValor
                      titulo="Restaurante"
                      detalhe="6 compras"
                      valor="R$ 612"
                      cor="bg-warning"
                    />
                    <LinhaValor
                      titulo="Parcelas em aberto"
                      detalhe="Notebook 3/12, sofá 2/6"
                      valor="R$ 480"
                      cor="bg-accent"
                    />
                  </div>
                  <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                    A próxima fatura já tem R$ 480 comprometidos antes de você
                    comprar qualquer coisa.
                  </p>
                </div>
              </article>
            </div>

            {/* As outras seis, em linha. Lista curta e conferível vale mais
                que seis prévias desenhadas que ninguém lê até o fim. */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-subtle">
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

          {/* ============================ 7. O ASSISTENTE DE WHATSAPP ==== */}
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
              defensável e porque calar sobre ela criaria a expectativa. */}
          <section className="pt-14 sm:pt-20">
            <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-9 lg:grid-cols-[1fr_minmax(0,21rem)] lg:items-center lg:gap-12">
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
              </div>

              {/* A conversa, com as frases tiradas do interpretador de
                  verdade. Nenhuma foi escrita para a página. */}
              <div className="rounded-3xl border border-border bg-gelo p-4 sm:p-5">
                <ul className="space-y-3">
                  {CONVERSA.map((c) => (
                    <li key={c.pessoa}>
                      <p className="ml-auto w-fit max-w-[85%] rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">
                        {c.pessoa}
                      </p>
                      <p className="mt-1.5 w-fit max-w-[90%] rounded-xl border border-border bg-card px-3 py-2 text-xs leading-snug text-muted-foreground">
                        {c.efeito}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                  Frases que o interpretador já reconhece
                </p>
              </div>
            </div>
          </section>

          {/* ======================================= 8. CREDIBILIDADE ==== */}
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

          {/* ============================================== 9. PREÇO ===== */}
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

          {/* ============================= 10. PERGUNTAS FREQUENTES ====== */}
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
                    "As nove telas estão no ar: Painel, Lançamentos, Cartões e faturas, Contas fixas, Contas, Orçamento, Metas, Investimentos e a projeção de 12 meses. A décima peça é o assistente de WhatsApp, que já está construído dentro do app mas ainda espera a linha oficial ser ligada.",
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

          {/* ========================================= 11. CTA FINAL ===== */}
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
