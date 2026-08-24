import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { PROFISSOES, fotoDe } from "@/lib/profissoes";

export const metadata: Metadata = {
  title: "Planejamento financeiro por profissão",
  description:
    "Médicos, engenheiros, advogados e dentistas: cada carreira tem uma forma própria de ganhar e de perder dinheiro. A Novare atende cada uma delas, sem comissão de produto.",
};

/**
 * O índice das carreiras atendidas.
 *
 * A porta larga ("ferramentas financeiras para todos") já existe na home.
 * Esta é a porta estreita — e é ela que converte, porque quem vive de
 * plantão não se reconhece numa página escrita para "todo mundo".
 */
export default function Profissionais() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <section className="mx-auto max-w-5xl px-5 pt-16">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent-strong">
          Novare por profissão
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight text-primary sm:text-5xl">
          Sua carreira tem uma forma própria de ganhar — e de perder — dinheiro
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Quem vive de plantão não tem o mesmo problema de quem recebe por
          medição de obra, e nenhum dos dois se parece com quem espera um
          honorário de êxito. Planilha feita para salário fixo não serve para
          nenhum deles.
        </p>
      </section>

      <section className="mx-auto mt-12 grid max-w-5xl gap-6 px-5 sm:grid-cols-2">
        {PROFISSOES.map((p) => (
          <Link
            key={p.slug}
            href={`/profissionais/${p.slug}`}
            className="group overflow-hidden rounded-3xl border border-slate-200 transition-shadow hover:shadow-[0_20px_45px_-25px_hsl(215_50%_23%_/_0.6)]"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <Image
                src={fotoDe(p.slug)}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: p.foco }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(0deg, hsl(${p.matiz} 55% 12% / 0.9) 0%, hsl(${p.matiz} 50% 18% / 0.15) 70%)`,
                }}
              />
              <h2 className="absolute inset-x-0 bottom-0 px-6 pb-5 font-display text-2xl font-bold text-white">
                {p.nome}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-slate-600">
                {p.chamada}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent-strong">
                Ver a página
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto my-16 max-w-5xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-primary to-[hsl(215_55%_16%)] p-8 text-white sm:p-10">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
              Vale para todas
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold">
              Comece pelo Raio-X da sua previdência
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Duas taxas do extrato e você descobre quanto o seu plano custa
              até o resgate. É a conta que ninguém que ganha comissão vai te
              mostrar.
            </p>
          </div>
          <Link
            href="/ferramentas/raio-x-previdencia"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-3.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <ShieldAlert className="h-4 w-4" />
            Fazer o Raio-X grátis
          </Link>
        </div>
      </section>
    </div>
  );
}
