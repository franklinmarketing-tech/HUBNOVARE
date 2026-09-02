import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ClipboardList,
  EyeOff,
  Minus,
  Newspaper,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { NavLP } from "@/components/lp/NavLP";
import { BarraLP } from "@/components/lp/BarraLP";
import { CarrosselPilares } from "@/components/lp/CarrosselPilares";
import { Comparativo } from "@/components/lp/Comparativo";
import { Duvidas } from "@/components/lp/Duvidas";
import { Preco } from "@/components/lp/Preco";
import { CONTATO } from "@/lib/contato";
import {
  ASSINATURA_NOME,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import { ROTULO_DESCONTO } from "@/lib/consultoria";
import {
  CONFIANCA,
  DIMENSOES,
  ETAPAS,
  FATOS,
  N_FERRAMENTAS,
  SINTOMAS,
  VIRADA,
} from "@/lib/hub-lp";

import "./lp.css";

export const metadata: Metadata = {
  title: `${ASSINATURA_NOME}: sua vida financeira inteira, num lugar só`,
  description: `Plano financeiro completo, uma IA que lê seu extrato e ${N_FERRAMENTAS} ferramentas por ${ASSINATURA_PRECO_ROTULO}/mês. ${ASSINATURA_TRIAL_DIAS} dias grátis, sem pedir cartão.`,
  alternates: { canonical: "/assinar" },
  openGraph: {
    title: "Você ganha bem. E mesmo assim o mês não fecha.",
    description: `Tudo o que a Novare construiu por ${ASSINATURA_PRECO_ROTULO}/mês. Comece com ${ASSINATURA_TRIAL_DIAS} dias grátis, sem cartão.`,
    url: "/assinar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

/* -------------------------------------------------------------------------- */

const ICONES_SINTOMA: Record<string, LucideIcon> = {
  Receipt,
  EyeOff,
  ClipboardList,
};

const ICONES_ETAPA: Record<string, LucideIcon> = {
  UserPlus,
  ClipboardList,
  Target,
  Bot,
};

/**
 * A escada de tom dos quatro passos.
 *
 * Não é decoração: o cartão escurece a cada etapa porque a página está
 * contando uma progressão, e o olho lê o gradiente antes de ler os números.
 */
type TomEtapa = {
  caixa: string;
  numero: string;
  titulo: string;
  texto: string;
  tile: string;
  brilho: string;
  seta: string;
  /** Só os dois últimos passos trocam a superfície inteira por um gradiente. */
  fundo?: string;
};

const TOM_ETAPA: TomEtapa[] = [
  {
    caixa: "bg-white border border-[#e7edf4]",
    numero: "text-[#cdd8e4]",
    titulo: "text-[#0f1b2b]",
    texto: "text-[#46586e]",
    tile: "bg-[#f2f7fb] text-[#2596be] border border-[#e2ecf3]",
    brilho: "rgba(37,150,190,0.14)",
    seta: "text-[#b6c4d3]",
  },
  {
    caixa: "bg-[#eaf2f8] border border-[#dbe8f1]",
    numero: "text-[#b6cbdc]",
    titulo: "text-[#0f1b2b]",
    texto: "text-[#46586e]",
    tile: "bg-white text-[#2596be] border border-[#dbe8f1]",
    brilho: "rgba(37,150,190,0.2)",
    seta: "text-[#9fb5c9]",
  },
  {
    caixa: "border border-transparent text-white",
    numero: "text-white/62",
    titulo: "text-white",
    texto: "text-white/72",
    tile: "bg-white/12 text-white border border-white/20",
    brilho: "rgba(109,198,230,0.42)",
    seta: "text-white/55",
    fundo: "linear-gradient(140deg,#1d3a58 0%,#15304f 100%)",
  },
  {
    caixa: "border border-transparent text-white",
    numero: "text-white/42",
    titulo: "text-white",
    texto: "text-white/65",
    tile: "bg-white/8 text-[#6dc6e6] border border-white/14",
    brilho: "rgba(37,150,190,0.36)",
    seta: "text-white/55",
    fundo: "linear-gradient(140deg,#0d1a2c 0%,#070e19 100%)",
  },
];

/* -------------------------------------------------------------------------- */

export default function AssinarPage() {
  return (
    <div className="lp-novare" id="topo">
      <RevelarAoRolar />
      <NavLP />
      <BarraLP />

      <main>
        {/* ================================================== 1. HERÓI ===== */}
        {/*
            Dois painéis lado a lado, a cápsula de navegação flutuando por cima
            da emenda e um cartão branco escapando do painel da direita para
            dentro do vão. O que faz a composição funcionar é o cartão INVADIR
            o painel navy — sem essa sobreposição vira "texto à esquerda, foto
            à direita", que é outra coisa.
        */}
        <section className="bg-white px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto grid w-full max-w-[1350px] gap-3 lg:grid-cols-[1.06fr_0.94fr]">
            {/* ---------------------------------------- painel da promessa */}
            <div className="nv-navy-fundo nv-grade relative overflow-hidden rounded-[28px] px-7 pb-12 pt-28 text-white sm:px-12 sm:pb-16 sm:pt-32 lg:rounded-[34px] lg:px-14 lg:pb-16 xl:px-16">
              <div className="relative flex h-full flex-col">
                <span className="cine nv-pill nv-pill-escura nv-chapeu w-fit">
                  <Sparkles className="h-3.5 w-3.5" />O 1º hub financeiro do
                  Brasil
                </span>

                <h1 className="cine nv-display mt-8 max-w-[16ch] text-white">
                  Você ganha bem.
                  <br className="hidden sm:block" /> E mesmo assim
                  <br className="hidden sm:block" />{" "}
                  <span className="text-[#6dc6e6]">o mês não fecha.</span>
                </h1>

                <p className="cine nv-lead mt-7 max-w-lg text-white/72">
                  O problema quase nunca é o quanto entra — é não enxergar. O{" "}
                  {ASSINATURA_NOME} junta seu plano financeiro completo, uma IA
                  que lê seu extrato e as {N_FERRAMENTAS} ferramentas da casa
                  num lugar só, por {ASSINATURA_PRECO_ROTULO} por mês.
                </p>

                <div className="cine mt-9 flex flex-col gap-3 sm:flex-row">
                  <BotaoAssinarPlano
                    contexto="workspace"
                    tamanho="grande"
                    destaque
                    direto
                    rotulo={`Começar meus ${ASSINATURA_TRIAL_DIAS} dias grátis`}
                  />
                  <a href="#preco" className="nv-btn nv-btn-fantasma">
                    Ver o que está incluído
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                {/* O rodapé do painel responde a pergunta que nasce logo depois
                    da promessa: "e o que isso vai me custar agora?". */}
                <div className="cine mt-12 flex items-start gap-4 border-t border-white/12 pt-7 lg:mt-auto">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/14 bg-white/[0.07]">
                    <ShieldCheck
                      className="h-5 w-5 text-[#6dc6e6]"
                      strokeWidth={1.7}
                    />
                  </span>
                  <div>
                    <p className="text-[0.875rem] font-semibold tracking-[-0.025em] text-white">
                      {ASSINATURA_TRIAL_DIAS} dias grátis, sem pedir cartão.
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] leading-snug tracking-[-0.015em] text-white/58">
                      Depois, {ASSINATURA_PRECO_ROTULO} por mês. Cancele quando
                      quiser, sem multa e sem falar com ninguém.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------- painel da imagem */}
            <div className="relative">
              <div className="cortina relative h-[420px] overflow-hidden rounded-[28px] bg-[#e9eef4] sm:h-[520px] lg:h-full lg:min-h-[680px] lg:rounded-[34px]">
                <Image
                  src="/lp/hero-socios.webp"
                  alt="Leonardo Freitas e Jefferson Freitas, sócios da Novare"
                  fill
                  priority
                  quality={92}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover object-[center_22%]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, rgba(11,22,38,0.55))",
                  }}
                />
              </div>

              <figure className="cine absolute bottom-4 left-4 right-4 rounded-[22px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_60px_-26px_rgba(11,22,38,0.6)] backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[340px] lg:-left-10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {["/lp/socio-leonardo.webp", "/lp/socio-jefferson.webp"].map(
                      (foto) => (
                        <span
                          key={foto}
                          className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-[#e9eef4]"
                        >
                          <Image
                            src={foto}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover object-[center_18%]"
                          />
                        </span>
                      ),
                    )}
                  </div>
                  <span className="rounded-full bg-[#eaf6fb] px-2.5 py-1 text-[0.6875rem] font-bold tracking-[-0.01em] text-[#17789c]">
                    Sócios
                  </span>
                </div>
                <figcaption className="mt-3 text-[0.8125rem] leading-snug tracking-[-0.02em] text-[#46586e]">
                  <strong className="font-semibold text-[#0f1b2b]">
                    Leonardo e Jefferson Freitas.
                  </strong>{" "}
                  O método que eles usam na consultoria virou software — e agora
                  cabe no seu bolso.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ==================================== 2. LETREIRO DO QUE TEM ===== */}
        <section className="nv-navy-fundo overflow-hidden py-4">
          <div className="nv-letreiro">
            {[0, 1].map((copia) => (
              <ul
                key={copia}
                aria-hidden={copia === 1}
                className="flex shrink-0 items-center"
              >
                {DIMENSOES.map((d) => (
                  <li
                    key={`${copia}-${d}`}
                    className="flex items-center whitespace-nowrap px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white/62"
                  >
                    {d}
                    <span className="ml-6 h-1 w-1 rounded-full bg-[#2596be]" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        {/* ================================================ 3. O PROBLEMA == */}
        <section
          id="problema"
          className="overflow-x-clip bg-white py-20 sm:py-28"
        >
          <div className="nv-caixa">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Se você se reconhecer aqui
              </span>
            </div>

            <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16">
              <div>
                <h2 className="revelar nv-h2 max-w-[16ch] text-[#0f1b2b]">
                  O problema quase nunca é o quanto você ganha.{" "}
                  <span className="text-[#5b6d81]">É não enxergar.</span>
                </h2>
                <p className="revelar nv-lead mt-6 max-w-lg">
                  Ninguém organiza o que não consegue ver. É por isso que a
                  planilha morre no segundo mês: ela cobra trabalho e não
                  devolve resposta nenhuma.
                </p>

                <ul className="revelar-escada mt-10 space-y-3.5">
                  {SINTOMAS.map((s) => {
                    const Icone = ICONES_SINTOMA[s.icone] ?? Receipt;
                    return (
                      <li
                        key={s.titulo}
                        className="flex gap-4 rounded-[18px] border border-transparent bg-[#f5f8fb] p-5 transition-colors duration-300 hover:border-[#dcecf4] hover:bg-[#f0f8fc]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#2596be] shadow-[0_1px_3px_rgba(15,27,43,0.06)]">
                          <Icone className="h-5 w-5" strokeWidth={1.7} />
                        </span>
                        <div>
                          <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.075em] text-[#0f1b2b]">
                            {s.titulo}
                          </h3>
                          <p className="nv-corpo mt-1.5 text-[0.875rem]">
                            {s.texto}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="nv-carimbo revelar lg:sticky lg:top-28">
                <div className="cortina relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#e9eef4] shadow-[0_30px_70px_-40px_rgba(15,27,43,0.5)]">
                  <Image
                    src="/lp/problema.webp"
                    alt="Casal revendo contas e extratos sobre a mesa de casa"
                    fill
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ 4. ANTES E DEPOIS == */}
        {/*
            O problema precisa virar algo que se VÊ. Frase contra frase: à
            esquerda o que a pessoa vive hoje, à direita o que o produto faz no
            lugar. Sem número inventado e sem promessa de resultado — o que
            muda aqui é o que o software faz, não quanto a pessoa vai ganhar.
        */}
        <section className="nv-navy-fundo nv-grade relative overflow-hidden py-20 text-white sm:py-28">
          <div className="nv-caixa relative">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-pill-escura nv-chapeu">
                <span className="nv-ponto" />O que muda na prática
              </span>
            </div>

            <h2 className="revelar nv-h2 mt-9 max-w-[18ch] text-white">
              A mesma renda. Uma vida financeira completamente outra.
            </h2>

            <ul className="mt-14 space-y-3">
              {VIRADA.map((v) => (
                <li
                  key={v.antes}
                  className="revelar grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-0"
                >
                  <div className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.035] p-6 sm:rounded-r-none">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[#f08a5f]">
                      <Minus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <p className="text-[0.9375rem] leading-snug tracking-[-0.022em] text-white/62">
                      {v.antes}
                    </p>
                  </div>

                  <span aria-hidden className="hidden w-px bg-white/10 sm:block" />

                  <div className="flex items-center gap-4 rounded-[20px] border border-[#2596be]/30 bg-[#2596be]/[0.1] p-6 sm:rounded-l-none">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#2596be] text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <p className="text-[0.9375rem] font-medium leading-snug tracking-[-0.022em] text-white">
                      {v.depois}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="revelar mt-12 flex flex-col items-center gap-6 rounded-[28px] border border-white/10 bg-white/[0.04] px-7 py-9 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="nv-h3 max-w-lg text-white">
                Os {ASSINATURA_TRIAL_DIAS} primeiros dias custam zero. Sem
                cartão.
              </p>
              <a href="#preco" className="nv-btn nv-btn-branco shrink-0">
                Ver a assinatura
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* =================================================== 5. OS FATOS = */}
        <section className="nv-gelo-fundo py-20 sm:py-24">
          <div className="nv-caixa">
            <ul className="revelar-escada mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-[#e2e8f0] bg-[#e2e8f0] sm:grid-cols-4">
              {FATOS.map((f) => (
                <li key={f.rotulo} className="bg-white px-5 py-9 text-center">
                  <p className="text-[2.25rem] font-semibold leading-none tracking-[-0.05em] text-[#152a44] sm:text-[2.75rem]">
                    {f.valor}
                  </p>
                  <p className="nv-corpo mx-auto mt-3 max-w-[16ch] text-[0.8125rem]">
                    {f.rotulo}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================ 6. O QUE ESTÁ DENTRO */}
        <section id="incluido" className="bg-white py-20 sm:py-28">
          <div className="nv-caixa">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />O que a assinatura libera
              </span>
            </div>
          </div>
          <div className="mt-10">
            <CarrosselPilares />
          </div>
        </section>

        {/* ================================================= 7. O PRODUTO == */}
        {/*
            O único momento da página em que o software aparece. Vem depois da
            lista do que está incluído porque aqui a pergunta já é outra —
            "isso existe mesmo?" —, e a resposta é a tela de verdade.
        */}
        <section className="nv-navy-fundo nv-grade relative overflow-hidden py-20 text-white sm:py-24">
          <div className="nv-caixa relative text-center">
            <h2 className="revelar nv-h2 mx-auto max-w-[18ch] text-white">
              Não é planilha com outro nome.{" "}
              <span className="text-[#6dc6e6]">É um app.</span>
            </h2>
            <p className="revelar nv-lead mx-auto mt-5 max-w-xl text-white/68">
              Você preenche uma vez e o Workspace faz o resto: fecha o mês,
              acompanha a evolução e mostra o que mudou desde a última vez.
            </p>

            <div className="cortina mx-auto mt-14 max-w-4xl">
              <div className="overflow-hidden rounded-t-[20px] border border-b-0 border-white/15 bg-white/[0.06] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                <div className="flex h-9 items-center gap-1.5 bg-white/10 pl-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                </div>
                <Image
                  src="/demo/poster-app.jpg"
                  alt="Tela de diagnóstico do Planejamento Financeiro da Novare"
                  width={1140}
                  height={642}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================ 8. O PROCESSO == */}
        <section id="processo" className="nv-gelo-fundo py-20 sm:py-28">
          <div className="nv-caixa">
            <div className="text-center">
              <span className="revelar nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Como começa
              </span>
              <h2 className="revelar nv-h2 mx-auto mt-7 max-w-[18ch] text-[#0f1b2b]">
                Quatro passos. Nenhum deles pede cartão.
              </h2>
              <p className="revelar nv-lead mx-auto mt-5 max-w-xl">
                O medo real não é o preço — é o trabalho. Então o caminho até o
                seu primeiro plano cabe numa pausa do almoço.
              </p>
            </div>

            <ol className="mx-auto mt-14 max-w-4xl space-y-4 sm:space-y-5">
              {ETAPAS.map((e, i) => {
                const t = TOM_ETAPA[i];
                const Icone = ICONES_ETAPA[e.icone] ?? UserPlus;
                return (
                  <li
                    key={e.numero}
                    className={`revelar nv-etapa ${t.caixa}`}
                    style={
                      {
                        "--nv-brilho": t.brilho,
                        ...(t.fundo ? { background: t.fundo } : {}),
                      } as React.CSSProperties
                    }
                  >
                    <div className="relative flex items-start justify-between gap-6">
                      <div className="max-w-lg">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[2rem] font-semibold leading-none tracking-[-0.05em] sm:text-[2.5rem] ${t.numero}`}
                          >
                            {e.numero}
                          </span>
                          <span
                            className={`h-px w-8 ${
                              t.fundo ? "bg-white/25" : "bg-[#c6d3e0]"
                            }`}
                          />
                        </div>

                        <h3
                          className={`mt-5 text-[1.25rem] font-semibold leading-tight tracking-[-0.035em] sm:text-[1.5rem] ${t.titulo}`}
                        >
                          {e.titulo}
                        </h3>
                        <p
                          className={`mt-2.5 max-w-md text-[0.875rem] leading-relaxed tracking-[-0.018em] sm:text-[0.9375rem] ${t.texto}`}
                        >
                          {e.texto}
                        </p>
                      </div>

                      <div
                        className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-[20px] sm:h-[104px] sm:w-[104px] sm:rounded-[26px] ${t.tile}`}
                      >
                        <Icone
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          strokeWidth={1.4}
                        />
                        <ArrowUpRight
                          className={`absolute right-2.5 top-2.5 h-3.5 w-3.5 ${t.seta}`}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ============================================= 9. O COMPARATIVO == */}
        <section className="bg-white py-20 sm:py-28">
          <div className="nv-caixa">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Por que o Workspace
              </span>
            </div>

            <h2 className="revelar nv-h2 mt-9 max-w-[20ch] text-[#0f1b2b]">
              Você já tentou as outras duas colunas
            </h2>
            <p className="revelar nv-lead mt-5 max-w-2xl">
              Uma cobra o seu fim de semana. A outra cobra sem dizer quanto.
            </p>

            <div className="revelar">
              <Comparativo />
            </div>
          </div>
        </section>

        {/* =================================================== 10. O PREÇO = */}
        <section
          id="preco"
          className="nv-navy-fundo nv-grade relative scroll-mt-24 overflow-hidden py-20 sm:py-28"
        >
          <div className="nv-caixa relative">
            <Preco />
          </div>
        </section>

        {/* ============================================== 11. A CONFIANÇA == */}
        <section className="nv-gelo-fundo py-20 sm:py-28">
          <div className="nv-caixa">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Por que confiar
              </span>
            </div>

            <h2 className="revelar nv-h2 mt-9 max-w-[22ch] text-[#0f1b2b]">
              A Novare não ganha nada se você comprar o produto errado
            </h2>
            <p className="revelar nv-lead mt-5 max-w-2xl">
              É você quem paga a assinatura — então é para você que a casa
              trabalha. É por isso que ela pode dizer o que um gerente não pode.
            </p>

            <ul className="revelar-escada mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CONFIANCA.map((c) => (
                <li
                  key={c.titulo}
                  className="flex flex-col rounded-[22px] border border-[#e4ebf2] bg-white p-7"
                >
                  <p className="text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#2596be]">
                    {c.destaque}
                  </p>
                  <h3 className="mt-5 text-[1rem] font-semibold leading-tight tracking-[-0.032em] text-[#0f1b2b]">
                    {c.titulo}
                  </h3>
                  <p className="nv-corpo mt-2.5 text-[0.875rem]">{c.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================================================ 12. AS DÚVIDAS = */}
        <section
          id="duvidas"
          className="relative overflow-hidden bg-white py-20 sm:py-28"
        >
          <Duvidas />
        </section>

        {/* =============================================== 13. O CTA FINAL = */}
        <section className="nv-navy-fundo nv-grade relative overflow-hidden py-20 sm:py-28">
          <div className="nv-caixa relative">
            <div className="revelar mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.04] px-7 py-14 text-center sm:px-14">
              <span className="nv-pill nv-pill-escura nv-chapeu mx-auto">
                <span className="nv-ponto" />O próximo mês começa agora
              </span>

              <h2 className="nv-h2 mx-auto mt-7 max-w-[18ch] text-white">
                Você já sabe conviver com a dúvida.{" "}
                <span className="text-[#6dc6e6]">Que tal sair dela?</span>
              </h2>

              <p className="nv-lead mx-auto mt-6 max-w-lg text-white/68">
                {ASSINATURA_TRIAL_DIAS} dias com tudo liberado, sem pedir
                cartão. Se não fizer sentido, você não precisa fazer nada — e
                nada é cobrado.
              </p>

              <div className="mt-10 flex justify-center">
                <BotaoAssinarPlano
                  contexto="workspace"
                  tamanho="grande"
                  destaque
                  direto
                  rotulo={`Começar meus ${ASSINATURA_TRIAL_DIAS} dias grátis`}
                />
              </div>

              <p className="mt-5 text-[0.75rem] uppercase tracking-[0.12em] text-white/58">
                Sem cartão · {ASSINATURA_PRECO_ROTULO}/mês depois ·{" "}
                {ROTULO_DESCONTO} na consultoria
              </p>
            </div>
          </div>
        </section>

        {/* ================================================== 14. RODAPÉ === */}
        <footer className="bg-[#070e19] pb-10 pt-14 text-white/60">
          <div className="nv-caixa">
            <div className="flex flex-col gap-10 border-b border-white/10 pb-10 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <Image
                  src="/lp/novare-logo-branca.png"
                  alt="Novare"
                  width={700}
                  height={200}
                  className="h-7 w-auto"
                />
                <p className="mt-5 text-[0.8125rem] leading-relaxed tracking-[-0.015em]">
                  {ASSINATURA_NOME}: plano financeiro, a Íris e as{" "}
                  {N_FERRAMENTAS} ferramentas da casa, por{" "}
                  {ASSINATURA_PRECO_ROTULO} por mês. Sem comissão de banco,
                  corretora ou seguradora.
                </p>
                <Image
                  src="/lp/nord-logo-branca.png"
                  alt="Nord"
                  width={155}
                  height={40}
                  className="mt-6 h-4 w-auto opacity-55"
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-3 md:gap-12">
                <div>
                  <p className="nv-chapeu text-white/62">Contato</p>
                  <ul className="mt-4 space-y-2.5 text-[0.875rem] tracking-[-0.02em]">
                    <li>{CONTATO.telefone}</li>
                    <li>
                      <a
                        href={`mailto:${CONTATO.email}`}
                        className="transition-colors hover:text-white"
                      >
                        {CONTATO.email}
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="nv-chapeu text-white/62">Legal</p>
                  <ul className="mt-4 space-y-2.5 text-[0.875rem] tracking-[-0.02em]">
                    <li>
                      <Link
                        href="/privacidade"
                        className="transition-colors hover:text-white"
                      >
                        Política de Privacidade
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/termos"
                        className="transition-colors hover:text-white"
                      >
                        Termos de Uso
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="nv-chapeu text-white/62">Nesta página</p>
                  <ul className="mt-4 space-y-2.5 text-[0.875rem] tracking-[-0.02em]">
                    {[
                      { href: "#problema", rotulo: "O problema" },
                      { href: "#incluido", rotulo: "O que inclui" },
                      { href: "#processo", rotulo: "Como começa" },
                      { href: "#preco", rotulo: "Preço" },
                      { href: "#duvidas", rotulo: "Dúvidas" },
                    ].map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="transition-colors hover:text-white"
                        >
                          {l.rotulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-8 max-w-3xl text-[0.75rem] leading-relaxed tracking-[-0.01em] text-white/52">
              Material de caráter informativo. Não constitui oferta,
              recomendação individualizada de investimento nem garantia de
              rentabilidade. A consultoria particular é analisada caso a caso e
              cobrada à parte; a assinatura dá desconto sobre ela.
            </p>

            <p className="mt-6 text-[0.75rem] tracking-[-0.01em] text-white/52">
              © {new Date().getFullYear()} Novare. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
