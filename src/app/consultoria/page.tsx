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
import { AssinaturaJefferson } from "@/components/AssinaturaJefferson";

export const metadata: Metadata = {
  title: "Serviços da Novare",
  description:
    "A Carteira Pontual da Novare: uma análise do que você já tem, sem comissão e sem vender produto nenhum.",
  alternates: { canonical: "/consultoria" },
};

/**
 * A vitrine dos serviços da casa — hoje, um só.
 *
 * ⚠️ ERAM CINCO ATÉ 21/09/2026, e o texto desta tela não acompanhou a
 * remoção: o hero continuou anunciando "cinco formatos" e mandando o
 * visitante "começar pelo Diagnóstico Gratuito", que tinha acabado de ser
 * apagado. Build, typecheck e os quatro guardiões passavam — nenhum deles
 * lê promessa escrita à mão. Se um serviço voltar, o texto volta com ele.
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
            Consultoria Novare
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-[-0.03em] text-primary sm:text-4xl">
            {/* Era "Soluções completas para cada momento" — e a linha de baixo
                diz que a casa tem UM serviço (varredura de 20/10/2026). */}
            Uma análise isenta do seu dinheiro, feita por gente.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Hoje a casa tem um serviço, e ele é direto ao ponto: a{" "}
            <strong className="text-foreground">Carteira Pontual</strong> olha
            o que você já tem e diz, por escrito, o que está no lugar errado —
            sem comissão e sem vender produto nenhum.
          </p>
        </section>

        {/* ------------------------------------------------------ os cartões */}
        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          {CONSULTORIAS.map((item) => (
            <Link
              key={item.slug}
              href={`/consultoria/${item.slug}`}
              className={`group overflow-hidden rounded-3xl border transition-shadow hover:shadow-[0_20px_45px_-25px_hsl(215_50%_23%_/_0.6)] ${
                item.isIsca ? "border-emerald-300/60 sm:col-span-2" : "border-slate-200"
              } ${CONSULTORIAS.length === 1 ? "sm:col-span-2" : ""}`}
            >
              {/* Com um serviço só, o cartão ocupa a linha inteira em vez de
                  deixar metade do grid vazia. */}
              <div className={`relative w-full overflow-hidden ${CONSULTORIAS.length === 1 ? "h-56 sm:h-80" : "h-56"}`}>
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-2.5 py-1 text-xs font-semibold text-emerald-950">
                      <Sparkles className="h-3.5 w-3.5" />
                      {ROTULO_PRIMEIRA_ANALISE}
                    </span>
                  )}
                  {item.coBranding && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-blue-900">
                      <Users className="h-3.5 w-3.5 text-blue-700" />
                      {item.coBranding.badge}
                    </span>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  {item.subtitulo && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                      {item.subtitulo}
                    </p>
                  )}
                  <h2 className="mt-1 font-display text-2xl font-semibold text-white">
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

        {/* ------------------------------ quem cuida — foto real do sócio */}
        {/* ─── COMO A CASA TRABALHA ───
            Três emblemas 3D com o que separa a Novare de um app: gente do
            outro lado, nenhuma comissão e o método por escrito. A vitrine
            tinha cinco cards e ia direto ao rodapé — faltava o argumento
            que faz alguém escolher consultoria em vez de software. */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              emblema: "/icones-3d/users-3d.png",
              titulo: "Gente, não robô",
              texto:
                "Um consultor da casa estuda o seu caso e conduz cada encontro pessoalmente.",
            },
            {
              emblema: "/icones-3d/goal-protecao.png",
              titulo: "Zero comissão",
              texto:
                "A Novare não recebe de banco, corretora ou seguradora. Quem paga é você.",
            },
            {
              emblema: "/icones-3d/etapa-relatorio.png",
              titulo: "Tudo por escrito",
              texto:
                "Você sai com o material na mão e os próximos passos definidos, não com uma conversa solta.",
            },
          ].map((p, i) => (
            <div
              key={p.titulo}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_12px_32px_-20px_hsl(215_40%_20%_/_0.25)] transition-all hover:-translate-y-1"
            >
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 ${i === 1 ? "bg-accent" : "bg-ciano"}`}
              />
              <span className="relative flex h-14 w-14 items-center justify-center">
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-full opacity-70 blur-lg ${i === 1 ? "bg-accent-tint" : "bg-ciano-tint"}`}
                />
                <Image
                  src={p.emblema}
                  alt=""
                  width={56}
                  height={56}
                  className="relative h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-primary">
                {p.titulo}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {p.texto}
              </p>
            </div>
          ))}
        </section>

        {/* ─── VÍDEO + ARTIGO DO BLOG (pedido do dono, 27/10/2026) ───
            O vídeo de 20 s "Quem ganha quando você investe?" e o artigo do blog
            sobre contratar consultoria contam o mesmo argumento da seção acima.
            O vídeo só baixa quando a pessoa dá o play (preload="none"). */}
        <section className="mt-10 grid items-center gap-6 rounded-3xl bg-noite p-6 text-white sm:grid-cols-[minmax(0,15rem)_1fr] sm:p-8">
          <video
            src="/consultoria/quem-ganha.mp4"
            poster="/consultoria/quem-ganha.jpg"
            controls
            playsInline
            preload="none"
            width={720}
            height={1280}
            aria-label="Vídeo: quem ganha quando você investe?"
            className="mx-auto aspect-[9/16] w-full max-w-[15rem] rounded-2xl bg-black object-cover shadow-vidro"
          />
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ciano">
                Em 20 segundos
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold leading-tight">
                Quem ganha quando você investe?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Gerente e assessor costumam ganhar comissão pelo produto que
                vendem. A consultoria independente é paga só por você, então a
                recomendação segue o seu plano, não a meta do banco.
              </p>
            </div>
            <a
              href="https://novareinvestimentos.com/consultoria-de-investimentos-em-sumare/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 transition-colors hover:bg-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://novareinvestimentos.com/wp-content/uploads/2026/10/Rotatoria-de-Sumare-ao-entardecer.webp"
                alt=""
                width={96}
                height={72}
                loading="lazy"
                className="h-[4.5rem] w-24 shrink-0 rounded-xl object-cover"
              />
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/55">
                  No blog da Novare
                </span>
                <span className="mt-0.5 block font-semibold leading-snug">
                  Consultoria de investimentos em Sumaré: como contratar?
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-ciano">
                  Ler o artigo
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:flex sm:items-center sm:gap-7 sm:p-8">
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl sm:w-64 sm:shrink-0">
            <Image
              src="/marca/jefferson/sofa.webp"
              alt="Jefferson Freitas, fundador da Novare"
              fill
              sizes="(max-width: 640px) 100vw, 256px"
              className="object-cover object-[50%_18%]"
            />
          </div>
          <div className="mt-5 space-y-2 sm:mt-0">
            <h3 className="font-display text-lg font-bold text-primary">
              Gente de verdade cuidando do seu dinheiro
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              A Novare é uma consultoria independente, sem comissão de
              corretora. Nosso fundador conduz cada atendimento pessoalmente, da
              primeira análise à devolutiva por escrito.
            </p>
            <AssinaturaJefferson tom="claro" className="pt-2" />
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
        titulo="Quer conversar antes de decidir?"
        subtitulo="Deixe seu nome e e-mail: um especialista da Novare entende o seu caso e diz se a análise faz sentido para você — grátis e sem compromisso."
        tipo="produto"
      />

      <RodapeNovare aviso="servico" />
    </div>
  );
}
