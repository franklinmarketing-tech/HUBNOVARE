import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  BadgePercent,
  Bot,
  CalendarCheck,
  Check,
  ClipboardList,
  Compass,
  CreditCard,
  FileText,
  Gauge,
  Gift,
  Infinity as InfinityIcon,
  KeyRound,
  LineChart,
  Lock,
  Receipt,
  EyeOff,
  FileLock2,
  Rocket,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import {
  ASSINATURA_INCLUI,
  ASSINATURA_NOME,
  ASSINATURA_PRECO,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import {
  CONSULTORIAS,
  DESCONTO_ASSINANTE,
  ROTULO_DESCONTO,
} from "@/lib/consultoria";
import { CONTAGEM } from "@/lib/apps";
import { falarNoWhatsApp } from "@/lib/contato";
import {
  Comparativo,
  ContaAberta,
  Etapa,
  LinkSecao,
  Persona,
  Pilar,
  TituloSecao,
  tomPor,
  type LinhaComparativo,
} from "@/components/SecoesVenda";

export const metadata: Metadata = {
  title: `${ASSINATURA_NOME} — uma assinatura, tudo liberado`,
  description: `Planejamento Financeiro completo, a Íris e todas as ferramentas por ${ASSINATURA_PRECO_ROTULO}/mês, com ${ASSINATURA_TRIAL_DIAS} dias grátis. Assinante ainda entra com ${ROTULO_DESCONTO} na consultoria particular da Novare.`,
  alternates: { canonical: "/assinar" },
  openGraph: {
    title: `${ASSINATURA_NOME} — uma assinatura, tudo liberado`,
    description: `Tudo o que a Novare construiu, por ${ASSINATURA_PRECO_ROTULO}/mês. Comece com ${ASSINATURA_TRIAL_DIAS} dias grátis.`,
    url: "/assinar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

/* -------------------------------------------------------------------------- */

const PALCO: React.CSSProperties = {
  background: "linear-gradient(157deg, hsl(215 52% 21%) 0%, hsl(216 58% 11%) 100%)",
};

const PERSONAS = [
  {
    icone: TrendingUp,
    titulo: "Você ganha bem, mas não sabe para onde vai",
    rotulo: "O caso mais comum",
    texto:
      "O salário entra, o mês acaba e sobra pouco — sem que dê para apontar exatamente onde ficou. A trilha mostra o caminho do dinheiro em números, não em impressão.",
  },
  {
    icone: Target,
    titulo: "Você tem objetivos soltos, sem um número",
    rotulo: "O caso mais frustrante",
    texto:
      "Casa, viagem, faculdade dos filhos, parar de trabalhar um dia. Cada um vira uma conta separada na sua cabeça. O Marco Horizonte junta todos num alvo só.",
  },
  {
    icone: UserCheck,
    titulo: "Você quer decidir sozinho, com base boa",
    rotulo: "O caso mais nosso",
    texto:
      "Não quer alguém vendendo produto no seu ouvido, mas também não quer decidir no escuro. Aqui o método é o mesmo da consultoria — só que na sua mão.",
  },
];

const ETAPAS = [
  {
    icone: KeyRound,
    titulo: "Você cria a conta",
    texto: `E-mail e senha, nada mais. Nenhum cartão é pedido: os ${ASSINATURA_TRIAL_DIAS} dias de teste começam a correr e você já entra no produto.`,
  },
  {
    icone: ClipboardList,
    titulo: "Preenche seu retrato",
    texto:
      "Oito blocos curtos: renda, despesas, dívidas, patrimônio, proteção, objetivos e o seu jeito com dinheiro. Uns dez minutos, e dá para parar no meio.",
  },
  {
    icone: Compass,
    titulo: "Recebe diagnóstico e plano",
    texto:
      "Na hora, sem esperar aprovação de ninguém: sua nota de risco, o Marco Horizonte e o que fazer primeiro, com valor e prazo em cada meta.",
  },
  {
    icone: CalendarCheck,
    titulo: "Acompanha mês a mês",
    texto:
      "Você lança como foi o mês, fecha, e o app abre o seguinte já preenchido. A evolução do seu patrimônio vira uma linha do tempo.",
  },
];

const COMPARATIVO: LinhaComparativo[] = [
  { criterio: "Calculadoras e simuladores", sem: "Abertas", com: "Abertas" },
  { criterio: "Novare News e indicadores ao vivo", sem: "Abertos", com: "Abertos" },
  { criterio: "Marco Horizonte", sem: "Estimativa, não salva", com: "Salvo e recalculado" },
  { criterio: "Retrato financeiro completo", sem: false, com: true },
  { criterio: "Diagnóstico com nota de risco", sem: false, com: true },
  { criterio: "Plano de ação com valor e prazo", sem: false, com: true },
  { criterio: "Fechamento mensal e evolução", sem: false, com: true },
  { criterio: "Relatório completo em PDF", sem: false, com: true },
  { criterio: "Íris, a IA que lê seu extrato", sem: "Primeira leitura", com: "Sem limite" },
  { criterio: "Consultoria particular", sem: "Preço cheio", com: ROTULO_DESCONTO },
];

const PILARES = [
  {
    icone: Target,
    selo: "O produto principal",
    nome: "Planejamento Financeiro",
    promessa: "Seu plano inteiro, do retrato ao acompanhamento do mês.",
    itens: [
      "Retrato financeiro em 8 blocos curtos",
      "Diagnóstico e nota de risco na hora",
      "Marco Horizonte: seus objetivos viram um número só",
      "Plano de ação com valor e prazo em cada meta",
      "Relatório em PDF que é seu",
    ],
    href: "/planejamento",
    rotuloLink: "Ver o app por dentro",
  },
  {
    icone: Bot,
    selo: "Vem junto, sem custo",
    nome: "Íris, a IA que lê seu extrato",
    promessa: "Acha o dinheiro que some antes de você sentir falta dele.",
    itens: [
      "Cole o extrato do banco: CSV, OFX ou texto",
      "Acha assinatura esquecida e cobrança repetida",
      "Separa tarifa de banco e juro escondido",
      "Não ganha comissão de ninguém, então fala a verdade",
      "O extrato não sai do seu navegador",
    ],
    href: "/iris",
    rotuloLink: "Conhecer a Íris",
  },
  {
    icone: BadgePercent,
    selo: "O que paga a assinatura",
    nome: `Consultoria com ${ROTULO_DESCONTO}`,
    promessa: "Quando você quiser um humano do seu lado, entra mais barato.",
    itens: [
      "Vale para qualquer um dos formatos da Novare",
      "Consultor CFP®, sem comissão de corretora",
      "O escopo é analisado caso a caso, e cobrado à parte",
      "O desconto vale enquanto a assinatura estiver ativa",
    ],
    href: "/consultoria",
    rotuloLink: "Ver os formatos",
  },
];

const TRILHA = [
  { icone: ClipboardList, nome: "Meus dados" },
  { icone: Gauge, nome: "Diagnóstico" },
  { icone: Compass, nome: "Meu plano" },
  { icone: CalendarCheck, nome: "Meu mês" },
  { icone: LineChart, nome: "Minha evolução" },
  { icone: FileText, nome: "Meu relatório" },
];

const SELOS = [
  { icone: ShieldCheck, texto: "Consultoria CFP®" },
  { icone: Wallet, texto: "Sem comissão de corretora" },
  { icone: Lock, texto: "Seus dados sob a LGPD" },
  { icone: CreditCard, texto: "Sem cartão para testar" },
  { icone: InfinityIcon, texto: "Cancele quando quiser" },
];

const ICONES_INCLUI = [Gift, Target, Bot, Sparkles, BadgePercent, Receipt, InfinityIcon];

/**
 * Por que a Novare pode dizer o que diz.
 *
 * Não é lista de qualidades — é o conjunto de fatos verificáveis que sustenta
 * cada recomendação da casa. Sem eles, "análise isenta" é adjetivo; com eles,
 * é uma descrição do modelo de negócio.
 */
const PILARES_CREDIBILIDADE = [
  {
    destaque: "R$ 0",
    titulo: "de comissão sobre o que você investe",
    texto:
      "A Novare não recebe rebate de corretora, banco ou seguradora. Nenhuma conclusão da análise paga nada a ninguém aqui dentro — é o que permite dizer “não compre” quando é o caso.",
  },
  {
    destaque: "CFP®",
    titulo: "certificação de planejamento financeiro",
    texto:
      "A metodologia que virou software é a mesma que os consultores usam no atendimento: reserva antes de risco, dívida cara antes de investimento, proteção antes de acelerar.",
  },
  {
    destaque: "Nord",
    titulo: "research independente por trás",
    texto:
      "Parceria oficial com a Nord Investimentos, casa de análise cujo modelo é assinatura de research — não comissão sobre o que o leitor compra. Dois independentes do mesmo lado da mesa.",
  },
  {
    destaque: "5% a.a.",
    titulo: "de retorno real nas projeções",
    texto:
      "Já descontada a inflação, e escrito na tela. Prometer 12% acima da inflação renderia um gráfico mais bonito e um plano que não acontece.",
  },
];

/**
 * O comparativo que importa de verdade: não é contra outro app, é contra o
 * modelo de quem vive de comissão. Cada linha aqui é fato sobre o modelo de
 * negócio, não opinião sobre concorrente — por isso a coluna da direita fala
 * de "quem vive de comissão", e não de nenhuma empresa com nome.
 */
const CONTRA_TRADICIONAL: LinhaComparativo[] = [
  { criterio: "Quem paga pela recomendação", sem: "O produto vendido", com: "Você" },
  { criterio: "Recebe comissão do que indica", sem: "Sim", com: "Não" },
  { criterio: "Precisa transferir seu dinheiro", sem: "Quase sempre", com: "Nunca" },
  { criterio: "O plano existe antes do produto", sem: false, com: true },
  { criterio: "Diz “não compre” quando é o caso", sem: false, com: true },
  { criterio: "Você enxerga a conta por trás", sem: false, com: true },
  { criterio: "Custo para começar", sem: "Aparentemente zero", com: ASSINATURA_PRECO_ROTULO },
];

/** O que acontece com o que você digita. Sem promessa que o produto não cumpre. */
const SIGILO = [
  {
    icone: FileLock2,
    titulo: "Os dados são seus",
    texto:
      "O retrato financeiro fica na sua conta e só você o enxerga. Pode editar, exportar em PDF ou pedir a exclusão a qualquer momento.",
  },
  {
    icone: EyeOff,
    titulo: "Nada vira lista de venda",
    texto:
      "O que você preenche não é usado para prospecção de terceiros, não é vendido e não alimenta oferta de banco nenhum.",
  },
  {
    icone: ServerCog,
    titulo: "Tratamento declarado",
    texto:
      "A política de privacidade nomeia cada suboperador e cada finalidade, inclusive o processamento de texto por IA. Está escrito lá porque é assim que funciona.",
  },
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* -------------------------------------------------------------------------- */

export default function AssinarPage() {
  // Três contas, todas conferíveis por quem lê — nenhuma promessa, só
  // aritmética sobre o preço que está na própria página.
  const porDia = brl(ASSINATURA_PRECO / 30);
  const porAno = brl(ASSINATURA_PRECO * 12);

  /**
   * A partir de que valor de consultoria o desconto sozinho devolve o ano
   * inteiro de assinatura. É `12 mensalidades ÷ 30%`.
   *
   * Preferi essa conta a inventar um preço de consultoria: os formatos da
   * Novare são orçados caso a caso, e estampar um valor fictício seria vender
   * o que a casa não tabela.
   */
  const limiarConsultoria = brl(
    Math.round((ASSINATURA_PRECO * 12) / DESCONTO_ASSINANTE),
  );

  return (
    <div className="min-h-dvh bg-background">
      <RevelarAoRolar />

      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar ao início
          </Link>
        }
      />

      <main>
        {/* ============================================================ herói */}
        <section className="palco-vivo relative overflow-hidden text-white" style={PALCO}>
          <div className="relative mx-auto grid max-w-5xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24 [&>*]:min-w-0">
            <div className="revelar">
              <span className="selo-pulsa inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-3 py-1.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent-claro" />
                {ASSINATURA_TRIAL_DIAS} dias grátis, sem cartão
              </span>

              {/* Peso 600 num tamanho grande: é assim que o site oficial da
                  Novare escreve, e é o que separa "publicação" de "anúncio".
                  O filete ciano embaixo da promessa é o detalhe da casa. */}
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Uma assinatura.
                <br />
                <span className="relative inline-block text-accent-claro">
                  Tudo liberado.
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-0.5 w-2/3 rounded-full bg-ciano-claro"
                  />
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                No {ASSINATURA_NOME} não existe degrau: não há versão reduzida
                nem versão para quem paga mais. São {ASSINATURA_PRECO_ROTULO} por
                mês e você leva o Planejamento Financeiro completo, a Íris e
                todas as ferramentas — e passa a contratar a consultoria
                particular com desconto.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <BotaoAssinarPlano
                  contexto="workspace"
                  variante="clara"
                  tamanho="grande"
                  rotulo={`Começar ${ASSINATURA_TRIAL_DIAS} dias grátis`}
                />
                <a
                  href="#como-funciona"
                  className="text-sm font-semibold text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Ver como funciona
                </a>
              </div>

              <p className="mt-4 text-xs text-white/55">
                Você cria a senha e já entra no app. A primeira cobrança só
                acontece no {ASSINATURA_TRIAL_DIAS + 1}º dia.
              </p>
            </div>

            <aside className="revelar">
              <div className="borda-viva rounded-3xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm sm:p-7">
                <p className="text-2xs font-bold uppercase tracking-wider text-white/55">
                  {ASSINATURA_NOME}
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <span className="font-display text-[2.75rem] font-black leading-none tabular-nums sm:text-6xl">
                    {ASSINATURA_PRECO_ROTULO}
                  </span>
                  <span className="pb-2 text-sm text-white/60">/mês</span>
                </div>
                <p className="mt-1.5 text-xs text-white/60">
                  {porDia} por dia · {porAno} no ano
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-white/15 pt-5">
                  {ASSINATURA_INCLUI.map((item, i) => {
                    const Icone = ICONES_INCLUI[i] ?? Check;
                    return (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/85">
                        <Icone className="mt-0.5 h-4 w-4 shrink-0 text-accent-claro" />
                        <span>{item}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="revelar-escada mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-7 gap-y-3 px-5 py-4">
            {SELOS.map(({ icone: Icone, texto }) => (
              <span
                key={texto}
                className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground"
              >
                <Icone className="h-3.5 w-3.5 text-accent-strong" />
                {texto}
              </span>
            ))}
          </div>
        </section>

        {/* ====================================================== para quem é */}
        <section className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <div className="revelar">
            <TituloSecao
              sobre="Para quem é"
              titulo={<>Feito para quem quer <span className="text-accent">parar de decidir no escuro</span></>}
              apoio="Não é para quem procura dica de ação nem promessa de rentabilidade. É para quem quer método, número e um caminho que dê para seguir sozinho."
            />
          </div>

          <div className="revelar-escada mt-12 grid gap-5 lg:grid-cols-3">
            {PERSONAS.map((p, i) => (
              <Persona key={p.titulo} {...p} tom={tomPor(i)} />
            ))}
          </div>
        </section>

        {/* ===================================================== como funciona */}
        <section id="como-funciona" className="scroll-mt-16 border-y border-border bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="revelar">
              <TituloSecao
                sobre="Como funciona"
                titulo={<>Do cadastro ao plano pronto, <span className="text-accent">em quatro passos</span></>}
                apoio="Nenhum deles depende de alguém da Novare liberar nada. O produto é autônomo por decisão de projeto."
              />
            </div>

            <ol className="revelar-escada mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ETAPAS.map((etapa, i) => (
                <Etapa key={etapa.titulo} numero={i + 1} total={ETAPAS.length} {...etapa} />
              ))}
            </ol>

            <div className="revelar mt-10 flex flex-wrap items-center justify-center gap-2.5">
              {TRILHA.map(({ icone: Icone, nome }) => (
                <span
                  key={nome}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-2xs font-semibold text-primary"
                >
                  <Icone className="h-3.5 w-3.5 text-accent-strong" />
                  {nome}
                </span>
              ))}
            </div>
            <p className="revelar mt-3 text-center text-xs text-muted-foreground">
              As seis telas que você passa a ter dentro do app.
            </p>
          </div>
        </section>

        {/* ========================================================= 3 pilares */}
        <section className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <div className="revelar">
            <TituloSecao
              sobre="O que entra"
              titulo={<>Três produtos, <span className="text-accent">um preço</span></>}
              apoio="Não é um pacote com enchimento. São os três produtos que a Novare construiu, e o desconto que faz a conta fechar."
            />
          </div>

          <div className="revelar-escada mt-12 grid gap-5 lg:grid-cols-3">
            {PILARES.map(({ icone: Icone, selo, nome, promessa, itens, href, rotuloLink }, i) => {
              const ciano = tomPor(i) === "ciano";
              return (
              <article
                key={nome}
                className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 ${ciano ? "bg-ciano" : "bg-accent"}`}
                />
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    ciano ? "bg-ciano-tint text-ciano-forte" : "bg-accent-tint text-accent-strong"
                  }`}
                >
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <p
                  className={`mt-5 text-2xs font-bold uppercase tracking-[0.14em] ${
                    ciano ? "text-ciano-forte" : "text-accent-strong"
                  }`}
                >
                  {selo}
                </p>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-primary">
                  {nome}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {promessa}
                </p>

                <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-4">
                  {itens.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <LinkSecao href={href}>{rotuloLink}</LinkSecao>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        {/* =================================================== por que confiar */}
        <section className="border-y border-border bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="revelar">
              <TituloSecao
                sobre="Por que a Novare pode falar a verdade"
                titulo={<>Quatro fatos, <span className="text-accent">não quatro adjetivos</span></>}
                apoio="Isenção não se declara, se demonstra pelo modelo de negócio. Estes são os quatro que sustentam tudo o que o app e a consultoria dizem."
              />
            </div>
            <div className="revelar-escada mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PILARES_CREDIBILIDADE.map((p, i) => (
                <Pilar key={p.titulo} {...p} tom={tomPor(i)} />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================== a conta */}
        <section className="border-y border-border bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="revelar grid gap-10 lg:grid-cols-2 lg:items-center [&>*]:min-w-0">
              <div>
                <TituloSecao
                  centro={false}
                  sobre="A conta, aberta"
                  titulo={<>O desconto sozinho <span className="text-accent">devolve o ano</span></>}
                  apoio={
                    <>
                      A assinatura custa {porAno} por ano. Como o assinante entra
                      com {ROTULO_DESCONTO} em qualquer consultoria da Novare,
                      basta{" "}
                      <strong className="text-foreground">
                        um único atendimento a partir de {limiarConsultoria}
                      </strong>{" "}
                      para o desconto cobrir a assinatura inteira do ano — e
                      todo o resto do Workspace vem por cima.
                    </>
                  }
                />
                {/* A conta na tela, linha por linha. Afirmar "se paga
                    sozinho" é barato; mostrar as três linhas deixa o leitor
                    conferir — e quem confere e vê que bate confia no resto. */}
                <div className="mt-6">
                  <ContaAberta
                    linhas={[
                      {
                        rotulo: "Assinatura por um ano",
                        valor: porAno,
                        obs: `${ASSINATURA_PRECO_ROTULO} × 12 meses`,
                      },
                      {
                        rotulo: "Desconto do assinante",
                        valor: ROTULO_DESCONTO,
                        obs: "em qualquer formato de consultoria",
                      },
                    ]}
                    resultado={{
                      rotulo: "Uma consultoria a partir de",
                      valor: limiarConsultoria,
                    }}
                  />
                </div>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Os formatos de consultoria são orçados caso a caso, porque
                  escopo de gente não cabe numa tabela. Por isso a conta mostra
                  o limiar, e não um preço que a casa não pratica.
                </p>
                <div className="mt-6">
                  <LinkSecao href="/consultoria">
                    Ver os formatos de consultoria
                  </LinkSecao>
                </div>
              </div>

              <ul className="revelar-escada grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 [&>li]:min-w-0">
                {CONSULTORIAS.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/consultoria/${item.slug}`}
                      className="glass-card flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-subtle"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-primary">
                          {item.nome}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.duracao}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent-tint px-2.5 py-1 text-2xs font-extrabold text-accent-strong">
                        {item.isIsca ? "Grátis" : ROTULO_DESCONTO}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ====================================================== comparativo */}
        <section className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <div className="revelar">
            <TituloSecao
              sobre="Sem assinatura × com assinatura"
              titulo={<>O que muda, <span className="text-accent">linha por linha</span></>}
              apoio={`Boa parte do Workspace continua aberta a todo mundo, sem login — são ${CONTAGEM.ferramentas} calculadoras que seguem gratuitas mesmo se você cancelar.`}
            />
          </div>

          <div className="revelar mt-12">
            <Comparativo
              linhas={COMPARATIVO}
              rotuloSem="Sem assinar"
              rotuloCom={ASSINATURA_NOME}
            />
          </div>

          <div className="revelar mt-8 flex justify-center">
            <BotaoAssinarPlano
              contexto="workspace"
              rotulo={`Começar ${ASSINATURA_TRIAL_DIAS} dias grátis`}
            />
          </div>
        </section>

        {/* =============================================== contra o tradicional */}
        <section className="border-y border-border bg-gelo">
          <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
            <div className="revelar">
              <TituloSecao
                sobre="O modelo, não o concorrente"
                titulo={<>De que lado da mesa está <span className="text-accent">quem te aconselha</span></>}
                apoio="A pergunta que decide tudo não é “qual produto?”, é “quem paga a pessoa que está me recomendando?”. Enquanto a resposta for “o produto”, a recomendação nasce contaminada."
              />
            </div>

            <div className="revelar mt-12">
              <Comparativo
                linhas={CONTRA_TRADICIONAL}
                rotuloSem="Quem vive de comissão"
                rotuloCom="Novare"
              />
            </div>

            <p className="revelar mt-5 text-center text-xs leading-relaxed text-muted-foreground">
              A coluna da esquerda descreve um modelo de remuneração, não uma
              empresa. Há gente séria trabalhando nele — o ponto é que o
              conflito existe por desenho, e não por má-fé de ninguém.
            </p>
          </div>
        </section>

        {/* ========================================================== sigilo */}
        <section className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <div className="revelar">
            <TituloSecao
              sobre="Seus dados"
              titulo={<>O que acontece com <span className="text-accent">o que você digita</span></>}
              apoio="Você vai colocar aqui renda, dívida e patrimônio. É justo saber para onde isso vai antes de digitar a primeira linha."
            />
          </div>

          <div className="revelar-escada mt-12 grid gap-5 lg:grid-cols-3">
            {SIGILO.map(({ icone: Icone, titulo, texto }, i) => (
              <article
                key={titulo}
                className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-subtle"
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 ${
                    tomPor(i) === "ciano" ? "bg-ciano" : "bg-accent"
                  }`}
                />
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    tomPor(i) === "ciano"
                      ? "bg-ciano-tint text-ciano-forte"
                      : "bg-accent-tint text-accent-strong"
                  }`}
                >
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-base font-semibold leading-snug text-primary">
                  {titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {texto}
                </p>
              </article>
            ))}
          </div>

          <div className="revelar mt-8 text-center">
            <LinkSecao href="/privacidade">Ler a política de privacidade</LinkSecao>
          </div>
        </section>

        {/* ========================================================= quem faz */}
        <section className="border-y border-border bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="revelar grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center [&>*]:min-w-0">
              <div className="overflow-hidden rounded-3xl border border-border">
                <Image
                  src="/marca/novare-site/socios-novare.jpg"
                  alt="Os sócios da Novare Consultoria de Investimentos"
                  width={720}
                  height={480}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <TituloSecao
                  centro={false}
                  sobre="Quem construiu isto"
                  titulo={<>Consultoria de verdade, <span className="text-accent">por trás do app</span></>}
                  apoio="A Novare é uma consultoria de investimentos que atende clientes de verdade, todo dia. O Workspace é a mesma metodologia escrita em software — por isso o app fala de reserva antes de falar de rentabilidade, e não indica produto nenhum."
                />
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Não recebemos comissão de corretora. Nosso lado da mesa é o seu.
                </p>

                <div className="mt-7 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <Image
                    src="/marca/novare-site/logo-nord.png"
                    alt="Nord Investimentos"
                    width={132}
                    height={36}
                    style={{ height: 30, width: "auto" }}
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Parceria oficial com a{" "}
                    <strong className="text-foreground">Nord Investimentos</strong> —
                    research independente para embasar as recomendações.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ preço */}
        <section className="bg-accent-tint">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
            <div className="revelar">
              <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent-strong">
                Uma assinatura só
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Um preço, sem letra miúda
              </h2>

              <div className="mt-8 flex items-end justify-center gap-2">
                <span className="preco-lustro font-display text-[3.25rem] font-black leading-none tabular-nums sm:text-7xl lg:text-8xl">
                  {ASSINATURA_PRECO_ROTULO}
                </span>
                <span className="pb-3 text-lg font-semibold text-muted-foreground">
                  /mês
                </span>
              </div>

              <p className="mt-4 text-base text-slate-600">
                Os primeiros {ASSINATURA_TRIAL_DIAS} dias não são cobrados. Se
                cancelar dentro do teste, não paga nada — e as calculadoras
                continuam abertas para você de qualquer jeito.
              </p>

              <div className="mt-9 flex flex-col items-center gap-4">
                <BotaoAssinarPlano
                  contexto="workspace"
                  tamanho="grande"
                  rotulo={`Começar ${ASSINATURA_TRIAL_DIAS} dias grátis`}
                />
                <a
                  href={falarNoWhatsApp(
                    `Olá! Tenho dúvidas sobre o ${ASSINATURA_NOME} antes de assinar.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Prefiro tirar uma dúvida antes
                </a>
              </div>

              <p className="mt-6 flex items-center justify-center gap-1.5 text-2xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Cancele quando quiser, sem multa e sem fidelidade.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
          <div className="revelar">
            <OQueSignifica
              titulo="Perguntas frequentes"
              itens={[
                {
                  pergunta: `Como funcionam os ${ASSINATURA_TRIAL_DIAS} dias grátis?`,
                  resposta: `Você cria a conta com e-mail e senha, sem cartão nenhum, e entra com tudo liberado na hora. A primeira cobrança de ${ASSINATURA_PRECO_ROTULO} só acontece quando o prazo vence — e se cancelar antes disso, ela não acontece.`,
                },
                {
                  pergunta: "A consultoria está incluída na assinatura?",
                  resposta: `Não. A consultoria particular é analisada caso a caso e cobrada à parte, porque cada situação tem um escopo diferente. O que a assinatura dá é ${ROTULO_DESCONTO} em qualquer formato que você contratar, enquanto ela estiver ativa.`,
                },
                {
                  pergunta: "Existe alguma versão mais cara, com mais coisas?",
                  resposta: `Não existe. É uma assinatura só, por ${ASSINATURA_PRECO_ROTULO}/mês, e ela libera tudo o que está no Workspace. Não há recurso escondido atrás de uma versão superior.`,
                },
                {
                  pergunta: "Preciso entender de investimento para usar?",
                  resposta:
                    "Não. A trilha pergunta em português simples quanto entra e quanto sai, e o app faz as contas. O objetivo é justamente tirar de você a parte que exige planilha.",
                },
                {
                  pergunta: "Vocês indicam onde investir?",
                  resposta:
                    "O app não indica produto, corretora ou ativo — ele trabalha com classes de ativo e com a ordem certa das coisas: reserva antes de risco, dívida cara antes de investimento. Recomendação personalizada é trabalho da consultoria, com um profissional analisando o seu caso.",
                },
                {
                  pergunta: "Que projeções o app usa?",
                  resposta:
                    "Retorno real de 5% ao ano, já descontada a inflação, e a regra dos 4% para calcular a renda que um patrimônio sustenta para sempre. São premissas conservadoras e ficam escritas na tela: prometer 12% acima da inflação seria vender ilusão.",
                },
                {
                  pergunta: "Meus dados financeiros ficam seguros?",
                  resposta:
                    "Seus dados ficam na sua conta, sob a LGPD, e só você os enxerga. O extrato que você cola na Íris é processado para gerar a leitura e não vira base de venda para ninguém. A política de privacidade detalha cada tratamento e cada suboperador.",
                },
                {
                  pergunta: "E se eu cancelar? Perco tudo?",
                  resposta:
                    "A cobrança para, sem multa e sem fidelidade. As calculadoras e o Novare News continuam abertos para você. Os dados do seu planejamento permanecem na sua conta — se voltar, estão lá do jeito que você deixou.",
                },
              ]}
            />
          </div>
        </section>

        {/* =========================================================== fecho */}
        <section className="palco-vivo relative overflow-hidden text-white" style={PALCO}>
          <div className="revelar relative mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-3 py-1.5 text-2xs font-bold uppercase tracking-wider">
              <Rocket className="h-3.5 w-3.5 text-accent-claro" />
              Comece hoje, decida depois
            </span>

            <h2 className="mt-5 font-display text-[1.75rem] font-black leading-tight tracking-tight sm:text-4xl">
              Tudo o que a Novare construiu,
              <br />
              <span className="text-accent-claro">por {porDia} por dia</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80">
              Planejamento Financeiro completo, a Íris, as ferramentas e{" "}
              {ROTULO_DESCONTO} na consultoria. São {ASSINATURA_TRIAL_DIAS} dias
              sem pagar nada e sem cartão.
            </p>

            <div className="mt-9 flex justify-center">
              <BotaoAssinarPlano
                contexto="workspace"
                variante="clara"
                tamanho="grande"
                rotulo={`Começar ${ASSINATURA_TRIAL_DIAS} dias grátis`}
              />
            </div>

            <p className="mt-5 text-xs text-white/55">
              Cancele quando quiser, sem multa e sem fidelidade.
            </p>
          </div>
        </section>
      </main>

      <RodapeNovare />
    </div>
  );
}
