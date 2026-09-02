import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  EyeOff,
  FileText,
  Handshake,
  Layers,
  Lock,
  MessageCircle,
  MessagesSquare,
  Minus,
  ScanSearch,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { NavDiagnostico } from "@/components/lp/NavDiagnostico";
import { BarraDiagnostico } from "@/components/lp/BarraDiagnostico";
import { CarrosselEntregas } from "@/components/lp/CarrosselEntregas";
import { AcordeaoDuvidas } from "@/components/lp/AcordeaoDuvidas";
import { FormularioDiagnostico } from "@/components/lp/FormularioDiagnostico";
import { CONTATO, falarNoWhatsApp } from "@/lib/contato";
import {
  CASO_ACHADOS,
  CASO_ANTES,
  CASO_DEPOIS,
  CASO_GANHOS,
  COMPARATIVO,
  DEPOIMENTOS,
  DIMENSOES,
  ETAPAS,
  FATOS,
  MODO_DE_TRABALHO,
  NORD_NUMEROS,
  NORD_ROSTOS,
  SINTOMAS,
  SOCIOS,
} from "@/lib/diagnostico-lp";

import "./lp.css";

export const metadata: Metadata = {
  title: "Diagnóstico Patrimonial · Novare Consultoria de Investimentos",
  description:
    "Uma leitura independente da sua carteira: alocação, custos, tributação, liquidez e concentração. Sem trocar de banco, sem mover um real e sem comissão de produto.",
  alternates: { canonical: "/assinar" },
  openGraph: {
    title: "Seu patrimônio cresceu. A estratégia ficou onde estava.",
    description:
      "O Diagnóstico Patrimonial da Novare mostra o que sua carteira está fazendo hoje — e o que ela está custando. Análise independente, assinada pelos sócios.",
    url: "/assinar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

/* -------------------------------------------------------------------------- */

const ICONES_SINTOMA: Record<string, LucideIcon> = { Layers, EyeOff, Handshake };
const ICONES_ETAPA: Record<string, LucideIcon> = {
  Upload,
  ScanSearch,
  FileText,
  MessagesSquare,
};

/**
 * A escada de tom dos quatro passos (prints 120608 e 120611).
 *
 * Não é decoração: o cartão escurece a cada etapa porque a página está
 * contando uma progressão, e o olho lê o gradiente antes de ler os números.
 * O passo 04 — a devolutiva, onde a decisão volta para a pessoa — é o mais
 * escuro e o mais denso, e é dele que a página cai direto no CTA.
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

const WPP_GERAL = falarNoWhatsApp(
  "Olá! Vi a página do Diagnóstico Patrimonial da Novare e queria entender melhor.",
);

/* -------------------------------------------------------------------------- */

export default function DiagnosticoPatrimonialPage() {
  return (
    <div className="lp-novare" id="topo">
      <RevelarAoRolar />
      <NavDiagnostico />
      <BarraDiagnostico />

      <main>
        {/* ================================================== 1. HERÓI ===== */}
        {/*
            Reconstrução do print 120600: dois painéis lado a lado, a cápsula
            de navegação flutuando por cima da emenda, e um cartão branco
            escapando do painel da direita para dentro do vão. O que faz a
            composição funcionar é o cartão INVADIR o painel navy — sem essa
            sobreposição vira "texto à esquerda, foto à direita".
        */}
        <section className="bg-white px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto grid max-w-[1440px] gap-3 lg:grid-cols-[1.06fr_0.94fr]">
            {/* ---------------------------------------- painel da promessa */}
            <div className="nv-navy-fundo nv-grade relative overflow-hidden rounded-[28px] px-7 pb-12 pt-28 text-white sm:px-12 sm:pb-16 sm:pt-32 lg:rounded-[34px] lg:px-14 lg:pb-16 xl:px-16">
              <div className="relative flex h-full flex-col">
                <span className="cine nv-pill nv-pill-escura nv-chapeu w-fit">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Consultoria independente · Novare + Nord Wealth
                </span>

                <h1 className="cine nv-display mt-8 max-w-[16ch] text-white">
                  Seu patrimônio
                  <br className="hidden sm:block" /> cresceu. A estratégia
                  <br className="hidden sm:block" />{" "}
                  <span className="text-[#6dc6e6]">ficou onde estava.</span>
                </h1>

                <p className="cine nv-lead mt-7 max-w-lg text-white/72">
                  Posições que ninguém revisitou, custos que não aparecem no
                  extrato e uma concentração que você não escolheu. O
                  Diagnóstico Patrimonial mostra o que a sua carteira está
                  fazendo hoje — sem trocar de banco e sem mover um real.
                </p>

                <div className="cine mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href="#solicitar" className="nv-btn nv-btn-branco">
                    Quero meu diagnóstico
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a
                    href={WPP_GERAL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nv-btn nv-btn-fantasma"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                    Falar no WhatsApp
                  </a>
                </div>

                {/* O rodapé do painel, separado por um fio: é a resposta à
                    pergunta que nasce logo depois da promessa — "quem está
                    falando comigo e o que isso me custa?". */}
                <div className="cine mt-12 flex items-start gap-4 border-t border-white/12 pt-7 lg:mt-auto">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/14 bg-white/[0.07]">
                    <FileText className="h-5 w-5 text-[#6dc6e6]" strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-[0.875rem] font-semibold tracking-[-0.025em] text-white">
                      Relatório escrito e reunião de devolutiva.
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] leading-snug tracking-[-0.015em] text-white/55">
                      Sem comissão de banco, corretora ou seguradora. Sem
                      obrigação de contratar nada depois.
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
                  alt="Leonardo Freitas e Jefferson Freitas, sócios da Novare Consultoria de Investimentos"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover object-[center_22%]"
                />
                {/* Véu navy só na base: dá contraste para o cartão flutuante
                    sem lavar os rostos. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, rgba(11,22,38,0.55))",
                  }}
                />
              </div>

              {/* O cartão que escapa do painel (print 120600). Em telas
                  grandes ele invade o vão à esquerda; no celular volta para
                  dentro, senão sangraria fora da tela. */}
              <figure className="cine absolute bottom-4 left-4 right-4 rounded-[22px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_60px_-26px_rgba(11,22,38,0.6)] backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[330px] lg:-left-10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {SOCIOS.map((s) => (
                      <span
                        key={s.nome}
                        className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-[#e9eef4]"
                      >
                        <Image
                          src={s.foto}
                          alt={s.nome}
                          fill
                          sizes="40px"
                          className="object-cover object-[center_18%]"
                        />
                      </span>
                    ))}
                  </div>
                  <span className="rounded-full bg-[#eaf6fb] px-2.5 py-1 text-[0.6875rem] font-bold tracking-[-0.01em] text-[#17789c]">
                    Sócios
                  </span>
                </div>
                <figcaption className="mt-3 text-[0.8125rem] leading-snug tracking-[-0.02em] text-[#46586e]">
                  <strong className="font-semibold text-[#0f1b2b]">
                    Leonardo e Jefferson Freitas.
                  </strong>{" "}
                  Toda análise passa pelas mãos deles. Nada terceirizado, nada
                  automatizado.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ============================== 2. LETREIRO DO QUE SE OLHA ======= */}
        {/*
            A faixa dos prints 120719 e 120705: uma linha só, caixa alta,
            andando devagar. Ela responde de imediato "diagnóstico de quê?" e
            faz a transição da promessa para o problema sem gastar uma seção.
        */}
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
                    className="flex items-center whitespace-nowrap px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white/72"
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
        {/*
            Print 120603, reconstruído: pastilha com a linha pontilhada saindo
            até a margem, título em duas linhas à esquerda, três cartões
            empilhados com ícone em pastilha quadrada, e a foto à direita numa
            moldura arredondada com o bloco navy deslocado por trás.
        */}
        {/* `overflow-x-clip` e não `overflow-hidden`: o bloco navy do
            `.nv-carimbo` escapa 30px à direita da foto e, entre 768px e
            1180px, esses 30px caíam fora da janela e criavam rolagem
            horizontal na página inteira. `clip` corta sem virar contêiner de
            rolagem — o que preservaria o `sticky` da foto. */}
        <section id="problema" className="overflow-x-clip bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />O problema real
              </span>
            </div>

            <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16">
              <div>
                <h2 className="revelar nv-h2 max-w-[15ch] text-[#0f1b2b]">
                  Sua carteira não foi construída.{" "}
                  <span className="text-[#5b6d81]">Ela foi acumulando.</span>
                </h2>
                <p className="revelar nv-lead mt-6 max-w-lg">
                  Cada aplicação fez sentido no dia em que foi feita. O problema
                  aparece quando ninguém nunca olha todas ao mesmo tempo — é aí
                  que mora o custo, e é exatamente aí que ninguém olha.
                </p>

                <ul className="revelar-escada mt-10 space-y-3.5">
                  {SINTOMAS.map((s) => {
                    const Icone = ICONES_SINTOMA[s.icone] ?? Layers;
                    return (
                      <li
                        key={s.titulo}
                        className="group flex gap-4 rounded-[18px] border border-transparent bg-[#f5f8fb] p-5 transition-colors duration-300 hover:border-[#dcecf4] hover:bg-[#f0f8fc]"
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

              {/* A moldura com o carimbo navy por trás (print 120614): duas
                  superfícies deslocadas, não uma sombra. */}
              <div className="nv-carimbo revelar lg:sticky lg:top-28">
                <div className="cortina relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#e9eef4] shadow-[0_30px_70px_-40px_rgba(15,27,43,0.5)]">
                  <Image
                    src="/lp/problema.webp"
                    alt="Casal revendo extratos e posições de investimento sobre a mesa de casa"
                    fill
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== 4. O CUSTO INVISÍVEL, EM NÚMEROS ===== */}
        {/*
            O problema precisa virar algo que se VÊ. Este é o estudo de caso
            que a Novare publica com nomes e valores omitidos — as barras de
            concentração à esquerda, a recomendação à direita. É a peça que
            transforma "talvez eu tenha um problema" em "isto se parece com a
            minha carteira".
        */}
        <section className="nv-navy-fundo nv-grade relative overflow-hidden py-20 text-white sm:py-28">
          <div className="relative mx-auto max-w-6xl px-5">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-pill-escura nv-chapeu">
                <span className="nv-ponto" />
                Estudo de caso
              </span>
            </div>

            <h2 className="revelar nv-h2 mt-9 max-w-[19ch] text-white">
              O que aparece quando alguém finalmente olha o conjunto
            </h2>
            <p className="revelar nv-lead mt-5 max-w-2xl text-white/68">
              Um exemplo real do tipo de achado que aparece em toda análise que
              a Novare faz. Nomes e valores foram omitidos por sigilo.
            </p>

            <div className="mt-14 grid gap-4 lg:grid-cols-2 lg:gap-5">
              {/* ------------------------------------------------- antes -- */}
              <article className="revelar rounded-[28px] border border-white/10 bg-white/[0.045] p-7 backdrop-blur-sm sm:p-9">
                <header className="flex items-baseline justify-between gap-4">
                  <span className="nv-chapeu text-[#f08a5f]">
                    Antes da análise
                  </span>
                  <span className="text-[0.75rem] font-medium tracking-[-0.01em] text-white/58">
                    Concentração 72%
                  </span>
                </header>

                <ul className="mt-7 space-y-4">
                  {CASO_ANTES.map((c) => (
                    <li key={c.rotulo}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[0.875rem] tracking-[-0.02em] text-white/78">
                          {c.rotulo}
                        </span>
                        <span className="font-mono text-[0.8125rem] font-semibold text-white/90">
                          {c.peso}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${c.peso}%`,
                            background:
                              "linear-gradient(90deg,#f08a5f,#c9491a)",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="nv-chapeu text-white/58">O que apareceu</p>
                  <ul className="mt-4 space-y-2.5">
                    {CASO_ACHADOS.map((a) => (
                      <li
                        key={a}
                        className="flex gap-3 text-[0.875rem] leading-snug tracking-[-0.02em] text-white/72"
                      >
                        <Minus className="mt-1 h-3.5 w-3.5 shrink-0 text-[#f08a5f]" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              {/* ------------------------------------------------ depois -- */}
              <article className="revelar rounded-[28px] border border-[#2596be]/35 bg-[#2596be]/[0.09] p-7 backdrop-blur-sm sm:p-9">
                <header className="flex items-baseline justify-between gap-4">
                  <span className="nv-chapeu text-[#6dc6e6]">
                    Depois da recomendação
                  </span>
                  <span className="text-[0.75rem] font-medium tracking-[-0.01em] text-white/58">
                    Diversificação estratégica
                  </span>
                </header>

                <ul className="mt-7 grid gap-2.5">
                  {CASO_DEPOIS.map((d) => (
                    <li
                      key={d}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[0.875rem] tracking-[-0.02em] text-white/85"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#2596be] text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="nv-chapeu text-white/58">O que o cliente ganha</p>
                  <ul className="mt-4 space-y-2.5">
                    {CASO_GANHOS.map((g) => (
                      <li
                        key={g}
                        className="flex gap-3 text-[0.875rem] leading-snug tracking-[-0.02em] text-white/72"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6dc6e6]" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>

            {/* A pergunta que fecha a seção é o CTA. Ela devolve o caso para a
                pessoa em vez de pedir que ela compre alguma coisa. */}
            <div className="revelar mt-12 flex flex-col items-center gap-6 rounded-[28px] border border-white/10 bg-white/[0.04] px-7 py-9 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="nv-h3 max-w-lg text-white">
                A sua carteira se parece com qual dessas duas?
              </p>
              <a href="#solicitar" className="nv-btn nv-btn-branco shrink-0">
                Quero descobrir
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ================================= 5. A VIRADA / QUEM É A NOVARE = */}
        {/*
            A pausa da página. Depois de mostrar o custo, o leitor pergunta
            "e por que vocês seriam diferentes?" — a resposta é estrutural, não
            promissória: sem comissão, não sobra nada para vender.
        */}
        <section className="nv-gelo-fundo py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <span className="revelar nv-chapeu text-[#c9491a]">
              A diferença é estrutural
            </span>
            <h2 className="revelar nv-h2 mx-auto mt-6 max-w-[20ch] text-[#0f1b2b]">
              O objetivo não é te convencer de nada.{" "}
              <span className="text-[#2596be]">
                É te fazer enxergar o que já é seu.
              </span>
            </h2>
            <p className="revelar nv-lead mx-auto mt-6 max-w-2xl">
              A Novare não distribui produto, não recebe comissão de banco,
              corretora ou seguradora e não tem carteira para empurrar. Sem nada
              para vender do outro lado da mesa, sobra uma coisa só a fazer:
              analisar.
            </p>
          </div>

          <ul className="revelar-escada mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-[#e2e8f0] bg-[#e2e8f0] px-0 sm:grid-cols-4">
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
        </section>

        {/* =============================================== 6. AS ENTREGAS == */}
        <section id="diagnostico" className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />O diagnóstico patrimonial
              </span>
            </div>
          </div>
          <div className="mt-10">
            <CarrosselEntregas />
          </div>
        </section>

        {/* ================================================ 7. O PROCESSO == */}
        {/*
            A reprodução mais literal do conjunto: prints 120608 e 120611. Os
            quatro cartões largos, empilhados, com o número gigante e o traço
            ao lado, o texto à esquerda e a pastilha de ícone à direita com a
            seta diagonal no canto. O fundo escurece a cada passo.
        */}
        <section id="processo" className="nv-gelo-fundo py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5">
            <div className="text-center">
              <span className="revelar nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Como funciona na prática
              </span>
              <h2 className="revelar nv-h2 mx-auto mt-7 max-w-[18ch] text-[#0f1b2b]">
                Quatro passos. Nenhum deles move o seu dinheiro.
              </h2>
              <p className="revelar nv-lead mx-auto mt-5 max-w-xl">
                Você sabe exatamente o que acontece depois de clicar — antes de
                clicar.
              </p>
            </div>

            <ol className="mt-14 space-y-4 sm:space-y-5">
              {ETAPAS.map((e, i) => {
                const t = TOM_ETAPA[i];
                const Icone = ICONES_ETAPA[e.icone] ?? Upload;
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

            <p className="revelar mt-10 text-center text-[0.875rem] tracking-[-0.02em] text-[#5b6d81]">
              Nada é transferido, nada muda de custódia, nada é movimentado.{" "}
              <a
                href="#solicitar"
                className="font-semibold text-[#17789c] underline underline-offset-4"
              >
                Começar pelo passo 01
              </a>
            </p>
          </div>
        </section>

        {/* ============================================= 8. O COMPARATIVO == */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Por que com a Novare
              </span>
            </div>

            <h2 className="revelar nv-h2 mt-9 max-w-[20ch] text-[#0f1b2b]">
              A diferença entre uma recomendação e uma venda com jeito de
              conselho
            </h2>

            <div className="revelar mt-12 overflow-hidden rounded-[26px] border border-[#e2e8f0]">
              <div className="grid grid-cols-2">
                <div className="nv-navy-fundo px-5 py-5 text-white sm:px-8">
                  <p className="nv-chapeu text-[#6dc6e6]">Consultoria</p>
                  <p className="mt-1 text-[1.0625rem] font-semibold tracking-[-0.035em] sm:text-[1.25rem]">
                    Novare
                  </p>
                </div>
                <div className="bg-[#f5f8fb] px-5 py-5 sm:px-8">
                  <p className="nv-chapeu text-[#5b6d81]">Modelo tradicional</p>
                  <p className="mt-1 text-[1.0625rem] font-semibold tracking-[-0.035em] text-[#5b6d81] sm:text-[1.25rem]">
                    Bancos e assessorias
                  </p>
                </div>
              </div>

              <ul>
                {COMPARATIVO.map((c, i) => (
                  <li
                    key={c.novare}
                    className={`grid grid-cols-2 ${
                      i > 0 ? "border-t border-[#eaf0f6]" : ""
                    }`}
                  >
                    <div className="flex gap-3 px-5 py-5 sm:px-8">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#e6f6ec] text-[#1f7a4d]">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-[0.875rem] font-medium leading-snug tracking-[-0.022em] text-[#0f1b2b]">
                        {c.novare}
                      </span>
                    </div>
                    <div className="flex gap-3 bg-[#fafcfd] px-5 py-5 sm:px-8">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#f0f3f7] text-[#5b6d81]">
                        <Minus className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-[0.875rem] leading-snug tracking-[-0.022em] text-[#5b6d81]">
                        {c.mercado}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================== 9. OS SÓCIOS = */}
        {/*
            Prints 120614 e 120713 combinados: a foto na moldura com o bloco
            navy deslocado por trás, e as pastilhas de credencial flutuando
            sobre a imagem. Aqui a foto é real — Leonardo e Jefferson —, então
            as pastilhas dizem o que a casa de fato afirma, e nada além.
        */}
        <section id="socios" className="nv-gelo-fundo py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Quem vai olhar a sua carteira
              </span>
            </div>

            {/* Cabeçalho editorial: manchete à esquerda, argumento à direita.
                As fotos ficam FORA dele, em largura cheia — na referência
                (print 120713) o retrato é o elemento GRANDE da seção, e
                espremê-lo numa coluna era o jeito mais rápido de perder o que
                a seção tem para dizer. */}
            <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-16">
              <h2 className="revelar nv-h2 max-w-[15ch] text-[#0f1b2b]">
                Toda análise passa pelas mãos dos sócios.
              </h2>
              <p className="revelar nv-lead lg:mt-2">
                A Novare foi construída para fazer o que banco não faz: olhar a
                sua carteira sem ter comissão em jogo. Cada análise é feita com
                método, tempo e olhar clínico.{" "}
                <strong className="font-semibold text-[#0f1b2b]">
                  Nada terceirizado, nada automatizado.
                </strong>
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {SOCIOS.map((s, i) => (
                <figure key={s.nome} className="revelar">
                  <div className="cortina relative aspect-[4/5] overflow-hidden rounded-[30px] bg-[#dfe7ee] shadow-[0_34px_70px_-42px_rgba(15,27,43,0.6)]">
                    <Image
                      src={s.foto}
                      alt={s.nome}
                      fill
                      sizes="(max-width: 640px) 100vw, 560px"
                      className="object-cover"
                    />

                    {/* As pastilhas flutuantes do print 120713: duas por foto,
                        em alturas e lados diferentes, para nunca empilharem
                        nem cobrirem o rosto. */}
                    <span
                      className={`absolute ${
                        i === 0 ? "left-5 top-[30%]" : "right-5 top-[24%]"
                      } flex items-center gap-2 rounded-full bg-[#152a44]/90 py-2 pl-2 pr-4 text-[0.75rem] font-semibold tracking-[-0.015em] text-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.85)] backdrop-blur-md`}
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2596be]">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {s.selos[0]}
                    </span>

                    <span
                      className={`absolute bottom-[30%] ${
                        i === 0 ? "right-5" : "left-5"
                      } flex items-center gap-2.5 rounded-full bg-white/94 py-2 pl-3.5 pr-4 text-[0.75rem] font-semibold tracking-[-0.015em] text-[#152a44] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md`}
                    >
                      <Image
                        src="/lp/nord-logo.png"
                        alt=""
                        width={155}
                        height={40}
                        className="h-3.5 w-auto"
                      />
                      {s.selos[1]}
                    </span>

                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent, rgba(11,22,38,0.78))",
                      }}
                    />

                    <figcaption className="absolute inset-x-0 bottom-0 p-7">
                      <p className="text-[1.375rem] font-semibold tracking-[-0.035em] text-white">
                        {s.nome}
                      </p>
                      <p className="mt-1 text-[0.8125rem] tracking-[-0.015em] text-white/72">
                        {s.papel}
                      </p>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
              <ul className="revelar-escada grid flex-1 gap-px overflow-hidden rounded-[22px] border border-[#e2e8f0] bg-[#e2e8f0] sm:grid-cols-2 lg:grid-cols-4">
                {MODO_DE_TRABALHO.map((m) => (
                  <li key={m.titulo} className="bg-white px-5 py-6">
                    <p className="text-[0.875rem] font-semibold tracking-[-0.028em] text-[#0f1b2b]">
                      {m.titulo}
                    </p>
                    <p className="nv-corpo mt-1.5 text-[0.8125rem]">{m.texto}</p>
                  </li>
                ))}
              </ul>

              <a
                href={falarNoWhatsApp(
                  "Olá! Queria falar com os sócios da Novare sobre o Diagnóstico Patrimonial.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="revelar nv-btn nv-btn-navy shrink-0"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                Falar com os sócios
              </a>
            </div>
          </div>
        </section>

        {/* ================================================ 10. A PARCERIA = */}
        {/*
            Print 120642: a palavra gigante ao fundo, o cartão escuro à
            esquerda com os números, e a imagem escapando por cima da palavra.
            A palavra é ornamento — fica `aria-hidden` e atrás de tudo.
        */}
        <section className="relative overflow-hidden bg-white py-20 sm:py-28">
          <div className="relative mx-auto max-w-6xl px-5">
            <span
              aria-hidden
              className="nv-palavra-fundo absolute -top-10 right-[-2%] z-0 text-[#eaf1f7] sm:-top-16"
            >
              NORD
            </span>

            <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-0">
              <article className="nv-navy-fundo revelar rounded-[30px] px-7 py-11 text-white sm:px-11 sm:py-14 lg:pr-24">
                <span className="nv-chapeu text-[#6dc6e6]">
                  Parceria técnica
                </span>
                <h2 className="nv-h3 mt-5 max-w-[22ch] text-white">
                  O diagnóstico é da Novare. A inteligência por trás vem também
                  da Nord.
                </h2>
                <p className="nv-corpo mt-5 max-w-lg text-white/68">
                  A Nord é uma das maiores casas de análise independente do
                  Brasil. Não distribui produto, não recebe comissão de banco e
                  não tem carteira para empurrar. Pela Nord Wealth B2B, a Novare
                  acessa esse research e o traduz em decisões concretas sobre o
                  seu patrimônio.
                </p>

                <ul className="mt-9 grid gap-6 border-t border-white/12 pt-8 sm:grid-cols-3">
                  {NORD_NUMEROS.map((n) => (
                    <li key={n.rotulo}>
                      <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.05em] text-white">
                        {n.valor}
                      </p>
                      <p className="mt-2 text-[0.75rem] leading-snug tracking-[-0.012em] text-white/62">
                        {n.rotulo}
                      </p>
                    </li>
                  ))}
                </ul>
              </article>

              {/* A imagem sobrepõe o cartão pela esquerda em telas grandes —
                  é o vazamento da referência, não uma coluna ao lado. */}
              <div className="revelar relative mx-auto w-full max-w-[380px] lg:-ml-16">
                <div className="cortina relative aspect-[4/5] overflow-hidden rounded-[26px] bg-[#dfe7ee] shadow-[0_36px_80px_-40px_rgba(15,27,43,0.65)]">
                  <Image
                    src={NORD_ROSTOS[0].foto}
                    alt="Renato Breia, Nord Wealth"
                    fill
                    sizes="380px"
                    className="object-cover"
                  />
                </div>

                <figure className="absolute -bottom-5 left-4 right-4 rounded-[20px] border border-[#e6ecf3] bg-white/95 p-4 shadow-[0_20px_50px_-24px_rgba(15,27,43,0.5)] backdrop-blur-md sm:left-6 sm:right-6">
                  <p className="nv-chapeu text-[#5b6d81]">
                    Time técnico Nord Wealth
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                    {NORD_ROSTOS.map((r) => (
                      <li key={r.nome} className="flex items-center gap-2.5">
                        <span className="relative h-9 w-9 overflow-hidden rounded-full bg-[#e9eef4]">
                          <Image
                            src={r.foto}
                            alt={r.nome}
                            fill
                            sizes="36px"
                            className="object-cover object-top"
                          />
                        </span>
                        <span>
                          <span className="block text-[0.8125rem] font-semibold leading-tight tracking-[-0.025em] text-[#0f1b2b]">
                            {r.nome}
                          </span>
                          <span className="block text-[0.6875rem] leading-tight text-[#5b6d81]">
                            {r.papel}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ 11. O PAREDÃO ====== */}
        {/*
            Print 120617: a fileira de avatares acima do título centralizado, e
            embaixo a "parede" de depoimentos desbotando nas laterais — a
            sugestão de que a parede continua além do container.
        */}
        <section className="nv-gelo-fundo overflow-hidden py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <div className="revelar nv-marcador">
              <span className="nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Depoimentos
              </span>
            </div>

            <div className="mt-12 text-center">
              <div className="revelar flex justify-center -space-x-3">
                {DEPOIMENTOS.slice(0, 4).map((d) => (
                  <span
                    key={d.nome}
                    aria-hidden
                    className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-[#f4f7fa] bg-[#152a44] text-[0.8125rem] font-semibold text-white"
                  >
                    {d.nome.charAt(0)}
                  </span>
                ))}
              </div>
              <h2 className="revelar nv-h2 mx-auto mt-8 max-w-[20ch] text-[#0f1b2b]">
                O que diz quem já sentou do outro lado da mesa
              </h2>
              <p className="revelar nv-lead mx-auto mt-4 max-w-lg">
                Relatos publicados pela Novare, de clientes que passaram pelo
                diagnóstico.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <ul className="revelar-escada mx-auto grid max-w-[1500px] grid-cols-1 gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
              {DEPOIMENTOS.map((d) => (
                <li
                  key={d.nome}
                  className="flex flex-col rounded-[20px] border border-[#e4ebf2] bg-white p-6"
                >
                  <p className="text-[0.9375rem] leading-relaxed tracking-[-0.022em] text-[#46586e]">
                    &ldquo;{d.texto}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[#eef2f7] pt-5">
                    <span
                      aria-hidden
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eaf2f8] text-[0.8125rem] font-semibold text-[#17789c]"
                    >
                      {d.nome.charAt(0)}
                    </span>
                    <span>
                      <span className="block text-[0.875rem] font-semibold leading-tight tracking-[-0.025em] text-[#0f1b2b]">
                        {d.nome}
                      </span>
                      <span className="block text-[0.6875rem] uppercase tracking-[0.09em] text-[#5b6d81]">
                        {d.papel}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =============================================== 12. AS DÚVIDAS == */}
        {/*
            Print 120724: título à esquerda com o cartão de suporte embaixo, e
            o acordeão numerado ocupando a coluna da direita.
        */}
        <section id="duvidas" className="bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <div>
              <span className="revelar nv-pill nv-chapeu">
                <span className="nv-ponto" />
                Dúvidas frequentes
              </span>
              <h2 className="revelar nv-h2 mt-7 max-w-[12ch] text-[#0f1b2b]">
                Antes de pedir,{" "}
                <span className="text-[#2596be]">tire suas dúvidas</span>
              </h2>

              <div className="revelar mt-10 max-w-[280px] overflow-hidden rounded-[20px] border border-[#e6ecf3] bg-[#f5f9fc]">
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/lp/hero-socios.webp"
                    alt=""
                    fill
                    sizes="280px"
                    className="object-cover object-[center_28%]"
                  />
                </div>
                <div className="flex items-center gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#152a44] text-white">
                    <MessageCircle className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[0.8125rem] font-semibold tracking-[-0.025em] text-[#0f1b2b]">
                      Ficou alguma dúvida?
                    </p>
                    <a
                      href={WPP_GERAL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.75rem] font-medium text-[#17789c] underline underline-offset-2"
                    >
                      Fale direto com a Novare
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="revelar">
              <AcordeaoDuvidas />
            </div>
          </div>
        </section>

        {/* ============================================= 13. O CTA FINAL === */}
        {/*
            Prints 120721 e 120726: o cartão escuro de duas colunas — o
            argumento e a lista à esquerda, o cartão branco de ação à direita.
            No lugar do preço da referência entra o formulário: aqui o próximo
            passo não é pagar, é ser lido.
        */}
        <section
          id="solicitar"
          className="nv-navy-fundo nv-grade relative scroll-mt-24 overflow-hidden py-20 sm:py-28"
        >
          <div className="relative mx-auto max-w-6xl px-5">
            <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] backdrop-blur-sm lg:grid-cols-[1.02fr_0.98fr]">
              {/* ------------------------------------------- o argumento -- */}
              <div className="p-8 text-white sm:p-11 lg:p-14">
                <span className="revelar nv-pill nv-pill-escura nv-chapeu">
                  <span className="nv-ponto" />
                  Seu próximo passo
                </span>

                <h2 className="revelar nv-h2 mt-7 max-w-[15ch] text-white">
                  Uma conversa.{" "}
                  <span className="text-[#6dc6e6]">
                    Toda a clareza que faltava.
                  </span>
                </h2>
                <p className="revelar nv-lead mt-6 max-w-md text-white/68">
                  Você não está contratando um investimento. Está pedindo que
                  alguém sem nada a te vender leia a sua carteira e te diga, por
                  escrito, o que ela está fazendo.
                </p>

                <ul className="revelar-escada mt-10 space-y-3.5 border-t border-white/12 pt-9">
                  {[
                    "Análise da carteira atual, ativo por ativo",
                    "Mapa de custos, riscos, tributação e concentração",
                    "Relatório escrito e sob medida para o seu momento",
                    "Reunião de devolutiva para ler o documento junto",
                    "Sigilo absoluto e zero obrigação de continuar",
                  ].map((l) => (
                    <li key={l} className="flex gap-3">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#2596be] text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-[0.9375rem] leading-snug tracking-[-0.022em] text-white/82">
                        {l}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* O bloco de redução de risco (print 120721): número grande
                    à esquerda, promessa à direita. Aqui o número é zero, que é
                    a coisa mais tranquilizadora que a página pode dizer. */}
                <div className="revelar mt-10 flex items-center gap-5 rounded-[22px] border border-white/12 bg-white/[0.05] p-5">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[18px] bg-[#2596be]/18 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#6dc6e6]">
                    0
                  </span>
                  <div>
                    <p className="text-[0.9375rem] font-semibold tracking-[-0.03em] text-white">
                      Nenhuma obrigação depois
                    </p>
                    <p className="mt-1 text-[0.8125rem] leading-snug tracking-[-0.015em] text-white/58">
                      Recebeu o relatório, o trabalho está encerrado. Você segue
                      livre — e no controle.
                    </p>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------ o formulário --- */}
              <div className="p-4 sm:p-6 lg:py-14 lg:pl-4 lg:pr-14">
                <div className="revelar overflow-hidden rounded-[26px] bg-white shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)]">
                  <FormularioDiagnostico />
                </div>

                <p className="mt-5 flex items-center justify-center gap-2 text-[0.75rem] tracking-[-0.01em] text-white/58">
                  <Lock className="h-3.5 w-3.5" />
                  Solicitação gratuita e sem compromisso de contratação.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== 14. RODAPÉ === */}
        <footer className="bg-[#070e19] px-5 pb-10 pt-14 text-white/60">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-10 border-b border-white/10 pb-10 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <Image
                  src="/lp/novare-logo-branca.png"
                  alt="Novare Consultoria de Investimentos"
                  width={700}
                  height={200}
                  className="h-7 w-auto"
                />
                <p className="mt-5 text-[0.8125rem] leading-relaxed tracking-[-0.015em]">
                  Consultoria de investimentos independente. Sem comissão de
                  banco, corretora ou seguradora — em parceria técnica com a
                  Nord Wealth.
                </p>
                <Image
                  src="/lp/nord-logo-branca.png"
                  alt="Nord Wealth"
                  width={155}
                  height={40}
                  className="mt-6 h-4 w-auto opacity-55"
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-3 md:gap-12">
                <div>
                  <p className="nv-chapeu text-white/62">Contato</p>
                  <ul className="mt-4 space-y-2.5 text-[0.875rem] tracking-[-0.02em]">
                    <li>
                      <a
                        href={WPP_GERAL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-white"
                      >
                        {CONTATO.telefone}
                      </a>
                    </li>
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
                      { href: "#diagnostico", rotulo: "O diagnóstico" },
                      { href: "#processo", rotulo: "Como funciona" },
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

            {/* O aviso legal existe porque a atividade é regulada e porque a
                página inteira se sustenta em não prometer rentabilidade. */}
            <p className="mt-8 max-w-3xl text-[0.75rem] leading-relaxed tracking-[-0.01em] text-white/58">
              Material de caráter informativo. Não constitui oferta,
              recomendação individualizada de investimento nem garantia de
              rentabilidade. Rentabilidade passada não representa garantia de
              resultado futuro. Toda análise é conduzida sem qualquer
              movimentação, transferência ou custódia dos ativos do cliente.
            </p>

            <p className="mt-6 text-[0.75rem] tracking-[-0.01em] text-white/62">
              © {new Date().getFullYear()} Novare Consultoria de Investimentos.
              Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
