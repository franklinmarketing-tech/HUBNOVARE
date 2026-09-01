import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgePercent,
  Bot,
  Check,
  ClipboardList,
  CreditCard,
  FileSearch,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { BarraAssinarFixa } from "@/components/BarraAssinarFixa";
import { TituloCine } from "@/components/TituloCine";
import { CenaParallax } from "@/components/CenaParallax";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { Etapa, Pilar, tomPor } from "@/components/SecoesVenda";
import {
  ASSINATURA_NOME,
  ASSINATURA_PRECO,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import { ROTULO_DESCONTO } from "@/lib/consultoria";
import { falarNoWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: `${ASSINATURA_NOME} — sua vida financeira inteira, num lugar só`,
  description: `O 1º hub financeiro do Brasil: plano financeiro, IA que lê seu extrato, calculadoras e consultores CFP® por ${ASSINATURA_PRECO_ROTULO}/mês. ${ASSINATURA_TRIAL_DIAS} dias grátis, sem cartão.`,
  alternates: { canonical: "/assinar" },
  openGraph: {
    title: `${ASSINATURA_NOME} — sua vida financeira inteira, num lugar só`,
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

/** Fundo navy chapado das seções escuras intercaladas. */
const NAVY: React.CSSProperties = {
  background: "linear-gradient(140deg, hsl(216 54% 14%) 0%, hsl(219 58% 10%) 100%)",
};

/**
 * A landing de venda no formato de tráfego pago: uma coluna, leitura
 * vertical, blocos escuros e claros alternados, e um CTA em cada dobra.
 *
 * REGRA DESTA PÁGINA: nada aqui é fabricado para vender. Sem depoimento
 * (a casa não publicou nenhum), sem preço "de/por" (não existe preço cheio
 * de referência) e sem contador regressivo (a assinatura é recorrente e não
 * tem vaga limitada). A urgência que a página usa é a real — os
 * 7 dias grátis sem cartão. Numa casa que vende confiança financeira, o
 * truque de conversão custa mais caro do que rende.
 */

/** A dor, dita como a pessoa diz para si mesma. */
const SINTOMAS = [
  {
    icone: Receipt,
    texto: "O mês acaba antes do dinheiro e você não sabe explicar onde foi.",
  },
  {
    icone: FileSearch,
    texto: "Você paga assinatura que esqueceu e tarifa que nem sabia que existia.",
  },
  {
    icone: ClipboardList,
    texto: "Já começou três planilhas. Nenhuma sobreviveu ao segundo mês.",
  },
  {
    icone: TrendingUp,
    texto: "Quer investir, mas ninguém te diz quanto dá para guardar sem apertar.",
  },
];

/** O antes e o depois, frase contra frase. */
const VIRADA = [
  {
    antes: "Você olha o extrato e não entende para onde foi.",
    depois: "A Íris lê o extrato e aponta cada tarifa, juro e assinatura.",
  },
  {
    antes: "Seus objetivos são um desejo vago, sem prazo.",
    depois: "Cada objetivo vira um valor por mês e uma data.",
  },
  {
    antes: "Fechar o mês é uma planilha que você abandona.",
    depois: "O app fecha o mês e mostra sua evolução sozinho.",
  },
  {
    antes: "Quem te orienta ganha comissão do que te vende.",
    depois: `Consultor CFP® com ${ROTULO_DESCONTO} e comissão zero.`,
  },
];

/** O caminho, em quatro passos curtos: o medo real é o do trabalho. */
const PASSOS = [
  {
    icone: CreditCard,
    titulo: "Crie a conta em 1 minuto",
    texto: "E-mail e senha. Nenhum cartão é pedido para começar o teste.",
  },
  {
    icone: ClipboardList,
    titulo: "Responda 8 perguntas",
    texto: "Em português simples, sobre quanto entra e quanto sai. Leva 10 minutos.",
  },
  {
    icone: Target,
    titulo: "Receba seu plano",
    texto: "Nota de saúde financeira, seus objetivos em um número e um prazo.",
  },
  {
    icone: Bot,
    titulo: "Cole seu extrato",
    texto: "A Íris mostra as tarifas, juros e assinaturas que somem com seu dinheiro.",
  },
];

/** O pacote, item a item — o formato "o que você recebe". */
const PACOTE = [
  {
    icone: Target,
    nome: "Planejamento Financeiro completo",
    texto:
      "Diagnóstico, nota de saúde financeira, plano de ação com valor e prazo, e relatório em PDF que é seu.",
  },
  {
    icone: Bot,
    nome: "Íris, a IA que lê seu extrato",
    texto:
      "Cole o extrato do banco e ela acha assinatura esquecida, tarifa repetida e juro escondido.",
  },
  {
    icone: ClipboardList,
    nome: "Todas as ferramentas liberadas",
    texto:
      "As 22 calculadoras e simuladores da casa, das trabalhistas às de investimento.",
  },
  {
    icone: BadgePercent,
    nome: `${ROTULO_DESCONTO} na consultoria particular`,
    texto:
      "Consultores certificados CFP®, sem comissão de banco. Válido enquanto a assinatura estiver ativa.",
  },
];

/** Por que confiar. SÓ o que a casa comprova. */
const CONFIANCA = [
  {
    destaque: "Nord",
    titulo: "Parceria com a Nord Research",
    texto:
      "A consultoria de investimentos une o método da Novare à análise independente da Nord.",
  },
  {
    destaque: "CFP®",
    titulo: "Consultores certificados",
    texto:
      "O padrão internacional de planejamento financeiro pessoal, do outro lado da mesa.",
  },
  {
    destaque: "0%",
    titulo: "Nenhuma comissão",
    texto:
      "A Novare não recebe de banco, corretora ou seguradora. É você quem paga — é para você que a gente trabalha.",
  },
  {
    destaque: "LGPD",
    titulo: "Seu extrato não sai do navegador",
    texto:
      "Nada aqui se conecta à sua conta. Você cola o extrato e a leitura acontece no seu dispositivo.",
  },
];

const SELOS = [
  { icone: CreditCard, texto: "Sem cartão para testar" },
  { icone: Lock, texto: "Cancele quando quiser" },
  { icone: ShieldCheck, texto: "Consultoria CFP®" },
  { icone: Wallet, texto: "Sem comissão de corretora" },
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const INCLUI = [
  `${ASSINATURA_TRIAL_DIAS} dias grátis, sem cartão`,
  "Planejamento Financeiro completo",
  "Íris, a IA que lê seu extrato",
  "Todas as ferramentas e calculadoras",
  `${ROTULO_DESCONTO} na consultoria particular`,
  "Novare News e indicadores ao vivo",
  "Cancele quando quiser, sem multa",
];

/* -------------------------------------------------------------------------- */

export default function AssinarPage() {
  const porDia = brl(ASSINATURA_PRECO / 30);

  return (
    <div className="min-h-dvh bg-background">
      <RevelarAoRolar />
      <BarraAssinarFixa />

      <Cabecalho
        direita={
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar ao início
          </Link>
        }
      />

      <main>
        {/* ============================================= 1. HERO DE IMPACTO */}
        <section
          className="palco-vivo cine-grade relative overflow-hidden text-white"
          style={PALCO}
        >
          <div className="relative mx-auto max-w-5xl px-5 py-16 text-center sm:py-20 lg:py-24">
            <span className="cine inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-3 py-1.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-ciano-claro" />
              O 1º hub financeiro do Brasil
            </span>

            {/* A headline ocupa a dobra inteira: em tráfego pago, quem chega
                decide em três segundos se continua lendo. Entra palavra por
                palavra — ver TituloCine. */}
            <TituloCine
              texto="Descubra para onde vai seu dinheiro"
              destaque="em 10 minutos"
              className="mx-auto mt-6 max-w-4xl font-display text-[2.6rem] font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.2rem]"
            />

            <p className="cine mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Seu plano financeiro completo, a IA que lê seu extrato e todas as
              calculadoras por {ASSINATURA_PRECO_ROTULO} por mês. Comece hoje
              sem pagar nada.
            </p>

            <div className="cine mt-9 flex flex-col items-center gap-4">
              <BotaoAssinarPlano
                contexto="workspace"
                tamanho="grande"
                destaque
                direto
                rotulo={`Começar meus ${ASSINATURA_TRIAL_DIAS} dias grátis`}
              />
              <p className="text-sm text-white/60">
                Sem cartão de crédito · cancele quando quiser
              </p>
            </div>

            {/* O app de verdade na moldura de navegador. Sangra para baixo:
                sugere que tem mais produto além da dobra. */}
            <CenaParallax intensidade={-34} className="mx-auto mt-14 max-w-3xl">
              <div className="cine moldura-produto cine-reflexo relative overflow-hidden rounded-t-2xl border border-white/15 border-b-0 bg-white/[0.06] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                <div className="flex h-8 items-center gap-1.5 bg-white/10 pl-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                </div>
                {/* O print é um recorte e corta um botão ao meio na borda
                    direita. O fade transforma o corte seco em "continua além
                    da moldura", que é o que a janela já sugere. */}
                <div className="relative">
                  <Image
                    src="/demo/poster-app.jpg"
                    alt="Tela de diagnóstico do Planejamento Financeiro da Novare"
                    width={1140}
                    height={642}
                    priority
                    className="block w-full"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-16"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, hsl(216 58% 11% / 0.55))",
                    }}
                  />
                </div>
              </div>
            </CenaParallax>
          </div>

          {/* Faixa de credibilidade fechando a dobra. */}
          <div className="relative border-t border-white/10 bg-black/15">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4">
              <span className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-white/45">
                Parceria oficial
                <Image
                  src="/marca/novare-site/logo-nord.png"
                  alt="Nord Investimentos"
                  width={72}
                  height={23}
                  style={{ height: 16, width: "auto" }}
                />
              </span>
              {SELOS.map(({ icone: Icone, texto }) => (
                <span
                  key={texto}
                  className="flex items-center gap-1.5 text-2xs font-semibold text-white/55"
                >
                  <Icone className="h-3.5 w-3.5 text-white/40" />
                  {texto}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= 2. A DOR */}
        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:py-20">
            <p className="cine text-2xs font-bold uppercase tracking-[0.18em] text-accent-strong">
              Se você se reconhecer aqui
            </p>
            <h2 className="cine mx-auto mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-[2.8rem]">
              O problema quase nunca é o quanto você ganha.{" "}
              <span className="text-accent-strong">É não enxergar.</span>
            </h2>
            <p className="cine mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Ninguém organiza o que não consegue ver. É por isso que a planilha
              morre no segundo mês — ela cobra trabalho e não devolve resposta.
            </p>

            <ul className="revelar-escada mt-10 grid gap-3 text-left sm:grid-cols-2">
              {SINTOMAS.map(({ icone: Icone, texto }) => (
                <li
                  key={texto}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                    <Icone className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===================================================== 3. A VIRADA */}
        <section className="relative overflow-hidden text-white" style={NAVY}>
          <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-accent-claro">
                O que muda
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                De onde você está para onde dá para chegar
              </h2>
            </div>

            <ul className="revelar-escada mt-10 space-y-3">
              {VIRADA.map(({ antes, depois }) => (
                <li
                  key={antes}
                  className="grid items-stretch gap-3 sm:grid-cols-2"
                >
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                    <p className="text-sm leading-relaxed text-white/55 line-through decoration-white/25">
                      {antes}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-ciano/25 bg-ciano/10 p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ciano-claro" />
                    <p className="text-sm font-medium leading-relaxed text-white">
                      {depois}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="revelar mt-10 flex justify-center">
              <BotaoAssinarPlano
                contexto="workspace"
                variante="clara"
                direto
                rotulo="Quero virar esse jogo"
              />
            </div>
          </div>
        </section>

        {/* =============================================== 4. COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-16 bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-accent-strong">
                Do zero ao plano
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                Quatro passos, menos de 15 minutos
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                Sem instalar nada, sem conectar seu banco e sem precisar
                entender de investimento.
              </p>
            </div>

            <ol className="revelar-escada mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map(({ icone, titulo, texto }, i) => (
                <Etapa
                  key={titulo}
                  numero={i + 1}
                  total={PASSOS.length}
                  titulo={titulo}
                  texto={texto}
                  icone={icone}
                />
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================ 5. O QUE VOCÊ RECEBE */}
        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-accent-strong">
                Tudo numa assinatura só
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                O que você recebe hoje
              </h2>
            </div>

            <ul className="revelar-escada mt-10 space-y-3">
              {PACOTE.map(({ icone: Icone, nome, texto }, i) => {
                const ciano = tomPor(i) === "ciano";
                return (
                  <li
                    key={nome}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        ciano
                          ? "bg-ciano-tint text-ciano-forte"
                          : "bg-accent-tint text-accent-strong"
                      }`}
                    >
                      <Icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold leading-snug text-primary">
                        {nome}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {texto}
                      </p>
                    </div>
                    <Check className="ml-auto mt-1 hidden h-5 w-5 shrink-0 text-success sm:block" />
                  </li>
                );
              })}
            </ul>

            {/* O vídeo da demo (BannerDemo) saiu daqui de propósito: a
                gravação atual começa na TELA DE LOGIN, e um formulário de
                login logo abaixo da lista do que a pessoa recebe derruba a
                dobra. A prova visual continua sendo o print do app no herói.
                Assim que `scripts/gravar-demo.mjs` for rodado de novo já
                logado, vale trazer o vídeo de volta para cá. */}
            <p className="revelar mt-10 text-center text-2xs text-muted-foreground">
              As telas são do app de verdade, sem retoque. Os números do
              exemplo são fictícios — os seus entram quando você criar sua
              conta.
            </p>
          </div>
        </section>

        {/* ================================================ 6. A AUTORIDADE */}
        <section className="bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-accent-strong">
                Por que confiar
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                Com quem você está falando
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                A Novare é consultoria de investimentos — o Workspace é a
                ferramenta que ela abriu para todo mundo.
              </p>
            </div>

            <div className="revelar-escada mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CONFIANCA.map(({ destaque, titulo, texto }, i) => (
                <Pilar
                  key={titulo}
                  destaque={destaque}
                  titulo={titulo}
                  texto={texto}
                  tom={tomPor(i)}
                />
              ))}
            </div>

            {/* O modelo de negócio como argumento: é o que separa a Novare
                de quem ganha comissão pelo que indica. */}
            <div className="revelar mt-10 grid overflow-hidden rounded-3xl border border-border sm:grid-cols-2">
              <div className="bg-card p-6 sm:p-7">
                <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  O banco
                </p>
                <p className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                  Ganha quando você paga tarifa e compra o que ele indica.
                </p>
              </div>
              <div className="bg-primary p-6 text-white sm:p-7">
                <p className="text-2xs font-bold uppercase tracking-wider text-ciano-claro">
                  A Novare
                </p>
                <p className="mt-2 font-display text-lg font-semibold leading-snug">
                  Ganha quando você se organiza. Comissão de banco ou corretora:
                  zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================== 7. A OFERTA */}
        <section className="relative overflow-hidden text-white" style={PALCO}>
          <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-accent-claro">
                Um preço só, sem letra miúda
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                Comece hoje sem pagar nada
              </h2>
            </div>

            {/* A caixa da oferta: tudo o que entra, o preço e o botão no mesmo
                retângulo. Quem rolou até aqui não deve precisar procurar. */}
            <div className="cine borda-viva mt-10 rounded-3xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm sm:p-9">
              <p className="text-center text-2xs font-bold uppercase tracking-wider text-white/55">
                {ASSINATURA_NOME}
              </p>

              <div className="mt-5 flex items-end justify-center gap-2">
                <span className="preco-lustro font-display text-[3.5rem] font-black leading-none tabular-nums sm:text-7xl">
                  {ASSINATURA_PRECO_ROTULO}
                </span>
                <span className="pb-3 text-lg font-semibold text-white/60">
                  /mês
                </span>
              </div>
              <p className="mt-2 text-center text-sm text-white/60">
                Menos que um lanche. {porDia} por dia.
              </p>

              <ul className="mx-auto mt-8 grid max-w-xl gap-2.5 border-t border-white/15 pt-7 sm:grid-cols-2">
                {INCLUI.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-white/85"
                  >
                    {/* Ciano, não laranja: o laranja é reservado à ação. */}
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ciano-claro" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col items-center gap-4">
                <BotaoAssinarPlano
                  contexto="workspace"
                  tamanho="grande"
                  destaque
                  direto
                  rotulo={`Começar meus ${ASSINATURA_TRIAL_DIAS} dias grátis`}
                />
                <p className="text-xs text-white/55">
                  Sem cartão de crédito · cancele quando quiser
                </p>
              </div>
            </div>

            {/* ======================================== 8. A GARANTIA (selo) */}
            <div className="revelar mt-8 flex flex-col items-center gap-4 rounded-3xl border border-ciano/25 bg-ciano/10 p-6 text-center sm:flex-row sm:text-left">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ciano-claro/50 bg-ciano/15">
                <ShieldCheck className="h-7 w-7 text-ciano-claro" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-white">
                  Risco zero para testar
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  Nenhum cartão é pedido para começar. Nos{" "}
                  {ASSINATURA_TRIAL_DIAS} dias de teste não existe cobrança
                  nenhuma — se você não voltar, a conta simplesmente não vira
                  assinatura. Se ficar e depois cancelar, a cobrança para na
                  hora, sem multa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= 9. FAQ */}
        <section className="bg-background">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
            <OQueSignifica
              titulo="O que você deve estar se perguntando"
              itens={[
                {
                  pergunta: "É grátis mesmo? Qual a pegadinha?",
                  resposta: `Não tem. Você cria a conta com e-mail e senha — nenhum cartão é pedido — e usa tudo por ${ASSINATURA_TRIAL_DIAS} dias. A cobrança de ${ASSINATURA_PRECO_ROTULO} só existe se você continuar depois disso.`,
                },
                {
                  pergunta: "A Íris vê a senha do meu banco?",
                  resposta:
                    "Não. Nada aqui se conecta ao seu banco: você copia o extrato e cola no app, e ele é lido no seu próprio navegador. Sem senha, sem acesso à sua conta.",
                },
                {
                  pergunta: "Preciso entender de investimento?",
                  resposta:
                    "Não. O app pergunta em português simples quanto entra e quanto sai, e faz as contas por você. Foi feito justamente para quem odeia planilha.",
                },
                {
                  pergunta: "Vocês vão tentar me vender produto de banco?",
                  resposta:
                    "Nunca. A Novare não recebe comissão de banco, corretora ou seguradora — é você quem paga, então é para você que a gente trabalha. É o que nos permite dizer “não compre” quando é o caso.",
                },
                {
                  pergunta: "E se eu cancelar? Perco tudo?",
                  resposta:
                    "A cobrança para na hora, sem multa. As calculadoras continuam abertas para você, e os dados do seu planejamento ficam guardados na sua conta — se voltar, está tudo lá.",
                },
              ]}
            />
          </div>
        </section>

        {/* =================================================== 10. O FECHO */}
        <section className="border-t border-border bg-gelo">
          <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-20">
            <h2 className="cine font-display text-3xl font-bold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
              Seu dinheiro já está indo embora.
              <br />
              <span className="text-accent-strong">
                Descobrir para onde é grátis.
              </span>
            </h2>

            <div className="revelar mt-9 flex flex-col items-center gap-4">
              <BotaoAssinarPlano
                contexto="workspace"
                tamanho="grande"
                destaque
                direto
                rotulo={`Começar meus ${ASSINATURA_TRIAL_DIAS} dias grátis`}
              />
              <p className="text-2xs text-muted-foreground">
                {ASSINATURA_TRIAL_DIAS} dias grátis · sem cartão · cancele
                quando quiser
              </p>
              <a
                href={falarNoWhatsApp(
                  `Olá! Tenho dúvidas sobre o ${ASSINATURA_NOME} antes de assinar.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Prefiro tirar uma dúvida no WhatsApp
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Espaço para a barra fixa não tapar o rodapé no celular. */}
      <div aria-hidden className="h-20 lg:hidden" />

      <RodapeNovare convite={false} />
    </div>
  );
}
