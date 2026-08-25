import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  ChartLine,
  Check,
  Compass,
  Gauge,
  Gift,
  Handshake,
  Lock,
  MessageCircle,
  Milestone,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CalculadoraMarcoHorizonte } from "@/components/CalculadoraMarcoHorizonte";
import { OQueSignifica } from "@/components/OQueSignifica";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import {
  PLANO_INCLUI,
  PLANO_OFERTA,
  PLANO_PRECO_ROTULO,
  PLANO_TRIAL_DIAS,
} from "@/lib/planejamento/oferta";
import { ASSINATURA_NOME } from "@/lib/assinatura";
import { ROTULO_DESCONTO } from "@/lib/consultoria";
import { falarNoWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Planejamento Financeiro — seus objetivos viram um número só",
  description:
    `O Marco Horizonte é o patrimônio que sustenta a renda que você quer, para sempre. Calcule o seu de graça e teste por ${PLANO_TRIAL_DIAS} dias sem pagar nada — depois ${PLANO_PRECO_ROTULO} ao mês, com a Íris e o desconto na consultoria inclusos.`,
};

/**
 * O navy da marca com as duas luzes do Hub — o mesmo espírito do
 * `.palco-iris`, porém sem a varredura animada: ali ela dura um instante,
 * aqui o fundo fica na tela o tempo todo e piscar viraria distração.
 */
const PALCO_NAVY: React.CSSProperties = {
  background: [
    "radial-gradient(42rem 24rem at 84% -14%, hsl(16 85% 55% / 0.32), transparent 62%)",
    "radial-gradient(34rem 22rem at 2% 106%, hsl(205 85% 55% / 0.24), transparent 60%)",
    "linear-gradient(155deg, hsl(215 50% 17%) 0%, hsl(215 55% 10%) 100%)",
  ].join(","),
};

/** As três etapas da conta que gera o número. Nada de caixa-preta. */
const CONTA = [
  {
    rotulo: "A renda que você quer receber",
    detalhe: "Por mês, em valores de hoje.",
  },
  {
    rotulo: "× 12 vira a renda de um ano",
    detalhe: "É o que o patrimônio precisa pagar todo ano.",
  },
  {
    rotulo: "÷ 4% vira o seu Marco Horizonte",
    detalhe: "A taxa de retirada que faz a renda durar a vida toda.",
  },
];

/** Por que plano de vida sem número não sai do papel. */
const PROBLEMAS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Milestone,
    titulo: "Objetivo sem número é só desejo",
    texto:
      "“Quero me aposentar bem” não cabe numa conta. Sem um alvo em reais, não existe jeito de saber se você está adiantado, no ritmo ou ficando para trás.",
  },
  {
    icone: Gauge,
    titulo: "Guardar todo mês não é guardar o bastante",
    texto:
      "Aporte constante tranquiliza, mas só a projeção dos anos que faltam mostra se ele chega lá. A diferença entre os dois costuma aparecer tarde demais.",
  },
  {
    icone: TrendingDown,
    titulo: "Plano que ninguém revisa envelhece",
    texto:
      "Salário muda, família cresce, o juro real do país cai. Um plano feito uma vez e esquecido decide o seu futuro com dados que já não valem.",
  },
];

/** Do sonho ao acompanhamento: o caminho inteiro, em quatro passos. */
const PASSOS: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Compass,
    titulo: "Você diz onde quer chegar",
    texto:
      "A renda que quer receber, a idade em que quer parar de depender do salário, o que já tem investido e quanto consegue guardar por mês.",
  },
  {
    icone: Target,
    titulo: "Aparece o seu Marco Horizonte",
    texto:
      "O patrimônio que sustenta essa renda para sempre — e quanto do caminho você já andou, mantendo exatamente o ritmo de hoje.",
  },
  {
    icone: Route,
    titulo: "Um consultor desenha o caminho",
    texto:
      "Aporte que cabe no seu mês, prazo realista e alocação coerente com o tempo que você tem. Ano a ano, não só o número final.",
  },
  {
    icone: RefreshCw,
    titulo: "A rota é recalculada",
    texto:
      "Mudou o salário, nasceu um filho, virou o ciclo de juros? O plano é revisado com você, para continuar valendo no mundo real.",
  },
];

/** Um ícone para cada linha de `PLANO_INCLUI`, na mesma ordem. */
const ICONES_INCLUI: LucideIcon[] = [
  Sparkles, // 7 dias grátis
  Target, // Marco Horizonte
  ChartLine, // projeção ano a ano
  Wallet, // plano de aportes
  Gift, // Íris de brinde
  ShieldCheck, // cancele quando quiser
];

/** O que a calculadora entrega sem cobrar nada — e continua entregando. */
const GRATIS = [
  "Seu Marco Horizonte estimado na hora",
  "Quanto do alvo você alcança no ritmo atual",
  "A conta explicada: regra dos 4% e retorno real",
  "Resumo do seu caso pelo WhatsApp",
];

/**
 * O que só existe com a assinatura.
 *
 * ⚠️ Assinar este app É assinar o Workspace: a mesma mensalidade libera a Íris,
 * as ferramentas e o desconto na consultoria. Omitir isso aqui faria a página
 * vender menos do que a casa entrega — e faria duas páginas prometerem coisas
 * diferentes pelo mesmo preço.
 */
const SO_NO_PRO = [
  "Seu plano salvo, revisado e acompanhado mês a mês",
  "Projeção ano a ano até a independência",
  "Plano de aportes que cabe no seu mês",
  "Relatório completo em PDF, quando quiser",
  `A Íris incluída: a IA que acha o dinheiro que some`,
  `${ROTULO_DESCONTO} na consultoria particular da Novare`,
];

/** Os selos de confiança — só o que é verdade sobre a Novare. */
const SELOS: { icone: LucideIcon; texto: string }[] = [
  { icone: ShieldCheck, texto: "Consultoria independente" },
  { icone: BadgeCheck, texto: "Sem comissão de corretora" },
  { icone: Sparkles, texto: "Consultor CFP® dedicado" },
  { icone: Handshake, texto: "Parceira da Nord Investimentos" },
];

export default function VidaPlanPage() {
  return (
    <div className="aurora-clara min-h-dvh bg-gradient-to-b from-muted/50 via-background to-background">
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
        <section
          className="relative isolate overflow-hidden text-white"
          style={PALCO_NAVY}
        >
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_minmax(0,19rem)] lg:items-center">
              {/* Manchete */}
              <div className="surgir">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-white">
                  <Sparkles className="h-3.5 w-3.5 text-accent-claro" />
                  Planejamento Financeiro · Produto PRO
                </span>

                <h1 className="mt-5 font-display text-[1.75rem] font-extrabold leading-[1.12] tracking-tight sm:text-[2.4rem] lg:text-[2.75rem]">
                  Seus objetivos viram{" "}
                  <span className="text-accent-claro">um número só</span>.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">
                  Casa própria, faculdade dos filhos, parar de depender do
                  salário: cada objetivo tem um preço. O app junta todos
                  eles em um único alvo de patrimônio — o seu{" "}
                  <strong className="font-semibold text-white">
                    Marco Horizonte
                  </strong>{" "}
                  — mostra a que distância você está dele hoje e desenha o
                  caminho até lá, com um consultor da Novare do seu lado.
                </p>

                {/* A oferta lidera pelo teste: o preço vem depois, como
                    consequência, não como barreira de entrada. */}
                <div className="mt-7 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="font-display text-3xl font-black leading-none tabular-nums sm:text-4xl">
                    {PLANO_TRIAL_DIAS} dias grátis
                  </span>
                  <span className="text-sm text-white/70">
                    depois {PLANO_PRECO_ROTULO}/mês · cancele quando quiser
                  </span>
                </div>

                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.12] px-2.5 py-1.5 text-xs font-bold">
                  <Gift className="h-3.5 w-3.5 text-accent-claro" />
                  Uma assinatura, tudo liberado
                </p>

                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                  <BotaoAssinarPlano variante="clara" />
                  <a
                    href="#calcular"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <ArrowDown className="h-4 w-4" />
                    Calcular meu número de graça
                  </a>
                </div>

                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
                  {["Sem comissão de corretora", "Sem fidelidade", "Dados sob a LGPD"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 shrink-0 text-accent-claro" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* A conta, aberta — quem entende de onde o número sai confia
                  nele, e é esse número que a página inteira vende. */}
              <aside
                className="surgir rounded-3xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6"
                style={{ animationDelay: "120ms" }}
              >
                <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent-claro">
                  A conta, sem mistério
                </p>

                <ol className="mt-4 space-y-4">
                  {CONTA.map((etapa, i) => (
                    <li key={etapa.rotulo} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-2xs font-black tabular-nums">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">
                          {etapa.rotulo}
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-white/65">
                          {etapa.detalhe}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-relaxed text-white/75">
                  Na prática, uma renda de{" "}
                  <strong className="font-semibold text-white">
                    R$ 8.000 por mês
                  </strong>{" "}
                  pede um Marco Horizonte de{" "}
                  <strong className="font-semibold text-white">
                    R$ 2,4 milhões
                  </strong>
                  .
                </p>
              </aside>
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
          {/* ========================================= 3. O PROBLEMA ==== */}
          <section className="pt-14 sm:pt-20">
            <h2 className="titulo-secao text-xl sm:text-2xl">
              Por que a maioria dos planos morre na gaveta
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              Não é falta de disciplina. É falta de número: sem um alvo claro,
              qualquer decisão vira palpite e qualquer imprevisto vira desculpa
              para recomeçar do zero.
            </p>

            {/* O `surgir` fica no invólucro, não no card: as duas animações
                mexem em `transform`, e a de entrada venceria o hover. */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {PROBLEMAS.map((p, i) => (
                <div
                  key={p.titulo}
                  className="surgir"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <article className="glass-card h-full rounded-2xl border border-border bg-card p-5 shadow-subtle">
                    <span className="tile-cine flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <p.icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 font-display text-base font-bold text-primary">
                      {p.titulo}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {p.texto}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================= 4. A CALCULADORA === */}
          <section id="calcular" className="scroll-mt-20 pt-14 sm:pt-20">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="titulo-secao text-xl sm:text-2xl">
                  Descubra o seu número agora, de graça
                </h2>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                  Cinco campos, resposta imediata e sem cadastro para calcular.
                  A conta roda no seu navegador.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-success-strong">
                <Check className="h-3.5 w-3.5" />
                Grátis, sem limite de uso
              </span>
            </div>

            <div className="mt-6">
              <CalculadoraMarcoHorizonte />
            </div>
          </section>

          {/* ====================================== 5. COMO FUNCIONA ==== */}
          <section className="pt-14 sm:pt-20">
            <h2 className="titulo-secao text-xl sm:text-2xl">
              Como funciona a assinatura
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              A calculadora dá a fotografia. O app é o filme — do primeiro
              número até a revisão que mantém o plano de pé.
            </p>

            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((passo, i) => (
                <li
                  key={passo.titulo}
                  className="glass-card rounded-2xl border border-border bg-card p-5 shadow-subtle"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="tile-cine flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                      <passo.icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-2xs font-black uppercase tracking-[0.14em] text-accent-strong">
                      Passo {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-primary">
                    {passo.titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* =============================== 6. O QUE VEM NA ASSINATURA = */}
          <section className="pt-14 sm:pt-20">
            <h2 className="titulo-secao text-xl sm:text-2xl">
              O que vem na assinatura
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              São {PLANO_TRIAL_DIAS} dias para testar sem pagar nada. Depois,{" "}
              {PLANO_PRECO_ROTULO} ao mês — sem taxa de entrada e sem
              fidelidade.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PLANO_INCLUI.map((item, i) => {
                const Icone = ICONES_INCLUI[i] ?? Check;
                return (
                  <div
                    key={item}
                    className="glass-card flex items-start gap-3 rounded-2xl border border-accent-soft/60 bg-accent-tint p-5"
                  >
                    <span className="tile-cine flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-btn text-white">
                      <Icone className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <p className="text-sm font-semibold leading-snug text-primary">
                      {item}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================= 7. GRÁTIS × PRO == */}
          <section className="pt-14 sm:pt-20">
            <h2 className="titulo-secao text-xl sm:text-2xl">
              O que é grátis e o que é do plano
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              A comparação honesta, para você assinar sabendo exatamente o que
              muda.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Grátis */}
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-primary">
                    Calculadora
                  </h3>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-2xs font-black uppercase tracking-wider text-muted-foreground">
                    Grátis
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Uma fotografia do seu caso, na hora.
                </p>

                <ul className="mt-5 space-y-2.5">
                  {GRATIS.map((linha) => (
                    <li
                      key={linha}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{linha}</span>
                    </li>
                  ))}
                  {SO_NO_PRO.slice(0, 3).map((linha) => (
                    <li
                      key={linha}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{linha}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  O grátis continua grátis: a calculadora não expira, não pede
                  cartão e não trava depois de alguns usos.
                </p>
              </div>

              {/* PRO */}
              <div
                className="relative overflow-hidden rounded-3xl border border-accent-soft bg-card p-6 ring-1 ring-accent-soft"
                style={{
                  backgroundImage:
                    "radial-gradient(26rem 14rem at 100% -10%, hsl(16 90% 92% / 0.9), transparent 62%)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-primary">
                    Planejamento Financeiro
                  </h3>
                  <span className="rounded-md bg-accent-btn px-2 py-0.5 text-2xs font-black uppercase tracking-wider text-white">
                    PRO
                  </span>
                  <span className="text-sm font-bold text-accent-strong">
                    {PLANO_OFERTA}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  O filme completo, com gente acompanhando.
                </p>

                <ul className="mt-5 space-y-2.5">
                  <li className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>Tudo o que a calculadora já faz</span>
                  </li>
                  {SO_NO_PRO.map((linha) => (
                    <li
                      key={linha}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{linha}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <BotaoAssinarPlano />
                </div>
              </div>
            </div>
          </section>

          {/* ======================================= 8. CREDIBILIDADE === */}
          <section className="pt-14 sm:pt-20">
            <h2 className="titulo-secao text-xl sm:text-2xl">
              Quem faz o seu plano
            </h2>

            <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card sm:flex sm:items-stretch">
              <div className="relative aspect-[16/10] w-full sm:aspect-auto sm:w-[38%] sm:shrink-0">
                <Image
                  src="/marca/novare-site/socios-novare.jpg"
                  alt="Sócios e consultores da Novare"
                  fill
                  sizes="(max-width: 640px) 100vw, 380px"
                  className="object-cover"
                />
              </div>

              <div className="p-6 sm:flex-1 sm:p-8">
                <h3 className="font-display text-lg font-bold text-primary">
                  Consultoria independente, sem comissão de corretora
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  A Novare não vende produto de banco e não recebe comissão por
                  onde o seu dinheiro é alocado. O plano é feito por consultor
                  CFP® — a certificação de planejamento financeiro — e o único
                  pagamento que existe na relação é o seu, transparente, na
                  assinatura.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Parceiro oficial
                    </p>
                    <div className="mt-1.5 inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1.5">
                      <Image
                        src="/marca/novare-site/logo-nord.png"
                        alt="Nord Investimentos"
                        width={96}
                        height={30}
                        className="h-5 w-auto"
                      />
                    </div>
                  </div>
                  <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                    Parceria com a Nord Investimentos na consultoria de
                    investimentos da casa.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================== 9. PREÇO ==== */}
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

              <div className="relative grid gap-7 md:grid-cols-[1fr_minmax(0,16rem)] md:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-btn px-2.5 py-1 text-2xs font-black uppercase tracking-wider text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    Único produto pago do Workspace
                  </span>

                  <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
                    <span className="whitespace-nowrap tabular-nums text-accent-strong">
                      {PLANO_TRIAL_DIAS} dias grátis
                    </span>
                    . Depois,{" "}
                    <span className="whitespace-nowrap tabular-nums">
                      {PLANO_PRECO_ROTULO}
                    </span>{" "}
                    ao mês.
                  </h2>

                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    É a assinatura do {ASSINATURA_NOME}: a mesma mensalidade
                    libera este app, a Íris, todas as ferramentas e{" "}
                    {ROTULO_DESCONTO} na consultoria particular. Sem taxa de
                    entrada, sem fidelidade e sem comissão embutida em produto
                    nenhum.
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                    {["Cancele quando quiser, sem multa", "A Íris incluída", `${ROTULO_DESCONTO} na consultoria`].map(
                      (linha) => (
                        <li
                          key={linha}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                          {linha}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="flex flex-col gap-2.5">
                  <BotaoAssinarPlano />
                  <a
                    href={falarNoWhatsApp(
                      "Olá! Tenho dúvidas sobre o App Novare Planejamento Financeiro antes de assinar.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-soft bg-card px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent-tint"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Falar com um consultor
                  </a>
                  <p className="flex items-center justify-center gap-1.5 text-2xs text-muted-foreground">
                    <Lock className="h-3 w-3 shrink-0" />
                    Sem cobrança nos primeiros {PLANO_TRIAL_DIAS} dias.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================== 10. PERGUNTAS FREQUENTES ==== */}
          <section className="pt-14 sm:pt-20">
            <OQueSignifica
              titulo="Perguntas frequentes"
              itens={[
                {
                  pergunta: "O que é o Marco Horizonte?",
                  resposta:
                    "É o patrimônio que sustenta a renda que você quer receber, para sempre, sem depender de salário. É o seu número de independência financeira — a partir dele, trabalhar vira escolha.",
                },
                {
                  pergunta: "Como esse número é calculado?",
                  resposta:
                    "Pela regra dos 4%: a cada ano você retira 4% do patrimônio, e o restante continua investido rendendo acima da inflação. Na prática, o alvo é 25 vezes a renda que você quer por ano — R$ 8.000 por mês pedem R$ 2,4 milhões.",
                },
                {
                  pergunta: "Por que a projeção usa 5% ao ano?",
                  resposta:
                    "É uma estimativa conservadora de retorno REAL, já descontada a inflação. Uma carteira equilibrada de longo prazo costuma ficar nessa faixa. Trabalhamos com o pé no chão: prometer 12% ao ano em cima da inflação seria vender ilusão.",
                },
                {
                  pergunta: "Cheguei em 40%. Isso é ruim?",
                  resposta:
                    "Não. O percentual mostra onde você chega mantendo exatamente o ritmo de hoje — ele não conta aumento de renda, herança, venda de bem nem melhora nos aportes. Serve para responder uma pergunta: o ritmo atual basta? Se não bastar, dá para ajustar aporte, prazo ou renda-alvo.",
                },
                {
                  pergunta: `Como funcionam os ${PLANO_TRIAL_DIAS} dias grátis?`,
                  resposta: `Você entra no plano completo na hora e não paga nada nos primeiros ${PLANO_TRIAL_DIAS} dias. A primeira cobrança de ${PLANO_PRECO_ROTULO} só acontece quando o prazo vence — e se você cancelar antes disso, ela não acontece.`,
                },
                {
                  pergunta: `O que eu recebo pagando ${PLANO_PRECO_ROTULO} por mês?`,
                  resposta:
                    `Tudo. Assinar este app é assinar o ${ASSINATURA_NOME}: você leva o planejamento completo (retrato, diagnóstico, plano de ação, acompanhamento mensal e relatório em PDF), a Íris sem custo adicional, todas as ferramentas da casa e ${ROTULO_DESCONTO} na consultoria particular. Não existe plano mais caro com mais coisas — é uma assinatura só.`,
                },
                {
                  pergunta: "Preciso já ter dinheiro investido para assinar?",
                  resposta:
                    "Não. Quem está começando é justamente quem mais ganha em ter um alvo definido e um aporte calculado — o plano trabalha com a realidade do seu orçamento, não com um patrimônio mínimo.",
                },
                {
                  pergunta: "A Novare vende produto de banco ou de corretora?",
                  resposta:
                    "Não. A Novare é uma consultoria independente e não recebe comissão pela alocação do seu dinheiro. A recomendação é feita pelo que serve ao seu plano, e a única receita nessa relação é a sua assinatura.",
                },
                {
                  pergunta: "Como faço para cancelar?",
                  resposta: `É só avisar a gente: a cobrança para, sem multa e sem fidelidade. Cancelando dentro dos ${PLANO_TRIAL_DIAS} dias de teste, você não paga nada. E a calculadora gratuita continua aberta para você de qualquer jeito.`,
                },
                {
                  pergunta: "E os meus dados?",
                  resposta:
                    "A conta da calculadora acontece no seu navegador. Só o que você digitar nos campos de contato é enviado para a Novare, e apenas para um consultor falar com você. Os detalhes estão na Política de Privacidade.",
                },
              ]}
            />
          </section>

          {/* ========================================= 11. CTA FINAL ==== */}
          <section className="pt-14 sm:pt-20">
            <div
              className="relative isolate overflow-hidden rounded-3xl p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-10"
              style={PALCO_NAVY}
            >
              <div className="space-y-3">
                <h2 className="max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  Pare de estimar. Comece a mirar.
                </h2>
                <p className="max-w-lg text-sm leading-relaxed text-white/75">
                  Calcule o seu Marco Horizonte agora, de graça. E quando quiser
                  o caminho inteiro — ano a ano, revisado por um consultor da
                  Novare — são {PLANO_OFERTA}, com tudo liberado e sem
                  fidelidade nenhuma.
                </p>
              </div>

              <div className="mt-6 flex shrink-0 flex-col gap-2.5 sm:mt-0 sm:w-64">
                <BotaoAssinarPlano variante="clara" />
                <a
                  href="#calcular"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <ArrowRight className="h-4 w-4" />
                  Calcular de graça antes
                </a>
                <p className="text-center text-2xs text-white/70">
                  Os primeiros {PLANO_TRIAL_DIAS} dias não são cobrados.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <RodapeNovare />
    </div>
  );
}
