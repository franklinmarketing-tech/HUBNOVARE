import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ShieldAlert } from "lucide-react";
import {
  PROFISSOES,
  acharProfissao,
  arteDe,
  fotoDe,
} from "@/lib/profissoes";
import { ACOMPANHAMENTO } from "@/lib/acompanhamento";
import { brl } from "@/lib/calculos";

/**
 * A porta de entrada por carreira.
 *
 * A primeira versão era um muro de texto — e muro de texto não converte.
 * Agora a foto da carreira carrega o peso: herói de tela cheia com a
 * pessoa que a página está chamando, e o texto reduzido ao osso. Cada
 * bloco tem uma frase, não um parágrafo.
 *
 * A foto vende na página; a arte com marca (`arteDe`) vende no
 * compartilhamento, porque no WhatsApp a imagem precisa levar logo e
 * título dentro dela.
 */

export function generateStaticParams() {
  return PROFISSOES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prof = acharProfissao(slug);
  if (!prof) return { title: "Profissão" };
  return {
    title: `Planejamento financeiro para ${prof.nome.toLowerCase()}`,
    description: prof.chamada,
    openGraph: {
      title: `Novare · ${prof.nome}`,
      description: prof.chamada,
      images: [arteDe(prof.slug)],
    },
  };
}

export default async function PaginaProfissao({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prof = acharProfissao(slug);
  if (!prof) notFound();

  const outras = PROFISSOES.filter((p) => p.slug !== prof.slug);
  const h = prof.matiz;

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* ============================================================ herói */}
      <header className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
        <Image
          src={fotoDe(prof.slug)}
          alt={`Profissional da área: ${prof.nome.toLowerCase()}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: prof.foco }}
        />
        {/* Véu na cor da carreira: sem ele, texto branco sobre foto clara
            some — e o contraste é o que faz a manchete ser lida. */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(100deg, hsl(${h} 55% 10% / 0.9) 0%, hsl(${h} 50% 13% / 0.7) 45%, hsl(${h} 45% 20% / 0.12) 100%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-5 pb-14">
          <Link
            href="/profissionais"
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Novare para {prof.nome.toLowerCase()}
          </Link>

          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] text-white sm:text-6xl">
            {prof.chamada}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75">
            {prof.abertura}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/ferramentas/raio-x-previdencia"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-6 py-4 text-sm font-bold text-accent-foreground shadow-[0_14px_34px_-14px_hsl(16_80%_45%_/_0.8)] transition-transform hover:scale-[1.02]"
            >
              <ShieldAlert className="h-4 w-4" />
              Fazer o Raio-X grátis
            </Link>
            <Link
              href="/consultoria"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Falar com a Novare
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= as dores */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <h2 className="max-w-2xl font-display text-2xl font-bold leading-tight text-primary sm:text-4xl">
          O que trava o dinheiro de quem vive dessa carreira
        </h2>

        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {prof.dores.map((d, i) => (
            <article key={d.titulo} className="flex gap-4">
              <span
                className="font-display text-2xl font-black leading-none"
                style={{ color: `hsl(${h} 45% 45%)` }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-primary">
                  {d.titulo}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
                  {d.texto}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================================================= o número (o Raio-X) */}
      <section className="relative overflow-hidden bg-primary text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(60rem 30rem at 85% -20%, hsl(${h} 70% 45% / 0.6), transparent 65%)`,
          }}
        />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 sm:grid-cols-[1fr_auto] sm:py-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent-claro">
              Comece por aqui · grátis, sem cadastro
            </p>
            <h2 className="mt-3 max-w-lg font-display text-2xl font-bold leading-tight sm:text-4xl">
              Quanto a taxa da sua previdência vai levar?
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              Duas taxas do extrato e você tem a resposta em dois minutos. É a
              conta que ninguém que ganha comissão vai te mostrar.
            </p>
            <Link
              href="/ferramentas/raio-x-previdencia"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-bold text-primary transition-transform hover:scale-[1.02]"
            >
              Fazer o Raio-X
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 text-center backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Caso comum
            </p>
            <p className="mt-3 font-display text-4xl font-black tabular-nums text-accent sm:text-5xl">
              {brl(425302.49, 0)}
            </p>
            <p className="mx-auto mt-3 max-w-[16rem] text-xs leading-relaxed text-white/60">
              é o que um plano de 2,3% ao ano de administração mais 3% de
              carregamento leva de quem tem R$ 50 mil, aporta R$ 1.000 por mês
              e rende 9% ao ano, durante 25 anos
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================== as perguntas */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold leading-tight text-primary sm:text-3xl">
              Quatro perguntas que ninguém te respondeu
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
              A primeira análise é gratuita — e a Novare não ganha comissão de
              produto nenhum, então não temos nada para te vender no lugar do
              que você já tem.
            </p>
            <Link
              href="/consultoria"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent-strong hover:underline"
            >
              Quero a análise gratuita
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="space-y-px overflow-hidden rounded-2xl border border-slate-200">
            {prof.perguntas.map((q) => (
              <li
                key={q}
                className="flex items-start gap-3 bg-slate-50/70 px-5 py-4"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  strokeWidth={3}
                  style={{ color: `hsl(${h} 50% 42%)` }}
                />
                <span className="text-[15px] leading-snug text-slate-700">
                  {q}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* =================================================== acompanhamento */}
      <section className="mx-auto max-w-5xl px-5 pb-16 sm:pb-20">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border-2 border-accent-soft bg-accent-tint p-8 sm:p-10">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent-strong">
              Depois da análise
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary">
              {ACOMPANHAMENTO.nome}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              Taxa muda, regra muda, a sua vida muda. O acompanhamento existe
              para o plano continuar de pé.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-full border border-accent-soft bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-accent-strong">
              Em desenho
            </span>
            <Link
              href="/acompanhamento"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Ver a ideia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================== outras carreiras */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Outras carreiras
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {outras.map((o) => (
            <Link
              key={o.slug}
              href={`/profissionais/${o.slug}`}
              className="group relative h-36 overflow-hidden rounded-2xl"
            >
              <Image
                src={fotoDe(o.slug)}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: o.foco }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(0deg, hsl(${o.matiz} 55% 12% / 0.92) 8%, hsl(${o.matiz} 50% 16% / 0.35) 100%)`,
                }}
              />
              <p className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-bold text-white">
                {o.nome}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-[11px] leading-relaxed text-slate-500">
          Novare Consultoria de Investimentos — consultoria sem comissão. O
          conteúdo desta página é educativo e não constitui recomendação
          personalizada de investimento. Simulações são projeções, não
          promessa de rentabilidade.
        </p>
      </section>
    </div>
  );
}
