import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { CapturaLead } from "@/components/CapturaLead";
import { FormularioCupom } from "@/components/FormularioCupom";
import { RodapeNovare } from "@/components/RodapeNovare";
import {
  CAPA_PRODUTO,
  CONSULTORIAS,
  ROTULO_PRIMEIRA_ANALISE,
} from "@/lib/consultoria";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: "Produtos e Consultoria Particular",
  description:
    "Conheça os 5 produtos e formatos de consultoria da Novare, do Diagnóstico Gratuito à Consultoria de Investimentos em parceria com a Nord Research.",
};

/**
 * A vitrine dos cinco formatos de consultoria.
 *
 * Antes, cada produto vinha inteiro nesta página — descrição, entrega,
 * formato, preço e FAQ, tudo empilhado cinco vezes seguidas. A landing
 * page de verdade de cada um já existe em `/consultoria/[slug]` (foto,
 * vídeo, etapas, para-quem, perguntas frequentes) — esta tela virou
 * duplicata do texto de lá, só que sem o contexto que dá sentido a ele.
 *
 * Agora ela faz o que uma vitrine faz: mostra a foto, o nome e uma frase,
 * e manda para a página real. O mesmo padrão visual de `/profissionais`,
 * de propósito — consistência entre as duas vitrines do site.
 */
export default async function ConsultoriaPage() {
  const perfil = await getPerfil();

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <Cabecalho
        direita={
          <Link
            href={perfil ? "/" : "/login"}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {perfil ? "Voltar ao Workspace" : "Entrar"}
          </Link>
        }
      />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
        {/* ------------------------------------------------------------ hero */}
        <section className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Ecossistema Oficial de Soluções Novare
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Soluções completas para cada momento da sua vida financeira.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Cinco formatos desenhados para dar clareza, proteção e
            rentabilidade ao seu patrimônio. Comece pelo{" "}
            <strong className="text-foreground">Diagnóstico Gratuito</strong>{" "}
            ou acesse a solução ideal para os seus objetivos.
          </p>
        </section>

        {/* --------------------------------------------------- os 5 cartões */}
        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          {CONSULTORIAS.map((item) => (
            <Link
              key={item.slug}
              href={`/consultoria/${item.slug}`}
              className={`group overflow-hidden rounded-3xl border transition-shadow hover:shadow-[0_20px_45px_-25px_hsl(215_50%_23%_/_0.6)] ${
                item.isIsca ? "border-emerald-300/60 sm:col-span-2" : "border-slate-200"
              }`}
            >
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={CAPA_PRODUTO[item.slug] ?? "/banner-novare.png"}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/25 to-transparent" />

                <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-4">
                  {item.isIsca && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-2.5 py-1 text-xs font-bold text-emerald-950">
                      <Sparkles className="h-3.5 w-3.5" />
                      {ROTULO_PRIMEIRA_ANALISE}
                    </span>
                  )}
                  {item.coBranding && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-blue-900">
                      <Users className="h-3.5 w-3.5 text-blue-700" />
                      {item.coBranding.badge}
                    </span>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  {item.subtitulo && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      {item.subtitulo}
                    </p>
                  )}
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    {item.nome}
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm leading-relaxed text-slate-600">
                  {item.chamada}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent-strong">
                  Ver a página completa
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* --------------------------------------------------- cupom */}
        <div className="mt-10">
          <FormularioCupom />
        </div>

        {/* ----------------------------- quem cuida — foto real dos sócios */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:flex sm:items-center sm:gap-7 sm:p-8">
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl sm:w-64 sm:shrink-0">
            <Image
              src="/marca/novare-site/socios-novare-alta.jpg"
              alt="Sócios e consultores da Novare"
              fill
              sizes="(max-width: 640px) 100vw, 256px"
              className="object-cover"
            />
          </div>
          <div className="mt-5 space-y-2 sm:mt-0">
            <h3 className="font-display text-lg font-bold text-primary">
              Gente de verdade cuidando do seu dinheiro
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              A Novare é uma consultoria independente, sem comissão de
              corretora. Nossos sócios e consultores conduzem cada
              atendimento pessoalmente — do Diagnóstico Gratuito à
              Consultoria de Investimentos em parceria com a Nord.
            </p>
          </div>
        </section>

        {/* --------------------------------------------- banner LGPD */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center sm:text-left">
          <h3 className="font-display text-base font-bold text-slate-900">
            Segurança, Isenção e Conformidade LGPD
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Seus dados são tratados com sigilo profissional e independência
            comercial, conforme a LGPD — os detalhes estão na nossa Política
            de Privacidade.
          </p>
        </section>
      </main>

      <CapturaLead
        titulo="Não sabe por qual produto começar?"
        subtitulo="Deixe seu e-mail: um especialista da Novare olha o seu caso e indica o próximo passo — grátis, sem compromisso."
        tipo="produto"
      />

      <RodapeNovare />
    </div>
  );
}
